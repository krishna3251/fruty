import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { businessDefaults, type BusinessSettings } from "../lib/business";
export const BusinessContext = createContext(businessDefaults);
export function BusinessProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BusinessSettings>(businessDefaults);
  useEffect(() => {
    const c = new AbortController();
    fetch("/api/business", {
      signal: AbortSignal.any([c.signal, AbortSignal.timeout(12000)]),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.settings) setSettings(d.settings);
      })
      .catch(() => {});
    return () => c.abort();
  }, []);
  return (
    <BusinessContext.Provider value={settings}>
      {children}
    </BusinessContext.Provider>
  );
}
export const useBusiness = () => useContext(BusinessContext);
