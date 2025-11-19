import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { getErrorMessage } from '../../../shared/utils/form-errors.util';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    CardModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private location = inject(Location);

  registerForm!: FormGroup;
  loading = signal(false);

  // Datos pre-llenados de la orden guest
  prefilledData = signal<{
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    orderId?: string;
    orderNumber?: string;
  } | null>(null);

  ngOnInit() {
    // Leer datos del router state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state || history.state;

    if (state?.['email']) {
      this.prefilledData.set({
        email: state['email'],
        firstName: state['firstName'],
        lastName: state['lastName'],
        phone: state['phone'],
        orderId: state['orderId'],
        orderNumber: state['orderNumber'],
      });
    }

    this.initForm();
  }

  private initForm() {
    const prefilled = this.prefilledData();

    this.registerForm = this.fb.group({
      email: [
        { value: prefilled?.email || '', disabled: !!prefilled?.email },
        [Validators.required, Validators.email],
      ],
      firstName: [
        { value: prefilled?.firstName || '', disabled: !!prefilled?.firstName },
        [Validators.required, Validators.minLength(2)],
      ],
      lastName: [
        { value: prefilled?.lastName || '', disabled: !!prefilled?.lastName },
        [Validators.required, Validators.minLength(2)],
      ],
      phone: [{ value: prefilled?.phone || '', disabled: !!prefilled?.phone }],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
    });
  }

  getErrorMessage(field: string): string | null {
    return getErrorMessage(this.registerForm.get(field));
  }

  passwordsMatch(): boolean {
    const password = this.registerForm.get('password')?.value;
    const confirm = this.registerForm.get('confirmPassword')?.value;
    return password === confirm;
  }

  onSubmit() {
    if (this.registerForm.invalid || !this.passwordsMatch()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formValue = this.registerForm.getRawValue();
    const prefilled = this.prefilledData();

    this.authService
      .register({
        email: formValue.email,
        password: formValue.password,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phone: formValue.phone,
        linkedGuestOrderId: prefilled?.orderId,
      })
      .subscribe({
        next: () => {
          // Auto-login después del registro
          this.authService
            .login(formValue.email, formValue.password)
            .subscribe({
              next: () => {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Cuenta Creada',
                  detail: prefilled?.orderId
                    ? `Tu orden ${prefilled.orderNumber} ha sido vinculada a tu cuenta`
                    : 'Bienvenido a nuestra tienda',
                });
                this.router.navigate(['/products']);
              },
              error: () => {
                this.loading.set(false);
                this.messageService.add({
                  severity: 'warn',
                  summary: 'Cuenta Creada',
                  detail:
                    'Cuenta creada exitosamente. Por favor inicia sesión.',
                });
                this.router.navigate(['/login']);
              },
            });
        },
        error: (error) => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error al Registrarse',
            detail: error.error?.message || 'No se pudo crear la cuenta',
          });
        },
      });
  }

  /**
   * Navegar a la página anterior
   */
  goBack(): void {
    this.location.back();
  }
}
