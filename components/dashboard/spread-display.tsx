'use client';

import React from 'react';

export default function SpreadDisplay() {
  return (
    <div className="card-enhanced card-neon">
      <h2 className="text-xl font-semibold mb-4">Spread em Tempo Real</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card-enhanced card-neon p-4">
          <h3 className="text-lg font-medium mb-2">BTC/USDT</h3>
          <div className="flex justify-between">
            <span className="text-gray-400">Spread:</span>
            <span className="text-white">0.45%</span>
          </div>
        </div>
        <div className="card-enhanced card-neon p-4">
          <h3 className="text-lg font-medium mb-2">ETH/USDT</h3>
          <div className="flex justify-between">
            <span className="text-gray-400">Spread:</span>
            <span className="text-white">0.32%</span>
          </div>
        </div>
        <div className="card-enhanced card-neon p-4">
          <h3 className="text-lg font-medium mb-2">BNB/USDT</h3>
          <div className="flex justify-between">
            <span className="text-gray-400">Spread:</span>
            <span className="text-white">0.28%</span>
          </div>
        </div>
      </div>
    </div>
  );
} 