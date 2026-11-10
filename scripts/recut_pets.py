"""Recut pet sprites with an outline-aware mask.

Paper is only the warm, very light card. Pale fur, cheeks, and highlights stay
because they are cooler or darker than that paper. Ears stay on the body.
"""

from __future__ import annotations

import json
import shutil
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
UPLOADS = Path('/home/ubuntu/.cursor/projects/workspace/uploads')
PETS = ROOT / 'public' / 'pets'

COLS = [(176, 424), (368, 608), (540, 768)]
STATES = ['hatchling', 'well_loved', 'needs_love']
ROWS = {
	'pets-1': {
		'chick': (288, 492),
		'fox': (478, 692),
		'sprout': (668, 882),
		'mouse': (848, 1072),
	},
	'pets-2': {
		'frog': (286, 500),
		'butterfly': (476, 692),
		'bun': (666, 882),
		'cap': (848, 1080),
	},
}


def load(name: str) -> Image.Image:
	matches = list(UPLOADS.glob(f'{name}_*.jpg')) + list(UPLOADS.glob(f'{name}.jpg'))
	if not matches:
		raise SystemExit(f'missing {name}')
	return Image.open(matches[0]).convert('RGB')


def is_paper(r: int, g: int, b: int) -> bool:
	"""Warm card stock. Pale fur is darker or less blue-white than this."""
	if r < 240 or g < 220 or b < 198:
		return False
	if max(r, g, b) - min(r, g, b) > 58:
		return False
	return r > b + 16


def is_background(r: int, g: int, b: int) -> bool:
	lum = (r + g + b) / 3
	sat = max(r, g, b) - min(r, g, b)
	if sat > 80 or lum < 168:
		return False
	if g > r + 18 and g > b + 18:
		return False
	if r > g + 50 and r > 180 and g < 160:
		return False
	return True


def cut_sprite(sheet: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
	crop = sheet.crop(box).convert('RGB')
	w, h = crop.size
	pix = crop.load()
	ep = crop.convert('L').filter(ImageFilter.FIND_EDGES).load()
	seen = bytearray(w * h)
	q: deque[tuple[int, int]] = deque()

	def push(x: int, y: int, border: bool = False) -> None:
		i = y * w + x
		if seen[i]:
			return
		# The crop border itself is a fake edge. Real pet outlines still stop the flood.
		if not border and ep[x, y] > 140:
			return
		r, g, b = pix[x, y]
		if not is_background(r, g, b):
			return
		seen[i] = 1
		q.append((x, y))

	for x in range(w):
		push(x, 0, True)
		push(x, h - 1, True)
	for y in range(h):
		push(0, y, True)
		push(w - 1, y, True)
	while q:
		x, y = q.popleft()
		for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
			if 0 <= nx < w and 0 <= ny < h:
				push(nx, ny)

	vis = bytearray(w * h)
	comps: list[list[tuple[int, int]]] = []
	for y in range(h):
		for x in range(w):
			i = y * w + x
			if seen[i] or vis[i]:
				continue
			comp: list[tuple[int, int]] = []
			qq = deque([(x, y)])
			vis[i] = 1
			while qq:
				cx, cy = qq.popleft()
				comp.append((cx, cy))
				for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
					if not (0 <= nx < w and 0 <= ny < h):
						continue
					j = ny * w + nx
					if vis[j] or seen[j]:
						continue
					vis[j] = 1
					qq.append((nx, ny))
			if len(comp) > 25:
				comps.append(comp)
	if not comps:
		raise RuntimeError(f'no pet in {box}')
	comps.sort(key=len, reverse=True)
	keep = set(comps[0])
	for comp in comps[1:]:
		ys = [p[1] for p in comp]
		xs = [p[0] for p in comp]
		if min(ys) > h * 0.78:
			continue
		if max(ys) < h * 0.22 and max(xs) - min(xs) > (max(ys) - min(ys)) * 1.5:
			continue
		near = False
		for x, y in comp[::3]:
			for dx in (-3, 0, 3):
				for dy in (-3, 0, 3):
					if (x + dx, y + dy) in keep:
						near = True
						break
				if near:
					break
			if near:
				break
		if near and len(comp) < len(keep) * 0.35:
			keep.update(comp)

	out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
	op = out.load()
	for x, y in keep:
		op[x, y] = (*pix[x, y], 255)
	for _ in range(6):
		drop = []
		for y in range(h):
			for x in range(w):
				r, g, b, a = op[x, y]
				if a < 20 or not (is_paper(r, g, b) or is_background(r, g, b)):
					continue
				if any(not (0 <= nx < w and 0 <= ny < h) or op[nx, ny][3] < 20 for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))):
					drop.append((x, y))
		for x, y in drop:
			op[x, y] = (0, 0, 0, 0)
	# Name captions sit under the pet and sometimes touch the shadow.
	vis2 = bytearray(w * h)
	for y in range(h):
		for x in range(w):
			i = y * w + x
			if op[x, y][3] < 20 or vis2[i]:
				continue
			comp = []
			qq = deque([(x, y)])
			vis2[i] = 1
			while qq:
				cx, cy = qq.popleft()
				comp.append((cx, cy))
				for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
					if not (0 <= nx < w and 0 <= ny < h):
						continue
					j = ny * w + nx
					if vis2[j] or op[nx, ny][3] < 20:
						continue
					vis2[j] = 1
					qq.append((nx, ny))
			ys = [p[1] for p in comp]
			if min(ys) > h * 0.8 and len(comp) < w * h * 0.08:
				for cx, cy in comp:
					op[cx, cy] = (0, 0, 0, 0)
	# A caption under the pet is a second island, separated by empty rows.
	counts = [sum(1 for x in range(w) if op[x, y][3] > 20) for y in range(h)]
	y = h - 1
	while y > 0 and counts[y] < 12:
		y -= 1
	island_bottom = y
	while y > 0 and counts[y] >= 12:
		y -= 1
	island_top = y + 1
	gap = 0
	while y > 0 and counts[y] < 12:
		gap += 1
		y -= 1
	if gap >= 3 and island_top > h * 0.62 and counts[y] > 8:
		for cy in range(island_top, h):
			for x in range(w):
				op[x, cy] = (0, 0, 0, 0)
	# Card stock left in a gap (the sprout's stem) is still paper, even inside the silhouette.
	for y in range(h):
		for x in range(w):
			r, g, b, a = op[x, y]
			if a > 20 and is_paper(r, g, b):
				op[x, y] = (0, 0, 0, 0)
	bbox = out.getbbox()
	if not bbox:
		raise RuntimeError(f'empty {box}')
	pad = 8
	x0, y0, x1, y1 = bbox
	return out.crop((max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad)))


def upscale(im: Image.Image, min_side: int = 520) -> Image.Image:
	w, h = im.size
	scale = max(min_side / max(1, min(w, h)), 2)
	return im.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)


def eye_pair(body: Image.Image):
	w, h = body.size
	pix = body.load()
	seen = bytearray(w * h)
	blobs = []
	for y in range(int(h * 0.12), int(h * 0.78)):
		for x in range(int(w * 0.06), int(w * 0.94)):
			i = y * w + x
			if seen[i]:
				continue
			r, g, b, a = pix[x, y]
			if a < 200 or (r + g + b) / 3 > 55:
				continue
			comp = []
			qq = deque([(x, y)])
			seen[i] = 1
			while qq:
				cx, cy = qq.popleft()
				comp.append((cx, cy))
				for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
					if not (0 <= nx < w and 0 <= ny < h):
						continue
					j = ny * w + nx
					if seen[j]:
						continue
					rr, gg, bb, aa = pix[nx, ny]
					if aa < 200 or (rr + gg + bb) / 3 > 68:
						continue
					seen[j] = 1
					qq.append((nx, ny))
			if len(comp) < 50:
				continue
			xs = [p[0] for p in comp]
			ys = [p[1] for p in comp]
			bw, bh = max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
			if bw > w * 0.4 or bh > h * 0.32 or bw < 8 or bh < 8:
				continue
			if not 0.4 <= bw / bh <= 2.2:
				continue
			blobs.append((comp, sum(xs) / len(comp), sum(ys) / len(comp), len(comp)))
	sx = sy = n = 0
	for y in range(h):
		for x in range(w):
			if pix[x, y][3] > 40:
				sx += x
				sy += y
				n += 1
	cx0, cy0 = (sx / n, sy / n) if n else (w / 2, h / 2)
	best = None
	for i in range(len(blobs)):
		for j in range(i + 1, len(blobs)):
			a, b = blobs[i], blobs[j]
			if abs(a[2] - b[2]) > h * 0.1:
				continue
			ratio = max(a[3], b[3]) / max(1, min(a[3], b[3]))
			if ratio > 2.1:
				continue
			gap = abs(a[1] - b[1])
			if gap < w * 0.07 or gap > w * 0.55:
				continue
			mid_y = (a[2] + b[2]) / 2
			if mid_y > cy0 + h * 0.12:
				continue
			score = min(a[3], b[3]) - abs((a[1] + b[1]) / 2 - cx0) * 1.1 - abs(a[2] - b[2]) * 4
			if best is None or score > best[0]:
				best = (score, a, b)
	return best


def closed_eyes(body: Image.Image, pair) -> Image.Image:
	w, h = body.size
	pix = body.load()
	a, b = pair[1], pair[2]
	eye_set = set(a[0]) | set(b[0])
	out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
	draw = ImageDraw.Draw(out)
	for blob in (a[0], b[0]):
		xs = [p[0] for p in blob]
		ys = [p[1] for p in blob]
		x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
		pad = max(4, int(max(x1 - x0, y1 - y0) * 0.65))
		samples = []
		for y in range(max(0, y0 - pad), min(h, y1 + pad + 1)):
			for x in range(max(0, x0 - pad), min(w, x1 + pad + 1)):
				if (x, y) in eye_set:
					continue
				r, g, b, a_ = pix[x, y]
				if a_ > 220 and (r + g + b) / 3 > 90:
					samples.append((r, g, b))
		samples.sort(key=lambda c: sum(c))
		color = samples[len(samples) // 2] if samples else (236, 214, 180)
		ex = max(3, int((x1 - x0) * 0.34) + 2)
		ey = max(3, int((y1 - y0) * 0.4) + 2)
		draw.ellipse([x0 - ex, y0 - ey, x1 + ex, y1 + ey], fill=color + (255,))
		lid = tuple(max(0, c - 72) for c in color) + (255,)
		cy = (y0 + y1) / 2
		draw.arc(
			[x0 - ex, cy - (y1 - y0) * 0.72, x1 + ex, cy + (y1 - y0) * 0.9],
			205, 335,
			fill=lid,
			width=max(2, int((y1 - y0) * 0.28)),
		)
	return out


def part_mask(sprite: Image.Image, species: str) -> tuple[str, set[tuple[int, int]]] | None:
	w, h = sprite.size
	pix = sprite.load()
	found: set[tuple[int, int]] = set()
	name = None
	if species == 'butterfly':
		name = 'wings'
		for y in range(h):
			for x in range(w):
				r, g, b, a = pix[x, y]
				if a > 80 and r > 170 and 50 < g < 190 and b < 95 and (x < w * 0.4 or x > w * 0.6):
					found.add((x, y))
		if len(found) < w * h * 0.06:
			return None
	elif species == 'sprout':
		name = 'leaves'
		for y in range(h):
			for x in range(w):
				r, g, b, a = pix[x, y]
				if a > 80 and g > 80 and g > r + 15 and g > b + 15 and max(r, g, b) - min(r, g, b) > 28:
					found.add((x, y))
		if len(found) < 80:
			return None
	else:
		return None
	return name, found


def layer_from(src: Image.Image, pixels: set[tuple[int, int]]) -> Image.Image:
	out = Image.new('RGBA', src.size, (0, 0, 0, 0))
	sp = src.load()
	op = out.load()
	for x, y in pixels:
		r, g, b, a = sp[x, y]
		if a > 20:
			op[x, y] = (r, g, b, a)
	return out


def manifest_layers(species: str, state: str, extra: dict[str, Image.Image], layered: bool, note: str, size: tuple[int, int]) -> dict:
	order = {'wings': 0, 'leaves': 2, 'body': 3, 'eyes': 5, 'eyes-closed': 6}
	animate = {'body': 'bob', 'eyes': 'blink', 'eyes-closed': 'blink', 'wings': 'flap', 'leaves': 'wiggle'}
	anchor = {'body': [0.5, 0.86], 'eyes': [0.5, 0.5], 'eyes-closed': [0.5, 0.5], 'wings': [0.5, 0.55], 'leaves': [0.5, 0.42]}
	layers = [{
		'id': 'body',
		'file': f'/pets/{species}/{state}/body.png',
		'z': 3,
		'anchor': anchor['body'],
		'offset': [0, 0],
		'animate': 'bob',
		'separated': True,
	}]
	for name in extra:
		lid = 'eyesClosed' if name == 'eyes-closed' else name
		layers.append({
			'id': lid,
			'file': f'/pets/{species}/{state}/{name}.png',
			'z': order.get(name, 4),
			'anchor': anchor.get(name, [0.5, 0.5]),
			'offset': [0, 0],
			'animate': animate.get(name, 'wiggle'),
			'separated': name != 'eyes',
		})
	layers.sort(key=lambda layer: layer['z'])
	return {
		'layered': layered,
		'approximated': 'well-loved pose' in note,
		'note': note,
		'width': size[0],
		'height': size[1],
		'layers': layers,
	}


def save_state(species: str, state: str, sprite: Image.Image, note: str) -> dict:
	folder = PETS / species / state
	if folder.exists():
		shutil.rmtree(folder)
	folder.mkdir(parents=True)
	body = sprite.copy()
	extra: dict[str, Image.Image] = {}
	pair = eye_pair(sprite)
	if pair:
		eyes = Image.new('RGBA', sprite.size, (0, 0, 0, 0))
		ep = eyes.load()
		sp = sprite.load()
		for blob in (pair[1][0], pair[2][0]):
			for x, y in blob:
				ep[x, y] = sp[x, y]
		extra['eyes'] = eyes
		extra['eyes-closed'] = closed_eyes(sprite, pair)
	part = part_mask(sprite, species)
	layered = bool(pair) or bool(part)
	if part:
		name, pixels = part
		extra[name] = layer_from(sprite, pixels)
		bp = body.load()
		for x, y in pixels:
			bp[x, y] = (0, 0, 0, 0)
	body.save(folder / 'body.png')
	for name, im in extra.items():
		im.save(folder / f'{name}.png')
	return manifest_layers(species, state, extra, layered and len(extra) > 0, note, body.size)


def main() -> None:
	manifest: dict = {'sprites': {}, 'notes': ['Ears stay painted on the body. Closed eyes are a derived lid.']}
	sheets = {'pets-1': load('pets-1'), 'pets-2': load('pets-2')}
	for sheet_name, rows in ROWS.items():
		sheet = sheets[sheet_name]
		for species, (y0, y1) in rows.items():
			manifest['sprites'][species] = {}
			for index, state in enumerate(STATES):
				x0, x1 = COLS[index]
				sprite = upscale(cut_sprite(sheet, (x0, y0, x1, y1)))
				note = ''
				manifest['sprites'][species][state] = save_state(species, state, sprite, note)
			loved = PETS / species / 'well_loved'
			cared = PETS / species / 'cared_for'
			if cared.exists():
				shutil.rmtree(cared)
			shutil.copytree(loved, cared)
			entry = json.loads(json.dumps(manifest['sprites'][species]['well_loved']))
			entry['approximated'] = True
			entry['note'] = 'No cared-for drawing on the sheet. This is the well-loved pose.'
			for layer in entry['layers']:
				layer['file'] = layer['file'].replace('/well_loved/', '/cared_for/')
			manifest['sprites'][species]['cared_for'] = entry
			print(species, 'ok', sprite.size)

	# The welcome egg is a closed shell. The crack would let a flood fill eat it,
	# so this keeps the previous whole-egg cut.
	egg_path = PETS / 'egg' / 'egg' / 'body.png'
	if egg_path.exists():
		egg = Image.open(egg_path)
	else:
		egg = upscale(cut_sprite(load('welcome'), (200, 400, 540, 820)))
		egg_path.parent.mkdir(parents=True, exist_ok=True)
		egg.save(egg_path)
	manifest['sprites']['egg'] = {
		'egg': {
			'layered': False,
			'approximated': False,
			'note': 'Whole egg from welcome.jpg. No separate crack frame.',
			'width': egg.width,
			'height': egg.height,
			'layers': [{
				'id': 'body',
				'file': '/pets/egg/egg/body.png',
				'z': 1,
				'anchor': [0.5, 0.9],
				'offset': [0, 0],
				'animate': 'bob',
				'separated': True,
			}],
		}
	}
	(ROOT / 'lib' / 'pets' / 'manifest.json').write_text(json.dumps(manifest, indent=2))
	print('manifest written')


if __name__ == '__main__':
	main()
