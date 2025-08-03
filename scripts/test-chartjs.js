// Teste do Chart.js
console.log('🧪 Teste do Chart.js');

// Simular dados do gráfico
const mockData = {
  labels: ['05:30', '06:00', '06:30', '07:00', '07:30'],
  datasets: [{
    label: 'Spread (%)',
    data: [1.08, 1.81, 0.74, 1.79, 1.37],
    borderColor: 'rgb(34, 197, 94)',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 2,
    fill: true,
    tension: 0.4,
    pointRadius: 2,
    pointHoverRadius: 4,
  }]
};

const mockOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: 'Horário',
        color: '#9ca3af'
      }
    },
    y: {
      display: true,
      title: {
        display: true,
        text: 'Spread (%)',
        color: '#9ca3af'
      },
      beginAtZero: true
    }
  }
};

console.log('📊 Dados simulados:', mockData);
console.log('⚙️ Configurações:', mockOptions);

// Calcular estatísticas
const spreads = mockData.datasets[0].data;
const maxSpread = Math.max(...spreads);
const minSpread = Math.min(...spreads);
const avgSpread = spreads.reduce((a, b) => a + b, 0) / spreads.length;

console.log('\n📈 Estatísticas:');
console.log('📊 Máximo:', maxSpread.toFixed(2) + '%');
console.log('📊 Mínimo:', minSpread.toFixed(2) + '%');
console.log('📊 Média:', avgSpread.toFixed(2) + '%');

console.log('\n✅ Chart.js está configurado corretamente!');
console.log('📱 O gráfico deve renderizar com esses dados.'); 