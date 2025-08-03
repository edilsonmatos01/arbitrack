'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';

interface PositionPnLAlertProps {
  symbol: string;
  pnlPercent: number;
  totalPnL: number;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  soundFile?: string;
}

interface AlertThreshold {
  level: number;
  triggered: boolean;
  lastAlertTime: number;
}

export default function PositionPnLAlert({ 
  symbol, 
  pnlPercent, 
  totalPnL,
  isEnabled, 
  onToggle,
  soundFile = '/sounds/alerta2.mp3'
}: PositionPnLAlertProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [alertLevels, setAlertLevels] = useState<AlertThreshold[]>([
    { level: 0.50, triggered: false, lastAlertTime: 0 },
    { level: 1.00, triggered: false, lastAlertTime: 0 },
    { level: 2.00, triggered: false, lastAlertTime: 0 }
  ]);
  const [isAlerting, setIsAlerting] = useState(false);
  const alertCooldownRef = useRef(30000); // 30 segundos entre alertas
  const playCountRef = useRef(0);
  const maxPlays = 2; // Máximo de 2 toques por alerta

  const { showSuccess, showWarning } = useToastContext();

  // Configurar o áudio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio(soundFile);
      audioRef.current.volume = 0.7;
      audioRef.current.preload = 'auto';
      
      audioRef.current.addEventListener('canplay', () => {
        console.log('✅ Arquivo de som PnL carregado com sucesso:', soundFile);
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.warn('⚠️ Arquivo de som PnL não encontrado:', soundFile);
      });
      
      // Tocar 2 vezes
      const handleEnded = () => {
        playCountRef.current += 1;
        if (playCountRef.current < maxPlays) {
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(error => {
                console.warn('Erro ao tocar beep extra PnL:', error);
              });
            }
          }, 200);
        }
      };

      const audio = audioRef.current;
      audio.addEventListener('ended', handleEnded);
      return () => {
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [soundFile]);

  // Verificar se deve tocar o alerta
  useEffect(() => {
    if (!isEnabled || pnlPercent <= 0) {
      // Resetar alertas quando PnL volta a zero ou negativo
      setAlertLevels(prev => prev.map(level => ({ ...level, triggered: false })));
      return;
    }

    const now = Date.now();
    let shouldAlert = false;
    let alertMessage = '';
    let alertType: 'success' | 'warning' = 'success';

    // Verificar cada threshold usando função para evitar dependência circular
    setAlertLevels(prev => {
      const newAlertLevels = prev.map(level => {
        if (pnlPercent >= level.level && !level.triggered && (now - level.lastAlertTime) > alertCooldownRef.current) {
          shouldAlert = true;
          alertMessage = `🎯 ${symbol}: PnL atingiu ${level.level}%! Lucro: $${totalPnL.toFixed(2)}`;
          
          // Determinar tipo de alerta baseado no nível
          if (level.level >= 2.00) {
            alertType = 'success';
          } else if (level.level >= 1.00) {
            alertType = 'success';
          } else {
            alertType = 'warning';
          }

          return { ...level, triggered: true, lastAlertTime: now };
        }
        return level;
      });

      // Tocar alerta se necessário (fora do map para evitar re-renders)
      if (shouldAlert) {
        setTimeout(() => {
          setIsAlerting(true);
          playCountRef.current = 0;

          // Tocar som
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(error => {
              console.warn('Erro ao tocar alerta PnL:', error);
            });
          }

          // Mostrar notificação
          if (alertType === 'success') {
            showSuccess(
              `💰 LUCRO ATINGIDO - ${symbol}`,
              alertMessage
            );
          } else {
            showWarning(
              `📈 PnL POSITIVO - ${symbol}`,
              alertMessage
            );
          }

          // Resetar estado de alerta após 2 segundos
          setTimeout(() => {
            setIsAlerting(false);
          }, 2000);
        }, 0);
      }

      return newAlertLevels;
    });
  }, [pnlPercent, isEnabled, symbol, totalPnL, showSuccess, showWarning]);



  // Determinar cor do ícone baseado no PnL
  const getIconColor = () => {
    if (!isEnabled) return 'text-gray-500';
    if (isAlerting) return 'text-green-400 animate-pulse';
    if (pnlPercent >= 2.00) return 'text-green-400';
    if (pnlPercent >= 1.00) return 'text-green-300';
    if (pnlPercent >= 0.50) return 'text-yellow-400';
    return 'text-gray-400';
  };

  // Determinar tooltip
  const getTooltip = () => {
    if (!isEnabled) return 'Ativar alertas de PnL';
    
    const triggeredLevels = alertLevels.filter(level => level.triggered).length;
    const totalLevels = alertLevels.length;
    
    if (pnlPercent <= 0) {
      return `Aguardando PnL positivo (0.50%, 1%, 2%)`;
    }
    
    return `PnL: ${pnlPercent.toFixed(2)}% - ${triggeredLevels}/${totalLevels} alertas disparados`;
  };

  return (
    <button
      onClick={() => onToggle(!isEnabled)}
      className={`p-1 transition-colors ${getIconColor()}`}
      title={getTooltip()}
    >
      <Bell className="h-4 w-4" />
    </button>
  );
} 