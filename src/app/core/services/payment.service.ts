import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreatePreferenceRequest,
  CreatePreferenceResponse
} from '../models/payment.model';

/**
 * Servicio para gestión de pagos con Mercado Pago
 */
@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payment`;

  /**
   * Crea una preferencia de pago en Mercado Pago
   * @param request Datos de la orden y método de pago
   * @returns Observable con URL de checkout y IDs
   */
  createPreference(request: CreatePreferenceRequest): Observable<CreatePreferenceResponse> {
    return this.http.post<CreatePreferenceResponse>(`${this.apiUrl}/preference`, request);
  }
}
