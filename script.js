const menuToggle = document.getElementById('menuToggle');
const siteNav = document.getElementById('siteNav');

// Inicializar Supabase cuando esté disponible
let supabase = null;

function initSupabase() {
  if (window.supabase) {
    const SUPABASE_URL = 'https://vmyephuvxlspigtqjwmi.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZteWVwaHV2eGxzcGlndHFqd21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODA4NDcsImV4cCI6MjA5NjI1Njg0N30.K8S32gXhhbijUvs0nhOMUM9weqcnrICko64-heru-Rk';
    
    const { createClient } = window.supabase;
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    loadProducts();
  } else {
    setTimeout(initSupabase, 100);
  }
}

menuToggle.addEventListener('click', () => {
  siteNav.classList.toggle('open');
  const expanded = siteNav.classList.contains('open');
  menuToggle.setAttribute('aria-expanded', expanded);
});

siteNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    if (siteNav.classList.contains('open')) {
      siteNav.classList.remove('open');
    }
  });
});

// Cargar productos desde Supabase
async function loadProducts() {
  const productsGrid = document.getElementById('productsGrid');
  const featuredSection = document.getElementById('featuredProduct');
  
  try {
    // Obtener productos de Supabase
    const { data: products, error } = await supabase
      .from('productos')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error al cargar productos:', error);
      return;
    }
    
    // Limpiar grid
    productsGrid.innerHTML = '';
    
    // Mostrar producto destacado (el primero)
    if (products && products.length > 0) {
      const featured = products[0];
      featuredSection.classList.add('has-product');
      featuredSection.innerHTML = `<img src="${featured.imagen_url}" alt="${featured.nombre}" />`;
      
      // Mostrar todos los productos
      products.forEach((product) => {
        const precioFormato = `$${parseFloat(product.preco || 0).toFixed(2)}`;
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
          <div class="product-image">
            <img src="${product.imagen_url}" alt="${product.nombre}" />
          </div>
          <div class="product-info">
            <h3>${product.nombre}</h3>
            <p class="product-price">${precioFormato}</p>
          </div>
        `;
        productsGrid.appendChild(card);
      });
    } else {
      // Si no hay productos, mostrar placeholders
      featuredSection.classList.remove('has-product');
      featuredSection.innerHTML = '<div class="featured-placeholder"><p>Últimas Ofertas</p></div>';
      
      for (let i = 0; i < 6; i++) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
          <div class="product-image"></div>
          <div class="product-info">
            <h3></h3>
            <p class="product-price"></p>
          </div>
        `;
        productsGrid.appendChild(card);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Escuchar cambios en tiempo real (opcional, si tienes RLS habilitado)
function subscribeToChanges() {
  if (supabase) {
    supabase
      .channel('productos-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'productos' },
        (payload) => {
          console.log('Cambios detectados:', payload);
          loadProducts();
        }
      )
      .subscribe();
  }
}

// Iniciar cuando todo esté listo
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
  subscribeToChanges();
});
