'use client';

// Mirrors the window.storage interface from the artifact, but talks to /api/storage

export interface StorageResult {
  key: string;
  value: string;
  shared?: boolean;
}

class ServerStorage {
  async get(key: string): Promise<StorageResult | null> {
    const res = await fetch(`/api/storage?key=${encodeURIComponent(key)}`);
    if (res.status === 404) {
      throw new Error('not found');
    }
    if (!res.ok) throw new Error(`storage get failed: ${res.status}`);
    return res.json();
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
