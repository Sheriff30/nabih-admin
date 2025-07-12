import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ToastService, Toast } from '../../services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css'],
})
export class ToastComponent implements OnInit, OnDestroy {
  toast: Toast | null = null;
  private sub!: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.sub = this.toastService.toast$.subscribe((toast) => {
      this.toast = toast;
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  close() {
    this.toastService.hide();
  }
}
