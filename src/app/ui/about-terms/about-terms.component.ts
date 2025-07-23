import { Component, OnInit, OnDestroy } from '@angular/core';
import { QuillModule } from 'ngx-quill';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { NgIf } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { PermissionsService } from '../../services/permissions-store.service';
import { Subscription } from 'rxjs';
import { AccessDeniedComponent } from '../../pages/access-denied/access-denied.component';

@Component({
  selector: 'app-about-terms',
  standalone: true,
  imports: [QuillModule, FormsModule, AccessDeniedComponent, NgIf],
  templateUrl: './about-terms.component.html',
  styleUrl: './about-terms.component.css',
})
export class AboutTermsComponent implements OnInit, OnDestroy {
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
  loadingContent = false;
  message = '';
  error = '';

  permissionsLoading = true;
  private permissionsSub: Subscription | undefined;

  constructor(
    private settingsService: SettingsService,
    private toast: ToastService,
    public permissionsStore: PermissionsService
  ) {}

  ngOnInit(): void {
    this.permissionsSub = this.permissionsStore.permissions$.subscribe(
      (permissions) => {
        if (permissions && permissions.length > 0) {
          this.permissionsLoading = false;
          this.loadExistingContent();
        }
      }
    );
  }

  ngOnDestroy(): void {
    if (this.permissionsSub) {
      this.permissionsSub.unsubscribe();
    }
  }

  loadExistingContent(): void {
    if (!this.permissionsStore.hasPermission('content.static.view.list')) {
      return;
    }

    this.loadingContent = true;

    // Clear existing content first
    this.aboutAr = '';
    this.aboutEn = '';
    this.termsAr = '';
    this.termsEn = '';

    let aboutLoaded = false;
    let termsLoaded = false;

    const checkLoadingComplete = () => {
      if (aboutLoaded && termsLoaded) {
        this.loadingContent = false;
      }
    };

    // Load About content
    this.settingsService.getContentByType('about', this.user_type).subscribe({
      next: (response) => {
        if (response?.success && response?.data?.content) {
          const content = response.data.content;
          this.is_active = content.is_active;

          try {
            const translations =
              typeof content.translations === 'string'
                ? JSON.parse(content.translations)
                : content.translations;

            if (translations?.en?.content) {
              this.aboutEn = translations.en.content;
            }
            if (translations?.ar?.content) {
              this.aboutAr = translations.ar.content;
            }
          } catch (e) {
            console.warn('Error parsing translations for about content:', e);
          }
        }
        aboutLoaded = true;
        checkLoadingComplete();
      },
      error: (err) => {
        aboutLoaded = true;
        checkLoadingComplete();
        if (err?.status !== 404) {
          console.warn('Error loading about content:', err);
        }
      },
    });

    // Load Terms content
    this.settingsService.getContentByType('terms', this.user_type).subscribe({
      next: (response) => {
        if (response?.success && response?.data?.content) {
          const content = response.data.content;

          try {
            const translations =
              typeof content.translations === 'string'
                ? JSON.parse(content.translations)
                : content.translations;

            if (translations?.en?.content) {
              this.termsEn = translations.en.content;
            }
            if (translations?.ar?.content) {
              this.termsAr = translations.ar.content;
            }
          } catch (e) {
            console.warn('Error parsing translations for terms content:', e);
          }
        }
        termsLoaded = true;
        checkLoadingComplete();
      },
      error: (err) => {
        termsLoaded = true;
        checkLoadingComplete();
        if (err?.status !== 404) {
          console.warn('Error loading terms content:', err);
        }
      },
    });
  }

  onUserTypeChange(): void {
    this.loadExistingContent();
  }

  submitStaticContent(type: string) {
    if (
      !(
        this.permissionsStore.hasPermission('content.static.update') ||
        this.permissionsStore.hasPermission('content.static.create')
      )
    ) {
      this.toast.show(
        'You do not have permission to update or create static content.',
        'error'
      );
      return;
    }
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
        // Don't clear fields after successful submit since we're editing existing content
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to update static content';
        this.toast.show(this.error, 'error');
      },
    });
  }
}
