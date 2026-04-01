/**
 * Returns true if the string is a valid 6-digit Indian pincode.
 */
export function isValidPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode);
}

/**
 * Returns true if the string is a valid 10-digit Indian phone number.
 */
export function isValidPhone(phone: string): boolean {
  return /^\d{10}$/.test(phone);
}

/**
 * Returns true if the string is a valid email address.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Password strength rules — mirrors backend FluentValidation rules.
 * Returns an array of unmet requirements (empty = strong password).
 */
export function getPasswordErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("At least one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("At least one lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("At least one digit");
  if (!/[^a-zA-Z0-9]/.test(password))
    errors.push("At least one special character");
  return errors;
}

/**
 * Returns password strength label based on score.
 */
export function getPasswordStrength(password: string): {
  label: string;
  color: string;
  score: number;
} {
  const errors = getPasswordErrors(password);
  const score = 5 - errors.length;

  if (score <= 1) return { label: "Very Weak", color: "bg-red-500", score };
  if (score === 2) return { label: "Weak", color: "bg-orange-500", score };
  if (score === 3) return { label: "Fair", color: "bg-yellow-500", score };
  if (score === 4) return { label: "Good", color: "bg-blue-500", score };
  return { label: "Strong", color: "bg-green-500", score };
}
