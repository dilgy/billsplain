import Link from "next/link";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import GhostWord from "@/components/ghost-word";
import {
  Zap,
  Mail,
  Globe,
  ScanSearch,
  BellRing,
  Send,
  PhoneCall,
  Vote,
  Eye,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  return (
    <>
      <Nav />

      {/* ============================================
          HERO
          ============================================ */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-[72px] px-[clamp(1.5rem,5vw,4rem)]">
        {/* Ghost words */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <GhostWord text="BILLS" color="#d97706" opacity={0.07} top="5%" align="left" fontSize="16vw" />
          <GhostWord text="VOTES" color="#0d9488" opacity={0.055} top="22%" align="right" fontSize="16vw" />
          <GhostWord text="IMPACT" color="#991b1b" opacity={0.045} top="39%" align="left" fontSize="16vw" />
          <GhostWord text="ACTION" color="#7c3aed" opacity={0.055} top="56%" align="right" fontSize="16vw" />
          <GhostWord text="MONITOR" color="#d97706" opacity={0.04} top="73%" align="left" fontSize="16vw" />
        </div>

        {/* Horizontal rules */}
        <div className="absolute left-0 right-0 top-[19%] h-px bg-gradient-to-r from-[rgba(217,119,6,0.15)] to-transparent pointer-events-none" />
        <div className="absolute left-0 right-0 top-[40%] h-px bg-gradient-to-r from-transparent via-[rgba(13,148,136,0.12)] to-transparent pointer-events-none" />
        <div className="absolute left-0 right-0 top-[60%] h-px bg-gradient-to-r from-transparent via-transparent to-[rgba(153,27,27,0.1)] pointer-events-none" />
        <div className="absolute left-0 right-0 top-[78%] h-px bg-gradient-to-r from-[rgba(124,58,237,0.1)] to-transparent pointer-events-none" />

        {/* Left accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gold opacity-40 z-5" />

        {/* Content */}
        <div className="relative z-10 max-w-[1200px] mx-auto w-full grid grid-cols-1 md:grid-cols-[1fr_minmax(0,420px)] gap-[clamp(3rem,8vw,6rem)] items-center py-[clamp(7rem,14vh,10rem)]">
          {/* Left — headline */}
          <div>
            <div className="font-[family-name:var(--font-dm-mono)] text-[clamp(0.6rem,1vw,0.72rem)] tracking-[0.2em] uppercase text-gold mb-6 flex items-center gap-3">
              <span className="w-[30px] h-[2px] bg-gold inline-block" />
              Legislation Intelligence
            </div>
            <h1 className="font-[family-name:var(--font-syne)] text-[clamp(2.25rem,4.5vw,4rem)] font-extrabold leading-[1.2] uppercase tracking-[0.03em] [word-spacing:0.15em] mb-6">
              DON&apos;T READ BILLS.<br />LET US{" "}
              <span className="text-gold">BILLSPLAIN.</span>
            </h1>
            <p className="text-[clamp(0.95rem,1.4vw,1.1rem)] text-[#44403c] leading-relaxed mb-10 max-w-[440px]">
              Monitored across 50 states. Analyzed against your business. Explained in plain English. Delivered before it becomes law.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-gold text-white px-8 py-3.5 rounded-md font-bold text-[0.9rem] uppercase tracking-[0.06em] no-underline hover:bg-gold-light hover:-translate-y-0.5 hover:shadow-lg transition-all"
              >
                <Zap size={18} /> Start Monitoring
              </Link>
              <Link
                href="/#preview"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md font-semibold text-[0.9rem] no-underline text-[#44403c] border-[1.5px] border-[rgba(0,0,0,0.12)] hover:border-foreground hover:text-foreground transition-all"
              >
                <Mail size={18} /> See Alerts
              </Link>
            </div>
          </div>

          {/* Right — stat cards */}
          <div className="flex flex-col gap-4">
            {[
              { icon: Globe, color: "bg-[rgba(180,83,9,0.08)] text-gold", title: "50 States Monitored", desc: "Federal + state legislation, every jurisdiction where you operate." },
              { icon: ScanSearch, color: "bg-[rgba(15,118,110,0.08)] text-teal", title: "Personalized Analysis", desc: "Pros, cons, and impact level — specific to your business operations." },
              { icon: BellRing, color: "bg-[rgba(185,28,28,0.08)] text-red", title: "Real-Time Alerts", desc: "Email and SMS the moment a bill moves. No more finding out after the fact." },
              { icon: Send, color: "bg-[rgba(109,40,217,0.08)] text-purple", title: "Contact Your Reps", desc: "Click-to-call with talking points. Physical letters drafted and mailed." },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div
                key={title}
                className="bg-surface border border-border rounded-xl px-7 py-6 flex items-center gap-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-[rgba(180,83,9,0.2)] hover:bg-[rgba(180,83,9,0.03)] hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <h4 className="text-[0.95rem] font-bold mb-0.5">{title}</h4>
                  <p className="text-[0.8rem] text-[#44403c] leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-[rgba(180,83,9,0.15)] via-[rgba(0,0,0,0.04)] to-[rgba(15,118,110,0.1)]" />

      {/* ============================================
          HOW IT WORKS
          ============================================ */}
      <section className="relative py-[clamp(5rem,12vh,8rem)] px-[clamp(1.5rem,5vw,4rem)] bg-surface-alt overflow-hidden" id="how">
        <GhostWord text="SETUP" color="#d97706" opacity={0.06} top="15%" align="right" fitToParent />

        <div className="relative z-5 max-w-[1100px] mx-auto">
          <div className="mb-[clamp(2.5rem,6vh,4rem)]">
            <div className="font-[family-name:var(--font-dm-mono)] text-[0.65rem] tracking-[0.2em] uppercase text-gold mb-3 flex items-center gap-3">
              <span className="w-6 h-[2px] bg-gold inline-block" />
              How It Works
            </div>
            <h2 className="font-[family-name:var(--font-outfit)] text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold mb-2">
              Three inputs. Full intelligence.
            </h2>
            <p className="text-[#44403c] text-[clamp(0.9rem,1.3vw,1.05rem)] max-w-[550px] leading-relaxed">
              No questionnaire. No lengthy setup. Our agent scans your business and builds your profile in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: "01", title: "Your website URL", desc: "We scan your entire site to understand your industry, services, and regulatory exposure." },
              { num: "02", title: "Your zip code", desc: "We find your elected reps — federal and state — the people voting on bills that affect you." },
              { num: "03", title: "Review your profile", desc: "We build a full intelligence profile. You validate it, and monitoring starts immediately." },
            ].map(({ num, title, desc }) => (
              <div
                key={num}
                className="p-8 border-l-2 border-[rgba(0,0,0,0.06)] hover:border-gold transition-colors"
              >
                <div className="font-[family-name:var(--font-syne)] text-[2.5rem] font-extrabold text-gold opacity-35 mb-3">
                  {num}
                </div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-[0.9rem] text-[#44403c] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-gradient-to-r from-[rgba(180,83,9,0.15)] via-[rgba(0,0,0,0.04)] to-[rgba(15,118,110,0.1)]" />

      {/* ============================================
          FEATURES
          ============================================ */}
      <section className="relative py-[clamp(5rem,12vh,8rem)] px-[clamp(1.5rem,5vw,4rem)] overflow-hidden" id="features">
        <GhostWord text="FEATURES" color="#0d9488" opacity={0.06} top="5%" align="left" fitToParent />

        <div className="relative z-5 max-w-[1100px] mx-auto">
          <div className="mb-[clamp(2.5rem,6vh,4rem)]">
            <div className="font-[family-name:var(--font-dm-mono)] text-[0.65rem] tracking-[0.2em] uppercase text-gold mb-3 flex items-center gap-3">
              <span className="w-6 h-[2px] bg-gold inline-block" />
              What You Get
            </div>
            <h2 className="font-[family-name:var(--font-outfit)] text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold mb-2">
              Built for business owners, not lobbyists
            </h2>
            <p className="text-[#44403c] text-[clamp(0.9rem,1.3vw,1.05rem)] max-w-[550px] leading-relaxed">
              Stop finding out about regulations after they pass.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { icon: ScanSearch, color: "bg-[rgba(180,83,9,0.08)] text-gold", title: "Personalized Impact Analysis", desc: "Every bill alert includes plain-English pros, cons, and impact level — specific to your business." },
              { icon: Vote, color: "bg-[rgba(15,118,110,0.08)] text-teal", title: "Rep Voting Tracker", desc: "Know how your representatives voted on bills that matter to you. Committee activity and sponsorships." },
              { icon: PhoneCall, color: "bg-[rgba(185,28,28,0.08)] text-red", title: "Click-to-Call + Talking Points", desc: "One tap to your rep's office with an AI-generated talking point tailored to your business." },
              { icon: Mail, color: "bg-[rgba(109,40,217,0.08)] text-purple", title: "Physical Letter Sending", desc: "Unique letters drafted for your business. Not form letters. We print, stamp, and mail it." },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div
                key={title}
                className="bg-surface border border-border rounded-2xl p-8 flex gap-5 items-start shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-[rgba(180,83,9,0.2)] hover:-translate-y-0.5 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="text-[1.05rem] font-bold mb-1">{title}</h3>
                  <p className="text-[0.875rem] text-[#44403c] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-gradient-to-r from-[rgba(180,83,9,0.15)] via-[rgba(0,0,0,0.04)] to-[rgba(15,118,110,0.1)]" />

      {/* ============================================
          NOTIFICATION PREVIEW
          ============================================ */}
      <section className="relative py-[clamp(5rem,12vh,8rem)] px-[clamp(1.5rem,5vw,4rem)] bg-surface-alt overflow-hidden" id="preview">
        <GhostWord text="ALERTS" color="#991b1b" opacity={0.06} top="5%" align="right" fitToParent />

        <div className="relative z-5 max-w-[1100px] mx-auto">
          <div className="mb-[clamp(2.5rem,6vh,4rem)]">
            <div className="font-[family-name:var(--font-dm-mono)] text-[0.65rem] tracking-[0.2em] uppercase text-gold mb-3 flex items-center gap-3">
              <span className="w-6 h-[2px] bg-gold inline-block" />
              What You&apos;ll Receive
            </div>
            <h2 className="font-[family-name:var(--font-outfit)] text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold mb-2">
              Intelligence, not information overload
            </h2>
            <p className="text-[#44403c] text-[clamp(0.9rem,1.3vw,1.05rem)] max-w-[550px] leading-relaxed">
              Our agent reads every bill so you don&apos;t have to.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="font-[family-name:var(--font-outfit)] text-[clamp(1.25rem,2.5vw,1.75rem)] font-extrabold mb-3">
                Every alert is personalized to your business
              </h3>
              <p className="text-[#44403c] leading-relaxed mb-6">
                We analyze each bill against your specific operations. You get a clear verdict: how it helps, how it hurts, and what you can do about it. No jargon, no walls of legal text.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md font-bold text-[0.85rem] no-underline text-gold border-2 border-gold uppercase tracking-[0.06em] hover:bg-gold hover:text-white transition-all"
              >
                <Eye size={18} /> See All Alert Types
              </Link>
            </div>

            {/* Email mock */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-3 bg-[#fafaf9] border-b border-border text-[0.72rem] text-[#44403c]">
                <strong className="text-[#44403c]">From:</strong> BillSplain &lt;alerts@billsplain.com&gt;<br />
                <strong className="text-[#44403c]">Subject:</strong> HIGH Impact: Commercial Vehicle Safety Act
              </div>
              <div className="p-6">
                <div className="flex gap-2 mb-3">
                  <span className="inline-block px-2.5 py-0.5 rounded bg-red-pale text-red text-[0.6rem] font-bold uppercase tracking-wide">HIGH IMPACT</span>
                  <span className="inline-block px-2.5 py-0.5 rounded bg-gold-pale text-gold text-[0.6rem] font-bold uppercase tracking-wide">FEDERAL</span>
                </div>
                <h4 className="text-base font-bold mb-2">HR-4521: Commercial Vehicle Safety Act</h4>
                <p className="text-[0.82rem] text-[#44403c] leading-relaxed">
                  New ELD standards, updated hours-of-service rules, $2.1B fleet electrification grants.
                </p>
                <div className="rounded-lg p-4 mt-3 bg-[rgba(15,118,110,0.05)] border-l-[3px] border-teal">
                  <h5 className="text-[0.75rem] font-bold text-teal mb-1">Potential Benefits</h5>
                  <ul className="pl-5 list-disc text-[0.78rem] text-[#44403c] space-y-0.5">
                    <li>Grants could offset 30-40% electrification costs</li>
                    <li>HOS adds 2hr flexibility for short-haul</li>
                  </ul>
                </div>
                <div className="rounded-lg p-4 mt-2 bg-[rgba(185,28,28,0.04)] border-l-[3px] border-red">
                  <h5 className="text-[0.75rem] font-bold text-red mb-1">Potential Risks</h5>
                  <ul className="pl-5 list-disc text-[0.78rem] text-[#44403c] space-y-0.5">
                    <li>Speed limiters increase delivery times 8-12%</li>
                    <li>ELD hardware upgrade ~$1,200/vehicle</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          CTA
          ============================================ */}
      <section className="relative text-center py-[clamp(5rem,12vh,8rem)] px-[clamp(1.5rem,5vw,4rem)] overflow-hidden">
        <GhostWord text="START" color="#d97706" opacity={0.05} top="20%" align="left" fitToParent />

        <div className="relative z-5">
          <h2 className="font-[family-name:var(--font-outfit)] text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold mb-3">
            Your business has a voice in <span className="text-gold">government</span>
          </h2>
          <p className="text-[#44403c] mb-8 text-[clamp(0.9rem,1.3vw,1.05rem)]">
            Start free. Upgrade when legislation gets real.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-gold text-white px-10 py-4 rounded-md font-bold text-base uppercase tracking-[0.06em] no-underline hover:bg-gold-light hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            <ShieldCheck size={20} /> Start Monitoring Free
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
