require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const forumRoutes = require('./routes/forum');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database health check middleware
app.use((req, res, next) => {
    if (req.path !== '/health' && mongoose.connection.readyState !== 1) {
        return res.status(503).send({
            error: 'Database not connected. Please ensure your network allows outbound traffic on port 27017.',
            dbStatus: mongoose.connection.readyState
        });
    }
    next();
});

const { MongoMemoryServer } = require('mongodb-memory-server');

// Routes
app.get('/health', (req, res) => res.send({ status: 'OK', db: mongoose.connection.readyState }));
app.use('/api/auth', authRoutes);
app.use('/api/forum', forumRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).send({ error: 'Internal Server Error', details: err.message });
});

// Database Connection & Server Start
const PORT = process.env.PORT || 5005;

async function startServer() {
    // Start listening immediately so health check is accessible
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server listening on http://0.0.0.0:${PORT}`);
    });

    try {
        console.log('Starting LOCAL Persistent MongoDB...');
        const mongod = await MongoMemoryServer.create({
            instance: {
                dbPath: './data',
                storageEngine: 'wiredTiger',
            },
        });
        const localUri = mongod.getUri();
        console.log(`Local MongoDB started at: ${localUri}`);

        await mongoose.connect(localUri, {
            dbName: 'soil_forum',
        });
        console.log('Connected to LOCAL MongoDB (soil_forum)');
    } catch (err) {
        console.error('CRITICAL: Local Database connection failed:', err);
    }
}

// Global Process Handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

startServer();
