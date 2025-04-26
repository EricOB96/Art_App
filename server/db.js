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
        // Create an MongoDB instance
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();

        // Connect to the database
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
        // Check if collection already exists
        const collections = await db.listCollections().toArray();
        const collectionExists = collections.some(col => col.name === 'artworks');

        if (!collectionExists) {
            // Create artworks collection
            const artworksCollection = await db.createCollection('artworks');

            // // test sample artwork 
            const sampleData = require('../sample-data.json');

            if (sampleData && sampleData.length > 0) {
                // Insert sample data
                await artworksCollection.insertMany(sampleData);
                console.log(`Initialized database with ${sampleData.length} sample artworks`);
            }
        }
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