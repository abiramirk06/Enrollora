
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PagedResult } from '../../shared/models/paged-result.model';

import {
  CancellationFilter,
  CancellationResponse,
  CreateCancellationRequest,
  ReviewCancellationRequest,
} from './cancellation-request.models';

@Injectable({
  providedIn: 'root',
})
export class CancellationRequestService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/cancellation-requests`;

  // Admin: Get all cancellation requests
  getAll(
    pageNumber = 1,
    pageSize = 10,
    filters?: CancellationFilter,
  ): Observable<PagedResult<CancellationResponse>> {
    return this.http.get<PagedResult<CancellationResponse>>(
      this.apiUrl,
      {
        params: this.buildParams(pageNumber, pageSize, filters),
      },
    );
  }

  // Student: Get logged-in student's cancellation requests
  getMine(
    pageNumber = 1,
    pageSize = 10,
  ): Observable<PagedResult<CancellationResponse>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<PagedResult<CancellationResponse>>(
      `${this.apiUrl}/my`,
      { params },
    );
  }

  // Student: Submit cancellation request for an enrollment
  create(
    enrollmentId: number,
    request: CreateCancellationRequest,
  ): Observable<CancellationResponse> {
    return this.http.post<CancellationResponse>(
      `${environment.apiUrl}/enrollments/${enrollmentId}/cancellation-request`,
      request,
    );
  }

  // Admin: Approve cancellation request
  approve(
    requestId: number,
    request: ReviewCancellationRequest,
  ): Observable<CancellationResponse> {
    return this.http.put<CancellationResponse>(
      `${this.apiUrl}/${requestId}/approve`,
      request,
    );
  }

  // Admin: Reject cancellation request
  reject(
    requestId: number,
    request: ReviewCancellationRequest,
  ): Observable<CancellationResponse> {
    return this.http.put<CancellationResponse>(
      `${this.apiUrl}/${requestId}/reject`,
      request,
    );
  }

  // Build query parameters for admin filtering
  private buildParams(
    pageNumber: number,
    pageSize: number,
    filters?: CancellationFilter,
  ): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    if (filters?.courseId != null) {
      params = params.set('courseId', filters.courseId);
    }

    if (filters?.status != null) {
      params = params.set('status', filters.status);
    }

    if (filters?.fromDate) {
      params = params.set('fromDate', filters.fromDate);
    }

    if (filters?.toDate) {
      params = params.set('toDate', filters.toDate);
    }

    return params;
  }
}
