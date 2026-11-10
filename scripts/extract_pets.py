"""Cut pet sprites and scene props out of the locked mock sheets.

Reads the character sheets and the home/welcome screens, knocks out the paper,
and writes one PNG per layer under public/pets and public/props.

The committed eyes-closed lids were redrawn after this script so the lid
covers the open eye. Re-running replaces those files with this script's
version. Ears are exported but not punched out of the body.
"""

from __future__ import annotations

import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
UPLOADS = Path('/home/ubuntu/.cursor/projects/workspace/uploads')
PETS = ROOT / 'public' / 'pets'
PROPS = ROOT / 'public' / 'props'

COLS = [(196, 398), (390, 572), (552, 758)]
STATES = ['hatchling', 'well_loved', 'needs_love']
ROWS_1 = {
	'chick': (312, 452),
	'fox': (500, 652),
	'sprout': (698, 848),
	'mouse': (888, 1038),
}
ROWS_2 = {
	'frog': (318, 468),
	'butterfly': (508, 662),
	'bun': (698, 852),
	'cap': (888, 1048),
}


def load(name: str) -> Image.Image:
	matches = list(UPLOADS.glob(f'{name}_*.jpg')) + list(UPLOADS.glob(f'{name}.jpg'))
	if not matches:
		raise SystemExit(f'missing {name}')
	return Image.open(matches[0]).convert('RGBA')


def is_paper(r: int, g: int, b: int, a: int) -> bool:
	if a < 16:
		return True
	lum = (r + g + b) / 3
	sat = max(r, g, b) - min(r, g, b)
	return lum > 176 and sat < 48 and r + 12 >= g and g + 18 >= b


def knock_out(im: Image.Image) -> Image.Image:
	im = im.convert('RGBA')
	w, h = im.size
	pix = im.load()
	seen = bytearray(w * h)
	q: deque[tuple[int, int]] = deque()

	def push(x: int, y: int) -> None:
		i = y * w + x
		if seen[i]:
			return
		r, g, b, a = pix[x, y]
		if not is_paper(r, g, b, a):
			return
		seen[i] = 1
		q.append((x, y))

	for x in range(w):
		push(x, 0)
		push(x, h - 1)
	for y in range(h):
		push(0, y)
		push(w - 1, y)
	while q:
		x, y = q.popleft()
		pix[x, y] = (0, 0, 0, 0)
		for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
			if 0 <= nx < w and 0 <= ny < h:
				push(nx, ny)
	# Eat a 1px paper fringe so grid lines don't halo.
	for y in range(h):
		for x in range(w):
			r, g, b, a = pix[x, y]
			if a < 200 or not is_paper(r, g, b, a):
				continue
			for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
				if 0 <= nx < w and 0 <= ny < h and pix[nx, ny][3] == 0:
					pix[x, y] = (0, 0, 0, 0)
					break
	return im


def components(im: Image.Image) -> list[list[tuple[int, int]]]:
	w, h = im.size
	pix = im.load()
	seen = bytearray(w * h)
	out = []
	for y in range(h):
		for x in range(w):
			i = y * w + x
			if seen[i] or pix[x, y][3] < 40:
				continue
			q = deque([(x, y)])
			seen[i] = 1
			comp = []
			while q:
				cx, cy = q.popleft()
				comp.append((cx, cy))
				for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
					if not (0 <= nx < w and 0 <= ny < h):
						continue
					j = ny * w + nx
					if seen[j] or pix[nx, ny][3] < 40:
						continue
					seen[j] = 1
					q.append((nx, ny))
			out.append(comp)
	out.sort(key=len, reverse=True)
	return out


def keep_pet(im: Image.Image) -> Image.Image:
	comps = components(im)
	if not comps:
		return im
	keep = set(comps[0])
	largest = len(comps[0])
	# Drop labels and tape. Keep only blobs that touch the main body.
	body = set(comps[0])
	for comp in comps[1:]:
		if len(comp) < largest * 0.04:
			continue
		touch = False
		for x, y in comp:
			for nx, ny in ((x - 2, y), (x + 2, y), (x, y - 2), (x, y + 2)):
				if (nx, ny) in body:
					touch = True
					break
			if touch:
				break
		if touch:
			keep.update(comp)
	pix = im.load()
	w, h = im.size
	for y in range(h):
		for x in range(w):
			if (x, y) not in keep:
				pix[x, y] = (0, 0, 0, 0)
	return im


def remove_tape(im: Image.Image) -> Image.Image:
	"""Drop washi rectangles that sit above the pet."""
	pix = im.load()
	w, h = im.size
	for comp in components(im)[1:]:
		xs = [p[0] for p in comp]
		ys = [p[1] for p in comp]
		if max(ys) < h * 0.28 and (max(xs) - min(xs)) > (max(ys) - min(ys)) * 1.6:
			for x, y in comp:
				pix[x, y] = (0, 0, 0, 0)
	# Flat tan pixels in the top band, even if a paper thread joins them to the pet.
	band = int(h * 0.16)
	for y in range(band):
		for x in range(w):
			r, g, b, a = pix[x, y]
			if a < 20:
				continue
			lum = (r + g + b) / 3
			sat = max(r, g, b) - min(r, g, b)
			if lum > 150 and sat < 62:
				pix[x, y] = (0, 0, 0, 0)
	return im


def trim(im: Image.Image, pad: int = 8) -> Image.Image:
	bbox = im.getbbox()
	if not bbox:
		return im
	x0, y0, x1, y1 = bbox
	x0 = max(0, x0 - pad)
	y0 = max(0, y0 - pad)
	x1 = min(im.width, x1 + pad)
	y1 = min(im.height, y1 + pad)
	return im.crop((x0, y0, x1, y1))


def upscale(im: Image.Image, min_side: int = 520) -> Image.Image:
	w, h = im.size
	scale = max(2, min_side / max(w, h))
	if scale <= 1.05:
		return im
	return im.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)


def dark_blobs(im: Image.Image) -> list[list[tuple[int, int]]]:
	"""Compact dark spots that are not the outer pencil line."""
	w, h = im.size
	pix = im.load()
	alpha = [[pix[x, y][3] > 40 for x in range(w)] for y in range(h)]
	# Distance to transparency, so the outline (near the edge) is ignored.
	dist = [[0] * w for _ in range(h)]
	q: deque[tuple[int, int]] = deque()
	for y in range(h):
		for x in range(w):
			if not alpha[y][x]:
				dist[y][x] = 0
				q.append((x, y))
			else:
				dist[y][x] = 999
	while q:
		x, y = q.popleft()
		for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
			if 0 <= nx < w and 0 <= ny < h and dist[ny][nx] > dist[y][x] + 1:
				dist[ny][nx] = dist[y][x] + 1
				q.append((nx, ny))
	seen = bytearray(w * h)
	blobs = []
	for y in range(h):
		for x in range(w):
			i = y * w + x
			if seen[i] or not alpha[y][x] or dist[y][x] < 4:
				continue
			r, g, b, a = pix[x, y]
			lum = (r + g + b) / 3
			if lum > 95 or a < 80:
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
					if seen[j] or not alpha[ny][nx] or dist[ny][nx] < 4:
						continue
					rr, gg, bb, aa = pix[nx, ny]
					if (rr + gg + bb) / 3 > 110:
						continue
					seen[j] = 1
					qq.append((nx, ny))
			if 12 <= len(comp) <= 900:
				xs = [p[0] for p in comp]
				ys = [p[1] for p in comp]
				bw = max(xs) - min(xs) + 1
				bh = max(ys) - min(ys) + 1
				if bw < w * 0.28 and bh < h * 0.28 and len(comp) / (bw * bh) > 0.35:
					blobs.append(comp)
	# Prefer a matching pair in the upper two thirds.
	blobs.sort(key=len, reverse=True)
	return blobs[:6]


def pick_eyes(blobs: list[list[tuple[int, int]]], w: int, h: int) -> list[list[tuple[int, int]]]:
	cands = []
	for blob in blobs:
		cx = sum(p[0] for p in blob) / len(blob)
		cy = sum(p[1] for p in blob) / len(blob)
		if cy > h * 0.72 or cy < h * 0.12:
			continue
		if cx < w * 0.12 or cx > w * 0.88:
			continue
		cands.append((blob, cx, cy, len(blob)))
	if len(cands) < 2:
		return []
	# Two blobs of similar size, similar height, left and right of center.
	best = None
	for i in range(len(cands)):
		for j in range(i + 1, len(cands)):
			a, b = cands[i], cands[j]
			if abs(a[2] - b[2]) > h * 0.12:
				continue
			if max(a[3], b[3]) / max(1, min(a[3], b[3])) > 2.4:
				continue
			if (a[1] - w / 2) * (b[1] - w / 2) >= 0:
				continue
			score = -abs(a[2] - b[2]) - abs(a[3] - b[3])
			if best is None or score > best[0]:
				best = (score, a[0], b[0])
	return [best[1], best[2]] if best else []


def fill_eyes(body: Image.Image, eyes: list[list[tuple[int, int]]]) -> None:
	pix = body.load()
	w, h = body.size
	eye_set = {p for blob in eyes for p in blob}
	for blob in eyes:
		ring = []
		for x, y in blob:
			for radius in range(3, 9):
				for nx, ny in ((x - radius, y), (x + radius, y), (x, y - radius), (x, y + radius)):
					if not (0 <= nx < w and 0 <= ny < h):
						continue
					if (nx, ny) in eye_set:
						continue
					r, g, b, a = pix[nx, ny]
					if a > 200 and (r + g + b) / 3 > 120:
						ring.append((r, g, b))
		if not ring:
			color = (236, 214, 180)
		else:
			ring.sort(key=lambda c: c[0] + c[1] + c[2])
			color = ring[len(ring) // 2]
		for x, y in blob:
			pix[x, y] = (*color, 255)


def layer_from_mask(src: Image.Image, pixels: set[tuple[int, int]], dilate: int = 1) -> Image.Image:
	w, h = src.size
	mask = set(pixels)
	if dilate:
		grown = set(mask)
		for x, y in list(mask):
			for ny in range(y - dilate, y + dilate + 1):
				for nx in range(x - dilate, x + dilate + 1):
					if 0 <= nx < w and 0 <= ny < h:
						grown.add((nx, ny))
		mask = grown
	out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
	sp = src.load()
	op = out.load()
	for x, y in mask:
		r, g, b, a = sp[x, y]
		if a > 20:
			op[x, y] = (r, g, b, a)
	return out


def closed_eyes(sprite: Image.Image, eyes: list[list[tuple[int, int]]]) -> Image.Image:
	"""A derived lid: fur-colored patch over the open eye, plus a darker arc."""
	im = Image.new('RGBA', sprite.size, (0, 0, 0, 0))
	draw = ImageDraw.Draw(im)
	pix = sprite.load()
	w, h = sprite.size
	eye_set = {p for blob in eyes for p in blob}
	for blob in eyes:
		xs = [p[0] for p in blob]
		ys = [p[1] for p in blob]
		x0, x1 = min(xs), max(xs)
		y0, y1 = min(ys), max(ys)
		samples = []
		pad = max(3, int(max(x1 - x0, y1 - y0) * 0.6))
		for y in range(max(0, y0 - pad), min(h, y1 + pad + 1)):
			for x in range(max(0, x0 - pad), min(w, x1 + pad + 1)):
				if (x, y) in eye_set:
					continue
				r, g, b, a = pix[x, y]
				if a > 220 and (r + g + b) / 3 > 90:
					samples.append((r, g, b))
		if samples:
			samples.sort(key=lambda c: c[0] + c[1] + c[2])
			color = samples[len(samples) // 2]
		else:
			color = (232, 214, 186)
		ex = max(2, int((x1 - x0) * 0.3) + 2)
		ey = max(2, int((y1 - y0) * 0.38) + 2)
		draw.ellipse([x0 - ex, y0 - ey, x1 + ex, y1 + ey], fill=color + (255,))
		lid = tuple(max(0, c - 78) for c in color) + (255,)
		cy = (y0 + y1) / 2
		draw.arc(
			[x0 - ex, cy - (y1 - y0) * 0.7, x1 + ex, cy + (y1 - y0) * 0.85],
			200, 340,
			fill=lid,
			width=max(2, int((y1 - y0) * 0.26)),
		)
	return im


def hue_mask(im: Image.Image, pred) -> set[tuple[int, int]]:
	pix = im.load()
	found = set()
	for y in range(im.height):
		for x in range(im.width):
			r, g, b, a = pix[x, y]
			if a > 80 and pred(r, g, b, x, y, im.width, im.height):
				found.add((x, y))
	return found


def punch(body: Image.Image, pixels: set[tuple[int, int]]) -> None:
	pix = body.load()
	w, h = body.size
	for x, y in pixels:
		ring = []
		for radius in (4, 6, 8):
			for nx, ny in ((x - radius, y), (x + radius, y), (x, y - radius), (x, y + radius)):
				if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in pixels:
					r, g, b, a = pix[nx, ny]
					if a > 180:
						ring.append((r, g, b))
		if not ring:
			continue
		ring.sort(key=lambda c: sum(c))
		color = ring[len(ring) // 2]
		pix[x, y] = (*color, 255)


def extract_sprite(sheet: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
	crop = sheet.crop(box)
	return upscale(trim(remove_tape(keep_pet(knock_out(crop)))))


def build_layers(sprite: Image.Image, species: str) -> tuple[Image.Image, dict[str, Image.Image], bool]:
	"""Return body (holes filled), extra layers on the same canvas, and whether it layered."""
	w, h = sprite.size
	extra: dict[str, Image.Image] = {}
	layered = False
	eyes = pick_eyes(dark_blobs(sprite), w, h)
	# The body keeps the original drawing. Eye and part files are separate
	# layers a renderer can move. Open eyes stay in the body so nothing is inpainted.
	body = sprite.copy()
	if len(eyes) == 2:
		extra['eyes'] = layer_from_mask(sprite, {p for blob in eyes for p in blob}, dilate=1)
		extra['eyes-closed'] = closed_eyes(sprite, eyes)
		layered = True

	part_pixels: set[tuple[int, int]] = set()
	part_name = None
	if species == 'butterfly':
		part_name = 'wings'
		part_pixels = hue_mask(
			sprite,
			lambda r, g, b, x, y, w, h: r > 170 and 60 < g < 190 and b < 90 and (x < w * 0.38 or x > w * 0.62),
		)
	elif species == 'sprout':
		part_name = 'leaves'
		part_pixels = hue_mask(
			sprite,
			lambda r, g, b, x, y, w, h: y < h * 0.46 and g > 70 and b < min(r, g) - 20 and max(r, g, b) - min(r, g, b) > 30,
		)
	elif species == 'cap':
		part_name = 'cap'
		part_pixels = hue_mask(
			sprite,
			lambda r, g, b, x, y, w, h: r > 160 and r > g + 40 and r > b + 40 and y < h * 0.62,
		)
	elif species in ('fox', 'mouse', 'bun'):
		part_name = 'ears'
		# Tips only. They stay painted on the body: punching them left a seam
		# across the skull, so the composer does not draw this layer.
		part_pixels = hue_mask(
			sprite,
			lambda r, g, b, x, y, w, h: y < h * 0.22 and (x < w * 0.38 or x > w * 0.62),
		)
	if part_name == 'wings' and len(part_pixels) < sprite.width * sprite.height * 0.08:
		part_pixels = set()
	if part_name == 'cap':
		# The red cap shares an edge with the stem. Cutting it leaves a bite.
		part_pixels = set()
		part_name = None
	if part_name == 'ears' and len(part_pixels) > 120:
		extra['ears'] = layer_from_mask(sprite, part_pixels, dilate=1)
		part_pixels = set()
		part_name = None
	if part_name and len(part_pixels) > 120:
		if part_name == 'wings':
			grown = set(part_pixels)
			pix = sprite.load()
			for x, y in list(part_pixels):
				for ny in range(y - 3, y + 4):
					for nx in range(x - 3, x + 4):
						if not (0 <= nx < w and 0 <= ny < h):
							continue
						if abs(nx - w / 2) < w * 0.18:
							continue
						rr, gg, bb, aa = pix[nx, ny]
						if aa > 40 and (rr + gg + bb) / 3 < 90:
							grown.add((nx, ny))
			part_pixels = grown
		extra[part_name] = layer_from_mask(sprite, part_pixels, dilate=1)
		bp = body.load()
		for x, y in part_pixels:
			bp[x, y] = (0, 0, 0, 0)
		layered = True
	return body, extra, layered


def save_pair(body: Image.Image, extra: dict[str, Image.Image], folder: Path) -> None:
	folder.mkdir(parents=True, exist_ok=True)
	body.save(folder / 'body.png')
	for name, im in extra.items():
		im.save(folder / f'{name}.png')


def manifest_entry(folder: Path, extra: dict[str, Image.Image], layered: bool, approximated: bool, note: str) -> dict:
	order = {'wings': 0, 'leaves': 2, 'ears': 2, 'cap': 4, 'body': 3, 'eyes': 5, 'eyes-closed': 6}
	animate = {
		'body': 'bob',
		'eyes': 'blink',
		'eyes-closed': 'blink',
		'wings': 'flap',
		'leaves': 'wiggle',
		'ears': 'wiggle',
		'cap': 'wiggle',
	}
	anchor = {
		'body': [0.5, 0.86],
		'eyes': [0.5, 0.5],
		'eyes-closed': [0.5, 0.5],
		'wings': [0.5, 0.55],
		'leaves': [0.5, 0.72],
		'ears': [0.5, 0.7],
		'cap': [0.5, 0.78],
	}
	layers = [{
		'id': 'body',
		'file': f'/pets/{folder.parent.name}/{folder.name}/body.png',
		'z': order['body'],
		'anchor': anchor['body'],
		'offset': [0, 0],
		'animate': 'bob',
	}]
	for name in extra:
		layers.append({
			'id': 'eyesClosed' if name == 'eyes-closed' else name,
			'file': f'/pets/{folder.parent.name}/{folder.name}/{name}.png',
			'z': order.get(name, 4),
			'anchor': anchor.get(name, [0.5, 0.5]),
			'offset': [0, 0],
			'animate': animate.get(name, 'wiggle'),
		})
	layers.sort(key=lambda layer: layer['z'])
	for layer in layers:
		# Open eyes stay painted on the body. eyesClosed is an overlay for blinks.
		# Wings and leaves are cut out of the body. Ears are a reference only.
		layer['separated'] = layer['id'] not in ('eyes', 'ears')
	return {
		'layered': layered and len(layers) > 1,
		'approximated': approximated,
		'note': note,
		'width': Image.open(folder / 'body.png').width,
		'height': Image.open(folder / 'body.png').height,
		'layers': layers,
	}


def main() -> None:
	sheet1 = load('pets-1')
	sheet2 = load('pets-2')
	manifest: dict = {'sprites': {}, 'notes': []}
	qa = []
	for species, rows, sheet in (
		*[(s, ROWS_1, sheet1) for s in ROWS_1],
		*[(s, ROWS_2, sheet2) for s in ROWS_2],
	):
		manifest['sprites'][species] = {}
		y0, y1 = rows[species]
		for state, (x0, x1) in zip(STATES, COLS):
			sprite = extract_sprite(sheet, (x0, y0, x1, y1))
			body, extra, layered = build_layers(sprite, species)
			folder = PETS / species / state
			save_pair(body, extra, folder)
			note = ''
			approximated = False
			manifest['sprites'][species][state] = manifest_entry(folder, extra, layered, approximated, note)
			qa.append((f'{species}/{state}', sprite))
			if state == 'well_loved':
				# The sheets have no separate cared-for drawing.
				cared = PETS / species / 'cared_for'
				save_pair(body, extra, cared)
				entry = manifest_entry(cared, extra, layered, True, 'Reused the well-loved drawing. The sheet has no cared-for pose.')
				manifest['sprites'][species]['cared_for'] = entry
	# Egg from the welcome mock.
	welcome = load('welcome')
	egg = extract_sprite(welcome, (230, 430, 500, 780))
	egg_dir = PETS / 'egg' / 'egg'
	egg_dir.mkdir(parents=True, exist_ok=True)
	egg.save(egg_dir / 'body.png')
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
			}],
		}
	}
	extract_props(load('home'), sheet1)
	(ROOT / 'lib' / 'pets').mkdir(parents=True, exist_ok=True)
	(ROOT / 'lib' / 'pets' / 'manifest.json').write_text(json.dumps(manifest, indent=2))
	# Contact of raw cutouts.
	cell = 140
	sheet = Image.new('RGBA', (3 * cell, 8 * cell), (244, 232, 214, 255))
	for i, (label, im) in enumerate(qa):
		thumb = im.copy()
		thumb.thumbnail((cell - 8, cell - 24))
		sheet.alpha_composite(thumb, ( (i % 3) * cell + 4, (i // 3) * cell + 18))
	sheet.convert('RGB').save('/tmp/pets-raw.png')
	print('wrote', len(qa), 'sprites')


def is_plant_pixel(r: int, g: int, b: int) -> bool:
	# Leaf, stem, terracotta (including the shaded pot), or soil.
	if g > 75 and g + 18 >= r and g > b + 12 and g > 70:
		return True
	if r > 105 and r > g + 8 and r > b + 18 and g > 35 and b < 160:
		return True
	if r < 95 and g < 75 and b < 60 and r + 8 >= g:
		return True
	return False


def extract_props(home: Image.Image, sheet: Image.Image) -> None:
	PROPS.mkdir(parents=True, exist_ok=True)
	# Glass only, above the chick, inside the frame.
	window = home.crop((368, 214, 652, 400)).convert('RGB')
	window.save(PROPS / 'window.png')
	plant = home.crop((48, 200, 285, 620)).convert('RGBA')
	pp = plant.load()
	w, h = plant.size
	for y in range(h):
		for x in range(w):
			r, g, b, _a = pp[x, y]
			if not is_plant_pixel(r, g, b):
				pp[x, y] = (0, 0, 0, 0)
	plant = trim(upscale(plant, 720), 2)
	plant.save(PROPS / 'plant.png')
	# A clean run of the wooden board, tiled in the scene.
	sill = home.crop((560, 582, 700, 632)).convert('RGB')
	sill.save(PROPS / 'sill.png')
	# Paper grain from a clean corner of the welcome wall, via home's outer margin.
	grain = home.crop((8, 8, 70, 90)).convert('RGB')
	grain = grain.resize((128, 160), Image.Resampling.LANCZOS)
	grain.save(PROPS / 'paper-grain.png')
	# A few washi strips from the sheet tape.
	for i, box in enumerate(((430, 292, 530, 332), (250, 292, 340, 330), (620, 292, 720, 332))):
		tape = sheet.crop(box).convert('RGBA')
		tape = upscale(tape, 180)
		tape.save(PROPS / f'washi-{i}.png')
	# Grid lines are drawn in CSS. A crop of the sheet picked up the word "Frog".


if __name__ == '__main__':
	main()
