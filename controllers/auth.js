const ErrorResponse = require('../util/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const config = require('config');

// @desc    Register a user
// @route   POST api/v0/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { username, email, password, role } = req.body;

  //create user
  const user = await User.create({
    username,
    email,
    role,
    password,
  });

  sendTokenResponse(user, 200, res);
});

// @desc    Login a user
// @route   POST api/v0/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //Validate email and password
  if (!email || !password) {
    return next(new ErrorResponse('Please add email and password', 400));
  }

  //Check for user
  const user = await User.findOne({ email: email }).select('+password');

  if (!user) return 'Invalid credentials';

  //Check if password is correct
  const isMatch = await user.matchPassword(password);

  if (!isMatch) return 'Invalid Credentials';

  sendTokenResponse(user, 200, res);
});

// @desc    Get user ID for logged in user
// @route   POST api/v0/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
});

//Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: Date.now() + config.get('JWT_COOKIE_EXPIRE') * 24 * 60 * 60 * 1000,
    httpOnly: true,
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, token });
};
