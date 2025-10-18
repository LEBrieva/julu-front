import { Component, Input } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';

/**
 * TooltipIconComponent - Ícono de ayuda con tooltip
 *
 * Componente reutilizable que muestra un ícono (?) con tooltip informativo.
 * Usa evento 'focus' para consistencia en todos los dispositivos (requiere click/tap).
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
   * Siempre usa 'focus' para consistencia en todos los dispositivos
   * - Requiere click/tap en cualquier dispositivo
   */
  get tooltipEvent(): 'focus' {
    return 'focus';
  }
}
