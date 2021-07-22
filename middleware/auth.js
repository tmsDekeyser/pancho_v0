const jwt = require('jsonwebtoken');
const config = require('config');
const ErrorResponse = require('../util/errorResponse');
const asyncHandler = require('../middleware/async');

const User = require('../models/User');

exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } //else if(req.cookies.token) {
  //token = req.cookies.token;
  //}

  //Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  //Verify token
  try {
    const decoded = jwt.verify(token, config.get('JWT_SECRET'));

    req.user = await User.findById(decoded.id);

    next();
  } catch (error) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return new ErrorResponse(
        `User role ${req.user.role} is not authorized to access this route`,
        403
      );
    }
    next();
  };
};
