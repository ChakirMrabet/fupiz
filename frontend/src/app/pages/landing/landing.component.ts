import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { LinksService } from '../../services/links.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  urlToShorten = '';
  isCreating = false;
  createError = '';
  copied = false;
  createdLink: { shortCode: string; shortUrl: string; originalUrl: string } | null = null;

  constructor(
    private linksService: LinksService,
    public themeService: ThemeService
  ) {}

  onShorten() {
    const originalUrl = this.urlToShorten.trim();
    if (!originalUrl || this.isCreating) {
      return;
    }

    this.isCreating = true;
    this.createError = '';
    this.copied = false;

    this.linksService.createAnonymous({ originalUrl }).subscribe({
      next: (link) => {
        this.createdLink = link;
        this.isCreating = false;
      },
      error: (error) => {
        this.createError = error?.error?.message || 'Unable to create a short link right now';
        this.isCreating = false;
      },
    });
  }

  async copyShortUrl() {
    if (!this.createdLink?.shortUrl || !navigator?.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(this.createdLink.shortUrl);
    this.copied = true;
  }
}
