import test from 'node:test';
import assert from 'node:assert/strict';
import { createVisitorTracker } from './visitorTracker.js';

test('tracks total and online visitors across sessions', () => {
  const tracker = createVisitorTracker();

  const first = tracker.trackVisitor('visitor-1', 1_000);
  assert.equal(first.totalVisitors, 1);
  assert.equal(first.onlineVisitors, 1);

  const second = tracker.trackVisitor('visitor-2', 2_000);
  assert.equal(second.totalVisitors, 2);
  assert.equal(second.onlineVisitors, 2);

  const heartbeat = tracker.heartbeat('visitor-1', 3_000);
  assert.equal(heartbeat.onlineVisitors, 2);

  tracker.removeVisitor('visitor-2', 4_000);
  const snapshot = tracker.getSnapshot(4_000);
  assert.equal(snapshot.totalVisitors, 2);
  assert.equal(snapshot.onlineVisitors, 1);
});
