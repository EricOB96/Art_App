// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectToDatabase } = require('./db');
const artRoutes = require('./routes/art');
const artistRoutes = require('./routes/artists'); // New import for artists routes

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/artworks', artRoutes);
app.use('/api/artists', artistRoutes); // New route for artists API

// About page route
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/about.html'));
});

// API information route
app.get('/api', (req, res) => {
    res.json({
        message: 'MoMA Art Collection API',
        endpoints: {
            artworks: {
                getAllArtworks: 'GET /api/artworks',
                getArtworkById: 'GET /api/artworks/:id',
                searchArtworks: 'GET /api/artworks/search/query?term=searchTerm',
                createArtwork: 'POST /api/artworks',
                updateArtwork: 'PUT /api/artworks/:id',
                deleteArtwork: 'DELETE /api/artworks/:id'
            },
            artists: {
                getAllArtists: 'GET /api/artists',
                getArtistById: 'GET /api/artists/:id',
                getArtistByConstituentId: 'GET /api/artists/constituent/:id',
                searchArtists: 'GET /api/artists/search/query?term=searchTerm',
                getArtworksByArtist: 'GET /api/artists/:id/artworks',
                createArtist: 'POST /api/artists',
                updateArtist: 'PUT /api/artists/:id',
                deleteArtist: 'DELETE /api/artists/:id'
            }
        }
    });
});

// Start server
async function startServer() {
    try {
        await connectToDatabase();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API available at http://localhost:${PORT}/api`);
            console.log(`Client available at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();