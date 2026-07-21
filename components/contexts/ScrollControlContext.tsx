// components/contexts/ScrollControlContext.tsx
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { ScrollView } from "react-native";

type ScrollControlContextType = {
  activeScrollRef: React.MutableRefObject<ScrollView | null>;
  scrollToTop: () => void;
  scrollToBottom: () => void;
};

const ScrollControlContext = createContext<ScrollControlContextType | null>(
  null,
);

export function ScrollControlProvider({ children }: { children: ReactNode }) {
  const activeScrollRef = useRef<ScrollView | null>(null);

  const scrollToTop = useCallback(() => {
    if (activeScrollRef.current) {
      activeScrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (activeScrollRef.current) {
      activeScrollRef.current.scrollToEnd({ animated: true });
    }
  }, []);

  return (
    <ScrollControlContext.Provider
      value={{ activeScrollRef, scrollToTop, scrollToBottom }}
    >
      {children}
    </ScrollControlContext.Provider>
  );
}

export function useScrollControl() {
  const ctx = useContext(ScrollControlContext);
  if (!ctx) {
    throw new Error(
      "useScrollControl은 ScrollControlProvider 안에서만 사용할 수 있습니다.",
    );
  }
  return ctx;
}

// 각 화면에서 사용하는 훅.
// 반환된 ref를 ScrollView에 그대로 연결하면, 마운트 시 자동으로 전역에 등록되고
// 언마운트 시 자동으로 해제됩니다.
export function useRegisterScroll() {
  const { activeScrollRef } = useScrollControl();
  const localRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    // 화면이 포커스를 받는 시점에 전역 ref를 이 화면의 ScrollView로 갱신
    activeScrollRef.current = localRef.current;

    return () => {
      // 언마운트 시, 혹시 이 화면이 여전히 활성으로 잡혀있다면 비워줌
      if (activeScrollRef.current === localRef.current) {
        activeScrollRef.current = null;
      }
    };
  }, [activeScrollRef]);

  return localRef;
}
