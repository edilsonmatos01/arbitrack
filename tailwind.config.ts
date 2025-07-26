import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.tsx', // Mais específico para TSX na pasta app
    './components/**/*.tsx', // Mais específico para TSX na pasta components
    // Adicione outros caminhos se tiver componentes/páginas em outros lugares
  ],
  theme: {
    extend: {
      colors: {
        // Cores personalizadas baseadas na sua imagem de design
        'custom-cyan': '#00C49F', // Cor de destaque principal (verde/ciano)
        'dark-bg': '#1c2024',     // Fundo geral bem escuro (nova cor)
        'dark-card': '#1c2024',   // Fundo para cards e sidebar (nova cor)
        'accent-orange': '#FF6B35', // Cor de destaque para dados (substituindo laranja)
        'accent-amber': '#FFA726',  // Cor secundária para elementos
      },
      // Você pode estender outras propriedades do tema aqui
      // fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [
    // Adicione plugins do Tailwind aqui, se estiver usando algum
    // Exemplo: require('@tailwindcss/forms'),
  ],
};
export default config; 