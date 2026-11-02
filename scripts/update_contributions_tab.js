const fs = require('fs');

let page = fs.readFileSync('src/app/page.tsx', 'utf8');

// The new Contributions view containing both sub-views:
// Sub-view 1: Monthly Contributions Entry (as in uploaded screenshot)
// Sub-view 2: Full Master Contributions & Land Payouts Register
const newContributionsSection = `          {/* ===================================================================== */}
          {/* CONTRIBUTIONS MODULE: MONTHLY ENTRY & MASTER REGISTER */}
          {/* ===================================================================== */}
          {activeTab === 'Contributions' && (
            <div className="space-y-6">
              {/* TOP HEADER & SUB-TAB TOGGLE */}
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <h2 className="font-extrabold text-white text-lg tracking-wide uppercase">Contributions Register</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Manage member monthly contributions, late payment indicators, and penalties</p>
                </div>

                {/* VIEW SWITCHER */}
                <div className="flex items-center bg-[#142036] p-1 rounded-xl border border-[#1E2D4A]">
                  <button
                    onClick={() => setContributionSubView('monthly')}
                    className={\`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition \${
                      contributionSubView === 'monthly'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }\`}
                  >
                    Monthly Entry Tab
                  </button>
                  <button
                    onClick={() => setContributionSubView('register')}
                    className={\`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition \${
                      contributionSubView === 'register'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }\`}
                  >
                    All Cycles Ledger ({contributions.length})
                  </button>
                </div>
              </div>

              {/* VIEW 1: MONTHLY CONTRIBUTIONS ENTRY TAB (EXACT DESIGN FROM SCREENSHOT) */}
              {contributionSubView === 'monthly' && (() => {
                const cycleRecords = contributions.filter(c => c.month === selectedContributionCycle && !c.payout);
                const official7Members = [
                  'Simon Memia Wanjiru',
                  'David Wainaina Kinyua',
                  'Elijah Waitara Gichari',
                  'Samuel Kamau Nguuro',
                  'Michael Kiarie Wanjiru',
                  'Daniel Kamau Njiriri',
                  'Beatrice Njoki Muthoni'
                ];

                // Metrics for this selected month
                const expectedThisMonth = 42000.00; // 7 members * 6000
                const receivedThisMonth = cycleRecords.reduce((s, c) => s + (Number(c.amount) || 0), 0);
                const outstandingThisMonth = cycleRecords.reduce((s, c) => s + (Number(c.unsettled) || 0), 0);
                const penaltiesThisMonth = fines.filter(f => {
                  const fDate = f.date || '';
                  return fDate.includes(selectedContributionCycle.slice(0, 3)) || fDate.includes('2026-10');
                }).reduce((s, f) => s + (f.amount || 500), 0) || (selectedContributionCycle.includes('Oct 2026') ? 1000 : 0);

                const paidCount = cycleRecords.filter(c => Number(c.amount) > 0).length;
                const unpaidCount = 7 - paidCount;

                // Filter members by search input
                const displayedMembers = official7Members.filter(m =>
                  m.toLowerCase().includes(contributionSearchMember.toLowerCase())
                );

                return (
                  <div className="space-y-6">
                    {/* STAT CARDS BANNER (AS IN SCREENSHOT) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Expected */}
                      <div className="bg-[#101B30] border border-blue-500/20 rounded-2xl p-4 shadow-lg flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-slate-400">Expected This Month</p>
                          <p className="text-xl font-extrabold text-white font-mono mt-0.5">KES {expectedThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>

                      {/* Received */}
                      <div className="bg-[#101B30] border border-emerald-500/20 rounded-2xl p-4 shadow-lg flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-slate-400">Received ({paidCount} Paid)</p>
                          <p className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">KES {receivedThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>

                      {/* Outstanding */}
                      <div className="bg-[#101B30] border border-amber-500/20 rounded-2xl p-4 shadow-lg flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                          <Clock className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-slate-400">Outstanding ({unpaidCount} Pending)</p>
                          <p className="text-xl font-extrabold text-amber-400 font-mono mt-0.5">KES {outstandingThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>

                      {/* Penalties */}
                      <div className="bg-[#101B30] border border-rose-500/20 rounded-2xl p-4 shadow-lg flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-slate-400">Penalties Levied</p>
                          <p className="text-xl font-extrabold text-rose-400 font-mono mt-0.5">KES {penaltiesThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    </div>

                    {/* CONTROLS BAR: Month, Year, Search, and Export (Screenshot Top Bar) */}
                    <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 shadow-xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-slate-400">Cycle / Month:</label>
                          <select
                            value={selectedContributionCycle}
                            onChange={(e) => setSelectedContributionCycle(e.target.value)}
                            className="bg-[#142036] border border-[#1E2D4A] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
                          >
                            {contributionMonthsList.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>

                        {canEdit && (
                          <button
                            onClick={() => handleSaveMonthlyContributions(selectedContributionCycle)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/60 transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Save Month Entries
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative flex-1 md:w-56">
                          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Search Member..."
                            value={contributionSearchMember}
                            onChange={(e) => setContributionSearchMember(e.target.value)}
                            className="w-full bg-[#142036] border border-[#1E2D4A] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        {/* EXPORT OPTIONS DROPDOWN */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              const headers = ['#', 'Member Name', 'Month', 'Expected (KES)', 'Amount Paid (KES)', 'Unsettled (KES)', 'Status', 'Remarks'];
                              const rows = displayedMembers.map((m, idx) => {
                                const rec = cycleRecords.find(c => c.member === m);
                                const amt = rec ? rec.amount : 0;
                                const status = amt > 0 ? 'Paid' : 'Unpaid';
                                return [idx + 1, m, selectedContributionCycle, 6000, amt, rec ? rec.unsettled : 0, status, rec ? rec.notes : ''];
                              });
                              exportDataAsCSV(\`Dreamloom_\${selectedContributionCycle.replace(/\\s+/g, '_')}_Contributions.csv\`, headers, rows);
                            }}
                            className="px-3 py-1.5 bg-[#142036] border border-[#1E2D4A] hover:bg-[#1A2A46] text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                            title="Download CSV for this month"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-400" /> Export Month
                          </button>
                          <button
                            onClick={() => {
                              const headers = ['#', 'Member Name', 'Month', 'Outstanding Amount (KES)', 'Contact Phone'];
                              const rows = displayedMembers.filter(m => {
                                const rec = cycleRecords.find(c => c.member === m);
                                return !rec || rec.amount === 0;
                              }).map((m, idx) => {
                                const memObj = members.find(x => x.fullName === m);
                                return [idx + 1, m, selectedContributionCycle, 6000, memObj ? memObj.phone : ''];
                              });
                              exportDataAsCSV(\`Dreamloom_\${selectedContributionCycle.replace(/\\s+/g, '_')}_Outstanding_Members.csv\`, headers, rows);
                            }}
                            className="px-3 py-1.5 bg-[#142036] border border-[#1E2D4A] hover:bg-[#1A2A46] text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                            title="Download list of members who have not paid"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Outstanding List
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* MONTHLY CONTRIBUTIONS TABLE (EXACT COLUMNS FROM SCREENSHOT) */}
                    <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-[#121B2F] text-slate-400 uppercase text-[10px] font-bold">
                            <tr>
                              <th className="p-4 w-10">#</th>
                              <th className="p-4">Member Name</th>
                              <th className="p-4 text-center">Contribution (KES)</th>
                              <th className="p-4 text-center">LPI</th>
                              <th className="p-4 text-center">Penalty (KES)</th>
                              <th className="p-4 text-right">Amount Paid</th>
                              <th className="p-4">Payment Date</th>
                              <th className="p-4 text-center">Status</th>
                              <th className="p-4">Remarks</th>
                              {canEdit && <th className="p-4 text-center">Action</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1E293B] font-mono">
                            {displayedMembers.map((memberName, idx) => {
                              const rec = cycleRecords.find(c => c.member === memberName);
                              const input = monthlyInputs[memberName];

                              const amtPaid = input?.amount !== undefined ? input.amount : (rec ? rec.amount : (selectedContributionCycle.includes('2027') ? 0 : 6000));
                              const isPaid = amtPaid > 0;
                              const isLate = rec?.notes?.toLowerCase().includes('late') || rec?.unsettled > 0;
                              const paymentDate = input?.paymentDate || (isPaid ? (selectedContributionCycle.includes('Oct 2026') ? '28-Oct-2026' : '15th') : '-');
                              const remarks = input?.remarks !== undefined ? input.remarks : (rec?.notes || (isPaid ? 'On time' : 'Pending payment'));
                              const penaltyVal = input?.penalty !== undefined ? input.penalty : (isLate ? 500 : 0);

                              return (
                                <tr key={memberName} className="hover:bg-[#142036] transition">
                                  <td className="p-4 text-slate-500 font-sans">{idx + 1}</td>
                                  <td className="p-4 font-sans text-white font-medium">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">
                                        {memberName.split(' ')[0][0]}
                                      </div>
                                      <span>{memberName}</span>
                                    </div>
                                  </td>
                                  <td className="p-4 text-center text-slate-300">
                                    6,000.00
                                  </td>
                                  <td className="p-4 text-center font-sans">
                                    {isPaid && !isLate ? (
                                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                                        ✓
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-bold text-xs">
                                        •
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 text-center font-sans">
                                    {penaltyVal > 0 ? (
                                      <span className="text-rose-400 font-bold">{penaltyVal}</span>
                                    ) : (
                                      <span className="text-slate-500">-</span>
                                    )}
                                  </td>
                                  <td className="p-4 text-right">
                                    {canEdit ? (
                                      <input
                                        type="number"
                                        value={amtPaid}
                                        onChange={(e) => {
                                          const val = Number(e.target.value) || 0;
                                          setMonthlyInputs(prev => ({
                                            ...prev,
                                            [memberName]: {
                                              ...prev[memberName],
                                              amount: val,
                                              unsettled: val >= 6000 ? 0 : (6000 - val),
                                              paymentDate: val > 0 ? 'Today' : '-',
                                              remarks: val >= 6000 ? 'On time' : (val > 0 ? 'Partial payment' : 'Pending payment'),
                                              penalty: val < 6000 && val > 0 ? 500 : 0
                                            }
                                          }));
                                        }}
                                        className="w-24 bg-[#142036] border border-[#1E2D4A] rounded-lg px-2 py-1 text-right text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                                      />
                                    ) : (
                                      <span className={\`font-bold \${amtPaid > 0 ? 'text-emerald-400' : 'text-slate-500'}\`}>
                                        {amtPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 text-slate-400 font-sans text-xs">
                                    {paymentDate}
                                  </td>
                                  <td className="p-4 text-center font-sans">
                                    <span className={\`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase \${
                                      isPaid && !isLate
                                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                        : isLate
                                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                    }\`}>
                                      {isPaid && !isLate ? 'Paid' : isLate ? 'Late' : 'Unpaid'}
                                    </span>
                                  </td>
                                  <td className="p-4 font-sans text-slate-300 text-xs">
                                    {remarks}
                                  </td>
                                  {canEdit && (
                                    <td className="p-4 text-center font-sans">
                                      <div className="flex items-center justify-center gap-1.5">
                                        {rec && (
                                          <button
                                            onClick={() => handleOpenEditModal(rec, 'Contributions')}
                                            className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded transition"
                                            title="Edit this contribution record"
                                          >
                                            <Edit3 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        {rec && (
                                          <button
                                            onClick={async () => {
                                              if (!window.confirm(\`Delete contribution record for \${memberName} in \${selectedContributionCycle}?\`)) return;
                                              const remaining = contributions.filter(c => c.id !== rec.id);
                                              setContributions(remaining);
                                              try { localStorage.setItem('dreamloom_contributions', JSON.stringify(remaining)); } catch(e){}
                                              fetch(\`/api/contributions?customId=\${encodeURIComponent(rec.id)}&userEmail=\${encodeURIComponent(currentUser?.email || '')}\`, { method: 'DELETE' });
                                            }}
                                            className="p-1 text-rose-400 hover:bg-rose-500/10 rounded transition"
                                            title="Delete this record"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                            {/* TOTALS FOOTER ROW */}
                            <tr className="bg-[#121B2F] font-bold text-white text-xs">
                              <td className="p-4 uppercase font-sans" colSpan={2}>Total ({selectedContributionCycle})</td>
                              <td className="p-4 text-center font-black">42,000.00</td>
                              <td className="p-4 text-center font-sans">-</td>
                              <td className="p-4 text-center text-rose-400 font-black">{penaltiesThisMonth > 0 ? penaltiesThisMonth : '-'}</td>
                              <td className="p-4 text-right text-emerald-400 font-black">{receivedThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                              <td className="p-4 text-slate-400 font-sans" colSpan={canEdit ? 4 : 3}>
                                Outstanding: KES {outstandingThisMonth.toLocaleString()} • Verified against Bank & Excel
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* VIEW 2: MASTER CONTRIBUTIONS & LAND PAYOUTS REGISTER (HISTORICAL ALL CYCLES) */}
              {contributionSubView === 'register' && (
                <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
                  <div className="p-5 border-b border-[#1E293B] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h3 className="font-bold text-white text-sm">Master Historical Contributions & Land Payouts Ledger</h3>
                      <p className="text-xs text-slate-400">Total Group Contributions: KES {grandTotalContributions.toLocaleString()} • Unsettled: KES {grandTotalUnsettled.toLocaleString()} • Payouts: KES {grandTotalMawegaPayouts.toLocaleString()}</p>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleOpenQuickModal('Contributions')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
                      >
                        <Plus className="w-3.5 h-3.5" /> Record Contribution
                      </button>
                    )}
                  </div>
                  <div className="overflow-x-auto max-h-[650px]">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-[#121B2F] text-slate-400 uppercase text-[10px] font-bold sticky top-0 z-10">
                        <tr>
                          <th className="p-4">#</th>
                          <th className="p-4">Date / Month</th>
                          <th className="p-4">Member Name</th>
                          <th className="p-4 text-right">Amount (KES)</th>
                          <th className="p-4 text-right text-amber-300">Unsettled Contributions (KES)</th>
                          <th className="p-4 text-right">Mawega Payout (KES)</th>
                          <th className="p-4">Notes / Remarks</th>
                          {canEdit && <th className="p-4 text-center">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E293B] font-mono">
                        {filteredContributions.map((c, idx) => (
                          <tr key={c.id} className="hover:bg-[#142036] transition">
                            <td className="p-4 text-slate-500">{idx + 1}</td>
                            <td className="p-4 text-slate-400">{c.month}</td>
                            <td className="p-4 font-sans text-white font-medium">{c.member}</td>
                            <td className="p-4 text-right font-bold text-emerald-400">
                              {c.amount > 0 ? c.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                            </td>
                            <td className="p-4 text-right font-bold text-amber-400">
                              {c.unsettled > 0 ? c.unsettled.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                            </td>
                            <td className="p-4 text-right font-bold text-sky-400">
                              {c.payout > 0 ? c.payout.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                            </td>
                            <td className="p-4 font-sans text-slate-400">{c.notes || '-'}</td>
                            {canEdit && (
                              <td className="p-4 text-center font-sans">
                                <button
                                  onClick={() => handleOpenEditModal(c, 'Contributions')}
                                  className="p-1.5 hover:text-white text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                                  title="Edit Contribution Entry"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                        <tr className="bg-[#121B2F] font-bold text-white text-xs sticky bottom-0">
                          <td className="p-4 uppercase font-sans" colSpan={3}>GRAND TOTAL CONTRIBUTIONS & PAYOUTS</td>
                          <td className="p-4 text-right text-emerald-400 font-black">{grandTotalContributions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-right text-amber-400 font-black">{grandTotalUnsettled.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-right text-sky-400 font-black">{grandTotalMawegaPayouts.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 font-sans" colSpan={canEdit ? 2 : 1}>Official Ledger Reconciled</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}`;

// Replace old Contributions section
const oldContribBlockRegex = /\{\/\* =+ \*\/\}\s*\{\/\* CONTRIBUTIONS & LAND PAYOUTS REGISTER[\s\S]*?<\/table>\s*<\/div>\s*<\/div>\s*\)\}/;
page = page.replace(oldContribBlockRegex, newContributionsSection);

fs.writeFileSync('src/app/page.tsx', page, 'utf8');
console.log('Replaced Contributions tab with Monthly Entry + Master Register views.');
