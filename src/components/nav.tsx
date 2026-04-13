"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-100 h-[72px] flex items-center justify-between px-[clamp(1.5rem,5vw,4rem)] bg-[rgba(247,245,239,0.95)] backdrop-blur-2xl border-b border-border">
      <Link
        href="/"
        className="font-[family-name:var(--font-syne)] text-[clamp(1.2rem,2vw,1.5rem)] font-extrabold uppercase tracking-[0.04em] no-underline text-foreground"
      >
        BILL<span className="text-gold">SPLAIN</span>
      </Link>

      {/* Mobile toggle */}
      <button
        className="md:hidden bg-transparent border-none text-foreground cursor-pointer"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Links */}
      <ul
        className={`list-none flex gap-6 items-center
          max-md:absolute max-md:top-[72px] max-md:left-0 max-md:right-0
          max-md:flex-col max-md:bg-[rgba(247,245,239,0.97)] max-md:p-6 max-md:gap-4
          max-md:border-b max-md:border-border
          ${open ? "max-md:flex" : "max-md:hidden"}`}
      >
        <li>
          <Link
            href="/#how"
            className="text-[0.8rem] font-medium tracking-[0.06em] uppercase no-underline text-[#78716c] hover:text-foreground transition-colors"
          >
            How It Works
          </Link>
        </li>
        <li>
          <Link
            href="/#features"
            className="text-[0.8rem] font-medium tracking-[0.06em] uppercase no-underline text-[#78716c] hover:text-foreground transition-colors"
          >
            Features
          </Link>
        </li>
        <li>
          <Link
            href="/#preview"
            className="text-[0.8rem] font-medium tracking-[0.06em] uppercase no-underline text-[#78716c] hover:text-foreground transition-colors"
          >
            Preview
          </Link>
        </li>
        <li>
          <Link
            href="/pricing"
            className="text-[0.8rem] font-medium tracking-[0.06em] uppercase no-underline text-[#78716c] hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
        </li>
        <li>
          <Link
            href="/signup"
            className="bg-gold text-white px-5 py-2 rounded-[4px] font-bold text-[0.8rem] uppercase tracking-[0.05em] no-underline hover:bg-gold-light transition-colors"
          >
            Get Started
          </Link>
        </li>
      </ul>
    </nav>
  );
}
