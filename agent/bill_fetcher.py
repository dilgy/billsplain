"""Bill fetcher — polls Congress.gov and Open States for new/updated legislation."""

import os
from datetime import datetime, timedelta
import httpx

CONGRESS_API_BASE = "https://api.congress.gov/v3"
OPENSTATES_API_BASE = "https://v3.openstates.org"


async def fetch_federal_bills(days_back: int = 1) -> list[dict]:
    """
    Fetch recently updated federal bills from Congress.gov API.
    """
    api_key = os.environ.get("CONGRESS_API_KEY", "")
    since = (datetime.utcnow() - timedelta(days=days_back)).strftime("%Y-%m-%dT00:00:00Z")
    bills = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        for bill_type in ["hr", "s"]:  # House and Senate bills
            try:
                response = await client.get(
                    f"{CONGRESS_API_BASE}/bill",
                    params={
                        "api_key": api_key,
                        "fromDateTime": since,
                        "sort": "updateDate+desc",
                        "limit": 50,
                    },
                )
                if response.status_code != 200:
                    continue

                data = response.json()
                for bill in data.get("bills", []):
                    bill_number = bill.get("number", "")
                    bill_type_upper = bill.get("type", "").upper()

                    bills.append({
                        "external_id": f"{bill_type_upper}-{bill_number}",
                        "title": bill.get("title", ""),
                        "level": "federal",
                        "state_code": None,
                        "chamber": "house" if bill_type == "hr" else "senate",
                        "status": _map_federal_status(bill.get("latestAction", {}).get("text", "")),
                        "sponsor_name": None,  # Requires additional API call
                        "introduced_date": bill.get("introducedDate"),
                        "last_action_date": bill.get("latestAction", {}).get("actionDate"),
                        "last_action_text": bill.get("latestAction", {}).get("text"),
                        "full_text_url": bill.get("url"),
                        "raw_data": bill,
                    })
            except (httpx.RequestError, httpx.TimeoutException):
                continue

    return bills


async def fetch_state_bills(state: str, days_back: int = 1) -> list[dict]:
    """
    Fetch recently updated state bills from Open States API.
    """
    api_key = os.environ.get("OPENSTATES_API_KEY", "")
    since = (datetime.utcnow() - timedelta(days=days_back)).strftime("%Y-%m-%d")
    bills = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(
                f"{OPENSTATES_API_BASE}/bills",
                params={
                    "jurisdiction": state,
                    "updated_since": since,
                    "sort": "updated_desc",
                    "per_page": 50,
                    "include": "abstracts,actions,sponsorships",
                },
                headers={
                    "X-API-KEY": api_key,
                },
            )
            if response.status_code != 200:
                return bills

            data = response.json()
            for bill in data.get("results", []):
                identifier = bill.get("identifier", "")
                title = bill.get("title", "")

                # Get abstract/summary
                abstracts = bill.get("abstracts", [])
                summary = abstracts[0].get("abstract", "") if abstracts else ""

                # Get latest action
                actions = bill.get("actions", [])
                latest_action = actions[0] if actions else {}

                # Get sponsor
                sponsorships = bill.get("sponsorships", [])
                primary_sponsor = next(
                    (s for s in sponsorships if s.get("primary")),
                    sponsorships[0] if sponsorships else {},
                )

                # Determine chamber
                from_org = bill.get("from_organization", {})
                chamber_class = from_org.get("classification", "")
                chamber = "senate" if "upper" in chamber_class else "house"

                bills.append({
                    "external_id": identifier,
                    "title": title,
                    "summary": summary,
                    "level": "state",
                    "state_code": state.upper(),
                    "chamber": chamber,
                    "status": _map_state_status(latest_action.get("description", "")),
                    "sponsor_name": primary_sponsor.get("name"),
                    "introduced_date": bill.get("first_action_date"),
                    "last_action_date": latest_action.get("date"),
                    "last_action_text": latest_action.get("description"),
                    "raw_data": bill,
                })
        except (httpx.RequestError, httpx.TimeoutException):
            pass

    return bills


async def fetch_all_bills_for_states(states: list[str], days_back: int = 1) -> list[dict]:
    """
    Fetch bills for all monitored states + federal.
    """
    all_bills = []

    # Federal
    federal = await fetch_federal_bills(days_back)
    all_bills.extend(federal)

    # State by state
    for state in states:
        state_bills = await fetch_state_bills(state, days_back)
        all_bills.extend(state_bills)

    return all_bills


def _map_federal_status(action_text: str) -> str:
    """Map Congress.gov action text to our status enum."""
    text = action_text.lower()
    if "introduced" in text:
        return "introduced"
    if "referred to" in text or "committee" in text:
        return "in_committee"
    if "reported by" in text or "ordered to be reported" in text:
        return "passed_committee"
    if "passed" in text and ("house" in text or "senate" in text):
        return "passed"
    if "signed by president" in text or "became public law" in text:
        return "signed"
    if "vetoed" in text:
        return "vetoed"
    return "introduced"


def _map_state_status(action_text: str) -> str:
    """Map Open States action text to our status enum."""
    text = action_text.lower()
    if "introduced" in text or "filed" in text:
        return "introduced"
    if "committee" in text and ("referred" in text or "assigned" in text):
        return "in_committee"
    if "reported" in text or "favorable" in text:
        return "passed_committee"
    if "passed" in text:
        return "passed"
    if "signed" in text or "enacted" in text:
        return "signed"
    if "vetoed" in text:
        return "vetoed"
    return "introduced"
