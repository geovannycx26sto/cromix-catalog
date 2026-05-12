/* ============================================
   CROMIX - Digital Catalog (Supabase Cloud)
   ============================================ */

// --- Supabase Config ---
const SUPABASE_URL = 'https://bjoeqjbiztmkqtuokugg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqb2VxamJpenRta3F0dW9rdWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MzgyODUsImV4cCI6MjA5MTQxNDI4NX0.r4n2WpMiLD26ZsVB1TiPodW0rpAp2NmBg-bFz3iKIDE';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- State ---
let currentCategory = 'todos';
let currentSize = 'todas';
let searchQuery = '';
let currentProduct = null;
let allProducts = [];

// --- Size definitions per category ---
const SIZES = {
    'niño': ['4', '6', '8', '10', '12', '14', '16'],
    'niña': ['4', '6', '8', '10', '12', '14', '16'],
    'bebé': ['6-9', '9-12', '12-18', '18-24', '24-36'],
    'referencias': []
};

// --- Fetch products from Supabase ---
async function fetchProducts() {
    try {
        const { data, error } = await db
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        allProducts = data || [];
    } catch (err) {
        console.error('Error fetching products:', err);
        allProducts = [];
    }
    return allProducts;
}

// --- Placeholder image generator ---
function getPlaceholderSVG(category, name) {
    const colors = {
        'niño': { bg: '#E8F7FC', fg: '#6EC1E4' },
        'niña': { bg: '#FFF0F5', fg: '#F8A4C8' },
        'bebé': { bg: '#FFF8E7', fg: '#FFD966' }
    };
    const c = colors[category] || colors['niño'];
    const initials = (name || 'CR').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

    return `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
            <rect width="400" height="500" fill="${c.bg}"/>
            <text x="200" y="220" text-anchor="middle" fill="${c.fg}" font-family="sans-serif" font-size="80" font-weight="bold" opacity="0.4">${initials}</text>
            <text x="200" y="300" text-anchor="middle" fill="${c.fg}" font-family="sans-serif" font-size="16" font-weight="600" opacity="0.5">CROMIX</text>
        </svg>
    `)}`;
}

// --- Render Functions ---
function renderProducts() {
    const grid = document.getElementById('catalogGrid');
    const emptyState = document.getElementById('emptyState');

    // Filter products
    let filtered = allProducts.filter(p => {
        const isRef = p.category === 'referencias' || p.size === 'referencia';
        const matchCategory = currentCategory === 'todos'
            ? true
            : currentCategory === 'referencias'
                ? isRef
                : p.category === currentCategory && !isRef;
        const matchSize = currentSize === 'todas' || p.size === currentSize;
        const matchSearch = !searchQuery ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSize && matchSearch;
    });

    // Update count
    document.getElementById('countNumber').textContent = filtered.length;

    if (filtered.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    grid.innerHTML = filtered.map((product, index) => {
        const isRef = product.category === 'referencias' || product.size === 'referencia';
        const imgSrc = product.image_url || getPlaceholderSVG(product.category, product.name);
        const badgeClass = isRef ? 'badge-referencia' : `badge-${product.category}`;
        const badgeLabel = isRef ? 'Referencia' : product.category;

        return `
            <div class="product-card" onclick="openProduct('${product.id}')" style="animation-delay: ${index * 0.05}s">
                <div class="card-image">
                    <img src="${imgSrc}" alt="${escapeHtml(product.name)}" loading="lazy">
                    <span class="card-badge ${badgeClass}">${escapeHtml(badgeLabel)}</span>
                    <button class="card-download" onclick="event.stopPropagation(); downloadImage('${product.id}')" title="Descargar imagen">
                        <span class="material-icons-round">download</span>
                    </button>
                </div>
                <div class="card-info">
                    <h3 class="card-name">${escapeHtml(product.name)}</h3>
                    <div class="card-meta">
                        <span class="card-sku">${escapeHtml(product.sku)}</span>
                        <span class="card-size">Talla ${escapeHtml(product.size)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderSizeChips() {
    const chipsContainer = document.getElementById('sizeChips');
    const filtersBar = document.getElementById('filtersBar');

    // Hide size filter for Referencias (no sizes apply)
    if (currentCategory === 'referencias') {
        filtersBar.style.display = 'none';
        return;
    }
    filtersBar.style.display = '';

    let sizes = [];
    if (currentCategory === 'todos') {
        const allSizes = new Set();
        ['niño','niña','bebé'].forEach(cat => SIZES[cat].forEach(sz => allSizes.add(sz)));
        sizes = Array.from(allSizes);
    } else {
        sizes = SIZES[currentCategory] || [];
    }

    let html = `<button class="size-chip ${currentSize === 'todas' ? 'active' : ''}" data-size="todas" onclick="filterSize('todas')">Todas</button>`;
    sizes.forEach(size => {
        html += `<button class="size-chip ${currentSize === size ? 'active' : ''}" data-size="${size}" onclick="filterSize('${size}')">Talla ${size}</button>`;
    });

    chipsContainer.innerHTML = html;
}

// --- Filter Functions ---
function filterCategory(category) {
    currentCategory = category;
    currentSize = 'todas';

    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });

    renderSizeChips();
    renderProducts();
}

function filterSize(size) {
    currentSize = size;

    document.querySelectorAll('.size-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.size === size);
    });

    renderProducts();
}

function searchProducts() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClear');
    searchQuery = input.value.trim();
    clearBtn.classList.toggle('visible', searchQuery.length > 0);
    renderProducts();
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    searchQuery = '';
    document.getElementById('searchClear').classList.remove('visible');
    renderProducts();
}

function resetFilters() {
    currentCategory = 'todos';
    currentSize = 'todas';
    searchQuery = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('searchClear').classList.remove('visible');

    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === 'todos');
    });

    renderSizeChips();
    renderProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Product Modal ---
function openProduct(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    currentProduct = product;
    const imgSrc = product.image_url || getPlaceholderSVG(product.category, product.name);

    document.getElementById('modalImage').src = imgSrc;
    document.getElementById('modalName').textContent = product.name;
    document.getElementById('modalSku').textContent = product.sku;
    document.getElementById('modalSize').textContent = product.size;
    document.getElementById('modalDescription').textContent = product.description || 'Sin descripción';

    const categoryEl = document.getElementById('modalCategory');
    categoryEl.textContent = product.category;
    categoryEl.className = `modal-category badge-${product.category}`;

    const modal = document.getElementById('productModal');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('open');
    document.body.style.overflow = '';
    currentProduct = null;
}

function closeModal(event) {
    if (event.target === event.currentTarget) {
        closeProductModal();
    }
}

// --- Download ---
async function downloadImage(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product || !product.image_url) {
        showToast('Este producto no tiene imagen');
        return;
    }

    showToast('Descargando imagen...');

    try {
        const response = await fetch(product.image_url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `CROMIX_${product.sku}_${product.name.replace(/\s+/g, '_')}.jpg`;
        link.click();
        URL.revokeObjectURL(url);
    } catch {
        // Fallback: open in new tab
        window.open(product.image_url, '_blank');
    }
}

function downloadCurrentImage() {
    if (currentProduct) {
        downloadImage(currentProduct.id);
    }
}

// --- Share ---
function shareLink() {
    const url = window.location.href;

    if (navigator.share) {
        navigator.share({
            title: 'CROMIX - Catálogo de Ropa Infantil',
            text: 'Descubre nuestra colección de moda infantil',
            url: url
        }).catch(() => {});
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            showToast('Enlace copiado al portapapeles');
        });
    } else {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showToast('Enlace copiado al portapapeles');
    }
}

function shareProduct() {
    if (!currentProduct) return;
    const url = window.location.href;
    const text = `Mira este producto de CROMIX: ${currentProduct.name} (${currentProduct.sku}) - Talla ${currentProduct.size}`;

    if (navigator.share) {
        navigator.share({ title: currentProduct.name, text, url }).catch(() => {});
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
            showToast('Información copiada al portapapeles');
        });
    }
}

// --- Toast ---
function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// --- Mobile Menu ---
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('open');
}

function closeMobileMenu() {
    document.getElementById('mobileMenu').classList.remove('open');
}

// --- Scroll ---
function scrollToCatalog() {
    document.getElementById('filtersBar').scrollIntoView({ behavior: 'smooth' });
}

// --- Utils ---
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// --- Header scroll effect ---
function handleScroll() {
    const header = document.getElementById('header');
    header.classList.toggle('scrolled', window.scrollY > 20);
}

// --- Admin Access (hidden) ---
let adminClickCount = 0;
let adminClickTimer = null;

function setupAdminAccess() {
    const footer = document.querySelector('.footer-bottom');
    if (!footer) return;

    footer.addEventListener('click', () => {
        adminClickCount++;
        clearTimeout(adminClickTimer);

        if (adminClickCount >= 5) {
            adminClickCount = 0;
            window.location.href = 'admin.html';
        } else {
            adminClickTimer = setTimeout(() => {
                adminClickCount = 0;
            }, 2000);
        }
    });
}

// --- Keyboard shortcuts ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeProductModal();
        closeMobileMenu();
    }
});

// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
    renderSizeChips();

    // Fetch products from Supabase
    await fetchProducts();
    renderProducts();

    setupAdminAccess();
    window.addEventListener('scroll', handleScroll);

    // Hide loader
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
    }, 800);
});
