const fs = require('fs');

let page = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Update useEffect on mount to sync loans, contributions, expenses, penalties
const oldMountSync = `  // Synchronize database contributions on mount
  useEffect(() => {
    try {
      const savedContributions = localStorage.getItem('dreamloom_contributions');
      if (savedContributions) {
        try {
          const parsedC = JSON.parse(savedContributions);
          if (Array.isArray(parsedC) && parsedC.length > 0) {
            setContributions(parsedC);
          }
        } catch (err) {
          console.warn('Error reading saved contributions:', err);
        }
      }
      // Query server-side database for latest records
      fetch('/api/contributions')
        .then(r => r.json())
        .then(res => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            const mapped = res.data.map((c: any) => ({
              id: c.customId || ('CNT-' + c.id),
              month: c.monthYear,
              member: c.member?.fullName || (c.remarks?.replace('Member: ', '') || 'Simon Memia Wanjiru'),
              amount: Number(c.amount) || 0,
              unsettled: Number(c.unsettled) || 0,
              payout: Number(c.payout) || 0,
              notes: c.remarks || ''
            }));
            setContributions(mapped);
            localStorage.setItem('dreamloom_contributions', JSON.stringify(mapped));
          } else if (res.success && Array.isArray(res.data) && res.data.length === 0) {
            // Neon DB has not been seeded yet: automatically sync official workbook contributions
            fetch('/api/contributions/seed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userEmail: 'simon@dreamloom.co.ke',
                records: defaultOfficialContributions
              })
            }).catch(e => console.warn('Auto-seed skipped:', e));
          }
        })
        .catch(err => console.warn('Could not fetch server contributions:', err));
    } catch (e) {
      console.error(e);
    }
  }, []);`;

const newMountSync = `  // Synchronize database records on mount across all modules
  useEffect(() => {
    try {
      // 1. Contributions
      const savedContributions = localStorage.getItem('dreamloom_contributions');
      if (savedContributions) {
        try {
          const parsed = JSON.parse(savedContributions);
          if (Array.isArray(parsed) && parsed.length > 0) setContributions(parsed);
        } catch (e) { console.warn('Saved contributions parse failed:', e); }
      }
      fetch('/api/contributions')
        .then(r => r.json())
        .then(res => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            const mapped = res.data.map((c: any) => ({
              id: c.customId || ('CNT-' + c.id),
              month: c.monthYear,
              member: c.member?.fullName || (c.remarks?.replace('Member: ', '') || 'Simon Memia Wanjiru'),
              amount: Number(c.amount) || 0,
              unsettled: Number(c.unsettled) || 0,
              payout: Number(c.payout) || 0,
              notes: c.remarks || ''
            }));
            setContributions(mapped);
            localStorage.setItem('dreamloom_contributions', JSON.stringify(mapped));
          }
        })
        .catch(err => console.warn('Could not fetch server contributions:', err));

      // 2. Loans
      const savedLoans = localStorage.getItem('dreamloom_loans');
      if (savedLoans) {
        try {
          const parsed = JSON.parse(savedLoans);
          if (Array.isArray(parsed) && parsed.length > 0) setLoans(parsed);
        } catch (e) { console.warn('Saved loans parse failed:', e); }
      }
      fetch('/api/loans')
        .then(r => r.json())
        .then(res => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            const mapped = res.data.map((l: any) => ({
              id: l.id,
              issueDate: l.issueDate ? String(l.issueDate).slice(0, 10) : '-',
              borrower: l.member?.fullName || 'Member',
              principal: Number(l.principal) || 0,
              interest: Number(l.interest) || 0,
              totalLoan: Number(l.totalPayable) || 0,
              paid: Number(l.paidAmount) || 0,
              balance: (Number(l.totalPayable) || 0) - (Number(l.paidAmount) || 0),
              status: l.status,
              clearedDate: l.clearedDate ? String(l.clearedDate).slice(0, 10) : '-'
            }));
            setLoans(mapped);
            localStorage.setItem('dreamloom_loans', JSON.stringify(mapped));
          }
        })
        .catch(err => console.warn('Could not fetch server loans:', err));

      // 3. Fines & Penalties
      const savedFines = localStorage.getItem('dreamloom_fines');
      if (savedFines) {
        try {
          const parsed = JSON.parse(savedFines);
          if (Array.isArray(parsed) && parsed.length > 0) setFines(parsed);
        } catch (e) { console.warn('Saved fines parse failed:', e); }
      }
      fetch('/api/penalties')
        .then(r => r.json())
        .then(res => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            const mapped = res.data.map((p: any, idx: number) => ({
              id: \`FN-\${String(idx + 1).padStart(2, '0')}\`,
              dbId: p.id,
              date: p.dateLevied ? String(p.dateLevied).slice(0, 10) : '-',
              member: p.member?.fullName || 'Member',
              reason: p.reason || 'Late payment + penalty',
              amount: Number(p.penaltyAmount) || 500,
              status: p.status === 'Settled' ? 'Paid' : 'Active',
              datePaid: p.status === 'Settled' ? '2026-11-01' : '-'
            }));
            setFines(mapped);
            localStorage.setItem('dreamloom_fines', JSON.stringify(mapped));
          }
        })
        .catch(err => console.warn('Could not fetch server penalties:', err));

      // 4. Expenses
      const savedExpenses = localStorage.getItem('dreamloom_expenses');
      if (savedExpenses) {
        try {
          const parsed = JSON.parse(savedExpenses);
          if (Array.isArray(parsed) && parsed.length > 0) setExpenses(parsed);
        } catch (e) { console.warn('Saved expenses parse failed:', e); }
      }
      fetch('/api/expenses')
        .then(r => r.json())
        .then(res => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            const mapped = res.data.map((e: any, idx: number) => ({
              id: \`EXP-\${String(idx + 1).padStart(2, '0')}\`,
              dbId: e.id,
              date: e.expenseDate ? String(e.expenseDate).slice(0, 10) : '-',
              description: e.description,
              amount: Number(e.amount) || 0,
              category: e.expenseType || 'Operational',
              paidTo: e.referenceDetails || 'Operational Outflow'
            }));
            setExpenses(mapped);
            localStorage.setItem('dreamloom_expenses', JSON.stringify(mapped));
          }
        })
        .catch(err => console.warn('Could not fetch server expenses:', err));
    } catch (e) {
      console.error(e);
    }
  }, []);`;

page = page.replace(oldMountSync, newMountSync);
fs.writeFileSync('src/app/page.tsx', page, 'utf8');
console.log('Updated mount sync effect for all modules.');
