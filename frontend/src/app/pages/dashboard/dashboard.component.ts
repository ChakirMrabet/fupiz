import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { LinksService } from '../../services/links.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Router, RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { toDataURL } from 'qrcode';
import { BillingService } from '../../services/billing.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  profileForm: FormGroup;
  createLinkForm: FormGroup;
  webhookFormGroup: FormGroup;
  activeSection: 'links' | 'integrations' | 'profile' | 'billing' = 'links';
  links: any[] = [];
  linkSearch = '';
  currentPage = 1;
  readonly pageSize = 8;
  bulkLinkInput = '';
  isBulkCreating = false;
  bulkCreateSummary: null | { createdCount: number; failedCount: number; results: Array<{ index: number; success: boolean; error?: string }> } = null;
  webhooks: any[] = [];
  webhookForm = {
    url: '',
    events: ['link.created', 'link.updated', 'link.clicked'],
  };
  isSavingWebhook = false;
  newLink = {
    originalUrl: '',
    customCode: '',
    password: '',
    expiresAt: '',
    maxClicks: '',
    singleUse: false,
    landingTitle: '',
    landingDescription: '',
    landingButtonLabel: '',
  };
  isCreating = false;
  isCreateModalOpen = false;
  isBulkModalOpen = false;
  editingLink: any = null;
  editLinkForm = {
    originalUrl: '',
    shortCode: '',
    maxClicks: '',
    singleUse: false,
    landingTitle: '',
    landingDescription: '',
    landingButtonLabel: '',
  };
  isSavingLinkEdit = false;

  profile = { name: '', email: '', plan: 'FREE', role: 'USER' };
  passwordUpdate = { newPassword: '' };
  isUpdatingProfile = false;
  profileMessage = '';
  isBillingActionPending = false;


  constructor(
    private linksService: LinksService,
    private authService: AuthService,
    private billingService: BillingService,
    private notificationService: NotificationService,
    private router: Router,
    public themeService: ThemeService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      newPassword: ['', [Validators.minLength(6)]]
    });
    this.createLinkForm = this.fb.group({
      originalUrl: ['', [Validators.required, Validators.pattern('https?://.+')]],
      customCode: [''],
      password: [''],
      expiresAt: [''],
      maxClicks: ['', [Validators.min(1)]],
      singleUse: [false],
      landingTitle: [''],
      landingDescription: [''],
      landingButtonLabel: ['']
    });
    this.webhookFormGroup = this.fb.group({
      url: ['', [Validators.required, Validators.pattern('https?://.+')]],
      events: this.fb.array([
        'link.created',
        'link.updated',
        'link.clicked'
      ], Validators.required)
    });
  }

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadLinks();
    this.loadProfile();
  }

  setSection(section: 'links' | 'integrations' | 'profile' | 'billing') {
    this.activeSection = section;
  }

  loadProfile() {
    this.authService.getProfile().subscribe({
      next: (data) => {
        this.profile = {
          name: data.name || '',
          email: data.email,
          plan: data.plan || 'FREE',
          role: data.role || 'USER',
        };
        if (this.canUseWebhooks()) {
          this.loadWebhooks();
        } else {
          this.webhooks = [];
        }
      },
      error: () => {
        // If the backend rejects the token after the guard, immediately drop the
        // local session instead of leaving the protected screen half-rendered.
        this.authService.logout();
        this.router.navigate(['/login']);
      },
    });
  }

  onUpdateProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.isUpdatingProfile = true;
    this.profileMessage = '';
    const updatePayload: any = { name: this.profileForm.value.name };
    if (this.profileForm.value.newPassword?.trim()) {
      updatePayload.password = this.profileForm.value.newPassword;
    }
    this.authService.updateProfile(updatePayload).subscribe({
      next: (res) => {
        this.profileMessage = 'Profile updated successfully!';
        this.profileForm.patchValue({ newPassword: '' });
        this.isUpdatingProfile = false;
      },
      error: (err) => {
        console.error(err);
        this.profileMessage = 'Failed to update profile.';
        this.isUpdatingProfile = false;
      }
    });
  }

  startCheckout(plan: 'PRO' | 'BUSINESS') {
    this.isBillingActionPending = true;
    this.billingService.createCheckoutSession(plan).subscribe({
      next: ({ url }) => {
        window.location.href = url;
      },
      error: (err) => {
        console.error(err);
        this.isBillingActionPending = false;
        this.notificationService.error('Could not start checkout.', 'Billing Error');
      },
    });
  }

  openBillingPortal() {
    this.isBillingActionPending = true;
    this.billingService.createPortalSession().subscribe({
      next: ({ url }) => {
        window.location.href = url;
      },
      error: (err) => {
        console.error(err);
        this.isBillingActionPending = false;
        this.notificationService.error('Could not open the billing portal.', 'Billing Error');
      },
    });
  }

  canUseAdvancedLinkControls() {
    return this.profile.plan !== 'FREE';
  }

  canUseBulkCreation() {
    return this.profile.plan === 'BUSINESS';
  }

  canUseWebhooks() {
    return this.profile.plan === 'BUSINESS';
  }

  hasLandingPage(link: any) {
    return !!(link.landingTitle || link.landingDescription || link.landingButtonLabel);
  }

  get filteredLinks() {
    const query = this.linkSearch.trim().toLowerCase();
    if (!query) {
      return this.links;
    }

    return this.links.filter((link) =>
      [
        link.shortCode,
        link.originalUrl,
        link.landingTitle,
        link.landingDescription,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.filteredLinks.length / this.pageSize));
  }

  get paginatedLinks() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredLinks.slice(start, start + this.pageSize);
  }

  onSearchChange() {
    this.currentPage = 1;
  }

  goToPage(page: number) {
    this.currentPage = Math.min(Math.max(1, page), this.totalPages);
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

  loadLinks() {
    this.linksService.getAll().subscribe({
      next: (data) => {
        this.links = data;
        this.currentPage = Math.min(this.currentPage, this.totalPages);
      },
      error: (err) => console.error(err)
    });
  }

  loadWebhooks() {
    if (!this.canUseWebhooks()) return;

    this.linksService.getWebhooks().subscribe({
      next: (data) => {
        this.webhooks = data;
      },
      error: (err) => console.error(err)
    });
  }

  qrCodeUrl: string | null = null;
  qrCodeLink: any = null;

  async showQrCode(link: any) {
    try {
      const url = `http://localhost:3000/s/${link.shortCode}`;
      this.qrCodeUrl = await toDataURL(url, { width: 300, margin: 2 });
      this.qrCodeLink = link;
    } catch (err) {
      console.error('Failed to generate QR code', err);
    }
  }

  closeQrModal() {
    this.qrCodeUrl = null;
    this.qrCodeLink = null;
  }

  openCreateModal() {
    this.isCreateModalOpen = true;
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
    this.isCreating = false;
  }

  openBulkModal() {
    this.isBulkModalOpen = true;
  }

  closeBulkModal() {
    this.isBulkModalOpen = false;
    this.isBulkCreating = false;
  }

  onCreateLink() {
    if (this.createLinkForm.invalid) {
      this.createLinkForm.markAllAsTouched();
      return;
    }
    this.isCreating = true;
    const data = { ...this.createLinkForm.value };
    this.linksService.create(data).subscribe({
      next: () => {
        this.createLinkForm.reset();
        this.loadLinks();
        this.isCreating = false;
        this.closeCreateModal();
        this.notificationService.success('Link created successfully!');
      },
      error: (err) => {
        console.error(err);
        this.isCreating = false;
        const msg = err?.error?.message || 'Custom code might be taken or URL is invalid.';
        this.notificationService.error(msg, 'Link Creation Failed');
      }
    });
  }

  private parseBulkEntries() {
    return this.bulkLinkInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [originalUrl, customCode] = line.split(',').map((part) => part.trim());
        return {
          originalUrl,
          ...(customCode ? { customCode } : {}),
        };
      });
  }

  onBulkCreate() {
    if (!this.canUseBulkCreation()) {
      this.notificationService.error('Bulk creation is available on the Business plan.', 'Upgrade Required');
      return;
    }

    const entries = this.parseBulkEntries();
    if (entries.length === 0) {
      this.notificationService.error('Enter at least one URL to create links in bulk.', 'Bulk Creation Failed');
      return;
    }

    this.isBulkCreating = true;
    this.bulkCreateSummary = null;

    this.linksService.bulkCreate(entries).subscribe({
      next: (response) => {
        this.isBulkCreating = false;
        this.bulkCreateSummary = response;
        this.bulkLinkInput = '';
        this.loadLinks();
        this.closeBulkModal();
        this.notificationService.success(
          `${response.createdCount} links created${response.failedCount ? `, ${response.failedCount} failed` : ''}.`,
          'Bulk Creation Complete',
        );
      },
      error: (err) => {
        this.isBulkCreating = false;
        const msg = err?.error?.message || 'Bulk creation failed.';
        this.notificationService.error(msg, 'Bulk Creation Failed');
      }
    });
  }

  onCreateWebhook() {
    if (!this.canUseWebhooks()) {
      this.notificationService.error('Webhooks are available on the Business plan.', 'Upgrade Required');
      return;
    }

    this.isSavingWebhook = true;
    this.linksService.createWebhook(this.webhookForm).subscribe({
      next: () => {
        this.isSavingWebhook = false;
        this.webhookForm = {
          url: '',
          events: ['link.created', 'link.updated', 'link.clicked'],
        };
        this.loadWebhooks();
        this.notificationService.success('Webhook created successfully.');
      },
      error: (err) => {
        this.isSavingWebhook = false;
        const msg = err?.error?.message || 'Failed to create webhook.';
        this.notificationService.error(msg, 'Webhook Creation Failed');
      }
    });
  }

  toggleWebhookEvent(eventName: string, enabled: boolean) {
    const nextEvents = enabled
      ? [...this.webhookForm.events, eventName]
      : this.webhookForm.events.filter((event) => event !== eventName);

    this.webhookForm.events = Array.from(new Set(nextEvents));
  }

  toggleWebhook(webhook: any) {
    this.linksService.updateWebhook(webhook.id, { isActive: !webhook.isActive }).subscribe({
      next: () => this.loadWebhooks(),
      error: (err) => {
        const msg = err?.error?.message || 'Failed to update webhook.';
        this.notificationService.error(msg, 'Webhook Update Failed');
      }
    });
  }

  async deleteWebhook(id: number) {
    const confirmed = await this.notificationService.confirm(
      'Delete Webhook',
      'Are you sure you want to delete this webhook endpoint?',
      'Delete',
      'Cancel'
    );

    if (!confirmed) return;

    this.linksService.deleteWebhook(id).subscribe({
      next: () => {
        this.loadWebhooks();
        this.notificationService.success('Webhook deleted successfully.');
      },
      error: (err) => {
        const msg = err?.error?.message || 'Failed to delete webhook.';
        this.notificationService.error(msg, 'Webhook Delete Failed');
      }
    });
  }

  openEditModal(link: any) {
    this.editingLink = link;
    this.editLinkForm = {
      originalUrl: link.originalUrl,
      shortCode: link.shortCode,
      maxClicks: link.maxClicks?.toString() || '',
      singleUse: !!link.singleUse,
      landingTitle: link.landingTitle || '',
      landingDescription: link.landingDescription || '',
      landingButtonLabel: link.landingButtonLabel || '',
    };
  }

  closeEditModal() {
    this.editingLink = null;
    this.editLinkForm = {
      originalUrl: '',
      shortCode: '',
      maxClicks: '',
      singleUse: false,
      landingTitle: '',
      landingDescription: '',
      landingButtonLabel: '',
    };
    this.isSavingLinkEdit = false;
  }

  saveLinkEdits() {
    if (!this.editingLink) return;

    this.isSavingLinkEdit = true;
    const payload: any = {
      originalUrl: this.editLinkForm.originalUrl,
    };

    if (this.canUseAdvancedLinkControls()) {
      payload.shortCode = this.editLinkForm.shortCode;
      payload.maxClicks = this.editLinkForm.maxClicks;
      payload.singleUse = this.editLinkForm.singleUse;
      payload.landingTitle = this.editLinkForm.landingTitle;
      payload.landingDescription = this.editLinkForm.landingDescription;
      payload.landingButtonLabel = this.editLinkForm.landingButtonLabel;
    }

    this.linksService.update(this.editingLink.id, payload).subscribe({
      next: () => {
        this.isSavingLinkEdit = false;
        this.closeEditModal();
        this.loadLinks();
        this.notificationService.success('Link updated successfully.');
      },
      error: (err) => {
        console.error(err);
        this.isSavingLinkEdit = false;
        const msg = err?.error?.message || 'Failed to update link.';
        this.notificationService.error(msg, 'Link Update Failed');
      }
    });
  }

  copyLink(shortCode: string) {
    const url = `http://localhost:3000/s/${shortCode}`;
    navigator.clipboard.writeText(url).then(() => {
      this.notificationService.success('Link copied to clipboard!');
    });
  }

  toggleActive(link: any) {
    this.linksService.update(link.id, { isActive: !link.isActive }).subscribe({
      next: () => this.loadLinks()
    });
  }

  async deleteLink(id: number) {
    const confirmed = await this.notificationService.confirm(
      'Delete Link',
      'Are you sure you want to permanently delete this link? This action cannot be undone.',
      'Delete',
      'Cancel'
    );
    if (confirmed) {
      this.linksService.delete(id).subscribe({
        next: () => {
          this.loadLinks();
          this.notificationService.success('Link deleted successfully.');
        }
      });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
