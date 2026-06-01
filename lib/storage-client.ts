'use client';

// Mirrors the window.storage interface from the artifact, but talks to /api/storage

export interface StorageResult {
  key: string;
  value: string;
  shared?: boolean;
}

// Discriminated load result so callers can tell "key is genuinely missing"
// (a fresh/new key — safe to use defaults) apart from "the server errored"
// (do NOT fall back to defaults, or you risk overwriting good data with empty).
export type SafeGet =
  | { status: 'ok'; value: string }
  | { status: 'missing' }
  | { status: 'error'; code: number; message: string };

class ServerStorage {
  async get(key: string): Promise<StorageResult | null> {
    const res = await fetch(`/api/storage?key=${encodeURIComponent(key)}`);
    if (res.status === 404) {
      throw new Error('not found');
    }
    if (!res.ok) throw new Error(`storage get failed: ${res.status}`);
    return res.json();
  }

  // Never throws. 404 → missing; any other non-OK → error; network failure → error(0).
  async getSafe(key: string): Promise<SafeGet> {
    try {
      const res = await fetch(`/api/storage?key=${encodeURIComponent(key)}`);
      if (res.status === 404) return { status: 'missing' };
      if (!res.ok) return { status: 'error', code: res.status, message: `HTTP ${res.status}` };
      const j = await res.json();
      return { status: 'ok', value: j.value };
    } catch (e: any) {
      return { status: 'error', code: 0, message: (e && e.message) || 'network error' };
    }
  }

  async set(key: string, value: string): Promise<StorageResult | null> {
    const res = await fetch('/api/storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) throw new Error(`storage set failed: ${res.status}`);
    return res.json();
  }

  async delete(key: string): Promise<{ key: string; deleted: boolean } | null> {
    const res = await fetch(`/api/storage?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`storage delete failed: ${res.status}`);
    return res.json();
  }

  async list(prefix: string = ''): Promise<{ keys: string[] } | null> {
    const res = await fetch(`/api/storage?action=list&prefix=${encodeURIComponent(prefix)}`);
    if (!res.ok) throw new Error(`storage list failed: ${res.status}`);
    return res.json();
  }
}

declare global {
  interface Window {
    storage: ServerStorage;
  }
}

if (typeof window !== 'undefined' && !window.storage) {
  window.storage = new ServerStorage();
}

export const storage = typeof window !== 'undefined' ? window.storage : new ServerStorage();
