import Link from "next/link";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import GhostWord from "@/components/ghost-word";
import { Check, Minus } from "lucide-react";

export const metadata = {
  title: "Pricing — BillSplain",
  description: "Simple, transparent pricing. Start free. Upgrade when legislation gets real.",
};

const TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "",
    desc: "See what's happening in your state",
    cta: "Get Started Free",
    ctaStyle: "border-2 border-border text-foreground hover:border-gold hover:text-gold",
    featured: false,
    features: [
      { text: "1 state monitored", included: true },
      { text: "5 impact analyses / month (generic)", included: true },
      { text: "Weekly email digest", included: true },
      { text: "Basic business profile", included: true },
      { text: "Real-time alerts", included: false },
      { text: "SMS notifications", included: false },
      { text: "Personalized impact analysis", included: false },
      { text: "Click-to-call + talking points", included: false },
      { text: "Physical letter sending", included: false },
      { text: "Profile edits after signup", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    desc: "Full intelligence for your business",
    cta: "Start Free Trial",
    ctaStyle: "bg-gold text-white hover:bg-gold-light",
    featured: true,
    features: [
      { text: "10 states monitored", included: true },
      { text: "50 personalized analyses / month", included: true },
      { text: "Real-time email alerts", included: true },
      { text: "SMS alerts (200 / month)", included: true },
      { text: 'Personalized "How This Affects You"', included: true },
      { text: "Click-to-call with talking points", included: true },
      { text: "Physical letters (~$3-5 each, add-on)", included: true },
      { text: "Unlimited profile edits", included: true },
      { text: "4 full profile rebuilds / month", included: true },
      { text: "Vote tracking for your reps", included: true },
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For multi-location teams",
    cta: "Contact Sales",
    ctaStyle: "border-2 border-border text-foreground hover:border-gold hover:text-gold",
    featured: false,
    features: [
      { text: "Unlimited states & analyses", included: true },
      { text: "Multi-location business profiles", included: true },
      { text: "Team coordination & shared monitoring", included: true },
      { text: "Volume letter pricing", included: true },
      { text: "API / MCP access", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Custom integrations", included: true },
      { text: "Priority support", included: true },
      { text: "SSO / SAML", included: true },
      { text: "SLA guarantees", included: true },
    ],
  },
];

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main className="pt-[72px]">
        <section className="relative py-[clamp(4rem,10vh,6rem)] px-[clamp(1.5rem,5vw,4rem)] min-h-screen overflow-hidden">
          <GhostWord text="PRICING" color="#d97706" opacity={0.04} top="5%" align="left" fitToParent />

          <div className="relative z-5 max-w-[1100px] mx-auto">
            <div className="text-center mb-12">
              <h1 className="font-[family-name:var(--font-syne)] text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold uppercase tracking-[0.02em] [word-spacing:0.1em] mb-2">
                Simple, Transparent Pricing
              </h1>
              <p className="text-[#44403c] text-[clamp(0.9rem,1.3vw,1.05rem)]">
                Start free. Upgrade when legislation gets real.
              </p>
            </div>

            {/* Pricing cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className={`bg-surface rounded-2xl p-8 text-center relative transition-all ${
                    tier.featured
                      ? "border-2 border-gold shadow-[0_8px_30px_rgba(180,83,9,0.1)] scale-[1.02]"
                      : "border border-border"
                  }`}
                >
                  {tier.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white text-[0.7rem] font-bold uppercase tracking-[0.08em] px-4 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                  <div className="text-[2.5rem] font-extrabold mb-0.5">
                    {tier.price}
                    {tier.period && (
                      <span className="text-base font-normal text-[#a8a29e]">{tier.period}</span>
                    )}
                  </div>
                  <p className="text-[0.875rem] text-[#78716c] mb-6">{tier.desc}</p>

                  <ul className="text-left space-y-2.5 mb-8">
                    {tier.features.map((f) => (
                      <li
                        key={f.text}
                        className={`flex items-start gap-2.5 text-[0.875rem] ${
                          f.included ? "text-[#44403c]" : "text-[#d6d3d1]"
                        }`}
                      >
                        {f.included ? (
                          <Check size={16} className="text-teal shrink-0 mt-0.5" />
                        ) : (
                          <Minus size={16} className="text-[#d6d3d1] shrink-0 mt-0.5" />
                        )}
                        {f.text}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signup"
                    className={`block w-full py-3 rounded-lg font-bold text-[0.9rem] uppercase tracking-[0.04em] no-underline text-center transition-all ${tier.ctaStyle}`}
                  >
                    {tier.cta}
                  </Link>
                </div>
              ))}
            </div>

            {/* Letter callout */}
            <div className="max-w-[640px] mx-auto mt-12 bg-surface border border-border rounded-2xl p-8 text-center">
              <h3 className="text-lg font-bold mb-2">About Letter Sending</h3>
              <p className="text-[0.925rem] text-[#44403c] leading-relaxed">
                Every letter is <strong>uniquely written for your business</strong> — not a form
                letter, not a mass campaign. Our agent drafts it based on your profile and the
                specific bill. You review it, and we handle the physical mailing. Letters are
                ~$3-5 each (covers printing, postage, and AI generation).
              </p>
              <p className="text-[0.825rem] text-[#a8a29e] mt-3 italic">
                &ldquo;Sent with the help of BillSplain&rdquo;
              </p>
            </div>

            {/* FAQ */}
            <div className="max-w-[640px] mx-auto mt-12">
              <h3 className="text-center text-xl font-bold mb-6">Common Questions</h3>
              {[
                {
                  q: "How do you know what legislation matters to my business?",
                  a: "We scan your entire website to understand your industry, services, and business model. Combined with your zip code and operating states, our agent builds a complete intelligence profile.",
                },
                {
                  q: 'What counts as an "impact analysis"?',
                  a: "Each time we analyze a specific bill against your business profile to generate personalized pros, cons, and impact level — that's one analysis.",
                },
                {
                  q: "Can I change my profile after signup?",
                  a: "Free accounts get one initial profile build. Pro accounts can edit anytime and request up to 4 full profile rebuilds per month.",
                },
                {
                  q: "Are the letters really unique?",
                  a: "Yes. Every letter references your actual operations, the specific bill, and how it impacts you. We never send identical letters.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="bg-surface border border-border rounded-xl p-6 mb-3">
                  <h4 className="font-bold mb-1">{q}</h4>
                  <p className="text-[0.9rem] text-[#44403c] leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
