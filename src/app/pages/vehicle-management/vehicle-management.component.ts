import { Component, OnInit } from '@angular/core';
import { VehiclesService, Vehicle } from '../../services/vehicles.service';
import { NgFor, NgIf, NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';

interface VehicleOwnerSummary {
  owner_id: number;
  owner_name: string;
  owner_email: string | null;
  owner_phone: string | null;
  vehicle_count: number;
  vehicles: Vehicle[];
}

type SortField = 'number' | 'owner_name' | 'vehicle_count' | 'email' | 'phone';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-vehicle-management',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DatePipe, FormsModule],
  templateUrl: './vehicle-management.component.html',
  styleUrl: './vehicle-management.component.css',
})
export class VehicleManagementComponent implements OnInit {
  allVehicles: Vehicle[] = [];
  vehicleOwners: VehicleOwnerSummary[] = [];
  filteredVehicleOwners: VehicleOwnerSummary[] = [];
  loading = false;
  error: string | null = null;

  // Search and pagination
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50];

  // Sorting
  currentSortField: SortField = 'number';
  currentSortDirection: SortDirection = 'asc';

  // Modal state
  showModal = false;
  selectedOwner: VehicleOwnerSummary | null = null;
  selectedVehicleId: number | null = null;

  editModalOpen = false;
  editOwner: VehicleOwnerSummary | null = null;
  editVehicleId: number | null = null;
  editVehicleForm: any = {};
  originalEditVehicleForm: any = {};
  editLoading = false;

  serviceHistoryModalOpen = false;
  serviceHistoryOwner: VehicleOwnerSummary | null = null;
  serviceHistoryVehicle: Vehicle | null = null;
  serviceHistoryTab: 'last' | 'previous' = 'last';
  lastService: any = null;
  previousServices: any[] = [];
  expandedServiceIndex: number | null = null;

  deleteModalOpen = false;
  deleteOwner: VehicleOwnerSummary | null = null;
  deleteVehicleId: number | null = null;
  deleteLoading = false;

  constructor(
    private vehiclesService: VehiclesService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.loading = true;
    this.error = null;
    const token = localStorage.getItem('token');
    if (token) {
      this.vehiclesService.listVehicles(token).subscribe({
        next: (response) => {
          console.log('Vehicles loaded successfully:', response);
          this.allVehicles = response.data.vehicles;
          this.groupVehiclesByOwner();
          this.applySearch();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading vehicles:', error);
          this.error = 'Failed to load vehicles';
          this.loading = false;
          this.toast.show(
            'Failed to load vehicles. Please try again.',
            'error'
          );
        },
      });
    } else {
      console.error('No authentication token found');
      this.error = 'Authentication required';
      this.loading = false;
      this.toast.show('Authentication required. Please log in.', 'error');
    }
  }

  groupVehiclesByOwner(): void {
    const ownerMap = new Map<number, VehicleOwnerSummary>();

    this.allVehicles.forEach((vehicle) => {
      const ownerId = vehicle.owner.id;

      if (ownerMap.has(ownerId)) {
        // Owner already exists, increment vehicle count and add vehicle
        const existingOwner = ownerMap.get(ownerId)!;
        existingOwner.vehicle_count++;
        existingOwner.vehicles.push(vehicle);
      } else {
        // New owner, create entry
        ownerMap.set(ownerId, {
          owner_id: ownerId,
          owner_name: vehicle.owner.name,
          owner_email: vehicle.owner.email,
          owner_phone: vehicle.owner.phone,
          vehicle_count: 1,
          vehicles: [vehicle],
        });
      }
    });

    this.vehicleOwners = Array.from(ownerMap.values());
    console.log('Grouped vehicle owners:', this.vehicleOwners);
  }

  applySearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredVehicleOwners = [...this.vehicleOwners];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredVehicleOwners = this.vehicleOwners.filter((owner) => {
        // Search in owner details
        const ownerMatch =
          owner.owner_name.toLowerCase().includes(searchLower) ||
          (owner.owner_email &&
            owner.owner_email.toLowerCase().includes(searchLower)) ||
          (owner.owner_phone &&
            owner.owner_phone.toLowerCase().includes(searchLower)) ||
          owner.vehicle_count.toString().includes(searchLower);

        // Search in vehicle details
        const vehicleMatch = owner.vehicles.some(
          (vehicle) =>
            vehicle.name.toLowerCase().includes(searchLower) ||
            vehicle.plate_number.toLowerCase().includes(searchLower) ||
            vehicle.make_brand.toLowerCase().includes(searchLower) ||
            vehicle.model_year.toLowerCase().includes(searchLower)
        );

        return ownerMatch || vehicleMatch;
      });
    }
    this.currentPage = 1; // Reset to first page when searching
    this.applySorting();
  }

  applySorting(): void {
    this.filteredVehicleOwners.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.currentSortField) {
        case 'number':
          aValue = a.owner_id;
          bValue = b.owner_id;
          break;
        case 'owner_name':
          aValue = a.owner_name.toLowerCase();
          bValue = b.owner_name.toLowerCase();
          break;
        case 'vehicle_count':
          aValue = a.vehicle_count;
          bValue = b.vehicle_count;
          break;
        case 'email':
          aValue = (a.owner_email || '').toLowerCase();
          bValue = (b.owner_email || '').toLowerCase();
          break;
        case 'phone':
          aValue = (a.owner_phone || '').toLowerCase();
          bValue = (b.owner_phone || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return this.currentSortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.currentSortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  onSort(field: SortField): void {
    if (this.currentSortField === field) {
      // Toggle direction if same field
      this.currentSortDirection =
        this.currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New field, set to ascending
      this.currentSortField = field;
      this.currentSortDirection = 'asc';
    }
    this.applySorting();
  }

  getSortIcon(field: SortField): string {
    if (this.currentSortField !== field) {
      return '/icons/sort.svg';
    }
    return this.currentSortDirection === 'asc'
      ? '/icons/sort.svg'
      : '/icons/sort.svg';
  }

  openModal(owner: VehicleOwnerSummary): void {
    this.selectedOwner = owner;
    this.selectedVehicleId =
      owner.vehicles.length > 0 ? owner.vehicles[0].id : null;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedOwner = null;
    this.selectedVehicleId = null;
  }

  get selectedVehicle(): Vehicle | null {
    if (!this.selectedOwner || !this.selectedVehicleId) return null;
    const vehicle = this.selectedOwner.vehicles.find(
      (v) => v.id === Number(this.selectedVehicleId)
    );
    console.log('Selected vehicle:', vehicle);
    return vehicle || null;
  }

  onVehicleChange(): void {
    // Convert to number to ensure proper comparison
    this.selectedVehicleId = Number(this.selectedVehicleId);
    console.log('Vehicle changed to:', this.selectedVehicleId);
    console.log('Available vehicles:', this.selectedOwner?.vehicles);
    console.log('Selected vehicle details:', this.selectedVehicle);
  }

  openEditModal(owner: VehicleOwnerSummary): void {
    this.editOwner = owner;
    this.editVehicleId =
      owner.vehicles.length > 0 ? owner.vehicles[0].id : null;
    this.editModalOpen = true;
    this.setEditForm();
  }

  setEditForm(): void {
    const vehicle = this.editOwner?.vehicles.find(
      (v) => v.id === this.editVehicleId
    );
    if (vehicle) {
      this.editVehicleForm = { ...vehicle };
      this.originalEditVehicleForm = { ...vehicle };
    }
  }

  onEditVehicleChange(): void {
    this.editVehicleId = Number(this.editVehicleId);
    this.setEditForm();
  }

  saveEditVehicle(): void {
    if (!this.editOwner || !this.editVehicleId) return;
    // Compare form with original
    const isChanged = Object.keys(this.editVehicleForm).some(
      (key) => this.editVehicleForm[key] !== this.originalEditVehicleForm[key]
    );
    if (!isChanged) {
      this.toast.show('No changes detected.', 'info');
      this.editModalOpen = false;
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    this.editLoading = true;
    this.vehiclesService
      .updateVehicle(token, this.editVehicleId, {
        user_id: this.editOwner.owner_id,
        name: this.editVehicleForm.name,
        make_brand: this.editVehicleForm.make_brand,
        model_year: this.editVehicleForm.model_year,
        vin_number: this.editVehicleForm.vin_number,
        chassis_number: this.editVehicleForm.chassis_number,
        mileage: this.editVehicleForm.mileage,
        vehicle_type: this.editVehicleForm.vehicle_type,
        plate_number: this.editVehicleForm.plate_number,
      })
      .subscribe({
        next: (res) => {
          this.editLoading = false;
          this.editModalOpen = false;
          this.loadVehicles();
          this.toast.show('Vehicle updated successfully!', 'success');
        },
        error: (err) => {
          this.editLoading = false;
          this.toast.show(
            'Failed to update vehicle. Please try again.',
            'error'
          );
        },
      });
  }

  formatMileage(value: number | null): string {
    if (value === null || value === undefined) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  onMileageInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Remove all non-digit characters
    const raw = input.value.replace(/[^0-9]/g, '');
    this.editVehicleForm.mileage = raw ? parseInt(raw, 10) : null;
    // Set the formatted value back to the input
    input.value = this.formatMileage(this.editVehicleForm.mileage);
  }

  get paginatedVehicleOwners(): VehicleOwnerSummary[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredVehicleOwners.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredVehicleOwners.length / this.pageSize);
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    const end = this.currentPage * this.pageSize;
    return Math.min(end, this.filteredVehicleOwners.length);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(
        1,
        this.currentPage - Math.floor(maxVisiblePages / 2)
      );
      let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1; // Reset to first page when changing page size
  }

  viewOwnerVehicles(owner: VehicleOwnerSummary): void {
    console.log(`Vehicles for ${owner.owner_name}:`, owner.vehicles);
  }

  openServiceHistoryModal(owner: VehicleOwnerSummary, vehicleId: number): void {
    this.serviceHistoryOwner = owner;
    this.serviceHistoryVehicle =
      owner.vehicles.find((v) => v.id === vehicleId) || null;
    this.serviceHistoryModalOpen = true;
    this.serviceHistoryTab = 'last';
    this.setServiceTabs();
  }

  closeServiceHistoryModal(): void {
    this.serviceHistoryModalOpen = false;
    this.serviceHistoryOwner = null;
    this.serviceHistoryVehicle = null;
    this.lastService = null;
    this.previousServices = [];
  }

  setServiceTabs(): void {
    if (!this.serviceHistoryVehicle || !this.serviceHistoryVehicle.services) {
      this.lastService = null;
      this.previousServices = [];
      return;
    }
    const sorted = [...this.serviceHistoryVehicle.services].sort(
      (a, b) =>
        new Date(b.service_date).getTime() - new Date(a.service_date).getTime()
    );
    this.lastService = sorted[0] || null;
    this.previousServices = sorted.slice(1);
  }

  switchServiceTab(tab: 'last' | 'previous'): void {
    this.serviceHistoryTab = tab;
  }

  toggleAccordionService(idx: number): void {
    this.expandedServiceIndex = this.expandedServiceIndex === idx ? null : idx;
  }

  openDeleteModal(owner: VehicleOwnerSummary): void {
    this.deleteOwner = owner;
    this.deleteVehicleId =
      owner.vehicles.length > 0 ? owner.vehicles[0].id : null;
    this.deleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.deleteModalOpen = false;
    this.deleteOwner = null;
    this.deleteVehicleId = null;
  }

  deleteVehicleConfirmed(): void {
    if (!this.deleteOwner || !this.deleteVehicleId) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    this.deleteLoading = true;
    this.vehiclesService.deleteVehicle(token, this.deleteVehicleId).subscribe({
      next: () => {
        this.deleteLoading = false;
        this.deleteModalOpen = false;
        this.loadVehicles();
        // Recalculate pagination after deletion
        const total = this.filteredVehicleOwners.length;
        const lastPage = Math.max(1, Math.ceil(total / this.pageSize));
        if (this.currentPage > lastPage) {
          this.currentPage = lastPage;
        }
        this.applySearch();
        this.toast.show('Vehicle deleted successfully!', 'success');
      },
      error: () => {
        this.deleteLoading = false;
        this.toast.show('Failed to delete vehicle. Please try again.', 'error');
      },
    });
  }
}
