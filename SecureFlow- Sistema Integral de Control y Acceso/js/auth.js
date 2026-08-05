const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const { verifyToken } = require('../utils/jwt');

const authMiddleware = async (req, res, next) => {
    try {
        // Obtener token del header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No se proporcionó token de autenticación'
            });
        }

        const token = authHeader.split(' ')[1];
        
        // Verificar token
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        // Verificar que la sesión existe y está activa
        const sesiones = await executeQuery(
            `SELECT * FROM sesiones 
             WHERE usuario_id = ? AND token = ? AND activa = TRUE 
             AND fecha_expiracion > NOW()`,
            [decoded.id, token]
        );

        if (sesiones.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Sesión inválida o expirada'
            });
        }

        // Obtener usuario
        const usuarios = await executeQuery(
            `SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = ?`,
            [decoded.id]
        );

        if (usuarios.length === 0 || !usuarios[0].activo) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado o inactivo'
            });
        }

        // Actualizar última actividad
        await executeQuery(
            `UPDATE usuarios SET ultima_actividad = NOW() WHERE id = ?`,
            [decoded.id]
        );

        // Adjuntar usuario a la request
        req.user = usuarios[0];
        req.token = token;
        
        next();
    } catch (error) {
        console.error('Error en autenticación:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar autenticación'
        });
    }
};

module.exports = authMiddleware;