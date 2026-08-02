import { useEffect, useMemo, useState } from 'react';
import { Table2, ExternalLink, Link2, AlertCircle } from 'lucide-react';
import { siteConfig } from '@/config';

const LOCK_POLL_MS = 5000;

function toEmbedUrl(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return null;

  const sheetId = match[1];
  const gidMatch = trimmed.match(/[?#]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  return `https://docs.google.com/spreadsheets/d/${sheetId}/htmlembed?gid=${gid}`;
}

function getSheetId(raw: string): string | null {
  if (!raw) return null;
  const match = raw.trim().match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getClientId() {
  const storageKey = 'geotech-spread-client-id';
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem(storageKey);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(storageKey, id);
  }
  return id;
}

function getStoredOwnedSheetId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('geotech-spread-owned-sheet-id');
}

function setStoredOwnedSheetId(value: string | null) {
  if (typeof window === 'undefined') return;
  if (value) {
    localStorage.setItem('geotech-spread-owned-sheet-id', value);
  } else {
    localStorage.removeItem('geotech-spread-owned-sheet-id');
  }
}

function formatExpiry(timestamp: number | null) {
  if (!timestamp) return null;
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function fetchLockStatus(lockServiceUrl: string, sheetId: string | null) {
  if (!sheetId) {
    throw new Error('sheetId is required');
  }
  const res = await fetch(`${lockServiceUrl.replace(/\/+$/, '')}/status?sheetId=${encodeURIComponent(sheetId)}`);
  if (!res.ok) {
    throw new Error(`Unable to fetch lock status (${res.status})`);
  }
  return res.json();
}

async function postLockAction(lockServiceUrl: string, path: 'lock' | 'unlock', sheetId: string | null, clientId: string | null) {
  if (!sheetId || !clientId) {
    throw new Error('sheetId and clientId are required');
  }
  const res = await fetch(`${lockServiceUrl.replace(/\/+$/, '')}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sheetId, clientId }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(body.error || `Lock action failed (${res.status})`);
    (error as any).body = body;
    (error as any).status = res.status;
    throw error;
  }

  return body;
}

export default function SpreadsheetEmbed() {
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const selectedSheet = siteConfig.spreadsheets[selectedSheetIndex] ?? siteConfig.spreadsheets[0];
  const embedUrl = useMemo(() => toEmbedUrl(selectedSheet.spreadsheetUrl), [selectedSheet.spreadsheetUrl]);
  const viewUrl = selectedSheet.spreadsheetUrl.trim() || null;
  const sheetId = useMemo(() => getSheetId(selectedSheet.spreadsheetUrl), [selectedSheet.spreadsheetUrl]);
  const clientId = useMemo(() => getClientId(), []);
  const [lockState, setLockState] = useState({ locked: false, holder: null as string | null, acquiredAt: null as number | null, expiresAt: null as number | null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const [nowTime, setNowTime] = useState(Date.now());
  const [otherSheetWarning, setOtherSheetWarning] = useState<string | null>(null);
  const [ownedSheetId, setOwnedSheetId] = useState<string | null>(() => getStoredOwnedSheetId());

  const isOwner = lockState.locked && lockState.holder === clientId;
  const blockedByOther = lockState.locked && !isOwner;

  const elapsedSeconds = connectedAt ? Math.floor((nowTime - connectedAt) / 1000) : 0;
  const elapsedText = connectedAt
    ? `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`
    : '0m 0s';
  const remainingSeconds = lockState.expiresAt ? Math.max(0, Math.ceil((lockState.expiresAt - nowTime) / 1000)) : null;
  const remainingText = remainingSeconds !== null ? `${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s` : null;

  async function acquireLock(): Promise<boolean> {
    if (!sheetId || !siteConfig.lockServiceUrl || !clientId) return false;
    if (ownedSheetId && ownedSheetId !== sheetId) {
      try {
        const storedStatus = await fetchLockStatus(siteConfig.lockServiceUrl, ownedSheetId);
        if (!storedStatus.locked || storedStatus.holder !== clientId) {
          setOwnedSheetId(null);
          setStoredOwnedSheetId(null);
        } else {
          setOtherSheetWarning('이미 다른 스프래드시트를 열고 있습니다. 한 접속자가 여러 스프래드시트를 동시에 열 수 없습니다.');
          return false;
        }
      } catch {
        setOwnedSheetId(null);
        setStoredOwnedSheetId(null);
      }
    }

    setLoading(true);
    setError(null);
    setOtherSheetWarning(null);

    try {
      const result = await postLockAction(siteConfig.lockServiceUrl, 'lock', sheetId, clientId);
      const acquiredAt = result.lock.acquiredAt ?? Date.now();
      setLockState({
        locked: result.lock.locked,
        holder: result.lock.holder,
        acquiredAt,
        expiresAt: result.lock.expiresAt,
      });
      if (result.lock.locked && result.lock.holder === clientId) {
        setConnectedAt(acquiredAt);
        setOwnedSheetId(sheetId);
        setStoredOwnedSheetId(sheetId);
        return true;
      }
      return false;
    } catch (err) {
      setLockState({ locked: false, holder: null, acquiredAt: null, expiresAt: null });
      const message = (err as Error).message;
      const body = (err as any)?.body;
      if (body?.lock) {
        setLockState({
          locked: body.lock.locked,
          holder: body.lock.holder,
          acquiredAt: body.lock.acquiredAt,
          expiresAt: body.lock.expiresAt,
        });
      }
      if (message.includes('Client already has another spreadsheet open')) {
        setOtherSheetWarning('이미 다른 스프래드시트를 열고 있습니다. 한 접속자가 여러 스프래드시트를 동시에 열 수 없습니다.');
      } else if (message.includes('Sheet is currently locked by another user') || message.includes('locked by another')) {
        setError('다른 접속자가 있습니다. 다시 접속해서 열어주세요.');
      } else {
        setError(message);
      }
      return false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!sheetId || !siteConfig.lockServiceUrl || !clientId) {
      setLoading(false);
      return;
    }

    acquireLock();
  }, [sheetId, clientId]);

  useEffect(() => {
    if (!sheetId || !siteConfig.lockServiceUrl || !clientId) return;
    let isMounted = true;

    async function updateStatus() {
      try {
        const status = await fetchLockStatus(siteConfig.lockServiceUrl, sheetId);
        if (!isMounted) return;
        setLockState({
          locked: status.locked,
          holder: status.holder,
          acquiredAt: status.acquiredAt,
          expiresAt: status.expiresAt,
        });

        if (!status.locked && ownedSheetId === sheetId) {
          setOwnedSheetId(null);
          setStoredOwnedSheetId(null);
        }

        if (!status.locked && !isOwner) {
          await acquireLock();
        }
      } catch (err) {
        if (!isMounted) return;
        setError((err as Error).message);
      }
    }

    const interval = window.setInterval(updateStatus, LOCK_POLL_MS);
    updateStatus();
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [sheetId, clientId, isOwner, ownedSheetId]);

  useEffect(() => {
    if (!siteConfig.lockServiceUrl || !clientId) return;

    const syncStoredOwnedSheet = () => {
      setOwnedSheetId(getStoredOwnedSheetId());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'geotech-spread-owned-sheet-id') {
        syncStoredOwnedSheet();
      }
    };

    window.addEventListener('storage', handleStorage);
    syncStoredOwnedSheet();

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [clientId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTime(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!sheetId || !siteConfig.lockServiceUrl || !clientId) return;

    const handleUnload = () => {
      if (lockState.locked && lockState.holder === clientId) {
        navigator.sendBeacon(
          `${siteConfig.lockServiceUrl.replace(/\/+$/, '')}/unlock`,
          JSON.stringify({ sheetId, clientId }),
        );
      }
      if (ownedSheetId === sheetId) {
        setOwnedSheetId(null);
        setStoredOwnedSheetId(null);
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [sheetId, clientId, lockState]);

  const statusMessage = otherSheetWarning
    ? otherSheetWarning
    : blockedByOther
    ? '다른 접속자가 있습니다. 다시 접속해서 열어주세요.'
    : loading
    ? '스프래드시트 연결 상태를 확인하는 중...'
    : error
    ? error
    : isOwner
    ? `이 스프래드시트를 ${elapsedText}째 사용 중입니다.`
    : '스프래드시트 사용 권한을 요청하는 중...';

  return (
    <section id="spreadsheet" className="relative py-20 sm:py-28">
      <div className="absolute inset-0 bg-grid mask-fade-b pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 bg-brand-50 px-3 py-1 rounded-full ring-1 ring-brand-100">
            <Table2 className="h-4 w-4" />
            Live from Google Sheets
          </p>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900 text-balance">
            {siteConfig.spreadsheetTitle}
          </h2>
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Selected spreadsheet: {selectedSheet.title}
          </p>
          <p className="mt-3 text-slate-600">
            Powered by a Google Spreadsheet stored in Google Drive. Any edit you
            make appears here automatically.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {siteConfig.spreadsheets.map((sheet, index) => {
              const targetSheetId = getSheetId(sheet.spreadsheetUrl);
              const shouldBlockSelection =
                ownedSheetId && targetSheetId && ownedSheetId !== targetSheetId;

              return (
                <button
                  key={sheet.spreadsheetUrl}
                  type="button"
                  onClick={() => {
                    if (shouldBlockSelection) {
                      setOtherSheetWarning(
                        '이미 다른 스프래드시트를 열고 있습니다. 한 접속자가 여러 스프래드시트를 동시에 열 수 없습니다.',
                      );
                      return;
                    }
                    setOtherSheetWarning(null);
                    setSelectedSheetIndex(index);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    index === selectedSheetIndex
                      ? 'bg-brand-700 text-white'
                      : shouldBlockSelection
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  aria-disabled={shouldBlockSelection ? true : undefined}
                >
                  {sheet.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-12">
          {embedUrl ? (
            <SpreadsheetWindow
              embedUrl={embedUrl}
              viewUrl={viewUrl}
              selectedTitle={selectedSheet.title}
              lockState={lockState}
              loading={loading}
              statusMessage={statusMessage}
              nowTime={nowTime}
              isOwner={isOwner}
              otherSheetWarning={otherSheetWarning}
            />
          ) : (
            <SpreadsheetPlaceholder />
          )}
        </div>

        <div className="mt-12">
          <CommentBoard sheetId={sheetId} selectedTitle={selectedSheet.title} isOwner={isOwner} />
        </div>
      </div>
    </section>
  );
}

function SpreadsheetWindow({
  embedUrl,
  viewUrl,
  selectedTitle,
  lockState,
  loading,
  statusMessage,
  nowTime,
  isOwner,
  otherSheetWarning,
}: {
  embedUrl: string;
  viewUrl: string | null;
  selectedTitle: string;
  lockState: { locked: boolean; holder: string | null; acquiredAt: number | null; expiresAt: number | null };
  loading: boolean;
  statusMessage: string;
  nowTime: number;
  isOwner: boolean;
  otherSheetWarning: string | null;
}) {
  const blockedByOther = lockState.locked && lockState.holder !== null;

  const remainingSeconds = lockState.expiresAt ? Math.max(0, Math.ceil((lockState.expiresAt - nowTime) / 1000)) : null;
  const remainingText = remainingSeconds !== null ? `${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s` : null;
  const canOpen = Boolean(viewUrl && !blockedByOther && !otherSheetWarning);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 bg-white">
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-700">Access status</p>
          <p className="mt-1 text-sm text-slate-500">{statusMessage}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={canOpen ? viewUrl ?? undefined : undefined}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => {
              if (!canOpen) {
                event.preventDefault();
              }
            }}
            className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
              canOpen
                ? 'bg-brand-700 text-white hover:bg-brand-800'
                : 'cursor-not-allowed bg-slate-200 text-slate-500'
            }`}
            aria-disabled={!canOpen}
          >
            Open Spreadsheet
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
          {isOwner && remainingText && (
            <span className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">
              Remaining time: {remainingText}
            </span>
          )}
        </div>
      </div>

      <div className="relative bg-white">
        {!blockedByOther ? (
          <iframe
            src={embedUrl}
            title={selectedTitle}
            className="block w-full"
            style={{ height: '70vh', minHeight: '520px', border: 0 }}
            loading="lazy"
          />
        ) : (
          <div className="block w-full bg-slate-900" style={{ height: '70vh', minHeight: '520px' }} />
        )}

        {blockedByOther && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 p-6 text-center text-white">
            <div>
              <p className="text-xl font-semibold">다른 접속자가 있습니다</p>
              <p className="mt-3 text-sm text-slate-200">
                다른 접속자가 있습니다. 다시 접속해서 열어주세요.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CommentBoard({ sheetId, selectedTitle, isOwner }: { sheetId: string | null; selectedTitle: string; isOwner: boolean }) {
  const [comments, setComments] = useState<Array<{ id: string; name: string; body: string; createdAt: string; owner?: string | null }>>([]);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const clientId = useMemo(() => getClientId(), []);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editBody, setEditBody] = useState('');
  const canModifyComment = (_comment: { owner?: string | null }) => isOwner;

  useEffect(() => {
    if (!sheetId) {
      setComments([]);
      return;
    }

    const storedComments = localStorage.getItem(`geotech-spread-comments-${sheetId}`);
    if (storedComments) {
      try {
        const parsed = JSON.parse(storedComments) as Array<{ id: string; name: string; body: string; createdAt: string; owner?: string | null }>;
        // Ensure older comments without owner are supported
        const normalized = parsed.map((c) => ({ owner: (c as any).owner ?? null, ...c }));
        setComments(normalized as any);
      } catch {
        setComments([]);
      }
    } else {
      setComments([]);
    }
  }, [sheetId]);

  const saveComments = (updatedComments: Array<{ id: string; name: string; body: string; createdAt: string }>) => {
    if (!sheetId) return;
    localStorage.setItem(`geotech-spread-comments-${sheetId}`, JSON.stringify(updatedComments));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!name.trim() || !body.trim()) {
      setError('Please enter both a name and a comment.');
      return;
    }
    if (!sheetId) {
      setError('Please select a spreadsheet first.');
      return;
    }

    setSaving(true);

    const newComment = {
      id: crypto.randomUUID(),
      name: name.trim(),
      body: body.trim(),
      createdAt: new Date().toISOString(),
      owner: clientId,
    };

    const updatedComments = [newComment, ...comments];
    setComments(updatedComments);
    saveComments(updatedComments);
    setName('');
    setBody('');
    setSaving(false);
  };

  const startEdit = (id: string) => {
    const c = comments.find((x) => x.id === id);
    if (!c) return;
    if (!canModifyComment(c)) {
      setError('You do not have permission to edit this comment.');
      return;
    }
    setEditingId(id);
    setEditName(c.name);
    setEditBody(c.body);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditBody('');
    setError(null);
  };

  const saveEdit = (id: string) => {
    if (!editName.trim() || !editBody.trim()) {
      setError('Please enter both a name and a comment.');
      return;
    }
    const c = comments.find((x) => x.id === id);
    if (!c) return;
    if (!canModifyComment(c)) {
      setError('You do not have permission to edit this comment.');
      return;
    }
    const updated = comments.map((c) => (c.id === id ? { ...c, name: editName.trim(), body: editBody.trim() } : c));
    setComments(updated);
    saveComments(updated);
    cancelEdit();
  };

  const deleteComment = (id: string) => {
    const c = comments.find((x) => x.id === id);
    if (!c) return;
    if (!canModifyComment(c)) {
      setError('You do not have permission to delete this comment.');
      return;
    }
    // simple confirmation
    if (!window.confirm('Delete this comment?')) return;
    const updated = comments.filter((c) => c.id !== id);
    setComments(updated);
    saveComments(updated);
    if (editingId === id) cancelEdit();
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-brand-700">
            Comments
          </p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            Leave feedback for {selectedTitle}
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Leave a question or feedback about this spreadsheet.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          <label className="space-y-2 text-sm text-slate-700">
            Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="Your name"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-700 sm:col-span-1">
            Comment
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="block h-32 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="Write your comment here..."
            />
          </label>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-2xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Post comment'}
          </button>
          <p className="text-sm text-slate-500">
            {comments.length} comments
          </p>
        </div>
      </form>

      <div className="mt-8 space-y-4">
        {comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
            No comments yet. Be the first to comment.
          </div>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                {editingId === comment.id ? (
                  <div className="w-full">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="block w-full rounded-md border border-slate-200 px-3 py-1 text-sm"
                    />
                  </div>
                ) : (
                  <p className="font-semibold text-slate-900">{comment.name}</p>
                )}

                <div className="flex items-center gap-3">
                  <p className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleString()}</p>
                  {editingId === comment.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(comment.id)}
                        className="rounded-full bg-brand-700 px-3 py-1 text-xs font-semibold text-white"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {isOwner ? (
                        <>
                          <button
                            onClick={() => startEdit(comment.id)}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">No permission</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {editingId === comment.id ? (
                <div className="mt-3">
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="block w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    rows={4}
                  />
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-700">{comment.body}</p>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function SpreadsheetPlaceholder() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 sm:p-12 text-center">
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 glow blur-2xl pointer-events-none" />
      <div className="relative mx-auto max-w-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-lg ring-1 ring-slate-100">
          <Link2 className="h-6 w-6 text-brand-600" />
        </div>
        <h3 className="mt-5 text-xl font-semibold text-slate-900">
          Connect your Google Spreadsheet
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Your live spreadsheet will appear right here. Once linked, every edit
          you make in Google Sheets shows up here instantly.
        </p>

        <div className="mt-6 rounded-xl bg-white p-5 text-left ring-1 ring-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            How to connect
          </p>
          <ol className="mt-3 space-y-3 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                1
              </span>
              Open your spreadsheet and click <strong>Share</strong> (top-right).
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                2
              </span>
              Set <strong>General access</strong> to{' '}
              <strong>Anyone with the link</strong>.
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                3
              </span>
              Copy the URL from the address bar and paste it into{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.8em] font-mono text-brand-700">
                src/config.ts
              </code>
              .
            </li>
          </ol>
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-left text-sm text-amber-800 ring-1 ring-amber-100">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Only people who can see the original spreadsheet will see it here.
            Keep the link access set to <strong>Anyone with the link</strong>.
          </span>
        </div>
      </div>
    </div>
  );
}
