import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {
  WorkshopService,
  WorkshopServiceResource,
} from '../../services/workshop.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-workshop',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './workshop.component.html',
  styleUrl: './workshop.component.css',
})
export class WorkshopComponent implements OnInit, AfterViewChecked {
  public workshops: WorkshopServiceResource[] = [];

  // Search, sort, and pagination state
  public searchTerm: string = '';
  public sortColumn: string = '';
  public sortDirection: 'asc' | 'desc' = 'asc';
  public currentPage: number = 1;
  public perPage: number = 10;
  public Math = Math;
  public loading: boolean = false;
  public selectedWorkshop: WorkshopServiceResource | null = null;
  public showWorkshopModal: boolean = false;

  private map: L.Map | null = null;
  private mapInitializedForId: number | null = null;

  constructor(private workshopService: WorkshopService) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found in localStorage.');
      return;
    }
    this.loading = true;
    this.workshopService.getWorkshops(token).subscribe({
      next: (res) => {
        this.workshops = res.data.workshops;
        this.loading = false;
        console.log(this.workshops);
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to fetch workshops:', err);
      },
    });
  }

  ngAfterViewChecked(): void {
    if (
      this.showWorkshopModal &&
      this.selectedWorkshop &&
      this.selectedWorkshop.id !== this.mapInitializedForId
    ) {
      setTimeout(() => this.initMap(), 0);
    }
  }

  private initMap() {
    if (!this.selectedWorkshop) return;
    const lat = parseFloat(this.selectedWorkshop.latitude);
    const lng = parseFloat(this.selectedWorkshop.longitude);
    if (isNaN(lat) || isNaN(lng)) return;
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    const mapContainer = document.getElementById('workshop-map');
    if (!mapContainer) return;
    // Set custom marker icons
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
    this.map = L.map(mapContainer).setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);
    // Add draggable marker
    const marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
    marker.bindPopup(this.selectedWorkshop.name).openPopup();
    marker.on('dragend', (event: any) => {
      if (event.originalEvent) event.originalEvent.preventDefault();
      const position = event.target.getLatLng();
      // Optionally update the selectedWorkshop's lat/lng in the modal (not persisted)
      if (this.selectedWorkshop) {
        this.selectedWorkshop.latitude = position.lat.toString();
        this.selectedWorkshop.longitude = position.lng.toString();
      }
    });
    this.map.on('click', (event: any) => {
      if (event.originalEvent) event.originalEvent.preventDefault();
      const position = event.latlng;
      marker.setLatLng([position.lat, position.lng]);
      if (this.selectedWorkshop) {
        this.selectedWorkshop.latitude = position.lat.toString();
        this.selectedWorkshop.longitude = position.lng.toString();
      }
    });
    this.mapInitializedForId = this.selectedWorkshop.id;
  }

  descriptionIsObject(desc: any): desc is { en?: string } {
    return desc && typeof desc === 'object' && 'en' in desc;
  }

  get filteredAndSortedWorkshops(): WorkshopServiceResource[] {
    let filtered = this.workshops;
    // Search
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.name.toLowerCase().includes(term) ||
          w.city?.toLowerCase().includes(term) ||
          w.address?.toLowerCase().includes(term) ||
          w.services.some((s) => s.name.toLowerCase().includes(term))
      );
    }
    // Sort
    if (this.sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any = a[this.sortColumn as keyof WorkshopServiceResource];
        let bValue: any = b[this.sortColumn as keyof WorkshopServiceResource];
        // Special case for services (sort by first service name)
        if (this.sortColumn === 'services') {
          aValue = a.services[0]?.name || '';
          bValue = b.services[0]?.name || '';
        }
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    // Pagination
    const start = (this.currentPage - 1) * this.perPage;
    const end = start + this.perPage;
    return filtered.slice(start, end);
  }

  get totalFiltered(): number {
    let filtered = this.workshops;
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.name.toLowerCase().includes(term) ||
          w.city?.toLowerCase().includes(term) ||
          w.address?.toLowerCase().includes(term) ||
          w.services.some((s) => s.name.toLowerCase().includes(term))
      );
    }
    return filtered.length;
  }

  onSearch(term: string) {
    this.searchTerm = typeof term === 'string' ? term : '';
    this.currentPage = 1;
  }

  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onPerPageChange(newPerPage: number) {
    const value =
      typeof newPerPage === 'string' ? parseInt(newPerPage, 10) : newPerPage;
    this.perPage = value;
    this.currentPage = 1;
  }

  get totalPages(): number {
    return Math.ceil(this.totalFiltered / this.perPage) || 1;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  openWorkshopModal(workshop: WorkshopServiceResource) {
    this.selectedWorkshop = workshop;
    this.showWorkshopModal = true;
  }

  closeWorkshopModal() {
    this.selectedWorkshop = null;
    this.showWorkshopModal = false;
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.mapInitializedForId = null;
    }
  }
}
