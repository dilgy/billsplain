"use client";

import { useEffect, useState } from "react";
import { Pencil, Loader2 } from "lucide-react";

interface Rep {
  name: string;
  title: string;
  party: string;
  chamber: string;
  level: string;
  committees?: string[];
}

interface Agency {
  name: string;
  full_name: string;
  level: string;
}

interface ProfileData {
  profile: {
    business_name: string;
    business_url: string;
    industry: string;
    sub_industry: string;
    services: string[];
    business_summary: string;
    profile_raw: Record<string, unknown>;
  };
  states: { state_code: string; is_home_state: boolean }[];
  representatives: {
    federal: Rep[];
    state: Rep[];
  };
  agencies: Agency[];
  topics: string[];
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 border-b border-[rgba(0,0,0,0.04)]">
        <h2 className="text-base font-bold">{title}</h2>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.8rem] font-medium text-[#78716c] border border-border rounded-lg bg-transparent cursor-pointer hover:bg-surface-alt hover:border-[#a8a29e] transition-all">
          <Pencil size={14} /> Edit
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Tag({ children, color = "blue" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    blue: "bg-[rgba(59,130,246,0.08)] text-[#1e40af]",
    amber: "bg-gold-pale text-gold",
    green: "bg-teal-pale text-teal",
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[0.825rem] font-medium ${colors[color] || colors.blue}`}>
      {children}
    </span>
  );
}

function RepItem({ name, title, party }: { name: string; title: string; party: string }) {
  return (
    <div className="flex justify-between items-center p-4 rounded-lg bg-surface-muted">
      <div>
        <h4 className="text-[0.95rem] font-bold mb-0.5">{name}</h4>
        <p className="text-[0.8rem] text-[#78716c]">{title}</p>
      </div>
      <span className={`px-3 py-0.5 rounded-full text-[0.75rem] font-bold ${
        party === "D"
          ? "bg-[rgba(59,130,246,0.1)] text-[#1e40af]"
          : party === "R"
          ? "bg-red-pale text-red"
          : "bg-[rgba(0,0,0,0.05)] text-[#78716c]"
      }`}>
        {party}
      </span>
    </div>
  );
}

export default function ProfileView() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = sessionStorage.getItem("billsplain_user_id");
    if (!userId) {
      setError("No user session found.");
      setLoading(false);
      return;
    }

    fetch(`/api/profile?userId=${userId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#a8a29e]">
        <Loader2 size={24} className="animate-spin mr-3" />
        Loading your profile...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20 text-red">
        {error || "Could not load profile."}
      </div>
    );
  }

  const { profile, states, representatives, agencies, topics } = data;

  return (
    <div className="space-y-4">
      {/* Business Overview */}
      <SectionCard title="Your Business">
        {profile.business_summary && (
          <p className="text-[0.9rem] text-[#44403c] leading-relaxed mb-4 italic">
            &ldquo;{profile.business_summary}&rdquo;
          </p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            { label: "Company", value: profile.business_name || "—" },
            { label: "Website", value: profile.business_url || "—" },
            { label: "Industry", value: profile.industry || "—" },
            { label: "Sub-Industry", value: profile.sub_industry || "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-[0.7rem] font-medium text-[#a8a29e] uppercase tracking-[0.08em] mb-1">{label}</div>
              <div className="text-[0.95rem] font-medium">{value}</div>
            </div>
          ))}
        </div>
        {profile.services && profile.services.length > 0 && (
          <div>
            <div className="text-[0.7rem] font-medium text-[#a8a29e] uppercase tracking-[0.08em] mb-2">Services Detected</div>
            <div className="flex flex-wrap gap-2">
              {profile.services.map((s) => <Tag key={s} color="blue">{s}</Tag>)}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Two column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Federal Reps */}
        <SectionCard title={`Federal Representatives (${representatives.federal.length})`}>
          <div className="space-y-3">
            {representatives.federal.length > 0 ? (
              representatives.federal.slice(0, 10).map((rep) => (
                <RepItem key={rep.name} name={rep.name} title={rep.title} party={rep.party} />
              ))
            ) : (
              <p className="text-[0.85rem] text-[#a8a29e]">No representatives found.</p>
            )}
            {representatives.federal.length > 10 && (
              <p className="text-[0.8rem] text-[#a8a29e] text-center">
                + {representatives.federal.length - 10} more
              </p>
            )}
          </div>
        </SectionCard>

        {/* State Reps */}
        <SectionCard title={`State Representatives (${representatives.state.length})`}>
          <div className="space-y-3">
            {representatives.state.length > 0 ? (
              representatives.state.slice(0, 10).map((rep) => (
                <RepItem key={rep.name} name={rep.name} title={rep.title} party={rep.party} />
              ))
            ) : (
              <p className="text-[0.85rem] text-[#a8a29e]">No state representatives found.</p>
            )}
          </div>
        </SectionCard>

        {/* Regulatory Exposure */}
        <SectionCard title="Regulatory Exposure">
          <div className="mb-4">
            <div className="text-[0.7rem] font-medium text-[#a8a29e] uppercase tracking-[0.08em] mb-2">States Monitored</div>
            <div className="flex flex-wrap gap-2">
              {states.map((s) => (
                <Tag key={s.state_code} color="amber">
                  {s.state_code}{s.is_home_state ? " (Home)" : ""}
                </Tag>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[0.7rem] font-medium text-[#a8a29e] uppercase tracking-[0.08em] mb-2">Key Agencies</div>
            <div className="flex flex-wrap gap-2">
              {agencies.map((a) => <Tag key={a.name} color="green">{a.name}</Tag>)}
            </div>
          </div>
        </SectionCard>

        {/* Topics */}
        <SectionCard title="Topics We're Monitoring">
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => <Tag key={t} color="blue">{t}</Tag>)}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
