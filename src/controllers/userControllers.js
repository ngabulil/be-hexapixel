const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { formatResponse, formatResponsePagination } = require('../utils/formatResponse');
const { generateFileUrl } = require('../utils/filePath');

// REGISTER SUPER ADMIN SAJA
const register = async (req, res) => {
    try {
        const { username, password, fullName, contactNumber } = req.body;
        const photo = req.file ? req.file.filename : '';

        const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
        if (existingSuperAdmin) {
            return formatResponse(res, 403, 'Super admin already registered', null);
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return formatResponse(res, 400, 'Username already exists', null);
        }

        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            password: hashedPassword,
            fullName,
            contactNumber,
            photo: generateFileUrl('users', photo, req),
            role: 'super_admin'
        });

        return formatResponse(res, 201, 'Super admin registered successfully', {
            id: user._id,
            username: user.username,
            fullName: user.fullName,
            role: user.role
        });
    } catch (err) {
        return formatResponse(res, 500, 'Failed to register super admin', { error: err.message });
    }
};

// LOGIN
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return formatResponse(res, 400, 'Invalid username or password', null);

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return formatResponse(res, 400, 'Invalid username or password', null);

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '1d',
        });

        return formatResponse(res, 200, 'Login successful', {
            token,
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                role: user.role
            }
        });
    } catch (err) {
        return formatResponse(res, 500, 'Failed to login', { error: err.message });
    }
};

// CREATE USER (by super_admin or manager)
const createUser = async (req, res) => {
    try {
        const { username, password, fullName, contactNumber, role } = req.body;
        const photo = req.file ? req.file.filename : '';

        // Only super_admin or manager
        const creatorRole = req.user.role;

        if (
            (creatorRole === 'manager' && role !== 'employee') ||
            (creatorRole === 'super_admin' && !['manager', 'employee'].includes(role))
        ) {
            return formatResponse(res, 403, 'You are not allowed to create this user role', null);
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return formatResponse(res, 400, 'Username already exists', null);
        }

        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            username,
            password: hashedPassword,
            fullName,
            contactNumber,
            photo: generateFileUrl('users', photo, req),
            role
        });

        return formatResponse(res, 201, 'User created successfully', {
            id: newUser._id,
            username: newUser.username,
            fullName: newUser.fullName,
            role: newUser.role
        });
    } catch (err) {
        return formatResponse(res, 500, 'Failed to create user', { error: err.message });
    }
};

// GET ALL USERS
const getAllUsers = async (req, res) => {
    try {
        const currentRole = req.user.role;

        let query = {};

        // Search dari FE (query string: ?search=nama)
        const search = req.query.search || '';

        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } }
            ];
        }

        // Role filter
        if (currentRole === 'manager') {
            query.role = 'employee';
        } else if (currentRole === 'super_admin') {
            query.role = { $ne: 'super_admin' };
        } else {
            return formatResponsePagination(res, 403, 'Access denied', null, 1, 10, 0, req.query);
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await User.countDocuments(query);
        const totalPage = Math.ceil(total / limit);

        const users = await User.find(query)
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        return formatResponsePagination(res, 200, 'User list retrieved', users, page, limit, totalPage, req.query);
    } catch (err) {
        return formatResponsePagination(res, 500, 'Failed to get users', { error: err.message }, 1, 10, 0, req.query);
    }
};

// GET USER BY ID
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return formatResponse(res, 404, 'User not found', null);

        return formatResponse(res, 200, 'User found', user);
    } catch (err) {
        return formatResponse(res, 500, 'Failed to get user', { error: err.message });
    }
};


// GET PROFILE
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return formatResponse(res, 404, 'User not found', null);
        return formatResponse(res, 200, 'User profile retrieved', user);
    } catch (err) {
        return formatResponse(res, 500, 'Failed to get user profile', { error: err.message });
    }
};

// UPDATE USER (by super_admin or manager)
const updateUser = async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return formatResponse(res, 404, 'User not found', null);

        const requesterRole = req.user.role;

        // Batasan role: Hanya manager yang bisa mengubah role 'employee', dan super_admin yang bisa mengubah role selain 'super_admin'
        if (
            (requesterRole === 'manager' && targetUser.role !== 'employee') ||
            (requesterRole === 'super_admin' && targetUser.role === 'super_admin')
        ) {
            return formatResponse(res, 403, 'You are not allowed to update this user', null);
        }

        const { fullName, contactNumber, role, password } = req.body;
        const photo = req.file ? req.file.filename : targetUser.photo;  // Gunakan foto yang ada jika tidak ada upload baru

        // Tentukan fields yang bisa diubah
        const allowedFields = ['fullName', 'contactNumber', 'role', 'photo'];

        if (fullName !== undefined) targetUser.fullName = fullName;
        if (contactNumber !== undefined) targetUser.contactNumber = contactNumber;
        if (role && allowedFields.includes('role')) targetUser.role = role;
        if (photo) targetUser.photo = generateFileUrl('users', photo, req); // Jika ada file photo baru, update

        // Jika password diberikan, lakukan hash pada password baru
        if (password) {
            const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
            targetUser.password = await bcrypt.hash(password, salt);
        }

        // Simpan perubahan user
        await targetUser.save();

        return formatResponse(res, 200, 'User updated successfully', {
            id: targetUser._id,
            username: targetUser.username,
            fullName: targetUser.fullName,
            role: targetUser.role
        });
    } catch (err) {
        return formatResponse(res, 500, 'Failed to update user', { error: err.message });
    }
};

// DELETE USER (by super_admin or manager)
const deleteUser = async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return formatResponse(res, 404, 'User not found', null);

        const requesterRole = req.user.role;

        // Batasan role
        if (
            (requesterRole === 'manager' && targetUser.role !== 'employee') ||
            (requesterRole === 'super_admin' && targetUser.role === 'super_admin')
        ) {
            return formatResponse(res, 403, 'You are not allowed to delete this user', null);
        }

        await targetUser.deleteOne();

        return formatResponse(res, 200, 'User deleted successfully', {
            id: targetUser._id,
            username: targetUser.username,
            role: targetUser.role
        });
    } catch (err) {
        return formatResponse(res, 500, 'Failed to delete user', { error: err.message });
    }
};

// RESET PASSWORD USER (oleh super_admin atau manager)
const resetUserPassword = async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return formatResponse(res, 404, 'User not found', null);

        const requesterRole = req.user.role;

        if (
            (requesterRole === 'manager' && targetUser.role !== 'employee') ||
            (requesterRole === 'super_admin' && targetUser.role === 'super_admin')
        ) {
            return formatResponse(res, 403, 'You are not allowed to reset this user\'s password', null);
        }

        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return formatResponse(res, 400, 'New password is required and must be at least 6 characters', null);
        }

        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
        targetUser.password = await bcrypt.hash(newPassword, salt);
        await targetUser.save();

        return formatResponse(res, 200, 'User password reset successfully', {
            id: targetUser._id,
            username: targetUser.username,
            role: targetUser.role
        });
    } catch (err) {
        return formatResponse(res, 500, 'Failed to reset password', { error: err.message });
    }
};

// CHANGE PASSWORD SENDIRI
const changeOwnPassword = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return formatResponse(res, 404, 'User not found', null);

        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return formatResponse(res, 400, 'Old and new password are required', null);
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return formatResponse(res, 400, 'Old password is incorrect', null);
        }

        if (newPassword.length < 6) {
            return formatResponse(res, 400, 'New password must be at least 6 characters', null);
        }

        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        return formatResponse(res, 200, 'Password changed successfully', {
            id: user._id,
            username: user.username
        });
    } catch (err) {
        return formatResponse(res, 500, 'Failed to change password', { error: err.message });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    resetUserPassword,
    changeOwnPassword
};
