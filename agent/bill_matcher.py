"""Bill matcher — determines which bills are relevant to which user profiles using Claude."""

import os
import json
from anthropic import AsyncAnthropic


def get_client():
    return AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

MATCH_PROMPT = """You are a legislative relevance engine for BillSplain.

Given a business profile and a list of bills, determine which bills are relevant to this business.
Score each bill 0-100 for relevance. Only return bills scoring 30+.

BUSINESS PROFILE:
Industry: {industry}
Sub-industry: {sub_industry}
Services: {services}
Topics monitored: {topics}
Agencies watched: {agencies}

BILLS TO EVALUATE:
{bills_json}

Return a JSON array of relevant bills:
[
  {{
    "bill_id": "the external_id",
    "relevance_score": 0-100,
    "reason": "brief reason why this is relevant to this business",
    "suggested_impact": "low|medium|high"
  }}
]

Only include bills with relevance_score >= 30.
Return ONLY valid JSON array."""


async def match_bills_to_profile(profile: dict, bills: list[dict]) -> list[dict]:
    """
    Use Claude to determine which bills from a batch are relevant to a user's profile.
    Returns list of relevant bills with scores.
    """
    if not bills:
        return []

    # Prepare bills summary for the prompt (keep it concise)
    bills_summary = []
    for bill in bills:
        bills_summary.append({
            "external_id": bill.get("external_id"),
            "title": bill.get("title", "")[:200],
            "summary": (bill.get("summary") or bill.get("last_action_text", ""))[:300],
            "level": bill.get("level"),
            "state_code": bill.get("state_code"),
            "status": bill.get("status"),
        })

    # Batch in groups of 20 to stay within context limits
    all_matches = []
    batch_size = 20

    for i in range(0, len(bills_summary), batch_size):
        batch = bills_summary[i:i + batch_size]

        message = await get_client().messages.create(
            model="claude-haiku-4-5-20251001",  # Use Haiku for cost-efficiency on matching
            max_tokens=1500,
            messages=[
                {
                    "role": "user",
                    "content": MATCH_PROMPT.format(
                        industry=profile.get("industry", ""),
                        sub_industry=profile.get("sub_industry", ""),
                        services=", ".join(profile.get("services", [])),
                        topics=", ".join(profile.get("topics", [])),
                        agencies=", ".join(profile.get("agencies", [])),
                        bills_json=json.dumps(batch, indent=2),
                    ),
                }
            ],
        )

        response_text = message.content[0].text
        try:
            matches = json.loads(response_text)
            if isinstance(matches, list):
                all_matches.extend(matches)
        except json.JSONDecodeError:
            # Try to extract JSON array
            start = response_text.find("[")
            end = response_text.rfind("]") + 1
            if start >= 0 and end > start:
                try:
                    matches = json.loads(response_text[start:end])
                    all_matches.extend(matches)
                except json.JSONDecodeError:
                    continue

    # Sort by relevance score descending
    all_matches.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)

    return all_matches
