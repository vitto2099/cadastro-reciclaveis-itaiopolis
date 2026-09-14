// ============================================================
// ECOPONTO MUNICIPAL DE ITAIÓPOLIS - CONTROLE DE COLETAS
// Lógica de Registro, Armazenamento Local e Preparação para Google Planilhas
// ============================================================

// URL do Google Apps Script Unificado (atende Sacos Recicláveis e Ecoponto - Versão 10)
const GOOGLE_APPS_SCRIPT_ECOPONTO_URL = "https://script.google.com/macros/s/AKfycby99-spfhSHDEu9lDo6mQ8IUlz-2k83RHSkDsRk-zh4n4MrGsyJFcJVi5demkNn_Om4/exec"; 

const STORAGE_KEY = "ecoponto_coletas_itaiopolis_v2";

// Ícones SVG minimalistas com contornos modernos e cores vivas
const ICONS_SVG = {
    recycle: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="m14 16 3 3 3-3"/><path d="M8.293 13.596 3.4 9.5 8.293 5.4"/><path d="m12.44 2.21 4.893 8.494"/><path d="M7 6.012V3.83a1.83 1.83 0 0 1 .915-1.583 1.785 1.785 0 0 1 1.802.003l6.18 3.568"/></svg>`,
    battery: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="10" x="2" y="7" rx="2" ry="2"/><line x1="22" x2="22" y1="11" y2="13"/><path d="m11 10-2 4h4l-2 3"/></svg>`,
    electronics: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`,
    glass: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"/></svg>`,
    lamp: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
    trash: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
    calendar: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
    package: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`
};

// Metadados das categorias
const WASTE_METADATA = {
    "Recicláveis": { svg: ICONS_SVG.recycle, colorClass: "badge-emerald", label: "Recicláveis" },
    "Baterias e Pilhas": { svg: ICONS_SVG.battery, colorClass: "badge-amber", label: "Baterias e Pilhas" },
    "Eletrônicos": { svg: ICONS_SVG.electronics, colorClass: "badge-indigo", label: "Eletrônicos" },
    "Vidros": { svg: ICONS_SVG.glass, colorClass: "badge-cyan", label: "Vidros" },
    "Lâmpadas": { svg: ICONS_SVG.lamp, colorClass: "badge-gold", label: "Lâmpadas" }
};

// Dados históricos oficiais importados de 'Reciclaveis Meio Ambiente.xlsx' (127 registros)
const DADOS_HISTORICOS_PLANILHA = [
  {
    "id": "hist-0127",
    "dataColeta": "2026-07-31",
    "tipoResiduo": "Vidros",
    "peso": 90.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1785466800127
  },
  {
    "id": "hist-0126",
    "dataColeta": "2026-07-30",
    "tipoResiduo": "Eletrônicos",
    "peso": 50.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1785380400126
  },
  {
    "id": "hist-0125",
    "dataColeta": "2026-07-30",
    "tipoResiduo": "Recicláveis",
    "peso": 70.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1785380400125
  },
  {
    "id": "hist-0124",
    "dataColeta": "2026-07-27",
    "tipoResiduo": "Vidros",
    "peso": 80.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1785121200124
  },
  {
    "id": "hist-0123",
    "dataColeta": "2026-07-27",
    "tipoResiduo": "Recicláveis",
    "peso": 60.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1785121200123
  },
  {
    "id": "hist-0122",
    "dataColeta": "2026-07-24",
    "tipoResiduo": "Vidros",
    "peso": 90.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1784862000122
  },
  {
    "id": "hist-0121",
    "dataColeta": "2026-07-24",
    "tipoResiduo": "Eletrônicos",
    "peso": 50.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1784862000121
  },
  {
    "id": "hist-0120",
    "dataColeta": "2026-07-24",
    "tipoResiduo": "Recicláveis",
    "peso": 70.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1784862000120
  },
  {
    "id": "hist-0119",
    "dataColeta": "2026-07-20",
    "tipoResiduo": "Vidros",
    "peso": 80.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1784516400119
  },
  {
    "id": "hist-0118",
    "dataColeta": "2026-07-20",
    "tipoResiduo": "Recicláveis",
    "peso": 60.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1784516400118
  },
  {
    "id": "hist-0117",
    "dataColeta": "2026-07-17",
    "tipoResiduo": "Vidros",
    "peso": 90.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1784257200117
  },
  {
    "id": "hist-0116",
    "dataColeta": "2026-07-17",
    "tipoResiduo": "Eletrônicos",
    "peso": 50.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1784257200116
  },
  {
    "id": "hist-0115",
    "dataColeta": "2026-07-17",
    "tipoResiduo": "Recicláveis",
    "peso": 70.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1784257200115
  },
  {
    "id": "hist-0114",
    "dataColeta": "2026-07-13",
    "tipoResiduo": "Vidros",
    "peso": 80.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1783911600114
  },
  {
    "id": "hist-0113",
    "dataColeta": "2026-07-13",
    "tipoResiduo": "Recicláveis",
    "peso": 60.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1783911600113
  },
  {
    "id": "hist-0112",
    "dataColeta": "2026-07-10",
    "tipoResiduo": "Vidros",
    "peso": 90.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1783652400112
  },
  {
    "id": "hist-0111",
    "dataColeta": "2026-07-10",
    "tipoResiduo": "Eletrônicos",
    "peso": 50.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1783652400111
  },
  {
    "id": "hist-0110",
    "dataColeta": "2026-07-10",
    "tipoResiduo": "Recicláveis",
    "peso": 70.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1783652400110
  },
  {
    "id": "hist-0109",
    "dataColeta": "2026-07-06",
    "tipoResiduo": "Vidros",
    "peso": 80.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1783306800109
  },
  {
    "id": "hist-0108",
    "dataColeta": "2026-07-06",
    "tipoResiduo": "Recicláveis",
    "peso": 60.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1783306800108
  },
  {
    "id": "hist-0107",
    "dataColeta": "2026-07-03",
    "tipoResiduo": "Vidros",
    "peso": 90.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1783047600107
  },
  {
    "id": "hist-0106",
    "dataColeta": "2026-07-03",
    "tipoResiduo": "Eletrônicos",
    "peso": 50.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1783047600106
  },
  {
    "id": "hist-0105",
    "dataColeta": "2026-07-03",
    "tipoResiduo": "Recicláveis",
    "peso": 70.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Julho",
    "timestamp": 1783047600105
  },
  {
    "id": "hist-0104",
    "dataColeta": "2026-06-29",
    "tipoResiduo": "Vidros",
    "peso": 80.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1782702000104
  },
  {
    "id": "hist-0103",
    "dataColeta": "2026-06-29",
    "tipoResiduo": "Recicláveis",
    "peso": 60.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1782702000103
  },
  {
    "id": "hist-0102",
    "dataColeta": "2026-06-26",
    "tipoResiduo": "Vidros",
    "peso": 90.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1782442800102
  },
  {
    "id": "hist-0101",
    "dataColeta": "2026-06-26",
    "tipoResiduo": "Eletrônicos",
    "peso": 50.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1782442800101
  },
  {
    "id": "hist-0100",
    "dataColeta": "2026-06-26",
    "tipoResiduo": "Recicláveis",
    "peso": 70.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1782442800100
  },
  {
    "id": "hist-0099",
    "dataColeta": "2026-06-22",
    "tipoResiduo": "Vidros",
    "peso": 80.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1782097200099
  },
  {
    "id": "hist-0098",
    "dataColeta": "2026-06-22",
    "tipoResiduo": "Recicláveis",
    "peso": 60.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1782097200098
  },
  {
    "id": "hist-0097",
    "dataColeta": "2026-06-19",
    "tipoResiduo": "Vidros",
    "peso": 90.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1781838000097
  },
  {
    "id": "hist-0096",
    "dataColeta": "2026-06-19",
    "tipoResiduo": "Eletrônicos",
    "peso": 50.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1781838000096
  },
  {
    "id": "hist-0095",
    "dataColeta": "2026-06-19",
    "tipoResiduo": "Recicláveis",
    "peso": 70.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1781838000095
  },
  {
    "id": "hist-0094",
    "dataColeta": "2026-06-15",
    "tipoResiduo": "Vidros",
    "peso": 80.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1781492400094
  },
  {
    "id": "hist-0093",
    "dataColeta": "2026-06-15",
    "tipoResiduo": "Recicláveis",
    "peso": 60.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1781492400093
  },
  {
    "id": "hist-0092",
    "dataColeta": "2026-06-12",
    "tipoResiduo": "Vidros",
    "peso": 90.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1781233200092
  },
  {
    "id": "hist-0091",
    "dataColeta": "2026-06-12",
    "tipoResiduo": "Eletrônicos",
    "peso": 50.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1781233200091
  },
  {
    "id": "hist-0090",
    "dataColeta": "2026-06-12",
    "tipoResiduo": "Recicláveis",
    "peso": 70.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1781233200090
  },
  {
    "id": "hist-0089",
    "dataColeta": "2026-06-08",
    "tipoResiduo": "Vidros",
    "peso": 80.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1780887600089
  },
  {
    "id": "hist-0088",
    "dataColeta": "2026-06-08",
    "tipoResiduo": "Recicláveis",
    "peso": 60.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1780887600088
  },
  {
    "id": "hist-0087",
    "dataColeta": "2026-06-05",
    "tipoResiduo": "Recicláveis",
    "peso": 80.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1780628400087
  },
  {
    "id": "hist-0086",
    "dataColeta": "2026-06-05",
    "tipoResiduo": "Vidros",
    "peso": 50.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1780628400086
  },
  {
    "id": "hist-0085",
    "dataColeta": "2026-06-01",
    "tipoResiduo": "Vidros",
    "peso": 90.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1780282800085
  },
  {
    "id": "hist-0084",
    "dataColeta": "2026-06-01",
    "tipoResiduo": "Eletrônicos",
    "peso": 50.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1780282800084
  },
  {
    "id": "hist-0083",
    "dataColeta": "2026-06-01",
    "tipoResiduo": "Recicláveis",
    "peso": 70.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1780282800083
  },
  {
    "id": "hist-0082",
    "dataColeta": "2026-05-29",
    "tipoResiduo": "Vidros",
    "peso": 80.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1780023600082
  },
  {
    "id": "hist-0081",
    "dataColeta": "2026-05-29",
    "tipoResiduo": "Recicláveis",
    "peso": 60.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1780023600081
  },
  {
    "id": "hist-0075",
    "dataColeta": "2026-05-29",
    "tipoResiduo": "Vidros",
    "peso": 80.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Maio",
    "timestamp": 1780023600075
  },
  {
    "id": "hist-0074",
    "dataColeta": "2026-05-29",
    "tipoResiduo": "Recicláveis",
    "peso": 60.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Maio",
    "timestamp": 1780023600074
  },
  {
    "id": "hist-0080",
    "dataColeta": "2026-05-25",
    "tipoResiduo": "Recicláveis",
    "peso": 80.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1779678000080
  },
  {
    "id": "hist-0079",
    "dataColeta": "2026-05-25",
    "tipoResiduo": "Vidros",
    "peso": 50.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1779678000079
  },
  {
    "id": "hist-0073",
    "dataColeta": "2026-05-25",
    "tipoResiduo": "Recicláveis",
    "peso": 80.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Maio",
    "timestamp": 1779678000073
  },
  {
    "id": "hist-0072",
    "dataColeta": "2026-05-25",
    "tipoResiduo": "Vidros",
    "peso": 50.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Maio",
    "timestamp": 1779678000072
  },
  {
    "id": "hist-0078",
    "dataColeta": "2026-05-22",
    "tipoResiduo": "Vidros",
    "peso": 90.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1779418800078
  },
  {
    "id": "hist-0077",
    "dataColeta": "2026-05-22",
    "tipoResiduo": "Eletrônicos",
    "peso": 50.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1779418800077
  },
  {
    "id": "hist-0076",
    "dataColeta": "2026-05-22",
    "tipoResiduo": "Recicláveis",
    "peso": 70.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Junho",
    "timestamp": 1779418800076
  },
  {
    "id": "hist-0071",
    "dataColeta": "2026-05-22",
    "tipoResiduo": "Vidros",
    "peso": 90.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Maio",
    "timestamp": 1779418800071
  },
  {
    "id": "hist-0070",
    "dataColeta": "2026-05-22",
    "tipoResiduo": "Eletrônicos",
    "peso": 50.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Maio",
    "timestamp": 1779418800070
  },
  {
    "id": "hist-0069",
    "dataColeta": "2026-05-22",
    "tipoResiduo": "Recicláveis",
    "peso": 70.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Maio",
    "timestamp": 1779418800069
  },
  {
    "id": "hist-0068",
    "dataColeta": "2026-05-18",
    "tipoResiduo": "Vidros",
    "peso": 80.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Maio",
    "timestamp": 1779073200068
  },
  {
    "id": "hist-0067",
    "dataColeta": "2026-05-18",
    "tipoResiduo": "Recicláveis",
    "peso": 60.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Maio",
    "timestamp": 1779073200067
  },
  {
    "id": "hist-0066",
    "dataColeta": "2026-05-11",
    "tipoResiduo": "Recicláveis",
    "peso": 80.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Maio",
    "timestamp": 1778468400066
  },
  {
    "id": "hist-0065",
    "dataColeta": "2026-05-11",
    "tipoResiduo": "Vidros",
    "peso": 50.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Maio",
    "timestamp": 1778468400065
  },
  {
    "id": "hist-0064",
    "dataColeta": "2026-05-08",
    "tipoResiduo": "Vidros",
    "peso": 90.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Maio",
    "timestamp": 1778209200064
  },
  {
    "id": "hist-0063",
    "dataColeta": "2026-05-08",
    "tipoResiduo": "Eletrônicos",
    "peso": 50.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Maio",
    "timestamp": 1778209200063
  },
  {
    "id": "hist-0062",
    "dataColeta": "2026-05-08",
    "tipoResiduo": "Recicláveis",
    "peso": 70.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Maio",
    "timestamp": 1778209200062
  },
  {
    "id": "hist-0061",
    "dataColeta": "2026-05-05",
    "tipoResiduo": "Recicláveis",
    "peso": 60.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Maio",
    "timestamp": 1777950000061
  },
  {
    "id": "hist-0060",
    "dataColeta": "2026-05-05",
    "tipoResiduo": "Vidros",
    "peso": 80.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Maio",
    "timestamp": 1777950000060
  },
  {
    "id": "hist-0059",
    "dataColeta": "2026-05-01",
    "tipoResiduo": "Recicláveis",
    "peso": 80.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Maio",
    "timestamp": 1777604400059
  },
  {
    "id": "hist-0058",
    "dataColeta": "2026-04-30",
    "tipoResiduo": "Vidros",
    "peso": 80.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Maio",
    "timestamp": 1777518000058
  },
  {
    "id": "hist-0057",
    "dataColeta": "2026-04-28",
    "tipoResiduo": "Eletrônicos",
    "peso": 80.0,
    "destino": "APAE",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Maio",
    "timestamp": 1777345200057
  },
  {
    "id": "hist-0056",
    "dataColeta": "2026-04-27",
    "tipoResiduo": "Vidros",
    "peso": 100.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Março e Abril",
    "timestamp": 1777258800056
  },
  {
    "id": "hist-0055",
    "dataColeta": "2026-04-27",
    "tipoResiduo": "Recicláveis",
    "peso": 80.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Março e Abril",
    "timestamp": 1777258800055
  },
  {
    "id": "hist-0054",
    "dataColeta": "2026-04-23",
    "tipoResiduo": "Vidros",
    "peso": 80.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Março e Abril",
    "timestamp": 1776913200054
  },
  {
    "id": "hist-0053",
    "dataColeta": "2026-04-22",
    "tipoResiduo": "Recicláveis",
    "peso": 70.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Março e Abril",
    "timestamp": 1776826800053
  },
  {
    "id": "hist-0052",
    "dataColeta": "2026-04-17",
    "tipoResiduo": "Recicláveis",
    "peso": 40.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Março e Abril",
    "timestamp": 1776394800052
  },
  {
    "id": "hist-0051",
    "dataColeta": "2026-04-16",
    "tipoResiduo": "Recicláveis",
    "peso": 40.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Março e Abril",
    "timestamp": 1776308400051
  },
  {
    "id": "hist-0050",
    "dataColeta": "2026-04-15",
    "tipoResiduo": "Recicláveis",
    "peso": 40.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Março e Abril",
    "timestamp": 1776222000050
  },
  {
    "id": "hist-0049",
    "dataColeta": "2026-04-14",
    "tipoResiduo": "Recicláveis",
    "peso": 70.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Março e Abril",
    "timestamp": 1776135600049
  },
  {
    "id": "hist-0048",
    "dataColeta": "2026-04-11",
    "tipoResiduo": "Vidros",
    "peso": 60.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Março e Abril",
    "timestamp": 1775876400048
  },
  {
    "id": "hist-0047",
    "dataColeta": "2026-04-11",
    "tipoResiduo": "Recicláveis",
    "peso": 50.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Março e Abril",
    "timestamp": 1775876400047
  },
  {
    "id": "hist-0046",
    "dataColeta": "2026-04-09",
    "tipoResiduo": "Lâmpadas",
    "peso": 60.0,
    "destino": "IMA",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Março e Abril",
    "timestamp": 1775703600046
  },
  {
    "id": "hist-0045",
    "dataColeta": "2026-04-09",
    "tipoResiduo": "Recicláveis",
    "peso": 90.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Março e Abril",
    "timestamp": 1775703600045
  },
  {
    "id": "hist-0044",
    "dataColeta": "2026-04-09",
    "tipoResiduo": "Eletrônicos",
    "peso": 50.0,
    "destino": "APAE",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Março e Abril",
    "timestamp": 1775703600044
  },
  {
    "id": "hist-0043",
    "dataColeta": "2026-04-06",
    "tipoResiduo": "Eletrônicos",
    "peso": 50.0,
    "destino": "APAE",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Março e Abril",
    "timestamp": 1775444400043
  },
  {
    "id": "hist-0042",
    "dataColeta": "2026-04-06",
    "tipoResiduo": "Vidros",
    "peso": 40.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Março e Abril",
    "timestamp": 1775444400042
  },
  {
    "id": "hist-0041",
    "dataColeta": "2026-04-06",
    "tipoResiduo": "Recicláveis",
    "peso": 80.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Março e Abril",
    "timestamp": 1775444400041
  },
  {
    "id": "hist-0040",
    "dataColeta": "2026-04-01",
    "tipoResiduo": "Eletrônicos",
    "peso": 30.0,
    "destino": "APAE",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Março e Abril",
    "timestamp": 1775012400040
  },
  {
    "id": "hist-0039",
    "dataColeta": "2026-03-31",
    "tipoResiduo": "Recicláveis",
    "peso": 70.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Março e Abril",
    "timestamp": 1774926000039
  },
  {
    "id": "hist-0038",
    "dataColeta": "2026-03-27",
    "tipoResiduo": "Recicláveis",
    "peso": 50.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Março e Abril",
    "timestamp": 1774580400038
  },
  {
    "id": "hist-0037",
    "dataColeta": "2026-03-27",
    "tipoResiduo": "Eletrônicos",
    "peso": 40.0,
    "destino": "APAE",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Março e Abril",
    "timestamp": 1774580400037
  },
  {
    "id": "hist-0034",
    "dataColeta": "2026-03-23",
    "tipoResiduo": "Eletrônicos",
    "peso": 50.0,
    "destino": "APAE",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1774234800034
  },
  {
    "id": "hist-0036",
    "dataColeta": "2026-03-20",
    "tipoResiduo": "Vidros",
    "peso": 40.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1773975600036
  },
  {
    "id": "hist-0035",
    "dataColeta": "2026-03-20",
    "tipoResiduo": "Recicláveis",
    "peso": 45.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1773975600035
  },
  {
    "id": "hist-0033",
    "dataColeta": "2026-03-20",
    "tipoResiduo": "Vidros",
    "peso": 40.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1773975600033
  },
  {
    "id": "hist-0032",
    "dataColeta": "2026-03-20",
    "tipoResiduo": "Recicláveis",
    "peso": 35.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1773975600032
  },
  {
    "id": "hist-0031",
    "dataColeta": "2026-03-17",
    "tipoResiduo": "Vidros",
    "peso": 25.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1773716400031
  },
  {
    "id": "hist-0030",
    "dataColeta": "2026-03-17",
    "tipoResiduo": "Recicláveis",
    "peso": 40.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1773716400030
  },
  {
    "id": "hist-0029",
    "dataColeta": "2026-03-16",
    "tipoResiduo": "Lâmpadas",
    "peso": 65.0,
    "destino": "IMA",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1773630000029
  },
  {
    "id": "hist-0028",
    "dataColeta": "2026-03-16",
    "tipoResiduo": "Eletrônicos",
    "peso": 40.0,
    "destino": "APAE",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1773630000028
  },
  {
    "id": "hist-0027",
    "dataColeta": "2026-03-13",
    "tipoResiduo": "Recicláveis",
    "peso": 30.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1773370800027
  },
  {
    "id": "hist-0026",
    "dataColeta": "2026-03-13",
    "tipoResiduo": "Vidros",
    "peso": 50.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1773370800026
  },
  {
    "id": "hist-0025",
    "dataColeta": "2026-03-12",
    "tipoResiduo": "Vidros",
    "peso": 70.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1773284400025
  },
  {
    "id": "hist-0024",
    "dataColeta": "2026-03-12",
    "tipoResiduo": "Recicláveis",
    "peso": 20.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1773284400024
  },
  {
    "id": "hist-0023",
    "dataColeta": "2026-03-09",
    "tipoResiduo": "Recicláveis",
    "peso": 50.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1773025200023
  },
  {
    "id": "hist-0022",
    "dataColeta": "2026-03-05",
    "tipoResiduo": "Vidros",
    "peso": 30.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1772679600022
  },
  {
    "id": "hist-0021",
    "dataColeta": "2026-03-05",
    "tipoResiduo": "Eletrônicos",
    "peso": 15.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1772679600021
  },
  {
    "id": "hist-0020",
    "dataColeta": "2026-03-05",
    "tipoResiduo": "Recicláveis",
    "peso": 25.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1772679600020
  },
  {
    "id": "hist-0019",
    "dataColeta": "2026-03-05",
    "tipoResiduo": "Baterias e Pilhas",
    "peso": 12.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1772679600019
  },
  {
    "id": "hist-0018",
    "dataColeta": "2026-03-03",
    "tipoResiduo": "Recicláveis",
    "peso": 30.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1772506800018
  },
  {
    "id": "hist-0017",
    "dataColeta": "2026-03-03",
    "tipoResiduo": "Eletrônicos",
    "peso": 2.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1772506800017
  },
  {
    "id": "hist-0016",
    "dataColeta": "2026-03-03",
    "tipoResiduo": "Vidros",
    "peso": 30.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1772506800016
  },
  {
    "id": "hist-0015",
    "dataColeta": "2026-03-02",
    "tipoResiduo": "Recicláveis",
    "peso": 40.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1772420400015
  },
  {
    "id": "hist-0006",
    "dataColeta": "2026-03-02",
    "tipoResiduo": "Lâmpadas",
    "peso": 60.0,
    "destino": "IMA",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1772420400006
  },
  {
    "id": "hist-0014",
    "dataColeta": "2026-02-27",
    "tipoResiduo": "Recicláveis",
    "peso": 30.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1772161200014
  },
  {
    "id": "hist-0010",
    "dataColeta": "2026-02-27",
    "tipoResiduo": "Vidros",
    "peso": 15.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1772161200010
  },
  {
    "id": "hist-0009",
    "dataColeta": "2026-02-27",
    "tipoResiduo": "Eletrônicos",
    "peso": 25.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1772161200009
  },
  {
    "id": "hist-0003",
    "dataColeta": "2026-02-27",
    "tipoResiduo": "Baterias e Pilhas",
    "peso": 15.0,
    "destino": "IMA",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1772161200003
  },
  {
    "id": "hist-0013",
    "dataColeta": "2026-02-26",
    "tipoResiduo": "Recicláveis",
    "peso": 35.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1772074800013
  },
  {
    "id": "hist-0012",
    "dataColeta": "2026-02-23",
    "tipoResiduo": "Recicláveis",
    "peso": 4.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1771815600012
  },
  {
    "id": "hist-0008",
    "dataColeta": "2026-02-23",
    "tipoResiduo": "Eletrônicos",
    "peso": 2.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1771815600008
  },
  {
    "id": "hist-0005",
    "dataColeta": "2026-02-23",
    "tipoResiduo": "Lâmpadas",
    "peso": 8.0,
    "destino": "IMA",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1771815600005
  },
  {
    "id": "hist-0002",
    "dataColeta": "2026-02-23",
    "tipoResiduo": "Baterias e Pilhas",
    "peso": 7.0,
    "destino": "IMA",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1771815600002
  },
  {
    "id": "hist-0011",
    "dataColeta": "2026-02-18",
    "tipoResiduo": "Recicláveis",
    "peso": 1.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1771383600011
  },
  {
    "id": "hist-0007",
    "dataColeta": "2026-02-18",
    "tipoResiduo": "Eletrônicos",
    "peso": 40.0,
    "destino": "Camarita",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1771383600007
  },
  {
    "id": "hist-0004",
    "dataColeta": "2026-02-18",
    "tipoResiduo": "Lâmpadas",
    "peso": 35.0,
    "destino": "IMA",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1771383600004
  },
  {
    "id": "hist-0001",
    "dataColeta": "2026-02-18",
    "tipoResiduo": "Baterias e Pilhas",
    "peso": 5.0,
    "destino": "IMA",
    "responsavel": "Equipe Ecoponto",
    "obs": "Mês: Fevereiro",
    "timestamp": 1771383600001
  }
];

document.addEventListener("DOMContentLoaded", () => {
    // Elementos do DOM
    const form = document.getElementById("ecoponto-form");
    if (!form) return; // Se não houver o formulário de ecoponto nesta página, não executa

    const dataInput = document.getElementById("data-coleta");
    const btnToday = document.getElementById("btn-date-today");
    const btnYesterday = document.getElementById("btn-date-yesterday");
    const tipoInput = document.getElementById("tipo-residuo");
    const wasteCards = document.querySelectorAll(".waste-type-card");
    const pesoInput = document.getElementById("peso-coleta");
    const weightChips = document.querySelectorAll(".btn-chip[data-weight]");
    const btnClearWeight = document.getElementById("btn-clear-weight");
    const destinoInput = document.getElementById("destino-coleta");
    const obsInput = document.getElementById("obs-coleta");
    const submitBtn = document.getElementById("btn-salvar-coleta");
    const btnLoader = document.getElementById("btn-loader-ecoponto") || document.getElementById("btn-loader");
    const btnText = submitBtn ? submitBtn.querySelector(".btn-text") : null;

    // Elementos de Histórico e Filtros
    const coletasList = document.getElementById("coletas-list");
    const emptyState = document.getElementById("empty-state");
    const filterPills = document.querySelectorAll(".filter-pill");
    const btnExportCsv = document.getElementById("btn-export-ecoponto-csv") || document.getElementById("btn-export-csv");
    const btnClearHistory = document.getElementById("btn-clear-history");
    const countFilterAll = document.getElementById("count-filter-all");

    // Elementos de Estatísticas
    const statTotalPeso = document.getElementById("stat-total-peso");
    const statTotalRegistros = document.getElementById("stat-total-registros");
    const statUltimaColeta = document.getElementById("stat-ultima-coleta");
    const statTipoTop = document.getElementById("stat-tipo-top");

    let currentFilter = "all";

    // -------------------------------------------------------------
    // 1. GESTÃO DE DATA (Puxa automático com opção de alterar)
    // -------------------------------------------------------------
    function getFormattedDate(dateObj) {
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    function setDateToday() {
        const today = new Date();
        dataInput.value = getFormattedDate(today);
        highlightDateButtons("today");
    }

    function setDateYesterday() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        dataInput.value = getFormattedDate(yesterday);
        highlightDateButtons("yesterday");
    }

    function highlightDateButtons(activeType) {
        btnToday.classList.toggle("active", activeType === "today");
        btnYesterday.classList.toggle("active", activeType === "yesterday");
    }

    // Inicializa com a data de hoje por padrão
    setDateToday();

    btnToday.addEventListener("click", setDateToday);
    btnYesterday.addEventListener("click", setDateYesterday);

    dataInput.addEventListener("change", () => {
        const todayStr = getFormattedDate(new Date());
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getFormattedDate(yesterday);

        if (dataInput.value === todayStr) {
            highlightDateButtons("today");
        } else if (dataInput.value === yesterdayStr) {
            highlightDateButtons("yesterday");
        } else {
            highlightDateButtons(null);
        }
    });

    // -------------------------------------------------------------
    // 2. SELETOR VISUAL DE TIPO DE RESÍDUO
    // -------------------------------------------------------------
    wasteCards.forEach(card => {
        card.addEventListener("click", () => {
            const selectedType = card.dataset.type;
            selectWasteType(selectedType);
        });
    });

    function selectWasteType(typeName) {
        wasteCards.forEach(card => {
            const isMatch = card.dataset.type === typeName;
            card.classList.toggle("active", isMatch);
        });
        tipoInput.value = typeName;
    }

    // Seleciona a primeira opção ("Recicláveis") por padrão para agilizar
    selectWasteType("Recicláveis");

    // -------------------------------------------------------------
    // 3. ATALHOS DE PESO RÁPIDO (+5, +10, +25, +50, +100 kg)
    // -------------------------------------------------------------
    weightChips.forEach(chip => {
        chip.addEventListener("click", () => {
            const inc = parseFloat(chip.dataset.weight) || 0;
            const current = parseFloat(pesoInput.value) || 0;
            const novoValor = (current + inc).toFixed(1);
            pesoInput.value = novoValor.endsWith(".0") ? parseInt(novoValor) : novoValor;
            pesoInput.focus();
        });
    });

    btnClearWeight.addEventListener("click", () => {
        pesoInput.value = "";
        pesoInput.focus();
    });

    // -------------------------------------------------------------
    // 3.1. BOTÕES PRÉ-DEFINIDOS DE DESTINO (Camarita, IMA, APAE, Outro)
    // -------------------------------------------------------------
    const destinoBtns = document.querySelectorAll(".destino-btn");
    destinoBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            destinoBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const val = btn.dataset.destino;
            if (val === "Outro") {
                if (destinoInput) {
                    destinoInput.style.display = "block";
                    destinoInput.value = "";
                    destinoInput.focus();
                }
            } else {
                if (destinoInput) {
                    destinoInput.style.display = "none";
                    destinoInput.value = val;
                }
            }
        });
    });

    function resetDestino() {
        destinoBtns.forEach(b => b.classList.remove("active"));
        const defaultBtn = document.querySelector('.destino-btn[data-destino="Camarita"]');
        if (defaultBtn) defaultBtn.classList.add("active");
        if (destinoInput) {
            destinoInput.value = "Camarita";
            destinoInput.style.display = "none";
        }
    }

    // Inicializa destino com Camarita
    resetDestino();

    // -------------------------------------------------------------
    // 4. PERSISTÊNCIA LOCAL (LocalStorage)
    // -------------------------------------------------------------
    function loadColetas() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                // Carrega 2 exemplos realistas para demonstração imediata
                const initialData = [...DADOS_HISTORICOS_PLANILHA];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
                return initialData;
            }
            return JSON.parse(raw);
        } catch (e) {
            console.error("Erro ao ler localStorage", e);
            return [];
        }
    }

    function saveColetas(coletas) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(coletas));
    }

    // -------------------------------------------------------------
    // 5. ATUALIZAR INTERFACE (Lista, Estatísticas e Filtros)
    // -------------------------------------------------------------
    function renderApp() {
        const coletas = loadColetas();
        updateStats(coletas);
        renderList(coletas);
        if (countFilterAll) {
            countFilterAll.textContent = coletas.length;
        }
    }

    function updateStats(coletas) {
        const statMesAtual = document.getElementById("stat-mes-atual");
        const statMesAtualLabel = document.getElementById("stat-mes-atual-label");

        if (!coletas || coletas.length === 0) {
            if (statTotalPeso) statTotalPeso.textContent = "0 kg";
            if (statTotalRegistros) statTotalRegistros.textContent = "0";
            if (statUltimaColeta) statUltimaColeta.textContent = "--/--/----";
            if (statTipoTop) statTipoTop.textContent = "--";
            if (statMesAtual) statMesAtual.textContent = "0 kg";
            return;
        }

        // Total de peso e contadores por tipo
        let totalPeso = 0;
        const typeWeights = {};

        coletas.forEach(item => {
            const p = parseFloat(item.peso) || 0;
            totalPeso += p;
            typeWeights[item.tipoResiduo] = (typeWeights[item.tipoResiduo] || 0) + p;
        });

        // Formatação do peso geral
        if (statTotalPeso) {
            if (totalPeso >= 1000) {
                statTotalPeso.textContent = (totalPeso / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + " t";
            } else {
                statTotalPeso.textContent = totalPeso.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " kg";
            }
        }

        if (statTotalRegistros) statTotalRegistros.textContent = coletas.length;

        // Data da coleta mais recente
        const datasOrdenadas = [...coletas].sort((a, b) => (b.dataColeta || "").localeCompare(a.dataColeta || ""));
        if (datasOrdenadas[0] && datasOrdenadas[0].dataColeta && statUltimaColeta) {
            const parts = datasOrdenadas[0].dataColeta.split("-");
            statUltimaColeta.textContent = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }

        // Tipo mais coletado por peso
        if (statTipoTop) {
            let topTipo = "--";
            let maxPeso = -1;
            for (const [tipo, peso] of Object.entries(typeWeights)) {
                if (peso > maxPeso) {
                    maxPeso = peso;
                    topTipo = tipo;
                }
            }
            statTipoTop.textContent = topTipo;
        }

        // ============================================================
        // CÁLCULO DE SAÍDAS DO MÊS ("O QUE SAIU NO MÊS")
        // ============================================================
        const now = new Date();
        const curY = now.getFullYear();
        const curM = String(now.getMonth() + 1).padStart(2, '0');
        const curMonthKey = `${curY}-${curM}`;
        const monthNames = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];
        const curMonthName = monthNames[now.getMonth()];

        let coletasMes = coletas.filter(c => c.dataColeta && c.dataColeta.startsWith(curMonthKey));
        let activeMonthName = curMonthName;

        // Se o mês atual ainda não tem coletas cadastradas, busca o mês com dados mais recente para exibir dados relevantes
        if (coletasMes.length === 0 && datasOrdenadas[0] && datasOrdenadas[0].dataColeta) {
            const latestMonthKey = datasOrdenadas[0].dataColeta.substring(0, 7);
            const [ly, lm] = latestMonthKey.split("-");
            const lmIdx = parseInt(lm, 10) - 1;
            coletasMes = coletas.filter(c => c.dataColeta && c.dataColeta.startsWith(latestMonthKey));
            activeMonthName = `${monthNames[lmIdx] || lm}`;
        }

        const pesoMes = coletasMes.reduce((acc, c) => acc + (parseFloat(c.peso) || 0), 0);

        if (statMesAtual) {
            statMesAtual.textContent = pesoMes >= 1000
                ? (pesoMes / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + " t"
                : pesoMes.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " kg";
        }
        if (statMesAtualLabel) {
            statMesAtualLabel.textContent = `Saídas em ${activeMonthName}`;
        }
    }

    function renderList(coletas) {
        coletasList.innerHTML = "";

        // Ordenar por data decrescente (mais recente primeiro)
        const sorted = [...coletas].sort((a, b) => {
            const cmp = (b.dataColeta || "").localeCompare(a.dataColeta || "");
            if (cmp !== 0) return cmp;
            return (b.timestamp || 0) - (a.timestamp || 0);
        });

        // Aplicar filtro ativo
        const filtered = currentFilter === "all" 
            ? sorted 
            : sorted.filter(c => c.tipoResiduo === currentFilter);

        if (filtered.length === 0) {
            emptyState.classList.add("show");
            coletasList.style.display = "none";
            return;
        }

        emptyState.classList.remove("show");
        coletasList.style.display = "flex";

        filtered.forEach(item => {
            const meta = WASTE_METADATA[item.tipoResiduo] || { svg: ICONS_SVG.package, colorClass: "badge-emerald", label: item.tipoResiduo };
            
            // Formatar data para DD/MM/AAAA
            let dataFormatada = item.dataColeta;
            if (item.dataColeta && item.dataColeta.includes("-")) {
                const [y, m, d] = item.dataColeta.split("-");
                dataFormatada = `${d}/${m}/${y}`;
            }

            const card = document.createElement("div");
            card.className = "coleta-item";

            // Detalhes opcionais
            const detalhes = [];
            if (item.destino && item.destino !== "Não especificado") detalhes.push(`Destino: <strong>${escapeHtml(item.destino)}</strong>`);
            if (item.obs && !item.obs.toLowerCase().startsWith("mês:")) detalhes.push(`${escapeHtml(item.obs)}`);
            const subtext = detalhes.join(" • ");

            card.innerHTML = `
                <div class="coleta-main-col">
                    <div class="coleta-icon-badge icon-badge ${meta.colorClass}">
                        ${meta.svg}
                    </div>
                    <div class="coleta-meta">
                        <div class="coleta-title-row">
                            <span class="coleta-type-title">${escapeHtml(item.tipoResiduo)}</span>
                            <span class="coleta-date-badge" style="display: inline-flex; align-items: center; gap: 4px;">${ICONS_SVG.calendar} ${dataFormatada}</span>
                        </div>
                        ${subtext ? `<div class="coleta-subtext" title="${escapeHtml(subtext.replace(/<[^>]*>?/gm, ''))}">${subtext}</div>` : ''}
                    </div>
                </div>
                <div class="coleta-weight-col">
                    <div class="coleta-weight-value">
                        <div class="coleta-weight-num">${Number(item.peso).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg</div>
                    </div>
                    <button type="button" class="btn-delete-item" data-id="${item.id}" title="Excluir este registro">
                        ${ICONS_SVG.trash}
                    </button>
                </div>
            `;

            // Ação de excluir item individual
            const deleteBtn = card.querySelector(".btn-delete-item");
            deleteBtn.addEventListener("click", () => {
                if (confirm(`Deseja remover o registro de ${item.tipoResiduo} (${item.peso} kg) do dia ${dataFormatada}?`)) {
                    excluirColeta(item.id);
                }
            });

            coletasList.appendChild(card);
        });
    }

    function excluirColeta(id) {
        let coletas = loadColetas();
        coletas = coletas.filter(c => c.id !== id);
        saveColetas(coletas);
        renderApp();
        showToast("Registro removido do histórico.", "info");
    }

    // -------------------------------------------------------------
    // 6. FILTROS DE CATEGORIA (Pills)
    // -------------------------------------------------------------
    filterPills.forEach(pill => {
        pill.addEventListener("click", () => {
            filterPills.forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            currentFilter = pill.dataset.filter;
            renderList(loadColetas());
        });
    });

    // -------------------------------------------------------------
    // 7. SUBMISSÃO DO FORMULÁRIO
    // -------------------------------------------------------------
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const dataColeta = dataInput.value;
        const tipoResiduo = tipoInput.value;
        const peso = parseFloat(pesoInput.value);
        const destino = destinoInput ? destinoInput.value.trim() : "";
        const obs = obsInput ? obsInput.value.trim() : "";

        if (!dataColeta) {
            showToast("Por favor, selecione ou confirme a data da coleta.", "error");
            dataInput.focus();
            return;
        }

        if (!tipoResiduo) {
            showToast("Por favor, selecione a categoria do resíduo coletado.", "error");
            return;
        }

        if (isNaN(peso) || peso <= 0) {
            showToast("Informe um peso aproximado válido maior que zero.", "error");
            pesoInput.focus();
            return;
        }

        // Estado de carregamento do botão
        setLoading(true);

        const novoRegistro = {
            id: "coleta-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
            dataColeta,
            tipoResiduo,
            peso,
            destino: destino || "Não especificado",
            obs,
            timestamp: Date.now()
        };

        try {
            // Se houver URL do Google Apps Script configurada no futuro, envia para lá
            if (GOOGLE_APPS_SCRIPT_ECOPONTO_URL) {
                await enviarParaGoogleSheets(novoRegistro);
            }

            // Salva localmente com segurança
            const coletas = loadColetas();
            coletas.unshift(novoRegistro);
            saveColetas(coletas);

            // Atualiza UI
            renderApp();

            // Feedback ao usuário
            showToast(`Saída de ${peso} kg de ${tipoResiduo} registrada com sucesso!`, "success");

            // Limpa apenas o campo de peso e observações, reseta destino para Camarita
            pesoInput.value = "";
            obsInput.value = "";
            resetDestino();
            pesoInput.focus();

        } catch (error) {
            console.error("Erro ao salvar saída:", error);
            showToast("Erro ao processar o registro. Tente novamente.", "error");
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        btnLoader.style.display = isLoading ? "inline-block" : "none";
        btnText.innerHTML = isLoading 
            ? `<span>Registrando Saída...</span>` 
            : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg><span>Registrar Saída do Ecoponto</span>`;
    }

    // Função de envio para o Google Sheets (pronta e conectada)
    async function enviarParaGoogleSheets(dados) {
        if (!GOOGLE_APPS_SCRIPT_ECOPONTO_URL) return;
        const formData = new URLSearchParams();
        formData.append("action", "saida_ecoponto");
        formData.append("dataColeta", dados.dataColeta);
        formData.append("tipoResiduo", dados.tipoResiduo);
        formData.append("peso", dados.peso);
        formData.append("destino", dados.destino || "Não especificado");
        formData.append("responsavel", dados.responsavel || "");
        formData.append("obs", dados.obs || "");

        const fetchPromise = fetch(GOOGLE_APPS_SCRIPT_ECOPONTO_URL, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formData.toString()
        });

        // Timeout de segurança de 6 segundos para não travar a interface se a rede oscilar
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout envio Google Sheets")), 6000)
        );

        try {
            await Promise.race([fetchPromise, timeoutPromise]);
        } catch (err) {
            console.warn("Envio para Google Sheets demorou ou falhou, mantido com segurança no histórico:", err);
        }
    }

    // -------------------------------------------------------------
    // 8. EXPORTAÇÃO CSV PARA EXCEL / GOOGLE SHEETS
    // -------------------------------------------------------------
    btnExportCsv.addEventListener("click", () => {
        const coletas = loadColetas();
        if (coletas.length === 0) {
            showToast("Não há coletas no histórico para exportar.", "info");
            return;
        }

        // CSV com BOM para abrir perfeitamente no Excel brasileiro (acentuação e separador ponto-e-vírgula)
        let csvContent = "\uFEFFData da Coleta;Tipo de Residuo;Peso Aproximado (kg);Destino;Observacoes\n";

        coletas.forEach(item => {
            let dataFormatada = item.dataColeta;
            if (item.dataColeta && item.dataColeta.includes("-")) {
                const [y, m, d] = item.dataColeta.split("-");
                dataFormatada = `${d}/${m}/${y}`;
            }

            const row = [
                `"${dataFormatada}"`,
                `"${item.tipoResiduo}"`,
                `"${String(item.peso).replace('.', ',')}"`,
                `"${(item.destino || '').replace(/"/g, '""')}"`,
                `"${(item.obs || '').replace(/"/g, '""')}"`
            ];
            csvContent += row.join(";") + "\n";
        });

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `coletas_ecoponto_itaiopolis_${getFormattedDate(new Date())}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast("Planilha CSV exportada com sucesso!", "success");
    });

    // Limpar histórico total
    btnClearHistory.addEventListener("click", () => {
        const coletas = loadColetas();
        if (coletas.length === 0) {
            showToast("O histórico já está vazio.", "info");
            return;
        }
        if (confirm("Tem certeza que deseja apagar todo o histórico local de coletas do Ecoponto? Esta ação não pode ser desfeita.")) {
            localStorage.removeItem(STORAGE_KEY);
            renderApp();
            showToast("Histórico local apagado.", "info");
        }
    });

    // -------------------------------------------------------------
    // 9. SISTEMA DE TOAST NOTIFICATIONS
    // -------------------------------------------------------------
    function showToast(message, type = "info") {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast-message toast-${type}`;
        
        let iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #3b82f6;"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>`;
        if (type === "success") {
            iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #10b981;"><path d="M20 6 9 17l-5-5"/></svg>`;
        } else if (type === "error") {
            iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #ef4444;"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;
        }

        toast.innerHTML = `
            <span style="display: inline-flex; align-items: center; justify-content: center; margin-right: 8px; flex-shrink: 0;">${iconSvg}</span>
            <span>${escapeHtml(message)}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add("toast-show");
        }, 10);

        setTimeout(() => {
            toast.classList.remove("toast-show");
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }

    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // -------------------------------------------------------------
    // 9. BALANÇO MENSAL, MÉTRICAS E GRÁFICOS DO ECOPONTO
    // -------------------------------------------------------------
    let ecopontoCatChartInstance = null;
    let ecopontoMonthChartInstance = null;

    function setupEcopontoDashboard() {
        const modal = document.getElementById("ecoponto-dashboard-modal");
        const btnOpenStat = document.getElementById("btn-ecoponto-dashboard");
        const btnOpenHeader = document.getElementById("btn-ecoponto-dash-header");
        const btnClose = document.getElementById("btn-close-ecoponto-dash");
        const selectMonth = document.getElementById("ecoponto-dash-month");

        const btnResumo = document.getElementById("btn-ecoponto-view-resumo");
        const btnChart = document.getElementById("btn-ecoponto-view-chart");
        const btnEvolucao = document.getElementById("btn-ecoponto-view-evolucao");

        const viewResumo = document.getElementById("ecoponto-view-resumo");
        const viewChartBox = document.getElementById("ecoponto-view-chart-box");
        const viewEvolucaoBox = document.getElementById("ecoponto-view-evolucao-box");

        const kpiPeso = document.getElementById("dash-month-peso");
        const kpiSaidas = document.getElementById("dash-month-saidas");
        const kpiTopCat = document.getElementById("dash-month-top-cat");
        const kpiTopDest = document.getElementById("dash-month-top-dest");

        const btnExportMonthCsv = document.getElementById("btn-export-ecoponto-month-csv");

        if (!modal) return;

        function openModal() {
            populateMonthSelect();
            updateDashboardView();
            modal.style.display = "flex";
            document.body.style.overflow = "hidden";
        }

        function closeModal() {
            modal.style.display = "none";
            document.body.style.overflow = "";
        }

        if (btnOpenStat) btnOpenStat.addEventListener("click", openModal);
        if (btnOpenHeader) btnOpenHeader.addEventListener("click", openModal);
        if (btnClose) btnClose.addEventListener("click", closeModal);

        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && modal.style.display === "flex") {
                closeModal();
            }
        });

        // Alternador de abas (Resumo, Categorias, Evolução)
        function setActiveTab(tab) {
            if (btnResumo) btnResumo.classList.toggle("active", tab === "resumo");
            if (btnChart) btnChart.classList.toggle("active", tab === "chart");
            if (btnEvolucao) btnEvolucao.classList.toggle("active", tab === "evolucao");

            if (viewResumo) viewResumo.style.display = tab === "resumo" ? "flex" : "none";
            if (viewChartBox) viewChartBox.style.display = tab === "chart" ? "block" : "none";
            if (viewEvolucaoBox) viewEvolucaoBox.style.display = tab === "evolucao" ? "block" : "none";

            updateDashboardView();
        }

        if (btnResumo) btnResumo.addEventListener("click", () => setActiveTab("resumo"));
        if (btnChart) btnChart.addEventListener("click", () => setActiveTab("chart"));
        if (btnEvolucao) btnEvolucao.addEventListener("click", () => setActiveTab("evolucao"));

        if (selectMonth) {
            selectMonth.addEventListener("change", () => {
                updateDashboardView();
            });
        }

        const monthNames = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];

        function populateMonthSelect() {
            if (!selectMonth) return;
            const coletas = loadColetas();
            const monthsSet = new Set();
            
            // Adiciona mês atual
            const now = new Date();
            const curY = now.getFullYear();
            const curM = String(now.getMonth() + 1).padStart(2, '0');
            monthsSet.add(`${curY}-${curM}`);

            coletas.forEach(c => {
                if (c.dataColeta && c.dataColeta.length >= 7) {
                    monthsSet.add(c.dataColeta.substring(0, 7));
                }
            });

            // Ordena decrescente
            const sortedMonths = Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
            
            const currentSelected = selectMonth.value;
            selectMonth.innerHTML = "";

            // Opção "Todos"
            const optAll = document.createElement("option");
            optAll.value = "all";
            optAll.textContent = "Todos os Meses (Histórico Geral)";
            selectMonth.appendChild(optAll);

            sortedMonths.forEach(mKey => {
                const [ano, mes] = mKey.split("-");
                const mesNum = parseInt(mes, 10) - 1;
                const nomeMes = monthNames[mesNum] || mes;

                const opt = document.createElement("option");
                opt.value = mKey;
                opt.textContent = `${nomeMes} de ${ano}${mKey === `${curY}-${curM}` ? ' (Mês Atual)' : ''}`;
                selectMonth.appendChild(opt);
            });

            // Se já tinha algo selecionado, mantém; senão seleciona o mês mais recente com coletas ou o mês atual
            if (currentSelected && Array.from(selectMonth.options).some(o => o.value === currentSelected)) {
                selectMonth.value = currentSelected;
            } else {
                const monthWithData = sortedMonths.find(m => coletas.some(c => c.dataColeta && c.dataColeta.startsWith(m)));
                selectMonth.value = monthWithData || `${curY}-${curM}`;
            }
        }

        function updateDashboardView() {
            const coletas = loadColetas();
            const selectedMonth = selectMonth ? selectMonth.value : "all";

            const filteredColetas = selectedMonth === "all" 
                ? coletas 
                : coletas.filter(c => c.dataColeta && c.dataColeta.startsWith(selectedMonth));

            // Calcular KPIs
            let totalPeso = 0;
            const categoryMap = {
                "Recicláveis": { peso: 0, count: 0, color: "#10b981", class: "badge-emerald" },
                "Baterias e Pilhas": { peso: 0, count: 0, color: "#f59e0b", class: "badge-amber" },
                "Eletrônicos": { peso: 0, count: 0, color: "#6366f1", class: "badge-indigo" },
                "Vidros": { peso: 0, count: 0, color: "#06b6d4", class: "badge-cyan" },
                "Lâmpadas": { peso: 0, count: 0, color: "#eab308", class: "badge-gold" }
            };
            const destinoMap = {};

            filteredColetas.forEach(item => {
                const p = parseFloat(item.peso) || 0;
                totalPeso += p;
                
                if (!categoryMap[item.tipoResiduo]) {
                    categoryMap[item.tipoResiduo] = { peso: 0, count: 0, color: "#94a3b8", class: "badge-emerald" };
                }
                categoryMap[item.tipoResiduo].peso += p;
                categoryMap[item.tipoResiduo].count += 1;

                const dest = item.destino || "Não especificado";
                destinoMap[dest] = (destinoMap[dest] || 0) + p;
            });

            // Encontrar Top Categoria e Top Destino
            let topCat = "--";
            let maxCatPeso = -1;
            Object.entries(categoryMap).forEach(([cat, data]) => {
                if (data.peso > maxCatPeso && data.peso > 0) {
                    maxCatPeso = data.peso;
                    topCat = cat;
                }
            });

            let topDest = "--";
            let maxDestPeso = -1;
            Object.entries(destinoMap).forEach(([dest, peso]) => {
                if (peso > maxDestPeso && peso > 0) {
                    maxDestPeso = peso;
                    topDest = dest;
                }
            });

            // Atualiza KPIs do Modal
            if (kpiPeso) {
                kpiPeso.textContent = totalPeso >= 1000 
                    ? (totalPeso / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + " t"
                    : totalPeso.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " kg";
            }
            if (kpiSaidas) kpiSaidas.textContent = filteredColetas.length;
            if (kpiTopCat) kpiTopCat.textContent = topCat;
            if (kpiTopDest) kpiTopDest.textContent = topDest;

            // Renderizar a visão ativa
            if (btnResumo && btnResumo.classList.contains("active")) {
                renderResumoView(filteredColetas, categoryMap, totalPeso);
            } else if (btnChart && btnChart.classList.contains("active")) {
                renderCategoryChart(categoryMap, totalPeso);
            } else if (btnEvolucao && btnEvolucao.classList.contains("active")) {
                renderEvolutionChart(coletas);
            }
        }

        // 1. VISÃO RESUMO (Cards por Categoria com barras e tabela detalhada)
        function renderResumoView(filteredColetas, categoryMap, totalPeso) {
            if (!viewResumo) return;
            viewResumo.innerHTML = "";

            if (filteredColetas.length === 0) {
                viewResumo.innerHTML = `
                    <div style="text-align: center; padding: 2.5rem 1rem; color: #64748b;">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 8px;"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                        <h4 style="margin: 0 0 4px 0; color: #334155; font-size: 1.05rem;">Nenhuma saída neste período</h4>
                        <p style="margin: 0; font-size: 0.88rem;">Não foram registradas saídas para o mês selecionado.</p>
                    </div>
                `;
                return;
            }

            // Grid de Categorias
            const cardsGrid = document.createElement("div");
            cardsGrid.style.display = "grid";
            cardsGrid.style.gridTemplateColumns = "repeat(auto-fit, minmax(220px, 1fr))";
            cardsGrid.style.gap = "12px";

            // Ordena categorias por peso decrescente
            const sortedCats = Object.entries(categoryMap).sort((a, b) => b[1].peso - a[1].peso);

            sortedCats.forEach(([catName, data]) => {
                const meta = WASTE_METADATA[catName] || { svg: ICONS_SVG.package, label: catName };
                const pct = totalPeso > 0 ? ((data.peso / totalPeso) * 100).toFixed(1) : "0.0";

                const card = document.createElement("div");
                card.className = "ecoponto-month-card";
                card.innerHTML = `
                    <div class="month-card-header">
                        <div class="month-card-title-group">
                            <span class="icon-badge ${meta.colorClass || 'badge-emerald'}" style="width: 28px; height: 28px;">
                                ${meta.svg}
                            </span>
                            <span class="month-card-title">${escapeHtml(catName)}</span>
                        </div>
                        <span class="month-card-count-badge">${data.count} ${data.count === 1 ? 'saída' : 'saídas'}</span>
                    </div>
                    <div class="month-progress-bg">
                        <div class="month-progress-fill" style="width: ${pct}%; background-color: ${data.color};"></div>
                    </div>
                    <div class="month-card-footer">
                        <span class="month-card-weight">${data.peso.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg</span>
                        <span class="month-card-percent">${pct}% do total</span>
                    </div>
                `;
                cardsGrid.appendChild(card);
            });

            viewResumo.appendChild(cardsGrid);

            // Detalhes / Tabela de Saídas do Período
            const detailsSec = document.createElement("div");
            detailsSec.className = "month-details-section";
            
            const sortedItems = [...filteredColetas].sort((a, b) => (b.dataColeta || "").localeCompare(a.dataColeta || ""));

            let rowsHtml = sortedItems.map(item => {
                let dataFmt = item.dataColeta || "";
                if (dataFmt.includes("-")) {
                    const [y, m, d] = dataFmt.split("-");
                    dataFmt = `${d}/${m}/${y}`;
                }
                return `
                    <tr>
                        <td style="font-weight: 600;">${dataFmt}</td>
                        <td><span class="badge ${WASTE_METADATA[item.tipoResiduo]?.colorClass || 'badge-emerald'}" style="font-size: 0.75rem; padding: 2px 6px; border-radius: 4px;">${escapeHtml(item.tipoResiduo)}</span></td>
                        <td style="font-weight: 700; color: #047857;">${Number(item.peso).toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg</td>
                        <td>${escapeHtml(item.destino || 'Camarita')}</td>
                        <td style="color: #64748b; font-size: 0.78rem;">${escapeHtml(item.obs || '-')}</td>
                    </tr>
                `;
            }).join("");

            detailsSec.innerHTML = `
                <div class="month-details-header">
                    <span>Lista Detalhada de Saídas (${filteredColetas.length})</span>
                    <small style="color: #64748b; font-weight: normal;">Ordenado por data recente</small>
                </div>
                <div class="month-details-table-wrap">
                    <table class="month-details-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Categoria</th>
                                <th>Peso</th>
                                <th>Destino</th>
                                <th>Observação</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            `;
            viewResumo.appendChild(detailsSec);
        }

        // 2. VISÃO GRÁFICO DE CATEGORIAS (Chart.js Doughnut)
        function renderCategoryChart(categoryMap, totalPeso) {
            if (typeof Chart === "undefined") return;

            const canvas = document.getElementById("ecopontoCategoryChart");
            if (!canvas) return;

            if (ecopontoCatChartInstance) {
                ecopontoCatChartInstance.destroy();
                ecopontoCatChartInstance = null;
            }

            const activeCats = Object.entries(categoryMap).filter(([_, d]) => d.peso > 0);

            if (activeCats.length === 0) {
                const ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }

            const labels = activeCats.map(([cat]) => cat);
            const dataValues = activeCats.map(([_, d]) => d.peso);
            const bgColors = activeCats.map(([_, d]) => d.color);

            const ctx = canvas.getContext("2d");
            ecopontoCatChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: dataValues,
                        backgroundColor: bgColors,
                        borderWidth: 2,
                        borderColor: '#ffffff',
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: {
                                    family: "'Plus Jakarta Sans', sans-serif",
                                    size: 12,
                                    weight: '600'
                                },
                                padding: 15,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const val = context.raw || 0;
                                    const pct = totalPeso > 0 ? ((val / totalPeso) * 100).toFixed(1) : 0;
                                    return ` ${context.label}: ${val.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg (${pct}%)`;
                                }
                            }
                        }
                    },
                    cutout: '62%'
                }
            });
        }

        // 3. VISÃO GRÁFICO EVOLUÇÃO MENSAL (Chart.js Bar)
        function renderEvolutionChart(coletas) {
            if (typeof Chart === "undefined") return;

            const canvas = document.getElementById("ecopontoMonthlyChart");
            if (!canvas) return;

            if (ecopontoMonthChartInstance) {
                ecopontoMonthChartInstance.destroy();
                ecopontoMonthChartInstance = null;
            }

            const monthlyWeights = {};
            coletas.forEach(c => {
                if (c.dataColeta && c.dataColeta.length >= 7) {
                    const mKey = c.dataColeta.substring(0, 7);
                    const p = parseFloat(c.peso) || 0;
                    monthlyWeights[mKey] = (monthlyWeights[mKey] || 0) + p;
                }
            });

            const sortedMonths = Object.keys(monthlyWeights).sort();
            const labels = sortedMonths.map(mKey => {
                const [y, m] = mKey.split("-");
                const mIdx = parseInt(m, 10) - 1;
                const mName = monthNames[mIdx] ? monthNames[mIdx].substring(0, 3) : m;
                return `${mName}/${y.substring(2)}`;
            });
            const values = sortedMonths.map(mKey => monthlyWeights[mKey]);

            const ctx = canvas.getContext("2d");
            ecopontoMonthChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Total Saído (kg)',
                        data: values,
                        backgroundColor: '#10b981',
                        borderRadius: 6,
                        hoverBackgroundColor: '#059669',
                        maxBarThickness: 45
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return value.toLocaleString('pt-BR') + ' kg';
                                },
                                font: {
                                    family: "'Plus Jakarta Sans', sans-serif"
                                }
                            },
                            grid: {
                                color: '#f1f5f9'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    family: "'Plus Jakarta Sans', sans-serif",
                                    weight: '600'
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const val = context.raw || 0;
                                    return ` Total: ${val.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg`;
                                }
                            }
                        }
                    }
                }
            });
        }

        // Exportar CSV do Mês Selecionado
        if (btnExportMonthCsv) {
            btnExportMonthCsv.addEventListener("click", () => {
                const coletas = loadColetas();
                const selectedMonth = selectMonth ? selectMonth.value : "all";

                const filtered = selectedMonth === "all"
                    ? coletas
                    : coletas.filter(c => c.dataColeta && c.dataColeta.startsWith(selectedMonth));

                if (filtered.length === 0) {
                    showToast("Nenhum dado encontrado para exportar neste mês.", "error");
                    return;
                }

                let csvContent = "\uFEFFData;Tipo de Resíduo;Peso (kg);Destino;Observações\n";
                filtered.forEach(item => {
                    let dataFmt = item.dataColeta || "";
                    if (dataFmt.includes("-")) {
                        const [y, m, d] = dataFmt.split("-");
                        dataFmt = `${d}/${m}/${y}`;
                    }
                    const row = [
                        `"${dataFmt}"`,
                        `"${item.tipoResiduo}"`,
                        `"${String(item.peso).replace('.', ',')}"`,
                        `"${(item.destino || '').replace(/"/g, '""')}"`,
                        `"${(item.obs || '').replace(/"/g, '""')}"`
                    ];
                    csvContent += row.join(";") + "\n";
                });

                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `balanco_ecoponto_${selectedMonth}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                showToast(`Balanço exportado com sucesso (${filtered.length} registros)!`, "success");
            });
        }
    }

    // -------------------------------------------------------------
    // 10. INICIALIZAÇÃO
    // -------------------------------------------------------------
    window.renderEcopontoApp = renderApp;
    renderApp();
    setupEcopontoDashboard();
});
