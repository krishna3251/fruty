import { useCallback, useState } from "react";
import { ZoomIn, ZoomOut, X } from "lucide-react";
import type { PickleProduct } from "../data/pickles";
import { FruitImage } from "./Resilience";
import Modal from "./Modal";
export default function ProductGallery({
  product: p,
  compact = false,
}: {
  product: PickleProduct;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const close = useCallback(() => {
    setOpen(false);
    setZoom(false);
  }, []);
  return (
    <>
      <button
        className={`product-photo-open ${compact ? "is-compact" : ""}`}
        onClick={() => setOpen(true)}
        aria-label={`Enlarge ${p.name} photo`}
      >
        <FruitImage
          src={p.image}
          alt={p.imageAlt}
          width={1200}
          height={800}
          loading={compact ? "lazy" : undefined}
          fetchPriority={compact ? undefined : "high"}
        />
        <span>
          <ZoomIn size={17} />
          {compact ? "Quick look" : "Tap to take a closer look"}
        </span>
      </button>
      {open && (
        <Modal title={`${p.name} · A closer look`} onClose={close}>
          <div className={`product-photo-viewer ${zoom ? "is-zoomed" : ""}`}>
            <img src={p.image} alt={p.imageAlt} width={1200} height={800} />
          </div>
          <div className="product-photo-tools">
            <button onClick={() => setZoom((v) => !v)} aria-pressed={zoom}>
              {zoom ? <ZoomOut size={18} /> : <ZoomIn size={18} />}{" "}
              {zoom ? "Fit photo" : "Zoom in"}
            </button>
            <button onClick={close}>
              <X size={17} />
              Back to shopping
            </button>
          </div>
          <p className="product-photo-caption">
            Owner-supplied product photo. Read the product details and confirm
            ingredients and jar size before ordering.
          </p>
        </Modal>
      )}
    </>
  );
}
