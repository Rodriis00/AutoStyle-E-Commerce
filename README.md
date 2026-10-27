# 🚗 AutoStyle — E-Commerce Especializado

Plataforma e-commerce full-stack orientada a la personalización y protección vehicular, diseñada bajo metodología ágil y arquitectura desacoplada orientada a servicios.

## Stack Tecnológico
- **Frontend:** React + Tailwind CSS (Diseño responsivo y accesible WCAG 2.1 AA).
- **Backend:** Node.js / Express (API RESTful, JWT RBAC, multer para gestión de medios).
- **Base de Datos:** PostgreSQL con transacciones ACID y Docker Compose.
- **Infraestructura:** Azure Virtual Machine (Ubuntu), Nginx (Reverse Proxy) y PM2.

## Características Principales
- Autenticación segura y control de acceso basado en roles (Admin / Cliente / Invitado).
- Catálogo interactivo con filtrado multicriterio y motor de recomendaciones mediante cookies de navegación (`as_nav_pref`).
- Panel de administración para gestión CRUD de productos (con carga de imágenes reales) y control de stock.
- Checkout con pasarela simulada validada mediante el Algoritmo de Luhn y soporte de tokens virtuales.
