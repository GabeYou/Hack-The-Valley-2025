'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  if (!clean || clean === 'null') return new Uint8Array();
  if (clean.length % 2 !== 0) throw new Error('Invalid hex string length');
  const len = clean.length / 2;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    const byte = clean.slice(i * 2, i * 2 + 2);
    const v = Number.parseInt(byte, 16);
    if (Number.isNaN(v)) throw new Error('Invalid hex content');
    bytes[i] = v;
  }
  return bytes;
}

function detectMime(bytes: Uint8Array): string {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
    return 'image/png';
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return 'image/jpeg';
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return 'image/gif';
  }
  return 'application/octet-stream';
}

export default function ProofViewerPage() {
  const [taskId, setTaskId] = useState('');
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [taskInfo, setTaskInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (imgUrl) URL.revokeObjectURL(imgUrl);
    };
  }, [imgUrl]);

  const fetchProof = useCallback(async () => {
    if (!taskId) {
      setError('Please enter a task ID');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/task/verify/${encodeURIComponent(taskId)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Request failed with ${res.status}`);
      }
      setTaskInfo(data?.task ?? null);
      const hex: string | null = data?.proofHex ?? null;
      if (imgUrl) {
        URL.revokeObjectURL(imgUrl);
        setImgUrl(null);
      }
      if (!hex) {
        setError('No proof image found for this task');
        setLoading(false);
        return;
      }
      const bytes = hexToBytes(hex);
      if (!bytes || bytes.length === 0) {
        setError('Empty proof image');
        setLoading(false);
        return;
      }
      const mime = detectMime(bytes);
      const blob = new Blob([bytes], { type: mime });
      const url = URL.createObjectURL(blob);
      setImgUrl(url);
    } catch (e: any) {
      setError(e?.message || 'Failed to load proof');
    } finally {
      setLoading(false);
    }
  }, [taskId, imgUrl]);

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Task Proof Viewer</h1>
      <p style={{ color: '#666', marginBottom: 16 }}>Enter a Task ID to fetch its submitted proof image.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          placeholder="Task ID"
          style={{ flex: 1, padding: 10, border: '1px solid #ccc', borderRadius: 6 }}
        />
        <button onClick={fetchProof} disabled={loading || !taskId} style={{ padding: '10px 16px', borderRadius: 6 }}>
          {loading ? 'Loading…' : 'Load'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#fee', color: '#900', padding: 10, borderRadius: 6, marginBottom: 16 }}>{error}</div>
      )}

      {taskInfo && (
        <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{taskInfo.title}</div>
          <div style={{ color: '#555', marginBottom: 6 }}>{taskInfo.description}</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            <span>Status: {taskInfo.status}</span>
            <span style={{ marginLeft: 12 }}>Bounty: {taskInfo.bountyTotal}</span>
            <span style={{ marginLeft: 12 }}>Location: {taskInfo.location}</span>
          </div>
        </div>
      )}

      {imgUrl ? (
        <div>
          <img src={imgUrl} alt="Task proof" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #eee' }} />
        </div>
      ) : (
        <div style={{ color: '#777' }}>No image loaded yet.</div>
      )}
    </div>
  );
}

