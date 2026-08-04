export function createVisitorTracker(options = {}) {
  const ttlMs = options.ttlMs ?? 60_000;
  const visitors = new Map();
  let totalVisitors = 0;

  function prune(now) {
    for (const [id, visit] of visitors.entries()) {
      if (visit.expiresAt <= now) {
        visitors.delete(id);
      }
    }
  }

  function trackVisitor(id, now = Date.now()) {
    const existingVisit = visitors.get(id);
    if (!existingVisit) {
      totalVisitors += 1;
    }

    visitors.set(id, {
      id,
      expiresAt: now + ttlMs,
      firstSeenAt: existingVisit?.firstSeenAt ?? now,
    });

    prune(now);
    return getSnapshot(now);
  }

  function heartbeat(id, now = Date.now()) {
    const visit = visitors.get(id);
    if (!visit) {
      return trackVisitor(id, now);
    }

    visit.expiresAt = now + ttlMs;
    return getSnapshot(now);
  }

  function removeVisitor(id, now = Date.now()) {
    visitors.delete(id);
    prune(now);
    return getSnapshot(now);
  }

  function getSnapshot(now = Date.now()) {
    prune(now);
    return {
      totalVisitors,
      onlineVisitors: visitors.size,
      expiresAt: Math.max(...Array.from(visitors.values(), (value) => value.expiresAt), 0),
    };
  }

  return {
    trackVisitor,
    heartbeat,
    removeVisitor,
    getSnapshot,
  };
}
