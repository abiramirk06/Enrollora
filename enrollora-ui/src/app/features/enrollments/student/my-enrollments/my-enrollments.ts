
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';

import { EnrollmentResponse } from '../../enrollment.models';
import { EnrollmentService } from '../../enrollment.service';

import { CancellationRequestService } from '../../cancellation-request.service';
import {
  CancellationResponse,
  CancellationStatus,
} from '../../cancellation-request.models';

@Component({
  selector: 'app-my-enrollments',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './my-enrollments.css',
  templateUrl: './my-enrollments.html',
})
export class MyEnrollments implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly cancellationService = inject(CancellationRequestService);

  enrollments = signal<EnrollmentResponse[]>([]);
  cancellationRequests = signal<CancellationResponse[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  requestingId = signal<number | null>(null);
  reason = signal('');
  requestError = signal('');
  requestSuccess = signal('');
  submitting = signal(false);

  ngOnInit(): void {
    this.loadEnrollments();
    this.loadCancellationRequests();
  }

  loadEnrollments(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.enrollmentService
      .getMyEnrollments(this.pageNumber(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.enrollments.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          const body = error.error;
          this.errorMessage.set(
            body?.detail || body?.message || body?.title ||
            'Unable to load your enrollments.',
          );
          this.isLoading.set(false);
        },
      });
  }

  loadCancellationRequests(): void {
    this.cancellationService.getMine().subscribe({
      next: (response) => {
        this.cancellationRequests.set(response.items);
      },
      error: (error) => {
        console.error('Unable to load cancellation requests', error);
      },
    });
  }

  statusLabel(status: number): string {
    return status === 0 ? 'Active' : 'Cancelled';
  }

  getCancellationRequest(enrollmentId: number): CancellationResponse | undefined {
    return this.cancellationRequests().find(
      request => request.enrollmentId === enrollmentId,
    );
  }

  startRequest(enrollmentId: number): void {
    this.requestingId.set(enrollmentId);
    this.reason.set('');
    this.requestError.set('');
    this.requestSuccess.set('');
  }

  closeRequest(): void {
    this.requestingId.set(null);
    this.reason.set('');
    this.requestError.set('');
  }

  submitCancellation(enrollmentId: number): void {
    const reason = this.reason().trim();

    if (!reason) {
      this.requestError.set('Please enter a reason for cancellation.');
      return;
    }

    if (reason.length > 1000) {
      this.requestError.set('Reason cannot exceed 1000 characters.');
      return;
    }

    this.submitting.set(true);
    this.requestError.set('');

    this.cancellationService.create(enrollmentId, { reason }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.requestSuccess.set('Cancellation request submitted successfully.');
        this.closeRequest();
        this.loadCancellationRequests();
      },
      error: (error: HttpErrorResponse) => {
        const body = error.error;
        this.requestError.set(
          body?.detail || body?.message || body?.title ||
          'Unable to submit cancellation request.',
        );
        this.submitting.set(false);
      },
    });
  }

  canRequestCancellation(enrollment: EnrollmentResponse): boolean {
    if (enrollment.status !== 0) return false;

    const request = this.getCancellationRequest(enrollment.enrollmentId);

    // A pending or approved request prevents another request.
    // A rejected request allows the student to submit again.
    return !request ||
      request.status === CancellationStatus.Rejected;
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update(page => page - 1);
      this.loadEnrollments();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update(page => page + 1);
      this.loadEnrollments();
    }
  }
}
