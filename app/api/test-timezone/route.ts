import { NextResponse } from 'next/server';
import { toZonedTime, format } from 'date-fns-tz';

export async function GET() {
  try {
    const now = new Date();
    
    const diagnostic = {
      // Configurações do ambiente
      environment: {
        TZ: process.env.TZ || 'Não definida',
        NODE_ENV: process.env.NODE_ENV || 'Não definida',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      
      // Testes de data/hora
      datetime: {
        now_iso: now.toISOString(),
        now_string: now.toString(),
        now_locale: now.toLocaleString('pt-BR'),
        now_sao_paulo: now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      },
      
      // Testes com date-fns-tz
      date_fns_tz: {
        toZonedTime: toZonedTime(now, 'America/Sao_Paulo').toISOString(),
        format_with_tz: format(now, 'dd/MM - HH:mm', { timeZone: 'America/Sao_Paulo' }),
        format_without_tz: format(now, 'dd/MM - HH:mm'),
      },
      
      // Testes de conversão específicos
      conversion_tests: {
        test_11_14: (() => {
          const testTime = new Date();
          testTime.setHours(11, 14, 0, 0);
          return {
            original: testTime.toISOString(),
            converted: toZonedTime(testTime, 'America/Sao_Paulo').toISOString(),
            formatted: format(testTime, 'dd/MM - HH:mm', { timeZone: 'America/Sao_Paulo' })
          };
        })(),
        
        test_24h_ago: (() => {
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          return {
            original: yesterday.toISOString(),
            converted: toZonedTime(yesterday, 'America/Sao_Paulo').toISOString(),
            formatted: format(yesterday, 'dd/MM - HH:mm', { timeZone: 'America/Sao_Paulo' })
          };
        })()
      }
    };
    
    return NextResponse.json(diagnostic);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 });
  }
} 