// components/contexts/AdminContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useEffect, useState } from "react";

import { adminLogin as apiAdminLogin } from "@/constants/adminApi";

const STORAGE_KEY = "admin_password_v1";

type AdminContextType = {
  isAdmin: boolean;
  adminPassword: string | null;
  loading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

export const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  adminPassword: null,
  loading: true,
  login: async () => false,
  logout: async () => {},
});

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [adminPassword, setAdminPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 앱을 다시 켰을 때도 매번 로그인하지 않도록, 성공했던 비밀번호를
  // 기기에 저장해뒀다가 자동으로 불러옵니다.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setAdminPassword(stored);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (password: string) => {
    const ok = await apiAdminLogin(password);
    if (ok) {
      setAdminPassword(password);
      await AsyncStorage.setItem(STORAGE_KEY, password);
    }
    return ok;
  };

  const logout = async () => {
    setAdminPassword(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AdminContext.Provider
      value={{
        isAdmin: !!adminPassword,
        adminPassword,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
