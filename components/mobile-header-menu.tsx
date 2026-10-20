"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileHeaderMenu({ signedIn, isAdmin }: { signedIn: boolean; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="mobile-menu-toggle"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="mobile-site-navigation"
        onClick={() => setOpen(value => !value)}
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {open ? <path d="M5 5L19 19M19 5L5 19" /> : <path d="M4 6H20M4 12H20M4 18H20" />}
        </svg>
        <span className="mobile-menu-text">{open ? "CLOSE" : "MENU"}</span>
      </button>
      <nav id="mobile-site-navigation" className={open ? "mobile-site-nav is-open" : "mobile-site-nav"} aria-label="Mobile navigation">
        <Link href="/shop?category=Men#shop" onClick={() => setOpen(false)}>MEN</Link>
        <Link href="/shop?category=Women#shop" onClick={() => setOpen(false)}>WOMEN</Link>
        <Link href="/shop?category=Kids#shop" onClick={() => setOpen(false)}>KIDS</Link>
        <Link href="/shop" onClick={() => setOpen(false)}>SHOP ALL</Link>
        <Link href={signedIn ? "/account" : "/login"} onClick={() => setOpen(false)}>{signedIn ? "MY PROFILE" : "LOGIN"}</Link>
        {isAdmin && <Link href="/admin" onClick={() => setOpen(false)}>ADMIN</Link>}
      </nav>
    </>
  );
}
