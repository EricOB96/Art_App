// Educational purpose, not for production
module.exports = {
    JWT_SECRET: process.env.JWT_SECRET || 'artAppSecretPass',
    JWT_EXPIRATION: '24h'
};