import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Fetch monitored states
  const { data: states } = await supabase
    .from("monitored_states")
    .select("state_code, is_home_state")
    .eq("profile_id", userId);

  // Fetch representatives via junction table
  const { data: repLinks } = await supabase
    .from("profile_representatives")
    .select("representative_id, representatives(*)")
    .eq("profile_id", userId);

  const representatives = (repLinks || []).map(
    (link: { representatives: Record<string, unknown> }) => link.representatives
  );

  // Fetch agencies via junction table
  const { data: agencyLinks } = await supabase
    .from("profile_agencies")
    .select("agency_id, agencies(*)")
    .eq("profile_id", userId);

  const agencies = (agencyLinks || []).map(
    (link: { agencies: Record<string, unknown> }) => link.agencies
  );

  // Fetch topics via junction table
  const { data: topicLinks } = await supabase
    .from("profile_topics")
    .select("topic_id, topics(*)")
    .eq("profile_id", userId);

  const topics = (topicLinks || []).map(
    (link: { topics: { name: string } }) => link.topics.name
  );

  return NextResponse.json({
    profile,
    states: states || [],
    representatives: {
      federal: representatives.filter((r: { level: string }) => r.level === "federal"),
      state: representatives.filter((r: { level: string }) => r.level === "state"),
    },
    agencies,
    topics,
  });
}
