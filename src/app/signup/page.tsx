import Nav from "@/components/nav";
import SignupForm from "@/components/signup-form";
import GhostWord from "@/components/ghost-word";

export const metadata = {
  title: "Sign Up — BillSplain",
  description: "Three quick steps. Our agent handles the rest.",
};

export default function SignupPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen flex items-center justify-center bg-surface-muted pt-[72px] px-4 py-12 relative overflow-hidden">
        <GhostWord text="SIGNUP" color="#d97706" opacity={0.04} top="10%" align="left" fitToParent />
        <GhostWord text="START" color="#0d9488" opacity={0.03} top="55%" align="right" fitToParent />

        <div className="relative z-10 bg-surface border border-border rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-[clamp(2rem,5vw,3rem)] w-full max-w-[480px]">
          <h1 className="font-[family-name:var(--font-syne)] text-[1.75rem] font-extrabold mb-1 uppercase tracking-[0.02em] [word-spacing:0.1em]">
            Get Started
          </h1>
          <p className="text-[#44403c] text-[0.95rem] mb-6">
            Three quick steps. Our agent handles the rest.
          </p>
          <SignupForm />
        </div>
      </main>
    </>
  );
}
