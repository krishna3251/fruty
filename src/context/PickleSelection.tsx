import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useCatalogue } from "./Catalogue";
import { pickleProducts } from "../data/pickles";
export const PICKLE_SELECTION_KEY = "fruity-pickle-selection-v1";
export function restoreSelection(
  raw: string | null,
  allowed: string[] | null = pickleProducts.map((p) => p.id),
): string[] {
  try {
    const value: unknown = JSON.parse(raw || "[]");
    return Array.isArray(value)
      ? [
          ...new Set(
            value
              .map((id) =>
                id === "fermented-cucumber-pickle"
                  ? "tropical-cucumber-pickle"
                  : id,
              )
              .filter(
                (id): id is string =>
                  typeof id === "string" &&
                  (allowed
                    ? allowed.includes(id)
                    : /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) &&
                      id !== "fermented-pale-vegetable-pickle"),
              ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}
export const PICKLE_QUANTITIES_KEY = "fruity-pickle-quantities-v1";
export const MAX_ENQUIRY_QUANTITY = 99;
export function restoreQuantities(
  raw: string | null,
  ids: string[],
): Record<string, number> {
  let value: unknown;
  try {
    value = JSON.parse(raw || "{}");
  } catch {
    value = {};
  }
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return Object.fromEntries(
    ids.map((id) => {
      const qty = record[id];
      return [
        id,
        typeof qty === "number" &&
        Number.isInteger(qty) &&
        qty >= 1 &&
        qty <= MAX_ENQUIRY_QUANTITY
          ? qty
          : 1,
      ];
    }),
  );
}
function readBasket() {
  try {
    const ids = restoreSelection(
      localStorage.getItem(PICKLE_SELECTION_KEY),
      null,
    );
    return {
      ids,
      quantities: restoreQuantities(
        localStorage.getItem(PICKLE_QUANTITIES_KEY),
        ids,
      ),
    };
  } catch {
    return { ids: [] as string[], quantities: {} as Record<string, number> };
  }
}
const SelectionContext = createContext<{
  ids: string[];
  quantities: Record<string, number>;
  itemCount: number;
  toggle: (id: string) => void;
  add: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  storageUnavailable: boolean;
} | null>(null);
export function PickleSelectionProvider({ children }: { children: ReactNode }) {
  const { products } = useCatalogue();
  const [basket, setBasket] = useState(readBasket);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(PICKLE_SELECTION_KEY, JSON.stringify(basket.ids));
      localStorage.setItem(
        PICKLE_QUANTITIES_KEY,
        JSON.stringify(basket.quantities),
      );
    } catch {
      setStorageUnavailable(true);
    }
  }, [basket]);
  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if ([PICKLE_SELECTION_KEY, PICKLE_QUANTITIES_KEY, null].includes(e.key))
        setBasket(readBasket());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const toggle = (id: string) => {
    if (!basket.ids.includes(id) && !products.some((p) => p.id === id)) return;
    setBasket((current) => {
      const ids = current.ids.includes(id)
        ? current.ids.filter((p) => p !== id)
        : [...current.ids, id];
      return {
        ids,
        quantities: restoreQuantities(JSON.stringify(current.quantities), ids),
      };
    });
  };
  const add = (id: string) => {
    if (
      !products.some(
        (p) =>
          p.id === id && p.price !== null && p.availability !== "unavailable",
      )
    )
      return;
    setBasket((current) =>
      current.ids.includes(id)
        ? current
        : {
            ids: [...current.ids, id],
            quantities: { ...current.quantities, [id]: 1 },
          },
    );
  };
  const setQuantity = (id: string, quantity: number) => {
    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_ENQUIRY_QUANTITY
    )
      return;
    setBasket((current) =>
      current.ids.includes(id)
        ? { ...current, quantities: { ...current.quantities, [id]: quantity } }
        : current,
    );
  };
  return (
    <SelectionContext.Provider
      value={{
        ...basket,
        itemCount: basket.ids.reduce(
          (n, id) => n + (basket.quantities[id] || 1),
          0,
        ),
        toggle,
        add,
        setQuantity,
        storageUnavailable,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
}
export const usePickleSelection = () => useContext(SelectionContext);
