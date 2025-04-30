// server/routes/artists.js
const express = require('express');
const { ObjectId } = require('mongodb');
const { getDatabase } = require('../services/db.service');

const router = express.Router();

// Get all artists (with pagination)
router.get('/', async (req, res) => {
    try {
        const db = getDatabase();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const artists = await db.collection('artists')
            .find({})
            .skip(skip)
            .limit(limit)
            .toArray();

        const total = await db.collection('artists').countDocuments();

        res.json({
            data: artists,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching artists:', error);
        res.status(500).json({ error: 'Failed to fetch artists' });
    }
});

// Get a single artist by ID
router.get('/:id', async (req, res) => {
    try {
        const db = getDatabase();
        const artist = await db.collection('artists').findOne({
            _id: new ObjectId(req.params.id)
        });

        if (!artist) {
            return res.status(404).json({ error: 'Artist not found' });
        }

        res.json(artist);
    } catch (error) {
        console.error('Error fetching artist:', error);
        res.status(500).json({ error: 'Failed to fetch artist' });
    }
});

// Get artist 
router.get('/constituent/:id', async (req, res) => {
    try {
        const db = getDatabase();
        const constituentId = parseInt(req.params.id);

        if (isNaN(constituentId)) {
            return res.status(400).json({ error: 'Invalid ConstituentID' });
        }

        const artist = await db.collection('artists').findOne({
            ConstituentID: constituentId
        });

        if (!artist) {
            return res.status(404).json({ error: 'Artist not found' });
        }

        res.json(artist);
    } catch (error) {
        console.error('Error fetching artist by ConstituentID:', error);
        res.status(500).json({ error: 'Failed to fetch artist' });
    }
});

// Search artists
router.get('/search/query', async (req, res) => {
    try {
        const db = getDatabase();
        const { term } = req.query;

        if (!term) {
            return res.status(400).json({ error: 'Search term is required' });
        }

        const query = {
            $or: [
                { DisplayName: { $regex: term, $options: 'i' } },
                { Nationality: { $regex: term, $options: 'i' } },
                { Gender: { $regex: term, $options: 'i' } }
            ]
        };

        const artists = await db.collection('artists')
            .find(query)
            .limit(20)
            .toArray();

        res.json(artists);
    } catch (error) {
        console.error('Error searching artists:', error);
        res.status(500).json({ error: 'Failed to search artists' });
    }
});

// Get artworks by artist 
router.get('/:id/artworks', async (req, res) => {
    try {
        const db = getDatabase();
        const artistId = parseInt(req.params.id);

        if (isNaN(artistId)) {
            return res.status(400).json({ error: 'Invalid artist ID' });
        }

        // Find artist first to confirm they exist
        const artist = await db.collection('artists').findOne({ ConstituentID: artistId });

        if (!artist) {
            return res.status(404).json({ error: 'Artist not found' });
        }

        // Find all artworks by this artist
        const artworks = await db.collection('artworks')
            .find({
                $or: [
                    { ConstituentID: artistId },
                    { ConstituentID: { $in: [artistId] } }
                ]
            })
            .limit(50)  // Limit results to assist for performance
            .toArray();

        res.json({
            artist: artist.DisplayName,
            artworks: artworks
        });
    } catch (error) {
        console.error('Error fetching artworks by artist:', error);
        res.status(500).json({ error: 'Failed to fetch artworks' });
    }
});

// Create a new artist 
router.post('/', async (req, res) => {
    try {
        const db = getDatabase();
        const artist = req.body;

        // Basic validation
        if (!artist.DisplayName) {
            return res.status(400).json({ error: 'DisplayName is required' });
        }

        const result = await db.collection('artists').insertOne(artist);

        res.status(201).json({
            ...artist,
            _id: result.insertedId
        });
    } catch (error) {
        console.error('Error creating artist:', error);
        res.status(500).json({ error: 'Failed to create artist' });
    }
});

// Update an artist
router.put('/:id', async (req, res) => {
    try {
        const db = getDatabase();
        const id = req.params.id;
        const updates = req.body;

        // Remove _id from updates if present
        delete updates._id;

        const result = await db.collection('artists').updateOne(
            { _id: new ObjectId(id) },
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Artist not found' });
        }

        const updatedArtist = await db.collection('artists').findOne({
            _id: new ObjectId(id)
        });

        res.json(updatedArtist);
    } catch (error) {
        console.error('Error updating artist:', error);
        res.status(500).json({ error: 'Failed to update artist' });
    }
});

// Delete an artist
router.delete('/:id', async (req, res) => {
    try {
        const db = getDatabase();
        const id = req.params.id;

        const result = await db.collection('artists').deleteOne({
            _id: new ObjectId(id)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Artist not found' });
        }

        res.json({ message: 'Artist deleted successfully' });
    } catch (error) {
        console.error('Error deleting artist:', error);
        res.status(500).json({ error: 'Failed to delete artist' });
    }
});

module.exports = router;