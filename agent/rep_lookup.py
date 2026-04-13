"""Representative lookup — finds elected officials using Congress.gov API (federal) and Open States API (state)."""

import os
import httpx

CONGRESS_API_BASE = "https://api.congress.gov/v3"
OPENSTATES_API_BASE = "https://v3.openstates.org"

# Map state abbreviations to full names (Congress.gov uses full names)
STATE_NAMES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
    "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
    "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
    "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
    "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire",
    "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York", "NC": "North Carolina",
    "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania",
    "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee",
    "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington",
    "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming", "DC": "District of Columbia",
}

# Reverse lookup
NAME_TO_ABBR = {v: k for k, v in STATE_NAMES.items()}

# Simplified zip prefix to state mapping
ZIP_FIRST_DIGIT_TO_STATE = {
    0: "MA", 1: "NY", 2: "VA", 3: "FL", 4: "OH", 5: "MN", 6: "IL", 7: "TX", 8: "CO", 9: "CA",
}

ZIP_PREFIX_TO_STATE = {
    "100": "NY", "200": "DC", "201": "VA", "300": "GA", "330": "FL",
    "606": "IL", "700": "LA", "750": "TX", "751": "TX", "752": "TX",
    "770": "TX", "900": "CA", "920": "CA",
}


def zip_to_state(zip_code: str) -> str:
    prefix = zip_code[:3]
    if prefix in ZIP_PREFIX_TO_STATE:
        return ZIP_PREFIX_TO_STATE[prefix]
    return ZIP_FIRST_DIGIT_TO_STATE.get(int(zip_code[0]), "TX")


async def lookup_reps(zip_code: str) -> dict:
    state = zip_to_state(zip_code)
    federal = await _lookup_federal_reps(state)
    state_reps = await _lookup_state_reps(state)

    return {
        "federal": federal,
        "state": state_reps,
        "state_code": state,
    }


async def _lookup_federal_reps(state: str) -> list[dict]:
    api_key = os.environ.get("CONGRESS_API_KEY", "")
    state_full = STATE_NAMES.get(state, state)
    reps = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Fetch all current members (paginate — Congress has ~535 members)
        all_members = []
        offset = 0
        try:
            while offset < 600:
                response = await client.get(
                    f"{CONGRESS_API_BASE}/member",
                    params={
                        "api_key": api_key,
                        "currentMember": "true",
                        "limit": 250,
                        "offset": offset,
                        "format": "json",
                    },
                )
                if response.status_code != 200:
                    break
                data = response.json()
                batch = data.get("members", [])
                if not batch:
                    break
                all_members.extend(batch)
                offset += 250

            members = all_members

            # Filter to our state client-side (API filter unreliable)
            for member in members:
                member_state = member.get("state", "")
                if member_state != state_full:
                    continue

                party_name = member.get("partyName", "")
                party = "D" if "Democrat" in party_name else "R" if "Republican" in party_name else "I"

                terms = member.get("terms", {}).get("item", [])
                latest_term = terms[0] if terms else {}
                chamber_raw = latest_term.get("chamber", "")
                chamber = "senate" if "Senate" in chamber_raw else "house"

                district = member.get("district")
                title = f"U.S. {'Senate' if chamber == 'senate' else 'House'} — {state}"
                if district:
                    title += f"-{district}"

                reps.append({
                    "name": member.get("name", ""),
                    "title": title,
                    "party": party,
                    "level": "federal",
                    "chamber": chamber,
                    "state_code": state,
                    "district": f"{state}-{district}" if district else state,
                    "external_id": member.get("bioguideId", ""),
                    "photo_url": (member.get("depiction") or {}).get("imageUrl"),
                })
        except (httpx.RequestError, httpx.TimeoutException) as e:
            print(f"Congress.gov API error: {e}")

    return reps


async def _lookup_state_reps(state: str) -> list[dict]:
    api_key = os.environ.get("OPENSTATES_API_KEY", "")
    state_full = STATE_NAMES.get(state, state)
    reps = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(
                f"{OPENSTATES_API_BASE}/people",
                params={
                    "jurisdiction": state_full,
                    "per_page": 10,
                },
                headers={
                    "X-API-KEY": api_key,
                },
            )
            if response.status_code != 200:
                print(f"Open States API returned {response.status_code}: {response.text[:200]}")
                return reps

            data = response.json()
            results = data.get("results", [])

            for person in results:
                name = person.get("name", "")
                party_raw = person.get("party", "")
                party = "D" if "Democrat" in party_raw else "R" if "Republican" in party_raw else "I"

                current_role = person.get("current_role") or {}
                chamber_raw = current_role.get("org_classification", "")
                chamber = "senate" if chamber_raw == "upper" else "house"
                district = current_role.get("district", "")

                title_prefix = f"{state} {'Senate' if chamber == 'senate' else 'House'}"
                title = f"{title_prefix} — District {district}" if district else title_prefix

                reps.append({
                    "name": name,
                    "title": title,
                    "party": party,
                    "level": "state",
                    "chamber": chamber,
                    "state_code": state,
                    "district": f"District {district}" if district else "",
                    "external_id": person.get("id", ""),
                })
        except (httpx.RequestError, httpx.TimeoutException) as e:
            print(f"Open States API error: {e}")

    return reps
