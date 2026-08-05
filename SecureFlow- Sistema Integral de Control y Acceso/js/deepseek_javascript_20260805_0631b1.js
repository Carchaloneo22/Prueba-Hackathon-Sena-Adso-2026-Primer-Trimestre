const { executeQuery } = require('../config/database');

// ======================================================
= OBTENER LOGS (Solo Admin)
// ======================================================
const getLogs = async (req, res) => {
    try {
        const { limit = 100, offset = 0, usuario_id, accion } = req.query;

        let query = `
            SELECT l.*, u.nombre as usuario_nombre, u.email as usuario_email
            FROM logs_actividad l
            LEFT JOIN usuarios u ON l.usuario_id = u.id
            WHERE 1=1
        `;
        let params = [];

        if (usuario_id) {
            query += ' AND l.usuario_id = ?';
            params.push(usuario_id);
        }

        if (accion) {
            query += ' AND l.accion = ?';
            params.push(accion);
        }

        query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const logs = await executeQuery(query, params);

        // Contar total
        const countQuery = `
            SELECT COUNT(*) as total FROM logs_actividad l
            WHERE 1=1
            ${usuario_id ? ' AND l.usuario_id = ?' : ''}
            ${accion ? ' AND l.accion = ?' : ''}
        `;
        const countParams = [];
        if (usuario_id) countParams.push(usuario_id);
        if (accion) countParams.push(accion);

        const countResult = await executeQuery(countQuery, countParams);
        const total = countResult[0]?.total || 0;

        res.json({
            success: true,
            logs,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener logs'
        });
    }
};

// ======================================================
= OBTENER ESTADÍSTICAS DE LOGS
// ======================================================
const getLogStats = async (req, res) => {
    try {
        // Estadísticas generales
        const stats = await executeQuery(`
            SELECT 
                COUNT(*) as total_logs,
                COUNT(DISTINCT usuario_id) as usuarios_activos,
                SUM(CASE WHEN accion = 'login' THEN 1 ELSE 0 END) as total_logins,
                SUM(CASE WHEN accion = 'login_fallido' THEN 1 ELSE 0 END) as total_logins_fallidos,
                SUM(CASE WHEN accion = 'logout' THEN 1 ELSE 0 END) as total_logouts,
                SUM(CASE WHEN accion LIKE 'crear_%' THEN 1 ELSE 0 END) as total_creaciones,
                SUM(CASE WHEN accion LIKE 'actualizar_%' THEN 1 ELSE 0 END) as total_actualizaciones,
                SUM(CASE WHEN accion LIKE 'eliminar_%' THEN 1 ELSE 0 END) as total_eliminaciones
            FROM logs_actividad
        `);

        // Logs por día (últimos 7 días)
        const logsPorDia = await executeQuery(`
            SELECT 
                DATE(created_at) as fecha,
                COUNT(*) as total
            FROM logs_actividad
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY fecha DESC
        `);

        // Acciones más comunes
        const accionesTop = await executeQuery(`
            SELECT 
                accion,
                COUNT(*) as total
            FROM logs_actividad
            GROUP BY accion
            ORDER BY total DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            stats: {
                ...stats[0],
                logs_por_dia: logsPorDia,
                acciones_top: accionesTop
            }
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
        });
    }
};

// ======================================================
= OBTENER SESIONES ACTIVAS (Admin)
// ======================================================
const getActiveSessions = async (req, res) => {
    try {
        const sessions = await executeQuery(`
            SELECT 
                s.id,
                s.usuario_id,
                u.nombre as usuario_nombre,
                u.email as usuario_email,
                s.ip,
                s.user_agent,
                s.fecha_expiracion,
                s.created_at as inicio_sesion,
                TIMESTAMPDIFF(MINUTE, s.created_at, NOW()) as duracion_minutos
            FROM sesiones s
            JOIN usuarios u ON s.usuario_id = u.id
            WHERE s.activa = TRUE AND s.fecha_expiracion > NOW()
            ORDER BY s.created_at DESC
        `);

        res.json({
            success: true,
            sessions
        });

    } catch (error) {
        console.error('Error al obtener sesiones activas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener sesiones activas'
        });
    }
};

module.exports = {
    getLogs,
    getLogStats,
    getActiveSessions
};