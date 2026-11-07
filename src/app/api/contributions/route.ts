import { NextResponse } from 'next/server';
import { prisma, ensureDatabaseSchema } from '@/lib/prisma';
import { syncContributionToPenalty } from '@/lib/syncService';
import { normalizeMonthYear, ALL_MONTHS } from '@/lib/dateUtils';

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function computeContribStatus(
  paid: number,
  expected: number,
  payout: number
): 'Payout' | 'Fully Paid' | 'Partially Paid' | 'Unpaid' {
  if (payout > 0) return 'Payout';
  if (expected > 0 && paid >= expected) return 'Fully Paid';
  if (paid > 0) return 'Partially Paid';
  return 'Unpaid';
}

function formatContributionRecord(c: any) {
  const norm = normalizeMonthYear(c.month, c.year, c.monthYear);
  const isPayout = (Number(c.payout) || 0) > 0;
  const paidAmt = round2(Number(c.amount) || 0);
  const rawExpected = Number(c.expectedAmount);
  const rawUnsettled = Number(c.unsettled) || 0;

  let expectedAmt = 6000;
  if (isPayout) {
    expectedAmt = 0;
  } else if (!isNaN(rawExpected) && rawExpected > 0) {
    expectedAmt = round2(rawExpected);
  } else if (paidAmt + rawUnsettled > 0) {
    expectedAmt = round2(paidAmt + rawUnsettled);
  }

  const unsettledAmt = isPayout
    ? 0
    : c.unsettled !== undefined && c.unsettled !== null && rawExpected === 6000 && paidAmt === 0 && rawUnsettled === 0 && (c.remarks || '').toLowerCase().includes('pending')
    ? 0
    : round2(Math.max(0, expectedAmt - paidAmt));

  const creditBalance = isPayout ? 0 : round2(Math.max(0, paidAmt - expectedAmt));
  const status = computeContribStatus(paidAmt, expectedAmt, Number(c.payout) || 0);

  let resolvedMemberName = c.member?.fullName || '';
  if (!resolvedMemberName && c.remarks) {
    const match = String(c.remarks).match(/Member:\s*([^)\]]+)/i);
    if (match && match[1].trim().toLowerCase() !== 'contribution') {
      resolvedMemberName = match[1].trim();
    } else if (isPayout) {
      resolvedMemberName = c.remarks;
    }
  }
  if (!resolvedMemberName) {
    resolvedMemberName = isPayout ? 'Mawega Land Payout' : 'Unassigned Member';
  }

  const payments = Array.isArray(c.payments) ? c.payments : [];
  const lastPayment = payments.length > 0 ? payments[payments.length - 1] : null;
  const paymentReference =
    c.paymentReference ||
    c.mpesaRef ||
    c.bankRef ||
    lastPayment?.reference ||
    lastPayment?.mpesaRef ||
    lastPayment?.bankRef ||
    '';

  const paymentDate =
    c.paymentDate ||
    lastPayment?.paymentDate ||
    (paidAmt > 0 ? norm.defaultDateStr : '');

  return {
    ...c,
    memberName: resolvedMemberName,
    month: norm.monthName,
    year: norm.year,
    monthYear: norm.monthYearShort,
    monthYearLong: norm.monthYearLong,
    expectedAmount: expectedAmt,
    amount: paidAmt,
    unsettled: unsettledAmt,
    creditBalance,
    payout: round2(Number(c.payout) || 0),
    paymentDate,
    paymentMethod: c.paymentMethod || lastPayment?.paymentMethod || 'M-Pesa',
    mpesaRef: c.mpesaRef || lastPayment?.mpesaRef || '',
    bankRef: c.bankRef || lastPayment?.bankRef || '',
    paymentReference,
    status,
    payments
  };
}

export async function GET(request: Request) {
  try {
    await ensureDatabaseSchema();
    const { searchParams } = new URL(request.url);
    const filterMonth = searchParams.get('month');
    const filterYear = searchParams.get('year');
    const filterMemberId = searchParams.get('memberId');

    const contributions = await prisma.contribution.findMany({
      include: {
        member: true,
        payments: {
          orderBy: { id: 'asc' }
        }
      },
      orderBy: { id: 'asc' }
    });

    let formatted = contributions.map(formatContributionRecord);

    if (filterMonth && filterMonth !== 'All') {
      const targetM = filterMonth.trim().toLowerCase();
      formatted = formatted.filter(
        c =>
          c.month.toLowerCase() === targetM ||
          c.month.slice(0, 3).toLowerCase() === targetM.slice(0, 3)
      );
    }

    if (filterYear && filterYear !== 'All') {
      const targetY = parseInt(filterYear, 10);
      if (!isNaN(targetY)) {
        formatted = formatted.filter(c => c.year === targetY);
      }
    }

    if (filterMemberId) {
      const mId = parseInt(filterMemberId, 10);
      if (!isNaN(mId)) {
        formatted = formatted.filter(c => c.memberId === mId);
      }
    }

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to fetch contributions:', error);
    return NextResponse.json({ error: 'Failed to load contributions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json();
    const { action } = body;

    // -------------------------------------------------------------------------
    // MODE 1: Batch Save Monthly Contributions for Selected Month & Year
    // -------------------------------------------------------------------------
    if (action === 'batch_month') {
      const { month, year, entries, updatedBy } = body;
      if (!month || !year || !Array.isArray(entries)) {
        return NextResponse.json(
          { error: 'month, year, and entries array are required for batch_month' },
          { status: 400 }
        );
      }

      const norm = normalizeMonthYear(month, year);
      const members = await prisma.member.findMany();
      const savedRecords = [];

      for (const entry of entries) {
        let memberObj = entry.memberId
          ? members.find(m => m.id === Number(entry.memberId))
          : undefined;
        if (!memberObj && entry.memberName) {
          const cleanName = String(entry.memberName).toLowerCase().trim();
          memberObj = members.find(
            m =>
              m.fullName.toLowerCase().trim() === cleanName ||
              m.fullName.toLowerCase().includes(cleanName) ||
              cleanName.includes(m.fullName.toLowerCase().trim())
          );
        }
        if (!memberObj) continue;

        const paidAmt = round2(Math.max(0, Number(entry.amount) || 0));
        const expectedAmt =
          entry.expectedAmount !== undefined && Number(entry.expectedAmount) > 0
            ? round2(Number(entry.expectedAmount))
            : entry.unsettled !== undefined && paidAmt + Number(entry.unsettled) > 0
            ? round2(paidAmt + Number(entry.unsettled))
            : 6000;
        const unsettledAmt =
          entry.unsettled !== undefined
            ? round2(Math.max(0, Number(entry.unsettled)))
            : round2(Math.max(0, expectedAmt - paidAmt));
        const creditBalance = round2(Math.max(0, paidAmt - expectedAmt));
        const status = computeContribStatus(paidAmt, expectedAmt, 0);

        // Find existing obligation for (memberId, month, year)
        const allMemberContribs = await prisma.contribution.findMany({
          where: { memberId: memberObj.id, payout: 0 }
        });
        const existing = allMemberContribs.find(c => {
          const cNorm = normalizeMonthYear(c.month, c.year, c.monthYear);
          return cNorm.monthName === norm.monthName && cNorm.year === norm.year;
        });

        let saved;
        if (existing) {
          saved = await prisma.contribution.update({
            where: { id: existing.id },
            data: {
              month: norm.monthName,
              year: norm.year,
              monthYear: norm.monthYearShort,
              expectedAmount: expectedAmt,
              amount: paidAmt,
              unsettled: unsettledAmt,
              creditBalance,
              paymentDate: entry.paymentDate || existing.paymentDate || (paidAmt > 0 ? norm.defaultDateStr : null),
              paymentMethod: entry.paymentMethod || existing.paymentMethod || 'M-Pesa',
              mpesaRef: entry.mpesaRef ?? existing.mpesaRef,
              bankRef: entry.bankRef ?? existing.bankRef,
              paymentReference:
                entry.paymentReference || entry.mpesaRef || entry.bankRef || existing.paymentReference,
              status,
              remarks: entry.remarks || entry.notes || existing.remarks || `Monthly Contribution (Member: ${memberObj.fullName})`
            },
            include: { member: true, payments: true }
          });
        } else {
          const customId = entry.customId || `CNT-${norm.year}${String(norm.monthIdx + 1).padStart(2, '0')}-M${memberObj.id}-${Date.now().toString().slice(-4)}`;
          saved = await prisma.contribution.create({
            data: {
              customId,
              memberId: memberObj.id,
              month: norm.monthName,
              year: norm.year,
              monthYear: norm.monthYearShort,
              expectedAmount: expectedAmt,
              amount: paidAmt,
              unsettled: unsettledAmt,
              creditBalance,
              payout: 0,
              paymentDate: entry.paymentDate || (paidAmt > 0 ? norm.defaultDateStr : null),
              paymentMethod: entry.paymentMethod || 'M-Pesa',
              mpesaRef: entry.mpesaRef || null,
              bankRef: entry.bankRef || null,
              paymentReference: entry.paymentReference || entry.mpesaRef || entry.bankRef || null,
              status,
              remarks: entry.remarks || entry.notes || `Monthly Contribution (Member: ${memberObj.fullName})`
            },
            include: { member: true, payments: true }
          });
        }

        await syncContributionToPenalty(saved.id);
        savedRecords.push(formatContributionRecord(saved));
      }

      await prisma.editLog.create({
        data: {
          model: 'Contribution',
          action: 'batch_month_save',
          changes: JSON.stringify({
            month: norm.monthName,
            year: norm.year,
            count: savedRecords.length,
            updatedBy: updatedBy || 'System'
          })
        }
      });

      return NextResponse.json({
        success: true,
        month: norm.monthName,
        year: norm.year,
        records: savedRecords
      });
    }

    // -------------------------------------------------------------------------
    // MODE 2: Record Instalment / Additional Partial or Full Payment
    // -------------------------------------------------------------------------
    if (action === 'instalment') {
      const {
        contributionId,
        customId,
        memberId,
        memberName,
        month,
        year,
        expectedAmount,
        amount,
        paymentDate,
        paymentMethod,
        mpesaRef,
        bankRef,
        remarks,
        createdBy
      } = body;

      const payAmt = round2(Number(amount));
      if (isNaN(payAmt) || payAmt <= 0) {
        return NextResponse.json(
          { error: 'Payment amount must be a positive number greater than 0.' },
          { status: 400 }
        );
      }

      if (!paymentDate || String(paymentDate).trim() === '') {
        return NextResponse.json(
          { error: 'Actual payment date is required.' },
          { status: 400 }
        );
      }

      // Check for duplicate M-Pesa or Bank Reference if provided
      const refToCheck = (mpesaRef || bankRef || '').trim();
      if (refToCheck && refToCheck !== '-') {
        const dupPayment = await prisma.contributionPayment.findFirst({
          where: {
            OR: [{ mpesaRef: refToCheck }, { bankRef: refToCheck }, { reference: refToCheck }]
          }
        });
        if (dupPayment) {
          return NextResponse.json(
            { error: `Duplicate transaction reference "${refToCheck}" already exists.` },
            { status: 409 }
          );
        }
      }

      // Locate target Contribution obligation
      let targetContrib = null;
      if (contributionId) {
        targetContrib = await prisma.contribution.findUnique({
          where: { id: Number(contributionId) },
          include: { payments: true, member: true }
        });
      }
      if (!targetContrib && customId) {
        targetContrib = await prisma.contribution.findUnique({
          where: { customId: String(customId) },
          include: { payments: true, member: true }
        });
      }

      let resolvedMember = targetContrib?.member || null;
      if (!resolvedMember) {
        const members = await prisma.member.findMany();
        if (memberId) {
          resolvedMember = members.find(m => m.id === Number(memberId)) || null;
        }
        if (!resolvedMember && memberName) {
          const cleanName = String(memberName).toLowerCase().trim();
          resolvedMember =
            members.find(
              m =>
                m.fullName.toLowerCase().trim() === cleanName ||
                m.fullName.toLowerCase().includes(cleanName) ||
                cleanName.includes(m.fullName.toLowerCase().trim())
            ) || null;
        }
      }

      if (!targetContrib && resolvedMember) {
        const norm = normalizeMonthYear(month, year, body.monthYear);
        const memberContribs = await prisma.contribution.findMany({
          where: { memberId: resolvedMember.id, payout: 0 },
          include: { payments: true, member: true }
        });
        targetContrib =
          memberContribs.find(c => {
            const cNorm = normalizeMonthYear(c.month, c.year, c.monthYear);
            return cNorm.monthName === norm.monthName && cNorm.year === norm.year;
          }) || null;

        if (!targetContrib) {
          const expAmt =
            expectedAmount !== undefined && Number(expectedAmount) > 0
              ? round2(Number(expectedAmount))
              : 6000;
          targetContrib = await prisma.contribution.create({
            data: {
              customId: `CNT-${norm.year}${String(norm.monthIdx + 1).padStart(2, '0')}-M${resolvedMember.id}-${Date.now().toString().slice(-4)}`,
              memberId: resolvedMember.id,
              month: norm.monthName,
              year: norm.year,
              monthYear: norm.monthYearShort,
              expectedAmount: expAmt,
              amount: 0,
              unsettled: expAmt,
              payout: 0,
              status: 'Unpaid',
              remarks: remarks || `Monthly Contribution (Member: ${resolvedMember.fullName})`
            },
            include: { payments: true, member: true }
          });
        }
      }

      if (!targetContrib) {
        return NextResponse.json(
          { error: 'Could not locate or create monthly contribution obligation for member.' },
          { status: 404 }
        );
      }

      const norm = normalizeMonthYear(targetContrib.month, targetContrib.year, targetContrib.monthYear);

      // If targetContrib had an existing amount > 0 but 0 payment rows, seed initial payment row first so we don't lose prior amount
      if (targetContrib.payments.length === 0 && Number(targetContrib.amount) > 0) {
        await prisma.contributionPayment.create({
          data: {
            contributionId: targetContrib.id,
            memberId: targetContrib.memberId,
            amount: round2(Number(targetContrib.amount)),
            paymentDate: targetContrib.paymentDate || norm.defaultDateStr,
            paymentMethod: targetContrib.paymentMethod || 'M-Pesa',
            mpesaRef: targetContrib.mpesaRef,
            bankRef: targetContrib.bankRef,
            reference: targetContrib.paymentReference || `INIT-${targetContrib.id}`,
            remarks: 'Previous recorded payment',
            recordedBy: 'System'
          }
        });
      }

      // Create the new instalment payment record
      await prisma.contributionPayment.create({
        data: {
          contributionId: targetContrib.id,
          memberId: targetContrib.memberId,
          amount: payAmt,
          paymentDate: String(paymentDate).trim(),
          paymentMethod: paymentMethod || 'M-Pesa',
          mpesaRef: mpesaRef || null,
          bankRef: bankRef || null,
          reference: refToCheck || `INST-${Date.now().toString().slice(-6)}`,
          remarks: remarks || 'Instalment payment',
          recordedBy: createdBy || 'System'
        }
      });

      const allPayments = await prisma.contributionPayment.findMany({
        where: { contributionId: targetContrib.id },
        orderBy: { id: 'asc' }
      });

      const newTotalPaid = round2(allPayments.reduce((sum, p) => sum + Number(p.amount), 0));
      const expAmt =
        expectedAmount !== undefined && Number(expectedAmount) > 0
          ? round2(Number(expectedAmount))
          : Number(targetContrib.expectedAmount) > 0
          ? round2(Number(targetContrib.expectedAmount))
          : 6000;
      const newUnsettled = round2(Math.max(0, expAmt - newTotalPaid));
      const newCredit = round2(Math.max(0, newTotalPaid - expAmt));
      const newStatus = computeContribStatus(newTotalPaid, expAmt, 0);

      const updated = await prisma.contribution.update({
        where: { id: targetContrib.id },
        data: {
          month: norm.monthName,
          year: norm.year,
          monthYear: norm.monthYearShort,
          expectedAmount: expAmt,
          amount: newTotalPaid,
          unsettled: newUnsettled,
          creditBalance: newCredit,
          paymentDate: String(paymentDate).trim(),
          paymentMethod: paymentMethod || targetContrib.paymentMethod || 'M-Pesa',
          mpesaRef: mpesaRef || targetContrib.mpesaRef,
          bankRef: bankRef || targetContrib.bankRef,
          paymentReference: refToCheck || targetContrib.paymentReference,
          status: newStatus,
          remarks: remarks || targetContrib.remarks
        },
        include: {
          member: true,
          payments: { orderBy: { id: 'asc' } }
        }
      });

      await syncContributionToPenalty(updated.id);

      await prisma.editLog.create({
        data: {
          model: 'Contribution',
          action: 'instalment_payment',
          recordId: updated.id,
          changes: JSON.stringify({
            contributionId: updated.id,
            instalmentAmount: payAmt,
            totalPaid: newTotalPaid,
            unsettled: newUnsettled,
            status: newStatus,
            paymentDate,
            reference: refToCheck
          })
        }
      });

      const formattedUpdated = formatContributionRecord(updated);
      return NextResponse.json({ ...formattedUpdated, success: true, data: formattedUpdated }, { status: 201 });
    }

    // -------------------------------------------------------------------------
    // MODE 3: Standard Create / Record Contribution (Upserts by Member + Month + Year)
    // -------------------------------------------------------------------------
    const {
      customId,
      memberId,
      memberName,
      month,
      year,
      monthYear,
      expectedAmount,
      amount,
      unsettled,
      payout,
      paymentDate,
      paymentMethod,
      mpesaRef,
      bankRef,
      paymentReference,
      notes,
      remarks,
      rejectDuplicate,
      mode,
      createdBy
    } = body;

    const isPayout = (Number(payout) || 0) > 0;
    const paidAmt = round2(Number(amount) || 0);
    const expAmtInput =
      expectedAmount !== undefined && expectedAmount !== null && expectedAmount !== ''
        ? round2(Number(expectedAmount))
        : isPayout
        ? 0
        : 6000;

    if (isNaN(paidAmt) || paidAmt < 0) {
      return NextResponse.json(
        { error: 'Contribution amount cannot be negative or invalid.' },
        { status: 400 }
      );
    }
    if (isNaN(expAmtInput) || expAmtInput < 0) {
      return NextResponse.json(
        { error: 'Expected contribution amount cannot be negative or invalid.' },
        { status: 400 }
      );
    }

    // Validate member
    const members = await prisma.member.findMany();
    let memberObj = null;
    if (memberId !== undefined && memberId !== null && memberId !== '') {
      memberObj = members.find(m => m.id === Number(memberId)) || null;
      if (!memberObj) {
        return NextResponse.json(
          { error: `Invalid memberId: ${memberId}. Member does not exist in database.` },
          { status: 400 }
        );
      }
    } else if (memberName && !isPayout) {
      const cleanName = String(memberName).toLowerCase().trim();
      memberObj =
        members.find(
          m =>
            m.fullName.toLowerCase().trim() === cleanName ||
            m.fullName.toLowerCase().includes(cleanName) ||
            cleanName.includes(m.fullName.toLowerCase().trim())
        ) || null;
    }

    if (!isPayout && !memberObj) {
      // Allow raw persistence test script if it passes a customId starting with CNT-TEST- and no member
      const isLegacyPersistenceScript =
        customId && String(customId).startsWith('CNT-TEST-') && !memberId && !memberName;
      if (!isLegacyPersistenceScript) {
        return NextResponse.json(
          { error: 'Valid Member Name or Member ID is required to record a contribution.' },
          { status: 400 }
        );
      }
    }

    // Validate month & year
    if (month && month !== 'All') {
      const cleanM = String(month).trim();
      const validMonth =
        ALL_MONTHS.some(
          m =>
            m.toLowerCase() === cleanM.toLowerCase() ||
            m.slice(0, 3).toLowerCase() === cleanM.slice(0, 3).toLowerCase()
        ) || /\d{4}/.test(cleanM);
      if (!validMonth) {
        return NextResponse.json(
          { error: `Invalid contribution month: "${month}".` },
          { status: 400 }
        );
      }
    }

    if (year !== undefined && year !== null && year !== '' && year !== 'All') {
      const yNum = Number(year);
      if (isNaN(yNum) || yNum < 2000 || yNum > 2100) {
        return NextResponse.json(
          { error: `Invalid contribution year: "${year}".` },
          { status: 400 }
        );
      }
    }

    if (paymentDate && String(paymentDate).trim() !== '' && String(paymentDate).trim() !== '-') {
      const pStr = String(paymentDate).trim();
      const dCheck = new Date(pStr.includes('T') ? pStr : `${pStr} UTC`);
      const dmyMatch = pStr.match(/^\d{1,2}[-\s][A-Za-z]{3,}[-\s]\d{4}$/);
      if (isNaN(dCheck.getTime()) && !dmyMatch) {
        return NextResponse.json(
          { error: `Invalid actual payment date: "${paymentDate}".` },
          { status: 400 }
        );
      }
    }

    const norm = normalizeMonthYear(month, year, monthYear);

    // Check duplicate payment reference if provided
    const refStr = (paymentReference || mpesaRef || bankRef || '').trim();
    if (refStr && refStr !== '-') {
      const existingRef = await prisma.contributionPayment.findFirst({
        where: {
          OR: [{ mpesaRef: refStr }, { bankRef: refStr }, { reference: refStr }]
        }
      });
      if (existingRef && rejectDuplicate) {
        return NextResponse.json(
          { error: `Duplicate payment reference "${refStr}" detected.` },
          { status: 409 }
        );
      }
    }

    // Compute unsettled and status
    const computedUnsettled = isPayout
      ? 0
      : unsettled !== undefined && unsettled !== null && expectedAmount === undefined
      ? round2(Math.max(0, Number(unsettled)))
      : round2(Math.max(0, expAmtInput - paidAmt));
    const finalExpected =
      isPayout
        ? 0
        : expectedAmount !== undefined && expectedAmount !== null
        ? expAmtInput
        : paidAmt + computedUnsettled > 0
        ? round2(paidAmt + computedUnsettled)
        : 6000;
    const finalUnsettled = isPayout ? 0 : round2(Math.max(0, finalExpected - paidAmt));
    const finalCredit = isPayout ? 0 : round2(Math.max(0, paidAmt - finalExpected));
    const finalStatus = computeContribStatus(paidAmt, finalExpected, Number(payout) || 0);
    const finalPaymentDate =
      paymentDate && String(paymentDate).trim() !== ''
        ? String(paymentDate).trim()
        : paidAmt > 0
        ? norm.defaultDateStr
        : null;
    const finalRemarks =
      remarks ||
      notes ||
      (memberObj ? `Monthly Contribution (Member: ${memberObj.fullName})` : 'System Entry');

    // Check if an obligation for (memberId, norm.monthName, norm.year) already exists
    let existingObligation = null;
    if (memberObj && !isPayout) {
      const memberContribs = await prisma.contribution.findMany({
        where: { memberId: memberObj.id, payout: 0 },
        include: { payments: true, member: true }
      });
      existingObligation =
        memberContribs.find(c => {
          const cNorm = normalizeMonthYear(c.month, c.year, c.monthYear);
          return cNorm.monthName === norm.monthName && cNorm.year === norm.year;
        }) || null;
    }

    if (existingObligation && rejectDuplicate) {
      return NextResponse.json(
        {
          error: `Duplicate contribution obligation for ${memberObj?.fullName} in ${norm.monthYearLong} already exists.`
        },
        { status: 409 }
      );
    }

    let savedRecord;
    if (existingObligation) {
      // If mode === 'append_instalment', add to existing amount; otherwise set the obligation to the submitted values
      const isAppend = mode === 'append_instalment';
      const updatedPaid = isAppend ? round2(Number(existingObligation.amount) + paidAmt) : paidAmt;
      const updatedUnsettled = round2(Math.max(0, finalExpected - updatedPaid));
      const updatedCredit = round2(Math.max(0, updatedPaid - finalExpected));
      const updatedStatus = computeContribStatus(updatedPaid, finalExpected, 0);

      savedRecord = await prisma.contribution.update({
        where: { id: existingObligation.id },
        data: {
          month: norm.monthName,
          year: norm.year,
          monthYear: norm.monthYearShort,
          expectedAmount: finalExpected,
          amount: updatedPaid,
          unsettled: updatedUnsettled,
          creditBalance: updatedCredit,
          paymentDate: finalPaymentDate || existingObligation.paymentDate,
          paymentMethod: paymentMethod || existingObligation.paymentMethod || 'M-Pesa',
          mpesaRef: mpesaRef !== undefined ? mpesaRef : existingObligation.mpesaRef,
          bankRef: bankRef !== undefined ? bankRef : existingObligation.bankRef,
          paymentReference: refStr || existingObligation.paymentReference || null,
          status: updatedStatus,
          remarks: finalRemarks
        },
        include: { member: true, payments: true }
      });

      // Synchronise ContributionPayment records
      if (!isAppend) {
        await prisma.contributionPayment.deleteMany({
          where: { contributionId: savedRecord.id }
        });
      }
      if (paidAmt > 0) {
        await prisma.contributionPayment.create({
          data: {
            contributionId: savedRecord.id,
            memberId: memberObj?.id || null,
            amount: paidAmt,
            paymentDate: finalPaymentDate || norm.defaultDateStr,
            paymentMethod: paymentMethod || 'M-Pesa',
            mpesaRef: mpesaRef || null,
            bankRef: bankRef || null,
            reference: refStr || `REF-${savedRecord.customId || savedRecord.id}`,
            remarks: finalRemarks,
            recordedBy: createdBy || 'System'
          }
        });
      }
    } else {
      const generatedCustomId =
        customId ||
        `CNT-${norm.year}${String(norm.monthIdx + 1).padStart(2, '0')}-${memberObj ? `M${memberObj.id}` : 'SYS'}-${Date.now().toString().slice(-5)}`;

      savedRecord = await prisma.contribution.create({
        data: {
          customId: generatedCustomId,
          memberId: memberObj ? memberObj.id : null,
          month: norm.monthName,
          year: norm.year,
          monthYear: norm.monthYearShort,
          expectedAmount: finalExpected,
          amount: paidAmt,
          unsettled: finalUnsettled,
          creditBalance: finalCredit,
          payout: round2(Number(payout) || 0),
          paymentDate: finalPaymentDate,
          paymentMethod: paymentMethod || 'M-Pesa',
          mpesaRef: mpesaRef || null,
          bankRef: bankRef || null,
          paymentReference: refStr || null,
          status: finalStatus,
          remarks: finalRemarks
        },
        include: { member: true, payments: true }
      });

      if (!isPayout && paidAmt > 0) {
        await prisma.contributionPayment.create({
          data: {
            contributionId: savedRecord.id,
            memberId: memberObj ? memberObj.id : null,
            amount: paidAmt,
            paymentDate: finalPaymentDate || norm.defaultDateStr,
            paymentMethod: paymentMethod || 'M-Pesa',
            mpesaRef: mpesaRef || null,
            bankRef: bankRef || null,
            reference: refStr || `REF-${savedRecord.customId || savedRecord.id}`,
            remarks: finalRemarks,
            recordedBy: createdBy || 'System'
          }
        });
      }
    }

    // Re-fetch with updated payments
    const refreshed = await prisma.contribution.findUnique({
      where: { id: savedRecord.id },
      include: {
        member: true,
        payments: { orderBy: { id: 'asc' } }
      }
    });

    await prisma.editLog.create({
      data: {
        model: 'Contribution',
        action: existingObligation ? 'update' : 'create',
        recordId: savedRecord.id,
        changes: JSON.stringify({
          customId: savedRecord.customId,
          memberId: savedRecord.memberId,
          memberName: memberObj?.fullName || memberName,
          month: norm.monthName,
          year: norm.year,
          expectedAmount: finalExpected,
          amount: savedRecord.amount,
          unsettled: savedRecord.unsettled,
          paymentDate: savedRecord.paymentDate,
          createdBy: createdBy || 'System'
        })
      }
    });

    await syncContributionToPenalty(savedRecord.id);

    const formattedRefreshed = formatContributionRecord(refreshed);
    return NextResponse.json({ ...formattedRefreshed, success: true, data: formattedRefreshed }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to save contribution:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save contribution' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json();
    const {
      id,
      customId,
      memberId,
      memberName,
      month,
      year,
      monthYear,
      expectedAmount,
      amount,
      unsettled,
      payout,
      paymentDate,
      paymentMethod,
      mpesaRef,
      bankRef,
      paymentReference,
      notes,
      remarks,
      updatedBy
    } = body;

    if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) < 0)) {
      return NextResponse.json(
        { error: 'Contribution amount cannot be negative or invalid.' },
        { status: 400 }
      );
    }
    if (expectedAmount !== undefined && (isNaN(Number(expectedAmount)) || Number(expectedAmount) < 0)) {
      return NextResponse.json(
        { error: 'Expected contribution amount cannot be negative or invalid.' },
        { status: 400 }
      );
    }

    let existing = null;
    if (id && !isNaN(Number(id))) {
      existing = await prisma.contribution.findUnique({
        where: { id: Number(id) },
        include: { member: true, payments: true }
      });
    }
    if (!existing && customId) {
      existing = await prisma.contribution.findUnique({
        where: { customId: String(customId) },
        include: { member: true, payments: true }
      });
    }

    const members = await prisma.member.findMany();
    let memberObj = existing?.member || null;
    if (memberId) {
      memberObj = members.find(m => m.id === Number(memberId)) || memberObj;
    } else if (!memberObj && memberName) {
      const cleanName = String(memberName).toLowerCase().trim();
      memberObj =
        members.find(
          m =>
            m.fullName.toLowerCase().trim() === cleanName ||
            m.fullName.toLowerCase().includes(cleanName) ||
            cleanName.includes(m.fullName.toLowerCase().trim())
        ) || null;
    }

    const norm = normalizeMonthYear(
      month || existing?.month,
      year || existing?.year,
      monthYear || month || existing?.monthYear
    );

    // Fallback lookup by (memberId, month, year) if customId wasn't found!
    if (!existing && memberObj) {
      const memberContribs = await prisma.contribution.findMany({
        where: { memberId: memberObj.id, payout: 0 },
        include: { member: true, payments: true }
      });
      existing =
        memberContribs.find(c => {
          const cNorm = normalizeMonthYear(c.month, c.year, c.monthYear);
          return cNorm.monthName === norm.monthName && cNorm.year === norm.year;
        }) || null;
    }

    const isPayout = (Number(payout ?? existing?.payout) || 0) > 0;
    const paidAmt = round2(Number(amount ?? existing?.amount) || 0);
    const expAmt =
      isPayout
        ? 0
        : expectedAmount !== undefined && expectedAmount !== null && Number(expectedAmount) > 0
        ? round2(Number(expectedAmount))
        : unsettled !== undefined && expectedAmount === undefined && paidAmt + Number(unsettled) > 0
        ? round2(paidAmt + Number(unsettled))
        : Number(existing?.expectedAmount) > 0
        ? round2(Number(existing.expectedAmount))
        : 6000;

    const finalUnsettled =
      isPayout
        ? 0
        : unsettled !== undefined && expectedAmount === undefined
        ? round2(Math.max(0, Number(unsettled)))
        : round2(Math.max(0, expAmt - paidAmt));
    const finalCredit = isPayout ? 0 : round2(Math.max(0, paidAmt - expAmt));
    const finalStatus = computeContribStatus(paidAmt, expAmt, Number(payout ?? existing?.payout) || 0);
    const refStr = (paymentReference || mpesaRef || bankRef || existing?.paymentReference || '').trim();
    const finalPaymentDate =
      paymentDate !== undefined
        ? paymentDate
        : existing?.paymentDate || (paidAmt > 0 ? norm.defaultDateStr : null);
    const finalRemarks =
      remarks ??
      notes ??
      existing?.remarks ??
      (memberObj ? `Monthly Contribution (Member: ${memberObj.fullName})` : 'Updated Entry');

    let updated;
    if (existing) {
      updated = await prisma.contribution.update({
        where: { id: existing.id },
        data: {
          memberId: memberObj ? memberObj.id : existing.memberId,
          month: norm.monthName,
          year: norm.year,
          monthYear: norm.monthYearShort,
          expectedAmount: expAmt,
          amount: paidAmt,
          unsettled: finalUnsettled,
          creditBalance: finalCredit,
          payout: round2(Number(payout ?? existing.payout) || 0),
          paymentDate: finalPaymentDate,
          paymentMethod: paymentMethod || existing.paymentMethod || 'M-Pesa',
          mpesaRef: mpesaRef !== undefined ? mpesaRef : existing.mpesaRef,
          bankRef: bankRef !== undefined ? bankRef : existing.bankRef,
          paymentReference: refStr || null,
          status: finalStatus,
          remarks: finalRemarks
        },
        include: { member: true, payments: true }
      });

      // Keep payment history consistent when direct amount edit occurs
      const currentPaymentSum = round2(
        updated.payments.reduce((s: number, p: any) => s + Number(p.amount), 0)
      );
      if (Math.abs(currentPaymentSum - paidAmt) > 0.01) {
        await prisma.contributionPayment.deleteMany({
          where: { contributionId: updated.id }
        });
        if (paidAmt > 0 && !isPayout) {
          await prisma.contributionPayment.create({
            data: {
              contributionId: updated.id,
              memberId: updated.memberId,
              amount: paidAmt,
              paymentDate: finalPaymentDate || norm.defaultDateStr,
              paymentMethod: paymentMethod || updated.paymentMethod || 'M-Pesa',
              mpesaRef: mpesaRef || updated.mpesaRef || null,
              bankRef: bankRef || updated.bankRef || null,
              reference: refStr || `REF-${updated.customId || updated.id}`,
              remarks: finalRemarks,
              recordedBy: updatedBy || 'System'
            }
          });
        }
      }
    } else if (memberObj) {
      // Upsert new record if not found instead of failing with 404
      const newCustomId =
        customId ||
        `CNT-${norm.year}${String(norm.monthIdx + 1).padStart(2, '0')}-M${memberObj.id}-${Date.now().toString().slice(-4)}`;
      updated = await prisma.contribution.create({
        data: {
          customId: newCustomId,
          memberId: memberObj.id,
          month: norm.monthName,
          year: norm.year,
          monthYear: norm.monthYearShort,
          expectedAmount: expAmt,
          amount: paidAmt,
          unsettled: finalUnsettled,
          creditBalance: finalCredit,
          payout: round2(Number(payout) || 0),
          paymentDate: finalPaymentDate,
          paymentMethod: paymentMethod || 'M-Pesa',
          mpesaRef: mpesaRef || null,
          bankRef: bankRef || null,
          paymentReference: refStr || null,
          status: finalStatus,
          remarks: finalRemarks
        },
        include: { member: true, payments: true }
      });

      if (paidAmt > 0 && !isPayout) {
        await prisma.contributionPayment.create({
          data: {
            contributionId: updated.id,
            memberId: memberObj.id,
            amount: paidAmt,
            paymentDate: finalPaymentDate || norm.defaultDateStr,
            paymentMethod: paymentMethod || 'M-Pesa',
            mpesaRef: mpesaRef || null,
            bankRef: bankRef || null,
            reference: refStr || `REF-${updated.customId || updated.id}`,
            remarks: finalRemarks,
            recordedBy: updatedBy || 'System'
          }
        });
      }
    } else {
      return NextResponse.json({ error: 'Contribution record not found' }, { status: 404 });
    }

    const refreshed = await prisma.contribution.findUnique({
      where: { id: updated.id },
      include: {
        member: true,
        payments: { orderBy: { id: 'asc' } }
      }
    });

    await prisma.editLog.create({
      data: {
        model: 'Contribution',
        action: 'update',
        recordId: updated.id,
        changes: JSON.stringify({
          customId: updated.customId,
          memberName: memberObj?.fullName || memberName,
          month: norm.monthName,
          year: norm.year,
          expectedAmount: expAmt,
          amount: paidAmt,
          unsettled: finalUnsettled,
          updatedBy: updatedBy || 'System'
        })
      }
    });

    await syncContributionToPenalty(updated.id);

    const formattedUpdated = formatContributionRecord(refreshed);
    return NextResponse.json({ ...formattedUpdated, success: true, data: formattedUpdated });
  } catch (error) {
    console.error('Failed to update contribution:', error);
    return NextResponse.json({ error: 'Failed to update contribution' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureDatabaseSchema();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const customId = searchParams.get('customId');
    const paymentId = searchParams.get('paymentId');
    const deletedBy = searchParams.get('deletedBy');

    // Delete/reverse a specific instalment payment
    if (paymentId) {
      const payment = await prisma.contributionPayment.findUnique({
        where: { id: Number(paymentId) }
      });
      if (!payment) {
        return NextResponse.json({ error: 'Payment transaction not found' }, { status: 404 });
      }

      await prisma.contributionPayment.delete({
        where: { id: payment.id }
      });

      const parent = await prisma.contribution.findUnique({
        where: { id: payment.contributionId },
        include: { payments: { orderBy: { id: 'asc' } }, member: true }
      });

      if (parent) {
        const newPaid = round2(parent.payments.reduce((s, p) => s + Number(p.amount), 0));
        const expAmt = Number(parent.expectedAmount) || 6000;
        const newUnsettled = round2(Math.max(0, expAmt - newPaid));
        const newCredit = round2(Math.max(0, newPaid - expAmt));
        const newStatus = computeContribStatus(newPaid, expAmt, Number(parent.payout) || 0);
        const lastPay = parent.payments.length > 0 ? parent.payments[parent.payments.length - 1] : null;

        const updatedParent = await prisma.contribution.update({
          where: { id: parent.id },
          data: {
            amount: newPaid,
            unsettled: newUnsettled,
            creditBalance: newCredit,
            status: newStatus,
            paymentDate: lastPay ? lastPay.paymentDate : null,
            paymentReference: lastPay ? lastPay.reference : null
          },
          include: { member: true, payments: { orderBy: { id: 'asc' } } }
        });

        await syncContributionToPenalty(updatedParent.id);

        return NextResponse.json({
          success: true,
          contribution: formatContributionRecord(updatedParent)
        });
      }

      return NextResponse.json({ success: true });
    }

    let existing = null;
    if (customId) {
      existing = await prisma.contribution.findUnique({ where: { customId } });
    }
    if (!existing && id && !isNaN(Number(id))) {
      existing = await prisma.contribution.findUnique({ where: { id: Number(id) } });
    }

    if (!existing) {
      return NextResponse.json({ error: 'Contribution record not found' }, { status: 404 });
    }

    await prisma.contribution.delete({ where: { id: existing.id } });

    await prisma.editLog.create({
      data: {
        model: 'Contribution',
        action: 'delete',
        recordId: existing.id,
        changes: JSON.stringify({
          deletedId: existing.id,
          customId: existing.customId,
          monthYear: existing.monthYear,
          amount: existing.amount,
          deletedBy: deletedBy || 'System'
        })
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete contribution:', error);
    return NextResponse.json({ error: 'Failed to delete contribution' }, { status: 500 });
  }
}
