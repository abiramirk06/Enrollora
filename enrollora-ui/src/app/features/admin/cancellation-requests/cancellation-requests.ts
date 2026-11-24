
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';

import { CancellationRequestService } from '../../enrollments/cancellation-request.service';
import { CancellationResponse } from '../../enrollments/cancellation-request.models';

@Component({
  selector: 'app-admin-cancellation-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cancellation-requests.html',
  styleUrl: './cancellation-requests.css',
})
export class CancellationRequests implements OnInit {
  private readonly service = inject(CancellationRequestService);

  requests = signal<CancellationResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  actionMessage = signal('');
  adminRemarks = signal<Record<number, string>>({});
  processingId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.service.getAll().subscribe({
      next: response => {
        this.requests.set(response.items);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.detail || 'Unable to load cancellation requests.',
        );
        this.isLoading.set(false);
      },
    });
  }

  updateRemarks(requestId: number, value: string): void {
    this.adminRemarks.update(current => ({
      ...current,
      [requestId]: value,
    }));
  }

  review(requestId: number, action: 'approve' | 'reject'): void {
    this.processingId.set(requestId);
    this.actionMessage.set('');
    this.errorMessage.set('');

    const payload = {
      adminRemarks: this.adminRemarks()[requestId]?.trim() || null,
    };

    const request$ = action === 'approve'
      ? this.service.approve(requestId, payload)
      : this.service.reject(requestId, payload);

    request$.subscribe({
      next: () => {
        this.actionMessage.set(
          action === 'approve'
            ? 'Cancellation request approved.'
            : 'Cancellation request rejected.',
        );

        this.processingId.set(null);

        this.adminRemarks.update(current => {
          const updated = { ...current };
          delete updated[requestId];
          return updated;
        });

        this.loadRequests();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.detail || 'Unable to process this request.',
        );
        this.processingId.set(null);
      },
    });
  }

  statusLabel(status: number): string {
    return status === 0 ? 'Pending' :
      status === 1 ? 'Approved' : 'Rejected';
  }
}
