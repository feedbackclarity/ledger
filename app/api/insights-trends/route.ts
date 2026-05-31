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

type Body = {
  months: string[]; // chronological, oldest first, e.g. ["2025-06", ..., "2026-05"]
  monthlyTotals: number[]; // per-month total personal spend, same order
  topCategories: Array<{ id: string; name: string; values: number[] }>; // per-month spend
  cushionCurrent?: number;
  cushionTarget?: number;
};

export async function POST(req: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured on server' }, { status: 500 });

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }
  if (!body || !Array.isArray(body.months) || !Array.isArray(body.monthlyTotals)) {
    return NextResponse.json({ error: 'months and monthlyTotals required' }, { status: 400 });
  }

  const ctx = {
    months: body.months,
    monthly_totals: body.monthlyTotals.map(n => Math.round(n)),
    top_categories: (body.topCategories || []).map(c => ({
      id: c.id,
      name: c.name,
      monthly: (c.values || []).map(n => Math.round(n)),
    })),
    cushion_current: Math.round(body.cushionCurrent || 0),
    cushion_target: Math.round(body.cushionTarget || 0),
  };

  const prompt = `You are a sharp personal CFO looking at multi-month spending trends. Return 4-6 specific observations and recommendations focused on MONTH-OVER-MONTH change and emerging patterns — not single-month variance.

Context (JSON, oldest month first):
${JSON.stringify(ctx, null, 2)}

Focus on:
- Categories trending UP fast (e.g. "Restaurants is up 40% vs three-month average — switching back to home cooking would save ~$X").
- Categories trending DOWN that should be locked in.
- Seasonal patterns or anomaly months that stand out.
- Whether the trajectory threatens the cushion target.

Be concrete with dollar figures and category names. 1-2 sentences per insight. No preamble, no markdown.

Reply with ONLY a JSON object:
{"insights":[{"severity":"high|medium|low","category":"<category id or empty>","action":"cut|reduce|keep|increase","message":"<one or two sentences>"}]}`;

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = resp.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')
      .trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: 'AI response not parseable', raw: text.slice(0, 500) }, { status: 502 });

    let parsed: any;
    try { parsed = JSON.parse(match[0]); } catch {
      return NextResponse.json({ error: 'AI response not valid JSON', raw: text.slice(0, 500) }, { status: 502 });
    }
    const insights = Array.isArray(parsed.insights) ? parsed.insights : [];
    return NextResponse.json({
      insights,
      generatedAt: Date.now(),
      usage: { input: resp.usage.input_tokens, output: resp.usage.output_tokens },
    });
  } catch (e: any) {
    console.error('[insights-trends]', e);
    return NextResponse.json({ error: `AI call failed: ${e?.message || 'unknown'}` }, { status: 500 });
  }
}
