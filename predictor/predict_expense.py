import sys
import pandas as pd
import json
from datetime import datetime
import warnings
warnings.filterwarnings("ignore")

try:
    raw_input = sys.stdin.read().strip()
    if not raw_input:
        print(json.dumps({"prediction": 0, "growth": 0}))
        sys.exit()

    data = json.loads(raw_input)
    df = pd.DataFrame(data)

    if df.empty:
        print(json.dumps({"prediction": 0, "growth": 0}))
        sys.exit()

    df["date"] = pd.to_datetime(df["date"])
    df = df[df["type"] == "expense"]

    if df.empty:
        print(json.dumps({"prediction": 0, "growth": 0}))
        sys.exit()

    df["month"] = df["date"].dt.to_period("M")
    monthly = df.groupby("month")["amount"].sum().reset_index()

    if len(monthly) < 2:
        prediction = float(monthly["amount"].iloc[-1]) if len(monthly) > 0 else 0.0
        growth = 0.0
    else:
        monthly["growth"] = monthly["amount"].pct_change()
        avg_growth = monthly["growth"].mean()
        last_amount = float(monthly["amount"].iloc[-1])
        prediction = last_amount * (1 + avg_growth if pd.notnull(avg_growth) else 1)
        growth = float(avg_growth * 100) if pd.notnull(avg_growth) else 0.0

    # ✅ Convert numpy.int64/float64 safely to Python float
    result = {
        "prediction": float(round(prediction, 2)),
        "growth": float(round(growth, 2))
    }

    print(json.dumps(result))

except Exception as e:
    print(f"Error in Python: {e}", file=sys.stderr)
