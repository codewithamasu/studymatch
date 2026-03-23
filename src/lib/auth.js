export function formatAuthError(error) {
  const message = error?.message?.toLowerCase?.() || ''

  if (!message) return 'An issue occurred while processing authentication. Please try again in a moment.'
  if (message.includes('invalid login credentials')) return 'Invalid email or password.'
  if (message.includes('email not confirmed')) return 'Your email is not verified. Check your inbox and try logging in again.'
  if (message.includes('user already registered')) return 'This email is already registered. Please log in.'
  if (message.includes('password should be at least')) return 'Password must be at least 6 characters.'
  if (message.includes('signup is disabled')) return 'Signups are currently disabled for this project.'
  if (message.includes('supabase belum dikonfigurasi')) return error.message
  if (message.includes('failed to fetch')) return 'Connection to auth server failed. Please ensure Supabase is configured correctly.'

  return error.message
}
