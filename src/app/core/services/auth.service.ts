import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { User, UserRole, UserStatus, LoginResponse, RefreshResponse, JwtPayload } from '../models/user.model';
import {
  SILENT_REFRESH_INTERVAL,
  USER_INACTIVITY_THRESHOLD,
  ACTIVITY_EVENTS
} from '../constants/auth.constants';

/**
 * AuthService - Servicio de Autenticación
 *
 * CONCEPTOS CLAVE PARA BACKEND DEVS:
 *
 * 1. @Injectable({ providedIn: 'root' })
 *    - Es como @Injectable() en NestJS
 *    - 'root' significa que es un SINGLETON (una sola instancia para toda la app)
 *
 * 2. Signals (signal, computed)
 *    - Son variables REACTIVAS (como useState en React, o BehaviorSubject en RxJS)
 *    - Cuando cambian, los componentes que las usan se actualizan automáticamente
 *    - currentUserSignal.set(user) → Actualiza el valor
 *    - currentUser() → Lee el valor actual
 *
 * 3. inject()
 *    - Nueva forma de inyectar dependencias (antes se hacía en el constructor)
 *    - Más moderno y limpio
 *
 * 4. Observable (RxJS)
 *    - Similar a Promises pero más poderoso
 *    - Permite cancelar, transformar, combinar operaciones asíncronas
 *    - pipe() encadena operaciones (como .then() en Promises)
 */
@Injectable({
  providedIn: 'root'  // Singleton - Una sola instancia en toda la app
})
export class AuthService {
  // Inyección de dependencias (como en NestJS)
  private http = inject(HttpClient);
  private router = inject(Router);

  // URL base de tu backend
  private apiUrl = environment.apiUrl;

  // 🔐 Estado de autenticación con Signals (reactivo)
  private currentUserSignal = signal<User | null>(null);

  // Exponer el signal como readonly (los componentes solo leen, no modifican directamente)
  readonly currentUser = this.currentUserSignal.asReadonly();

  // Computed signal: Se calcula automáticamente cuando currentUser cambia
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === UserRole.ADMIN);

  // ⏰ Silent Token Refresh - Activity Tracking
  private lastInteractionTime = Date.now();
  private silentRefreshInterval: any = null;

  /**
   * Login - Autenticación de usuario
   *
   * FLUJO:
   * 1. POST /auth/login con { email, password }
   * 2. Backend responde con { accessToken, user }
   * 3. Backend TAMBIÉN envía refreshToken en httpOnly cookie (no lo vemos aquí)
   * 4. Guardamos accessToken en localStorage
   * 5. Guardamos user en el signal (reactivo)
   * 6. Los componentes que usan currentUser() se actualizan automáticamente
   *
   * IMPORTANTE: withCredentials: true
   * - Esto le dice al navegador que INCLUYA las cookies en la petición
   * - Sin esto, el httpOnly cookie del refreshToken no se enviaría/recibiría
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/auth/login`,
      { email, password },
      { withCredentials: true }  // ⭐ CRÍTICO: Incluir cookies httpOnly
    ).pipe(
      tap(response => {
        // tap() ejecuta código sin modificar el Observable (como un side-effect)
        console.log('✅ Login exitoso:', response.user.email);

        // Guardar accessToken en localStorage (lo usaremos en cada petición)
        localStorage.setItem('accessToken', response.accessToken);

        // Actualizar el signal con los datos del usuario
        this.currentUserSignal.set(response.user);

        // ⏰ Iniciar silent refresh después del login
        this.startSilentRefresh();
      }),
      catchError(error => {
        console.error('❌ Error en login:', error);
        return throwError(() => error);  // Re-lanzar el error para que el componente lo maneje
      })
    );
  }

  /**
   * Logout - Cerrar sesión
   *
   * FLUJO:
   * 1. POST /auth/logout (con cookie httpOnly automáticamente)
   * 2. Backend revoca el refreshToken en la BD (isRevoked: true)
   * 3. Backend limpia el cookie httpOnly
   * 4. Frontend limpia localStorage y signal
   */
  logout(): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/auth/logout`,
      {},
      { withCredentials: true }  // ⭐ Envía el refreshToken cookie para revocarlo
    ).pipe(
      tap(() => {
        console.log('✅ Logout exitoso');
        this.clearSession();
        // ⏰ Detener silent refresh
        this.stopSilentRefresh();
      }),
      catchError(error => {
        console.error('❌ Error en logout:', error);
        // Aunque falle, limpiamos la sesión local
        this.clearSession();
        // ⏰ Detener silent refresh incluso si falla el logout
        this.stopSilentRefresh();
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh - Renovar accessToken cuando expira
   *
   * FLUJO:
   * 1. POST /auth/refresh (SIN body, el refreshToken viene en el cookie httpOnly)
   * 2. Backend valida el refreshToken de la BD
   * 3. Backend genera un nuevo accessToken
   * 4. Actualizamos localStorage con el nuevo token
   * 5. Decodificamos el token y actualizamos el signal del usuario
   *
   * NOTA: Este endpoint es @Public() en tu backend porque el accessToken ya expiró
   */
  refresh(): Observable<RefreshResponse> {
    return this.http.post<RefreshResponse>(
      `${this.apiUrl}/auth/refresh`,
      {},  // Sin body, el refreshToken viene en la cookie
      { withCredentials: true }  // ⭐ Cookie se envía automáticamente
    ).pipe(
      tap(response => {
        console.log('🔄 Token renovado');
        localStorage.setItem('accessToken', response.accessToken);

        // ⭐ Después de renovar el token, obtener usuario completo
        this.getCurrentUser().subscribe({
          next: () => console.log('✅ Usuario sincronizado después del refresh'),
          error: () => console.log('⚠️ Error al sincronizar usuario después del refresh')
        });
      }),
      catchError(error => {
        console.error('❌ Error al renovar token:', error);
        // Si el refresh falla, solo limpiar sesión
        // El error.interceptor se encargará del redirect si es necesario
        this.clearSession();
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener el usuario actual completo desde el backend
   *
   * Llama a GET /auth/me para obtener todos los datos del usuario (avatar, nombres, etc.)
   * Útil para restaurar sesión al recargar la página
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(
      `${this.apiUrl}/auth/me`,
      { withCredentials: true }
    ).pipe(
      tap(user => {
        this.currentUserSignal.set(user);
      }),
      catchError(error => {
        console.error('❌ Error al obtener usuario actual:', error);
        this.clearSession();
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar el usuario actual en el signal
   *
   * Útil cuando se editan datos del perfil (avatar, nombre, teléfono, etc.)
   * Solo actualiza si es el mismo usuario (por ID)
   *
   * @param updatedUser Usuario actualizado desde el backend
   */
  updateCurrentUser(updatedUser: User): void {
    const currentUser = this.currentUser();

    // Solo actualizar si es el mismo usuario (por ID)
    if (currentUser?.id === updatedUser.id) {
      this.currentUserSignal.set(updatedUser);
    }
  }

  /**
   * Decodificar JWT para leer el payload
   *
   * IMPORTANTE: Solo estamos LEYENDO el token, no verificando la firma.
   * La verificación real la hace el backend con JwtAuthGuard.
   *
   * Esto es útil para:
   * - Saber si el token expiró (comparar exp con Date.now())
   * - Mostrar info del usuario en el UI
   * - Decidir qué mostrar según el rol
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      // JWT tiene 3 partes: header.payload.signature
      const payload = token.split('.')[1];

      // atob() decodifica base64 (esto NO es desencriptar, es solo decodificar)
      const decoded = JSON.parse(atob(payload));

      return decoded as JwtPayload;
    } catch (error) {
      console.error('Error al decodificar token:', error);
      return null;
    }
  }

  /**
   * Verificar si el token expiró
   */
  isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return true;

    // exp viene en segundos, Date.now() en milisegundos
    const expirationDate = payload.exp * 1000;
    return Date.now() > expirationDate;
  }

  /**
   * Obtener el accessToken actual
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Limpiar sesión local (localStorage + signal)
   */
  private clearSession(): void {
    localStorage.removeItem('accessToken');
    this.currentUserSignal.set(null);
  }

  /**
   * ⏰ SILENT TOKEN REFRESH - Activity Tracking
   *
   * Configura listeners para detectar actividad del usuario
   * Eventos monitoreados definidos en ACTIVITY_EVENTS (auth.constants.ts)
   * NO incluye mousemove para evitar demasiada sensibilidad
   */
  private setupActivityTracking(): void {
    ACTIVITY_EVENTS.forEach(eventName => {
      window.addEventListener(eventName, () => {
        this.lastInteractionTime = Date.now();
      }, { passive: true }); // passive: true para mejor performance
    });

    console.log('👁️ Activity tracking iniciado');
  }

  /**
   * Obtiene el tiempo transcurrido (en ms) desde la última interacción del usuario
   */
  private getTimeSinceLastInteraction(): number {
    return Date.now() - this.lastInteractionTime;
  }

  /**
   * Logout silencioso (sin POST al backend, sin redirect)
   *
   * Se usa cuando el usuario está inactivo y no queremos
   * hacer una llamada al backend innecesaria.
   *
   * Solo limpia localStorage y signal.
   */
  private silentLogout(): void {
    console.log('🔕 Silent logout - Usuario inactivo');
    localStorage.removeItem('accessToken');
    this.currentUserSignal.set(null);
    this.stopSilentRefresh(); // Detener el intervalo
  }

  /**
   * ⏰ SILENT TOKEN REFRESH
   *
   * Inicia un intervalo definido en SILENT_REFRESH_INTERVAL (auth.constants.ts) que:
   * 1. Verifica si el usuario estuvo activo según USER_INACTIVITY_THRESHOLD
   * 2. Si SÍ → Hace refresh del token automáticamente
   * 3. Si NO → Logout diferenciado por rol:
   *    - ADMIN: Logout + redirect a /login (seguridad)
   *    - USER: Logout silencioso (sin redirect, sigue en la vista actual)
   *
   * NOTA: El backend debe tener el accessToken configurado con expiración de 1 hora
   * Ver configuración en: src/app/core/constants/auth.constants.ts
   */
  startSilentRefresh(): void {
    // Detener intervalo previo si existe
    this.stopSilentRefresh();

    this.silentRefreshInterval = setInterval(() => {
      const inactiveTime = this.getTimeSinceLastInteraction();

      if (inactiveTime > USER_INACTIVITY_THRESHOLD) {
        // ⚠️ Usuario INACTIVO
        console.log(`⚠️ Usuario inactivo por ${Math.round(inactiveTime / 1000 / 60)} minutos`);

        const currentUser = this.currentUser();
        const role = currentUser?.role;

        if (role === UserRole.ADMIN) {
          // 🔐 ADMIN: Logout completo + redirect (seguridad)
          console.log('🔐 ADMIN inactivo → Logout + redirect a /login');
          this.logout().subscribe(() => {
            this.router.navigate(['/login']);
          });
        } else {
          // 👤 USER: Logout silencioso (se queda en la vista)
          console.log('👤 USER inactivo → Logout silencioso');
          this.silentLogout();
        }
      } else {
        // ✅ Usuario ACTIVO → Refresh automático
        console.log('🔄 Usuario activo → Refresh automático del token');
        this.refresh().subscribe({
          next: () => {
            console.log('✅ Token renovado automáticamente (silent refresh)');
          },
          error: (error) => {
            console.error('❌ Error en silent refresh:', error);
            // Si falla el refresh, el error.interceptor se encargará
          }
        });
      }
    }, SILENT_REFRESH_INTERVAL);

    console.log(`⏰ Silent refresh iniciado (intervalo: ${SILENT_REFRESH_INTERVAL / 1000 / 60} min, inactividad: ${USER_INACTIVITY_THRESHOLD / 1000 / 60} min)`);
  }

  /**
   * Detiene el intervalo de silent refresh
   */
  private stopSilentRefresh(): void {
    if (this.silentRefreshInterval) {
      clearInterval(this.silentRefreshInterval);
      this.silentRefreshInterval = null;
      console.log('⏰ Silent refresh detenido');
    }
  }

  /**
   * Inicializar sesión al cargar la app
   *
   * Este método se debe llamar en el AppComponent para:
   * 1. Configurar activity tracking
   * 2. Verificar si hay un token guardado
   * 3. Si existe y es válido, restaurar la sesión
   * 4. Si expiró, intentar refresh automático
   * 5. Iniciar silent refresh si hay sesión válida
   */
  initializeAuth(): void {
    // 1. Configurar activity tracking
    this.setupActivityTracking();

    const token = this.getAccessToken();

    if (!token) {
      console.log('No hay sesión guardada');
      return;
    }

    if (this.isTokenExpired(token)) {
      console.log('Token expirado, intentando refresh...');
      this.refresh().subscribe({
        next: () => {
          console.log('Sesión restaurada con refresh');
          // Iniciar silent refresh después de restaurar sesión
          this.startSilentRefresh();
        },
        error: () => {
          console.log('No se pudo restaurar la sesión');
          this.clearSession();
        }
      });
    } else {
      console.log('Token válido, restaurando sesión...');
      // Obtener usuario completo desde el backend (incluye avatar, nombres, etc.)
      this.getCurrentUser().subscribe({
        next: () => {
          console.log('✅ Sesión restaurada con datos completos');
          // Iniciar silent refresh
          this.startSilentRefresh();
        },
        error: () => {
          console.log('❌ No se pudo restaurar la sesión');
          this.clearSession();
        }
      });
    }
  }
}
