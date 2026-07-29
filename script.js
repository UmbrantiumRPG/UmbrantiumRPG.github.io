// ----------------------
// Sistema de Temas - CARREGAR ANTES DE TUDO
// ----------------------
const THEME_KEY = 'umbrantium-theme';

// Carrega o tema IMEDIATAMENTE
(function() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    console.log('🎨 Tema carregado:', savedTheme);
})();

function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        themeSelector.value = savedTheme;
    }
}

function setTheme(theme) {
    console.log('🎨 Mudando tema para:', theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
}

// =====================================================
// SISTEMA DE MÚLTIPLOS PERSONAGENS - PREFIXO DINÂMICO
// =====================================================

const CHARACTERS_LIST_KEY = 'umbrantium-characters-list';
const CURRENT_CHARACTER_KEY = 'umbrantium-current-character';

// Obtém ou cria personagem atual
function getCurrentCharacterId() {
    let currentId = localStorage.getItem(CURRENT_CHARACTER_KEY);
    
    // Se não há personagem atual, verifica se há personagens
    if (!currentId) {
        const charactersData = localStorage.getItem(CHARACTERS_LIST_KEY);
        const characters = charactersData ? JSON.parse(charactersData) : [];
        
        if (characters.length > 0) {
            // Usa o primeiro personagem
            currentId = characters[0].id;
            localStorage.setItem(CURRENT_CHARACTER_KEY, currentId);
        } else {
            // Cria um personagem padrão
            currentId = createDefaultCharacter();
        }
    }
    
    return currentId;
}

// Cria um personagem padrão
function createDefaultCharacter() {
    const defaultChar = {
        id: 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: 'Aventureiro',
        class: '',
        level: '1',
        created: new Date().toISOString()
    };
    
    const characters = [defaultChar];
    localStorage.setItem(CHARACTERS_LIST_KEY, JSON.stringify(characters));
    localStorage.setItem(CURRENT_CHARACTER_KEY, defaultChar.id);
    
    return defaultChar.id;
}

// --- Detecta a página pelo nome do arquivo ---
const pageKey = (() => {
    const path = location.pathname.split('/').pop();
    if (!path || path === "") return 'index';
    return path.replace('.html', '');
})();

// Prefixo único por personagem e página
const currentCharacterId = getCurrentCharacterId();
const prefix = 'umbrantium-' + currentCharacterId + '-' + pageKey + '-';



// ----------------------
// Menu Mobile
// ----------------------
function initMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const toggleButtons = document.querySelectorAll('[id^="menuToggle"]');
    
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        });
    });
    
    // Fecha o menu ao clicar fora
    document.addEventListener('click', (e) => {
        if (sidebar && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && !e.target.closest('[id^="menuToggle"]')) {
                sidebar.classList.remove('open');
            }
        }
    });
    
    // Fecha o menu ao clicar em um link
    const navLinks = sidebar?.querySelectorAll('nav a');
    navLinks?.forEach(link => {
        link.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    });
}

// ----------------------
// Campos (salvar/carregar)
// ----------------------
function saveField(el) {
    if (!el || !el.id) return;
    try { localStorage.setItem(prefix + el.id, el.value); } catch(e){/*silencioso*/}
}

function loadField(el) {
    if (!el || !el.id) return;
    const saved = localStorage.getItem(prefix + el.id);
    if (saved !== null) el.value = saved;
}

function autoBindFields() {
    const fields = document.querySelectorAll("input[type=text], input[type=number], textarea, select");
    fields.forEach(el => {
        loadField(el);
        el.removeEventListener("input", fieldSaveListener);
        el.addEventListener("input", fieldSaveListener);
    });
}

function fieldSaveListener(e){ saveField(e.target); }

// ----------------------
// Inventário dinâmico
// ----------------------
let itemCounter = 0;

function createInventoryRow(name = "", desc = "", weight = "") {
    itemCounter++;
    const itemId = `inv-item-${itemCounter}`;
    const wrapper = document.createElement("div");
    wrapper.className = "inv-item";
    wrapper.dataset.itemId = itemId;
    wrapper.innerHTML = `
        <input id="${itemId}-name" placeholder="Nome" value="${escapeHtml(name)}">
        <input id="${itemId}-desc" placeholder="Descrição" value="${escapeHtml(desc)}">
        <input id="${itemId}-weight" type="number" placeholder="Peso" value="${escapeHtml(weight)}">
        <button class="remove-btn">×</button>
    `;
    
    wrapper.querySelector(".remove-btn").addEventListener("click", () => {
        wrapper.remove();
        saveInventory();
        updateTotalWeight();
    });
    
    const weightInput = wrapper.querySelector(`#${itemId}-weight`);
    weightInput.addEventListener('input', updateTotalWeight);
    
    const container = document.getElementById("inventory-list");
    if (container) container.appendChild(wrapper);
    autoBindFields();
}

function addInventoryItem(){ 
    createInventoryRow(); 
    saveInventory();
    updateTotalWeight();
}

function saveInventory(){
    const rows = [...document.querySelectorAll(".inv-item")];
    const list = rows.map(r => ({
        name: r.querySelector(`[id$="-name"]`)?.value || "",
        desc: r.querySelector(`[id$="-desc"]`)?.value || "",
        weight: r.querySelector(`[id$="-weight"]`)?.value || ""
    }));
    localStorage.setItem(prefix + 'inventory', JSON.stringify(list));
}

function loadInventory(){
    const data = JSON.parse(localStorage.getItem(prefix + 'inventory') || "[]");
    if (data && data.length) {
        data.forEach(it => createInventoryRow(it.name, it.desc, it.weight));
    }
    updateTotalWeight();
}

function updateTotalWeight() {
    const totalEl = document.getElementById('totalWeight');
    if (!totalEl) return;
    
    const weightInputs = document.querySelectorAll('.inv-item input[id$="-weight"]');
    let total = 0;
    
    weightInputs.forEach(input => {
        const val = parseFloat(input.value) || 0;
        total += val;
    });
    
    totalEl.textContent = total.toFixed(1);
}

// ----------------------
// Ataques dinâmicos (CORRIGIDO)
// NOME | DANO | CRÍTICO | DESCRIÇÃO
// ----------------------
let attackCounter = 0;

function createAttackRow(name="", dmg="", crit="", desc=""){
    attackCounter++;
    const id = `atk-${attackCounter}`;
    const wrapper = document.createElement("div");
    wrapper.className = "attack-item";
    wrapper.dataset.attackId = id;
    wrapper.innerHTML = `
      <input class="attack-name" placeholder="Nome" value="${escapeHtml(name)}">
      <input class="attack-dmg" placeholder="Dano" value="${escapeHtml(dmg)}">
      <input class="attack-crit" placeholder="Crítico" value="${escapeHtml(crit)}">
      <input class="attack-desc" placeholder="Descrição" value="${escapeHtml(desc)}">
      <button class="remove-btn">×</button>
    `;
    
    // Evento de remover
    wrapper.querySelector(".remove-btn").addEventListener("click", ()=>{
        wrapper.remove();
        saveAttacks(); // Salva após remover
    });
    
    // Evento de input para salvar automaticamente
    wrapper.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', saveAttacks);
    });
    
    const container = document.getElementById("attacks-list");
    if (container) container.appendChild(wrapper);
}

function saveAttacks(){
    const rows = [...document.querySelectorAll(".attack-item")];
    const list = rows.map(r => ({
        name: r.querySelector(".attack-name")?.value || "",
        dmg: r.querySelector(".attack-dmg")?.value || "",
        crit: r.querySelector(".attack-crit")?.value || "",
        desc: r.querySelector(".attack-desc")?.value || ""
    }));
    localStorage.setItem(prefix + 'attacks', JSON.stringify(list));
}

function loadAttacks(){
    // Limpa o container antes de carregar
    const container = document.getElementById("attacks-list");
    if (container) container.innerHTML = '';
    
    const data = JSON.parse(localStorage.getItem(prefix + 'attacks') || "[]");
    if (data && data.length) {
        data.forEach(a => createAttackRow(a.name, a.dmg, a.crit, a.desc));
    }
}

// ----------------------
// Perícias (novo sistema)
// ----------------------
const PERICIA_KEY = prefix + 'pericias';

function loadPericias(){
    const saved = JSON.parse(localStorage.getItem(PERICIA_KEY) || "[]");
    document.querySelectorAll('.pericia').forEach((p, i)=>{
        const modEl = p.querySelector('.modificador');
        const outrosEl = p.querySelector('.outros');

        const data = saved[i] || {};
        if (modEl && (data.modificador !== undefined)) modEl.value = data.modificador;
        if (outrosEl && (data.outros !== undefined)) outrosEl.value = data.outros;
    });
    atualizarPericias();
}

function savePericias(){
    const data = [];
    document.querySelectorAll('.pericia').forEach(p=>{
        const modificador = parseInt(p.querySelector('.modificador')?.value || "0") || 0;
        const outros = parseInt(p.querySelector('.outros')?.value || "0") || 0;
        data.push({ modificador, outros, attr: p.dataset.attr });
    });
    localStorage.setItem(PERICIA_KEY, JSON.stringify(data));
}

function atualizarPericias(){
    document.querySelectorAll('.pericia').forEach(p=>{
        const modificador = parseInt(p.querySelector('.modificador')?.value || "0") || 0;
        const outros = parseInt(p.querySelector('.outros')?.value || "0") || 0;
        const total = modificador + outros;
        const calcEl = p.querySelector('.calc');
        if (calcEl) calcEl.textContent = (total >= 0 ? '+' + total : total);
    });
    savePericias();
}


function rollD20For(btn) {
    const container = btn.closest('.pericia');
    if (!container) return;
    
    const attr = container.dataset.attr;
    
    const attrs = {
        des: parseInt(localStorage.getItem(prefix + 'des') || localStorage.getItem('umbrantium-index-des') || 0) || 0,
        int: parseInt(localStorage.getItem(prefix + 'int') || localStorage.getItem('umbrantium-index-int') || 0) || 0,
        vig: parseInt(localStorage.getItem(prefix + 'vig') || localStorage.getItem('umbrantium-index-vig') || 0) || 0,
        pre: parseInt(localStorage.getItem(prefix + 'pre') || localStorage.getItem('umbrantium-index-pre') || 0) || 0,
        for: parseInt(localStorage.getItem(prefix + 'for') || localStorage.getItem('umbrantium-index-for') || 0) || 0,
        flx: parseInt(localStorage.getItem(prefix + 'flx') || localStorage.getItem('umbrantium-index-flx') || 0) || 0,
        apt: parseInt(localStorage.getItem(prefix + 'apt') || localStorage.getItem('umbrantium-index-apt') || 0) || 0,
    };
    
    const attrValue = attrs[attr] || 0;
    
    // --- Nova Lógica de Cálculo de Dados ---
    // Ex: 15 -> 1 dado | 23 -> 2 dados | 29 -> 2 dados | 30 -> 3 dados
    // Math.max(1, ...) garante que até com valor baixo (ex: < 10) ainda se role ao menos 1 dado.
    const numDice = Math.max(1, Math.floor(attrValue / 10));
    
    const rolls = [];
    for (let i = 0; i < numDice; i++) {
        rolls.push(Math.floor(Math.random() * 20) + 1);
    }
    
    const highest = Math.max(...rolls);
    
    const modificador = parseInt(container.querySelector('.modificador')?.value || "0") || 0;
    const outros = parseInt(container.querySelector('.outros')?.value || "0") || 0;
    const totalMod = modificador + outros;
    
    const total = highest + totalMod;
    
    showRollModal(rolls, highest, totalMod, total, container.querySelector('label')?.textContent || 'Perícia');
}

// ----------------------
// Rolagens Situacionais
// ----------------------
function rollSituacional(btn) {
    const container = btn.closest('.situacional-item');
    if(!container) return;
    
    const atributo = container.querySelector('.sit-atributo')?.value;
    const numDados = parseInt(container.querySelector('.sit-dados')?.value || "1") || 1;
    const soma = parseInt(container.querySelector('.sit-soma')?.value || "0") || 0;
    
    if(!atributo) {
        alert('Selecione um atributo!');
        return;
    }
    
    const rolls = [];
    for(let i = 0; i < numDados; i++) {
        rolls.push(Math.floor(Math.random() * 20) + 1);
    }
    
    const highest = Math.max(...rolls);
    const total = highest + soma;
    
    const attrNames = {
        'des': 'DES',
        'int': 'INT',
        'vig': 'VIG',
        'pre': 'PRE',
        'for': 'FOR',
        'flx': 'FLX',
        'apt': 'APT'
    };
    
    const skillName = `Situacional (${attrNames[atributo] || atributo})`;
    showRollModal(rolls, highest, soma, total, skillName);
}

// ----------------------
// Modal de rolagem
// ----------------------
function showRollModal(rolls, highest, mod, total, skillName) {
    const existing = document.querySelector('.roll-modal');
    if(existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.className = 'roll-modal';
    
    const diceList = rolls.map(r => 
        `<span class="roll-die ${r === highest ? 'highest' : ''}">${r}</span>`
    ).join('');
    
    modal.innerHTML = `
        <div class="roll-modal-content">
            <h3>🎲 ${skillName}</h3>
            <p>Dados rolados (${rolls.length}d20):</p>
            <div class="roll-dice-list">
                ${diceList}
            </div>
            <div class="roll-summary">
                <p><strong>Maior resultado:</strong> ${highest}</p>
                <p><strong>Modificadores:</strong> ${mod >= 0 ? '+' + mod : mod}</p>
                <p class="roll-total">TOTAL: ${total}</p>
            </div>
            <button class="roll-close">Fechar</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.roll-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if(e.target === modal) modal.remove();
    });
}

// ----------------------
// Utilidades
// ----------------------
// ----------------------
// Exportar/Importar Ficha
// ----------------------
function exportarFicha() {
    abrirModalExportacao();
}

// ----------------------
// SISTEMA DE EXPORTAÇÃO COM QR CODE
// ----------------------

function abrirModalExportacao() {
    // Remove modal existente se houver
    const existente = document.querySelector('.export-modal');
    if (existente) existente.remove();
    
    // Coleta apenas os dados do personagem atual
    const charId = getCurrentCharacterId();
    const charPrefix = `umbrantium-${charId}-`;
    const dados = {};
    
    // Coleta dados do personagem atual
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(charPrefix)) {
            dados[key] = localStorage.getItem(key);
        }
    }
    
    // Obtém informações do personagem
    const charactersData = localStorage.getItem(CHARACTERS_LIST_KEY);
    const characters = charactersData ? JSON.parse(charactersData) : [];
    const currentChar = characters.find(c => c.id === charId);
    
    const fichaData = {
        versao: '1.1',
        dataExportacao: new Date().toISOString(),
        characterInfo: currentChar || { id: charId, name: 'Personagem', class: '', level: '1' },
        dados: dados
    };
    
    const jsonString = JSON.stringify(fichaData);
    const nomePersonagem = currentChar?.name || 'Personagem';
    
    // Comprime usando LZ-String
    let compressed;
    try {
        compressed = LZString.compressToEncodedURIComponent(jsonString);
    } catch (e) {
        console.error('Erro ao comprimir:', e);
        mostrarNotificacao('Erro ao preparar exportação', 'error');
        return;
    }
    
    // Calcula tamanho
    const tamanhoBruto = new Blob([jsonString]).size;
    const tamanhoComprimido = compressed.length;
    const economiaPercentual = Math.round((1 - tamanhoComprimido / tamanhoBruto) * 100);
    
    // Gera URL
    const baseUrl = window.location.origin + window.location.pathname.replace(/[^\/]+$/, '');
    const importUrl = `${baseUrl}personagens.html#import=${compressed}`;
    
    // Verifica se é muito grande para QR Code
    const tamanhoMB = (tamanhoComprimido / 1024 / 1024).toFixed(2);
    const muitoGrande = tamanhoComprimido > 2000; // QR Code ideal até ~2KB
    
    // Cria modal
    const modal = document.createElement('div');
    modal.className = 'export-modal';
    modal.innerHTML = `
        <div class="export-modal-content">
            <button class="export-close" title="Fechar">×</button>
            <h2>🚀 Exportar Ficha</h2>
            <p class="export-subtitle">Personagem: <strong>${escapeHtml(nomePersonagem)}</strong></p>
            
            <div class="export-info">
                <span>📊 Tamanho: <strong>${(tamanhoBruto/1024).toFixed(1)}KB</strong> → <strong>${(tamanhoComprimido/1024).toFixed(1)}KB</strong></span>
                <span class="export-economy">(${economiaPercentual}% menor)</span>
            </div>
            
            ${!muitoGrande ? `
            <div class="export-section">
                <h3>📱 1. Escanear QR Code</h3>
                <p class="export-tip">Melhor para mobile - apenas escaneie com a câmera</p>
                <div class="qr-container" id="qr-code-container"></div>
                <button class="export-action-btn secondary" onclick="baixarQRCode()">💾 Baixar QR Code</button>
            </div>
            ` : `
            <div class="export-section export-warning">
                <h3>⚠️ QR Code indisponível</h3>
                <p>Ficha muito grande para QR Code (${(tamanhoComprimido/1024).toFixed(1)}KB). Use as opções abaixo.</p>
            </div>
            `}
            
            <div class="export-section">
                <h3>🔗 2. Enviar Link</h3>
                <p class="export-tip">Compartilhe via WhatsApp, Email, Telegram, etc</p>
                <div class="export-link-box">
                    <input type="text" readonly value="${importUrl}" id="export-link-input">
                </div>
                <button class="export-action-btn" onclick="copiarLink()">📋 Copiar Link</button>
            </div>
            
            <div class="export-section">
                <h3>📝 3. Código Manual (Fallback)</h3>
                <p class="export-tip">Cole no campo de importação</p>
                <div class="export-text-box">
                    <textarea readonly id="export-text-area">${compressed}</textarea>
                </div>
                <button class="export-action-btn" onclick="copiarTexto()">📋 Copiar Código</button>
            </div>
            
            <div class="export-section export-old">
                <h3>💾 Modo Clássico</h3>
                <p class="export-tip">Baixar arquivo .json tradicional</p>
                <button class="export-action-btn secondary" onclick="exportarJSON()">⬇️ Baixar JSON</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Gera QR Code se não for muito grande
    if (!muitoGrande && typeof QRCode !== 'undefined') {
        setTimeout(() => {
            try {
                const qrContainer = document.getElementById('qr-code-container');
                if (qrContainer) {
                    qrContainer.innerHTML = ''; // Limpa
                    new QRCode(qrContainer, {
                        text: importUrl,
                        width: 280,
                        height: 280,
                        colorDark: '#000000',
                        colorLight: '#ffffff',
                        correctLevel: QRCode.CorrectLevel.M
                    });
                }
            } catch (e) {
                console.error('Erro ao gerar QR Code:', e);
                document.getElementById('qr-code-container').innerHTML = 
                    '<p class="export-error">Erro ao gerar QR Code. Use as outras opções.</p>';
            }
        }, 100);
    }
    
    // Fecha ao clicar no X ou fora
    modal.querySelector('.export-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function copiarLink() {
    const input = document.getElementById('export-link-input');
    input.select();
    input.setSelectionRange(0, 99999); // Mobile
    
    try {
        document.execCommand('copy');
        mostrarNotificacao('✅ Link copiado! Cole no WhatsApp ou Email', 'success');
    } catch (e) {
        // Fallback para navegadores modernos
        navigator.clipboard.writeText(input.value).then(() => {
            mostrarNotificacao('✅ Link copiado!', 'success');
        }).catch(() => {
            mostrarNotificacao('❌ Erro ao copiar. Selecione e copie manualmente.', 'error');
        });
    }
}

function copiarTexto() {
    const textarea = document.getElementById('export-text-area');
    textarea.select();
    textarea.setSelectionRange(0, 99999); // Mobile
    
    try {
        document.execCommand('copy');
        mostrarNotificacao('✅ Código copiado! Cole na importação', 'success');
    } catch (e) {
        navigator.clipboard.writeText(textarea.value).then(() => {
            mostrarNotificacao('✅ Código copiado!', 'success');
        }).catch(() => {
            mostrarNotificacao('❌ Erro ao copiar. Selecione e copie manualmente.', 'error');
        });
    }
}

function baixarQRCode() {
    const qrContainer = document.getElementById('qr-code-container');
    const canvas = qrContainer.querySelector('canvas');
    
    if (!canvas) {
        mostrarNotificacao('❌ QR Code não disponível', 'error');
        return;
    }
    
    try {
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const nomePersonagem = localStorage.getItem('umbrantium-index-personagem') || 'Ficha';
            a.href = url;
            a.download = `${nomePersonagem}_QRCode.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            mostrarNotificacao('✅ QR Code baixado!', 'success');
        });
    } catch (e) {
        console.error('Erro ao baixar QR:', e);
        mostrarNotificacao('❌ Erro ao baixar QR Code', 'error');
    }
}

function exportarJSON() {
    // Coleta apenas os dados do personagem atual
    const charId = getCurrentCharacterId();
    const charPrefix = `umbrantium-${charId}-`;
    const dados = {};
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(charPrefix)) {
            dados[key] = localStorage.getItem(key);
        }
    }
    
    // Obtém informações do personagem
    const charactersData = localStorage.getItem(CHARACTERS_LIST_KEY);
    const characters = charactersData ? JSON.parse(charactersData) : [];
    const currentChar = characters.find(c => c.id === charId);
    
    const fichaData = {
        versao: '1.1',
        dataExportacao: new Date().toISOString(),
        characterInfo: currentChar || { id: charId, name: 'Personagem', class: '', level: '1' },
        dados: dados
    };
    
    const jsonString = JSON.stringify(fichaData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const nomePersonagem = currentChar?.name || 'Personagem';
    const dataFormatada = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `${nomePersonagem}_${dataFormatada}.json`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    mostrarNotificacao('✅ JSON exportado com sucesso!', 'success');
}

function importarFicha(arquivo) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const fichaData = JSON.parse(e.target.result);
            
            // Validação básica
            if (!fichaData.dados) {
                throw new Error('Arquivo inválido');
            }
            
            processarImportacao(fichaData);
            
        } catch (erro) {
            mostrarNotificacao('Erro ao importar ficha. Verifique se o arquivo é válido.', 'error');
            console.error('Erro na importação:', erro);
        }
    };
    
    reader.readAsText(arquivo);
}

// Função para processar importação de código/texto
function importarDeCodigo() {
    abrirModalImportacao();
}

function abrirModalImportacao() {
    const existente = document.querySelector('.import-modal');
    if (existente) existente.remove();
    
    const modal = document.createElement('div');
    modal.className = 'import-modal';
    modal.innerHTML = `
        <div class="import-modal-content">
            <button class="import-close" title="Fechar">×</button>
            <h2>📥 Importar Ficha</h2>
            <p class="import-subtitle">Cole o código recebido</p>
            
            <div class="import-section">
                <label for="import-code-input">Código da Ficha:</label>
                <textarea 
                    id="import-code-input" 
                    placeholder="Cole aqui o código completo que você recebeu..."
                    rows="8"
                ></textarea>
            </div>
            
            <div class="import-actions">
                <button class="import-btn-cancel" onclick="document.querySelector('.import-modal').remove()">
                    Cancelar
                </button>
                <button class="import-btn-confirm" onclick="processarImportacaoDeCodigo()">
                    ✅ Importar Ficha
                </button>
            </div>
            
            <div class="import-divider">
                <span>ou</span>
            </div>
            
            <div class="import-file-section">
                <p class="import-tip">Importar arquivo .json tradicional:</p>
                <button class="import-btn-file" onclick="document.getElementById('import-file').click()">
                    📁 Selecionar Arquivo JSON
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.import-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    // Foco automático no textarea
    setTimeout(() => {
        document.getElementById('import-code-input')?.focus();
    }, 100);
}

function processarImportacaoDeCodigo() {
    const textarea = document.getElementById('import-code-input');
    const codigo = textarea.value.trim();
    
    if (!codigo) {
        mostrarNotificacao('❌ Cole o código antes de importar', 'error');
        return;
    }
    
    try {
        // Tenta descomprimir
        const jsonString = LZString.decompressFromEncodedURIComponent(codigo);
        
        if (!jsonString) {
            throw new Error('Código inválido');
        }
        
        const fichaData = JSON.parse(jsonString);
        
        if (!fichaData.dados) {
            throw new Error('Formato inválido');
        }
        
        // Fecha o modal antes de processar
        document.querySelector('.import-modal')?.remove();
        
        processarImportacao(fichaData);
        
    } catch (erro) {
        console.error('Erro ao importar:', erro);
        mostrarNotificacao('❌ Código inválido. Verifique se copiou corretamente.', 'error');
    }
}

function processarImportacao(fichaData) {
    // Extrai informações do personagem
    let characterInfo = fichaData.characterInfo;
    let nomeNovo = 'Personagem Importado';
    let classeNova = '';
    let nivelNovo = '1';
    
    // Compatibilidade com formato antigo (versão 1.0)
    if (!characterInfo) {
        // Tenta extrair do primeiro dado encontrado
        const primeiraChave = Object.keys(fichaData.dados)[0];
        if (primeiraChave) {
            const match = primeiraChave.match(/umbrantium-(.+?)-index-personagem/);
            if (match) {
                nomeNovo = fichaData.dados[primeiraChave] || nomeNovo;
            }
        }
    } else {
        nomeNovo = characterInfo.name || nomeNovo;
        classeNova = characterInfo.class || '';
        nivelNovo = characterInfo.level || '1';
    }
    
    const confirmar = confirm(
        `Importar personagem "${nomeNovo}"?\n\n` +
        '✨ Um NOVO personagem será criado.\n' +
        '✅ Seus personagens atuais NÃO serão afetados.\n\n' +
        'Deseja continuar?'
    );
    
    if (!confirmar) return;
    
    try {
        // Cria um novo personagem
        const novoId = 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const novoChar = {
            id: novoId,
            name: nomeNovo,
            class: classeNova,
            level: nivelNovo,
            created: new Date().toISOString()
        };
        
        // Adiciona à lista de personagens
        const charactersData = localStorage.getItem(CHARACTERS_LIST_KEY);
        const characters = charactersData ? JSON.parse(charactersData) : [];
        characters.push(novoChar);
        localStorage.setItem(CHARACTERS_LIST_KEY, JSON.stringify(characters));
        
        // Importa os dados com o novo prefixo
        const novoPrefix = `umbrantium-${novoId}-`;
        
        Object.keys(fichaData.dados).forEach(key => {
            // Remove o prefixo antigo e adiciona o novo
            const keyParts = key.split('-');
            // Remove 'umbrantium' e o ID antigo
            const newKeyParts = keyParts.slice(2); // Pega só a parte depois do ID
            const newKey = novoPrefix + newKeyParts.join('-');
            
            localStorage.setItem(newKey, fichaData.dados[key]);
        });
        
        // Define como personagem ativo
        localStorage.setItem(CURRENT_CHARACTER_KEY, novoId);
        
        mostrarNotificacao(`✅ Personagem "${nomeNovo}" importado! Recarregando...`, 'success');
        
        // Recarrega a página após 1.5 segundos
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (erro) {
        console.error('Erro ao processar importação:', erro);
        mostrarNotificacao('❌ Erro ao importar ficha', 'error');
    }
}

// ----------------------
// AUTO-IMPORTAÇÃO VIA URL HASH
// ----------------------

function verificarImportacaoViaURL() {
    const hash = window.location.hash;
    
    if (hash.startsWith('#import=')) {
        const codigo = hash.substring(8); // Remove '#import='
        
        if (!codigo) return;
        
        try {
            const jsonString = LZString.decompressFromEncodedURIComponent(codigo);
            
            if (!jsonString) {
                throw new Error('Código inválido');
            }
            
            const fichaData = JSON.parse(jsonString);
            
            if (!fichaData.dados) {
                throw new Error('Formato inválido');
            }
            
            // Remove o hash da URL
            history.replaceState(null, '', window.location.pathname);
            
            // Mostra modal de confirmação personalizado
            mostrarConfirmacaoImportacao(fichaData);
            
        } catch (erro) {
            console.error('Erro ao processar link:', erro);
            mostrarNotificacao('❌ Link de importação inválido', 'error');
            history.replaceState(null, '', window.location.pathname);
        }
    }
}

function mostrarConfirmacaoImportacao(fichaData) {
    const existente = document.querySelector('.auto-import-modal');
    if (existente) existente.remove();
    
    // Usa characterInfo se disponível (formato 1.1), senão tenta extrair dos dados (formato 1.0)
    let nomePersonagem, classe, nivel;
    
    if (fichaData.characterInfo) {
        nomePersonagem = fichaData.characterInfo.name || 'Personagem';
        classe = fichaData.characterInfo.class || '';
        nivel = fichaData.characterInfo.level || '';
    } else {
        // Formato antigo - tenta extrair dos dados
        const primeiraChave = Object.keys(fichaData.dados)[0];
        if (primeiraChave) {
            const basePrefix = primeiraChave.split('-').slice(0, 2).join('-');
            nomePersonagem = fichaData.dados[`${basePrefix}-index-personagem`] || 'Personagem';
            classe = fichaData.dados[`${basePrefix}-index-classe`] || '';
            nivel = fichaData.dados[`${basePrefix}-index-nivel`] || '';
        } else {
            nomePersonagem = 'Personagem';
            classe = '';
            nivel = '';
        }
    }
    
    const modal = document.createElement('div');
    modal.className = 'auto-import-modal';
    modal.innerHTML = `
        <div class="auto-import-content">
            <div class="auto-import-icon">📥</div>
            <h2>Importar Personagem?</h2>
            
            <div class="auto-import-info">
                <p><strong>Nome:</strong> ${escapeHtml(nomePersonagem)}</p>
                ${classe ? `<p><strong>Classe:</strong> ${escapeHtml(classe)}</p>` : ''}
                ${nivel ? `<p><strong>Nível:</strong> ${escapeHtml(nivel)}</p>` : ''}
            </div>
            
            <p class="auto-import-warning" style="background: rgba(95, 184, 95, 0.1); color: #5fb85f; border-color: rgba(95, 184, 95, 0.3);">
                ✨ Um novo personagem será criado.<br>
                Seus personagens atuais não serão afetados.
            </p>
            
            <div class="auto-import-actions">
                <button class="auto-import-cancel" onclick="document.querySelector('.auto-import-modal').remove()">
                    Cancelar
                </button>
                <button class="auto-import-confirm" id="confirm-auto-import">
                    ✅ Importar como Novo
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Evento de confirmar
    document.getElementById('confirm-auto-import').addEventListener('click', () => {
        modal.remove();
        processarImportacao(fichaData);
    });
    
    // Fecha ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function mostrarNotificacao(mensagem, tipo = 'info') {
    const existente = document.querySelector('.notificacao');
    if (existente) existente.remove();
    
    const notif = document.createElement('div');
    notif.className = `notificacao notificacao-${tipo}`;
    notif.textContent = mensagem;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}


// ----------------------
// Utilidades
// ----------------------

function escapeHtml(str){
    if (str === null || str === undefined) return "";
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ----------------------
// Habilidades
// ----------------------
let habilidadeCounter = 0;

function createHabilidadeEntry(nome="", custo="", distancia="", descricao=""){
    habilidadeCounter++;
    const id = `habilidade-${habilidadeCounter}`;
    const wrapper = document.createElement("div");
    wrapper.className = "habilidade-entry";
    wrapper.dataset.habilidadeId = id;
    
    wrapper.innerHTML = `
        <div class="habilidade-header">
            <input class="habilidade-nome" placeholder="Nome" value="${escapeHtml(nome)}">
            <input class="habilidade-custo" type="text" placeholder="Custo" value="${escapeHtml(custo)}">
            <input class="habilidade-distancia" type="text" placeholder="Distância" value="${escapeHtml(distancia)}">
            <button class="remove-btn">×</button>
        </div>
        <textarea class="habilidade-descricao" placeholder="Descrição: efeito, tempo de recarga, duração...">${escapeHtml(descricao)}</textarea>
    `;
    
    wrapper.querySelector(".remove-btn").addEventListener("click", ()=>{
        wrapper.remove();
        saveHabilidades();
    });
    
    wrapper.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', saveHabilidades);
    });
    
    const container = document.getElementById("habilidades-list");
    if (container) container.appendChild(wrapper);
}

function saveHabilidades(){
    const rows = [...document.querySelectorAll(".habilidade-entry")];
    const list = rows.map(r => ({
        nome: r.querySelector(".habilidade-nome")?.value || "",
        custo: r.querySelector(".habilidade-custo")?.value || "",
        distancia: r.querySelector(".habilidade-distancia")?.value || "",
        descricao: r.querySelector(".habilidade-descricao")?.value || ""
    }));
    localStorage.setItem(prefix + 'habilidades', JSON.stringify(list));
}

function loadHabilidades(){
    const container = document.getElementById("habilidades-list");
    if (container) container.innerHTML = '';
    
    const data = JSON.parse(localStorage.getItem(prefix + 'habilidades') || "[]");
    if (data && data.length) {
        data.forEach(h => createHabilidadeEntry(h.nome, h.custo, h.distancia, h.descricao));
    }
}

// Alternância de Abas na Ficha
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetEl = document.getElementById(target);
            if (targetEl) targetEl.classList.add('active');
        });
    });

// ----------------------
// Notas
// ----------------------
let noteCounter = 0;

function createNoteEntry(title="", content="", date=""){
    noteCounter++;
    const id = `note-${noteCounter}`;
    const wrapper = document.createElement("div");
    wrapper.className = "note-entry";
    wrapper.dataset.noteId = id;
    
    const dateStr = date || new Date().toLocaleString('pt-BR');
    
    wrapper.innerHTML = `
        <div class="note-header">
            <input class="note-title" placeholder="Título da entrada" value="${escapeHtml(title)}">
            <span class="note-date">${dateStr}</span>
            <button class="remove-btn">×</button>
        </div>
        <textarea class="note-content" placeholder="Escreva sua nota aqui...">${escapeHtml(content)}</textarea>
    `;
    
    wrapper.querySelector(".remove-btn").addEventListener("click", ()=>{
        wrapper.remove();
        saveNotes();
    });
    
    wrapper.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', saveNotes);
    });
    
    const container = document.getElementById("notes-list");
    if (container) container.appendChild(wrapper);
}

function saveNotes(){
    const rows = [...document.querySelectorAll(".note-entry")];
    const list = rows.map(r => ({
        title: r.querySelector(".note-title")?.value || "",
        content: r.querySelector(".note-content")?.value || "",
        date: r.querySelector(".note-date")?.textContent || ""
    }));
    localStorage.setItem(prefix + 'notes', JSON.stringify(list));
}

function loadNotes(){
    const container = document.getElementById("notes-list");
    if (container) container.innerHTML = '';
    
    const data = JSON.parse(localStorage.getItem(prefix + 'notes') || "[]");
    if (data && data.length) {
        data.forEach(n => createNoteEntry(n.title, n.content, n.date));
    }
}

// ----------------------
// Inicialização
// ----------------------
window.addEventListener('DOMContentLoaded', ()=> {

    // 1. PRIMEIRO - Carrega o tema
    loadTheme();

    // 2. SEGUNDO - Inicializa menu mobile
    initMobileMenu();
    
    // 3. TERCEIRO - Campos automáticos
    autoBindFields();

    // 4. Event listener do seletor de tema
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        themeSelector.addEventListener('change', (e) => {
            console.log('Tema selecionado:', e.target.value);
            setTheme(e.target.value);
            mostrarNotificacao('Tema alterado!', 'success');
        });
    }

    // Inventário
    if (document.getElementById('inventory-list')) {
        loadInventory();
        document.getElementById('add-item')?.addEventListener('click', addInventoryItem);
    }

    // Ataques
    if (document.getElementById('attacks-list')) {
        loadAttacks();
        document.getElementById('add-attack')?.addEventListener('click', ()=>{
            createAttackRow();
            saveAttacks();
        });
    }

    // Habilidades
    if (document.getElementById('habilidades-list')) {
        loadHabilidades();
        document.getElementById('add-habilidade')?.addEventListener('click', ()=>{
            createHabilidadeEntry();
            saveHabilidades();
        });
    }

    // Notas
    if (document.getElementById('notes-list')) {
        loadNotes();
        document.getElementById('add-note')?.addEventListener('click', ()=>{
            createNoteEntry();
            saveNotes();
        });
    }

    // Perícias
    if (document.querySelectorAll('.pericia').length) {
        document.addEventListener('click', (e)=>{
            if (e.target.classList.contains('roll')) rollD20For(e.target);
        });
        
        document.addEventListener('input', (e)=>{
            if(e.target.closest('.pericia') && (e.target.classList.contains('modificador') || e.target.classList.contains('outros'))) {
                atualizarPericias();
            }
        });
        
        document.addEventListener('change', (e)=>{
            if(e.target.closest('.pericia') && e.target.classList.contains('modificador')) {
                atualizarPericias();
            }
        });
        
        loadPericias();
    }

    // Rolagens situacionais
    if (document.querySelectorAll('.situacional-item').length) {
        document.addEventListener('click', (e)=>{
            if (e.target.classList.contains('sit-roll')) rollSituacional(e.target);
        });
    }

// Salvar campos automaticamente
    document.addEventListener('input', ()=> {
        document.querySelectorAll("input[id], textarea[id], select[id]").forEach(el => saveField(el));
    });

    // Exportar/Importar
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportarFicha);
    }
    
    if (importBtn && importFile) {
        importBtn.addEventListener('click', () => {
            importFile.click();
        });
        
        importFile.addEventListener('change', (e) => {
            const arquivo = e.target.files[0];
            if (arquivo) {
                importarFicha(arquivo);
            }
            // Limpa o input para permitir importar o mesmo arquivo novamente
            e.target.value = '';
        });
    }
});

function mostrarNotificacao(mensagem, tipo = 'info') {
    const existente = document.querySelector('.notificacao');
    if (existente) existente.remove();
    
    const notif = document.createElement('div');
    notif.className = `notificacao notificacao-${tipo}`;
    notif.textContent = mensagem;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

function limparTodosDados() {
    // Modal de confirmação customizado
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.innerHTML = `
        <div class="confirm-modal-content">
            <h3>⚠️ Confirmar Limpeza</h3>
            <p>Tem certeza que deseja limpar TODOS os dados da ficha?</p>
            <p class="confirm-warning">Esta ação é irreversível e apagará:</p>
            <ul class="confirm-list">
                <li>Informações do personagem</li>
                <li>Atributos e perícias</li>
                <li>Inventário completo</li>
                <li>Ataques cadastrados</li>
                <li>Habilidades e magias</li>
                <li>Todas as notas e anotações</li>
            </ul>
            <p class="confirm-tip">💡 Dica: Exporte sua ficha antes de limpar como backup!</p>
            <div class="confirm-buttons">
                <button class="confirm-cancel">Cancelar</button>
                <button class="confirm-delete">Sim, Limpar Tudo</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Evento para cancelar
    modal.querySelector('.confirm-cancel').addEventListener('click', () => {
        modal.remove();
    });
    
    // Evento para confirmar
    modal.querySelector('.confirm-delete').addEventListener('click', () => {
        // Remove todos os dados do Umbrantium
        const keysParaRemover = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('umbrantium-')) {
                keysParaRemover.push(key);
            }
        }
        
        keysParaRemover.forEach(key => localStorage.removeItem(key));
        
        modal.remove();
        mostrarNotificacao('Todos os dados foram limpos! Recarregando página...', 'success');
        
        // Recarrega a página após 1.5 segundos
        setTimeout(() => {
            location.reload();
        }, 1500);
    });
    
    // Fecha ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Exportar/Importar
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    const clearBtn = document.getElementById('clear-btn');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportarFicha);
    }
    
    if (importBtn && importFile) {
        // Botão abre modal de importação
        importBtn.addEventListener('click', () => {
            importarDeCodigo();
        });
        
        // Arquivo JSON tradicional
        importFile.addEventListener('change', (e) => {
            const arquivo = e.target.files[0];
            if (arquivo) {
                importarFicha(arquivo);
            }
            e.target.value = '';
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', limparTodosDados);
    }
    
    // Verifica se há importação via URL ao carregar
    verificarImportacaoViaURL();

    // ----------------------
// Sistema de Som
// ----------------------
const SOUND_ENABLED_KEY = 'umbrantium-sound-enabled';

function isSoundEnabled() {
    const saved = localStorage.getItem(SOUND_ENABLED_KEY);
    return saved === null ? true : saved === 'true';
}

function setSoundEnabled(enabled) {
    localStorage.setItem(SOUND_ENABLED_KEY, enabled.toString());
}

// Gerar som de rolagem usando Web Audio API
function playDiceSound() {
    if (!isSoundEnabled()) return;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Som de rolagem (múltiplos cliques rápidos)
        const times = [0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.5, 0.7];
        times.forEach(time => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 200 + Math.random() * 100;
            oscillator.type = 'triangle';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + time + 0.05);
            
            oscillator.start(audioContext.currentTime + time);
            oscillator.stop(audioContext.currentTime + time + 0.05);
        });
        
        // Som de conclusão
        setTimeout(() => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 400;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        }, 800);
    } catch (e) {
        console.log('Audio não disponível');
    }
}

// ----------------------
// Modal de rolagem
// ----------------------
function showRollModal(rolls, highest, mod, total, skillName) {
    const existing = document.querySelector('.roll-modal');
    if(existing) existing.remove();
    
    // Toca o som
    playDiceSound();
    
    const modal = document.createElement('div');
    modal.className = 'roll-modal';
    
    // Cria o dado 3D
    const diceRotations = [
        { x: 0, y: 0 },      // 1
        { x: 180, y: 0 },    // 2
        { x: 0, y: 90 },     // 3
        { x: 0, y: -90 },    // 4
        { x: -90, y: 0 },    // 5
        { x: 90, y: 0 }      // 6
    ];
    
    // Para d20, adapta as rotações
    const faceIndex = Math.min(highest - 1, 5);
    const rotation = diceRotations[faceIndex] || { x: 0, y: 0 };
    
    const dice3D = `
        <div class="dice-animation-area">
            <div class="dice-3d" style="--final-x: ${rotation.x}deg; --final-y: ${rotation.y}deg;">
                <div class="dice-face front">${highest}</div>
                <div class="dice-face back">${rolls[1] || 1}</div>
                <div class="dice-face right">${rolls[2] || 1}</div>
                <div class="dice-face left">${rolls[3] || 1}</div>
                <div class="dice-face top">${rolls[4] || 1}</div>
                <div class="dice-face bottom">${rolls[5] || 1}</div>
            </div>
        </div>
    `;
    
    const diceList = rolls.map((r, i) => 
        `<span class="roll-die ${r === highest ? 'highest' : ''}" style="animation-delay: ${i * 0.1}s">${r}</span>`
    ).join('');
    
    const soundIcon = isSoundEnabled() ? '🔊' : '🔇';
    
    modal.innerHTML = `
        <div class="roll-modal-content">
            <button class="sound-toggle ${isSoundEnabled() ? '' : 'muted'}" id="toggle-sound" title="Ativar/Desativar Som">
                ${soundIcon}
            </button>
            <h3>🎲 ${skillName}</h3>
            ${dice3D}
            <p>Dados rolados (${rolls.length}d20):</p>
            <div class="roll-dice-list">
                ${diceList}
            </div>
            <div class="roll-summary">
                <p><strong>Maior resultado:</strong> ${highest}</p>
                <p><strong>Modificadores:</strong> ${mod >= 0 ? '+' + mod : mod}</p>
                <p class="roll-total">TOTAL: ${total}</p>
            </div>
            <button class="roll-close">Fechar</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Toggle de som
    const soundToggle = modal.querySelector('#toggle-sound');
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            const newState = !isSoundEnabled();
            setSoundEnabled(newState);
            soundToggle.textContent = newState ? '🔊' : '🔇';
            soundToggle.classList.toggle('muted', !newState);
        });
    }
    
    modal.querySelector('.roll-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if(e.target === modal) modal.remove();
    });
}

// ----------------------