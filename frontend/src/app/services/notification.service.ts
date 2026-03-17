import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastNotification {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface ConfirmDialog {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  resolve: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private toastSubject = new Subject<ToastNotification>();
  private confirmSubject = new Subject<ConfirmDialog | null>();
  private nextId = 0;

  toast$ = this.toastSubject.asObservable();
  confirm$ = this.confirmSubject.asObservable();

  showToast(title: string, message: string, type: ToastNotification['type'] = 'info') {
    this.toastSubject.next({ id: this.nextId++, title, message, type });
  }

  success(message: string, title: string = 'Success') {
    this.showToast(title, message, 'success');
  }

  error(message: string, title: string = 'Error') {
    this.showToast(title, message, 'error');
  }

  info(message: string, title: string = 'Info') {
    this.showToast(title, message, 'info');
  }

  warning(message: string, title: string = 'Warning') {
    this.showToast(title, message, 'warning');
  }

  confirm(title: string, message: string, confirmText = 'Confirm', cancelText = 'Cancel'): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmSubject.next({ title, message, confirmText, cancelText, resolve });
    });
  }

  dismissConfirm() {
    this.confirmSubject.next(null);
  }
}
