# E-Commerce Frontend - Angular 20

## 📋 Contexto del Proyecto

Este es el frontend de una aplicación e-commerce completa construida con Angular 20 (standalone components), diseñada para integrarse con el backend NestJS ubicado en `../ecommerce-back`.

**Arquitectura**: Single Page Application (SPA) con dos áreas principales:
- **Admin Dashboard**: Panel de administración para gestionar productos, órdenes y usuarios (requiere rol ADMIN)
- **User Store**: Tienda pública para usuarios finales (navegación de productos, carrito, checkout)

**Estado actual**: FASE 3 completada (Login Component) - Sistema de autenticación funcional con formulario de login, validaciones centralizadas y redirección por rol.

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
│   │   └── api-response.model.ts # Tipos genéricos para respuestas paginadas
│   └── services/
│       └── auth.service.ts       # Autenticación con JWT + Signals
│
├── features/                  # Módulos de funcionalidad (lazy loaded)
│   ├── admin/                 # Panel de administración
│   │   ├── dashboard/
│   │   │   └── admin-dashboard.component.ts  # ✅ Dashboard admin (placeholder)
│   │   ├── products/          # TODO FASE 5
│   │   ├── orders/            # TODO FASE 6
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

### FASE 3: Login Component (IN PROGRESS)
- [ ] Crear componente `features/auth/login`
- [ ] Formulario reactivo con validación (email, password)
- [ ] Integración con AuthService.login()
- [ ] Redirect post-login según rol (admin → /admin/dashboard, user → /products)
- [ ] Loading state durante autenticación
- [ ] Manejo de errores con toasts (ya implementado en interceptor)

### FASE 4: Admin Layout
- [ ] Crear layout con sidebar y navigation
- [ ] Rutas admin protegidas (authGuard + adminGuard)
- [ ] Header con user menu y logout
- [ ] Sidebar con enlaces: Dashboard, Products, Orders, Users

### FASE 5: CRUD de Productos (Admin)
- [ ] Lista de productos con tabla (PrimeNG DataTable)
- [ ] Paginación y búsqueda
- [ ] Formulario de crear/editar producto (dialog)
- [ ] Eliminación con confirmación
- [ ] Upload de imágenes

### FASE 6: Gestión de Órdenes (Admin)
- [ ] Lista de órdenes con filtros (estado, fecha)
- [ ] Vista detalle de orden
- [ ] Cambio de estado de orden
- [ ] Vista de productos de la orden

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

**Última actualización**: 2025-10-13 (FASE 2 completada)
