'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Adicionar timeout para evitar carregamento infinito
    const timeout = setTimeout(() => {
      setError('Tempo limite excedido. Tentando novamente...');
      // Tentar redirecionar novamente após 5 segundos
      setTimeout(() => {
        router.replace('/dashboard');
      }, 5000);
    }, 10000);

    // Redirecionar automaticamente para o dashboard
    router.replace('/dashboard');

    return () => clearTimeout(timeout);
  }, [router]);

  // Página de loading enquanto redireciona
  return (
    <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-cyan mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold mb-2">Carregando...</h1>
        <p className="text-gray-400">Redirecionando para o Dashboard</p>
        {error && (
          <div className="mt-4 p-3 bg-red-800 border border-red-600 rounded-md">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
} 