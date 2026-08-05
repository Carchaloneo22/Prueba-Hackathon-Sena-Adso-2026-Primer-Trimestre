const { body, validationResult } = require('express-validator');
const xss = require('xss');

// ======================================================
// SANITIZACIÓN - Protección contra XSS
// ======================================================

const sanitizeInput = (data) => {
    if (typeof data === 'string') {
        return xss(data.trim());
    }
    if (typeof data === 'object' && data !== null) {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            sanitized[key] = sanitizeInput(value);
        }
        return sanitized;
    }
    return data;
};

// Middleware para sanitizar toda la request
const sanitizeRequest = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeInput(req.body);
    }
    if (req.query) {
        req.query = sanitizeInput(req.query);
    }
    if (req.params) {
        req.params = sanitizeInput(req.params);
    }
    next();
};

// ======================================================
// VALIDACIONES DE DATOS
// ======================================================

// Validación de registro
const validateRegister = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúñÑ\s]+$/).withMessage('El nombre solo puede contener letras y espacios'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Email inválido')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/[A-Z]/).withMessage('La contraseña debe tener al menos una mayúscula')
        .matches(/[a-z]/).withMessage('La contraseña debe tener al menos una minúscula')
        .matches(/[0-9]/).withMessage('La contraseña debe tener al menos un número')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('La contraseña debe tener al menos un carácter especial'),
    
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Las contraseñas no coinciden');
            }
            return true;
        })
];

// Validación de login
const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Email inválido')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
];

// Validación de usuario (para admin)
const validateUser = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúñÑ\s]+$/).withMessage('El nombre solo puede contener letras y espacios'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Email inválido')
        .normalizeEmail(),
    
    body('rol')
        .optional()
        .isIn(['admin', 'usuario']).withMessage('Rol inválido')
];

// Validación de tarea
const validateTask = [
    body('titulo')
        .trim()
        .notEmpty().withMessage('El título es requerido')
        .isLength({ min: 3, max: 200 }).withMessage('El título debe tener entre 3 y 200 caracteres'),
    
    body('descripcion')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('La descripción no puede exceder los 1000 caracteres'),
    
    body('estado')
        .optional()
        .isIn(['pendiente', 'en_progreso', 'completada']).withMessage('Estado inválido'),
    
    body('prioridad')
        .optional()
        .isIn(['baja', 'media', 'alta']).withMessage('Prioridad inválida'),
    
    body('fecha_vencimiento')
        .optional()
        .isISO8601().withMessage('Fecha inválida')
        .custom((value) => {
            if (value && new Date(value) < new Date()) {
                throw new Error('La fecha de vencimiento no puede ser en el pasado');
            }
            return true;
        })
];

// Middleware para verificar errores de validación
const validateResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

module.exports = {
    sanitizeRequest,
    validateRegister,
    validateLogin,
    validateUser,
    validateTask,
    validateResult
};