export const Constants = {
  appUrl: import.meta.env.VITE_APP_URL ?? window.location.origin,

  createSharedUrl: (sharedChatId: string) => {
    return `${Constants.appUrl}/share/${sharedChatId}`;
  },
} as const;
