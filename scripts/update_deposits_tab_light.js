const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/DepositsTab.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Import ActionsDropdown
if (!content.includes("import ActionsDropdown")) {
  content = content.replace(
    "import MemberAutocomplete from '@/components/MemberAutocomplete';",
    "import MemberAutocomplete from '@/components/MemberAutocomplete';\nimport ActionsDropdown from '@/components/ActionsDropdown';"
  );
}

// 2. Change wrapper
content = content.replace(
  '<div className="space-y-6 text-slate-100">',
  '<div className="space-y-6 text-slate-800 w-full">'
);

// 3. Change summary cards at top (lines 600-670)
content = content.replace(
  /className="bg-\[#0F172A\] border border-slate-800 rounded-2xl p-4/g,
  'className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm'
);

content = content.replace(
  /className="text-\[11px\] font-bold uppercase tracking-wider text-slate-400"/g,
  'className="text-[11px] font-bold uppercase tracking-wider text-slate-500"'
);

// 4. Change filter bar
content = content.replace(
  'className="bg-[#0F172A] border border-slate-800/90 rounded-2xl p-4',
  'className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm'
);

content = content.replace(
  /bg-\[#142036\] border border-\[#1E2D4A\]/g,
  'bg-slate-50 border border-slate-200 text-slate-800'
);

content = content.replace(
  /bg-\[#070D18\] border border-slate-700/g,
  'bg-slate-50 border border-slate-200 text-slate-800'
);

// 5. Change Deposits Register Table Container and Thead
content = content.replace(
  '<div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">',
  '<div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">'
);

content = content.replace(
  '<thead className="bg-[#121B2F] text-slate-400 uppercase text-[10px] font-bold tracking-wider">',
  '<thead className="bg-[#E6F4EA] border-b border-emerald-900/10 text-slate-700 uppercase text-[11px] font-bold tracking-wider">'
);

content = content.replace(
  '<tbody className="divide-y divide-[#1E293B] font-mono">',
  '<tbody className="divide-y divide-slate-100 font-mono text-slate-800">'
);

content = content.replace(
  /hover:bg-\[#142036\]/g,
  'hover:bg-emerald-50/20'
);

// 6. Replace the Actions buttons in DepositsTab with ActionsDropdown
const oldDepositsActionsRegex = /\{\/\* Actions \*\/\}\s*<td className="p-4 text-center whitespace-nowrap font-sans">\s*<div className="flex items-center justify-center gap-1\.5">[\s\S]*?<\/div>\s*<\/td>/;

const newDepositsActions = `{/* Actions */}
                      <td className="p-4 text-center whitespace-nowrap font-sans">
                        <ActionsDropdown
                          items={[
                            {
                              id: 'view',
                              label: 'View',
                              icon: <Eye className="w-4 h-4 text-slate-700" />,
                              onClick: () => {
                                setViewingDeposit(dep);
                                setIsDetailsModalOpen(true);
                              }
                            },
                            {
                              id: 'reconcile',
                              label: 'Reconcile',
                              icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
                              hidden: !canEdit || isRev,
                              onClick: () => handleOpenReconcileModal(dep)
                            },
                            {
                              id: 'edit',
                              label: 'Edit',
                              icon: <Edit3 className="w-4 h-4 text-slate-700" />,
                              hidden: !canEdit || isRev,
                              onClick: () => handleOpenEditModal(dep)
                            },
                            {
                              id: 'reverse',
                              label: 'Reverse',
                              icon: <RotateCcw className="w-4 h-4 text-rose-600" />,
                              danger: true,
                              hidden: !canEdit || isRev,
                              onClick: () => handleOpenReverseModal(dep)
                            }
                          ]}
                        />
                      </td>`;

if (oldDepositsActionsRegex.test(content)) {
  content = content.replace(oldDepositsActionsRegex, newDepositsActions);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated DepositsTab.tsx with light redesign and ActionsDropdown.');
