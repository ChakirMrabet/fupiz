import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  analytics: any = null;
  loading = true;
  error: string | null = null;
  private apiUrl = 'http://localhost:3000/api/links';

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.fetchAnalytics(id);
      }
    });
  }

  fetchAnalytics(id: string) {
    this.loading = true;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.auth.token}`);
    this.http.get(`${this.apiUrl}/${id}/analytics`, { headers }).subscribe({
      next: (data) => {
        this.analytics = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load analytics data.';
        this.loading = false;
      }
    });
  }

  getMaxValue(arr: any[]) {
    return Math.max(...arr.map(x => x.count), 1);
  }

  getPercent(count: number, total: number) {
    return (count / total) * 100;
  }
}
