import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const MAX_SIZE = 15 * 1024 * 1024;

export const runtime = 'nodejs';

async function requireAuth() {
  const session = await getServerSession(authOptions);
  return !!session;
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'file too large (max 15MB)' }, { status: 400 });

  const name = (file.name || '').toLowerCase();
  const isPdf = name.endsWith('.pdf') || file.type === 'application/pdf';
  const isText = /\.(csv|tsv|txt)$/.test(name) || /^text\//.test(file.type) || file.type === '' || file.type === 'application/octet-stream';

  if (isPdf) {
    try {
      // Import the inner module directly: pdf-parse/index.js runs a debug branch
      // that reads a test file from disk and crashes under Next's bundler.
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js' as any)).default as
        (buf: Buffer) => Promise<{ text: string; numpages: number }>;
      const buf = Buffer.from(await file.arrayBuffer());
      const data = await pdfParse(buf);
      const text = (data.text || '').trim();
      if (!text) return NextResponse.json({ error: 'no text in PDF (may be scanned image)' }, { status: 422 });
      return NextResponse.json({ text, kind: 'pdf', pages: data.numpages, name: file.name });
    } catch (e: any) {
      return NextResponse.json({ error: `pdf parse failed: ${e?.message || 'unknown'}` }, { status: 500 });
    }
  }

  if (isText) {
    const text = await file.text();
    return NextResponse.json({ text, kind: 'text', name: file.name });
  }

  return NextResponse.json({ error: `unsupported file type: ${file.type || 'unknown'} (${file.name})` }, { status: 400 });
}
