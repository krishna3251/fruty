import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { pickleProducts, type PickleProduct } from "../data/pickles";
const CatalogueContext = createContext({
  products: pickleProducts,
  loading: false,
  error: "",
  refresh: () => {},
});
export function CatalogueProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState(pickleProducts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    setLoading(true);
    fetch("/api/catalogue", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw Error();
        const data = await response.json();
        if (!Array.isArray(data.products)) throw Error();
        return data.products as PickleProduct[];
      })
      .then((p) => {
        setProducts(p);
        setError("");
      })
      .catch(() => {
        if (controller.signal.reason !== "unmount")
          setError(
            "Live updates are unavailable. Showing the original catalogue; confirm the current price and stock before ordering.",
          );
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (controller.signal.reason !== "unmount") setLoading(false);
      });
    return () => {
      controller.abort("unmount");
      window.clearTimeout(timeout);
    };
  }, [version]);
  return (
    <CatalogueContext.Provider value={{ products, loading, error, refresh }}>
      {children}
    </CatalogueContext.Provider>
  );
}
export const useCatalogue = () => useContext(CatalogueContext);
