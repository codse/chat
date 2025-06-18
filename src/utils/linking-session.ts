const LINKING_SESSION_KEY = 'chat:linking-session';
export const isClientSide = () => typeof window !== 'undefined';

export const LinkingSession = {
  key: LINKING_SESSION_KEY,
  track: (sessionId: string) => {
    if (isClientSide()) {
      localStorage.setItem(LINKING_SESSION_KEY, sessionId);
    }
  },
  get: () => {
    return isClientSide() ? localStorage.getItem(LINKING_SESSION_KEY) : null;
  },
  clear: () => {
    if (isClientSide()) {
      localStorage.removeItem(LINKING_SESSION_KEY);
    }
  },
};
