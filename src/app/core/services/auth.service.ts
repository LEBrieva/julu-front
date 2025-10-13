import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { User, UserRole, LoginResponse, RefreshResponse, JwtPayload } from '../models/user.model';

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
      }),
      catchError(error => {
        console.error('❌ Error en logout:', error);
        // Aunque falle, limpiamos la sesión local
        this.clearSession();
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
      }),
      catchError(error => {
        console.error('❌ Error al renovar token:', error);
        // Si el refresh falla, la sesión expiró → logout
        this.clearSession();
        this.router.navigate(['/login']);
        return throwError(() => error);
      })
    );
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
   * Inicializar sesión al cargar la app
   *
   * Este método se debe llamar en el AppComponent para:
   * 1. Verificar si hay un token guardado
   * 2. Si existe y es válido, restaurar la sesión
   * 3. Si expiró, intentar refresh automático
   */
  initializeAuth(): void {
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
          // Aquí podrías hacer una petición para obtener los datos del usuario
          // o decodificar el nuevo token para extraer la info
        },
        error: () => {
          console.log('No se pudo restaurar la sesión');
          this.clearSession();
        }
      });
    } else {
      console.log('Token válido, sesión activa');
      // Decodificar el token para restaurar el user en el signal
      const payload = this.decodeToken(token);
      if (payload) {
        // Crear un objeto User mínimo desde el payload
        const user: User = {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
          status: 'ACTIVE' as any, // Asumimos que está activo
        };
        this.currentUserSignal.set(user);
      }
    }
  }
}
