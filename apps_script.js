// ============================================================
// COLE ESTE CÓDIGO NO GOOGLE APPS SCRIPT DA SUA PLANILHA
// (Substitua todo o código anterior por este)
// ============================================================

// Nome da aba da sua planilha (normalmente "Página1" ou "Sheet1")
const NOME_ABA = "Página1"; 

function setup() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOME_ABA);
  if (sheet.getLastRow() === 0) {
    // Cria o cabeçalho com as novas colunas
    sheet.appendRow(["Data/Hora", "Nome", "CPF/CNPJ", "Endereço", "Bairro", "Moradores", "Sacolas"]);
  }
}

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOME_ABA);
  const lastRow = sheet.getLastRow();
  const total = Math.max(0, lastRow - 1);
  
  // Calcular total de sacolas distribuídas e pessoas atendidas e bairros
  let totalSacolas = 0;
  let totalPessoas = 0;
  let bairrosData = {};
  
  if (lastRow > 1) {
    // Coluna E (5) = Bairro, Coluna F (6) = Moradores, Coluna G (7) = Sacolas
    const dataRange = sheet.getRange(2, 5, lastRow - 1, 3).getValues();
    for (let i = 0; i < dataRange.length; i++) {
      const bairro = dataRange[i][0] ? dataRange[i][0].toString().trim() : "Não informado";
      const moradores = parseInt(dataRange[i][1]);
      const sacolas = parseInt(dataRange[i][2]);
      
      const m = isNaN(moradores) ? 0 : moradores;
      const s = isNaN(sacolas) ? 1 : sacolas;
      
      totalPessoas += m;
      totalSacolas += s;
      
      if (!bairrosData[bairro]) {
        bairrosData[bairro] = { registros: 0, pessoas: 0, sacolas: 0 };
      }
      bairrosData[bairro].registros++;
      bairrosData[bairro].pessoas += m;
      bairrosData[bairro].sacolas += s;
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    total: total,
    totalSacolas: totalSacolas,
    totalPessoas: totalPessoas,
    bairrosDist: bairrosData
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  // Aguarda até 10 segundos para outro processo terminar
  try {
    lock.waitLock(10000);
  } catch (err) {
    return respondJSON('error', 'O sistema está muito ocupado. Tente novamente em instantes.');
  }

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOME_ABA);
    
    // Garantir cabeçalho
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Data/Hora", "Nome", "CPF/CNPJ", "Endereço", "Bairro", "Moradores", "Sacolas"]);
    }

    // Se não houver parâmetros (pode ocorrer em acessos indevidos)
    if (!e || !e.parameter) {
      return respondJSON('error', 'Nenhum dado recebido.');
    }

    const action = e.parameter.action;
    
    if (action === 'cadastrar') {
      const nome = e.parameter.nome;
      const tipoDocumento = e.parameter.tipoDocumento || 'CPF';
      const cpf = e.parameter.cpf;
      const endereco = e.parameter.endereco;
      const bairro = e.parameter.bairro || '';
      const moradores = e.parameter.moradores;
      const sacolas = e.parameter.sacolas || '1';
      
      // Validação básica de segurança
      if (!nome || !endereco || !moradores) {
        return respondJSON('error', 'Dados obrigatórios ausentes. Verifique o preenchimento.');
      }
      
      // SEM validação de duplicidade — a mesma pessoa/comércio pode retirar mais de uma vez
      
      // Salva os dados
      const dataAtual = new Date();
      const dataFormatada = Utilities.formatDate(dataAtual, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
      
      sheet.appendRow([dataFormatada, nome, cpf, endereco, bairro, moradores, sacolas]);
      
      return respondJSON('success', 'Cadastro realizado com sucesso!');
    }
    
    return respondJSON('error', 'Ação não reconhecida.');
  } catch(error) {
    return respondJSON('error', 'Erro interno no servidor: ' + error.toString());
  } finally {
    // Libera o lock para o próximo usuário
    lock.releaseLock();
  }
}

function respondJSON(status, message) {
  return ContentService.createTextOutput(JSON.stringify({
    status: status,
    message: message
  })).setMimeType(ContentService.MimeType.JSON);
}
