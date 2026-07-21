// components/contexts/AuthContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export type AuthUser = {
  nickname: string;
  loginId: string;
  avatarUrl?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoaded: boolean;
  signIn: (user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
  updateNicknameLocal: (nickname: string) => Promise<void>;
  updateAvatarLocal: (avatarUrl: string) => Promise<void>;
};

const STORAGE_KEY = "@seonggong_auth_user";

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoaded: false,
  signIn: async () => {},
  signOut: async () => {},
  updateNicknameLocal: async () => {},
  updateAvatarLocal: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setUser(JSON.parse(stored));
      } catch {
        // 무시
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const signIn = async (newUser: AuthUser) => {
    setUser(newUser);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
  };

  const signOut = async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  // 서버에서 닉네임 변경에 성공한 후, 로컬에 저장된 사용자 정보도 같이 갱신합니다.
  const updateNicknameLocal = async (nickname: string) => {
    if (!user) return;
    const updated: AuthUser = { ...user, nickname };
    setUser(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // 서버에 프로필 사진 업로드가 끝난 후, 로컬에 저장된 사용자 정보도 같이 갱신합니다.
  const updateAvatarLocal = async (avatarUrl: string) => {
    if (!user) return;
    const updated: AuthUser = { ...user, avatarUrl };
    setUser(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoaded,
        signIn,
        signOut,
        updateNicknameLocal,
        updateAvatarLocal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
