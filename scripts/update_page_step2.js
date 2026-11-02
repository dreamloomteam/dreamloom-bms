const fs = require('fs');

let page = fs.readFileSync('src/app/page.tsx', 'utf8');

// Replace members initial state
const oldMembersRegex = /const \[members, setMembers\] = useState\(\[\s*\{[\s\S]*?\}\s*\]\);/;
page = page.replace(oldMembersRegex, 'const [members, setMembers] = useState(initialMembers);');

// Replace loans initial state
const oldLoansRegex = /const \[loans, setLoans\] = useState\(\[\s*\/\/ Settled Loans[\s\S]*?\}\s*\]\);/;
page = page.replace(oldLoansRegex, 'const [loans, setLoans] = useState(initialLoans);');

// Replace expenses initial state
const oldExpensesRegex = /const \[expenses, setExpenses\] = useState\(\[\s*\{ id: 'EXP-01'[\s\S]*?\}\s*\]\);/;
page = page.replace(oldExpensesRegex, 'const [expenses, setExpenses] = useState(initialExpenses);');

// Replace fines initial state
const oldFinesRegex = /const \[fines, setFines\] = useState\(\[\s*\{ id: 'FN-01'[\s\S]*?\}\s*\]\);/;
page = page.replace(oldFinesRegex, 'const [fines, setFines] = useState(initialFines);');

// Replace defaultOfficialContributions
const oldContribRegex = /const defaultOfficialContributions = \[[\s\S]*?\];\s*const \[contributions, setContributions\] = useState\(defaultOfficialContributions\);/;
page = page.replace(oldContribRegex, 'const defaultOfficialContributions = initialContributions;\n  const [contributions, setContributions] = useState(initialContributions);');

fs.writeFileSync('src/app/page.tsx', page, 'utf8');
console.log('Replaced all initial state arrays with initialData successfully.');
