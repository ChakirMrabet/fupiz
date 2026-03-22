import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { NotificationService } from '../../services/notification.service';
import { NavbarComponent } from '../../components/ui/ui-navbar.component';

@Component({
  selector: 'app-admin-links',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, NavbarComponent],
  templateUrl: './admin-links.component.html',
  styleUrls: ['./admin-links.component.css'],
})
export class AdminLinksComponent implements OnInit {
  links: any[] = [];
  search = '';
  ownerType = 'ALL';
  isActive = 'ALL';
  plan = 'ALL';
  subscriptionStatus = 'ALL';
  page = 1;
  pageSize = 10;
  totalPages = 1;
  totalItems = 0;
  isLoading = false;
  deletingLinkId: number | null = null;

  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
    private readonly router: Router,
    public themeService: ThemeService,
  ) {}

  ngOnInit() {
    this.loadLinks();
  }

  loadLinks() {
    this.isLoading = true;
    this.adminService.getLinks({
      search: this.search.trim(),
      ownerType: this.ownerType,
      isActive: this.isActive,
      plan: this.plan,
      subscriptionStatus: this.subscriptionStatus,
      page: this.page,
      pageSize: this.pageSize,
    }).subscribe({
      next: (response) => {
        this.links = response.items;
        this.totalPages = response.totalPages;
        this.totalItems = response.totalItems;
        this.page = response.page;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.error('Unable to load admin links right now.', 'Admin');
      },
    });
  }

  applyFilters() {
    this.page = 1;
    this.loadLinks();
  }

  resetFilters() {
    this.search = '';
    this.ownerType = 'ALL';
    this.isActive = 'ALL';
    this.plan = 'ALL';
    this.subscriptionStatus = 'ALL';
    this.page = 1;
    this.pageSize = 10;
    this.loadLinks();
  }

  changePage(nextPage: number) {
    if (nextPage < 1 || nextPage > this.totalPages || nextPage === this.page) {
      return;
    }

    this.page = nextPage;
    this.loadLinks();
  }

  async deleteLink(link: any) {
    const confirmed = await this.notificationService.confirm(
      'Delete Link',
      `Delete ${link.shortCode}? This cannot be undone.`,
      'Delete',
      'Cancel',
    );

    if (!confirmed) {
      return;
    }

    this.deletingLinkId = link.id;
    this.adminService.deleteLink(link.id).subscribe({
      next: () => {
        if (this.links.length === 1 && this.page > 1) {
          this.page -= 1;
        }
        this.loadLinks();
        this.deletingLinkId = null;
        this.notificationService.success('Link deleted successfully.', 'Admin');
      },
      error: () => {
        this.deletingLinkId = null;
        this.notificationService.error('Failed to delete link.', 'Admin');
      },
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
