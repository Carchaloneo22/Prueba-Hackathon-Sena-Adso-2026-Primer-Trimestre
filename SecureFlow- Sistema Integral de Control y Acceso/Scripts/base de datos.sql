-- ======================================================
-- SecureFlow ADSO - Sistema de Control y Acceso
-- Script de Base de Datos
-- ======================================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS secureflow_adso;
USE secureflow_adso;

-- ======================================================
-- Tabla: usuarios
-- ======================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'usuario') DEFAULT 'usuario',
    activo BOOLEAN DEFAULT TRUE,
    ultima_actividad DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================
-- Tabla: tareas
-- ======================================================
CREATE TABLE IF NOT EXISTS tareas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    estado ENUM('pendiente', 'en_progreso', 'completada') DEFAULT 'pendiente',
    prioridad ENUM('baja', 'media', 'alta') DEFAULT 'media',
    fecha_vencimiento DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================
-- Tabla: logs_actividad
-- ======================================================
CREATE TABLE IF NOT EXISTS logs_actividad (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    accion VARCHAR(100) NOT NULL,
    ip VARCHAR(45),
    user_agent TEXT,
    detalles JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario (usuario_id),
    INDEX idx_accion (accion),
    INDEX idx_fecha (created_at),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================
-- Tabla: sesiones (para control de tokens)
-- ======================================================
CREATE TABLE IF NOT EXISTS sesiones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    ip VARCHAR(45),
    user_agent TEXT,
    fecha_expiracion DATETIME NOT NULL,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_token (token(100)),
    INDEX idx_usuario_activa (usuario_id, activa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================
-- Insertar usuario administrador por defecto
-- Password: Admin123!
-- ======================================================
INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES 
('Administrador', 'admin@secureflow.com', '$2b$10$QJxK8Gc5WJcWrGtX1XJ1Xe9QJxK8Gc5WJcWrGtX1XJ1Xe9QJxK8Gc5W', 'admin', TRUE);

-- ======================================================
-- Insertar usuario de prueba
-- Password: User123!
-- ======================================================
INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES 
('Usuario Prueba', 'usuario@secureflow.com', '$2b$10$QJxK8Gc5WJcWrGtX1XJ1Xe9QJxK8Gc5WJcWrGtX1XJ1Xe9QJxK8Gc5W', 'usuario', TRUE);

-- ======================================================
-- Insertar tareas de ejemplo
-- ======================================================
INSERT INTO tareas (usuario_id, titulo, descripcion, estado, prioridad, fecha_vencimiento) VALUES 
(2, 'Revisar inventario', 'Realizar conteo físico del almacén', 'pendiente', 'alta', DATE_ADD(CURDATE(), INTERVAL 7 DAY)),
(2, 'Actualizar sistema', 'Instalar nuevas actualizaciones de seguridad', 'en_progreso', 'media', DATE_ADD(CURDATE(), INTERVAL 14 DAY)),
(2, 'Informe mensual', 'Generar informe de actividad del mes', 'completada', 'baja', DATE_SUB(CURDATE(), INTERVAL 5 DAY));