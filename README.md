# Recipe Hub - مطبخ رضوى

موقع وصفات منزلي ثنائي اللغة (عربي/إنجليزي) مع دعم الاستخراج التلقائي من روابط الفيديو.

## الروابط

- **الموقع:** https://recipes.alkamali.uk
- **API Worker:** https://recipe-hub-api.c9tpq8kr9t.workers.dev

## هيكل المشروع

```
recipe-hub/
├── api/              # Cloudflare Worker (API Backend)
│   ├── src/index.js  # كل الـ endpoints
│   └── wrangler.toml
├── frontend/         # Next.js App
│   ├── app/          # صفحات التطبيق
│   ├── components/   # المكونات
│   └── lib/api.ts    # تواصل مع الـ API
└── schema.sql        # قاعدة البيانات D1
```

## API Endpoints

### 1. إضافة طلب استخراج وصفة
```
POST /api/jobs/recipe-extract
Content-Type: application/json

{
  "source_url": "https://www.instagram.com/reel/...",
  "created_by": "radwa"
}
```

**الرد:**
```json
{
  "success": true,
  "job_id": 1,
  "status": "pending"
}
```

### 2. التحقق من حالة الطلب
```
GET /api/jobs/recipe-extract/:job_id
```

**الرد:**
```json
{
  "id": 1,
  "status": "done",
  "recipe_id": 5,
  "error_message": null
}
```

### 3. استقبال نتيجة الاستخراج (Webhook)
```
POST /api/ingest/recipe-result
x-api-key: <API_SECRET>
Content-Type: application/json

{
  "job_id": 1,
  "source_url": "https://www.instagram.com/reel/...",
  "source_platform": "instagram",
  "thumbnail_url": "https://...",
  "title_ar": "ساندوتش دجاج كريمي",
  "title_en": "Creamy Chicken Sandwich",
  "ingredients_ar": ["3 صدور دجاج", "..."],
  "ingredients_en": ["3 chicken breasts", "..."],
  "steps_ar": ["تبّلي الدجاج...", "..."],
  "steps_en": ["Season the chicken...", "..."],
  "notes_ar": "ملاحظات...",
  "notes_en": "Notes...",
  "category": "sandwich",
  "confidence_stars": 3,
  "confidence_note_ar": "وصفة مجربة ومضمونة"
}
```

### 4. إضافة وصفة مباشرة
```
POST /api/recipes/import
x-api-key: <API_SECRET>
Content-Type: application/json

{ /* نفس payload الـ webhook */ }
```

## أمثلة curl

### إرسال رابط للاستخراج
```bash
curl -X POST https://recipe-hub-api.c9tpq8kr9t.workers.dev/api/jobs/recipe-extract \
  -H "Content-Type: application/json" \
  -d '{"source_url": "https://www.instagram.com/reel/DMnMZrrNK1M/"}'
```

### التحقق من الحالة
```bash
curl https://recipe-hub-api.c9tpq8kr9t.workers.dev/api/jobs/recipe-extract/1
```

### إرسال نتيجة الاستخراج (من البوت)
```bash
curl -X POST https://recipe-hub-api.c9tpq8kr9t.workers.dev/api/ingest/recipe-result \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_SECRET" \
  -d '{
    "job_id": 1,
    "source_url": "https://www.instagram.com/reel/...",
    "source_platform": "instagram",
    "title_ar": "ساندوتش دجاج",
    "title_en": "Chicken Sandwich",
    "ingredients_ar": ["دجاج", "ثوم"],
    "ingredients_en": ["chicken", "garlic"],
    "steps_ar": ["خطوة 1"],
    "steps_en": ["Step 1"],
    "category": "sandwich",
    "confidence_stars": 3
  }'
```

## التصنيفات المدعومة

| ID | عربي | English |
|---|---|---|
| `dessert` | حلويات | Desserts |
| `lunch` | غداء | Lunch |
| `dinner` | عشاء | Dinner |
| `sandwich` | ساندوتشات | Sandwiches |
| `breakfast` | إفطار | Breakfast |
| `other` | أخرى | Other |

## إعداد البيئة

```bash
# نسخ ملف البيئة
cp .env.example .env.local

# تثبيت الاعتماديات
cd frontend && pnpm install

# تشغيل محلياً
pnpm dev
```

## النشر

```bash
# نشر الـ API Worker
cd api && wrangler deploy

# نشر الـ Frontend
cd frontend && pnpm pages:build && wrangler pages deploy
```
