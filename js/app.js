/* ============================================
   CROMIX - Digital Catalog Application
   ============================================ */

// --- State ---
let currentCategory = 'todos';
let currentSize = 'todas';
let searchQuery = '';
let currentProduct = null;

// --- Size definitions per category ---
const SIZES = {
    'niño': ['4', '6', '8', '10', '12', '14', '16'],
    'niña': ['4', '6', '8', '10', '12', '14', '16'],
    'bebé': ['6-9', '9-12', '12-18', '18-24', '24-36']
};

// --- Database (localStorage) ---
function getProducts() {
    try {
        return JSON.parse(localStorage.getItem('cromix_products') || '[]');
    } catch {
        return [];
    }
}

function saveProducts(products) {
    localStorage.setItem('cromix_products', JSON.stringify(products));
}

// --- Demo data ---
function initDemoData() {
    if (localStorage.getItem('cromix_initialized')) return;

    const demoProducts = [
        { id: '1', name: 'Camiseta Rayas Ocean', sku: 'CRX-N001', category: 'niño', size: '8', description: 'Camiseta de algodón con rayas marineras. Fresca y cómoda para el día a día.', image: '', createdAt: Date.now() },
        { id: '2', name: 'Vestido Flores Garden', sku: 'CRX-A001', category: 'niña', size: '6', description: 'Vestido floral con volantes delicados. Ideal para ocasiones especiales.', image: '', createdAt: Date.now() },
        { id: '3', name: 'Body Estrellitas', sku: 'CRX-B001', category: 'bebé', size: '6-9', description: 'Body de algodón orgánico con estampado de estrellas. Suave y seguro.', image: '', createdAt: Date.now() },
        { id: '4', name: 'Bermuda Denim Classic', sku: 'CRX-N002', category: 'niño', size: '10', description: 'Bermuda de jean con elastano para mayor comodidad y movimiento.', image: '', createdAt: Date.now() },
        { id: '5', name: 'Falda Tutu Princess', sku: 'CRX-A002', category: 'niña', size: '4', description: 'Falda de tul multicapa. Perfecta para las pequeñas bailarinas.', image: '', createdAt: Date.now() },
        { id: '6', name: 'Conjunto Safari Adventure', sku: 'CRX-B002', category: 'bebé', size: '12-18', description: 'Conjunto de dos piezas con temática safari. Incluye camiseta y pantalón.', image: '', createdAt: Date.now() },
        { id: '7', name: 'Polo Sport Active', sku: 'CRX-N003', category: 'niño', size: '12', description: 'Polo deportivo con tecnología dry-fit. Ideal para actividades al aire libre.', image: '', createdAt: Date.now() },
        { id: '8', name: 'Blusa Mariposas Dream', sku: 'CRX-A003', category: 'niña', size: '10', description: 'Blusa con estampado de mariposas y detalles de encaje en los hombros.', image: '', createdAt: Date.now() },
        { id: '9', name: 'Pijama Ositos Moon', sku: 'CRX-B003', category: 'bebé', size: '18-24', description: 'Pijama enterizo de algodón con ositos y lunas. Abrigado y tierno.', image: '', createdAt: Date.now() },
        { id: '10', name: 'Chaqueta Urban Style', sku: 'CRX-N004', category: 'niño', size: '14', description: 'Chaqueta tipo bomber con diseño urbano. Moderna y resistente.', image: '', createdAt: Date.now() },
        { id: '11', name: 'Leggins Unicornio', sku: 'CRX-A004', category: 'niña', size: '8', description: 'Leggins estampados con unicornios mágicos. Elásticos y coloridos.', image: '', createdAt: Date.now() },
        { id: '12', name: 'Ranita Patitos', sku: 'CRX-B004', category: 'bebé', size: '9-12', description: 'Ranita de algodón con patitos bordados. Práctica y adorable.', image: '', createdAt: Date.now() },
    ];

    saveProducts(demoProducts);
    localStorage.setItem('cromix_initialized', 'true');
}

// --- Placeholder image generator ---
function getPlaceholderSVG(category, name) {
    const colors = {
        'niño': { bg: '#E8F7FC', fg: '#6EC1E4', icon: 'boy' },
        'niña': { bg: '#FFF0F5', fg: '#F8A4C8', icon: 'girl' },
        'bebé': { bg: '#FFF8E7', fg: '#FFD966', icon: 'child_friendly' }
    };
    const c = colors[category] || colors['niño'];
    const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

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
    const products = getProducts();
    const grid = document.getElementById('catalogGrid');
    const emptyState = document.getElementById('emptyState');

    // Filter products
    let filtered = products.filter(p => {
        const matchCategory = currentCategory === 'todos' || p.category === currentCategory;
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
        const imgSrc = product.image || getPlaceholderSVG(product.category, product.name);
        const badgeClass = `badge-${product.category}`;

        return `
            <div class="product-card" onclick="openProduct('${product.id}')" style="animation-delay: ${index * 0.05}s">
                <div class="card-image">
                    <img src="${imgSrc}" alt="${escapeHtml(product.name)}" loading="lazy">
                    <span class="card-badge ${badgeClass}">${escapeHtml(product.category)}</span>
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
    let sizes = [];

    if (currentCategory === 'todos') {
        // Combine all unique sizes
        const allSizes = new Set();
        Object.values(SIZES).forEach(s => s.forEach(sz => allSizes.add(sz)));
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

    // Update nav active state
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
    const products = getProducts();
    const product = products.find(p => p.id === id);
    if (!product) return;

    currentProduct = product;
    const imgSrc = product.image || getPlaceholderSVG(product.category, product.name);

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
function downloadImage(id) {
    const products = getProducts();
    const product = products.find(p => p.id === id);
    if (!product) return;

    const imgSrc = product.image || getPlaceholderSVG(product.category, product.name);

    const link = document.createElement('a');
    link.href = imgSrc;
    link.download = `CROMIX_${product.sku}_${product.name.replace(/\s+/g, '_')}.png`;
    link.click();

    showToast('Descargando imagen...');
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
        // Fallback
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
document.addEventListener('DOMContentLoaded', () => {
    initDemoData();
    renderSizeChips();
    renderProducts();
    setupAdminAccess();

    window.addEventListener('scroll', handleScroll);

    // Hide loader
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
    }, 800);
});
