"""Profile builder — uses Claude to analyze scraped website content and build a business intelligence profile."""

import os
import json
from anthropic import AsyncAnthropic


def get_client():
    return AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

PROFILE_PROMPT = """You are an expert business analyst for BillSplain, a legislation monitoring service.
Analyze the following website content and build a comprehensive business intelligence profile.

Website content:
{site_content}

Business location: ZIP code {zip_code}
Operating states: {states}

Generate a JSON profile with the following structure:
{{
  "business_name": "detected company name",
  "industry": "primary industry (e.g., Transportation & Logistics)",
  "sub_industry": "specific niche (e.g., Freight / Trucking)",
  "services": ["list of specific services offered"],
  "business_summary": "2-3 sentence summary of what this business does",
  "employee_estimate": "estimated company size range (e.g., 50-100)",
  "regulatory_areas": ["list of regulatory areas this business likely falls under"],
  "relevant_agencies": [
    {{"name": "DOT", "full_name": "Department of Transportation", "level": "federal", "relevance": "brief reason"}},
  ],
  "relevant_topics": [
    "specific legislative topics to monitor (e.g., CDL Requirements, Emissions Standards)"
  ],
  "key_committees": [
    "congressional/state committees relevant to this business"
  ],
  "risk_areas": ["areas where legislation could negatively impact this business"],
  "opportunity_areas": ["areas where legislation could benefit this business"]
}}

Be specific and thorough. Base everything on what you can infer from the website content.
If you can't determine something, make a reasonable inference based on the industry and location.
Return ONLY valid JSON, no markdown formatting."""


async def build_profile(
    site_content: str,
    zip_code: str,
    states: list[str],
) -> dict:
    """
    Send scraped website content to Claude and get back a structured business profile.
    """
    states_str = ", ".join(states) if states else "home state only"

    message = await get_client().messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        messages=[
            {
                "role": "user",
                "content": PROFILE_PROMPT.format(
                    site_content=site_content,
                    zip_code=zip_code,
                    states=states_str,
                ),
            }
        ],
    )

    response_text = message.content[0].text

    # Parse JSON response
    try:
        profile = json.loads(response_text)
    except json.JSONDecodeError:
        # Try to extract JSON from response if wrapped in markdown
        start = response_text.find("{")
        end = response_text.rfind("}") + 1
        if start >= 0 and end > start:
            profile = json.loads(response_text[start:end])
        else:
            raise ValueError("Could not parse profile response as JSON")

    return profile
