import BuildingAnimation from "@/components/building-animation";

export const metadata = {
  title: "Building Your Profile — BillSplain",
};

export default function BuildingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-muted text-foreground relative overflow-hidden">
      <div className="relative z-10 text-center max-w-[500px] px-8">
        <h1 className="font-[family-name:var(--font-syne)] text-[1.75rem] font-extrabold mb-2 uppercase tracking-[0.02em] [word-spacing:0.1em]">
          BillSplaining your business
        </h1>
        <p className="text-[#44403c] mb-10">
          Hang tight — our agent is analyzing your business.
        </p>
        <BuildingAnimation />
      </div>
    </main>
  );
}
