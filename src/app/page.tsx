import { redirect } from 'next/navigation';

/**
 * Root route handler (https://komuna.masagus.web.id/)
 * Otomatis mengarahkan pengguna ke halaman dashboard utama (/dashboard).
 */
export default function RootPage() {
  redirect('/dashboard');
}
