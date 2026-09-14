// ============================================================
// GOOGLE APPS SCRIPT - MÓDULO ECOPONTO MUNICIPAL (ITAIÓPOLIS/SC)
// Cole este código no Apps Script da sua planilha para receber
// os lançamentos de saídas de materiais do Ecoponto.
// ============================================================

// Nome da aba dedicada ao Ecoponto na sua planilha Google
const NOME_ABA_ECOPONTO = "Ecoponto"; 

function setupEcoponto() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(NOME_ABA_ECOPONTO);
  
  // Cria a aba caso ainda não exista
  if (!sheet) {
    sheet = ss.insertSheet(NOME_ABA_ECOPONTO);
  }
  
  // Cria o cabeçalho se a aba estiver vazia
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Data/Hora Registro", 
      "Data da Coleta/Saída", 
      "Tipo de Resíduo", 
      "Peso Aproximado (kg)", 
      "Destino / Receptor", 
      "Observações"
    ]);
  }
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(NOME_ABA_ECOPONTO);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Aba Ecoponto não encontrada.'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const lastRow = sheet.getLastRow();
  const totalRegistros = Math.max(0, lastRow - 1);
  let totalPesoKg = 0;
  let porTipo = {};

  if (lastRow > 1) {
    // Coluna B (Data Saída), Coluna C (Tipo), Coluna D (Peso)
    const range = sheet.getRange(2, 2, lastRow - 1, 3).getValues();
    for (let i = 0; i < range.length; i++) {
      const tipo = range[i][1] ? range[i][1].toString().trim() : "Recicláveis";
      const peso = parseFloat(range[i][2]) || 0;

      totalPesoKg += peso;
      porTipo[tipo] = (porTipo[tipo] || 0) + peso;
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    totalRegistros: totalRegistros,
    totalPesoKg: totalPesoKg,
    porTipo: porTipo
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return respondJSON('error', 'O sistema está ocupado. Tente novamente em alguns segundos.');
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(NOME_ABA_ECOPONTO);
    
    if (!sheet) {
      setupEcoponto();
      sheet = ss.getSheetByName(NOME_ABA_ECOPONTO);
    }

    if (!e || !e.parameter) {
      return respondJSON('error', 'Nenhum dado recebido.');
    }

    const action = e.parameter.action;

    if (action === 'saida_ecoponto' || action === 'coleta_ecoponto') {
      const dataColeta = e.parameter.dataColeta || '';
      const tipoResiduo = e.parameter.tipoResiduo || '';
      const peso = e.parameter.peso || '0';
      const destino = e.parameter.destino || 'Não especificado';
      const obs = e.parameter.obs || '';

      if (!dataColeta || !tipoResiduo || !peso) {
        return respondJSON('error', 'Campos obrigatórios ausentes.');
      }

      const dataAtual = new Date();
      const timestampRegistro = Utilities.formatDate(dataAtual, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");

      sheet.appendRow([
        timestampRegistro,
        dataColeta,
        tipoResiduo,
        Number(peso),
        destino,
        obs
      ]);

      return respondJSON('success', 'Saída do Ecoponto registrada com sucesso!');
    }

    return respondJSON('error', 'Ação desconhecida.');
  } catch (error) {
    return respondJSON('error', 'Erro no servidor: ' + error.toString());
  } finally {
    lock.releaseLock();
  }
}

function respondJSON(status, message) {
  return ContentService.createTextOutput(JSON.stringify({
    status: status,
    message: message
  })).setMimeType(ContentService.MimeType.JSON);
}
