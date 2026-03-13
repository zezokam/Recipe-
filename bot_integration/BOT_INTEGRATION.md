# دليل ربط البوت — Recipe Hub

## المعلومات الأساسية

| المعلومة | القيمة |
|---|---|
| **API Base URL** | `https://recipe-hub-api.c9tpq8kr9t.workers.dev` |
| **Auth Header** | `x-api-key` |
| **Auth Value** | `bab427ee9bdf07c6bd585658775c75ccaefe3c4c` |

---

## تدفق العمل الكامل

```
1. المستخدم يرسل رابط للبوت
2. البوت يستخرج الوصفة
3. البوت يرسل النتيجة لـ POST /api/ingest/recipe-result
4. الوصفة تظهر تلقائياً في الموقع
```

---

## Endpoint الرئيسي للبوت

### استقبال نتيجة الاستخراج

```
POST /api/ingest/recipe-result
```

**Headers:**
```
Content-Type: application/json
x-api-key: bab427ee9bdf07c6bd585658775c75ccaefe3c4c
```

**Body الكامل (JSON):**
```json
{
  "job_id": 1,
  "source_url": "https://www.instagram.com/reel/DMnMZrrNK1M/?igsh=Znp2dTNlNHZnajdv",
  "source_platform": "instagram",
  "thumbnail_url": "https://رابط_الصورة_المصغرة",
  "title_ar": "ساندوتش/خبز بالدجاج وصوص كريمي بالثوم",
  "title_en": "Chicken Sandwich with Creamy Garlic Sauce",
  "ingredients_ar": [
    "3 صدور دجاج",
    "ملح + فلفل أسود + بابريكا",
    "1 ملعقة كبيرة زبدة",
    "2 فص ثوم مهروس",
    "1.5 كوب كريمة طبخ",
    "1–2 ملعقة كبيرة بقدونس مفروم",
    "خبز (صامولي/توست/خبز ساندوتش)",
    "جبن مبشور للوجه"
  ],
  "ingredients_en": [
    "3 chicken breasts",
    "Salt + black pepper + paprika",
    "1 tbsp butter",
    "2 cloves garlic, minced",
    "1.5 cups cooking cream",
    "1–2 tbsp chopped parsley",
    "Bread (sandwich rolls or toast)",
    "Shredded cheese for topping"
  ],
  "steps_ar": [
    "تبّلي الدجاج بالملح والفلفل الأسود والبابريكا.",
    "شوّحي الدجاج في مقلاة على نار متوسطة حتى يتحمر ويستوي تمامًا.",
    "ارفعي الدجاج وقطّعيه شرائح أو مكعبات.",
    "في نفس المقلاة أضيفي الزبدة ثم الثوم وقلّبي 30 ثانية.",
    "أضيفي كريمة الطبخ والملح والبقدونس ورشة الجبن، وقلّبي حتى يتماسك الصوص قليلًا.",
    "جهّزي الخبز، وزّعي الصوص ثم الدجاج.",
    "أضيفي الجبن على الوجه.",
    "أدخليه الفرن قليلًا حتى يتحمص الخبز ويذوب الجبن."
  ],
  "steps_en": [
    "Season the chicken with salt, black pepper, and paprika.",
    "Cook in a pan over medium heat until fully cooked and golden.",
    "Remove and slice/cut the chicken.",
    "In the same pan, add butter, then garlic; stir for 30 seconds.",
    "Add cooking cream, salt, parsley, and a little cheese; stir until slightly thickened.",
    "Prepare the bread, spread sauce, then add chicken.",
    "Add shredded cheese on top.",
    "Bake briefly until the bread is toasted and cheese is melted."
  ],
  "notes_ar": "يمكن إضافة جبن إضافي داخل الساندوتش قبل التحميص. يقدّم مع بطاطس أو سلطة.",
  "notes_en": "You can add extra cheese inside the sandwich before toasting. Serve with fries or salad.",
  "category": "sandwich",
  "confidence_stars": 3,
  "confidence_note_ar": "وصفة مجربة ومضمونة"
}
```

**الرد عند النجاح:**
```json
{
  "success": true,
  "status": "done",
  "recipe_id": 5
}
```

**الرد عند الفشل:**
```json
{
  "error": "Unauthorized"
}
```

---

## حقول اختيارية

| الحقل | النوع | الوصف |
|---|---|---|
| `job_id` | number | رقم الطلب (إذا جاء من واجهة الموقع) |
| `thumbnail_url` | string | رابط الصورة المصغرة للفيديو |
| `notes_ar` | string | ملاحظات بالعربي |
| `notes_en` | string | ملاحظات بالإنجليزي |
| `confidence_note_ar` | string | وصف مستوى الثقة |

---

## التصنيفات المدعومة (category)

| القيمة | عربي | English |
|---|---|---|
| `sandwich` | ساندوتشات | Sandwiches |
| `dessert` | حلويات | Desserts |
| `lunch` | غداء | Lunch |
| `dinner` | عشاء | Dinner |
| `breakfast` | إفطار | Breakfast |
| `other` | أخرى | Other |

> إذا أرسلت قيمة غير معروفة، سيتم تصنيفها تلقائياً بناءً على كلمات مفتاحية في العنوان.

---

## المنصات المدعومة (source_platform)

`instagram` | `tiktok` | `youtube`

---

## مثال Python للبوت

```python
import requests

API_URL = "https://recipe-hub-api.c9tpq8kr9t.workers.dev"
API_KEY = "bab427ee9bdf07c6bd585658775c75ccaefe3c4c"

def send_recipe_to_site(recipe_data: dict, job_id: int = None):
    """إرسال وصفة مستخرجة إلى الموقع"""
    if job_id:
        recipe_data["job_id"] = job_id
    
    response = requests.post(
        f"{API_URL}/api/ingest/recipe-result",
        json=recipe_data,
        headers={
            "Content-Type": "application/json",
            "x-api-key": API_KEY
        }
    )
    return response.json()

# مثال استخدام
recipe = {
    "source_url": "https://www.instagram.com/reel/DMnMZrrNK1M/",
    "source_platform": "instagram",
    "title_ar": "ساندوتش دجاج كريمي",
    "title_en": "Creamy Chicken Sandwich",
    "ingredients_ar": ["دجاج", "ثوم", "كريمة"],
    "ingredients_en": ["chicken", "garlic", "cream"],
    "steps_ar": ["تبّلي الدجاج", "اشويه", "أضيفي الصوص"],
    "steps_en": ["Season", "Grill", "Add sauce"],
    "category": "sandwich",
    "confidence_stars": 3
}

result = send_recipe_to_site(recipe)
print(result)  # {"success": true, "status": "done", "recipe_id": 5}
```

---

## مثال curl

```bash
curl -X POST https://recipe-hub-api.c9tpq8kr9t.workers.dev/api/ingest/recipe-result \
  -H "Content-Type: application/json" \
  -H "x-api-key: bab427ee9bdf07c6bd585658775c75ccaefe3c4c" \
  -d '{
    "source_url": "https://www.instagram.com/reel/DMnMZrrNK1M/",
    "source_platform": "instagram",
    "title_ar": "ساندوتش دجاج كريمي",
    "title_en": "Creamy Chicken Sandwich",
    "ingredients_ar": ["دجاج", "ثوم"],
    "ingredients_en": ["chicken", "garlic"],
    "steps_ar": ["خطوة 1"],
    "steps_en": ["Step 1"],
    "category": "sandwich",
    "confidence_stars": 3
  }'
```

---

## إذا أردت إرسال رابط من الموقع أولاً (اختياري)

```bash
# 1. إنشاء job
curl -X POST https://recipe-hub-api.c9tpq8kr9t.workers.dev/api/jobs/recipe-extract \
  -H "Content-Type: application/json" \
  -d '{"source_url": "https://www.instagram.com/reel/...", "created_by": "radwa"}'
# الرد: {"success": true, "job_id": 1, "status": "pending"}

# 2. إرسال النتيجة مع job_id
curl -X POST https://recipe-hub-api.c9tpq8kr9t.workers.dev/api/ingest/recipe-result \
  -H "Content-Type: application/json" \
  -H "x-api-key: bab427ee9bdf07c6bd585658775c75ccaefe3c4c" \
  -d '{"job_id": 1, ...}'
```
