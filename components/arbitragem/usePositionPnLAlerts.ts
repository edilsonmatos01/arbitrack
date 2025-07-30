import { useState, useEffect } from 'react';

interface PositionPnLAlertConfig {
  [positionId: string]: boolean;
}

export function usePositionPnLAlerts() {
  const [alertConfigs, setAlertConfigs] = useState<PositionPnLAlertConfig>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar configurações do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('position-pnl-alerts-config');
      if (saved) {
        const config = JSON.parse(saved);
        setAlertConfigs(config);
      }
    } catch (error) {
      console.warn('Erro ao carregar configurações de alerta PnL:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Salvar configurações no localStorage
  const saveConfig = (config: PositionPnLAlertConfig) => {
    try {
      localStorage.setItem('position-pnl-alerts-config', JSON.stringify(config));
    } catch (error) {
      console.warn('Erro ao salvar configurações de alerta PnL:', error);
    }
  };

  // Ativar/desativar alerta para uma posição específica
  const toggleAlert = (positionId: string, enabled: boolean) => {
    const newConfig = {
      ...alertConfigs,
      [positionId]: enabled
    };
    setAlertConfigs(newConfig);
    saveConfig(newConfig);
  };

  // Verificar se o alerta está ativo para uma posição
  const isAlertEnabled = (positionId: string): boolean => {
    return alertConfigs[positionId] === true;
  };

  // Ativar todos os alertas de posições
  const enableAllPositionAlerts = () => {
    const newConfig = Object.keys(alertConfigs).reduce((acc, positionId) => {
      acc[positionId] = true;
      return acc;
    }, {} as PositionPnLAlertConfig);
    setAlertConfigs(newConfig);
    saveConfig(newConfig);
  };

  // Desativar todos os alertas de posições
  const disableAllPositionAlerts = () => {
    const newConfig = Object.keys(alertConfigs).reduce((acc, positionId) => {
      acc[positionId] = false;
      return acc;
    }, {} as PositionPnLAlertConfig);
    setAlertConfigs(newConfig);
    saveConfig(newConfig);
  };

  // Adicionar nova posição à configuração
  const addPosition = (positionId: string) => {
    if (!alertConfigs.hasOwnProperty(positionId)) {
      const newConfig = {
        ...alertConfigs,
        [positionId]: false // Por padrão, desativado
      };
      setAlertConfigs(newConfig);
      saveConfig(newConfig);
    }
  };

  // Remover posição da configuração
  const removePosition = (positionId: string) => {
    const newConfig = { ...alertConfigs };
    delete newConfig[positionId];
    setAlertConfigs(newConfig);
    saveConfig(newConfig);
  };

  return {
    alertConfigs,
    isLoaded,
    toggleAlert,
    isAlertEnabled,
    enableAllPositionAlerts,
    disableAllPositionAlerts,
    addPosition,
    removePosition
  };
} 