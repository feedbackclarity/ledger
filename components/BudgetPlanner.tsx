'use client';

import '@/lib/storage-client';
import React, { useState, useEffect, useMemo } from 'react';

// ============ DEFAULT CATEGORIES ============
const DEFAULT_CATEGORIES = [
  { id: 'auto', name: 'Auto', discretionary: false, floor: 0, stretch: 0 },
  { id: 'childcare', name: 'Child Care & Kids', discretionary: false, floor: 0, stretch: 0 },
  { id: 'wife-clothing', name: "Wife's Clothing & Personal", discretionary: true, floor: 0, stretch: 0 },
  { id: 'restaurants', name: 'Restaurants & Dining', discretionary: true, floor: 0, stretch: 0 },
  { id: 'groceries', name: 'Groceries & Household', discretionary: false, floor: 0, stretch: 0 },
  { id: 'travel', name: 'Travel & Entertainment', discretionary: true, floor: 0, stretch: 0 },
  { id: 'health', name: 'Health & Wellness', discretionary: false, floor: 0, stretch: 0 },
  { id: 'home-chicago-mortgage', name: 'Chicago — Mortgage (P&I)', discretionary: false, floor: 0, stretch: 0 },
  { id: 'home-chicago-tax', name: 'Chicago — Property Tax', discretionary: false, floor: 0, stretch: 0 },
  { id: 'home-chicago-insurance', name: 'Chicago — Insurance', discretionary: false, floor: 0, stretch: 0 },
  { id: 'home-chicago-hoa', name: 'Chicago — HOA', discretionary: false, floor: 0, stretch: 0 },
  { id: 'home-chicago-utilities', name: 'Chicago — Utilities', discretionary: false, floor: 0, stretch: 0 },
  { id: 'home-chicago-services', name: 'Chicago — Landscape/Pool/Standing', discretionary: false, floor: 0, stretch: 0 },
  { id: 'home-chicago-cleaning', name: 'Chicago — Cleaning/Household Help', discretionary: false, floor: 0, stretch: 0 },
  { id: 'home-newport-mortgage', name: 'Newport — Mortgage (P&I)', discretionary: false, floor: 0, stretch: 0, future: true },
  { id: 'home-newport-tax', name: 'Newport — Property Tax', discretionary: false, floor: 0, stretch: 0, future: true },
  { id: 'home-newport-insurance', name: 'Newport — Insurance', discretionary: false, floor: 0, stretch: 0, future: true },
  { id: 'home-newport-hoa', name: 'Newport — HOA', discretionary: false, floor: 0, stretch: 0, future: true },
  { id: 'home-newport-utilities', name: 'Newport — Utilities', discretionary: false, floor: 0, stretch: 0, future: true },
  { id: 'home-newport-services', name: 'Newport — Landscape/Pool/Standing', discretionary: false, floor: 0, stretch: 0, future: true },
  { id: 'home-newport-cleaning', name: 'Newport — Cleaning/Household Help', discretionary: false, floor: 0, stretch: 0, future: true },
  { id: 'subscriptions', name: 'Subscriptions & Memberships', discretionary: false, floor: 0, stretch: 0 },
  { id: 'boats-motorsports', name: 'Boats / Motorsports (Personal)', discretionary: true, floor: 0, stretch: 0 },
  { id: 'gifts', name: 'Gifts & Charitable', discretionary: true, floor: 0, stretch: 0 },
  { id: 'taxes-quarterly', name: 'Quarterly Estimated Taxes', discretionary: false, floor: 0, stretch: 0 },
  { id: 'uncategorized', name: 'Uncategorized', discretionary: false, floor: 0, stretch: 0 },
];

// ============ CATEGORIZATION RULES (LEARNED PATTERNS) ============
const SEED_RULES = [
  { pattern: /shell|chevron|\bbp\b|mobil|exxon|gas station|\b76\b|sunoco|valero|marathon/i, category: 'auto' },
  { pattern: /state farm|geico|progressive auto|allstate|liberty mutual/i, category: 'auto' },
  { pattern: /jiffy lube|valvoline|midas|firestone|pep boys|autozone|napa auto/i, category: 'auto' },
  { pattern: /whole foods|trader joe|jewel|mariano|costco|wegman|safeway|kroger|publix|aldi|sprouts|fresh market/i, category: 'groceries' },
  { pattern: /amazon fresh|instacart|gopuff|fresh direct|shipt/i, category: 'groceries' },
  { pattern: /netflix|spotify|hulu|apple\.com\/bill|itunes|prime video|disney plus|hbo max|paramount|peacock|youtube premium/i, category: 'subscriptions' },
  { pattern: /audible|kindle unlimited|nytimes|new york times|wsj|wall street journal|washington post|economist/i, category: 'subscriptions' },
  { pattern: /squarespace|sqsp\*|wix|wordpress|godaddy|namecheap|cloudflare/i, category: 'subscriptions' },
  { pattern: /substack|patreon|onlyfans/i, category: 'subscriptions' },
  { pattern: /adobe|chatgpt|openai|anthropic|github|linear|notion|figma|claude\.ai|cursor|jetbrains/i, category: 'subscriptions' },
  { pattern: /icloud|dropbox|google storage|google one|microsoft 365|m365/i, category: 'subscriptions' },
  { pattern: /ypo|young presidents|eo global|vistage/i, category: 'subscriptions' },
  { pattern: /comed|peoples gas|nicor|\batt\b|verizon|comcast|xfinity|t-mobile|sprint|spectrum/i, category: 'home-chicago-utilities' },
  { pattern: /walgreens|cvs|rite aid|pharmacy|doctor|dental|orthodonti|equinox|peloton|soulcycle|barry'?s|orange.?theory/i, category: 'health' },
  { pattern: /united|delta|american airlines|southwest|jetblue|alaska air|frontier|spirit airlines|lufthansa|british airways|air france|emirates/i, category: 'travel' },
  { pattern: /hotel|airbnb|hyatt|marriott|hilton|four seasons|ritz.?carlton|holiday inn|sheraton|westin|kimpton|vrbo/i, category: 'travel' },
  { pattern: /uber|lyft|taxi|ubers? eats|doordash|grubhub|seamless|caviar/i, category: 'travel' },
  { pattern: /starbucks|dunkin|peet'?s|blue bottle|philz|la colombe|intelligentsia|stumptown/i, category: 'restaurants' },
  { pattern: /mcdonald|chipotle|sweetgreen|chick.?fil|panera|domino|pizza|sushi|ramen|thai/i, category: 'restaurants' },
  { pattern: /resy|opentable|tock|yelp reservations/i, category: 'restaurants' },
  { pattern: /irs|illinois dept of rev|estimated tax|franchise tax|state tax/i, category: 'taxes-quarterly' },
];

// Payment-system / network noise that should be stripped before matching:
// "AplPay UBER TRIP" → "UBER TRIP", "TST* MERCHANT" → "MERCHANT", etc.
const MERCHANT_PREFIX_RE = /^(aplpay|applepay|apple pay|gpay|google pay|tst\*|sq \*|sq\*|paypal \*|pp\*|amzn mktp|amzn mkt|amazon\.com|venmo|cash app|cashapp|zelle to|zelle from|payment to|payment from)\s*/i;
const URL_RE = /\s+https?:\S+/i;
const TX_ID_RE = /#\d{2,}.*$/;
const TRAIL_STATE_RE = /\s+[A-Z]{2}\s*$/;

function normalizeMerchant(description) {
  let s = String(description || '').trim();
  // Repeated prefix strip so "AplPay SQ* MERCHANT" peels both layers
  let prev = '';
  while (s !== prev && MERCHANT_PREFIX_RE.test(s)) { prev = s; s = s.replace(MERCHANT_PREFIX_RE, '').trim(); }
  s = s.replace(URL_RE, '');
  s = s.replace(TX_ID_RE, '');
  s = s.replace(TRAIL_STATE_RE, '');
  s = s.replace(/\s{2,}/g, ' ').trim();
  return s;
}

function merchantKey(description) {
  const norm = normalizeMerchant(description);
  if (norm.length < 3) return null;
  // First 2 tokens, lowercased — stable enough that "UBER TRIP HTTPS://..." and "UBER EATS NEW YORK" share "uber"
  const tokens = norm.split(/\s+/).filter(t => t.length > 0).slice(0, 2).join(' ').toLowerCase();
  return tokens.length >= 3 ? tokens : null;
}

const INCOME_KW_RE = /\b(payroll|salary|direct dep(osit)?|deposit from|interest paid|interest earned|dividend|refund|reimbursement|tax refund|rebate)\b/i;
const TRANSFER_KW_RE = /\b(payment\s*-?\s*thank|autopay|online payment|transfer (to|from)|xfer|wire (to|from)|ach (debit|credit|transfer|from|to)|internal transfer|account transfer)\b/i;

function classifyAmount(amount, description, convention) {
  if (INCOME_KW_RE.test(description)) return 'income';
  if (TRANSFER_KW_RE.test(description)) return 'transfer';
  if (convention === 'credit-card') {
    // CC: positive = charge (spend), negative = payment received from your bank
    return amount > 0 ? 'personal' : 'transfer';
  }
  // Bank: negative = spend, positive = transfer in / income
  if (amount > 0) {
    // Large round-ish positives are more likely income than internal transfer, but
    // without more signal we keep them as 'transfer' for user review.
    return 'transfer';
  }
  return 'personal';
}

function detectSignConvention(parsed) {
  if (!parsed.length) return 'bank';
  const pos = parsed.filter(t => t.amount > 0).length;
  return pos / parsed.length >= 0.6 ? 'credit-card' : 'bank';
}

// ============ HELPERS ============
const fmt = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '$0';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
};

const fmtCents = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '$0.00';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const monthLabel = (key) => {
  const [y, m] = key.split('-');
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

// ============ STATEMENT PARSER ============
const DATE_RE = /^\d{1,4}[-\/.]\d{1,2}[-\/.]\d{1,4}$|^\d{1,2}\/\d{1,2}$/;
const HEADER_TOKENS = /\b(date|posting|posted|trans(action)?|description|merchant|amount|debit|credit|withdrawal|deposit|balance|statement|notes|payee|category|memo|details|ref(erence)?)\b/i;

function parseAmount(s) {
  if (!s) return NaN;
  let t = String(s).trim();
  if (!t) return NaN;
  let neg = false;
  if (/^\(.*\)$/.test(t)) { neg = true; t = t.slice(1, -1); }
  if (t.endsWith('-')) { neg = true; t = t.slice(0, -1); }
  t = t.replace(/[$£€,\s]/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(t)) return NaN;
  const v = parseFloat(t);
  if (isNaN(v)) return NaN;
  return neg ? -Math.abs(v) : v;
}

function splitCsvLine(line) {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (q && line[i+1] === '"') { cur += '"'; i++; } else { q = !q; } continue; }
    if (c === ',' && !q) { out.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

function parseStatementText(raw) {
  raw = (raw || '').replace(/^﻿/, '');
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { tx: [], skipped: 0, error: 'Empty input' };

  const sampleLineCount = Math.min(10, lines.length);
  const sample = lines.slice(0, sampleLineCount).join('\n');
  const counts = {
    tab:   (sample.match(/\t/g) || []).length,
    comma: (sample.match(/,/g)  || []).length,
    semi:  (sample.match(/;/g)  || []).length,
    pipe:  (sample.match(/\|/g) || []).length,
  };
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  let splitter;
  if (top[1] >= sampleLineCount) {
    if (top[0] === 'tab')   splitter = l => l.split('\t').map(p => p.trim());
    else if (top[0] === 'comma') splitter = l => splitCsvLine(l);
    else if (top[0] === 'semi')  splitter = l => l.split(';').map(p => p.trim());
    else                          splitter = l => l.split('|').map(p => p.trim());
  } else {
    splitter = l => l.split(/\s{2,}|\t+/).map(p => p.trim()).filter(Boolean);
  }

  let startIdx = 0;
  const firstParts = splitter(lines[0]);
  const hasHeaderWord = firstParts.some(p => HEADER_TOKENS.test(p));
  const firstHasAmount = firstParts.some(p => !isNaN(parseAmount(p)) && /\d/.test(p));
  if (hasHeaderWord && !firstHasAmount) startIdx = 1;

  // TODO(H3): when header has both Withdrawal/Debit and Deposit/Credit, record
  // their column indices and negate the debit column instead of letting the
  // rightmost numeric win. Deferred for follow-up.

  // H1 fallback: peel a leading date + trailing amount out of a single line.
  // Used when the splitter leaves <2 parts or when date/amount detection fails.
  const tryRowFallback = (line) => {
    const m = line.match(/^(\d{1,4}[-\/.]\d{1,2}(?:[-\/.]\d{1,4})?)\s+(.*?)\s+(\(?[\$£€]?\-?[\d,]+\.\d{2}\)?\-?)$/);
    if (!m) return null;
    const amt = parseAmount(m[3]);
    const desc = m[2].trim();
    if (isNaN(amt) || !desc) return null;
    return { date: m[1], description: desc, amount: amt };
  };

  const tx = [];
  let skipped = 0;
  for (let i = startIdx; i < lines.length; i++) {
    let parts = splitter(lines[i]);
    if (parts.length < 2) {
      const row = tryRowFallback(lines[i]);
      if (row) { tx.push(row); continue; }
      skipped++;
      continue;
    }

    let dateIdx = -1;
    for (let j = 0; j < parts.length; j++) {
      if (DATE_RE.test(parts[j])) { dateIdx = j; break; }
    }
    let amountIdx = -1;
    let amountVal = NaN;
    for (let j = parts.length - 1; j >= 0; j--) {
      const v = parseAmount(parts[j]);
      if (!isNaN(v) && /\d/.test(parts[j])) { amountIdx = j; amountVal = v; break; }
    }
    if (dateIdx === -1 || amountIdx === -1 || isNaN(amountVal)) {
      const row = tryRowFallback(lines[i]);
      if (row) { tx.push(row); continue; }
      skipped++;
      continue;
    }

    const descParts = [];
    for (let j = 0; j < parts.length; j++) {
      if (j !== dateIdx && j !== amountIdx) descParts.push(parts[j]);
    }
    const description = descParts.join(' ').replace(/\s+/g, ' ').trim();
    if (!description) { skipped++; continue; }

    tx.push({ date: parts[dateIdx], description, amount: amountVal });
  }
  return { tx, skipped };
}

// ============ MAIN COMPONENT ============
export default function BudgetPlanner() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard'); // dashboard, transactions, categories, settings, import
  const [dashboardView, setDashboardView] = useState('personal'); // 'personal' | 'business-transfers'
  const [currentMonth, setCurrentMonth] = useState(monthKey(new Date()));

  // Core state
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [rules, setRules] = useState([]); // learned merchant → category
  const [transactions, setTransactions] = useState({}); // { monthKey: [tx, tx, ...] }
  const [income, setIncome] = useState({}); // { monthKey: number }
  const [settings, setSettings] = useState({
    cushionTarget: 0,
    cushionCurrent: 0,
    taxSetasidePct: 30,
    newportActive: false,
    accounts: [], // [{id, name, type: 'bank'|'card'}]
  });
  const [importLog, setImportLog] = useState([]); // [{id,timestamp,fileName,fileSize,kind,accountId,monthKey,txCount,skippedCount,sumAmounts,convention,txIds}]

  // Load from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const [catsRes, rulesRes, txRes, incRes, setRes, logRes] = await Promise.all([
          window.storage.get('categories').catch(() => null),
          window.storage.get('rules').catch(() => null),
          window.storage.get('transactions').catch(() => null),
          window.storage.get('income').catch(() => null),
          window.storage.get('settings').catch(() => null),
          window.storage.get('importLog').catch(() => null),
        ]);
        if (catsRes) setCategories(JSON.parse(catsRes.value));
        if (rulesRes) setRules(JSON.parse(rulesRes.value));
        if (txRes) setTransactions(JSON.parse(txRes.value));
        if (incRes) setIncome(JSON.parse(incRes.value));
        if (setRes) {
          const loaded = JSON.parse(setRes.value);
          // Forward-compat: ensure accounts array exists for old persisted settings
          setSettings({ ...loaded, accounts: loaded.accounts || [] });
        }
        if (logRes) setImportLog(JSON.parse(logRes.value));
      } catch (e) {
        console.log('First run or storage error', e);
      }
      setLoading(false);
    })();
  }, []);

  // Save helpers (debounced via effect)
  useEffect(() => {
    if (loading) return;
    window.storage.set('categories', JSON.stringify(categories)).catch(console.error);
  }, [categories, loading]);

  useEffect(() => {
    if (loading) return;
    window.storage.set('rules', JSON.stringify(rules)).catch(console.error);
  }, [rules, loading]);

  useEffect(() => {
    if (loading) return;
    window.storage.set('transactions', JSON.stringify(transactions)).catch(console.error);
  }, [transactions, loading]);

  useEffect(() => {
    if (loading) return;
    window.storage.set('income', JSON.stringify(income)).catch(console.error);
  }, [income, loading]);

  useEffect(() => {
    if (loading) return;
    window.storage.set('settings', JSON.stringify(settings)).catch(console.error);
  }, [settings, loading]);

  useEffect(() => {
    if (loading) return;
    window.storage.set('importLog', JSON.stringify(importLog)).catch(console.error);
  }, [importLog, loading]);

  // ============ DERIVED STATE ============
  const monthTx = transactions[currentMonth] || [];
  const monthIncome = income[currentMonth] || 0;
  const taxReserve = monthIncome * (settings.taxSetasidePct / 100);
  const spendableIncome = monthIncome - taxReserve;

  const personalTx = monthTx.filter(t => t.classification === 'personal');
  const totalSpend = personalTx.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalUncategorized = personalTx.filter(t => !t.category || t.category === 'uncategorized').length;
  const totalUnclassified = monthTx.filter(t => !t.classification).length;

  const spendByCategory = useMemo(() => {
    const map = {};
    personalTx.forEach(t => {
      const cat = t.category || 'uncategorized';
      map[cat] = (map[cat] || 0) + Math.abs(t.amount);
    });
    return map;
  }, [personalTx]);

  const netCashflow = spendableIncome - totalSpend;

  // Floor budget total (essentials only)
  const floorBudget = categories
    .filter(c => !c.discretionary && (settings.newportActive || !c.future))
    .reduce((s, c) => s + (c.floor || 0), 0);

  const stretchBudget = categories
    .filter(c => settings.newportActive || !c.future)
    .reduce((s, c) => s + (c.stretch || c.floor || 0), 0);

  // Cushion runway (months at floor budget)
  const runwayMonths = floorBudget > 0 ? settings.cushionCurrent / floorBudget : 0;
  const cushionPctOfTarget = settings.cushionTarget > 0 ? (settings.cushionCurrent / settings.cushionTarget) * 100 : 0;

  // Trailing 6-month avg for category recommendations
  const trailingAvg = useMemo(() => {
    const map = {};
    const months = Object.keys(transactions).sort().slice(-6);
    months.forEach(mk => {
      (transactions[mk] || []).filter(t => t.classification === 'personal').forEach(t => {
        const cat = t.category || 'uncategorized';
        map[cat] = (map[cat] || 0) + Math.abs(t.amount);
      });
    });
    const count = months.length || 1;
    Object.keys(map).forEach(k => map[k] = map[k] / count);
    return map;
  }, [transactions]);

  // ============ CATEGORIZATION ============
  const lookupRule = (description) => {
    const norm = normalizeMerchant(description).toLowerCase();
    const raw = String(description || '').toLowerCase();
    for (const rule of rules) {
      const m = (rule.merchant || '').toLowerCase();
      if (!m) continue;
      if (norm.includes(m) || raw.includes(m)) return rule;
    }
    return null;
  };

  const autoCategorize = (description) => {
    const learned = lookupRule(description);
    if (learned && learned.category && learned.category !== 'uncategorized') return learned.category;
    const norm = normalizeMerchant(description);
    for (const rule of SEED_RULES) {
      if (rule.pattern.test(description) || rule.pattern.test(norm)) return rule.category;
    }
    return 'uncategorized';
  };

  const lookupLearnedClass = (description) => {
    const learned = lookupRule(description);
    return learned && learned.classification ? learned.classification : null;
  };

  // ============ IMPORT FLOW ============
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [loadedFileName, setLoadedFileName] = useState(null);
  const [pendingFile, setPendingFile] = useState(null); // { name, size, kind }
  const [importAccountId, setImportAccountId] = useState('');
  const [learnStatus, setLearnStatus] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [insightsByMonth, setInsightsByMonth] = useState({}); // { monthKey: { insights, generatedAt } }
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState('');

  useEffect(() => {
    if (!learnStatus) return;
    const t = setTimeout(() => setLearnStatus(''), 6000);
    return () => clearTimeout(t);
  }, [learnStatus]);

  // Load cached insights for whichever month we're viewing.
  useEffect(() => {
    if (loading) return;
    if (insightsByMonth[currentMonth]) return; // already in memory
    window.storage.get(`insights:${currentMonth}`).then((res) => {
      if (!res) return;
      try {
        const data = JSON.parse(res.value);
        setInsightsByMonth((prev) => ({ ...prev, [currentMonth]: data }));
      } catch { /* ignore corrupt cache */ }
    }).catch(() => {});
  }, [currentMonth, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const getInsights = async () => {
    setGeneratingInsights(true);
    setInsightsError('');
    try {
      const cats = categories.map(c => ({
        id: c.id,
        name: c.name,
        floor: c.floor || 0,
        stretch: c.stretch || 0,
        actual: spendByCategory[c.id] || 0,
        discretionary: !!c.discretionary,
      }));
      const topMerchants = personalTx
        .slice()
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
        .slice(0, 10)
        .map(t => ({ description: t.description, amount: t.amount, category: t.category || 'uncategorized' }));
      const payload = {
        month: currentMonth,
        spendableIncome,
        totalSpend,
        cushionCurrent: settings.cushionCurrent,
        cushionTarget: settings.cushionTarget,
        categories: cats,
        topMerchants,
      };
      const r = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const ct = r.headers.get('content-type') || '';
      const text = await r.text();
      if (!ct.toLowerCase().includes('application/json')) {
        setInsightsError(`AI error (HTTP ${r.status}): ${(text || '').slice(0, 200)}`);
        return;
      }
      let j;
      try { j = JSON.parse(text); } catch {
        setInsightsError(`AI error (HTTP ${r.status}): invalid JSON body`);
        return;
      }
      if (!r.ok) {
        setInsightsError(`AI error (HTTP ${r.status}): ${j.error || 'unknown'}`);
        return;
      }
      const data = { insights: j.insights || [], generatedAt: j.generatedAt || Date.now() };
      setInsightsByMonth(prev => ({ ...prev, [currentMonth]: data }));
      window.storage.set(`insights:${currentMonth}`, JSON.stringify(data)).catch(console.error);
    } catch (e) {
      setInsightsError(`AI request failed: ${(e && e.message) || 'unknown'}`);
    } finally {
      setGeneratingInsights(false);
    }
  };

  const suggestCategories = async () => {
    const uncat = (transactions[currentMonth] || []).filter(t => !t.category || t.category === 'uncategorized');
    if (uncat.length === 0) return;
    setSuggesting(true);
    setLearnStatus('');

    const CHUNK_SIZE = 25;
    const RETRY_DELAYS = [500, 1500]; // ms before attempts 2 (single retry on top of initial)
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    // Fetch one chunk with retry-on-5xx / retry-on-non-JSON. Returns { ok, suggestions? , error? }.
    const fetchChunk = async (chunkTx) => {
      const payload = JSON.stringify({
        transactions: chunkTx.map(t => ({ description: t.description, amount: t.amount })),
        categories: categories.map(c => ({ id: c.id, name: c.name })),
      });
      let lastErr = 'unknown';
      let lastStatus = 0;
      // 2 attempts total: initial + 1 retry. Backoffs: 500ms before attempt 2.
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) await sleep(RETRY_DELAYS[attempt - 1] ?? 1500);
        let r;
        try {
          r = await fetch('/api/suggest-category', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
          });
        } catch (netErr) {
          lastErr = (netErr && netErr.message) || 'network error';
          lastStatus = 0;
          continue;
        }
        const ct = r.headers.get('content-type') || '';
        const isJson = ct.toLowerCase().includes('application/json');
        const rawText = await r.text();
        // Retry on 5xx or any non-JSON response (covers DO/Cloudflare HTML error pages).
        if (r.status >= 500 || !isJson) {
          lastStatus = r.status;
          const snippet = (rawText || '').trim().slice(0, 200);
          lastErr = isJson
            ? `HTTP ${r.status}`
            : `HTTP ${r.status}: ${snippet || r.statusText || 'non-JSON response'}`;
          continue;
        }
        let j;
        try { j = JSON.parse(rawText); } catch {
          lastStatus = r.status;
          lastErr = `HTTP ${r.status}: invalid JSON body`;
          continue;
        }
        if (!r.ok) {
          return { ok: false, error: `AI error (HTTP ${r.status}): ${j.error || 'unknown'}` };
        }
        const suggestions = j.suggestions;
        if (!Array.isArray(suggestions) || suggestions.length !== chunkTx.length) {
          return {
            ok: false,
            error: `AI returned ${Array.isArray(suggestions) ? suggestions.length : 0} suggestions for ${chunkTx.length} transactions`,
          };
        }
        return { ok: true, suggestions };
      }
      return { ok: false, error: `AI error (HTTP ${lastStatus || 'network'}): ${lastErr}` };
    };

    try {
      const chunks = [];
      for (let i = 0; i < uncat.length; i += CHUNK_SIZE) chunks.push(uncat.slice(i, i + CHUNK_SIZE));
      const totalChunks = chunks.length;
      let processedTx = 0;
      let totalApplied = 0;
      let totalSuggested = 0;
      let failedChunks = 0;
      let firstError = '';

      for (let ci = 0; ci < chunks.length; ci++) {
        const chunk = chunks[ci];
        setLearnStatus(`Asking Claude… (${Math.min(processedTx + chunk.length, uncat.length)}/${uncat.length})`);
        const res = await fetchChunk(chunk);
        if (!res.ok) {
          failedChunks++;
          if (!firstError) firstError = res.error || 'unknown';
          processedTx += chunk.length;
          continue;
        }
        const suggestions = res.suggestions;
        const learnQueue = [];
        let appliedThisChunk = 0;
        let suggestedThisChunk = 0;
        setTransactions(prev => {
          const monthTxs = (prev[currentMonth] || []).slice();
          for (let i = 0; i < chunk.length; i++) {
            const cat = suggestions[i];
            if (!cat || cat === 'uncategorized') continue;
            suggestedThisChunk++;
            const idx = monthTxs.findIndex(t => t.id === chunk[i].id);
            if (idx >= 0 && monthTxs[idx].category !== cat) {
              monthTxs[idx] = { ...monthTxs[idx], category: cat };
              appliedThisChunk++;
              learnQueue.push({ ...monthTxs[idx] });
            }
          }
          return { ...prev, [currentMonth]: monthTxs };
        });
        // Persist learned merchant -> category and apply retroactively across months.
        learnQueue.forEach(t => learnFromTx(t));
        totalApplied += appliedThisChunk;
        totalSuggested += suggestedThisChunk;
        processedTx += chunk.length;
      }

      if (failedChunks === totalChunks && totalChunks > 0) {
        setLearnStatus(firstError || 'AI request failed');
      } else if (failedChunks > 0) {
        setLearnStatus(`AI suggested ${totalApplied} categor${totalApplied === 1 ? 'y' : 'ies'} from ${uncat.length} transactions across ${totalChunks} chunks (${failedChunks} chunk${failedChunks === 1 ? '' : 's'} failed: ${firstError}).`);
      } else {
        setLearnStatus(`AI suggested ${totalApplied} categor${totalApplied === 1 ? 'y' : 'ies'} from ${uncat.length} transactions across ${totalChunks} chunk${totalChunks === 1 ? '' : 's'}. Review and override any that look wrong — your overrides become new rules.`);
      }
    } catch (e) {
      setLearnStatus(`AI request failed: ${(e && e.message) || 'unknown'}`);
    } finally {
      setSuggesting(false);
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    setParsing(true);
    setImportStatus('');
    setLoadedFileName(null);
    setPendingFile(null);
    const name = (file.name || '').toLowerCase();
    const looksText = /\.(csv|tsv|txt)$/.test(name) || (file.type || '').startsWith('text/');
    const ext = (name.match(/\.([a-z0-9]+)$/) || [, ''])[1];
    const kind = ext === 'pdf' ? 'pdf' : (ext === 'tsv' ? 'tsv' : (ext === 'txt' ? 'txt' : 'csv'));
    try {
      if (looksText && file.size < 2 * 1024 * 1024) {
        const text = await file.text();
        setImportText(text);
        setLoadedFileName(file.name);
        setPendingFile({ name: file.name, size: file.size, kind });
        setImportStatus(`Loaded ${file.name} (${(file.size/1024).toFixed(1)} KB). Review below, then Import.`);
      } else {
        const fd = new FormData();
        fd.append('file', file);
        const r = await fetch('/api/parse-statement', { method: 'POST', body: fd });
        const j = await r.json();
        if (!r.ok) { setImportStatus(j.error || 'Failed to parse file'); return; }
        setImportText(j.text);
        setLoadedFileName(file.name);
        setPendingFile({ name: file.name, size: file.size, kind });
        const detail = j.kind === 'pdf' ? `${j.pages} pages` : `${((j.text || '').length/1024).toFixed(1)} KB text`;
        setImportStatus(`Loaded ${file.name} (${detail}). Review below, then Import.`);
      }
    } catch (e) {
      setImportStatus(`Upload failed: ${(e && e.message) || 'unknown error'}`);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = () => {
    const parsed = parseStatementText(importText);
    if (parsed.tx.length === 0) {
      setImportStatus(parsed.error || 'No transactions detected. Check format or try a different file.');
      return;
    }
    const convention = detectSignConvention(parsed.tx);
    const stamp = Date.now();
    const newTx = parsed.tx.map((p, idx) => {
      const learnedClass = lookupLearnedClass(p.description);
      return {
        id: `${currentMonth}-${stamp}-${idx}`,
        date: p.date,
        description: p.description,
        amount: p.amount,
        category: autoCategorize(p.description),
        classification: learnedClass || classifyAmount(p.amount, p.description, convention),
      };
    });

    setTransactions(prev => ({
      ...prev,
      [currentMonth]: [...(prev[currentMonth] || []), ...newTx],
    }));

    // Record an import-log entry. Account is whatever was picked; if blank,
    // we still log it so the user can see the history (the checklist just won't tick).
    const sumAmounts = newTx.reduce((s, t) => s + t.amount, 0);
    const logEntry = {
      id: `log-${stamp}`,
      timestamp: stamp,
      fileName: pendingFile ? pendingFile.name : (loadedFileName || 'pasted text'),
      fileSize: pendingFile ? pendingFile.size : 0,
      kind: pendingFile ? pendingFile.kind : 'paste',
      accountId: importAccountId || '',
      monthKey: currentMonth,
      txCount: newTx.length,
      skippedCount: parsed.skipped || 0,
      sumAmounts,
      convention,
      txIds: newTx.map(t => t.id),
    };
    setImportLog(prev => [logEntry, ...prev]);

    const acctName = (settings.accounts || []).find(a => a.id === importAccountId)?.name;
    const acctNote = acctName ? ` from ${acctName}` : '';
    const kind = convention === 'credit-card' ? 'credit-card export' : 'bank export';
    setImportStatus(`Imported ${newTx.length} transactions${parsed.skipped ? `, skipped ${parsed.skipped}` : ''}${acctNote}. Detected ${kind}; review in Transactions.`);
    setImportText('');
    setLoadedFileName(null);
    setPendingFile(null);
  };

  // ============ TX OPERATIONS ============
  const updateTx = (id, updates) => {
    setTransactions(prev => ({
      ...prev,
      [currentMonth]: (prev[currentMonth] || []).map(t => t.id === id ? { ...t, ...updates } : t),
    }));
  };

  const learnFromTx = (tx) => {
    const key = merchantKey(tx.description);
    if (!key) return;
    const hasCategory = tx.category && tx.category !== 'uncategorized';
    const hasClass = !!tx.classification;
    if (!hasCategory && !hasClass) return;

    setRules(prev => {
      const idx = prev.findIndex(r => (r.merchant || '').toLowerCase() === key);
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = {
          ...prev[idx],
          category: hasCategory ? tx.category : prev[idx].category,
          classification: hasClass ? tx.classification : prev[idx].classification,
        };
        return next;
      }
      return [...prev, {
        merchant: key,
        category: hasCategory ? tx.category : 'uncategorized',
        ...(hasClass ? { classification: tx.classification } : {}),
      }];
    });

    // Retroactive apply across every month, except the just-edited row.
    setTransactions(prev => {
      const next = {};
      let updated = 0;
      for (const mk of Object.keys(prev)) {
        next[mk] = (prev[mk] || []).map(t => {
          if (t.id === tx.id) return t;
          const tKey = merchantKey(t.description);
          if (tKey !== key) return t;
          let patched = t;
          if (hasCategory && t.category !== tx.category) {
            patched = { ...patched, category: tx.category };
            updated++;
          }
          if (hasClass && t.classification !== tx.classification) {
            patched = { ...patched, classification: tx.classification };
            if (patched === t) updated++;
          }
          return patched;
        });
      }
      if (updated > 0) {
        setLearnStatus(`Applied ${hasCategory ? 'category' : ''}${hasCategory && hasClass ? ' + ' : ''}${hasClass ? 'class' : ''} to ${updated} matching transaction${updated === 1 ? '' : 's'}.`);
      }
      return next;
    });
  };

  const deleteTx = (id) => {
    setTransactions(prev => ({
      ...prev,
      [currentMonth]: (prev[currentMonth] || []).filter(t => t.id !== id),
    }));
  };

  // ============ RENDER ============
  if (loading) {
    return <div style={{padding: 40, fontFamily: 'Georgia, serif', color: '#2a2520'}}>Loading…</div>;
  }

  return (
    <div style={styles.app}>
      <style>{globalCss}</style>

      {/* HEADER */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.brandTitle}>Ledger</h1>
          <div style={styles.brandKicker}>Personal Financial Operations</div>
        </div>
        <div style={styles.monthPicker}>
          <button style={styles.iconBtn} onClick={() => {
            const [y, m] = currentMonth.split('-').map(Number);
            const d = new Date(y, m - 2, 1);
            setCurrentMonth(monthKey(d));
          }}>‹</button>
          <div style={styles.monthLabel}>{monthLabel(currentMonth)}</div>
          <button style={styles.iconBtn} onClick={() => {
            const [y, m] = currentMonth.split('-').map(Number);
            const d = new Date(y, m, 1);
            setCurrentMonth(monthKey(d));
          }}>›</button>
        </div>
      </header>

      {/* NAV */}
      <nav style={styles.nav}>
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'import', label: 'Import' },
          { id: 'transactions', label: `Transactions ${monthTx.length ? `(${monthTx.length})` : ''}` },
          { id: 'categories', label: 'Categories & Targets' },
          { id: 'settings', label: 'Settings' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            style={{...styles.navBtn, ...(view === item.id ? styles.navBtnActive : {})}}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main style={styles.main}>

      {/* ============ DASHBOARD ============ */}
      {view === 'dashboard' && (
        <div>
          {/* Personal ↔ Business & Transfers toggle */}
          <div style={styles.segmentRow}>
            <button
              style={{ ...styles.segmentBtn, ...(dashboardView === 'personal' ? styles.segmentBtnActive : {}) }}
              onClick={() => setDashboardView('personal')}
            >Personal P&L</button>
            <button
              style={{ ...styles.segmentBtn, ...(dashboardView === 'business-transfers' ? styles.segmentBtnActive : {}) }}
              onClick={() => setDashboardView('business-transfers')}
            >Business &amp; Transfers</button>
          </div>

          {dashboardView === 'personal' && (
          <>
          {/* Top status strip — cushion + monthly snapshot */}
          <section style={styles.statusStrip}>
            <div style={styles.statusCard}>
              <div style={styles.statusLabel}>Cash Cushion</div>
              <div style={styles.statusBig}>{fmt(settings.cushionCurrent)}</div>
              <div style={styles.statusSub}>
                of {fmt(settings.cushionTarget)} target
                {settings.cushionTarget > 0 && ` · ${cushionPctOfTarget.toFixed(0)}%`}
              </div>
              <div style={styles.progressBar}>
                <div style={{...styles.progressFill, width: `${Math.min(100, cushionPctOfTarget)}%`, background: cushionPctOfTarget >= 100 ? '#3d6b3d' : cushionPctOfTarget >= 50 ? '#b8862c' : '#a04030'}} />
              </div>
            </div>

            <div style={styles.statusCard}>
              <div style={styles.statusLabel}>Runway at Floor Budget</div>
              <div style={styles.statusBig}>{runwayMonths.toFixed(1)} <span style={{fontSize: 18, fontWeight: 400, color: '#857969'}}>months</span></div>
              <div style={styles.statusSub}>
                Floor: {fmt(floorBudget)}/mo
                {settings.newportActive && ' · incl. Newport'}
              </div>
            </div>

            <div style={styles.statusCard}>
              <div style={styles.statusLabel}>This Month — Net Flow</div>
              <div style={{...styles.statusBig, color: netCashflow >= 0 ? '#3d6b3d' : '#a04030'}}>
                {netCashflow >= 0 ? '+' : ''}{fmt(netCashflow)}
              </div>
              <div style={styles.statusSub}>
                Spendable {fmt(spendableIncome)} − Spend {fmt(totalSpend)}
              </div>
            </div>
          </section>

          {/* Income input */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Income — {monthLabel(currentMonth)}</h2>
            <div style={styles.incomeRow}>
              <div style={styles.incomeField}>
                <label style={styles.fieldLabel}>Gross Income This Month</label>
                <input
                  type="number"
                  value={monthIncome || ''}
                  onChange={e => setIncome(prev => ({ ...prev, [currentMonth]: parseFloat(e.target.value) || 0 }))}
                  style={styles.bigInput}
                  placeholder="0"
                />
              </div>
              <div style={styles.incomeStats}>
                <div style={styles.incomeStat}>
                  <span style={styles.fieldLabel}>Tax reserve ({settings.taxSetasidePct}%)</span>
                  <span style={styles.incomeStatVal}>−{fmt(taxReserve)}</span>
                </div>
                <div style={styles.incomeStat}>
                  <span style={styles.fieldLabel}>Spendable</span>
                  <span style={{...styles.incomeStatVal, fontWeight: 600, color: '#2a2520'}}>{fmt(spendableIncome)}</span>
                </div>
              </div>
            </div>
            <div style={styles.helperText}>
              Distributions, reimbursements, bonuses — anything that lands in personal accounts. Quarterly estimated taxes are reserved off the top.
            </div>
          </section>

          {/* Alerts */}
          {(totalUnclassified > 0 || totalUncategorized > 0) && (
            <section style={styles.alertSection}>
              {totalUnclassified > 0 && (
                <div style={styles.alert}>
                  <strong>{totalUnclassified}</strong> transactions need personal/business classification.
                  <button style={styles.alertBtn} onClick={() => setView('transactions')}>Review →</button>
                </div>
              )}
              {totalUncategorized > 0 && (
                <div style={styles.alert}>
                  <strong>{totalUncategorized}</strong> personal transactions are uncategorized.
                  <button style={styles.alertBtn} onClick={() => setView('transactions')}>Review →</button>
                </div>
              )}
            </section>
          )}

          {/* Category breakdown */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Spend by Category</h2>
            {personalTx.length === 0 ? (
              <div style={styles.emptyState}>
                No personal transactions yet for this month. <button style={styles.linkBtn} onClick={() => setView('import')}>Import statements →</button>
              </div>
            ) : (
              <div style={styles.catTable}>
                <div style={styles.catTableHeader}>
                  <div>Category</div>
                  <div style={{textAlign: 'right'}}>Spend</div>
                  <div style={{textAlign: 'right'}}>Floor</div>
                  <div style={{textAlign: 'right'}}>Stretch</div>
                  <div style={{textAlign: 'right'}}>vs. Floor</div>
                </div>
                {categories
                  .filter(c => spendByCategory[c.id] > 0 || c.floor > 0 || c.stretch > 0)
                  .filter(c => settings.newportActive || !c.future)
                  .sort((a, b) => (spendByCategory[b.id] || 0) - (spendByCategory[a.id] || 0))
                  .map(c => {
                    const spend = spendByCategory[c.id] || 0;
                    const vsFloor = c.floor > 0 ? spend - c.floor : null;
                    return (
                      <div key={c.id} style={styles.catRow}>
                        <div>
                          <span style={c.discretionary ? styles.catDotDisc : styles.catDotEss} />
                          {c.name}
                          {c.future && <span style={styles.futureBadge}>FUTURE</span>}
                        </div>
                        <div style={{textAlign: 'right', fontWeight: 600}}>{fmt(spend)}</div>
                        <div style={{textAlign: 'right', color: '#857969'}}>{c.floor ? fmt(c.floor) : '—'}</div>
                        <div style={{textAlign: 'right', color: '#857969'}}>{c.stretch ? fmt(c.stretch) : '—'}</div>
                        <div style={{textAlign: 'right', color: vsFloor === null ? '#857969' : vsFloor > 0 ? '#a04030' : '#3d6b3d'}}>
                          {vsFloor === null ? '—' : (vsFloor > 0 ? '+' : '') + fmt(vsFloor)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
            <div style={styles.helperText}>
              <span style={styles.catDotEss} /> Essential (floor budget)  ·  <span style={styles.catDotDisc} /> Discretionary (cuttable)
            </div>
          </section>

          {/* Monthly close ritual */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Monthly Close — 4 Steps</h2>
            <div style={styles.checklist}>
              {[
                { done: monthIncome > 0, label: 'Enter income for the month' },
                { done: monthTx.length > 0, label: 'Import statements (Import tab)' },
                { done: totalUnclassified === 0 && monthTx.length > 0, label: 'Mark personal vs. business on every transaction' },
                { done: totalUncategorized === 0 && personalTx.length > 0, label: 'Categorize every personal transaction' },
              ].map((step, i) => (
                <div key={i} style={{...styles.checkItem, opacity: step.done ? 0.55 : 1}}>
                  <span style={{...styles.checkBox, ...(step.done ? styles.checkBoxDone : {})}}>{step.done ? '✓' : i + 1}</span>
                  <span style={step.done ? {textDecoration: 'line-through'} : {}}>{step.label}</span>
                </div>
              ))}
            </div>
          </section>

          {(() => {
            const cached = insightsByMonth[currentMonth];
            return (
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>AI Insights — what to cut, what to keep</h2>
                {!cached ? (
                  <>
                    <div style={styles.helperText}>
                      Get Claude's read on this month's spend against your floor and stretch.
                    </div>
                    <button style={styles.primaryBtn} onClick={getInsights} disabled={generatingInsights}>
                      {generatingInsights ? 'Asking Claude…' : '✨ Generate insights for this month'}
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
                      <span style={{color: colors.muted, fontSize: 12}}>
                        Generated {new Date(cached.generatedAt).toLocaleString()}
                      </span>
                      <button style={styles.linkBtn} onClick={getInsights} disabled={generatingInsights}>
                        {generatingInsights ? 'Refreshing…' : '↻ Refresh'}
                      </button>
                    </div>
                    {(!cached.insights || cached.insights.length === 0) ? (
                      <div style={styles.emptyState}>No insights returned. Try again.</div>
                    ) : (
                      <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                        {cached.insights.map((ins, i) => {
                          const sev = (ins.severity || 'medium').toLowerCase();
                          const variant = sev === 'high' ? styles.insightHigh : (sev === 'low' ? styles.insightLow : styles.insightMedium);
                          const catName = (categories.find(c => c.id === ins.category)?.name) || ins.category;
                          return (
                            <div key={i} style={{...styles.insightCard, ...variant}}>
                              <div style={styles.insightMeta}>
                                <span style={{fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5}}>{sev}</span>
                                {ins.action && <span style={{textTransform: 'capitalize', fontSize: 12, opacity: 0.75}}>· {ins.action}</span>}
                                {catName && <span style={{fontSize: 12, opacity: 0.75}}>· {catName}</span>}
                              </div>
                              <div style={{fontSize: 14, lineHeight: 1.5}}>{ins.message}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
                {insightsError && <div style={styles.statusMsgError}>{insightsError}</div>}
              </section>
            );
          })()}
          </>
          )}

          {dashboardView === 'business-transfers' && (() => {
            const incomeTx = monthTx.filter(t => t.classification === 'income');
            const businessTx = monthTx.filter(t => t.classification === 'business');
            const transferTx = monthTx.filter(t => t.classification === 'transfer');
            const sum = (xs) => xs.reduce((s, t) => s + t.amount, 0);
            const incomeTotal = sum(incomeTx);
            const businessTotal = sum(businessTx);
            const transferTotal = sum(transferTx);
            const businessByCat = {};
            businessTx.forEach(t => {
              const k = t.category || 'uncategorized';
              if (!businessByCat[k]) businessByCat[k] = { tx: [], total: 0 };
              businessByCat[k].tx.push(t);
              businessByCat[k].total += t.amount;
            });
            const catName = (id) => (categories.find(c => c.id === id)?.name) || id;

            return (
              <>
                <section style={styles.statusStrip}>
                  <div style={styles.statusCard}>
                    <div style={styles.statusLabel}>Income</div>
                    <div style={styles.statusBig}>{fmt(incomeTotal)}</div>
                    <div style={styles.statusSub}>{incomeTx.length} {incomeTx.length === 1 ? 'entry' : 'entries'}</div>
                  </div>
                  <div style={styles.statusCard}>
                    <div style={styles.statusLabel}>Business Expenses</div>
                    <div style={styles.statusBig}>{fmt(Math.abs(businessTotal))}</div>
                    <div style={styles.statusSub}>{businessTx.length} {businessTx.length === 1 ? 'entry' : 'entries'}</div>
                  </div>
                  <div style={styles.statusCard}>
                    <div style={styles.statusLabel}>Transfers</div>
                    <div style={styles.statusBig}>{fmt(Math.abs(transferTotal))}</div>
                    <div style={styles.statusSub}>{transferTx.length} {transferTx.length === 1 ? 'entry' : 'entries'}</div>
                  </div>
                </section>

                <section style={styles.section}>
                  <h2 style={styles.sectionTitle}>Income — {monthLabel(currentMonth)}</h2>
                  {incomeTx.length === 0 ? (
                    <div style={styles.emptyState}>No income recorded this month.</div>
                  ) : (
                    <div style={styles.btTable}>
                      {incomeTx.map(t => (
                        <div key={t.id} style={styles.btRow}>
                          <div style={{flex: '0 0 110px', color: colors.muted}}>{t.date}</div>
                          <div style={{flex: 1}}>{t.description}</div>
                          <div style={{flex: '0 0 110px', textAlign: 'right', color: colors.green, fontWeight: 600}}>{fmtCents(t.amount)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section style={styles.section}>
                  <h2 style={styles.sectionTitle}>Business Expenses — {monthLabel(currentMonth)}</h2>
                  {businessTx.length === 0 ? (
                    <div style={styles.emptyState}>No business expenses recorded this month.</div>
                  ) : (
                    Object.entries(businessByCat).map(([catId, group]) => {
                      const { tx, total } = group as { tx: any[]; total: number };
                      return (
                      <div key={catId} style={{marginBottom: 18}}>
                        <div style={styles.btCatHeader}>
                          <span style={{fontWeight: 600}}>{catName(catId)}</span>
                          <span style={{color: colors.muted}}>{tx.length} {tx.length === 1 ? 'entry' : 'entries'}</span>
                          <span style={{marginLeft: 'auto', fontWeight: 600}}>{fmtCents(Math.abs(total))}</span>
                        </div>
                        <div style={styles.btTable}>
                          {tx.map(t => (
                            <div key={t.id} style={styles.btRow}>
                              <div style={{flex: '0 0 110px', color: colors.muted}}>{t.date}</div>
                              <div style={{flex: 1}}>{t.description}</div>
                              <div style={{flex: '0 0 110px', textAlign: 'right'}}>{fmtCents(t.amount)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                    })
                  )}
                </section>

                <section style={styles.section}>
                  <h2 style={styles.sectionTitle}>Transfers — {monthLabel(currentMonth)}</h2>
                  {transferTx.length === 0 ? (
                    <div style={styles.emptyState}>No transfers recorded this month.</div>
                  ) : (
                    <div style={styles.btTable}>
                      {transferTx.map(t => (
                        <div key={t.id} style={styles.btRow}>
                          <div style={{flex: '0 0 110px', color: colors.muted}}>{t.date}</div>
                          <div style={{flex: 1}}>{t.description}</div>
                          <div style={{flex: '0 0 110px', textAlign: 'right'}}>{fmtCents(t.amount)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            );
          })()}
        </div>
      )}

      {/* ============ IMPORT ============ */}
      {view === 'import' && (
        <div>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Import Transactions for {monthLabel(currentMonth)}</h2>
            <div style={styles.helperText}>
              Drop a <strong>CSV, TSV, TXT, or PDF</strong> statement onto the box below, or click to choose a file.
              Columns and delimiter are auto-detected. You can also paste rows directly into the textarea.
              Negative amounts are spend; positive amounts are flagged as <strong>transfers</strong> for review.
            </div>

            <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10}}>
              <label style={{...styles.fieldLabel, marginBottom: 0}}>Account:</label>
              <select
                value={importAccountId}
                onChange={e => setImportAccountId(e.target.value)}
                style={{...styles.selectSm, minWidth: 220}}
              >
                <option value="">— pick an account —</option>
                {(settings.accounts || []).map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                ))}
              </select>
              {(settings.accounts || []).length === 0 && (
                <button style={styles.linkBtn} onClick={() => setView('settings')}>+ Add one in Settings</button>
              )}
            </div>

            <div
              style={{
                ...styles.dropzone,
                ...(isDragging ? styles.dropzoneActive : {}),
                ...(parsing ? styles.dropzoneBusy : {}),
              }}
              onDragOver={e => { e.preventDefault(); if (!isDragging) setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => {
                e.preventDefault();
                setIsDragging(false);
                const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              onClick={() => {
                const el = document.getElementById('statementFile');
                if (el) el.click();
              }}
            >
              <input
                id="statementFile"
                type="file"
                accept=".csv,.tsv,.txt,.pdf,text/csv,text/plain,text/tab-separated-values,application/pdf"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files && e.target.files[0];
                  if (f) handleFile(f);
                  e.currentTarget.value = '';
                }}
              />
              {parsing
                ? 'Parsing file…'
                : loadedFileName
                  ? `Loaded: ${loadedFileName} — drop another to replace`
                  : 'Drag a CSV / TSV / TXT / PDF here, or click to choose a file'}
            </div>

            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder={`Or paste rows here:\n12/03/2025, WHOLE FOODS MARKET, -187.43\n12/04/2025, "SHELL OIL 12345", -62.10\n12/05/2025, AUTOPLICITY DIST, 45000.00`}
              style={styles.textarea}
              rows={10}
            />
            <div style={styles.btnRow}>
              <button style={styles.primaryBtn} onClick={handleImport} disabled={parsing}>Import & Auto-Categorize</button>
              <button style={styles.secondaryBtn} onClick={() => { setImportText(''); setLoadedFileName(null); setImportStatus(''); }}>Clear</button>
            </div>
            {importStatus && (
              <div style={/^(no transactions|upload failed|failed to|unsupported|file too large)/i.test(importStatus) ? styles.statusMsgError : styles.statusMsg}>{importStatus}</div>
            )}
          </section>

          {(settings.accounts || []).length > 0 && (() => {
            const accts = settings.accounts || [];
            const importedAccountIds = new Set(
              importLog.filter(e => e.monthKey === currentMonth && e.accountId).map(e => e.accountId)
            );
            const doneCount = accts.filter(a => importedAccountIds.has(a.id)).length;
            return (
              <section style={styles.section}>
                <h3 style={styles.sectionTitle}>
                  Statements Expected — {monthLabel(currentMonth)} ({doneCount} of {accts.length} imported)
                </h3>
                <div style={styles.checklist}>
                  {accts.map((a) => {
                    const done = importedAccountIds.has(a.id);
                    return (
                      <div key={a.id} style={{...styles.checkItem, opacity: done ? 0.55 : 1}}>
                        <span style={{...styles.checkBox, ...(done ? styles.checkBoxDone : {})}}>{done ? '✓' : '○'}</span>
                        <span style={done ? {textDecoration: 'line-through'} : {}}>
                          {a.name} <span style={{color: colors.muted, fontSize: 12, textTransform: 'capitalize'}}>({a.type})</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })()}

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Learned Merchant Rules</h3>
            <div style={styles.helperText}>
              {rules.length === 0 ? 'No learned rules yet. As you correct categorizations, this list grows.' : `${rules.length} merchant patterns learned. These pre-fill on future imports.`}
            </div>
            {rules.length > 0 && (
              <div style={styles.rulesTable}>
                {rules.map((r, i) => (
                  <div key={i} style={styles.ruleRow}>
                    <span style={{flex: 1, fontFamily: 'monospace', fontSize: 13}}>{r.merchant}</span>
                    <span style={{flex: 1, color: '#857969'}}>→ {categories.find(c => c.id === r.category)?.name || r.category}</span>
                    <button style={styles.deleteBtn} onClick={() => setRules(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Import Log</h3>
            <div style={styles.helperText}>
              {importLog.length === 0
                ? 'No imports yet.'
                : `${importLog.length} imports recorded. Showing newest first.`}
            </div>
            {importLog.length > 0 && (
              <div style={styles.rulesTable}>
                <div style={{...styles.ruleRow, fontWeight: 600, color: colors.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4}}>
                  <span style={{flex: '0 0 110px'}}>Date</span>
                  <span style={{flex: '0 0 90px'}}>Month</span>
                  <span style={{flex: 1}}>Account / File</span>
                  <span style={{flex: '0 0 70px', textAlign: 'right'}}>Tx</span>
                  <span style={{flex: '0 0 110px', textAlign: 'right'}}>Total</span>
                  <span style={{flex: '0 0 130px', textAlign: 'right'}}>Actions</span>
                </div>
                {importLog.map((e, i) => {
                  const acctName = (settings.accounts || []).find(a => a.id === e.accountId)?.name;
                  return (
                    <div key={e.id || i} style={styles.ruleRow}>
                      <span style={{flex: '0 0 110px', color: colors.muted, fontSize: 12}}>{new Date(e.timestamp).toLocaleDateString()}</span>
                      <span style={{flex: '0 0 90px', color: colors.muted, fontSize: 12}}>{e.monthKey}</span>
                      <span style={{flex: 1, fontSize: 13}}>
                        <strong>{acctName || (e.accountId ? '(unknown account)' : 'Untagged')}</strong>
                        <span style={{color: colors.muted, marginLeft: 8}}>{e.fileName}</span>
                      </span>
                      <span style={{flex: '0 0 70px', textAlign: 'right', fontSize: 13}}>{e.txCount}{e.skippedCount ? ` (-${e.skippedCount})` : ''}</span>
                      <span style={{flex: '0 0 110px', textAlign: 'right', fontSize: 13, fontWeight: 500}}>{fmtCents(e.sumAmounts)}</span>
                      <span style={{flex: '0 0 130px', display: 'flex', gap: 6, justifyContent: 'flex-end'}}>
                        <button
                          style={styles.linkBtn}
                          title="Remove log entry only; keep transactions"
                          onClick={() => {
                            if (!confirm('Delete this import-log entry? Transactions themselves stay; only the log row is removed.')) return;
                            setImportLog(prev => prev.filter(x => x.id !== e.id));
                          }}
                        >Remove</button>
                        <button
                          style={{...styles.linkBtn, color: colors.red}}
                          title="Remove log entry AND delete the transactions it imported"
                          disabled={!Array.isArray(e.txIds) || e.txIds.length === 0}
                          onClick={() => {
                            const ids = Array.isArray(e.txIds) ? e.txIds : [];
                            if (ids.length === 0) return;
                            if (!confirm(`Delete this import-log entry AND remove the ${ids.length} transaction${ids.length === 1 ? '' : 's'} it imported? This cannot be undone.`)) return;
                            const idSet = new Set(ids);
                            setTransactions(prev => {
                              const next = { ...prev };
                              const list = (next[e.monthKey] || []).filter(t => !idSet.has(t.id));
                              if (list.length === 0) delete next[e.monthKey]; else next[e.monthKey] = list;
                              return next;
                            });
                            setImportLog(prev => prev.filter(x => x.id !== e.id));
                          }}
                        >Remove + tx</button>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ============ TRANSACTIONS ============ */}
      {view === 'transactions' && (
        <div>
          {learnStatus && <div style={styles.learnToast}>{learnStatus}</div>}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Transactions — {monthLabel(currentMonth)}</h2>
            {monthTx.length === 0 ? (
              <div style={styles.emptyState}>No transactions yet. <button style={styles.linkBtn} onClick={() => setView('import')}>Import →</button></div>
            ) : (
              <>
                {(() => {
                  const uncatCount = monthTx.filter(t => !t.category || t.category === 'uncategorized').length;
                  if (uncatCount === 0) return null;
                  return (
                    <div style={styles.aiBar}>
                      <span>{uncatCount} transaction{uncatCount === 1 ? '' : 's'} need a category.</span>
                      <button
                        style={styles.primaryBtn}
                        onClick={suggestCategories}
                        disabled={suggesting}
                      >
                        {suggesting ? 'Asking Claude…' : `✨ Suggest with AI`}
                      </button>
                    </div>
                  );
                })()}
                <BulkActions
                  transactions={monthTx}
                  categories={categories}
                  onBulkUpdate={(filter, updates) => {
                    setTransactions(prev => ({
                      ...prev,
                      [currentMonth]: (prev[currentMonth] || []).map(t => filter(t) ? { ...t, ...updates } : t),
                    }));
                  }}
                />
                <div style={styles.txTable}>
                  <div style={styles.txHeader}>
                    <div style={{flex: '0 0 90px'}}>Date</div>
                    <div style={{flex: 2}}>Description</div>
                    <div style={{flex: '0 0 100px', textAlign: 'right'}}>Amount</div>
                    <div style={{flex: '0 0 130px'}}>Class</div>
                    <div style={{flex: '0 0 180px'}}>Category</div>
                    <div style={{flex: '0 0 30px'}}></div>
                  </div>
                  {monthTx.map(tx => (
                    <div key={tx.id} style={{
                      ...styles.txRow,
                      ...(tx.amount > 0 ? styles.txRowIncome : {}),
                      ...(!tx.classification ? styles.txRowFlag : {}),
                    }}>
                      <div style={{flex: '0 0 90px', fontSize: 13, color: '#857969'}}>{tx.date}</div>
                      <div style={{flex: 2, fontSize: 14}}>{tx.description}</div>
                      <div style={{flex: '0 0 100px', textAlign: 'right', fontWeight: 600, color: tx.amount > 0 ? '#3d6b3d' : '#2a2520'}}>
                        {tx.amount > 0 ? '+' : ''}{fmtCents(tx.amount)}
                      </div>
                      <div style={{flex: '0 0 130px'}}>
                        <select
                          value={tx.classification || ''}
                          onChange={e => {
                            const v = e.target.value;
                            updateTx(tx.id, { classification: v });
                            if (v) learnFromTx({ ...tx, classification: v });
                          }}
                          style={styles.selectSm}
                        >
                          <option value="">— select —</option>
                          <option value="personal">Personal</option>
                          <option value="business">Business</option>
                          <option value="transfer">Transfer</option>
                          <option value="income">Income</option>
                        </select>
                      </div>
                      <div style={{flex: '0 0 180px'}}>
                        <select
                          value={tx.category || 'uncategorized'}
                          onChange={e => {
                            updateTx(tx.id, { category: e.target.value });
                            learnFromTx({ ...tx, category: e.target.value });
                          }}
                          style={styles.selectSm}
                          disabled={tx.classification && tx.classification !== 'personal'}
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{flex: '0 0 30px'}}>
                        <button style={styles.deleteBtn} onClick={() => deleteTx(tx.id)}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* ============ CATEGORIES ============ */}
      {view === 'categories' && (
        <div>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Categories, Floor & Stretch Targets</h2>
            <div style={styles.helperText}>
              <strong>Floor</strong> = the budget you hold in low-income months. <strong>Stretch</strong> = the ceiling in good months. Mark <strong>Discretionary</strong> for anything you're willing to cut when below cushion target.
            </div>
            <div style={styles.summaryRow}>
              <div style={{padding: 16, borderRight: `1px solid ${colors.border}`}}><span style={styles.fieldLabel}>Floor budget total</span><div style={styles.summaryVal}>{fmt(floorBudget)}/mo</div></div>
              <div style={{padding: 16, borderRight: `1px solid ${colors.border}`}}><span style={styles.fieldLabel}>Stretch budget total</span><div style={styles.summaryVal}>{fmt(stretchBudget)}/mo</div></div>
              <div style={{padding: 16}}><span style={styles.fieldLabel}>Categories</span><div style={styles.summaryVal}>{categories.length}</div></div>
            </div>

            <div style={styles.catEditTable}>
              <div style={styles.catEditHeader}>
                <div style={{flex: 2}}>Category</div>
                <div style={{flex: '0 0 100px'}}>Discretionary</div>
                <div style={{flex: '0 0 120px'}}>Floor ($/mo)</div>
                <div style={{flex: '0 0 120px'}}>Stretch ($/mo)</div>
                <div style={{flex: '0 0 100px', textAlign: 'right'}}>6-mo avg</div>
                <div style={{flex: '0 0 30px'}}></div>
              </div>
              {categories.map((c, idx) => (
                <div key={c.id} style={styles.catEditRow}>
                  <div style={{flex: 2}}>
                    <input
                      value={c.name}
                      onChange={e => setCategories(prev => prev.map(cat => cat.id === c.id ? { ...cat, name: e.target.value } : cat))}
                      style={styles.inputInline}
                    />
                    {c.future && <span style={styles.futureBadge}>FUTURE</span>}
                  </div>
                  <div style={{flex: '0 0 100px'}}>
                    <input
                      type="checkbox"
                      checked={c.discretionary}
                      onChange={e => setCategories(prev => prev.map(cat => cat.id === c.id ? { ...cat, discretionary: e.target.checked } : cat))}
                    />
                  </div>
                  <div style={{flex: '0 0 120px'}}>
                    <input
                      type="number"
                      value={c.floor || ''}
                      onChange={e => setCategories(prev => prev.map(cat => cat.id === c.id ? { ...cat, floor: parseFloat(e.target.value) || 0 } : cat))}
                      style={styles.inputInline}
                      placeholder="0"
                    />
                  </div>
                  <div style={{flex: '0 0 120px'}}>
                    <input
                      type="number"
                      value={c.stretch || ''}
                      onChange={e => setCategories(prev => prev.map(cat => cat.id === c.id ? { ...cat, stretch: parseFloat(e.target.value) || 0 } : cat))}
                      style={styles.inputInline}
                      placeholder="0"
                    />
                  </div>
                  <div style={{flex: '0 0 100px', textAlign: 'right', fontSize: 13, color: '#857969'}}>
                    {trailingAvg[c.id] ? fmt(trailingAvg[c.id]) : '—'}
                  </div>
                  <div style={{flex: '0 0 30px'}}>
                    <button style={styles.deleteBtn} onClick={() => {
                      if (confirm(`Delete "${c.name}"? Transactions in this category will become Uncategorized.`)) {
                        setCategories(prev => prev.filter(cat => cat.id !== c.id));
                      }
                    }}>×</button>
                  </div>
                </div>
              ))}
            </div>

            <button style={styles.primaryBtn} onClick={() => {
              const name = prompt('New category name:');
              if (!name) return;
              const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
              setCategories(prev => [...prev, { id, name, discretionary: false, floor: 0, stretch: 0 }]);
            }}>+ Add Category</button>
          </section>
        </div>
      )}

      {/* ============ SETTINGS ============ */}
      {view === 'settings' && (
        <div>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Cash Cushion</h2>
            <div style={styles.helperText}>
              Your "sleep sound" number. Below the target, the system flags discretionary spend. Currently set as a fixed dollar figure per your preference.
            </div>
            <div style={styles.settingsGrid}>
              <div>
                <label style={styles.fieldLabel}>Target Cushion ($)</label>
                <input
                  type="number"
                  value={settings.cushionTarget || ''}
                  onChange={e => setSettings(prev => ({ ...prev, cushionTarget: parseFloat(e.target.value) || 0 }))}
                  style={styles.bigInput}
                  placeholder="e.g. 250000"
                />
              </div>
              <div>
                <label style={styles.fieldLabel}>Current Liquid Cash ($)</label>
                <input
                  type="number"
                  value={settings.cushionCurrent || ''}
                  onChange={e => setSettings(prev => ({ ...prev, cushionCurrent: parseFloat(e.target.value) || 0 }))}
                  style={styles.bigInput}
                  placeholder="e.g. 180000"
                />
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Tax Reserve</h2>
            <div style={styles.helperText}>
              Percentage of incoming distributions reserved for quarterly estimated taxes before "spendable income" is calculated.
            </div>
            <div style={styles.settingsGrid}>
              <div>
                <label style={styles.fieldLabel}>Tax setaside %</label>
                <input
                  type="number"
                  value={settings.taxSetasidePct}
                  onChange={e => setSettings(prev => ({ ...prev, taxSetasidePct: parseFloat(e.target.value) || 0 }))}
                  style={styles.bigInput}
                />
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Accounts</h2>
            <div style={styles.helperText}>
              List the bank and credit-card accounts you use. The Import view will use these for the per-month statement checklist and to tag each upload.
            </div>
            {(settings.accounts || []).length === 0 ? (
              <div style={styles.emptyState}>No accounts yet. Add your first below.</div>
            ) : (
              <div style={styles.rulesTable}>
                {(settings.accounts || []).map((a) => (
                  <div key={a.id} style={styles.ruleRow}>
                    <span style={{flex: 1, fontWeight: 500}}>{a.name}</span>
                    <span style={{flex: '0 0 100px', color: colors.muted, textTransform: 'capitalize'}}>{a.type}</span>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => setSettings(prev => ({ ...prev, accounts: (prev.accounts || []).filter((x) => x.id !== a.id) }))}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{...styles.btnRow, marginTop: 14}}>
              <button style={styles.secondaryBtn} onClick={() => {
                const name = prompt('Account name (e.g. "Chase Sapphire", "BofA Checking"):');
                if (!name) return;
                const typeIn = prompt('Type — "bank" or "card":', 'card');
                const type = (typeIn || '').toLowerCase() === 'bank' ? 'bank' : 'card';
                const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
                setSettings(prev => ({ ...prev, accounts: [...(prev.accounts || []), { id, name, type }] }));
              }}>+ Add Account</button>
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Newport Beach</h2>
            <div style={styles.helperText}>
              Toggle this ON to fold Newport carrying costs into your floor budget and runway calculations. Set the Newport sub-line targets on the Categories tab.
            </div>
            <label style={styles.toggleRow}>
              <input
                type="checkbox"
                checked={settings.newportActive}
                onChange={e => setSettings(prev => ({ ...prev, newportActive: e.target.checked }))}
                style={{marginRight: 12}}
              />
              <span>Include Newport carrying costs in floor budget</span>
            </label>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Data</h2>
            <div style={styles.btnRow}>
              <button style={styles.secondaryBtn} onClick={() => {
                const data = { categories, rules, transactions, income, settings, exportedAt: new Date().toISOString() };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `ledger-backup-${monthKey(new Date())}.json`; a.click();
                URL.revokeObjectURL(url);
              }}>Export Backup (JSON)</button>
              <button style={styles.dangerBtn} onClick={() => {
                if (confirm('This deletes ALL transactions, rules, and settings. Are you sure?')) {
                  setCategories(DEFAULT_CATEGORIES);
                  setRules([]);
                  setTransactions({});
                  setIncome({});
                  setSettings({ cushionTarget: 0, cushionCurrent: 0, taxSetasidePct: 30, newportActive: false, accounts: [] });
                  setImportLog([]);
                }
              }}>Reset Everything</button>
            </div>
          </section>
        </div>
      )}

      </main>

      <footer style={styles.footer}>
        Data persists across sessions via this artifact's storage. Export a JSON backup before any major change.
      </footer>
    </div>
  );
}

// ============ BULK ACTIONS COMPONENT ============
function BulkActions({ transactions, categories, onBulkUpdate }) {
  const [showPanel, setShowPanel] = useState(false);
  const incomeCount = transactions.filter(t => t.amount > 0).length;
  const transferCount = transactions.filter(t => t.classification === 'transfer').length;

  return (
    <div style={styles.bulkPanel}>
      <button style={styles.bulkToggle} onClick={() => setShowPanel(!showPanel)}>
        Bulk Actions {showPanel ? '▾' : '▸'}
      </button>
      {showPanel && (
        <div style={styles.bulkActions}>
          <button style={styles.bulkBtn} onClick={() => onBulkUpdate(
            t => !t.classification,
            { classification: 'personal' }
          )}>Mark all unclassified → Personal</button>

          <button style={styles.bulkBtn} onClick={() => onBulkUpdate(
            t => t.amount > 0 && t.classification === 'transfer',
            { classification: 'income' }
          )}>Convert positive transfers → Income ({transferCount})</button>

          <button style={styles.bulkBtn} onClick={() => onBulkUpdate(
            t => t.amount > 0,
            { classification: 'transfer' }
          )}>Mark all positive → Transfer ({incomeCount})</button>
        </div>
      )}
    </div>
  );
}

// ============ STYLES ============
const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; background: #f7f8fa; }
  input:focus, select:focus, textarea:focus, button:focus {
    outline: 2px solid #0f4c75;
    outline-offset: 1px;
  }
  input, select, textarea, button {
    font-family: 'Inter', sans-serif;
  }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: #f7f8fa; }
  ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 5px; }
  ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
`;

const colors = {
  bg: '#f7f8fa',           // page background
  bgCard: '#ffffff',       // white cards
  bgSubtle: '#f9fafb',     // subtle gray (table headers, etc)
  border: '#e5e7eb',        // soft gray border
  borderStrong: '#d1d5db',  // stronger border
  text: '#111827',          // primary text
  textSecondary: '#374151',
  muted: '#6b7280',
  mutedLight: '#9ca3af',
  accent: '#0f4c75',        // deep navy
  accentLight: '#3282b8',
  green: '#059669',
  greenBg: '#ecfdf5',
  red: '#dc2626',
  redBg: '#fef2f2',
  amber: '#d97706',
  amberBg: '#fffbeb',
  ink: '#030712',
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    background: colors.bg,
    color: colors.text,
    fontFamily: "'Inter', sans-serif",
    paddingBottom: 60,
    fontSize: 14,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 32px',
    borderBottom: `1px solid ${colors.border}`,
    background: colors.bgCard,
  },
  brandKicker: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    fontWeight: 400,
  },
  brandTitle: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 22,
    margin: 0,
    fontWeight: 600,
    color: colors.ink,
    letterSpacing: '-0.01em',
  },
  monthPicker: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: colors.bgSubtle,
    padding: '4px',
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: 16,
    color: colors.muted,
    cursor: 'pointer',
    padding: '6px 10px',
    borderRadius: 6,
    transition: 'all 0.15s',
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: 500,
    minWidth: 160,
    textAlign: 'center',
    color: colors.text,
    padding: '0 8px',
  },
  nav: {
    display: 'flex',
    gap: 0,
    padding: '0 32px',
    borderBottom: `1px solid ${colors.border}`,
    background: colors.bgCard,
  },
  navBtn: {
    background: 'transparent',
    border: 'none',
    padding: '12px 16px',
    fontSize: 13,
    fontWeight: 500,
    color: colors.muted,
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.15s',
    marginBottom: -1,
  },
  navBtnActive: {
    color: colors.accent,
    borderBottom: `2px solid ${colors.accent}`,
    fontWeight: 600,
  },
  main: {
    padding: '24px 32px',
    maxWidth: 1400,
    margin: '0 auto',
  },
  statusStrip: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 16,
    marginBottom: 24,
  },
  statusCard: {
    background: colors.bgCard,
    padding: 20,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    position: 'relative',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: colors.muted,
    marginBottom: 8,
  },
  statusBig: {
    fontSize: 28,
    fontWeight: 600,
    color: colors.ink,
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
    marginBottom: 6,
    fontVariantNumeric: 'tabular-nums',
  },
  statusSub: {
    fontSize: 12,
    color: colors.muted,
  },
  progressBar: {
    marginTop: 14,
    height: 6,
    background: colors.bgSubtle,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.4s ease',
    borderRadius: 3,
  },
  section: {
    background: colors.bgCard,
    padding: 24,
    marginBottom: 16,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: colors.ink,
    marginTop: 0,
    marginBottom: 4,
    letterSpacing: '-0.01em',
  },
  helperText: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 1.5,
    marginBottom: 16,
    maxWidth: 720,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: 6,
  },
  bigInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 15,
    fontWeight: 500,
    background: colors.bgCard,
    border: `1px solid ${colors.borderStrong}`,
    color: colors.ink,
    borderRadius: 6,
    fontVariantNumeric: 'tabular-nums',
  },
  inputInline: {
    width: '100%',
    padding: '7px 10px',
    fontSize: 13,
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    color: colors.ink,
    borderRadius: 6,
    fontVariantNumeric: 'tabular-nums',
  },
  selectSm: {
    width: '100%',
    padding: '6px 8px',
    fontSize: 13,
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    color: colors.text,
    cursor: 'pointer',
  },
  incomeRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
    alignItems: 'end',
  },
  incomeField: {},
  incomeStats: {
    background: colors.bgSubtle,
    padding: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
  },
  incomeStat: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0',
  },
  incomeStatVal: {
    fontSize: 14,
    fontWeight: 500,
    color: colors.text,
    fontVariantNumeric: 'tabular-nums',
  },
  alertSection: {
    marginBottom: 16,
  },
  alert: {
    background: colors.amberBg,
    border: `1px solid #fcd34d`,
    padding: '12px 16px',
    marginBottom: 8,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 13,
    color: '#92400e',
  },
  alertBtn: {
    background: colors.amber,
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: 6,
  },
  catTable: {
    border: `1px solid ${colors.border}`,
    background: colors.bgCard,
    borderRadius: 8,
    overflow: 'hidden',
  },
  catTableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
    padding: '10px 16px',
    background: colors.bgSubtle,
    borderBottom: `1px solid ${colors.border}`,
    fontSize: 11,
    fontWeight: 600,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  catRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
    padding: '12px 16px',
    borderBottom: `1px solid ${colors.border}`,
    fontSize: 14,
    alignItems: 'center',
    fontVariantNumeric: 'tabular-nums',
  },
  catDotEss: {
    display: 'inline-block',
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: colors.green,
    marginRight: 10,
    verticalAlign: 'middle',
  },
  catDotDisc: {
    display: 'inline-block',
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: colors.amber,
    marginRight: 10,
    verticalAlign: 'middle',
  },
  futureBadge: {
    marginLeft: 8,
    fontSize: 9,
    fontWeight: 600,
    background: colors.accent,
    color: '#fff',
    padding: '2px 6px',
    letterSpacing: '0.05em',
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  checklist: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  checkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 14,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    border: `1.5px solid ${colors.borderStrong}`,
    background: colors.bgCard,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 600,
    color: colors.mutedLight,
  },
  checkBoxDone: {
    background: colors.green,
    color: '#fff',
    border: `1.5px solid ${colors.green}`,
  },
  textarea: {
    width: '100%',
    padding: 12,
    fontSize: 13,
    fontFamily: "'JetBrains Mono', monospace",
    background: colors.bgCard,
    border: `1px solid ${colors.borderStrong}`,
    color: colors.ink,
    borderRadius: 8,
    resize: 'vertical',
    lineHeight: 1.5,
  },
  dropzone: {
    width: '100%',
    padding: '28px 16px',
    marginBottom: 14,
    border: `2px dashed ${colors.borderStrong}`,
    borderRadius: 10,
    background: colors.bgSubtle,
    color: colors.muted,
    textAlign: 'center',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    transition: 'background 120ms, border-color 120ms, color 120ms',
    userSelect: 'none',
  },
  dropzoneActive: {
    background: '#eef4fb',
    borderColor: colors.accentLight,
    color: colors.accent,
  },
  dropzoneBusy: {
    cursor: 'progress',
    opacity: 0.7,
  },
  btnRow: {
    display: 'flex',
    gap: 8,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    background: colors.accent,
    color: '#fff',
    border: 'none',
    padding: '9px 16px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: 6,
    transition: 'all 0.15s',
  },
  secondaryBtn: {
    background: colors.bgCard,
    color: colors.text,
    border: `1px solid ${colors.borderStrong}`,
    padding: '9px 16px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: 6,
  },
  dangerBtn: {
    background: colors.bgCard,
    color: colors.red,
    border: `1px solid ${colors.red}`,
    padding: '9px 16px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: 6,
  },
  statusMsg: {
    marginTop: 14,
    padding: 12,
    background: colors.greenBg,
    border: `1px solid #a7f3d0`,
    color: '#065f46',
    fontSize: 13,
    borderRadius: 8,
  },
  statusMsgError: {
    marginTop: 14,
    padding: 12,
    background: colors.redBg,
    border: `1px solid #fecaca`,
    color: colors.red,
    fontSize: 13,
    borderRadius: 8,
  },
  learnToast: {
    margin: '0 0 16px',
    padding: '10px 14px',
    background: '#eef4fb',
    border: `1px solid ${colors.accentLight}`,
    color: colors.accent,
    fontSize: 13,
    borderRadius: 8,
    fontWeight: 500,
  },
  insightCard: {
    padding: '12px 14px',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: colors.bgCard,
  },
  insightMeta: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 6,
  },
  insightHigh: {
    background: colors.redBg,
    borderColor: '#fecaca',
    color: colors.red,
  },
  insightMedium: {
    background: colors.amberBg,
    borderColor: '#fcd34d',
    color: colors.amber,
  },
  insightLow: {
    background: colors.greenBg,
    borderColor: '#a7f3d0',
    color: '#065f46',
  },
  segmentRow: {
    display: 'flex',
    gap: 4,
    marginBottom: 16,
    padding: 4,
    background: colors.bgSubtle,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    width: 'fit-content',
  },
  segmentBtn: {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    border: 'none',
    background: 'transparent',
    color: colors.muted,
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'background 120ms, color 120ms',
  },
  segmentBtnActive: {
    background: colors.bgCard,
    color: colors.text,
    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    fontWeight: 600,
  },
  btTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  btRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 12px',
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    fontSize: 13,
  },
  btCatHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    background: colors.bgSubtle,
    borderRadius: 6,
    marginBottom: 4,
    fontSize: 13,
  },
  aiBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
    padding: '10px 14px',
    background: colors.amberBg,
    border: `1px solid #fcd34d`,
    color: colors.amber,
    fontSize: 13,
    borderRadius: 8,
    fontWeight: 500,
  },
  emptyState: {
    padding: 40,
    textAlign: 'center',
    color: colors.muted,
    background: colors.bgSubtle,
    border: `1px dashed ${colors.border}`,
    borderRadius: 8,
    fontSize: 14,
  },
  linkBtn: {
    background: 'transparent',
    border: 'none',
    color: colors.accent,
    cursor: 'pointer',
    fontSize: 14,
    textDecoration: 'underline',
    padding: 0,
  },
  rulesTable: {
    border: `1px solid ${colors.border}`,
    background: colors.bgCard,
    borderRadius: 8,
    overflow: 'hidden',
  },
  ruleRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 14px',
    borderBottom: `1px solid ${colors.border}`,
    fontSize: 13,
  },
  txTable: {
    border: `1px solid ${colors.border}`,
    background: colors.bgCard,
    overflowX: 'auto',
    borderRadius: 8,
  },
  txHeader: {
    display: 'flex',
    padding: '10px 14px',
    background: colors.bgSubtle,
    borderBottom: `1px solid ${colors.border}`,
    fontSize: 11,
    fontWeight: 600,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    gap: 10,
    minWidth: 800,
  },
  txRow: {
    display: 'flex',
    padding: '8px 14px',
    borderBottom: `1px solid ${colors.border}`,
    alignItems: 'center',
    gap: 10,
    minWidth: 800,
    fontVariantNumeric: 'tabular-nums',
  },
  txRowIncome: {
    background: colors.greenBg,
  },
  txRowFlag: {
    background: colors.amberBg,
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    color: colors.mutedLight,
    cursor: 'pointer',
    fontSize: 16,
    padding: '4px 8px',
    borderRadius: 4,
    lineHeight: 1,
  },
  catEditTable: {
    border: `1px solid ${colors.border}`,
    background: colors.bgCard,
    marginBottom: 14,
    borderRadius: 8,
    overflow: 'hidden',
  },
  catEditHeader: {
    display: 'flex',
    padding: '10px 14px',
    background: colors.bgSubtle,
    borderBottom: `1px solid ${colors.border}`,
    fontSize: 11,
    fontWeight: 600,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    gap: 10,
  },
  catEditRow: {
    display: 'flex',
    padding: '8px 14px',
    borderBottom: `1px solid ${colors.border}`,
    alignItems: 'center',
    gap: 10,
  },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 0,
    padding: 0,
    background: colors.bgSubtle,
    border: `1px solid ${colors.border}`,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  summaryVal: {
    fontSize: 22,
    fontWeight: 600,
    color: colors.ink,
    marginTop: 4,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.01em',
  },
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 14,
    cursor: 'pointer',
    padding: '12px 14px',
    background: colors.bgSubtle,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
  },
  bulkPanel: {
    marginBottom: 14,
  },
  bulkToggle: {
    background: colors.bgCard,
    border: `1px solid ${colors.borderStrong}`,
    padding: '7px 14px',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    color: colors.text,
    borderRadius: 6,
  },
  bulkActions: {
    display: 'flex',
    gap: 6,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  bulkBtn: {
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    padding: '7px 12px',
    fontSize: 12,
    cursor: 'pointer',
    color: colors.text,
    borderRadius: 6,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.mutedLight,
    padding: '20px 32px',
  },
};
