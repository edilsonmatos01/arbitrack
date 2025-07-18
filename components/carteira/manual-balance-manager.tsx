"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X, DollarSign } from 'lucide-react';

interface ManualBalance {
  id: string;
  name: string;
  amount: number;
  currency: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface ManualBalanceForm {
  name: string;
  amount: string;
  currency: string;
  description: string;
}

export default function ManualBalanceManager() {
  const [balances, setBalances] = useState<ManualBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [form, setForm] = useState<ManualBalanceForm>({
    name: '',
    amount: '',
    currency: 'USDT',
    description: ''
  });

  const currencies = ['USDT', 'USD', 'BTC', 'ETH', 'BRL'];

  useEffect(() => {
    loadBalances();
  }, []);

  const loadBalances = async () => {
    try {
      const response = await fetch('/api/config/manual-balances');
      if (response.ok) {
        const data = await response.json();
        setBalances(data);
      }
    } catch (error) {
      console.error('Erro ao carregar saldos:', error);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const resetForm = () => {
    setForm({
      name: '',
      amount: '',
      currency: 'USDT',
      description: ''
    });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.amount) {
      showMessage('error', 'Nome e valor são obrigatórios.');
      return;
    }

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      showMessage('error', 'Valor deve ser um número positivo.');
      return;
    }

    setIsLoading(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `/api/config/manual-balances/${editingId}`
        : '/api/config/manual-balances';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          amount: amount,
          currency: form.currency,
          description: form.description
        }),
      });

      if (response.ok) {
        showMessage('success', editingId ? 'Saldo atualizado com sucesso!' : 'Saldo adicionado com sucesso!');
        loadBalances();
        resetForm();
        setShowForm(false);
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.error || 'Erro ao salvar saldo');
      }
    } catch (error) {
      console.error('Erro ao salvar saldo:', error);
      showMessage('error', 'Erro de conexão ao salvar saldo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (balance: ManualBalance) => {
    setForm({
      name: balance.name,
      amount: balance.amount.toString(),
      currency: balance.currency,
      description: balance.description || ''
    });
    setEditingId(balance.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este saldo?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/config/manual-balances/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showMessage('success', 'Saldo removido com sucesso!');
        loadBalances();
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.error || 'Erro ao remover saldo');
      }
    } catch (error) {
      console.error('Erro ao remover saldo:', error);
      showMessage('error', 'Erro de conexão ao remover saldo');
    } finally {
      setIsLoading(false);
    }
  };

  const totalBalance = balances.reduce((sum, balance) => {
    // Converter tudo para USDT para o cálculo total
    if (balance.currency === 'USDT' || balance.currency === 'USD') {
      return sum + balance.amount;
    }
    // Para outras moedas, usar valor aproximado (pode ser melhorado com API de preços)
    return sum + balance.amount;
  }, 0);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-custom-cyan" />
            Saldo Total
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Adicione saldos manualmente para exibição no dashboard
          </p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              setShowForm(true);
            }
          }}
          className="flex items-center gap-2 bg-custom-cyan hover:bg-custom-cyan/80 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancelar' : 'Adicionar Saldo'}
        </button>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-900/20 border border-green-500/30 text-green-400' : 'bg-red-900/20 border border-red-500/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
          <h4 className="text-md font-medium mb-4">
            {editingId ? 'Editar Saldo' : 'Novo Saldo'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                placeholder="Ex: Carteira Principal"
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-custom-cyan focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Valor *
              </label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({...form, amount: e.target.value})}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-custom-cyan focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Moeda
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm({...form, currency: e.target.value})}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-custom-cyan focus:border-transparent"
              >
                {currencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descrição
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
                placeholder="Ex: Saldo em conta bancária"
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-custom-cyan focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 bg-custom-cyan hover:bg-custom-cyan/80 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Salvando...' : (editingId ? 'Atualizar' : 'Salvar')}
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de saldos */}
      <div className="space-y-3">
        {balances.map((balance) => (
          <div key={balance.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="text-lg font-semibold text-white">{balance.name}</div>
                <div className="text-sm text-gray-400">
                  {balance.amount.toFixed(2)} {balance.currency}
                </div>
              </div>
              {balance.description && (
                <div className="text-sm text-gray-500 mt-1">{balance.description}</div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                Atualizado: {new Date(balance.updatedAt).toLocaleString()}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(balance)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Editar"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(balance.id)}
                className="p-2 text-red-400 hover:text-red-300 transition-colors"
                title="Remover"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      {balances.length > 0 && (
        <div className="mt-6 p-4 bg-custom-cyan/10 border border-custom-cyan/30 rounded-lg">
          <div className="text-lg font-semibold text-custom-cyan">
            Total: {totalBalance.toFixed(2)} USDT
          </div>
          <div className="text-sm text-gray-400">
            {balances.length} saldo{balances.length !== 1 ? 's' : ''} configurado{balances.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {balances.length === 0 && !showForm && (
        <div className="text-center py-8 text-gray-400">
          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum saldo manual configurado</p>
          <p className="text-sm">Adicione saldos para exibir no dashboard</p>
        </div>
      )}
    </div>
  );
} 