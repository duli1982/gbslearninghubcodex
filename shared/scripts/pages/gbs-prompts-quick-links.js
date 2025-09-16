document.addEventListener('DOMContentLoaded', () => {
const searchInput = document.getElementById('quick-links-search');
const nav = document.getElementById('quick-links-sidebar');
if (searchInput && nav) {
    searchInput.addEventListener('input', () => {
        const term = searchInput.value.trim().toLowerCase();
        const items = Array.from(nav.querySelectorAll('a'));
        items.forEach(a => { const text = a.textContent.toLowerCase(); a.style.display = text.includes(term) ? '' : 'none'; });
    });
}
});
