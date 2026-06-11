const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Ensure environment variables are loaded BEFORE using them
const NODE_ENV = (process.env.NODE_ENV || 'development').trim();
const envFile = NODE_ENV === 'production' ? '.env.production' : '.env.development';
const envPath = path.resolve(process.cwd(), envFile);

// Load from .env.development or .env.production first
dotenv.config({ path: envPath });

// Also load from default .env if the specific one doesn't have all vars
if (!process.env.MONGODB_URL) {
    dotenv.config();
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
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
    }
};

console.log(`🔌 Connecting to MongoDB (${isProd ? 'Production' : 'Development'})...`);
console.log(`📍 MongoDB URL: ${mongoUrl.substring(0, 50)}...`);

mongoose.connect(MONGODB_CONFIG.url, MONGODB_CONFIG.options)
.then(() => {
    console.log("✅ Successful connection with MongoDB");
}).catch((err) => {
    console.log('❌ Error: Connection to MongoDB not successful', err.message);
    process.exit(1);
});

mongoose.Promise = global.Promise;

module.exports = mongoose;
