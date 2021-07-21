//Create Error Handler
//Create Async Handler
const User = require('../models/User');

// @desc    Register a user
// @route   POST api/v0/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  const { username, email, password, role } = req.body;

  //create user
  const user = await User.create({
    username,
    email,
    role,
    password,
  });

  res.status(200).json({ success: true });
};
