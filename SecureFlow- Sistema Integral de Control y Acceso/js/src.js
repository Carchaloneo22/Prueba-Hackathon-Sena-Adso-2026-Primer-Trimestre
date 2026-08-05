const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secureflow_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Generar token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            rol: user.rol 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// Verificar token
const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return null; // Token expirado
        }
        return null; // Token inválido
    }
};

// Decodificar token sin verificar (para obtener datos)
const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        return null;
    }
};

// Calcular tiempo de expiración
const getTokenExpiration = (token) => {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
    }
    return null;
};

module.exports = {
    generateToken,
    verifyToken,
    decodeToken,
    getTokenExpiration
};