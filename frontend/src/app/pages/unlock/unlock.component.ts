import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LinksService } from '../../services/links.service';

@Component({
  selector: 'app-unlock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './unlock.component.html',
  styleUrls: ['./unlock.component.css']
})
export class UnlockComponent implements OnInit {
  shortCode = '';
  password = '';
  isLoading = false;
  errorMsg = '';

  constructor(private route: ActivatedRoute, private linksService: LinksService) {}

  ngOnInit() {
    this.shortCode = this.route.snapshot.paramMap.get('shortCode') || '';
  }

  onSubmit() {
    if (!this.shortCode || !this.password) return;
    
    this.isLoading = true;
    this.errorMsg = '';
    
    this.linksService.verifyPassword(this.shortCode, this.password).subscribe({
      next: (res: any) => {
        window.location.href = res.url; 
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.error?.message || 'Incorrect password or link unavailable.';
      }
    });
  }
}
