import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CourseService } from '../course.service';
import { CourseResponse, SaveCourseRequest } from '../course.models';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-list.html',
  styleUrl: './course-list.css',
})
export class CourseListComponent implements OnInit {
  private courseService = inject(CourseService);

  // Course list
  courses = signal<CourseResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Pagination
  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  // Add course form
  showAddForm = signal(false);
  isSaving = signal(false);
  addError = signal('');

  newCourse: SaveCourseRequest = this.getEmptyCourse();

  ngOnInit(): void {
    this.loadCourses();
  }

  private getEmptyCourse(): SaveCourseRequest {
    return {
      courseName: '',
      duration: '',
      fees: 0,
      capacity: 1,
      isActive: true
    };
  }

  // Load courses from API
  loadCourses(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.courseService
      .getCourses(this.pageNumber(), this.pageSize())
      .subscribe({
        next: response => {
          this.courses.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: error => {
          console.error('Error loading courses:', error);
          this.errorMessage.set('Unable to load courses.');
          this.isLoading.set(false);
        }
      });
  }

  // Open add course form
  openAddForm(): void {
    this.newCourse = this.getEmptyCourse();
    this.addError.set('');
    this.successMessage.set('');
    this.showAddForm.set(true);
  }

  // Close add course form
  closeAddForm(): void {
    this.showAddForm.set(false);
    this.addError.set('');
  }

  // Save new course
  addCourse(): void {
    if (
      !this.newCourse.courseName.trim() ||
      !this.newCourse.duration.trim() ||
      this.newCourse.fees < 0 ||
      this.newCourse.capacity < 1
    ) {
      this.addError.set('Please enter valid course details.');
      return;
    }

    this.isSaving.set(true);
    this.addError.set('');

    this.courseService.createCourse(this.newCourse).subscribe({
      next: response => {
        this.isSaving.set(false);
        this.showAddForm.set(false);
        this.successMessage.set(
          `${response.courseName} added successfully!`
        );

        // Return to first page so the new course is visible
        this.pageNumber.set(1);
        this.loadCourses();
      },
      error: error => {
        console.error('Error adding course:', error);

        this.isSaving.set(false);

        this.addError.set(
          error.error?.detail ||
          error.error?.message ||
          error.error?.title ||
          'Unable to add course. Please try again.'
        );
      }
    });
  }

  // Next page
  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update(page => page + 1);
      this.loadCourses();
    }
  }

  // Previous page
  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update(page => page - 1);
      this.loadCourses();
    }
  }
}