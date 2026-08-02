import http from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const LOCK_TTL_MS = 10 * 60 * 1000;
const locks = new Map();
const clientLocks = new Map();

function now() {
  return Date.now();
}

function cleanExpiredLocks() {
  const time = now();
  for (const [sheetId, lock] of locks.entries()) {
    if (lock.expiresAt <= time) {
      locks.delete(sheetId);
      if (clientLocks.get(lock.clientId) === sheetId) {
        clientLocks.delete(lock.clientId);
      }
    }
  }
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function buildLockResponse(lock) {
  if (!lock) {
    return { locked: false, holder: null, expiresAt: null, acquiredAt: null };
  }

  return {
    locked: true,
    holder: lock.clientId,
    acquiredAt: lock.acquiredAt,
    expiresAt: lock.expiresAt,
  };
}

const server = http.createServer(async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  cleanExpiredLocks();

  if (pathname === '/status' && req.method === 'GET') {
    const sheetId = url.searchParams.get('sheetId');
    if (!sheetId) {
      return sendJson(res, 400, { error: 'sheetId is required' });
    }

    const lock = locks.get(sheetId) || null;
    return sendJson(res, 200, buildLockResponse(lock));
  }

  if ((pathname === '/lock' || pathname === '/unlock') && req.method === 'POST') {
    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch (error) {
      return sendJson(res, 400, { error: 'Invalid JSON body' });
    }

    const { sheetId, clientId } = body;
    if (!sheetId || !clientId) {
      return sendJson(res, 400, { error: 'sheetId and clientId are required' });
    }

    const existingLock = locks.get(sheetId);

    if (pathname === '/lock') {
      const currentSheetForClient = clientLocks.get(clientId);
      if (currentSheetForClient && currentSheetForClient !== sheetId) {
        const currentLock = locks.get(currentSheetForClient) || null;
        return sendJson(res, 409, {
          error: 'Client already has another spreadsheet open',
          lock: buildLockResponse(currentLock),
        });
      }

      if (existingLock && existingLock.clientId !== clientId) {
        return sendJson(res, 409, {
          error: 'Sheet is currently locked by another user',
          lock: buildLockResponse(existingLock),
        });
      }

      const acquiredAt = existingLock?.clientId === clientId ? existingLock.acquiredAt : now();
      const expiresAt = now() + LOCK_TTL_MS;
      locks.set(sheetId, { clientId, acquiredAt, expiresAt });
      clientLocks.set(clientId, sheetId);
      return sendJson(res, 200, {
        message: 'Lock acquired',
        lock: buildLockResponse({ clientId, acquiredAt, expiresAt }),
      });
    }

    if (pathname === '/unlock') {
      if (!existingLock || existingLock.clientId !== clientId) {
        return sendJson(res, 400, { error: 'No lock held by this client' });
      }

      locks.delete(sheetId);
      if (clientLocks.get(clientId) === sheetId) {
        clientLocks.delete(clientId);
      }
      return sendJson(res, 200, { message: 'Lock released', lock: buildLockResponse(null) });
    }
  }

  return sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Lock server running on http://localhost:${PORT}`);
});
