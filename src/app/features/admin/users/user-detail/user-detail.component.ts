import { Component, input, output, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Select } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

// Models & Services
import { User, UserRole, UserStatus } from '../../../../core/models/user.model';
import { UserService } from '../../../../core/services/user.service';

/**
 * UserDetailComponent - Modal de detalle de usuario
 *
 * Features:
 * - Muestra todos los datos del usuario en formato legible
 * - Avatar o iniciales
 * - Información personal
 * - Estado y rol con tags
 * - Fechas formateadas
 */
@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    TagModule,
    Select,
    InputTextModule,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent {
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Inputs
  user = input.required<User | null>();
  visible = input.required<boolean>();

  // Outputs
  visibleChange = output<boolean>();
  userUpdated = output<User>();

  // Enums
  readonly UserRole = UserRole;
  readonly UserStatus = UserStatus;

  // Opciones para dropdown de estado
  readonly statusOptions = [
    { label: 'Activo', value: UserStatus.ACTIVE },
    { label: 'Inactivo', value: UserStatus.INACTIVE }
  ];

  // Valores editables (trackean cambios locales)
  editableStatus = signal<UserStatus>(UserStatus.ACTIVE);
  editablePhone = signal<string>('');

  // Detecta si hay cambios pendientes
  hasChanges = computed(() => {
    const currentUser = this.user();
    if (!currentUser) return false;

    const statusChanged = this.editableStatus() !== currentUser.status;
    const phoneChanged = this.editablePhone() !== (currentUser.phone || '');

    return statusChanged || phoneChanged;
  });

  constructor() {
    // Effect para sincronizar valores editables cuando cambia el usuario
    effect(() => {
      const currentUser = this.user();
      if (currentUser) {
        this.editableStatus.set(currentUser.status);
        this.editablePhone.set(currentUser.phone || '');
      }
    });
  }

  /**
   * Cierra el dialog
   */
  closeDialog(): void {
    this.visibleChange.emit(false);
  }

  /**
   * Guarda los cambios del formulario (estado y teléfono)
   */
  saveChanges(): void {
    const currentUser = this.user();
    if (!currentUser || !currentUser.id || !this.hasChanges()) {
      return;
    }

    // Construir mensaje de confirmación dinámico con bullets
    const changes: string[] = [];
    if (this.editableStatus() !== currentUser.status) {
      changes.push(`   • Estado: ${this.editableStatus() === UserStatus.ACTIVE ? 'Activo' : 'Inactivo'}`);
    }
    if (this.editablePhone() !== (currentUser.phone || '')) {
      const phoneValue = this.editablePhone() || '(vacío)';
      changes.push(`   • Teléfono: ${phoneValue}`);
    }

    const message = `¿Desea guardar los siguientes cambios para ${currentUser.firstName} ${currentUser.lastName}?\n\n${changes.join('\n')}`;

    this.confirmationService.confirm({
      message: message,
      header: 'Confirmar Cambios',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, guardar',
      rejectLabel: 'Cancelar',
      accept: () => {
        // Capturar usuario actualizado DENTRO del callback para tener la referencia correcta
        const userToUpdate = this.user();
        if (!userToUpdate || !userToUpdate.id) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo obtener el ID del usuario'
          });
          return;
        }

        // Preparar datos para actualizar
        const updateData: any = {};
        if (this.editableStatus() !== userToUpdate.status) {
          updateData.status = this.editableStatus();
        }
        if (this.editablePhone() !== (userToUpdate.phone || '')) {
          updateData.phone = this.editablePhone() || undefined;
        }

        this.userService.updateUser(userToUpdate.id, updateData).subscribe({
          next: (updatedUser) => {
            // Emitir el usuario actualizado al componente padre
            this.userUpdated.emit(updatedUser);

            // Sincronizar valores editables con el usuario actualizado
            this.editableStatus.set(updatedUser.status);
            this.editablePhone.set(updatedUser.phone || '');

            this.messageService.add({
              severity: 'success',
              summary: 'Cambios guardados',
              detail: `Usuario ${updatedUser.firstName} ${updatedUser.lastName} actualizado correctamente`
            });

            // Cerrar el dialog después de guardar exitosamente
            this.closeDialog();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error al guardar cambios',
              detail: error.error?.message || 'Ocurrió un error al actualizar el usuario'
            });
          }
        });
      }
    });
  }

  /**
   * Formatea fecha completa
   */
  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtiene la severidad del Tag según el rol
   */
  getRoleSeverity(role: UserRole): 'success' | 'danger' {
    return role === UserRole.ADMIN ? 'danger' : 'success';
  }

  /**
   * Obtiene la severidad del Tag según el estado
   */
  getStatusSeverity(status: UserStatus): 'success' | 'secondary' {
    return status === UserStatus.ACTIVE ? 'success' : 'secondary';
  }
}
