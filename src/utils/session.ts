import { getAuth } from '@clerk/tanstack-react-start/server';
import { getWebRequest } from '@tanstack/react-start/server';

export const getClerkUser = async () => {
  const request = getWebRequest();
  if (!request) {
    return null;
  }

  return getAuth(request);
};
