const ErrorResponse = require('../util/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const Wallet = require('../wallet/index');
const { bc } = require('../local-copy');
const config = require('config');

// @desc    Register a user
// @route   POST api/v0/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { username, email, password, role } = req.body;
  const wallet = new Wallet({ priv: null, pub: null }, bc);
  const keys = [wallet.keyPair.getPrivate('hex'), wallet.address];

  //create user
  const user = await User.create({
    username,
    email,
    role,
    password,
    keys,
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

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  //Check if password is correct
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Get user ID for logged in user
// @route   POST api/v0/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, data: user });
});

//Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + config.get('JWT_COOKIE_EXPIRE') * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (config.get('environment') === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, token });
};
