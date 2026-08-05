const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const logRoutes = require('./src/routes/logRoutes');

// Inicializar app
const app = express();

// ======================================================
// MIDDLEWARES DE SEGURIDAD
// ======================================================

// Helmet - Protección contra vulnerabilidades web
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"]
        }
    }
}));

// CORS - Configuración segura
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5500'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Rate Limiting - Protección contra ataques de fuerza bruta
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 peticiones por IP
    message: 'Demasiadas peticiones desde esta IP, por favor intente más tarde.',
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api', limiter);

// Limiter más estricto para login
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Demasiados intentos de inicio de sesión, intente más tarde.',
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/auth/login', authLimiter);

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ======================================================
// RUTAS
// ======================================================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/logs', logRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ======================================================
// MANEJO DE ERRORES GLOBAL
// ======================================================

app.use((err, req, res, next) => {
    console.error('Error global:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ======================================================
// INICIAR SERVIDOR
// ======================================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor SecureFlow ADSO corriendo en http://localhost:${PORT}`);
    console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
});