const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Configuración del pool de conexiones
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'secureflow_adso',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Configuración de seguridad adicional
    charset: 'utf8mb4',
    supportBigNumbers: true,
    bigNumberStrings: true,
    // Timeouts
    connectTimeout: 10000,
    acquireTimeout: 10000,
    timeout: 10000
});

// Función para ejecutar consultas con parámetros (protegido contra SQL Injection)
const executeQuery = async (sql, params = []) => {
    let connection;
    try {
        connection = await pool.getConnection();
        // Usar prepared statements
        const [rows] = await connection.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('Error en consulta SQL:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
};

// Función para transacciones
const transaction = async (callback) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        
        const result = await callback(connection);
        
        await connection.commit();
        return result;
    } catch (error) {
        if (connection) await connection.rollback();
        throw error;
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    pool,
    executeQuery,
    transaction
};