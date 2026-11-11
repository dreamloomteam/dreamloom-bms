export interface AuthorizedUser {
  email: string;
  password?: string;
  name: string;
  fullName: string;
  nationalId: string;
  phone: string;
  role: string;
}

export const AUTHORIZED_USERS: AuthorizedUser[] = [
  {
    email: 'simon@dreamloom.co.ke',
    password: 'Simon@%322',
    name: 'Simon Memia',
    fullName: 'Simon Memia Wanjiru',
    nationalId: '32242103',
    phone: '0719545283',
    role: 'Director / Super Admin',
  },
  {
    email: 'david@dreamloom.co.ke',
    password: 'David@399',
    name: 'David Wainaina',
    fullName: 'David Wainaina Kinyua',
    nationalId: '39929859',
    phone: '0714382925',
    role: 'Member',
  },
  {
    email: 'elijah@dreamloom.co.ke',
    password: 'Elijah@342',
    name: 'Elijah Waitara',
    fullName: 'Elijah Waitara Gichari',
    nationalId: '34282968',
    phone: '0718963492',
    role: 'Member',
  },
  {
    email: 'samuel@dreamloom.co.ke',
    password: 'Samuel@400',
    name: 'Samuel Kamau',
    fullName: 'Samuel Kamau Nguuro',
    nationalId: '40085139',
    phone: '0113114471',
    role: 'Member',
  },
  {
    email: 'michael@dreamloom.co.ke',
    password: 'Michael@389',
    name: 'Michael Kiarie',
    fullName: 'Michael Kiarie Wanjiru',
    nationalId: '38927071',
    phone: '0748036136',
    role: 'Treasurer',
  },
  {
    email: 'daniel@dreamloom.co.ke',
    password: 'daniel@366',
    name: 'Daniel Kamau',
    fullName: 'Daniel Kamau Njiriri',
    nationalId: '36686858',
    phone: '0759818731',
    role: 'Member',
  },
  {
    email: 'beatrice@dreamloom.co.ke',
    password: 'Beatrice@404',
    name: 'Beatrice Njoki',
    fullName: 'Beatrice Njoki Muthoni',
    nationalId: '40492876',
    phone: '0708665848',
    role: 'Member',
  },
];

export function findAuthorizedUser(identifier: string, password?: string): AuthorizedUser | null {
  if (!identifier) return null;
  const norm = identifier.trim().toLowerCase();
  const user = AUTHORIZED_USERS.find(u => {
    const emailLower = u.email.toLowerCase();
    const username = emailLower.split('@')[0];
    return emailLower === norm || username === norm;
  });
  if (!user) return null;
  if (password !== undefined && user.password !== password.trim()) {
    return null;
  }
  return user;
}
