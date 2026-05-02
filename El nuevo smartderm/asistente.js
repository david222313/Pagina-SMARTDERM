// ══════════════════════════════════════════════════════
//  SMARTDERM – Asistente Virtual IA
//  Usa la API de Claude (Anthropic) via fetch
// ══════════════════════════════════════════════════════

const ASSISTANT_KEY = 'smartderm_asst';

// ── API CONFIG ─────────────────────────────────────────
// Para producción real: usa un backend proxy (Node/Python)
// para no exponer la key. Este archivo es solo el cliente.
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// La API key se puede configurar desde el panel de admin
function getApiKey() {
    const cfg = JSON.parse(localStorage.getItem('smartderm_config') || '{}');
    return cfg.claudeApiKey || '';
}

// ── CONTEXTO DEL ASISTENTE ─────────────────────────────
function buildSystemPrompt(currentPage, courseContext) {
    let ctx = `Eres DermBot, el asistente virtual de SmartDerm, una plataforma educativa de dermatología con sede en Colombia.

Tu función es:
1. Resolver dudas sobre los cursos y contenidos de SmartDerm
2. Orientar sobre cuidado general de la piel (no diagnosticar enfermedades)
3. Explicar el uso correcto de protectores solares y productos cosméticos (sin recomendar marcas específicas)
4. Informar sobre prevención del cáncer de piel
5. Ayudar con la navegación de la plataforma

Reglas importantes:
- NUNCA diagnostiques enfermedades ni recetes medicamentos
- Siempre recomiendan consultar con un dermatólogo para casos clínicos
- Responde en español colombiano, de forma amable y clara
- Sé conciso: máximo 3-4 párrafos por respuesta
- Si preguntan por marcas específicas de cosméticos, habla de ingredientes en lugar de marcas`;

    if (courseContext) {
        ctx += `\n\nEl usuario está viendo el curso: "${courseContext.nombre}" (nivel: ${courseContext.nivel}). Puedes dar contexto específico sobre ese curso si es relevante.`;
    }

    return ctx;
}

// ── ESCANEO DE PRODUCTO ────────────────────────────────
// Analiza el texto/nombre de un producto usando las APIs configuradas
async function analyzeProduct(productText, additionalContext) {
    const cfg = JSON.parse(localStorage.getItem('smartderm_config') || '{}');
    const prompt = `El usuario quiere información sobre este producto cosmético o de cuidado de la piel:

"${productText}"

${additionalContext ? 'Contexto adicional: ' + additionalContext : ''}

${cfg.ingredientesApi ? 'Base de datos de ingredientes cargada: ' + cfg.ingredientesApi.substring(0, 500) + '...' : ''}

Por favor, proporciona:
1. ¿Qué tipo de producto es? (hidratante, protector solar, limpiador, etc.)
2. ¿Para qué tipo de piel está indicado?
3. Ingredientes activos principales que probablemente contiene (basado en el tipo de producto)
4. Cómo usarlo correctamente
5. Precauciones importantes
6. Si deberías consultar un dermatólogo antes de usarlo

Responde de forma clara y útil para una persona sin conocimientos médicos.`;

    return callClaude(prompt, null, null);
}

// ── LLAMADA A LA API DE CLAUDE ─────────────────────────
async function callClaude(userMessage, conversationHistory, courseContext) {
    const apiKey = getApiKey();
    if (!apiKey) {
        return {
            ok: false,
            text: '⚠️ El asistente no está configurado aún. Un administrador debe ingresar la API key de Claude en el Panel de Administración.',
            demo: true
        };
    }

    const messages = [];
    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
        conversationHistory.forEach(msg => {
            messages.push({ role: msg.role, content: msg.content });
        });
    }
    messages.push({ role: 'user', content: userMessage });

    try {
        const response = await fetch(CLAUDE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 1024,
                system: buildSystemPrompt(window.location.pathname, courseContext),
                messages: messages
            })
        });

        if (!response.ok) {
            const err = await response.json();
            return { ok: false, text: `Error de la API: ${err.error?.message || response.statusText}` };
        }

        const data = await response.json();
        const text = data.content?.[0]?.text || 'Sin respuesta.';
        return { ok: true, text };
    } catch (e) {
        return { ok: false, text: `Error de conexión: ${e.message}. Verifica que la API key sea correcta.` };
    }
}

// ── DEMO RESPONSES (sin API key) ───────────────────────
const DEMO_RESPONSES = [
    "Hola 👋 Soy DermBot, el asistente de SmartDerm. Para usar el asistente completo con IA, un administrador debe configurar la API key en el panel de admin. Por ahora puedo darte información básica.",
    "El protector solar debe aplicarse 15-30 minutos antes de la exposición solar y reaplicarse cada 2 horas, o después de nadar o sudar. El SPF 30 bloquea ~97% de los rayos UVB y el SPF 50 bloquea ~98%.",
    "Para una piel saludable, lo más importante es: 1) Limpiar suavemente, 2) Hidratar según tu tipo de piel, 3) Proteger del sol todos los días. Recuerda que ante cualquier lesión que te preocupe, consulta a un dermatólogo.",
    "El cáncer de piel se puede prevenir en gran medida con protección solar diaria, evitar las camas de bronceado y hacerte autoexámenes regulares con la regla ABCDE (Asimetría, Bordes, Color, Diámetro, Evolución)."
];
let demoIdx = 0;

function getDemoResponse() {
    const r = DEMO_RESPONSES[demoIdx % DEMO_RESPONSES.length];
    demoIdx++;
    return r;
}

// ══════════════════════════════════════════════════════
//  CHAT WIDGET – Renderiza el botón flotante + panel
// ══════════════════════════════════════════════════════

function initAssistant(options = {}) {
    const { courseContext = null, containerId = null } = options;

    // State
    const history = [];
    let isOpen = containerId ? true : false;
    let isLoading = false;

    // ── Build HTML ──────────────────────────────────────
    const widgetId = 'sd-chat-widget-' + Date.now();

    const widgetHTML = `
    <div id="${widgetId}" class="sd-assistant-widget">
        ${!containerId ? `
        <button class="sd-chat-toggle" id="sd-toggle-${widgetId}" onclick="document.getElementById('${widgetId}').classList.toggle('open')" title="Abrir asistente DermBot">
            <span class="sd-chat-icon">💬</span>
            <span class="sd-chat-badge" id="sd-badge-${widgetId}" style="display:none;">1</span>
        </button>
        ` : ''}
        <div class="sd-chat-panel ${containerId ? 'sd-panel-embedded' : ''}">
            <div class="sd-chat-header">
                <div class="sd-header-info">
                    <div class="sd-bot-avatar">🤖</div>
                    <div>
                        <strong>DermBot</strong>
                        <span class="sd-online-dot"></span>
                        <small>Asistente SmartDerm</small>
                    </div>
                </div>
                ${!containerId ? `<button class="sd-close-btn" onclick="document.getElementById('${widgetId}').classList.remove('open')">✕</button>` : ''}
            </div>
            <div class="sd-chat-messages" id="sd-msgs-${widgetId}">
                <div class="sd-msg sd-msg-bot">
                    <div class="sd-msg-bubble">
                        👋 Hola, soy <strong>DermBot</strong>, el asistente virtual de SmartDerm.<br><br>
                        Puedo ayudarte con dudas sobre cuidado de la piel, cursos, productos cosméticos y más. ${courseContext ? `<br><br>📚 Veo que estás en el curso <em>${courseContext.nombre}</em> — puedo ayudarte con dudas específicas de este contenido.` : ''}
                    </div>
                </div>
            </div>
            <div class="sd-product-scan" id="sd-scan-${widgetId}" style="display:none;">
                <input type="text" placeholder="Nombre del producto a analizar..." id="sd-scan-input-${widgetId}">
                <button onclick="handleScan('${widgetId}')">Analizar 🔍</button>
                <button onclick="document.getElementById('sd-scan-${widgetId}').style.display='none'">✕</button>
            </div>
            <div class="sd-chat-input-area">
                <button class="sd-scan-btn" title="Analizar producto" onclick="toggleScan('${widgetId}')">🔬</button>
                <input
                    type="text"
                    class="sd-chat-input"
                    id="sd-input-${widgetId}"
                    placeholder="Escribe tu pregunta..."
                    onkeydown="if(event.key==='Enter')sendMessage('${widgetId}','${encodeURIComponent(JSON.stringify(courseContext || null))}')"
                >
                <button class="sd-send-btn" onclick="sendMessage('${widgetId}','${encodeURIComponent(JSON.stringify(courseContext || null))}')">
                    ➤
                </button>
            </div>
        </div>
    </div>`;

    // ── Inject into DOM ─────────────────────────────────
    if (containerId) {
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = widgetHTML;
    } else {
        const div = document.createElement('div');
        div.innerHTML = widgetHTML;
        document.body.appendChild(div.firstElementChild);
    }

    // ── Show welcome badge ──────────────────────────────
    if (!containerId) {
        setTimeout(() => {
            const badge = document.getElementById(`sd-badge-${widgetId}`);
            if (badge) badge.style.display = 'flex';
        }, 2000);
    }
}

// ── Global handlers ─────────────────────────────────────
async function sendMessage(widgetId, encodedCtx) {
    const input = document.getElementById(`sd-input-${widgetId}`);
    const msgs = document.getElementById(`sd-msgs-${widgetId}`);
    const text = input.value.trim();
    if (!text) return;

    let courseContext = null;
    try { courseContext = JSON.parse(decodeURIComponent(encodedCtx)); } catch(e){}

    // Show user message
    input.value = '';
    appendMsg(msgs, text, 'user');

    // Show typing indicator
    const typingId = 'typing-' + Date.now();
    msgs.innerHTML += `<div class="sd-msg sd-msg-bot" id="${typingId}"><div class="sd-msg-bubble sd-typing"><span></span><span></span><span></span></div></div>`;
    msgs.scrollTop = msgs.scrollHeight;

    // Call API
    const apiKey = getApiKey();
    let result;
    if (apiKey) {
        result = await callClaude(text, [], courseContext);
    } else {
        await new Promise(r => setTimeout(r, 900));
        result = { ok: true, text: getDemoResponse(), demo: true };
    }

    // Remove typing, show response
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();
    appendMsg(msgs, result.text + (result.demo ? '<br><small style="color:#aaa;font-size:11px;">Modo demo – configura la API key para respuestas completas</small>' : ''), 'bot');
}

async function handleScan(widgetId) {
    const input = document.getElementById(`sd-scan-input-${widgetId}`);
    const msgs = document.getElementById(`sd-msgs-${widgetId}`);
    const productName = input.value.trim();
    if (!productName) return;

    input.value = '';
    document.getElementById(`sd-scan-${widgetId}`).style.display = 'none';
    appendMsg(msgs, `🔬 Analizando producto: "${productName}"`, 'user');

    const typingId = 'typing-' + Date.now();
    msgs.innerHTML += `<div class="sd-msg sd-msg-bot" id="${typingId}"><div class="sd-msg-bubble sd-typing"><span></span><span></span><span></span></div></div>`;
    msgs.scrollTop = msgs.scrollHeight;

    const apiKey = getApiKey();
    let result;
    if (apiKey) {
        result = await analyzeProduct(productName, '');
    } else {
        await new Promise(r => setTimeout(r, 1200));
        result = { ok: true, text: `📋 <strong>Análisis de: "${productName}"</strong><br><br>Para un análisis detallado con IA, configura la API key en el panel de administración.<br><br>En modo demo: Los productos cosméticos generalmente se clasifican por su función principal (limpiador, hidratante, protector solar, tratamiento). Siempre revisa la lista de ingredientes y consulta con un dermatólogo si tienes piel sensible.`, demo: true };
    }

    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();
    appendMsg(msgs, result.text, 'bot');
}

function toggleScan(widgetId) {
    const scanEl = document.getElementById(`sd-scan-${widgetId}`);
    if (scanEl) scanEl.style.display = scanEl.style.display === 'none' ? 'flex' : 'none';
}

function appendMsg(container, text, role) {
    const div = document.createElement('div');
    div.className = `sd-msg sd-msg-${role}`;
    div.innerHTML = `<div class="sd-msg-bubble">${text}</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// ── Inject CSS ──────────────────────────────────────────
(function injectAssistantCSS() {
    if (document.getElementById('sd-assistant-css')) return;
    const style = document.createElement('style');
    style.id = 'sd-assistant-css';
    style.textContent = `
    .sd-assistant-widget { position:fixed; bottom:24px; right:24px; z-index:9000; font-family:'Oswald',sans-serif; }
    .sd-chat-toggle {
        width:60px; height:60px; border-radius:50%; border:none; cursor:pointer;
        background:linear-gradient(135deg,#00b894,#00897b);
        box-shadow:0 4px 20px rgba(0,184,148,0.4);
        font-size:26px; display:flex; align-items:center; justify-content:center;
        transition:transform 0.2s, box-shadow 0.2s; position:relative;
    }
    .sd-chat-toggle:hover { transform:scale(1.08); box-shadow:0 6px 28px rgba(0,184,148,0.5); }
    .sd-chat-badge {
        position:absolute; top:-2px; right:-2px; width:18px; height:18px;
        background:#e74c3c; border-radius:50%; color:#fff; font-size:10px;
        align-items:center; justify-content:center; border:2px solid #fff;
    }
    .sd-chat-panel {
        position:absolute; bottom:72px; right:0;
        width:360px; height:500px; background:#fff;
        border-radius:16px; box-shadow:0 12px 48px rgba(0,0,0,0.2);
        display:flex; flex-direction:column; overflow:hidden;
        opacity:0; pointer-events:none; transform:translateY(16px) scale(0.96);
        transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1); transform-origin:bottom right;
    }
    .sd-assistant-widget.open .sd-chat-panel,
    .sd-panel-embedded { opacity:1 !important; pointer-events:all !important; transform:none !important; position:relative !important; bottom:auto !important; right:auto !important; width:100% !important; height:480px !important; border-radius:12px !important; }
    .sd-chat-header {
        background:linear-gradient(135deg,#00b894,#00897b);
        color:#fff; padding:14px 16px;
        display:flex; align-items:center; justify-content:space-between; flex-shrink:0;
    }
    .sd-header-info { display:flex; align-items:center; gap:10px; }
    .sd-bot-avatar { width:36px; height:36px; background:rgba(255,255,255,0.2); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; }
    .sd-header-info strong { display:block; font-size:15px; }
    .sd-header-info small { font-size:11px; opacity:0.85; }
    .sd-online-dot { display:inline-block; width:7px; height:7px; background:#7dffca; border-radius:50%; margin-left:4px; animation:pulse 2s infinite; }
    @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
    .sd-close-btn { background:none; border:none; color:#fff; font-size:18px; cursor:pointer; opacity:0.8; line-height:1; padding:4px; }
    .sd-close-btn:hover { opacity:1; }
    .sd-chat-messages { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:10px; background:#f6f8fa; }
    .sd-msg { display:flex; }
    .sd-msg-user { justify-content:flex-end; }
    .sd-msg-bot { justify-content:flex-start; }
    .sd-msg-bubble {
        max-width:80%; padding:10px 14px; border-radius:12px; font-size:13.5px; line-height:1.55;
    }
    .sd-msg-user .sd-msg-bubble { background:#00b894; color:#fff; border-bottom-right-radius:4px; }
    .sd-msg-bot .sd-msg-bubble { background:#fff; color:#333; border-bottom-left-radius:4px; box-shadow:0 1px 4px rgba(0,0,0,0.08); }
    .sd-typing { display:flex; gap:5px; align-items:center; padding:12px 16px; }
    .sd-typing span { width:7px; height:7px; border-radius:50%; background:#00b894; animation:bounce 1.2s infinite; }
    .sd-typing span:nth-child(2) { animation-delay:0.2s; }
    .sd-typing span:nth-child(3) { animation-delay:0.4s; }
    @keyframes bounce { 0%,60%,100%{transform:translateY(0);} 30%{transform:translateY(-6px);} }
    .sd-chat-input-area {
        display:flex; align-items:center; gap:6px; padding:10px 12px;
        border-top:1px solid #eee; background:#fff; flex-shrink:0;
    }
    .sd-chat-input {
        flex:1; border:1.5px solid #e0e0e0; border-radius:20px;
        padding:9px 14px; font-size:13px; outline:none;
        transition:border-color 0.2s; font-family:inherit;
    }
    .sd-chat-input:focus { border-color:#00b894; }
    .sd-send-btn {
        width:36px; height:36px; border-radius:50%; border:none;
        background:#00b894; color:#fff; cursor:pointer; font-size:16px;
        display:flex; align-items:center; justify-content:center; flex-shrink:0;
        transition:background 0.2s;
    }
    .sd-send-btn:hover { background:#00897b; }
    .sd-scan-btn {
        width:32px; height:32px; border-radius:50%; border:1.5px solid #e0e0e0;
        background:#fff; cursor:pointer; font-size:15px; flex-shrink:0;
        display:flex; align-items:center; justify-content:center;
        transition:border-color 0.2s;
    }
    .sd-scan-btn:hover { border-color:#00b894; }
    .sd-product-scan {
        padding:8px 12px; border-top:1px solid #eee;
        background:#f0fff8; display:flex; gap:6px; align-items:center; flex-shrink:0;
    }
    .sd-product-scan input {
        flex:1; padding:7px 12px; border:1.5px solid #00b894; border-radius:8px;
        font-size:13px; outline:none; font-family:inherit;
    }
    .sd-product-scan button {
        padding:7px 12px; border:none; border-radius:8px; cursor:pointer; font-size:12px;
        background:#00b894; color:#fff;
    }
    .sd-product-scan button:last-child { background:#e0e0e0; color:#555; }
    @media (max-width:480px) {
        .sd-chat-panel { width:calc(100vw - 20px); right:-10px; }
    }`;
    document.head.appendChild(style);
})();
