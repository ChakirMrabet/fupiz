import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-admin-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-audit-logs.component.html',
  styleUrls: ['./admin-audit-logs.component.css'],
})
export class AdminAuditLogsComponent implements OnInit {
  logs: any[] = [];
  search = '';
  action = 'ALL';
  targetType = 'ALL';
  page = 1;
  pageSize = 20;
  totalPages = 1;
  totalItems = 0;
  isLoading = false;

  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
    private readonly router: Router,
    public themeService: ThemeService,
  ) {}

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.isLoading = true;
    this.adminService.getAuditLogs({
      search: this.search.trim(),
      action: this.action,
      targetType: this.targetType,
      page: this.page,
      pageSize: this.pageSize,
    }).subscribe({
      next: (response) => {
        this.logs = response.items;
        this.totalItems = response.totalItems;
        this.totalPages = response.totalPages;
        this.page = response.page;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.error('Unable to load audit logs right now.', 'Admin');
      },
    });
  }

  applyFilters() {
    this.page = 1;
    this.loadLogs();
  }

  resetFilters() {
    this.search = '';
    this.action = 'ALL';
    this.targetType = 'ALL';
    this.page = 1;
    this.pageSize = 20;
    this.loadLogs();
  }

  changePage(nextPage: number) {
    if (nextPage < 1 || nextPage > this.totalPages || nextPage === this.page) {
      return;
    }

    this.page = nextPage;
    this.loadLogs();
  }

  getChangeEntries(log: any) {
    if (!log.changes) {
      return [];
    }

    try {
      const parsedChanges = JSON.parse(log.changes);
      return Object.entries(parsedChanges);
    } catch {
      return [];
    }
  }

  formatAction(action: string) {
    return action.replace(/\./g, ' ');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
