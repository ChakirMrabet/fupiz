import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'fupiz-theme';
  theme = signal<'dark' | 'light'>('dark');

  constructor() {
    this.loadTheme();
  }

  toggleTheme() {
    const newTheme = this.theme() === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  private setTheme(newTheme: 'dark' | 'light') {
    this.theme.set(newTheme);
    localStorage.setItem(this.THEME_KEY, newTheme);
    this.applyTheme(newTheme);
  }

  private loadTheme() {
    const savedTheme = localStorage.getItem(this.THEME_KEY) as 'dark' | 'light' | null;
    if (savedTheme) {
      this.theme.set(savedTheme);
      this.applyTheme(savedTheme);
    } else {
      // Default to dark theme as per existing styles
      this.applyTheme('dark');
    }
  }

  private applyTheme(theme: 'dark' | 'light') {
    const body = document.body;
    if (theme === 'light') {
      body.classList.add('light-theme');
    } else {
      body.classList.remove('light-theme');
    }
  }
}
