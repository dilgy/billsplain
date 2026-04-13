"""BillSplain Agent Service — FastAPI backend for heavy processing."""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

from scraper import scrape_website
from profile_builder import build_profile
from rep_lookup import lookup_reps
from bill_analyzer import analyze_bill_impact
from bill_fetcher import fetch_all_bills_for_states
from bill_matcher import match_bills_to_profile

load_dotenv()

app = FastAPI(title="BillSplain Agent", version="0.1.0")


class BuildProfileRequest(BaseModel):
    user_id: str
    business_url: str
    zip_code: str
    states: list[str] = []


class AnalyzeBillRequest(BaseModel):
    user_id: str
    bill_id: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/build-profile")
async def build_profile_endpoint(req: BuildProfileRequest):
    """
    Full profile build pipeline:
    1. Scrape the business website
    2. Analyze with Claude to extract industry, services, regulatory exposure
    3. Look up representatives by zip code
    4. Determine relevant agencies, committees, topics
    5. Save everything to Supabase
    """
    try:
        # Step 1: Scrape website
        site_content = await scrape_website(req.business_url)

        # Step 2: Build profile with Claude
        profile = await build_profile(
            site_content=site_content,
            zip_code=req.zip_code,
            states=req.states,
        )

        # Step 3: Look up representatives
        reps = await lookup_reps(req.zip_code)

        # Step 4: Save to Supabase
        # TODO: Save profile, reps, agencies, topics to DB

        return {
            "status": "complete",
            "user_id": req.user_id,
            "profile": profile,
            "representatives": reps,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-bill")
async def analyze_bill_endpoint(req: AnalyzeBillRequest):
    """
    Generate personalized impact analysis for a bill against a user's profile.
    """
    try:
        analysis = await analyze_bill_impact(
            user_id=req.user_id,
            bill_id=req.bill_id,
        )
        return {"status": "complete", "analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class PollBillsRequest(BaseModel):
    days_back: int = 1


@app.post("/poll-bills")
async def poll_bills_endpoint(req: PollBillsRequest):
    """
    Cron job endpoint — called by GitHub Actions on a schedule.
    1. Get all unique monitored states across all users
    2. Fetch new/updated bills from Congress.gov + Open States
    3. For each user, match bills to their profile
    4. For high-relevance matches, generate impact analyses
    5. Queue notifications
    """
    try:
        # TODO: Fetch all monitored states from Supabase
        all_states = ["TX", "CA", "IL"]  # Will come from DB

        # Step 1: Fetch bills
        bills = await fetch_all_bills_for_states(all_states, req.days_back)

        # TODO: Save new bills to Supabase
        # TODO: For each user profile, run bill_matcher
        # TODO: For high-relevance matches, run bill_analyzer
        # TODO: Queue email/SMS notifications

        return {
            "status": "complete",
            "bills_fetched": len(bills),
            "federal": len([b for b in bills if b["level"] == "federal"]),
            "state": len([b for b in bills if b["level"] == "state"]),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
