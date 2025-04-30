const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/profile', authenticateToken, userController.getProfile);
router.post('/favorites', authenticateToken, userController.addToFavorites);
router.delete('/favorites/:artworkId', authenticateToken, userController.removeFromFavorites);
router.get('/favorites', authenticateToken, userController.getFavorites);

module.exports = router;