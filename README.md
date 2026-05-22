# Sistema de Cadastro de Sacos de Lixo Recicláveis - Itaiópolis

Este projeto é um sistema web desenvolvido para a Secretaria de Meio Ambiente de Itaiópolis, focado no controle e distribuição de sacos de lixo recicláveis para os munícipes.

## 🛠️ Como Funciona a Estrutura

O sistema é dividido em duas partes:
1. **Frontend (Site):** Interface visual (HTML, CSS, JS) onde os dados são digitados. Pode ser hospedada no Vercel.
2. **Backend (Banco de Dados):** Uma planilha do Google Sheets que recebe, checa e guarda os dados através do Google Apps Script.

## 🔒 Como Funciona o Acesso (Segurança)

Como o sistema vai ser hospedado na internet, mas **só 5 funcionários da secretaria** devem fazer os cadastros, nós implementamos um sistema de acesso duplo para não dar dor de cabeça:

### 1. Acesso ao Site (Para a sua Equipe)
Quando você jogar este projeto no Vercel, o Vercel vai gerar um link (ex: `https://seu-site.vercel.app`). 
Você vai pegar esse link e mandar apenas para os seus 4 colegas de trabalho.

Sempre que qualquer um abrir esse link, vai dar de cara com uma tela verde bloqueada pedindo uma senha.
- **A Senha Única é:** `meioambiente2024`

Ninguém mais da cidade vai conseguir passar dessa tela se achar o link. Uma vez que o funcionário digitar a senha, o formulário de cadastro abre e ele pode fazer quantos cadastros quiser no dia.

*(Para alterar a senha no futuro, basta abrir o arquivo `app.js` e alterar a palavra `meioambiente2024` na linha 16).*

### 2. Acesso à Planilha (Para a sua Equipe)
O site faz todo o trabalho "braçal": quando o funcionário preenche o site, o site joga os dados direto para a sua Planilha do Google, usando a permissão master que configuramos no *Apps Script* (Executar como: Eu).

Se você ou seus colegas precisarem ver a tabela de moradores, tirar relatórios ou ver quantas pessoas cadastraram:
1. Basta acessar o Google Sheets normalmente.
2. Você (o dono da planilha) deve clicar no botão verde **"Compartilhar"** lá em cima na direita e colocar o email do Google dos seus 4 colegas.
3. Pronto! Eles acessam o site pelo Vercel (com a senha) para cadastrar, e acessam o Google Sheets com o próprio email para olhar e exportar a tabela pronta.

## 🚀 Próximos Passos (Integração)

Para que tudo isso funcione na prática, ainda falta um último passo que depende da planilha original:
1. Concluir a implantação do Apps Script na planilha com a opção "Executar como: Eu" e "Acesso: Qualquer Pessoa".
2. Pegar a URL que o Google gerar e colar no arquivo `app.js` na variável `SCRIPT_URL` (logo na linha 2 do arquivo).
3. Após isso, basta subir a pasta toda para o Vercel e o sistema estará online e protegido!
