import os
import requests
import json

ACCOUNT_ID = "5442b9c0126cf8a946b5ce7962a03e7c"
DB_ID = "3af7fc8c-9519-44ec-bb1f-8c6350c63ef8"
TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN")

BASE_URL = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DB_ID}/query"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def run_sql(sql, label=""):
    resp = requests.post(BASE_URL, headers=HEADERS, json={"sql": sql})
    data = resp.json()
    if data.get("success"):
        print(f"✅ {label}: OK")
    else:
        print(f"❌ {label}: {data.get('errors')}")
    return data.get("success", False)

# Drop existing tables if needed (fresh start)
run_sql("DROP TABLE IF EXISTS recipe_jobs", "drop recipe_jobs")
run_sql("DROP TABLE IF EXISTS recipes", "drop recipes")

# Create recipes table
run_sql("""
CREATE TABLE recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_platform TEXT NOT NULL,
  source_url TEXT UNIQUE NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  ingredients_ar TEXT NOT NULL DEFAULT '[]',
  ingredients_en TEXT NOT NULL DEFAULT '[]',
  steps_ar TEXT NOT NULL DEFAULT '[]',
  steps_en TEXT NOT NULL DEFAULT '[]',
  notes_ar TEXT DEFAULT '',
  notes_en TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'other',
  confidence_stars INTEGER NOT NULL DEFAULT 2,
  confidence_note_ar TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  is_published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
""", "create recipes")

# Create recipe_jobs table
run_sql("""
CREATE TABLE recipe_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_url TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT DEFAULT NULL,
  created_by TEXT DEFAULT NULL,
  recipe_id INTEGER DEFAULT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
""", "create recipe_jobs")

# Create indexes
run_sql("CREATE INDEX idx_recipes_category ON recipes(category)", "idx_category")
run_sql("CREATE INDEX idx_recipes_published ON recipes(is_published)", "idx_published")
run_sql("CREATE INDEX idx_recipes_created ON recipes(created_at)", "idx_created")
run_sql("CREATE INDEX idx_jobs_status ON recipe_jobs(status)", "idx_jobs_status")

# Verify tables
resp = requests.post(BASE_URL, headers=HEADERS, json={"sql": "SELECT name FROM sqlite_master WHERE type='table'"})
data = resp.json()
if data.get("success"):
    tables = [r["name"] for r in data["result"][0]["results"]]
    print(f"\n📋 Tables in DB: {tables}")
else:
    print(f"❌ Could not list tables: {data.get('errors')}")
