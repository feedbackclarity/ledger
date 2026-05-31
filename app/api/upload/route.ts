import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbQuery, dbExec } from '@/lib/db';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export const runtime = 'nodejs';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

async function requireAuth() {
  const session = await getServerSession(authOptions);
  return !!session;
}

function uploadsDir(): string {
  const dir = process.env.UPLOADS_DIR || './uploads';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const txId = formData.get('txId') as string | null;

  if (!file || !txId) {
    return NextResponse.json({ error: 'file and txId required' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'file too large (max 10MB)' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'invalid file type (pdf/jpg/png only)' }, { status: 400 });
  }

  const id = crypto.randomBytes(12).toString('hex');
  const ext = path.extname(file.name) || (file.type === 'application/pdf' ? '.pdf' : '.jpg');
  const filename = `${id}${ext}`;
  const filepath = path.join(uploadsDir(), filename);

  const bytes = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filepath, bytes);

  await dbExec(
    'INSERT INTO attachments (id, tx_id, filename, original_name, mime_type, size, uploaded_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [id, txId, filename, file.name, file.type, file.size, Date.now()]
  );

  return NextResponse.json({ id, filename, originalName: file.name, size: file.size });
}

export async function GET(req: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const txId = searchParams.get('txId');
  const fileId = searchParams.get('fileId');

  if (fileId) {
    const rows = await dbQuery('SELECT * FROM attachments WHERE id = $1', [fileId]);
    const row = rows[0];
    if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const filepath = path.join(uploadsDir(), row.filename);
    if (!fs.existsSync(filepath)) return NextResponse.json({ error: 'file missing' }, { status: 404 });
    const data = fs.readFileSync(filepath);
    return new NextResponse(data, {
      headers: {
        'Content-Type': row.mime_type,
        'Content-Disposition': `inline; filename="${row.original_name}"`,
      },
    });
  }

  if (txId) {
    const rows = await dbQuery(
      'SELECT id, original_name AS "originalName", mime_type AS "mimeType", size, uploaded_at AS "uploadedAt" FROM attachments WHERE tx_id = $1',
      [txId]
    );
    return NextResponse.json({ attachments: rows });
  }

  return NextResponse.json({ error: 'txId or fileId required' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get('fileId');
  if (!fileId) return NextResponse.json({ error: 'fileId required' }, { status: 400 });

  const rows = await dbQuery('SELECT filename FROM attachments WHERE id = $1', [fileId]);
  const row = rows[0];
  if (row) {
    const filepath = path.join(uploadsDir(), row.filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    await dbExec('DELETE FROM attachments WHERE id = $1', [fileId]);
  }
  return NextResponse.json({ deleted: true });
}
