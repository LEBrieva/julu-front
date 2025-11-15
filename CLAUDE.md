# E-Commerce Frontend - Angular 20

## 📋 Contexto del Proyecto

Este es el frontend de una aplicación e-commerce completa construida con Angular 20 (standalone components), diseñada para integrarse con el backend NestJS ubicado en `../ecommerce-back`.

**Arquitectura**: Single Page Application (SPA) con dos áreas principales:
- **Admin Dashboard**: Panel de administración para gestionar productos, órdenes y usuarios (requiere rol ADMIN)
- **User Store**: Tienda pública para usuarios finales (navegación de productos, carrito, checkout)

**Estado actual**: FASES 5, 6, 7 y 8a completadas. Sistema CRUD de productos con gestión avanzada de variantes (tamaños P/M/G/GG, colores en español, stock y precios individuales), edición inline granular, validaciones de duplicados, y tabla estructurada con headers. Sistema completo de upload/gestión de imágenes de productos (hasta 5 imágenes, preview, validaciones). Sistema completo de administración de órdenes con filtros avanzados, cambio de estado inline, y vista detalle completa. Sistema completo de gestión de usuarios con upload de avatar a Cloudinary, edición inline de estado/teléfono, sincronización reactiva con AuthService, y componente reutilizable de overlay de avatar. Home Landing Page con hero section, grid de categorías con imágenes, carousel de productos destacados, y catálogo público con filtros por query params.

---

## 🏗️ Stack Tecnológico

### Core
- **Angular 20.0.0** - Framework principal con standalone components (sin NgModules)
- **TypeScript 5.8.2** - Tipado estático
- **RxJS 7.8.0** - Programación reactiva y manejo de streams

### UI Libraries
- **PrimeNG 20.2.0** - Biblioteca de componentes UI enterprise-grade
- **@primeuix/themes 1.2.5** - Sistema de temas moderno de PrimeNG (Aura theme)
- **PrimeIcons 7.0.0** - Set de iconos
- **TailwindCSS 4.1.14** - Utility-first CSS framework

### State Management
- **@ngrx/signals 20.0.1** - Manejo de estado reactivo basado en Signals (alternativa moderna a Redux)

### Build Tools
- **Angular CLI 20.0.1** - Herramienta de línea de comandos
- **esbuild** - Bundler ultrarrápido (integrado en Angular 20)

---

## 📁 Arquitectura de Carpetas

```
src/app/
├── core/                      # Servicios y utilidades singleton (se cargan una vez)
│   ├── guards/
│   │   ├── auth.guard.ts      # Protege rutas que requieren autenticación
│   │   └── admin.guard.ts     # Protege rutas que requieren rol ADMIN
│   ├── interceptors/
│   │   ├── auth.interceptor.ts   # Inyecta JWT en headers + withCredentials
│   │   └── error.interceptor.ts  # Manejo global de errores HTTP + toasts
│   ├── models/
│   │   ├── user.model.ts         # User, LoginResponse, JwtPayload, enums
│   │   ├── product.model.ts      # Product, ProductCategory, ProductStatus
│   │   └── api-response.model.ts # Tipos genéricos para respuestas paginadas
│   └── services/
│       ├── auth.service.ts       # Autenticación con JWT + Signals
│       └── product.service.ts    # CRUD de productos + búsqueda/filtrado
│
├── features/                  # Módulos de funcionalidad (lazy loaded)
│   ├── admin/                 # Panel de administración
│   │   ├── dashboard/
│   │   │   └── admin-dashboard.component.ts  # ✅ Dashboard admin (placeholder)
│   │   ├── products/          # ✅ FASE 5: CRUD completo de productos
│   │   │   ├── admin-products.component.ts   # Componente principal con tabla
│   │   │   ├── admin-products.component.html # Template con PrimeNG Table
│   │   │   ├── admin-products.component.css  # Estilos con Tailwind
│   │   │   ├── product-form/                 # Subcomponente de formulario
│   │   │   │   ├── product-form.component.ts
│   │   │   │   ├── product-form.component.html
│   │   │   │   └── product-form.component.css
│   │   │   └── product-form.validator.ts     # Validaciones personalizadas
│   │   ├── orders/            # ✅ FASE 6: Gestión completa de órdenes
│   │   │   ├── admin-orders.component.ts    # Componente principal con tabla
│   │   │   ├── admin-orders.component.html  # Template con filtros y paginación
│   │   │   ├── admin-orders.component.css   # Estilos con Tailwind
│   │   │   └── order-detail/                # Subcomponente de detalle
│   │   │       ├── order-detail.component.ts
│   │   │       ├── order-detail.component.html
│   │   │       └── order-detail.component.css
│   │   └── users/             # ✅ FASE 7: Gestión completa de usuarios
│   │   │   ├── admin-users.component.ts      # Componente principal con tabla
│   │   │   ├── admin-users.component.html    # Template con filtros y paginación
│   │   │   ├── admin-users.component.css     # Estilos con Tailwind
│   │   │   └── user-detail/                  # Subcomponente de detalle
│   │   │       ├── user-detail.component.ts
│   │   │       ├── user-detail.component.html
│   │   │       └── user-detail.component.css
│   ├── auth/                  # Autenticación
│   │   └── login/
│   │       ├── login.component.ts     # ✅ Componente de login
│   │       ├── login.component.html   # ✅ Template con PrimeNG
│   │       └── login.component.css    # ✅ Estilos con Tailwind
│   └── products/
│       └── product-list.component.ts  # ✅ Catálogo público (placeholder)
│
├── shared/                    # Utilidades reutilizables
│   ├── constants/
│   │   └── validation-messages.ts     # ✅ Mensajes de validación centralizados
│   ├── utils/
│   │   └── form-errors.util.ts        # ✅ Helper para manejo de errores de formularios
│   ├── components/            # Componentes reutilizables
│   │   ├── image-upload/              # ✅ FASE 5 bis: Upload de imágenes
│   │   │   ├── image-upload.component.ts
│   │   │   ├── image-upload.component.html
│   │   │   └── image-upload.component.css
│   │   └── avatar-overlay/            # ✅ FASE 7: Overlay de avatar
│   │       ├── avatar-overlay.component.ts
│   │       ├── avatar-overlay.component.html
│   │       └── avatar-overlay.component.css
│   └── pipes/                 # TODO: Pipes personalizados
│
├── app.config.ts              # Configuración global (providers, interceptors)
├── app.routes.ts              # ✅ Rutas configuradas (login, products, admin/*)
├── app.ts                     # Root component
└── app.html                   # Root template (toast + router-outlet)
```

**Principios de organización**:
- `core/`: Singleton services (AuthService, interceptors, guards) - se inyectan en root
- `features/`: Código de funcionalidades específicas (lazy loading por ruta)
- `shared/`: Componentes reutilizables entre features (botones, tablas, etc.)

---

## 🔐 Sistema de Autenticación

### Arquitectura JWT + Refresh Tokens
- **Access Token**: localStorage, 15 min, header `Authorization: Bearer <token>`
- **Refresh Token**: httpOnly cookie, 7 días, auto-enviado con `withCredentials: true`
- **Auto-refresh**: Error interceptor detecta 401 → llama `/auth/refresh` → reintenta request

### AuthService (Signal-based)
Ver `core/services/auth.service.ts`
- **Signals**: `currentUser`, `isAuthenticated`, `isAdmin` (todos computed/readonly)
- **Métodos**: `login()`, `logout()`, `refresh()`, `initializeAuth()`, `getCurrentUser()`
- **Activity tracking**: Silent refresh cada 55 min si usuario activo, logout diferenciado por rol si inactivo
- **Uso en componentes**: `authService.currentUser()`, `isAuthenticated()`, `isAdmin()`

### Interceptors

#### `auth.interceptor.ts`
Inyecta JWT en headers + `withCredentials: true` para enviar cookies httpOnly.

#### `error.interceptor.ts`
Manejo global de errores HTTP con toasts automáticos:
- **400**: Errores de validación
- **401**: Auto-refresh con toasts informativos (info → success/warn)
- **403**: Acceso denegado
- **404**: No encontrado
- **409**: Conflicto (duplicado)
- **429**: Rate limiting (muestra tiempo de espera desde header `X-RateLimit-Reset`)
- **500+**: Error del servidor
- **Network**: Sin conexión

**Lógica de refresh**: Detecta endpoint para evitar loop infinito → muestra toast → llama `refresh()` → reintenta request → maneja éxito/error

### Guards

#### `auth.guard.ts`
Verifica `isAuthenticated()` → si false, redirect a `/login?returnUrl=<url_original>`

#### `admin.guard.ts`
Verifica `currentUser.role === ADMIN` → si false, toast de error + redirect a `/products`

**Uso en rutas**: Ver `app.routes.ts` y `admin.routes.ts` para ejemplos de protección con guards combinados

---

## 🎨 UI System (PrimeNG + TailwindCSS)

### PrimeNG v20 (Nuevo Sistema de Temas)

**Cambio importante**: PrimeNG v20 migró a un nuevo sistema de temas con `@primeuix/themes`.

**Configuración** (en `app.config.ts`):
```typescript
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura'; // Tema moderno

export const appConfig: ApplicationConfig = {
  providers: [
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false // Deshabilitado por ahora
        }
      }
    })
  ]
};
```

**NO usar** (deprecated):
```typescript
// ❌ Viejo sistema (no funciona en v20)
import 'primeng/resources/themes/lara-light-blue/theme.css';
```

**Componentes disponibles**: [PrimeNG Components](https://primeng.org/components)
- Forms: InputText, Dropdown, Calendar, InputNumber
- Data: Table, DataView, Paginator
- Buttons: Button, SplitButton
- Overlays: Dialog, Tooltip, Toast
- Messages: Toast, Message
- Navigation: Menu, Breadcrumb, TabView

### TailwindCSS v4

**Configuración** (en `src/styles.css`):
```css
@import "tailwindcss";
@import "primeicons/primeicons.css";
```

**NO necesitas** `tailwind.config.js` en v4 (nuevo sistema de imports).

**Estrategia de uso**:
- Tailwind para layout, spacing, responsive (flex, grid, p-4, etc.)
- PrimeNG para componentes interactivos (forms, tables, dialogs)

---

## 🌐 Configuración de Entornos

**Archivos**:
```typescript
// src/environments/environment.ts (desarrollo)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000' // Backend local
};

// src/environments/environment.prod.ts (producción)
export const environment = {
  production: true,
  apiUrl: 'https://api.tudominio.com' // Backend en producción
};
```

**Uso en servicios**:
```typescript
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;

  login(email: string, password: string) {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password });
  }
}
```

---

## 🧩 Modelos de Datos

Ver archivos en `core/models/` para detalles completos:

### Enums Principales
```typescript
// user.model.ts
UserRole: 'admin' | 'user'
UserStatus: 'active' | 'inactive'

// product.model.ts
ProductSize: 'P' | 'M' | 'G' | 'GG'
ProductColor: 'black' | 'white' | 'gray' | 'navy' | 'red' | 'blue'
ProductStyle: 'regular' | 'oversize' | 'slim_fit' | 'straight' | 'skinny' | etc.
ProductCategory: 'remera' | 'pantalon' | 'chaqueta' | 'zapatillas' | 'botas' | etc.
ProductStatus: 'active' | 'inactive'

// order.model.ts
OrderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
PaymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
```

### Interfaces Clave
- **User**: Ver `user.model.ts` (incluye avatar, phone, emailVerified)
- **Product**: Ver `product.model.ts` (con variants[], images[], featuredImageIndex, destacado)
- **ProductVariant**: `{ sku, size, color, stock, price }`
- **Order**: Ver `order.model.ts` (con items[], shippingAddress, status, totals)
- **PaginatedResponse<T>**: `{ data: T[], pagination: PaginationInfo }`

---

## 🔌 Integración con Backend

### Endpoints del Backend (NestJS)

**Base URL**: `http://localhost:3000` (desarrollo)

#### Auth
```typescript
POST   /auth/register          // Registro de usuario
POST   /auth/login             // Login (devuelve JWT + httpOnly cookie)
POST   /auth/logout            // Logout (limpia cookie)
POST   /auth/refresh           // Refresh token (usa httpOnly cookie)
GET    /auth/me                // Obtener usuario actual
```

#### Products
```typescript
GET    /products?page=1&limit=10&category=electronics&search=laptop
POST   /products               // [ADMIN] Crear producto
GET    /products/:id
PATCH  /products/:id           // [ADMIN] Actualizar producto
DELETE /products/:id           // [ADMIN] Eliminar producto
```

#### Orders
```typescript
GET    /orders?page=1&limit=10&status=pending
POST   /orders                 // Crear orden desde carrito
GET    /orders/:id
PATCH  /orders/:id/status      // [ADMIN] Cambiar estado de orden
DELETE /orders/:id             // [ADMIN] Cancelar orden
```

#### Users
```typescript
GET    /users?page=1&limit=10&role=user
GET    /users/:id              // [ADMIN] Ver detalles de usuario
PATCH  /users/:id/role         // [ADMIN] Cambiar rol
PATCH  /users/:id/status       // [ADMIN] Activar/desactivar usuario
```

### Rate Limiting (Throttler)
El backend tiene rate limiting configurado:
- **Global**: 100 requests / 60 segundos
- **Auth endpoints**: 5 requests / 60 segundos (login, register)

Si se excede el límite:
- Response: `429 Too Many Requests`
- Header: `X-RateLimit-Reset: <timestamp>` (cuándo se resetea el límite)
- Frontend muestra toast: "Demasiadas Peticiones - Intenta en X segundos"

---

## 🚀 Comandos Útiles

```bash
# Desarrollo
npm start                    # Inicia dev server en http://localhost:4200
npm run watch                # Build continuo con hot reload

# Build
npm run build                # Build de producción (dist/)
npm run build -- --configuration development  # Build de desarrollo

# Testing
npm test                     # Ejecuta tests con Karma

# Generación de código
ng generate component features/auth/login --standalone
ng generate service core/services/product
ng generate guard core/guards/role
ng generate interceptor core/interceptors/cache
ng generate pipe shared/pipes/currency
```

---

## 📝 Convenciones de Código

### Nomenclatura
```typescript
// Componentes: PascalCase + Component suffix
export class ProductListComponent { }

// Servicios: PascalCase + Service suffix
export class AuthService { }

// Guards: camelCase + Guard suffix
export const authGuard: CanActivateFn = () => { }

// Interceptors: camelCase + Interceptor suffix
export const authInterceptor: HttpInterceptorFn = () => { }

// Interfaces: PascalCase (sin 'I' prefix)
export interface User { }

// Enums: PascalCase
export enum UserRole { }

// Constantes: SCREAMING_SNAKE_CASE
export const API_URL = 'http://localhost:3000';
```

### Inyección de Dependencias
```typescript
// ✅ Estilo moderno (standalone components)
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
}

// ❌ Evitar (estilo antiguo con constructor)
constructor(
  private authService: AuthService,
  private router: Router
) { }
```

### Signals vs Observables
```typescript
// ✅ Signals para estado local/compartido simple
export class AuthService {
  private currentUserSignal = signal<User | null>(null);
  readonly currentUser = this.currentUserSignal.asReadonly();
}

// ✅ Observables para operaciones asíncronas (HTTP, timers, events)
login(email: string, password: string): Observable<LoginResponse> {
  return this.http.post<LoginResponse>('/auth/login', { email, password });
}

// ✅ Signals computados para derivaciones
readonly isAuthenticated = computed(() => this.currentUser() !== null);
```

---

## 🐛 Debugging Tips

- **Ver JWT decodificado**: DevTools Console → `JSON.parse(atob(localStorage.getItem('accessToken').split('.')[1]))`
- **Testear auto-refresh**: Cambiar accessToken en localStorage por uno expirado → hacer request → ver toasts de refresh
- **Ver cookies**: DevTools → Application → Cookies → verificar `refreshToken` (httpOnly: true)
- **Inspeccionar requests**: DevTools → Network → Headers → verificar `Authorization: Bearer ...` y `Cookie: refreshToken=...`

---

## 🔮 Próximos Pasos (Roadmap)

### ✅ FASES COMPLETADAS (Resumen)

#### FASE 3: Login Component
Sistema de autenticación completo con formularios reactivos, validaciones centralizadas (`shared/constants/validation-messages.ts`, `shared/utils/form-errors.util.ts`), redirección según rol, loading states, y manejo de errores con toasts. Ver `features/auth/login/`.

#### FASE 3 bis: Silent Token Refresh
Activity tracking (`click`, `keypress`, `scroll`) + refresh automático cada 55 min si usuario activo. Logout diferenciado: ADMIN inactivo → redirect a `/login`, USER inactivo → logout silencioso. Constantes en `core/constants/auth.constants.ts`.

#### FASE 4: Admin Layout
Layout responsivo con header (avatar, dropdown menu) + sidebar colapsable (mobile hamburger menu, desktop fijo). Lazy loading optimizado con `loadChildren` y chunks separados. Ver `features/admin/layout/`.

#### FASE 5: CRUD de Productos con Variantes
**Modelos**: ProductVariant con `{ sku, size, color, stock, price }`. Helpers de formateo (`formatSize`, `formatColor`, `getColorHex`, etc.). Ver `core/models/product.model.ts`.

**AdminProductsComponent**: Tabla con filtros, paginación, búsqueda. Columnas: código, nombre+tags, categoría, estilo, variantes (badge count), stock total, estado, acciones.

**ProductFormComponent**:
- **Modo CREAR**: Datos básicos + tabla de variantes (min 1 requerida, validación duplicados size+color). Submit envía todo al backend.
- **Modo EDITAR**: Edición inline granular de stock/price (guardan al instante vía API). Botón "Agregar Variante" expande formulario. Botón "Actualizar Producto" solo para datos básicos.

**ProductService**: `getProducts()`, `createProduct()`, `addVariant()`, `updateVariant()`, `deleteVariant()`, `activateProduct()`, `deactivateProduct()`.

#### FASE 5 bis: Upload de Imágenes
`ImageUploadComponent` reutilizable en `shared/components/`. Upload múltiple (máx 5 imágenes), validaciones (JPEG/PNG/WebP, 5MB), preview con PrimeNG Image, eliminación con confirmación. Integrado solo en modo EDITAR de ProductForm.

#### FASE 6: Gestión de Órdenes
`AdminOrdersComponent`: Tabla con filtros (estado orden, pago, fechas), búsqueda por número. `OrderDetailComponent`: Modal con info de cliente, dirección, productos (snapshot de precios), totales. Cambio de estado inline con validaciones (solo no-finales) y headless ConfirmDialog.

#### FASE 7: Gestión de Usuarios
**Backend**: Endpoints `/users`, `/users/:id`, `/users/:id/avatar` (upload Cloudinary), `/auth/me` (retorna usuario completo).

**AdminUsersComponent**: Tabla con avatar, filtros (rol, estado, búsqueda), paginación. Botón "Ver Detalle" abre modal.

**UserDetailComponent**: Edición acumulativa (status, phone, avatar). Botón "Guardar" habilitado solo si hay cambios. Avatar clickeable → `AvatarOverlayComponent` fullscreen con preview. Sincronización con `AuthService.updateCurrentUser()` cuando admin edita su propio perfil.

**Shared**: `AvatarOverlayComponent` reutilizable con preview, validaciones, eventos.

**UX**: Headless ConfirmDialogs en todo el panel admin (user-detail, admin-orders, admin-products) con íconos circulares grandes y mensajes contextuales.

### FASE 8: Catálogo Público (User)

Dividida en 3 subfases para desarrollo incremental:

#### ✅ FASE 8a: Home Landing Page
**Backend**: Campo `destacado: boolean` en Product, endpoint `GET /products/destacados` (máx 12). Validación: máximo 12 productos destacados.

**HomeComponent** (`/`): Hero section con CTA, grid de categorías (5 cards con imágenes locales en `public/assets/images/`), carousel de destacados (PrimeNG Carousel), footer placeholder.

**Componentes**: `HeroSectionComponent`, `CategoryCardComponent`, `ProductCardComponent` (shared, reutilizable con badge "Destacado").

**ProductListComponent** actualizado: Catálogo público real con grid responsive, búsqueda con debounce (300ms), filtros por query params (`/products?style=X&category=Y`), paginación server-side.

**Admin**: Columna "Destacado" con star icon clickeable, InputSwitch en product-form, headless ConfirmDialog al toggle.

**Assets**: Imágenes hero banner + 6 categorías (regular, oversize, slim, straight, skinny) en `public/assets/images/`.

#### ✅ FASE 8b: Shop Catalog (Catálogo Completo con Filtros)
**ProductListComponent** (`/products`):
  - ✅ Grid/List toggle view (grid simple con Tailwind)
  - ✅ Sidebar con filtros avanzados:
    - ✅ Rango de precios (PrimeNG Slider)
    - ✅ Tallas disponibles (P, M, G, GG) - multiselect
    - ✅ Colores disponibles (chips visuales) - multiselect
    - ✅ Estilos (Regular, Oversize, Slim Fit) - multiselect
    - ✅ Tags (input de texto separado por comas)
    - ✅ Productos destacados (toggle switch)
  - ✅ Barra de búsqueda global con debounce (300ms)
  - ✅ Ordenamiento (más nuevo, precio asc/desc, nombre A-Z)
  - ✅ Paginación server-side
  - ✅ Empty states cuando no hay resultados
  - ✅ Filtros en Mobile:
    - ✅ Botón "Filtros" que abre PrimeNG Drawer
    - ✅ Botones "Aplicar Filtros" y "Limpiar Todo"
    - ✅ Badge con cantidad de filtros activos
  - ✅ Active filters chips removibles (componente compartido)
  - ✅ Sincronización con query params (URL compartible)
  - ✅ Persistencia de preferencia de vista (grid/list) en localStorage
  - ✅ ProductService actualizado con soporte para múltiples filtros
  - ✅ Query params: `?minPrice=1000&maxPrice=5000&sizes=P,M&colors=black,white&styles=regular,oversize&sortBy=price_asc&destacado=true`

#### FASE 8c: Product Detail (Detalle de Producto)
- [ ] **ProductDetailComponent** (`/products/:id`):
  - Galería de imágenes (PrimeNG Galleria con thumbnails)
  - Información del producto:
    - Nombre, código, descripción
    - Precio base (o rango si las variantes varían)
    - Categoría, estilo, tags
  - **Selector de Variantes**:
    - Selector de talla (P, M, G, GG) con badges
    - Selector de color (chips con hex real)
    - Precio y stock de la variante seleccionada
    - Validación: Deshabilitar combinaciones sin stock
  - **Agregar al Carrito**:
    - Input de cantidad (PrimeNG InputNumber)
    - Botón "Agregar al Carrito" (deshabilitado si sin stock)
    - Toast de confirmación al agregar
  - **Productos Relacionados**:
    - Carousel de productos de la misma categoría
    - Usando `ProductCardComponent`
- [ ] **Breadcrumbs**:
  - Home > [Categoría] > [Nombre Producto]
  - Usando PrimeNG Breadcrumb
- [ ] **Responsive Design**:
  - Desktop: Galería izquierda (60%), info derecha (40%)
  - Mobile: Stack vertical (galería arriba, info abajo)
- [ ] **SEO y Meta Tags**:
  - Title dinámico: `[Nombre Producto] - Tu Tienda`
  - Meta description con descripción del producto
  - Open Graph tags para redes sociales

---

### FASE 9: Carrito y Checkout (User)

#### Estrategia de Persistencia
- **Usuario ANÓNIMO**: Carrito en `localStorage` (frontend)
- **Usuario AUTENTICADO**: Carrito en BD (backend)
- **Al LOGIN**: Merge automático vía `POST /cart/items/batch`

#### Backend - Endpoints
```
GET    /cart                    # Obtener carrito del usuario
POST   /cart/items              # Agregar item
POST   /cart/items/batch        # Agregar múltiples items (para merge)
PATCH  /cart/items/:itemId      # Actualizar cantidad
DELETE /cart/items/:itemId      # Remover item
DELETE /cart                    # Vaciar carrito
```

**Modelos**: Ver `core/models/cart.model.ts` para `Cart`, `CartItem`, `GuestCartItem`

#### Frontend - CartService
- [ ] **Signals reactivos**:
  - `guestCartSignal` (localStorage)
  - `userCartSignal` (BD)
  - `cart` computed (switch según autenticación)
  - `totalItems` y `subtotal` computed
- [ ] **Métodos principales**:
  - `addItem(productId, variantSku, quantity)` - Detecta anónimo vs autenticado
  - `mergeGuestCartOnLogin()` - Llamado desde `AuthService.login()`
  - `updateQuantity()`, `removeItem()`, `clearCart()` - Con soporte dual
- [ ] **Integración con AuthService**: Mergear carrito post-login vía `switchMap`

#### CartComponent (`/cart`)
- [ ] Lista de items con imagen, variante (talla + color), cantidad editable, subtotal
- [ ] Empty state con CTA a `/shop`
- [ ] Resumen: Subtotal, envío, total, botón "Proceder al Checkout"
- [ ] Validación de stock al cambiar cantidades
- [ ] ConfirmDialog al eliminar items
- [ ] Badge reactivo en navbar con `cartService.totalItems()`

#### CheckoutComponent (`/checkout`)
- [ ] Guards: `authGuard` + custom `cartNotEmptyGuard`
- [ ] **Step 1**: Revisión de productos (read-only)
- [ ] **Step 2**: Dirección de envío (formulario con validaciones)
- [ ] **Step 3**: Método de pago (MVP: solo "Efectivo")
- [ ] **Step 4**: Confirmación → `POST /orders` → redirect a success
- [ ] **OrderSuccessComponent**: Mensaje de éxito, número de orden, CTA a perfil

---

## 📚 Recursos

### Documentación Oficial
- [Angular Docs](https://angular.dev)
- [PrimeNG Components](https://primeng.org)
- [TailwindCSS Docs](https://tailwindcss.com)
- [RxJS Operators](https://rxjs.dev/api)
- [@ngrx/signals](https://ngrx.io/guide/signals)

### Guías Útiles
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Angular HTTP Client](https://angular.dev/guide/http)
- [Angular Standalone Components](https://angular.dev/guide/components/importing)
- [PrimeNG Theme Designer](https://designer.primeng.org)

### Guías Internas del Proyecto
- **[STYLING-GUIDELINES.md](./STYLING-GUIDELINES.md)** - Arquitectura de estilos, mejores prácticas con PrimeNG, TailwindCSS, y Angular

---

## 🔗 Backend Integration

Este frontend está diseñado para conectarse con el backend NestJS ubicado en:
```
../ecommerce-back
```

Ver `../ecommerce-back/CLAUDE.md` para detalles del backend:
- Estructura de base de datos
- Endpoints disponibles
- Lógica de negocio (Cart vs Order, snapshots, etc.)
- Throttling y rate limiting
- Configuración de JWT y cookies

---

## ⚠️ Notas Importantes

### Seguridad
- **Frontend NO es seguro**: Los guards y validaciones son solo UX
- **Backend es la fuente de verdad**: Siempre valida JWT y roles en el servidor
- Si un usuario bypasea el frontend (DevTools, Postman), el backend lo bloqueará

### HttpOnly Cookies
- `withCredentials: true` es CRUCIAL en todos los requests
- Ya configurado en `auth.interceptor.ts`
- Sin esto, el navegador NO envía las cookies httpOnly

### Signals vs Observables
- **Signals**: Estado reactivo sincrónico (user, isAuthenticated, counters)
- **Observables**: Operaciones asíncronas (HTTP, timers, WebSockets, events)
- No son excluyentes, se complementan

### PrimeNG v20 Breaking Changes
- Migró a `@primeuix/themes` (NO usar `primeng/resources/themes/...`)
- Configurar con `providePrimeNG()` en app.config.ts
- Ver [Migration Guide](https://primeng.org/theming)

### TailwindCSS v4
- NO necesita `tailwind.config.js`
- Configuración mediante `@import` en CSS
- Ver [v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)

---

**Última actualización**: 2025-11-15 (FASE 8a completada: Home Landing Page con hero section, grid de categorías con imágenes locales, carousel de productos destacados, catálogo público con filtros por query params, y headless ConfirmDialogs en todo el panel admin)
