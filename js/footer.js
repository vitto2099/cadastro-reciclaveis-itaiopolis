// ============================================================
// GESTÃO DO RODAPÉ RETRÁTIL (DRAWER EXPANSÍVEL)
// Município de Itaiópolis - Secretaria de Meio Ambiente
// ============================================================

const FOOTER_STORAGE_KEY = 'itaiopolis_footer_expanded';

/**
 * Alterna a expansão do rodapé retrátil
 * @param {boolean} [forceState] - Opcional: força abrir (true) ou fechar (false)
 */
function toggleFooter(forceState) {
    const footer = document.getElementById('main-footer');
    const btn = document.getElementById('btn-toggle-footer');
    const btnText = document.getElementById('btn-toggle-footer-text');

    if (!footer) return;

    const isCurrentlyExpanded = footer.classList.contains('expanded');
    const shouldExpand = (forceState !== undefined) ? forceState : !isCurrentlyExpanded;

    if (shouldExpand) {
        footer.classList.add('expanded');
        if (btn) btn.setAttribute('aria-expanded', 'true');
        if (btnText) btnText.textContent = 'Recolher Informações';
        try { localStorage.setItem(FOOTER_STORAGE_KEY, 'true'); } catch (e) {}
    } else {
        footer.classList.remove('expanded');
        if (btn) btn.setAttribute('aria-expanded', 'false');
        if (btnText) btnText.textContent = 'Informações & Contatos';
        try { localStorage.setItem(FOOTER_STORAGE_KEY, 'false'); } catch (e) {}
    }
}

// Expor globalmente para chamadas inline nos botões
window.toggleFooter = toggleFooter;

// Inicialização: garante tema claro puro e footer recolhido
(function initFooter() {
    try {
        localStorage.removeItem('itaiopolis_theme_mode');
    } catch (e) {}

    if (document.documentElement) {
        document.documentElement.removeAttribute('data-theme');
    }
    if (document.body) {
        document.body.classList.remove('dark-theme');
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (document.documentElement) {
            document.documentElement.removeAttribute('data-theme');
        }
        if (document.body) {
            document.body.classList.remove('dark-theme');
        }
        // O rodapé inicia recolhido ("pequeninho") por padrão
        toggleFooter(false);
    });
})();
