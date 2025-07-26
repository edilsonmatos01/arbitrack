import './globals.css'; // Assumindo que você terá um arquivo globals.css
import type { Metadata } from 'next'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Robô de Arbitragem',
  description: 'Dashboard do Robô de Arbitragem de Criptomoedas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Forçar cores corretas nos selects - versão agressiva
              function forceSelectColors() {
                const selects = document.querySelectorAll('select');
                selects.forEach(select => {
                  // Aplicar estilos CSS inline para sobrescrever tudo
                  select.style.setProperty('--webkit-appearance', 'none', 'important');
                  select.style.setProperty('--moz-appearance', 'none', 'important');
                  select.style.setProperty('appearance', 'none', 'important');
                  
                  const options = select.querySelectorAll('option');
                  options.forEach(option => {
                    // Aplicar estilos inline para cada opção
                    option.style.setProperty('background-color', '#1c2024', 'important');
                    option.style.setProperty('color', '#ffffff', 'important');
                    option.style.setProperty('border', 'none', 'important');
                    option.style.setProperty('outline', 'none', 'important');
                    
                    if (option.selected) {
                      option.style.setProperty('background-color', 'rgba(0, 196, 159, 0.2)', 'important');
                      option.style.setProperty('color', '#00C49F', 'important');
                    }
                  });
                  
                  // Adicionar event listeners para hover
                  select.addEventListener('mouseenter', function() {
                    const options = this.querySelectorAll('option');
                    options.forEach(option => {
                      option.addEventListener('mouseenter', function() {
                        this.style.setProperty('background-color', 'rgba(0, 196, 159, 0.1)', 'important');
                        this.style.setProperty('color', '#ffffff', 'important');
                      });
                      
                      option.addEventListener('mouseleave', function() {
                        if (this.selected) {
                          this.style.setProperty('background-color', 'rgba(0, 196, 159, 0.2)', 'important');
                          this.style.setProperty('color', '#00C49F', 'important');
                        } else {
                          this.style.setProperty('background-color', '#1c2024', 'important');
                          this.style.setProperty('color', '#ffffff', 'important');
                        }
                      });
                    });
                  });
                  
                  // Adicionar event listener para mudanças
                  select.addEventListener('change', function() {
                    const options = this.querySelectorAll('option');
                    options.forEach(option => {
                      if (option.selected) {
                        option.style.setProperty('background-color', 'rgba(0, 196, 159, 0.2)', 'important');
                        option.style.setProperty('color', '#00C49F', 'important');
                      } else {
                        option.style.setProperty('background-color', '#1c2024', 'important');
                        option.style.setProperty('color', '#ffffff', 'important');
                      }
                    });
                  });
                });
              }
              
              // Executar quando o DOM estiver pronto
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', forceSelectColors);
              } else {
                forceSelectColors();
              }
              
              // Executar também quando houver mudanças dinâmicas
              const observer = new MutationObserver(forceSelectColors);
              observer.observe(document.body, { childList: true, subtree: true });
              
              // Executar periodicamente para garantir que as cores sejam aplicadas
              setInterval(forceSelectColors, 1000);
            `,
          }}
        />
      </body>
    </html>
  );
} 