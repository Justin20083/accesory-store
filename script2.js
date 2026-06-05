// Inicializar Supabase cuando esté disponible
let supabaseClient = null;
let useLocalFallback = false;
const LOCAL_KEY = 'productos_local_v1';
let localCache = [];

function getLocalProducts() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalProducts(arr) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(arr || []));
}

function ensureLocalInit() {
  localCache = getLocalProducts();
}

async function initSupabase() {
  if (window.supabase) {
    const SUPABASE_URL = 'https://vmyephuvxlspigtqjwmi.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZteWVwaHV2eGxzcGlndHFqd21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODA4NDcsImV4cCI6MjA5NjI1Njg0N30.K8S32gXhhbijUvs0nhOMUM9weqcnrICko64-heru-Rk';
    
    const { createClient } = window.supabase;
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // Probe existence of table and fallback to localStorage if missing
    try {
      const { error } = await supabaseClient.from('productos').select('id').limit(1);
      if (error && /Could not find the table/.test(error.message || '')) {
        useLocalFallback = true;
        ensureLocalInit();
      }
    } catch (e) {
      useLocalFallback = true;
      ensureLocalInit();
    }
    await loadProductsList();
    await updateDashboard();
  } else {
    setTimeout(initSupabase, 100);
  }
}

// Tab Navigation
document.querySelectorAll('.nav-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;
    
    // Remove active from all buttons
    document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach((tab) => tab.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Initialize tab data
    if (tabName === 'dashboard') {
      updateDashboard();
    } else if (tabName === 'products') {
      loadProductsList();
    } else if (tabName === 'sales') {
      updateSalesTab();
    }
  });
});

// Product Form
const productForm = document.getElementById('productForm');
const addProductBtn = document.getElementById('addProductBtn');
const closeFormBtn = document.getElementById('closeFormBtn');
const cancelFormBtn = document.getElementById('cancelFormBtn');
const productsFormElement = document.getElementById('productsFormElement');
const productImage = document.getElementById('productImage');
const imagePreview = document.getElementById('imagePreview');

let editingProductId = null;

addProductBtn.addEventListener('click', () => {
  editingProductId = null;
  productsFormElement.reset();
  imagePreview.innerHTML = '';
  document.getElementById('formTitle').textContent = 'Nuevo Producto';
  productForm.classList.remove('hidden');
});

[closeFormBtn, cancelFormBtn].forEach((btn) => {
  btn.addEventListener('click', () => {
    productForm.classList.add('hidden');
  });
});

productForm.addEventListener('click', (e) => {
  if (e.target === productForm.querySelector('.form-overlay')) {
    productForm.classList.add('hidden');
  }
});

// Image Preview
productImage.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      imagePreview.innerHTML = `<img src="${event.target.result}" alt="Preview" />`;
    };
    reader.readAsDataURL(file);
  }
});

// Save Product
productsFormElement.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const nombre = document.getElementById('productTitle').value;
  const preco = parseFloat(document.getElementById('productPrice').value);
  const descuento = parseInt(document.getElementById('productDiscount').value) || 0;
  
  let imagen_url = imagePreview.querySelector('img')?.src || '';
  
  if (!imagen_url) {
    alert('Por favor sube una imagen');
    return;
  }
  
  if (!nombre || !preco) {
    alert('Completa todos los campos requeridos');
    return;
  }
  
  try {
    const descripcion = document.getElementById('productDescription')?.value || '';
    const productData = {
      nombre,
      preco,
      imagen_url,
      descuento,
      descripcion
    };
    
    if (useLocalFallback) {
      if (editingProductId) {
        const idx = localCache.findIndex(p => p.id === editingProductId);
        if (idx !== -1) localCache[idx] = { ...localCache[idx], ...productData };
      } else {
        const nextId = (localCache.reduce((m, p) => Math.max(m, p.id || 0), 0) || 0) + 1;
        localCache.unshift({ id: nextId, ...productData });
      }
      saveLocalProducts(localCache);
    } else {
      if (editingProductId) {
        // Update existing product
        const { error } = await supabaseClient
          .from('productos')
          .update(productData)
          .eq('id', editingProductId);
        
        if (error) throw error;
      } else {
        // Add new product
        const { error } = await supabaseClient
          .from('productos')
          .insert([productData]);
        
        if (error) throw error;
      }
    }
    
    // Close form and reload
    productForm.classList.add('hidden');
    loadProductsList();
    updateDashboard();
  } catch (error) {
    console.error('Error al guardar:', error);
    alert('Error al guardar el producto: ' + error.message);
  }
});

// Load Products List
async function loadProductsList() {
  const productsList = document.getElementById('productsList');
  
  try {
    if (useLocalFallback) {
      if (!localCache || localCache.length === 0) {
        productsList.innerHTML = '<p class="empty-state">No hay productos. Agrega uno para comenzar.</p>';
        return;
      }
      productsList.innerHTML = localCache.map(product => renderAdminProductItem(product)).join('');
      return;
    }

    const { data: products, error } = await supabaseClient
      .from('productos')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      // fallback to local if table missing
      if (/Could not find the table/.test(error.message || '')) {
        useLocalFallback = true;
        ensureLocalInit();
        productsList.innerHTML = localCache.length ? localCache.map(p => renderAdminProductItem(p)).join('') : '<p class="empty-state">No hay productos. Agrega uno para comenzar.</p>';
        return;
      }
      throw error;
    }

    if (!products || products.length === 0) {
      productsList.innerHTML = '<p class="empty-state">No hay productos. Agrega uno para comenzar.</p>';
      return;
    }

    productsList.innerHTML = products.map(p => renderAdminProductItem(p)).join('');
  } catch (error) {
    console.error('Error al cargar productos:', error);
    productsList.innerHTML = '<p class="empty-state">Error al cargar productos</p>';
  }
}

function renderAdminProductItem(product) {
  return `
    <div class="product-item">
      <div class="product-image-box">
        <img src="${product.imagen_url}" alt="${product.nombre}" />
      </div>
      <div class="product-details">
        <h3>${product.nombre}</h3>
        <div class="product-price">$${parseFloat(product.preco).toFixed(2)}</div>
        ${product.descuento > 0 ? `<div class="product-discount">Oferta: -${product.descuento}%</div>` : ''}
        ${product.descripcion ? `<div class="product-desc">${escapeHtml(product.descripcion)}</div>` : ''}
        <div class="product-actions">
          <button onclick="editProduct(${product.id})">Editar</button>
          <button onclick="deleteProduct(${product.id})" class="btn-delete">Eliminar</button>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(text) {
  return (text || '').replace(/[&<>"]+/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
}

// Edit Product
async function editProduct(id) {
  try {
    if (useLocalFallback) {
      const product = localCache.find(p => p.id === id);
      if (!product) throw new Error('Producto no encontrado');
      editingProductId = id;
      document.getElementById('productTitle').value = product.nombre;
      document.getElementById('productPrice').value = product.preco;
      document.getElementById('productDiscount').value = product.descuento || 0;
      document.getElementById('productDescription').value = product.descripcion || '';
      imagePreview.innerHTML = `<img src="${product.imagen_url}" alt="${product.nombre}" />`;
      document.getElementById('formTitle').textContent = 'Editar Producto';
      productForm.classList.remove('hidden');
      return;
    }

    const { data: product, error } = await supabaseClient
      .from('productos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!product) return;
    
    editingProductId = id;
    document.getElementById('productTitle').value = product.nombre;
    document.getElementById('productPrice').value = product.preco;
    document.getElementById('productDiscount').value = product.descuento || 0;
    document.getElementById('productDescription').value = product.descripcion || '';
    
    imagePreview.innerHTML = `<img src="${product.imagen_url}" alt="${product.nombre}" />`;
    
    document.getElementById('formTitle').textContent = 'Editar Producto';
    productForm.classList.remove('hidden');
  } catch (error) {
    console.error('Error al cargar producto:', error);
    alert('Error al cargar el producto');
  }
}

// Delete Product
async function deleteProduct(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  
  try {
    if (useLocalFallback) {
      localCache = localCache.filter(p => p.id !== id);
      saveLocalProducts(localCache);
      loadProductsList();
      updateDashboard();
      return;
    }

    const { error } = await supabaseClient
      .from('productos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    loadProductsList();
    updateDashboard();
  } catch (error) {
    console.error('Error al eliminar:', error);
    alert('Error al eliminar el producto');
  }
}

// Update Dashboard
async function updateDashboard() {
  try {
    let products = [];
    if (useLocalFallback) {
      products = localCache || [];
    } else {
      const { data: productsData, error: productsError } = await supabaseClient
        .from('productos')
        .select('*');
      if (productsError) throw productsError;
      products = productsData || [];
    }

    const totalProducts = products ? products.length : 0;
    const avgPrice =
      totalProducts > 0
        ? (products.reduce((sum, p) => sum + parseFloat(p.preco || 0), 0) / totalProducts).toFixed(2)
        : 0;
    
    document.getElementById('totalEarnings').textContent = '$0.00';
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('totalOrders').textContent = '0';
    document.getElementById('avgPrice').textContent = `$${avgPrice}`;
    
    // Top Products
    const topProductsContainer = document.getElementById('topProducts');
    if (products && products.length > 0) {
      const topProducts = products.slice(0, 3);
      topProductsContainer.innerHTML = topProducts
        .map(
          (product, index) => `
        <div class="top-product-item">
          <span class="top-product-name">${index + 1}. ${product.nombre}</span>
          <span class="top-product-sales">$${parseFloat(product.preco).toFixed(2)}</span>
        </div>
      `
        )
        .join('');
    } else {
      topProductsContainer.innerHTML = '<p>Sin datos aún</p>';
    }
    
    // Chart
    updateEarningsChart();
  } catch (error) {
    console.error('Error al actualizar dashboard:', error);
  }
}

// Earnings Chart
let earningsChart = null;

function updateEarningsChart() {
  const ctx = document.getElementById('earningsChart');
  if (!ctx) return;
  
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const earnings = new Array(12).fill(0);
  
  if (earningsChart) {
    earningsChart.destroy();
  }
  
  earningsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Ganancias ($)',
          data: earnings,
          borderColor: '#5f72b7',
          backgroundColor: 'rgba(95, 114, 183, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#5f72b7'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => '$' + value
          }
        }
      }
    }
  });
}

// Update Sales Tab
async function updateSalesTab() {
  try {
    document.getElementById('salesTotal').textContent = '$0.00';
    document.getElementById('salesOrders').textContent = '0';
    document.getElementById('salesAverage').textContent = '$0.00';
  } catch (error) {
    console.error('Error al cargar ventas:', error);
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
});
