// Role-based access. Roles are a starting point; permissions are the source of truth,
// so a church can define custom roles without code changes.
export const PERMISSION_KEYS = [
  'canViewMembers', 'canEditMembers',
  'canViewFinances', 'canEditFinances',
  'canManageEvents', 'canManageDocuments',
  'canViewPrayerRequests', 'canManagePrayerRequests',
  'canManageSermons', 'canInviteStaff',
  'canPublishAnnouncements',
];

const all = (v) => Object.fromEntries(PERMISSION_KEYS.map((k) => [k, v]));

export const ROLE_DEFAULTS = {
  owner: all(true),
  pastor: { ...all(true), canInviteStaff: false },
  associate_pastor: { ...all(false), canViewMembers: true, canManageEvents: true, canManageSermons: true, canViewPrayerRequests: true, canManagePrayerRequests: true, canManageDocuments: true },
  ministry_leader: { ...all(false), canViewMembers: true, canManageEvents: true, canManageDocuments: true },
  administrator: { ...all(false), canViewMembers: true, canEditMembers: true, canManageEvents: true, canManageDocuments: true, canInviteStaff: true },
  finance: { ...all(false), canViewFinances: true, canEditFinances: true },
  event_coordinator: { ...all(false), canManageEvents: true, canManageDocuments: true },
  worship_leader: { ...all(false), canManageEvents: true },
  youth_leader: { ...all(false), canManageEvents: true, canViewMembers: true },
  custom: all(false),
};

export const defaultPermissions = (role) => ({ ...(ROLE_DEFAULTS[role] ?? ROLE_DEFAULTS.custom) });

export function can(membership, key) {
  if (!membership) return false;
  return membership.permissions?.[key] === true;
}
