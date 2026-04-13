"""Representative lookup — finds elected officials using Census geocoder, Congress.gov, and Open States."""

import os
import httpx

CONGRESS_API_BASE = "https://api.congress.gov/v3"
OPENSTATES_API_BASE = "https://v3.openstates.org"

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

NAME_TO_ABBR = {v: k for k, v in STATE_NAMES.items()}

FIPS_TO_STATE = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
    "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
    "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
    "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
    "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
    "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
    "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
    "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
    "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
    "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
    "56": "WY",
}


async def lookup_reps(address: str) -> dict:
    """Look up reps by full home address using Census geocoder for district accuracy."""
    geo = await _geocode_address(address)

    if not geo:
        raise ValueError(f"Could not geocode address: {address}")

    state = geo["state"]
    district = geo["district"]

    federal = await _lookup_federal_reps(state, district)
    state_reps = await _lookup_state_reps(state, geo.get("lat"), geo.get("lng"))

    # Validate counts
    warnings = _validate_reps(state, federal, state_reps)
    if warnings:
        for w in warnings:
            print(f"REP VALIDATION WARNING: {w}")

    return {
        "federal": federal,
        "state": state_reps,
        "state_code": state,
        "warnings": warnings,
    }


def _validate_reps(state, federal, state_reps):
    warnings = []

    # Federal: expect exactly 2 senators + 1 house rep = 3
    senators = [r for r in federal if r["chamber"] == "senate"]
    house = [r for r in federal if r["chamber"] == "house"]

    if len(senators) != 2:
        warnings.append(f"Expected 2 federal senators, got {len(senators)}: {[s['name'] for s in senators]}")
    if len(house) != 1:
        warnings.append(f"Expected 1 federal house rep, got {len(house)}: {[h['name'] for h in house]}")

    # State: expect 1 state senator + 1 state house/assembly = 2 (Nebraska = 1 senator only)
    expected_state = 1 if state == "NE" else 2
    if len(state_reps) != expected_state:
        warnings.append(f"Expected {expected_state} state reps for {state}, got {len(state_reps)}: {[r['name'] for r in state_reps]}")

    if expected_state == 2:
        state_senators = [r for r in state_reps if r["chamber"] == "senate"]
        state_house = [r for r in state_reps if r["chamber"] == "house"]
        if len(state_senators) != 1:
            warnings.append(f"Expected 1 state senator, got {len(state_senators)}")
        if len(state_house) != 1:
            warnings.append(f"Expected 1 state house/assembly rep, got {len(state_house)}")

    return warnings


async def _geocode_address(address: str) -> dict:
    """Use Census geocoder to get state + congressional district from a full address."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress",
                params={
                    "address": address,
                    "benchmark": "Public_AR_Current",
                    "vintage": "Current_Current",
                    "format": "json",
                },
            )
            if response.status_code != 200:
                print(f"Census geocoder HTTP {response.status_code}")
                return None

            data = response.json()
            matches = data.get("result", {}).get("addressMatches", [])
            if not matches:
                print(f"Census geocoder: no matches for '{address}'")
                return None

            match = matches[0]
            geos = match.get("geographies", {})

            # Extract state from FIPS
            state_fips = match.get("addressComponents", {}).get("state", "")
            state_code = FIPS_TO_STATE.get(state_fips)

            # Fallback: try STUSAB from geographies
            if not state_code:
                for key in geos:
                    if "States" in key and geos[key]:
                        abbr = geos[key][0].get("STUSAB", "")
                        if abbr:
                            state_code = abbr
                            break

            # Find congressional district
            district_num = None
            for key in geos:
                if "Congressional" in key and geos[key]:
                    cd = geos[key][0].get("CD", "") or geos[key][0].get("BASENAME", "")
                    if cd and cd.isdigit():
                        district_num = int(cd)
                        break

            # Extract lat/lng for state rep geo-lookup
            coords = match.get("coordinates", {})
            lat = coords.get("y")
            lng = coords.get("x")

            if state_code:
                print(f"Geocoded '{address}' → state={state_code}, district={district_num}, lat={lat}, lng={lng}")
                return {"state": state_code, "district": district_num, "lat": lat, "lng": lng}

    except Exception as e:
        print(f"Census geocoder error: {e}")

    return None


async def _lookup_federal_reps(state: str, district=None) -> list:
    """Fetch 2 senators + house rep for the exact district."""
    api_key = os.environ.get("CONGRESS_API_KEY", "")
    state_full = STATE_NAMES.get(state, state)
    reps = []

    async with httpx.AsyncClient(timeout=30.0) as client:
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

            for member in all_members:
                if member.get("state", "") != state_full:
                    continue

                party_name = member.get("partyName", "")
                party = "D" if "Democrat" in party_name else "R" if "Republican" in party_name else "I"

                member_district = member.get("district")

                # Determine chamber: no district = senator (more reliable than terms data
                # which can be stale, e.g. Schiff's list record still shows House)
                if not member_district:
                    chamber = "senate"
                else:
                    terms = member.get("terms", {}).get("item", [])
                    latest_term = terms[0] if terms else {}
                    chamber_raw = latest_term.get("chamber", "")
                    chamber = "senate" if "Senate" in chamber_raw else "house"

                # Keep senators always; house reps only if they match our district
                if chamber == "house" and district is not None and member_district != district:
                    continue

                title = f"U.S. {'Senate' if chamber == 'senate' else 'House'} — {state}"
                if member_district:
                    title += f"-{member_district}"

                reps.append({
                    "name": member.get("name", ""),
                    "title": title,
                    "party": party,
                    "level": "federal",
                    "chamber": chamber,
                    "state_code": state,
                    "district": f"{state}-{member_district}" if member_district else state,
                    "external_id": member.get("bioguideId", ""),
                    "photo_url": (member.get("depiction") or {}).get("imageUrl"),
                })
        except (httpx.RequestError, httpx.TimeoutException) as e:
            print(f"Congress.gov API error: {e}")

    return reps


async def _lookup_state_reps(state: str, lat=None, lng=None) -> list:
    api_key = os.environ.get("OPENSTATES_API_KEY", "")
    state_full = STATE_NAMES.get(state, state)
    reps = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Use geo endpoint if we have coordinates (returns only reps for this exact location)
            if lat and lng:
                params = {
                    "lat": lat,
                    "lng": lng,
                    "per_page": 10,
                }
            else:
                params = {
                    "jurisdiction": state_full,
                    "per_page": 10,
                }

            response = await client.get(
                f"{OPENSTATES_API_BASE}/people.geo" if (lat and lng) else f"{OPENSTATES_API_BASE}/people",
                params=params,
                headers={
                    "X-API-KEY": api_key,
                },
            )
            if response.status_code != 200:
                print(f"Open States API returned {response.status_code}: {response.text[:200]}")
                return reps

            data = response.json()
            for person in data.get("results", []):
                # Skip federal reps — Open States geo endpoint returns them too
                jurisdiction = person.get("jurisdiction", {})
                if isinstance(jurisdiction, dict):
                    jclass = jurisdiction.get("classification", "")
                else:
                    jclass = ""
                # Also check jurisdiction_id on current_role
                current_role_check = person.get("current_role") or {}
                jid = current_role_check.get("jurisdiction_id", "")
                # Keep only state-level reps
                if jclass and jclass != "state":
                    continue
                if not jclass and "country:us/government" in jid:
                    continue

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
