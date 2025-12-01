// personagens.js - Sistema de múltiplos personagens

const CHARACTERS_KEY = 'umbrantium-characters';
const CURRENT_CHAR_KEY = 'umbrantium-current-character';

// Estrutura de dados de personagens
function getCharacters() {
    const data = localStorage.getItem(CHARACTERS_KEY);
    return data ? JSON.parse(data) : [];
}

function saveCharacters(characters) {
    localStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters));
}

function getCurrentCharacterId() {
    return localStorage.getItem(CURRENT_CHAR_KEY) || null;
}

function setCurrentCharacter(id) {
    localStorage.setItem(CURRENT_CHAR_KEY, id);
}

// Coletar todos os dados de um personagem
function collectCharacterData(charId) {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('umbrantium-') && 
            !key.includes('characters') && 
            !key.includes('current-character') &&
            !key.includes('theme')) {
            data[key] = localStorage.getItem(key);
        }
    }
    return data;
}

// Restaurar dados de um personagem
function restoreCharacterData(data) {
    // Limpa dados atuais (exceto sistema)
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('umbrantium-') && 
            !key.includes('characters') && 
            !key.includes('current-character') &&
            !key.includes('theme')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    
    // Restaura novos dados
    Object.keys(data).forEach(key => {
        localStorage.setItem(key, data[key]);
    });
}

// Renderizar lista de personagens
function renderCharacters() {
    const characters = getCharacters();
    const currentId = getCurrentCharacterId();
    const container = document.getElementById('characters-list');
    const emptyState = document.getElementById('empty-state');
    
    if (!container) return;
    
    if (characters.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    container.innerHTML = characters.map(char => `
        <div class="character-card ${char.id === currentId ? 'active' : ''}" data-char-id="${char.id}">
            <div class="char-avatar">${char.name.charAt(0).toUpperCase()}</div>
            <div class="char-info">
                <h3>${escapeHtml(char.name)}</h3>
                <p class="char-class">${escapeHtml(char.class || 'Sem classe')}</p>
                <p class="char-level">Nível ${char.level || 1}</p>
                <p class="char-date">Criado: ${new Date(char.created).toLocaleDateString('pt-BR')}</p>
            </div>
            <div class="char-actions">
                ${char.id === currentId ? '<span class="char-badge">Atual</span>' : ''}
                <button class="char-btn char-switch" data-id="${char.id}" title="Trocar para este personagem">
                    🎭 Usar
                </button>
                <button class="char-btn char-share" data-id="${char.id}" title="Compartilhar">
                    🔗 Compartilhar
                </button>
                <button class="char-btn char-export" data-id="${char.id}" title="Exportar">
                    📥
                </button>
                <button class="char-btn char-delete" data-id="${char.id}" title="Deletar">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
    
    // Event listeners
    container.querySelectorAll('.char-switch').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            switchCharacter(btn.dataset.id);
        });
    });
    
    container.querySelectorAll('.char-share').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            shareCharacter(btn.dataset.id);
        });
    });
    
    container.querySelectorAll('.char-export').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            exportCharacter(btn.dataset.id);
        });
    });
    
    container.querySelectorAll('.char-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCharacter(btn.dataset.id);
        });
    });
}

// Criar novo personagem
function createCharacter(name, charClass, level) {
    const characters = getCharacters();
    const newChar = {
        id: 'char-' + Date.now(),
        name: name,
        class: charClass,
        level: level,
        created: new Date().toISOString(),
        data: collectCharacterData()
    };
    
    characters.push(newChar);
    saveCharacters(characters);
    
    // Se for o primeiro personagem, torna-o ativo
    if (characters.length === 1) {
        setCurrentCharacter(newChar.id);
    }
    
    return newChar;
}

// Trocar personagem ativo
function switchCharacter(charId) {
    const characters = getCharacters();
    const currentId = getCurrentCharacterId();
    const char = characters.find(c => c.id === charId);
    
    if (!char) return;
    
    // Salvar dados do personagem atual antes de trocar
    if (currentId) {
        const currentChar = characters.find(c => c.id === currentId);
        if (currentChar) {
            currentChar.data = collectCharacterData();
            saveCharacters(characters);
        }
    }
    
    // Restaurar dados do novo personagem
    restoreCharacterData(char.data || {});
    setCurrentCharacter(charId);
    
    mostrarNotificacao(`Personagem trocado para: ${char.name}`, 'success');
    
    // Redireciona para a ficha
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Compartilhar personagem
function shareCharacter(charId) {
    const characters = getCharacters();
    const char = characters.find(c => c.id === charId);
    
    if (!char) return;
    
    // Cria um objeto compartilhável
    const shareData = {
        version: '1.0',
        character: {
            name: char.name,
            class: char.class,
            level: char.level,
            data: char.data
        },
        exported: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(shareData);
    const base64 = btoa(encodeURIComponent(jsonString));
    
    // Cria URL compartilhável (você pode usar um serviço de URL curta aqui)
    const shareUrl = `${window.location.origin}${window.location.pathname.replace('personagens.html', 'import.html')}?data=${base64}`;
    
    // Modal de compartilhamento
    const modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.innerHTML = `
        <div class="share-modal-content">
            <h3>🔗 Compartilhar ${char.name}</h3>
            <p>Copie o link abaixo para compartilhar este personagem:</p>
            <div class="share-link-container">
                <input type="text" readonly value="${shareUrl}" id="share-link">
                <button class="copy-btn" id="copy-share-link">📋 Copiar</button>
            </div>
            <p class="share-tip">💡 Qualquer pessoa com este link poderá importar uma cópia deste personagem.</p>
            <button class="confirm-cancel" id="close-share">Fechar</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Seleciona o texto automaticamente
    const linkInput = document.getElementById('share-link');
    linkInput.select();
    
    // Copiar para clipboard
    document.getElementById('copy-share-link').addEventListener('click', () => {
        linkInput.select();
        document.execCommand('copy');
        mostrarNotificacao('Link copiado!', 'success');
    });
    
    // Fechar modal
    document.getElementById('close-share').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Exportar personagem individual
function exportCharacter(charId) {
    const characters = getCharacters();
    const char = characters.find(c => c.id === charId);
    
    if (!char) return;
    
    const exportData = {
        version: '1.0',
        character: char,
        exported: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${char.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    mostrarNotificacao('Personagem exportado!', 'success');
}

// Deletar personagem
function deleteCharacter(charId) {
    const characters = getCharacters();
    const char = characters.find(c => c.id === charId);
    const currentId = getCurrentCharacterId();
    
    if (!char) return;
    
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.innerHTML = `
        <div class="confirm-modal-content">
            <h3>⚠️ Deletar Personagem</h3>
            <p>Tem certeza que deseja deletar <strong>${escapeHtml(char.name)}</strong>?</p>
            <p class="confirm-warning">Esta ação é irreversível!</p>
            <div class="confirm-buttons">
                <button class="confirm-cancel" id="cancel-delete">Cancelar</button>
                <button class="confirm-delete" id="confirm-delete">Sim, Deletar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('cancel-delete').addEventListener('click', () => modal.remove());
    
    document.getElementById('confirm-delete').addEventListener('click', () => {
        const updatedChars = characters.filter(c => c.id !== charId);
        saveCharacters(updatedChars);
        
        // Se deletou o personagem atual, limpa a seleção
        if (charId === currentId) {
            localStorage.removeItem(CURRENT_CHAR_KEY);
            // Limpa os dados também
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('umbrantium-') && 
                    !key.includes('characters') && 
                    !key.includes('current-character') &&
                    !key.includes('theme')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
        }
        
        modal.remove();
        mostrarNotificacao('Personagem deletado', 'success');
        renderCharacters();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Inicialização
if (window.location.pathname.includes('personagens.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        renderCharacters();
        
        // Modal de criar personagem
        const createBtn = document.getElementById('create-character');
        const modal = document.getElementById('character-modal');
        const form = document.getElementById('character-form');
        const cancelBtn = document.getElementById('cancel-char');
        
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                modal.style.display = 'flex';
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                form.reset();
            });
        }
        
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const name = document.getElementById('char-name').value.trim();
                const charClass = document.getElementById('char-class').value.trim();
                const level = parseInt(document.getElementById('char-level').value) || 1;
                
                if (!name) {
                    alert('Nome é obrigatório!');
                    return;
                }
                
                createCharacter(name, charClass, level);
                modal.style.display = 'none';
                form.reset();
                renderCharacters();
                mostrarNotificacao('Personagem criado!', 'success');
            });
        }
        
        // Fechar modal ao clicar fora
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    form.reset();
                }
            });
        }
    });
}

// Auto-salvar personagem atual ao navegar
window.addEventListener('beforeunload', () => {
    const currentId = getCurrentCharacterId();
    if (currentId) {
        const characters = getCharacters();
        const currentChar = characters.find(c => c.id === currentId);
        if (currentChar) {
            currentChar.data = collectCharacterData();
            saveCharacters(characters);
        }
    }
});