export const usernameRules = [
  (v) => !!v?.trim() || 'Username is required',
  (v) => v.trim().length >= 3 || 'Username must be at least 3 characters',
  (v) => v.trim().length <= 50 || 'Username must be at most 50 characters',
  (v) =>
    /^[a-zA-Z0-9_.-]+$/.test(v.trim()) || 'Use only letters, digits, dots, hyphens and underscores',
]

export const emailRules = [
  (v) => !!v?.trim() || 'Email is required',
  (v) => v.trim().length <= 255 || 'Email must be at most 255 characters',
  (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid email address',
]

export const passwordRules = [
  (v) => !!v || 'Password is required',
  (v) => v.length >= 8 || 'Password must be at least 8 characters',
  (v) => v.length <= 72 || 'Password must be at most 72 characters',
  (v) => /[a-z]/.test(v) || 'Add at least one lowercase letter',
  (v) => /[A-Z]/.test(v) || 'Add at least one uppercase letter',
  (v) => /\d/.test(v) || 'Add at least one digit',
  (v) => /[^A-Za-z0-9\s]/.test(v) || 'Add at least one special character',
]

export const displayNameRules = [
  (v) => (v?.trim().length ?? 0) <= 100 || 'Display name must be at most 100 characters',
]

export const bioRules = [
  (v) => (v?.trim().length ?? 0) <= 500 || 'Bio must be at most 500 characters',
]


// Avatar upload validation

export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp']
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024

export function validateAvatarFile(file) {
  if (!AVATAR_TYPES.includes(file.type)) return 'Use a PNG, JPG or WebP image'
  if (file.size > AVATAR_MAX_BYTES) return 'The image must be 2 MB or smaller'
  return null
}