import { Component } from '@angular/core';
import { AboutTermsComponent } from '../../ui/about-terms/about-terms.component';
import { SocialLinksComponent } from '../../ui/social-links/social-links.component';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [AboutTermsComponent, SocialLinksComponent, NgClass, NgIf],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  selectedTab: 'about-terms' | 'social-links' = 'about-terms';
}
