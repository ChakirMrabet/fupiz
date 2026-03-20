const ADMIN_ROLE = 'ADMIN';

export function isConfiguredAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  const configuredEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return configuredEmails.includes(email.trim().toLowerCase());
}

export function getEffectiveRole(user: { email?: string | null; role?: string | null }) {
  if (isConfiguredAdminEmail(user.email)) {
    return ADMIN_ROLE;
  }

  return user.role || 'USER';
}
