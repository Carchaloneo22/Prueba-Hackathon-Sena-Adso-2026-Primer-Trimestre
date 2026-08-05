const { executeQuery } = require('../config/database');
const { hashPassword } = require('../utils/bcrypt');

// ======================================================
= OBTENER TODOS LOS USUARIOS (Admin)
// ======================================================
const getUsers = async (req, res) => {
    try {
        const users = await executeQuery(
            `SELECT id, nombre, email, rol, activo, 
                    created_at, ultima_actividad 
             FROM usuarios 
             ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            users
        });

    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios'
        });
    }
};

// ======================================================
= OBTENER USUARIO POR ID
// ======================================================
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await executeQuery(
            `SELECT id, nombre, email, rol, activo, 
                    created_at, ultima_actividad 
             FROM usuarios WHERE id = ?`,
            [id]
        );

        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            user: user[0]
        });

    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario'
        });
    }
};

// ======================================================
= CREAR USUARIO (Admin)
// ======================================================
const createUser = async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;

        // Verificar email existente
        const existing = await executeQuery(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        const hashedPassword = await hashPassword(password);

        const result = await executeQuery(
            `INSERT INTO usuarios (nombre, email, password, rol) 
             VALUES (?, ?, ?, ?)`,
            [nombre, email, hashedPassword, rol || 'usuario']
        );

        // Registrar log
        await executeQuery(
            `INSERT INTO logs_actividad (usuario_id, accion, detalles) 
             VALUES (?, ?, ?)`,
            [req.user.id, 'crear_usuario', JSON.stringify({ email, rol })]
        );

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear usuario'
        });
    }
};

// ======================================================
= ACTUALIZAR USUARIO
// ======================================================
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, rol, activo } = req.body;
        const userId = req.user.id;
        const userRol = req.user.rol;

        // Verificar si existe
        const existing = await executeQuery(
            'SELECT * FROM usuarios WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Si no es admin, solo puede editar su propio perfil
        if (userRol !== 'admin' && parseInt(id) !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tiene permisos para editar este usuario'
            });
        }

        // Construir query dinámico
        let updates = [];
        let params = [];

        if (nombre) {
            updates.push('nombre = ?');
            params.push(nombre);
        }
        if (email) {
            // Verificar que el email no esté en uso por otro usuario
            const emailCheck = await executeQuery(
                'SELECT id FROM usuarios WHERE email = ? AND id != ?',
                [email, id]
            );
            if (emailCheck.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está en uso por otro usuario'
                });
            }
            updates.push('email = ?');
            params.push(email);
        }
        if (rol && userRol === 'admin') {
            updates.push('rol = ?');
            params.push(rol);
        }
        if (activo !== undefined && userRol === 'admin') {
            updates.push('activo = ?');
            params.push(activo);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron datos para actualizar'
            });
        }

        params.push(id);
        await executeQuery(
            `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        // Registrar log
        await executeQuery(
            `INSERT INTO logs_actividad (usuario_id, accion, detalles) 
             VALUES (?, ?, ?)`,
            [userId, 'actualizar_usuario', JSON.stringify({ id, ...req.body })]
        );

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario'
        });
    }
};

// ======================================================
= ACTUALIZAR CONTRASEÑA
// ======================================================
const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Obtener usuario
        const user = await executeQuery(
            'SELECT password FROM usuarios WHERE id = ?',
            [userId]
        );

        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const { comparePassword } = require('../utils/bcrypt');
        const isValid = await comparePassword(currentPassword, user[0].password);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual incorrecta'
            });
        }

        const hashedPassword = await hashPassword(newPassword);

        await executeQuery(
            'UPDATE usuarios SET password = ? WHERE id = ?',
            [hashedPassword, userId]
        );

        // Registrar log
        await executeQuery(
            `INSERT INTO logs_actividad (usuario_id, accion, detalles) 
             VALUES (?, ?, ?)`,
            [userId, 'cambiar_contrasena', JSON.stringify({ userId })]
        );

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar contraseña'
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    updatePassword
};