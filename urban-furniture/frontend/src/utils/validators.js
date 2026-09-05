/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate required field (non-empty string)
 */
export const isRequired = (value) => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Validate phone number (basic — at least 10 digits)
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate password strength (min 8 chars)
 */
export const isValidPassword = (password) => {
  return typeof password === 'string' && password.length >= 8;
};

/**
 * Validate OTP (6 digits)
 */
export const isValidOtp = (otp) => {
  return /^\d{6}$/.test(otp);
};
