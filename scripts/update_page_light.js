const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Import ActionsDropdown
if (!content.includes("import ActionsDropdown")) {
  content = content.replace(
    "import LoanPortfolioTab from '@/components/LoanPortfolioTab';",
    "import LoanPortfolioTab from '@/components/LoanPortfolioTab';\nimport ActionsDropdown from '@/components/ActionsDropdown';"
  );
}

// 2. Main layout background and sidebar
content = content.replace(
  '<div className="flex h-screen bg-[#070D18] text-slate-100 overflow-hidden font-sans">',
  '<div className="flex h-screen bg-[#F4F6F8] text-slate-800 overflow-hidden font-sans">'
);

// Sidebar background to deep forest green
content = content.replace(
  '<aside className="w-64 bg-[#0A101D] border-r border-[#152136] flex flex-col p-4 overflow-y-auto shrink-0 select-none">',
  '<aside className="w-64 bg-[#064E3B] border-r border-emerald-950 flex flex-col p-4 overflow-y-auto shrink-0 select-none text-white">'
);

// Header background to clean white
content = content.replace(
  '<header className="h-16 bg-[#0A101D] border-b border-[#152136] px-8 flex items-center justify-between shrink-0 select-none">',
  '<header className="h-16 bg-white border-b border-slate-200 px-6 md:px-8 flex items-center justify-between shrink-0 select-none shadow-sm">'
);

// Header search input
content = content.replace(
  'className="w-full bg-[#10192A] border border-[#1E2E4E] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-inner"',
  'className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-inner"'
);

// Header date badge
content = content.replace(
  '<div className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#10192A] border border-[#1E2E4E] text-slate-200 text-xs font-semibold shadow-inner">',
  '<div className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-inner">'
);

// Header quick icons
content = content.replace(
  /className="w-9 h-9 rounded-xl bg-\[#10192A\] border border-\[#1E2E4E\] flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-600 transition"/g,
  'className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"'
);

// Header user profile button
content = content.replace(
  '<p className="text-xs font-bold text-white leading-tight">{currentUser?.name || \'Authorized Member\'}</p>',
  '<p className="text-xs font-bold text-slate-900 leading-tight">{currentUser?.name || \'Authorized Member\'}</p>'
);

// Main content container
content = content.replace(
  '<main className={`flex-1 p-4 md:p-8 overflow-y-auto ${activeTab === \'Loan Portfolio\' ? \'bg-[#F2F7F4]\' : \'\'}`} id="dashboard-content-area">',
  '<main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-[#F4F6F8]" id="dashboard-content-area">'
);

// Top Title Bar headings
content = content.replace(
  '<h1 className="text-2xl font-extrabold text-white tracking-tight">{activeTab === \'Overview\' ? \'Dashboard Overview\' : activeTab}</h1>',
  '<h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{activeTab === \'Overview\' ? \'Dashboard Overview\' : activeTab}</h1>'
);

content = content.replace(
  '<p className="text-xs text-slate-400 mt-0.5">Dreamloom Holding Limited • Confidential Financial Register</p>',
  '<p className="text-xs text-slate-500 mt-0.5">Dreamloom Holding Limited • Confidential Financial Register</p>'
);

// Top title bar dropdowns
content = content.replace(
  /className="bg-\[#10192A\] border border-\[#1E2E4E\] hover:border-slate-500 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none cursor-pointer pr-7 appearance-none transition font-medium"/g,
  'className="bg-white border border-slate-200 hover:border-slate-400 text-slate-800 text-xs px-3 py-2 rounded-xl focus:outline-none cursor-pointer pr-7 appearance-none transition font-medium shadow-sm"'
);

content = content.replace(
  /className="bg-\[#10192A\] border border-\[#1E2E4E\] hover:border-slate-500 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none cursor-pointer pr-7 appearance-none transition font-bold"/g,
  'className="bg-white border border-slate-200 hover:border-slate-400 text-slate-800 text-xs px-3 py-2 rounded-xl focus:outline-none cursor-pointer pr-7 appearance-none transition font-bold shadow-sm"'
);

content = content.replace(
  /className="bg-\[#10192A\] border border-\[#1E2E4E\] hover:border-slate-500 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none cursor-pointer pr-7 appearance-none transition font-semibold"/g,
  'className="bg-white border border-slate-200 hover:border-slate-400 text-slate-800 text-xs px-3 py-2 rounded-xl focus:outline-none cursor-pointer pr-7 appearance-none transition font-semibold shadow-sm"'
);

// Top Export Report button
content = content.replace(
  `className="bg-[#10192A] border border-[#1E2E4E] hover:bg-[#15233B] text-slate-200 text-xs font-medium px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition"`,
  `className="bg-[#0A5C36] hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition"`
);

// 3. Member Directory Table & Actions
const oldMemberTableRegex = /\{\/\* =+ \*\/\}\s*\{activeTab === 'Member Directory' && \([\s\S]*?\{activeTab === 'Contributions'/;
const newMemberTableBlock = `{/* ===================================================================== */}
          {activeTab === 'Member Directory' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h2 className="font-extrabold text-slate-900 text-base">Membership Directory & Contact Register</h2>
                    <p className="text-xs text-slate-500">Official Register from Dreamloom Holding Limited (Page 3 of 17)</p>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => handleOpenQuickModal('Member Directory')}
                      className="px-3.5 py-1.5 bg-[#0A5C36] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Member Record
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-800">
                    <thead className="bg-[#E6F4EA] border-b border-emerald-900/10 text-slate-700 uppercase text-[11px] font-bold tracking-wider">
                      <tr>
                        <th className="p-4">Member Name</th>
                        <th className="p-4">National ID</th>
                        <th className="p-4">Phone Number</th>
                        <th className="p-4">Role / Status</th>
                        <th className="p-4">Email Address</th>
                        <th className="p-4 text-center">Profile / Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMembers.map((m) => (
                        <tr key={m.id} className="hover:bg-emerald-50/20 transition">
                          <td className="p-4 font-semibold text-slate-900">
                            <div
                              onClick={() => setSelectedMemberProfile(m)}
                              className="flex items-center gap-3 cursor-pointer group"
                            >
                              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2 ring-emerald-500/40 bg-slate-100 shadow-sm group-hover:ring-emerald-600 transition">
                                <img
                                  src={m.avatar || getMemberAvatar(m.fullName || m.id)}
                                  alt={m.fullName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <span className="block font-bold text-slate-900 text-xs group-hover:text-emerald-700 transition">{m.fullName}</span>
                                <span className="block text-[10px] text-slate-500 font-mono">{m.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-emerald-700 font-bold">{m.nationalId}</td>
                          <td className="p-4 font-mono text-slate-600">{m.phone}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[10px] font-bold">
                              {m.role}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-slate-600">{m.email}</td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <ActionsDropdown
                              items={[
                                {
                                  id: 'view',
                                  label: 'View Profile',
                                  icon: <Eye className="w-4 h-4 text-slate-700" />,
                                  onClick: () => setSelectedMemberProfile(m)
                                },
                                {
                                  id: 'edit',
                                  label: 'Edit Info',
                                  icon: <Edit3 className="w-4 h-4 text-slate-700" />,
                                  hidden: !canEdit,
                                  onClick: () => handleOpenEditModal(m, 'Member Directory')
                                }
                              ]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {activeTab === 'Contributions'`;

if (oldMemberTableRegex.test(content)) {
  content = content.replace(oldMemberTableRegex, newMemberTableBlock);
}

// 4. Fines & Penalties light styling & ActionsDropdown
content = content.replace(
  `<div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
                  <div className="p-5 border-b border-[#1E293B] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="font-bold text-white text-base">Fines & Late Payment Penalties Register</h2>
                      <p className="text-xs text-slate-400">Exclusively tracking the KSh 500 late-payment fines for monthly contributions</p>
                    </div>`,
  `<div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="font-extrabold text-slate-900 text-base">Fines & Late Payment Penalties Register</h2>
                      <p className="text-xs text-slate-500">Exclusively tracking the KSh 500 late-payment fines for monthly contributions</p>
                    </div>`
);

content = content.replace(
  '<thead className="bg-[#121B2F] text-slate-400 uppercase text-[10px] font-bold tracking-wider">',
  '<thead className="bg-[#E6F4EA] border-b border-emerald-900/10 text-slate-700 uppercase text-[11px] font-bold tracking-wider">'
);

// Replace actions in Fines rows
const oldFinesActionRegex = /\{canEdit && \(\s*<td className="p-4 text-center font-sans">\s*<div className="flex items-center justify-center gap-2">[\s\S]*?<\/td>\s*\)\}/;

const newFinesAction = `{canEdit && (
                                  <td className="p-4 text-center font-sans whitespace-nowrap">
                                    <ActionsDropdown
                                      items={[
                                        {
                                          id: 'settle',
                                          label: isPaid ? 'Mark Unpaid' : 'Mark Paid',
                                          icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
                                          onClick: () => handleToggleFineStatus(f.id)
                                        },
                                        {
                                          id: 'edit',
                                          label: 'Edit',
                                          icon: <Edit3 className="w-4 h-4 text-slate-700" />,
                                          onClick: () => handleOpenEditModal(f, 'Fines & Penalties')
                                        },
                                        {
                                          id: 'delete',
                                          label: 'Delete',
                                          icon: <Trash2 className="w-4 h-4 text-rose-600" />,
                                          danger: true,
                                          onClick: async () => {
                                            const confirmDel = window.confirm(\`Permanently delete penalty record for \${memberName} (\${displayMonth})?\`);
                                            if (!confirmDel) return;
                                            try {
                                              const targetDbId = f.dbId || f.id;
                                              const userEmail = currentUser?.email || 'simon@dreamloom.co.ke';
                                              const res = await fetch(\`/api/penalties?id=\${encodeURIComponent(String(targetDbId))}&userEmail=\${encodeURIComponent(userEmail)}\`, {
                                                method: 'DELETE'
                                              });
                                              if (res.ok) {
                                                setFines(prev => prev.filter(item => item.id !== f.id));
                                                await refreshPenalties();
                                                setToastMessage('Penalty record deleted successfully.');
                                              } else {
                                                setToastMessage('Failed to delete penalty record.');
                                              }
                                            } catch (e) {
                                              setToastMessage('Error deleting penalty.');
                                            }
                                          }
                                        }
                                      ]}
                                    />
                                  </td>
                                )}`;

if (oldFinesActionRegex.test(content)) {
  content = content.replace(oldFinesActionRegex, newFinesAction);
}

// 5. Expenses table light styling and ActionsDropdown
content = content.replace(
  `<div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-[#1E293B] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="font-bold text-white text-base">Operational Expenses & Cash Payouts Register</h2>`,
  `<div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="font-extrabold text-slate-900 text-base">Operational Expenses & Cash Payouts Register</h2>`
);

content = content.replace(
  '<thead className="bg-[#121B2F] text-slate-400 uppercase text-[10px] font-bold sticky top-0 z-10">',
  '<thead className="bg-[#E6F4EA] border-b border-emerald-900/10 text-slate-700 uppercase text-[11px] font-bold sticky top-0 z-10">'
);

content = content.replace(
  '<tbody className="divide-y divide-[#1E293B] font-mono">',
  '<tbody className="divide-y divide-slate-100 font-mono text-slate-800">'
);

// Replace expense actions
const oldExpenseActionRegex = /\{canEdit && \(\s*<td className="p-4 text-center font-sans">\s*<button[\s\S]*?<\/button>\s*<\/td>\s*\)\}/;

const newExpenseAction = `{canEdit && (
                          <td className="p-4 text-center font-sans whitespace-nowrap">
                            <ActionsDropdown
                              items={[
                                {
                                  id: 'edit',
                                  label: 'Edit',
                                  icon: <Edit3 className="w-4 h-4 text-slate-700" />,
                                  onClick: () => handleOpenEditModal(exp, 'Expenses')
                                },
                                {
                                  id: 'delete',
                                  label: 'Delete',
                                  icon: <Trash2 className="w-4 h-4 text-rose-600" />,
                                  danger: true,
                                  onClick: async () => {
                                    const confirmDel = window.confirm(\`Delete expense record "\${exp.description}"?\`);
                                    if (!confirmDel) return;
                                    try {
                                      const res = await fetch(\`/api/expenses?id=\${encodeURIComponent(String(exp.id))}&userEmail=\${encodeURIComponent(currentUser?.email || 'simon@dreamloom.co.ke')}\`, {
                                        method: 'DELETE'
                                      });
                                      if (res.ok) {
                                        setExpenses(prev => prev.filter(item => item.id !== exp.id));
                                        setToastMessage('Expense deleted.');
                                      }
                                    } catch (e) {}
                                  }
                                }
                              ]}
                            />
                          </td>
                        )}`;

if (oldExpenseActionRegex.test(content)) {
  content = content.replace(oldExpenseActionRegex, newExpenseAction);
}

// 6. Member Profile Modal light theme
content = content.replace(
  `<div className="bg-[#0F172A] border border-[#1E293B] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">`,
  `<div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200 text-slate-800">`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated page.tsx with light redesign and ActionsDropdown.');
