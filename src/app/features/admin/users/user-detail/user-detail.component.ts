import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

// Models
import { User, UserRole, UserStatus } from '../../../../core/models/user.model';

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
    DialogModule,
    ButtonModule,
    TagModule
  ],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent {
  // Inputs
  user = input.required<User | null>();
  visible = input.required<boolean>();

  // Outputs
  visibleChange = output<boolean>();

  // Enums
  readonly UserRole = UserRole;
  readonly UserStatus = UserStatus;

  /**
   * Cierra el dialog
   */
  closeDialog(): void {
    this.visibleChange.emit(false);
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
