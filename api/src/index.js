// Recipe Hub API - Cloudflare Worker
// All endpoints for Recipe Hub

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
};

// Category auto-mapping keywords
const CATEGORY_KEYWORDS = {
  dessert: ['حلى', 'حلوى', 'كيك', 'كعك', 'بسكويت', 'شوكولا', 'تشيز كيك', 'بودينج', 'آيس كريم', 'مثلجات', 'sweet', 'cake', 'cookie', 'chocolate', 'dessert', 'pudding', 'ice cream', 'brownie', 'muffin'],
  breakfast: ['فطور', 'إفطار', 'صباح', 'بيض', 'شكشوكة', 'فول', 'حمص', 'breakfast', 'morning', 'egg', 'omelette', 'pancake', 'waffle', 'toast'],
  sandwich: ['ساندوتش', 'برجر', 'شاورما', 'هوت دوج', 'سبواي', 'sandwich', 'burger', 'wrap', 'sub', 'hotdog', 'shawarma'],
  lunch: ['غداء', 'مجبوس', 'كبسة', 'برياني', 'مندي', 'هريس', 'مرق', 'شوربة', 'سلطة', 'lunch', 'rice', 'biryani', 'soup', 'salad', 'stew', 'curry'],
  dinner: ['عشاء', 'مشوي', 'شواء', 'كباب', 'مشاوي', 'ستيك', 'dinner', 'grill', 'bbq', 'steak', 'roast'],
};

function autoCategory(titleAr = '', titleEn = '') {
  const text = (titleAr + ' ' + titleEn).toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw.toLowerCase()))) {
      return cat;
    }
  }
  return 'other';
}

function now() {
  return new Date().toISOString();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function validateApiKey(request, env) {
  const key = request.headers.get('x-api-key');
  return key === env.API_SECRET;
}

function detectPlatform(url) {
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return null;
}

function isValidUrl(url) {
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol);
  } catch {
    return false;
  }
}

// Extract thumbnail from video URL
function getThumbnail(url, platform) {
  if (platform === 'youtube') {
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  // For Instagram/TikTok, thumbnail will be set via ingest webhook
  return '';
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // ─────────────────────────────────────────────
    // POST /api/recipes/import
    // Import a fully-formed recipe (for bot automation)
    // ─────────────────────────────────────────────
    if (path === '/api/recipes/import' && method === 'POST') {
      if (!validateApiKey(request, env)) {
        return json({ error: 'Unauthorized' }, 401);
      }

      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

      const { source_platform, source_url, title_ar, title_en, ingredients_ar, ingredients_en,
              steps_ar, steps_en, notes_ar, notes_en, category, confidence_stars,
              confidence_note_ar, thumbnail_url } = body;

      // Validation
      if (!source_platform || !['instagram','tiktok','youtube'].includes(source_platform))
        return json({ error: 'source_platform must be instagram|tiktok|youtube' }, 422);
      if (!source_url || !isValidUrl(source_url))
        return json({ error: 'source_url is required and must be a valid URL' }, 422);
      if (!title_ar || !title_en)
        return json({ error: 'title_ar and title_en are required' }, 422);
      if (!Array.isArray(ingredients_ar) || !Array.isArray(ingredients_en))
        return json({ error: 'ingredients_ar and ingredients_en must be arrays' }, 422);
      if (!Array.isArray(steps_ar) || !Array.isArray(steps_en))
        return json({ error: 'steps_ar and steps_en must be arrays' }, 422);
      if (confidence_stars && ![1,2,3].includes(Number(confidence_stars)))
        return json({ error: 'confidence_stars must be 1, 2, or 3' }, 422);

      const validCategories = ['dessert','lunch','dinner','sandwich','breakfast','other'];
      const finalCategory = validCategories.includes(category) ? category : autoCategory(title_ar, title_en);
      const finalThumb = thumbnail_url || getThumbnail(source_url, source_platform);
      const ts = now();

      try {
        const result = await env.DB.prepare(`
          INSERT INTO recipes (source_platform, source_url, title_ar, title_en,
            ingredients_ar, ingredients_en, steps_ar, steps_en,
            notes_ar, notes_en, category, confidence_stars, confidence_note_ar,
            thumbnail_url, is_published, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `).bind(
          source_platform, source_url, title_ar, title_en,
          JSON.stringify(ingredients_ar), JSON.stringify(ingredients_en),
          JSON.stringify(steps_ar), JSON.stringify(steps_en),
          notes_ar || '', notes_en || '', finalCategory,
          Number(confidence_stars) || 2, confidence_note_ar || '',
          finalThumb, ts, ts
        ).run();

        return json({ success: true, id: result.meta.last_row_id }, 200);
      } catch (e) {
        if (e.message && e.message.includes('UNIQUE')) {
          return json({ error: 'Recipe with this source_url already exists', code: 'DUPLICATE' }, 409);
        }
        return json({ error: e.message }, 500);
      }
    }

    // ─────────────────────────────────────────────
    // GET /api/recipes - list published recipes
    // ─────────────────────────────────────────────
    if (path === '/api/recipes' && method === 'GET') {
      const category = url.searchParams.get('category');
      const search = url.searchParams.get('q');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '12');
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM recipes WHERE is_published = 1';
      const params = [];

      if (category && category !== 'all') {
        query += ' AND category = ?';
        params.push(category);
      }
      if (search) {
        query += ' AND (title_ar LIKE ? OR title_en LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
      const totalResult = await env.DB.prepare(countQuery).bind(...params).first();
      const total = totalResult?.total || 0;

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const { results } = await env.DB.prepare(query).bind(...params).all();

      const recipes = results.map(r => ({
        ...r,
        ingredients_ar: JSON.parse(r.ingredients_ar || '[]'),
        ingredients_en: JSON.parse(r.ingredients_en || '[]'),
        steps_ar: JSON.parse(r.steps_ar || '[]'),
        steps_en: JSON.parse(r.steps_en || '[]'),
      }));

      return json({ recipes, total, page, limit, pages: Math.ceil(total / limit) });
    }

    // ─────────────────────────────────────────────
    // GET /api/recipes/:id - single recipe
    // ─────────────────────────────────────────────
    const recipeMatch = path.match(/^\/api\/recipes\/(\d+)$/);
    if (recipeMatch && method === 'GET') {
      const id = recipeMatch[1];
      const recipe = await env.DB.prepare('SELECT * FROM recipes WHERE id = ? AND is_published = 1').bind(id).first();
      if (!recipe) return json({ error: 'Recipe not found' }, 404);

      return json({
        ...recipe,
        ingredients_ar: JSON.parse(recipe.ingredients_ar || '[]'),
        ingredients_en: JSON.parse(recipe.ingredients_en || '[]'),
        steps_ar: JSON.parse(recipe.steps_ar || '[]'),
        steps_en: JSON.parse(recipe.steps_en || '[]'),
      });
    }

    // ─────────────────────────────────────────────
    // POST /api/jobs/recipe-extract
    // Create extraction job from video URL
    // ─────────────────────────────────────────────
    if (path === '/api/jobs/recipe-extract' && method === 'POST') {
      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

      const { source_url, created_by } = body;

      if (!source_url || !isValidUrl(source_url))
        return json({ error: 'source_url is required and must be a valid URL' }, 422);

      const platform = detectPlatform(source_url);
      if (!platform)
        return json({ error: 'URL must be from Instagram, TikTok, or YouTube' }, 422);

      // Check if recipe already exists
      const existingRecipe = await env.DB.prepare('SELECT id FROM recipes WHERE source_url = ?').bind(source_url).first();
      if (existingRecipe) {
        return json({ error: 'Recipe already exists', recipe_id: existingRecipe.id, code: 'RECIPE_EXISTS' }, 409);
      }

      // Check if job already exists
      const existingJob = await env.DB.prepare('SELECT * FROM recipe_jobs WHERE source_url = ?').bind(source_url).first();
      if (existingJob) {
        return json({
          error: 'Job already exists',
          job_id: existingJob.id,
          status: existingJob.status,
          code: 'JOB_EXISTS'
        }, 409);
      }

      const ts = now();
      const result = await env.DB.prepare(`
        INSERT INTO recipe_jobs (source_url, status, created_by, created_at, updated_at)
        VALUES (?, 'pending', ?, ?, ?)
      `).bind(source_url, created_by || null, ts, ts).run();

      return json({ success: true, job_id: result.meta.last_row_id, status: 'pending' }, 200);
    }

    // ─────────────────────────────────────────────
    // GET /api/jobs/recipe-extract/:job_id
    // Get job status
    // ─────────────────────────────────────────────
    const jobMatch = path.match(/^\/api\/jobs\/recipe-extract\/(\d+)$/);
    if (jobMatch && method === 'GET') {
      const jobId = jobMatch[1];
      const job = await env.DB.prepare('SELECT * FROM recipe_jobs WHERE id = ?').bind(jobId).first();
      if (!job) return json({ error: 'Job not found' }, 404);

      return json({
        job_id: job.id,
        status: job.status,
        source_url: job.source_url,
        recipe_id: job.recipe_id,
        error_message: job.error_message,
        created_at: job.created_at,
        updated_at: job.updated_at,
      });
    }

    // ─────────────────────────────────────────────
    // POST /api/ingest/recipe-result
    // Webhook: receive full recipe from external processor
    // ─────────────────────────────────────────────
    if (path === '/api/ingest/recipe-result' && method === 'POST') {
      if (!validateApiKey(request, env)) {
        return json({ error: 'Unauthorized' }, 401);
      }

      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

      const { job_id, source_platform, source_url, title_ar, title_en,
              ingredients_ar, ingredients_en, steps_ar, steps_en,
              notes_ar, notes_en, category, confidence_stars,
              confidence_note_ar, thumbnail_url, failed, error_message } = body;

      if (!job_id) return json({ error: 'job_id is required' }, 422);

      const job = await env.DB.prepare('SELECT * FROM recipe_jobs WHERE id = ?').bind(job_id).first();
      if (!job) return json({ error: 'Job not found' }, 404);

      const ts = now();

      // Handle failure
      if (failed) {
        await env.DB.prepare(`
          UPDATE recipe_jobs SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?
        `).bind(error_message || 'Processing failed', ts, job_id).run();
        return json({ success: true, status: 'failed' });
      }

      // Validation
      if (!source_url || !title_ar || !title_en)
        return json({ error: 'source_url, title_ar, title_en are required' }, 422);

      const finalPlatform = source_platform || detectPlatform(source_url) || 'instagram';
      const validCategories = ['dessert','lunch','dinner','sandwich','breakfast','other'];
      const finalCategory = validCategories.includes(category) ? category : autoCategory(title_ar, title_en);
      const finalThumb = thumbnail_url || getThumbnail(source_url, finalPlatform);

      try {
        // Insert recipe
        const recipeResult = await env.DB.prepare(`
          INSERT INTO recipes (source_platform, source_url, title_ar, title_en,
            ingredients_ar, ingredients_en, steps_ar, steps_en,
            notes_ar, notes_en, category, confidence_stars, confidence_note_ar,
            thumbnail_url, is_published, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `).bind(
          finalPlatform, source_url, title_ar, title_en,
          JSON.stringify(ingredients_ar || []), JSON.stringify(ingredients_en || []),
          JSON.stringify(steps_ar || []), JSON.stringify(steps_en || []),
          notes_ar || '', notes_en || '', finalCategory,
          Number(confidence_stars) || 2, confidence_note_ar || '',
          finalThumb, ts, ts
        ).run();

        const recipeId = recipeResult.meta.last_row_id;

        // Update job
        await env.DB.prepare(`
          UPDATE recipe_jobs SET status = 'done', recipe_id = ?, updated_at = ? WHERE id = ?
        `).bind(recipeId, ts, job_id).run();

        return json({ success: true, status: 'done', recipe_id: recipeId });
      } catch (e) {
        if (e.message && e.message.includes('UNIQUE')) {
          // Recipe exists, just update job
          const existing = await env.DB.prepare('SELECT id FROM recipes WHERE source_url = ?').bind(source_url).first();
          if (existing) {
            await env.DB.prepare(`
              UPDATE recipe_jobs SET status = 'done', recipe_id = ?, updated_at = ? WHERE id = ?
            `).bind(existing.id, ts, job_id).run();
            return json({ success: true, status: 'done', recipe_id: existing.id });
          }
        }
        await env.DB.prepare(`
          UPDATE recipe_jobs SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?
        `).bind(e.message, ts, job_id).run();
        return json({ error: e.message }, 500);
      }
    }

    // ─────────────────────────────────────────────
    // ADMIN ENDPOINTS (protected by API key)
    // ─────────────────────────────────────────────

    // GET /api/admin/recipes - all recipes (including unpublished)
    if (path === '/api/admin/recipes' && method === 'GET') {
      if (!validateApiKey(request, env)) return json({ error: 'Unauthorized' }, 401);

      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;
      const search = url.searchParams.get('q');
      const category = url.searchParams.get('category');

      let query = 'SELECT * FROM recipes WHERE 1=1';
      const params = [];
      if (search) { query += ' AND (title_ar LIKE ? OR title_en LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
      if (category && category !== 'all') { query += ' AND category = ?'; params.push(category); }

      const countResult = await env.DB.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as total')).bind(...params).first();
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      const { results } = await env.DB.prepare(query).bind(...params).all();

      return json({ recipes: results, total: countResult?.total || 0, page, limit });
    }

    // PUT /api/admin/recipes/:id - update recipe
    if (path.match(/^\/api\/admin\/recipes\/\d+$/) && method === 'PUT') {
      if (!validateApiKey(request, env)) return json({ error: 'Unauthorized' }, 401);
      const id = path.split('/').pop();
      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

      const fields = [];
      const values = [];
      const allowed = ['title_ar','title_en','category','is_published','confidence_stars',
                       'confidence_note_ar','notes_ar','notes_en','thumbnail_url'];

      for (const field of allowed) {
        if (body[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(body[field]);
        }
      }
      if (body.ingredients_ar) { fields.push('ingredients_ar = ?'); values.push(JSON.stringify(body.ingredients_ar)); }
      if (body.ingredients_en) { fields.push('ingredients_en = ?'); values.push(JSON.stringify(body.ingredients_en)); }
      if (body.steps_ar) { fields.push('steps_ar = ?'); values.push(JSON.stringify(body.steps_ar)); }
      if (body.steps_en) { fields.push('steps_en = ?'); values.push(JSON.stringify(body.steps_en)); }

      if (fields.length === 0) return json({ error: 'No fields to update' }, 400);

      fields.push('updated_at = ?');
      values.push(now());
      values.push(id);

      await env.DB.prepare(`UPDATE recipes SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
      return json({ success: true });
    }

    // DELETE /api/admin/recipes/:id
    if (path.match(/^\/api\/admin\/recipes\/\d+$/) && method === 'DELETE') {
      if (!validateApiKey(request, env)) return json({ error: 'Unauthorized' }, 401);
      const id = path.split('/').pop();
      await env.DB.prepare('DELETE FROM recipes WHERE id = ?').bind(id).run();
      return json({ success: true });
    }

    // GET /api/admin/jobs - list all jobs
    if (path === '/api/admin/jobs' && method === 'GET') {
      if (!validateApiKey(request, env)) return json({ error: 'Unauthorized' }, 401);
      const { results } = await env.DB.prepare('SELECT * FROM recipe_jobs ORDER BY created_at DESC LIMIT 50').all();
      return json({ jobs: results });
    }

    // POST /api/admin/jobs/:id/retry - retry failed job
    if (path.match(/^\/api\/admin\/jobs\/\d+\/retry$/) && method === 'POST') {
      if (!validateApiKey(request, env)) return json({ error: 'Unauthorized' }, 401);
      const id = path.split('/')[4];
      const ts = now();
      await env.DB.prepare(`
        UPDATE recipe_jobs SET status = 'pending', error_message = NULL, updated_at = ? WHERE id = ?
      `).bind(ts, id).run();
      return json({ success: true, status: 'pending' });
    }

    // Health check
    if (path === '/api/health') {
      return json({ status: 'ok', timestamp: now() });
    }

    return json({ error: 'Not found' }, 404);
  }
};
