const { validationResult } = require('express-validator');

/**
 * Validation Request Middleware
 * 
 * Runs after express-validator checks and returns
 * structured 400 errors if validation fails.
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: formattedErrors,
    });
  }

  next();
};

module.exports = validateRequest;
