import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
export default function Modal({
  title,
  onClose,
  children,
  drawer = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  drawer?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const background = document.getElementById("root");
    const wasInert = background?.inert;
    if (background) background.inert = true;
    ref.current?.focus();
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]',
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.body.style.overflow = overflow;
      if (background) background.inert = wasInert || false;
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, [onClose]);
  return createPortal(
    <div
      data-lenis-prevent
      className={`modal-backdrop ${drawer ? "drawer-backdrop" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`modal ${drawer ? "drawer" : ""}`}
        initial={
          reduced
            ? false
            : { opacity: 0, x: drawer ? 50 : 0, y: drawer ? 0 : 15 }
        }
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.25 }}
      >
        <div className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>,
    document.body,
  );
}
