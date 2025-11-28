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
function escapeHtml(str){
    if (str === null || str === undefined) return "";
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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
    // Inicializa o menu mobile
    initMobileMenu();
    
    autoBindFields();

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
});