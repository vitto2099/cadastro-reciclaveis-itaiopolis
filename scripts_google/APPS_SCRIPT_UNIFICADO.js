// ============================================================
// GOOGLE APPS SCRIPT - SISTEMA UNIFICADO DE MEIO AMBIENTE
// MUNICÍPIO DE ITAIÓPOLIS / SC
// 
// Este script atende os 2 módulos na mesma planilha:
// 1) Cadastro de Sacos Recicláveis (Aba: Sacolas ou Página1)
// 2) Saídas do Ecoponto Municipal (Aba: Ecoponto)
// ============================================================

const ABA_SACOS = "Sacolas";
const ABA_ECOPONTO = "Ecoponto";

/**
 * Localiza a aba de sacos recicláveis com tolerância a nomes comuns (Sacolas, Página1, etc.)
 */
function getSheetSacos(ss) {
  return ss.getSheetByName("Sacolas") ||
         ss.getSheetByName("sacolas") ||
         ss.getSheetByName("Página1") ||
         ss.getSheetByName("Pagina1") ||
         ss.getSheetByName(ABA_SACOS) ||
         ss.getSheets().find(s => s.getName() !== ABA_ECOPONTO) ||
         ss.getSheets()[0];
}

/**
 * Garante que as abas e cabeçalhos existam automaticamente
 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Aba dos Sacos Recicláveis
  let sheetSacos = getSheetSacos(ss);
  if (!sheetSacos) {
    sheetSacos = ss.insertSheet(ABA_SACOS);
  }
  if (sheetSacos.getLastRow() === 0) {
    sheetSacos.appendRow(["Data/Hora", "Nome", "CPF/CNPJ", "Endereço", "Bairro", "Moradores", "Sacolas"]);
  }

  // 2. Aba do Ecoponto
  let sheetEcoponto = ss.getSheetByName(ABA_ECOPONTO);
  if (!sheetEcoponto) {
    sheetEcoponto = ss.insertSheet(ABA_ECOPONTO);
  }
  if (sheetEcoponto.getLastRow() === 0) {
    sheetEcoponto.appendRow([
      "Data/Hora Registro", 
      "Data da Coleta/Saída", 
      "Tipo de Resíduo", 
      "Peso Aproximado (kg)", 
      "Destino / Receptor", 
      "Observações"
    ]);
  }
}

/**
 * Responde a requisições GET para alimentar indicadores e gráficos
 */
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'stats_sacos';

  // --- SE FOR CONSULTA DO ECOPONTO ---
  if (action === 'stats_ecoponto') {
    let sheet = ss.getSheetByName(ABA_ECOPONTO);
    if (!sheet) {
      setup();
      sheet = ss.getSheetByName(ABA_ECOPONTO);
    }
    const lastRow = sheet.getLastRow();
    const totalRegistros = Math.max(0, lastRow - 1);
    let totalPesoKg = 0;
    let porTipo = {};

    if (lastRow > 1) {
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

  // --- CONSULTA PADRÃO: SACOS RECICLÁVEIS ---
  let sheetSacos = getSheetSacos(ss);
  if (!sheetSacos) {
    setup();
    sheetSacos = getSheetSacos(ss);
  }
  const lastRow = sheetSacos.getLastRow();
  const total = Math.max(0, lastRow - 1);

  let totalSacolas = 0;
  let totalPessoas = 0;
  let bairrosData = {};

  if (lastRow > 1) {
    const dataRange = sheetSacos.getRange(2, 5, lastRow - 1, 3).getValues();
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

/**
 * Responde a requisições POST para gravar dados na planilha
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return respondJSON('error', 'O sistema está ocupado. Tente novamente em instantes.');
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (!e || !e.parameter) {
      return respondJSON('error', 'Nenhum dado recebido.');
    }

    const action = e.parameter.action;

    // -------------------------------------------------------------
    // 1. GRAVAÇÃO DE SACOS RECICLÁVEIS
    // -------------------------------------------------------------
    if (action === 'cadastrar') {
      let sheet = getSheetSacos(ss);
      if (!sheet || sheet.getLastRow() === 0) {
        setup();
        sheet = getSheetSacos(ss);
      }

      const nome = e.parameter.nome;
      const cpf = e.parameter.cpf || 'Não informado';
      const endereco = e.parameter.endereco;
      const bairro = e.parameter.bairro || 'Não informado';
      const moradores = e.parameter.moradores || '1';
      const sacolas = e.parameter.sacolas || '1';

      if (!nome || !endereco) {
        return respondJSON('error', 'Nome e endereço são obrigatórios.');
      }

      const dataAtual = new Date();
      const dataFormatada = Utilities.formatDate(dataAtual, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");

      sheet.appendRow([dataFormatada, nome, cpf, endereco, bairro, moradores, sacolas]);
      return respondJSON('success', 'Cadastro de sacos recicláveis realizado com sucesso!');
    }

    // -------------------------------------------------------------
    // 2. GRAVAÇÃO DE SAÍDAS DO ECOPONTO
    // -------------------------------------------------------------
    if (action === 'saida_ecoponto' || action === 'coleta_ecoponto') {
      let sheet = ss.getSheetByName(ABA_ECOPONTO);
      if (!sheet || sheet.getLastRow() === 0) {
        setup();
        sheet = ss.getSheetByName(ABA_ECOPONTO);
      }

      const dataColeta = e.parameter.dataColeta || '';
      const tipoResiduo = e.parameter.tipoResiduo || '';
      const peso = e.parameter.peso || '0';
      const destino = e.parameter.destino || 'Não especificado';
      const obs = e.parameter.obs || '';

      if (!dataColeta || !tipoResiduo || !peso) {
        return respondJSON('error', 'Campos obrigatórios ausentes para saída do Ecoponto.');
      }

      const dataAtual = new Date();
      const dataHoraRegistro = Utilities.formatDate(dataAtual, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");

      sheet.appendRow([
        dataHoraRegistro,
        dataColeta,
        tipoResiduo,
        Number(peso),
        destino,
        obs
      ]);

      return respondJSON('success', 'Saída do Ecoponto registrada com sucesso na planilha!');
    }

    return respondJSON('error', 'Ação não reconhecida: ' + action);

  } catch (error) {
    return respondJSON('error', 'Erro interno no servidor: ' + error.toString());
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
