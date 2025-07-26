import React from 'react';
import CustomSelect from '@/components/ui/custom-select';

interface ExchangeConfig {
    spot: string;
    futures: string;
}

interface ExchangeSelectorProps {
    currentConfig: ExchangeConfig;
    onConfigChange: (newConfig: ExchangeConfig) => void;
}

export function ExchangeSelector({ currentConfig, onConfigChange }: ExchangeSelectorProps) {
    const handleChange = (value: string) => {
        if (value === "gate_mexc") {
            onConfigChange({ spot: "GATE_SPOT", futures: "MEXC_FUTURES" });
        } else if (value === "mexc_gate") {
            onConfigChange({ spot: "MEXC_SPOT", futures: "GATE_FUTURES" });
        }
    };

    const getCurrentValue = () => {
        if (currentConfig.spot === "GATE_SPOT" && currentConfig.futures === "MEXC_FUTURES") {
            return "gate_mexc";
        } else if (currentConfig.spot === "MEXC_SPOT" && currentConfig.futures === "GATE_FUTURES") {
            return "mexc_gate";
        }
        return "gate_mexc"; // default
    };

    return (
        <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-white">Combinação de Exchanges:</label>
            <CustomSelect
                value={getCurrentValue()}
                onChange={handleChange}
                options={[
                    { value: "gate_mexc", label: "Gate.io (Spot) → MEXC (Futures)" },
                    { value: "mexc_gate", label: "MEXC (Spot) → Gate.io (Futures)" }
                ]}
                placeholder="Selecione a combinação"
            />
        </div>
    );
} 