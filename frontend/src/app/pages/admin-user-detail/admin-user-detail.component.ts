import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-admin-user-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-user-detail.component.html',
  styleUrls: ['./admin-user-detail.component.css'],
})
export class AdminUserDetailComponent implements OnInit {
  userId = 0;
  user: any = null;
  links: any[] = [];
  isLoading = false;
  isSavingUser = false;
  deletingLinkId: number | null = null;
  editingLinkId: number | null = null;
  linkForm: any = null;

  userForm = {
    name: '',
    role: 'USER',
    plan: 'FREE',
    isActive: true,
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly adminService: AdminService,
    private readonly notificationService: NotificationService,
    public themeService: ThemeService,
  ) {}

  ngOnInit() {
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load() {
    this.isLoading = true;
    this.adminService.getUser(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.userForm = {
          name: user.name || '',
          role: user.role,
          plan: user.plan,
          isActive: user.isActive,
        };
        this.loadLinks();
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  loadLinks() {
    this.adminService.getUserLinks(this.userId).subscribe({
      next: (links) => {
        this.links = links;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  saveUser() {
    this.isSavingUser = true;
    this.adminService.updateUser(this.userId, this.userForm).subscribe({
      next: (updatedUser) => {
        this.user = { ...this.user, ...updatedUser };
        this.isSavingUser = false;
        this.notificationService.success('User updated successfully.', 'Admin');
      },
      error: () => {
        this.isSavingUser = false;
      },
    });
  }

  editLink(link: any) {
    this.editingLinkId = link.id;
    this.linkForm = {
      originalUrl: link.originalUrl,
      shortCode: link.shortCode,
      isActive: link.isActive,
      expiresAt: link.expiresAt ? this.toDateTimeLocal(link.expiresAt) : '',
      maxClicks: link.maxClicks ?? '',
      singleUse: link.singleUse,
    };
  }

  saveLink(linkId: number) {
    this.adminService.updateLink(linkId, this.linkForm).subscribe({
      next: () => {
        this.editingLinkId = null;
        this.linkForm = null;
        this.loadLinks();
        this.notificationService.success('Link updated successfully.', 'Admin');
      },
      error: () => undefined,
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

  cancelLinkEdit() {
    this.editingLinkId = null;
    this.linkForm = null;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private toDateTimeLocal(value: string) {
    return new Date(value).toISOString().slice(0, 16);
  }
}
