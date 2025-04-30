// scripts/import-data.js
// Script to import both Artworks and Artists datasets into MongoDB

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function importData() {
    console.log('Starting MoMA data import process...');

    // Create in-memory MongoDB instance
    console.log('Initializing MongoDB memory server...');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('moma-collection');

    try {
        // Create collections if they don't exist
        console.log('Creating collections');
        await db.createCollection('artworks');
        await db.createCollection('artists');

        // Import artworks
        await importArtworks(db);

        // Import artists
        await importArtists(db);

        // Create relationships (optional)
        await createRelationships(db);

        // Create indexes for better performance
        console.log('Creating indexes');
        await db.collection('artworks').createIndex({ Title: 1 });
        await db.collection('artworks').createIndex({ Artist: 1 });
        await db.collection('artworks').createIndex({ Year: 1 });
        await db.collection('artists').createIndex({ ConstituentID: 1 });
        await db.collection('artists').createIndex({ DisplayName: 1 });

        console.log('Import completed successfully!');
    } catch (error) {
        console.error('Error during import:', error);
    } finally {
        // Close connection
        await client.close();
        await mongoServer.stop();
        console.log('Database connection closed.');
    }
}

async function importArtworks(db) {
    // Check for artworks data file
    const artworksPath = path.join(__dirname, '../Artworks.json');
    if (!fs.existsSync(artworksPath)) {
        console.error('Error: Artworks.json file not found!');
        return;
    }

    // Read and parse artworks data file
    console.log('Reading artworks data...');
    const rawData = fs.readFileSync(artworksPath, 'utf8');
    console.log('Parsing artworks JSON data...');
    const artworks = JSON.parse(rawData);

    console.log(`Found ${artworks.length} artworks to import.`);

    // Insert artworks data in chunks to avoid memory issues
    const chunkSize = 1000;
    let imported = 0;

    console.log('Importing artworks data in chunks...');
    for (let i = 0; i < artworks.length; i += chunkSize) {
        const chunk = artworks.slice(i, i + chunkSize);
        await db.collection('artworks').insertMany(chunk);
        imported += chunk.length;
        console.log(`Artworks progress: ${imported}/${artworks.length} (${Math.round(imported / artworks.length * 100)}%)`);
    }

    console.log('Verifying artworks import...');
    const count = await db.collection('artworks').countDocuments();
    console.log(`Imported ${count} artworks successfully.`);
}

async function importArtists(db) {
    // Check for artists data file
    const artistsPath = path.join(__dirname, '../Artists.json');
    if (!fs.existsSync(artistsPath)) {
        console.error('Error: Artists.json file not found!');
        return;
    }

    // Read and parse artists data 
    console.log('Reading artists data');
    const rawData = fs.readFileSync(artistsPath, 'utf8');
    console.log('Parsing artists JSON data');
    const artists = JSON.parse(rawData);

    console.log(`Found ${artists.length} artists to import.`);

    // Insert artists data in chunks to avoid memory issues
    const chunkSize = 1000;
    let imported = 0;

    console.log('Importing artists data in chunks...');
    for (let i = 0; i < artists.length; i += chunkSize) {
        const chunk = artists.slice(i, i + chunkSize);
        await db.collection('artists').insertMany(chunk);
        imported += chunk.length;
        console.log(`Artists progress: ${imported}/${artists.length} (${Math.round(imported / artists.length * 100)}%)`);
    }

    console.log('Verifying artists import');
    const count = await db.collection('artists').countDocuments();
    console.log(`Imported ${count} artists successfully.`);
}
// function creates relationships between artworks and artists
async function createRelationships(db) {
    
    // based on the ConstituentID field
    console.log('Creating relationships between artworks and artists...');

    try {
        // Add artist details to artworks
        const artworks = await db.collection('artworks').find({}).toArray();
        const artists = await db.collection('artists').find({}).toArray();

        // Create a map of artist IDs to artist objects for lookup
        const artistMap = {};
        artists.forEach(artist => {
            artistMap[artist.ConstituentID] = artist;
        });

        console.log('Updating artworks with artist information');
        let updated = 0;

        for (const artwork of artworks) {
            if (artwork.ConstituentID) {
                const artistIds = Array.isArray(artwork.ConstituentID)
                    ? artwork.ConstituentID
                    : [artwork.ConstituentID];

                const artistDetails = artistIds
                    .map(id => artistMap[id])
                    .filter(artist => artist); // Filter out undefined artists

                if (artistDetails.length > 0) {
                    await db.collection('artworks').updateOne(
                        { _id: artwork._id },
                        { $set: { ArtistDetails: artistDetails } }
                    );
                    updated++;

                    if (updated % 1000 === 0) {
                        console.log(`Updated ${updated} artworks with artist details`);
                    }
                }
            }
        }

        console.log(`Finished updating ${updated} artworks with artist details.`);
    } catch (error) {
        console.error('Error creating relationships:', error);
    }
}

// Run the import function
importData().catch(console.error);