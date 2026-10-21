import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { products } from "../data/products";
import { changeQuantity, restoreCart, type CartItems } from "./cartModel";
const CartContext = createContext<{
  items: CartItems;
  change: (id: string, delta: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
} | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItems>(() => {
    try {
      return restoreCart(
        localStorage.getItem("furity-cart-v1"),
        products.filter((p) => p.available).map((p) => p.id),
      );
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("furity-cart-v1", JSON.stringify(items));
    } catch {
      /* Shopping remains available when storage is disabled. */
    }
  }, [items]);
  const change = (id: string, delta: number) => {
    if (
      products.some((p) => p.id === id && p.available) &&
      Number.isInteger(delta)
    )
      setItems((old) => changeQuantity(old, id, delta));
  };
  const remove = (id: string) =>
    setItems((old) => {
      const next = { ...old };
      delete next[id];
      return next;
    });
  const count = Object.values(items).reduce((a, b) => a + b, 0);
  const subtotal = products.reduce(
    (sum, p) => sum + p.price * (items[p.id] || 0),
    0,
  );
  return (
    <CartContext.Provider
      value={{
        items,
        change,
        remove,
        clear: () => setItems({}),
        count,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw Error("CartProvider missing");
  return cart;
}
