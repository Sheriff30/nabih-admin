import { Component } from '@angular/core';
import { QuillModule } from 'ngx-quill';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { NgIf } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-about-terms',
  standalone: true,
  imports: [QuillModule, FormsModule],
  templateUrl: './about-terms.component.html',
  styleUrl: './about-terms.component.css',
})
export class AboutTermsComponent {
  // Form state
  type: string = 'about';
  user_type: string = 'both';
  is_active: boolean = true;
  // Translations for Arabic and English for both About and Terms
  aboutAr: string = '';
  aboutEn: string = '';
  termsAr: string = '';
  termsEn: string = '';
  // UI state
  loading = false;
  message = '';
  error = '';

  constructor(
    private settingsService: SettingsService,
    private toast: ToastService
  ) {}

  submitStaticContent(type: string) {
    this.loading = true;
    this.message = '';
    this.error = '';
    let translations: { [lang: string]: { title: string; content: string } } =
      {};
    // Validation
    if (type === 'about') {
      if (!this.aboutEn.trim() || !this.aboutAr.trim()) {
        this.loading = false;
        this.toast.show('Both About fields are required', 'error');
        return;
      }
      translations = {
        en: { title: 'About', content: this.aboutEn },
        ar: { title: 'حول', content: this.aboutAr },
      };
    } else if (type === 'terms') {
      if (!this.termsEn.trim() || !this.termsAr.trim()) {
        this.loading = false;
        this.toast.show('Both Terms fields are required', 'error');
        return;
      }
      translations = {
        en: { title: 'Terms and Conditions', content: this.termsEn },
        ar: { title: 'الشروط والأحكام', content: this.termsAr },
      };
    }
    if (!this.user_type) {
      this.loading = false;
      this.toast.show('User type is required', 'error');
      return;
    }
    const payload = {
      type,
      user_type: this.user_type,
      is_active: this.is_active,
      translations,
    };
    this.settingsService.postStaticContent(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.message =
          res?.message || 'Static content created/updated successfully';
        this.toast.show(this.message, 'success');
        // Clear fields after successful submit
        if (type === 'about') {
          this.aboutAr = '';
          this.aboutEn = '';
        } else if (type === 'terms') {
          this.termsAr = '';
          this.termsEn = '';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to update static content';
        this.toast.show(this.error, 'error');
      },
    });
  }
}
