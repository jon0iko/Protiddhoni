/**
 * Authentication Controller
 * Handles registration, login, logout
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');
const slugify = require('../utils/slugify');

exports.register = async (req, res) => {
    try {
        const { email, username, password, full_name } = req.body;
        
        // Validate input
        if (!email || !username || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email, username, and password are required' 
            });
        }

        // Check if user already exists
        const existingEmail = await UserRepository.findByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email already registered' 
            });
        }

        const existingUsername = await UserRepository.findByUsername(username);
        if (existingUsername) {
            return res.status(400).json({ 
                success: false, 
                error: 'Username already taken' 
            });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Create user
        const userData = {
            email,
            username: slugify(username),
            full_name: full_name || username,
            password_hash,
            is_admin: false,
            profile_picture_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
        };

        const user = await UserRepository.create(userData);

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, is_admin: user.is_admin },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        // Remove password from response
        delete user.password_hash;

        res.status(201).json({ 
            success: true,
            message: 'Registration successful',
            data: { user, token }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body; // identifier can be email or username
        
        if (!identifier || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Identifier and password are required' 
            });
        }

        // Find user by email or username
        let user;
        
        // Check if identifier is email (contains @)
        if (identifier.includes('@')) {
            user = await UserRepository.findByEmailWithPassword(identifier);
        } else {
            user = await UserRepository.findByUsernameWithPassword(identifier);
        }

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, is_admin: user.is_admin },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        // Remove password from response
        delete user.password_hash;

        res.json({ 
            success: true,
            message: 'Login successful',
            data: { user, token }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.logout = async (req, res) => {
    try {
        // With JWT, logout is handled client-side by removing the token
        res.json({ success: true, message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await UserRepository.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Get user stats
        const stats = await UserRepository.getUserStats(req.user.id);
        user.stats = stats;

        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
