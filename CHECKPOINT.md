# 🎯 CHECKPOINT - E-Commerce Frontend Development

**Fecha**: 2025-10-13
**Estado**: FASE 2 completada - Core implementation funcional

---

## 📊 Resumen Ejecutivo

### ¿Qué tenemos?
✅ Proyecto Angular 20 inicializado con standalone components
✅ Sistema de autenticación JWT completo (access + refresh tokens en httpOnly cookies)
✅ Interceptors funcionales (auth + error handling)
✅ Guards para protección de rutas (auth + admin)
✅ Sistema de notificaciones toast (PrimeNG MessageService)
✅ Auto-refresh de tokens en 401
✅ Modelos de datos TypeScript (User, API responses)
✅ Configuración de entornos (dev/prod)

### ¿Qué falta?
❌ Componente de Login (FASE 3 - EN PROGRESO)
❌ Admin Layout con sidebar y navigation (FASE 4)
❌ CRUD de Productos (FASE 5)
❌ Gestión de Órdenes (FASE 6)
❌ Gestión de Usuarios (FASE 7)
❌ Catálogo público y carrito (FASE 8-9)

---

## 🗺️ Plan de Desarrollo Completo

### ✅ FASE 1: Setup Inicial (COMPLETADO)
**Objetivo**: Crear proyecto Angular y configurar dependencias

**Acciones realizadas**:
1. ✅ Crear proyecto Angular 20 con `ng new ecommerce-front`
2. ✅ Instalar PrimeNG v20.2.0 + @primeuix/themes
3. ✅ Instalar TailwindCSS v4.1.14
4. ✅ Instalar @ngrx/signals para manejo de estado
5. ✅ Configurar PrimeNG con Aura theme en `app.config.ts`
6. ✅ Configurar TailwindCSS v4 en `styles.css`
7. ✅ Crear estructura de carpetas (core, features, shared)

**Archivos clave**:
- `package.json` - Dependencias
- `src/app/app.config.ts` - Configuración global
- `src/styles.css` - Estilos globales (Tailwind + PrimeIcons)

---

### ✅ FASE 2: Core - AuthService, Interceptors, Guards (COMPLETADO)
**Objetivo**: Implementar sistema de autenticación completo

**Acciones realizadas**:

#### 2.1 Modelos de Datos
1. ✅ `core/models/user.model.ts`
   - Enum `UserRole` (ADMIN, USER)
   - Enum `UserStatus` (ACTIVE, INACTIVE)
   - Interface `User`
   - Interface `LoginResponse` (accessToken, user)
   - Interface `RefreshResponse` (accessToken)
   - Interface `JwtPayload` (sub, email, role, exp)

2. ✅ `core/models/api-response.model.ts`
   - Interface `PaginatedResponse<T>` (data, pagination)
   - Interface `PaginationInfo` (total, page, limit, totalPages)
   - Interface `ApiError`

#### 2.2 Environments
1. ✅ `environments/environment.ts` (dev) - apiUrl: localhost:3000
2. ✅ `environments/environment.prod.ts` (prod) - apiUrl: por definir

#### 2.3 AuthService
1. ✅ `core/services/auth.service.ts`
   - Signal privado `currentUserSignal`
   - Signal público readonly `currentUser`
   - Computed signals: `isAuthenticated`, `isAdmin`
   - Métodos:
     - `login(email, password)` → POST /auth/login (withCredentials: true)
     - `logout()` → POST /auth/logout + limpia localStorage
     - `refresh()` → POST /auth/refresh (usa httpOnly cookie)
     - `decodeToken(token)` → Decodifica JWT y extrae payload
     - `isTokenExpired(token)` → Verifica si JWT expiró
     - `initializeAuth()` → Restaura sesión al iniciar app

#### 2.4 Interceptors
1. ✅ `core/interceptors/auth.interceptor.ts`
   - Inyecta JWT en header `Authorization: Bearer <token>`
   - Agrega `withCredentials: true` para enviar httpOnly cookies
   - Se ejecuta en TODAS las peticiones HTTP

2. ✅ `core/interceptors/error.interceptor.ts`
   - Maneja errores HTTP globalmente con toasts
   - Mapeo de errores:
     - 400 Bad Request → Toast warn "Datos Inválidos" + mensajes de validación
     - 401 Unauthorized → Intenta refresh automático
       - Si refresh OK → Toast success "Sesión renovada" + reintenta request
       - Si refresh falla → Toast warn "Sesión expirada" + logout + redirect /login
     - 403 Forbidden → Toast error "Acceso Denegado"
     - 404 Not Found → Toast warn "No Encontrado"
     - 409 Conflict → Toast warn "Conflicto - El recurso ya existe"
     - 429 Too Many Requests → Toast warn con tiempo de espera (extrae header X-RateLimit-Reset)
     - 500+ Server Error → Toast error "Error del Servidor"
     - Network error → Toast error "Error de Conexión"

#### 2.5 Guards
1. ✅ `core/guards/auth.guard.ts`
   - Protege rutas que requieren autenticación
   - Si NO autenticado → redirect a `/login?returnUrl=<url_original>`
   - Si autenticado → permite acceso

2. ✅ `core/guards/admin.guard.ts`
   - Protege rutas que requieren rol ADMIN
   - Si NO es admin → Toast warn "Acceso Restringido" + redirect a `/products`
   - Si es admin → permite acceso

#### 2.6 App Config
1. ✅ `app.config.ts`
   - Configurar interceptors: `provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))`
   - Configurar PrimeNG con Aura theme
   - Agregar `MessageService` para toasts

2. ✅ `app.ts`
   - Importar `ToastModule`
   - Implementar `OnInit` → llamar a `authService.initializeAuth()`

3. ✅ `app.html`
   - Agregar `<p-toast position="top-right"></p-toast>`
   - Agregar `<router-outlet></router-outlet>`

**Archivos clave**:
```
src/app/
├── core/
│   ├── models/
│   │   ├── user.model.ts              (User, LoginResponse, enums)
│   │   └── api-response.model.ts      (PaginatedResponse, ApiError)
│   ├── services/
│   │   └── auth.service.ts            (Login, logout, refresh, signals)
│   ├── interceptors/
│   │   ├── auth.interceptor.ts        (Inyecta JWT + withCredentials)
│   │   └── error.interceptor.ts       (Manejo errores + toasts)
│   └── guards/
│       ├── auth.guard.ts              (Protege rutas autenticadas)
│       └── admin.guard.ts             (Protege rutas admin)
├── app.config.ts                      (Configuración global)
├── app.ts                             (Root component + initializeAuth)
└── app.html                           (Toast + router-outlet)
```

**Testing realizado**:
```bash
npm run build
# ✅ Build exitoso (warning de bundle size esperado con PrimeNG)
# ✅ TypeScript compilation OK
# ✅ No errores en consola
```

---

### 🟡 FASE 3: Login Component (EN PROGRESO - PRÓXIMO PASO)
**Objetivo**: Crear componente de login funcional con validación

**Tareas pendientes**:

#### 3.1 Crear Componente
```bash
ng generate component features/auth/login --standalone
```

**Estructura esperada**:
```
src/app/features/auth/login/
├── login.component.ts      # Lógica del componente
├── login.component.html    # Template con formulario
└── login.component.css     # Estilos (opcional con Tailwind)
```

#### 3.2 Implementar Formulario Reactivo
```typescript
// login.component.ts
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  loading = signal(false);

  // Formulario reactivo con validaciones
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    const { email, password } = this.loginForm.value;

    this.authService.login(email!, password!).subscribe({
      next: (response) => {
        this.loading.set(false);
        // Redirect según returnUrl o rol
        const returnUrl = this.activatedRoute.snapshot.queryParams['returnUrl'];
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else if (response.user.role === UserRole.ADMIN) {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/products']);
        }
      },
      error: () => {
        this.loading.set(false);
        // El error.interceptor ya mostró el toast
      }
    });
  }
}
```

#### 3.3 Template con PrimeNG
```html
<!-- login.component.html -->
<div class="flex items-center justify-center min-h-screen bg-gray-100">
  <div class="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
    <h1 class="text-2xl font-bold text-center mb-6">Iniciar Sesión</h1>

    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <!-- Email Input -->
      <div class="mb-4">
        <label for="email" class="block text-sm font-medium mb-2">Email</label>
        <input
          pInputText
          id="email"
          formControlName="email"
          type="email"
          placeholder="tu@email.com"
          class="w-full"
        />
        @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
          <small class="text-red-500">Email inválido</small>
        }
      </div>

      <!-- Password Input -->
      <div class="mb-6">
        <label for="password" class="block text-sm font-medium mb-2">Contraseña</label>
        <input
          pInputText
          id="password"
          formControlName="password"
          type="password"
          placeholder="••••••••"
          class="w-full"
        />
        @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
          <small class="text-red-500">Mínimo 6 caracteres</small>
        }
      </div>

      <!-- Submit Button -->
      <p-button
        type="submit"
        label="Iniciar Sesión"
        icon="pi pi-sign-in"
        [loading]="loading()"
        [disabled]="loginForm.invalid"
        styleClass="w-full"
      ></p-button>
    </form>
  </div>
</div>
```

#### 3.4 Agregar Ruta
```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  // Rutas futuras...
];
```

**Imports necesarios**:
- `ReactiveFormsModule` (para formularios reactivos)
- `InputTextModule` (PrimeNG input)
- `ButtonModule` (PrimeNG button)

---

### ⬜ FASE 4: Admin Layout (PENDIENTE)
**Objetivo**: Crear layout maestro para el panel de administración

**Tareas**:

#### 4.1 Crear Admin Layout
```bash
ng generate component features/admin/layout --standalone
```

**Estructura**:
```
src/app/features/admin/layout/
├── layout.component.ts      # Lógica del layout
├── layout.component.html    # Template con sidebar + content
└── layout.component.css     # Estilos
```

#### 4.2 Componentes del Layout
```typescript
// layout.component.ts
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  sidebarVisible = signal(true);

  menuItems = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/admin/dashboard' },
    { label: 'Productos', icon: 'pi pi-box', route: '/admin/products' },
    { label: 'Órdenes', icon: 'pi pi-shopping-cart', route: '/admin/orders' },
    { label: 'Usuarios', icon: 'pi pi-users', route: '/admin/users' }
  ];

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
```

#### 4.3 Template con Sidebar
```html
<!-- layout.component.html -->
<div class="flex h-screen">
  <!-- Sidebar -->
  <aside class="w-64 bg-gray-900 text-white">
    <div class="p-4 border-b border-gray-800">
      <h2 class="text-xl font-bold">Admin Panel</h2>
    </div>

    <nav class="p-4">
      @for (item of menuItems; track item.route) {
        <a
          [routerLink]="item.route"
          routerLinkActive="bg-gray-800"
          class="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition"
        >
          <i [class]="item.icon"></i>
          <span>{{ item.label }}</span>
        </a>
      }
    </nav>
  </aside>

  <!-- Main Content -->
  <div class="flex-1 flex flex-col">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 p-4">
      <div class="flex justify-between items-center">
        <h1 class="text-xl font-semibold">Panel de Administración</h1>

        <div class="flex items-center gap-4">
          <span>{{ currentUser()?.email }}</span>
          <p-button
            label="Cerrar Sesión"
            icon="pi pi-sign-out"
            (onClick)="logout()"
            severity="danger"
          ></p-button>
        </div>
      </div>
    </header>

    <!-- Content Area -->
    <main class="flex-1 p-6 bg-gray-50 overflow-auto">
      <router-outlet></router-outlet>
    </main>
  </div>
</div>
```

#### 4.4 Rutas Admin
```typescript
// app.routes.ts
export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  // Admin routes (protegidas con authGuard + adminGuard)
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'products', component: AdminProductsComponent },
      { path: 'orders', component: AdminOrdersComponent },
      { path: 'users', component: AdminUsersComponent }
    ]
  }
];
```

**PrimeNG Components a usar**:
- `Menu` o `PanelMenu` (sidebar)
- `Button` (logout, acciones)
- `Avatar` (foto de usuario)
- `Badge` (notificaciones)

---

### ⬜ FASE 5: CRUD de Productos (PENDIENTE)
**Objetivo**: Implementar gestión completa de productos para admin

**Tareas**:

#### 5.1 Product Service
```bash
ng generate service core/services/product
```

```typescript
// core/services/product.service.ts
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  // GET /products?page=1&limit=10&category=electronics&search=laptop
  getProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Observable<PaginatedResponse<Product>> { }

  // GET /products/:id
  getProduct(id: string): Observable<Product> { }

  // POST /products (ADMIN)
  createProduct(product: Partial<Product>): Observable<Product> { }

  // PATCH /products/:id (ADMIN)
  updateProduct(id: string, product: Partial<Product>): Observable<Product> { }

  // DELETE /products/:id (ADMIN)
  deleteProduct(id: string): Observable<void> { }
}
```

#### 5.2 Product List Component
```bash
ng generate component features/admin/products/list --standalone
```

**Features**:
- Tabla con PrimeNG `<p-table>` (paginación, sorting, búsqueda)
- Botones de acción: Ver, Editar, Eliminar
- Botón "Nuevo Producto" → Abre dialog
- Filtros por categoría y búsqueda

#### 5.3 Product Form Dialog
- Dialog de PrimeNG con formulario reactivo
- Campos: name, description, price, stock, category, imageUrl
- Validaciones: required, min price, min stock
- Modo crear/editar

#### 5.4 Confirmation Dialog
- `<p-confirmDialog>` para confirmar eliminación
- Mensaje: "¿Estás seguro de eliminar el producto X?"

---

### ⬜ FASE 6: Gestión de Órdenes (PENDIENTE)
**Objetivo**: Permitir a admins ver y gestionar órdenes

**Tareas**:

#### 6.1 Order Service
```typescript
export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}
```

#### 6.2 Order List Component
- Tabla con filtros por estado y fecha
- Vista detalle de orden (items, usuario, totales)
- Botón "Cambiar Estado" → Dropdown con estados

#### 6.3 Order Detail Component
- Vista completa de la orden
- Lista de productos (snapshot en el backend)
- Información del usuario
- Historial de cambios de estado

---

### ⬜ FASE 7: Gestión de Usuarios (PENDIENTE)
**Objetivo**: Permitir a admins gestionar usuarios

**Tareas**:

#### 7.1 User Service
```typescript
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}
```

#### 7.2 User List Component
- Tabla con filtros por rol y estado
- Botones: Cambiar rol, Activar/Desactivar
- Vista detalle de usuario

#### 7.3 User Actions
- PATCH /users/:id/role (cambiar rol)
- PATCH /users/:id/status (activar/desactivar)

---

### ⬜ FASE 8: Catálogo Público (PENDIENTE)
**Objetivo**: Vista pública de productos para usuarios

**Tareas**:
- Product list (grid/list view)
- Filtros y búsqueda
- Product detail page
- Botón "Agregar al carrito"

---

### ⬜ FASE 9: Carrito y Checkout (PENDIENTE)
**Objetivo**: Permitir a usuarios crear órdenes

**Tareas**:
- Cart view (lista de items)
- Modificar cantidades
- Calcular totales
- Crear orden (POST /orders)

---

## 🛠️ Comandos Útiles para Continuar

```bash
# Desarrollo
npm start                    # Dev server (localhost:4200)

# Generar componentes
ng generate component features/auth/login --standalone
ng generate component features/admin/layout --standalone
ng generate component features/admin/products/list --standalone

# Generar servicios
ng generate service core/services/product

# Build
npm run build

# Testing
npm test
```

---

## 📝 Notas Técnicas Importantes

### 1. Flujo de Autenticación
```
1. Login → POST /auth/login
   ↓ Response: { accessToken, user } + Cookie: refreshToken (httpOnly)

2. Request → GET /products
   ↓ auth.interceptor inyecta: Authorization: Bearer <token>
   ↓ auth.interceptor inyecta: withCredentials: true

3. Token expirado → 401
   ↓ error.interceptor detecta 401
   ↓ Toast: "Renovando sesión..."
   ↓ POST /auth/refresh (con cookie)
   ↓ Response: { accessToken } (nuevo token)
   ↓ Reintentar request original
   ↓ Toast: "Sesión renovada"
```

### 2. Uso de Signals en Componentes
```typescript
export class HeaderComponent {
  private authService = inject(AuthService);

  // Signals reactivos (se actualizan automáticamente)
  currentUser = this.authService.currentUser;      // Signal<User | null>
  isAuthenticated = this.authService.isAuthenticated; // Signal<boolean>
  isAdmin = this.authService.isAdmin;              // Signal<boolean>
}
```

```html
<!-- Template (new control flow syntax) -->
@if (isAuthenticated()) {
  <p>Hola {{ currentUser()?.firstName }}</p>
  @if (isAdmin()) {
    <a routerLink="/admin">Panel Admin</a>
  @endif
}
```

### 3. PrimeNG v20 - Configuración del Tema
```typescript
// app.config.ts
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

export const appConfig: ApplicationConfig = {
  providers: [
    providePrimeNG({
      theme: {
        preset: Aura,
        options: { darkModeSelector: false }
      }
    })
  ]
};
```

**NO usar** imports de CSS en styles.css (deprecated):
```css
/* ❌ NO HACER */
@import 'primeng/resources/themes/lara-light-blue/theme.css';
```

### 4. TailwindCSS v4 - Configuración
```css
/* src/styles.css */
@import "tailwindcss";
@import "primeicons/primeicons.css";
```

**NO necesitas** `tailwind.config.js` en v4.

### 5. Rate Limiting del Backend
Si recibes 429, el interceptor ya maneja el error:
- Extrae header `X-RateLimit-Reset`
- Calcula segundos restantes
- Muestra toast: "Demasiadas Peticiones - Intenta en X segundos"

### 6. withCredentials: true
**CRUCIAL** para httpOnly cookies:
```typescript
// Ya configurado en auth.interceptor.ts
const clonedRequest = req.clone({
  setHeaders: { Authorization: `Bearer ${token}` },
  withCredentials: true // ⭐ Sin esto, no se envían cookies
});
```

---

## 🚨 Errores Comunes y Soluciones

### Error: "Could not resolve 'primeng/resources/themes/...'"
**Causa**: PrimeNG v20 cambió el sistema de temas
**Solución**: Usar `@primeuix/themes` y `providePrimeNG()` en app.config.ts

### Error: "Type 'Observable<unknown>' is not assignable..."
**Causa**: Falta tipado explícito en interceptores
**Solución**: Agregar tipo de retorno `Observable<HttpEvent<unknown>>`

### Error: "withCredentials is not a function"
**Causa**: Falta `withCredentials: true` en requests
**Solución**: Ya configurado en auth.interceptor.ts

### Error: Token expirado pero no se renueva
**Causa**: Falta refresh token (cookie no enviada)
**Solución**: Verificar que auth.interceptor.ts tenga `withCredentials: true`

---

## 📞 Contacto con Backend

**URL Dev**: `http://localhost:3000`
**Documentación Backend**: `../ecommerce-back/CLAUDE.md`

**Endpoints disponibles**:
- `/auth/*` - Autenticación (login, logout, refresh)
- `/products` - CRUD de productos
- `/orders` - Gestión de órdenes
- `/users` - Gestión de usuarios (admin)

**Rate Limiting**:
- Global: 100 req/min
- Auth: 5 req/min

---

## 🎯 Próximo Paso Inmediato

**FASE 3: Crear componente de Login**

1. Generar componente: `ng generate component features/auth/login --standalone`
2. Implementar formulario reactivo con validaciones
3. Integrar con AuthService.login()
4. Agregar loading state
5. Implementar redirect post-login (según rol + returnUrl)
6. Agregar ruta en app.routes.ts

**Tiempo estimado**: 1-2 horas

**Archivo a crear**: `src/app/features/auth/login/login.component.ts`

---

**Última actualización**: 2025-10-13
**Estado del build**: ✅ Compilando correctamente
**Estado de los tests**: ⚠️ No se han ejecutado tests aún
