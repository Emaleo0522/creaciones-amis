# Creaciones AMIS — Web con Panel Administrativo

Web profesional para Creaciones AMIS, emprendimiento de artesanias (aretes, llaveros, decoraciones). Galeria de productos, panel de administracion para dos administradoras y SEO completo con llms.txt para visibilidad en IAs.

## Funcionalidades

### Web publica
- Galeria de productos con filtros por categoria
- Animaciones GSAP de scroll reveal
- SEO: sitemap.xml, robots.txt, manifest.json
- llms.txt + llms-full.txt para indexacion en ChatGPT, Perplexity y Claude

### Panel de Administracion (/admin.html)
- Acceso con contrasena — dos perfiles (Admin Principal y Creativa)
- Galeria de contenido: ver, editar, publicar/ocultar, eliminar
- Subir contenido con drag and drop y vista previa
- Filtrado por categorias: Aretes, Llaveros, Decoraciones

## Stack

- HTML5 + CSS3 + JavaScript vanilla
- GSAP (animaciones y scroll reveal)
- Sin frameworks ni dependencias de build
- Deploy: Vercel

## Archivos principales

| Archivo | Funcion |
|---------|---------|
| index.html | Web publica |
| admin.html | Panel administrativo |
| js/main.js | Logica de la web |
| js/admin-script.js | Logica del panel |
| sitemap.xml | SEO sitemap |
| llms.txt | Visibilidad en IAs |

## Seguridad

Panel admin con X-Robots-Tag: noindex y Cache-Control: no-store en vercel.json.
