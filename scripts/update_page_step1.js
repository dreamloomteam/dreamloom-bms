const fs = require('fs');

let page = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Add import of initialData
if (!page.includes('initialMembers')) {
  page = page.replace(
    "import React, { useState, useMemo, useEffect } from 'react';",
    "import React, { useState, useMemo, useEffect } from 'react';\nimport { initialMembers, initialLoans, initialContributions, initialExpenses, initialFines } from '@/lib/initialData';"
  );
}

// 2. Add Monthly Entry state variables right after core app states
const monthlyEntryStates = `
  // Monthly Contributions Entry State
  const contributionMonthsList = [
    'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026',
    'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026',
    'Oct 2026', 'Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027', 'Mar 2027',
    'Apr 2027', 'May 2027', 'Jun 2027'
  ];
  const [selectedContributionCycle, setSelectedContributionCycle] = useState('October 2026');
  const [contributionSearchMember, setContributionSearchMember] = useState('');
  const [contributionSubView, setContributionSubView] = useState<'monthly' | 'register'>('monthly');

  // Working state for monthly entries row editing
  const [monthlyInputs, setMonthlyInputs] = useState<Record<string, { amount: number; paymentDate: string; remarks: string; unsettled: number; penalty: number }>>({});
`;

if (!page.includes('contributionSubView')) {
  page = page.replace(
    "const [activeTab, setActiveTab] = useState('Overview');",
    `const [activeTab, setActiveTab] = useState('Overview');\n${monthlyEntryStates}`
  );
}

console.log('Processed step 1 & 2.');
fs.writeFileSync('src/app/page.tsx', page, 'utf8');
