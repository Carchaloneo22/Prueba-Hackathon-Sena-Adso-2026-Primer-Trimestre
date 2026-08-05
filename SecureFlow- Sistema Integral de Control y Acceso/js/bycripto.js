const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// Hashear contraseña
const hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        return await bcrypt.hash(password, salt);
    } catch (error) {
        throw new Error('Error al hashear la contraseña');
    }
};

// Verificar contraseña
const comparePassword = async (password, hashedPassword) => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        return false;
    }
};

module.exports = {
    hashPassword,
    comparePassword
};