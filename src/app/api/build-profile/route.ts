import { NextRequest, NextResponse } from "next/server";

const agentUrl = process.env.AGENT_SERVICE_URL || "http://localhost:8082";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Fetch user profile from Supabase to get URL, zip, states
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("business_url, zip_code")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const { data: states } = await supabase
      .from("monitored_states")
      .select("state_code")
      .eq("profile_id", userId);

    const stateList = (states || []).map((s: { state_code: string }) => s.state_code);

    // Call the agent service
    const agentResponse = await fetch(`${agentUrl}/build-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        business_url: profile.business_url,
        zip_code: profile.zip_code,
        states: stateList,
      }),
    });

    if (!agentResponse.ok) {
      const err = await agentResponse.text();
      return NextResponse.json(
        { error: `Agent error: ${err}` },
        { status: 500 }
      );
    }

    const result = await agentResponse.json();
    const agentProfile = result.profile;
    const reps = result.representatives;

    // Save profile data back to Supabase
    await supabase
      .from("profiles")
      .update({
        business_name: agentProfile.business_name,
        industry: agentProfile.industry,
        sub_industry: agentProfile.sub_industry,
        services: agentProfile.services,
        business_summary: agentProfile.business_summary,
        profile_raw: agentProfile,
      })
      .eq("id", userId);

    // Save home state from zip
    const homeState = reps.state_code;
    if (homeState) {
      await supabase.from("monitored_states").upsert({
        profile_id: userId,
        state_code: homeState,
        is_home_state: true,
      }, { onConflict: "profile_id,state_code" });
    }

    // Save representatives
    for (const level of ["federal", "state"] as const) {
      for (const rep of reps[level] || []) {
        // Upsert representative
        const { data: repData } = await supabase
          .from("representatives")
          .upsert(
            {
              name: rep.name,
              title: rep.title,
              party: rep.party,
              state_code: rep.state_code,
              district: rep.district,
              level: rep.level,
              chamber: rep.chamber,
              phone: rep.phone || null,
              photo_url: rep.photo_url || null,
              external_id: rep.external_id || null,
            },
            { onConflict: "external_id" }
          )
          .select("id")
          .single();

        // Link rep to profile
        if (repData) {
          await supabase.from("profile_representatives").upsert(
            {
              profile_id: userId,
              representative_id: repData.id,
            },
            { onConflict: "profile_id,representative_id" }
          );
        }
      }
    }

    // Save agencies
    for (const agency of agentProfile.relevant_agencies || []) {
      const { data: agencyData } = await supabase
        .from("agencies")
        .upsert(
          {
            name: agency.name,
            full_name: agency.full_name,
            level: agency.level,
            state_code: agency.level === "state" ? homeState : null,
          },
          { onConflict: "name,level,state_code" }
        )
        .select("id")
        .single();

      if (agencyData) {
        await supabase.from("profile_agencies").upsert(
          {
            profile_id: userId,
            agency_id: agencyData.id,
          },
          { onConflict: "profile_id,agency_id" }
        );
      }
    }

    // Save topics
    for (const topicName of agentProfile.relevant_topics || []) {
      const { data: topicData } = await supabase
        .from("topics")
        .upsert({ name: topicName }, { onConflict: "name" })
        .select("id")
        .single();

      if (topicData) {
        await supabase.from("profile_topics").upsert(
          {
            profile_id: userId,
            topic_id: topicData.id,
          },
          { onConflict: "profile_id,topic_id" }
        );
      }
    }

    return NextResponse.json({
      status: "complete",
      profile: agentProfile,
      reps_saved: {
        federal: (reps.federal || []).length,
        state: (reps.state || []).length,
      },
    });
  } catch (e) {
    console.error("Build profile error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
