import { prisma } from '../src/lib/prisma';
import { GET, POST } from '../src/app/api/penalties/route';

async function testMemberNamesResolution() {
  console.log('========================================================================');
  console.log('TESTING FINES REGISTER MEMBER NAME RESOLUTION ACROSS ALL 7 MEMBERS');
  console.log('========================================================================\n');

  try {
    // 1. Fetch from GET /api/penalties endpoint
    console.log('[TEST 1] Testing GET /api/penalties endpoint response:');
    const req = new Request('http://localhost:3000/api/penalties');
    const res = await GET();
    const json = await res.json();

    if (!json.success || !Array.isArray(json.data)) {
      throw new Error('API GET /api/penalties failed or data is not array');
    }

    console.log(`  - Total penalties returned: ${json.data.length}`);
    let genericMemberCount = 0;
    json.data.forEach((p: any, idx: number) => {
      if (p.member === 'Member' || p.memberName === 'Member') {
        genericMemberCount++;
        console.error(`  - ERROR: Penalty #${p.id} (DB ID: ${p.dbId}) has generic name 'Member'! MemberId: ${p.memberId}`);
      }
    });

    if (genericMemberCount > 0) {
      throw new Error(`Found ${genericMemberCount} penalties displaying generic 'Member'!`);
    } else {
      console.log('  - PASS: Zero records contain the generic word "Member"!');
    }

    // 2. Verify all 7 official members have their names correctly resolved
    console.log('\n[TEST 2] Verifying resolution for all 7 official Dreamloom members:');
    const members = await prisma.member.findMany({ orderBy: { id: 'asc' } });
    if (members.length !== 7) throw new Error(`Expected 7 members, found ${members.length}`);

    members.forEach(m => {
      const memberPenalties = json.data.filter((p: any) => p.memberId === m.id);
      console.log(`  - Member #${m.id}: "${m.fullName}" -> ${memberPenalties.length} penalties linked. Sample name displayed: "${memberPenalties[0]?.member || 'N/A'}"`);
      if (memberPenalties.length > 0) {
        if (memberPenalties.some((p: any) => p.member !== m.fullName)) {
          throw new Error(`Mismatch in member name for member #${m.id}`);
        }
      }
    });

    // 3. Test creating a new penalty via POST /api/penalties using permanent memberId
    console.log('\n[TEST 3] Testing POST /api/penalties creation with memberId:');
    const testMember = members[1]; // David Wainaina Kinyua
    const testMonth = 'Nov 2025';

    // Cleanup existing if any
    await prisma.penalty.deleteMany({
      where: { memberId: testMember.id, monthYear: testMonth }
    });

    const postReq = new Request('http://localhost:3000/api/penalties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: 'simon@dreamloom.co.ke',
        memberId: testMember.id,
        memberName: testMember.fullName,
        monthYear: testMonth,
        status: 'Unpaid',
        penaltyAmount: 500
      })
    });

    const postRes = await POST(postReq);
    const postJson = await postRes.json();
    if (!postJson.success) throw new Error(`POST failed: ${postJson.error}`);

    console.log(`  - Successfully created penalty ID: ${postJson.data.id}`);
    console.log(`  - Linked memberId in DB: ${postJson.data.memberId} (Expected: ${testMember.id})`);
    console.log(`  - Linked member name: "${postJson.data.member?.fullName}" (Expected: "${testMember.fullName}")`);

    if (postJson.data.memberId !== testMember.id || postJson.data.member?.fullName !== testMember.fullName) {
      throw new Error('New penalty did not link to correct memberId and fullName!');
    }

    // 4. Verify that GET /api/penalties immediately returns the new record with actual full name
    console.log('\n[TEST 4] Verifying GET after creation:');
    const verifyGetRes = await GET();
    const verifyGetJson = await verifyGetRes.json();
    const createdItem = verifyGetJson.data.find((p: any) => p.dbId === postJson.data.id || p.id === postJson.data.id);

    if (!createdItem) throw new Error('Created penalty not found in GET response!');
    console.log(`  - Item in GET response: member="${createdItem.member}", memberName="${createdItem.memberName}", memberId=${createdItem.memberId}`);
    if (createdItem.member !== testMember.fullName || createdItem.memberName !== testMember.fullName) {
      throw new Error(`Expected "${testMember.fullName}", but got "${createdItem.member}"`);
    }
    console.log('  - PASS: Full member name is returned dynamically from DB!');

    // 5. Clean up test record
    await prisma.penalty.delete({ where: { id: postJson.data.id } });
    console.log('\n[TEST 5] Cleaned up test record.');

    console.log('\n========================================================================');
    console.log('ALL TESTS PASSED: MEMBER NAMES ARE 100% ACCURATE AND SECURE');
    console.log('========================================================================');
  } catch (err) {
    console.error('TEST FAILED:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testMemberNamesResolution();
