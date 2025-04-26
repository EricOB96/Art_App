// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectToDatabase } = require('./db');
const artRoutes = require('./routes/art');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/artworks', artRoutes);

// About page route
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/about.html'));
});

// Start server
async function startServer() {
    try {
        await connectToDatabase();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();