import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LinksService } from '../../services/links.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Router, RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { toDataURL } from 'qrcode';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  activeTab: 'links' | 'account' = 'links';
  links: any[] = [];
  newLink = { originalUrl: '', customCode: '', password: '', expiresAt: '', maxClicks: '', singleUse: false };
  isCreating = false;
  editingLink: any = null;
  editLinkForm = { originalUrl: '', shortCode: '', maxClicks: '', singleUse: false };
  isSavingLinkEdit = false;

  profile = { name: '', email: '', plan: 'FREE' };
  passwordUpdate = { newPassword: '' };
  isUpdatingProfile = false;
  profileMessage = '';

  constructor(
    private linksService: LinksService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    public themeService: ThemeService
  ) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadLinks();
    this.loadProfile();
  }

  setTab(tab: 'links' | 'account') {
    this.activeTab = tab;
  }

  loadProfile() {
    this.authService.getProfile().subscribe({
      next: (data) => {
        this.profile = { name: data.name || '', email: data.email, plan: data.plan || 'FREE' };
      },
      error: (err) => console.error(err)
    });
  }

  onUpdateProfile() {
    this.isUpdatingProfile = true;
    this.profileMessage = '';
    
    const updatePayload: any = { name: this.profile.name };
    if (this.passwordUpdate.newPassword.trim()) {
      updatePayload.password = this.passwordUpdate.newPassword;
    }

    this.authService.updateProfile(updatePayload).subscribe({
      next: (res) => {
        this.profileMessage = 'Profile updated successfully!';
        this.passwordUpdate.newPassword = ''; // clear password field
        this.isUpdatingProfile = false;
      },
      error: (err) => {
        console.error(err);
        this.profileMessage = 'Failed to update profile.';
        this.isUpdatingProfile = false;
      }
    });
  }

  isUpgradingPlan = false;
  
  upgradePlan(plan: 'PRO' | 'BUSINESS') {
    this.isUpgradingPlan = true;
    this.authService.updateProfile({ plan }).subscribe({
      next: () => {
        this.profile.plan = plan;
        this.isUpgradingPlan = false;
        const title = plan === 'BUSINESS' ? 'Business Upgrade Simulated' : 'Payment Simulated';
        this.notificationService.success(`You are now on the ${plan} plan.`, title);
      },
      error: (err) => {
        console.error(err);
        this.isUpgradingPlan = false;
      }
    });
  }

  canUseAdvancedLinkControls() {
    return this.profile.plan !== 'FREE';
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
      next: (data) => this.links = data,
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

  onCreateLink() {
    this.isCreating = true;
    const data: any = { originalUrl: this.newLink.originalUrl };
    if (this.newLink.customCode) data.customCode = this.newLink.customCode;
    if (this.newLink.password) data.password = this.newLink.password;
    if (this.newLink.expiresAt) data.expiresAt = this.newLink.expiresAt;
    if (this.newLink.maxClicks) data.maxClicks = this.newLink.maxClicks;
    if (this.newLink.singleUse) data.singleUse = true;

    this.linksService.create(data).subscribe({
      next: () => {
        this.newLink = { originalUrl: '', customCode: '', password: '', expiresAt: '', maxClicks: '', singleUse: false };
        this.loadLinks();
        this.isCreating = false;
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

  openEditModal(link: any) {
    this.editingLink = link;
    this.editLinkForm = {
      originalUrl: link.originalUrl,
      shortCode: link.shortCode,
      maxClicks: link.maxClicks?.toString() || '',
      singleUse: !!link.singleUse,
    };
  }

  closeEditModal() {
    this.editingLink = null;
    this.editLinkForm = { originalUrl: '', shortCode: '', maxClicks: '', singleUse: false };
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
