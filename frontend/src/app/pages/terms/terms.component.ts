import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/ui/ui-navbar.component';
import { FeatureIconComponent } from '../../components/ui/feature-icon.component';

@Component({
  selector: 'app-terms',
  imports: [NavbarComponent, FeatureIconComponent],
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.css'
})
export class TermsComponent {

}
