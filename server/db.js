// server/db.js
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

let mongoServer;
let client;
let db;

async function connectToDatabase() {
    try {
        // Create an in-memory MongoDB instance
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();

        // Connect to the in-memory database
        client = new MongoClient(uri);
        await client.connect();

        db = client.db('moma-collection');
        console.log('Connected to MongoDB');

        // Initialize the database with sample data
        await initializeDatabase();

        return db;
    } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
}

async function initializeDatabase() {
    try {
        // Check if collections already exist
        const collections = await db.listCollections().toArray();
        const artworksExists = collections.some(col => col.name === 'artworks');
        const artistsExists = collections.some(col => col.name === 'artists');

        if (!artworksExists) {
            // Create artworks collection
            const artworksCollection = await db.createCollection('artworks');

            // Try to load the full dataset
            const fullArtworksPath = path.join(__dirname, '../Artworks.json');

            if (fs.existsSync(fullArtworksPath)) {
                console.log('Loading full artworks dataset...');
                const rawData = fs.readFileSync(fullArtworksPath, 'utf8');
                const fullData = JSON.parse(rawData);

                // Load all artworks in chunks to avoid memory issues
                const chunkSize = 1000;
                let imported = 0;

                console.log(`Importing ${fullData.length} artworks in chunks...`);

                for (let i = 0; i < fullData.length; i += chunkSize) {
                    const chunk = fullData.slice(i, i + chunkSize);
                    await artworksCollection.insertMany(chunk);
                    imported += chunk.length;
                    console.log(`Imported ${imported}/${fullData.length} artworks (${Math.round(imported / fullData.length * 100)}%)`);
                }

                console.log(`Initialized artworks collection with all ${fullData.length} items`);
            } else {
                // Fall back to the sample data
                console.log('Full dataset not found, loading sample data...');
                const sampleData = require('../sample-data.json');

                if (sampleData && sampleData.length > 0) {
                    await artworksCollection.insertMany(sampleData);
                    console.log(`Initialized database with ${sampleData.length} sample artworks`);
                }
            }
        }

        if (!artistsExists) {
            // Create artists collection
            const artistsCollection = await db.createCollection('artists');

            // Try to load the artists dataset
            const artistsPath = path.join(__dirname, '../Artists.json');

            if (fs.existsSync(artistsPath)) {
                console.log('Loading artists dataset...');
                const rawData = fs.readFileSync(artistsPath, 'utf8');
                const artistsData = JSON.parse(rawData);

                // Load all artists in chunks to avoid memory issues
                const chunkSize = 1000;
                let imported = 0;

                console.log(`Importing ${artistsData.length} artists in chunks...`);

                for (let i = 0; i < artistsData.length; i += chunkSize) {
                    const chunk = artistsData.slice(i, i + chunkSize);
                    await artistsCollection.insertMany(chunk);
                    imported += chunk.length;
                    console.log(`Imported ${imported}/${artistsData.length} artists (${Math.round(imported / artistsData.length * 100)}%)`);
                }

                console.log(`Initialized artists collection with all ${artistsData.length} artists`);
            } else {
                console.log('Artists dataset not found. Artists collection created but empty.');
            }
        }

        // Create indexes for better performance
        await db.collection('artworks').createIndex({ Title: 1 });
        await db.collection('artworks').createIndex({ Artist: 1 });
        await db.collection('artists').createIndex({ DisplayName: 1 });
        await db.collection('artists').createIndex({ ConstituentID: 1 });

        // Additional indexes for better search performance
        await db.collection('artworks').createIndex({ Year: 1 });
        await db.collection('artworks').createIndex({ Medium: 1 });
        await db.collection('artists').createIndex({ Nationality: 1 });
        await db.collection('artists').createIndex({ Gender: 1 });

    } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
}

function getDatabase() {
    return db;
}

async function closeDatabase() {
    if (client) {
        await client.close();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
}

module.exports = {
    connectToDatabase,
    getDatabase,
    closeDatabase
};