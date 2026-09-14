# Sistema de Gestão de Resíduos e Recicláveis — Município de Itaiópolis/SC ♻️📦

Aplicação web desenvolvida para a **Secretaria Municipal de Meio Ambiente de Itaiópolis/SC**, unificando a gestão de distribuição de sacos recicláveis para os munícipes e o controle operacional de saídas de materiais do **Ecoponto Municipal**.

---

## 🏛️ Módulos do Sistema

### 1. 🏠 Cadastro de Distribuição de Sacolas Recicláveis (`index.html`)
- **Página Principal:** Mantida para o atendimento contínuo a munícipes e comércios.
- **Formulário Dinâmico:** Validação de CPF/CNPJ, opção "sem documento", seleção rápida de 20 bairros mapeados e controle de número de moradores e sacolas.
- **Calendário de Coleta Seletiva:** Visualização dos dias e trajetos de recolhimento por bairro no mês atual.
- **Dashboard e Mapa:** Gráficos de distribuição por bairro e mapa com polígonos geoespaciais dos setores atendidos.
- **Integração:** Conectado à planilha Google via Google Apps Script (`apps_script.js`).

### 2. 📦 Ecoponto Municipal — Saídas de Materiais (`ecoponto.html`)
- **Página do Ecoponto:** Registro e controle das saídas/recolhimento de resíduos depositados no Ecoponto.
- **📅 Data da Saída:** Preenchimento automático com a data de hoje, atalhos "Hoje" / "Ontem" e calendário livre para registros retroativos.
- **🗑️ Categorias Pré-definidas:**
  - ♻️ **Recicláveis** (Papel, papelão, plásticos e metais)
  - 🔋 **Baterias e Pilhas** (Pilhas portáteis e baterias)
  - 💻 **Eletrônicos** (Computadores, TVs, cabos, placas)
  - 🍾 **Vidros** (Garrafas, frascos, potes e cacos)
  - 💡 **Lâmpadas** (Fluorescentes e LED)
- **⚖️ Peso Aproximado:** Entrada em kg com botões de acréscimo rápido (+5 kg, +10 kg, +25 kg, +50 kg, +100 kg, Zerar).
- **📊 Histórico Integrado:** Contém **127 registros históricos oficiais** importados da planilha de inauguração até Julho de 2026 (~7,22 toneladas), com filtros rápidos por material e exportação direta em CSV para o Excel.
- **Integração:** Backend Google Sheets preparado em `apps_script_ecoponto.js`.

---

## 📁 Estrutura Organizada do Projeto

```text
Site Cadastro Reciclaveis/
├── css/
│   ├── styles.css                  # Estilos globais e do módulo Sacos Recicláveis
│   └── ecoponto.css                # Estilos dedicados do módulo Ecoponto
│
├── js/
│   ├── app.js                      # Lógica do Cadastro de Sacolas, Calendário e Dashboard
│   └── ecoponto.js                 # Lógica do Ecoponto, indicadores e 127 registros históricos
│
├── img/
│   └── Brasao_itaiopolis.jpg       # Brasão oficial do Município de Itaiópolis
│
├── data/
│   ├── dados_ecoponto.json         # Base de dados estruturada das 127 saídas históricas
│   ├── Reciclaveis Meio Ambiente.xlsx # Planilha com dados históricos oficiais do Ecoponto
│   └── SacolasAmarelas .xlsx       # Planilha de referência de sacolas distribuídas
│
├── scripts_google/
│   ├── apps_script.js              # Script Google Apps Script para a aba de Sacolas
│   └── apps_script_ecoponto.js     # Script Google Apps Script para a aba de Ecoponto
│
├── backups/
│   ├── backup_projeto/             # Cópia de segurança dos arquivos originais
│   └── backup_projeto.zip          # Arquivo compactado de backup
│
├── index.html                      # Portal Principal Unificado (Sacos Recicláveis e Ecoponto)
├── ecoponto.html                   # Ponto de entrada secundário (redireciona para index.html#ecoponto)
├── README.md                       # Documentação técnica e operacional
└── .gitignore                      # Regras de exclusão do Git
```

---

## 🚀 Como Executar Localmente

1. Abra a pasta do projeto no seu editor (VS Code, etc.).
2. Inicie o **Live Server** ou abra diretamente o arquivo [`index.html`](file:///c:/Users/vck98/OneDrive/Área%20de%20Trabalho/DEV/Site%20Cadastro%20Reciclaveis/index.html) no navegador.
3. Para alternar entre os módulos:
   - Clique em **`📦 Ecoponto`** no cabeçalho para gerenciar as saídas do Ecoponto.
   - Clique em **`🏠 Voltar ao Cadastro de Sacolas`** para retornar à tela inicial.

---

## 🔒 Segurança e Controle de Versão

- O arquivo `.gitignore` protege pastas pesadas (`node_modules/`), backups e arquivos do sistema operacional contra inclusão acidental no Git.
- Todos os lançamentos do Ecoponto são persistidos localmente no navegador via `localStorage` e prontos para sincronização em nuvem.
