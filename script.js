// --- Detecta a página pelo nome do arquivo ---
const pageKey = (() => {
    const path = location.pathname.split('/').pop();
    if (!path || path === "") return 'index';
    return path.replace('.html', '');
})();

// Prefixo único por página
const prefix = 'umbrantium-' + pageKey + '-';

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
        <input id="${itemId}-weight" placeholder="Peso" value="${escapeHtml(weight)}">
        <button class="remove-btn">×</button>
    `;
    wrapper.querySelector(".remove-btn").addEventListener("click", () => {
        // remove itens do storage
        localStorage.removeItem(prefix + `${itemId}-name`);
        localStorage.removeItem(prefix + `${itemId}-desc`);
        localStorage.removeItem(prefix + `${itemId}-weight`);
        wrapper.remove();
    });
    const container = document.getElementById("inventory-list");
    if (container) container.appendChild(wrapper);
    autoBindFields();
}
function addInventoryItem(){ createInventoryRow(); saveInventory(); }
function saveInventory(){
    const rows = [...document.querySelectorAll(".inv-item")];
    const list = rows.map(r => ({
        name: r.querySelector(`[id$="-name"]`)?.value || "",
        desc:  r.querySelector(`[id$="-desc"]`)?.value || "",
        weight:r.querySelector(`[id$="-weight"]`)?.value || ""
    }));
    localStorage.setItem(prefix + 'inventory', JSON.stringify(list));
}
function loadInventory(){
    const data = JSON.parse(localStorage.getItem(prefix + 'inventory') || "[]");
    if (data && data.length) {
        data.forEach(it => createInventoryRow(it.name, it.desc, it.weight));
    }
}

// ----------------------
// Ataques dinâmicos
// ----------------------
let attackCounter = 0;
function createAttackRow(name="", test="", dmg="", notes=""){
    attackCounter++;
    const id = `atk-${attackCounter}`;
    const wrapper = document.createElement("div");
    wrapper.className = "attack-item";
    wrapper.dataset.attackId = id;
    wrapper.innerHTML = `
      <input id="${id}-name" placeholder="Ataque" value="${escapeHtml(name)}">
      <input id="${id}-test" placeholder="Teste" value="${escapeHtml(test)}">
      <input id="${id}-dmg" placeholder="Dano" value="${escapeHtml(dmg)}">
      <input id="${id}-notes" placeholder="Observações" value="${escapeHtml(notes)}">
      <button class="remove-btn">×</button>
    `;
    wrapper.querySelector(".remove-btn").addEventListener("click", ()=>{
        localStorage.removeItem(prefix + `${id}-name`);
        localStorage.removeItem(prefix + `${id}-test`);
        localStorage.removeItem(prefix + `${id}-dmg`);
        localStorage.removeItem(prefix + `${id}-notes`);
        wrapper.remove();
    });
    const container = document.getElementById("attacks-list");
    if (container) container.appendChild(wrapper);
    autoBindFields();
}
function addAttack(){ createAttackRow(); saveAttacks(); }
function saveAttacks(){
    const rows = [...document.querySelectorAll(".attack-item")];
    const list = rows.map(r => ({
        name: r.querySelector(`[id$="-name"]`)?.value || "",
        test: r.querySelector(`[id$="-test"]`)?.value || "",
        dmg: r.querySelector(`[id$="-dmg"]`)?.value || "",
        notes: r.querySelector(`[id$="-notes"]`)?.value || ""
    }));
    localStorage.setItem(prefix + 'attacks', JSON.stringify(list));
}
function loadAttacks(){
    const data = JSON.parse(localStorage.getItem(prefix + 'attacks') || "[]");
    if (data && data.length) data.forEach(a => createAttackRow(a.name, a.test, a.dmg, a.notes));
}

// ----------------------
// Perícias (salva por página)
// ----------------------
const PERICIA_KEY = prefix + 'pericias'; // namespace por página

function loadPericias(){
    const saved = JSON.parse(localStorage.getItem(PERICIA_KEY) || "[]");
    document.querySelectorAll('.pericia').forEach((p, i)=>{
        const bonusEl = p.querySelector('.bonus');
        const treinoEl = p.querySelector('.treino');
        const outrosEl = p.querySelector('.outros');

        const data = saved[i] || {};
        if (bonusEl && (data.bonus !== undefined)) bonusEl.textContent = String(data.bonus);
        if (treinoEl && (data.treino !== undefined)) treinoEl.checked = !!data.treino;
        if (outrosEl && (data.outros !== undefined)) outrosEl.value = data.outros;
    });
    atualizarPericias();
}

function savePericias(){
    const data = [];
    document.querySelectorAll('.pericia').forEach(p=>{
        const bonus = parseInt(p.querySelector('.bonus')?.textContent || "0") || 0;
        const treino = !!p.querySelector('.treino')?.checked;
        const outros = parseInt(p.querySelector('.outros')?.value || "0") || 0;
        data.push({ bonus, treino, outros, attr: p.dataset.attr });
    });
    localStorage.setItem(PERICIA_KEY, JSON.stringify(data));
}

function atualizarPericias(){
    // pega atributos salvos (prefix-based keys)
    const attrs = {
        agi:  parseInt(localStorage.getItem(prefix + 'agi') || localStorage.getItem('umbrantium-index-agi') || 0) || 0,
        int:  parseInt(localStorage.getItem(prefix + 'int') || localStorage.getItem('umbrantium-index-int') || 0) || 0,
        vig:  parseInt(localStorage.getItem(prefix + 'vig') || localStorage.getItem('umbrantium-index-vig') || 0) || 0,
        pre:  parseInt(localStorage.getItem(prefix + 'pre') || localStorage.getItem('umbrantium-index-pre') || 0) || 0,
        forca:parseInt(localStorage.getItem(prefix + 'forca') || localStorage.getItem('umbrantium-index-forca') || 0) || 0,
    };

    document.querySelectorAll('.pericia').forEach(p=>{
        const attr = p.dataset.attr;
        const base = attrs[attr] || 0;
        const bonus = parseInt(p.querySelector('.bonus')?.textContent || "0") || 0;
        const treino = p.querySelector('.treino')?.checked ? 2 : 0;
        const outros = parseInt(p.querySelector('.outros')?.value || "0") || 0;
        const total = base + bonus + treino + outros;
        const calcEl = p.querySelector('.calc');
        if (calcEl) calcEl.textContent = (total >= 0 ? '+' + total : total);
    });

    // salvar o estado
    savePericias();
}

// Helpers para plus/minus
function changeBonusFromBtn(btn, delta){
    const container = btn.closest('.pericia');
    const span = container?.querySelector('.bonus');
    if(!span) return;
    const cur = parseInt(span.textContent || "0") || 0;
    span.textContent = String(cur + delta);
    atualizarPericias();
}

// Rolar d20
function rollD20For(btn){
    const container = btn.closest('.pericia');
    if(!container) return;
    const calcEl = container.querySelector('.calc');
    const mod = parseInt(calcEl?.textContent || "0") || 0;
    const roll = Math.floor(Math.random()*20)+1;
    const total = roll + mod;
    // simples alerta — você pode substituir por modal/overlay se quiser
    alert(`🎲 Rolagem: ${roll}\nModificadores: ${mod}\nTOTAL: ${total}`);
}

// Utility: escape HTML (só por segurança ao inserir values)
function escapeHtml(str){
    if (str === null || str === undefined) return "";
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ----------------------
// Defesa automática
// ----------------------
function calcDefesa(){
    const agi = parseInt(document.getElementById('agi')?.value || localStorage.getItem(prefix + 'agi') || 0) || 0;
    const defEl = document.getElementById('defesa');
    if(defEl) defEl.value = 10 + agi;
}

// ----------------------
// Inicialização (após DOM carregado)
// ----------------------
window.addEventListener('DOMContentLoaded', ()=> {
    // bind simples
    autoBindFields();

    // carregar inventário/ataques/pericias se as áreas existirem
    if (document.getElementById('inventory-list')) {
        loadInventory();
        // criar evento global salvar inventory quando campos mudarem
        document.addEventListener('input', ()=> saveInventory());
    }

    if (document.getElementById('attacks-list')) {
        loadAttacks();
        document.getElementById('add-attack')?.addEventListener('click', ()=>{
            createAttackRow(); saveAttacks();
        });
        document.addEventListener('input', ()=> saveAttacks());
    }

    // Pericias: bindar botões, carregar dados e eventos
    if (document.querySelectorAll('.pericia').length) {
        // plus / minus / roll binding (delegation)
        document.addEventListener('click', (e)=>{
            if (e.target.classList.contains('plus')) changeBonusFromBtn(e.target, +1);
            if (e.target.classList.contains('minus')) changeBonusFromBtn(e.target, -1);
            if (e.target.classList.contains('roll')) rollD20For(e.target);
        });
        // atualizar quando atributos mudarem
        ['agi','int','vig','pre','forca'].forEach(id=>{
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', ()=> { saveField(el); calcDefesa(); atualizarPericias(); });
        });
        // carregar pericias salvas e atualizar
        loadPericias();
    }

    // calcula defesa ao iniciar e sempre que atr cria/atualiza
    calcDefesa();

    // salvar campos sempre que houver input (ps: autoBindFields também faz bind por elemento)
    document.addEventListener('input', ()=> {
        // salva todos inputs com id (via saveField)
        document.querySelectorAll("input[id], textarea[id], select[id]").forEach(el => saveField(el));
    });
});
