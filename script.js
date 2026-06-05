const menuToggle = document.getElementById('menuToggle');
const siteNav = document.getElementById('siteNav');

// Inicializar Supabase cuando esté disponible
let supabaseClient = null;
let productsCache = [];

function initSupabase() {
  if (window.supabase) {
    const SUPABASE_URL = 'https://vmyephuvxlspigtqjwmi.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZteWVwaHV2eGxzcGlndHFqd21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODA4NDcsImV4cCI6MjA5NjI1Njg0N30.K8S32gXhhbijUvs0nhOMUM9weqcnrICko64-heru-Rk';
    
    const { createClient } = window.supabase;
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
    const { data: products, error } = await supabaseClient
      .from('productos')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error al cargar productos:', error);
      if (/Could not find the table/.test(error.message || '')) {
        const sql = `CREATE TABLE public.productos (\n  id serial PRIMARY KEY,\n  nombre text NOT NULL,\n  preco numeric(10,2) NOT NULL,\n  imagen_url text,\n  descuento integer DEFAULT 0,\n  descripcion text,\n  created_at timestamptz DEFAULT now()\n);`;
        console.error('Tabla "public.productos" no encontrada. SQL sugerido:\n' + sql);
        alert("Tabla 'productos' no encontrada en Supabase. Revisa la consola para el SQL sugerido.");
      } else {
        alert('Error al cargar productos. Revisa la consola.');
      }
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
      productsCache = products;
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
            ${product.descripcion ? `<p class="product-desc">${product.descripcion}</p>` : ''}
            <div class="product-actions">
              <button class="buy-btn" data-id="${product.id}">Comprar</button>
            </div>
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

// Purchase modal logic
function openPurchaseModal(product) {
  const modal = document.getElementById('purchaseModal');
  document.getElementById('purchaseMessage').textContent = `Has seleccionado "${product.nombre}". Actualmente el pago mediante la web no está disponible. Pulsa 'Redirigir a WhatsApp' para copiar un mensaje y continuar.`;
  modal.classList.remove('hidden');
  const cancel = document.getElementById('modalCancel');
  const redirect = document.getElementById('modalRedirect');
  cancel.onclick = () => { modal.classList.add('hidden'); };
  redirect.onclick = async () => {
    const msg = `Hola,+estoy+interesado+en+el+producto:+${encodeURIComponent(product.nombre)}+--+Precio:+$${parseFloat(product.preco||0).toFixed(2)}`;
    try {
      await navigator.clipboard.writeText(`Estoy interesado en ${product.nombre} - Precio: $${parseFloat(product.preco||0).toFixed(2)}`);
      // inform user then open whatsapp chat
      if (confirm('Mensaje copiado al portapapeles. Pulsa OK para abrir WhatsApp y pegarlo.')) {
        window.open('https://wa.me/18299154422', '_blank');
        modal.classList.add('hidden');
      }
    } catch (err) {
      // still open wa.me if clipboard fails
      window.open('https://wa.me/18299154422', '_blank');
      modal.classList.add('hidden');
    }
  };
}

// Escuchar cambios en tiempo real (opcional, si tienes RLS habilitado)
function subscribeToChanges() {
  if (supabaseClient) {
    supabaseClient
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

// Attach delegated handler for buy buttons
document.addEventListener('DOMContentLoaded', () => {
  const productsGrid = document.getElementById('productsGrid');
  if (!productsGrid) return;
  productsGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.buy-btn');
    if (!btn) return;
    const id = parseInt(btn.dataset.id, 10);
    const prod = productsCache.find(p => p.id === id) || (productsCache[id] || null);
    if (prod) openPurchaseModal(prod);
  });
});
