const AI_STORAGE_KEY = 'phantom_ai_history';
// YOUR REPLIT URL
const BACKEND_URL = 'https://phantom-messaging-backend--ventacorporatio.replit.app/api/phantom-chat';

// Initialize AI UI on load
document.addEventListener('DOMContentLoaded', () => {
    loadAIHistory();
});

// Load history from LocalStorage
function loadAIHistory() {
    const history = JSON.parse(localStorage.getItem(AI_STORAGE_KEY)) || [];
    const viewport = document.getElementById('ai-viewport');
    
    if (!viewport) return; // Guard clause if element isn't rendered yet
    
    viewport.innerHTML = ''; // Clear existing to prevent duplicates
    history.forEach(msg => {
        // Gemini role 'model' is what we display as 'ai'
        renderMessage(msg.role === 'user' ? 'user' : 'ai', msg.parts[0].text);
    });
}

// Render message to the UI

function formatAIText(text) {
    // 1. Handle Code Blocks First (Backticks ```)
    // We use a placeholder or handle it early to prevent <br> injection into SVGs
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, lang, code) {
        const language = (lang || "code").toUpperCase();
        
        // Minified SVG and HTML structure to prevent "leaked" text
        const copyIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

        return `
<div class="ai-code-container">
    <div class="code-header">
        <div class="code-meta">
            <span class="code-dot red"></span>
            <span class="code-dot amber"></span>
            <span class="code-dot green"></span>
            <span class="code-lang">${language}</span>
        </div>
        <button class="copy-btn" onclick="copyCode(this)" title="Copy Code">${copyIcon}</button>
    </div>
    <div class="code-body-wrapper">
        <pre><code>${escapeHTML(code.trim())}</code></pre>
    </div>
</div>`;
    });

    // 2. Handle triple-quote blocks (if your backend still sends them)
    text = text.replace(/"""\n([\s\S]*?)"""/g, function(match, code) {
        return `<div class="ai-code-container"><div class="code-header"><span class="code-lang">CODE</span></div><pre class="code-body-wrapper"><code>${escapeHTML(code.trim())}</code></pre></div>`;
    });
    
    // Replace long sequences of equals signs with a proper horizontal rule
text = text.replace(/={3,}/g, '<hr style="border: 0; border-top: 1px solid rgba(212,175,55,0.2); margin: 10px 0;">');


    // 3. Bold Headings (Apply before line breaks)
    text = text.replace(/\*\*(.*?)\*\*/g, '<span class="ai-heading">$1</span>');

    // 4. FIX numbered lists/headings
    text = text.replace(/(\d+)\.\s+<span class="ai-heading">(.*?)<\/span>/g, '$1. <span class="ai-heading">$2</span>');

    // 5. Global Line Breaks (Only applied to text NOT inside the containers created above)
    // To be safest, we split the text, but a simple replace works if the containers use <div>
    text = text.replace(/\n/g, '<br>');

    return text;
}



function escapeHTML(str){
    return str
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;");
}


function copyCode(btn) {
    // Find the closest container, then find the code element inside it
    const container = btn.closest('.ai-code-container');
    const codeElement = container.querySelector('code');
    
    if (!codeElement) return;

    const textToCopy = codeElement.innerText;

    navigator.clipboard.writeText(textToCopy).then(() => {
        // Visual feedback: Success state
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>`;
        btn.style.borderColor = "#4ade80";

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.borderColor = ""; // Reset to CSS default
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}


function renderMessage(type, text) {
    const viewport = document.getElementById('ai-viewport');
    if (!viewport) return;

    const msgDiv = document.createElement('div');
    
    if (type === 'user') {
    msgDiv.className = 'user-msg-bubble mb-4';
    msgDiv.innerText = text;
} else {
    msgDiv.className = 'ai-text-node mb-6';
    // Removed the stray '$' and added a wrapper class for wrapping
    msgDiv.innerHTML = `
    <div class="ai-content-wrapper text-white/90 leading-relaxed">${formatAIText(text)}</div>
    <span class="text-[9px] text-[#D4AF37] uppercase mt-2 block tracking-tighter opacity-60">
        Verified Phantom Response
    </span>`;
}

    
    viewport.appendChild(msgDiv);
    viewport.scrollTop = viewport.scrollHeight;
}

// Primary Function to call the AI
async function processAICommand() {
    const input = document.getElementById('ai-query-input');
    const viewport = document.getElementById('ai-viewport');
    
    if (!input || !input.value.trim()) return;
    
    const prompt = input.value.trim();

    // 1. Show User Message & Clear Input
    renderMessage('user', prompt);
    input.value = '';

    // 2. Add a temporary "Thinking" indicator
    const thinkingId = 'thinking-' + Date.now();
    const thinkingDiv = document.createElement('div');
    thinkingDiv.id = thinkingId;
    thinkingDiv.className = 'ai-text-node text-white/40 italic text-sm animate-pulse';
    thinkingDiv.innerText = "Phantom is processing...";
    viewport.appendChild(thinkingDiv);
    viewport.scrollTop = viewport.scrollHeight;

    // 3. Prepare History for Context
    let history = JSON.parse(localStorage.getItem(AI_STORAGE_KEY)) || [];

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt, history })
        });

        const data = await response.json();
        
        // Remove thinking indicator
        const loader = document.getElementById(thinkingId);
        if (loader) loader.remove();

        if (data.success) {
            // 4. Render AI Response
            renderMessage('ai', data.reply);

            // 5. Update LocalStorage (Gemini format: user/model)
            history.push({ role: "user", parts: [{ text: prompt }] });
            history.push({ role: "model", parts: [{ text: data.reply }] });
            
            // Keep last 15 exchanges (30 messages total) for context limit
            localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(history.slice(-30)));
        } else {
            renderMessage('ai', "Error: Neural gateway rejected the request. Check Replit logs.");
            console.error("Backend Error:", data.error);
        }
    } catch (err) {
        const loader = document.getElementById(thinkingId);
        if (loader) loader.remove();
        renderMessage('ai', "Connection Lost. Ensure your Replit backend is 'Running'.");
        console.error("Fetch Error:", err);
    }
}

// Expose to window so HTML buttons can click it
window.processAICommand = processAICommand;
