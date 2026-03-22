import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/ui/ui-navbar.component';
import { FeatureIconComponent } from '../../components/ui/feature-icon.component';

@Component({
  selector: 'app-faq',
  imports: [NavbarComponent, FeatureIconComponent],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css'
})
export class FaqComponent {

}
