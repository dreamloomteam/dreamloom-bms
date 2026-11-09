const http = require('http');
const { createSessionToken, verifySessionToken, REMEMBER_ME_DURATION, STANDARD_DURATION } = require('../src/lib/session');
const { findAuthorizedUser, AUTHORIZED_USERS } = require('../src/lib/authConfig');

async function runUnitTests() {
  console.log('=== RUNNING AUTH & SESSION UNIT TESTS ===');

  // Test 1: Verify all 8 authorized users exist
  console.log(`Checking authorized users count: ${AUTHORIZED_USERS.length} (expected 8)`);
  if (AUTHORIZED_USERS.length !== 8) throw new Error('Expected 8 authorized users');

  // Test 2: Test Simon Memia lookup (both email aliases)
  const kamera = findAuthorizedUser('kamera@dreamloom.co.ke', 'Simon@%322');
  if (!kamera || kamera.fullName !== 'Simon Memia Wanjiru') throw new Error('kamera@dreamloom.co.ke auth failed');
  console.log('✓ Test 2 passed: kamera@dreamloom.co.ke authenticated successfully');

  const simon = findAuthorizedUser('simon@dreamloom.co.ke', 'Simon@%322');
  if (!simon || simon.fullName !== 'Simon Memia Wanjiru') throw new Error('simon@dreamloom.co.ke auth failed');
  console.log('✓ Test 3 passed: simon@dreamloom.co.ke authenticated successfully');

  // Test 3: Test invalid password rejected
  const invalid = findAuthorizedUser('kamera@dreamloom.co.ke', 'WrongPassword123');
  if (invalid !== null) throw new Error('Invalid password should return null');
  console.log('✓ Test 4 passed: Invalid password properly rejected');

  // Test 4: Token generation with Remember Me (30 days)
  const { token: rememberToken, payload: remPayload, maxAge: remMaxAge } = createSessionToken(kamera, true);
  if (remMaxAge !== REMEMBER_ME_DURATION || remMaxAge !== 30 * 24 * 60 * 60) {
    throw new Error('Remember Me duration should be exactly 30 days');
  }
  if (!remPayload.rememberMe) throw new Error('Payload rememberMe should be true');
  console.log('✓ Test 5 passed: 30-day Remember Me token created with MaxAge 2592000s');

  // Test 5: Token verification
  const verified = verifySessionToken(rememberToken);
  if (!verified || verified.email !== 'kamera@dreamloom.co.ke' || verified.fullName !== 'Simon Memia Wanjiru') {
    throw new Error('Token verification failed');
  }
  console.log('✓ Test 6 passed: Cryptographic HMAC-SHA256 token verified successfully');

  // Test 6: Tampered token rejection
  const tamperedToken = rememberToken.slice(0, -4) + 'abcd';
  const tamperedVerified = verifySessionToken(tamperedToken);
  if (tamperedVerified !== null) throw new Error('Tampered token should be rejected');
  console.log('✓ Test 7 passed: Tampered token signature rejected');

  // Test 7: Standard duration without Remember Me
  const { maxAge: stdMaxAge, payload: stdPayload } = createSessionToken(kamera, false);
  if (stdMaxAge !== STANDARD_DURATION || stdMaxAge !== 24 * 60 * 60) {
    throw new Error('Standard duration should be 24 hours');
  }
  if (stdPayload.rememberMe !== false) throw new Error('Standard payload rememberMe should be false');
  console.log('✓ Test 8 passed: Standard session created with 24-hour MaxAge');

  console.log('\nALL 8 AUTH & SESSION UNIT TESTS PASSED SUCCESSFULLY!\n');
}

runUnitTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
