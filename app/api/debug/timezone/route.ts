import { NextResponse } from 'next/server';
import { toZonedTime, format } from 'date-fns-tz';

export async function GET() {
  try {
    const now = new Date();
    
    // Informações básicas
    const debugInfo = {
      timestamp: now.toISOString(),
      timezone: {
        env: process.env.TZ || 'não definido',
        offset: now.getTimezoneOffset(),
        locale: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      conversions: {
        utc: now.toISOString(),
        saoPaulo: {
          withDateFns: null as string | null,
          manual: null as string | null
        }
      }
    };

    // Teste com date-fns-tz
    try {
      const saoPauloTime = toZonedTime(now, 'America/Sao_Paulo');
      debugInfo.conversions.saoPaulo.withDateFns = format(saoPauloTime, 'dd/MM - HH:mm', { timeZone: 'America/Sao_Paulo' });
    } catch (error) {
      debugInfo.conversions.saoPaulo.withDateFns = `Erro: ${error}`;
    }

    // Teste manual UTC-3
    try {
      const brazilOffset = 3 * 60 * 60 * 1000; // 3 horas em milissegundos
      const brazilTime = new Date(now.getTime() - brazilOffset);
      
      const day = String(brazilTime.getUTCDate()).padStart(2, '0');
      const month = String(brazilTime.getUTCMonth() + 1).padStart(2, '0');
      const hours = String(brazilTime.getUTCHours()).padStart(2, '0');
      const minutes = String(brazilTime.getUTCMinutes()).padStart(2, '0');
      
      debugInfo.conversions.saoPaulo.manual = `${day}/${month} - ${hours}:${minutes}`;
    } catch (error) {
      debugInfo.conversions.saoPaulo.manual = `Erro: ${error}`;
    }

    return NextResponse.json(debugInfo);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 