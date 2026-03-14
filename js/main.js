// Creaciones AMIS — Main JavaScript con GSAP Animations

// Registrar plugins de GSAP
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initHeroAnimations();
    initScrollAnimations();
    initMobileMenu();
    initNavbarScroll();
    initSmoothScroll();
    initContactForm();
    loadGalleryItems();
    initLightbox();
    updateWhatsAppLinks();
    updateAboutStats();
    initStatsCounter();
    initWhatsAppFloat();
    initRippleEffect();
});

// ============================================
// HERO ANIMATIONS
// ============================================
function initHeroAnimations() {
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    heroTl
        .to('.hero-title-main', {
            opacity: 1,
            y: 0,
            duration: 0.7
        })
        .to('.hero-title-accent', {
            opacity: 1,
            y: 0,
            duration: 0.7
        }, '-=0.4')
        .to('.hero-subtitle', {
            opacity: 1,
            y: 0,
            duration: 0.6
        }, '-=0.4')
        .to('.hero-pills', {
            opacity: 1,
            y: 0,
            duration: 0.6
        }, '-=0.3')
        .to('.hero-buttons', {
            opacity: 1,
            y: 0,
            duration: 0.6
        }, '-=0.3')
        .from('.hero-badge', {
            opacity: 0,
            scale: 0.85,
            duration: 0.5,
            ease: 'back.out(1.7)'
        }, 0.1);

    // Floating elements en hero
    const floatItems = document.querySelectorAll('.float-item');
    floatItems.forEach((item, i) => {
        gsap.to(item, {
            y: -18,
            duration: 2.5 + i * 0.4,
            repeat: -1,
            yoyo: true,
            ease: 'power2.inOut',
            delay: i * 0.6
        });
    });

    // Logo circle pulse sutil
    gsap.fromTo('.hero-logo-circle',
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.9, ease: 'back.out(1.4)', delay: 0.3 }
    );
}

// ============================================
// SCROLL ANIMATIONS
// ============================================
function initScrollAnimations() {
    // Productos cards con stagger
    gsap.from('.producto-card', {
        scrollTrigger: {
            trigger: '.productos-grid',
            start: 'top 82%',
            toggleActions: 'play none none reverse'
        },
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power3.out'
    });

    // Section titles
    document.querySelectorAll('.section-title').forEach(title => {
        gsap.from(title, {
            scrollTrigger: {
                trigger: title,
                start: 'top 88%',
                toggleActions: 'play none none reverse'
            },
            y: 30,
            opacity: 0,
            duration: 0.7,
            ease: 'power3.out'
        });
    });

    // About text children
    gsap.from('.about-text > *', {
        scrollTrigger: {
            trigger: '.about-content',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
        },
        x: -40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power3.out'
    });

    // About visual
    gsap.from('.about-placeholder', {
        scrollTrigger: {
            trigger: '.about-content',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
        },
        scale: 0.9,
        opacity: 0,
        duration: 0.9,
        ease: 'back.out(1.4)'
    });

    // About placeholder continuous float
    gsap.to('.about-placeholder', {
        y: -8,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut',
        delay: 1
    });

    // About placeholder 3D on mouse move
    const placeholder = document.querySelector('.about-placeholder');
    if (placeholder) {
        placeholder.addEventListener('mousemove', (e) => {
            const rect = placeholder.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            gsap.to(placeholder, {
                rotationY: x / 12,
                rotationX: -y / 12,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
        placeholder.addEventListener('mouseleave', () => {
            gsap.to(placeholder, {
                rotationY: 0,
                rotationX: 0,
                duration: 0.6,
                ease: 'power2.out'
            });
        });
    }

    // Contact form slide in
    gsap.from('.contact-form-wrap', {
        scrollTrigger: {
            trigger: '.contact-content',
            start: 'top 82%',
            toggleActions: 'play none none reverse'
        },
        x: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
    });

    gsap.from('.contact-info > *', {
        scrollTrigger: {
            trigger: '.contact-content',
            start: 'top 82%',
            toggleActions: 'play none none reverse'
        },
        x: -40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out'
    });

    // Galería titles
    gsap.from('.gallery-block-title', {
        scrollTrigger: {
            trigger: '.galeria',
            start: 'top 85%',
            toggleActions: 'play none none reverse'
        },
        y: 24,
        opacity: 0,
        duration: 0.6,
        stagger: 0.2,
        ease: 'power2.out'
    });
}

// ============================================
// STATS COUNTER ANIMATION
// ============================================
function initStatsCounter() {
    const statNumbers = document.querySelectorAll('.stat-number');
    if (!statNumbers.length) return;

    let animated = false;

    ScrollTrigger.create({
        trigger: '.stats',
        start: 'top 82%',
        onEnter: () => {
            if (animated) return;
            animated = true;

            statNumbers.forEach(stat => {
                const target = parseInt(stat.dataset.target || stat.textContent, 10);
                const suffix = stat.dataset.suffix || '';
                const duration = 1.8;

                gsap.fromTo(stat,
                    { textContent: 0 },
                    {
                        textContent: target,
                        duration,
                        ease: 'power2.out',
                        snap: { textContent: 1 },
                        onUpdate: function () {
                            stat.textContent = Math.round(this.targets()[0].textContent) + suffix;
                        },
                        onComplete: () => {
                            stat.textContent = target + suffix;
                        }
                    }
                );
            });
        }
    });
}

// ============================================
// WHATSAPP FLOATING BUTTON
// ============================================
function initWhatsAppFloat() {
    const btn = document.querySelector('.whatsapp-float');
    if (!btn) return;

    // Aparece después de 2s o al hacer scroll
    const showFloat = () => {
        gsap.to(btn, {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            ease: 'back.out(1.7)'
        });
    };

    setTimeout(showFloat, 2000);

    ScrollTrigger.create({
        trigger: '.productos',
        start: 'top 90%',
        onEnter: showFloat
    });
}

// ============================================
// NAVBAR SCROLL
// ============================================
function initNavbarScroll() {
    const header = document.getElementById('header');
    if (!header) return;

    ScrollTrigger.create({
        start: 'top -80',
        end: 99999,
        toggleClass: { className: 'scrolled', targets: header }
    });
}

// ============================================
// SMOOTH SCROLL
// ============================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (!target) return;

            const headerHeight = document.getElementById('header')?.offsetHeight || 70;

            gsap.to(window, {
                duration: 0.5,
                scrollTo: { y: target, offsetY: headerHeight },
                ease: 'power2.out'
            });
        });
    });
}

// ============================================
// MOBILE MENU
// ============================================
function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    if (!hamburger || !navMenu) return;

    hamburger.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('active');
        hamburger.classList.toggle('active', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
        // Fix overlay: bloquear scroll del body cuando el menu está abierto
        document.body.style.overflow = isOpen ? 'hidden' : '';

        if (isOpen) {
            gsap.fromTo('.nav-menu a',
                { opacity: 0, x: -12 },
                { opacity: 1, x: 0, duration: 0.3, stagger: 0.05, ease: 'power2.out' }
            );
        }
    });

    // Cerrar al hacer click en un link (con delay para smooth scroll)
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            setTimeout(() => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }, 300);
        });
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    });

    // Copyright dinámico
    const yearEl = document.getElementById('footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
}

// ============================================
// CONTACT FORM
// ============================================
function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('.btn-submit');
        gsap.to(submitBtn, {
            scale: 0.96,
            duration: 0.15,
            yoyo: true,
            repeat: 1,
            ease: 'power2.inOut'
        });

        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        const mensaje = buildWhatsAppMessage(data);

        const whatsappSettings = JSON.parse(localStorage.getItem('whatsappSettings') || '{"number":"5492604201185"}');
        const whatsappNumber = whatsappSettings.number || '5492604201185';
        const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensaje)}`;

        window.open(whatsappURL, '_blank');

        setTimeout(() => contactForm.reset(), 500);
    });
}

function buildWhatsAppMessage(data) {
    const categorias = {
        'baby-shower': 'Baby Shower',
        'material-educativo': 'Material Educativo',
        'personajes': 'Personajes Temáticos',
        'recursos-didacticos': 'Recursos Didácticos',
        'toppers': 'Toppers & Decoraciones',
        'libros-sensoriales': 'Libros Sensoriales',
        'otro': 'Otro'
    };

    return `*NUEVO PEDIDO - CREACIONES AMIS*

*Cliente:* ${data.nombre}
*WhatsApp:* ${data.whatsapp}
*Categoría:* ${categorias[data.categoria] || data.categoria}

*Pedido:*
${data.mensaje}

---
*Enviado desde:* creacionesamis.com
*Fecha:* ${new Date().toLocaleDateString('es-AR')} - ${new Date().toLocaleTimeString('es-AR')}`;
}

// ============================================
// GALLERY — MEDIA FILES
// ============================================

// Backend: PocketBase via nginx + Let's Encrypt (HTTPS permanente)
// URL estable — no cambia con reinicios del servidor
const PB_URL = 'https://161-153-203-83.sslip.io';

// Local assets fallback — used when PocketBase is unavailable
const localImages = [
    { id: 'local_1', file: '495481936_17869546068360446_4321890648862777476_n.webp', tipo: 'imagen', title: 'Creación AMIS', isLocal: true },
    { id: 'local_2', file: '500252526_17871779073360446_7923867554632101391_n.webp', tipo: 'imagen', title: 'Creación AMIS', isLocal: true },
    { id: 'local_3', file: '500424849_17871779412360446_7347147921063245909_n.webp', tipo: 'imagen', title: 'Creación AMIS', isLocal: true },
    { id: 'local_4', file: '515820675_17877820587360446_2413955756290613320_n.webp', tipo: 'imagen', title: 'Creación AMIS', isLocal: true },
    { id: 'local_5', file: '517721253_17878137654360446_5927085289899163555_n.webp', tipo: 'imagen', title: 'Creación AMIS', isLocal: true },
    { id: 'local_6', file: '526301283_17880956070360446_9076310641475082024_n.webp', tipo: 'imagen', title: 'Creación AMIS', isLocal: true },
    { id: 'local_7', file: '526392698_17880956067360446_2314655669405267939_n.webp', tipo: 'imagen', title: 'Creación AMIS', isLocal: true },
    { id: 'local_8', file: 'Instagram highlights stories 17936682401968585.webp', tipo: 'imagen', title: 'Creación AMIS', isLocal: true }
];

const localVideos = [
    { id: 'local_v1', file: 'Instagram highlights stories 17936682401968585 (1).mp4', tipo: 'video', title: 'Video AMIS', isLocal: true },
    { id: 'local_v2', file: 'Instagram highlights stories 17936682401968585 (2).mp4', tipo: 'video', title: 'Video AMIS', isLocal: true },
    { id: 'local_v3', file: 'Instagram highlights stories 17936682401968585.mp4', tipo: 'video', title: 'Video AMIS', isLocal: true },
    { id: 'local_v4', file: 'Instagram highlights stories 18292519975218790.mp4', tipo: 'video', title: 'Video AMIS', isLocal: true },
    { id: 'local_v5', file: 'Lectómetro que eligió Gise para fluidez lectora 📖💕Gracias 🫂 por cada pedido!.mp4', tipo: 'video', title: 'Lectómetro', isLocal: true },
    { id: 'local_v6', file: 'Un pequeño ya está disfrutando su libro sensorial!📕💡📚Gracias Carla!Tamaño A4 en tela y goma E.mp4', tipo: 'video', title: 'Libro Sensorial', isLocal: true },
    { id: 'local_v7', file: 'AQO_dHGDjQM0EzQW0vPSlS2X5jB3Mo7_GKGaRpFF1uRnzbQehKCaVXajNYzfSbxk3i4olhwDZq06R6U0XJfHCXOMKuDi1jbw.mp4', tipo: 'video', title: 'Video AMIS', isLocal: true }
];

function getPBFileUrl(record) {
    return `${PB_URL}/api/files/amis_gallery/${record.id}/${record.file}`;
}

// Returns a resized thumbnail URL using PocketBase's built-in image processor.
// ?thumb=WxH — W or H = 0 means proportional scale. e.g. 600x0 = 600px wide, auto height.
function getPBThumbUrl(record, width = 600) {
    return `${PB_URL}/api/files/amis_gallery/${record.id}/${record.file}?thumb=${width}x0`;
}

function getLocalImageUrl(record) {
    return `assets/gallery/${record.file}`;
}

function getLocalVideoUrl(record) {
    return `assets/videos/${record.file}`;
}

// Full URL — used for lightbox full-res view and for videos
function getMediaUrl(record) {
    if (record.isLocal) {
        return record.tipo === 'video' ? getLocalVideoUrl(record) : getLocalImageUrl(record);
    }
    return getPBFileUrl(record);
}

// Thumb URL — used for gallery grid display (saves bandwidth)
function getMediaThumbUrl(record) {
    if (record.isLocal || record.tipo === 'video') {
        return getMediaUrl(record);
    }
    return getPBThumbUrl(record, 600);
}

let currentImageIndex = 0;
let currentImageList = [];

async function loadGalleryItems() {
    try {
        const res = await fetch(
            `${PB_URL}/api/collections/amis_gallery/records?filter=(published=true)&sort=+orden&perPage=200`
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const items = data.items || [];

        const pbImages = items.filter(i => i.tipo === 'imagen');
        const pbVideos = items.filter(i => i.tipo === 'video');

        renderImageGallery(pbImages);
        renderVideoGallery(pbVideos);

    } catch (e) {
        // PocketBase not reachable — use local assets as fallback
        loadLocalGallery();
    }
}

function loadLocalGallery() {
    renderImageGallery(localImages);
    renderVideoGallery(localVideos);
}

// ============================================
// IMAGE GALLERY
// ============================================
function renderImageGallery(images) {
    const imageGallery = document.getElementById('image-gallery');
    if (!imageGallery) return;

    imageGallery.innerHTML = '';

    // Build list: thumbUrl for gallery display (optimized), url for lightbox (full res)
    const imageList = images.map((item, index) => ({
        ...item,
        url: getMediaUrl(item),
        thumbUrl: getMediaThumbUrl(item)
    }));

    imageList.forEach((item, index) => {
        const imgTitle = item.title || `Creación AMIS ${index + 1}`;

        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.setAttribute('role', 'listitem');
        galleryItem.setAttribute('tabindex', '0');
        galleryItem.setAttribute('aria-label', `Ver imagen: ${imgTitle}`);
        galleryItem.setAttribute('data-title', imgTitle);

        // Build caption only if there's description or medidas
        const hasDesc = item.description && item.description.trim();
        const hasMedidas = item.medidas && item.medidas.trim();
        const captionHtml = (hasDesc || hasMedidas) ? `
            <div class="gallery-caption">
              <div class="gallery-caption-title">${imgTitle}</div>
              ${hasDesc ? `<div class="gallery-caption-desc">${item.description}</div>` : ''}
              ${hasMedidas ? `<div class="gallery-caption-medidas">📐 Medidas: ${item.medidas}</div>` : ''}
            </div>` : '';

        galleryItem.innerHTML = `
            <img src="${item.thumbUrl}" alt="${imgTitle}" loading="lazy">
            <i class="fas fa-search gallery-zoom-icon" aria-hidden="true"></i>
            ${captionHtml}
        `;

        galleryItem.addEventListener('click', () => openLightbox(index, imageList));
        galleryItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox(index, imageList);
            }
        });

        imageGallery.appendChild(galleryItem);
    });

    // GSAP animation para items de imagen
    gsap.set('.image-gallery .gallery-item', { opacity: 0, y: 20 });

    gsap.to('.image-gallery .gallery-item', {
        scrollTrigger: {
            trigger: '.image-gallery',
            start: 'top 82%',
            toggleActions: 'play none none reverse'
        },
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out'
    });
}

// Keep backward compat alias
function loadImageGallery() {
    renderImageGallery(localImages);
}

// ============================================
// VIDEO GALLERY
// ============================================
function renderVideoGallery(videos) {
    const mainVideo = document.getElementById('mainVideo');
    const thumbnailContainer = document.getElementById('videoThumbnails');
    if (!mainVideo || !thumbnailContainer) return;

    thumbnailContainer.innerHTML = '';

    if (videos.length > 0) {
        mainVideo.src = getMediaUrl(videos[0]);
        detectVideoOrientation(mainVideo);
    }

    videos.forEach((item, index) => {
        const videoSrc = getMediaUrl(item);

        const thumbContainer = document.createElement('div');
        thumbContainer.className = `video-thumb${index === 0 ? ' active' : ''}`;
        thumbContainer.setAttribute('role', 'listitem');
        thumbContainer.setAttribute('tabindex', '0');
        thumbContainer.setAttribute('aria-label', `Reproducir video ${index + 1}`);

        const thumb = document.createElement('video');
        thumb.src = videoSrc;
        thumb.muted = true;
        thumb.preload = 'metadata';
        thumbContainer.appendChild(thumb);

        thumbContainer.addEventListener('click', () => switchVideo(videoSrc, thumbContainer));
        thumbContainer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                switchVideo(videoSrc, thumbContainer);
            }
        });

        thumbnailContainer.appendChild(thumbContainer);
    });

    // GSAP para video gallery
    gsap.set('.video-thumbnails .video-thumb', { opacity: 0, y: 24 });

    gsap.to('.video-thumbnails .video-thumb', {
        scrollTrigger: {
            trigger: '.video-gallery-preview',
            start: 'top 82%',
            toggleActions: 'play none none reverse'
        },
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out'
    });

    gsap.fromTo('.main-video',
        { opacity: 0, scale: 0.94 },
        {
            scrollTrigger: {
                trigger: '.video-gallery-preview',
                start: 'top 86%',
                toggleActions: 'play none none reverse'
            },
            opacity: 1,
            scale: 1,
            duration: 0.7,
            ease: 'power2.out'
        }
    );
}

// Keep backward compat alias
function loadVideoGallery() {
    renderVideoGallery(localVideos);
}

// ============================================
// VIDEO ORIENTATION DETECTION
// ============================================
// Detects if a video is portrait or landscape from its metadata
// and applies the appropriate CSS class for adaptive display.
function detectVideoOrientation(videoEl) {
    if (!videoEl) return;

    const applyOrientation = () => {
        if (!videoEl.videoWidth || !videoEl.videoHeight) return;
        const isPortrait = videoEl.videoHeight > videoEl.videoWidth;
        videoEl.classList.remove('video-portrait', 'video-landscape');
        videoEl.classList.add(isPortrait ? 'video-portrait' : 'video-landscape');
    };

    if (videoEl.readyState >= 1) {
        // Metadata already available (e.g. browser cached it)
        applyOrientation();
    } else {
        videoEl.addEventListener('loadedmetadata', applyOrientation, { once: true });
    }
}

function switchVideo(src, thumbContainer) {
    const mainVideo = document.getElementById('mainVideo');
    if (!mainVideo) return;

    mainVideo.src = src;
    detectVideoOrientation(mainVideo);

    document.querySelectorAll('.video-thumb').forEach(t => t.classList.remove('active'));
    thumbContainer.classList.add('active');

    gsap.fromTo(mainVideo,
        { opacity: 0, scale: 0.94 },
        { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }
    );
}

// ============================================
// LIGHTBOX
// ============================================
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    document.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.querySelector('.lightbox-prev')?.addEventListener('click', () => changeImage('prev'));
    document.querySelector('.lightbox-next')?.addEventListener('click', () => changeImage('next'));

    document.addEventListener('keydown', (e) => {
        if (lightbox.style.display !== 'block') return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') changeImage('prev');
        if (e.key === 'ArrowRight') changeImage('next');
    });
}

function openLightbox(index, imagesList) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const currentSpan = document.getElementById('current-image');
    const totalSpan = document.getElementById('total-images');

    currentImageList = imagesList || images.map(src => ({ url: src, title: 'Creación AMIS', source: 'static' }));
    currentImageIndex = index;

    const current = currentImageList[currentImageIndex];
    const src = current.url || current.file || current;

    lightboxImage.src = src;
    lightboxImage.alt = current.title || `Creación AMIS ${currentImageIndex + 1}`;
    currentSpan.textContent = currentImageIndex + 1;
    totalSpan.textContent = currentImageList.length;

    // Update lightbox info (description + medidas)
    let infoEl = document.getElementById('lightbox-info');
    if (!infoEl) {
        infoEl = document.createElement('div');
        infoEl.id = 'lightbox-info';
        infoEl.className = 'lightbox-info';
        // Insert after the image counter element
        const counter = lightbox.querySelector('.lightbox-counter') || currentSpan?.closest('.lightbox-counter');
        if (counter) counter.after(infoEl);
        else lightbox.appendChild(infoEl);
    }
    const lbTitle = current.title || '';
    const lbDesc = current.description?.trim() || '';
    const lbMedidas = current.medidas?.trim() || '';
    if (lbTitle || lbDesc || lbMedidas) {
        infoEl.innerHTML = `
            ${lbTitle ? `<div class="lightbox-info-title">${lbTitle}</div>` : ''}
            ${lbDesc ? `<div class="lightbox-info-desc">${lbDesc}</div>` : ''}
            ${lbMedidas ? `<div class="lightbox-info-medidas">📐 Medidas: ${lbMedidas}</div>` : ''}
        `;
        infoEl.style.display = 'block';
    } else {
        infoEl.style.display = 'none';
    }

    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden';

    gsap.fromTo(lightbox,
        { opacity: 0 },
        { opacity: 1, duration: 0.25 }
    );
    gsap.fromTo(lightboxImage,
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.5)' }
    );
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    gsap.to(lightbox, {
        opacity: 0,
        duration: 0.25,
        onComplete: () => {
            lightbox.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
}

function changeImage(direction) {
    const lightboxImage = document.getElementById('lightbox-image');
    const currentSpan = document.getElementById('current-image');

    if (direction === 'next') {
        currentImageIndex = (currentImageIndex + 1) % currentImageList.length;
    } else {
        currentImageIndex = (currentImageIndex - 1 + currentImageList.length) % currentImageList.length;
    }

    gsap.to(lightboxImage, {
        opacity: 0,
        scale: 0.9,
        duration: 0.18,
        onComplete: () => {
            const current = currentImageList[currentImageIndex];
            const src = current.url || current.file || current;
            lightboxImage.src = src;
            lightboxImage.alt = current.title || `Creación AMIS ${currentImageIndex + 1}`;
            currentSpan.textContent = currentImageIndex + 1;

            gsap.to(lightboxImage, {
                opacity: 1,
                scale: 1,
                duration: 0.25,
                ease: 'power2.out'
            });
        }
    });
}

// ============================================
// UPDATE WHATSAPP LINKS (admin settings)
// ============================================
async function updateWhatsAppLinks() {
    let number = '5492604201185';
    let message = '¡Hola! Me interesa hacer un pedido';

    // Try reading from PocketBase config (no auth needed if rule allows)
    try {
        const res = await fetch(`${PB_URL}/api/collections/amis_config/records?filter=(key="whatsapp_number")`, {
            headers: { 'Authorization': sessionStorage.getItem('amis_token') || '' }
        });
        if (res.ok) {
            const data = await res.json();
            const record = (data.items || [])[0];
            if (record && record.value) number = record.value;
        }
    } catch {
        // Fallback to localStorage
    }

    try {
        const res = await fetch(`${PB_URL}/api/collections/amis_config/records?filter=(key="whatsapp_message")`, {
            headers: { 'Authorization': sessionStorage.getItem('amis_token') || '' }
        });
        if (res.ok) {
            const data = await res.json();
            const record = (data.items || [])[0];
            if (record && record.value) message = record.value;
        }
    } catch {
        // Fallback to localStorage
    }

    // Merge with localStorage values (localStorage wins if PB not available)
    const settings = JSON.parse(localStorage.getItem('whatsappSettings') || '{}');
    if (!settings.number && number) settings.number = number;
    if (!settings.message && message) settings.message = message;

    const finalNumber = settings.number || number;
    const finalMessage = settings.message || message;

    document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
        link.href = `https://wa.me/${finalNumber}?text=${encodeURIComponent(finalMessage)}`;
    });
}

// ============================================
// UPDATE ABOUT STATS (admin settings)
// ============================================
async function updateAboutStats() {
    let creaciones = null;
    let clientes = null;

    // Try reading from PocketBase config
    try {
        const token = sessionStorage.getItem('amis_token') || '';
        const headers = token ? { 'Authorization': token } : {};

        const resC = await fetch(`${PB_URL}/api/collections/amis_config/records?filter=(key="stat_creaciones")`, { headers });
        if (resC.ok) {
            const d = await resC.json();
            const r = (d.items || [])[0];
            if (r && r.value) creaciones = parseInt(r.value, 10);
        }

        const resK = await fetch(`${PB_URL}/api/collections/amis_config/records?filter=(key="stat_clientes")`, { headers });
        if (resK.ok) {
            const d = await resK.json();
            const r = (d.items || [])[0];
            if (r && r.value) clientes = parseInt(r.value, 10);
        }
    } catch {
        // Fallback to localStorage
    }

    // Use localStorage as fallback
    if (creaciones === null || clientes === null) {
        const statsData = JSON.parse(localStorage.getItem('aboutStats') || '{"creaciones":1000,"clientes":277}');
        if (creaciones === null) creaciones = statsData.creaciones || 1000;
        if (clientes === null) clientes = statsData.clientes || 277;
    }

    const statEls = document.querySelectorAll('.stat-number');
    if (statEls[0]) {
        statEls[0].dataset.target = creaciones;
        statEls[0].dataset.suffix = '+';
        statEls[0].textContent = creaciones + '+';
    }
    if (statEls[1]) {
        statEls[1].dataset.target = clientes;
        statEls[1].dataset.suffix = '';
        statEls[1].textContent = clientes;
    }
}

// ============================================
// RIPPLE EFFECT EN BOTONES
// ============================================
function initRippleEffect() {
    document.querySelectorAll('.btn, .btn-submit, .btn-whatsapp-direct').forEach(btn => {
        btn.style.position = 'relative';
        btn.style.overflow = 'hidden';

        btn.addEventListener('click', function (e) {
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.35);
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
                transform: scale(0);
                animation: ripple-anim 0.55s linear forwards;
            `;
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Inyectar keyframe de ripple
    if (!document.getElementById('ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            @keyframes ripple-anim {
                to { transform: scale(4); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}
