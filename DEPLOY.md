Frontend (Vercel)

1. Push your repo to GitHub (if not already).
2. Sign in to Vercel and click "Import Project" → connect GitHub → choose this repository.
3. Vercel should detect Next.js and suggest default build settings.
   - Install Command: `pnpm install` (or `npm install`)
   - Build Command: `pnpm build` (or `npm run build`)
   - Output Directory: (leave default)
4. In Vercel Project Settings → Environment Variables add:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://<your-backend-hostname>` (replace after backend deploy)
5. Deploy the project. After deploy, note the Vercel domain and add it to backend ALLOWED_ORIGINS.

Backend (Render example)

1. Ensure the repository contains `requirements.txt` and `Procfile` (this repo has both).
2. Sign in to Render and create a new Web Service.
3. Connect your GitHub repo and select the branch to deploy.
4. Build command: leave empty (Render will run `pip install -r requirements.txt` if detected) or set to:
   - `pip install -r requirements.txt`
5. Start command: (use Procfile or set explicitly):
   - `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2`
6. Add an environment variable in Render: `ALLOWED_ORIGINS` = `https://<your-vercel-domain>` (comma-separated list if multiple).
7. Deploy. After Render finishes, you'll get an HTTPS URL. Use that in Vercel's `NEXT_PUBLIC_API_URL`.

Notes & Next Steps
- For development you can keep `ALLOWED_ORIGINS` blank to use permissive CORS, but always set it in production.
- Consider migrating `partners_store.json` to Postgres/SQLite in production.
- Add authentication and validation for `/sync` before exposing it publicly.
