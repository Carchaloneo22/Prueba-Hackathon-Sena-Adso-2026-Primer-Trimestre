const { executeQuery, transaction } = require('../config/database');
const { generateToken, getTokenExpiration } = require('../utils/jwt');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { sanitizeInput } = require('../middleware/validation');

// ======================================================
// REGISTRO DE USUARIO
// ======================================================
const register = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        // Verificar si el email ya existe
        const existingUser = await executeQuery(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Hashear contraseña
        const hashedPassword = await hashPassword(password);

        // Crear usuario
        const result = await executeQuery(
            `INSERT INTO usuarios (nombre, email, password, rol) 
             VALUES (?, ?, ?, 'usuario')`,
            [nombre, email, hashedPassword]
        );

        // Registrar log
        await executeQuery(
            `INSERT INTO logs_actividad (usuario_id, accion, detalles) 
             VALUES (?, ?, ?)`,
            [result.insertId, 'registro', JSON.stringify({ email })]
        );

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario'
        });
    }
};

// ======================================================
// LOGIN DE USUARIO
// ======================================================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const users = await executeQuery(
            `SELECT id, nombre, email, password, rol, activo 
             FROM usuarios WHERE email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const user = users[0];

        // Verificar usuario activo
        if (!user.activo) {
            return res.status(401).json({
                success: false,
                message: 'Usuario inactivo, contacte al administrador'
            });
        }

        // Verificar contraseña
        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            // Registrar intento fallido
            await executeQuery(
                `INSERT INTO logs_actividad (usuario_id, accion, ip, user_agent, detalles) 
                 VALUES (?, ?, ?, ?, ?)`,
                [user.id, 'login_fallido', req.ip, req.headers['user-agent'], JSON.stringify({ email })]
            );

            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar token JWT
        const token = generateToken(user);

        // Guardar sesión en base de datos
        const expiracion = getTokenExpiration(token);
        await executeQuery(
            `INSERT INTO sesiones (usuario_id, token, ip, user_agent, fecha_expiracion) 
             VALUES (?, ?, ?, ?, ?)`,
            [user.id, token, req.ip, req.headers['user-agent'], expiracion]
        );

        // Actualizar última actividad
        await executeQuery(
            `UPDATE usuarios SET ultima_actividad = NOW() WHERE id = ?`,
            [user.id]
        );

        // Registrar log
        await executeQuery(
            `INSERT INTO logs_actividad (usuario_id, accion, ip, user_agent, detalles) 
             VALUES (?, ?, ?, ?, ?)`,
            [user.id, 'login', req.ip, req.headers['user-agent'], JSON.stringify({ email })]
        );

        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión'
        });
    }
};

// ======================================================
= CIERRE DE SESIÓN
// ======================================================
const logout = async (req, res) => {
    try {
        const token = req.token;
        const userId = req.user.id;

        // Invalidar sesión en base de datos
        await executeQuery(
            `UPDATE sesiones SET activa = FALSE WHERE token = ?`,
            [token]
        );

        // Registrar log
        await executeQuery(
            `INSERT INTO logs_actividad (usuario_id, accion, detalles) 
             VALUES (?, ?, ?)`,
            [userId, 'logout', JSON.stringify({ email: req.user.email })]
        );

        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });

    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cerrar sesión'
        });
    }
};

// ======================================================
= VERIFICAR SESIÓN (para frontend)
// ======================================================
const verifySession = async (req, res) => {
    try {
        const token = req.token;
        
        // Verificar sesión activa
        const sesiones = await executeQuery(
            `SELECT * FROM sesiones 
             WHERE token = ? AND activa = TRUE AND fecha_expiracion > NOW()`,
            [token]
        );

        if (sesiones.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Sesión inválida o expirada'
            });
        }

        // Actualizar última actividad
        await executeQuery(
            `UPDATE usuarios SET ultima_actividad = NOW() WHERE id = ?`,
            [req.user.id]
        );

        res.json({
            success: true,
            user: req.user,
            token: token
        });

    } catch (error) {
        console.error('Error al verificar sesión:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar sesión'
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    verifySession
};