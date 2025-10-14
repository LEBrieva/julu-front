import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

// PrimeNG Components
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';

import { AuthService } from '../../../core/services/auth.service';
import { getErrorMessage } from '../../../shared/utils/form-errors.util';

/**
 * LoginComponent - Componente de autenticación
 *
 * FUNCIONALIDADES:
 * - Formulario reactivo con validaciones (email, password)
 * - Loading state durante autenticación
 * - Redirección automática según rol:
 *   - ADMIN → /admin/dashboard
 *   - USER → /products
 * - Soporte para returnUrl (redirect después de login desde guard)
 * - Manejo de errores con toasts (automático vía error.interceptor)
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    CardModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  // Inyección de dependencias
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Signal para manejar el loading state
  isLoading = signal<boolean>(false);

  // Formulario reactivo
  loginForm: FormGroup;

  // URL de retorno después del login (viene del guard si intentó acceder a ruta protegida)
  private returnUrl: string = '/products'; // Default: catálogo público

  // Exponer la función getErrorMessage para usarla en el template
  // Esto permite usar el sistema centralizado de mensajes de validación
  getErrorMessage = getErrorMessage;

  constructor() {
    // Inicializar formulario con validaciones
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Obtener returnUrl de los query params (si existe)
    const queryReturnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (queryReturnUrl) {
      this.returnUrl = queryReturnUrl;
    }
  }

  /**
   * Getter para acceder fácilmente a los controles del formulario
   * Útil para mostrar errores de validación en el template
   */
  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

  /**
   * Manejador del submit del formulario
   *
   * FLUJO:
   * 1. Verificar que el formulario sea válido
   * 2. Activar loading state
   * 3. Llamar a authService.login()
   * 4. Si es exitoso: redirigir según rol del usuario
   * 5. Si hay error: el error.interceptor ya muestra el toast automáticamente
   */
  onSubmit(): void {
    // Si el formulario es inválido, marcar todos los campos como touched para mostrar errores
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // Activar loading state
    this.isLoading.set(true);

    // Extraer valores del formulario
    const { email, password } = this.loginForm.value;

    // Llamar al servicio de autenticación
    this.authService.login(email, password).subscribe({
      next: (response) => {
        console.log('✅ Login exitoso:', response.user.email);

        // Desactivar loading
        this.isLoading.set(false);

        // Redirigir según el rol del usuario
        this.redirectAfterLogin();
      },
      error: (error) => {
        console.error('❌ Error en login:', error);

        // Desactivar loading
        this.isLoading.set(false);

        // El error.interceptor ya mostró el toast automáticamente
        // No necesitamos hacer nada más aquí
      }
    });
  }

  /**
   * Redirigir al usuario después del login según su rol
   *
   * LÓGICA:
   * - Si hay returnUrl (venía de un guard), ir ahí
   * - Si es ADMIN y no hay returnUrl: ir a /admin/dashboard
   * - Si es USER y no hay returnUrl: ir a /products
   */
  private redirectAfterLogin(): void {
    const currentUser = this.authService.currentUser();

    // Si hay returnUrl, ir ahí directamente
    if (this.returnUrl !== '/products') {
      this.router.navigate([this.returnUrl]);
      return;
    }

    // Si es admin, ir al dashboard
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    // Por defecto, ir al catálogo de productos
    this.router.navigate(['/products']);
  }
}
