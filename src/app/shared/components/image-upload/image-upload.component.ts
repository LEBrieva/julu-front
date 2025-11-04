import { Component, inject, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { GalleriaModule } from 'primeng/galleria';

import { ProductService } from '../../../core/services/product.service';

/**
 * ImageUploadComponent - Componente reutilizable para gestionar imágenes de productos
 *
 * Features:
 * - Upload de múltiples imágenes (hasta 5 total)
 * - Validaciones: tipo (JPEG, PNG, WebP), tamaño (5MB), cantidad (5 máx)
 * - Preview de imágenes con grid responsive
 * - Galería fullscreen (PrimeNG Galleria) con navegación y thumbnails
 * - Establecer imagen destacada/portada (estrella dorada clickeable)
 * - Eliminación con confirmación
 * - Loading states
 * - Integración con Cloudinary vía backend
 */
@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [
    CommonModule,
    FileUploadModule,
    ButtonModule,
    ProgressBarModule,
    ProgressSpinnerModule,
    TooltipModule,
    GalleriaModule
  ],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.css']
})
export class ImageUploadComponent {
  private productService = inject(ProductService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // ==================
  // SIGNAL INPUTS / OUTPUTS (Angular 20)
  // ==================

  // Inputs
  productId = input.required<string>();
  currentImages = input<string[]>([]);
  featuredImageIndex = input<number>(0);
  maxImages = input<number>(5);
  disabled = input<boolean>(false);

  // Outputs
  imagesChanged = output<string[]>();
  featuredImageChanged = output<number>();

  // ==================
  // STATE (Signals)
  // ==================

  uploading = signal(false);
  uploadProgress = signal(0);
  deleting = signal(false);
  settingFeatured = signal(false);
  displayGalleria = signal(false); // Controla la visibilidad de la galería
  activeIndex = signal(0); // Índice de la imagen activa en la galería

  // ==================
  // COMPUTED SIGNALS
  // ==================

  /**
   * Calcula cuántas imágenes más se pueden subir
   */
  remainingSlots = computed(() => {
    return this.maxImages() - this.currentImages().length;
  });

  /**
   * Verifica si se puede subir más imágenes
   */
  canUpload = computed(() => {
    return !this.disabled() && this.currentImages().length < this.maxImages();
  });

  // ==================
  // CONSTANTES
  // ==================

  readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  readonly acceptedTypes = 'image/jpeg,image/png,image/webp';

  // ==================
  // METHODS
  // ==================

  /**
   * Handler del upload manual
   * @param event Evento de FileUpload con los archivos seleccionados
   * @param fileUpload Referencia al componente FileUpload para limpiar después
   */
  async onUpload(event: any, fileUpload: FileUpload): Promise<void> {
    const files: File[] = event.files;

    // Validar que no se exceda el límite
    if (this.currentImages().length + files.length > this.maxImages()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Límite excedido',
        detail: `Solo puedes subir ${this.remainingSlots()} imagen(es) más. Máximo ${this.maxImages()} imágenes por producto.`
      });
      fileUpload.clear();
      return;
    }

    // Validar tamaño de cada archivo
    const oversizedFiles = files.filter(f => f.size > this.maxFileSize);
    if (oversizedFiles.length > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Archivo muy grande',
        detail: `Las imágenes deben pesar menos de 5MB. ${oversizedFiles.length} archivo(s) excede(n) el límite.`
      });
      fileUpload.clear();
      return;
    }

    // Iniciar upload
    this.uploading.set(true);
    this.uploadProgress.set(0);

    try {
      // Simular progreso (PrimeNG FileUpload no tiene progress real con custom upload)
      const progressInterval = setInterval(() => {
        const current = this.uploadProgress();
        if (current < 90) {
          this.uploadProgress.set(current + 10);
        }
      }, 200);

      // Llamar al servicio
      const response = await this.productService.uploadImages(this.productId(), files).toPromise();

      clearInterval(progressInterval);
      this.uploadProgress.set(100);

      if (response) {
        // Emitir imágenes actualizadas
        this.imagesChanged.emit(response.images);

        this.messageService.add({
          severity: 'success',
          summary: 'Imágenes subidas',
          detail: response.message
        });
      }

      // Limpiar el componente FileUpload
      fileUpload.clear();

    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error al subir imágenes',
        detail: error.error?.message || 'Ocurrió un error al subir las imágenes'
      });
    } finally {
      this.uploading.set(false);
      this.uploadProgress.set(0);
    }
  }

  /**
   * Elimina una imagen con confirmación
   * @param imageUrl URL de la imagen a eliminar
   * @param index Índice de la imagen en el array
   */
  deleteImage(imageUrl: string, index: number): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de eliminar esta imagen? Esta acción no se puede deshacer.',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        this.deleting.set(true); // Bloquear pantalla completa

        try {
          const updatedProduct = await this.productService.deleteImage(this.productId(), index).toPromise();

          if (updatedProduct) {
            this.imagesChanged.emit(updatedProduct.images || []);

            this.messageService.add({
              severity: 'success',
              summary: 'Imagen eliminada',
              detail: 'La imagen se eliminó correctamente'
            });
          }
        } catch (error: any) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error al eliminar imagen',
            detail: error.error?.message || 'Ocurrió un error al eliminar la imagen'
          });
        } finally {
          this.deleting.set(false); // Desbloquear pantalla
        }
      }
    });
  }

  /**
   * Handler cuando se seleccionan archivos (para validaciones)
   */
  onSelect(event: any, fileUpload: FileUpload): void {
    const files: File[] = event.currentFiles;

    // Validar límite total
    if (this.currentImages().length + files.length > this.maxImages()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Demasiadas imágenes',
        detail: `Solo puedes subir ${this.remainingSlots()} imagen(es) más`
      });
      fileUpload.clear();
      return;
    }

    // Validar tipos de archivo
    const invalidFiles = files.filter(
      f => !f.type.match(/^image\/(jpeg|jpg|png|webp)$/)
    );

    if (invalidFiles.length > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Tipo de archivo inválido',
        detail: 'Solo se permiten imágenes JPEG, PNG o WebP'
      });
      fileUpload.clear();
      return;
    }

    // Validar tamaño
    const oversizedFiles = files.filter(f => f.size > this.maxFileSize);
    if (oversizedFiles.length > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Archivo muy grande',
        detail: 'Las imágenes deben pesar menos de 5MB'
      });
      fileUpload.clear();
    }
  }

  /**
   * Abre la galería en una imagen específica
   * @param imageUrl URL de la imagen para buscar su índice
   */
  openImagePreview(imageUrl: string): void {
    const index = this.currentImages().indexOf(imageUrl);
    if (index !== -1) {
      this.activeIndex.set(index);
      this.displayGalleria.set(true);
    }
  }

  /**
   * Establece una imagen como portada/destacada
   * @param index Índice de la imagen a establecer como portada
   */
  async setFeaturedImage(index: number): Promise<void> {
    if (this.disabled()) {
      return;
    }

    this.settingFeatured.set(true);

    try {
      const updatedProduct = await this.productService.setFeaturedImage(this.productId(), index).toPromise();

      if (updatedProduct && updatedProduct.featuredImageIndex !== undefined) {
        this.featuredImageChanged.emit(updatedProduct.featuredImageIndex);

        this.messageService.add({
          severity: 'success',
          summary: 'Imagen destacada actualizada',
          detail: 'La imagen portada se actualizó correctamente'
        });
      }
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error al establecer imagen destacada',
        detail: error.error?.message || 'Ocurrió un error al actualizar la imagen destacada'
      });
    } finally {
      this.settingFeatured.set(false);
    }
  }
}
