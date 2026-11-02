const fs = require('fs');

let page = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Replace handleDeleteCurrentRecord
const oldDeleteBlock = `    if (modalMode === 'Contributions') {
      const remaining = contributions.filter(c => c.id !== editingId);
      setContributions(remaining);
      try {
        localStorage.setItem('dreamloom_contributions', JSON.stringify(remaining));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
      fetch(\`/api/contributions?customId=\${encodeURIComponent(String(editingId))}&userEmail=\${encodeURIComponent(currentUser?.email || '')}\`, {
        method: 'DELETE'
      }).catch(err => console.error('Database delete failed:', err));
    } else if (modalMode === 'Member Directory') {
      setMembers(members.filter(m => m.id !== editingId));
    } else if (modalMode === 'Loan Portfolio') {
      setLoans(loans.filter(l => l.id !== editingId));
    } else if (modalMode === 'Fines & Penalties') {
      setFines(fines.filter(f => f.id !== editingId));
    } else if (modalMode === 'Expenses') {
      setExpenses(expenses.filter(exp => exp.id !== editingId));
    } else if (modalMode === 'Investments') {
      setInvestments(investments.filter(inv => inv.id !== editingId));
    } else if (modalMode === 'Projects') {
      setProjects(projects.filter(p => p.id !== editingId));
    } else if (modalMode === 'Suppliers') {
      setSuppliers(suppliers.filter(s => s.id !== editingId));
    } else if (modalMode === 'Documents') {
      setDocuments(documents.filter(d => d.id !== editingId));
    }`;

const newDeleteBlock = `    if (modalMode === 'Contributions') {
      const remaining = contributions.filter(c => c.id !== editingId);
      setContributions(remaining);
      try {
        localStorage.setItem('dreamloom_contributions', JSON.stringify(remaining));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
      fetch(\`/api/contributions?customId=\${encodeURIComponent(String(editingId))}&userEmail=\${encodeURIComponent(currentUser?.email || '')}\`, {
        method: 'DELETE'
      }).catch(err => console.error('Database delete failed:', err));
    } else if (modalMode === 'Loan Portfolio') {
      const remaining = loans.filter(l => l.id !== editingId);
      setLoans(remaining);
      try {
        localStorage.setItem('dreamloom_loans', JSON.stringify(remaining));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
      fetch(\`/api/loans?id=\${encodeURIComponent(String(editingId))}&userEmail=\${encodeURIComponent(currentUser?.email || '')}\`, {
        method: 'DELETE'
      }).catch(err => console.error('Database loan delete failed:', err));
    } else if (modalMode === 'Fines & Penalties') {
      const targetFine = fines.find(f => f.id === editingId);
      const remaining = fines.filter(f => f.id !== editingId);
      setFines(remaining);
      try {
        localStorage.setItem('dreamloom_fines', JSON.stringify(remaining));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
      if (targetFine && (targetFine as any).dbId) {
        fetch(\`/api/penalties?id=\${encodeURIComponent(String((targetFine as any).dbId))}&userEmail=\${encodeURIComponent(currentUser?.email || '')}\`, {
          method: 'DELETE'
        }).catch(err => console.error('Database penalty delete failed:', err));
      }
    } else if (modalMode === 'Expenses') {
      const targetExp = expenses.find(exp => exp.id === editingId);
      const remaining = expenses.filter(exp => exp.id !== editingId);
      setExpenses(remaining);
      try {
        localStorage.setItem('dreamloom_expenses', JSON.stringify(remaining));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
      if (targetExp && (targetExp as any).dbId) {
        fetch(\`/api/expenses?id=\${encodeURIComponent(String((targetExp as any).dbId))}&userEmail=\${encodeURIComponent(currentUser?.email || '')}\`, {
          method: 'DELETE'
        }).catch(err => console.error('Database expense delete failed:', err));
      }
    } else if (modalMode === 'Member Directory') {
      setMembers(members.filter(m => m.id !== editingId));
    } else if (modalMode === 'Investments') {
      setInvestments(investments.filter(inv => inv.id !== editingId));
    } else if (modalMode === 'Projects') {
      setProjects(projects.filter(p => p.id !== editingId));
    } else if (modalMode === 'Suppliers') {
      setSuppliers(suppliers.filter(s => s.id !== editingId));
    } else if (modalMode === 'Documents') {
      setDocuments(documents.filter(d => d.id !== editingId));
    }`;

page = page.replace(oldDeleteBlock, newDeleteBlock);

// 2. Update handleToggleLoanStatus to persist to DB & localStorage
const oldToggleLoan = `  const handleToggleLoanStatus = (loanId: string) => {
    if (!canEdit) {
      alert('Access Restricted: Only Simon Memia Wanjiru and Elijah Waitara Gichari can update loan status.');
      return;
    }
    const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    setLoans(prevLoans => prevLoans.map(l => {
      if (l.id === loanId) {
        if (l.status === 'Active') {
          return {
            ...l,
            status: 'Settled',
            clearedDate: todayStr,
            paid: l.totalLoan,
            balance: 0.00
          };
        } else {
          return {
            ...l,
            status: 'Active',
            clearedDate: '-',
            paid: 0.00,
            balance: l.totalLoan
          };
        }
      }
      return l;
    }));

    setEditLogs(prev => [
      {
        id: \`LOG-\${Date.now().toString().slice(-4)}\`,
        user: currentUser?.fullName || 'Simon Memia',
        action: 'Toggled Loan Status',
        module: 'Loans',
        details: \`Updated status for Loan \${loanId}\`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      },
      ...prev
    ]);
  };`;

const newToggleLoan = `  const handleToggleLoanStatus = (loanId: string) => {
    if (!canEdit) {
      alert('Access Restricted: Only Simon Memia Wanjiru and Elijah Waitara Gichari can update loan status.');
      return;
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    const targetLoan = loans.find(l => l.id === loanId);
    if (!targetLoan) return;

    const isCurrentlyActive = targetLoan.status === 'Active';
    const nextStatus = isCurrentlyActive ? 'Settled' : 'Active';
    const nextPaid = isCurrentlyActive ? targetLoan.totalLoan : 0.00;
    const nextBal = isCurrentlyActive ? 0.00 : targetLoan.totalLoan;
    const nextCleared = isCurrentlyActive ? todayStr : '-';

    const updatedLoans = loans.map(l => l.id === loanId ? {
      ...l,
      status: nextStatus,
      clearedDate: nextCleared,
      paid: nextPaid,
      balance: nextBal
    } : l);

    setLoans(updatedLoans);
    try {
      localStorage.setItem('dreamloom_loans', JSON.stringify(updatedLoans));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    // Persist to Neon DB
    fetch('/api/loans', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: currentUser?.email,
        id: loanId,
        status: nextStatus,
        paidAmount: nextPaid,
        clearedDate: isCurrentlyActive ? todayStr : null
      })
    }).catch(err => console.error('Database loan toggle failed:', err));

    setEditLogs(prev => [
      {
        id: \`LOG-\${Date.now().toString().slice(-4)}\`,
        user: currentUser?.fullName || 'Simon Memia',
        action: 'Toggled Loan Status',
        module: 'Loans',
        details: \`Updated status for Loan \${loanId} to \${nextStatus}\`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      },
      ...prev
    ]);
  };`;

page = page.replace(oldToggleLoan, newToggleLoan);

// 3. Update handleToggleFineStatus to persist to DB & localStorage
const oldToggleFine = `  const handleToggleFineStatus = (fineId: string) => {
    if (!canEdit) {
      alert('Access Restricted: Only Simon Memia Wanjiru and Elijah Waitara Gichari can update penalty status.');
      return;
    }
    const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    setFines(prevFines => prevFines.map(f => {
      if (f.id === fineId) {
        const nextStatus = f.status === 'Active' ? 'Paid' : 'Active';
        return {
          ...f,
          status: nextStatus,
          datePaid: nextStatus === 'Paid' ? todayStr : '-'
        };
      }
      return f;
    }));

    setEditLogs(prev => [
      {
        id: \`LOG-\${Date.now().toString().slice(-4)}\`,
        user: currentUser?.fullName || 'Simon Memia',
        action: 'Toggled Penalty Status',
        module: 'Fines & Penalties',
        details: \`Updated penalty \${fineId} status\`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      },
      ...prev
    ]);
  };`;

const newToggleFine = `  const handleToggleFineStatus = (fineId: string) => {
    if (!canEdit) {
      alert('Access Restricted: Only Simon Memia Wanjiru and Elijah Waitara Gichari can update penalty status.');
      return;
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    const targetFine = fines.find(f => f.id === fineId);
    if (!targetFine) return;

    const nextStatus = targetFine.status === 'Active' ? 'Paid' : 'Active';
    const updatedFines = fines.map(f => f.id === fineId ? {
      ...f,
      status: nextStatus,
      datePaid: nextStatus === 'Paid' ? todayStr : '-'
    } : f);

    setFines(updatedFines);
    try {
      localStorage.setItem('dreamloom_fines', JSON.stringify(updatedFines));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    if ((targetFine as any).dbId) {
      fetch('/api/penalties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser?.email,
          id: (targetFine as any).dbId,
          status: nextStatus === 'Paid' ? 'Settled' : 'Active',
          paidAmount: nextStatus === 'Paid' ? targetFine.amount : 0
        })
      }).catch(err => console.error('Database penalty toggle failed:', err));
    }

    setEditLogs(prev => [
      {
        id: \`LOG-\${Date.now().toString().slice(-4)}\`,
        user: currentUser?.fullName || 'Simon Memia',
        action: 'Toggled Penalty Status',
        module: 'Fines & Penalties',
        details: \`Updated penalty \${fineId} status to \${nextStatus}\`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      },
      ...prev
    ]);
  };`;

page = page.replace(oldToggleFine, newToggleFine);

// 4. Update handleSubmitModal for Loans
const oldLoanSubmit = `    // 3. Loans
    else if (modalMode === 'Loan Portfolio' || modalMode === 'New Loan') {
      const pAmt = Number(field2) || 0;
      const iAmt = field3 ? Number(field3) : pAmt * 0.10;
      const tAmt = pAmt + iAmt;
      if (editingId) {
        setLoans(loans.map(l => l.id === editingId ? {
          ...l,
          borrower: field1,
          principal: pAmt,
          interest: iAmt,
          totalLoan: tAmt,
          issueDate: field4,
          clearedDate: field5,
          status: field6,
          balance: field6 === 'Settled' ? 0.00 : (field7 ? Number(field7) : tAmt),
          paid: field6 === 'Settled' ? tAmt : l.paid
        } : l));
      } else {
        const newL = {
          id: \`L0\${loans.length + 1}\`,
          borrower: field1,
          principal: pAmt,
          interest: iAmt,
          totalLoan: tAmt,
          issueDate: field4 || 'October 2026',
          clearedDate: '-',
          status: 'Active',
          paid: 0.00,
          balance: tAmt
        };
        setLoans([...loans, newL]);
        setTransactions([
          { id: \`TX-\${Date.now()}\`, title: \`\${field1.split(' ')[0]} - Loan Approved\`, time: 'Just now', amount: \`+ KES \${pAmt.toLocaleString()}\`, type: 'income', icon: CreditCard, iconColor: 'bg-cyan-600/20 text-cyan-400' },
          ...transactions
        ]);
      }
    }`;

const newLoanSubmit = `    // 3. Loans
    else if (modalMode === 'Loan Portfolio' || modalMode === 'New Loan') {
      const pAmt = Number(field2) || 0;
      const iAmt = field3 ? Number(field3) : pAmt * 0.10;
      const tAmt = pAmt + iAmt;
      if (editingId) {
        const updatedLoans = loans.map(l => l.id === editingId ? {
          ...l,
          borrower: field1,
          principal: pAmt,
          interest: iAmt,
          totalLoan: tAmt,
          issueDate: field4,
          clearedDate: field5,
          status: field6,
          balance: field6 === 'Settled' ? 0.00 : (field7 ? Number(field7) : tAmt),
          paid: field6 === 'Settled' ? tAmt : l.paid
        } : l);
        setLoans(updatedLoans);
        try {
          localStorage.setItem('dreamloom_loans', JSON.stringify(updatedLoans));
        } catch (e) {
          console.warn('LocalStorage save failed:', e);
        }

        fetch('/api/loans', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: currentUser?.email,
            id: editingId,
            memberName: field1,
            principal: pAmt,
            interest: iAmt,
            totalPayable: tAmt,
            issueDate: field4,
            clearedDate: field5 !== '-' ? field5 : null,
            status: field6,
            paidAmount: field6 === 'Settled' ? tAmt : (tAmt - (field7 ? Number(field7) : tAmt))
          })
        }).catch(err => console.error('Database loan update failed:', err));
      } else {
        const newL = {
          id: \`L0\${loans.length + 1}\`,
          borrower: field1,
          principal: pAmt,
          interest: iAmt,
          totalLoan: tAmt,
          issueDate: field4 || new Date().toISOString().slice(0, 10),
          clearedDate: '-',
          status: 'Active',
          paid: 0.00,
          balance: tAmt
        };
        const updatedLoans = [...loans, newL];
        setLoans(updatedLoans);
        try {
          localStorage.setItem('dreamloom_loans', JSON.stringify(updatedLoans));
        } catch (e) {
          console.warn('LocalStorage save failed:', e);
        }

        fetch('/api/loans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: currentUser?.email,
            id: newL.id,
            memberName: field1,
            principal: pAmt,
            interest: iAmt,
            totalPayable: tAmt,
            issueDate: newL.issueDate,
            status: 'Active',
            paidAmount: 0
          })
        }).catch(err => console.error('Database loan create failed:', err));

        setTransactions([
          { id: \`TX-\${Date.now()}\`, title: \`\${field1.split(' ')[0]} - Loan Approved\`, time: 'Just now', amount: \`+ KES \${pAmt.toLocaleString()}\`, type: 'income', icon: CreditCard, iconColor: 'bg-cyan-600/20 text-cyan-400' },
          ...transactions
        ]);
      }
    }`;

page = page.replace(oldLoanSubmit, newLoanSubmit);

fs.writeFileSync('src/app/page.tsx', page, 'utf8');
console.log('Updated delete and loan persistence in page.tsx.');
