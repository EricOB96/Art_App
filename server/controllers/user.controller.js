const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { getDatabase } = require('../services/db.service');
const { JWT_SECRET, JWT_EXPIRATION } = require('../config/auth.config');

// User registration
async function register(req, res) {
    try {
        const db = getDatabase();
        const { username, email, password, name } = req.body;

        // Check if user exists
        const existingUser = await db.collection('users').findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = {
            username,
            email,
            password: hashedPassword,
            name,
            favorites: [],
            dateCreated: new Date()
        };

        const result = await db.collection('users').insertOne(newUser);

        // Create token
        const token = jwt.sign(
            { id: result.insertedId, username },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRATION }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: result.insertedId,
                username,
                name,
                email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
}

// User login
async function login(req, res) {
    try {
        const db = getDatabase();
        const { email, password } = req.body;

        // Find user
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { id: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRATION }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
}

// Get user profile
async function getProfile(req, res) {
    try {
        const db = getDatabase();
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(req.user.id) },
            { projection: { password: 0 } } // Exclude password
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
}

// Add artwork to favorites
async function addToFavorites(req, res) {
    try {
        const db = getDatabase();
        const { artworkId } = req.body;
        const userId = req.user.id;

        // Check if artwork exists
        const artwork = await db.collection('artworks').findOne({
            _id: new ObjectId(artworkId)
        });

        if (!artwork) {
            return res.status(404).json({ error: 'Artwork not found' });
        }

        // Add to favorites if not added
        const result = await db.collection('users').updateOne(
            {
                _id: new ObjectId(userId),
                favorites: { $ne: new ObjectId(artworkId) }
            },
            { $push: { favorites: new ObjectId(artworkId) } }
        );

        if (result.modifiedCount === 0) {
            // Check if it's already in favorites
            const user = await db.collection('users').findOne({
                _id: new ObjectId(userId),
                favorites: new ObjectId(artworkId)
            });

            if (user) {
                return res.status(400).json({ error: 'Artwork already in favorites' });
            } else {
                return res.status(500).json({ error: 'Failed to add to favorites' });
            }
        }

        res.json({ message: 'Artwork added to favorites' });
    } catch (error) {
        console.error('Add to favorites error:', error);
        res.status(500).json({ error: 'Failed to add to favorites' });
    }
}

// Remove artwork from favorites
async function removeFromFavorites(req, res) {
    try {
        const db = getDatabase();
        const { artworkId } = req.params;
        const userId = req.user.id;

        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $pull: { favorites: new ObjectId(artworkId) } }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({ error: 'Artwork not in favorites' });
        }

        res.json({ message: 'Artwork removed from favorites' });
    } catch (error) {
        console.error('Remove from favorites error:', error);
        res.status(500).json({ error: 'Failed to remove from favorites' });
    }
}

// Get user's favorite artworks
async function getFavorites(req, res) {
    try {
        const db = getDatabase();
        const userId = req.user.id;

        const user = await db.collection('users').findOne(
            { _id: new ObjectId(userId) }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get all favorite artworks
        const favorites = await db.collection('artworks').find({
            _id: { $in: user.favorites || [] }
        }).toArray();

        res.json(favorites);
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ error: 'Failed to get favorites' });
    }
}

module.exports = {
    register,
    login,
    getProfile,
    addToFavorites,
    removeFromFavorites,
    getFavorites
};