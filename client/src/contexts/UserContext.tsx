import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export type UserType = 'publisher' | 'advertiser' | null;

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  role: Exclude<UserType, null>;
}

interface UserContextType {
  userType: UserType;
  setUserType: (type: UserType) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (status: boolean) => void;
  token: string | null;
  setToken: (t: string | null) => void;
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  logout: () => void;
  hydrated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('auth');
      if (raw) {
        const parsed = JSON.parse(raw) as { token: string; user: AuthUser };
        setToken(parsed.token);
        setUser(parsed.user);
        setUserType(parsed.user.role);
        setIsLoggedIn(true);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  // persist to localStorage
  useEffect(() => {
    if (token && user) {
      localStorage.setItem('auth', JSON.stringify({ token, user }));
    } else {
      localStorage.removeItem('auth');
    }
  }, [token, user]);

  const logout = useMemo(
    () => () => {
      setIsLoggedIn(false);
      setUserType(null);
      setToken(null);
      setUser(null);
    },
    []
  );

  return (
    <UserContext.Provider value={{
      userType,
      setUserType,
      isLoggedIn,
      setIsLoggedIn,
      token,
      setToken,
      user,
      setUser,
      logout,
      hydrated,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}