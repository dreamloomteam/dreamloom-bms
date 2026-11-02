const xlsx = require('xlsx');

const wbPath = 'C:/Users/micha/.gemini/antigravity/brain/9da59dd7-d23c-4f7e-b68a-7e63a5fb442a/.user_uploaded/media_1793635812298_3a7c6652.xlsx';
const wb = xlsx.readFile(wbPath, { cellDates: true });
const ws = wb.Sheets['CONTRIBUTIONS '];
const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });

const months = [
  'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026',
  'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026',
  'Oct 2026', 'Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027', 'Mar 2027',
  'Apr 2027', 'May 2027', 'Jun 2027'
];

let mIndex = 0;
let results = [];
for (let i = 3; i < rows.length; i++) {
  const r = rows[i];
  if (!r || !r[1]) continue;
  const col1 = String(r[1]).trim();
  if (col1.startsWith('Mawega Payout')) continue;
  if (col1.startsWith('Total (')) {
    mIndex++;
    continue;
  }
  if (col1.startsWith('GRAND TOTAL')) break;
  results.push({
    month: months[mIndex] || ('Month-' + mIndex),
    member: col1,
    amount: Number(r[3]) || 0
  });
}

const summary = {};
results.forEach(x => {
  summary[x.member] = (summary[x.member] || 0) + x.amount;
});
console.log('Member sums from contributions:');
console.log(summary);
