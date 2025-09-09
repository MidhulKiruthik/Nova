import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.ensemble import GradientBoostingRegressor
import ast

def process_partner_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    This function takes the raw partner DataFrame and runs the full
    sentiment, forecast, and Nova Score pipeline.
    """
    df.columns = df.columns.str.strip()  # Clean column names

    # 1. SENTIMENT ANALYSIS ===================================================
    # Ensure reviews column exists and is a list for each row
    if "reviews" not in df.columns:
        df["reviews"] = [[] for _ in range(len(df))]

    # If reviews are serialized strings like "['a','b']", parse them. Use safe parsing.
    def _safe_parse_reviews(cell):
        if isinstance(cell, list):
            return cell
        if isinstance(cell, str):
            try:
                parsed = ast.literal_eval(cell)
                return parsed if isinstance(parsed, list) else [str(parsed)]
            except Exception:
                # fallback: split on common separators
                return [s.strip() for s in cell.split(';') if s.strip()]
        return []

    df["reviews"] = df["reviews"].apply(_safe_parse_reviews)

    def rule_based_sentiment(text: str) -> float:
        lower = text.lower()
        score = 2.5
        positive = ["excellent", "great", "good", "professional", "friendly",
                    "on time", "clean", "smooth", "happy", "fantastic", "best",
                    "safe", "courteous", "pleasant", "reliable", "efficient", "punctual"]
        negative = ["poor", "bad", "late", "distracted", "rude", "unprofessional",
                    "dirty", "long route", "unhappy", "cancel", "terrible",
                    "unacceptable", "delays", "tired"]
        for p in positive:
            if p in lower: score += 0.5
        for n in negative:
            if n in lower: score -= 0.5
        return float(np.clip(score, 0, 5))

    # Build a training set for the sentiment model using rule-based labels
    all_reviews = []
    for partner_id, reviews in zip(df.get("ID", []), df["reviews"]):
        if not isinstance(reviews, list) or len(reviews) == 0:
            continue
        for r in reviews:
            lbl = rule_based_sentiment(r)
            all_reviews.append({
                "partner_id": partner_id, "review": r, "label": lbl
            })

    if len(all_reviews) == 0:
        # No reviews available; create a default sentiment column (NaN)
        df = df.drop(columns=["sentiment"], errors="ignore")
        df["sentiment"] = np.nan
    else:
        reviews_df = pd.DataFrame(all_reviews)

        # Train a small model; wrap in try/except to avoid failing on odd data
        try:
            ml_model = Pipeline([
                ("tfidf", TfidfVectorizer(max_features=5000, ngram_range=(1,2))),
                ("regressor", Ridge(solver="lsqr"))
            ])
            ml_model.fit(reviews_df["review"], reviews_df["label"])
            reviews_df["pred_score"] = ml_model.predict(reviews_df["review"]).clip(0, 5)

            partner_sentiment = reviews_df.groupby("partner_id")["pred_score"].mean().reset_index()
            partner_sentiment.columns = ["ID", "sentiment"]
            df = df.drop(columns=["sentiment"], errors="ignore")
            df = df.merge(partner_sentiment, on="ID", how="left")
        except Exception as e:
            # On any model error, fallback to rule-based mean per partner
            partner_sentiment = reviews_df.groupby("partner_id")["label"].mean().reset_index()
            partner_sentiment.columns = ["ID", "sentiment"]
            df = df.drop(columns=["sentiment"], errors="ignore")
            df = df.merge(partner_sentiment, on="ID", how="left")

    # 2. PROGRESSIVE FORECASTING =============================================
    base_features = []
    for f in ['Trip Volume','On-Time Rate','Leaves Taken','Vehicle Condition','Avg Rating','Cancellation Rate','sentiment']:
        if f in df.columns:
            base_features.append(f)

    earnings_cols = [c for c in ['Earnings Jan','Earnings Feb','Earnings Mar','Earnings Apr','Earnings May','Earnings Jun','Earnings Jul','Earnings Aug'] if c in df.columns]
    forecast_months = ['Forecast Sept','Forecast Oct','Forecast Nov','Forecast Dec']

    # If there are no earnings columns, create zero columns to allow downstream logic to run
    if len(earnings_cols) == 0:
        for c in ['Earnings Jan','Earnings Feb','Earnings Mar','Earnings Apr','Earnings May','Earnings Jun','Earnings Jul','Earnings Aug']:
            df[c] = 0.0
        earnings_cols = ['Earnings Jan','Earnings Feb','Earnings Mar','Earnings Apr','Earnings May','Earnings Jun','Earnings Jul','Earnings Aug']

    # For forecasting, if base features are missing or have NaNs, fill with zeros to prevent model crashes
    for f in base_features:
        df[f] = df[f].fillna(0)

    for month in forecast_months:
        feature_cols = earnings_cols + base_features
        # Ensure feature columns exist
        for col in feature_cols:
            if col not in df.columns:
                df[col] = 0.0

        X = df[feature_cols].copy()
        # target: use last available earnings column if present
        y_col = earnings_cols[-1] if len(earnings_cols) > 0 else None
        if y_col and y_col in df.columns:
            y = df[y_col].fillna(0)
        else:
            y = np.zeros(len(df))

        # Train model safely
        try:
            model = GradientBoostingRegressor(n_estimators=200, random_state=42)
            model.fit(X, y)
            df[month] = model.predict(X).round(2)
        except Exception:
            # fallback: copy previous month's earnings or set zeros
            df[month] = df[earnings_cols[-1]] if (earnings_cols and earnings_cols[-1] in df.columns) else 0.0
        earnings_cols.append(month)

    # 3. NOVA SCORE CALCULATION ===============================================
    def calculate_nova_score(row):
        score = 0
        score += (row.get("sentiment",0)/5)*300
        score += row.get("On-Time Rate",0)*250
        score += min(row.get("Trip Volume",0)/200,1)*100
        earnings_cols_for_avg = [
            'Earnings Jan','Earnings Feb','Earnings Mar','Earnings Apr',
            'Earnings May','Earnings Jun','Earnings Jul','Earnings Aug',
            'Forecast Sept','Forecast Oct','Forecast Nov','Forecast Dec'
        ]
        avg_earnings = np.mean([row[c] for c in earnings_cols_for_avg if c in row])
        score += min(avg_earnings/3000,1)*150
        risk_map = {"low":1,"medium":2,"high":3}
        numeric_risk = risk_map.get(str(row.get("Risk Level","medium")).lower(),2)
        score -= (numeric_risk/3)*200
        score -= row.get("Cancellation Rate",0)*150
        score += row.get("Vehicle Condition",0)/100*50
        score -= min(row.get("Leaves Taken",0)/10,1)*20
        score += row.get("Avg Rating",0)/5*70
        min_raw, max_raw = -370, 920
        scaled = ((score-min_raw)/(max_raw-min_raw))*1000
        return int(np.clip(scaled,0,1000))

    df["Nova Score"] = df.apply(calculate_nova_score, axis=1) #

    return df