// components/contexts/AdminContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useEffect, useState } from "react";

import { adminLogin as apiAdminLogin } from "@/constants/adminApi";

const STORAGE_KEY = "admin_password_v1";

type AdminContextType = {
  isAdmin: boolean;
  adminPassword: string | null;
  loading: boolean;
  login: (
    businessNumber: string,
    phone: string,
    password: string,
  ) => Promise<boolean>;
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

  // 로그인은 사업자등록번호 + 전화번호 + 비밀번호 3개를 다 확인해요. 성공
  // 후에는(다른 모든 관리자 화면에서) 비밀번호만 기기에 저장해두고 계속 써요.
  const login = async (
    businessNumber: string,
    phone: string,
    password: string,
  ) => {
    const ok = await apiAdminLogin(businessNumber, phone, password);
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
