const { executeQuery } = require('../config/database');

// ======================================================
= OBTENER TAREAS DEL USUARIO
// ======================================================
const getTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRol = req.user.rol;
        const { estado } = req.query;

        let query = 'SELECT * FROM tareas WHERE 1=1';
        let params = [];

        // Si es usuario, solo ve sus tareas
        if (userRol === 'usuario') {
            query += ' AND usuario_id = ?';
            params.push(userId);
        }

        if (estado) {
            query += ' AND estado = ?';
            params.push(estado);
        }

        query += ' ORDER BY fecha_vencimiento ASC, created_at DESC';

        const tasks = await executeQuery(query, params);

        res.json({
            success: true,
            tasks
        });

    } catch (error) {
        console.error('Error al obtener tareas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tareas'
        });
    }
};

// ======================================================
= OBTENER TAREA POR ID
// ======================================================
const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRol = req.user.rol;

        const task = await executeQuery(
            'SELECT * FROM tareas WHERE id = ?',
            [id]
        );

        if (task.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            });
        }

        // Verificar permisos
        if (userRol === 'usuario' && task[0].usuario_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tiene permisos para ver esta tarea'
            });
        }

        res.json({
            success: true,
            task: task[0]
        });

    } catch (error) {
        console.error('Error al obtener tarea:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tarea'
        });
    }
};

// ======================================================
= CREAR TAREA
// ======================================================
const createTask = async (req, res) => {
    try {
        const { titulo, descripcion, estado, prioridad, fecha_vencimiento } = req.body;
        const userId = req.user.id;

        const result = await executeQuery(
            `INSERT INTO tareas (usuario_id, titulo, descripcion, estado, prioridad, fecha_vencimiento) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, titulo, descripcion, estado || 'pendiente', prioridad || 'media', fecha_vencimiento]
        );

        // Registrar log
        await executeQuery(
            `INSERT INTO logs_actividad (usuario_id, accion, detalles) 
             VALUES (?, ?, ?)`,
            [userId, 'crear_tarea', JSON.stringify({ titulo, id: result.insertId })]
        );

        res.status(201).json({
            success: true,
            message: 'Tarea creada exitosamente',
            taskId: result.insertId
        });

    } catch (error) {
        console.error('Error al crear tarea:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear tarea'
        });
    }
};

// ======================================================
= ACTUALIZAR TAREA
// ======================================================
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descripcion, estado, prioridad, fecha_vencimiento } = req.body;
        const userId = req.user.id;
        const userRol = req.user.rol;

        // Verificar existencia y permisos
        const task = await executeQuery(
            'SELECT * FROM tareas WHERE id = ?',
            [id]
        );

        if (task.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            });
        }

        if (userRol === 'usuario' && task[0].usuario_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tiene permisos para editar esta tarea'
            });
        }

        // Construir query dinámico
        let updates = [];
        let params = [];

        if (titulo) {
            updates.push('titulo = ?');
            params.push(titulo);
        }
        if (descripcion !== undefined) {
            updates.push('descripcion = ?');
            params.push(descripcion);
        }
        if (estado) {
            updates.push('estado = ?');
            params.push(estado);
        }
        if (prioridad) {
            updates.push('prioridad = ?');
            params.push(prioridad);
        }
        if (fecha_vencimiento !== undefined) {
            updates.push('fecha_vencimiento = ?');
            params.push(fecha_vencimiento);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron datos para actualizar'
            });
        }

        params.push(id);
        await executeQuery(
            `UPDATE tareas SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        // Registrar log
        await executeQuery(
            `INSERT INTO logs_actividad (usuario_id, accion, detalles) 
             VALUES (?, ?, ?)`,
            [userId, 'actualizar_tarea', JSON.stringify({ id, ...req.body })]
        );

        res.json({
            success: true,
            message: 'Tarea actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar tarea'
        });
    }
};

// ======================================================
= ELIMINAR TAREA
// ======================================================
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRol = req.user.rol;

        // Verificar existencia y permisos
        const task = await executeQuery(
            'SELECT * FROM tareas WHERE id = ?',
            [id]
        );

        if (task.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            });
        }

        if (userRol === 'usuario' && task[0].usuario_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tiene permisos para eliminar esta tarea'
            });
        }

        await executeQuery(
            'DELETE FROM tareas WHERE id = ?',
            [id]
        );

        // Registrar log
        await executeQuery(
            `INSERT INTO logs_actividad (usuario_id, accion, detalles) 
             VALUES (?, ?, ?)`,
            [userId, 'eliminar_tarea', JSON.stringify({ id, titulo: task[0].titulo })]
        );

        res.json({
            success: true,
            message: 'Tarea eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar tarea'
        });
    }
};

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
};