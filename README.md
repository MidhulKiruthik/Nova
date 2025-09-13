# Nova Plus

Nova Plus is a full-stack platform for managing, analyzing, and visualizing transportation partner data. It combines a robust Python backend for data processing and a modern Next.js/React frontend for interactive analytics and fairness insights.

---


## Live Demo

Access the deployed app here: [nova-three-sand.vercel.app](https://nova-three-sand.vercel.app)

---

## Features

- **Excel Data Import/Export:** Upload partner data via Excel, download processed results, and export canonical datasets.
- **Automated Data Processing:** Sentiment analysis (rule-based + ML), earnings forecasting, and Nova Score calculation.
- **Fairness & Demographic Analytics:** Visualize bias across age, area, gender, and ethnicity groups with a Fairness Radar chart.
- **Partner Profiles:** View detailed partner history, reviews, forecasts, and performance metrics.
- **Sync & Persistence:** Sync changes between frontend and backend, with local and server-side persistence.
- **Template Download:** Download a ready-to-use Excel template for partner data entry.
- **Clear Data:** Remove all partner data locally and/or on the server with a single click.
- **Deployment Ready:** Easily deploy frontend (Vercel) and backend (Render, Fly.io, Railway).

---

## Technologies

- **Backend:** Python, Flask, pandas, scikit-learn, openpyxl
- **Frontend:** Next.js, React, TypeScript, Recharts
- **Data Exchange:** REST API (JSON, file upload/download)
- **Persistence:** JSON file (dev), database recommended for production

---

## Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/MidhulKiruthik/Nova.git
cd Nova
```

### 2. Backend Setup (Python/Flask)

```bash
# Create and activate a virtual environment
python -m venv .venv
# On Windows (PowerShell)
. .venv\Scripts\Activate.ps1
# On bash/cmd
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server
python app.py
# The backend will start at http://localhost:5000
```

### 3. Frontend Setup (Next.js/React)

```bash
# Install frontend dependencies
npm install

# Start the frontend development server
npm run dev
# The frontend will start at http://localhost:3000
```

### 4. Environment Variables

- **Frontend:**  
	Set `NEXT_PUBLIC_API_URL` in `.env.local` to point to your backend (e.g., `http://localhost:5000` or your deployed backend URL).
- **Backend:**  
	Set `ALLOWED_ORIGINS` in your environment to restrict CORS in production.

---

## Usage

1. **Data Management:**  
	 - Download the Excel template.
	 - Fill in partner data and upload via the Data Management page.
	 - View processed results, fairness analytics, and partner profiles.

2. **Sync & Export:**  
	 - Sync changes to the backend.
	 - Export canonical partner data for analysis.

3. **Fairness & Analytics:**  
	 - Explore fairness metrics and bias across demographic groups.
	 - Analyze partner performance and forecasts.

4. **Clear Data:**  
	 - Use the Clear All Data button to remove all data locally and/or on the server.

---

## Deployment

- **Frontend:**  
	Deploy to [Vercel](https://vercel.com/) for instant hosting.
- **Backend:**  
	Deploy to [Render](https://render.com/), [Fly.io](https://fly.io/), or [Railway](https://railway.app/).
- See `DEPLOY.md` for detailed instructions.

---

## Project Structure

```
Nova/
├── app.py                # Flask backend API
├── main_pipeline.py      # Data processing pipeline
├── requirements.txt      # Python dependencies
├── components/           # React UI components
├── lib/                  # Frontend utilities and data store
├── hooks/                # React hooks
├── public/               # Static assets
├── package.json          # Frontend dependencies
├── README.md             # Project documentation
└── ...                   # Other config and source files
```

---

## Contributing

Pull requests and issues are welcome! Please open an issue for bugs, feature requests, or questions.

---

## License

MIT License

---

## Contact

For support or collaboration, contact [Midhul Kiruthik](mailto:midhulkiruthik@gmail.com).
