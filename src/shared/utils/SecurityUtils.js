const WEAK_PASSWORDS = new Set([
  'password',
  '123456',
  'qwerty',
  'admin',
  'letmein',
  'password123',
  'admin123',
  '123456789',
  'welcome',
]);

const parseBoolEnv = (value, defaultValue) => {
  if (value === undefined || value === '') return defaultValue;
  return ['true', '1', 'yes'].includes(String(value).trim().toLowerCase());
};

class SecurityUtils {
  static PASSWORD_REQUIREMENT = {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
    requireUppercase: parseBoolEnv(process.env.PASSWORD_REQUIRE_UPPERCASE, true),
    requireLowercase: parseBoolEnv(process.env.PASSWORD_REQUIRE_LOWERCASE, true),
    requireNumbers: parseBoolEnv(process.env.PASSWORD_REQUIRE_NUMBERS, true),
    requireSymbols: parseBoolEnv(process.env.PASSWORD_REQUIRE_SYMBOLS, true),
  };

  /**
   * @param {string} password
   * @returns {{ success: boolean, errors: string[], strength: string }}
   */
  static validatePassword(password) {
    if (typeof password !== 'string' || password.length === 0) {
      return {
        success: false,
        errors: ['Password is required!'],
        strength: 'weak',
      };
    }

    const errors = [];
    const { minLength, requireUppercase, requireLowercase, requireNumbers, requireSymbols } =
      this.PASSWORD_REQUIREMENT;

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} chars long!`);
    }
    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter!');
    }
    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter!');
    }
    if (requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number!');
    }
    if (requireSymbols && !/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character!');
    }
    if (WEAK_PASSWORDS.has(password.toLowerCase())) {
      errors.push('Password is too common and easily guessable');
    }

    return {
      success: errors.length === 0,
      errors,
      strength:
        typeof this.calculatePasswordStrength === 'function'
          ? this.calculatePasswordStrength(password)
          : undefined,
    };
  }
}

export default SecurityUtils;
