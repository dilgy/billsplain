import Link from "next/link";

export default function Footer() {
  return (
    <footer className="text-center py-10 px-8 border-t border-border bg-surface-alt text-[0.8rem] text-[#a8a29e]">
      <div className="font-[family-name:var(--font-syne)] font-extrabold text-lg text-foreground mb-1">
        BILL<span className="text-gold">SPLAIN</span>
      </div>
      <p>Legislation intelligence for your business.</p>
      <div className="flex justify-center gap-6 mt-4 text-[0.75rem]">
        <Link href="/pricing" className="no-underline text-[#a8a29e] hover:text-foreground transition-colors">
          Pricing
        </Link>
        <Link href="/signup" className="no-underline text-[#a8a29e] hover:text-foreground transition-colors">
          Get Started
        </Link>
      </div>
      <p className="mt-4 text-[0.7rem]">&copy; 2026 BillSplain. All rights reserved.</p>
    </footer>
  );
}
