// components/contexts/MenuContext.tsx
import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  BackendMenuItem,
  getMenuItems,
  resolvePhotoUrl,
} from "@/constants/api";
import { MenuItem } from "@/constants/menu-data";

export type ExtraMenuItem = {
  id: string;
  name: string;
  price: string;
  note?: string;
};

// "추가 메뉴" 카테고리는 손님 화면에서 장바구니에 못 담고 가격 안내만
// 보여주는 특별한 탭이라, 다른 카테고리와 분리해서 제공합니다.
const EXTRA_CATEGORY = "추가 메뉴";

function toMenuItem(m: BackendMenuItem): MenuItem {
  return {
    id: String(m.id),
    name: m.name,
    description: m.description,
    price: m.price,
    priceVal: m.priceVal,
    isHot: m.isHot,
    image: resolvePhotoUrl(m.imageUrl) ?? undefined,
    mushrooms:
      m.ingredients && m.ingredients.length > 0
        ? m.ingredients.map((ing) => ({
            name: ing.name,
            image: resolvePhotoUrl(ing.imageUrl) ?? undefined,
          }))
        : undefined,
  };
}

function toExtraMenuItem(m: BackendMenuItem): ExtraMenuItem {
  return {
    id: String(m.id),
    name: m.name,
    price: m.price,
    note: m.description || undefined,
  };
}

type MenuContextType = {
  menuData: Record<string, MenuItem[]>;
  extraMenu: ExtraMenuItem[];
  categories: string[]; // "추가 메뉴" 제외한, 화면 탭에 보여줄 카테고리 순서
  loading: boolean;
  refreshMenu: () => void;
  findMenuItemById: (id: string) => MenuItem | undefined;
};

export const MenuContext = createContext<MenuContextType>({
  menuData: {},
  extraMenu: [],
  categories: [],
  loading: true,
  refreshMenu: () => {},
  findMenuItemById: () => undefined,
});

export const MenuProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<BackendMenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshMenu = useCallback(() => {
    setLoading(true);
    getMenuItems()
      .then(setItems)
      .catch(() => {
        // 메뉴를 못 불러와도 화면이 죽지 않도록 조용히 무시
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshMenu();
  }, [refreshMenu]);

  const mainItems = items.filter((m) => m.category !== EXTRA_CATEGORY);
  const extraItems = items.filter((m) => m.category === EXTRA_CATEGORY);

  const menuData: Record<string, MenuItem[]> = {};
  const categories: string[] = [];
  for (const item of mainItems) {
    if (!menuData[item.category]) {
      menuData[item.category] = [];
      categories.push(item.category);
    }
    menuData[item.category].push(toMenuItem(item));
  }

  const extraMenu = extraItems
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(toExtraMenuItem);

  const findMenuItemById = useCallback(
    (id: string) => {
      for (const category of Object.values(menuData)) {
        const found = category.find((item) => item.id === id);
        if (found) return found;
      }
      return undefined;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items],
  );

  return (
    <MenuContext.Provider
      value={{
        menuData,
        extraMenu,
        categories,
        loading,
        refreshMenu,
        findMenuItemById,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};
