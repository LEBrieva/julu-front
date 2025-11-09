import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

/**
 * AvatarOverlayComponent - Overlay reutilizable para ver/cambiar avatares
 *
 * Features:
 * - Muestra avatar ampliado en overlay fullscreen
 * - Permite seleccionar nueva imagen
 * - Valida tipo (JPEG/PNG/WebP) y tamaño (2MB)
 * - Genera preview antes de guardar
 * - Emite el archivo seleccionado al padre
 */
@Component({
  selector: 'app-avatar-overlay',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './avatar-overlay.component.html',
  styleUrls: ['./avatar-overlay.component.css']
})
export class AvatarOverlayComponent {
  // Inputs
  visible = input.required<boolean>();
  avatarUrl = input<string | null>(null);
  userInitials = input<string>('U');
  userName = input<string>('Usuario');

  // Outputs
  visibleChange = output<boolean>();
  avatarSelected = output<File>();
  validationError = output<string>();

  // Preview local
  previewUrl = signal<string | null>(null);

  constructor() {
    // Resetear preview cuando el overlay se cierra
    effect(() => {
      if (!this.visible()) {
        this.previewUrl.set(null);
      }
    });
  }

  /**
   * Abre el file picker
   */
  openFilePicker(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  /**
   * Cierra el overlay
   */
  close(): void {
    this.visibleChange.emit(false);
  }

  /**
   * Maneja la selección de archivo
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.validationError.emit('Solo se permiten imágenes JPEG, PNG o WebP');
      input.value = '';
      return;
    }

    // Validar tamaño (máximo 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      this.validationError.emit('El tamaño máximo permitido es 2MB');
      input.value = '';
      return;
    }

    // Generar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Emitir archivo al padre
    this.avatarSelected.emit(file);

    // Limpiar input
    input.value = '';
  }
}
