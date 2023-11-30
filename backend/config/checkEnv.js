const dotenv = require('dotenv');

dotenv.config();

const requiredEnvVars = ['HOST', 'USER', 'PASSWORD', 'DATABASE', 'PORT', 'FRONTEND_URL', 'NODE_PORT', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'EMAIL', 'EMAIL_PASSWORD', 'CLIENT_UID_42', 'CLIENT_SECRET_42', 'GOOGLE_CLIENT_ID', 'TORRENT_API', 'OMDB_API_KEY'];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
} else {
    console.log('All required environment variables are set.');
}