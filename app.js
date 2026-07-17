// URL do Web App gerada no Google Apps Script.
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyVet-1KMR-ORHwrTHIrXs3IWU8ALQW5gNgstcc7gYmE-D_QaBrRU1E8Xtb3j8fC_fF/exec";

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

    // Chamar a busca APÓS as variáveis terem sido declaradas
    fetchTotalCadastros();

    let bairrosData = null; // Guardar dados do grafico
    let bairrosChartInstance = null; // Instancia do grafico

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

        let icon = type === 'success' ? '✅' : '⚠️';

        toast.innerHTML = `
            <span style="font-size: 1.2rem;">${icon}</span>
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
        bairrosData = data.bairrosDist; // Armazena dados dos bairros

        countDisplay.textContent = data.total;
        if (data.totalSacolas !== undefined) {
            sacolasDisplay.textContent = data.totalSacolas * 10;
        } else {
            sacolasDisplay.textContent = data.total * 10;
        }

        if (pessoasDisplay) {
            if (data.totalPessoas !== undefined) {
                pessoasDisplay.textContent = data.totalPessoas;
            } else {
                pessoasDisplay.textContent = "--";
            }
        }
    }

    // Buscar total de cadastros ao carregar a página
    async function fetchTotalCadastros() {
        if (SCRIPT_URL === "COLOQUE_A_URL_DO_SEU_WEB_APP_AQUI") {
            countDisplay.textContent = "Aguardando config...";
            return;
        }

        // Tentar carregar do cache
        const cached = localStorage.getItem('dashboardCache');
        if (cached) {
            try {
                const data = JSON.parse(cached);
                updateDashboardCounters(data);
            } catch (e) { }
        } else {
            // Skeletons
            countDisplay.innerHTML = '<span class="skeleton"></span>';
            sacolasDisplay.innerHTML = '<span class="skeleton"></span>';
            if (pessoasDisplay) pessoasDisplay.innerHTML = '<span class="skeleton"></span>';
        }

        try {
            const response = await fetch(`${SCRIPT_URL}?action=getTotal`);
            const data = await response.json();
            if (data.status === 'success') {
                localStorage.setItem('dashboardCache', JSON.stringify(data));
                updateDashboardCounters(data);
            } else {
                if (!cached) {
                    countDisplay.textContent = "Erro";
                    sacolasDisplay.textContent = "Erro";
                }
            }
        } catch (error) {
            console.error("Erro ao buscar total:", error);
            if (!cached) {
                countDisplay.textContent = "---";
                sacolasDisplay.textContent = "---";
            }
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

    // === Lógica do Dashboard (Gráfico e Mapa) ===
    const btnShowChart = document.getElementById('btn-show-chart');
    const chartModal = document.getElementById('chart-modal');
    const closeChartModal = document.getElementById('close-chart-modal');

    // Controles
    const dashMetric = document.getElementById('dash-metric');
    const btnViewResumo = document.getElementById('btn-view-resumo');
    const btnViewChart = document.getElementById('btn-view-chart');
    const btnViewMap = document.getElementById('btn-view-map');
    const resumoView = document.getElementById('resumo-view');
    const chartView = document.getElementById('chart-view');
    const mapView = document.getElementById('map-view');

    let leafletMap = null;
    let currentMapLayer = null;

    if (btnShowChart) {
        btnShowChart.addEventListener('click', () => {
            if (!bairrosData || Object.keys(bairrosData).length === 0) {
                showToast("Os dados dos bairros ainda não foram carregados ou não existem cadastros.", "error");
                return;
            }
            chartModal.style.display = 'flex';
            updateDashboard();
        });
    }

    if (closeChartModal) {
        closeChartModal.addEventListener('click', () => {
            chartModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === chartModal) {
            chartModal.style.display = 'none';
        }
    });

    // Eventos dos Controles
    dashMetric.addEventListener('change', updateDashboard);

    btnViewResumo.addEventListener('click', () => {
        btnViewResumo.classList.add('active');
        btnViewChart.classList.remove('active');
        btnViewMap.classList.remove('active');
        resumoView.style.display = 'flex';
        chartView.style.display = 'none';
        mapView.style.display = 'none';
        updateDashboard();
    });

    btnViewChart.addEventListener('click', () => {
        btnViewChart.classList.add('active');
        btnViewResumo.classList.remove('active');
        btnViewMap.classList.remove('active');
        chartView.style.display = 'block';
        resumoView.style.display = 'none';
        mapView.style.display = 'none';
        updateDashboard();
    });

    btnViewMap.addEventListener('click', () => {
        btnViewMap.classList.add('active');
        btnViewChart.classList.remove('active');
        btnViewResumo.classList.remove('active');
        mapView.style.display = 'block';
        chartView.style.display = 'none';
        resumoView.style.display = 'none';
        updateDashboard();
    });

    const btnExportCsv = document.getElementById('btn-export-csv');
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', () => {
            if (!bairrosData || Object.keys(bairrosData).length === 0) {
                showToast("Sem dados para exportar.", "error");
                return;
            }
            let csvContent = "\uFEFFBairro,Registros,Pessoas Atendidas,Pacotes Distribuidos,Sacolas Distribuidas\n";
            Object.entries(bairrosData).forEach(([bairro, info]) => {
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
            link.setAttribute("download", "relatorio_bairros.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    function updateDashboard() {
        if (!bairrosData) return;

        const metric = dashMetric.value; // 'pessoas', 'sacolas', 'registros'
        const isMapMode = btnViewMap.classList.contains('active');
        const isResumoMode = btnViewResumo.classList.contains('active');

        if (isMapMode) {
            renderMap(bairrosData, metric);
        } else if (isResumoMode) {
            renderResumo(bairrosData);
        } else {
            renderChart(bairrosData, metric, 'doughnut');
        }
    }

    function renderChart(data, metric, type) {
        const ctx = document.getElementById('bairrosChart').getContext('2d');

        // Determinar o valor baseado na métrica escolhida
        const getMetricValue = (item) => {
            if (typeof item === 'number') return item; // fallback antigo
            return metric === 'sacolas' ? item.sacolas * 10 : item[metric];
        };

        const sortedEntries = Object.entries(data).sort((a, b) => getMetricValue(b[1]) - getMetricValue(a[1]));
        const labels = sortedEntries.map(e => e[0]);
        const values = sortedEntries.map(e => getMetricValue(e[1]));

        if (bairrosChartInstance) {
            bairrosChartInstance.destroy();
        }

        const colors = [
            '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
            '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
            '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000',
            '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080'
        ];

        bairrosChartInstance = new Chart(ctx, {
            type: type,
            data: {
                labels: labels,
                datasets: [{
                    label: dashMetric.options[dashMetric.selectedIndex].text,
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            font: { family: 'Inter', size: 12 },
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.label || '';
                                let rawData = data[label];

                                if (typeof rawData === 'number') {
                                    return `${label}: ${context.raw} registros`;
                                }

                                return [
                                    `Pessoas atendidas: ${rawData.pessoas}`,
                                    `Registros feitos: ${rawData.registros}`,
                                    `Sacolas distrib.: ${rawData.sacolas * 10}`
                                ];
                            }
                        }
                    }
                }
            }
        });
    }

    function renderResumo(data) {
        if (!resumoView) return;

        let totalPessoas = 0;
        let totalSacolas = 0;
        let totalPacotes = 0;
        let totalRegistros = 0;
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

            if (registros > bairroMaisAtivo.max) {
                bairroMaisAtivo = { nome: bairro, max: registros };
            }
        });

        let tableRows = '';
        Object.entries(data).sort((a, b) => {
            const regA = a[1].registros || (typeof a[1] === 'number' ? a[1] : 0);
            const regB = b[1].registros || (typeof b[1] === 'number' ? b[1] : 0);
            return regB - regA;
        }).forEach(([bairro, info]) => {
            const pessoas = info.pessoas || (typeof info === 'number' ? info : 0);
            const pacotes = info.sacolas || 0;
            const sacolas = info.sacolas ? info.sacolas * 10 : 0;
            const registros = info.registros || (typeof info === 'number' ? info : 0);

            tableRows += `
                <tr>
                    <td><strong>${bairro}</strong></td>
                    <td>${registros}</td>
                    <td>${pessoas}</td>
                    <td>${pacotes}</td>
                    <td>${sacolas}</td>
                </tr>
            `;
        });

        resumoView.innerHTML = `
            <div class="resumo-cards-wrapper">
                <div class="resumo-card-info">
                    <h3>Total de Bairros Atendidos</h3>
                    <span class="res-value">${Object.keys(data).length}</span>
                    <span class="res-sub">Locais com entregas</span>
                </div>
                <div class="resumo-card-info">
                    <h3>Bairro Mais Ativo</h3>
                    <span class="res-value" style="font-size: 1.4rem;">${bairroMaisAtivo.nome}</span>
                    <span class="res-sub">${bairroMaisAtivo.max} registros</span>
                </div>
                <div class="resumo-card-info">
                    <h3>Média de Pacotes</h3>
                    <span class="res-value">${totalRegistros > 0 ? Math.round(totalPacotes / totalRegistros) : 0}</span>
                    <span class="res-sub">Pacotes por registro</span>
                </div>
                <div class="resumo-card-info">
                    <h3>Média de Pessoas</h3>
                    <span class="res-value">${totalRegistros > 0 ? (totalPessoas / totalRegistros).toFixed(1) : 0}</span>
                    <span class="res-sub">Pessoas por registro</span>
                </div>
            </div>
            
            <div class="resumo-table-container">
                <table class="resumo-table">
                    <thead>
                        <tr>
                            <th>Bairro</th>
                            <th>Registros</th>
                            <th>Pessoas Atendidas</th>
                            <th>Pacotes Distribuídos</th>
                            <th>Sacolas Distribuídas</th>
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
            let coords = coordenadasBairros[bairro];

            if (!coords) {
                const mappedKey = Object.keys(coordenadasBairros).find(k => k.toLowerCase() === bairro.toLowerCase());
                if (mappedKey) {
                    coords = coordenadasBairros[mappedKey];
                } else {
                    const latOffset = (Math.random() - 0.5) * 0.1;
                    const lngOffset = (Math.random() - 0.5) * 0.1;
                    coords = [-26.3385 + latOffset, -49.9060 + lngOffset];
                }
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
                    <div style="font-family: Inter, sans-serif; min-width: 140px;">
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
