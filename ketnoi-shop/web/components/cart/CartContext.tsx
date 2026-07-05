'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface CartLine {
  id: string; // productId
  slug: string;
  name: string;
  price: number; // giá bán thực tế (đã tính salePrice)
  image?: string;
  quantity: number;
}

interface CartContextValue {
  items: CartLine[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (line: Omit<CartLine, 'quantity'>, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'ketnoi_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  // Nạp giỏ từ localStorage sau khi mount (tránh lệch SSR)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartLine[]);
    } catch {
      /* bỏ qua dữ liệu hỏng */
    }
    setReady(true);
  }, []);

  // Lưu lại mỗi khi giỏ đổi
  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const add = useCallback(
    (line: Omit<CartLine, 'quantity'>, qty: number = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.id === line.id);
        if (existing) {
          return prev.map((i) =>
            i.id === line.id ? { ...i, quantity: i.quantity + qty } : i,
          );
        }
        return [...prev, { ...line, quantity: qty }];
      });
    },
    [],
  );

  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
    );
  }, []);

  const remove = useCallback(
    (id: string) => setItems((prev) => prev.filter((i) => i.id !== id)),
    [],
  );

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return { items, count, subtotal, ready, add, setQty, remove, clear };
  }, [items, ready, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart phải nằm trong <CartProvider>');
  return ctx;
}
