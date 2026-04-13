# BillSplain — GCP Deployment

## Prerequisites
- Personal GCP project created
- `gcloud` CLI authenticated to the project
- Billing enabled

## One-time setup

```bash
# Set your project ID
export GCP_PROJECT=your-project-id
export GCP_REGION=us-central1

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudscheduler.googleapis.com \
  secretmanager.googleapis.com \
  --project=$GCP_PROJECT

# Create Artifact Registry repo
gcloud artifacts repositories create billsplain \
  --repository-format=docker \
  --location=$GCP_REGION \
  --project=$GCP_PROJECT

# Configure Docker auth
gcloud auth configure-docker ${GCP_REGION}-docker.pkg.dev
```

## Store secrets

```bash
# Add each secret
echo -n "your-value" | gcloud secrets create SUPABASE_URL --data-file=- --project=$GCP_PROJECT
echo -n "your-value" | gcloud secrets create SUPABASE_ANON_KEY --data-file=- --project=$GCP_PROJECT
echo -n "your-value" | gcloud secrets create SUPABASE_SERVICE_ROLE_KEY --data-file=- --project=$GCP_PROJECT
echo -n "your-value" | gcloud secrets create ANTHROPIC_API_KEY --data-file=- --project=$GCP_PROJECT
echo -n "your-value" | gcloud secrets create CONGRESS_API_KEY --data-file=- --project=$GCP_PROJECT
echo -n "your-value" | gcloud secrets create OPENSTATES_API_KEY --data-file=- --project=$GCP_PROJECT
echo -n "your-value" | gcloud secrets create RESEND_API_KEY --data-file=- --project=$GCP_PROJECT
echo -n "your-value" | gcloud secrets create POSTGRID_API_KEY --data-file=- --project=$GCP_PROJECT
```

## Deploy Next.js app

```bash
# From project root
docker build -t ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/billsplain/web:latest .
docker push ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/billsplain/web:latest

gcloud run deploy billsplain-web \
  --image=${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/billsplain/web:latest \
  --region=$GCP_REGION \
  --allow-unauthenticated \
  --min-instances=1 \
  --max-instances=10 \
  --memory=512Mi \
  --set-secrets="NEXT_PUBLIC_SUPABASE_URL=SUPABASE_URL:latest,NEXT_PUBLIC_SUPABASE_ANON_KEY=SUPABASE_ANON_KEY:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest" \
  --project=$GCP_PROJECT
```

## Deploy Agent service

```bash
# From agent/ directory
cd agent
docker build -t ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/billsplain/agent:latest .
docker push ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/billsplain/agent:latest

gcloud run deploy billsplain-agent \
  --image=${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/billsplain/agent:latest \
  --region=$GCP_REGION \
  --no-allow-unauthenticated \
  --min-instances=0 \
  --max-instances=5 \
  --memory=1Gi \
  --timeout=300 \
  --set-secrets="ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,CONGRESS_API_KEY=CONGRESS_API_KEY:latest,OPENSTATES_API_KEY=OPENSTATES_API_KEY:latest" \
  --project=$GCP_PROJECT
```

## Set up Cloud Scheduler (cron)

```bash
# Get the agent service URL
AGENT_URL=$(gcloud run services describe billsplain-agent --region=$GCP_REGION --format='value(status.url)' --project=$GCP_PROJECT)

# Create service account for scheduler
gcloud iam service-accounts create billsplain-scheduler \
  --display-name="BillSplain Scheduler" \
  --project=$GCP_PROJECT

# Grant invoker role
gcloud run services add-iam-policy-binding billsplain-agent \
  --region=$GCP_REGION \
  --member="serviceAccount:billsplain-scheduler@${GCP_PROJECT}.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --project=$GCP_PROJECT

# Create cron job — every 6 hours
gcloud scheduler jobs create http billsplain-poll-bills \
  --schedule="0 */6 * * *" \
  --uri="${AGENT_URL}/poll-bills" \
  --http-method=POST \
  --body='{"days_back": 1}' \
  --headers="Content-Type=application/json" \
  --oidc-service-account-email="billsplain-scheduler@${GCP_PROJECT}.iam.gserviceaccount.com" \
  --location=$GCP_REGION \
  --project=$GCP_PROJECT
```

## Custom domain

```bash
gcloud run domain-mappings create \
  --service=billsplain-web \
  --domain=billsplain.com \
  --region=$GCP_REGION \
  --project=$GCP_PROJECT
```
