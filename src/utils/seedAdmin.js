const { User } = require('../models/user.model');
const env = require('../config/env');
const logger = require('./logger');

/**
 * Seed the admin user if it doesn't already exist.
 * This is a one-time utility run on server startup.
 */
async function seedAdmin() {
    try {
        const adminExists = await User.findOne({ role: 'admin' }).select('+password');

        if (adminExists) {
            if (adminExists.email === env.admin.email) {
                logger.info(`[SeedAdmin] Admin ${adminExists.email} exists. Synchronizing password...`);
                adminExists.password = env.admin.password;
                await adminExists.save();
                logger.info('[SeedAdmin] Admin password synchronized.');
            } else {
                logger.info(`[SeedAdmin] Admin already exists with different email: ${adminExists.email}. Skipping...`);
            }
            return;
        }

        logger.info('[SeedAdmin] No admin user found. Creating initial admin...');

        const admin = new User({
            name: 'System Admin',
            email: env.admin.email,
            password: env.admin.password, // Will be hashed by pre-save hook
            role: 'admin',
            mustChangePassword: false,
        });

        await admin.save();
        logger.info(`[SeedAdmin] Admin user created successfully: ${env.admin.email}`);
    } catch (error) {
        logger.error('[SeedAdmin] Error seeding admin user:', error);
        // We don't necessarily want to crash the whole app here, 
        // but the user suggested high safety.
        throw error;
    }
}

module.exports = seedAdmin;
