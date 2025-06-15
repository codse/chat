const LINKING_SESSION_KEY = 'linking-session';

export const LinkingSession = {
  track: (sessionId: string) => {
    localStorage.setItem(LINKING_SESSION_KEY, sessionId);
  },
  get: () => {
    return localStorage.getItem(LINKING_SESSION_KEY);
  },
  clear: () => {
    localStorage.removeItem(LINKING_SESSION_KEY);
  },
};
