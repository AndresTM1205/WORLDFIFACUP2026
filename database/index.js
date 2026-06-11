const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Ensure environment variables are loaded BEFORE using them
const NODE_ENV = (process.env.NODE_ENV || 'development').trim();

// Try loading environment files in priority order
const envFilesToTry = NODE_ENV === 'production' 
    ? ['.env.production.local', '.env.production', '.env']
    : ['.env.development.local', '.env.development', '.env'];

let envFileLoaded = false;
for (const envFile of envFilesToTry) {
    const envPath = path.resolve(process.cwd(), envFile);
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
        console.log(`✅ Loaded env from: ${envFile}`);
        envFileLoaded = true;
        break;
    }
}

if (!envFileLoaded) {
    console.log('No env file found, checking process.env');
}

// Set strictQuery before connection
mongoose.set('strictQuery', false);

// MongoDB connection - Configuration from environment variables
const isProd = NODE_ENV === 'production';
const mongoUrl = process.env.MONGODB_URL || (isProd ? undefined : 'mongodb://localhost:27017/worldcup2026');

if (!mongoUrl) {
    console.error('❌ MONGODB_URL environment variable is not set!');
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
