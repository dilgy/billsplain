import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await request.json();
    const { contact, url, address, states } = body;

    // Validate required fields
    if (!contact || !url) {
      return NextResponse.json(
        { error: "Missing required fields: contact, url" },
        { status: 400 }
      );
    }

    // Determine if contact is email or phone
    const isEmail = contact.includes("@");
    const email = isEmail ? contact : null;
    const phone = isEmail ? null : contact;

    // Create auth user (email-based for now)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email || `${phone}@sms.billsplain.com`, // placeholder for phone-only users
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // Extract zip from address
    const zipMatch = address.match(/\b(\d{5})(?:-\d{4})?\b/);
    const zip = zipMatch ? zipMatch[1] : "";

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      email,
      phone,
      business_url: url,
      zip_code: zip,
      address,
    });

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    // Insert monitored states
    if (states && states.length > 0) {
      const stateRows = states.map((stateCode: string) => ({
        profile_id: userId,
        state_code: stateCode,
        is_home_state: false,
      }));

      await supabase.from("monitored_states").insert(stateRows);
    }

    // TODO: Trigger agent to build profile (async)
    // This will be a call to the Python agent service

    return NextResponse.json(
      {
        message: "Signup successful",
        userId,
        profileUrl: `/profile/${userId}`,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
