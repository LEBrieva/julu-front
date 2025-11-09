import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

// Services & Models
import { UserService } from '../../../core/services/user.service';
import { User, UserRole, UserStatus, FilterUserDto } from '../../../core/models/user.model';

// Components
import { UserDetailComponent } from './user-detail/user-detail.component';

/**
 * AdminUsersComponent - Gestión de usuarios (Admin)
 *
 * Features:
 * - Lista paginada de usuarios
 * - Filtros: role, status
 * - Búsqueda por nombre, apellido o email
 * - Cambio de rol inline (admin <-> user)
 * - Cambio de estado inline (active <-> inactive)
 * - Ver detalle en modal
 */
@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    Select,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    UserDetailComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // ==================
  // SIGNALS
  // ==================

  users = signal<User[]>([]);
  loading = signal(false);
  totalRecords = signal(0);

  // Filtros
  selectedRole = signal<UserRole | null>(null);
  selectedStatus = signal<UserStatus | null>(null);
  searchTerm = signal('');

  // Paginación
  currentPage = signal(1);
  rowsPerPage = signal(10);

  // User detail modal
  showDetailDialog = signal(false);
  selectedUser = signal<User | null>(null);

  // ==================
  // COMPUTED
  // ==================

  totalPages = computed(() => Math.ceil(this.totalRecords() / this.rowsPerPage()));

  // ==================
  // CONSTANTES
  // ==================

  // Enums para usar en template
  readonly UserRole = UserRole;
  readonly UserStatus = UserStatus;

  // Opciones para dropdowns
  readonly roleOptions = [
    { label: 'Todos', value: null },
    { label: 'Admin', value: UserRole.ADMIN },
    { label: 'Usuario', value: UserRole.USER }
  ];

  readonly statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Activo', value: UserStatus.ACTIVE },
    { label: 'Inactivo', value: UserStatus.INACTIVE }
  ];

  // ==================
  // LIFECYCLE
  // ==================

  ngOnInit(): void {
    this.loadUsers();
  }

  // ==================
  // METHODS
  // ==================

  /**
   * Carga usuarios del backend con filtros
   */
  loadUsers(): void {
    this.loading.set(true);

    const filters: FilterUserDto = {
      page: this.currentPage(),
      limit: this.rowsPerPage()
    };

    if (this.selectedRole()) filters.role = this.selectedRole()!;
    if (this.selectedStatus()) filters.status = this.selectedStatus()!;
    if (this.searchTerm().trim()) filters.search = this.searchTerm().trim();

    this.userService.getUsers(filters).subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.totalRecords.set(response.pagination.total);
        this.loading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar usuarios',
          detail: error.error?.message || 'Ocurrió un error al cargar los usuarios'
        });
        this.loading.set(false);
      }
    });
  }

  /**
   * Handler del lazy loading de PrimeNG Table
   */
  onLazyLoad(event: TableLazyLoadEvent): void {
    const page = event.first! / event.rows! + 1;
    this.currentPage.set(page);
    this.rowsPerPage.set(event.rows || 10);
    this.loadUsers();
  }

  /**
   * Aplica filtros y resetea a página 1
   */
  applyFilters(): void {
    this.currentPage.set(1);
    this.loadUsers();
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.selectedRole.set(null);
    this.selectedStatus.set(null);
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.loadUsers();
  }

  /**
   * Actualiza un usuario en la lista cuando se edita desde el dialog
   */
  onUserUpdated(updatedUser: User): void {
    this.users.update(users =>
      users.map(u => u.id === updatedUser.id ? updatedUser : u)
    );
  }

  /**
   * Abre el diálogo de detalle de usuario
   */
  viewUserDetail(user: User): void {
    this.selectedUser.set(user);
    this.showDetailDialog.set(true);
  }

  /**
   * Formatea la fecha de último login
   */
  formatLastLogin(date: Date | undefined): string {
    if (!date) return 'Nunca';

    const lastLogin = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - lastLogin.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return lastLogin.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
