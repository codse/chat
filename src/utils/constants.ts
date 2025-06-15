export const Constants = {
  appUrl: import.meta.env.VITE_APP_URL,

  createSharedUrl: (sharedChatId: string) => {
    return `${Constants.appUrl}/share/${sharedChatId}`;
  },
};
