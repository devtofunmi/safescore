import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from '@/lib/auth';
import { AdminAuthProvider } from '@/lib/admin-auth';


export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <Component {...pageProps} />
        <Analytics />
        <ToastContainer position="top-right" theme="dark" />
      </AdminAuthProvider>
    </AuthProvider>
  );
}