export const MEMBER_AVATARS: Record<string, string> = {
  // Member 1: Simon Memia Wanjiru
  'MEM-001': '/members/member-1.jpg',
  '1': '/members/member-1.jpg',
  'simon': '/members/member-1.jpg',
  'simon memia': '/members/member-1.jpg',
  'simon memia wanjiru': '/members/member-1.jpg',
  'simon@dreamloom.co.ke': '/members/member-1.jpg',

  // Member 2: David Wainaina Kinyua
  'MEM-002': '/members/member-2.jpg',
  '2': '/members/member-2.jpg',
  'david': '/members/member-2.jpg',
  'david wainaina': '/members/member-2.jpg',
  'david wainaina kinyua': '/members/member-2.jpg',
  'david@dreamloom.co.ke': '/members/member-2.jpg',

  // Member 3: Elijah Waitara Gichari
  'MEM-003': '/members/member-3.jpg',
  '3': '/members/member-3.jpg',
  'elijah': '/members/member-3.jpg',
  'elijah waitara': '/members/member-3.jpg',
  'elijah waitara gichari': '/members/member-3.jpg',
  'elijah@dreamloom.co.ke': '/members/member-3.jpg',

  // Member 4: Samuel Kamau Nguuro
  'MEM-004': '/members/member-4.jpg',
  '4': '/members/member-4.jpg',
  'samuel': '/members/member-4.jpg',
  'samuel kamau': '/members/member-4.jpg',
  'samuel kamau nguuro': '/members/member-4.jpg',
  'samuel@dreamloom.co.ke': '/members/member-4.jpg',

  // Member 5: Michael Kiarie Wanjiru
  'MEM-005': '/members/member-5.jpg',
  '5': '/members/member-5.jpg',
  'michael': '/members/member-5.jpg',
  'michael kiarie': '/members/member-5.jpg',
  'michael kiarie wanjiru': '/members/member-5.jpg',
  'michael@dreamloom.co.ke': '/members/member-5.jpg',

  // Member 6: Daniel Kamau Njiriri
  'MEM-006': '/members/member-6.jpg',
  '6': '/members/member-6.jpg',
  'daniel': '/members/member-6.jpg',
  'daniel kamau': '/members/member-6.jpg',
  'daniel kamau njiriri': '/members/member-6.jpg',
  'daniel@dreamloom.co.ke': '/members/member-6.jpg',

  // Member 7: Beatrice Njoki Muthoni
  'MEM-007': '/members/member-7.jpg',
  '7': '/members/member-7.jpg',
  'beatrice': '/members/member-7.jpg',
  'beatrice njoki': '/members/member-7.jpg',
  'beatrice njoki muthoni': '/members/member-7.jpg',
  'beatrice@dreamloom.co.ke': '/members/member-7.jpg',
};

export function getMemberAvatar(identifier?: string | number | null): string {
  if (!identifier) {
    return '/members/default-avatar.svg';
  }

  const clean = String(identifier).trim().toLowerCase();

  if (MEMBER_AVATARS[clean]) {
    return MEMBER_AVATARS[clean];
  }

  const firstName = clean.split(' ')[0];
  if (MEMBER_AVATARS[firstName]) {
    return MEMBER_AVATARS[firstName];
  }

  const match = clean.match(/mem-0*(\d+)/);
  if (match && match[1] && MEMBER_AVATARS[match[1]]) {
    return MEMBER_AVATARS[match[1]];
  }

  return '/members/default-avatar.svg';
}
