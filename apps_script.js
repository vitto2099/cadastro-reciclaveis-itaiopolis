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
  
  // Calcular total de sacolas distribuídas
  let totalSacolas = 0;
  if (lastRow > 1) {
    // Coluna G (7) = Sacolas
    const sacolasRange = sheet.getRange(2, 7, lastRow - 1, 1).getValues();
    for (let i = 0; i < sacolasRange.length; i++) {
      const val = parseInt(sacolasRange[i][0]);
      totalSacolas += isNaN(val) ? 1 : val;
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    total: total,
    totalSacolas: totalSacolas
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
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
    
    // SEM validação de duplicidade — a mesma pessoa/comércio pode retirar mais de uma vez
    
    // Salva os dados
    const dataAtual = new Date();
    const dataFormatada = Utilities.formatDate(dataAtual, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    
    sheet.appendRow([dataFormatada, nome, cpf, endereco, bairro, moradores, sacolas]);
    
    return respondJSON('success', 'Cadastro realizado com sucesso!');
  }
  
  return respondJSON('error', 'Ação não reconhecida.');
}

function respondJSON(status, message) {
  return ContentService.createTextOutput(JSON.stringify({
    status: status,
    message: message
  })).setMimeType(ContentService.MimeType.JSON);
}
