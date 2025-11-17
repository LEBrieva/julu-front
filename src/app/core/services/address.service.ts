import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Address,
  CreateAddressRequest,
  UpdateAddressRequest,
} from '../models/address.model';

@Injectable({ providedIn: 'root' })
export class AddressService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/address`;

  getAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(this.apiUrl, { withCredentials: true });
  }

  getAddress(id: string): Observable<Address> {
    return this.http.get<Address>(`${this.apiUrl}/${id}`, {
      withCredentials: true,
    });
  }

  createAddress(data: CreateAddressRequest): Observable<Address> {
    return this.http.post<Address>(this.apiUrl, data, {
      withCredentials: true,
    });
  }

  updateAddress(id: string, data: UpdateAddressRequest): Observable<Address> {
    return this.http.patch<Address>(`${this.apiUrl}/${id}`, data, {
      withCredentials: true,
    });
  }

  deleteAddress(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      withCredentials: true,
    });
  }

  setDefaultAddress(id: string): Observable<Address> {
    return this.http.patch<Address>(
      `${this.apiUrl}/${id}/default`,
      {},
      { withCredentials: true }
    );
  }
}

