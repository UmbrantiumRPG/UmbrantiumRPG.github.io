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

// --- Detecta a página pelo nome do arquivo ---
const pageKey = (() => {
    const path = location.pathname.split('/').pop();
    if (!path || path === "") return 'index';
    return path.replace('.html', '');
})();

// Prefixo único por página
const prefix = 'umbrantium-' + pageKey + '-';



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

// Rolar d20 com múltiplos dados baseado no atributo
function rollD20For(btn){
    const container = btn.closest('.pericia');
    if(!container) return;
    
    const attr = container.dataset.attr;
    
    const attrs = {
        agi:  parseInt(localStorage.getItem(prefix + 'agi') || localStorage.getItem('umbrantium-index-agi') || 0) || 0,
        int:  parseInt(localStorage.getItem(prefix + 'int') || localStorage.getItem('umbrantium-index-int') || 0) || 0,
        vig:  parseInt(localStorage.getItem(prefix + 'vig') || localStorage.getItem('umbrantium-index-vig') || 0) || 0,
        pre:  parseInt(localStorage.getItem(prefix + 'pre') || localStorage.getItem('umbrantium-index-pre') || 0) || 0,
        forca:parseInt(localStorage.getItem(prefix + 'forca') || localStorage.getItem('umbrantium-index-forca') || 0) || 0,
    };
    
    const attrValue = attrs[attr] || 1;
    const numDice = Math.max(1, attrValue);
    
    const rolls = [];
    for(let i = 0; i < numDice; i++) {
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
        'agi': 'AGI',
        'int': 'INT',
        'vig': 'VIG',
        'pre': 'PRE',
        'forca': 'FOR'
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
    const dados = {};
    
    // Coleta todos os dados do localStorage com o prefixo correto
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('umbrantium-')) {
            dados[key] = localStorage.getItem(key);
        }
    }
    
    // Cria um objeto JSON
    const fichaData = {
        versao: '1.0',
        dataExportacao: new Date().toISOString(),
        dados: dados
    };
    
    // Converte para JSON e cria um blob
    const jsonString = JSON.stringify(fichaData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Cria um link de download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Nome do arquivo com data
    const nomePersonagem = localStorage.getItem('umbrantium-index-personagem') || 'Ficha';
    const dataFormatada = new Date().toISOString().split('T')[0];
    a.download = `${nomePersonagem}_${dataFormatada}.json`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    mostrarNotificacao('Ficha exportada com sucesso!', 'success');
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
            
            // Confirmação antes de sobrescrever
            const confirmar = confirm(
                'Importar esta ficha irá sobrescrever todos os dados atuais. Deseja continuar?\n\n' +
                'Dica: Exporte sua ficha atual primeiro como backup!'
            );
            
            if (!confirmar) return;
            
            // Limpa dados antigos do Umbrantium
            const keysParaRemover = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('umbrantium-')) {
                    keysParaRemover.push(key);
                }
            }
            keysParaRemover.forEach(key => localStorage.removeItem(key));
            
            // Importa novos dados
            Object.keys(fichaData.dados).forEach(key => {
                localStorage.setItem(key, fichaData.dados[key]);
            });
            
            mostrarNotificacao('Ficha importada com sucesso! Recarregando página...', 'success');
            
            // Recarrega a página após 1 segundo
            setTimeout(() => {
                location.reload();
            }, 1000);
            
        } catch (erro) {
            mostrarNotificacao('Erro ao importar ficha. Verifique se o arquivo é válido.', 'error');
            console.error('Erro na importação:', erro);
        }
    };
    
    reader.readAsText(arquivo);
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

function createHabilidadeEntry(nome="", custo="", descricao=""){
    habilidadeCounter++;
    const id = `habilidade-${habilidadeCounter}`;
    const wrapper = document.createElement("div");
    wrapper.className = "habilidade-entry";
    wrapper.dataset.habilidadeId = id;
    
    wrapper.innerHTML = `
        <div class="habilidade-header">
            <input class="habilidade-nome" placeholder="Nome da Habilidade" value="${escapeHtml(nome)}">
            <input class="habilidade-custo" type="text" placeholder="Custo" value="${escapeHtml(custo)}">
            <button class="remove-btn">×</button>
        </div>
        <textarea class="habilidade-descricao" placeholder="Descrição: efeito, alcance, duração...">${escapeHtml(descricao)}</textarea>
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
        descricao: r.querySelector(".habilidade-descricao")?.value || ""
    }));
    localStorage.setItem(prefix + 'habilidades', JSON.stringify(list));
}

function loadHabilidades(){
    const container = document.getElementById("habilidades-list");
    if (container) container.innerHTML = '';
    
    const data = JSON.parse(localStorage.getItem(prefix + 'habilidades') || "[]");
    if (data && data.length) {
        data.forEach(h => createHabilidadeEntry(h.nome, h.custo, h.descricao));
    }
}

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
    
    if (clearBtn) {
        clearBtn.addEventListener('click', limparTodosDados);
    }

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