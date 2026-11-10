const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/ContributionsTab.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Ensure ActionsDropdown and Eye are imported
if (!content.includes("import ActionsDropdown")) {
  content = content.replace(
    "import { getMemberAvatar } from '@/lib/memberAvatars';",
    "import { getMemberAvatar } from '@/lib/memberAvatars';\nimport ActionsDropdown from '@/components/ActionsDropdown';\nimport { Eye } from 'lucide-react';"
  );
}

// 2. Update renderContribStatusBadge with light badges
const oldBadgeTarget = `  const renderContribStatusBadge = (status: string) => {
    if (status === 'Fully Paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Fully Paid
        </span>
      );
    }
    if (status === 'Partially Paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Partially Paid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        Unpaid
      </span>
    );
  };`;

const newBadgeReplacement = `  const renderContribStatusBadge = (status: string) => {
    if (status === 'Fully Paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Fully Paid
        </span>
      );
    }
    if (status === 'Partially Paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Partially Paid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Unpaid
      </span>
    );
  };`;

if (content.includes(oldBadgeTarget)) {
  content = content.replace(oldBadgeTarget, newBadgeReplacement);
}

// 3. Update main wrapper class from text-slate-100 to text-slate-800
content = content.replace(
  '<div className="space-y-6 text-slate-100">',
  '<div className="space-y-6 text-slate-800 w-full">'
);

// 4. Update top bar navigation
const oldTopBar = `<div className="bg-[#0F172A] border border-slate-800/90 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">`;
const newTopBar = `<div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">`;
content = content.replace(oldTopBar, newTopBar);

// Subview buttons
content = content.replace(
  `active
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'`,
  `active
                    ? 'bg-[#0A5C36] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'`
);

// Selectors container
content = content.replace(
  `<div className="flex items-center gap-2 bg-[#070D18] border border-slate-700 rounded-xl px-3 py-1.5">`,
  `<div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">`
);

// Quick Jump Buttons
content = content.replace(
  `className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#142036] hover:bg-[#1E2D4A] text-slate-200 border border-slate-700 transition"`,
  `className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"`
);

// Add contribution top button
content = content.replace(
  `className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold tracking-wide shadow-lg shadow-emerald-500/20 transition-all"`,
  `className="flex items-center gap-1.5 px-4 py-2 bg-[#0A5C36] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold tracking-wide shadow-sm transition-all"`
);

// 5. Update KPI Cards in Monthly Register
const oldKpi = `          {/* Monthly KPI Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Selected Period Expected ({activeMonth} {activeYear})
              </span>
              <p className="text-xl font-black text-white mt-1">
                KES {monthlySummary.totalExpected.toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-500">
                7 Registered Dreamloom Members
              </span>
            </div>

            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Collected ({activeMonth} {activeYear})
              </span>
              <p className="text-xl font-black text-emerald-400 mt-1">
                KES {monthlySummary.totalPaid.toLocaleString()}
              </p>
              <span className="text-[11px] text-emerald-500/80">
                {monthlySummary.fullyPaidCount} Fully Paid • {monthlySummary.partialCount} Partial
              </span>
            </div>

            <div className="bg-[#0F172A] border border-amber-500/30 rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Outstanding Contribution ({activeMonth} {activeYear})
              </span>
              <p className="text-xl font-black text-amber-400 mt-1">
                KES {monthlySummary.totalOutstanding.toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-400">
                {monthlySummary.unpaidCount} Unpaid • {monthlySummary.partialCount} Partially Paid
              </span>
            </div>

            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Excess / Advance Credit ({activeMonth} {activeYear})
              </span>
              <p className="text-xl font-black text-blue-400 mt-1">
                KES {monthlySummary.totalCredit.toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-500">
                Synced with Member Balances
              </span>
            </div>
          </div>`;

const newKpi = `          {/* Monthly KPI Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Selected Period Expected ({activeMonth} {activeYear})
              </span>
              <p className="text-xl font-black text-slate-900 mt-1">
                KES {monthlySummary.totalExpected.toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-500">
                7 Registered Dreamloom Members
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Collected ({activeMonth} {activeYear})
              </span>
              <p className="text-xl font-black text-emerald-700 mt-1">
                KES {monthlySummary.totalPaid.toLocaleString()}
              </p>
              <span className="text-[11px] text-emerald-600 font-medium">
                {monthlySummary.fullyPaidCount} Fully Paid • {monthlySummary.partialCount} Partial
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                Outstanding Contribution ({activeMonth} {activeYear})
              </span>
              <p className="text-xl font-black text-amber-600 mt-1">
                KES {monthlySummary.totalOutstanding.toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-500">
                {monthlySummary.unpaidCount} Unpaid • {monthlySummary.partialCount} Partially Paid
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Excess / Advance Credit ({activeMonth} {activeYear})
              </span>
              <p className="text-xl font-black text-blue-600 mt-1">
                KES {monthlySummary.totalCredit.toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-500">
                Synced with Member Balances
              </span>
            </div>
          </div>`;

if (content.includes(oldKpi)) {
  content = content.replace(oldKpi, newKpi);
}

// 6. Replace monthly table container and header
content = content.replace(
  `<div className="bg-[#0F172A] border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-white">
                  {activeMonth} {activeYear} — Member Contributions Register
                </h2>
                <p className="text-xs text-slate-400">
                  Authoritative monthly register supporting single payments, multiple instalments, and instant database synchronisation
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportMonthlyCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700"
                  title="Export Current Month Register to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                {canEdit && (
                  <button
                    onClick={() => handleOpenAddModal()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>ADD CONTRIBUTION</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[980px]">
                <thead>
                  <tr className="bg-[#090F1D] border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4">1. Member Name</th>
                    <th className="py-3.5 px-4">2. Contribution Month</th>
                    <th className="py-3.5 px-4">3. Contribution Year</th>
                    <th className="py-3.5 px-4 text-right">4. Expected (KES)</th>
                    <th className="py-3.5 px-4 text-right">5. Amount Paid (KES)</th>
                    <th className="py-3.5 px-4 text-right">6. Outstanding (KES)</th>
                    <th className="py-3.5 px-4">7. Payment Date</th>
                    <th className="py-3.5 px-4">8. Payment Reference</th>
                    <th className="py-3.5 px-4 text-center">9. Payment Status</th>
                    <th className="py-3.5 px-4 text-center sticky right-0 bg-[#090F1D] z-10 border-l border-slate-800/80 min-w-[220px]">
                      10. Actions
                    </th>
                  </tr>
                </thead>`,
  `<div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  {activeMonth} {activeYear} — Member Contributions Register
                </h2>
                <p className="text-xs text-slate-500">
                  Authoritative monthly register supporting single payments, multiple instalments, and instant database synchronisation
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportMonthlyCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition"
                  title="Export Current Month Register to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                {canEdit && (
                  <button
                    onClick={() => handleOpenAddModal()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0A5C36] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>ADD CONTRIBUTION</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[980px]">
                <thead>
                  <tr className="bg-[#E6F4EA] border-b border-emerald-900/10 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    <th className="py-3.5 px-4">1. Member Name</th>
                    <th className="py-3.5 px-4">2. Contribution Month</th>
                    <th className="py-3.5 px-4">3. Contribution Year</th>
                    <th className="py-3.5 px-4 text-right">4. Expected (KES)</th>
                    <th className="py-3.5 px-4 text-right">5. Amount Paid (KES)</th>
                    <th className="py-3.5 px-4 text-right">6. Outstanding (KES)</th>
                    <th className="py-3.5 px-4">7. Payment Date</th>
                    <th className="py-3.5 px-4">8. Payment Reference</th>
                    <th className="py-3.5 px-4 text-center">9. Payment Status</th>
                    <th className="py-3.5 px-4 text-center">10. Actions</th>
                  </tr>
                </thead>`
);

// 7. Update monthly table body styling & rows
content = content.replace(
  `<tbody className="divide-y divide-slate-800/60">`,
  `<tbody className="divide-y divide-slate-100">`
);

content = content.replace(
  `<tr key={row.memberId || idx} className="hover:bg-slate-800/35 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">`,
  `<tr key={row.memberId || idx} className="hover:bg-emerald-50/20 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">`
);

content = content.replace(
  `<div className="w-6 h-6 rounded-full overflow-hidden shrink-0 ring-1 ring-emerald-500/40 bg-slate-800">`,
  `<div className="w-7 h-7 rounded-full overflow-hidden shrink-0 ring-1 ring-emerald-500/40 bg-slate-100">`
);

content = content.replace(
  `<td className="py-3.5 px-4 text-emerald-400 font-semibold">`,
  `<td className="py-3.5 px-4 text-emerald-700 font-semibold">`
);

content = content.replace(
  `<td className="py-3.5 px-4 text-slate-300 font-semibold">`,
  `<td className="py-3.5 px-4 text-slate-600 font-semibold">`
);

content = content.replace(
  `<td className="py-3.5 px-4 text-right font-semibold text-slate-200">`,
  `<td className="py-3.5 px-4 text-right font-semibold text-slate-700">`
);

content = content.replace(
  `<td className="py-3.5 px-4 text-right font-extrabold text-emerald-400">`,
  `<td className="py-3.5 px-4 text-right font-extrabold text-emerald-700">`
);

content = content.replace(
  `<span className={row.unsettled > 0 ? 'text-amber-400' : 'text-slate-500'}>`,
  `<span className={row.unsettled > 0 ? 'text-amber-600' : 'text-slate-400'}>`
);

content = content.replace(
  `<td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">`,
  `<td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">`
);

content = content.replace(
  `<td className="py-3.5 px-4 font-mono text-emerald-400">`,
  `<td className="py-3.5 px-4 font-mono text-slate-600">`
);

// 8. Replace the 4 monthly action buttons with ActionsDropdown
const oldMonthlyActionsRegex = /<td className="py-3\.5 px-4 text-center whitespace-nowrap sticky right-0 bg-\[#0F172A\] z-10 border-l border-slate-800\/80 min-w-\[220px\]">[\s\S]*?<\/td>/;
const newMonthlyActions = `<td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <ActionsDropdown
                            items={[
                              {
                                id: 'view',
                                label: 'View',
                                icon: <Eye className="w-4 h-4 text-slate-700" />,
                                onClick: () => setHistoryModalTarget(row)
                              },
                              {
                                id: 'pay',
                                label: 'Pay',
                                icon: <CreditCard className="w-4 h-4 text-slate-700" />,
                                onClick: () => {
                                  if (!canEdit) {
                                    showToast('Editor access required: Please log in as an authorized director or officer to record payments.');
                                    return;
                                  }
                                  handleOpenInstalmentModal(row);
                                }
                              },
                              {
                                id: 'edit',
                                label: 'Edit',
                                icon: <Edit2 className="w-4 h-4 text-slate-700" />,
                                onClick: () => {
                                  if (!canEdit) {
                                    showToast('Editor access required: Please log in as an authorized director or officer to edit records.');
                                    return;
                                  }
                                  handleOpenAddModal(row);
                                }
                              },
                              {
                                id: 'delete',
                                label: 'Delete',
                                icon: <Trash2 className="w-4 h-4 text-rose-600" />,
                                danger: true,
                                disabled: !hasDbRecord && row.amount === 0 && !row.customId,
                                onClick: () => {
                                  if (!canEdit) {
                                    showToast('Editor access required: Please log in as an authorized director or officer to delete or reverse records.');
                                    return;
                                  }
                                  handleOpenDeleteModal(row);
                                }
                              }
                            ]}
                          />
                        </td>`;

if (oldMonthlyActionsRegex.test(content)) {
  content = content.replace(oldMonthlyActionsRegex, newMonthlyActions);
}

// 9. Replace SUBVIEW 4: ALL CYCLES HISTORICAL LEDGER
const oldAllCyclesRegex = /\{\/\* =+ \*\/\}\s*\{\/\* SUBVIEW 4: ALL CYCLES HISTORICAL LEDGER[\s\S]*?\{\/\* =+ \*\/\}\s*\{\/\* MODAL 1: ADD \/ EDIT CONTRIBUTION FORM/;
const newAllCyclesBlock = `{/* ===================================================================== */}
      {/* SUBVIEW 4: ALL CYCLES HISTORICAL LEDGER                               */}
      {/* ===================================================================== */}
      {subView === 'all-cycles' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Complete Historical Contributions & Payouts Ledger ({normalizedContributions.length})
              </h2>
              <p className="text-xs text-slate-500">
                Chronological ledger of all historical member obligations, instalments, and payouts
              </p>
            </div>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search member, month, year, ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-[#E6F4EA] z-20 shadow-sm">
                <tr className="border-b border-emerald-900/10 text-[11px] font-bold uppercase text-slate-700">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Month & Year</th>
                  <th className="py-3 px-4">Member / Description</th>
                  <th className="py-3 px-4 text-right">Expected</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Unsettled</th>
                  <th className="py-3 px-4 text-right">Payout</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {normalizedContributions
                  .filter(c => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      (c.member || '').toLowerCase().includes(q) ||
                      (c.memberName || '').toLowerCase().includes(q) ||
                      c.canonicalMonth.toLowerCase().includes(q) ||
                      String(c.canonicalYear).includes(q) ||
                      (c.customId || '').toLowerCase().includes(q) ||
                      (c.id || '').toLowerCase().includes(q) ||
                      (c.status || '').toLowerCase().includes(q)
                    );
                  })
                  .map(c => (
                    <tr key={c.id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-slate-500 font-semibold">{c.id}</td>
                      <td className="py-2.5 px-4 text-emerald-700 font-semibold whitespace-nowrap">
                        {c.canonicalMonth} {c.canonicalYear}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          {c.payout === 0 && (
                            <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 ring-1 ring-emerald-500/30 bg-slate-100">
                              <img
                                src={getMemberAvatar(c.member || c.memberName)}
                                alt={c.member}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <span>{c.member}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-700">
                        {c.expectedAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-700">
                        {c.amount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-amber-600">
                        {c.unsettled.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right text-blue-600 font-bold">
                        {(c.payout || 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {c.payout > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                            Payout
                          </span>
                        ) : (
                          renderContribStatusBadge(c.status)
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        {c.payout > 0 ? (
                          <span className="text-[10px] text-slate-400 font-semibold">Protected</span>
                        ) : (
                          <ActionsDropdown
                            items={[
                              {
                                id: 'view',
                                label: 'View',
                                icon: <Eye className="w-4 h-4 text-slate-700" />,
                                onClick: () => setHistoryModalTarget({ ...c, memberName: c.member })
                              },
                              {
                                id: 'edit',
                                label: 'Edit',
                                icon: <Edit2 className="w-4 h-4 text-slate-700" />,
                                onClick: () => {
                                  if (!canEdit) {
                                    showToast('Editor access required: Please log in as an authorized director or officer to edit records.');
                                    return;
                                  }
                                  handleOpenAddModal({ ...c, memberName: c.member });
                                }
                              },
                              {
                                id: 'delete',
                                label: 'Delete',
                                icon: <Trash2 className="w-4 h-4 text-rose-600" />,
                                danger: true,
                                onClick: () => {
                                  if (!canEdit) {
                                    showToast('Editor access required: Please log in as an authorized director or officer to delete records.');
                                    return;
                                  }
                                  handleOpenDeleteModal({ ...c, memberName: c.member });
                                }
                              }
                            ]}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: ADD / EDIT CONTRIBUTION FORM`;

if (oldAllCyclesRegex.test(content)) {
  content = content.replace(oldAllCyclesRegex, newAllCyclesBlock);
}

// 10. Update SUBVIEW 2: PAYMENT HISTORY / INSTALMENTS LEDGER
content = content.replace(
  `<div className="bg-[#0F172A] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-white">
                Contribution Payment & Instalment History ({allPaymentTransactions.length})
              </h2>`,
  `<div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Contribution Payment & Instalment History ({allPaymentTransactions.length})
              </h2>`
);

content = content.replace(
  `<tr className="bg-[#090F1D] border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">`,
  `<tr className="bg-[#E6F4EA] border-b border-emerald-900/10 text-[11px] font-bold uppercase text-slate-700">`
);

content = content.replace(
  `<tr key={\`\${t.id}-\${idx}\`} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{t.paymentDate}</td>
                    <td className="py-3 px-4 font-bold text-white">`,
  `<tr key={\`\${t.id}-\${idx}\`} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{t.paymentDate}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">`
);

// 11. Update SUBVIEW 3: MEMBER CONTRIBUTION SUMMARY
content = content.replace(
  `<div className="bg-[#0F172A] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800">
            <h2 className="text-lg font-extrabold text-white">
              Cumulative Member Contribution Summary
            </h2>`,
  `<div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-base font-extrabold text-slate-900">
              Cumulative Member Contribution Summary
            </h2>`
);

content = content.replace(
  `<tr key={m.id || m.fullName} className="hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-bold text-white">{m.fullName}</td>`,
  `<tr key={m.id || m.fullName} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 ring-1 ring-emerald-500/40 bg-slate-100">
                            <img
                              src={getMemberAvatar(m.fullName)}
                              alt={m.fullName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span>{m.fullName}</span>
                        </div>
                      </td>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated ContributionsTab.tsx to light design with ActionsDropdown and CNT-016 fix.');
