[readme.md](https://github.com/user-attachments/files/30747472/readme.md)
# SecureFlow ADSO - Sistema Integral de Control y Acceso

## 🚀 Descripción

**SecureFlow ADSO** es un sistema de control de acceso y gestión de usuarios desarrollado para el reto Hackathon. Implementa estándares de seguridad robustos incluyendo autenticación JWT, control de acceso basado en roles (RBAC), validación en doble capa, y protección contra SQL Injection, XSS y CSRF.

## 🛡️ Características de Seguridad

- **Autenticación JWT** con expiración por inactividad (5 minutos)
- **RBAC** con roles: Administrador y Usuario
- **Validación en Frontend y Backend**
- **Protección contra SQL Injection** (Prepared Statements)
- **Prevención de XSS** (Sanitización de entrada)
- **Protección CSRF** (Token-based)
- **Rate Limiting** contra ataques de fuerza bruta
- **Contraseñas hasheadas** con Bcrypt
- **Logs de actividad** y monitoreo de sesiones

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- MySQL (v5.7 o superior)
- NPM o Yarn

## 🛠️ Instalación

### 1. Clonar el repositorio

# Crear la base de datos
mysql -u root -p < database/schema.sql

cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales

# El frontend es estático, solo necesitas servir los archivos
# Puedes usar cualquier servidor HTTP o abrir directamente en el navegador
# Recomendado: usar Live Server en VS Code

cd backend
npm start
# o para desarrollo
npm run dev

# Usando Python
python -m http.server 3000

# Usando Node.js (http-server)
npx http-server -p 3000

🔑 Credenciales de Prueba
Administrador
Email: admin@secureflow.com

Contraseña: Admin123!

Usuario
Email: usuario@secureflow.com

Contraseña: User123!

📁 Estructura del Proyecto
secureflow-adso/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuración
│   │   ├── controllers/    # Controladores
│   │   ├── middleware/     # Middleware de seguridad
│   │   ├── models/         # Modelos de datos
│   │   ├── routes/         # Rutas de la API
│   │   └── utils/          # Utilidades
│   ├── .env                # Variables de entorno
│   └── server.js           # Punto de entrada
├── frontend/
│   ├── css/                # Estilos
│   ├── js/                 # JavaScript
│   └── pages/              # Páginas HTML
├── database/
│   └── schema.sql          # Esquema de BD
└── README.md

🗺️ Mapa del Sitio
[ Inicio / Landing Page ]
│
├── [ /login ] (Autenticación)
├── [ /registro ] (Registro de usuarios)
│
└── [ /app ] (Área protegida - Token válido)
    │
    ├── Vistas Comunes
    │   ├── [ /perfil ]
    │   └── [ /logout ]
    │
    ├── Rol: Usuario
    │   └── [ /usuario/dashboard ]
    │       └── [ /usuario/mis-tareas ]
    │
    └── Rol: Administrador
        └── [ /admin/dashboard ]
            ├── [ /admin/usuarios ]
            └── [ /admin/logs ]

🔒 Endpoints API
Método	Endpoint	Descripción
POST	/api/auth/register	Registrar usuario
POST	/api/auth/login	Iniciar sesión
POST	/api/auth/logout	Cerrar sesión
GET	/api/auth/verify	Verificar sesión







