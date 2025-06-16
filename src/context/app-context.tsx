import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { BYOKKeys, BYOKStorage } from '@/utils/byok-storage';

interface AppContextType {
  userKeys: BYOKKeys;
  setUserKeys: (keys: BYOKKeys) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [userKeys, _setUserKeys] = useState<BYOKKeys>(BYOKStorage.get());

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === BYOKStorage.key) {
        setUserKeys(BYOKStorage.get());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setUserKeys = useCallback((keys: BYOKKeys) => {
    BYOKStorage.set(keys);
    _setUserKeys(keys);
  }, []);

  return (
    <AppContext.Provider value={{ userKeys, setUserKeys }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);

  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }

  return ctx;
}
