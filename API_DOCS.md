# توثيق API — Recipe Hub

## المعلومات الأساسية

| المعلومة | القيمة |
|---|---|
| **الموقع** | https://recipes.alkamali.uk |
| **API Base URL** | https://recipe-hub-api.c9tpq8kr9t.workers.dev |
| **GitHub** | https://github.com/zezokam/Recipe- |

---

## المصادقة

الـ endpoints المحمية تتطلب header:

```
x-api-key: bab427ee9bdf07c6bd585658775c75ccaefe3c4c
```

---

## Endpoints

### 1. إرسال رابط للاستخراج

```
POST /api/jobs/recipe-extract
```

**Body:**
```json
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

**curl:**
```bash
curl -X POST https://recipe-hub-api.c9tpq8kr9t.workers.dev/api/jobs/recipe-extract \
  -H "Content-Type: application/json" \
  -d '{"source_url": "https://www.instagram.com/reel/DMnMZrrNK1M/", "created_by": "radwa"}'
```

---

### 2. التحقق من حالة الطلب

```
GET /api/jobs/recipe-extract/:job_id
```

**الرد:**
```json
{
  "job_id": 1,
  "status": "done",
  "source_url": "https://...",
  "recipe_id": 5,
  "error_message": null,
  "created_at": "2026-03-13T09:00:00.000Z",
  "updated_at": "2026-03-13T09:01:00.000Z"
}
```

**الحالات الممكنة:** `pending` | `processing` | `done` | `failed`

**curl:**
```bash
curl https://recipe-hub-api.c9tpq8kr9t.workers.dev/api/jobs/recipe-extract/1
```

---

### 3. Webhook — استقبال نتيجة الاستخراج من البوت

```
POST /api/ingest/recipe-result
x-api-key: bab427ee9bdf07c6bd585658775c75ccaefe3c4c
```

**Body الكامل:**
```json
{
  "job_id": 1,
  "source_url": "https://www.instagram.com/reel/DMnMZrrNK1M/",
  "source_platform": "instagram",
  "thumbnail_url": "https://...",
  "title_ar": "ساندوتش دجاج كريمي بالثوم",
  "title_en": "Creamy Garlic Chicken Sandwich",
  "ingredients_ar": ["3 صدور دجاج", "كريمة طبخ", "ثوم مهروس"],
  "ingredients_en": ["3 chicken breasts", "cooking cream", "minced garlic"],
  "steps_ar": ["تبّلي الدجاج بالملح والفلفل", "شوّحي الدجاج حتى يتحمر"],
  "steps_en": ["Season chicken with salt and pepper", "Sauté until golden"],
  "notes_ar": "يمكن إضافة جبن على الوجه",
  "notes_en": "Can add cheese on top",
  "category": "sandwich",
  "confidence_stars": 3,
  "confidence_note_ar": "وصفة مجربة ومضمونة"
}
```

**الرد:**
```json
{
  "success": true,
  "status": "done",
  "recipe_id": 5
}
```

**curl:**
```bash
curl -X POST https://recipe-hub-api.c9tpq8kr9t.workers.dev/api/ingest/recipe-result \
  -H "Content-Type: application/json" \
  -H "x-api-key: bab427ee9bdf07c6bd585658775c75ccaefe3c4c" \
  -d '{
    "job_id": 1,
    "source_url": "https://www.instagram.com/reel/DMnMZrrNK1M/",
    "source_platform": "instagram",
    "title_ar": "ساندوتش دجاج كريمي",
    "title_en": "Creamy Chicken Sandwich",
    "ingredients_ar": ["دجاج", "ثوم", "كريمة"],
    "ingredients_en": ["chicken", "garlic", "cream"],
    "steps_ar": ["تبّلي الدجاج", "اشويه"],
    "steps_en": ["Season chicken", "Grill it"],
    "category": "sandwich",
    "confidence_stars": 3
  }'
```

---

### 4. إضافة وصفة مباشرة (بدون job)

```
POST /api/recipes/import
x-api-key: bab427ee9bdf07c6bd585658775c75ccaefe3c4c
```

نفس body الـ webhook بدون `job_id`.

---

## التصنيفات

| ID | عربي | English |
|---|---|---|
| `dessert` | حلويات | Desserts |
| `lunch` | غداء | Lunch |
| `dinner` | عشاء | Dinner |
| `sandwich` | ساندوتشات | Sandwiches |
| `breakfast` | إفطار | Breakfast |
| `other` | أخرى | Other |

## المنصات المدعومة

`instagram` | `tiktok` | `youtube`

---

## Auth Header

| الاسم | القيمة |
|---|---|
| **Header Name** | `x-api-key` |
| **Value** | `bab427ee9bdf07c6bd585658775c75ccaefe3c4c` |
