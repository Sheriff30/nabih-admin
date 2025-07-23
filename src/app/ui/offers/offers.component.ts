import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { OffersService } from '../../services/offers.service';
import { ToastService } from '../../services/toast.service';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, CommonModule, FormsModule],
  templateUrl: './offers.component.html',
  styleUrl: './offers.component.css',
})
export class OffersComponent implements OnInit {
  offerForm: FormGroup;
  loading = false;
  successMsg = '';
  errorMsg = '';
  imagePreviewUrl: string | null = null;
  imageError: string | null = null;

  // Table state
  offers: any[] = [];
  offersLoading = false;
  meta: any = null;
  searchTerm: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage: number = 1;
  perPage: number = 10;
  Math = Math;
  showCreateForm = false;
  showEditForm = false;
  editOfferId: number | null = null;
  editImagePreviewUrl: string | null = null;
  showDeleteConfirmation = false;
  offerToDelete: any = null;
  private initialEditFormValue: any = null;

  constructor(
    private fb: FormBuilder,
    private offersService: OffersService,
    private toast: ToastService
  ) {
    this.offerForm = this.fb.group(
      {
        image: [null], // No required validator here
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
          en: ['', [Validators.required, Validators.maxLength(200)]],
          ar: ['', [Validators.required, Validators.maxLength(200)]],
        }),
        description: this.fb.group({
          en: ['', [Validators.required, Validators.maxLength(200)]],
          ar: ['', [Validators.required, Validators.maxLength(200)]],
        }),
        discount_text: this.fb.group({
          en: ['', [Validators.required, Validators.maxLength(50)]],
          ar: ['', [Validators.required, Validators.maxLength(50)]],
        }),
        button_text: this.fb.group({
          en: ['', [Validators.required, Validators.maxLength(255)]],
          ar: ['', [Validators.required, Validators.maxLength(255)]],
        }),
      },
      {
        validators: [
          this.dateRangeValidator,
          this.imageRequiredValidator.bind(this),
        ],
      }
    );
  }

  dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const startDate = control.get('start_date')?.value;
    const endDate = control.get('end_date')?.value;
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return { dateRange: true };
    }
    return null;
  }

  /**
   * Custom validator: require image if creating, or if editing and no image exists
   */
  imageRequiredValidator(form: AbstractControl): ValidationErrors | null {
    // If in edit mode and there is an existing image, image is not required
    const image = form.get('image')?.value;
    if (this.showEditForm) {
      if (!image && !this.editImagePreviewUrl) {
        return { imageRequired: true };
      }
    } else {
      // In create mode, image is always required
      if (!image) {
        return { imageRequired: true };
      }
    }
    return null;
  }

  ngOnInit(): void {
    this.loadOffers();
  }

  loadOffers() {
    this.offersLoading = true;
    const token = localStorage.getItem('token');
    if (!token) {
      this.toast.show('Authentication token not found.', 'error');
      this.offersLoading = false;
      return;
    }
    this.offersService
      .getOffers(token, this.currentPage, this.perPage)
      .subscribe({
        next: (res) => {
          console.log(res);
          if (res.success && res.data.offers) {
            this.offers = res.data.offers;
            this.meta = res.data.meta;
          } else {
            this.toast.show('Failed to load offers.', 'error');
          }
          this.offersLoading = false;
        },
        error: (err) => {
          this.toast.show('An error occurred while fetching offers.', 'error');
          this.offersLoading = false;
        },
      });
  }

  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.offerForm.reset();
      this.imagePreviewUrl = null;
      this.imageError = null;
    }
  }

  openEditForm(offer: any) {
    this.showEditForm = true;
    this.editOfferId = offer.id;
    this.offerForm.reset();
    this.imageError = null;
    // Patch form with offer data
    this.offerForm.patchValue({
      image: null, // No file selected yet
      is_active: offer.is_active,
      display_order: offer.display_order,
      start_date: offer.start_date ? offer.start_date.slice(0, 10) : null,
      end_date: offer.end_date ? offer.end_date.slice(0, 10) : null,
      button_link: offer.button_link,
      is_limited_time: offer.is_limited_time,
      title: {
        en: offer.title?.en || '',
        ar: offer.title?.ar || '',
      },
      description: {
        en: offer.description?.en || '',
        ar: offer.description?.ar || '',
      },
      discount_text: {
        en: offer.discount_text?.en || '',
        ar: offer.discount_text?.ar || '',
      },
      button_text: {
        en: offer.button_text?.en || '',
        ar: offer.button_text?.ar || '',
      },
    });
    this.initialEditFormValue = this.offerForm.value; // Store for comparison
    this.editImagePreviewUrl = offer.image_url || null;
    this.imagePreviewUrl = null;
  }

  closeEditForm() {
    this.showEditForm = false;
    this.editOfferId = null;
    this.editImagePreviewUrl = null;
    this.offerForm.reset();
    this.imageError = null;
    this.imagePreviewUrl = null;
    this.initialEditFormValue = null;
  }

  openDeleteConfirmation(offer: any) {
    this.offerToDelete = offer;
    this.showDeleteConfirmation = true;
  }

  closeDeleteConfirmation() {
    this.offerToDelete = null;
    this.showDeleteConfirmation = false;
  }

  confirmDelete() {
    if (!this.offerToDelete) return;

    this.loading = true;
    const token = localStorage.getItem('token') || '';

    this.offersService.deleteOffer(this.offerToDelete.id, token).subscribe({
      next: (res) => {
        this.toast.show('Offer deleted successfully!', 'success');

        // If the last item on a page is deleted, go to the previous page
        if (this.filteredAndSortedOffers.length === 1 && this.currentPage > 1) {
          this.currentPage--;
        }

        this.loadOffers(); // Refresh the list
        this.closeDeleteConfirmation();
        this.loading = false;
      },
      error: (err) => {
        this.toast.show('Failed to delete offer. Please try again.', 'error');
        this.loading = false;
        this.closeDeleteConfirmation();
      },
    });
  }

  get filteredAndSortedOffers(): any[] {
    let filtered = this.offers;
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.title?.en?.toLowerCase().includes(term) ||
          o.title?.ar?.toLowerCase().includes(term)
      );
    }
    if (this.sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any = a[this.sortColumn];
        let bValue: any = b[this.sortColumn];
        if (this.sortColumn === 'title') {
          aValue = a.title?.en || '';
          bValue = b.title?.en || '';
        }
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }

  onSearch(term: string) {
    this.searchTerm = term;
    this.currentPage = 1;
    // No need to call loadOffers(), front-end filtering will handle it.
  }

  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    // No need to call loadOffers(), front-end sorting will handle it.
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadOffers();
  }

  onPerPageChange(newPerPage: number) {
    this.perPage = newPerPage;
    this.currentPage = 1;
    this.loadOffers();
  }

  get totalPages(): number {
    return this.meta?.last_page || 1;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
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
      if (file.size > 2 * 1024 * 1024) {
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
            this.editImagePreviewUrl = null; // Remove old preview if new image selected
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
    this.editImagePreviewUrl = null;
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
        this.imagePreviewUrl = null;
        this.loading = false;
        this.offerForm.enable();
        this.toggleCreateForm();
        this.loadOffers();
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

  submitEditOffer() {
    if (this.offerForm.invalid || this.editOfferId === null) {
      this.offerForm.markAllAsTouched();
      return;
    }

    const currentValue = this.offerForm.value;
    // A new image was selected if `currentValue.image` is a File object.
    const newImageSelected = !!currentValue.image;
    // Compare form values, ignoring the 'image' property which is handled separately.
    const initialValueForCompare = {
      ...this.initialEditFormValue,
      image: null,
    };
    const currentValueForCompare = { ...currentValue, image: null };

    if (
      !newImageSelected &&
      JSON.stringify(initialValueForCompare) ===
        JSON.stringify(currentValueForCompare)
    ) {
      this.toast.show('No changes detected.', 'info');
      this.closeEditForm();
      return;
    }

    this.loading = true;
    this.offerForm.disable();
    this.successMsg = '';
    this.errorMsg = '';
    const formData = new FormData();
    const value = this.offerForm.value;
    // Only append image if a new one is selected
    if (value.image) {
      formData.append('image', value.image);
    }
    formData.append('is_active', value.is_active ? '1' : '0');
    if (value.display_order !== null && value.display_order !== undefined)
      formData.append('display_order', value.display_order);
    if (value.start_date)
      formData.append('start_date', this.toBackendDate(value.start_date));
    if (value.end_date)
      formData.append('end_date', this.toBackendDate(value.end_date));
    if (value.button_link) formData.append('button_link', value.button_link);
    formData.append('is_limited_time', value.is_limited_time ? '1' : '0');
    // Translation fields as arrays/objects (use [en] and [ar] keys)
    formData.append('title[en]', value.title.en);
    formData.append('title[ar]', value.title.ar);
    formData.append('description[en]', value.description.en);
    formData.append('description[ar]', value.description.ar);
    formData.append('discount_text[en]', value.discount_text.en);
    formData.append('discount_text[ar]', value.discount_text.ar);
    formData.append('button_text[en]', value.button_text.en);
    formData.append('button_text[ar]', value.button_text.ar);
    const token = localStorage.getItem('token') || '';
    this.offersService
      .updateOffer(this.editOfferId, formData, token)
      .subscribe({
        next: (res) => {
          console.log(res);
          this.successMsg = 'Offer updated successfully!';
          this.toast.show(this.successMsg, 'success');
          this.offerForm.reset();
          this.imagePreviewUrl = null;
          this.editImagePreviewUrl = null;
          this.loading = false;
          this.offerForm.enable();
          this.closeEditForm();
          this.loadOffers();
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
