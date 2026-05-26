// URL do Web App gerada no Google Apps Script.
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx4qVHpKMxmbpbG7XZzt4KK6jJcundHYTQsLFMm6W2fEB3QrQ_WprQj0dIWwSG3XFZm/exec";

document.addEventListener('DOMContentLoaded', () => {
    fetchTotalCadastros();

    const form = document.getElementById('cadastro-form');
    const cpfInput = document.getElementById('cpf');
    const messageDiv = document.getElementById('form-message');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.querySelector('.btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const countDisplay = document.getElementById('cadastro-count');

    // Máscara de CPF simplificada
    cpfInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
        if (value.length > 11) value = value.slice(0, 11);

        if (value.length > 9) {
            value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4');
        } else if (value.length > 6) {
            value = value.replace(/^(\d{3})(\d{3})(\d{3}).*/, '$1.$2.$3');
        } else if (value.length > 3) {
            value = value.replace(/^(\d{3})(\d{3}).*/, '$1.$2');
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
            } else {
                countDisplay.textContent = "Erro";
            }
        } catch (error) {
            console.error("Erro ao buscar total:", error);
            countDisplay.textContent = "---";
        }
    }

    // Submissão do formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (SCRIPT_URL === "COLOQUE_A_URL_DO_SEU_WEB_APP_AQUI") {
            showMessage("O sistema ainda não está conectado à planilha do Google. Configure a SCRIPT_URL no arquivo app.js.", "error");
            return;
        }

        const cpfValue = cpfInput.value;
        if (cpfValue.length < 14) {
            showMessage("Por favor, digite um CPF válido com 11 dígitos.", "error");
            return;
        }

        const formData = {
            action: 'cadastrar',
            nome: document.getElementById('nome').value,
            cpf: cpfValue,
            endereco: document.getElementById('endereco').value,
            moradores: document.getElementById('moradores').value
        };

        setLoading(true);
        messageDiv.style.display = 'none';

        try {
            // O Google Apps Script exige POST sem CORS complexo, ou enviamos como texto simples usando mode 'no-cors' 
            // ou enviamos via fetch normal (que exige que o app script esteja configurado certinho). 
            // Para Web Apps modernos do Google, usar URLSearchParams e Content-Type: application/x-www-form-urlencoded é mais estável.

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
                showMessage("Cadastro realizado com sucesso! Sua cota está garantida.", "success");
                form.reset();
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
