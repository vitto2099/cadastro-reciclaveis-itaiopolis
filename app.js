// URL do Web App gerada no Google Apps Script.
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzr0AMBlExnwvOkBT4C26WKkLKbzGElFoOFVLMa_xMARu_o7wMbf8WkLfnIw8S_DWNP/exec";

document.addEventListener('DOMContentLoaded', () => {
    fetchTotalCadastros();


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

    const btnCpf = document.getElementById('btn-cpf');
    const btnCnpj = document.getElementById('btn-cnpj');

    let docType = 'cpf'; // 'cpf' ou 'cnpj'
    const bairroInput = document.getElementById('bairro');
    const bairroButtons = document.querySelectorAll('.bairro-btn');

    // === Botões rápidos de bairro ===
    bairroButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            bairroButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            bairroInput.value = btn.getAttribute('data-bairro');
        });
    });

    // Se digitar no campo, desseleciona os botões
    bairroInput.addEventListener('input', () => {
        const val = bairroInput.value.trim().toLowerCase();
        let matched = false;
        bairroButtons.forEach(b => {
            if (b.getAttribute('data-bairro').toLowerCase() === val) {
                b.classList.add('active');
                matched = true;
            } else {
                b.classList.remove('active');
            }
        });
    });


    // === Seletor de tipo de documento ===
    btnCpf.addEventListener('click', () => {
        docType = 'cpf';
        btnCpf.classList.add('active');
        btnCnpj.classList.remove('active');
        docLabel.textContent = 'CPF';
        docInput.placeholder = '000.000.000-00';
        docInput.maxLength = 14;
        docInput.value = '';
        if (semDocCheckbox.checked) {
            docInput.value = '000.000.000-00';
        }
    });

    btnCnpj.addEventListener('click', () => {
        docType = 'cnpj';
        btnCnpj.classList.add('active');
        btnCpf.classList.remove('active');
        docLabel.textContent = 'CNPJ';
        docInput.placeholder = '00.000.000/0000-00';
        docInput.maxLength = 18;
        docInput.value = '';
        if (semDocCheckbox.checked) {
            docInput.value = '00.000.000/0000-00';
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

    // === Máscara de CPF / CNPJ ===
    docInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');

        if (docType === 'cpf') {
            if (value.length > 11) value = value.slice(0, 11);

            if (value.length > 9) {
                value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4');
            } else if (value.length > 6) {
                value = value.replace(/^(\d{3})(\d{3})(\d{3}).*/, '$1.$2.$3');
            } else if (value.length > 3) {
                value = value.replace(/^(\d{3})(\d{3}).*/, '$1.$2');
            }
        } else {
            // CNPJ: 00.000.000/0000-00
            if (value.length > 14) value = value.slice(0, 14);

            if (value.length > 12) {
                value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5');
            } else if (value.length > 8) {
                value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4}).*/, '$1.$2.$3/$4');
            } else if (value.length > 5) {
                value = value.replace(/^(\d{2})(\d{3})(\d{3}).*/, '$1.$2.$3');
            } else if (value.length > 2) {
                value = value.replace(/^(\d{2})(\d{3}).*/, '$1.$2');
            }
        }

        e.target.value = value;
    });

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
        bairroButtons.forEach(b => b.classList.remove('active'));
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

    // Buscar total de cadastros ao carregar a página
    async function fetchTotalCadastros() {
        if (SCRIPT_URL === "COLOQUE_A_URL_DO_SEU_WEB_APP_AQUI") {
            countDisplay.textContent = "Aguardando config...";
            return;
        }

        try {
            const response = await fetch(`${SCRIPT_URL}?action=getTotal`);
            const data = await response.json();
            if (data.status === 'success') {
                countDisplay.textContent = data.total;
                // Se o backend retornar total de sacolas, mostra; senão mostra "--"
                // Multiplica por 10 conforme regra de negócio (1 kit = 10 sacolas)
                if (data.totalSacolas !== undefined) {
                    sacolasDisplay.textContent = data.totalSacolas * 10;
                } else {
                    sacolasDisplay.textContent = data.total * 10; // Fallback: usa total de cadastros
                }
                
                if (pessoasDisplay) {
                    if (data.totalPessoas !== undefined) {
                        pessoasDisplay.textContent = data.totalPessoas;
                    } else {
                        pessoasDisplay.textContent = "--";
                    }
                }
            } else {
                countDisplay.textContent = "Erro";
                sacolasDisplay.textContent = "Erro";
            }
        } catch (error) {
            console.error("Erro ao buscar total:", error);
            countDisplay.textContent = "---";
            sacolasDisplay.textContent = "---";
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
            bairro: bairroInput.value.trim(),
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

});
