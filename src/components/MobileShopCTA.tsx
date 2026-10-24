import { useEffect, useState } from "react";
export default function MobileShopCTA({
  path,
  blocked,
}: {
  path: string;
  blocked: boolean;
}) {
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const focus = () =>
      setEditing(
        !!document.activeElement?.closest("form,input,textarea,select"),
      );
    document.addEventListener("focusin", focus);
    document.addEventListener("focusout", focus);
    return () => {
      document.removeEventListener("focusin", focus);
      document.removeEventListener("focusout", focus);
    };
  }, []);
  useEffect(() => {
    setShow(false);
    if (path !== "/" || blocked || typeof IntersectionObserver === "undefined")
      return;
    const target = document.querySelector(
      ".cinema-intro .button, .pickle-hero .button, .hero-copy .button",
    );
    const shop =
      document.getElementById("pickle-grid") || document.getElementById("shop");
    if (!target || !shop) return;
    let heroVisible = true,
      shopVisible = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target === target) heroVisible = e.isIntersecting;
          if (e.target === shop) shopVisible = e.isIntersecting;
        }
        setShow(!heroVisible && !shopVisible);
      },
      { threshold: 0 },
    );
    observer.observe(target);
    observer.observe(shop);
    return () => observer.disconnect();
  }, [path, blocked]);
  return show && !blocked && !editing ? (
    <a href="/shop" className="mobile-shop-cta">
      Explore pickles <span aria-hidden="true">↗</span>
    </a>
  ) : null;
}
