// server/routes/art.js
const express = require('express');
const { ObjectId } = require('mongodb');
const { getDatabase } = require('../db');

const router = express.Router();

// Get all artworks
router.get('/', async (req, res) => {
    try {
        const db = getDatabase();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const artworks = await db.collection('artworks')
            .find({})
            .skip(skip)
            .limit(limit)
            .toArray();

        const total = await db.collection('artworks').countDocuments();

        res.json({
            data: artworks,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching artworks:', error);
        res.status(500).json({ error: 'Failed to fetch artworks' });
    }
});

// Get a single artwork by ID
router.get('/:id', async (req, res) => {
    try {
        const db = getDatabase();
        const artwork = await db.collection('artworks').findOne({
            _id: new ObjectId(req.params.id)
        });

        if (!artwork) {
            return res.status(404).json({ error: 'Artwork not found' });
        }

        res.json(artwork);
    } catch (error) {
        console.error('Error fetching artwork:', error);
        res.status(500).json({ error: 'Failed to fetch artwork' });
    }
});

// Search artworks
// Search artworks
router.get('/search/query', async (req, res) => {
    try {
        const db = getDatabase();
        const { term, field } = req.query;

        if (!term) {
            return res.status(400).json({ error: 'Search term is required' });
        }

        let query = {};

        // handling for Year field
        if (field === 'Year') {
            // Search in the Date field instead
            query = { Date: { $regex: term, $options: 'i' } };
        } else if (field) {
            // For other fields, use the field as provided
            query[field] = { $regex: term, $options: 'i' };
        } else {
            // Default search in multiple fields
            query = {
                $or: [
                    { Title: { $regex: term, $options: 'i' } },
                    { Artist: { $regex: term, $options: 'i' } },
                    { Date: { $regex: term, $options: 'i' } }
                ]
            };
        }

        const artworks = await db.collection('artworks')
            .find(query)
            .limit(20)
            .toArray();

        res.json(artworks);
    } catch (error) {
        console.error('Error searching artworks:', error);
        res.status(500).json({ error: 'Failed to search artworks' });
    }
});

// Create a new artwork
router.post('/', async (req, res) => {
    try {
        const db = getDatabase();
        const artwork = req.body;

        // Basic validation
        if (!artwork.Title || !artwork.Artist) {
            return res.status(400).json({ error: 'Title and Artist are required' });
        }

        const result = await db.collection('artworks').insertOne(artwork);

        res.status(201).json({
            ...artwork,
            _id: result.insertedId
        });
    } catch (error) {
        console.error('Error creating artwork:', error);
        res.status(500).json({ error: 'Failed to create artwork' });
    }
});

// Update an artwork
router.put('/:id', async (req, res) => {
    try {
        const db = getDatabase();
        const id = req.params.id;
        const updates = req.body;

        // Remove _id from updates if present
        delete updates._id;

        const result = await db.collection('artworks').updateOne(
            { _id: new ObjectId(id) },
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Artwork not found' });
        }

        const updatedArtwork = await db.collection('artworks').findOne({
            _id: new ObjectId(id)
        });

        res.json(updatedArtwork);
    } catch (error) {
        console.error('Error updating artwork:', error);
        res.status(500).json({ error: 'Failed to update artwork' });
    }
});

// Delete an artwork
router.delete('/:id', async (req, res) => {
    try {
        const db = getDatabase();
        const id = req.params.id;

        const result = await db.collection('artworks').deleteOne({
            _id: new ObjectId(id)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Artwork not found' });
        }

        res.json({ message: 'Artwork deleted successfully' });
    } catch (error) {
        console.error('Error deleting artwork:', error);
        res.status(500).json({ error: 'Failed to delete artwork' });
    }
});

module.exports = router;