const fs = require('fs');

let page = fs.readFileSync('src/app/page.tsx', 'utf8');

// CSV Exporter helpers
const csvHelperCode = `
  // Helper to export data as CSV file
  const exportDataAsCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => \`"\${String(cell).replace(/"/g, '""')}"\`).join(','))
    ].join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
`;

if (!page.includes('exportDataAsCSV')) {
  page = page.replace(
    "const handleExportReport = async () => {",
    `${csvHelperCode}\n  const handleExportReport = async () => {`
  );
}

// Handler to save all entries for selected contribution month
const monthlySaveHandler = `
  // Batch Save / Update Monthly Contributions to LocalStorage & Neon Database
  const handleSaveMonthlyContributions = async (monthName: string) => {
    if (!canEdit) {
      alert('Access Restricted: Only Simon Memia Wanjiru and Elijah Waitara Gichari can save contributions.');
      return;
    }

    const official7Members = [
      'Simon Memia Wanjiru',
      'David Wainaina Kinyua',
      'Elijah Waitara Gichari',
      'Samuel Kamau Nguuro',
      'Michael Kiarie Wanjiru',
      'Daniel Kamau Njiriri',
      'Beatrice Njoki Muthoni'
    ];

    let currentList = [...contributions];
    const updatedRecordsToSave: any[] = [];

    for (const memberName of official7Members) {
      const input = monthlyInputs[memberName];
      const existingIdx = currentList.findIndex(c => c.month === monthName && c.member === memberName);
      
      const amt = input?.amount !== undefined ? input.amount : (existingIdx >= 0 ? currentList[existingIdx].amount : 6000);
      const unsettledVal = input?.unsettled !== undefined ? input.unsettled : (existingIdx >= 0 ? currentList[existingIdx].unsettled : 0);
      const notesVal = input?.remarks !== undefined ? input.remarks : (existingIdx >= 0 ? currentList[existingIdx].notes : 'Monthly Contribution');
      const payoutVal = existingIdx >= 0 ? currentList[existingIdx].payout : 0;
      const recId = existingIdx >= 0 ? currentList[existingIdx].id : \`CNT-\${Date.now()}-\${Math.floor(Math.random()*1000)}\`;

      const recordObj = {
        id: recId,
        month: monthName,
        member: memberName,
        amount: amt,
        unsettled: unsettledVal,
        payout: payoutVal,
        notes: notesVal
      };

      if (existingIdx >= 0) {
        currentList[existingIdx] = recordObj;
      } else {
        currentList.push(recordObj);
      }

      updatedRecordsToSave.push(recordObj);
    }

    setContributions(currentList);
    try {
      localStorage.setItem('dreamloom_contributions', JSON.stringify(currentList));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    // Persist each record to Neon PostgreSQL via PUT upsert
    try {
      for (const rec of updatedRecordsToSave) {
        await fetch('/api/contributions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: currentUser?.email,
            customId: rec.id,
            memberName: rec.member,
            month: rec.month,
            amount: rec.amount,
            unsettled: rec.unsettled,
            payout: rec.payout,
            notes: rec.notes
          })
        });
      }
      alert(\`Successfully saved contributions for \${monthName} to database and local system.\`);
    } catch (err) {
      console.error('Failed to save monthly records to database:', err);
      alert(\`Saved locally, but server update had a warning: \${(err as Error).message}\`);
    }
  };
`;

if (!page.includes('handleSaveMonthlyContributions')) {
  page = page.replace(
    "const handleExportReport = async () => {",
    `${monthlySaveHandler}\n  const handleExportReport = async () => {`
  );
}

fs.writeFileSync('src/app/page.tsx', page, 'utf8');
console.log('Added CSV helpers and handleSaveMonthlyContributions.');
