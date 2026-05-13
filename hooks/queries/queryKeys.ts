export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    currentUser: ['auth', 'currentUser'] as const,
  },
  activities: {
    all: ['activities'] as const,
    list: (query?: unknown) => ['activities', 'list', query] as const,
    recommended: (query?: unknown) => ['activities', 'recommended', query] as const,
    my: (query?: unknown) => ['activities', 'my', query] as const,
    details: (activityId?: string) => ['activities', 'details', activityId] as const,
    saved: (query?: unknown) => ['activities', 'saved', query] as const,
  },
  participation: {
    all: ['participation'] as const,
    status: (activityId?: string) => ['participation', 'status', activityId] as const,
    participants: (activityId?: string, query?: unknown) => ['participation', 'participants', activityId, query] as const,
    joinRequests: (activityId?: string, query?: unknown) => ['participation', 'joinRequests', activityId, query] as const,
  },
  ratings: {
    all: ['ratings'] as const,
    byActivity: (activityId?: string, query?: unknown) => ['ratings', 'activity', activityId, query] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (query?: unknown) => ['notifications', 'list', query] as const,
  },
  subscriptions: {
    all: ['subscriptions'] as const,
    list: (query?: unknown) => ['subscriptions', 'list', query] as const,
  },
  users: {
    all: ['users'] as const,
    profile: (userId?: string) => ['users', 'profile', userId] as const,
    history: (userId?: string, query?: unknown) => ['users', 'history', userId, query] as const,
  },
  qr: {
    all: ['qr'] as const,
    myToken: ['qr', 'myToken'] as const,
  },
};
