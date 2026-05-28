import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { kvGet, kvSet, kvDelete, kvList } from '@/lib/db';

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return session;
}

export async function GET(req: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'list') {
    const prefix = searchParams.get('prefix') || '';
    return NextResponse.json({ keys: kvList(prefix) });
  }

  const key = searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });
  const value = kvGet(key);
  if (value === null) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ key, value });
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json();
  if (!body.key || typeof body.value !== 'string') {
    return NextResponse.json({ error: 'key and value required' }, { status: 400 });
  }
  kvSet(body.key, body.value);
  return NextResponse.json({ key: body.key, value: body.value });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });
  kvDelete(key);
  return NextResponse.json({ key, deleted: true });
}
