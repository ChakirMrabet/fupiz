import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LinksService } from '../../services/links.service';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
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
  newLink = { originalUrl: '', customCode: '', password: '', expiresAt: '' };
  isCreating = false;

  profile = { name: '', email: '', plan: 'FREE' };
  passwordUpdate = { newPassword: '' };
  isUpdatingProfile = false;
  profileMessage = '';

  constructor(
    private linksService: LinksService,
    private authService: AuthService,
    private router: Router
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
  
  upgradeToPro() {
    this.isUpgradingPlan = true;
    this.authService.updateProfile({ plan: 'PRO' }).subscribe({
      next: (res) => {
        this.profile.plan = 'PRO';
        this.isUpgradingPlan = false;
        alert('Payment simulated! You are now a PRO user. Enjoy all the features.');
      },
      error: (err) => {
        console.error(err);
        this.isUpgradingPlan = false;
      }
    });
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

    this.linksService.create(data).subscribe({
      next: () => {
        this.newLink = { originalUrl: '', customCode: '', password: '', expiresAt: '' };
        this.loadLinks();
        this.isCreating = false;
      },
      error: (err) => {
        console.error(err);
        this.isCreating = false;
        alert('Failed to create link. Custom code might be taken or URL is invalid.');
      }
    });
  }

  toggleActive(link: any) {
    this.linksService.update(link.id, { isActive: !link.isActive }).subscribe({
      next: () => this.loadLinks()
    });
  }

  deleteLink(id: number) {
    if (confirm('Are you sure you want to delete this link?')) {
      this.linksService.delete(id).subscribe({
        next: () => this.loadLinks()
      });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
