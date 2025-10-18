import { Component, Input } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';

/**
 * TooltipIconComponent - Ícono de ayuda con tooltip
 *
 * Componente reutilizable que muestra un ícono (?) con tooltip informativo.
 * Detecta automáticamente si es dispositivo táctil y ajusta el evento:
 * - PC: hover (pasar el mouse)
 * - Móvil: focus (tap)
 */
@Component({
  selector: 'app-tooltip-icon',
  imports: [TooltipModule],
  templateUrl: './tooltip-icon.html',
  styleUrl: './tooltip-icon.css'
})
export class TooltipIcon {
  /**
   * Texto a mostrar en el tooltip
   */
  @Input({ required: true }) text!: string;

  /**
   * Posición del tooltip (por defecto arriba)
   */
  @Input() position: 'top' | 'bottom' | 'left' | 'right' = 'top';

  /**
   * Detectar si es dispositivo táctil al inicializar el componente
   */
  private isTouchDevice = this.detectTouchDevice();

  /**
   * Detecta si el dispositivo tiene capacidad táctil
   */
  private detectTouchDevice(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    );
  }

  /**
   * Retorna el evento de tooltip según el tipo de dispositivo
   * - Dispositivos táctiles: 'focus' (requiere tap)
   * - Dispositivos no táctiles: 'hover' (requiere mouse)
   */
  get tooltipEvent(): 'hover' | 'focus' {
    return this.isTouchDevice ? 'focus' : 'hover';
  }
}
