const crypto = require('crypto');
const bcrypt = require('bcrypt'); // Actually model handles hashing, but we need to generate a raw one? No, model hashes on save.
const { User } = require('../models/user.model');
const { createUserSchema } = require('../validators/user.validator');
const { BadRequestError, ConflictError, ForbiddenError } = require('../utils/errors');
const emailProvider = require('../services/emailProvider');

class UserController {
    async createUser(req, res) {
        const { error, value } = createUserSchema.validate(req.body, { abortEarly: false });
        if (error) {
            throw new BadRequestError(error.details.map((d) => d.message).join(', '));
        }

        const { name, email, role } = value;

        // 1. Restrict Admin Token
        if (role === 'admin') {
            throw new ForbiddenError('Admin creation restricted');
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new ConflictError('Email already registered');
        }

        // 2. Generate temporary password
        const tempPassword = crypto.randomBytes(8).toString('hex'); // 16 chars hex ~ strong enough for temp

        // 3. Create User
        const user = new User({
            name,
            email,
            password: tempPassword, // Will be hashed by pre-save hook
            role,
            mustChangePassword: true,
        });

        await user.save();

        // 4. Send Email (Mock)
        const emailBody = `Hello ${name},\n\nYour account has been created.\n\nTemporary Password: ${tempPassword}\n\nPlease log in and change your password immediately.`;

        // We don't await this to avoid blocking response? Or we should? Usually async job, but for now await is fine.
        await emailProvider.sendEmail(email, 'Welcome to ITILITE Lite', emailBody);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                tempPassword, // Returning for demo/testing convenience as requested
            },
        });
    }

    async getUsers(req, res) {
        const users = await User.find({}).sort({ createdAt: -1 });
        res.json({
            success: true,
            data: users,
        });
    }
}

module.exports = new UserController();
