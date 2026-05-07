// ══════════════════════════════════════════════════════════════════
//  SmartDerm – Backend Proxy  (Node.js + Express)
//  Deploy: Render.com (free tier) o Railway
//
//  Variables de entorno necesarias (en Render Dashboard → Environment):
//    CLAUDE_API_KEY   → tu clave de Anthropic
//    OPENUV_API_KEY   → tu clave de OpenUV (openuv.io)
//    NEWS_API_KEY     → tu clave de NewsAPI (newsapi.org)
//    ALLOWED_ORIGIN   → URL de tu frontend (ej: https://smartderm.netlify.app)
// ══════════════════════════════════════════════════════════════════

const express = require('express');
const cors    = require('cors');
const fetch   = require('node-fetch');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── CORS: solo permite peticiones desde tu dominio ────────────────
const allowedOrigins = [
    process.env.ALLOWED_ORIGIN || 'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000'
];
app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
            callback(null, true);
        } else {
            callback(new Error('CORS: origen no permitido → ' + origin));
        }
    }
}));
app.use(express.json({ limit: '10kb' }));

// ── RATE LIMITING básico (sin dependencias extra) ─────────────────
const ipRequests = new Map();
function rateLimit(req, res, next) {
    const ip   = req.ip;
    const now  = Date.now();
    const data = ipRequests.get(ip) || { count: 0, reset: now + 60000 };
    if (now > data.reset) { data.count = 0; data.reset = now + 60000; }
    data.count++;
    ipRequests.set(ip, data);
    if (data.count > 30) {
        return res.status(429).json({ error: 'Demasiadas peticiones. Espera 1 minuto.' });
    }
    next();
}

// ── HEALTH CHECK ──────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'SmartDerm API Proxy', version: '1.0' });
});

// ══════════════════════════════════════════════════════════════════
//  RUTA: /api/chat  (DermBot → Claude)
//  Body: { messages: [...], systemPrompt: "...", courseContext: {} }
// ══════════════════════════════════════════════════════════════════
app.post('/api/chat', rateLimit, async (req, res) => {
    const { messages, systemPrompt, courseContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'messages es obligatorio y debe ser un array.' });
    }

    // Sanitizar mensajes
    const sanitized = messages.slice(-20).map(m => ({
        role:    ['user','assistant'].includes(m.role) ? m.role : 'user',
        content: String(m.content || '').slice(0, 4000)
    }));

    // Sistema por defecto si no viene desde el frontend
    const systemDefault = `Eres DermBot, el asistente virtual de SmartDerm, plataforma educativa de dermatología con sede en Colombia. Responde en español, de forma clara y concisa (máx 3 párrafos). NUNCA diagnostiques enfermedades ni recetes medicamentos.`;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method:  'POST',
            headers: {
                'Content-Type':       'application/json',
                'x-api-key':          process.env.CLAUDE_API_KEY,
                'anthropic-version':  '2023-06-01'
            },
            body: JSON.stringify({
                model:      'claude-haiku-4-5-20251001',
                max_tokens: 1024,
                system:     systemPrompt || systemDefault,
                messages:   sanitized
            })
        });

        if (!response.ok) {
            const err = await response.json();
            console.error('[chat] Error Anthropic:', err);
            return res.status(response.status).json({ error: err.error?.message || 'Error de la IA.' });
        }

        const data = await response.json();
        const text = data.content?.[0]?.text || 'Sin respuesta.';
        res.json({ ok: true, text });

    } catch (err) {
        console.error('[chat] Error:', err.message);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ══════════════════════════════════════════════════════════════════
//  RUTA: /api/uv  (OpenUV – índice UV por coordenadas)
//  Query: ?lat=4.71&lng=-74.07
// ══════════════════════════════════════════════════════════════════
app.get('/api/uv', rateLimit, async (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat y lng son obligatorios.' });

    if (!process.env.OPENUV_API_KEY) {
        // Respuesta simulada si no hay clave (modo demo)
        return res.json({
            ok: true, demo: true,
            uv: 8.2, uv_max: 10.5,
            uv_time: new Date().toISOString(),
            recommendation: 'Índice UV alto. Usa SPF 50+ y ropa protectora.'
        });
    }

    try {
        const r = await fetch(
            `https://api.openuv.io/api/v1/uv?lat=${lat}&lng=${lng}`,
            { headers: { 'x-access-token': process.env.OPENUV_API_KEY } }
        );
        const data = await r.json();
        const uv   = data.result?.uv || 0;
        const uvMax= data.result?.uv_max || 0;

        let recommendation;
        if      (uv < 3)  recommendation = '🟢 Bajo. Puedes salir sin protección especial.';
        else if (uv < 6)  recommendation = '🟡 Moderado. Usa SPF 30 y gafas de sol.';
        else if (uv < 8)  recommendation = '🟠 Alto. SPF 50+, sombrero y evita 10am-4pm.';
        else if (uv < 11) recommendation = '🔴 Muy alto. Minimiza exposición. SPF 50+ obligatorio.';
        else              recommendation = '🟣 Extremo. Quédate en interior si puedes.';

        res.json({ ok: true, uv, uv_max: uvMax, uv_time: data.result?.uv_time, recommendation });
    } catch (err) {
        console.error('[uv] Error:', err.message);
        res.status(500).json({ error: 'Error consultando OpenUV.' });
    }
});

// ══════════════════════════════════════════════════════════════════
//  RUTA: /api/news  (NewsAPI – noticias de dermatología)
//  Query: ?q=dermatology&lang=es
// ══════════════════════════════════════════════════════════════════
app.get('/api/news', rateLimit, async (req, res) => {
    const q    = req.query.q    || 'dermatología skincare';
    const lang = req.query.lang || 'es';

    if (!process.env.NEWS_API_KEY) {
        return res.json({ ok: true, demo: true, articles: [
            { title: 'Avances en tratamientos de psoriasis 2025', description: 'Nueva generación de biológicos ofrece resultados sin precedentes.', url: '#', publishedAt: new Date().toISOString(), source: { name: 'DermNews (Demo)' } },
            { title: 'Protección solar: lo que debes saber para el verano', description: 'Dermatólogos recomiendan SPF 50+ para todos los fototipos.', url: '#', publishedAt: new Date().toISOString(), source: { name: 'SkinHealth (Demo)' } }
        ]});
    }

    try {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=${lang}&sortBy=publishedAt&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`;
        const r   = await fetch(url);
        const data= await r.json();
        if (data.status !== 'ok') return res.status(400).json({ error: data.message });
        res.json({ ok: true, articles: data.articles });
    } catch (err) {
        console.error('[news] Error:', err.message);
        res.status(500).json({ error: 'Error consultando NewsAPI.' });
    }
});

// ══════════════════════════════════════════════════════════════════
//  RUTA: /api/pubmed  (PubMed E-utilities – artículos científicos)
//  Query: ?term=psoriasis+treatment&max=3
// ══════════════════════════════════════════════════════════════════
app.get('/api/pubmed', rateLimit, async (req, res) => {
    const term = req.query.term || 'dermatology';
    const max  = Math.min(parseInt(req.query.max || '3'), 5);

    try {
        // Paso 1: buscar IDs
        const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmax=${max}&retmode=json&sort=relevance`;
        const searchRes = await fetch(searchUrl);
        const searchData= await searchRes.json();
        const ids       = searchData.esearchresult?.idlist || [];
        if (!ids.length) return res.json({ ok: true, articles: [] });

        // Paso 2: obtener resúmenes
        const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
        const summRes   = await fetch(summaryUrl);
        const summData  = await summRes.json();
        const result    = summData.result || {};

        const articles = ids.map(id => {
            const art = result[id];
            return {
                pmid:    id,
                title:   art?.title || 'Sin título',
                authors: (art?.authors || []).slice(0,3).map(a => a.name).join(', '),
                source:  art?.source || '',
                pubdate: art?.pubdate || '',
                url:     `https://pubmed.ncbi.nlm.nih.gov/${id}/`
            };
        }).filter(a => a.title !== 'Sin título');

        res.json({ ok: true, articles });
    } catch (err) {
        console.error('[pubmed] Error:', err.message);
        res.status(500).json({ error: 'Error consultando PubMed.' });
    }
});

// ══════════════════════════════════════════════════════════════════
//  RUTA: /api/ingredients  (Open Beauty Facts – ingredientes INCI)
//  Query: ?ingredient=niacinamide
//  API pública, sin key requerida
// ══════════════════════════════════════════════════════════════════
app.get('/api/ingredients', rateLimit, async (req, res) => {
    const ingredient = req.query.ingredient;
    if (!ingredient) return res.status(400).json({ error: 'Parámetro ingredient requerido.' });

    try {
        const url = `https://world.openbeautyfacts.org/ingredient/${encodeURIComponent(ingredient.toLowerCase())}.json`;
        const r   = await fetch(url, { headers: { 'User-Agent': 'SmartDerm-App/1.0' } });
        if (!r.ok) return res.json({ ok: true, found: false, ingredient });
        const data = await r.json();
        res.json({ ok: true, found: true, ingredient, data: data.ingredient || {} });
    } catch (err) {
        res.status(500).json({ error: 'Error consultando Open Beauty Facts.' });
    }
});

// ── MANEJO DE ERRORES ─────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[Error global]', err.message);
    res.status(500).json({ error: err.message || 'Error interno.' });
});

app.listen(PORT, () => {
    console.log(`✅ SmartDerm API Proxy corriendo en puerto ${PORT}`);
    console.log(`   Claude API: ${process.env.CLAUDE_API_KEY ? '✓ configurada' : '✗ NO configurada'}`);
    console.log(`   OpenUV:     ${process.env.OPENUV_API_KEY ? '✓ configurada' : '✗ modo demo'}`);
    console.log(`   NewsAPI:    ${process.env.NEWS_API_KEY   ? '✓ configurada' : '✗ modo demo'}`);
});
