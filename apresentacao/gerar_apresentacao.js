const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');

// Carregar dados reais do projeto
const ecoData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'dados_ecoponto.json'), 'utf8'));
const sacData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'dados_sacolas.json'), 'utf8'));
const brasaoPath = path.join(__dirname, '..', 'img', 'Brasao_itaiopolis.jpg');

// --- PROCESSAMENTO DE DADOS ---
const ecoTotalKg = ecoData.reduce((acc, r) => acc + Number(r.peso), 0);
const ecoTotalTon = (ecoTotalKg / 1000).toFixed(2).replace('.', ',');

const byCat = { 'Recicláveis': 0, 'Vidros': 0, 'Eletrônicos': 0, 'Lâmpadas': 0, 'Baterias e Pilhas': 0 };
const byDest = { 'Camarita': 0, 'APAE': 0, 'IMA': 0 };
const byMonth = {};

ecoData.forEach(r => {
  const p = Number(r.peso) || 0;
  if (byCat[r.tipoResiduo] !== undefined) byCat[r.tipoResiduo] += p;
  if (byDest[r.destino] !== undefined) byDest[r.destino] += p;
  const m = r.dataColeta.slice(0, 7);
  if (!byMonth[m]) byMonth[m] = { rec: 0, vid: 0, esp: 0, total: 0 };
  byMonth[m].total += p;
  if (r.tipoResiduo === 'Recicláveis') byMonth[m].rec += p;
  else if (r.tipoResiduo === 'Vidros') byMonth[m].vid += p;
  else byMonth[m].esp += p;
});

const monthsSorted = Object.keys(byMonth).sort();
const monthLabelsMap = {
  '2026-02': 'Fev', '2026-03': 'Mar', '2026-04': 'Abr', '2026-05': 'Mai',
  '2026-06': 'Jun', '2026-07': 'Jul', '2026-08': 'Ago', '2026-09': 'Set',
  '2026-10': 'Out', '2026-11': 'Nov*'
};

function calcWeekdayStats(list, include18Nov = false, excludeMirim = false) {
  const mirimDates = new Set(
    list.filter(i => i.obs && i.obs.toLowerCase().includes('vereadores mirins')).map(i => i.dataColeta)
  );
  const filtered = excludeMirim ? list.filter(i => !mirimDates.has(i.dataColeta)) : list;

  const daily = new Map();
  filtered.forEach(item => {
    const d = item.dataColeta;
    if (!daily.has(d)) {
      const [y, m, dia] = d.split('-').map(Number);
      daily.set(d, { dow: new Date(y, m - 1, dia).getDay(), rec: 0, total: 0 });
    }
    const e = daily.get(d);
    e.total += Number(item.peso) || 0;
    if (item.tipoResiduo === 'Recicláveis') e.rec += Number(item.peso) || 0;
  });

  if (include18Nov && !daily.has('2026-11-18')) {
    daily.set('2026-11-18', { dow: 3, rec: 400, total: 400 });
  }

  const stats = Array.from({ length: 7 }, () => ({ days: 0, rec: 0, total: 0 }));
  for (const v of daily.values()) {
    stats[v.dow].days++;
    stats[v.dow].rec += v.rec;
    stats[v.dow].total += v.total;
  }
  return stats;
}

const wkConsolidado = calcWeekdayStats(ecoData, false, false);
const wkProj18 = calcWeekdayStats(ecoData, true, false);
const wkRotina = calcWeekdayStats(ecoData, false, true);

const topBairros = Object.entries(sacData.bairrosDist)
  .filter(([nome]) => nome !== 'Não informado')
  .map(([nome, v]) => ({ nome, ...v }))
  .sort((a, b) => b.sacolas - a.sacolas)
  .slice(0, 7);

// --- IDENTIDADE VISUAL EXATA DO SITE ---
const pres = new PptxGenJS();
pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in
pres.author = 'Secretaria Municipal de Meio Ambiente — Itaiópolis/SC';
pres.title = 'Sistema de Gestão de Resíduos e Recicláveis — Itaiópolis/SC';

const C = {
  navy: '1A365D',       // --primary-color do site
  navyHover: '2A4365',  // --primary-hover
  navyLight: 'EBF8FF',  // --primary-light
  gold: 'D69E2E',       // --accent-color do site
  goldLight: 'FFFBEB',
  emerald: '059669',    // Destaque do módulo Ecoponto
  emeraldLight: 'ECFDF5',
  blue: '2563EB',       // CONAMA Recicláveis
  vidro: '10B981',      // CONAMA Vidros
  eletr: 'EF4444',      // CONAMA Eletrônicos
  lamp: 'EAB308',       // CONAMA Lâmpadas
  pilha: 'F97316',      // CONAMA Pilhas
  bg: 'F0F4F8',         // --bg-gradient base do site
  white: 'FFFFFF',
  textMain: '2D3748',   // --text-main do site
  textMuted: '718096',  // --text-muted do site
  border: 'E2E8F0',     // --border-color do site
  slateSubtle: 'F8FAFC'
};

const FONT = 'Segoe UI';

// Cabeçalho idêntico ao .header do site
function addSiteHeader(slide, slideTitle, slideSubtitle, activeModule, pageNum) {
  // Barra branca superior (.header)
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 13.333, h: 0.92,
    fill: { color: C.white },
    line: { color: C.border, width: 1 }
  });
  // Linha de acento institucional discreta no topo
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 13.333, h: 0.05,
    fill: { color: activeModule === 'ecoponto' ? C.emerald : C.navy }
  });

  // Brasão no header
  if (fs.existsSync(brasaoPath)) {
    slide.addImage({ path: brasaoPath, x: 0.5, y: 0.14, w: 0.62, h: 0.62 });
  }

  // Título e Subtítulo do Header
  slide.addText(slideTitle.toUpperCase(), {
    x: 1.25, y: 0.16, w: 7.4, h: 0.34,
    fontSize: 15, bold: true, color: C.textMain, fontFace: FONT
  });
  slide.addText(slideSubtitle, {
    x: 1.25, y: 0.49, w: 7.4, h: 0.28,
    fontSize: 10.5, color: C.textMuted, fontFace: FONT
  });

  // Seletor de módulo estilo .nav-page-switcher do site
  slide.addShape(pres.ShapeType.roundRect, {
    x: 8.85, y: 0.23, w: 3.95, h: 0.46, rectRadius: 0.08,
    fill: { color: C.slateSubtle }, line: { color: C.border, width: 1 }
  });

  const isSacos = activeModule === 'sacos';
  const isEco = activeModule === 'ecoponto';

  // Pill Sacos Recicláveis
  slide.addShape(pres.ShapeType.roundRect, {
    x: 8.92, y: 0.28, w: 1.95, h: 0.36, rectRadius: 0.06,
    fill: { color: isSacos ? C.navy : C.slateSubtle }
  });
  slide.addText('Sacos Recicláveis', {
    x: 8.92, y: 0.28, w: 1.95, h: 0.36, align: 'center', valign: 'middle',
    fontSize: 10, bold: true, color: isSacos ? C.white : C.textMuted, fontFace: FONT
  });

  // Pill Ecoponto
  slide.addShape(pres.ShapeType.roundRect, {
    x: 10.92, y: 0.28, w: 1.8, h: 0.36, rectRadius: 0.06,
    fill: { color: isEco ? C.emerald : C.slateSubtle }
  });
  slide.addText('Ecoponto', {
    x: 10.92, y: 0.28, w: 1.8, h: 0.36, align: 'center', valign: 'middle',
    fontSize: 10, bold: true, color: isEco ? C.white : C.textMuted, fontFace: FONT
  });

  // Rodapé institucional igual ao footer.js
  slide.addShape(pres.ShapeType.line, {
    x: 0.5, y: 7.05, w: 12.33, h: 0, line: { color: C.border, width: 0.8 }
  });
  slide.addText('Município de Itaiópolis / SC — Secretaria Municipal de Meio Ambiente • Dados consolidados até 16/11/2026', {
    x: 0.5, y: 7.1, w: 10.8, h: 0.28,
    fontSize: 9.5, color: C.textMuted, fontFace: FONT
  });
  slide.addText(`Página ${pageNum} de 8`, {
    x: 11.4, y: 7.1, w: 1.43, h: 0.28, align: 'right',
    fontSize: 9.5, bold: true, color: C.navy, fontFace: FONT
  });
}

// Card estilo .stat-card / .card do site
function addStatCard(slide, x, y, w, h, label, value, sub, valueColor) {
  slide.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.08,
    fill: { color: C.white },
    line: { color: C.border, width: 1 }
  });
  slide.addText(value, {
    x: x + 0.2, y: y + 0.16, w: w - 0.4, h: 0.44,
    fontSize: 23, bold: true, color: valueColor, fontFace: FONT
  });
  slide.addText(label.toUpperCase(), {
    x: x + 0.2, y: y + 0.62, w: w - 0.4, h: 0.26,
    fontSize: 9.5, bold: true, color: C.textMuted, fontFace: FONT
  });
  slide.addText(sub, {
    x: x + 0.2, y: y + 0.88, w: w - 0.4, h: 0.24,
    fontSize: 9.5, color: C.textMain, fontFace: FONT
  });
}

// Card com lista em bullet points (estilo .card do site)
function addContentCard(slide, x, y, w, h, title, bullets, headerColor = C.navy) {
  slide.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.08,
    fill: { color: C.white },
    line: { color: C.border, width: 1 }
  });
  // Faixa fina esquerda ou título com linha inferior igual .card-header
  slide.addText(title, {
    x: x + 0.25, y: y + 0.18, w: w - 0.5, h: 0.34,
    fontSize: 13.5, bold: true, color: headerColor, fontFace: FONT
  });
  slide.addShape(pres.ShapeType.line, {
    x: x + 0.25, y: y + 0.56, w: w - 0.5, h: 0,
    line: { color: C.border, width: 0.8 }
  });

  const bulletRuns = bullets.map(b => {
    const colonIdx = b.indexOf(':');
    if (colonIdx > 0 && colonIdx < 42) {
      return [
        { text: b.slice(0, colonIdx + 1), options: { bold: true, color: C.textMain, bullet: { indent: 14 } } },
        { text: b.slice(colonIdx + 1), options: { bold: false, color: C.textMain, paraSpaceAfter: 9, breakLine: true } }
      ];
    }
    return [{ text: b, options: { bullet: { indent: 14 }, paraSpaceAfter: 9, breakLine: true } }];
  }).flat();

  slide.addText(bulletRuns, {
    x: x + 0.25, y: y + 0.72, w: w - 0.5, h: h - 0.9,
    fontSize: 11.2, color: C.textMain, fontFace: FONT, valign: 'top'
  });
}

// =========================================================================
// SLIDE 1 — CAPA COM O VISUAL DO PORTAL
// =========================================================================
{
  const s1 = pres.addSlide();
  s1.background = { color: C.bg };

  // Barra superior branca do site
  s1.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 13.333, h: 1.05,
    fill: { color: C.white }, line: { color: C.border, width: 1 }
  });
  s1.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.06, fill: { color: C.navy } });

  if (fs.existsSync(brasaoPath)) {
    s1.addImage({ path: brasaoPath, x: 0.65, y: 0.16, w: 0.74, h: 0.74 });
  }
  s1.addText('SISTEMA DE GESTÃO DE RESÍDUOS E RECICLÁVEIS', {
    x: 1.55, y: 0.22, w: 8.5, h: 0.36,
    fontSize: 16, bold: true, color: C.navy, fontFace: FONT
  });
  s1.addText('MUNICÍPIO DE ITAIÓPOLIS / SC • SECRETARIA MUNICIPAL DE MEIO AMBIENTE', {
    x: 1.55, y: 0.58, w: 8.5, h: 0.28,
    fontSize: 10.5, bold: true, color: C.textMuted, fontFace: FONT
  });

  // Card central principal estilo portal web
  s1.addShape(pres.ShapeType.roundRect, {
    x: 0.65, y: 1.55, w: 12.03, h: 4.55, rectRadius: 0.1,
    fill: { color: C.white }, line: { color: C.border, width: 1.2 }
  });
  // Acento lateral azul-marinho e dourado
  s1.addShape(pres.ShapeType.rect, { x: 0.65, y: 1.55, w: 0.12, h: 4.55, fill: { color: C.navy } });
  s1.addShape(pres.ShapeType.rect, { x: 0.77, y: 1.55, w: 0.05, h: 4.55, fill: { color: C.gold } });

  s1.addShape(pres.ShapeType.roundRect, {
    x: 1.25, y: 1.98, w: 3.35, h: 0.36, rectRadius: 0.06,
    fill: { color: C.navyLight }
  });
  s1.addText('RELATÓRIO OPERACIONAL 2026', {
    x: 1.25, y: 1.98, w: 3.35, h: 0.36, align: 'center', valign: 'middle',
    fontSize: 10.5, bold: true, color: C.navy, fontFace: FONT
  });

  s1.addText('Balanço do Ecoponto Municipal\ne Distribuição de Sacolas Recicláveis', {
    x: 1.25, y: 2.55, w: 10.8, h: 1.55,
    fontSize: 34, bold: true, color: C.navy, fontFace: FONT
  });

  s1.addText('Consolidado de saídas por categoria, destinos receptores, médias por dia da semana,\nimpacto dos eventos dos Vereadores Mirins e cobertura da coleta seletiva por bairro.', {
    x: 1.25, y: 4.2, w: 10.6, h: 0.85,
    fontSize: 14.5, color: C.textMuted, fontFace: FONT
  });

  // 2 Badges dos módulos na base do card
  s1.addShape(pres.ShapeType.roundRect, {
    x: 1.25, y: 5.25, w: 3.1, h: 0.45, rectRadius: 0.06,
    fill: { color: C.emeraldLight }, line: { color: C.emerald, width: 1 }
  });
  s1.addText(`Ecoponto: ${ecoTotalTon} t (${ecoData.length} saídas)`, {
    x: 1.25, y: 5.25, w: 3.1, h: 0.45, align: 'center', valign: 'middle',
    fontSize: 11, bold: true, color: C.emerald, fontFace: FONT
  });

  s1.addShape(pres.ShapeType.roundRect, {
    x: 4.55, y: 5.25, w: 3.35, h: 0.45, rectRadius: 0.06,
    fill: { color: C.goldLight }, line: { color: C.gold, width: 1 }
  });
  s1.addText(`Sacolas Amarelas: ${sacData.totalSacolas} entregues`, {
    x: 4.55, y: 5.25, w: 3.35, h: 0.45, align: 'center', valign: 'middle',
    fontSize: 11, bold: true, color: C.navy, fontFace: FONT
  });

  s1.addShape(pres.ShapeType.roundRect, {
    x: 8.1, y: 5.25, w: 3.3, h: 0.45, rectRadius: 0.06,
    fill: { color: C.slateSubtle }, line: { color: C.border, width: 1 }
  });
  s1.addText('Base: 18/02 a 16/11/2026', {
    x: 8.1, y: 5.25, w: 3.3, h: 0.45, align: 'center', valign: 'middle',
    fontSize: 11, bold: true, color: C.textMain, fontFace: FONT
  });

  // Rodapé da capa
  s1.addText('Portal de Gestão Ambiental — Prefeitura Municipal de Itaiópolis / SC', {
    x: 0.65, y: 6.65, w: 12.0, h: 0.35, align: 'center',
    fontSize: 10.5, color: C.textMuted, fontFace: FONT
  });
}

// =========================================================================
// SLIDE 2 — VISÃO GERAL E INDICADORES DO PORTAL
// =========================================================================
{
  const s2 = pres.addSlide();
  s2.background = { color: C.bg };
  addSiteHeader(s2, 'Visão Geral do Sistema', 'Indicadores consolidados do Ecoponto Municipal e da Distribuição de Sacolas', 'sacos', 2);

  s2.addText('MÓDULO ECOPONTO MUNICIPAL (18/02 A 16/11/2026)', {
    x: 0.5, y: 1.12, w: 12.0, h: 0.28, fontSize: 10.5, bold: true, color: C.emerald, fontFace: FONT
  });
  addStatCard(s2, 0.5, 1.44, 2.93, 1.22, 'Total Recolhido', `${ecoTotalTon} t`, `${ecoTotalKg.toLocaleString('pt-BR')} kg destinados`, C.emerald);
  addStatCard(s2, 3.63, 1.44, 2.93, 1.22, 'Saídas Registradas', `${ecoData.length}`, 'Em 106 dias úteis de operação', C.navy);
  addStatCard(s2, 6.76, 1.44, 2.93, 1.22, 'Recicláveis Secos', `${byCat['Recicláveis'].toLocaleString('pt-BR')} kg`, '43,8% do volume total', C.blue);
  addStatCard(s2, 9.89, 1.44, 2.94, 1.22, 'Vidros Recolhidos', `${byCat['Vidros'].toLocaleString('pt-BR')} kg`, '42,0% do volume total', C.vidro);

  s2.addText('MÓDULO SACOLAS RECICLÁVEIS (COLETA SELETIVA)', {
    x: 0.5, y: 2.86, w: 12.0, h: 0.28, fontSize: 10.5, bold: true, color: C.navy, fontFace: FONT
  });
  addStatCard(s2, 0.5, 3.18, 2.93, 1.22, 'Sacolas Distribuídas', `${sacData.totalSacolas}`, 'Entregas em residências e comércios', C.gold);
  addStatCard(s2, 3.63, 3.18, 2.93, 1.22, 'Cadastros Realizados', `${sacData.total}`, 'Registros validados no portal', C.navy);
  addStatCard(s2, 6.76, 3.18, 2.93, 1.22, 'Moradores Alcançados', `${sacData.totalPessoas.toLocaleString('pt-BR')}`, 'Pessoas beneficiadas diretamente', C.emerald);
  addStatCard(s2, 9.89, 3.18, 2.94, 1.22, 'Bairros e Localidades', `${Object.keys(sacData.bairrosDist).length}`, 'Área urbana e interior atendidos', C.blue);

  addContentCard(s2, 0.5, 4.62, 12.33, 2.25, 'Resumo Executivo da Operação', [
    'Desvio de Aterro: 14,32 toneladas de materiais recicláveis e especiais foram corretamente destinadas até 16/11/2026.',
    'Materiais Predominantes: Recicláveis (6.265 kg) e Vidros (6.015 kg) somam 85,8% de toda a movimentação do Ecoponto.',
    'Adesão Comunitária: 572 cadastros ativos de coleta seletiva, alcançando 2.471 moradores em 36 localidades do município.',
    'Calendário em Dias Úteis: 100% das coletas operam de segunda a sexta-feira, com remanejamento automático em feriados.'
  ], C.navy);
}

// =========================================================================
// SLIDE 3 — COMPOSIÇÃO POR CATEGORIA (CORES CONAMA DO SITE)
// =========================================================================
{
  const s3 = pres.addSlide();
  s3.background = { color: C.bg };
  addSiteHeader(s3, 'Ecoponto — Distribuição por Categoria', 'Classificação oficial dos 14.318 kg conforme padrão CONAMA adotado no portal', 'ecoponto', 3);

  s3.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 1.18, w: 6.2, h: 5.65, rectRadius: 0.08,
    fill: { color: C.white }, line: { color: C.border, width: 1 }
  });
  s3.addText('Participação por Tipo de Resíduo (%)', {
    x: 0.75, y: 1.36, w: 5.7, h: 0.34, fontSize: 13.5, bold: true, color: C.navy, fontFace: FONT
  });
  s3.addChart(pres.ChartType.doughnut, [{
    name: 'Peso (kg)',
    labels: ['Recicláveis', 'Vidros', 'Eletrônicos', 'Lâmpadas', 'Baterias e Pilhas'],
    values: [byCat['Recicláveis'], byCat['Vidros'], byCat['Eletrônicos'], byCat['Lâmpadas'], byCat['Baterias e Pilhas']]
  }], {
    x: 0.7, y: 1.78, w: 5.8, h: 4.85,
    showLegend: true, legendPos: 'b',
    showPercent: true, showValue: false,
    dataLabelColor: 'FFFFFF', dataLabelFontBold: true, dataLabelFontSize: 11,
    chartColors: [C.blue, C.vidro, C.eletr, C.lamp, C.pilha],
    holeSize: 55
  });

  addContentCard(s3, 6.95, 1.18, 5.88, 5.65, 'Detalhamento por Categoria de Resíduo', [
    'Recicláveis (6.265 kg — 43,8%): Papel, papelão, plásticos e metais; volume ampliado em outubro e novembro com os eventos dos Vereadores Mirins.',
    'Vidros (6.015 kg — 42,0%): Garrafas, frascos e cacos com saída regular de 75 a 95 kg por viagem.',
    'Eletrônicos (1.461 kg — 10,2%): Computadores, TVs, cabos e placas recolhidos em campanhas periódicas.',
    'Lâmpadas (353 kg — 2,5%): Unidades fluorescentes e LED segregadas para destinação técnica segura.',
    'Baterias e Pilhas (224 kg — 1,6%): Resíduos perigosos retirados do descarte comum para proteção ambiental.'
  ], C.emerald);
}

// =========================================================================
// SLIDE 4 — DESTINOS RECEPTORES
// =========================================================================
{
  const s4 = pres.addSlide();
  s4.background = { color: C.bg };
  addSiteHeader(s4, 'Ecoponto — Destinação Final', 'Volume encaminhado por entidade receptora parceira do Município', 'ecoponto', 4);

  s4.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 1.18, w: 6.4, h: 5.65, rectRadius: 0.08,
    fill: { color: C.white }, line: { color: C.border, width: 1 }
  });
  s4.addText('Peso Destinado por Receptor (kg)', {
    x: 0.75, y: 1.36, w: 5.9, h: 0.34, fontSize: 13.5, bold: true, color: C.navy, fontFace: FONT
  });
  s4.addChart(pres.ChartType.bar, [{
    name: 'Peso Destinado (kg)',
    labels: ['Camarita', 'APAE', 'IMA'],
    values: [byDest['Camarita'], byDest['APAE'], byDest['IMA']]
  }], {
    x: 0.7, y: 1.85, w: 6.0, h: 4.75,
    barDir: 'bar',
    showLegend: false,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFontBold: true,
    chartColors: [C.blue, C.gold, C.emerald],
    valAxisMinVal: 0, valAxisMaxVal: 15000
  });

  addContentCard(s4, 7.15, 1.18, 5.68, 5.65, 'Parcerias e Rastreabilidade', [
    'Camarita (12.976 kg — 90,6%): Principal receptora de Recicláveis Secos e Vidros, com recolhimento programado 3 vezes por semana.',
    'APAE (777 kg — 5,4%): Destinação de Eletrônicos em campanhas periódicas, convertendo descarte tecnológico em apoio social.',
    'IMA (565 kg — 3,9%): Encaminhamento técnico de Lâmpadas, Pilhas e Baterias conforme normas ambientais.',
    'Controle Operacional: Todas as 214 saídas possuem data, categoria, peso aproximado, receptor e observação registrados.'
  ], C.navy);
}

// =========================================================================
// SLIDE 5 — EVOLUÇÃO MENSAL
// =========================================================================
{
  const s5 = pres.addSlide();
  s5.background = { color: C.bg };
  addSiteHeader(s5, 'Ecoponto — Evolução Mensal', 'Histórico consolidado de saídas por mês e composição de materiais (Fev a 16/Nov 2026)', 'ecoponto', 5);

  s5.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 1.18, w: 7.75, h: 5.65, rectRadius: 0.08,
    fill: { color: C.white }, line: { color: C.border, width: 1 }
  });
  s5.addText('Composição Mensal de Saídas (kg)', {
    x: 0.75, y: 1.36, w: 7.2, h: 0.34, fontSize: 13.5, bold: true, color: C.navy, fontFace: FONT
  });
  s5.addChart(pres.ChartType.bar, [
    { name: 'Recicláveis (kg)', labels: monthsSorted.map(m => monthLabelsMap[m]), values: monthsSorted.map(m => byMonth[m].rec) },
    { name: 'Vidros (kg)', labels: monthsSorted.map(m => monthLabelsMap[m]), values: monthsSorted.map(m => byMonth[m].vid) },
    { name: 'Especiais (kg)', labels: monthsSorted.map(m => monthLabelsMap[m]), values: monthsSorted.map(m => byMonth[m].esp) }
  ], {
    x: 0.68, y: 1.78, w: 7.4, h: 4.85,
    barDir: 'col', barGrouping: 'stacked',
    showLegend: true, legendPos: 't',
    chartColors: [C.blue, C.vidro, C.gold],
    valAxisMinVal: 0
  });

  addContentCard(s5, 8.48, 1.18, 4.35, 5.65, 'Leitura do Histórico Mensal', [
    'Implantação (Fev–Abr): Início em 18/02 com 222 kg, alcançando 1.190 kg em abril.',
    'Patamar Regular (Mai–Set): Estabilidade operacional entre 1.530 kg e 1.660 kg por mês.',
    'Recorde em Outubro (2.356 kg): Alta de +52,7% frente a setembro com o 1º Evento dos Vereadores Mirins (410 kg).',
    'Novembro até 16/11 (1.615 kg): Na primeira quinzena já superou a média de mai–set, impulsionado pelo evento de 04/11 (395 kg).'
  ], C.emerald);
}

// =========================================================================
// SLIDE 6 — MÉDIAS POR DIA DA SEMANA
// =========================================================================
{
  const s6 = pres.addSlide();
  s6.background = { color: C.bg };
  addSiteHeader(s6, 'Ecoponto — Médias por Dia da Semana', 'Desempenho operacional em dias úteis (Segunda a Sexta) — consolidado até 16/11/2026', 'ecoponto', 6);

  const diasLabels = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  const avgRecArr = [1, 2, 3, 4, 5].map(i => Math.round(wkConsolidado[i].rec / wkConsolidado[i].days));
  const avgTotArr = [1, 2, 3, 4, 5].map(i => Math.round(wkConsolidado[i].total / wkConsolidado[i].days));

  s6.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 1.18, w: 6.95, h: 5.65, rectRadius: 0.08,
    fill: { color: C.white }, line: { color: C.border, width: 1 }
  });
  s6.addText('Média por Dia Ativo: Recicláveis vs. Total Geral (kg/dia)', {
    x: 0.75, y: 1.36, w: 6.45, h: 0.34, fontSize: 13.5, bold: true, color: C.navy, fontFace: FONT
  });
  s6.addChart(pres.ChartType.bar, [
    { name: 'Média Recicláveis (kg/dia)', labels: diasLabels, values: avgRecArr },
    { name: 'Média Geral Ecoponto (kg/dia)', labels: diasLabels, values: avgTotArr }
  ], {
    x: 0.68, y: 1.8, w: 6.6, h: 4.8,
    barDir: 'col', barGrouping: 'clustered',
    showLegend: true, legendPos: 't',
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 10,
    chartColors: [C.blue, C.emerald],
    valAxisMinVal: 0, valAxisMaxVal: 220
  });

  addContentCard(s6, 7.68, 1.18, 5.15, 5.65, 'Comportamento Semanal', [
    'Eixo Seg / Qua / Sex: Concentra 85,7% de todo o reciclável seco recolhido (5.370 kg de 6.265 kg).',
    'Sexta-feira (Líder Regular): 33 dias ativos, média de 68,6 kg/dia em recicláveis e 172,0 kg/dia no total geral.',
    'Segunda-feira (Início Forte): 30 dias ativos, média de 61,8 kg/dia em recicláveis e 137,0 kg/dia geral.',
    'Quarta-feira (Pico Médio): Média de 113,7 kg/dia em recicláveis (173,7 kg/dia geral) após os eventos mirins.',
    'Terça e Quinta-feira: Atendimentos pós-feriado (ex.: 03/11), campanhas APAE e destinação IMA.'
  ], C.navy);
}

// =========================================================================
// SLIDE 7 — EVENTOS DOS VEREADORES MIRINS
// =========================================================================
{
  const s7 = pres.addSlide();
  s7.background = { color: C.bg };
  addSiteHeader(s7, 'Impacto — Eventos dos Vereadores Mirins', 'Comparativo das quartas-feiras entre rotina normal, consolidado e projeção de 18/11', 'ecoponto', 7);

  const quaRotRec = Math.round(wkRotina[3].rec / wkRotina[3].days);
  const quaConRec = Math.round(wkConsolidado[3].rec / wkConsolidado[3].days);
  const quaPrjRec = Math.round(wkProj18[3].rec / wkProj18[3].days);

  const quaRotTot = Math.round(wkRotina[3].total / wkRotina[3].days);
  const quaConTot = Math.round(wkConsolidado[3].total / wkConsolidado[3].days);
  const quaPrjTot = Math.round(wkProj18[3].total / wkProj18[3].days);

  s7.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 1.18, w: 6.55, h: 5.65, rectRadius: 0.08,
    fill: { color: C.white }, line: { color: C.border, width: 1 }
  });
  s7.addText('Média da Quarta-feira por Cenário (kg/dia ativo)', {
    x: 0.75, y: 1.36, w: 6.05, h: 0.34, fontSize: 13.5, bold: true, color: C.navy, fontFace: FONT
  });
  s7.addChart(pres.ChartType.bar, [
    { name: 'Recicláveis (kg/dia)', labels: ['Rotina Normal\n(s/ Eventos)', 'Consolidado\n(até 16/11)', 'Projeção\n(+18/11)'], values: [quaRotRec, quaConRec, quaPrjRec] },
    { name: 'Total Geral (kg/dia)', labels: ['Rotina Normal\n(s/ Eventos)', 'Consolidado\n(até 16/11)', 'Projeção\n(+18/11)'], values: [quaRotTot, quaConTot, quaPrjTot] }
  ], {
    x: 0.68, y: 1.8, w: 6.2, h: 4.8,
    barDir: 'col', barGrouping: 'clustered',
    showLegend: true, legendPos: 't',
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 11,
    chartColors: [C.gold, C.emerald],
    valAxisMinVal: 0, valAxisMaxVal: 230
  });

  addContentCard(s7, 7.28, 1.18, 5.55, 5.65, 'Cronograma e Planejamento Logístico', [
    '21 de Outubro (Realizado): 410 kg de recicláveis consolidados e 38 sacolas distribuídas.',
    '04 de Novembro (Realizado): 395 kg de recicláveis consolidados e 45 sacolas entregues.',
    '18 de Novembro (Previsto): ~400 kg extras de recicláveis (média de quarta em 137,6 kg/dia) e ~40 sacolas previstas.',
    'Impacto nas Sacolas: Os 3 eventos somam 123 sacolas distribuídas, ampliando a adesão direta dos munícipes.',
    'Reforço Logístico: Agendar recolhimento adicional com a Camarita e reservar big bags e sacos amarelos extras.'
  ], C.gold);
}

// =========================================================================
// SLIDE 8 — SACOLAS POR BAIRRO & PRÓXIMOS PASSOS
// =========================================================================
{
  const s8 = pres.addSlide();
  s8.background = { color: C.bg };
  addSiteHeader(s8, 'Sacolas Recicláveis — Distribuição por Bairro', 'Alcance territorial dos 643 sacos distribuídos e encaminhamentos operacionais', 'sacos', 8);

  s8.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 1.18, w: 6.65, h: 5.65, rectRadius: 0.08,
    fill: { color: C.white }, line: { color: C.border, width: 1 }
  });
  s8.addText('Top 7 Bairros/Localidades em Sacolas Entregues', {
    x: 0.75, y: 1.36, w: 6.15, h: 0.34, fontSize: 13.5, bold: true, color: C.navy, fontFace: FONT
  });
  s8.addChart(pres.ChartType.bar, [{
    name: 'Sacolas Entregues',
    labels: topBairros.map(b => b.nome),
    values: topBairros.map(b => b.sacolas)
  }], {
    x: 0.68, y: 1.8, w: 6.3, h: 4.8,
    barDir: 'bar',
    showLegend: false,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFontBold: true,
    chartColors: [C.navy],
    valAxisMinVal: 0, valAxisMaxVal: 330
  });

  addContentCard(s8, 7.38, 1.18, 5.45, 5.65, 'Cobertura e Próximos Passos', [
    'Núcleo Urbano: Centro (289 sacolas / 1.383 moradores), Vila Nova (99) e Bom Jesus (96) representam 75,3% das entregas.',
    'Interior e Localidades: Interior (42), Lucena (33) e Paraguaçu (12) ampliam a coleta seletiva fora da região central.',
    'Picos nos Eventos Mirins: Distribuição intensificada com 38 sacolas em 21/10, 45 em 04/11 e previsão de ~40 em 18/11.',
    'Fechamento Anual: Registrar a coleta de 18/11 no portal e consolidar novembro e dezembro para o balanço anual.'
  ], C.navy);
}

// Salvar arquivo PPTX
const outPath = path.join(__dirname, 'Apresentacao_Ecoponto_e_Reciclaveis_Itaiopolis_v2.pptx');
pres.writeFile({ fileName: outPath }).then(() => {
  console.log('Apresentação com identidade do site gerada em:', outPath);
}).catch(err => {
  console.error('Erro ao gerar apresentação:', err);
  process.exit(1);
});
