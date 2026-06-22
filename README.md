# Sistema de Gestão de Cadastros - Distribuição de Sacos Recicláveis ♻️

Esta é uma aplicação web moderna e responsiva desenvolvida para o Município de Itaiópolis/SC, com o objetivo de registrar e gerenciar a distribuição contínua de sacos recicláveis para munícipes e estabelecimentos comerciais.

## 🚀 Funcionalidades

- **Cadastro Rápido e Intuitivo:** Formulário otimizado para o rápido registro de entregas.
- **Validação de Documentos:** Alternância inteligente entre CPF e CNPJ com máscaras e validação em tempo real.
- **Auto-seleção de Campos:** Campos numéricos selecionam automaticamente o valor padrão ao clique, agilizando a edição.
- **Dashboard em Tempo Real:** Indicadores que exibem a quantidade de pessoas atendidas e o volume total de unidades (sacolas) distribuídas (o backend contabiliza automaticamente a regra de negócio onde cada entrega equivale a 10 sacolas).
- **Integração Serverless:** O sistema se conecta diretamente ao **Google Apps Script**, utilizando uma planilha do Google Sheets como banco de dados de forma segura, rápida e sem custos de hospedagem de backend.
- **Design Premium (UI/UX):** Interface com estética *Glassmorphism*, gradientes suaves, responsividade total para dispositivos móveis (mobile-first) e micro-interações ao passar o mouse.

## 🛠️ Tecnologias Utilizadas

*   **Front-end:** HTML5 semântico, CSS3 (variáveis, flexbox, grid, animações) e Vanilla JavaScript (DOM manipulation, Fetch API).
*   **Back-end / Banco de Dados:** Google Apps Script e Google Sheets.
*   **Controle de Versão:** Git & GitHub.

## 📱 Responsividade

A interface foi cuidadosamente projetada para funcionar perfeitamente tanto em computadores desktop (telas grandes) quanto em celulares e tablets, reorganizando os "cards" de status e o formulário para garantir a melhor experiência do usuário independente do dispositivo.

## 💡 Como Usar (Para Desenvolvedores)

1. Clone o repositório.
2. Abra o arquivo `index.html` em qualquer navegador moderno.
3. Para configurar o backend, certifique-se de que a variável `SCRIPT_URL` no arquivo `app.js` aponta para o Web App gerado no seu Google Apps Script.

---
*Projeto desenvolvido para facilitar e otimizar processos manuais em planilhas, garantindo a integridade dos dados e uma melhor experiência visual.*
