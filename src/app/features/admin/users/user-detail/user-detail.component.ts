import { Component, input, output, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { switchMap, of } from 'rxjs';

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

// Shared Components
import { AvatarOverlayComponent } from '../../../../shared/components/avatar-overlay/avatar-overlay.component';

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
    ConfirmDialogModule,
    AvatarOverlayComponent
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

  // Avatar
  selectedAvatarFile = signal<File | null>(null);
  avatarPreview = signal<string | null>(null);
  showAvatarOverlay = signal(false);

  // Cambios pendientes para el headless dialog
  pendingChanges: string[] = [];

  // Detecta si hay cambios pendientes
  hasChanges = computed(() => {
    const currentUser = this.user();
    if (!currentUser) return false;

    const statusChanged = this.editableStatus() !== currentUser.status;
    const phoneChanged = this.editablePhone() !== (currentUser.phone || '');
    const avatarChanged = this.selectedAvatarFile() !== null;

    return statusChanged || phoneChanged || avatarChanged;
  });

  constructor() {
    // Effect para sincronizar valores editables cuando cambia el usuario
    effect(() => {
      const currentUser = this.user();
      if (currentUser) {
        this.editableStatus.set(currentUser.status);
        this.editablePhone.set(currentUser.phone || '');
        // Resetear avatar al cambiar de usuario
        this.selectedAvatarFile.set(null);
        this.avatarPreview.set(null);
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
   * Abre el overlay con el avatar ampliado
   */
  onAvatarClick(): void {
    this.showAvatarOverlay.set(true);
  }

  /**
   * Cierra el overlay del avatar
   */
  closeAvatarOverlay(): void {
    this.showAvatarOverlay.set(false);
  }

  /**
   * Maneja la selección de un nuevo avatar desde el overlay
   */
  onAvatarSelected(file: File): void {
    // Guardar archivo seleccionado
    this.selectedAvatarFile.set(file);

    // Generar preview para mostrar en el dialog principal después de cerrar el overlay
    const reader = new FileReader();
    reader.onload = (e) => {
      this.avatarPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Maneja errores de validación del avatar
   */
  onAvatarValidationError(error: string): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Archivo no válido',
      detail: error
    });
  }

  /**
   * Guarda los cambios del formulario (estado, teléfono y avatar)
   */
  saveChanges(): void {
    const currentUser = this.user();
    if (!currentUser || !currentUser.id || !this.hasChanges()) {
      return;
    }

    // Construir lista de cambios para el headless dialog
    this.pendingChanges = [];
    if (this.editableStatus() !== currentUser.status) {
      this.pendingChanges.push(`Estado: ${this.editableStatus() === UserStatus.ACTIVE ? 'Activo' : 'Inactivo'}`);
    }
    if (this.editablePhone() !== (currentUser.phone || '')) {
      const phoneValue = this.editablePhone() || '(vacío)';
      this.pendingChanges.push(`Teléfono: ${phoneValue}`);
    }
    if (this.selectedAvatarFile()) {
      this.pendingChanges.push(`Avatar: Nueva imagen seleccionada`);
    }

    this.confirmationService.confirm({
      key: 'saveChanges',
      message: `¿Desea guardar los siguientes cambios para ${currentUser.firstName} ${currentUser.lastName}?`,
      header: 'Confirmar Cambios',
      icon: 'pi pi-save',
      acceptLabel: 'Sí, guardar',
      rejectLabel: 'Cancelar',
      accept: () => {
        const userToUpdate = this.user();
        if (!userToUpdate || !userToUpdate.id) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo obtener el ID del usuario'
          });
          return;
        }

        // Determinar qué hay que actualizar
        const hasBasicChanges = this.editableStatus() !== userToUpdate.status ||
                               this.editablePhone() !== (userToUpdate.phone || '');
        const hasAvatarChange = this.selectedAvatarFile() !== null;

        // Preparar datos básicos para actualizar
        const updateData: any = {};
        if (this.editableStatus() !== userToUpdate.status) {
          updateData.status = this.editableStatus();
        }
        if (this.editablePhone() !== (userToUpdate.phone || '')) {
          updateData.phone = this.editablePhone() || undefined;
        }

        // Crear observable inicial
        let saveObservable = of(userToUpdate);

        // Si hay cambios básicos, actualizar primero
        if (hasBasicChanges && Object.keys(updateData).length > 0) {
          saveObservable = this.userService.updateUser(userToUpdate.id, updateData);
        }

        // Si hay avatar, encadenar la subida
        if (hasAvatarChange) {
          const avatarFile = this.selectedAvatarFile();
          if (avatarFile) {
            saveObservable = saveObservable.pipe(
              switchMap(() => this.userService.uploadAvatar(userToUpdate.id, avatarFile))
            );
          }
        }

        // Ejecutar las actualizaciones
        saveObservable.subscribe({
          next: (updatedUser) => {
            // Emitir el usuario actualizado al componente padre
            this.userUpdated.emit(updatedUser);

            // Sincronizar valores editables
            this.editableStatus.set(updatedUser.status);
            this.editablePhone.set(updatedUser.phone || '');

            // Limpiar avatar temporal
            this.selectedAvatarFile.set(null);
            this.avatarPreview.set(null);

            this.messageService.add({
              severity: 'success',
              summary: 'Cambios guardados',
              detail: `Usuario ${updatedUser.firstName} ${updatedUser.lastName} actualizado correctamente`
            });

            // Cerrar el dialog
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
