import {
  Component,
  useEffect,
  useState,
  type ReactNode,
  type ImgHTMLAttributes,
} from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  RefreshCw,
  WifiOff,
  Leaf,
} from "lucide-react";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="recovery-page">
        <a href="/" className="logo">
          furity<span>✳</span>
        </a>
        <div className="recovery-symbol">
          <Leaf size={70} />
        </div>
        <span className="eyebrow">A SMALL BUMP IN THE HARVEST</span>
        <h1>
          Let’s try a<br />
          <em>fresh start.</em>
        </h1>
        <p>
          Something didn’t load correctly. Your saved lists are still on this
          device.
        </p>
        <button
          className="button primary"
          onClick={() => window.location.reload()}
        >
          Reload the store <RefreshCw size={18} />
        </button>
        <a href="/" className="text-link">
          Back to home <ArrowLeft size={16} />
        </a>
      </div>
    ) : (
      this.props.children
    );
  }
}
export function FruitImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [props.src]);
  return failed ? (
    <span
      className={`image-fallback ${props.className || ""}`}
      role="img"
      aria-hidden={props.alt === ""}
      aria-label={props.alt || "Fruit image unavailable"}
    >
      <Leaf size={34} />
      <small>Fresh image on its way</small>
    </span>
  ) : (
    <img
      {...props}
      data-loading={!loaded}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      decoding="async"
    />
  );
}
export function OfflineNotice() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return !online ? (
    <div className="offline-notice" role="status">
      <WifiOff size={16} />
      <span>
        You’re offline. Loaded products and your saved lists still work.
      </span>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  ) : null;
}
export function NotFound() {
  return (
    <div className="recovery-page not-found">
      <a href="/" className="logo">
        furity<span>✳</span>
      </a>
      <div className="lost-fruit">
        <span>4</span>
        <img src="/images/orange.webp" alt="" width="200" height="200" />
        <span>4</span>
      </div>
      <span className="eyebrow">THIS ONE FELL OFF THE TREE</span>
      <h1>
        A little lost.
        <br />
        <em>Still in good company.</em>
      </h1>
      <p>
        We couldn’t find that page. There’s plenty of goodness waiting back at
        the shop.
      </p>
      <a className="button primary" href="/shop">
        Back to fresh picks <ArrowUpRight size={18} />
      </a>
      <a className="text-link" href="/">
        Take me home <ArrowLeft size={16} />
      </a>
    </div>
  );
}
