import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { LinksService } from '../../services/links.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Router, RouterLink } from '@angular/router';
import { toDataURL } from 'qrcode';
import { BillingService } from '../../services/billing.service';
import { SupportService } from '../../services/support.service';
import { NavbarComponent } from '../../components/ui/ui-navbar.component';
import { FeatureIconComponent } from '../../components/ui/feature-icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, NavbarComponent, FeatureIconComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  readonly icons = {
    links: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    integrations: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    profile: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    billing: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/>',
    support: '<path d="M22 12a8 8 0 0 1-8 8H8l-4 4V12a8 8 0 1 1 18 0z"/><path d="M9.09 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    analytics: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    landing: '<path d="M19 10v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/><polyline points="14 3 21 3 21 10"/><line x1="10" y1="14" x2="21" y2="3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',
    qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3z"/><path d="M17 17h4v4h-4z"/><path d="M14 20h2"/><path d="M20 14v2"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    active: '<circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/>',
    inactive: '<circle cx="12" cy="12" r="9"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
    crown: '<path d="M3 18h18"/><path d="M5 18l1.5-9 5 4 5-8 1.5 8 3-4 1.5 9"/>'
  };

  profileForm: FormGroup;
  createLinkForm: FormGroup;
  webhookFormGroup: FormGroup;
  activeSection: 'links' | 'integrations' | 'profile' | 'billing' | 'support' = 'links';
  links: any[] = [];
  linkSearch = '';
  currentPage = 1;
  readonly pageSize = 8;
  bulkLinkInput = '';
  isBulkCreating = false;
  bulkCreateSummary: null | { createdCount: number; failedCount: number; results: Array<{ index: number; success: boolean; error?: string }> } = null;
  webhooks: any[] = [];
  // webhookForm removed, now using webhookFormGroup
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
  supportForm: FormGroup;
  isSendingSupport = false;
  supportMessage = '';


  constructor(
    private linksService: LinksService,
    private authService: AuthService,
    private billingService: BillingService,
    private supportService: SupportService,
    private notificationService: NotificationService,
    private router: Router,
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
    this.supportForm = this.fb.group({
      category: ['bug', [Validators.required]],
      subject: ['', [Validators.required, Validators.maxLength(120)]],
      message: ['', [Validators.required, Validators.minLength(10)]],
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

  setSection(section: 'links' | 'integrations' | 'profile' | 'billing' | 'support') {
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

  onSubmitSupport() {
    if (this.supportForm.invalid) {
      this.supportForm.markAllAsTouched();
      return;
    }

    this.isSendingSupport = true;
    this.supportMessage = '';

    this.supportService.submitDashboardSupport(this.supportForm.getRawValue()).subscribe({
      next: () => {
        this.supportForm.reset({
          category: 'bug',
          subject: '',
          message: '',
        });
        this.supportMessage = 'Your support request has been sent.';
        this.isSendingSupport = false;
      },
      error: (error) => {
        this.supportMessage = error?.error?.message || 'Unable to send your support request.';
        this.isSendingSupport = false;
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
    if (this.webhookFormGroup.invalid) {
      this.webhookFormGroup.markAllAsTouched();
      return;
    }
    this.isSavingWebhook = true;
    const { url, events } = this.webhookFormGroup.value;
    this.linksService.createWebhook({ url, events }).subscribe({
      next: () => {
        this.isSavingWebhook = false;
        this.webhookFormGroup.reset({ url: '', events: [] });
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
    const eventsArray = this.webhookFormGroup.get('events') as FormArray;
    const current = eventsArray.value as string[];
    if (enabled) {
      if (!current.includes(eventName)) {
        eventsArray.push(this.fb.control(eventName));
      }
    } else {
      const idx = current.indexOf(eventName);
      if (idx > -1) {
        eventsArray.removeAt(idx);
      }
    }
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
