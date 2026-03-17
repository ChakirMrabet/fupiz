import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, ToastNotification, ConfirmDialog } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit, OnDestroy {
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
