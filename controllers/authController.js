const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const userRole = role === 'contentCreator' ? 'contentCreator' : 'endUser';
    const status = userRole === 'contentCreator' ? 'pending' : 'active';

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(400).json({ message: 'Email or username already in use' });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: userRole,
      status,
    });

    if (status === 'pending') {
      return res.status(201).json({
        message: 'Account created. Awaiting admin approval.',
        pending: true,
      });
    }

    res.status(201).json({
      user,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Account awaiting approval' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Account has been rejected' });
    }

    res.json({
      user,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

// POST /api/auth/bootstrap-admin
// One-time use: promotes a user to superAdmin if no admin exists yet.
// Body: { "email": "..." }
exports.bootstrapAdmin = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Block if a super admin already exists
    const existingAdmin = await User.findOne({ role: 'superAdmin' });
    if (existingAdmin) {
      return res.status(403).json({
        message: 'A super admin already exists. This endpoint is no longer available.',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }

    user.role = 'superAdmin';
    user.status = 'active';
    await user.save();

    res.json({
      message: `${user.username} has been promoted to Super Admin.`,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
