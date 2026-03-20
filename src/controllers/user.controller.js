const crypto = require('crypto');
const { User } = require('../models/user.model');
const { createUserSchema } = require('../validators/user.validator');
const { BadRequestError, ConflictError, ForbiddenError, NotFoundError } = require('../utils/errors');
const emailProvider = require('../services/emailProvider');
const logger = require('../utils/logger');

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

        // SECURITY: Send password only via email, never in API response
        const emailBody = `Hello ${name},\n\nYour account has been created.\n\nTemporary Password: ${tempPassword}\n\nPlease log in and change your password immediately.`;

        try {
            await emailProvider.sendEmail(email, 'Welcome to ITILITE Lite', emailBody);
            logger.info(`Welcome email sent to ${email}`);
        } catch (emailErr) {
            // Log error but don't expose to client - user was created successfully
            logger.error(`Failed to send welcome email to ${email}: ${emailErr.message}`);
        }

        // SECURITY: Never return password in API response
        res.status(201).json({
            success: true,
            message: 'User created successfully. Temporary password sent via email.',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
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

        // SECURITY: Send password only via email, never in API response
        const emailBody = `Hello ${targetUser.name},\n\nYour password has been reset by an administrator.\n\nNew Temporary Password: ${tempPassword}\n\nPlease log in and change your password immediately.`;

        try {
            await emailProvider.sendEmail(targetUser.email, 'Password Reset - ITILITE Lite', emailBody);
            logger.info(`Password reset email sent to ${targetUser.email}`);
        } catch (emailErr) {
            logger.error(`Failed to send password reset email to ${targetUser.email}: ${emailErr.message}`);
        }

        // SECURITY: Never return password in API response
        res.json({
            success: true,
            message: 'Password reset successful. New password sent via email.',
        });
    }
}

module.exports = new UserController();
