-- جدول الوصفات الرئيسي
CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_platform TEXT CHECK(source_platform IN ('instagram','tiktok','youtube')) NOT NULL,
  source_url TEXT UNIQUE NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  ingredients_ar TEXT NOT NULL DEFAULT '[]',
  ingredients_en TEXT NOT NULL DEFAULT '[]',
  steps_ar TEXT NOT NULL DEFAULT '[]',
  steps_en TEXT NOT NULL DEFAULT '[]',
  notes_ar TEXT DEFAULT '',
  notes_en TEXT DEFAULT '',
  category TEXT CHECK(category IN ('dessert','lunch','dinner','sandwich','breakfast','other')) NOT NULL DEFAULT 'other',
  confidence_stars INTEGER CHECK(confidence_stars IN (1,2,3)) NOT NULL DEFAULT 2,
  confidence_note_ar TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  is_published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- جدول طلبات الاستخراج
CREATE TABLE IF NOT EXISTS recipe_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_url TEXT UNIQUE NOT NULL,
  status TEXT CHECK(status IN ('pending','processing','done','failed')) NOT NULL DEFAULT 'pending',
  error_message TEXT DEFAULT NULL,
  created_by TEXT DEFAULT NULL,
  recipe_id INTEGER DEFAULT NULL REFERENCES recipes(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- إنشاء indexes
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_is_published ON recipes(is_published);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at);
CREATE INDEX IF NOT EXISTS idx_recipe_jobs_status ON recipe_jobs(status);
CREATE INDEX IF NOT EXISTS idx_recipe_jobs_source_url ON recipe_jobs(source_url);
