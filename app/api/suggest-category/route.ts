import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';

const MODEL = 'claude-haiku-4-5-20251001';

async function requireAuth() {
  const session = await getServerSession(authOptions);
  return !!session;
}

type TxIn = { description: string; amount: number };
type CatIn = { id: string; name: string };

export async function POST(req: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured on server' }, { status: 500 });

  let body: { transactions?: TxIn[]; categories?: CatIn[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }
  const transactions = body.transactions || [];
  const categories = body.categories || [];
  if (!Array.isArray(transactions) || !Array.isArray(categories) || transactions.length === 0 || categories.length === 0) {
    return NextResponse.json({ error: 'transactions and categories required' }, { status: 400 });
  }
  if (transactions.length > 30) {
    return NextResponse.json({ error: 'max 30 transactions per request' }, { status: 400 });
  }

  const validIds = new Set(categories.map(c => c.id));
  const catList = categories.map(c => `${c.id} — ${c.name}`).join('\n');
  const txList = transactions
    .map((t, i) => `${i + 1}. "${(t.description || '').replace(/"/g, "'")}" (amount: ${t.amount})`)
    .join('\n');

  const prompt = `You categorize bank/credit-card transactions for a personal budget app.

Available categories (use the id exactly):
${catList}

For each transaction below, return the single best-fit category id. If you cannot identify the merchant with reasonable confidence, return "uncategorized". Match by merchant name in the description; ignore prefixes like "AplPay", "TST*", "SQ *", "PAYPAL *", "AMZN MKTP".

Reply with ONLY a JSON array of category ids in the same order as the transactions. No prose, no markdown fence — just the array.

Transactions:
${txList}`;

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = resp.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')
      .trim();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return NextResponse.json({ error: 'AI response did not contain a JSON array', raw: text.slice(0, 500) }, { status: 502 });

    let parsed: unknown;
    try { parsed = JSON.parse(match[0]); } catch {
      return NextResponse.json({ error: 'AI response is not valid JSON', raw: text.slice(0, 500) }, { status: 502 });
    }
    if (!Array.isArray(parsed)) {
      return NextResponse.json({ error: 'AI response not an array', raw: text.slice(0, 500) }, { status: 502 });
    }
    const ids = parsed.map((v) => {
      const s = String(v || '').trim().toLowerCase();
      return validIds.has(s) ? s : 'uncategorized';
    });
    if (ids.length !== transactions.length) {
      return NextResponse.json({ error: `length mismatch: got ${ids.length}, expected ${transactions.length}`, suggestions: ids }, { status: 502 });
    }
    return NextResponse.json({
      suggestions: ids,
      usage: { input: resp.usage.input_tokens, output: resp.usage.output_tokens },
    });
  } catch (e: any) {
    console.error('[suggest-category]', e);
    return NextResponse.json({ error: `AI call failed: ${e?.message || 'unknown'}` }, { status: 500 });
  }
}
// TODO: If intermittent DO App Platform 502s persist after client batching + retry,
// open a DigitalOcean support ticket referencing app id a5563d1e-e193-4955-b180-ce5f1128bcce
// and the via_upstream (502) failures on POST /api/suggest-category.
