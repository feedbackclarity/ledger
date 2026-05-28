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
  { pattern: /shell|chevron|bp |mobil|exxon|gas station|76 /i, category: 'auto' },
  { pattern: /state farm|geico|progressive auto/i, category: 'auto' },
  { pattern: /jiffy lube|valvoline|midas|firestone/i, category: 'auto' },
  { pattern: /whole foods|trader joe|jewel|mariano|costco|wegman/i, category: 'groceries' },
  { pattern: /amazon fresh|instacart|gopuff/i, category: 'groceries' },
  { pattern: /netflix|spotify|hulu|apple\.com\/bill|prime video/i, category: 'subscriptions' },
  { pattern: /ypo/i, category: 'subscriptions' },
  { pattern: /comed|peoples gas|att|verizon|comcast|xfinity/i, category: 'home-chicago-utilities' },
  { pattern: /walgreens|cvs|pharmacy|doctor|dental|equinox|peloton/i, category: 'health' },
  { pattern: /united|delta|american airlines|hotel|airbnb|hyatt|marriott|hilton/i, category: 'travel' },
  { pattern: /uber|lyft|taxi/i, category: 'travel' },
  { pattern: /resy|opentable|tock/i, category: 'restaurants' },
  { pattern: /irs|illinois dept of rev|estimated tax/i, category: 'taxes-quarterly' },
];

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

// ============ MAIN COMPONENT ============
export default function BudgetPlanner() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard'); // dashboard, transactions, categories, settings, import
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
  });

  // Load from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const [catsRes, rulesRes, txRes, incRes, setRes] = await Promise.all([
          window.storage.get('categories').catch(() => null),
          window.storage.get('rules').catch(() => null),
          window.storage.get('transactions').catch(() => null),
          window.storage.get('income').catch(() => null),
          window.storage.get('settings').catch(() => null),
        ]);
        if (catsRes) setCategories(JSON.parse(catsRes.value));
        if (rulesRes) setRules(JSON.parse(rulesRes.value));
        if (txRes) setTransactions(JSON.parse(txRes.value));
        if (incRes) setIncome(JSON.parse(incRes.value));
        if (setRes) setSettings(JSON.parse(setRes.value));
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
  const autoCategorize = (description) => {
    // Check learned rules first
    for (const rule of rules) {
      if (description.toLowerCase().includes(rule.merchant.toLowerCase())) {
        return rule.category;
      }
    }
    // Fall back to seed rules
    for (const rule of SEED_RULES) {
      if (rule.pattern.test(description)) return rule.category;
    }
    return 'uncategorized';
  };

  // ============ IMPORT FLOW ============
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState('');

  const handleImport = () => {
    const lines = importText.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) {
      setImportStatus('No data to import');
      return;
    }

    const newTx = [];
    let skipped = 0;

    lines.forEach((line, idx) => {
      // Try to parse: date, description, amount  (CSV or tab-separated)
      const parts = line.includes('\t') ? line.split('\t') : line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
      if (parts.length < 3) { skipped++; return; }

      // Find amount (last numeric-looking field)
      let amount = null;
      let date = null;
      let description = null;

      for (let i = parts.length - 1; i >= 0; i--) {
        const cleaned = parts[i].replace(/[$,\s]/g, '');
        const n = parseFloat(cleaned);
        if (!isNaN(n) && amount === null) {
          amount = n;
        } else if (amount !== null && date === null) {
          // try date
          if (/\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(parts[i])) {
            date = parts[i];
            description = parts.slice(0, i).concat(parts.slice(i + 1, parts.length - 1)).filter(p => p !== parts[parts.length - 1]).join(' ').trim();
            break;
          }
        }
      }

      // Fallback: assume order is date, description, amount
      if (!date || !description) {
        date = parts[0];
        amount = parseFloat(parts[parts.length - 1].replace(/[$,\s]/g, ''));
        description = parts.slice(1, -1).join(' ').trim();
      }

      if (isNaN(amount) || !description) { skipped++; return; }

      const category = autoCategorize(description);
      // Heuristic: positive amounts → income/transfer; flag for review
      let classification = null;
      if (amount > 0) {
        classification = 'transfer'; // user requested: mark probable income as transfers
      } else {
        classification = 'personal'; // default; user will mark business
      }

      newTx.push({
        id: `${currentMonth}-${Date.now()}-${idx}`,
        date,
        description,
        amount,
        category,
        classification,
      });
    });

    setTransactions(prev => ({
      ...prev,
      [currentMonth]: [...(prev[currentMonth] || []), ...newTx],
    }));
    setImportStatus(`Imported ${newTx.length} transactions${skipped ? `, skipped ${skipped}` : ''}. Review them in Transactions.`);
    setImportText('');
  };

  // ============ TX OPERATIONS ============
  const updateTx = (id, updates) => {
    setTransactions(prev => ({
      ...prev,
      [currentMonth]: (prev[currentMonth] || []).map(t => t.id === id ? { ...t, ...updates } : t),
    }));
  };

  const learnFromTx = (tx) => {
    if (!tx.category || tx.category === 'uncategorized') return;
    // Extract a merchant token: first 2-3 words of description
    const tokens = tx.description.split(/\s+/).slice(0, 2).join(' ');
    if (tokens.length < 3) return;
    setRules(prev => {
      const exists = prev.find(r => r.merchant.toLowerCase() === tokens.toLowerCase());
      if (exists) return prev.map(r => r.merchant.toLowerCase() === tokens.toLowerCase() ? { ...r, category: tx.category } : r);
      return [...prev, { merchant: tokens, category: tx.category }];
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
        </div>
      )}

      {/* ============ IMPORT ============ */}
      {view === 'import' && (
        <div>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Import Transactions for {monthLabel(currentMonth)}</h2>
            <div style={styles.helperText}>
              Paste CSV data from any bank/card export. Expected columns: <strong>date, description, amount</strong> (any order; comma or tab separated; with or without headers).
              Negative amounts are spend; positive amounts are flagged as <strong>transfers</strong> (per your rule — you'll catch real income in review).
            </div>
            <div style={styles.helperText}>
              For PDF statements: open the PDF, select all transactions, paste below. The parser tolerates messy formats.
            </div>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder={`Examples:\n12/03/2025, WHOLE FOODS MARKET, -187.43\n12/04/2025, "SHELL OIL 12345", -62.10\n12/05/2025, AUTOPLICITY DIST, 45000.00`}
              style={styles.textarea}
              rows={12}
            />
            <div style={styles.btnRow}>
              <button style={styles.primaryBtn} onClick={handleImport}>Import & Auto-Categorize</button>
              <button style={styles.secondaryBtn} onClick={() => setImportText('')}>Clear</button>
            </div>
            {importStatus && <div style={styles.statusMsg}>{importStatus}</div>}
          </section>

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
        </div>
      )}

      {/* ============ TRANSACTIONS ============ */}
      {view === 'transactions' && (
        <div>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Transactions — {monthLabel(currentMonth)}</h2>
            {monthTx.length === 0 ? (
              <div style={styles.emptyState}>No transactions yet. <button style={styles.linkBtn} onClick={() => setView('import')}>Import →</button></div>
            ) : (
              <>
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
                          onChange={e => updateTx(tx.id, { classification: e.target.value })}
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
                  setSettings({ cushionTarget: 0, cushionCurrent: 0, taxSetasidePct: 30, newportActive: false });
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

const styles = {
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
