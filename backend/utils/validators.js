/**
 * Utility: Custom Validators
 * Reusable validation functions
 */

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidUsername = (username) => {
    // Username: 3-50 chars, alphanumeric, underscore, dash
    const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
    return usernameRegex.test(username);
};

const isStrongPassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password);
};

module.exports = {
    isValidEmail,
    isValidUsername,
    isStrongPassword
};
