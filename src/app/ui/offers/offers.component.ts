import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { OffersService } from '../../services/offers.service';
import { ToastService } from '../../services/toast.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './offers.component.html',
  styleUrl: './offers.component.css',
})
export class OffersComponent {
  offerForm: FormGroup;
  loading = false;
  successMsg = '';
  errorMsg = '';
  imagePreviewUrl: string | null = null;
  imageError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private offersService: OffersService,
    private toast: ToastService
  ) {
    this.offerForm = this.fb.group({
      image: [null, Validators.required],
      is_active: [true],
      display_order: [null],
      start_date: [null, Validators.required],
      end_date: [null, Validators.required],
      button_link: [
        null,
        [
          Validators.maxLength(255),
          Validators.pattern(
            /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/i
          ),
        ],
      ],
      is_limited_time: [false],
      title: this.fb.group({
        en: ['', [Validators.required, Validators.maxLength(255)]],
        ar: ['', [Validators.required, Validators.maxLength(255)]],
      }),
      description: this.fb.group({
        en: ['', Validators.required],
        ar: ['', Validators.required],
      }),
      discount_text: this.fb.group({
        en: ['', [Validators.required, Validators.maxLength(255)]],
        ar: ['', [Validators.required, Validators.maxLength(255)]],
      }),
      button_text: this.fb.group({
        en: ['', [Validators.required, Validators.maxLength(255)]],
        ar: ['', [Validators.required, Validators.maxLength(255)]],
      }),
    });
  }

  onFileChange(event: any) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        this.imageError = 'Only JPG and PNG images are allowed.';
        this.offerForm.patchValue({ image: null });
        this.imagePreviewUrl = null;
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 1 * 1024 * 1024) {
        this.imageError = 'Image must be less than 2MB.';
        this.offerForm.patchValue({ image: null });
        this.imagePreviewUrl = null;
        return;
      }
      // Validate dimensions (min 800x600)
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          if (img.width < 800 || img.height < 600) {
            this.imageError = 'Image must be at least 800x600 pixels.';
            this.offerForm.patchValue({ image: null });
            this.imagePreviewUrl = null;
          } else {
            this.imageError = null;
            this.offerForm.patchValue({ image: file });
            this.imagePreviewUrl = e.target.result;
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
      return;
    }
    this.imageError = null;
  }

  onDropzoneMouseDown(event: MouseEvent, fileInput: HTMLInputElement) {
    // Only trigger if the user clicks directly on the dropzone, not on children (like remove button)
    if (event.target === event.currentTarget) {
      fileInput.value = '';
      fileInput.click();
    }
  }

  removeImage(event: Event, fileInput: HTMLInputElement) {
    event.stopPropagation();
    this.offerForm.patchValue({ image: null });
    this.imagePreviewUrl = null;
    this.imageError = null;
    fileInput.value = '';
  }

  showAllErrorsIfInvalid(event: Event) {
    if (this.offerForm.invalid) {
      event.preventDefault();
      this.offerForm.markAllAsTouched();
    }
  }

  submitOffer() {
    if (this.offerForm.invalid) {
      this.offerForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.offerForm.disable();
    this.successMsg = '';
    this.errorMsg = '';
    this.imagePreviewUrl = null;
    const formData = new FormData();
    const value = this.offerForm.value;
    formData.append('image', value.image);
    formData.append('is_active', value.is_active ? '1' : '0');
    if (value.display_order !== null && value.display_order !== undefined)
      formData.append('display_order', value.display_order);
    if (value.start_date)
      formData.append('start_date', this.toBackendDate(value.start_date));
    if (value.end_date)
      formData.append('end_date', this.toBackendDate(value.end_date));
    if (value.button_link) formData.append('button_link', value.button_link);
    formData.append('is_limited_time', value.is_limited_time ? '1' : '0');
    // Translation fields as arrays
    formData.append('title[en]', value.title.en);
    formData.append('title[ar]', value.title.ar);
    formData.append('description[en]', value.description.en);
    formData.append('description[ar]', value.description.ar);
    formData.append('discount_text[en]', value.discount_text.en);
    formData.append('discount_text[ar]', value.discount_text.ar);
    formData.append('button_text[en]', value.button_text.en);
    formData.append('button_text[ar]', value.button_text.ar);
    const token = localStorage.getItem('token') || '';
    this.offersService.createOffer(formData, token).subscribe({
      next: (res) => {
        console.log(res);
        this.successMsg = 'Offer created successfully!';
        this.toast.show(this.successMsg, 'success');
        this.offerForm.reset();
        this.loading = false;
        this.offerForm.enable();
      },
      error: (err) => {
        console.log(err);
        if (err.status === 422) {
          this.errorMsg = 'Please check the form for errors and try again.';
        } else if (err.status === 401) {
          this.errorMsg = 'You are not authorized. Please log in again.';
        } else {
          this.errorMsg = 'Something went wrong. Please try again later.';
        }
        this.toast.show(this.errorMsg, 'error');
        this.loading = false;
        this.offerForm.enable();
      },
    });
  }

  getToday(): string {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  }

  getFutureDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  toBackendDate(dateStr: string): string {
    return dateStr ? dateStr + ' 00:00:00' : '';
  }
}
