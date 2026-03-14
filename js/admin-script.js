// ===== ADMIN PANEL JAVASCRIPT - CREACIONES AMIS =====
// Backend: PocketBase via nginx + Let's Encrypt (HTTPS permanente)
// URL estable — no cambia con reinicios del servidor

const PB_URL = 'https://161-153-203-83.sslip.io';
const ADMIN_EMAIL = 'admin@creacionesamis.sr';

// ===== IMAGE COMPRESSION =====
// Compresses images client-side before upload using Canvas API.
// - Resizes to max 1920px wide (preserving aspect ratio)
// - Converts to WEBP for smaller file size (iOS 14+ supports WEBP)
// - Falls back to JPEG if WEBP not supported
// - Videos are returned unmodified
async function compressImage(file, maxWidth = 1920, quality = 0.85) {
    if (!file.type.startsWith('image/')) return file;

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;

                // Scale down only if larger than maxWidth
                if (width > maxWidth) {
                    height = Math.round(height * maxWidth / width);
                    width = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Try WEBP first (better compression), fall back to JPEG
                canvas.toBlob(
                    (blob) => {
                        if (!blob) { resolve(file); return; }
                        const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
                        const newName = file.name.replace(/\.[^.]+$/, `.${ext}`);
                        const compressed = new File([blob], newName, { type: blob.type });
                        resolve(compressed);
                    },
                    'image/webp',
                    quality
                );
            };
            img.onerror = () => resolve(file); // fallback: upload original
            img.src = ev.target.result;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
}

// ===== PocketBase API helpers =====

function getToken() {
    return sessionStorage.getItem('amis_token');
}

function authHeaders() {
    return {
        'Authorization': getToken() || '',
        'Content-Type': 'application/json'
    };
}

async function pbGet(path) {
    const res = await fetch(`${PB_URL}${path}`, {
        headers: { 'Authorization': getToken() || '' }
    });
    if (!res.ok) throw new Error(`PB GET ${path} failed: ${res.status}`);
    return res.json();
}

async function pbPatch(path, data) {
    const res = await fetch(`${PB_URL}${path}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        // Log full error to console for debugging
        console.error('PocketBase PATCH error:', JSON.stringify(errBody, null, 2));
        // Include field-level detail in the thrown message
        const fieldDetail = errBody?.data && Object.keys(errBody.data).length
            ? ' | campos: ' + Object.entries(errBody.data)
                .map(([f, v]) => `${f}: ${v?.code || v?.message || JSON.stringify(v)}`)
                .join(', ')
            : '';
        throw new Error(`${res.status} — ${errBody?.message || 'Error'}${fieldDetail}`);
    }
    return res.json();
}

async function pbDelete(path) {
    const res = await fetch(`${PB_URL}${path}`, {
        method: 'DELETE',
        headers: { 'Authorization': getToken() || '' }
    });
    if (!res.ok) throw new Error(`PB DELETE ${path} failed: ${res.status}`);
}

function getFileUrl(record, thumb = false) {
    const base = `${PB_URL}/api/files/amis_gallery/${record.id}/${record.file}`;
    // Use PocketBase thumbnail for admin gallery previews (saves bandwidth)
    return thumb ? `${base}?thumb=400x200` : base;
}

class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.currentTab = 'gallery';
        this.galleryItems = [];
        this.isGridView = true;
        this.editingItemId = null;
        this.selectedFile = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingSession();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // File upload
        this.setupFileUpload();

        // Upload form
        document.getElementById('uploadForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFileUpload();
        });

        // Save draft button
        document.getElementById('saveDraftBtn').addEventListener('click', () => {
            this.saveDraft();
        });

        // View toggle
        document.getElementById('viewToggle').addEventListener('click', () => {
            this.toggleView();
        });

        // Tipo + category filters
        document.getElementById('tipoFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('categoryFilter').addEventListener('change', () => this.applyFilters());

        // Close modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        // Edit form submit
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEditItem();
        });

        // Toast close
        document.getElementById('closeToast').addEventListener('click', () => {
            this.hideToast();
        });

        // Settings buttons
        document.getElementById('saveWhatsappBtn').addEventListener('click', () => {
            this.saveWhatsappSettings();
        });

        document.getElementById('saveStatsBtn').addEventListener('click', () => {
            this.saveAboutStats();
        });
    }

    // ===== AUTHENTICATION =====

    checkExistingSession() {
        const token = sessionStorage.getItem('amis_token');
        const userData = sessionStorage.getItem('amis_user');
        if (token && userData) {
            this.currentUser = JSON.parse(userData);
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    async handleLogin() {
        const password = document.getElementById('password').value;

        if (!password) {
            this.showToast('Por favor ingresa tu contraseña', 'error');
            return;
        }

        this.showToast('Verificando...', 'info');

        try {
            const res = await fetch(`${PB_URL}/api/collections/amis_users/auth-with-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identity: ADMIN_EMAIL, password })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Contraseña incorrecta');
            }

            const data = await res.json();
            const token = data.token;
            const record = data.record;

            sessionStorage.setItem('amis_token', token);
            sessionStorage.setItem('amis_user', JSON.stringify({
                type: 'admin',
                name: record.name || record.email || 'Administrador',
                email: record.email,
                loginTime: new Date().toISOString()
            }));

            this.currentUser = JSON.parse(sessionStorage.getItem('amis_user'));
            this.showToast('¡Bienvenida! 👋', 'success');
            this.showDashboard();

        } catch (err) {
            this.showToast('Contraseña incorrecta', 'error');
        }
    }

    handleLogout() {
        sessionStorage.removeItem('amis_token');
        sessionStorage.removeItem('amis_user');
        this.currentUser = null;
        this.galleryItems = [];
        this.showToast('Sesión cerrada correctamente', 'success');
        this.showLogin();
    }

    showLogin() {
        document.getElementById('loginModal').classList.add('active');
        document.getElementById('adminDashboard').classList.remove('active');
        document.getElementById('loginForm').reset();
    }

    showDashboard() {
        document.getElementById('loginModal').classList.remove('active');
        document.getElementById('adminDashboard').classList.add('active');

        document.getElementById('currentUser').textContent =
            `${this.currentUser.name} 👑`;

        this.loadGalleryContent();
        this.loadStats();
        this.loadRecentActivity();
    }

    // ===== NAVIGATION =====

    switchTab(tabName) {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        this.currentTab = tabName;

        if (tabName === 'stats') {
            this.loadAnalytics();
        } else if (tabName === 'settings') {
            this.loadSettings();
        }
    }

    // ===== FILE UPLOAD =====

    setupFileUpload() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');

        dropZone.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) this.handleFiles(e.target.files);
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--accent-pink)';
            dropZone.style.background = '#f8f9fa';
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = 'var(--primary-pink)';
            dropZone.style.background = '';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--primary-pink)';
            dropZone.style.background = '';
            this.handleFiles(e.dataTransfer.files);
        });
    }

    handleFiles(files) {
        const file = files[0];
        if (!file || !this.validateFile(file)) return;

        this.selectedFile = file;

        // Ocultar dropzone, mostrar preview
        document.getElementById('dropZone').classList.add('hidden');
        const filePreview = document.getElementById('filePreview');
        filePreview.innerHTML = '';
        filePreview.classList.remove('hidden');
        filePreview.appendChild(this.createFilePreview(file));
    }

    clearSelectedFile() {
        this.selectedFile = null;
        document.getElementById('fileInput').value = '';
        document.getElementById('filePreview').innerHTML = '';
        document.getElementById('filePreview').classList.add('hidden');
        document.getElementById('dropZone').classList.remove('hidden');
    }

    validateFile(file) {
        const maxSize = 50 * 1024 * 1024; // 50MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mov', 'video/quicktime'];

        if (file.size > maxSize) {
            this.showToast(`El archivo ${file.name} es demasiado grande (máx. 50MB)`, 'error');
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            this.showToast(`Tipo de archivo no soportado: ${file.name}`, 'error');
            return false;
        }

        return true;
    }

    createFilePreview(file) {
        const div = document.createElement('div');
        div.className = 'file-preview-item';
        div.style.cssText = `
            position: relative;
            border-radius: 8px;
            overflow: hidden;
            background: #fff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;

        // Botón X para eliminar y elegir otro
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = 'Eliminar y elegir otro archivo';
        removeBtn.style.cssText = `
            position: absolute; top: 6px; right: 6px;
            background: rgba(0,0,0,0.6); color: #fff;
            border: none; border-radius: 50%;
            width: 26px; height: 26px; font-size: 1rem;
            line-height: 1; cursor: pointer; z-index: 10;
            display: flex; align-items: center; justify-content: center;
        `;
        removeBtn.addEventListener('click', () => this.clearSelectedFile());
        div.appendChild(removeBtn);

        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.style.cssText = `width: 100%; height: 120px; object-fit: cover;`;
            const reader = new FileReader();
            reader.onload = (e) => img.src = e.target.result;
            reader.readAsDataURL(file);
            div.appendChild(img);
        } else {
            const video = document.createElement('video');
            video.style.cssText = `width: 100%; height: 120px; object-fit: cover;`;
            video.controls = false;
            const reader = new FileReader();
            reader.onload = (e) => video.src = e.target.result;
            reader.readAsDataURL(file);
            div.appendChild(video);
        }

        const fileName = document.createElement('p');
        fileName.textContent = file.name;
        fileName.style.cssText = `padding: 8px; margin: 0; font-size: 0.8rem; text-align: center; background: #f8f9fa;`;
        div.appendChild(fileName);

        return div;
    }

    handleFileUpload() {
        const title = document.getElementById('title').value.trim();
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value.trim();
        const medidas = document.getElementById('medidas')?.value.trim() || '';

        if (!title || !category) {
            this.showToast('Por favor completa los campos obligatorios', 'error');
            return;
        }

        if (!this.selectedFile) {
            this.showToast('Por favor selecciona un archivo', 'error');
            return;
        }

        // Upload file to PocketBase
        this.uploadToPocketBase(title, category, description, medidas, this.selectedFile);
    }

    async uploadToPocketBase(title, category, description, medidas, file) {
        try {
            let processedFile = file;

            // Compress images client-side before upload
            if (file.type.startsWith('image/')) {
                this.showToast('Optimizando imagen...', 'info');
                processedFile = await compressImage(file);
                const savedKB = Math.round((file.size - processedFile.size) / 1024);
                if (savedKB > 0) {
                    console.log(`Image compressed: ${file.name} → ${processedFile.name} (saved ${savedKB}KB)`);
                }
            }

            this.showToast('Subiendo...', 'info');

            // Auto-detect tipo based on MIME type
            const tipo = processedFile.type.startsWith('image/') ? 'imagen' : 'video';

            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            if (medidas && medidas.trim()) formData.append('medidas', medidas.trim());
            formData.append('category', category);
            formData.append('tipo', tipo);
            formData.append('published', 'true');
            formData.append('orden', '0');
            formData.append('file', processedFile);

            const res = await fetch(`${PB_URL}/api/collections/amis_gallery/records`, {
                method: 'POST',
                headers: { 'Authorization': getToken() || '' },
                body: formData
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || `Error ${res.status}`);
            }

            this.showToast('¡Contenido subido exitosamente! 🎉', 'success');

            // Reset form and refresh gallery
            document.getElementById('uploadForm').reset();
            this.clearSelectedFile();

            await this.loadGalleryContent();
            await this.loadStats();

            this.switchTab('gallery');

        } catch (err) {
            this.showToast(`Error al subir: ${err.message}`, 'error');
        }
    }

    saveDraft() {
        const title = document.getElementById('title').value;
        const category = document.getElementById('category').value;

        if (!title) {
            this.showToast('Ingresa al menos un título para guardar el borrador', 'error');
            return;
        }

        const draft = {
            title,
            category,
            description: document.getElementById('description').value,
            savedAt: new Date().toISOString()
        };

        localStorage.setItem('amiDraft', JSON.stringify(draft));
        this.showToast('Borrador guardado 💾', 'success');
    }

    // ===== GALLERY =====

    async loadGalleryContent() {
        const galleryGrid = document.getElementById('galleryGrid');
        galleryGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #666;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i>
                <p>Cargando galería...</p>
            </div>
        `;

        try {
            const data = await pbGet('/api/collections/amis_gallery/records?sort=-id&perPage=200');
            this.galleryItems = data.items || [];
            this.renderGallery(this.galleryItems);
            this.updateCurrentStats();
        } catch (err) {
            galleryGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #e74c3c;">
                    <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>Error al cargar la galería</h3>
                    <p>${err.message}</p>
                </div>
            `;
        }
    }

    renderGallery(items) {
        const galleryGrid = document.getElementById('galleryGrid');
        galleryGrid.innerHTML = '';

        if (items.length === 0) {
            galleryGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-images" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No hay contenido aún</h3>
                    <p>Comienza subiendo tu primera creación</p>
                </div>
            `;
            return;
        }

        items.forEach(item => {
            const itemElement = this.createGalleryItem(item);
            galleryGrid.appendChild(itemElement);
        });
    }

    createGalleryItem(item) {
        const div = document.createElement('div');
        div.className = 'gallery-item slide-up';

        const isVideo = item.tipo === 'video';
        const fileUrl = item.file ? getFileUrl(item, !isVideo) : ''; // thumb for images, full for videos
        const publishedLabel = item.published ? 'Ocultar' : 'Publicar';
        const publishedIcon = item.published ? 'eye-slash' : 'eye';
        const categoryEmoji = this.getCategoryEmoji(item.category);
        const dateStr = this.formatDate(item.created);

        let mediaHTML = '';
        if (fileUrl) {
            if (isVideo) {
                mediaHTML = `<video src="${fileUrl}" muted preload="metadata" style="width:100%;height:180px;object-fit:cover;"></video>`;
            } else {
                mediaHTML = `<img src="${fileUrl}" alt="${item.title}" loading="lazy" style="width:100%;height:180px;object-fit:cover;">`;
            }
        } else {
            mediaHTML = `<div style="width:100%;height:180px;background:#f0e6f6;display:flex;align-items:center;justify-content:center;">
                <i class="fas fa-${isVideo ? 'video' : 'image'}" style="font-size:3rem;color:#ba68c8;"></i>
            </div>`;
        }

        // Badge: published vs draft
        const badge = item.published
            ? `<span style="background:#27ae60;color:#fff;font-size:0.7rem;padding:2px 8px;border-radius:12px;">Publicado</span>`
            : `<span style="background:#e74c3c;color:#fff;font-size:0.7rem;padding:2px 8px;border-radius:12px;">Oculto</span>`;

        div.innerHTML = `
            ${mediaHTML}
            <div class="gallery-item-info">
                <h4 class="gallery-item-title">${item.title}</h4>
                <div class="gallery-item-meta">
                    <span>${dateStr}</span>
                    <span>${categoryEmoji} ${item.category || ''}</span>
                    ${badge}
                </div>
                <div class="gallery-item-actions">
                    <button class="action-edit" onclick="adminPanel.editItem('${item.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="action-publish" onclick="adminPanel.togglePublish('${item.id}')">
                        <i class="fas fa-${publishedIcon}"></i>
                        ${publishedLabel}
                    </button>
                    <button class="action-delete" onclick="adminPanel.deleteItem('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        return div;
    }

    applyFilters() {
        const tipo = document.getElementById('tipoFilter')?.value || 'all';
        const category = document.getElementById('categoryFilter')?.value ?? 'all';

        let filtered = this.galleryItems;
        if (tipo !== 'all') filtered = filtered.filter(i => i.tipo === tipo);
        if (category !== 'all') filtered = filtered.filter(i => (i.category || '') === category);

        this.renderGallery(filtered);
    }

    filterGallery(category) {
        document.getElementById('categoryFilter').value = category;
        this.applyFilters();
    }

    toggleView() {
        this.isGridView = !this.isGridView;
        const viewToggle = document.getElementById('viewToggle');
        const galleryGrid = document.getElementById('galleryGrid');

        if (this.isGridView) {
            viewToggle.innerHTML = '<i class="fas fa-th"></i>';
            galleryGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
        } else {
            viewToggle.innerHTML = '<i class="fas fa-list"></i>';
            galleryGrid.style.gridTemplateColumns = '1fr';
        }
    }

    // ===== ITEM ACTIONS =====

    editItem(id) {
        const item = this.galleryItems.find(i => i.id === id);
        if (!item) return;

        this.editingItemId = id;

        document.getElementById('editTitle').value = item.title || '';
        document.getElementById('editDescription').value = item.description || '';

        const editMedidasEl = document.getElementById('editMedidas');
        if (editMedidasEl) editMedidasEl.value = item.medidas || '';

        // Add category field to edit modal if it exists
        const editCategory = document.getElementById('editCategory');
        if (editCategory) editCategory.value = item.category || '';

        document.getElementById('editModal').classList.add('active');
    }

    async saveEditItem() {
        if (!this.editingItemId) return;

        const title = document.getElementById('editTitle').value.trim();
        const description = document.getElementById('editDescription').value.trim();

        if (!title) {
            this.showToast('El título es requerido', 'error');
            return;
        }

        try {
            const editMedidasEl = document.getElementById('editMedidas');
            const medidas = editMedidasEl ? editMedidasEl.value.trim() : '';
            const patchData = { title, description, medidas };

            const editCategory = document.getElementById('editCategory');
            if (editCategory) {
                patchData.category = editCategory.value;
            }

            await pbPatch(`/api/collections/amis_gallery/records/${this.editingItemId}`, patchData);

            this.showToast('Cambios guardados correctamente', 'success');
            this.closeModal();
            this.editingItemId = null;
            await this.loadGalleryContent();

        } catch (err) {
            this.showToast(`Error al guardar: ${err.message}`, 'error');
        }
    }

    async togglePublish(id) {
        const item = this.galleryItems.find(i => i.id === id);
        if (!item) return;

        try {
            // Send all non-file fields — PocketBase runs full validation even on
            // PATCH, so a single-field update can fail if required fields are absent
            await pbPatch(`/api/collections/amis_gallery/records/${id}`, {
                title: item.title || '',
                description: item.description || '',
                category: item.category || '',
                tipo: item.tipo || 'image',
                orden: item.orden ?? 0,
                published: !item.published
            });

            const action = item.published ? 'ocultado' : 'publicado';
            this.showToast(`Contenido ${action}`, 'success');
            await this.loadGalleryContent();

        } catch (err) {
            this.showToast(`Error al cambiar estado: ${err.message}`, 'error');
        }
    }

    async deleteItem(id) {
        if (!confirm('¿Estás segura de que quieres eliminar este contenido?')) {
            return;
        }

        try {
            await pbDelete(`/api/collections/amis_gallery/records/${id}`);
            this.showToast('Contenido eliminado', 'success');
            await this.loadGalleryContent();
            await this.loadStats();

        } catch (err) {
            this.showToast(`Error al eliminar: ${err.message}`, 'error');
        }
    }

    // ===== STATISTICS =====

    async loadStats() {
        const totalImages = this.galleryItems.filter(i => i.tipo === 'imagen').length;
        const totalVideos = this.galleryItems.filter(i => i.tipo === 'video').length;

        const totalImagesEl = document.getElementById('totalImages');
        const totalVideosEl = document.getElementById('totalVideos');
        const totalViewsEl = document.getElementById('totalViews');
        const totalLikesEl = document.getElementById('totalLikes');

        if (totalImagesEl) totalImagesEl.textContent = totalImages;
        if (totalVideosEl) totalVideosEl.textContent = totalVideos;
        if (totalViewsEl) totalViewsEl.textContent = '—';
        if (totalLikesEl) totalLikesEl.textContent = '—';
    }

    loadRecentActivity() {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;

        const recentItems = [...this.galleryItems]
            .sort((a, b) => new Date(b.created) - new Date(a.created))
            .slice(0, 5);

        if (recentItems.length === 0) {
            activityList.innerHTML = `
                <div class="activity-item">
                    <i class="fas fa-info-circle"></i>
                    <div class="activity-content">
                        <h4>No hay actividad reciente</h4>
                        <p>La actividad aparecerá aquí cuando subas contenido</p>
                    </div>
                </div>
            `;
            return;
        }

        activityList.innerHTML = '';
        recentItems.forEach(item => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            const icon = item.tipo === 'video' ? 'fa-video' : 'fa-image';
            activityItem.innerHTML = `
                <i class="fas ${icon}"></i>
                <div class="activity-content">
                    <h4>Contenido ${item.published ? 'publicado' : 'guardado'}</h4>
                    <p>${item.title} - ${this.formatDate(item.created)}</p>
                </div>
            `;
            activityList.appendChild(activityItem);
        });
    }

    loadAnalytics() {
        const categoryStats = {};
        this.galleryItems.forEach(item => {
            const key = item.category || 'sin categoría';
            categoryStats[key] = (categoryStats[key] || 0) + 1;
        });

        const categoryChart = document.getElementById('categoryChart');
        if (!categoryChart) return;

        categoryChart.innerHTML = '';

        if (Object.keys(categoryStats).length === 0) {
            categoryChart.innerHTML = '<p style="color:#999;text-align:center;padding:1rem;">Sin datos</p>';
            return;
        }

        Object.entries(categoryStats).forEach(([category, count]) => {
            const bar = document.createElement('div');
            bar.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                margin: 8px 0;
                background: var(--primary-pink);
                border-radius: 6px;
            `;
            bar.innerHTML = `
                <span>${this.getCategoryEmoji(category)} ${category}</span>
                <span style="font-weight: bold;">${count}</span>
            `;
            categoryChart.appendChild(bar);
        });
    }

    // ===== SETTINGS =====

    async loadSettings() {
        // Load WhatsApp settings from PocketBase, fallback to localStorage
        try {
            const waData = await this.getConfigFromPB('whatsapp_number');
            const waMsgData = await this.getConfigFromPB('whatsapp_message');

            const number = waData || localStorage.getItem('amis_wa_number') || '5492604201185';
            const message = waMsgData || localStorage.getItem('amis_wa_message') || '¡Hola! Me interesa hacer un pedido de goma eva 💕';

            document.getElementById('whatsappNumber').value = number;
            document.getElementById('whatsappMessage').value = message;

        } catch (err) {
            // Fallback to localStorage
            const waLS = JSON.parse(localStorage.getItem('whatsappSettings') || '{"number":"5492604201185","message":"¡Hola! Me interesa hacer un pedido"}');
            document.getElementById('whatsappNumber').value = waLS.number;
            document.getElementById('whatsappMessage').value = waLS.message;
        }

        // Load about stats from PocketBase, fallback to localStorage
        try {
            const creaciones = await this.getConfigFromPB('stat_creaciones');
            const clientes = await this.getConfigFromPB('stat_clientes');

            document.getElementById('totalCreaciones').value = creaciones || 1000;
            document.getElementById('clientesFelices').value = clientes || 277;

        } catch (err) {
            const statsLS = JSON.parse(localStorage.getItem('aboutStats') || '{"creaciones":1000,"clientes":277}');
            document.getElementById('totalCreaciones').value = statsLS.creaciones;
            document.getElementById('clientesFelices').value = statsLS.clientes;
        }

        this.updateCurrentStats();
    }

    async getConfigFromPB(key) {
        try {
            const data = await pbGet(`/api/collections/amis_config/records?filter=(key="${key}")`);
            const record = (data.items || [])[0];
            return record ? record.value : null;
        } catch {
            return null;
        }
    }

    async setConfigInPB(key, value) {
        try {
            // Try to find existing record
            const data = await pbGet(`/api/collections/amis_config/records?filter=(key="${key}")`);
            const existing = (data.items || [])[0];

            if (existing) {
                await pbPatch(`/api/collections/amis_config/records/${existing.id}`, { value });
            } else {
                // Create new record
                const res = await fetch(`${PB_URL}/api/collections/amis_config/records`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({ key, value })
                });
                if (!res.ok) throw new Error(`Failed to create config ${key}`);
            }
        } catch (err) {
            throw err;
        }
    }

    async saveWhatsappSettings() {
        const number = document.getElementById('whatsappNumber').value.trim();
        const message = document.getElementById('whatsappMessage').value.trim();

        if (!number) {
            this.showToast('El número de WhatsApp es requerido', 'error');
            return;
        }

        try {
            await this.setConfigInPB('whatsapp_number', number);
            await this.setConfigInPB('whatsapp_message', message);

            // Also update localStorage for compatibility with main.js
            localStorage.setItem('whatsappSettings', JSON.stringify({ number, message }));
            localStorage.setItem('amis_wa_number', number);
            localStorage.setItem('amis_wa_message', message);

            this.showToast('Configuración de WhatsApp guardada exitosamente! 🎉', 'success');

        } catch (err) {
            // Fallback: save only to localStorage
            localStorage.setItem('whatsappSettings', JSON.stringify({ number, message }));
            this.showToast('Guardado localmente (PocketBase no disponible)', 'info');
        }
    }

    async saveAboutStats() {
        const creaciones = parseInt(document.getElementById('totalCreaciones').value) || 1000;
        const clientes = parseInt(document.getElementById('clientesFelices').value) || 277;

        try {
            await this.setConfigInPB('stat_creaciones', String(creaciones));
            await this.setConfigInPB('stat_clientes', String(clientes));

            // Also update localStorage for compatibility with main.js
            localStorage.setItem('aboutStats', JSON.stringify({ creaciones, clientes }));

            this.showToast('Estadísticas actualizadas exitosamente! 📊', 'success');

        } catch (err) {
            localStorage.setItem('aboutStats', JSON.stringify({ creaciones, clientes }));
            this.showToast('Guardado localmente (PocketBase no disponible)', 'info');
        }
    }

    updateWebsiteStats(creaciones, clientes) {
        // Update the main website's stats via localStorage
        const statEls = document.querySelectorAll('.stat-number');
        if (statEls[0]) {
            statEls[0].dataset.target = creaciones;
            statEls[0].textContent = creaciones + '+';
        }
        if (statEls[1]) {
            statEls[1].dataset.target = clientes;
            statEls[1].textContent = clientes;
        }
    }

    updateCurrentStats() {
        const imageCount = this.galleryItems.filter(i => i.tipo === 'imagen').length;
        const videoCount = this.galleryItems.filter(i => i.tipo === 'video').length;

        const currentImages = document.getElementById('currentImages');
        const currentVideos = document.getElementById('currentVideos');

        if (currentImages) currentImages.textContent = imageCount;
        if (currentVideos) currentVideos.textContent = videoCount;
    }

    // ===== UTILITY FUNCTIONS =====

    getCategoryEmoji(category) {
        const emojis = {
            'baby-shower': '🍼',
            'material-educativo': '📚',
            'personajes': '🦸',
            'recursos-didacticos': '📐',
            'toppers': '🎂',
            'libros-sensoriales': '📕'
        };
        return emojis[category] || '📁';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        this.editingItemId = null;
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastContent = toast.querySelector('.toast-content');
        const toastMessage = document.getElementById('toastMessage');

        toastMessage.textContent = message;
        toastContent.className = `toast-content ${type}`;

        toast.classList.add('show');

        setTimeout(() => {
            this.hideToast();
        }, 4000);
    }

    hideToast() {
        document.getElementById('toast').classList.remove('show');
    }
}

// Initialize the admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});
