import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
import ast
import re

# -------------------------------
# 1. Load Dataset
# -------------------------------
file_path = r"C:\Users\adhar\OneDrive\Desktop\Grab\partner_dataset_with_reviews.xlsx"
df = pd.read_excel(file_path)

# Parse reviews column into list if needed
if isinstance(df["reviews"].iloc[0], str):
    def safe_eval(x):
        try:
            return ast.literal_eval(x)
        except:
            return []
    df["reviews"] = df["reviews"].apply(safe_eval)

# -------------------------------
# 2. Weak Labeling Function
# -------------------------------
def rule_based_sentiment(text: str) -> float:
    """Assigns a sentiment score (0-5) based on keywords."""
    lower = text.lower()
    score = 2.5  # neutral baseline

    positive = ["excellent", "great", "good", "professional", "friendly", "on time", 
                "clean", "smooth", "happy", "fantastic", "best", "safe", "courteous", 
                "pleasant", "reliable", "efficient", "punctual"]
    negative = ["poor", "bad", "late", "distracted", "rude", "unprofessional", "dirty", 
                "long route", "unhappy", "cancel", "terrible", "unacceptable", "delays", "tired"]

    for p in positive:
        if re.search(rf"\b{re.escape(p)}\b", lower):
            score += 0.5

    for n in negative:
        if re.search(rf"\b{re.escape(n)}\b", lower):
            score -= 0.5

    return float(np.clip(score, 0, 5))

# -------------------------------
# 3. Prepare Review-Level Dataset
# -------------------------------
all_reviews = []

if "reviews" not in df.columns:
    raise ValueError("❌ 'reviews' column not found in dataset")

for partner_id, reviews in zip(df["ID"], df["reviews"]):
    # ensure reviews is a list
    if isinstance(reviews, str):
        try:
            reviews = ast.literal_eval(reviews)
        except Exception:
            reviews = [reviews]  # fallback: single string

    if not isinstance(reviews, list):
        reviews = [reviews]

    for r in reviews:
        all_reviews.append({
            "partner_id": partner_id,
            "review": str(r),
            "label": rule_based_sentiment(str(r))
        })

if not all_reviews:
    raise ValueError("❌ No reviews found in dataset — reviews_df is empty.")

reviews_df = pd.DataFrame(all_reviews)
print("✅ Built reviews_df with", len(reviews_df), "rows")

# -------------------------------
# 4. Optional: Load human-labeled subset
# -------------------------------
# Example:
# human_labeled = pd.read_csv("human_labels.csv")  # columns: review, sentiment
# reviews_df = reviews_df.merge(human_labeled, on="review", how="left")
# reviews_df["label"] = reviews_df["sentiment"].combine_first(reviews_df["label"])

# -------------------------------
# 5. Train ML Model
# -------------------------------
ml_model = Pipeline([
    ("tfidf", TfidfVectorizer(max_features=5000, ngram_range=(1,2), stop_words='english')),
    ("regressor", Ridge(solver="lsqr"))
])
ml_model.fit(reviews_df["review"], reviews_df["label"])

# -------------------------------
# 6. Predict Sentiment
# -------------------------------
reviews_df["pred_score"] = ml_model.predict(reviews_df["review"])
reviews_df["pred_score"] = reviews_df["pred_score"].clip(0, 5)

# -------------------------------
# -------------------------------
# 7. Aggregate to Partner-Level
# -------------------------------

# 7a. Aggregate sentiment
partner_sentiment = reviews_df.groupby("partner_id")["pred_score"].mean().reset_index()
partner_sentiment.columns = ["ID", "sentiment"]

# Merge sentiment
df = df.drop(columns=["sentiment"], errors="ignore")
df = df.merge(partner_sentiment, on="ID", how="left")

# 7b. Add number of reviews per partner
review_counts = reviews_df.groupby("partner_id").size().reset_index(name="review_count")

# Rename column to match main df
review_counts = review_counts.rename(columns={"partner_id": "ID"})

# Merge review counts
df = df.merge(review_counts, on="ID", how="left")


# -------------------------------
# 8. Save Final Dataset
# -------------------------------
output_file = r"C:\Users\adhar\OneDrive\Desktop\Grab\partner_dataset_final_sentiment.xlsx"
df.to_excel(output_file, index=False)
print(f"✅ Final dataset with ML sentiment saved: {output_file}")
