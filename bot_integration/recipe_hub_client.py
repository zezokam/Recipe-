"""
Recipe Hub API Client
يستخدم هذا الملف في البوت لإرسال الوصفات المستخرجة إلى الموقع
"""

import requests
from typing import Optional

# ─── الإعدادات ───────────────────────────────────────────────
API_URL = "https://recipe-hub-api.c9tpq8kr9t.workers.dev"
API_KEY = "bab427ee9bdf07c6bd585658775c75ccaefe3c4c"

HEADERS = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY
}

# ─── التصنيفات ───────────────────────────────────────────────
CATEGORIES = {
    "sandwich": "ساندوتشات",
    "dessert": "حلويات",
    "lunch": "غداء",
    "dinner": "عشاء",
    "breakfast": "إفطار",
    "other": "أخرى"
}

# ─── الدوال ──────────────────────────────────────────────────

def send_recipe(
    source_url: str,
    source_platform: str,
    title_ar: str,
    title_en: str,
    ingredients_ar: list,
    ingredients_en: list,
    steps_ar: list,
    steps_en: list,
    category: str = "other",
    confidence_stars: int = 2,
    thumbnail_url: Optional[str] = None,
    notes_ar: Optional[str] = None,
    notes_en: Optional[str] = None,
    confidence_note_ar: Optional[str] = None,
    job_id: Optional[int] = None
) -> dict:
    """
    إرسال وصفة مستخرجة إلى الموقع

    المعاملات:
        source_url: رابط الفيديو الأصلي
        source_platform: instagram | tiktok | youtube
        title_ar: اسم الوصفة بالعربي
        title_en: اسم الوصفة بالإنجليزي
        ingredients_ar: قائمة المكونات بالعربي
        ingredients_en: قائمة المكونات بالإنجليزي
        steps_ar: خطوات التحضير بالعربي
        steps_en: خطوات التحضير بالإنجليزي
        category: التصنيف (sandwich/dessert/lunch/dinner/breakfast/other)
        confidence_stars: مستوى الثقة (1/2/3)
        thumbnail_url: رابط الصورة المصغرة (اختياري)
        notes_ar: ملاحظات بالعربي (اختياري)
        notes_en: ملاحظات بالإنجليزي (اختياري)
        confidence_note_ar: وصف مستوى الثقة (اختياري)
        job_id: رقم الطلب إذا جاء من واجهة الموقع (اختياري)

    الرد:
        {"success": True, "status": "done", "recipe_id": 5}
    """
    payload = {
        "source_url": source_url,
        "source_platform": source_platform,
        "title_ar": title_ar,
        "title_en": title_en,
        "ingredients_ar": ingredients_ar,
        "ingredients_en": ingredients_en,
        "steps_ar": steps_ar,
        "steps_en": steps_en,
        "category": category,
        "confidence_stars": confidence_stars
    }

    # إضافة الحقول الاختيارية
    if thumbnail_url:
        payload["thumbnail_url"] = thumbnail_url
    if notes_ar:
        payload["notes_ar"] = notes_ar
    if notes_en:
        payload["notes_en"] = notes_en
    if confidence_note_ar:
        payload["confidence_note_ar"] = confidence_note_ar
    if job_id:
        payload["job_id"] = job_id

    response = requests.post(
        f"{API_URL}/api/ingest/recipe-result",
        json=payload,
        headers=HEADERS,
        timeout=30
    )
    response.raise_for_status()
    return response.json()


def create_job(source_url: str, created_by: str = "bot") -> dict:
    """
    إنشاء طلب استخراج جديد (اختياري — للتتبع من الموقع)

    الرد:
        {"success": True, "job_id": 1, "status": "pending"}
    """
    response = requests.post(
        f"{API_URL}/api/jobs/recipe-extract",
        json={"source_url": source_url, "created_by": created_by},
        headers={"Content-Type": "application/json"},
        timeout=30
    )
    response.raise_for_status()
    return response.json()


def get_job_status(job_id: int) -> dict:
    """
    التحقق من حالة طلب الاستخراج

    الرد:
        {"job_id": 1, "status": "done", "recipe_id": 5, ...}
    """
    response = requests.get(
        f"{API_URL}/api/jobs/recipe-extract/{job_id}",
        timeout=30
    )
    response.raise_for_status()
    return response.json()


# ─── مثال استخدام ────────────────────────────────────────────
if __name__ == "__main__":
    # مثال: إرسال وصفة مباشرة
    result = send_recipe(
        source_url="https://www.instagram.com/reel/DMnMZrrNK1M/",
        source_platform="instagram",
        title_ar="ساندوتش دجاج كريمي بالثوم",
        title_en="Creamy Garlic Chicken Sandwich",
        ingredients_ar=[
            "3 صدور دجاج",
            "ملح + فلفل أسود + بابريكا",
            "1 ملعقة كبيرة زبدة",
            "2 فص ثوم مهروس",
            "1.5 كوب كريمة طبخ",
            "خبز ساندوتش",
            "جبن مبشور"
        ],
        ingredients_en=[
            "3 chicken breasts",
            "Salt + black pepper + paprika",
            "1 tbsp butter",
            "2 cloves garlic, minced",
            "1.5 cups cooking cream",
            "Sandwich bread",
            "Shredded cheese"
        ],
        steps_ar=[
            "تبّلي الدجاج بالملح والفلفل الأسود والبابريكا.",
            "شوّحي الدجاج حتى يتحمر ويستوي.",
            "أضيفي الزبدة والثوم وقلّبي 30 ثانية.",
            "أضيفي كريمة الطبخ وقلّبي حتى يتماسك الصوص.",
            "جهّزي الخبز وزّعي الصوص والدجاج والجبن.",
            "أدخليه الفرن حتى يتحمص."
        ],
        steps_en=[
            "Season chicken with salt, pepper, and paprika.",
            "Sauté until golden and cooked through.",
            "Add butter and garlic, stir 30 seconds.",
            "Add cream and stir until thickened.",
            "Assemble bread with sauce, chicken, and cheese.",
            "Bake until toasted."
        ],
        category="sandwich",
        confidence_stars=3,
        notes_ar="يقدّم مع بطاطس أو سلطة.",
        notes_en="Serve with fries or salad.",
        confidence_note_ar="وصفة مجربة ومضمونة"
    )

    print("النتيجة:", result)
    # {"success": True, "status": "done", "recipe_id": 5}
