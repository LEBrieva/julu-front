# E-Commerce Frontend - Angular 20

## 📋 Contexto del Proyecto

Este es el frontend de una aplicación e-commerce completa construida con Angular 20 (standalone components), diseñada para integrarse con el backend NestJS ubicado en `../ecommerce-back`.

**Arquitectura**: Single Page Application (SPA) con dos áreas principales:
- **Admin Dashboard**: Panel de administración para gestionar productos, órdenes y usuarios (requiere rol ADMIN)
- **User Store**: Tienda pública para usuarios finales (navegación de productos, carrito, checkout)

**Estado actual**: FASES 5, 6, 7, 8a, 8b, 8c, 10 y 11 completadas. Sistema CRUD de productos con gestión avanzada de variantes (tamaños P/M/G/GG, colores en español, stock y precios individuales), edición inline granular, validaciones de duplicados, y tabla estructurada con headers. Sistema completo de upload/gestión de imágenes de productos (hasta 5 imágenes, preview, validaciones). Sistema completo de administración de órdenes con filtros avanzados, cambio de estado inline, y vista detalle completa. Sistema completo de gestión de usuarios con upload de avatar a Cloudinary, edición inline de estado/teléfono, sincronización reactiva con AuthService, y componente reutilizable de overlay de avatar. Home Landing Page con hero section, grid de categorías con imágenes, carousel de productos destacados, catálogo público con filtros avanzados por query params, y página de detalle de producto completa con galería de imágenes, selector de variantes, breadcrumbs, tabs informativos, carousel de productos relacionados, y meta tags SEO dinámicos. Sistema de registro post-compra para usuarios guest con vinculación automática de órdenes y direcciones. Perfil de usuario con gestión de información personal, cambio de contraseña, e historial de órdenes. Login refactorizado de página dedicada a popup en header con UX mejorada (sin redirects, permanece en página actual).

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
│   │   ├── login/             # ⚠️ LEGACY (ruta /login eliminada, ahora es popup en header)
│   │   │   ├── login.component.ts     # Código legacy, puede eliminarse
│   │   │   ├── login.component.html
│   │   │   └── login.component.css
│   │   └── register/          # ✅ FASE 10: Registro post-compra
│   │       ├── register.component.ts  # ✅ Formulario reactivo con auto-login
│   │       ├── register.component.html # ✅ Template con botón "Volver"
│   │       └── register.component.css  # ✅ Estilos para campos deshabilitados
│   ├── home/                  # ✅ FASE 8a: Landing page pública
│   │   └── home.component.ts          # Hero, categorías, destacados
│   ├── profile/               # ✅ FASE 11: Perfil de usuario
│   │   ├── profile.component.ts       # 3 tabs: Info personal, Seguridad, Órdenes
│   │   ├── profile.component.html     # TabView con formularios reactivos
│   │   └── profile.component.css      # Estilos para inputs deshabilitados
│   └── products/              # Catálogo público
│       ├── product-list.component.ts  # ✅ FASE 8b: Catálogo con filtros avanzados
│       └── product-detail/            # ✅ FASE 8c: Detalle de producto
│           ├── product-detail.component.ts
│           ├── product-detail.component.html
│           └── product-detail.component.css
│
├── shared/                    # Utilidades reutilizables
│   ├── constants/
│   │   └── validation-messages.ts     # ✅ Mensajes de validación centralizados
│   ├── utils/
│   │   ├── form-errors.util.ts        # ✅ Helper para manejo de errores de formularios
│   │   └── seo.util.ts                # ✅ FASE 8c: Helpers SEO (truncate, buildUrl, sanitize)
│   ├── components/            # Componentes reutilizables
│   │   ├── public-header/             # ✅ FASE 11: Header con login popup
│   │   │   ├── public-header.component.ts    # Botón login + ConfirmPopup
│   │   │   ├── public-header.component.html  # FormGroup de login integrado
│   │   │   └── public-header.component.css   # Estilos para botón y popup
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
├── app.routes.ts              # ✅ Rutas configuradas (register, products, admin/*, profile)
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
- **Métodos**: `login()`, `logout()`, `refresh()`, `initializeAuth()`, `getCurrentUser()`, `register()`
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

#### ✅ FASE 8c: Product Detail (Detalle de Producto)
**ProductDetailComponent** (`/products/:id`):
  - ✅ Galería de imágenes con thumbnails verticales (responsive: horizontal en mobile)
  - ✅ Imagen principal con PrimeNG Image (preview mode)
  - ✅ Información del producto: Nombre, código, descripción, categoría, estilo, tags
  - ✅ Rating y reviews (placeholder para futura implementación)
  - ✅ **Selector de Variantes Inteligente**:
    - ✅ Selector de color con chips visuales (hex colors reales)
    - ✅ Selector de talla (P, M, G, GG) con estado disabled dinámico
    - ✅ Lógica dependiente: Colores filtrados por tallas disponibles y viceversa
    - ✅ Precio y stock de la variante seleccionada
    - ✅ Validación: Deshabilitar combinaciones sin stock
  - ✅ **Agregar al Carrito** (placeholder para FASE 9):
    - ✅ Input de cantidad con min/max basado en stock (PrimeNG InputNumber)
    - ✅ Botón deshabilitado si no hay variante seleccionada o sin stock
    - ✅ Toast de confirmación (placeholder)
  - ✅ **Breadcrumbs**: Home > Categoría > Nombre Producto (PrimeNG Breadcrumb)
  - ✅ **Tabs Informativos** (PrimeNG v20 Tabs):
    - ✅ Product Description (descripción, especificaciones, tags)
    - ✅ Customer Reviews (placeholder con rating summary)
    - ✅ Shipping Information (texto estático)
    - ✅ Return Policy (texto estático)
  - ✅ **Productos Relacionados**:
    - ✅ Carousel con hasta 6 productos de la misma categoría (PrimeNG Carousel)
    - ✅ Usa ProductCardComponent reutilizable en modo grid
    - ✅ Responsive: 3 en desktop, 2 en tablet, 1 en mobile
    - ✅ Método `getRelatedProducts()` en ProductService
  - ✅ **SEO y Meta Tags Dinámicos**:
    - ✅ Title: `[Nombre Producto] - Tu Tienda`
    - ✅ Meta description truncada a 160 chars (respetando palabras)
    - ✅ Open Graph tags (og:title, og:description, og:image, og:url, og:type)
    - ✅ Twitter Card tags (twitter:card, twitter:title, twitter:description, twitter:image)
    - ✅ Keywords dinámicos desde tags del producto
    - ✅ `seo.util.ts` con helpers reutilizables (`truncateDescription`, `buildPageUrl`, `sanitizeMetaText`)
    - ✅ Cleanup automático en `ngOnDestroy()`
  - ✅ **Responsive Design Completo**:
    - ✅ Desktop: Grid 3 columnas (thumbnails | imagen | info panel)
    - ✅ Tablet: Grid ajustado con thumbnails más pequeños
    - ✅ Mobile: Stack vertical con thumbnails horizontales scroll
    - ✅ Loading, error y empty states para todos los componentes

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

### ✅ FASE 10: Guest Checkout & Post-Purchase Registration

Sistema completo para permitir que usuarios anónimos completen compras y luego creen cuentas vinculando automáticamente su orden.

#### Flujo de Usuario

```
Guest completa compra → /order-success-guest/:id
  ↓ (clic "Crear Cuenta")
Navega a /register con datos pre-llenados
  ↓ (completa password + términos)
POST /auth/register (con linkedGuestOrderId)
  ↓
Backend vincula orden + crea dirección
  ↓
Auto-login automático
  ↓
Redirect a /products con toast: "Orden ORD-XXX vinculada" ✅
```

#### Componentes Implementados

**RegisterComponent** (`/register`):
- Formulario reactivo con validaciones completas
- **Campos pre-llenados** (desde router state):
  - Email, firstName, lastName, phone (deshabilitados visualmente)
  - Datos extraídos de `shippingAddress` de la orden guest
- **Campos requeridos** (usuario completa):
  - Password (min 6 caracteres, con PrimeNG Password strength indicator)
  - Confirm Password (validación de coincidencia)
  - Accept Terms (checkbox required)
- **Banner informativo**: Muestra número de orden si viene de guest checkout
- **Auto-login**: Después de registro exitoso, llama `login()` automáticamente
- **Manejo de errores**: Toasts diferenciados (success, warn, error)

**OrderSuccessGuestComponent** actualizado:
- Método `goToRegister()` prepara datos:
  - Parsea `fullName` → `firstName` + `lastName`
  - Pasa `orderId` y `orderNumber` en router state
  - Navega a `/register` con state completo

#### AuthService - Métodos principales

**register()**:
```typescript
register(registerDto: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  linkedGuestOrderId?: string;  // ← Vincula orden guest
}): Observable<{ user: User }>
```

- Endpoint: `POST /auth/register`
- Retorna usuario creado (backend ya vinculó orden y creó address)
- Frontend debe llamar `login()` después para autenticar

#### Validaciones

**Frontend:**
- Email válido (email validator)
- Passwords coincidentes (custom validator)
- Términos aceptados (requiredTrue)
- Min 2 caracteres para nombres

**Backend:**
- Email único (ConflictException si ya existe)
- **Orden no hijackeable**:
  - ✅ Mismo usuario reintenta vincular → Success (idempotente)
  - ❌ Usuario diferente intenta vincular → `BadRequestException`
- Password hasheado con bcrypt
- Rate limiting: 3 registros/minuto (Throttle)

#### Persistencia de Datos

**Sin persistencia en router state** (decisión arquitectónica):
- Datos viajan solo en memoria vía `router.navigate({ state })`
- Si usuario recarga `/register` → pierde datos pre-llenados
- **Razón**: Simplicidad + seguridad (no exponer endpoint público de órdenes guest)
- **Trade-off aceptado**: 99% de usuarios registran inmediatamente

#### Rutas Actualizadas

```typescript
// app.routes.ts
{
  path: 'register',
  loadComponent: () =>
    import('./features/auth/register/register.component').then(
      (m) => m.RegisterComponent
    )
}
```

#### Integración Backend

Ver `../ecommerce-back/CLAUDE.md` sección "Guest Checkout & Post-Purchase Registration" para:
- `UserRegistrationService` (Facade pattern)
- `OrderService.linkGuestOrderToUser()` con validaciones
- Arquitectura sin dependencias circulares (AuthModule imports OrderModule)

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

**Última actualización**: 2025-11-20

### Recent Updates (2025-11-20)

**Admin Orders - View Current User Profile** ✅:
- **Order Model** (`order.model.ts`):
  - Agregado campo `userId?: string` en interface `Order`
  - Permite identificar al usuario propietario de órdenes registradas
- **UserDetailComponent** en modo readonly:
  - Agregado input `readonly: boolean` para desactivar edición
  - Estado readonly: Avatar sin cursor clickeable, campos deshabilitados
  - Footer simplificado: Solo botón "Cerrar" (sin "Guardar Cambios")
- **OrderDetailComponent** (`admin/orders/order-detail`):
  - Nueva fila "Tipo de Orden" con badge (Invitado/Registrado)
  - Botón "Ver perfil actual" visible solo para órdenes de usuarios registrados
  - Lazy loading del usuario: GET `/users/:userId` solo cuando admin hace clic
  - Popup con `UserDetailComponent` en modo readonly
  - Loading state en botón mientras carga usuario
- **PublicHeaderComponent** - Fix menu dinámico:
  - Convertido `userMenuItems` de propiedad estática a getter dinámico
  - Ahora se recalcula automáticamente cuando cambia `isAdmin()`
  - Fix: "Panel Admin" aparece inmediatamente después de login (sin necesidad de navegar)
- **Arquitectura de datos**:
  - Tabla de órdenes: Muestra `customerName` del snapshot (sin requests extra)
  - Detalle de orden: Muestra snapshot + botón para ver perfil actual
  - Popup de usuario: Lazy loading solo cuando admin necesita (1 request bajo demanda)

**FASE 11 - User Profile & Login Refactor** ✅ COMPLETADA:

### Perfil de Usuario:
- **ProfileComponent** implementado con navegación lateral simple (3 secciones)
  - **Menú lateral**: HTML + Tailwind (NO PrimeNG Menu) para máxima simplicidad y control
    - Estado activo controlado por signal `activeSection`
    - Clases condicionales con `[class.bg-blue-50]`, `[class.border-l-4]`, etc.
    - Persistencia visual del ítem activo (no se pierde al hacer clic fuera)
    - Navegación con query params: `/profile?tab=orders` abre directamente la sección de órdenes
  - **Sección 1: Información Personal** - Formulario reactivo para actualizar firstName, lastName, phone (email disabled)
  - **Sección 2: Seguridad** - Cambio de password con validación de password actual + PrimeNG Password strength indicator
  - **Sección 3: Historial de Órdenes** - Tabla con órdenes del usuario (reutiliza OrderService)
  - **Botón "Volver"** centrado arriba (usa location.back())
- **Backend endpoints**:
  - `PATCH /auth/profile` - Actualiza info personal (firstName, lastName, phone)
  - `POST /auth/change-password` - Cambia password con validación + invalida todos los refresh tokens (logout automático)
- **AuthService métodos** (frontend):
  - `updateProfile(data)` - Actualiza perfil y sincroniza signal currentUser
  - `changePassword(data)` - Cambia password → Logout automático → Redirect a /login
- **Ruta `/profile`** protegida con `authGuard`
- **Links en header** (public-header dropdown):
  - "Mi Perfil" → `/profile` (abre sección "Información Personal")
  - "Mis Órdenes" → `/profile?tab=orders` (abre directamente sección de órdenes)
- **UX Features**:
  - Headless ConfirmDialog al cambiar password (advierte logout en todos los dispositivos)
  - Botones deshabilitados si form.invalid o form.pristine
  - Loading states en todos los botones
  - Empty state en historial de órdenes con botón "Ver Productos"
  - Toasts de confirmación/error en todas las operaciones
  - Rate limiting: 5 intentos/minuto en change-password
  - Menú lateral simple y expandible (fácil agregar nuevas secciones)
- **Sincronización reactiva**: Cambios en perfil se reflejan en header automáticamente
- **Arquitectura simplificada**: Menú HTML puro sin dependencias de PrimeNG MenuItem API (más mantenible)

### Login Refactor (Página → Popup):
- **Ruta `/login` ELIMINADA** - Login ahora es popup en header (NO página dedicada)
- **PublicHeaderComponent** actualizado:
  - **Botón de login circular** (icono `pi-user`) visible solo cuando NO está autenticado
  - Posicionado a la derecha del carrito para consistencia visual
  - **PrimeNG ConfirmPopup** con formulario de login completo:
    - Campos email/password con validaciones centralizadas
    - Loading state en botón submit
    - Link "Regístrate" que navega a `/register`
    - Sin botones "Yes/No" (acceptVisible/rejectVisible: false)
    - Sin header gigante (diseño minimalista)
  - **Lógica de login**:
    - Permanece en página actual después de login exitoso (NO redirect)
    - Toast de bienvenida personalizado con nombre del usuario
    - Cierra popup automáticamente
    - Resetea formulario
- **auth.guard.ts** actualizado:
  - Redirige a `/` (home) en vez de `/login` cuando usuario NO autenticado
  - Muestra toast informativo: "Inicia sesión para acceder a esta sección"
  - Usuario puede hacer clic en botón de login del header
- **RegisterComponent** actualizado:
  - Link "Inicia sesión" ELIMINADO del footer
  - Reemplazado por botón "Volver" centrado (usa location.back())
  - Login solo accesible desde botón en header
- **Flujos de usuario**:
  - Usuario anónimo → clic botón header → popup login → éxito → permanece en página
  - Usuario anónimo intenta `/profile` → guard bloquea → redirect home + toast → clic login → éxito
  - Desde popup login → clic "Regístrate" → navega a `/register` → después puede volver con botón

**FASE 10 - Guest Checkout & Post-Purchase Registration** ✅ COMPLETADA:
- **RegisterComponent** implementado con formulario reactivo completo
  - Campos pre-llenados y deshabilitados (email, nombre, teléfono) desde router state
  - Validación de passwords coincidentes y términos aceptados
  - Banner informativo si viene de guest checkout
  - Auto-login post-registro exitoso
- **AuthService.register()** agregado con soporte para `linkedGuestOrderId`
- **OrderSuccessGuestComponent** actualizado:
  - Método `goToRegister()` parsea `fullName` y pasa datos completos en state
  - Botón "Crear Cuenta" navega a `/register` con pre-llenado
- **Ruta `/register`** agregada con lazy loading
- **Integración backend**: Vinculación automática de orden guest + creación de dirección default
- **Validaciones estrictas**: Prevención de hijacking de órdenes (idempotente mismo usuario, bloqueado usuario diferente)
- **UX optimizada**: Sin persistencia en router state (decisión arquitectónica), registro inmediato post-compra

**FASE 8c** - Página de detalle de producto completa con galería de imágenes, selector inteligente de variantes, breadcrumbs, tabs informativos con PrimeNG v20, carousel de productos relacionados de la misma categoría, y sistema completo de meta tags SEO dinámicos con Open Graph y Twitter Cards. Implementado `seo.util.ts` reutilizable con helpers de truncado, sanitización y construcción de URLs.

---

## 🚀 FASES EN DESARROLLO (Roadmap 2025)

### FASE 12: Mercado Pago - Checkout Pro (Prioridad Alta) 🔄

**Objetivo**: Integrar pasarela de pagos para habilitar transacciones reales con PIX, tarjetas de crédito/débito y boleto bancário.

**Documentación**: Ver `docs/MERCADO_PAGO_INTEGRATION.md` para guía completa de integración.

#### Backend (NestJS + Mongoose)

**Módulo de Pagos** (`src/payment/`):
- [ ] **Payment Schema** (Mongoose):
  - Campos: `mercadoPagoId`, `preferenceId`, `orderId`, `status`, `amount`, `paymentMethod`, `paymentTypeId`, `statusDetail`, `metadata`, `paidAt`
  - Enum `PaymentStatus`: `pending`, `approved`, `authorized`, `in_process`, `in_mediation`, `rejected`, `cancelled`, `refunded`, `charged_back`
  - Relación `@Prop({ type: Types.ObjectId, ref: 'Order' })` con Order
  - Índices: `mercadoPagoId` (único), `preferenceId` (único), `orderId`

- [ ] **MercadoPagoService**:
  - SDK: `npm install mercadopago` (v2.0+)
  - `createPreference(order)`: Genera preference con items, payer, back_urls, notification_url, metadata
  - `getPayment(paymentId)`: Busca detalles de pago en MP API
  - `validateWebhookSignature(headers, body)`: HMAC-SHA256 para verificar autenticidad del webhook

- [ ] **PaymentService**:
  - `createPaymentPreference(orderId)`: Crea preference y salva Payment con status PENDING
  - `processWebhook(webhookData)`: Procesa notificación de MP, actualiza Payment y Order status
  - `getPaymentStatus(orderId)`: Verifica status manualmente (fallback si webhook falla)
  - Idempotencia: Verificar si webhook ya fue procesado (prevenir duplicados)

- [ ] **Endpoints**:
  - `POST /payments/create-preference` (body: `{ orderId }`) - Retorna `{ preferenceId, initPoint }`
  - `POST /webhooks/mercadopago` (sin auth, signature validation) - Recibe notificaciones de MP
  - `GET /payments/:orderId/status` (auth required) - Status manual

- [ ] **Actualización Order Schema**:
  - Agregar: `@Prop({ type: [{ type: Types.ObjectId, ref: 'Payment' }] }) payments: Types.ObjectId[]`
  - Agregar: `@Prop() lastWebhookProcessedAt?: Date`
  - Mantener: `paymentStatus` (enum existente actualizado con valores de MP)

- [ ] **Variables de Entorno** (`.env`):
  ```env
  MP_PUBLIC_KEY=TEST-xxxxxxxx (test) / APP_USR-xxxxxxxx (prod)
  MP_ACCESS_TOKEN=TEST-xxxxxxxx (test) / APP_USR-xxxxxxxx (prod)
  MP_WEBHOOK_SECRET=xxxxxxxx
  MP_SUCCESS_URL=http://localhost:4200/order-success
  MP_FAILURE_URL=http://localhost:4200/order-failure
  MP_PENDING_URL=http://localhost:4200/order-pending
  ```

**Testing Backend**:
- [ ] Credenciais test do painel MP
- [ ] Cartões de teste (aprovado, rejeitado, fundos insuficientes)
- [ ] ngrok para expor localhost aos webhooks
- [ ] Validar signature com MP_WEBHOOK_SECRET de teste

#### Frontend (Angular)

**PaymentService** (`core/services/payment.service.ts`):
- [ ] `createPreference(orderId): Observable<{ preferenceId, initPoint }>`
- [ ] `getPaymentStatus(orderId): Observable<PaymentStatusResponse>`
- [ ] Interfaces: `PreferenceResponse`, `PaymentStatusResponse`

**CheckoutComponent** (atualizado):
- [ ] Botão "Pagar com Mercado Pago" (PrimeNG Button)
- [ ] Loading state durante criação de preference
- [ ] Toast informativo: "Redirecionando para pagamento seguro..."
- [ ] `window.location.href = initPoint` (redirect para MP)

**Páginas de Retorno**:

1. **OrderSuccessComponent** (`/order-success`):
   - Extrai query params: `payment_id`, `status`, `external_reference` (order ID)
   - Toast de sucesso com número da ordem
   - Verifica status no backend (fallback se webhook atrasou)
   - Mostra método de pagamento usado
   - CTA: "Ver Meus Pedidos" → `/profile?tab=orders`

2. **OrderFailureComponent** (`/order-failure`):
   - Extrai `status_detail` para mostrar razão da rejeição
   - Mensagens amigáveis: "Saldo insuficiente", "Código de segurança inválido", etc.
   - Botões: "Tentar Novamente" (volta ao checkout) / "Voltar ao Carrinho"

3. **OrderPendingComponent** (`/order-pending`):
   - Para PIX: "Escaneie o QR code ou copie o código"
   - Para Boleto: "Pague até a data de vencimento"
   - Aviso: "Você receberá email quando pagamento for confirmado"
   - CTA: "Acompanhar Pedido" → `/profile?tab=orders`

**Rutas** (`app.routes.ts`):
```typescript
{ path: 'order-success', loadComponent: () => import('./features/checkout/order-success/order-success.component') },
{ path: 'order-failure', loadComponent: () => import('./features/checkout/order-failure/order-failure.component') },
{ path: 'order-pending', loadComponent: () => import('./features/checkout/order-pending/order-pending.component') }
```

#### Produção

**Checklist Go-Live**:
- [ ] Criar conta Mercado Pago Brasil (mercadopago.com.br)
- [ ] Verificação de identidade (CPF pessoa física / CNPJ pessoa jurídica)
- [ ] Registrar chave PIX (obrigatório para aceitar PIX)
- [ ] Cadastrar conta bancária para receber fundos
- [ ] Obter credenciais de produção (diferentes das de teste!)
- [ ] Configurar webhook URL com HTTPS (certificado SSL obrigatório)
- [ ] Passar no Integration Quality Check do MP (ferramenta de certificação)
- [ ] Teste real com valor mínimo (R$ 0,01)

**Fees Mercado Pago (2025)**:
- PIX: ~0,99% - 1,99%
- Cartão Crédito: ~3,99% + taxa fixa
- Cartão Débito: ~2,99% + taxa fixa
- Boleto: Taxa fixa (~R$ 3,49) + percentual

**Tempo estimado**: 7-10 dias (desenvolvimento 5 dias + aprovação MP 2-5 dias)

---

### FASE 13: CEP API - Busca Automática de Endereço (Prioridade Média)

**Objetivo**: Auto-preenchimento de endereço no checkout com busca por CEP (Código de Endereçamento Postal).

**Documentação**: Ver `docs/CEP_API_INTEGRATION.md` para detalhes de implementação.

#### Backend (NestJS)

**CepModule** (`src/cep/`):
- [ ] **CepService**:
  - `findByCep(cep: string): Promise<CepResponse>`
  - Estratégia dual com fallback:
    1. **ViaCEP** (primário): `https://viacep.com.br/ws/{cep}/json` (grátis, CORS habilitado)
    2. **BrasilAPI** (fallback): `https://brasilapi.com.br/api/cep/v2/{cep}` (CDN global, coordenadas GPS)
  - Timeout: 5 segundos por API
  - Sanitização: Remover não-numéricos, validar 8 dígitos
  - Error handling: 404 se CEP não encontrado, 503 se APIs indisponíveis

- [ ] **CepController**:
  - `GET /cep/:cep` → `CepResponse`
  - Throttling: 20 requests/minuto (prevenir abuso)

- [ ] **Redis Caching**:
  - TTL: 30 dias (CEPs são dados estáveis)
  - Chave: `cep:{cleanCep}` (ex: `cep:01001000`)
  - Max entries: 10.000 - 50.000 CEPs
  - Cache hit rate esperado: > 80%

**Instalação**:
```bash
npm install @nestjs/axios axios
npm install @nestjs/cache-manager cache-manager cache-manager-redis-store
```

**Interface CepResponse**:
```typescript
{
  cep: string;
  street: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  ibge?: string;
  latitude?: string;  // Apenas BrasilAPI V2
  longitude?: string; // Apenas BrasilAPI V2
  provider: 'ViaCEP' | 'BrasilAPI';
  fromCache?: boolean;
}
```

#### Frontend (Angular)

**CepService** (`core/services/cep.service.ts`):
- [ ] `findByCep(cep: string): Observable<CepResponse>`
- [ ] Sanitização: `cep.replace(/\D/g, '')` (remove hífen)

**CheckoutComponent** (atualizado):
- [ ] **Campo CEP**:
  - `<p-inputMask mask="99999-999" placeholder="00000-000" />`
  - Validação: 8 dígitos obrigatórios
  - `valueChanges` pipe: `debounceTime(500)` → `filter(8 digits)` → `switchMap(cepService.findByCep)`

- [ ] **Auto-preenchimento**:
  - Preencher automaticamente: `street`, `neighborhood`, `city`, `state`
  - Desabilitar campos preenchidos (fundo cinza, `{ value: '', disabled: true }`)
  - Usuário digita apenas: CEP → Número → Complemento (opcional)
  - Auto-focus no campo "Número" após auto-preenchimento

- [ ] **Loading State**:
  - Signal: `loadingCep = signal(false)`
  - Spinner: `<p-button icon="pi pi-spin pi-spinner" [disabled]="true" />` ao lado do input

- [ ] **Feedback Visual**:
  - Toast Success: "CEP encontrado - São Paulo - SP" (3s)
  - Toast Warn: "CEP não encontrado - Preencha manualmente" (5s)
  - Toast Error: "Erro ao buscar CEP - Tente novamente" (5s)

- [ ] **Fallback Manual**:
  - Se CEP não encontrado, habilitar todos os campos para input manual
  - Não bloquear checkout (CEPs novos podem não existir nas APIs)

**UX Best Practices**:
- Debounce 500ms: Evita requisição a cada dígito digitado
- Auto-focus: Move cursor para campo "Número" após auto-fill
- Input mask: Hífen automático no formato 00000-000
- Campos desabilitados: Indica dados auto-preenchidos (confiáveis)

**Tempo estimado**: 3 dias (backend 1 dia + frontend 1 dia + testes 1 dia)

---

### FASE 14: LGPD Compliance - Conformidade Legal (Prioridade Alta)

**Objetivo**: Cumprir Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) para evitar multas (até 2% do faturamento, máx R$ 50 milhões).

**Documentação**: Ver `docs/LGPD_COMPLIANCE.md` para checklist completo.

#### Páginas Legais (Frontend)

- [ ] **PrivacyPolicyComponent** (`/privacy-policy`):
  - Seções obrigatórias:
    - Quais dados coletamos (nome, email, CPF, endereço, histórico de compras)
    - Finalidade de cada coleta (entrega, nota fiscal, marketing)
    - Base legal (execução de contrato, consentimento, obrigação legal)
    - Com quem compartilhamos (Mercado Pago, Cloudinary, Correios)
    - Prazo de retenção (5 anos para dados fiscais)
    - Direitos do titular (acesso, correção, portabilidade, eliminação)
    - Contato do DPO: `dpo@suaempresa.com.br`
    - Data da última atualização

- [ ] **TermsOfServiceComponent** (`/terms`):
  - Condições de uso da plataforma
  - Política de devolução/reembolso
  - Garantias de produtos
  - Limitações de responsabilidade
  - Lei aplicável (Brasil) e foro (jurisdição)

- [ ] **Links no Footer** (todas as páginas):
  - "Política de Privacidade" → `/privacy-policy`
  - "Termos de Serviço" → `/terms`

#### Sistema de Consentimento

**RegisterComponent** (atualizado):
- [ ] Checkbox obrigatório: "Li e aceito a Política de Privacidade e Termos de Serviço" (links clicáveis)
- [ ] Checkbox opcional: "Aceito receber emails com ofertas e novidades" (marketing)

**CheckoutComponent** (guest):
- [ ] Checkbox obrigatório: "Li e aceito os Termos de Serviço"
- [ ] Checkbox pré-marcado (pode desmarcar): "Aceito receber emails sobre meu pedido"

**CPF opcional** (se FASE 15 implementada):
- [ ] Checkbox: "Autorizo armazenamento do meu CPF para emissão de nota fiscal (retenção: 5 anos)"
- [ ] Texto explicativo abaixo do checkbox

**Cookie Banner**:
- [ ] Banner na primeira visita (bottom fixo)
- [ ] Opções: "Aceitar Todos" / "Apenas Essenciais" / "Personalizar"
- [ ] Link: "Política de Cookies"

#### Direitos dos Titulares (Backend + Frontend)

1. **Direito de Acesso** ✅ (já implementado parcialmente no perfil)
   - [ ] Endpoint: `GET /users/me/data` (JSON completo)
   - [ ] Incluir: Dados cadastrais, endereços, pedidos, consentimentos, logs de acesso

2. **Direito de Correção** ✅ (já implementado no ProfileComponent)
   - [ ] Formulário editável no perfil

3. **Direito de Portabilidade**:
   - [ ] Endpoint: `GET /users/me/export`
   - [ ] Formato: JSON (machine-readable)
   - [ ] Frontend: Botão "Baixar Meus Dados" no perfil
   - [ ] Inclui TUDO: Dados pessoais + histórico completo de pedidos/pagamentos

4. **Direito de Eliminação (Esquecimento)**:
   - [ ] Endpoint: `DELETE /users/me`
   - [ ] Frontend: Botão "Excluir Minha Conta" (seção Segurança no perfil)
   - [ ] ConfirmDialog: "Esta ação é irreversível. Seus dados serão anonimizados."
   - [ ] Estratégia: **Soft delete + anonimização** (manter pedidos por 5 anos para obrigação fiscal)
     - Anonimizar: `email = 'deleted_${userId}@anonymized.local'`, `name = 'Usuário Excluído'`, `cpf = null`, `phone = null`
     - Manter pedidos: Converter `customerName` → "Cliente Excluído", `customerEmail` → `deleted_${userId}@...`

5. **Direito de Oposição** (marketing):
   - [ ] Checkbox no perfil: "Desejo receber emails marketing" (pode desmarcar)
   - [ ] Link "Descadastrar" em todos os emails marketing
   - [ ] Endpoint: `POST /users/me/unsubscribe`

6. **Revogação de Consentimento**:
   - [ ] Seção "Gerenciar Consentimentos" no ProfileComponent
   - [ ] Lista com toggles:
     - "Receber emails marketing"
     - "Armazenar meu CPF para nota fiscal" (se FASE 15)
   - [ ] Endpoint: `POST /users/me/consents/:type/revoke`

#### Registro de Consentimentos (Backend)

**UserConsent Schema** (Mongoose):
```typescript
{
  userId: Types.ObjectId (ref 'User'),
  consentType: string, // 'privacy_policy', 'marketing_emails', 'cpf_storage'
  granted: boolean,
  ipAddress: string,  // Prova de onde foi dado
  userAgent: string,  // Browser/dispositivo
  grantedAt: Date,
  revokedAt?: Date
}
```

#### Vendor Management (DPAs)

**Data Processing Agreements** a assinar:
- [ ] Mercado Pago
- [ ] Cloudinary
- [ ] Hosting Provider (AWS/Vercel/etc.)
- [ ] Email Service (SendGrid/etc.)
- [ ] Google Analytics (se usar, com IP anonimizado)

**Documentar em Privacy Policy**: Lista de vendors e finalidade

#### Segurança

**Já implementado**:
- ✅ HTTPS (SSL/TLS)
- ✅ Senhas hasheadas com bcrypt
- ✅ JWT + refresh tokens (httpOnly cookies)
- ✅ Rate limiting (Throttler)

**Adicionar**:
- [ ] CPF criptografado (AES-256) se armazenado (FASE 15)
- [ ] Audit logs (`AuditLog` schema):
  ```typescript
  {
    userId, action, resourceType, resourceId, ipAddress, userAgent, timestamp
  }
  ```
- [ ] Logs de acesso: Quem acessou quais dados e quando

#### Plano de Resposta a Incidentes

**Procedimento obrigatório**:
1. Detectar: Monitoramento alerta anomalias
2. Conter: Isolar sistemas afetados imediatamente
3. Avaliar: Gravidade (quantos afetados, tipo de dados)
4. **Notificar ANPD**: Prazo razoável (~72h)
5. **Notificar Titulares**: Se risco relevante a direitos/liberdades
6. Documentar: Relatório completo do incidente
7. Mitigar: Corrigir vulnerabilidade, reforçar segurança

**Template de email**: Ver `docs/LGPD_COMPLIANCE.md` seção 9

#### Política de Retenção

| Tipo de Dado | Prazo | Base Legal |
|-------------|-------|-----------|
| Dados cadastrais | Conta ativa + 5 anos | Obrigação fiscal |
| Histórico de pedidos | 5 anos | Obrigação fiscal (Receita Federal) |
| CPF (nota fiscal) | 5 anos | Obrigação fiscal |
| Logs de acesso | 6-12 meses | Segurança da informação |
| Emails marketing | Até revogação | Consentimento |

**Auto-delete cron job**:
- [ ] Deletar contas inativas há mais de 5 anos
- [ ] Deletar logs de acesso antigos (1 ano)
- [ ] Executar diariamente às 2 AM

**Tempo estimado**: 1-2 semanas (páginas legais 2 dias + consentimentos 2 dias + direitos 5 dias + auditoría 3 dias)

---

### FASE 15: CPF Opcional para Nota Fiscal (Prioridade Baixa)

**Objetivo**: Permitir que clientes forneçam CPF para geração de Nota Fiscal Eletrônica (NF-e), cumprindo obrigação fiscal brasileira.

**⚠️ IMPORTANTE**: CPF **NÃO** deve ser obrigatório (LGPD). Apenas opcional com consentimento explícito.

#### Backend

**User Schema** (atualizado):
- [ ] `@Prop({ type: String, required: false }) cpfEncrypted?: string` (AES-256)
- [ ] Não armazenar CPF em texto plano (violação LGPD)

**Order Schema** (atualizado):
- [ ] `@Prop() cpf?: string` (opcional, para vincular à NF-e)

**CpfService** (`src/cpf/cpf.service.ts`):
- [ ] `encryptCpf(cpf: string): string` (AES-256 com IV)
- [ ] `decryptCpf(encrypted: string): string`
- [ ] `validateCpf(cpf: string): boolean` (validação de dígitos verificadores)

**Instalação**:
```bash
npm install cpf-cnpj-validator
```

**Endpoints**:
- [ ] `PATCH /users/me/cpf` (body: `{ cpf, consent: boolean }`)
  - Validar CPF com `cpf-cnpj-validator`
  - Criptografar antes de salvar
  - Registrar consentimento em `UserConsent`

**Política de Retenção**:
- [ ] Auto-delete após 5 anos (obrigação fiscal brasileira - Receita Federal)
- [ ] Cron job diário

#### Frontend

**CheckoutComponent** (atualizado):
- [ ] **Campo CPF** (opcional):
  - `<p-inputMask mask="999.999.999-99" placeholder="000.000.000-00" />`
  - Label: "CPF (opcional - para nota fiscal)"
  - Validação: Usar `@fnando/cpf` (npm)

- [ ] **Consentimento LGPD**:
  - Checkbox: "Autorizo o armazenamento do meu CPF para emissão de nota fiscal (retenção: 5 anos)"
  - Obrigatório marcar se preencheu CPF

**ProfileComponent** (atualizado):
- [ ] Adicionar campo CPF em tab "Informações Pessoais"
- [ ] Mostrar parcialmente mascarado: `***. 456.789-**`
- [ ] Permitir edição/remoção

**Instalação**:
```bash
npm install @fnando/cpf
```

**Validação customizada**:
```typescript
import { isValid as isValidCpf } from '@fnando/cpf';

private cpfValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value?.replace(/\D/g, '');
  if (!value) return null; // Campo opcional
  if (!isValidCpf(value)) {
    return { invalidCpf: 'CPF inválido' };
  }
  return null;
}
```

#### Nota Fiscal (Futuro)

**Integração com proveedores NF-e**:
- [ ] NFe.io
- [ ] Nota Fiscal Paulista (se São Paulo)
- [ ] ENotas
- [ ] Bling

**Geração automática**:
- [ ] Webhook MP: Quando `payment.status === 'approved'` → gerar NF-e se CPF fornecido
- [ ] Email com PDF da NF-e para cliente

**Tempo estimado**: 3 dias (backend 1 dia + frontend 1 dia + testes 1 dia)

---

## 📊 Resumo de Prioridades

| Fase | Nome | Prioridade | Tempo | Impacto |
|------|------|-----------|-------|---------|
| **FASE 12** | Mercado Pago Checkout Pro | 🔴 **ALTA** | 7-10 dias | Habilita pagamentos reais (receita) |
| **FASE 13** | CEP API Auto-fill | 🟡 **MÉDIA** | 3 dias | Melhora UX checkout (conversão) |
| **FASE 14** | LGPD Compliance | 🔴 **ALTA** | 1-2 semanas | Evita multas legais (obrigatório) |
| **FASE 15** | CPF Nota Fiscal | 🟢 **BAIXA** | 3 dias | Nice-to-have (diferencial) |

**Ordem recomendada**: FASE 12 → FASE 14 → FASE 13 → FASE 15

**Tempo total**: 4-6 semanas para completar todas as fases

---

## 📚 Documentação Adicional

Consulte os guias detalhados em `/docs`:
- **`MERCADO_PAGO_INTEGRATION.md`**: Setup completo de pagamentos (testing, produção, troubleshooting)
- **`CEP_API_INTEGRATION.md`**: Comparação de APIs, caching, UX patterns
- **`LGPD_COMPLIANCE.md`**: Checklist legal, templates de políticas, DPAs, penalidades

---

**Última atualização**: 2025-11-23