import { Component, inject } from "@angular/core";
import { NgIf } from "@angular/common";
import { ThemeService } from "../../services/theme.service";

@Component({
    selector: "app-ui-navbar",
    standalone: true,
    imports: [NgIf],
    templateUrl: 'ui-navbar.component.html',
    styleUrl: "ui-navbar.component.css"
})
export class NavbarComponent {
    themeService = inject(ThemeService);
}