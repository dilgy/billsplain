"""Bill analyzer — generates personalized impact analysis using Claude."""

import os
import json
from anthropic import AsyncAnthropic


def get_client():
    return AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

ANALYSIS_PROMPT = """You are a legislative analyst for BillSplain. Analyze how a specific bill impacts a specific business.

BUSINESS PROFILE:
{profile_json}

BILL DETAILS:
Title: {bill_title}
ID: {bill_id}
Summary: {bill_summary}
Full text excerpt: {bill_text}
Status: {bill_status}
Sponsor: {bill_sponsor}

Generate a JSON impact analysis:
{{
  "impact_level": "low|medium|high",
  "summary": "2-3 sentence plain-English summary of how this bill affects this specific business",
  "pros": [
    "specific benefit #1 for this business",
    "specific benefit #2"
  ],
  "cons": [
    "specific risk #1 for this business",
    "specific risk #2"
  ],
  "talking_point": "A 2-sentence talking point the business owner could use when calling their rep about this bill. Reference their specific operations.",
  "letter_draft": "A brief paragraph that could be the core of a letter to a representative, written from the perspective of this business owner."
}}

Be specific to THIS business — reference their industry, services, and operations.
Do not be generic. The value is in the personalization.
Return ONLY valid JSON."""


async def analyze_bill_impact(user_id: str, bill_id: str) -> dict:
    """
    Generate a personalized impact analysis for a bill against a user's business profile.

    In production, this will:
    1. Fetch the user's profile from Supabase
    2. Fetch the bill details from Supabase
    3. Send both to Claude for analysis
    4. Save the analysis to Supabase
    5. Return the analysis
    """
    # TODO: Fetch from Supabase
    # For now, return placeholder structure
    profile_json = "{}"  # Will be fetched from DB
    bill_title = ""
    bill_summary = ""
    bill_text = ""
    bill_status = ""
    bill_sponsor = ""

    message = await get_client().messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1500,
        messages=[
            {
                "role": "user",
                "content": ANALYSIS_PROMPT.format(
                    profile_json=profile_json,
                    bill_title=bill_title,
                    bill_id=bill_id,
                    bill_summary=bill_summary,
                    bill_text=bill_text,
                    bill_status=bill_status,
                    bill_sponsor=bill_sponsor,
                ),
            }
        ],
    )

    response_text = message.content[0].text

    try:
        analysis = json.loads(response_text)
    except json.JSONDecodeError:
        start = response_text.find("{")
        end = response_text.rfind("}") + 1
        if start >= 0 and end > start:
            analysis = json.loads(response_text[start:end])
        else:
            raise ValueError("Could not parse analysis response as JSON")

    return analysis
