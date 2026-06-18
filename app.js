// URL do Web App gerada no Google Apps Script.
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyO5ely0D9yiSlOSupZ-oDEnT-dBKWIr_Pvlz-sB3kk0Nl_X-PG1KM4t2UGXcsUz3Ac/exec";

document.addEventListener('DOMContentLoaded', () => {
    fetchTotalCadastros();


    const form = document.getElementById('cadastro-form');
    const docInput = document.getElementById('documento');
    const semDocCheckbox = document.getElementById('sem-documento');
    const docLabel = document.getElementById('documento-label');
    const docHint = document.getElementById('doc-hint');
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

    // Função para mostrar mensagens
    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `form-message ${type}`;
        messageDiv.style.display = 'block';
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
                if (data.totalSacolas !== undefined) {
                    sacolasDisplay.textContent = data.totalSacolas;
                } else {
                    sacolasDisplay.textContent = data.total; // Fallback: usa total de cadastros
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
            showMessage("O sistema ainda não está conectado à planilha do Google. Configure a SCRIPT_URL no arquivo app.js.", "error");
            return;
        }

        // Validação do documento (se não marcou "sem documento")
        const docValue = docInput.value;
        if (!semDocCheckbox.checked) {
            if (docType === 'cpf' && docValue.length < 14) {
                showMessage("Por favor, digite um CPF válido com 11 dígitos.", "error");
                return;
            }
            if (docType === 'cnpj' && docValue.length < 18) {
                showMessage("Por favor, digite um CNPJ válido com 14 dígitos.", "error");
                return;
            }
        }

        const sacolas = parseInt(document.getElementById('sacolas').value) || 1;

        const formData = {
            action: 'cadastrar',
            nome: document.getElementById('nome').value,
            tipoDocumento: docType.toUpperCase(),
            cpf: docValue,
            endereco: `${document.getElementById('rua').value.trim()}, ${document.getElementById('numero').value.trim()}`,
            bairro: bairroInput.value.trim(),
            moradores: document.getElementById('moradores').value,
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
                showMessage(`Cadastro realizado com sucesso! ${sacolas} sacola(s) registrada(s).`, "success");
                form.reset();
                // Resetar estado dos botões de tipo de documento
                docType = 'cpf';
                btnCpf.classList.add('active');
                btnCnpj.classList.remove('active');
                docLabel.textContent = 'CPF';
                docInput.placeholder = '000.000.000-00';
                docInput.maxLength = 14;
                docInput.disabled = false;
                // Resetar botões de bairro
                bairroButtons.forEach(b => b.classList.remove('active'));
                fetchTotalCadastros(); // Atualiza contador
            } else {
                showMessage(result.message || "Erro desconhecido ao cadastrar.", "error");
            }
        } catch (error) {
            console.error("Erro no envio:", error);
            showMessage("Erro de comunicação com o servidor. Tente novamente.", "error");
        } finally {
            setLoading(false);
        }
    });

});
