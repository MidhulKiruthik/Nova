import pandas as pd
import numpy as np
import ast
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.ensemble import GradientBoostingRegressor


def process_partner_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Full pipeline: Sentiment analysis, progressive forecasting, Nova Score.
    Matches the logic of your standalone script.
    """
    # --- 1. CLEAN COLUMNS ---
    df.columns = df.columns.str.strip()

    # --- 2. PARSE REVIEWS ---
    if "reviews" in df.columns and isinstance(df["reviews"].iloc[0], str):
        df["reviews"] = df["reviews"].apply(lambda x: ast.literal_eval(x))

    # --- 3. RULE-BASED SENTIMENT ---
    def rule_based_sentiment(text: str) -> float:
        lower = text.lower()
        score = 2.5  # neutral
        positive = [
            "excellent", "great", "good", "professional", "friendly",
            "on time", "clean", "smooth", "happy", "fantastic", "best",
            "safe", "courteous", "pleasant", "reliable", "efficient", "punctual"
        ]
        negative = [
            "poor", "bad", "late", "distracted", "rude", "unprofessional",
            "dirty", "long route", "unhappy", "cancel", "terrible",
            "unacceptable", "delays", "tired"
        ]
        for p in positive:
            if p in lower:
                score += 0.5
        for n in negative:
            if n in lower:
                score -= 0.5
        return float(np.clip(score, 0, 5))

    # --- 4. EXPAND REVIEWS INTO ROWS ---
    all_reviews = []
    for partner_id, reviews in zip(df["ID"], df["reviews"]):
        for r in reviews:
            all_reviews.append({
                "partner_id": partner_id,
                "review": r,
                "label": rule_based_sentiment(r)
            })
    reviews_df = pd.DataFrame(all_reviews)

    # --- 5. TRAIN TFIDF + RIDGE ON RULE-BASED LABELS ---
    ml_model = Pipeline([
        ("tfidf", TfidfVectorizer(max_features=5000, ngram_range=(1, 2))),
        ("regressor", Ridge(solver="lsqr"))
    ])
    ml_model.fit(reviews_df["review"], reviews_df["label"])

    # --- 6. PREDICT SENTIMENT & AVERAGE PER PARTNER ---
    reviews_df["pred_score"] = ml_model.predict(reviews_df["review"]).clip(0, 5)
    partner_sentiment = reviews_df.groupby("partner_id")["pred_score"].mean().reset_index()
    partner_sentiment.columns = ["ID", "sentiment"]

    df = df.drop(columns=["sentiment"], errors="ignore")
    df = df.merge(partner_sentiment, on="ID", how="left")

    # --- 7. PROGRESSIVE FORECASTING ---
    base_features = [
        'Trip Volume', 'On-Time Rate', 'Leaves Taken',
        'Vehicle Condition', 'Avg Rating', 'Cancellation Rate', 'sentiment'
    ]
    earnings_cols = [
        'Earnings Jan', 'Earnings Feb', 'Earnings Mar', 'Earnings Apr',
        'Earnings May', 'Earnings Jun', 'Earnings Jul', 'Earnings Aug'
    ]
    forecast_months = ['Forecast Sept', 'Forecast Oct', 'Forecast Nov', 'Forecast Dec']

    for month in forecast_months:
        feature_cols = earnings_cols + base_features
        X = df[feature_cols].copy()
        y = df[earnings_cols[-1]]

        model = GradientBoostingRegressor(n_estimators=200, random_state=42)
        model.fit(X, y)
        df[month] = model.predict(X).round(2)

        earnings_cols.append(month)

    # --- 8. NOVA SCORE CALCULATION ---
    def calculate_nova_score(row):
        score = 0
        score += (row.get("sentiment", 0) / 5) * 300
        score += row.get("On-Time Rate", 0) * 250
        score += min(row.get("Trip Volume", 0) / 200, 1) * 100

        earnings_cols_for_avg = [
            'Earnings Jan', 'Earnings Feb', 'Earnings Mar', 'Earnings Apr',
            'Earnings May', 'Earnings Jun', 'Earnings Jul', 'Earnings Aug',
            'Forecast Sept', 'Forecast Oct', 'Forecast Nov', 'Forecast Dec'
        ]
        avg_earnings = np.mean([row[c] for c in earnings_cols_for_avg if c in row])
        score += min(avg_earnings / 3000, 1) * 150

        risk_map = {"low": 1, "medium": 2, "high": 3}
        numeric_risk = risk_map.get(str(row.get("Risk Level", "medium")).lower(), 2)
        score -= (numeric_risk / 3) * 200

        score -= row.get("Cancellation Rate", 0) * 150
        score += row.get("Vehicle Condition", 0) / 100 * 50
        score -= min(row.get("Leaves Taken", 0) / 10, 1) * 20
        score += row.get("Avg Rating", 0) / 5 * 70

        min_raw, max_raw = -370, 920
        scaled = ((score - min_raw) / (max_raw - min_raw)) * 1000
        return int(np.clip(scaled, 0, 1000))

    df["Nova Score"] = df.apply(calculate_nova_score, axis=1)

    return df
