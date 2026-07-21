// components/contexts/ProfileContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export type Profile = {
  name: string;
  phone: string;
  avatarUri?: string;
};

type ProfileContextType = {
  profile: Profile | null;
  saveProfile: (profile: Profile) => Promise<void>;
  saveAvatar: (uri: string) => Promise<void>;
  clearAvatar: () => Promise<void>;
  clearProfile: () => Promise<void>;
};

const STORAGE_KEY = "@seonggong_profile";

export const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  saveProfile: async () => {},
  saveAvatar: async () => {},
  clearAvatar: async () => {},
  clearProfile: async () => {},
});

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setProfile(JSON.parse(stored));
      } catch {
        // 무시
      }
    })();
  }, []);

  const saveProfile = async (newProfile: Profile) => {
    // 기존 avatarUri는 유지하면서 이름/전화번호만 갱신
    const merged: Profile = { ...profile, ...newProfile };
    setProfile(merged);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  };

  const saveAvatar = async (uri: string) => {
    const merged: Profile = {
      name: profile?.name ?? "",
      phone: profile?.phone ?? "",
      ...profile,
      avatarUri: uri,
    };
    setProfile(merged);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  };

  // 로그아웃 시 업로드했던 프로필 사진만 지웁니다 (이름/전화번호는 비로그인
  // 예약 화면에서도 계속 쓰이는 값이라 남겨둡니다).
  const clearAvatar = async () => {
    const merged: Profile = {
      name: profile?.name ?? "",
      phone: profile?.phone ?? "",
    };
    setProfile(merged);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  };

  const clearProfile = async () => {
    setProfile(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ProfileContext.Provider
      value={{ profile, saveProfile, saveAvatar, clearAvatar, clearProfile }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export function useProfile() {
  return useContext(ProfileContext);
}
