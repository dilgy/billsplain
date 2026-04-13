"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

// Free / personal email providers — if the user signs up with one of these,
// we still need to ask for their business URL separately
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com",
  "icloud.com", "mail.com", "protonmail.com", "proton.me", "zoho.com",
  "ymail.com", "live.com", "msn.com", "me.com", "mac.com",
  "comcast.net", "att.net", "verizon.net", "cox.net", "sbcglobal.net",
]);

function extractDomain(email: string): string | null {
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return null;
  return parts[1];
}

function isBusinessEmail(email: string): boolean {
  const domain = extractDomain(email);
  if (!domain) return false;
  return !FREE_EMAIL_DOMAINS.has(domain);
}

function domainToUrl(email: string): string {
  const domain = extractDomain(email);
  if (!domain) return "";
  return `https://${domain}`;
}

type FormData = {
  contact: string;
  url: string;
  zip: string;
  states: string[];
};

// Steps vary based on whether we need to ask for business URL
// If business email → skip URL step (infer from domain)
// If personal email or phone → ask for URL
type StepId = "contact" | "url" | "zip" | "states";

export default function SignupForm() {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailType, setEmailType] = useState<"business" | "personal" | "phone" | null>(null);
  const [data, setData] = useState<FormData>({
    contact: "",
    url: "",
    zip: "",
    states: [],
  });

  // Determine which steps to show based on contact type
  const getSteps = (): StepId[] => {
    if (emailType === "business") {
      // Business email → skip URL step, we'll infer from domain
      return ["contact", "zip", "states"];
    }
    // Personal email or phone → need URL
    return ["contact", "url", "zip", "states"];
  };

  const steps = getSteps();
  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;

  const update = (field: keyof FormData, value: string | string[]) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const detectContactType = useCallback((value: string) => {
    const domain = extractDomain(value);
    // Only classify once domain looks complete (has a dot and at least 2 chars after it)
    if (domain && /\..{2,}$/.test(domain)) {
      if (isBusinessEmail(value)) {
        setEmailType("business");
        update("url", domainToUrl(value));
      } else {
        setEmailType("personal");
      }
    } else if (!value.includes("@") && value.replace(/\D/g, "").length >= 10) {
      setEmailType("phone");
    } else {
      setEmailType(null);
    }
  }, []);

  const handleContactChange = (value: string) => {
    update("contact", value);

    // Debounce detection by 600ms so we don't fire on partial typing
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setEmailType(null); // Clear immediately while typing
    debounceRef.current = setTimeout(() => detectContactType(value), 600);
  };

  const addState = (state: string) => {
    if (state && !data.states.includes(state)) {
      update("states", [...data.states, state]);
    }
  };

  const removeState = (state: string) => {
    update("states", data.states.filter((s) => s !== state));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "contact":
        return data.contact.trim().length > 0 && emailType !== null;
      case "url":
        return data.url.trim().length > 0;
      case "zip":
        return /^\d{5}$/.test(data.zip.trim());
      case "states":
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (!canProceed()) return;
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const goBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      goNext();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: data.contact,
          url: data.url,
          zip: data.zip,
          states: data.states,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Something went wrong");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("billsplain_user_id", result.userId);
      router.push("/building");
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  const isLastStep = currentStepIndex === totalSteps - 1;

  return (
    <div onKeyDown={handleKeyDown}>
      {/* Progress bar */}
      <div className="flex gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-colors ${
              i < currentStepIndex
                ? "bg-teal"
                : i === currentStepIndex
                ? "bg-gold"
                : "bg-[rgba(0,0,0,0.08)]"
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-[160px]">
        {currentStep === "contact" && (
          <div>
            <label className="block text-[0.875rem] font-semibold text-foreground mb-2">
              Email or phone number
            </label>
            <input
              type="text"
              value={data.contact}
              onChange={(e) => handleContactChange(e.target.value)}
              placeholder="you@company.com or (555) 123-4567"
              className="w-full px-4 py-3 border-2 border-border rounded-lg text-base font-[family-name:var(--font-space-grotesk)] outline-none focus:border-gold transition-colors bg-surface"
              autoFocus
            />
            <p className="text-[0.8rem] text-[#a8a29e] mt-2">
              We&apos;ll send alerts here. You can add more channels later.
            </p>
            {/* Smart detection feedback */}
            {emailType === "business" && (
              <p className="text-[0.8rem] text-teal mt-2 font-medium">
                Business email detected — we&apos;ll scan {extractDomain(data.contact)} to understand your business.
              </p>
            )}
            {emailType === "personal" && (
              <p className="text-[0.8rem] text-gold mt-2 font-medium">
                Personal email detected — we&apos;ll ask for your business website next.
              </p>
            )}
          </div>
        )}

        {currentStep === "url" && (
          <div>
            <label className="block text-[0.875rem] font-semibold text-foreground mb-2">
              Your business website
            </label>
            <input
              type="url"
              value={data.url}
              onChange={(e) => update("url", e.target.value)}
              placeholder="https://yourcompany.com"
              className="w-full px-4 py-3 border-2 border-border rounded-lg text-base font-[family-name:var(--font-space-grotesk)] outline-none focus:border-gold transition-colors bg-surface"
              autoFocus
            />
            <p className="text-[0.8rem] text-[#a8a29e] mt-2">
              We&apos;ll scan your site to understand your business, industry, and regulatory exposure.
            </p>
          </div>
        )}

        {currentStep === "zip" && (
          <div>
            <label className="block text-[0.875rem] font-semibold text-foreground mb-2">
              Your zip code
            </label>
            <input
              type="text"
              value={data.zip}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 5);
                update("zip", v);
              }}
              placeholder="75201"
              maxLength={5}
              className="w-full px-4 py-3 border-2 border-border rounded-lg text-base font-[family-name:var(--font-space-grotesk)] outline-none focus:border-gold transition-colors bg-surface"
              autoFocus
            />
            <p className="text-[0.8rem] text-[#a8a29e] mt-2">
              This determines your elected representatives — the people voting on bills that affect you.
            </p>
          </div>
        )}

        {currentStep === "states" && (
          <div>
            <label className="block text-[0.875rem] font-semibold text-foreground mb-2">
              Additional states of operation{" "}
              <span className="font-normal text-[#a8a29e]">(optional)</span>
            </label>
            <select
              onChange={(e) => {
                addState(e.target.value);
                e.target.value = "";
              }}
              className="w-full px-4 py-3 border-2 border-border rounded-lg text-base font-[family-name:var(--font-space-grotesk)] outline-none focus:border-gold transition-colors bg-surface"
              defaultValue=""
            >
              <option value="" disabled>
                Select a state to add...
              </option>
              {US_STATES.filter((s) => !data.states.includes(s)).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="text-[0.8rem] text-[#a8a29e] mt-2">
              Your home state is detected from your zip code. Add any other states where your business operates — we&apos;ll monitor legislation there too.
            </p>

            {data.states.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {data.states.map((s) => (
                  <button
                    key={s}
                    onClick={() => removeState(s)}
                    className="inline-flex items-center gap-1.5 bg-gold-pale text-gold px-3 py-1.5 rounded-full text-[0.8rem] font-semibold border-none cursor-pointer hover:bg-gold hover:text-white transition-colors"
                  >
                    {s} <span className="text-[1rem] leading-none opacity-60">&times;</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-pale text-red text-[0.875rem] font-medium">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        {currentStepIndex > 0 ? (
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 px-4 py-2 text-[0.875rem] font-medium text-[#78716c] bg-transparent border-none cursor-pointer hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
        ) : (
          <div />
        )}

        {!isLastStep ? (
          <button
            onClick={goNext}
            disabled={!canProceed()}
            className="inline-flex items-center gap-2 bg-gold text-white px-6 py-3 rounded-lg font-bold text-[0.9rem] uppercase tracking-[0.04em] border-none cursor-pointer hover:bg-gold-light transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-gold text-white px-8 py-3.5 rounded-lg font-bold text-[0.95rem] uppercase tracking-[0.04em] border-none cursor-pointer hover:bg-gold-light transition-all disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Building...
              </>
            ) : (
              "Build My Profile"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
