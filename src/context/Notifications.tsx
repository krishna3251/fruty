import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";
type Kind = "success" | "error" | "warning" | "info";
type Notice = { id: number; message: string; kind: Kind; cart?: boolean };
type Notify = (message: string, kind?: Kind, cart?: boolean) => void;
const Notifications = createContext<Notify>(() => {});
export const useNotify = () => useContext(Notifications);
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const serial = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setNotices((current) => current.filter((n) => n.id !== id));
  }, []);
  const notify = useCallback<Notify>(
    (message, kind = "info", cart = false) => {
      const id = ++serial.current;
      setNotices((current) =>
        [
          ...current.filter((n) => n.message !== message),
          { id, message, kind, cart },
        ].slice(-2),
      );
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), kind === "error" ? 10000 : 6000),
      );
    },
    [dismiss],
  );
  useEffect(() => {
    const offline = () =>
      notify(
        "You’re offline. Your cart stays here; reconnect before preparing an enquiry.",
        "warning",
      );
    const online = () =>
      notify("You’re back online. You can retry your last action.", "info");
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    return () => {
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
      timers.current.forEach(clearTimeout);
    };
  }, [notify]);
  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: TriangleAlert,
    info: Info,
  };
  return (
    <Notifications.Provider value={notify}>
      {children}
      <div className="pantry-notifications" aria-label="Notifications">
        {notices.map((n) => {
          const Icon = icons[n.kind];
          return (
            <div className={`pantry-toast toast-${n.kind}`} key={n.id}>
              <Icon size={20} aria-hidden="true" />
              <div>
                <p role={n.kind === "error" ? "alert" : "status"}>
                  {n.message}
                </p>
                {n.cart && (
                  <button
                    className="text-link"
                    onClick={() => {
                      window.dispatchEvent(
                        new window.Event("pantry:open-cart"),
                      );
                      dismiss(n.id);
                    }}
                  >
                    View cart ↗
                  </button>
                )}
              </div>
              <button
                className="icon-button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(n.id)}
              >
                <X size={18} />
              </button>
            </div>
          );
        })}
      </div>
    </Notifications.Provider>
  );
}
