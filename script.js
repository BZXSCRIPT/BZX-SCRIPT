// Clase para manejar las Keys
class KeyManager {
    constructor() {
        this.keys = this.loadKeys();
        this.linkedKeys = this.loadLinkedKeys();
        this.init();
    }

    // Inicializar la aplicación
    init() {
        this.renderKeys();
        this.renderLinkedKeys();
        this.attachEventListeners();
        this.updateKeyCount();
        this.updateLinkedCount();
    }

    // Generar una key única en formato XXXX-XXXX-XXXX
    generateKey() {
        const segments = 3;
        const segmentLength = 4;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        
        let key = '';
        for (let i = 0; i < segments; i++) {
            if (i > 0) key += '-';
            for (let j = 0; j < segmentLength; j++) {
                key += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        }
        
        return key;
    }

    // Generar un HWID único (formato simple)
    generateHwid() {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const length = 12; // Formato: XXXXXXXXXXXX (12 caracteres)
        
        let hwid = '';
        for (let i = 0; i < length; i++) {
            hwid += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return hwid;
    }

    // Validar y obtener fecha de expiración basada en días
    getExpirationDate() {
        const daysInput = document.getElementById('daysInput').value;
        
        if (!daysInput || daysInput <= 0) {
            this.showNotification('Por favor ingresa un número válido de días', 'error');
            return null;
        }
        
        const days = parseInt(daysInput);
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + days);
        
        return expirationDate;
    }

    // Crear nueva key
    createKey() {
        const expirationDate = this.getExpirationDate();
        if (!expirationDate) return;
        
        const key = this.generateKey();
        const keyData = {
            id: Date.now(),
            key: key,
            expirationDate: expirationDate.toISOString(),
            createdAt: new Date().toISOString()
        };
        
        this.keys.unshift(keyData);
        this.saveKeys();
        this.renderKeys();
        this.updateKeyCount();
        
        // Mostrar key generada
        this.displayGeneratedKey(key);
        
        this.showNotification('✨ Key generada exitosamente', 'success');
        
        // Limpiar input
        document.getElementById('daysInput').value = '';
    }

    // Mostrar key recién generada
    displayGeneratedKey(key) {
        const generatedKeyDiv = document.getElementById('generatedKey');
        const keyValueSpan = document.getElementById('keyValue');
        
        keyValueSpan.textContent = key;
        generatedKeyDiv.classList.remove('hidden');
        
        // Animar
        generatedKeyDiv.style.animation = 'none';
        setTimeout(() => {
            generatedKeyDiv.style.animation = 'slideIn 0.4s ease-out';
        }, 10);
    }

    // Calcular estado de la key
    getKeyStatus(expirationDate) {
        const now = new Date();
        const expDate = new Date(expirationDate);
        const diffTime = expDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
            isActive: diffDays >= 0,
            daysRemaining: diffDays
        };
    }

    // Formatear fecha para mostrar
    formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Renderizar todas las keys
    renderKeys() {
        const keysList = document.getElementById('keysList');
        
        if (this.keys.length === 0) {
            keysList.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🔑</span>
                    <p>No hay keys generadas</p>
                </div>
            `;
            return;
        }
        
        keysList.innerHTML = this.keys.map(keyData => {
            const status = this.getKeyStatus(keyData.expirationDate);
            const statusClass = status.isActive ? 'status-active' : 'status-expired';
            const statusText = status.isActive ? 'Activa' : 'Expirada';
            const daysText = status.isActive 
                ? `${status.daysRemaining} días restantes`
                : `Expiró hace ${Math.abs(status.daysRemaining)} días`;
            
            // Verificar si la key está vinculada
            const isLinked = this.linkedKeys.some(lk => lk.key === keyData.key);
            const linkedBadge = isLinked ? '<span style="color: var(--warning); margin-left: 0.5rem;" title="Key vinculada">🔗</span>' : '';
            
            return `
                <div class="key-card" data-id="${keyData.id}">
                    <div class="key-header">
                        <div class="key-value">${keyData.key}${linkedBadge}</div>
                        <div class="key-actions">
                            <button class="btn-icon-small btn-copy" data-key="${keyData.key}" title="Copiar">
                                📋
                            </button>
                            <button class="btn-icon-small btn-delete" data-id="${keyData.id}" title="Eliminar">
                                🗑️
                            </button>
                        </div>
                    </div>
                    <div class="key-info">
                        <div class="key-date">
                            📅 Expira: ${this.formatDate(keyData.expirationDate)}
                        </div>
                        <div class="key-status">
                            <span class="status-badge ${statusClass}">${statusText}</span>
                        </div>
                        <div class="key-days days-remaining">
                            ⏱️ ${daysText}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Adjuntar eventos a los botones de las tarjetas
        this.attachCardEventListeners();
    }

    // Copiar key al portapapeles
    copyKey(key) {
        navigator.clipboard.writeText(key).then(() => {
            this.showNotification('📋 Key copiada al portapapeles', 'success');
        }).catch(() => {
            this.showNotification('Error al copiar la key', 'error');
        });
    }

    // Eliminar key
    deleteKey(id) {
        const keyToDelete = this.keys.find(key => key.id === id);
        
        // Eliminar también las vinculaciones de esta key
        if (keyToDelete) {
            this.linkedKeys = this.linkedKeys.filter(lk => lk.key !== keyToDelete.key);
            this.saveLinkedKeys();
        }
        
        this.keys = this.keys.filter(key => key.id !== id);
        this.saveKeys();
        this.renderKeys();
        this.renderLinkedKeys();
        this.updateKeyCount();
        this.updateLinkedCount();
        this.showNotification('🗑️ Key eliminada', 'success');
    }

    // Actualizar contador de keys
    updateKeyCount() {
        document.getElementById('keyCount').textContent = this.keys.length;
    }

    // Mostrar notificación
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }

    // Guardar keys en localStorage
    saveKeys() {
        localStorage.setItem('accessKeys', JSON.stringify(this.keys));
    }

    // Cargar keys desde localStorage
    loadKeys() {
        const stored = localStorage.getItem('accessKeys');
        return stored ? JSON.parse(stored) : [];
    }

    // ========== SISTEMA DE HWID ==========

    // Vincular key con HWID
    linkKeyWithHwid() {
        const keyInput = document.getElementById('keyToLink').value.trim();
        
        if (!keyInput) {
            this.showNotification('Por favor ingresa una key', 'error');
            return;
        }
        
        // Verificar si la key existe
        const keyExists = this.keys.some(k => k.key === keyInput);
        if (!keyExists) {
            this.showNotification('Esta key no existe en el sistema', 'error');
            return;
        }
        
        // Verificar si la key ya está vinculada
        const existingLink = this.linkedKeys.find(lk => lk.key === keyInput);
        if (existingLink) {
            this.showNotification(`⚠️ Esta key ya está vinculada al HWID: ${existingLink.hwid}`, 'error');
            return;
        }
        
        // Generar HWID automáticamente
        const hwid = this.generateHwid();
        
        // Crear vinculación
        const linkData = {
            id: Date.now(),
            key: keyInput,
            hwid: hwid,
            linkedAt: new Date().toISOString()
        };
        
        this.linkedKeys.unshift(linkData);
        this.saveLinkedKeys();
        this.renderLinkedKeys();
        this.renderKeys(); // Re-renderizar keys para mostrar el icono de vinculación
        this.updateLinkedCount();
        
        this.showNotification('🔗 Key vinculada exitosamente', 'success');
        
        // Limpiar input
        document.getElementById('keyToLink').value = '';
    }

    // Renderizar keys vinculadas
    renderLinkedKeys() {
        const linkedList = document.getElementById('linkedKeysList');
        
        if (this.linkedKeys.length === 0) {
            linkedList.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🔗</span>
                    <p>No hay keys vinculadas</p>
                </div>
            `;
            return;
        }
        
        linkedList.innerHTML = this.linkedKeys.map(linkData => {
            const linkedDate = this.formatDate(linkData.linkedAt);
            
            // Obtener información de la key original
            const originalKey = this.keys.find(k => k.key === linkData.key);
            let keyStatus = '';
            if (originalKey) {
                const status = this.getKeyStatus(originalKey.expirationDate);
                const statusClass = status.isActive ? 'status-active' : 'status-expired';
                const statusText = status.isActive ? 'Activa' : 'Expirada';
                keyStatus = `<span class="status-badge ${statusClass}">${statusText}</span>`;
            }
            
            return `
                <div class="hwid-card" data-id="${linkData.id}">
                    <div class="key-header">
                        <div class="key-value">${linkData.key}</div>
                        <div class="key-actions">
                            <button class="btn-icon-small btn-copy-linked" data-key="${linkData.key}" title="Copiar Key">
                                📋
                            </button>
                            <button class="btn-icon-small btn-unlink" data-id="${linkData.id}" title="Desvincular">
                                🔓
                            </button>
                        </div>
                    </div>
                    <div class="key-info">
                        <div class="hwid-value" style="font-size: 0.75rem; margin-bottom: 0.5rem;">
                            💻 ${linkData.hwid}
                        </div>
                        <div class="key-date">
                            📅 Vinculada: ${linkedDate}
                        </div>
                        <div class="key-status">
                            ${keyStatus}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Adjuntar eventos
        this.attachLinkedKeysEventListeners();
    }

    // Desvincular key
    unlinkKey(id) {
        this.linkedKeys = this.linkedKeys.filter(lk => lk.id !== id);
        this.saveLinkedKeys();
        this.renderLinkedKeys();
        this.renderKeys(); // Re-renderizar keys para quitar el icono de vinculación
        this.updateLinkedCount();
        this.showNotification('🔓 Key desvinculada', 'success');
    }

    // Actualizar contador de keys vinculadas
    updateLinkedCount() {
        document.getElementById('linkedCount').textContent = this.linkedKeys.length;
    }

    // Guardar keys vinculadas en localStorage
    saveLinkedKeys() {
        localStorage.setItem('linkedKeys', JSON.stringify(this.linkedKeys));
    }

    // Cargar keys vinculadas desde localStorage
    loadLinkedKeys() {
        const stored = localStorage.getItem('linkedKeys');
        return stored ? JSON.parse(stored) : [];
    }

    // Adjuntar event listeners a keys vinculadas
    attachLinkedKeysEventListeners() {
        // Botones copiar key vinculada
        document.querySelectorAll('.btn-copy-linked').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.target.dataset.key;
                this.copyKey(key);
            });
        });
        
        // Botones desvincular
        document.querySelectorAll('.btn-unlink').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                if (confirm('¿Estás seguro de desvincular esta key del HWID?')) {
                    this.unlinkKey(id);
                }
            });
        });
    }

    // Adjuntar event listeners principales
    attachEventListeners() {
        // Botón generar
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.createKey();
        });
        
        // Copiar key generada
        document.getElementById('copyGeneratedBtn').addEventListener('click', () => {
            const key = document.getElementById('keyValue').textContent;
            this.copyKey(key);
        });
        
        // Enter en input de días
        document.getElementById('daysInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.createKey();
            }
        });

        // Botón vincular key con HWID
        document.getElementById('linkKeyBtn').addEventListener('click', () => {
            this.linkKeyWithHwid();
        });

        // Enter en input de key
        document.getElementById('keyToLink').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.linkKeyWithHwid();
            }
        });
    }

    // Adjuntar event listeners a las tarjetas
    attachCardEventListeners() {
        // Botones copiar
        document.querySelectorAll('.btn-copy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.target.dataset.key;
                this.copyKey(key);
            });
        });
        
        // Botones eliminar
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                if (confirm('¿Estás seguro de eliminar esta key?')) {
                    this.deleteKey(id);
                }
            });
        });
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new KeyManager();
});
