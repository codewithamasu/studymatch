export function formatAuthError(error) {
  const message = error?.message?.toLowerCase?.() || ''

  if (!message) return 'Terjadi kendala saat memproses autentikasi. Coba lagi sebentar.'
  if (message.includes('invalid login credentials')) return 'Email atau password belum sesuai.'
  if (message.includes('email not confirmed')) return 'Email kamu belum terverifikasi. Cek inbox lalu coba login lagi.'
  if (message.includes('user already registered')) return 'Email ini sudah terdaftar. Silakan login.'
  if (message.includes('password should be at least')) return 'Password minimal 6 karakter.'
  if (message.includes('signup is disabled')) return 'Pendaftaran belum diaktifkan pada proyek Supabase ini.'
  if (message.includes('supabase belum dikonfigurasi')) return error.message
  if (message.includes('failed to fetch')) return 'Koneksi ke server auth gagal. Pastikan konfigurasi Supabase sudah benar.'

  return error.message
}
