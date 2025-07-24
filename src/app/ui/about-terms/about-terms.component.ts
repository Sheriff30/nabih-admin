import { Component, OnInit, OnDestroy } from '@angular/core';
import { QuillModule } from 'ngx-quill';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { NgIf, NgClass } from '@angular/common';
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
  // Character limits
  readonly CHARACTER_LIMIT = 1000;

  // Form state
  type: string = 'about';
  user_type: string = 'vendor';
  is_active: boolean = true;
  // Translations for Arabic and English for both About and Terms
  aboutAr: string = '';
  aboutEn: string = '';
  termsAr: string = '';
  termsEn: string = '';

  // Original content for change detection
  originalAboutAr: string = '';
  originalAboutEn: string = '';
  originalTermsAr: string = '';
  originalTermsEn: string = '';
  originalIsActive: boolean = true;

  // Validation errors
  aboutArError: string = '';
  aboutEnError: string = '';
  termsArError: string = '';
  termsEnError: string = '';

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

  // Character count helpers
  getPlainTextLength(htmlContent: string): number {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent?.length || 0;
  }

  getAboutArCharCount(): number {
    return this.getPlainTextLength(this.aboutAr);
  }

  getAboutEnCharCount(): number {
    return this.getPlainTextLength(this.aboutEn);
  }

  getTermsArCharCount(): number {
    return this.getPlainTextLength(this.termsAr);
  }

  getTermsEnCharCount(): number {
    return this.getPlainTextLength(this.termsEn);
  }

  isCharacterLimitExceeded(content: string): boolean {
    return this.getPlainTextLength(content) > this.CHARACTER_LIMIT;
  }

  // Content change handlers
  onAboutArChange(content: string): void {
    if (this.isCharacterLimitExceeded(content)) {
      this.aboutArError = `Content exceeds ${this.CHARACTER_LIMIT} character limit`;
    } else {
      this.aboutArError = '';
    }
  }

  onAboutEnChange(content: string): void {
    if (this.isCharacterLimitExceeded(content)) {
      this.aboutEnError = `Content exceeds ${this.CHARACTER_LIMIT} character limit`;
    } else {
      this.aboutEnError = '';
    }
  }

  onTermsArChange(content: string): void {
    if (this.isCharacterLimitExceeded(content)) {
      this.termsArError = `Content exceeds ${this.CHARACTER_LIMIT} character limit`;
    } else {
      this.termsArError = '';
    }
  }

  onTermsEnChange(content: string): void {
    if (this.isCharacterLimitExceeded(content)) {
      this.termsEnError = `Content exceeds ${this.CHARACTER_LIMIT} character limit`;
    } else {
      this.termsEnError = '';
    }
  }

  // Check if any validation errors exist
  hasValidationErrors(): boolean {
    return !!(
      this.aboutArError ||
      this.aboutEnError ||
      this.termsArError ||
      this.termsEnError
    );
  }

  // Check if content has changed from original
  hasAboutContentChanged(): boolean {
    return (
      this.aboutAr !== this.originalAboutAr ||
      this.aboutEn !== this.originalAboutEn ||
      this.is_active !== this.originalIsActive
    );
  }

  hasTermsContentChanged(): boolean {
    return (
      this.termsAr !== this.originalTermsAr ||
      this.termsEn !== this.originalTermsEn ||
      this.is_active !== this.originalIsActive
    );
  }

  // Store original content values
  storeOriginalContent(): void {
    this.originalAboutAr = this.aboutAr;
    this.originalAboutEn = this.aboutEn;
    this.originalTermsAr = this.termsAr;
    this.originalTermsEn = this.termsEn;
    this.originalIsActive = this.is_active;
  }

  loadExistingContent(): void {
    if (!this.permissionsStore.hasPermission('content.static.view.list')) {
      return;
    }

    this.loadingContent = true;

    // Clear existing content and errors first
    this.aboutAr = '';
    this.aboutEn = '';
    this.termsAr = '';
    this.termsEn = '';
    this.aboutArError = '';
    this.aboutEnError = '';
    this.termsArError = '';
    this.termsEnError = '';

    let aboutLoaded = false;
    let termsLoaded = false;

    const checkLoadingComplete = () => {
      if (aboutLoaded && termsLoaded) {
        this.loadingContent = false;
        // Store original content after loading is complete
        this.storeOriginalContent();
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

    // Check if content has changed
    if (type === 'about' && !this.hasAboutContentChanged()) {
      this.toast.show('No changes detected in About content', 'info');
      return;
    }

    if (type === 'terms' && !this.hasTermsContentChanged()) {
      this.toast.show('No changes detected in Terms content', 'info');
      return;
    }

    // Character limit validation
    if (type === 'about') {
      if (this.isCharacterLimitExceeded(this.aboutAr)) {
        this.aboutArError = `Content exceeds ${this.CHARACTER_LIMIT} character limit`;
        return;
      }
      if (this.isCharacterLimitExceeded(this.aboutEn)) {
        this.aboutEnError = `Content exceeds ${this.CHARACTER_LIMIT} character limit`;
        return;
      }
    } else if (type === 'terms') {
      if (this.isCharacterLimitExceeded(this.termsAr)) {
        this.termsArError = `Content exceeds ${this.CHARACTER_LIMIT} character limit`;
        return;
      }
      if (this.isCharacterLimitExceeded(this.termsEn)) {
        this.termsEnError = `Content exceeds ${this.CHARACTER_LIMIT} character limit`;
        return;
      }
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
        // Update original content after successful save
        this.storeOriginalContent();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to update static content';
        this.toast.show(this.error, 'error');
      },
    });
  }
}
