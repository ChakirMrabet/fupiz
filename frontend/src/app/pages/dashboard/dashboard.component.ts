import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LinksService } from '../../services/links.service';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  links: any[] = [];
  newLink = { originalUrl: '', customCode: '', password: '', expiresAt: '' };
  isCreating = false;

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
  }

  loadLinks() {
    this.linksService.getAll().subscribe({
      next: (data) => this.links = data,
      error: (err) => console.error(err)
    });
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
