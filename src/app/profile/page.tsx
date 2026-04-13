import Nav from "@/components/nav";
import Footer from "@/components/footer";
import GhostWord from "@/components/ghost-word";
import ProfileView from "@/components/profile-view";

export const metadata = {
  title: "Your Profile — BillSplain",
};

export default function ProfilePage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-surface-muted pt-[72px]">
        <section className="relative py-12 px-[clamp(1.5rem,5vw,4rem)] overflow-hidden">
          <GhostWord text="PROFILE" color="#d97706" opacity={0.04} top="5%" align="right" fitToParent />

          <div className="relative z-5 max-w-[900px] mx-auto">
            <div className="text-center mb-8">
              <h1 className="font-[family-name:var(--font-syne)] text-[1.75rem] font-extrabold uppercase tracking-[0.02em] [word-spacing:0.1em]">
                Your Business Intelligence Profile
              </h1>
              <p className="text-[#44403c] mt-1">
                Review what our agent found. Edit anything that&apos;s wrong.
              </p>
            </div>

            <ProfileView />

            {/* CTA */}
            <div className="text-center mt-8 p-8 bg-surface border-2 border-gold rounded-2xl">
              <h2 className="font-[family-name:var(--font-syne)] text-xl font-extrabold mb-1 uppercase tracking-[0.02em]">
                Looks good?
              </h2>
              <p className="text-[#44403c] mb-4">
                You can always edit your profile later. We&apos;ll start monitoring immediately.
              </p>
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-gold text-white px-10 py-4 rounded-lg font-bold text-base uppercase tracking-[0.06em] no-underline hover:bg-gold-light transition-all"
              >
                Start Monitoring
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
