import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-feature-icon',
  standalone: true,
  template: `
    <div class="feature-icon-wrap">
      <svg xmlns="http://www.w3.org/2000/svg" [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
           [innerHTML]="safePaths">
      </svg>
    </div>`,
  styles: [`
    .feature-icon-wrap {
      color: var(--text-secondary);
      display: flex;
      align-items: center;
    }
  `]
})
export class FeatureIconComponent {
  safePaths: SafeHtml = '';
  @Input() size = 28;

  @Input() set paths(val: string) {
    this.safePaths = this.sanitizer.bypassSecurityTrustHtml(val);
  }

  constructor(private sanitizer: DomSanitizer) {}
}
