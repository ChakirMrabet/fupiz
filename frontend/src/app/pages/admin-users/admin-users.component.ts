import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { NavbarComponent } from '../../components/ui/ui-navbar.component';
import { FeatureIconComponent } from '../../components/ui/feature-icon.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, NavbarComponent, FeatureIconComponent],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css'],
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  search = '';
  role = 'ALL';
  plan = 'ALL';
  isActive = 'ALL';
  subscriptionStatus = 'ALL';
  page = 1;
  pageSize = 10;
  totalPages = 1;
  totalItems = 0;
  isLoading = false;

  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
    private readonly router: Router,
    public themeService: ThemeService,
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.adminService.getUsers({
      search: this.search.trim(),
      role: this.role,
      plan: this.plan,
      isActive: this.isActive,
      subscriptionStatus: this.subscriptionStatus,
      page: this.page,
      pageSize: this.pageSize,
    }).subscribe({
      next: (response) => {
        this.users = response.items;
        this.totalPages = response.totalPages;
        this.totalItems = response.totalItems;
        this.page = response.page;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  applyFilters() {
    this.page = 1;
    this.loadUsers();
  }

  resetFilters() {
    this.search = '';
    this.role = 'ALL';
    this.plan = 'ALL';
    this.isActive = 'ALL';
    this.subscriptionStatus = 'ALL';
    this.page = 1;
    this.pageSize = 10;
    this.loadUsers();
  }

  changePage(nextPage: number) {
    if (nextPage < 1 || nextPage > this.totalPages || nextPage === this.page) {
      return;
    }

    this.page = nextPage;
    this.loadUsers();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
