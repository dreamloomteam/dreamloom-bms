const fs = require('fs');
const path = require('path');

const initialData = require('../src/lib/initialData.json');

console.log('Writing initial data export...');
fs.writeFileSync('src/lib/initialData.ts', `// Authoritative initial data from DREAMLOOM_Financial_System_Upgraded.xlsx
export const initialMembers = ${JSON.stringify(initialData.members, null, 2)};

export const initialLoans = ${JSON.stringify(initialData.loans, null, 2)};

export const initialContributions = ${JSON.stringify(initialData.contributions, null, 2)};

export const initialExpenses = ${JSON.stringify(initialData.expenses, null, 2)};

export const initialFines = ${JSON.stringify(initialData.fines, null, 2)};
`);

console.log('Generated src/lib/initialData.ts successfully.');
