import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cache simples para rate limiting
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

// Configurações de rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requisições por minuto

export function middleware(request: NextRequest) {
  // Aplicar rate limiting apenas para APIs de spread history
  if (request.nextUrl.pathname.startsWith('/api/spread-history')) {
    const clientIP = request.ip || 'unknown';
    const now = Date.now();
    
    // Verificar se existe entrada no cache
    const clientData = rateLimitCache.get(clientIP);
    
    if (!clientData || now > clientData.resetTime) {
      // Primeira requisição ou janela expirada
      rateLimitCache.set(clientIP, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW
      });
    } else {
      // Incrementar contador
      clientData.count++;
      
      if (clientData.count > MAX_REQUESTS_PER_WINDOW) {
        // Rate limit excedido
        return NextResponse.json(
          { 
            error: 'Too Many Requests',
            message: 'Muitas requisições. Tente novamente em alguns minutos.',
            retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
          },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((clientData.resetTime - now) / 1000).toString(),
              'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': clientData.resetTime.toString()
            }
          }
        );
      }
    }
    
    // Adicionar headers de rate limiting
    const response = NextResponse.next();
    const remaining = MAX_REQUESTS_PER_WINDOW - (clientData?.count || 1);
    
    response.headers.set('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', (clientData?.resetTime || now + RATE_LIMIT_WINDOW).toString());
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/spread-history/:path*',
  ],
}; 