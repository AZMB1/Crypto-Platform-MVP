# File Storage Structure

This document describes the file storage layout for training data and ML models on Railway's persistent volume.

## Overview

- **Location**: Railway backend service persistent volume mounted at `/app`
- **Total Size**: ~10 GB (4-5 GB for data, ~500 MB for models)
- **Backup**: Automatic snapshots by Railway
- **Access**: Direct filesystem access by ML training scripts and inference workers

## Directory Structure

```
/app/
├── data/                          # Training OHLCV data (~4-5 GB)
│   ├── X_BTCUSD/
│   │   ├── 1h_ohlcv.parquet      # 1 year of hourly candles
│   │   ├── 4h_ohlcv.parquet      # 3 years of 4-hour candles
│   │   ├── 1d_ohlcv.parquet      # 5 years of daily candles
│   │   ├── 1w_ohlcv.parquet      # 10 years of weekly candles
│   │   └── 1m_ohlcv.parquet      # 10 years of monthly candles
│   ├── X_ETHUSD/
│   │   └── ... (5 timeframe files)
│   ├── X_SOLUSD/
│   │   └── ... (5 timeframe files)
│   └── ... (500 coin folders total)
└── models/                        # Trained ML models (~500 MB)
    ├── 1h_v1.0.pkl               # 1-hour timeframe model
    ├── 4h_v1.0.pkl               # 4-hour timeframe model
    ├── 1d_v1.0.pkl               # 1-day timeframe model
    ├── 1w_v1.0.pkl               # 1-week timeframe model
    └── 1m_v1.0.pkl               # 1-month timeframe model
```

## Data Files (`/app/data/`)

### Format: Parquet
- Columnar storage format
- High compression ratio (~10x vs CSV)
- Fast read/write performance
- Native support in pandas/polars

### Structure
- **One folder per coin** (500 folders for top 500 by USD volume)
- **Five files per coin** (one per timeframe)
- **Total files**: 500 coins × 5 timeframes = 2,500 Parquet files

### Columns in Each Parquet File
```python
{
    'timestamp': datetime64,  # Unix timestamp converted to datetime
    'open': float64,          # Opening price
    'high': float64,          # Highest price
    'low': float64,           # Lowest price
    'close': float64,         # Closing price
    'volume': float64,        # Trading volume (in tokens)
    'vwap': float64          # Volume-Weighted Average Price
}
```

### Data Retention by Timeframe
| Timeframe | Data Retention | Approximate Rows | File Size |
|-----------|---------------|------------------|-----------|
| 1h        | 1 year        | ~8,760           | ~3-4 MB   |
| 4h        | 3 years       | ~6,570           | ~2-3 MB   |
| 1d        | 5 years       | ~1,825           | ~1-2 MB   |
| 1w        | 10 years      | ~520             | ~500 KB   |
| 1m        | 10 years      | ~120             | ~200 KB   |

### Weekly Update Process
1. **Read existing file** (e.g., `X_BTCUSD/1d_ohlcv.parquet`)
2. **Fetch new data** from Polygon.io (last 7 days only)
3. **Clean new data** (remove duplicates, handle missing values)
4. **Append** new candles to existing dataframe
5. **Overwrite file** with combined data

```python
# Example update flow
import pandas as pd

# Load existing data
df_existing = pd.read_parquet('/app/data/X_BTCUSD/1d_ohlcv.parquet')
# -> 1,825 rows (5 years)

# Fetch new data (7 days)
df_new = fetch_from_polygon('X:BTCUSD', '1d', last_7_days=True)
# -> 7 new rows

# Combine and save
df_combined = pd.concat([df_existing, df_new]).drop_duplicates(subset='timestamp')
df_combined.to_parquet('/app/data/X_BTCUSD/1d_ohlcv.parquet')
# -> 1,832 rows total
```

## Model Files (`/app/models/`)

### Format: Pickle (.pkl)
- Serialized Python objects
- Contains trained XGBoost/ensemble models
- Includes feature scalers and preprocessing pipelines

### Naming Convention
```
{timeframe}_v{version}.pkl
```
Examples:
- `1h_v1.0.pkl` - Version 1.0 of the 1-hour model
- `1d_v2.1.pkl` - Version 2.1 of the 1-day model

### Model Contents
Each `.pkl` file contains a dictionary:
```python
{
    'model': <trained_model>,           # XGBoost or ensemble model
    'scaler': <feature_scaler>,         # StandardScaler for normalization
    'feature_names': [...],             # List of feature column names
    'training_config': {...},           # Hyperparameters and settings
    'metadata': {
        'version': '1.0',
        'timeframe': '1d',
        'trained_at': datetime,
        'num_symbols': 500,
        'accuracy': 0.68,
        'feature_count': 152
    }
}
```

### Version Management
- **Active model**: Referenced in `models` database table with `is_active = true`
- **Model path**: Stored in database (`model_path = '/models/1d_v1.0.pkl'`)
- **Old versions**: Kept temporarily for rollback, then deleted after validation

## Usage in Code

### Reading Training Data
```python
import pandas as pd

def load_training_data(ticker: str, timeframe: str) -> pd.DataFrame:
    """Load OHLCV training data for a specific ticker and timeframe"""
    file_path = f'/app/data/{ticker}/{timeframe}_ohlcv.parquet'
    return pd.read_parquet(file_path)

# Example
btc_daily = load_training_data('X_BTCUSD', '1d')
```

### Loading ML Model
```python
import pickle

def load_model(timeframe: str, version: str = 'v1.0'):
    """Load trained ML model for a specific timeframe"""
    model_path = f'/app/models/{timeframe}_{version}.pkl'
    with open(model_path, 'rb') as f:
        return pickle.load(f)

# Example
model_data = load_model('1d')
model = model_data['model']
scaler = model_data['scaler']
```

## Important Notes

### ⚠️ NOT in Git Repository
- These files live **only on Railway's volume**
- Never committed to GitHub (too large, binary data)
- `.gitignore` excludes any local `/data` or `/models` directories

### ✅ Persistence
- Volume survives service redeployments
- Data persists until explicitly deleted
- Automatic backups by Railway

### 🔄 Initialization
- On first deployment, directories are empty
- Training script (Step 4/6) will:
  1. Create directory structure
  2. Fetch historical data from Polygon.io
  3. Save initial Parquet files
  4. Train initial models

### 📊 Monitoring
- Track total disk usage via Railway dashboard
- Current allocation: 10 GB
- Can be expanded if needed

## Next Steps

In **Step 4** and **Step 6**, we'll create Python scripts that:
1. Initialize directory structure
2. Fetch historical OHLCV data
3. Save to Parquet format
4. Train ML models
5. Save model files
6. Update database with model metadata

These scripts will be triggered by:
- **Initial setup**: Manual run to populate data
- **Weekly updates**: Scheduled cron job (Sunday 2 AM UTC)

