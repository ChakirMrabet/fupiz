import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/ui/ui-navbar.component';
import { FeatureIconComponent } from '../../components/ui/feature-icon.component';

@Component({
  selector: 'app-privacy',
  imports: [NavbarComponent, FeatureIconComponent],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.css'
})
export class PrivacyComponent {

}
