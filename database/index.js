const mongoose = require('mongoose');

// Set strictQuery before connection
mongoose.set('strictQuery', false);

// MongoDB connection - Configuration from environment variables
const NODE_ENV = (process.env.NODE_ENV || 'development').trim();
const isProd = NODE_ENV === 'production';

// Use MONGODB_URL from environment (should be loaded by config/env.js before this module)
const mongoUrl = process.env.MONGODB_URL;

if (!mongoUrl) {
    console.error('❌ MONGODB_URL environment variable is not set!');
    console.error('NODE_ENV:', NODE_ENV);
    console.error('Available env keys:', Object.keys(process.env).filter(k => k.includes('MONGO')));
    process.exit(1);
}

const MONGODB_CONFIG = {
    url: mongoUrl,
    options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: isProd ? 8000 : 10000,
        socketTimeoutMS: isProd ? 8000 : 45000,
        connectTimeoutMS: isProd ? 5000 : 10000,
        maxPoolSize: isProd ? 5 : 10,
        minPoolSize: isProd ? 1 : 2,
        family: 4
    }
};

console.log(`🔌 Connecting to MongoDB (${isProd ? 'Production' : 'Development'})...`);
console.log(`📍 MongoDB URL: ${mongoUrl.substring(0, 50)}...`);

let connectAttempts = 0;
const maxAttempts = isProd ? 3 : 1;

function connectToMongoDB() {
    connectAttempts++;
    mongoose.connect(MONGODB_CONFIG.url, MONGODB_CONFIG.options)
    .then(() => {
        console.log("✅ Successful connection with MongoDB");
    })
    .catch((err) => {
        console.log(`❌ Error: Connection attempt ${connectAttempts}/${maxAttempts}:`, err.message);
        
        if (isProd && connectAttempts < maxAttempts) {
            console.log(`⏳ Retrying in 2 seconds...`);
            setTimeout(connectToMongoDB, 2000);
        } else {
            process.exit(1);
        }
    });
}

connectToMongoDB();

mongoose.Promise = global.Promise;

mongoose.connection.on('connected', () => {
    console.log('✅ Mongoose connected event');
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ Mongoose disconnected event');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose error:', err.message);
});

module.exports = mongoose;
