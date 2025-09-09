import pandas as pd
from flask import Flask, request, send_file, jsonify
from main_pipeline import process_partner_data
import io
import os
from flask_cors import CORS

# Simple in-memory store for partners. Replace with a DB for production.
PARTNERS_STORE = []
PARTNERS_STORE_PATH = "partners_store.json"

def load_partners_from_disk():
    try:
        import os, json
        if os.path.exists(PARTNERS_STORE_PATH):
            with open(PARTNERS_STORE_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
    except Exception as e:
        print("Failed to load partners from disk:", e)
    return []


def save_partners_to_disk():
    try:
        import json
        with open(PARTNERS_STORE_PATH, "w", encoding="utf-8") as f:
            json.dump(PARTNERS_STORE, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print("Failed to save partners to disk:", e)

# Initialize the Flask app
app = Flask(__name__)

# Configure CORS from environment variable for production safety.
# Set ALLOWED_ORIGINS to a comma-separated list of allowed origins (e.g. https://your-frontend.vercel.app)
# If ALLOWED_ORIGINS is not set, we default to permissive mode for local development.
allowed_env = os.getenv("ALLOWED_ORIGINS", "")
if allowed_env:
    origins = [o.strip() for o in allowed_env.split(",") if o.strip()]
else:
    origins = ["*"]  # permissive fallback for local dev — override in production via ALLOWED_ORIGINS

CORS(app, resources={r"/*": {"origins": origins}}, supports_credentials=True)


@app.before_request
def log_request_info():
    try:
        print(f"[request] {request.method} {request.path} from {request.remote_addr}")
    except Exception:
        pass


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200

# Load persisted partners at startup
PARTNERS_STORE.extend(load_partners_from_disk())

@app.route('/process', methods=['POST'])
def process_file():
    """
    API endpoint to upload an Excel file, process it,
    and return the final Excel file.
    """
    # 1. Check if a file was uploaded
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No file selected for uploading"}), 400

    # Accept the common spreadsheet file extensions listed in `accepted`
    accepted = ('.xlsx', '.xls', '.xlsm', '.csv')
    if file and any(file.filename.lower().endswith(ext) for ext in accepted):
        try:
            # 2. Read the uploaded Excel file into a pandas DataFrame
            filename = file.filename or ''
            lower = filename.lower()
            accepted = ('.xlsx', '.xls', '.xlsm', '.csv')
            if not any(lower.endswith(ext) for ext in accepted):
                return jsonify({"error": f"Unsupported file extension. Supported: {', '.join(accepted)}"}), 400

            # Try common readers: prefer openpyxl for .xlsx, fallback to pandas default
            input_df = None
            last_exc = None
            try:
                if lower.endswith('.csv'):
                    input_df = pd.read_csv(file)
                else:
                    # prefer openpyxl where available
                    try:
                        input_df = pd.read_excel(file, engine='openpyxl')
                    except Exception:
                        # fallback to pandas' default engine
                        file.seek(0)
                        input_df = pd.read_excel(file)
            except Exception as e:
                last_exc = e
                # final attempt: read without engine hint
                try:
                    file.seek(0)
                    input_df = pd.read_excel(file)
                except Exception as e2:
                    last_exc = e2
                    raise

            # 3. Validate and call processing function from main_pipeline.py
            print("✅ Starting data processing...")

            # Basic validation: ensure there is an ID column
            cols = [c for c in input_df.columns]
            if not any(c.lower() == 'id' for c in cols):
                return jsonify({"error": "Missing required column 'ID' (case-insensitive). Detected columns: " + ", ".join(cols)}), 422
            processed_df = process_partner_data(input_df)
            print("✅ Data processing complete.")

            # Convert processed DataFrame to a list of partner dicts and normalize keys
            try:
                records = processed_df.fillna("").to_dict(orient="records")
                normalized = []
                earnings_cols = ['Earnings Jan','Earnings Feb','Earnings Mar','Earnings Apr','Earnings May','Earnings Jun','Earnings Jul','Earnings Aug']
                forecast_cols = ['Forecast Sept','Forecast Oct','Forecast Nov','Forecast Dec']

                for r in records:
                    # Helper to safely get a value from possible column names
                    # small helpers to safely extract and coerce values
                    def _present(val):
                        return val is not None and val != '' and (not (isinstance(val, float) and pd.isna(val)))

                    def g(key, alt=None):
                        if key in r and _present(r[key]):
                            return r[key]
                        if alt and alt in r and _present(r[alt]):
                            return r[alt]
                        return None

                    def safe_float(v, default=0.0):
                        try:
                            if v is None or (isinstance(v, float) and pd.isna(v)):
                                return float(default)
                            if isinstance(v, str):
                                # remove common thousand separators and percent signs
                                v2 = v.replace(',', '').replace('%', '').strip()
                                if v2 == '':
                                    return float(default)
                                return float(v2)
                            return float(v)
                        except Exception:
                            return float(default)

                    def safe_int(v, default=0):
                        try:
                            if v is None or (isinstance(v, float) and pd.isna(v)):
                                return int(default)
                            if isinstance(v, str):
                                v2 = v.replace(',', '').strip()
                                if v2 == '':
                                    return int(default)
                                return int(float(v2))
                            return int(v)
                        except Exception:
                            return int(default)

                    partner = {
                        'id': str(g('ID') or g('id') or g('Id') or ''),
                        'name': str(g('Name') or g('name') or g('Partner Name') or ''),
                        'email': str(g('Email') or g('email') or ''),
                        'phone': str(g('Phone') or g('phone') or ''),
                        'novaScore': safe_int(g('Nova Score') or g('NovaScore') or 0),
                        'earningsHistory': [],
                            'tripVolume': safe_float(g('Trip Volume') or 0),
                            'onTimePickupRate': safe_float(g('On-Time Rate') or g('On Time Rate') or 0),
                            'leavesTaken': safe_float(g('Leaves Taken') or 0),
                        'medicalStability': g('Medical Stability') or 'stable',
                        'vehicleCondition': safe_float(g('Vehicle Condition') or 0),
                        'forecastedEarnings': [],
                        'riskLevel': (g('Risk Level') or 'medium').lower(),
                        'joinDate': str(g('Join Date') or ''),
                        'lastActive': str(g('Last Active') or ''),
                        'totalTrips': safe_int(g('Total Trips') or g('TotalTrips') or 0),
                        'avgRating': safe_float(g('Avg Rating') or g('AvgRating') or 0),
                        'cancellationRate': safe_float(g('Cancellation Rate') or 0),
                        'ageGroup': str(g('Age Group') or g('ageGroup') or ''),
                        'areaType': str(g('Area Type') or g('areaType') or ''),
                        'gender': str(g('Gender') or ''),
                        'ethnicity': str(g('Ethnicity') or ''),
                        'rawReviewsText': '',
                        'overallSentimentScore': None,
                    }

                    # earnings history
                    eh = []
                    for col in earnings_cols:
                        val = r.get(col)
                        eh.append(safe_float(val, 0.0))
                    partner['earningsHistory'] = eh

                    # forecasted earnings
                    fe = []
                    for col in forecast_cols:
                        val = r.get(col)
                        fe.append(safe_float(val, 0.0))
                    partner['forecastedEarnings'] = fe

                    # reviews
                    if 'reviews' in r and r['reviews'] not in (None, ''):
                        if isinstance(r['reviews'], list):
                            partner['rawReviewsText'] = ';'.join([str(x) for x in r['reviews']])
                        else:
                            partner['rawReviewsText'] = str(r['reviews'])

                    # sentiment
                    if 'sentiment' in r and r['sentiment'] not in (None, ''):
                        try:
                            partner['overallSentimentScore'] = float(r['sentiment'])
                        except Exception:
                            partner['overallSentimentScore'] = None

                    normalized.append(partner)

                # Update server store with normalized partners and persist
                PARTNERS_STORE.clear()
                PARTNERS_STORE.extend(normalized)
                save_partners_to_disk()
            except Exception as e:
                print("Warning: failed to normalize partners from processed DataFrame:", e)

            # 4. Save the processed DataFrame to an in-memory buffer
            buffer = io.BytesIO()
            processed_df.to_excel(buffer, index=False, engine='openpyxl')
            buffer.seek(0)

            # 5. Send the buffer as a downloadable file
            return send_file(
                buffer,
                as_attachment=True,
                download_name='partner_dataset_final.xlsx',
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )

        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            print("Processing error:\n", tb)
            return jsonify({"error": f"An error occurred while processing the file: {str(e)}" , "details": str(e)}), 500
    else:
        return jsonify({"error": "Invalid file type. Please upload a .xlsx file."}), 400

# NOTE: the app.run block is moved to the bottom of the file so that
# all routes are defined before the server starts.


@app.route('/partners', methods=['GET'])
def get_partners():
    """Return canonical partners as JSON."""
    return jsonify({"partners": PARTNERS_STORE}), 200


@app.route('/sync', methods=['POST'])
def sync_partners():
    """Accept partners from client, naively replace server store and return canonical partners.

    Expected payload: { "partners": [...], "changeHistory": [...] }
    This is a simple strategy: replace server copy with incoming partners. Replace with merge/conflict resolution as needed.
    """
    payload = request.get_json(silent=True) or {}
    partners = payload.get("partners")
    if isinstance(partners, list):
        # Naive replace; validate in production
        PARTNERS_STORE.clear()
        PARTNERS_STORE.extend(partners)
        # Persist to disk for development convenience
        save_partners_to_disk()
        return jsonify({"partners": PARTNERS_STORE}), 200

    return jsonify({"error": "Invalid payload"}), 400


if __name__ == "__main__":
    # Run the app on port 5000 and bind to all interfaces for local testing
    # Note: for production use a proper WSGI server and restrict host/port
    print("Starting Flask app on 0.0.0.0:5000 (debug mode)")
    app.run(debug=True, host="0.0.0.0", port=5000)