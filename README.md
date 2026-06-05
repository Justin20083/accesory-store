
# 📱 Guía de Uso - Accesory Store

## 🚀 Inicio Rápido

### Servidor HTTP
Tu proyecto ahora está conectado a **Supabase**. Necesitas un servidor HTTP local para evitar problemas CORS.

**Comando para iniciar servidor:**
```
py -m http.server 8000
```
Luego abre: `http://localhost:8000`

---

## 📊 Estructura del Proyecto

### Página Principal: `http://localhost:8000`
- **Hero Section**: Banner con imagen de estadísticas
- **Tienda**: Grid de productos desde Supabase
  - Banner grande "Últimas Ofertas" (el primer producto)
  - 6 cuadros de productos en grid
- **Como Comprar**: Información de 3 pasos
- **Contacto**: Formulario de contacto

### Panel de Admin: `http://localhost:8000/admin`
- **Acceso**: Solo con enlace directo (no tiene login)
- **3 Pestañas**: Dashboard, Productos, Ventas

---

## 🛍️ Gestionar Productos

### ✅ Agregar Productos
1. Ve a `http://localhost:8000/admin`
2. Click en "Productos"
3. Click en "+ Agregar Producto"
4. Completa:
   - **Título**: Nombre del producto
   - **Precio**: Valor en $ (ej: 19.99)
   - **Imagen**: Sube una imagen
   - **Oferta**: Descuento en % (opcional)
5. Click "Guardar Producto"

**Los productos aparecerán automáticamente en la tienda!**

### ✏️ Editar Productos
1. En la tabla de Productos
2. Click en "Editar" en la tarjeta del producto
3. Modifica los datos
4. Click "Guardar Producto"

### 🗑️ Eliminar Productos
1. En la tabla de Productos
2. Click en "Eliminar" en la tarjeta del producto
3. Confirma la eliminación

---

## 📋 Tabla de Supabase Requerida

**Nombre de tabla**: `productos`

**Columnas necesarias**:
- `id` (Integer, Primary Key, Auto increment)
- `nombre` (Text)
- `preco` (Numeric/Float)
- `imagen_url` (Text)
- `descuento` (Integer, optional)
- `created_at` (Timestamp, auto)

**SQL para crear la tabla:**
```sql
CREATE TABLE productos (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre TEXT NOT NULL,
  preco NUMERIC(10,2) NOT NULL,
  imagen_url TEXT NOT NULL,
  descuento INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔗 Credenciales Configuradas

✅ **URL**: `https://vmyephuvxlspigtqjwmi.supabase.co`  
✅ **API Key**: Ya configurada en los archivos

---

## 📱 Responsivo en:
- **Desktop**: Todos los estilos completos
- **Tablet**: Layout adaptado
- **Móvil**: Menú hamburguesa, texto escalado

---

## 🐛 Troubleshooting

**Problema**: Los productos no aparecen
- ✅ Verifica que haya datos en `productos` tabla
- ✅ Asegúrate que estés en `http://localhost` (no `file://`)
- ✅ Abre consola (F12) y busca errores

**Problema**: El admin no carga
- ✅ Recarga la página (Ctrl+R)
- ✅ Verifica que Supabase esté cargado: abre consola y escribe `window.supabase`

**Problema**: Las imágenes no se ven
- ✅ Usa URLs de imágenes públicas
- ✅ O sube a Supabase Storage y usa URLs públicas

---

## 📂 Archivos Importantes

```
c:\Users\justi\Downloads\Accesory store\
├── index.html          # Página principal
├── script.js           # Conexión Supabase principal
├── styles.css          # Estilos
├── admin/
│   ├── index.html      # Panel de administración
│   ├── script.js       # Lógica del admin
│   └── styles.css      # Estilos del admin
├── logo.png            # Tu logo
└── server.py           # Servidor HTTP
```

---

## 🔄 Sincronización en Tiempo Real

La página principal se actualiza automáticamente cuando:
- Agregas un producto en el admin
- Editas un producto
- Eliminas un producto

¡Sin necesidad de recargar!

---

## 💡 Tips

- El **primer producto** se muestra como "Última Oferta" en el banner grande
- Los productos se ordenan por ID (el más nuevo arriba)
- Las imágenes deben ser URLs públicas
- El descuento es solo para mostrar, no calcula automáticamente

---

¡Tu tienda está lista! 🎉
