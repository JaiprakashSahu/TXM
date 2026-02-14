require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../src/models/user.model');
const env = require('../src/config/env');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/itilite';

async function seedAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@test.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('Admin already exists. Updating password...');
            existingAdmin.password = 'password123';
            await existingAdmin.save();
            console.log('✅ Admin password updated.');
        } else {
            console.log('Creating Admin user...');
            const admin = new User({
                name: 'Admin User',
                email: adminEmail,
                password: 'password123',
                role: 'admin',
                isActive: true,
                mustChangePassword: false, // Admin doesn't need to change password initially
            });
            await admin.save();
            console.log('✅ Admin user created.');
        }

        await mongoose.disconnect();
        console.log('Disconnected');
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seedAdmin();
