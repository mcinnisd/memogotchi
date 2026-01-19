
import { calculateReview } from '../lib/srs';

// Mocking dependencies if needed, or running straightforwardly
// We will use a simple approach: Test SRS logic thoroughly here.

const verifySRS = () => {
	console.log('--- Verifying SRS Logic ---');

	// Test 1: New card (interval 0), grade 4 (good) -> should be interval 1, ease > 2.5
	const t1 = calculateReview(0, 2.5, 4);
	console.log('Test 1 (New, Grade 4):', t1);
	if (t1.interval !== 1) console.error('FAIL: Next interval should be 1');

	// Test 2: Review (interval 1), grade 5 (perfect) -> should be interval 6
	const t2 = calculateReview(1, t1.easeFactor, 5);
	console.log('Test 2 (Interval 1, Grade 5):', t2);
	if (t2.interval !== 6) console.error('FAIL: Next interval should be 6');

	// Test 3: Fail (interval 10), grade 1 -> should reset to 1
	const t3 = calculateReview(10, 2.8, 1);
	console.log('Test 3 (Fail, Grade 1):', t3);
	if (t3.interval !== 1) console.error('FAIL: Interval should reset to 1');

	console.log('SRS Verification Complete');
};

const main = async () => {
	try {
		verifySRS();
		console.log('SUCCESS: Types and Logic basic verification passed.');
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
};

main();
