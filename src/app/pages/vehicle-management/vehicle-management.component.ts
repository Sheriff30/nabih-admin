import { Component, OnInit } from '@angular/core';
import {
  VehicleManagementService,
  ListVehiclesResponse,
  VehicleResource,
  VehicleCollectionMeta,
} from '../../services/vehicles.service';
import { ToastService } from '../../services/toast.service';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { PermissionsService } from '../../services/permissions-store.service';
import { AccessDeniedComponent } from '../access-denied/access-denied.component';

@Component({
  selector: 'app-vehicle-management',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule, DatePipe, AccessDeniedComponent],
  templateUrl: './vehicle-management.component.html',
  styleUrl: './vehicle-management.component.css',
})
export class VehicleManagementComponent implements OnInit {
  allVehicles: VehicleResource[] = [];
  vehicles: VehicleResource[] = [];

  pagination = {
    current_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
    last_page: 1,
  };
  searchTerm: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  loading: boolean = false;

  showModal: boolean = false;
  selectedVehicle: VehicleResource | null = null;

  editModalOpen: boolean = false;
  editVehicle: VehicleResource | null = null;
  editVehicleForm: any = null;
  editLoading: boolean = false;
  editVehicleErrors: { [key: string]: string } = {};

  serviceHistoryModalOpen: boolean = false;
  serviceHistoryVehicle: VehicleResource | null = null;
  serviceHistoryOwner: any = null;
  serviceHistoryTab: 'last' | 'previous' = 'last';
  lastService: any = null;
  previousServices: any[] = [];
  expandedServiceIndex: number | null = null;

  deleteModalOpen: boolean = false;
  vehicleToDelete: VehicleResource | null = null;
  deleteLoading: number | null = null;

  // FOR PERMISSIONS
  permissionsLoading = true;
  private permissionsSub: Subscription | undefined;

  constructor(
    private vehicleService: VehicleManagementService,
    private toast: ToastService,
    public permissionsStore: PermissionsService
  ) {}

  ngOnInit(): void {
    this.permissionsSub = this.permissionsStore.permissions$.subscribe(
      (permissions) => {
        if (permissions && permissions.length > 0) {
          this.permissionsLoading = false;
        }
      }
    );
    this.loadVehicles();
  }

  ngOnDestroy(): void {
    if (this.permissionsSub) {
      this.permissionsSub.unsubscribe();
    }
  }

  loadVehicles() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.toast.show('You are not logged in. Please log in again.', 'error');
      this.loading = false;
      return;
    }
    this.loading = true;
    this.vehicleService
      .listVehicles(
        token,
        this.pagination.current_page,
        this.pagination.per_page
      )
      .subscribe({
        next: (res: ListVehiclesResponse) => {
          this.allVehicles = res.data.vehicles;
          // Update pagination meta from backend
          this.pagination = {
            current_page: Number(res.data.meta.current_page),
            per_page: Number(res.data.meta.per_page),
            total: Number(res.data.meta.total),
            from:
              res.data.vehicles.length > 0
                ? (Number(res.data.meta.current_page) - 1) *
                    Number(res.data.meta.per_page) +
                  1
                : 0,
            to:
              res.data.vehicles.length > 0
                ? (Number(res.data.meta.current_page) - 1) *
                    Number(res.data.meta.per_page) +
                  res.data.vehicles.length
                : 0,
            last_page: Number(res.data.meta.last_page),
          };
          this.applyFiltersAndPagination();
          this.loading = false;
        },
        error: (err: any) => {
          this.loading = false;
          this.allVehicles = [];
          this.vehicles = [];
          this.pagination = {
            current_page: 1,
            per_page: 10,
            total: 0,
            from: 0,
            to: 0,
            last_page: 1,
          };
          console.error('Vehicles API error:', err);
        },
      });
  }

  applyFiltersAndPagination() {
    let filtered = this.allVehicles;
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          (v.name && v.name.toLowerCase().includes(searchLower)) ||
          (v.owner?.name && v.owner.name.toLowerCase().includes(searchLower)) ||
          (v.plate_number &&
            v.plate_number.toLowerCase().includes(searchLower)) ||
          (v.make_brand && v.make_brand.toLowerCase().includes(searchLower))
      );
    }
    if (this.sortColumn) {
      filtered = this.applySorting(filtered);
    }
    this.vehicles = filtered;
  }

  onSearch(term: string) {
    this.searchTerm = term;
    this.applyFiltersAndPagination();
  }

  sortVehicles(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndPagination();
  }

  applySorting(vehicles: VehicleResource[]): VehicleResource[] {
    return [...vehicles].sort((a, b) => {
      let aValue = a[this.sortColumn as keyof VehicleResource];
      let bValue = b[this.sortColumn as keyof VehicleResource];
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  goToPage(page: number) {
    this.pagination.current_page = page;
    this.loadVehicles();
  }

  onPerPageChange() {
    this.pagination.current_page = 1;
    this.loadVehicles();
  }

  openModal(vehicle: VehicleResource) {
    this.selectedVehicle = vehicle;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedVehicle = null;
  }

  openEditModal(vehicle: VehicleResource) {
    this.editVehicle = vehicle;
    // Only include fields present in the view modal
    this.editVehicleForm = {
      user_id: vehicle.owner.id,
      name: vehicle.name,
      make_brand: vehicle.make_brand,
      model_year: vehicle.model_year,
      vin_number: vehicle.vin_number,
      mileage: vehicle.mileage,
    };
    this.editModalOpen = true;
  }

  closeEditModal() {
    this.editModalOpen = false;
    this.editVehicle = null;
    this.editVehicleForm = null;
    this.editLoading = false;
    this.editVehicleErrors = {}; // Clear validation errors
  }

  saveEditVehicle() {
    if (!this.editVehicle || !this.editVehicleForm) return;

    // Inline frontend-only validations
    this.editVehicleErrors = {};
    const currentYear = new Date().getFullYear();
    let hasError = false;

    // Vehicle Name: required, min 2 chars, max 50 chars
    if (
      !this.editVehicleForm.name ||
      this.editVehicleForm.name.trim().length < 2
    ) {
      this.editVehicleErrors['name'] =
        'Vehicle Name is required (min 2 characters).';
      hasError = true;
    } else if (this.editVehicleForm.name.length > 50) {
      this.editVehicleErrors['name'] =
        'Vehicle Name cannot exceed 50 characters.';
      hasError = true;
    }
    // Brand: required, min 2 chars, max 30 chars
    if (
      !this.editVehicleForm.make_brand ||
      this.editVehicleForm.make_brand.trim().length < 2
    ) {
      this.editVehicleErrors['make_brand'] =
        'Brand is required (min 2 characters).';
      hasError = true;
    } else if (this.editVehicleForm.make_brand.length > 30) {
      this.editVehicleErrors['make_brand'] =
        'Brand cannot exceed 30 characters.';
      hasError = true;
    }
    // Model Year: required, 4-digit, 1900-current year
    const modelYear = this.editVehicleForm.model_year;
    if (!modelYear || !/^[0-9]{4}$/.test(modelYear)) {
      this.editVehicleErrors['model_year'] =
        'Model Year must be a 4-digit number.';
      hasError = true;
    } else if (Number(modelYear) < 1900 || Number(modelYear) > currentYear) {
      this.editVehicleErrors[
        'model_year'
      ] = `Model Year must be between 1900 and ${currentYear}.`;
      hasError = true;
    }
    // VIN Number: required, max 17 chars, only A-Z and 0-9, no I, O, Q
    const vin = this.editVehicleForm.vin_number;
    if (!vin) {
      this.editVehicleErrors['vin_number'] = 'VIN Number is required.';
      hasError = true;
    } else if (vin.length > 17) {
      this.editVehicleErrors['vin_number'] =
        'VIN Number cannot exceed 17 characters.';
      hasError = true;
    } else if (!/^[A-HJ-NPR-Z0-9]*$/i.test(vin)) {
      this.editVehicleErrors['vin_number'] =
        'VIN Number must be alphanumeric (A-Z, 0-9), excluding I, O, and Q.';
      hasError = true;
    }
    // Mileage: required, positive number
    if (
      this.editVehicleForm.mileage === undefined ||
      this.editVehicleForm.mileage === null ||
      this.editVehicleForm.mileage === '' ||
      isNaN(Number(this.editVehicleForm.mileage)) ||
      Number(this.editVehicleForm.mileage) < 0
    ) {
      this.editVehicleErrors['mileage'] =
        'Mileage is required and must be a positive number.';
      hasError = true;
    }

    if (hasError) {
      return;
    }

    // Check if any changes were made
    const fieldsToCheck: (keyof typeof this.editVehicleForm)[] = [
      'name',
      'make_brand',
      'model_year',
      'vin_number',
      'mileage',
    ];
    let changed = false;
    for (const field of fieldsToCheck) {
      if (this.editVehicleForm[field] !== (this.editVehicle as any)[field]) {
        changed = true;
        break;
      }
    }
    if (!changed) {
      this.toast.show('No changes detected.', 'info');
      this.closeEditModal();
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      this.toast.show('You are not logged in. Please log in again.', 'error');
      this.editLoading = false;
      return;
    }
    this.editLoading = true;
    // Only send the allowed fields
    const updatePayload = {
      user_id: this.editVehicleForm.user_id,
      name: this.editVehicleForm.name,
      make_brand: this.editVehicleForm.make_brand,
      model_year: this.editVehicleForm.model_year,
      vin_number: this.editVehicleForm.vin_number,
      mileage: this.editVehicleForm.mileage,
    };
    this.vehicleService
      .updateVehicle(this.editVehicle.id, updatePayload, token)
      .subscribe({
        next: (res) => {
          // Update the vehicle in the list
          const idx = this.vehicles.findIndex(
            (v) => v.id === this.editVehicle!.id
          );
          if (idx !== -1) {
            this.vehicles[idx] = res.data;
          }
          this.editVehicleErrors = {}; // Clear errors on success
          this.toast.show('Vehicle details updated successfully!', 'success');
          this.closeEditModal();
        },
        error: (err) => {
          console.log(err);
          this.editLoading = false;
        },
      });
  }

  openServiceHistoryModal(vehicle: VehicleResource) {
    this.serviceHistoryVehicle = vehicle;
    this.serviceHistoryOwner = vehicle.owner;
    this.serviceHistoryModalOpen = true;
    this.serviceHistoryTab = 'last';
    if (vehicle.services && vehicle.services.length > 0) {
      this.lastService = vehicle.services[0];
      this.previousServices = vehicle.services.slice(1);
    } else {
      this.lastService = null;
      this.previousServices = [];
    }
  }

  closeServiceHistoryModal() {
    this.serviceHistoryModalOpen = false;
    this.serviceHistoryVehicle = null;
    this.serviceHistoryOwner = null;
    this.lastService = null;
    this.previousServices = [];
  }

  switchServiceTab(tab: 'last' | 'previous') {
    this.serviceHistoryTab = tab;
  }

  setServiceTabs() {
    if (
      this.serviceHistoryVehicle &&
      this.serviceHistoryVehicle.services &&
      this.serviceHistoryVehicle.services.length > 0
    ) {
      this.lastService = this.serviceHistoryVehicle.services[0];
      this.previousServices = this.serviceHistoryVehicle.services.slice(1);
    } else {
      this.lastService = null;
      this.previousServices = [];
    }
  }

  toggleAccordionService(index: number) {
    if (this.expandedServiceIndex === index) {
      this.expandedServiceIndex = null;
    } else {
      this.expandedServiceIndex = index;
    }
  }

  openDeleteModal(vehicle: VehicleResource) {
    this.vehicleToDelete = vehicle;
    this.deleteModalOpen = true;
  }

  closeDeleteModal() {
    this.vehicleToDelete = null;
    this.deleteModalOpen = false;
  }

  deleteVehicle() {
    if (!this.vehicleToDelete) return;
    const token = localStorage.getItem('token');
    if (!token) {
      this.toast.show('You are not logged in. Please log in again.', 'error');
      this.closeDeleteModal();
      return;
    }

    this.deleteLoading = this.vehicleToDelete.id;
    this.vehicleService
      .permanentlyDeleteVehicle(this.vehicleToDelete.id, token)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.toast.show('Vehicle deleted successfully.', 'success');
            // Remove from vehicles list
            this.vehicles = this.vehicles.filter(
              (v) => v.id !== this.vehicleToDelete!.id
            );
            this.allVehicles = this.allVehicles.filter(
              (v) => v.id !== this.vehicleToDelete!.id
            );
            // If current page is now empty and not the first page, go to previous page
            if (
              this.vehicles.length === 0 &&
              this.pagination.current_page > 1
            ) {
              this.pagination.current_page--;
            }
            this.loadVehicles();
          } else {
            this.toast.show(
              res.message || 'Failed to delete vehicle.',
              'error'
            );
          }
          this.deleteLoading = null;
          this.closeDeleteModal();
        },
        error: () => {
          this.toast.show(
            'Failed to delete vehicle. Please try again.',
            'error'
          );
          this.deleteLoading = null;
          this.closeDeleteModal();
        },
      });
  }

  // PERMISSIONS
  handleViewVehicle(vehicle: VehicleResource) {
    if (this.permissionsStore.hasPermission('vehicle.view.single')) {
      this.openModal(vehicle);
    } else {
      this.toast.show(
        'You do not have permission to view vehicle details.',
        'error'
      );
    }
  }

  handleEditVehicle(vehicle: VehicleResource) {
    if (this.permissionsStore.hasPermission('vehicle.update')) {
      this.openEditModal(vehicle);
    } else {
      this.toast.show('You do not have permission to edit vehicles.', 'error');
    }
  }

  handleDeleteVehicle(vehicle: VehicleResource) {
    if (this.permissionsStore.hasPermission('vehicle.delete')) {
      this.openDeleteModal(vehicle);
    } else {
      this.toast.show(
        'You do not have permission to delete vehicles.',
        'error'
      );
    }
  }

  handleViewHistory(vehicle: VehicleResource) {
    if (this.permissionsStore.hasPermission('vehicle.view.single')) {
      this.openServiceHistoryModal(vehicle);
    } else {
      this.toast.show(
        'You do not have permission to view vehicle history.',
        'error'
      );
    }
  }

  clearFieldError(field: string) {
    if (this.editVehicleErrors[field]) {
      delete this.editVehicleErrors[field];
    }
  }
}
