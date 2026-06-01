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

  // Chase/Amex PDFs often emit "MERCHANT CA1.99" with the state code glued to the amount.
  // Peel a trailing dollar-amount off the last token after splitting so the normal
  // date+amount detector still works.
  const peelTrailingAmount = (parts) => {
    if (!parts || parts.length === 0) return parts;
    const last = String(parts[parts.length - 1] || '');
    const m = last.match(/^(.*?)(\(?-?[\$£€]?[\d,]+\.\d{2}\)?-?)$/);
    if (!m) return parts;
    const lead = m[1].trim();
    const amt = m[2];
    if (!lead) return parts;
    // Guard: lead must contain a letter so we don't split "12.341.99" into "12.34" + "1.99".
    if (!/[A-Za-z]/.test(lead)) return parts;
    return [...parts.slice(0, -1), lead, amt];
  };

  let startIdx = 0;
  const firstParts = peelTrailingAmount(splitter(lines[0]));
  const hasHeaderWord = firstParts.some(p => HEADER_TOKENS.test(p));
  const firstHasAmount = firstParts.some(p => !isNaN(parseAmount(p)) && /\d/.test(p));
  if (hasHeaderWord && !firstHasAmount) startIdx = 1;

  // TODO(H3): when header has both Withdrawal/Debit and Deposit/Credit, record
  // their column indices and negate the debit column instead of letting the
  // rightmost numeric win. Deferred for follow-up.

  // H1 fallback: peel a leading date + trailing amount out of a single line.
  // Used when the splitter leaves <2 parts or when date/amount detection fails.
  // `\s*` (not `\s+`) before the amount handles concatenated state-codes-then-amount.
  const tryRowFallback = (line) => {
    const m = line.match(/^(\d{1,4}[-\/.]\d{1,2}(?:[-\/.]\d{1,4})?)\s+(.*?)\s*(\(?[\$£€]?\-?[\d,]+\.\d{2}\)?\-?)$/);
    if (!m) return null;
    const amt = parseAmount(m[3]);
    const desc = m[2].trim();
    if (isNaN(amt) || !desc) return null;
    return { date: m[1], description: desc, amount: amt };
  };

  const tx = [];
  const skippedLines = [];
  const recordSkip = (lineNo, line, reason) => {
    const trimmed = String(line || '');
    skippedLines.push({
      lineNo,
      line: trimmed.length > 400 ? trimmed.slice(0, 397) + '…' : trimmed,
      reason,
    });
  };
  for (let i = startIdx; i < lines.length; i++) {
    let parts = peelTrailingAmount(splitter(lines[i]));
    if (parts.length < 2) {
      const row = tryRowFallback(lines[i]);
      if (row) { tx.push(row); continue; }
      recordSkip(i + 1, lines[i], 'too-few-columns');
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
      // Prefer the more informative reason: missing date is the common PDF-boilerplate case.
      recordSkip(i + 1, lines[i], dateIdx === -1 ? 'no-date' : 'no-amount');
      continue;
    }

    const descParts = [];
    for (let j = 0; j < parts.length; j++) {
      if (j !== dateIdx && j !== amountIdx) descParts.push(parts[j]);
    }
    const description = descParts.join(' ').replace(/\s+/g, ' ').trim();
    if (!description) { recordSkip(i + 1, lines[i], 'empty-description'); continue; }

    tx.push({ date: parts[dateIdx], description, amount: amountVal });
  }
  return { tx, skipped: skippedLines.length, skippedLines };
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
    appName: 'Ledger',
    theme: 'light', // 'light' | 'dark'
  });
  const [importLog, setImportLog] = useState([]); // [{id,timestamp,fileName,fileSize,kind,accountId,monthKey,txCount,skippedCount,sumAmounts,convention,txIds}]
  const [snapshots, setSnapshots] = useState([]); // [{date: 'YYYY-MM-DD', takenAt}]
  const [snapshotTodayChecked, setSnapshotTodayChecked] = useState(false);
  const [restoreBanner, setRestoreBanner] = useState(null); // { txCount, ts } or null
  // When a load fails on the SERVER (not just a missing key), we freeze ALL
  // auto-saves (server + localStorage mirror). This is the guard that stops a
  // transient DB outage from silently overwriting good data with empty defaults.
  const [loadFailed, setLoadFailed] = useState(false);

  const loadFromStorage = async () => {
    const keys = ['categories', 'rules', 'transactions', 'income', 'settings', 'importLog', 'snapshotIndex'];
    const results = await Promise.all(keys.map(k => window.storage.getSafe(k)));
    const byKey = {};
    keys.forEach((k, i) => { byKey[k] = results[i]; });

    // If ANY key hit a real server error (not just "missing"), abort the load,
    // keep state at defaults, and DO NOT clear loadFailed — saves stay frozen.
    const errored = keys.filter(k => byKey[k].status === 'error');
    if (errored.length > 0) {
      console.error('[load] server errors on', errored.map(k => `${k}:${byKey[k].code}`).join(', '));
      setLoadFailed(true);
      setLoading(false);
      return;
    }

    const val = (k) => byKey[k].status === 'ok' ? byKey[k].value : null;
    try {
      if (val('categories')) setCategories(JSON.parse(val('categories')));
      if (val('rules')) setRules(JSON.parse(val('rules')));
      if (val('transactions')) setTransactions(JSON.parse(val('transactions')));
      if (val('income')) setIncome(JSON.parse(val('income')));
      if (val('settings')) {
        const loaded = JSON.parse(val('settings'));
        setSettings({
          ...loaded,
          accounts: loaded.accounts || [],
          appName: loaded.appName || 'Ledger',
          theme: loaded.theme === 'dark' ? 'dark' : 'light',
        });
      }
      if (val('importLog')) setImportLog(JSON.parse(val('importLog')));
      if (val('snapshotIndex')) setSnapshots(JSON.parse(val('snapshotIndex')));
    } catch (e) {
      console.error('[load] parse error', e);
    }
    setLoadFailed(false);
    setLoading(false);
  };

  // Load from storage on mount
  useEffect(() => {
    loadFromStorage();
  }, []);

  // Save helpers (debounced via effect). Frozen while loading OR after a failed
  // load — never write defaults over data we simply couldn't read.
  useEffect(() => {
    if (loading || loadFailed) return;
    window.storage.set('categories', JSON.stringify(categories)).catch(console.error);
  }, [categories, loading, loadFailed]);

  useEffect(() => {
    if (loading || loadFailed) return;
    window.storage.set('rules', JSON.stringify(rules)).catch(console.error);
  }, [rules, loading, loadFailed]);

  useEffect(() => {
    if (loading || loadFailed) return;
    window.storage.set('transactions', JSON.stringify(transactions)).catch(console.error);
  }, [transactions, loading, loadFailed]);

  useEffect(() => {
    if (loading || loadFailed) return;
    window.storage.set('income', JSON.stringify(income)).catch(console.error);
  }, [income, loading, loadFailed]);

  useEffect(() => {
    if (loading || loadFailed) return;
    window.storage.set('settings', JSON.stringify(settings)).catch(console.error);
  }, [settings, loading, loadFailed]);

  useEffect(() => {
    if (loading || loadFailed) return;
    window.storage.set('importLog', JSON.stringify(importLog)).catch(console.error);
  }, [importLog, loading, loadFailed]);

  // ============ BACKUP / RESTORE / SNAPSHOTS ============
  const todayKey = () => new Date().toISOString().slice(0, 10);

  const buildSnapshot = () => ({
    categories, rules, transactions, income, settings, importLog, takenAt: Date.now(),
  });

  const applySnapshot = (data) => {
    if (data.categories) setCategories(data.categories);
    if (data.rules) setRules(data.rules);
    if (data.transactions) setTransactions(data.transactions);
    if (data.income) setIncome(data.income);
    if (data.settings) {
      const s = data.settings;
      setSettings({
        cushionTarget: s.cushionTarget || 0,
        cushionCurrent: s.cushionCurrent || 0,
        taxSetasidePct: s.taxSetasidePct ?? 30,
        newportActive: !!s.newportActive,
        accounts: s.accounts || [],
        appName: s.appName || 'Ledger',
        theme: s.theme === 'dark' ? 'dark' : 'light',
      });
    }
    if (data.importLog) setImportLog(data.importLog);
  };

  const takeSnapshot = async (date) => {
    const d = date || todayKey();
    const payload = buildSnapshot();
    try {
      await window.storage.set(`snapshot:${d}`, JSON.stringify(payload));
    } catch (e) { console.error('snapshot save failed', e); return; }
    setSnapshots(prev => {
      const without = prev.filter(s => s.date !== d);
      const next = [{ date: d, takenAt: Date.now() }, ...without].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
      window.storage.set('snapshotIndex', JSON.stringify(next)).catch(console.error);
      // Prune snapshots beyond the 30-day window
      const keepSet = new Set(next.map(s => s.date));
      prev.forEach(s => { if (!keepSet.has(s.date)) window.storage.delete?.(`snapshot:${s.date}`).catch(() => {}); });
      return next;
    });
  };

  const restoreSnapshot = async (date) => {
    if (!confirm(`Restore your data to the ${date} snapshot? Your current state will be replaced.`)) return;
    try {
      const res = await window.storage.get(`snapshot:${date}`);
      if (!res) { alert('Snapshot not found.'); return; }
      applySnapshot(JSON.parse(res.value));
    } catch (e) {
      alert('Restore failed: ' + ((e && e.message) || 'unknown'));
    }
  };

  // Mirror full state into the browser's localStorage on every change — the
  // last-resort backup if server data is ever lost.
  //
  // Two hard guards prevent the mirror from being destroyed:
  //  1. Frozen while `loading` or `loadFailed` (a failed server read must never
  //     trigger a mirror overwrite with empty defaults — this was the bug that
  //     wiped real data after the Postgres SSL outage).
  //  2. Refuse to overwrite a NON-EMPTY mirror with EMPTY current state. If the
  //     app somehow holds nothing but the mirror holds transactions, keep the
  //     mirror — the user can explicitly restore it.
  useEffect(() => {
    if (loading || loadFailed) return;
    if (typeof window === 'undefined' || !window.localStorage) return;
    const currentTxCount = Object.values(transactions || {}).reduce(
      (s: number, arr: any) => s + (Array.isArray(arr) ? arr.length : 0), 0
    );
    const currentEmpty = currentTxCount === 0 && importLog.length === 0 && rules.length === 0;
    try {
      if (currentEmpty) {
        const raw = window.localStorage.getItem('ledger:mirror');
        if (raw) {
          const prev = JSON.parse(raw);
          const prevTx = Object.values(prev.transactions || {}).reduce(
            (s: number, arr: any) => s + (Array.isArray(arr) ? arr.length : 0), 0
          ) as number;
          const prevHadData = prevTx > 0 || (prev.importLog && prev.importLog.length > 0) || (prev.rules && prev.rules.length > 0);
          if (prevHadData) return; // don't clobber a good backup with nothing
        }
      }
      const mirror = { categories, rules, transactions, income, settings, importLog, ts: Date.now(), v: 1 };
      window.localStorage.setItem('ledger:mirror', JSON.stringify(mirror));
    } catch { /* quota or private mode — skip */ }
  }, [categories, rules, transactions, income, settings, importLog, loading, loadFailed]);

  // Surface a restore banner when the server has empty data but localStorage
  // has a non-empty mirror — typical "the redeploy wiped me" recovery case.
  useEffect(() => {
    if (loading) return;
    if (typeof window === 'undefined' || !window.localStorage) return;
    const hasServer =
      Object.keys(transactions || {}).length > 0 ||
      Object.keys(income || {}).length > 0 ||
      importLog.length > 0 ||
      rules.length > 0;
    if (hasServer) { setRestoreBanner(null); return; }
    try {
      const raw = window.localStorage.getItem('ledger:mirror');
      if (!raw) return;
      const m = JSON.parse(raw);
      const txCount = Object.values(m.transactions || {}).reduce((s: number, arr: any) => s + (Array.isArray(arr) ? arr.length : 0), 0);
      if (txCount === 0 && (!m.importLog || m.importLog.length === 0)) return;
      setRestoreBanner({ txCount, ts: m.ts });
    } catch { /* corrupt mirror */ }
  }, [loading, transactions, income, importLog, rules]);

  const restoreFromLocal = () => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (!confirm("Restore your data from this browser's local backup? Current state will be replaced.")) return;
    try {
      const raw = window.localStorage.getItem('ledger:mirror');
      if (!raw) { alert('No local backup found.'); return; }
      applySnapshot(JSON.parse(raw));
      setRestoreBanner(null);
    } catch (e) {
      alert('Local restore failed: ' + ((e && e.message) || 'unknown'));
    }
  };

  // Take one snapshot per calendar day, the first time the app loads that day.
  useEffect(() => {
    if (loading || loadFailed) return;
    if (snapshotTodayChecked) return;
    const today = todayKey();
    if (snapshots.some(s => s.date === today)) {
      setSnapshotTodayChecked(true);
      return;
    }
    // Skip auto-snapshot if there's literally no data to save (empty first run).
    const empty =
      Object.keys(transactions).length === 0 &&
      Object.keys(income).length === 0 &&
      importLog.length === 0 &&
      rules.length === 0;
    if (empty) {
      setSnapshotTodayChecked(true);
      return;
    }
    takeSnapshot(today);
    setSnapshotTodayChecked(true);
  }, [loading, snapshots, snapshotTodayChecked, transactions, income, importLog, rules]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply theme to <html data-theme> so the CSS variables switch globally.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.theme = settings.theme === 'dark' ? 'dark' : 'light';
  }, [settings.theme]);

  // Reflect custom app name in the browser tab title.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (settings.appName) document.title = settings.appName;
  }, [settings.appName]);

  // ============ DERIVED STATE ============
  // 12-month trend data: monthly totals, top categories with per-month series.
  const trendsData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      months.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
    }
    const personalByMonth = months.map(m =>
      (transactions[m] || []).filter(t => t.classification === 'personal')
    );
    const monthlyTotals = personalByMonth.map(txs =>
      txs.reduce((s, t) => s + Math.abs(t.amount), 0)
    );
    const catSeries = {};
    months.forEach((m, idx) => {
      personalByMonth[idx].forEach(t => {
        const cat = t.category || 'uncategorized';
        if (!catSeries[cat]) catSeries[cat] = months.map(() => 0);
        catSeries[cat][idx] += Math.abs(t.amount);
      });
    });
    const topCats = (Object.entries(catSeries) as Array<[string, number[]]>)
      .map(([id, values]) => ({
        id,
        values,
        sum: values.reduce((s, v) => s + v, 0),
      }))
      .filter(c => c.sum > 0)
      .sort((a, b) => b.sum - a.sum)
      .slice(0, 8);
    return { months, monthlyTotals, topCats };
  }, [transactions]);

  const [trendInsights, setTrendInsights] = useState(null); // {insights, generatedAt} or null
  const [generatingTrendInsights, setGeneratingTrendInsights] = useState(false);
  const [trendInsightsError, setTrendInsightsError] = useState('');

  const getTrendInsights = async () => {
    setGeneratingTrendInsights(true);
    setTrendInsightsError('');
    try {
      const topCategories = trendsData.topCats.map(c => ({
        id: c.id,
        name: (categories.find(cc => cc.id === c.id)?.name) || c.id,
        values: c.values,
      }));
      const r = await fetch('/api/insights-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          months: trendsData.months,
          monthlyTotals: trendsData.monthlyTotals,
          topCategories,
          cushionCurrent: settings.cushionCurrent,
          cushionTarget: settings.cushionTarget,
        }),
      });
      const ct = r.headers.get('content-type') || '';
      const text = await r.text();
      if (!ct.toLowerCase().includes('application/json')) {
        setTrendInsightsError(`AI error (HTTP ${r.status}): ${(text || '').slice(0, 200)}`);
        return;
      }
      let j;
      try { j = JSON.parse(text); } catch {
        setTrendInsightsError(`AI error (HTTP ${r.status}): invalid JSON body`);
        return;
      }
      if (!r.ok) {
        setTrendInsightsError(`AI error (HTTP ${r.status}): ${j.error || 'unknown'}`);
        return;
      }
      setTrendInsights({ insights: j.insights || [], generatedAt: j.generatedAt || Date.now() });
    } catch (e) {
      setTrendInsightsError(`AI request failed: ${(e && e.message) || 'unknown'}`);
    } finally {
      setGeneratingTrendInsights(false);
    }
  };

  const monthOptions = useMemo(() => {
    const now = new Date();
    const set = new Set();
    // 36 months back from today (3 years)
    for (let i = 0; i < 36; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      set.add(monthKey(d));
    }
    // Plus the currently-selected month and anything else that has data.
    set.add(currentMonth);
    Object.keys(transactions).forEach(m => set.add(m));
    Object.keys(income).forEach(m => set.add(m));
    return Array.from(set).sort().reverse() as string[];
  }, [transactions, income, currentMonth]);

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
  const [lastSkippedLines, setLastSkippedLines] = useState([]); // [{lineNo, line, reason}]
  const [showSkipped, setShowSkipped] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState(null); // ID of import log row whose skipped lines are expanded
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

  // Renders skipped lines grouped by reason. Used in two places: inline after an
  // import (transient state) and per-row on the Import Log (persisted samples).
  const renderSkippedGroups = (lines) => {
    if (!lines || lines.length === 0) return <div style={styles.emptyState}>No skipped lines.</div>;
    const reasonInfo = {
      'no-date': {
        label: 'No date found',
        hint: 'Typically PDF section headers, account-info rows, page footers, or address blocks.',
      },
      'no-amount': {
        label: 'No amount found',
        hint: 'Rows with a date but no parseable dollar figure — often transaction-detail continuations or fee notes.',
      },
      'too-few-columns': {
        label: 'Too few columns',
        hint: 'Lines that did not split into at least two fields and did not match the date+amount fallback regex.',
      },
      'empty-description': {
        label: 'Empty description',
        hint: 'Date and amount were found but no description remained — rare edge case.',
      },
    };
    const order = ['no-date', 'no-amount', 'too-few-columns', 'empty-description'];
    const groups = {};
    lines.forEach((l) => { (groups[l.reason] = groups[l.reason] || []).push(l); });
    return (
      <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
        {order.filter(r => groups[r] && groups[r].length > 0).map(r => {
          const list = groups[r];
          const info = reasonInfo[r] || { label: r, hint: '' };
          const shown = list.slice(0, 30);
          const more = list.length - shown.length;
          return (
            <div key={r}>
              <div style={{fontWeight: 600, marginBottom: 4}}>
                {list.length} {info.label.toLowerCase()}
              </div>
              <div style={styles.helperText}>{info.hint}</div>
              <div style={{...styles.rulesTable, marginTop: 8, maxHeight: 280, overflow: 'auto'}}>
                {shown.map((l, i) => (
                  <div key={i} style={{...styles.ruleRow, fontFamily: 'monospace', fontSize: 12, gap: 10}}>
                    <span style={{flex: '0 0 64px', color: colors.muted}}>L{l.lineNo}</span>
                    <span style={{flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{l.line}</span>
                  </div>
                ))}
                {more > 0 && (
                  <div style={{...styles.ruleRow, color: colors.muted, fontSize: 12, fontStyle: 'italic'}}>
                    …and {more} more {info.label.toLowerCase()} line{more === 1 ? '' : 's'} (showing first 30)
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleImport = () => {
    const parsed = parseStatementText(importText);
    if (parsed.tx.length === 0) {
      setImportStatus(parsed.error || 'No transactions detected. Check format or try a different file.');
      setLastSkippedLines(Array.isArray(parsed.skippedLines) ? parsed.skippedLines : []);
      setShowSkipped(false);
      return;
    }
    const convention = detectSignConvention(parsed.tx);
    const stamp = Date.now();

    // De-duplicate against existing transactions for THIS month.
    // A duplicate has the same date, description, and amount (within $0.005).
    // Keep the original — discard the incoming duplicate so we don't overwrite
    // any classification or category edits the user already made.
    const existing = transactions[currentMonth] || [];
    const dupKey = (t) => `${(t.date || '').trim()}|${(t.description || '').trim().toLowerCase()}|${Math.round((t.amount || 0) * 100)}`;
    const seenKeys = new Set(existing.map(dupKey));
    const filtered = [];
    let duplicatesSkipped = 0;
    parsed.tx.forEach((p) => {
      const k = dupKey(p);
      if (seenKeys.has(k)) { duplicatesSkipped++; return; }
      seenKeys.add(k);
      filtered.push(p);
    });

    const newTx = filtered.map((p, idx) => {
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
    const skippedAll = Array.isArray(parsed.skippedLines) ? parsed.skippedLines : [];
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
      duplicatesSkipped,
      sumAmounts,
      convention,
      txIds: newTx.map(t => t.id),
      // Cap persisted skipped samples at 100 lines to keep the kv row bounded.
      skippedSamples: skippedAll.slice(0, 100),
    };
    setImportLog(prev => [logEntry, ...prev]);
    setLastSkippedLines(skippedAll);
    setShowSkipped(false);

    const acctName = (settings.accounts || []).find(a => a.id === importAccountId)?.name;
    const acctNote = acctName ? ` from ${acctName}` : '';
    const kind = convention === 'credit-card' ? 'credit-card export' : 'bank export';
    const dupNote = duplicatesSkipped ? `, ${duplicatesSkipped} duplicate${duplicatesSkipped === 1 ? '' : 's'} skipped` : '';
    setImportStatus(`Imported ${newTx.length} transactions${parsed.skipped ? `, skipped ${parsed.skipped}` : ''}${dupNote}${acctNote}. Detected ${kind}; review in Transactions.`);
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

      {loadFailed && (
        <div style={styles.loadFailedBanner}>
          <div>
            <strong>Couldn't load your data from the server.</strong> To protect your saved
            data, the app has <strong>frozen all saves</strong> — nothing will be overwritten.
            Don't re-enter data yet; click Retry once, and if it keeps failing, leave this tab open and tell Claude.
          </div>
          <div style={{display: 'flex', gap: 8}}>
            <button style={styles.primaryBtn} onClick={() => { setLoading(true); loadFromStorage(); }}>Retry</button>
          </div>
        </div>
      )}

      {restoreBanner && (
        <div style={styles.restoreBanner}>
          <div>
            <strong>Server data looks empty</strong>, but this browser has a local backup with{' '}
            <strong>{restoreBanner.txCount} transactions</strong>, last saved{' '}
            {new Date(restoreBanner.ts).toLocaleString()}. Restore it?
          </div>
          <div style={{display: 'flex', gap: 8}}>
            <button style={styles.primaryBtn} onClick={restoreFromLocal}>Restore from browser</button>
            <button style={styles.secondaryBtn} onClick={() => setRestoreBanner(null)}>Dismiss</button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.brandTitle}>{settings.appName || 'Ledger'}</h1>
          <div style={styles.brandKicker}>Personal Financial Operations</div>
        </div>
        <div style={styles.monthPicker}>
          <select
            value={currentMonth}
            onChange={e => setCurrentMonth(e.target.value)}
            style={styles.monthSelect}
            aria-label="Select month"
          >
            {monthOptions.map(m => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
        </div>
      </header>

      {/* NAV */}
      <nav style={styles.nav}>
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'trends', label: 'Trends' },
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

      {/* ============ TRENDS ============ */}
      {view === 'trends' && (() => {
        const { months, monthlyTotals, topCats } = trendsData;
        const total12 = monthlyTotals.reduce((s, v) => s + v, 0);
        const nonZero = monthlyTotals.filter(v => v > 0).length;
        const avg = nonZero > 0 ? total12 / nonZero : 0;
        const last3 = monthlyTotals.slice(-3).reduce((s, v) => s + v, 0) / 3;
        const prior3 = monthlyTotals.slice(-6, -3).reduce((s, v) => s + v, 0) / 3;
        const trendPct = prior3 > 0 ? ((last3 - prior3) / prior3) * 100 : 0;
        const maxSpend = Math.max(...monthlyTotals, 1);

        // SVG sizing
        const W = 900, H = 280, PAD_L = 60, PAD_R = 20, PAD_T = 30, PAD_B = 40;
        const innerW = W - PAD_L - PAD_R;
        const innerH = H - PAD_T - PAD_B;
        const colW = innerW / months.length;
        const barW = Math.max(colW - 10, 6);

        const sparklinePath = (values) => {
          const max = Math.max(...values, 1);
          const w = 90, h = 20;
          return values.map((v, i) => {
            const x = (i / (values.length - 1)) * w;
            const y = h - (v / max) * h;
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
          }).join(' ');
        };

        return (
          <div>
            <section style={styles.statusStrip}>
              <div style={styles.statusCard}>
                <div style={styles.statusLabel}>12-mo Total Spend</div>
                <div style={styles.statusBig}>{fmt(total12)}</div>
                <div style={styles.statusSub}>Personal only</div>
              </div>
              <div style={styles.statusCard}>
                <div style={styles.statusLabel}>Avg / Active Month</div>
                <div style={styles.statusBig}>{fmt(avg)}</div>
                <div style={styles.statusSub}>{nonZero} of 12 months active</div>
              </div>
              <div style={styles.statusCard}>
                <div style={styles.statusLabel}>3-mo vs Prior 3-mo</div>
                <div style={{...styles.statusBig, color: trendPct > 5 ? colors.red : (trendPct < -5 ? colors.green : colors.text)}}>
                  {trendPct >= 0 ? '+' : ''}{trendPct.toFixed(1)}%
                </div>
                <div style={styles.statusSub}>{fmt(last3)} / mo recently</div>
              </div>
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Monthly Spend — Last 12 Months</h2>
              {total12 === 0 ? (
                <div style={styles.emptyState}>No personal transactions in the last 12 months yet. Import some statements.</div>
              ) : (
                <svg viewBox={`0 0 ${W} ${H}`} style={{width: '100%', height: 'auto', overflow: 'visible'}}>
                  {/* Y-axis gridlines */}
                  {[0.25, 0.5, 0.75, 1].map(frac => {
                    const y = PAD_T + innerH - innerH * frac;
                    const value = maxSpend * frac;
                    return (
                      <g key={frac}>
                        <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke={colors.border} strokeWidth={1} strokeDasharray="3 4" />
                        <text x={PAD_L - 8} y={y + 4} textAnchor="end" fill={colors.muted} fontSize={11}>{fmt(value)}</text>
                      </g>
                    );
                  })}
                  {/* Bars */}
                  {monthlyTotals.map((v, i) => {
                    const barH = (v / maxSpend) * innerH;
                    const x = PAD_L + i * colW + (colW - barW) / 2;
                    const y = PAD_T + innerH - barH;
                    const [yy, mm] = months[i].split('-');
                    return (
                      <g key={months[i]}>
                        <rect x={x} y={y} width={barW} height={barH} fill={colors.accent} rx={3} />
                        <text x={x + barW / 2} y={PAD_T + innerH + 16} textAnchor="middle" fill={colors.muted} fontSize={10}>
                          {mm}/{yy.slice(2)}
                        </text>
                        {v > 0 && (
                          <text x={x + barW / 2} y={y - 6} textAnchor="middle" fill={colors.text} fontSize={10} fontWeight={500}>
                            {v > 999 ? `${Math.round(v / 1000)}k` : Math.round(v).toString()}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  <line x1={PAD_L} y1={PAD_T + innerH} x2={W - PAD_R} y2={PAD_T + innerH} stroke={colors.borderStrong} strokeWidth={1} />
                </svg>
              )}
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Top Categories — 12-Month Trend</h2>
              {topCats.length === 0 ? (
                <div style={styles.emptyState}>No category data yet.</div>
              ) : (
                <div style={styles.rulesTable}>
                  <div style={{...styles.ruleRow, fontWeight: 600, color: colors.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4}}>
                    <span style={{flex: 1}}>Category</span>
                    <span style={{flex: '0 0 110px'}}>Sparkline</span>
                    <span style={{flex: '0 0 110px', textAlign: 'right'}}>12-mo Total</span>
                    <span style={{flex: '0 0 90px', textAlign: 'right'}}>Avg/mo</span>
                    <span style={{flex: '0 0 90px', textAlign: 'right'}}>Last mo</span>
                  </div>
                  {topCats.map(c => {
                    const name = (categories.find(cc => cc.id === c.id)?.name) || c.id;
                    const avgC = c.sum / 12;
                    const last = c.values[c.values.length - 1] || 0;
                    return (
                      <div key={c.id} style={styles.ruleRow}>
                        <span style={{flex: 1, fontWeight: 500}}>{name}</span>
                        <span style={{flex: '0 0 110px'}}>
                          <svg viewBox="0 0 90 20" style={{width: 100, height: 22}}>
                            <path d={sparklinePath(c.values)} fill="none" stroke={colors.accent} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span style={{flex: '0 0 110px', textAlign: 'right', fontWeight: 500, fontSize: 13}}>{fmt(c.sum)}</span>
                        <span style={{flex: '0 0 90px', textAlign: 'right', color: colors.muted, fontSize: 13}}>{fmt(avgC)}</span>
                        <span style={{flex: '0 0 90px', textAlign: 'right', fontSize: 13}}>{fmt(last)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>AI Insights — Multi-Month Patterns</h2>
              {!trendInsights ? (
                <>
                  <div style={styles.helperText}>
                    Ask Claude to look at the last 12 months of spend trajectories and call out what's
                    trending up, what's holding, and where the cushion is heading.
                  </div>
                  <button style={styles.primaryBtn} onClick={getTrendInsights} disabled={generatingTrendInsights || total12 === 0}>
                    {generatingTrendInsights ? 'Asking Claude…' : '✨ Generate trend insights'}
                  </button>
                </>
              ) : (
                <>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
                    <span style={{color: colors.muted, fontSize: 12}}>
                      Generated {new Date(trendInsights.generatedAt).toLocaleString()}
                    </span>
                    <button style={styles.linkBtn} onClick={getTrendInsights} disabled={generatingTrendInsights}>
                      {generatingTrendInsights ? 'Refreshing…' : '↻ Refresh'}
                    </button>
                  </div>
                  {(!trendInsights.insights || trendInsights.insights.length === 0) ? (
                    <div style={styles.emptyState}>No insights returned. Try again.</div>
                  ) : (
                    <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                      {trendInsights.insights.map((ins, i) => {
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
              {trendInsightsError && <div style={styles.statusMsgError}>{trendInsightsError}</div>}
            </section>
          </div>
        );
      })()}

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
            {lastSkippedLines.length > 0 && (
              <div style={{marginTop: 10}}>
                <button style={styles.linkBtn} onClick={() => setShowSkipped(s => !s)}>
                  {showSkipped ? '▾' : '▸'} Review {lastSkippedLines.length} skipped line{lastSkippedLines.length === 1 ? '' : 's'}
                </button>
                {showSkipped && (
                  <div style={{marginTop: 12, padding: 14, border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.bgSubtle}}>
                    {renderSkippedGroups(lastSkippedLines)}
                  </div>
                )}
              </div>
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
                  <span style={{flex: '0 0 210px', textAlign: 'right'}}>Actions</span>
                </div>
                {importLog.map((e, i) => {
                  const acctName = (settings.accounts || []).find(a => a.id === e.accountId)?.name;
                  const skipSamples = Array.isArray(e.skippedSamples) ? e.skippedSamples : [];
                  const isExpanded = expandedLogId === e.id;
                  return (
                    <React.Fragment key={e.id || i}>
                      <div style={styles.ruleRow}>
                        <span style={{flex: '0 0 110px', color: colors.muted, fontSize: 12}}>{new Date(e.timestamp).toLocaleDateString()}</span>
                        <span style={{flex: '0 0 90px', color: colors.muted, fontSize: 12}}>{e.monthKey}</span>
                        <span style={{flex: 1, fontSize: 13}}>
                          <strong>{acctName || (e.accountId ? '(unknown account)' : 'Untagged')}</strong>
                          <span style={{color: colors.muted, marginLeft: 8}}>{e.fileName}</span>
                        </span>
                        <span style={{flex: '0 0 70px', textAlign: 'right', fontSize: 13}}>{e.txCount}{e.skippedCount ? ` (-${e.skippedCount})` : ''}</span>
                        <span style={{flex: '0 0 110px', textAlign: 'right', fontSize: 13, fontWeight: 500}}>{fmtCents(e.sumAmounts)}</span>
                        <span style={{flex: '0 0 210px', display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center'}}>
                          <button
                            style={{...styles.linkBtn, opacity: skipSamples.length === 0 ? 0.4 : 1}}
                            title={skipSamples.length === 0 ? 'No skipped lines recorded for this import' : 'View the lines that were skipped during this import'}
                            disabled={skipSamples.length === 0}
                            onClick={() => setExpandedLogId(prev => prev === e.id ? null : e.id)}
                          >{isExpanded ? 'Hide' : 'View'} skipped{skipSamples.length > 0 ? ` (${skipSamples.length})` : ''}</button>
                          <button
                            style={styles.linkBtn}
                            title="Remove log entry only; keep transactions"
                            onClick={() => {
                              if (!confirm('Delete this import-log entry? Transactions themselves stay; only the log row is removed.')) return;
                              setImportLog(prev => prev.filter(x => x.id !== e.id));
                              if (expandedLogId === e.id) setExpandedLogId(null);
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
                              if (expandedLogId === e.id) setExpandedLogId(null);
                            }}
                          >Remove + tx</button>
                        </span>
                      </div>
                      {isExpanded && skipSamples.length > 0 && (
                        <div style={{padding: '14px 16px', background: colors.bgSubtle, borderRadius: 8, marginTop: -4, marginBottom: 8}}>
                          {e.skippedCount > skipSamples.length && (
                            <div style={{...styles.helperText, marginBottom: 10, fontStyle: 'italic'}}>
                              Showing the first {skipSamples.length} of {e.skippedCount} skipped lines (the rest weren't persisted).
                            </div>
                          )}
                          {renderSkippedGroups(skipSamples)}
                        </div>
                      )}
                    </React.Fragment>
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
            <h2 style={styles.sectionTitle}>App Preferences</h2>
            <div style={styles.helperText}>
              Customize the app name shown in the header and browser tab, and pick a theme.
            </div>
            <div style={styles.settingsGrid}>
              <div>
                <label style={styles.fieldLabel}>App Name</label>
                <input
                  type="text"
                  value={settings.appName || ''}
                  onChange={e => setSettings(prev => ({ ...prev, appName: e.target.value }))}
                  placeholder="Ledger"
                  style={styles.bigInput}
                />
              </div>
              <div>
                <label style={styles.fieldLabel}>Theme</label>
                <div style={styles.segmentRow}>
                  <button
                    style={{ ...styles.segmentBtn, ...(settings.theme !== 'dark' ? styles.segmentBtnActive : {}) }}
                    onClick={() => setSettings(prev => ({ ...prev, theme: 'light' }))}
                  >☀ Light</button>
                  <button
                    style={{ ...styles.segmentBtn, ...(settings.theme === 'dark' ? styles.segmentBtnActive : {}) }}
                    onClick={() => setSettings(prev => ({ ...prev, theme: 'dark' }))}
                  >☾ Dark</button>
                </div>
              </div>
            </div>
          </section>

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
            <h2 style={styles.sectionTitle}>Backup &amp; Restore</h2>
            <div style={styles.helperText}>
              The app auto-snapshots once per day and keeps the last 30 days. Every change
              also mirrors to your browser's local storage as a safety net against server
              wipes. Pick any date to roll the whole app back.
            </div>
            <div style={{...styles.btnRow, marginBottom: 14}}>
              <button style={styles.secondaryBtn} onClick={() => takeSnapshot(todayKey())}>
                Take snapshot now
              </button>
              {typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('ledger:mirror') && (
                <button style={styles.secondaryBtn} onClick={restoreFromLocal}>
                  Restore from browser backup
                </button>
              )}
            </div>
            {snapshots.length === 0 ? (
              <div style={styles.emptyState}>No snapshots yet. One will be taken automatically on next data change.</div>
            ) : (
              <div style={styles.rulesTable}>
                <div style={{...styles.ruleRow, fontWeight: 600, color: colors.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4}}>
                  <span style={{flex: '0 0 130px'}}>Date</span>
                  <span style={{flex: 1}}>Taken</span>
                  <span style={{flex: '0 0 90px', textAlign: 'right'}}>Action</span>
                </div>
                {snapshots.map((s) => (
                  <div key={s.date} style={styles.ruleRow}>
                    <span style={{flex: '0 0 130px', fontFamily: 'monospace', fontSize: 13}}>{s.date}</span>
                    <span style={{flex: 1, color: colors.muted, fontSize: 12}}>{new Date(s.takenAt).toLocaleString()}</span>
                    <button style={{...styles.linkBtn, flex: '0 0 90px', textAlign: 'right'}} onClick={() => restoreSnapshot(s.date)}>Restore</button>
                  </div>
                ))}
              </div>
            )}
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
                  setSettings({ cushionTarget: 0, cushionCurrent: 0, taxSetasidePct: 30, newportActive: false, accounts: [], appName: 'Ledger', theme: 'light' });
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
// Monarch-inspired palette. Theme is toggled by setting `data-theme` on <html>.
const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  :root, [data-theme="light"] {
    --c-bg: #fbfaf6;
    --c-bg-card: #ffffff;
    --c-bg-subtle: #f4f2ec;
    --c-border: #e8e5de;
    --c-border-strong: #d8d5cd;
    --c-text: #1a1a1a;
    --c-text-secondary: #3a3a3a;
    --c-muted: #6b6b6b;
    --c-muted-light: #9a9a9a;
    --c-accent: #f66b36;
    --c-accent-light: #ff8b5e;
    --c-accent-bg: #ffe9df;
    --c-green: #2e7d32;
    --c-green-bg: #e8f3ea;
    --c-red: #c62828;
    --c-red-bg: #fce9e9;
    --c-amber: #b7791f;
    --c-amber-bg: #fcf3db;
    --c-ink: #0a0a0a;
    --c-scrollbar-thumb: #d8d5cd;
    --c-scrollbar-thumb-hover: #b8b5ad;
  }
  [data-theme="dark"] {
    --c-bg: #0f1419;
    --c-bg-card: #1a1f26;
    --c-bg-subtle: #151a20;
    --c-border: #2a3038;
    --c-border-strong: #3a4048;
    --c-text: #f5f5f5;
    --c-text-secondary: #d4d4d4;
    --c-muted: #9a9ea4;
    --c-muted-light: #6b6e72;
    --c-accent: #ff7a45;
    --c-accent-light: #ffa078;
    --c-accent-bg: #3a2418;
    --c-green: #4caf50;
    --c-green-bg: #1a3329;
    --c-red: #ef5350;
    --c-red-bg: #3a1e1c;
    --c-amber: #ffa726;
    --c-amber-bg: #3a2e15;
    --c-ink: #ffffff;
    --c-scrollbar-thumb: #3a4048;
    --c-scrollbar-thumb-hover: #4a5058;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    background: var(--c-bg);
    color: var(--c-text);
    transition: background-color 160ms, color 160ms;
  }
  input:focus, select:focus, textarea:focus, button:focus {
    outline: 2px solid var(--c-accent);
    outline-offset: 1px;
  }
  input, select, textarea, button {
    font-family: 'Inter', sans-serif;
    color: inherit;
  }
  input, select, textarea {
    background: var(--c-bg-card);
    border-color: var(--c-border-strong);
  }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: var(--c-bg); }
  ::-webkit-scrollbar-thumb { background: var(--c-scrollbar-thumb); border-radius: 5px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--c-scrollbar-thumb-hover); }
`;

const colors = {
  bg: 'var(--c-bg)',
  bgCard: 'var(--c-bg-card)',
  bgSubtle: 'var(--c-bg-subtle)',
  border: 'var(--c-border)',
  borderStrong: 'var(--c-border-strong)',
  text: 'var(--c-text)',
  textSecondary: 'var(--c-text-secondary)',
  muted: 'var(--c-muted)',
  mutedLight: 'var(--c-muted-light)',
  accent: 'var(--c-accent)',
  accentLight: 'var(--c-accent-light)',
  accentBg: 'var(--c-accent-bg)',
  green: 'var(--c-green)',
  greenBg: 'var(--c-green-bg)',
  red: 'var(--c-red)',
  redBg: 'var(--c-red-bg)',
  amber: 'var(--c-amber)',
  amberBg: 'var(--c-amber-bg)',
  ink: 'var(--c-ink)',
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
  monthSelect: {
    border: 'none',
    background: 'transparent',
    color: colors.text,
    fontSize: 14,
    fontWeight: 600,
    padding: '6px 10px',
    minWidth: 180,
    cursor: 'pointer',
    borderRadius: 6,
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
  restoreBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '14px 20px',
    background: colors.amberBg,
    borderBottom: `1px solid #fcd34d`,
    color: colors.amber,
    fontSize: 14,
  },
  loadFailedBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '14px 20px',
    background: colors.redBg,
    borderBottom: `1px solid #fecaca`,
    color: colors.red,
    fontSize: 14,
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
