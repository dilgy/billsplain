"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Building2,
  Users,
  Landmark,
  FileSearch,
  Sparkles,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";

const STEPS = [
  { icon: Globe, label: "Scanning your website..." },
  { icon: Building2, label: "Identifying your industry & services..." },
  { icon: Users, label: "Finding your elected representatives..." },
  { icon: Landmark, label: "Mapping relevant committees & agencies..." },
  { icon: FileSearch, label: "Analyzing active legislation..." },
  { icon: Sparkles, label: "Generating your intelligence profile..." },
];

export default function BuildingAnimation() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [agentDone, setAgentDone] = useState(false);
  const animationDone = useRef(false);
  const agentStarted = useRef(false);

  // Start the agent call
  useEffect(() => {
    if (agentStarted.current) return;
    agentStarted.current = true;

    const userId = sessionStorage.getItem("billsplain_user_id");
    if (!userId) {
      setError("No user session found. Please sign up again.");
      return;
    }

    fetch("/api/build-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Agent failed");
        }
        setAgentDone(true);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  // Step animation — runs independently of agent
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= STEPS.length) {
          clearInterval(interval);
          animationDone.current = true;
          return prev;
        }
        return prev + 1;
      });
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  // Redirect when BOTH animation and agent are done
  useEffect(() => {
    if (agentDone && animationDone.current) {
      setTimeout(() => router.push("/profile"), 800);
    }
    // If agent finishes before animation, we wait for animation
    // If animation finishes before agent, check periodically
    if (agentDone && activeStep >= STEPS.length) {
      setTimeout(() => router.push("/profile"), 800);
    }
  }, [agentDone, activeStep, router]);

  return (
    <div className="text-left space-y-2">
      {STEPS.map(({ icon: Icon, label }, i) => {
        const isDone = i < activeStep;
        const isActive = i === activeStep;

        return (
          <div
            key={label}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-500 ${
              isActive
                ? "opacity-100 bg-[rgba(180,83,9,0.04)]"
                : isDone
                ? "opacity-50"
                : "opacity-25"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                isActive
                  ? "bg-gold text-white"
                  : isDone
                  ? "bg-teal text-white"
                  : "bg-[rgba(0,0,0,0.06)] text-[#a8a29e]"
              }`}
            >
              {isDone ? (
                <Check size={16} />
              ) : isActive ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Icon size={16} />
              )}
            </div>
            <span
              className={`text-[0.95rem] transition-all duration-300 ${
                isActive
                  ? "text-foreground font-medium"
                  : isDone
                  ? "text-[#a8a29e]"
                  : "text-[#d6d3d1]"
              }`}
            >
              {isDone ? label.replace("...", "") : label}
            </span>
          </div>
        );
      })}

      {/* Show waiting message if animation done but agent still working */}
      {activeStep >= STEPS.length && !agentDone && !error && (
        <div className="flex items-center gap-3 px-4 py-3 mt-4 text-[0.9rem] text-[#78716c]">
          <Loader2 size={16} className="animate-spin text-gold" />
          Finishing up — almost there...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 mt-4 rounded-lg bg-red-pale text-red text-[0.9rem]">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </div>
  );
}
