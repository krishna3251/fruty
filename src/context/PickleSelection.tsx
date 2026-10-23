import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { pickleProducts } from "../data/pickles";
export const PICKLE_SELECTION_KEY = "fruity-pickle-selection-v1";
export function restoreSelection(raw: string | null): string[] {
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
                  pickleProducts.some((p) => p.id === id),
              ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}
const SelectionContext = createContext<{
  ids: string[];
  toggle: (id: string) => void;
  storageUnavailable: boolean;
} | null>(null);
export function PickleSelectionProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState(() => {
    try {
      return restoreSelection(localStorage.getItem(PICKLE_SELECTION_KEY));
    } catch {
      return [];
    }
  });
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(PICKLE_SELECTION_KEY, JSON.stringify(ids));
    } catch {
      setStorageUnavailable(true);
    }
  }, [ids]);
  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if (e.key === PICKLE_SELECTION_KEY || e.key === null)
        setIds(restoreSelection(e.newValue));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const toggle = (id: string) => {
    if (!pickleProducts.some((p) => p.id === id)) return;
    setIds((current) =>
      current.includes(id) ? current.filter((p) => p !== id) : [...current, id],
    );
  };
  return (
    <SelectionContext.Provider value={{ ids, toggle, storageUnavailable }}>
      {children}
    </SelectionContext.Provider>
  );
}
// Optional for archived components that render outside the primary pantry store.
export const usePickleSelection = () => useContext(SelectionContext);
