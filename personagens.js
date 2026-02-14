// =====================================================
// SISTEMA DE GERENCIAMENTO DE MÚLTIPLOS PERSONAGENS
// =====================================================

const CHARACTERS_LIST_KEY = 'umbrantium-characters-list';
const CURRENT_CHARACTER_KEY = 'umbrantium-current-character';

// =====================================================
// FUNÇÕES PRINCIPAIS
// =====================================================

function initCharacterSystem() {
    loadCharactersList();
    setupEventListeners();
}

// Carrega a lista de personagens
function loadCharactersList() {
    const characters = getAllCharacters();
    const container = document.getElementById('characters-list');
    const emptyState = document.getElementById('empty-state');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (characters.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    const currentCharId = getCurrentCharacterId();
    
    characters.forEach(char => {
        const card = createCharacterCard(char, char.id === currentCharId);
        container.appendChild(card);
    });
}

// Cria um card de personagem
function createCharacterCard(character, isActive) {
    const card = document.createElement('div');
    card.className = `character-card ${isActive ? 'active' : ''}`;
    card.dataset.charId = character.id;
    
    const badge = isActive ? '<span class="active-badge">✓ Ativo</span>' : '';
    
    card.innerHTML = `
        ${badge}
        <div class="character-info">
            <h3>${escapeHtml(character.name)}</h3>
            <p class="character-details">
                ${character.class ? `<span>📚 ${escapeHtml(character.class)}</span>` : ''}
                ${character.level ? `<span>⭐ Nível ${escapeHtml(character.level)}</span>` : ''}
            </p>
            <p class="character-date">Criado: ${formatDate(character.created)}</p>
        </div>
        <div class="character-actions">
            ${!isActive ? `<button class="char-btn char-btn-select" onclick="selectCharacter('${character.id}')">
                Selecionar
            </button>` : ''}
            <button class="char-btn char-btn-edit" onclick="editCharacter('${character.id}')">
                ✏️ Editar
            </button>
            <button class="char-btn char-btn-delete" onclick="deleteCharacter('${character.id}')">
                🗑️ Excluir
            </button>
        </div>
    `;
    
    return card;
}

// Formata data
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// =====================================================
// CRUD DE PERSONAGENS
// =====================================================

// Obter todos os personagens
function getAllCharacters() {
    const data = localStorage.getItem(CHARACTERS_LIST_KEY);
    return data ? JSON.parse(data) : [];
}

// Salvar lista de personagens
function saveCharactersList(characters) {
    localStorage.setItem(CHARACTERS_LIST_KEY, JSON.stringify(characters));
}

// Obter personagem por ID
function getCharacterById(id) {
    const characters = getAllCharacters();
    return characters.find(c => c.id === id);
}

// Criar novo personagem
function createNewCharacter(name, charClass, level) {
    const characters = getAllCharacters();
    
    const newChar = {
        id: generateId(),
        name: name,
        class: charClass || '',
        level: level || '1',
        created: new Date().toISOString()
    };
    
    characters.push(newChar);
    saveCharactersList(characters);
    
    return newChar;
}

// Atualizar personagem
function updateCharacter(id, updates) {
    const characters = getAllCharacters();
    const index = characters.findIndex(c => c.id === id);
    
    if (index !== -1) {
        characters[index] = { ...characters[index], ...updates };
        saveCharactersList(characters);
        return true;
    }
    
    return false;
}

// Deletar personagem
function deleteCharacterById(id) {
    const characters = getAllCharacters();
    const currentCharId = getCurrentCharacterId();
    
    // Não pode deletar o personagem ativo
    if (id === currentCharId) {
        return false;
    }
    
    const filtered = characters.filter(c => c.id !== id);
    saveCharactersList(filtered);
    
    // Remove todos os dados desse personagem
    removeCharacterData(id);
    
    return true;
}

// Remove todos os dados de um personagem
function removeCharacterData(charId) {
    const prefix = `umbrantium-${charId}-`;
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
            keysToRemove.push(key);
        }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
}

// =====================================================
// GERENCIAMENTO DO PERSONAGEM ATUAL
// =====================================================

// Obter ID do personagem atual
function getCurrentCharacterId() {
    return localStorage.getItem(CURRENT_CHARACTER_KEY);
}

// Definir personagem atual
function setCurrentCharacter(charId) {
    localStorage.setItem(CURRENT_CHARACTER_KEY, charId);
}

// Selecionar personagem
function selectCharacter(charId) {
    const char = getCharacterById(charId);
    
    if (!char) {
        mostrarNotificacao('❌ Personagem não encontrado', 'error');
        return;
    }
    
    const confirmar = confirm(
        `Mudar para o personagem "${char.name}"?\n\n` +
        'A página será recarregada para carregar os dados do personagem.'
    );
    
    if (!confirmar) return;
    
    setCurrentCharacter(charId);
    mostrarNotificacao(`✅ Personagem "${char.name}" selecionado!`, 'success');
    
    // Redireciona para a ficha
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// =====================================================
// MODAL DE CRIAR/EDITAR
// =====================================================

let editingCharId = null;

function openCharacterModal(charId = null) {
    const modal = document.getElementById('character-modal');
    const title = document.getElementById('modal-title');
    const nameInput = document.getElementById('char-name');
    const classInput = document.getElementById('char-class');
    const levelInput = document.getElementById('char-level');
    
    if (!modal) return;
    
    editingCharId = charId;
    
    if (charId) {
        // Modo edição
        const char = getCharacterById(charId);
        if (!char) return;
        
        title.textContent = 'Editar Personagem';
        nameInput.value = char.name;
        classInput.value = char.class || '';
        levelInput.value = char.level || '1';
    } else {
        // Modo criação
        title.textContent = 'Novo Personagem';
        nameInput.value = '';
        classInput.value = '';
        levelInput.value = '1';
    }
    
    modal.style.display = 'flex';
    setTimeout(() => nameInput.focus(), 100);
}

function closeCharacterModal() {
    const modal = document.getElementById('character-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    editingCharId = null;
}

function handleCharacterFormSubmit(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('char-name');
    const classInput = document.getElementById('char-class');
    const levelInput = document.getElementById('char-level');
    
    const name = nameInput.value.trim();
    const charClass = classInput.value.trim();
    const level = levelInput.value.trim();
    
    if (!name) {
        mostrarNotificacao('❌ Nome é obrigatório', 'error');
        return;
    }
    
    if (editingCharId) {
        // Atualizar personagem existente
        updateCharacter(editingCharId, {
            name: name,
            class: charClass,
            level: level
        });
        
        // Se é o personagem ativo, atualiza os campos na ficha também
        if (editingCharId === getCurrentCharacterId()) {
            const prefix = `umbrantium-${editingCharId}-`;
            localStorage.setItem(prefix + 'personagem', name);
            localStorage.setItem(prefix + 'classe', charClass);
            localStorage.setItem(prefix + 'nivel', level);
        }
        
        mostrarNotificacao('✅ Personagem atualizado!', 'success');
    } else {
        // Criar novo personagem
        const newChar = createNewCharacter(name, charClass, level);
        
        // Se é o primeiro personagem, define como ativo automaticamente
        const characters = getAllCharacters();
        if (characters.length === 1) {
            setCurrentCharacter(newChar.id);
        }
        
        mostrarNotificacao('✅ Personagem criado!', 'success');
    }
    
    closeCharacterModal();
    loadCharactersList();
}

function editCharacter(charId) {
    openCharacterModal(charId);
}

function deleteCharacter(charId) {
    const char = getCharacterById(charId);
    
    if (!char) {
        mostrarNotificacao('❌ Personagem não encontrado', 'error');
        return;
    }
    
    const currentCharId = getCurrentCharacterId();
    
    if (charId === currentCharId) {
        mostrarNotificacao('❌ Não é possível excluir o personagem ativo. Selecione outro primeiro.', 'error');
        return;
    }
    
    const confirmar = confirm(
        `Excluir o personagem "${char.name}"?\n\n` +
        '⚠️ ATENÇÃO: Todos os dados deste personagem serão perdidos!\n' +
        'Esta ação NÃO pode ser desfeita!'
    );
    
    if (!confirmar) return;
    
    // Confirmação dupla para segurança
    const confirmar2 = confirm(
        `Tem CERTEZA que deseja excluir "${char.name}"?\n\n` +
        'Digite OK para confirmar'
    );
    
    if (!confirmar2) return;
    
    if (deleteCharacterById(charId)) {
        mostrarNotificacao(`✅ Personagem "${char.name}" excluído`, 'success');
        loadCharactersList();
    } else {
        mostrarNotificacao('❌ Erro ao excluir personagem', 'error');
    }
}

// =====================================================
// EVENT LISTENERS
// =====================================================

function setupEventListeners() {
    const createBtn = document.getElementById('create-character');
    const cancelBtn = document.getElementById('cancel-char');
    const form = document.getElementById('character-form');
    const modal = document.getElementById('character-modal');
    
    if (createBtn) {
        createBtn.addEventListener('click', () => openCharacterModal());
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeCharacterModal);
    }
    
    if (form) {
        form.addEventListener('submit', handleCharacterFormSubmit);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCharacterModal();
            }
        });
    }
}

// =====================================================
// UTILITÁRIOS
// =====================================================

function generateId() {
    return 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =====================================================
// INICIALIZAÇÃO
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    initCharacterSystem();
});