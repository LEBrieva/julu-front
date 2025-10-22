# E-Commerce Frontend - Angular 20

## 📋 Contexto del Proyecto

Este es el frontend de una aplicación e-commerce completa construida con Angular 20 (standalone components), diseñada para integrarse con el backend NestJS ubicado en `../ecommerce-back`.

**Arquitectura**: Single Page Application (SPA) con dos áreas principales:
- **Admin Dashboard**: Panel de administración para gestionar productos, órdenes y usuarios (requiere rol ADMIN)
- **User Store**: Tienda pública para usuarios finales (navegación de productos, carrito, checkout)

**Estado actual**: FASE 5 con gestión de variantes completada (falta upload de imágenes), FASE 6 completada. Sistema CRUD de productos con gestión avanzada de variantes (tamaños P/M/G/GG, colores en español, stock y precios individuales), edición inline granular, validaciones de duplicados, y tabla estructurada con headers. Sistema completo de administración de órdenes con filtros avanzados, cambio de estado inline, y vista detalle completa.

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
│   │   └── users/             # TODO FASE 7
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
│   ├── components/            # TODO: Componentes reutilizables
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

### Overview
Sistema JWT completo con refresh tokens en httpOnly cookies, auto-refresh en 401, y notificaciones toast.

### Tokens
1. **Access Token (JWT)**:
   - Almacenado en `localStorage` (corta duración: 15 min)
   - Se envía en header `Authorization: Bearer <token>`
   - Contiene: `{ sub: userId, email, role, exp }`

2. **Refresh Token**:
   - Almacenado en **httpOnly cookie** (larga duración: 7 días)
   - El navegador lo envía automáticamente en requests con `withCredentials: true`
   - Solo accesible por el backend (protegido contra XSS)

### Flujo de Autenticación

```typescript
// 1. Login
POST /auth/login { email, password }
→ Response: { accessToken: "eyJ...", user: {...} }
→ Cookie: refreshToken=xyz (httpOnly, secure, sameSite=strict)
→ Frontend guarda accessToken en localStorage
→ AuthService actualiza signal currentUser

// 2. Request con autenticación
GET /orders
→ auth.interceptor inyecta: Authorization: Bearer <accessToken>
→ auth.interceptor agrega: withCredentials: true (para cookies)
→ Backend valida JWT y responde

// 3. Token expirado (401)
GET /orders → 401 Unauthorized
→ error.interceptor detecta 401
→ Toast info: "Renovando sesión..."
→ POST /auth/refresh (con refreshToken cookie)
→ Response: { accessToken: "new_token" }
→ Reintenta request original con nuevo token
→ Toast success: "Sesión renovada"

// 4. Refresh token expirado
POST /auth/refresh → 401
→ Toast warn: "Sesión expirada. Inicia sesión nuevamente"
→ authService.logout()
→ Redirect a /login
```

### AuthService (Signal-based)

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Signal privado (mutable)
  private currentUserSignal = signal<User | null>(null);

  // Signal público (readonly)
  readonly currentUser = this.currentUserSignal.asReadonly();

  // Computed signals (se recalculan automáticamente)
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === UserRole.ADMIN);

  // Métodos principales
  login(email, password): Observable<LoginResponse> // POST /auth/login
  logout(): Observable<void>                        // POST /auth/logout
  refresh(): Observable<RefreshResponse>            // POST /auth/refresh
  initializeAuth(): void                            // Restaura sesión al iniciar app
}
```

**Uso en componentes**:
```typescript
export class HeaderComponent {
  private authService = inject(AuthService);

  // Acceso reactivo a los signals
  currentUser = this.authService.currentUser;      // Signal<User | null>
  isAuthenticated = this.authService.isAuthenticated; // Signal<boolean>
  isAdmin = this.authService.isAdmin;              // Signal<boolean>
}
```

```html
<!-- En template (se actualiza automáticamente) -->
@if (isAuthenticated()) {
  <p>Bienvenido {{ currentUser()?.email }}</p>
  @if (isAdmin()) {
    <a routerLink="/admin">Panel Admin</a>
  @endif
}
```

### Interceptors

#### 1. `auth.interceptor.ts` (Inyecta JWT)
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('accessToken');
  if (!token) return next(req);

  // Clonar request y agregar Authorization header + withCredentials
  const clonedRequest = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
    withCredentials: true // ⭐ Crucial para enviar httpOnly cookies
  });

  return next(clonedRequest);
};
```

#### 2. `error.interceptor.ts` (Manejo de errores + Toasts)
Captura TODOS los errores HTTP y muestra notificaciones toast:

| Status | Severity | Acción |
|--------|----------|--------|
| 400 | warn | Muestra errores de validación del backend |
| 401 | info → success/warn | Intenta refresh automático + toast de estado |
| 403 | error | "Acceso Denegado - No tienes permisos" |
| 404 | warn | "No Encontrado - El recurso no existe" |
| 409 | warn | "Conflicto - El recurso ya existe" |
| 429 | warn | "Demasiadas Peticiones - Intenta en X segundos" (extrae header `X-RateLimit-Reset`) |
| 500+ | error | "Error del Servidor - Intenta más tarde" |
| Network | error | "Error de Conexión - Verifica tu internet" |

**Auto-refresh en 401**:
```typescript
function handle401Error(...): Observable<HttpEvent<unknown>> {
  // 1. Verificar que NO sea endpoint de refresh/login (evitar loop infinito)
  if (req.url.includes('/auth/refresh') || req.url.includes('/auth/login')) {
    // Mostrar toast de error y logout
    return throwError(() => originalError);
  }

  // 2. Mostrar toast: "Renovando sesión..."
  messageService.add({ severity: 'info', summary: 'Renovando Sesión' });

  // 3. Llamar a refresh()
  return authService.refresh().pipe(
    switchMap((): Observable<HttpEvent<unknown>> => {
      // Refresh OK → Toast success + reintentar request original
      messageService.add({ severity: 'success', summary: 'Sesión Renovada' });
      return next(req); // El interceptor auth agregará el nuevo token
    }),
    catchError(refreshError => {
      // Refresh falló → Toast warn + logout + redirect
      messageService.add({ severity: 'warn', summary: 'Sesión Expirada' });
      authService.logout().subscribe(() => router.navigate(['/login']));
      return throwError(() => refreshError);
    })
  );
}
```

### Guards (Protección de Rutas)

#### 1. `auth.guard.ts` (Requiere autenticación)
```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true; // Usuario autenticado → permitir acceso
  }

  // Usuario NO autenticado → redirect a /login
  // Guardar URL original en query param para redirect post-login
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
```

#### 2. `admin.guard.ts` (Requiere rol ADMIN)
```typescript
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const messageService = inject(MessageService);
  const router = inject(Router);

  const currentUser = authService.currentUser();

  if (currentUser?.role === UserRole.ADMIN) {
    return true; // Es admin → permitir acceso
  }

  // NO es admin → Toast de error + redirect a /products
  messageService.add({
    severity: 'warn',
    summary: 'Acceso Restringido',
    detail: 'No tienes permisos para acceder al panel de administración.'
  });
  router.navigate(['/products']);
  return false;
};
```

**Uso en rutas** (ejemplo futuro):
```typescript
export const routes: Routes = [
  // Rutas públicas
  { path: 'login', component: LoginComponent },
  { path: 'products', component: ProductListComponent },

  // Rutas autenticadas (cualquier rol)
  {
    path: 'cart',
    component: CartComponent,
    canActivate: [authGuard]
  },

  // Rutas admin (requiere autenticación + rol ADMIN)
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard], // ⭐ Ambos guards
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'products', component: AdminProductsComponent },
      { path: 'orders', component: AdminOrdersComponent },
      { path: 'users', component: AdminUsersComponent }
    ]
  }
];
```

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

### User & Auth Models
```typescript
// core/models/user.model.ts
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResponse {
  accessToken: string; // JWT para localStorage
  user: User;
}

export interface RefreshResponse {
  accessToken: string; // Nuevo JWT después de refresh
}

export interface JwtPayload {
  sub: string;      // userId
  email: string;
  role: UserRole;
  exp?: number;     // Timestamp de expiración
}
```

### API Response Models
```typescript
// core/models/api-response.model.ts
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  total: number;        // Total de items
  page: number;         // Página actual (1-indexed)
  limit: number;        // Items por página
  totalPages: number;   // Total de páginas
}

export interface ApiError {
  statusCode: number;
  message: string | string[]; // String o array de errores de validación
  error: string;              // Ej: "Bad Request", "Unauthorized"
  timestamp: string;
}
```

### Product Models
```typescript
// core/models/product.model.ts
export enum ProductCategory {
  ELECTRONICS = 'electronics',
  CLOTHING = 'clothing',
  HOME = 'home',
  SPORTS = 'sports',
  BOOKS = 'books',
  OTHER = 'other'
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
  status: ProductStatus;
  imageUrl?: string;        // Opcional (FASE 5 bis)
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
  status?: ProductStatus;   // Opcional, default: ACTIVE
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: ProductCategory;
  status?: ProductStatus;
}
```

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

### Ver Token JWT decodificado
```typescript
// En DevTools Console
const token = localStorage.getItem('accessToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload); // { sub, email, role, exp }
```

### Testear Refresh Automático
```typescript
// 1. Login normal
// 2. DevTools → Application → Local Storage → Cambiar accessToken por uno expirado
// 3. Hacer cualquier petición (ej: GET /products)
// 4. Deberías ver toasts:
//    - Info: "Renovando sesión..."
//    - Success: "Sesión renovada correctamente"
```

### Ver Cookies httpOnly
```typescript
// DevTools → Application → Cookies → http://localhost:4200
// Deberías ver: refreshToken (httpOnly: true)
```

### Inspeccionar Requests
```typescript
// DevTools → Network → Headers
// Verificar:
// - Request Headers: Authorization: Bearer eyJ...
// - Request Headers: Cookie: refreshToken=xyz
// - Response Headers: Set-Cookie: refreshToken=new_xyz; HttpOnly; Secure
```

---

## 🔮 Próximos Pasos (Roadmap)

### ✅ FASE 3: Login Component (COMPLETADA)
- [x] Crear componente `features/auth/login` con standalone components
- [x] Formulario reactivo con validaciones (email, password)
- [x] Sistema de validación centralizado en `shared/`:
  - `shared/constants/validation-messages.ts` - Mensajes reutilizables
  - `shared/utils/form-errors.util.ts` - Helper para extraer errores
- [x] Integración completa con AuthService.login()
- [x] Redirección post-login según rol (admin → /admin/dashboard, user → /products)
- [x] Loading state durante autenticación (botón con spinner)
- [x] Manejo de errores con toasts (automático vía error.interceptor)
- [x] UI con PrimeNG usando clases oficiales (`p-password-fluid`)
- [x] Estilos con TailwindCSS (sin hacks ni `!important`)
- [x] Rutas configuradas con lazy loading
- [x] Componentes placeholder (ProductList, AdminDashboard)
- [x] Conexión verificada con backend (CORS configurado)
- [x] Guía de estilos documentada (`STYLING-GUIDELINES.md`)

### ✅ FASE 3 bis: Silent Token Refresh (COMPLETADA)
- [x] Activity tracking para detectar actividad del usuario:
  - Eventos monitoreados: `click`, `keypress`, `scroll`
  - Timestamp de última interacción actualizado en cada evento
  - No incluye `mousemove` para evitar sensibilidad excesiva
- [x] Constantes centralizadas en `core/constants/auth.constants.ts`:
  - `ACCESS_TOKEN_EXPIRATION` - 1 hora (debe coincidir con backend)
  - `SILENT_REFRESH_INTERVAL` - 55 minutos (refresh antes de expirar)
  - `USER_INACTIVITY_THRESHOLD` - 15 minutos (umbral de inactividad)
  - `ACTIVITY_EVENTS` - Array de eventos monitoreados
  - Valores de testing comentados para desarrollo rápido
- [x] Silent refresh automático cada 55 minutos:
  - Verifica actividad del usuario antes de refrescar
  - Si usuario activo (< 15 min inactivo): Refresh automático del token
  - Si usuario inactivo (> 15 min): Logout diferenciado por rol
- [x] Logout diferenciado por rol:
  - **ADMIN inactivo**: Logout completo + redirect a `/login` (seguridad)
  - **USER inactivo**: Logout silencioso sin redirect (se queda en la vista actual)
  - USER puede seguir navegando rutas públicas (`/products`)
  - authGuard redirige a `/login` al intentar acceder a rutas protegidas
- [x] Métodos en AuthService:
  - `setupActivityTracking()` - Configura listeners de eventos
  - `getTimeSinceLastInteraction()` - Calcula tiempo de inactividad
  - `silentLogout()` - Limpia sesión sin POST al backend
  - `startSilentRefresh()` - Inicia intervalo de refresh automático
  - `stopSilentRefresh()` - Detiene intervalo (en logout)
- [x] Integración completa:
  - `initializeAuth()` configura activity tracking al cargar la app
  - `login()` inicia silent refresh después de autenticación exitosa
  - `logout()` detiene silent refresh
  - `refresh()` actualiza token y signal del usuario
- [x] Logs detallados para debugging:
  - `👁️ Activity tracking iniciado`
  - `⏰ Silent refresh iniciado (intervalo: X min, inactividad: Y min)`
  - `🔄 Usuario activo → Refresh automático del token`
  - `⚠️ Usuario inactivo por X minutos`
  - `🔐 ADMIN inactivo → Logout + redirect`
  - `👤 USER inactivo → Logout silencioso`
- [x] Performance optimizations:
  - Event listeners con `{ passive: true }`
  - Previene intervalos duplicados con `stopSilentRefresh()` antes de crear nuevo
  - Limpia recursos al hacer logout

### ✅ FASE 4: Admin Layout (COMPLETADA)
- [x] Crear AdminLayoutComponent con estructura header + sidebar + content
- [x] Implementar lazy loading a nivel de feature module (loadChildren)
- [x] Rutas admin protegidas con authGuard + adminGuard
- [x] Header responsivo con:
  - Logo y título adaptable a mobile/desktop
  - User info (nombre, email) visible solo en desktop (≥1024px)
  - Avatar con iniciales del usuario
  - Dropdown menu con p-menu (Perfil, Cerrar Sesión)
  - Fix de posicionamiento para viewport angosto (`position: fixed` + `right: 0.5rem`)
- [x] Sidebar colapsable con:
  - Toggle button para mobile (hamburger menu)
  - Navegación: Dashboard (activo), Products, Orders, Users (deshabilitados con badge "Próximamente")
  - Items deshabilitados usando `<span>` (no clickeables) vs `<a>` con routerLink
  - Backdrop overlay en mobile cuando está abierto
- [x] Dashboard placeholder limpio (sin header/logout redundante)
- [x] Responsive design:
  - Mobile (< 1024px): Sidebar colapsado por defecto, header compacto
  - Desktop (≥ 1024px): Sidebar fijo, header con info completa
  - Sin scroll horizontal en ningún viewport (fix con `overflow-x: hidden` + `max-width: 100vw`)
- [x] Fix enum mismatch: UserRole values lowercase ('admin', 'user') para coincidir con backend
- [x] Arquitectura de lazy loading optimizada:
  - `app.routes.ts` → `loadChildren` a `admin.routes.ts`
  - `admin.routes.ts` → `loadComponent` para AdminLayoutComponent (wrapper)
  - Children routes con lazy loading individual
  - Chunks generados: admin-layout (~22KB), admin-dashboard (~11KB), admin-routes (~1KB)

### ✅ FASE 5: CRUD de Productos con Gestión de Variantes (Admin) (VARIANTES COMPLETADAS - FALTA IMÁGENES)

#### Modelos de Datos
- [x] Enums actualizados:
  - `ProductSize` (P, M, G, GG) - valores en MAYÚSCULAS
  - `ProductColor` (black, white, gray, navy, red, blue)
  - `ProductStyle` (regular, oversize, slim_fit, straight, skinny, etc.)
  - `ProductCategory` (remera, pantalon, chaqueta, zapatillas, botas, shorts, vestido, blusa)
- [x] Interface `ProductVariant { sku, size, color, stock, price }`
- [x] DTOs para variantes:
  - `CreateProductVariantDto` - Para crear producto con variantes iniciales
  - `AddVariantDto` - Para agregar variante a producto existente
  - `UpdateSingleVariantDto` - Para actualizar stock/price de variante
- [x] Constante `CATEGORY_STYLE_MAP` - Mapeo categoría → estilos válidos
- [x] Helpers de formateo y visualización:
  - `formatSize()` - Retorna tamaño en MAYÚSCULAS (P, M, G, GG)
  - `formatColor()` - Retorna color en español (Negro, Blanco, Gris, etc.)
  - `formatStyle()` - Retorna estilo en español (Regular, Oversize, etc.)
  - `getColorHex()` - Retorna código hex del color para badges (#000000, #FFFFFF, etc.)
  - `getTextColor()` - Retorna color de texto apropiado según fondo
  - `getSizeSeverity()` - Retorna severity de PrimeNG según tamaño (P=info, M/G=success, GG=danger)

#### ProductService
- [x] Métodos CRUD básicos:
  - `getProducts(params)` - Listado paginado con filtros
  - `getProductById(id)` - Detalle de producto
  - `createProduct(dto)` - Crear producto con variantes
  - `updateProduct(id, dto)` - Actualizar datos básicos del producto
  - `activateProduct(id)` / `deactivateProduct(id)` - Cambiar estado
- [x] **Métodos de gestión de variantes**:
  - `addVariant(productId, variant)` → POST `/products/:id/variants`
  - `updateVariant(productId, sku, data)` → PATCH `/products/:id/variants/:sku`
  - `deleteVariant(productId, sku)` → DELETE `/products/:id/variants/:sku`

#### AdminProductsComponent (Lista)
- [x] Tabla responsive con columnas:
  - Código, Nombre (con tags), Categoría, Estilo, Precio Base
  - **Variantes** (badge redondeado con count total)
  - **Stock Total** (suma de todas las variantes, rojo si es 0)
  - Estado, Acciones
- [x] Paginación server-side (lazy loading)
- [x] Búsqueda por nombre/código/descripción
- [x] Botones: Ver detalle, Editar, Activar/Desactivar

#### ProductFormComponent - Modo CREAR
- [x] Formulario de datos básicos:
  - code (requerido, único), name, description, basePrice
  - category (dropdown), style (dropdown dinámico según categoría)
  - tags (chips input opcional)
- [x] **Sección "Variantes"** (PrimeNG Fieldset colapsable):
  - **Formulario inline** para agregar variantes:
    - Size: Dropdown con P, M, G, GG en MAYÚSCULAS
    - Color: Dropdown en español (Negro, Blanco, Gris, Azul Marino, Rojo, Azul)
    - Stock: Input number con botones +/-
    - Price: Input currency (BRL)
  - **Validaciones**:
    - Mínimo 1 variante requerida antes de crear producto
    - No permitir duplicados size+color (validación frontend)
    - Stock y price ≥ 0
  - **Tabla de variantes agregadas** con headers claros:
    - Columnas: Tamaño | Color | Stock | Precio | Acción
    - Badges de tamaño con severity (P=info, M/G=success, GG=danger)
    - Chips de color con hex real del color y texto contrastante
    - Botón eliminar por variante (solo elimina del array local, sin toasts)
  - **Empty state** cuando no hay variantes
  - **Responsive**: Headers ocultos en mobile, labels inline
- [x] Submit: Envía datos básicos + array de variantes al backend

#### ProductFormComponent - Modo EDITAR
- [x] Campos básicos editables (name, description, basePrice, category, style, status, tags)
- [x] Code read-only (no se puede cambiar)
- [x] **Tabla de Variantes** (PrimeNG Table editable):
  - **Columnas**: Tamaño (badge) | Color (chip) | SKU (read-only) | Stock | Precio | Acciones
  - **Edición inline granular** (estilo admin-orders):
    - Click en stock/price → input editable
    - Blur/Enter → guarda **inmediatamente** vía API (PATCH `/products/:id/variants/:sku`)
    - Escape → cancela y restaura valor original
    - Loading state durante guardado
  - **Botón "Agregar Nueva Variante"**:
    - Expande/contrae formulario inline (igual al de modo CREAR)
    - Validación de duplicados size+color
    - Llamada a API: POST `/products/:id/variants`
    - Toast de éxito al agregar
  - **Eliminación de variantes**:
    - PrimeNG ConfirmDialog antes de eliminar
    - Llamada a API: DELETE `/products/:id/variants/:sku`
    - Manejo automático de errores (ej: variante con órdenes asociadas no se puede eliminar)
    - Toast de éxito/error
  - **Empty state** si no hay variantes
- [x] **Guardado granular**: Cada cambio de variante se guarda al instante, independiente del botón "Actualizar Producto"
- [x] Botón "Actualizar Producto" solo actualiza datos básicos (no variantes, ya están guardadas)

#### UI/UX
- [x] **Toasts inteligentes**:
  - Modo CREAR: Sin toasts al agregar/eliminar variantes (es array local)
  - Modo EDITAR: Toasts en operaciones API (agregar, actualizar, eliminar variantes)
- [x] Confirmaciones para eliminaciones
- [x] Loading states en todas las operaciones
- [x] Empty states informativos
- [x] Validaciones frontend antes de llamar al backend
- [x] Diseño responsive completo (mobile-first)

#### Integración Backend
- [x] Endpoints alineados con NestJS
- [x] Validación de duplicados size+color
- [x] Manejo de errores del backend:
  - Code duplicado (409 Conflict)
  - Variante con órdenes no se puede eliminar (400/409)
  - Errores de validación (400 Bad Request)
- [x] Actualización automática del producto completo después de operaciones de variantes

### FASE 5 bis: Upload de Imágenes de Productos (PENDIENTE)
- [ ] Componente de upload de imágenes (PrimeNG FileUpload)
- [ ] Integración con servicio de almacenamiento (backend)
- [ ] Preview de imagen antes de subir
- [ ] Validación de tipo y tamaño de archivo
- [ ] Crop/resize de imágenes (opcional)
- [ ] Galería de imágenes por producto (múltiples imágenes)
- [ ] Actualizar modelo Product.imageUrl a Product.images[]

### ✅ FASE 6: Gestión de Órdenes (Admin) (COMPLETADA)
- [x] Lista de órdenes con filtros (estado orden, estado pago, rango de fechas)
- [x] Búsqueda por número de orden
- [x] Vista detalle de orden (cliente, dirección, productos, totales)
- [x] Cambio de estado de orden (inline desde lista + desde detalle)
- [x] Vista de productos de la orden (tabla con precios snapshot)
- [x] Validaciones (solo órdenes no finales pueden cambiar estado)
- [x] Confirmación antes de cambiar estado
- [x] Navegación lista ↔ detalle

### FASE 7: Gestión de Usuarios (Admin)
- [ ] Lista de usuarios con paginación
- [ ] Cambiar rol de usuario
- [ ] Activar/desactivar usuarios
- [ ] Vista detalle de usuario

### FASE 8: Catálogo Público (User)
- [ ] Lista de productos (grid/list view)
- [ ] Filtros por categoría, precio, búsqueda
- [ ] Vista detalle de producto
- [ ] Agregar al carrito

### FASE 9: Carrito y Checkout (User)
- [ ] Vista del carrito
- [ ] Modificar cantidades
- [ ] Calcular totales
- [ ] Proceso de checkout (crear orden)

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

**Última actualización**: 2025-10-22 (FASE 5 - Gestión de Variantes completada; FASE 6 - Gestión de Órdenes Admin completada)
