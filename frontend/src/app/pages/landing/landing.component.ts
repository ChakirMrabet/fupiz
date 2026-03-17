import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  urlToShorten = '';

  constructor(
    private router: Router,
    public themeService: ThemeService
  ) {}

  onShorten() {
    if (this.urlToShorten) {
      this.router.navigate(['/register'], { queryParams: { url: this.urlToShorten } });
    }
  }
}
