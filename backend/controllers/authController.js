const bcrypt = require('bcryptjs');
const { generateTokens } = require('../config/jwt');
const User = require('../models/User');
const logger = require('../utils/logger');

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findByEmailOrUsername(email, username);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password_hash: passwordHash
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Set secure HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update user status - both last seen AND online status
    await User.updateLastSeen(user.id);
    await User.updateOnlineStatus(user.id, true);  // Add this line

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Set secure HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        online: true  // Also include in response
      },
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res) => {
  await User.updateOnlineStatus(req.user.userId, false);
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Logged out successfully' });
};

exports.refreshToken = async (req, res, next) => {
  try {
    // Check if cookies exist first
    if (!req.cookies) {
      return res.status(401).json({ 
        error: 'No cookies available',
        message: 'Please login again' 
      });
    }

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ 
        error: 'No refresh token provided',
        message: 'Please login again' 
      });
    }

    const { verifyRefreshToken } = require('../config/jwt');
    const decoded = verifyRefreshToken(refreshToken);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid refresh token',
        message: 'Please login again' 
      });
    }

    const { generateTokens } = require('../config/jwt');
    const { accessToken } = generateTokens(user);
    
    res.json({ accessToken });
  } catch (error) {
    // Handle JWT verification errors gracefully
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Invalid refresh token',
        message: 'Please login again' 
      });
    }
    next(error);
  }
};