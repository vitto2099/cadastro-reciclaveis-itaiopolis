// URL do Web App gerada no Google Apps Script (Versão Unificada).
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby99-spfhSHDEu9lDo6mQ8IUlz-2k83RHSkDsRk-zh4n4MrGsyJFcJVi5demkNn_Om4/exec";

document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('cadastro-form');
    const docInput = document.getElementById('documento');
    const semDocCheckbox = document.getElementById('sem-documento');
    const docLabel = document.getElementById('documento-label');
    const docHint = document.getElementById('doc-hint');

    const nomeInput = document.getElementById('nome');
    const ruaInput = document.getElementById('rua');
    const numeroInput = document.getElementById('numero');
    const semNumeroCheckbox = document.getElementById('sem-numero');
    const moradoresInput = document.getElementById('moradores');
    const sacolasInput = document.getElementById('sacolas');

    const messageDiv = document.getElementById('form-message');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.querySelector('.btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const countDisplay = document.getElementById('cadastro-count');
    const sacolasDisplay = document.getElementById('sacolas-count');
    const pessoasDisplay = document.getElementById('pessoas-count');

    // Dados históricos consolidados municipais (base inicial garantida)
    const DADOS_HISTORICOS_SACOLAS = {
        total: 280,
        totalSacolas: 288,
        totalPessoas: 1361,
        bairrosDist: {
            "Centro": { "registros": 133, "pessoas": 881, "sacolas": 135 },
            "Vila Nova": { "registros": 46, "pessoas": 144, "sacolas": 50 },
            "Bom Jesus": { "registros": 46, "pessoas": 148, "sacolas": 46 },
            "Interior": { "registros": 29, "pessoas": 112, "sacolas": 31 },
            "Lucena": { "registros": 12, "pessoas": 37, "sacolas": 12 },
            "Paraguaçu": { "registros": 4, "pessoas": 14, "sacolas": 4 },
            "Vila Gaúcha": { "registros": 3, "pessoas": 8, "sacolas": 3 },
            "São Pedro": { "registros": 1, "pessoas": 4, "sacolas": 1 },
            "Vila José Dresseno": { "registros": 1, "pessoas": 4, "sacolas": 1 },
            "São Lourenço": { "registros": 1, "pessoas": 3, "sacolas": 1 },
            "Bom Sucesso": { "registros": 1, "pessoas": 2, "sacolas": 1 },
            "Poço Claro": { "registros": 1, "pessoas": 2, "sacolas": 1 },
            "Distrito": { "registros": 1, "pessoas": 1, "sacolas": 1 },
            "Mafra": { "registros": 1, "pessoas": 1, "sacolas": 1 }
        }
    };

    let bairrosData = DADOS_HISTORICOS_SACOLAS.bairrosDist; // Carrega dados históricos imediatamente
    let bairrosBarChartInstance = null; // Instancia do grafico de barras (Ranking)
    let bairrosDonutChartInstance = null; // Instancia do grafico de rosca (Proporcao)

    // Chamar a busca APÓS as variáveis terem sido declaradas
    fetchTotalCadastros();

    const btnCpf = document.getElementById('btn-cpf');
    const btnCnpj = document.getElementById('btn-cnpj');

    let docType = 'cpf'; // 'cpf' ou 'cnpj'
    const bairroInput = document.getElementById('bairro');
    const bairroBtns = document.querySelectorAll('.bairro-btn');
    const bairroOutroInput = document.getElementById('bairro-outro');

    // === Lógica dos Botões de Bairro ===
    bairroBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            bairroBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            bairroInput.value = btn.dataset.value;

            if (btn.dataset.value === 'Outro') {
                bairroOutroInput.style.display = 'block';
                bairroOutroInput.required = true;
                bairroOutroInput.focus();
            } else {
                bairroOutroInput.style.display = 'none';
                bairroOutroInput.required = false;
                bairroOutroInput.value = '';
            }
        });
    });

    // === Header minimizado ao rolar (com correção de vibração) ===
    const header = document.querySelector('.header');
    let isScrolled = false;

    window.addEventListener('scroll', () => {
        // Usa histerese: ativa ao passar de 50px, mas só desativa se voltar pra menos de 10px.
        // Isso impede a vibração quando a altura da página encolhe e força o scroll de volta.
        if (window.scrollY > 50 && !isScrolled) {
            header.classList.add('scrolled');
            isScrolled = true;
        } else if (window.scrollY < 10 && isScrolled) {
            header.classList.remove('scrolled');
            isScrolled = false;
        }
    });


    // === IMask para CPF/CNPJ ===
    let docMask = null;
    if (typeof IMask !== 'undefined') {
        docMask = IMask(docInput, {
            mask: '000.000.000-00'
        });
    }

    // === Seletor de tipo de documento ===
    btnCpf.addEventListener('click', () => {
        docType = 'cpf';
        btnCpf.classList.add('active');
        btnCnpj.classList.remove('active');
        docLabel.textContent = 'CPF';
        docInput.placeholder = '000.000.000-00';
        if (docMask) {
            docMask.updateOptions({ mask: '000.000.000-00' });
            docMask.value = '';
        }
        if (semDocCheckbox.checked) {
            if (docMask) docMask.value = '000.000.000-00';
            else docInput.value = '000.000.000-00';
        }
    });

    btnCnpj.addEventListener('click', () => {
        docType = 'cnpj';
        btnCnpj.classList.add('active');
        btnCpf.classList.remove('active');
        docLabel.textContent = 'CNPJ';
        docInput.placeholder = '00.000.000/0000-00';
        if (docMask) {
            docMask.updateOptions({ mask: '00.000.000/0000-00' });
            docMask.value = '';
        }
        if (semDocCheckbox.checked) {
            if (docMask) docMask.value = '00.000.000/0000-00';
            else docInput.value = '00.000.000/0000-00';
        }
    });

    // === Checkbox "Sem documento" ===
    semDocCheckbox.addEventListener('change', () => {
        if (semDocCheckbox.checked) {
            docInput.disabled = true;
            if (docType === 'cpf') {
                docInput.value = '000.000.000-00';
            } else {
                docInput.value = '00.000.000/0000-00';
            }
        } else {
            docInput.disabled = false;
            docInput.value = '';
            docInput.focus();
        }
    });

    // === Checkbox "Sem número (S/N)" ===
    semNumeroCheckbox.addEventListener('change', () => {
        if (semNumeroCheckbox.checked) {
            numeroInput.disabled = true;
            numeroInput.value = 'S/N';
        } else {
            numeroInput.disabled = false;
            numeroInput.value = '';
            numeroInput.focus();
        }
    });

    // Máscara manual foi substituída pelo IMask. Se IMask falhar, o fallback será o campo livre.

    // Função para mostrar mensagens (Toasts)
    function showToast(text, type) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            // Fallback se não achar o toast-container
            messageDiv.textContent = text;
            messageDiv.className = `form-message ${type}`;
            messageDiv.style.display = 'block';
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let iconSvg = type === 'success'
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #10b981;"><path d="M20 6 9 17l-5-5"/></svg>`
            : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #f59e0b;"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;

        toast.innerHTML = `
            <span style="display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">${iconSvg}</span>
            <span class="toast-message">${text}</span>
        `;

        toastContainer.appendChild(toast);

        // Remove após 4 segundos
        setTimeout(() => {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 4000);
    }

    function resetFormState() {
        form.reset();

        // Reset CPF/CNPJ
        docType = 'cpf';
        btnCpf.classList.add('active');
        btnCnpj.classList.remove('active');
        docLabel.textContent = 'CPF';
        docInput.placeholder = '000.000.000-00';
        docInput.maxLength = 14;
        docInput.disabled = false;

        // Reset Número S/N
        numeroInput.disabled = false;

        // Reset Bairros
        if (typeof bairroBtns !== 'undefined') {
            bairroBtns.forEach(b => b.classList.remove('active'));
        }
        if (typeof bairroInput !== 'undefined') {
            bairroInput.value = '';
        }
        bairroOutroInput.style.display = 'none';
        bairroOutroInput.required = false;
        bairroOutroInput.value = '';
    }

    // Função para alterar estado de carregamento do botão
    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoader.style.display = 'block';
        } else {
            submitBtn.disabled = false;
            btnText.style.display = 'block';
            btnLoader.style.display = 'none';
        }
    }

    function updateDashboardCounters(data) {
        if (!data) return;
        if (data.bairrosDist) {
            bairrosData = data.bairrosDist;
        }

        if (countDisplay && data.total !== undefined) {
            countDisplay.textContent = Number(data.total).toLocaleString('pt-BR');
        }
        if (sacolasDisplay) {
            if (data.totalSacolas !== undefined) {
                sacolasDisplay.textContent = (Number(data.totalSacolas) * 10).toLocaleString('pt-BR');
            } else if (data.total !== undefined) {
                sacolasDisplay.textContent = (Number(data.total) * 10).toLocaleString('pt-BR');
            }
        }

        if (pessoasDisplay) {
            if (data.totalPessoas !== undefined) {
                pessoasDisplay.textContent = Number(data.totalPessoas).toLocaleString('pt-BR');
            } else {
                pessoasDisplay.textContent = "--";
            }
        }

        updateSacosModalKPIs(bairrosData);
    }

    // Buscar total de cadastros ao carregar a página
    async function fetchTotalCadastros() {
        // Tentar carregar do cache
        const cached = localStorage.getItem('dashboardCache');
        if (cached) {
            try {
                const data = JSON.parse(cached);
                updateDashboardCounters(data);
            } catch (e) {
                updateDashboardCounters(DADOS_HISTORICOS_SACOLAS);
            }
        } else {
            // Inicializa imediatamente com dados municipais consolidados
            updateDashboardCounters(DADOS_HISTORICOS_SACOLAS);
        }

        if (SCRIPT_URL === "COLOQUE_A_URL_DO_SEU_WEB_APP_AQUI") {
            return;
        }

        try {
            const response = await fetch(`${SCRIPT_URL}?action=getTotal`);
            const data = await response.json();
            if (data.status === 'success') {
                localStorage.setItem('dashboardCache', JSON.stringify(data));
                updateDashboardCounters(data);
            }
        } catch (error) {
            console.warn("Aviso ao buscar total em tempo real (usando base local):", error);
        }
    }

    // Submissão do formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (SCRIPT_URL === "COLOQUE_A_URL_DO_SEU_WEB_APP_AQUI") {
            showToast("O sistema ainda não está conectado à planilha do Google. Configure a SCRIPT_URL no arquivo app.js.", "error");
            return;
        }

        // Validação do documento (se não marcou "sem documento")
        const docValue = docInput.value;
        if (!semDocCheckbox.checked) {
            if (docType === 'cpf' && docValue.length < 14) {
                showToast("Por favor, digite um CPF válido com 11 dígitos.", "error");
                return;
            }
            if (docType === 'cnpj' && docValue.length < 18) {
                showToast("Por favor, digite um CNPJ válido com 14 dígitos.", "error");
                return;
            }
        }

        const sacolas = parseInt(sacolasInput.value) || 1;

        const formData = {
            action: 'cadastrar',
            nome: nomeInput.value,
            tipoDocumento: docType.toUpperCase(),
            cpf: docValue,
            endereco: `${ruaInput.value.trim()}, ${numeroInput.value.trim()}`,
            bairro: bairroInput.value === 'Outro' ? bairroOutroInput.value.trim() : bairroInput.value,
            moradores: moradoresInput.value,
            sacolas: sacolas
        };

        setLoading(true);
        messageDiv.style.display = 'none';

        try {
            const params = new URLSearchParams();
            for (const key in formData) {
                params.append(key, formData[key]);
            }

            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: params,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });

            const result = await response.json();

            if (result.status === 'success') {
                showToast(`Entrega registrada com sucesso! ${sacolas * 10} sacolas contabilizadas.`, "success");
                resetFormState();
                fetchTotalCadastros(); // Atualiza contador
            } else {
                showToast(result.message || "Erro desconhecido ao cadastrar.", "error");
            }
        } catch (error) {
            console.error("Erro no envio:", error);
            showToast("Erro de comunicação com o servidor. Tente novamente.", "error");
        } finally {
            setLoading(false);
        }
    });

    // === Lógica do Calendário ===
    const calendarDays = document.getElementById('calendar-days');
    const currentMonthDisplay = document.getElementById('current-month-display');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const collectionInfo = document.getElementById('collection-info');

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    function getCollectionForDate(year, month, day) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay(); // 0 = Dom, 1 = Seg...

        // Calcula qual semana do mês é aquele dia da semana
        let count = 0;
        for (let i = 1; i <= day; i++) {
            if (new Date(year, month, i).getDay() === dayOfWeek) {
                count++;
            }
        }
        const nthWeek = count;

        // Regras de coleta baseadas no calendário do município
        if (dayOfWeek === 4) { // Quinta
            return "CENTRO, BAIRRO VILA GAÚCHA (JOSÉ DRESSENO)";
        }
        if (dayOfWeek === 5) { // Sexta
            return "CENTRO, BAIRRO LUCENA, BAIRRO VILA NOVA, BAIRRO NOVA BRASÍLIA, PARAGUAÇU";
        }
        if (dayOfWeek === 6) { // Sábado
            return "BAIRRO BOM JESUS";
        }
        if (dayOfWeek === 1) { // Segunda
            if (nthWeek === 1) return "CONTAGEM WORELL, BR 116, AV. PRES. TANCREDO NEVES, AV. GETÚLIO VARGAS, RUA CARLOS GLOTOB LINK, RUA PAULO HEYSE FILHO";
            if (nthWeek === 2) return "POÇO CLARO, RIO VERMELHO I E II, AV. PRES. TANCREDO NEVES, RUA SERAFIM FURTADO DE MELO, RUA PAULO HEYSE FILHO";
        }
        if (dayOfWeek === 2) { // Terça
            // 1ª Terça-feira dos meses ímpares (que têm índice par no JS: Jan=0, Mar=2, Mai=4, Jul=6, Set=8, Nov=10)
            if (nthWeek === 1 && (month % 2 === 0)) {
                return "RUA PRES. COSTA E SILVA, AV. ALEXANDRE RICARDO WORELL, SC 477 ITAIÓ, VOLTA TRISTE, VONTROBA, SERRINHA DO ITAJAÍ";
            }
        }
        if (dayOfWeek === 3) { // Quarta
            if (nthWeek === 1) return "RUA PRES. COSTA E SILVA, AV. ALEXANDRE RICARDO WORELL, SC 477 ITAIÓ, SC 477 MOEMA";
            if (nthWeek === 3) return "RUA PRES. COSTA E SILVA, SÃO PEDRO, SANTO ANTÔNIO, SÃO JOÃO, SC 477 IRACEMA ATÉ SÍTIO COLORADO";
        }

        return null;
    }

    function renderCalendar(year, month) {
        calendarDays.innerHTML = '';
        currentMonthDisplay.textContent = `${monthNames[month]} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.classList.add('calendar-day', 'empty');
            calendarDays.appendChild(emptyDiv);
        }

        const today = new Date();
        let selectedDayDiv = null;

        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('calendar-day');
            dayDiv.textContent = day;

            const collection = getCollectionForDate(year, month, day);
            if (collection) {
                dayDiv.classList.add('has-collection');
            }

            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                dayDiv.classList.add('today');
                selectedDayDiv = dayDiv;
                showCollectionDetails(year, month, day, collection, dayDiv);
            }

            dayDiv.addEventListener('click', () => {
                showCollectionDetails(year, month, day, collection, dayDiv);
            });

            calendarDays.appendChild(dayDiv);
        }

        // Se não selecionou o dia atual (pq é outro mês), seleciona o dia 1
        if (!selectedDayDiv) {
            const firstValidDay = calendarDays.querySelector('.calendar-day:not(.empty)');
            if (firstValidDay) {
                const day = 1;
                const collection = getCollectionForDate(year, month, day);
                showCollectionDetails(year, month, day, collection, firstValidDay);
            }
        }
    }

    function showCollectionDetails(year, month, day, collection, dayElement) {
        if (dayElement) {
            document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
            dayElement.classList.add('selected');
        }
        selectedDateDisplay.textContent = `${day} de ${monthNames[month]} de ${year}`;

        if (collection) {
            const bairros = collection.split(',').map(b => b.trim());
            let htmlList = '<ul style="padding-left: 20px; margin-top: 8px;">';
            bairros.forEach(b => {
                htmlList += `<li style="margin-bottom: 4px;">${b}</li>`;
            });
            htmlList += '</ul>';
            collectionInfo.innerHTML = `<strong>Coleta nos locais:</strong>${htmlList}`;
        } else {
            collectionInfo.innerHTML = "Não há coleta seletiva programada para este dia.";
        }
    }

    if (prevMonthBtn && nextMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar(currentYear, currentMonth);
        });

        nextMonthBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar(currentYear, currentMonth);
        });

        renderCalendar(currentYear, currentMonth);
    }

    // === Coordenadas Aproximadas (Itaiópolis) ===
    const coordenadasBairros = {
        // --- NÚCLEO URBANO (Centro e arredores próximos) ---
        "Centro": [-26.3385, -49.9060],
        "Bom Jesus": [-26.3280, -49.9060], // Norte do centro
        "Vila Nova": [-26.3500, -49.9050], // Sul do centro
        "Lucena": [-26.3650, -49.9050],    // Mais ao sul
        "Paraguaçu": [-26.3872, -49.9152], // Sul / Histórico

        // --- INTERIOR / ZONA RURAL (Espalhados em um raio mais curto, ~15km do centro) ---
        "Mafra": [-26.2000, -49.8500],            // Norte/Nordeste (Outra cidade)
        "São João": [-26.2500, -49.9060],         // Norte
        "Rio Vermelho": [-26.2800, -49.8000],     // Nordeste
        "São Pedro": [-26.3100, -49.8400],        // Leste/Nordeste (Mais próximo)
        "Poço Claro": [-26.3385, -49.7800],       // Leste
        "Vontroba": [-26.3800, -49.8000],         // Sudeste
        "Volta Triste": [-26.4200, -49.8200],     // Sudeste distante
        "Serrinha do Itajaí": [-26.4500, -49.9060], // Sul
        "Nova Brasília": [-26.4200, -49.9600],    // Sudoeste
        "José Dresseno": [-26.3800, -50.0000],    // Oeste/Sudoeste
        "Vila Gaúcha": [-26.3385, -50.0200],      // Oeste
        "Contagem Worell": [-26.2800, -50.0200],  // Noroeste/Oeste
        "Santo Antônio": [-26.2500, -49.9800],    // Noroeste
        "Interior": [-26.3385, -50.0500],         // Oeste Genérico
        "Interior / Zona Rural": [-26.3385, -50.0500]
    };

    // Helper para escapar strings HTML
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Atualiza os Mini-KPIs no topo do modal de sacolas
    function updateSacosModalKPIs(data) {
        if (!data) return;
        let totalPessoas = 0;
        let totalSacolas = 0;
        let totalRegistros = 0;
        let maxReg = -1;
        let topBairro = '--';

        Object.entries(data).forEach(([bairro, info]) => {
            const p = info.pessoas || (typeof info === 'number' ? info : 0);
            const s = info.sacolas ? info.sacolas * 10 : 0;
            const r = info.registros || (typeof info === 'number' ? info : 0);

            totalPessoas += p;
            totalSacolas += s;
            totalRegistros += r;

            if (r > maxReg) {
                maxReg = r;
                topBairro = bairro;
            }
        });

        const kpiSacolas = document.getElementById('dash-sacos-kpi-sacolas');
        const kpiPessoas = document.getElementById('dash-sacos-kpi-pessoas');
        const kpiTopBairro = document.getElementById('dash-sacos-kpi-bairro-top');
        const kpiTotalBairros = document.getElementById('dash-sacos-kpi-total-bairros');

        if (kpiSacolas) kpiSacolas.textContent = totalSacolas.toLocaleString('pt-BR');
        if (kpiPessoas) kpiPessoas.textContent = totalPessoas.toLocaleString('pt-BR');
        if (kpiTopBairro) kpiTopBairro.textContent = topBairro;
        if (kpiTotalBairros) kpiTotalBairros.textContent = Object.keys(data).length;
    }

    // === Lógica do Dashboard (Gráfico e Mapa) ===
    const btnShowChart = document.getElementById('btn-show-chart');
    const chartModal = document.getElementById('chart-modal');
    const closeChartModal = document.getElementById('close-chart-modal');

    // Controles
    const dashMetric = document.getElementById('dash-metric');
    const btnViewBars = document.getElementById('btn-view-chart-bars') || document.getElementById('btn-view-chart');
    const btnViewDonut = document.getElementById('btn-view-chart-donut');
    const btnViewResumo = document.getElementById('btn-view-resumo');
    const btnViewMap = document.getElementById('btn-view-map');

    const chartViewBars = document.getElementById('chart-view-bars') || document.getElementById('chart-view');
    const chartViewDonut = document.getElementById('chart-view-donut');
    const resumoView = document.getElementById('resumo-view');
    const mapView = document.getElementById('map-view');

    let leafletMap = null;
    let currentMapLayer = null;

    function openDashboardModal() {
        if (!bairrosData || Object.keys(bairrosData).length === 0) {
            bairrosData = DADOS_HISTORICOS_SACOLAS.bairrosDist;
        }
        if (chartModal) {
            chartModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            updateDashboard();
        }
    }

    function closeDashboardModal() {
        if (chartModal) {
            chartModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    if (btnShowChart) {
        btnShowChart.addEventListener('click', openDashboardModal);
    }

    if (closeChartModal) {
        closeChartModal.addEventListener('click', closeDashboardModal);
    }

    if (chartModal) {
        chartModal.addEventListener('click', (e) => {
            if (e.target === chartModal) closeDashboardModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chartModal && chartModal.style.display === 'flex') {
            closeDashboardModal();
        }
    });

    // Alternância de Abas (Ranking, Proporção, Resumo, Mapa)
    function setActiveDashTab(tab) {
        if (btnViewBars) btnViewBars.classList.toggle('active', tab === 'bars');
        if (btnViewDonut) btnViewDonut.classList.toggle('active', tab === 'donut');
        if (btnViewResumo) btnViewResumo.classList.toggle('active', tab === 'resumo');
        if (btnViewMap) btnViewMap.classList.toggle('active', tab === 'map');

        if (chartViewBars) chartViewBars.style.display = tab === 'bars' ? 'block' : 'none';
        if (chartViewDonut) chartViewDonut.style.display = tab === 'donut' ? 'block' : 'none';
        if (resumoView) resumoView.style.display = tab === 'resumo' ? 'flex' : 'none';
        if (mapView) mapView.style.display = tab === 'map' ? 'block' : 'none';

        updateDashboard();

        if (tab === 'map' && leafletMap) {
            setTimeout(() => {
                leafletMap.invalidateSize();
            }, 250);
        }
    }

    if (btnViewBars) btnViewBars.addEventListener('click', () => setActiveDashTab('bars'));
    if (btnViewDonut) btnViewDonut.addEventListener('click', () => setActiveDashTab('donut'));
    if (btnViewResumo) btnViewResumo.addEventListener('click', () => setActiveDashTab('resumo'));
    if (btnViewMap) btnViewMap.addEventListener('click', () => setActiveDashTab('map'));

    if (dashMetric) {
        dashMetric.addEventListener('change', updateDashboard);
    }

    const btnExportCsv = document.getElementById('btn-export-csv');
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', () => {
            const dataToExport = bairrosData || DADOS_HISTORICOS_SACOLAS.bairrosDist;
            let csvContent = "\uFEFFBairro,Registros,Munícipes Atendidos,Pacotes Distribuídos,Sacolas Distribuídas\n";
            Object.entries(dataToExport).forEach(([bairro, info]) => {
                const pessoas = info.pessoas || (typeof info === 'number' ? info : 0);
                const pacotes = info.sacolas || 0;
                const sacolas = info.sacolas ? info.sacolas * 10 : 0;
                const registros = info.registros || (typeof info === 'number' ? info : 0);
                csvContent += `"${bairro}",${registros},${pessoas},${pacotes},${sacolas}\n`;
            });
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "relatorio_distribuicao_sacolas.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    function updateDashboard() {
        const data = bairrosData || DADOS_HISTORICOS_SACOLAS.bairrosDist;
        if (!data) return;

        updateSacosModalKPIs(data);
        const metric = dashMetric ? dashMetric.value : 'pessoas';

        if (btnViewMap && btnViewMap.classList.contains('active')) {
            renderMap(data, metric);
        } else if (btnViewResumo && btnViewResumo.classList.contains('active')) {
            renderResumo(data, metric);
        } else if (btnViewDonut && btnViewDonut.classList.contains('active')) {
            renderDonutChart(data, metric);
        } else {
            renderBarChart(data, metric);
        }
    }

    // 1. VISÃO GRÁFICO DE BARRAS HORIZONTAIS (Ranking ordenado)
    function renderBarChart(data, metric) {
        const canvas = document.getElementById('bairrosBarChart');
        if (!canvas || typeof Chart === 'undefined') return;

        if (bairrosBarChartInstance) {
            bairrosBarChartInstance.destroy();
            bairrosBarChartInstance = null;
        }

        const getMetricValue = (item) => {
            if (typeof item === 'number') return item;
            return metric === 'sacolas' ? (item.sacolas * 10) : (item[metric] || 0);
        };

        const sortedEntries = Object.entries(data).sort((a, b) => getMetricValue(b[1]) - getMetricValue(a[1]));
        const labels = sortedEntries.map(e => e[0]);
        const values = sortedEntries.map(e => getMetricValue(e[1]));

        const metricLabels = {
            'pessoas': 'Munícipes Atendidos',
            'sacolas': 'Sacolas Distribuídas',
            'registros': 'Registros Feitos'
        };
        const currentLabel = metricLabels[metric] || 'Quantidade';

        const isDark = document.body.classList.contains('dark-theme');
        const textColor = isDark ? '#cbd5e1' : '#334155';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

        // Degradê profissional: 1º lugar vibrante, top 3 em destaque, restante em tom coeso
        const backgroundColors = values.map((_, idx) => {
            if (idx === 0) return '#2563eb'; // 1º lugar: Azul Royal
            if (idx === 1) return '#3b82f6'; // 2º lugar
            if (idx === 2) return '#60a5fa'; // 3º lugar
            if (idx < 6) return '#93c5fd';
            return isDark ? '#475569' : '#cbd5e1';
        });

        const ctx = canvas.getContext('2d');
        bairrosBarChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: currentLabel,
                    data: values,
                    backgroundColor: backgroundColors,
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.75,
                    categoryPercentage: 0.85
                }]
            },
            options: {
                indexAxis: 'y', // Barras horizontais para clareza máxima dos nomes
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1e293b' : '#0f172a',
                        titleColor: '#ffffff',
                        bodyColor: '#e2e8f0',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const rawData = data[label];
                                if (!rawData || typeof rawData === 'number') {
                                    return ` ${context.formattedValue} ${currentLabel.toLowerCase()}`;
                                }
                                return [
                                    ` ${currentLabel}: ${Number(context.raw).toLocaleString('pt-BR')}`,
                                    ` Munícipes Atendidos: ${Number(rawData.pessoas).toLocaleString('pt-BR')}`,
                                    ` Sacolas Distribuídas: ${Number(rawData.sacolas * 10).toLocaleString('pt-BR')}`,
                                    ` Registros Realizados: ${Number(rawData.registros).toLocaleString('pt-BR')}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: gridColor
                        },
                        ticks: {
                            color: textColor,
                            font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' }
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: textColor,
                            font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' }
                        }
                    }
                }
            }
        });
    }

    // 2. VISÃO GRÁFICO DE ROSCA / PROPORÇÃO (Top 5 + Demais)
    function renderDonutChart(data, metric) {
        const canvas = document.getElementById('bairrosDonutChart');
        if (!canvas || typeof Chart === 'undefined') return;

        if (bairrosDonutChartInstance) {
            bairrosDonutChartInstance.destroy();
            bairrosDonutChartInstance = null;
        }

        const getMetricValue = (item) => {
            if (typeof item === 'number') return item;
            return metric === 'sacolas' ? (item.sacolas * 10) : (item[metric] || 0);
        };

        const sortedEntries = Object.entries(data).sort((a, b) => getMetricValue(b[1]) - getMetricValue(a[1]));
        const topEntries = sortedEntries.slice(0, 5);
        const otherEntries = sortedEntries.slice(5);

        const labels = topEntries.map(e => e[0]);
        const values = topEntries.map(e => getMetricValue(e[1]));

        if (otherEntries.length > 0) {
            const othersSum = otherEntries.reduce((acc, curr) => acc + getMetricValue(curr[1]), 0);
            labels.push(`Demais Bairros (${otherEntries.length})`);
            values.push(othersSum);
        }

        const colors = [
            '#2563eb', // Azul Royal
            '#10b981', // Verde Esmeralda
            '#f59e0b', // Âmbar
            '#8b5cf6', // Roxo
            '#06b6d4', // Ciano
            '#94a3b8'  // Cinza Suave
        ];

        const isDark = document.body.classList.contains('dark-theme');
        const legendTextColor = isDark ? '#e2e8f0' : '#334155';

        const ctx = canvas.getContext('2d');
        bairrosDonutChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: isDark ? '#1e293b' : '#ffffff',
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: legendTextColor,
                            font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
                            padding: 14,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1e293b' : '#0f172a',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const val = context.raw || 0;
                                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
                                return ` ${context.label}: ${val.toLocaleString('pt-BR')} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // 3. VISÃO RESUMO (Tabela Executiva com Medalhas e Barra de Progresso)
    function renderResumo(data, metric) {
        if (!resumoView) return;

        const getMetricValue = (item) => {
            if (typeof item === 'number') return item;
            return metric === 'sacolas' ? (item.sacolas * 10) : (item[metric] || 0);
        };

        let totalPessoas = 0;
        let totalSacolas = 0;
        let totalPacotes = 0;
        let totalRegistros = 0;
        let maxReg = -1;
        let bairroMaisAtivo = { nome: '-', max: -1 };

        Object.entries(data).forEach(([bairro, info]) => {
            const pessoas = info.pessoas || (typeof info === 'number' ? info : 0);
            const pacotes = info.sacolas || 0;
            const sacolas = info.sacolas ? info.sacolas * 10 : 0;
            const registros = info.registros || (typeof info === 'number' ? info : 0);

            totalPessoas += pessoas;
            totalSacolas += sacolas;
            totalPacotes += pacotes;
            totalRegistros += registros;

            if (registros > maxReg) {
                maxReg = registros;
                bairroMaisAtivo = { nome: bairro, max: registros };
            }
        });

        const sorted = Object.entries(data).sort((a, b) => getMetricValue(b[1]) - getMetricValue(a[1]));
        const totalMetric = sorted.reduce((acc, curr) => acc + getMetricValue(curr[1]), 0);

        let tableRows = '';
        sorted.forEach(([bairro, info], index) => {
            const pessoas = info.pessoas || (typeof info === 'number' ? info : 0);
            const pacotes = info.sacolas || 0;
            const sacolas = info.sacolas ? info.sacolas * 10 : 0;
            const registros = info.registros || (typeof info === 'number' ? info : 0);
            const val = getMetricValue(info);
            const pct = totalMetric > 0 ? ((val / totalMetric) * 100).toFixed(1) : '0.0';

            let rankBadge = `<span class="rank-badge rank-default">${index + 1}º</span>`;
            let barColor = '#3b82f6';
            if (index === 0) {
                rankBadge = `<span class="rank-badge rank-1">🥇 1º</span>`;
                barColor = '#eab308';
            } else if (index === 1) {
                rankBadge = `<span class="rank-badge rank-2">🥈 2º</span>`;
                barColor = '#94a3b8';
            } else if (index === 2) {
                rankBadge = `<span class="rank-badge rank-3">🥉 3º</span>`;
                barColor = '#f97316';
            }

            tableRows += `
                <tr>
                    <td style="width: 55px;">${rankBadge}</td>
                    <td><strong>${escapeHtml(bairro)}</strong></td>
                    <td style="font-weight: 600; color: #10b981;">${pessoas.toLocaleString('pt-BR')}</td>
                    <td style="font-weight: 700; color: #2563eb;">${sacolas.toLocaleString('pt-BR')}</td>
                    <td>${registros.toLocaleString('pt-BR')}</td>
                    <td style="min-width: 130px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 700; margin-bottom: 3px;">
                            <span>${pct}%</span>
                        </div>
                        <div class="resumo-progress-bg">
                            <div class="resumo-progress-fill" style="width: ${pct}%; background-color: ${barColor};"></div>
                        </div>
                    </td>
                </tr>
            `;
        });

        resumoView.innerHTML = `
            <div class="resumo-cards-wrapper">
                <div class="resumo-card-info">
                    <h3>Bairros Atendidos</h3>
                    <span class="res-value">${Object.keys(data).length}</span>
                    <span class="res-sub">Comunidades ativas</span>
                </div>
                <div class="resumo-card-info">
                    <h3>Bairro Mais Ativo</h3>
                    <span class="res-value" style="font-size: 1.35rem;">${escapeHtml(bairroMaisAtivo.nome)}</span>
                    <span class="res-sub">${bairroMaisAtivo.max} registros</span>
                </div>
                <div class="resumo-card-info">
                    <h3>Média de Sacolas</h3>
                    <span class="res-value">${totalRegistros > 0 ? (totalSacolas / totalRegistros).toFixed(1) : 0}</span>
                    <span class="res-sub">Sacolas por família</span>
                </div>
                <div class="resumo-card-info">
                    <h3>Média de Munícipes</h3>
                    <span class="res-value">${totalRegistros > 0 ? (totalPessoas / totalRegistros).toFixed(1) : 0}</span>
                    <span class="res-sub">Pessoas por domicílio</span>
                </div>
            </div>
            
            <div class="resumo-table-container">
                <table class="resumo-table">
                    <thead>
                        <tr>
                            <th style="width: 55px;">Pos.</th>
                            <th>Bairro</th>
                            <th>Munícipes</th>
                            <th>Sacolas</th>
                            <th>Registros</th>
                            <th>Participação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderMap(data, metric) {
        if (!leafletMap) {
            // Inicializa no centro de Itaiópolis com zoom ajustado para uma visão de ~30km (zoom 12)
            leafletMap = L.map('bairrosMap').setView([-26.3385, -49.9060], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(leafletMap);
        }

        // Limpa camada anterior (Voronoi)
        if (currentMapLayer) {
            leafletMap.removeLayer(currentMapLayer);
        }

        const features = [];
        const colors = [
            '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
            '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
            '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000',
            '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080'
        ];
        let colorIndex = 0;

        Object.entries(data).forEach(([bairro, info]) => {
            let baseCoords = coordenadasBairros[bairro];
            let coords;

            if (!baseCoords) {
                const mappedKey = Object.keys(coordenadasBairros).find(k => k.toLowerCase() === bairro.toLowerCase());
                if (mappedKey) {
                    baseCoords = coordenadasBairros[mappedKey];
                }
            }

            if (baseCoords) {
                // Adiciona um micro-offset aleatório para evitar pontos exatamente sobrepostos
                // que fazem o algoritmo de Voronoi quebrar (ex: 'Interior' e 'Interior / Zona Rural')
                const latOffset = (Math.random() - 0.5) * 0.0005;
                const lngOffset = (Math.random() - 0.5) * 0.0005;
                coords = [baseCoords[0] + latOffset, baseCoords[1] + lngOffset];
            } else {
                const latOffset = (Math.random() - 0.5) * 0.1;
                const lngOffset = (Math.random() - 0.5) * 0.1;
                coords = [-26.3385 + latOffset, -49.9060 + lngOffset];
            }

            // Turf Point. Turf requires coordinates in [longitude, latitude]
            features.push(turf.point([coords[1], coords[0]], {
                bairro: bairro,
                pessoas: info.pessoas || (typeof info === 'number' ? info : 0),
                sacolas: info.sacolas ? info.sacolas * 10 : (typeof info === 'number' ? '?' : 0),
                registros: info.registros || (typeof info === 'number' ? info : 0),
                color: colors[colorIndex % colors.length]
            }));
            colorIndex++;
        });

        // Caso haja apenas 1 ponto, Voronoi não funciona. Adiciona pontos falsos invisíveis mais próximos.
        if (features.length < 3) {
            features.push(turf.point([-50.1, -26.3], { dummy: true }));
            features.push(turf.point([-49.7, -26.5], { dummy: true }));
            features.push(turf.point([-49.5, -26.2], { dummy: true }));
        }

        const pointCollection = turf.featureCollection(features);

        // Caixa de contorno ampla para o cálculo inicial
        const options = {
            bbox: [-50.5, -26.8, -49.3, -25.8]
        };

        let voronoiPolygons;
        try {
            voronoiPolygons = turf.voronoi(pointCollection, options);
        } catch (e) {
            console.error("Erro ao gerar Voronoi", e);
            return; // Fallback ou ignora se der erro matemático
        }

        // Criar uma máscara circular de 20km ao redor de Itaiópolis para cortar o quadrado
        const centerPoint = turf.point([-49.9060, -26.3385]);
        const maskCircle = turf.circle(centerPoint, 20, { units: 'kilometers', steps: 64 });

        // Turf Voronoi devolve na mesma ordem. Aplicamos o corte (intersect) para arredondar as bordas
        if (voronoiPolygons && voronoiPolygons.features) {
            const finalFeatures = [];
            for (let i = 0; i < voronoiPolygons.features.length; i++) {
                let feature = voronoiPolygons.features[i];
                if (feature) {
                    try {
                        const clipped = turf.intersect(feature, maskCircle);
                        if (clipped) {
                            clipped.properties = pointCollection.features[i].properties;
                            finalFeatures.push(clipped);
                        }
                    } catch (e) {
                        // Se falhar o recorte matemático, mantém a original
                        feature.properties = pointCollection.features[i].properties;
                        finalFeatures.push(feature);
                    }
                }
            }
            voronoiPolygons.features = finalFeatures;
        }

        // Renderização L.geoJSON
        currentMapLayer = L.geoJSON(voronoiPolygons, {
            style: function (feature) {
                if (feature.properties.dummy) return { opacity: 0, fillOpacity: 0 };

                return {
                    color: '#ffffff', // borda branca
                    weight: 2,
                    fillColor: feature.properties.color, // Usa a cor da paleta sempre
                    fillOpacity: 0.35 // Bem franquinho para ver o mapa por baixo
                };
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties.dummy) return;
                const props = feature.properties;

                const tooltipContent = `
                    <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 140px;">
                        <h3 style="margin: 0 0 5px 0; color: ${props.color};">${props.bairro}</h3>
                        <p style="margin: 0; font-size: 0.95rem;">Pessoas: <strong>${props.pessoas}</strong></p>
                        <p style="margin: 0; font-size: 0.95rem;">Sacolas: <strong>${props.sacolas}</strong></p>
                        <p style="margin: 0; font-size: 0.95rem;">Registros: <strong>${props.registros}</strong></p>
                    </div>
                `;

                layer.bindTooltip(tooltipContent, {
                    sticky: true,
                    className: 'custom-voronoi-tooltip'
                });

                // Efeito Hover
                layer.on({
                    mouseover: function (e) {
                        const l = e.target;
                        l.setStyle({
                            weight: 3,
                            color: '#ffffff',
                            fillOpacity: 0.75 // Fica mais forte no hover
                        });
                        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                            l.bringToFront();
                        }
                    },
                    mouseout: function (e) {
                        currentMapLayer.resetStyle(e.target);
                    }
                });
            }
        }).addTo(leafletMap);

        // Força resize para evitar glitch no mapa dentro de modal escondido
        setTimeout(() => leafletMap.invalidateSize(), 100);
    }
});
