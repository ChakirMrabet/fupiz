import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-admin-links',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-links.component.html',
  styleUrls: ['./admin-links.component.css'],
})
export class AdminLinksComponent implements OnInit {
  links: any[] = [];
  search = '';
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
    this.adminService.getLinks(this.search.trim()).subscribe({
      next: (links) => {
        this.links = links;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.error('Unable to load admin links right now.', 'Admin');
      },
    });
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
        this.links = this.links.filter((entry) => entry.id !== link.id);
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
