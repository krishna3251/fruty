import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { useNotify } from "./Notifications";
import { useCatalogue } from "./Catalogue";
import { useSession } from "./Session";
import { customerApi, CustomerApiError } from "../lib/customerApi";
import { pickleProducts } from "../data/pickles";
export const PICKLE_BASKET_KEY = "tropical-feast-guest-cart-v2";
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
    const atomic = localStorage.getItem(PICKLE_BASKET_KEY);
    if (atomic) {
      const saved = JSON.parse(atomic);
      const ids = restoreSelection(JSON.stringify(saved.ids), null);
      return {
        ids,
        quantities: restoreQuantities(JSON.stringify(saved.quantities), ids),
      };
    }
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
  remove: (id: string) => void;
  add: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  storageUnavailable: boolean;
  syncStatus: string;
  reloadSaved: () => void;
  syncLoading: boolean;
} | null>(null);
export function PickleSelectionProvider({ children }: { children: ReactNode }) {
  const {
    products,
    loading: catalogueLoading,
    error: catalogueError,
  } = useCatalogue();
  const session = useSession();
  const notify = useNotify();
  const [syncStatus, setSyncStatus] = useState("");
  const [reload, setReload] = useState(0);
  const reloadSaved = useCallback(() => setReload((v) => v + 1), []);
  const syncEpoch = useRef(0);
  const serverVersion = useRef(0);
  const synced = useRef("");
  const [syncReady, setSyncReady] = useState(false);
  const pendingSync = useRef(false);
  const [saveTick, setSaveTick] = useState(0);
  const currentUser = useRef(session.userId);
  currentUser.current = session.userId;
  const [basket, setBasket] = useState(readBasket);
  const [basketOwner, setBasketOwner] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  useEffect(() => {
    if (session.status === "signed-in") {
      if (basketOwner !== null && basketOwner !== session.userId)
        setBasket({ ids: [], quantities: {} });
      setBasketOwner(session.userId);
      return;
    }
    if (session.status !== "loading" && basketOwner !== null) {
      setBasket(readBasket());
      setBasketOwner(null);
      setSyncStatus("");
    }
  }, [session.status, session.userId, basketOwner]);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  useEffect(() => {
    if (
      session.status === "signed-in" ||
      session.status === "loading" ||
      basketOwner !== null
    )
      return;
    try {
      // One atomic source of truth prevents older tabs from replaying torn ID/quantity writes.
      localStorage.setItem(PICKLE_BASKET_KEY, JSON.stringify(basket));
      localStorage.setItem(PICKLE_SELECTION_KEY, JSON.stringify(basket.ids));
      localStorage.setItem(
        PICKLE_QUANTITIES_KEY,
        JSON.stringify(basket.quantities),
      );
    } catch {
      setStorageUnavailable(true);
    }
  }, [basket, session.status, basketOwner]);
  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if (session.status === "signed-in" || session.status === "loading")
        return;
      try {
        const legacyEvent = [
          PICKLE_SELECTION_KEY,
          PICKLE_QUANTITIES_KEY,
        ].includes(e.key || "");
        if (
          e.key === PICKLE_BASKET_KEY ||
          e.key === null ||
          (legacyEvent && !localStorage.getItem(PICKLE_BASKET_KEY))
        )
          setBasket(readBasket());
      } catch {
        setStorageUnavailable(true);
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [session.status]);
  const applyServer = (items: Record<string, number>) => ({
    ids: Object.keys(items),
    quantities: items,
  });
  useEffect(() => {
    let active = true;
    const epoch = ++syncEpoch.current;
    setSyncReady(false);
    pendingSync.current = false;
    if (session.status !== "signed-in") {
      setSyncLoading(false);
      return;
    }
    if (catalogueLoading || catalogueError) {
      setSyncLoading(catalogueLoading);
      setSyncStatus(
        "Waiting for the current catalogue before syncing your cart.",
      );
      return;
    }
    setSyncLoading(true);
    setSyncStatus("Loading your saved cart…");
    void (async () => {
      const account = await customerApi(
        "/api/customer",
        { action: "load" },
        session.getToken,
      );
      if (!active || syncEpoch.current !== epoch) return;
      const guest = readBasket();
      // Only valid, available guest items are merged. Account-local PII is never persisted.
      const items = Object.fromEntries(
        guest.ids
          .filter((id) =>
            products.some(
              (p) =>
                p.id === id &&
                p.price !== null &&
                p.availability !== "unavailable" &&
                p.stockQuantity !== 0,
            ),
          )
          .map((id) => [
            id,
            Math.min(
              guest.quantities[id] || 1,
              products.find((p) => p.id === id)?.stockQuantity ?? 99,
            ),
          ]),
      );
      let cart = account.cart;
      if (Object.keys(items).length) {
        let mergeId = "";
        try {
          mergeId = sessionStorage.getItem("tf-cart-merge-v1") || "";
        } catch {}
        if (!mergeId) {
          mergeId = crypto.randomUUID();
          try {
            sessionStorage.setItem("tf-cart-merge-v1", mergeId);
          } catch {}
        }
        cart = await customerApi(
          "/api/customer",
          { action: "cart", items, version: cart.version, mergeId },
          session.getToken,
        );
        if (active) {
          try {
            localStorage.setItem(
              PICKLE_BASKET_KEY,
              JSON.stringify({ ids: [], quantities: {} }),
            );
            localStorage.removeItem(PICKLE_SELECTION_KEY);
            localStorage.removeItem(PICKLE_QUANTITIES_KEY);
            sessionStorage.removeItem("tf-cart-merge-v1");
          } catch {}
        }
      }
      if (!active) return;
      serverVersion.current = cart.version;
      synced.current = JSON.stringify(cart.items);
      setBasket(applyServer(cart.items));
      setSyncReady(true);
      setSyncStatus("Cart saved to your account.");
    })()
      .catch((e) => {
        if (active)
          setSyncStatus(
            e instanceof Error
              ? e.message
              : "Cart sync is unavailable. Try again.",
          );
      })
      .finally(() => {
        if (active) setSyncLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    session.status,
    session.userId,
    reload,
    catalogueLoading,
    catalogueError,
  ]);
  useEffect(() => {
    if (!syncReady || session.status !== "signed-in" || pendingSync.current)
      return;
    const items = Object.fromEntries(
      basket.ids.map((id) => [id, basket.quantities[id] || 1]),
    );
    const serialized = JSON.stringify(items);
    if (serialized === synced.current) return;
    const savingUser = session.userId;
    const savingEpoch = syncEpoch.current;
    const timer = window.setTimeout(() => {
      if (
        syncEpoch.current !== savingEpoch ||
        currentUser.current !== savingUser
      )
        return;
      pendingSync.current = true;
      setSyncStatus("Saving cart…");
      void customerApi(
        "/api/customer",
        { action: "cart", items, version: serverVersion.current },
        session.getToken,
      )
        .then((cart) => {
          if (
            currentUser.current !== savingUser ||
            syncEpoch.current !== savingEpoch
          )
            return;
          serverVersion.current = cart.version;
          synced.current = serialized;
          setSyncStatus("Cart saved to your account.");
        })
        .catch((e) => {
          if (
            currentUser.current === savingUser &&
            syncEpoch.current === savingEpoch
          ) {
            setSyncReady(false);
            setSyncStatus(
              e instanceof CustomerApiError && e.status === 409
                ? "Your cart changed on another device. Reload saved cart to resolve the conflict."
                : "Cart could not be saved. Reload saved cart to retry.",
            );
          }
        })
        .finally(() => {
          if (syncEpoch.current === savingEpoch) {
            pendingSync.current = false;
            if (currentUser.current === savingUser) setSaveTick((v) => v + 1);
          }
        });
    }, 600);
    return () => {
      clearTimeout(timer);
    };
  }, [basket, syncReady, session.status, session.userId, saveTick]);
  useEffect(() => {
    const clear = () => {
      setBasket({ ids: [], quantities: {} });
      synced.current = "{}";
      setSyncReady(false);
      setSyncStatus(
        "Store data deleted. Reload saved cart to start a new account cart.",
      );
    };
    window.addEventListener("pantry:store-data-deleted", clear);
    return () => window.removeEventListener("pantry:store-data-deleted", clear);
  }, []);
  const remove = (id: string) => {
    if (syncLoading) return;
    setBasket((current) => {
      const ids = current.ids.filter((item) => item !== id);
      return {
        ids,
        quantities: restoreQuantities(JSON.stringify(current.quantities), ids),
      };
    });
  };
  const toggle = (id: string) => {
    if (syncLoading) return;
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
    if (syncLoading) return;
    if (
      !products.some(
        (p) =>
          p.id === id &&
          p.price !== null &&
          p.availability !== "unavailable" &&
          p.stockQuantity !== 0,
      )
    ) {
      notify(
        "This jar is unavailable. Choose another flavour or ask us for help.",
        "warning",
      );
      return;
    }
    if (!basket.ids.includes(id))
      notify(
        `${products.find((p) => p.id === id)?.name} added to your cart.`,
        "success",
        true,
      );
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
    if (syncLoading) return;
    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_ENQUIRY_QUANTITY ||
      quantity > (products.find((p) => p.id === id)?.stockQuantity ?? 99)
    ) {
      notify(
        "Check the quantity against current availability (maximum 99 jars).",
        "warning",
      );
      return;
    }
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
        remove,
        add,
        setQuantity,
        storageUnavailable,
        syncStatus,
        reloadSaved,
        syncLoading,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
}
export const usePickleSelection = () => useContext(SelectionContext);
