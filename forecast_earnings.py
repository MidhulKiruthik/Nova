import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor

# -------------------------------
# 1. Load dataset
# -------------------------------
file_path = r"C:\Users\adhar\OneDrive\Desktop\Grab\partner_dataset_final_sentiment.xlsx"
df = pd.read_excel(file_path)

# Clean column names
df.columns = df.columns.str.strip()

# -------------------------------
# 2. Define features and forecast months
# -------------------------------
base_features = [
    'Trip Volume','On-Time Rate','Leaves Taken','Vehicle Condition',
    'Avg Rating','Cancellation Rate','sentiment'
]

# Past earnings columns (will expand as we add forecasts)
earnings_cols = [
    'Earnings Jan','Earnings Feb','Earnings Mar','Earnings Apr',
    'Earnings May','Earnings Jun','Earnings Jul','Earnings Aug'
]

forecast_months = ['Forecast Sept','Forecast Oct','Forecast Nov','Forecast Dec']

# -------------------------------
# 3. Progressive forecasting
# -------------------------------
for month in forecast_months:
    # Features = past earnings + static features
    feature_cols = earnings_cols + base_features
    X = df[feature_cols]

    # Train model to predict next month (approximate with last known earnings col)
    model = GradientBoostingRegressor(n_estimators=200, random_state=42)
    model.fit(X, df[earnings_cols[-1]])

    # Forecast
    df[month] = model.predict(X).round(2)

    # Treat this forecast as "real" for the next step
    earnings_cols.append(month)

# -------------------------------
# 4. Save final file
# -------------------------------
output_file = r"C:\Users\adhar\OneDrive\Desktop\Grab\partner_dataset_ml_forecast.xlsx"
df.to_excel(output_file, index=False)

print(f"✅ Progressive forecast saved: {output_file}")
