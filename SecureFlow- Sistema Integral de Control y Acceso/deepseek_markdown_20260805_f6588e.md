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

```bash
git clone https://github.com/tu-usuario/secureflow-adso.git
cd secureflow-adso