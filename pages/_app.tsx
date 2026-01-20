import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Analytics } from '@vercel/analytics/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/lib/auth';
import { AdminAuthProvider } from '@/lib/admin-auth';

export default function App({ Component, pageProps }: AppProps) {
  // Create a new QueryClient instance for each app render
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminAuthProvider>
          <Component {...pageProps} />
          <Analytics />
          <ToastContainer position="top-right" theme="dark" />
        </AdminAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}