import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, ToastNotification, ConfirmDialog } from '../../services/notification.service';
import { FeatureIconComponent } from '../ui/feature-icon.component';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, FeatureIconComponent],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit, OnDestroy {
  readonly icons = {
    success: '<path d="M20 6 9 17l-5-5"/>',
    error: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    warning: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
  };

  toasts: (ToastNotification & { removing?: boolean })[] = [];
  confirmDialog: ConfirmDialog | null = null;

  private toastSub!: Subscription;
  private confirmSub!: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.toastSub = this.notificationService.toast$.subscribe((toast) => {
      this.toasts.push(toast);
      setTimeout(() => this.dismissToast(toast.id), 4000);
    });

    this.confirmSub = this.notificationService.confirm$.subscribe((dialog) => {
      this.confirmDialog = dialog;
    });
  }

  ngOnDestroy() {
    this.toastSub?.unsubscribe();
    this.confirmSub?.unsubscribe();
  }

  dismissToast(id: number) {
    const toast = this.toasts.find(t => t.id === id);
    if (toast) {
      (toast as any).removing = true;
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
      }, 300);
    }
  }

  onConfirm() {
    this.confirmDialog?.resolve(true);
    this.confirmDialog = null;
  }

  onCancel() {
    this.confirmDialog?.resolve(false);
    this.confirmDialog = null;
  }
}
