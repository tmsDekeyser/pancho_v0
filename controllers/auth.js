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

  const token = user.getSignedJwtToken();

  res.status(200).json({ success: true, token });
};

// @desc    Login a user
// @route   POST api/v0/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  //Validate email and password
  if (!email || !password) {
    return 'Please add email and password';
    //Add error response
  }

  //Check for user
  const user = await User.findOne({ email: email }).select('+password');

  if (!user) return 'Invalid credentials';

  //Check if password is correct
  const isMatch = await user.matchPassword(password);

  if (!isMatch) return 'Invalid Credentials';

  const token = user.getSignedJwtToken();

  res.status(200).json({ success: true, token });
};
