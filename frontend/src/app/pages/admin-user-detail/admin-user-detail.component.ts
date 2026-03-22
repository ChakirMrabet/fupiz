import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { NotificationService } from '../../services/notification.service';
import { NavbarComponent } from '../../components/ui/ui-navbar.component';
import { FeatureIconComponent } from '../../components/ui/feature-icon.component';

@Component({
  selector: 'app-admin-user-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, NavbarComponent, FeatureIconComponent],
  templateUrl: './admin-user-detail.component.html',
  styleUrls: ['./admin-user-detail.component.css'],
})
export class AdminUserDetailComponent implements OnInit {
  readonly icons = {
    lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    landing: '<path d="M19 10v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/><polyline points="14 3 21 3 21 10"/><line x1="10" y1="14" x2="21" y2="3"/>'
  };

  userId = 0;
  user: any = null;
  links: any[] = [];
  isLoading = false;
  isSavingUser = false;
  deletingLinkId: number | null = null;
  editingLinkId: number | null = null;
  linkForm: any = null;

  userFormGroup: FormGroup;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly adminService: AdminService,
    private readonly notificationService: NotificationService,
    public themeService: ThemeService,
    private fb: FormBuilder
  ) {
    this.userFormGroup = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      role: ['USER', Validators.required],
      plan: ['FREE', Validators.required],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load() {
    this.isLoading = true;
    this.adminService.getUser(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.userFormGroup.patchValue({
          name: user.name || '',
          role: user.role,
          plan: user.plan,
          isActive: user.isActive,
        });
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
    if (this.userFormGroup.invalid) {
      this.userFormGroup.markAllAsTouched();
      return;
    }
    this.isSavingUser = true;
    this.adminService.updateUser(this.userId, this.userFormGroup.value).subscribe({
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
      password: '',
      clearPassword: false,
      isActive: link.isActive,
      expiresAt: link.expiresAt ? this.toDateTimeLocal(link.expiresAt) : '',
      maxClicks: link.maxClicks ?? '',
      singleUse: link.singleUse,
      landingTitle: link.landingTitle || '',
      landingDescription: link.landingDescription || '',
      landingButtonLabel: link.landingButtonLabel || '',
    };
  }

  saveLink(linkId: number) {
    const payload: any = {
      originalUrl: this.linkForm.originalUrl,
      shortCode: this.linkForm.shortCode,
      isActive: this.linkForm.isActive,
      expiresAt: this.linkForm.expiresAt,
      maxClicks: this.linkForm.maxClicks,
      singleUse: this.linkForm.singleUse,
      landingTitle: this.linkForm.landingTitle,
      landingDescription: this.linkForm.landingDescription,
      landingButtonLabel: this.linkForm.landingButtonLabel,
    };

    // Leaving the password field blank should preserve the existing password.
    // Password updates and removals must be explicit so admins do not clear a
    // protected link by opening and saving the form.
    if (this.linkForm.password) {
      payload.password = this.linkForm.password;
    } else if (this.linkForm.clearPassword) {
      payload.password = '';
    }

    this.adminService.updateLink(linkId, payload).subscribe({
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

  hasLandingPage(link: any) {
    return !!(link.landingTitle || link.landingDescription || link.landingButtonLabel);
  }

  formatClickLimit(link: any) {
    if (link.singleUse) {
      return `${link.clicks} / 1 clicks`;
    }

    if (link.maxClicks === null || link.maxClicks === undefined) {
      return '';
    }

    return `${link.clicks} / ${link.maxClicks} clicks`;
  }

  private toDateTimeLocal(value: string) {
    return new Date(value).toISOString().slice(0, 16);
  }
}
