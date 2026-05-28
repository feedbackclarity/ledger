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

type CategoryStat = {
  id: string;
  name: string;
  floor: number;
  stretch: number;
  actual: number;
  discretionary: boolean;
};
type Body = {
  month: string;
  spendableIncome: number;
  totalSpend: number;
  cushionCurrent?: number;
  cushionTarget?: number;
  categories: CategoryStat[];
  topMerchants?: Array<{ description: string; amount: number; category: string }>;
};

export async function POST(req: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured on server' }, { status: 500 });

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }
  if (!body || !body.month || !Array.isArray(body.categories)) {
    return NextResponse.json({ error: 'month and categories required' }, { status: 400 });
  }

  const ctx = {
    month: body.month,
    spendable_income: Math.round(body.spendableIncome || 0),
    total_spend: Math.round(body.totalSpend || 0),
    net_flow: Math.round((body.spendableIncome || 0) - (body.totalSpend || 0)),
    cushion_current: Math.round(body.cushionCurrent || 0),
    cushion_target: Math.round(body.cushionTarget || 0),
    categories: body.categories.map(c => ({
      id: c.id,
      name: c.name,
      floor: Math.round(c.floor || 0),
      stretch: Math.round(c.stretch || 0),
      actual: Math.round(c.actual || 0),
      discretionary: c.discretionary,
      vs_floor: Math.round((c.actual || 0) - (c.floor || 0)),
    })).filter(c => c.actual > 0 || c.floor > 0),
    top_merchants: (body.topMerchants || []).slice(0, 10),
  };

  const prompt = `You are a sharp personal CFO. Given this month's actuals against floor/stretch targets, return 3-6 specific recommendations to help the user hit floor (or stay on stretch) — what to cut, what to keep.

Context (JSON):
${JSON.stringify(ctx, null, 2)}

Rules:
- Call out specific categories or merchants by name.
- Severity 'high' = over floor by >20% on a non-discretionary category, OR a discretionary category eating substantial share of spend.
- Severity 'medium' = over floor by 5-20%.
- Severity 'low' = under floor / on-track; suggest where to redeploy savings or a habit to keep.
- Action: 'cut' (eliminate this), 'reduce' (trim by ~X%), 'keep' (good as-is), 'increase' (under-allocated).
- Be concrete: "Cut Uber Eats — $340 this month, 12% of discretionary." Not "spend less on food".
- 1-2 sentences per insight, no preamble, no markdown.

Reply with ONLY a JSON object, no fence:
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
    console.error('[insights]', e);
    return NextResponse.json({ error: `AI call failed: ${e?.message || 'unknown'}` }, { status: 500 });
  }
}
