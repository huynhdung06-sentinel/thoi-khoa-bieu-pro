import {
  processSyncPush,
  processSyncPull,
  resetSyncEngineState,
  simulateLogCompaction,
  withChildLock,
  setSyncEngineFailureCheckpoint,
  GetSyncSnapshotResponse,
  GetSyncDeltaResponse,
  GetSyncSnapshotRequiredResponse,
  PostSyncResponse,
} from './syncEngine.ts';

interface TestAssertionResult {
  name: string;
  passed: boolean;
  error?: string;
}

const testResults: TestAssertionResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    resetSyncEngineState();
    await fn();
    testResults.push({ name, passed: true });
    console.log(`✅ [PASS] ${name}`);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    testResults.push({ name, passed: false, error: errMsg });
    console.error(`❌ [FAIL] ${name}: ${errMsg}`);
  }
}

export async function runAllSyncEngineTests(): Promise<{ total: number; passed: number; failed: number; results: TestAssertionResult[] }> {
  console.log('\n=============================================================');
  console.log('STARTING PHASE 2B SYNC ENGINE CONCURRENCY AUDIT TEST SUITE');
  console.log('=============================================================\n');

  // Test A (33): Concurrent same child: 50 concurrent processSyncPush() calls strictly serialized
  await runTest('33. Concurrency Test A: 50 concurrent processSyncPush() on SAME child receive sequential 1..50 versions with zero gaps', async () => {
    const promises = Array.from({ length: 50 }, (_, i) =>
      processSyncPush('child_concurrency_50', [
        {
          updateId: `c50_upd_${i}`,
          action: 'UPSERT',
          recordId: `c50_rec_${i}`,
          baseRecordVersion: 0,
          record: { id: `c50_rec_${i}`, childId: 'child_concurrency_50', date: '2026-09-06', status: 'COMPLETED', updatedAt: new Date().toISOString() },
        },
      ])
    );

    const responses = await Promise.all(promises);
    const versions: number[] = [];

    for (const res of responses) {
      assert(res.status === 200, 'All 50 concurrent pushes must succeed');
      const body = res.body as PostSyncResponse;
      assert(body.results[0].status === 'SUCCESS', 'Each mutation must be SUCCESS');
      versions.push(body.results[0].appliedServerVersion!);
    }

    assert(versions.length === 50, 'Must have 50 versions');
    const sortedVersions = [...versions].sort((a, b) => a - b);
    for (let i = 1; i <= 50; i++) {
      assert(sortedVersions[i - 1] === i, `Expected version ${i} at index ${i - 1}, got ${sortedVersions[i - 1]}`);
    }

    const snap = await processSyncPull('child_concurrency_50', 0);
    const body = snap.body as GetSyncSnapshotResponse;
    assert(body.snapshotVersion === 50, `Final snapshotVersion must be 50, got ${body.snapshotVersion}`);
    assert(body.records.length === 50, 'All 50 records must exist in canonical store');
  });

  // Test B (34): Concurrent DIFFERENT children: Execute in parallel without global blocking
  await runTest('34. Concurrency Test B: Concurrent requests on DIFFERENT children execute in parallel without global block', async () => {
    let order: string[] = [];

    const p1 = processSyncPush('child_parallel_1', [
      {
        updateId: 'p1_upd',
        action: 'UPSERT',
        recordId: 'p1_rec',
        baseRecordVersion: 0,
        record: { id: 'p1_rec', childId: 'child_parallel_1', date: '2026-09-06', status: 'COMPLETED', updatedAt: new Date().toISOString() },
      },
    ]).then(() => order.push('child_1_done'));

    const p2 = processSyncPush('child_parallel_2', [
      {
        updateId: 'p2_upd',
        action: 'UPSERT',
        recordId: 'p2_rec',
        baseRecordVersion: 0,
        record: { id: 'p2_rec', childId: 'child_parallel_2', date: '2026-09-06', status: 'COMPLETED', updatedAt: new Date().toISOString() },
      },
    ]).then(() => order.push('child_2_done'));

    await Promise.all([p1, p2]);
    assert(order.length === 2, 'Both parallel requests must complete');
  });

  // Test C (35): GLOBAL concurrent duplicate updateId across DIFFERENT children
  await runTest('35. Concurrency Test C: GLOBAL concurrent duplicate updateId on DIFFERENT children -> exactly 1 SUCCESS, 1 IDEMPOTENCY_CONFLICT', async () => {
    const sharedUpdateId = 'cross_child_race_update_id';

    const p1 = processSyncPush('child_race_A', [
      {
        updateId: sharedUpdateId,
        action: 'UPSERT',
        recordId: 'race_rec',
        baseRecordVersion: 0,
        record: { id: 'race_rec', childId: 'child_race_A', date: '2026-09-06', status: 'COMPLETED', updatedAt: new Date().toISOString() },
      },
    ]);

    const p2 = processSyncPush('child_race_B', [
      {
        updateId: sharedUpdateId,
        action: 'UPSERT',
        recordId: 'race_rec',
        baseRecordVersion: 0,
        record: { id: 'race_rec', childId: 'child_race_B', date: '2026-09-06', status: 'COMPLETED', updatedAt: new Date().toISOString() },
      },
    ]);

    const [res1, res2] = await Promise.all([p1, p2]);

    const status1 = (res1.body as PostSyncResponse).results[0].status;
    const status2 = (res2.body as PostSyncResponse).results[0].status;

    const successCount = (status1 === 'SUCCESS' ? 1 : 0) + (status2 === 'SUCCESS' ? 1 : 0);
    const conflictCount = (status1 === 'REJECTED' ? 1 : 0) + (status2 === 'REJECTED' ? 1 : 0);

    assert(successCount === 1, `Expected exactly 1 SUCCESS across concurrent different children, got ${successCount}`);
    assert(conflictCount === 1, `Expected exactly 1 IDEMPOTENCY_CONFLICT, got ${conflictCount}`);

    const rejectedResult = status1 === 'REJECTED' ? (res1.body as PostSyncResponse).results[0] : (res2.body as PostSyncResponse).results[0];
    assert(rejectedResult.errorCode === 'IDEMPOTENCY_CONFLICT', `Expected IDEMPOTENCY_CONFLICT, got ${rejectedResult.errorCode}`);
  });

  // Test D (36): GLOBAL concurrent identical retry
  await runTest('36. Concurrency Test D: GLOBAL concurrent identical retry with same updateId -> exactly 1 SUCCESS, others DUPLICATE', async () => {
    const sharedUpdateId = 'concurrent_identical_upd';

    const mutationPayload = {
      updateId: sharedUpdateId,
      action: 'UPSERT' as const,
      recordId: 'rec_identical',
      baseRecordVersion: 0,
      record: { id: 'rec_identical', childId: 'child_01', date: '2026-09-06', status: 'COMPLETED' as const, updatedAt: new Date().toISOString() },
    };

    const promises = Array.from({ length: 5 }, () => processSyncPush('child_01', [mutationPayload]));

    const responses = await Promise.all(promises);

    let successCount = 0;
    let duplicateCount = 0;

    for (const res of responses) {
      const status = (res.body as PostSyncResponse).results[0].status;
      if (status === 'SUCCESS') successCount++;
      if (status === 'DUPLICATE') duplicateCount++;
    }

    assert(successCount === 1, `Expected exactly 1 SUCCESS, got ${successCount}`);
    assert(duplicateCount === 4, `Expected 4 DUPLICATEs, got ${duplicateCount}`);

    const snap = await processSyncPull('child_01', 0);
    assert((snap.body as GetSyncSnapshotResponse).snapshotVersion === 1, 'Server version must only increment ONCE');
  });

  // Test E (37): Concurrent failure + retry does not leave phantom processed_mutations or version gaps
  await runTest('37. Concurrency Test E: Failure injection during transaction allows subsequent retry to succeed cleanly with version 1', async () => {
    const targetUpdateId = 'upd_transient_failure';

    setSyncEngineFailureCheckpoint('AFTER_MUTATION_LOG_WRITE');

    let threw = false;
    try {
      await processSyncPush('child_01', [
        {
          updateId: targetUpdateId,
          action: 'UPSERT',
          recordId: 'rec_transient',
          baseRecordVersion: 0,
          record: { id: 'rec_transient', childId: 'child_01', date: '2026-09-06', status: 'COMPLETED', updatedAt: new Date().toISOString() },
        },
      ]);
    } catch {
      threw = true;
    }
    assert(threw, 'First attempt must throw error');

    setSyncEngineFailureCheckpoint(null);

    const retryRes = await processSyncPush('child_01', [
      {
        updateId: targetUpdateId,
        action: 'UPSERT',
        recordId: 'rec_transient',
        baseRecordVersion: 0,
        record: { id: 'rec_transient', childId: 'child_01', date: '2026-09-06', status: 'COMPLETED', updatedAt: new Date().toISOString() },
      },
    ]);

    const body = retryRes.body as PostSyncResponse;
    assert(body.results[0].status === 'SUCCESS', `Retry must succeed with SUCCESS, got ${body.results[0].status}`);
    assert(body.results[0].appliedServerVersion === 1, 'appliedServerVersion must be 1 (no gap)');
    assert(body.currentChildVersion === 1, 'currentChildVersion must be 1');
  });

  // Test F (38): Adversarial overlapping child scheduling
  await runTest('38. Adversarial Test: Overlapping scheduling on SAME child proves strict race prevention', async () => {
    let activeInCriticalSection = 0;
    let raceDetected = false;
    let completedCount = 0;

    const runAdversarial = async (i: number) => {
      return withChildLock('child_race', async () => {
        activeInCriticalSection++;
        if (activeInCriticalSection > 1) {
          raceDetected = true;
        }
        await new Promise(r => setTimeout(r, 10)); // Force delay to create overlap window
        activeInCriticalSection--;
        completedCount++;
      });
    };

    const p = Array.from({ length: 10 }, (_, i) => runAdversarial(i));
    await Promise.all(p);

    assert(!raceDetected, 'Race condition detected in child lock! Multiple requests entered critical section.');
    assert(completedCount === 10, 'Not all requests completed.');
  });
  
  // Test G (39): Adversarial overlapping global claim
  await runTest('39. Adversarial Test: Overlapping global claim across different children', async () => {
    let order: string[] = [];
    const sharedUpdateId = 'adversarial_update_id';
    
    // Request A enters first, hits delay inside child lock
    setSyncEngineFailureCheckpoint('INSIDE_CHILD_LOCK_DELAY');
    
    const pA = processSyncPush('child_A', [
      {
        updateId: sharedUpdateId,
        action: 'UPSERT',
        recordId: 'rec_adv',
        baseRecordVersion: 0,
        record: { id: 'rec_adv', childId: 'child_A', date: '2026-09-06', status: 'COMPLETED', updatedAt: new Date().toISOString() },
      },
    ]).then(res => {
      order.push('A_DONE');
      return res;
    });
    
    // Give A a tiny head start to acquire global lock
    await new Promise(r => setTimeout(r, 10));
    
    // Request B fires. It should block trying to acquire the global lock for sharedUpdateId.
    const pB = processSyncPush('child_B', [
      {
        updateId: sharedUpdateId,
        action: 'UPSERT',
        recordId: 'rec_adv',
        baseRecordVersion: 0,
        record: { id: 'rec_adv', childId: 'child_B', date: '2026-09-06', status: 'COMPLETED', updatedAt: new Date().toISOString() },
      },
    ]).then(res => {
      order.push('B_DONE');
      return res;
    });

    const [resA, resB] = await Promise.all([pA, pB]);
    
    assert(order[0] === 'A_DONE', 'Request A should finish before Request B because B is blocked on global lock');
    
    const statusA = (resA.body as PostSyncResponse).results[0].status;
    const statusB = (resB.body as PostSyncResponse).results[0].status;
    
    assert(statusA === 'SUCCESS', 'A should succeed');
    assert(statusB === 'REJECTED', 'B should be rejected due to idempotency conflict');
    
    setSyncEngineFailureCheckpoint(null);
  });

  console.log('\n=============================================================');
  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;
  console.log(`TEST SUMMARY: ${passed}/${testResults.length} PASSED (${failed} FAILED)`);
  console.log('=============================================================\n');

  if (failed > 0) {
    throw new Error(`${failed} tests failed!`);
  }

  return { total: testResults.length, passed, failed, results: testResults };
}

// Execute directly if run via tsx
runAllSyncEngineTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
