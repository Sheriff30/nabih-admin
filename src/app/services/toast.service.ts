import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  message: string;
  type: ToastType;
  visible: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastSubject = new BehaviorSubject<Toast | null>(null);
  toast$ = this.toastSubject.asObservable();
  private timeoutId: any;

  show(message: string, type: ToastType = 'info', duration: number = 3000) {
    this.toastSubject.next({ message, type, visible: true });
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.hide();
    }, duration);
  }

  hide() {
    this.toastSubject.next(null);
  }
}
