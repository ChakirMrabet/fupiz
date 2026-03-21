import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { LinksService } from '../../services/links.service';
import { SupportService } from '../../services/support.service';

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
  contactForm = {
    name: '',
    email: '',
    subject: '',
    message: '',
  };
  isSendingContact = false;
  contactSuccess = '';
  contactError = '';

  constructor(
    private linksService: LinksService,
    private supportService: SupportService,
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

  onContactSubmit() {
    const payload = {
      name: this.contactForm.name.trim(),
      email: this.contactForm.email.trim(),
      subject: this.contactForm.subject.trim(),
      message: this.contactForm.message.trim(),
    };

    if (!payload.name || !payload.email || !payload.subject || !payload.message || this.isSendingContact) {
      return;
    }

    this.isSendingContact = true;
    this.contactSuccess = '';
    this.contactError = '';

    this.supportService.submitPublicContact(payload).subscribe({
      next: () => {
        this.contactForm = {
          name: '',
          email: '',
          subject: '',
          message: '',
        };
        this.contactSuccess = 'Thanks. Your message has been sent.';
        this.isSendingContact = false;
      },
      error: (error) => {
        this.contactError = error?.error?.message || 'Unable to send your message right now.';
        this.isSendingContact = false;
      },
    });
  }
}
