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

    async getUser(req, res) {
        const user = await User.findById(req.params.id);
        if (!user) {
            throw new NotFoundError('User not found');
        }
        res.json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                mustChangePassword: user.mustChangePassword,
                createdAt: user.createdAt,
            },
        });
    }

    async updateRole(req, res) {
        const { role } = req.body;
        const allowedRoles = ['employee', 'manager', 'finance'];

        if (!allowedRoles.includes(role)) {
            throw new BadRequestError(`Invalid role. Allowed roles: ${allowedRoles.join(', ')}`);
        }

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            throw new NotFoundError('User not found');
        }

        // Safety rules
        if (targetUser._id.toString() === req.user._id.toString()) {
            throw new ForbiddenError('Admin cannot change own role');
        }

        if (targetUser.role === 'admin') {
            throw new ForbiddenError('Admin cannot change another admin\'s role');
        }

        targetUser.role = role;
        await targetUser.save();

        res.json({
            success: true,
            message: `User role updated to ${role}`,
        });
    }

    async deactivateUser(req, res) {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            throw new NotFoundError('User not found');
        }

        // Safety rules
        if (targetUser._id.toString() === req.user._id.toString()) {
            throw new ForbiddenError('Admin cannot deactivate themselves');
        }

        if (targetUser.role === 'admin') {
            // Check if this is the last admin
            const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
            if (adminCount <= 1) {
                throw new ForbiddenError('Cannot deactivate the last remaining admin');
            }
        }

        targetUser.isActive = false;
        await targetUser.save();

        res.json({
            success: true,
            message: 'User account deactivated successfully',
        });
    }

    async resetPassword(req, res) {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            throw new NotFoundError('User not found');
        }

        const tempPassword = crypto.randomBytes(8).toString('hex');
        targetUser.password = tempPassword;
        targetUser.mustChangePassword = true;
        await targetUser.save();

        res.json({
            success: true,
            message: 'Password reset successful',
            temporaryPassword: tempPassword,
        });
    }
}

module.exports = new UserController();
