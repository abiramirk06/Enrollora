
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { CancellationRequestService } from '../../enrollments/cancellation-request.service';
import { CancellationResponse } from '../../enrollments/cancellation-request.models';

@Component({
  selector: 'app-student-cancellation-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cancellation-requests.html',
  styleUrl: './cancellation-requests.css',
})
export class StudentCancellationRequests implements OnInit {
  private readonly service = inject(CancellationRequestService);

  requests = signal<CancellationResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.service.getMine().subscribe({
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

  statusLabel(status: number): string {
    return status === 0 ? 'Pending' :
      status === 1 ? 'Approved' : 'Rejected';
  }
}
