'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar automaticamente para o dashboard
    router.replace('/dashboard');
  }, [router]);

  // Página de loading enquanto redireciona
  return (
    <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-cyan mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold mb-2">Carregando...</h1>
        <p className="text-gray-400">Redirecionando para o Dashboard</p>
      </div>
    </div>
  );
} 