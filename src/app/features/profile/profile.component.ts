import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { OrderListItem } from '../../core/models/order.model';
import { PaginatedResponse } from '../../core/models/api-response.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    TabsModule,
    TableModule,
    TagModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private location = inject(Location);

  // Signals
  currentUser = this.authService.currentUser;
  loadingProfile = signal(false);
  loadingPassword = signal(false);
  loadingOrders = signal(false);

  // Formularios
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  // Órdenes
  orders = signal<OrderListItem[]>([]);
  ordersError = signal(false);

  ngOnInit() {
    this.initProfileForm();
    this.initPasswordForm();
    this.loadOrders();
  }

  // ==================== TAB 1: INFORMACIÓN PERSONAL ====================

  private initProfileForm() {
    const user = this.currentUser();
    this.profileForm = this.fb.group({
      firstName: [user?.firstName || '', [Validators.required, Validators.minLength(2)]],
      lastName: [user?.lastName || '', [Validators.required, Validators.minLength(2)]],
      email: [{ value: user?.email || '', disabled: true }],
      phone: [user?.phone || ''],
    });
  }

  onSaveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.loadingProfile.set(true);
    const formValue = this.profileForm.value;

    this.authService
      .updateProfile({
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phone: formValue.phone,
      })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Perfil Actualizado',
            detail: 'Tus datos se actualizaron correctamente',
          });
          this.profileForm.markAsPristine();
          this.loadingProfile.set(false);
        },
        error: (error) => {
          this.loadingProfile.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'No se pudo actualizar el perfil',
          });
        },
      });
  }

  // ==================== TAB 2: SEGURIDAD ====================

  private initPasswordForm() {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onChangePassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const formValue = this.passwordForm.value;

    // Validación frontend: newPassword !== currentPassword
    if (formValue.newPassword === formValue.currentPassword) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Contraseñas Iguales',
        detail: 'La nueva contraseña debe ser diferente de la actual',
      });
      return;
    }

    // Confirmación con Dialog
    this.confirmationService.confirm({
      header: '¿Cambiar Contraseña?',
      message: 'Se cerrará tu sesión en todos los dispositivos. Deberás iniciar sesión nuevamente.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Cambiar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.loadingPassword.set(true);

        this.authService
          .changePassword({
            currentPassword: formValue.currentPassword,
            newPassword: formValue.newPassword,
          })
          .subscribe({
            next: () => {
              // Logout automático después de cambiar password
              this.authService.logout().subscribe({
                next: () => {
                  this.messageService.add({
                    severity: 'success',
                    summary: 'Contraseña Actualizada',
                    detail: 'Por favor inicia sesión con tu nueva contraseña',
                  });
                  this.router.navigate(['/login']);
                },
                error: () => {
                  // Si falla el logout, limpiar sesión manualmente y redirect
                  localStorage.removeItem('accessToken');
                  this.router.navigate(['/login']);
                },
              });
            },
            error: (error) => {
              this.loadingPassword.set(false);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail:
                  error.error?.message ||
                  'No se pudo cambiar la contraseña',
              });
            },
          });
      },
    });
  }

  // ==================== TAB 3: HISTORIAL DE ÓRDENES ====================

  loadOrders() {
    // Prevenir requests adicionales si ya hay un error
    if (this.ordersError()) {
      return;
    }

    this.loadingOrders.set(true);

    this.orderService
      .getOrders({
        page: 1,
        limit: 100, // Cargar todas las órdenes del usuario (sin paginación por ahora)
      })
      .subscribe({
        next: (response: PaginatedResponse<OrderListItem>) => {
          this.orders.set(response.data);
          this.loadingOrders.set(false);
          this.ordersError.set(false);
        },
        error: (error) => {
          console.error('Error al cargar órdenes:', error);
          this.loadingOrders.set(false);
          this.ordersError.set(true);

          // Solo mostrar toast si NO es rate limiting (ya lo muestra el interceptor)
          if (error.status !== 429) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudieron cargar las órdenes',
            });
          }
        },
      });
  }

  retryLoadOrders() {
    this.ordersError.set(false);
    this.loadOrders();
  }

  viewOrder(orderId: string) {
    this.router.navigate(['/order-success', orderId]);
  }

  getSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    const severityMap: Record<string, 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined> = {
      pending: 'warn',
      processing: 'info',
      shipped: 'info',
      delivered: 'success',
      cancelled: 'danger',
    };
    return severityMap[status] || 'secondary';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      processing: 'Procesando',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  }

  /**
   * Navegar a la página anterior
   */
  goBack(): void {
    this.location.back();
  }
}
