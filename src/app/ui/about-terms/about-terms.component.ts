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
  // Translations for Arabic and English for About, Terms, and Privacy
  aboutAr: string = '';
  aboutEn: string = '';
  termsAr: string = '';
  termsEn: string = '';
  privacyAr: string = '';
  privacyEn: string = '';

  // Original content for change detection
  originalAboutAr: string = '';
  originalAboutEn: string = '';
  originalTermsAr: string = '';
  originalTermsEn: string = '';
  originalPrivacyAr: string = '';
  originalPrivacyEn: string = '';
  originalIsActive: boolean = true;

  // Validation errors
  aboutArError: string = '';
  aboutEnError: string = '';
  termsArError: string = '';
  termsEnError: string = '';
  privacyArError: string = '';
  privacyEnError: string = '';

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

  // Custom keyboard handler to prevent typing beyond character limit
  onKeyDown(event: KeyboardEvent, currentContent: string): boolean {
    const currentLength = this.getPlainTextLength(currentContent);

    // Allow backspace, delete, arrow keys, etc.
    if (
      event.key === 'Backspace' ||
      event.key === 'Delete' ||
      event.key.startsWith('Arrow') ||
      event.key === 'Tab' ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return true;
    }

    // Check if adding this character would exceed the limit
    if (currentLength >= this.CHARACTER_LIMIT) {
      event.preventDefault();
      return false;
    }

    return true;
  }

  // Custom paste handler to prevent pasting content that exceeds character limit
  onPaste(event: ClipboardEvent, currentContent: string): boolean {
    const pastedText = event.clipboardData?.getData('text/plain') || '';
    const currentLength = this.getPlainTextLength(currentContent);
    const newLength = currentLength + pastedText.length;

    if (newLength > this.CHARACTER_LIMIT) {
      event.preventDefault();
      return false;
    }

    return true;
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

  getPrivacyArCharCount(): number {
    return this.getPlainTextLength(this.privacyAr);
  }

  getPrivacyEnCharCount(): number {
    return this.getPlainTextLength(this.privacyEn);
  }

  isCharacterLimitExceeded(content: string): boolean {
    return this.getPlainTextLength(content) > this.CHARACTER_LIMIT;
  }

  // Content change handlers with improved error handling
  onAboutArChange(content: string): void {
    this.clearError('aboutAr');
    if (!content || !content.trim()) {
      this.aboutArError = 'Arabic content is required';
    } else if (this.isCharacterLimitExceeded(content)) {
      this.aboutArError = `Content exceeds ${this.CHARACTER_LIMIT} character limit`;
    } else {
      this.aboutArError = '';
    }
  }

  onAboutEnChange(content: string): void {
    this.clearError('aboutEn');
    if (!content || !content.trim()) {
      this.aboutEnError = 'English content is required';
    } else if (this.isCharacterLimitExceeded(content)) {
      this.aboutEnError = `Content exceeds ${this.CHARACTER_LIMIT} character limit`;
    } else {
      this.aboutEnError = '';
    }
  }

  onTermsArChange(content: string): void {
    this.clearError('termsAr');
    if (!content || !content.trim()) {
      this.termsArError = 'Arabic content is required';
    } else if (this.isCharacterLimitExceeded(content)) {
      this.termsArError = `Content exceeds ${this.CHARACTER_LIMIT} character limit`;
    } else {
      this.termsArError = '';
    }
  }

  onTermsEnChange(content: string): void {
    this.clearError('termsEn');
    if (!content || !content.trim()) {
      this.termsEnError = 'English content is required';
    } else if (this.isCharacterLimitExceeded(content)) {
      this.termsEnError = `Content exceeds ${this.CHARACTER_LIMIT} character limit`;
    } else {
      this.termsEnError = '';
    }
  }

  onPrivacyArChange(content: string): void {
    this.clearError('privacyAr');
    if (!content || !content.trim()) {
      this.privacyArError = 'Arabic content is required';
    } else if (this.isCharacterLimitExceeded(content)) {
      this.privacyArError = `Content exceeds ${this.CHARACTER_LIMIT} character limit`;
    } else {
      this.privacyArError = '';
    }
  }

  onPrivacyEnChange(content: string): void {
    this.clearError('privacyEn');
    if (!content || !content.trim()) {
      this.privacyEnError = 'English content is required';
    } else if (this.isCharacterLimitExceeded(content)) {
      this.privacyEnError = `Content exceeds ${this.CHARACTER_LIMIT} character limit`;
    } else {
      this.privacyEnError = '';
    }
  }

  // Helper method to clear specific errors
  clearError(field: string): void {
    switch (field) {
      case 'aboutAr':
        this.aboutArError = '';
        break;
      case 'aboutEn':
        this.aboutEnError = '';
        break;
      case 'termsAr':
        this.termsArError = '';
        break;
      case 'termsEn':
        this.termsEnError = '';
        break;
      case 'privacyAr':
        this.privacyArError = '';
        break;
      case 'privacyEn':
        this.privacyEnError = '';
        break;
    }
  }

  // Check if any validation errors exist
  hasValidationErrors(): boolean {
    return !!(
      this.aboutArError ||
      this.aboutEnError ||
      this.termsArError ||
      this.termsEnError ||
      this.privacyArError ||
      this.privacyEnError
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

  hasPrivacyContentChanged(): boolean {
    return (
      this.privacyAr !== this.originalPrivacyAr ||
      this.privacyEn !== this.originalPrivacyEn ||
      this.is_active !== this.originalIsActive
    );
  }

  // Store original content values
  storeOriginalContent(): void {
    this.originalAboutAr = this.aboutAr;
    this.originalAboutEn = this.aboutEn;
    this.originalTermsAr = this.termsAr;
    this.originalTermsEn = this.termsEn;
    this.originalPrivacyAr = this.privacyAr;
    this.originalPrivacyEn = this.privacyEn;
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
    this.privacyAr = '';
    this.privacyEn = '';
    this.aboutArError = '';
    this.aboutEnError = '';
    this.termsArError = '';
    this.termsEnError = '';
    this.privacyArError = '';
    this.privacyEnError = '';

    let aboutLoaded = false;
    let termsLoaded = false;
    let privacyLoaded = false;

    const checkLoadingComplete = () => {
      if (aboutLoaded && termsLoaded && privacyLoaded) {
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

    // Load Privacy content
    this.settingsService.getContentByType('privacy', this.user_type).subscribe({
      next: (response) => {
        if (response?.success && response?.data?.content) {
          const content = response.data.content;

          try {
            const translations =
              typeof content.translations === 'string'
                ? JSON.parse(content.translations)
                : content.translations;

            if (translations?.en?.content) {
              this.privacyEn = translations.en.content;
            }
            if (translations?.ar?.content) {
              this.privacyAr = translations.ar.content;
            }
          } catch (e) {
            console.warn('Error parsing translations for privacy content:', e);
          }
        }
        privacyLoaded = true;
        checkLoadingComplete();
      },
      error: (err) => {
        privacyLoaded = true;
        checkLoadingComplete();
        if (err?.status !== 404) {
          console.warn('Error loading privacy content:', err);
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

    if (type === 'privacy' && !this.hasPrivacyContentChanged()) {
      this.toast.show('No changes detected in Privacy content', 'info');
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
    } else if (type === 'privacy') {
      if (this.isCharacterLimitExceeded(this.privacyAr)) {
        this.privacyArError = `Content exceeds ${this.CHARACTER_LIMIT} character limit`;
        return;
      }
      if (this.isCharacterLimitExceeded(this.privacyEn)) {
        this.privacyEnError = `Content exceeds ${this.CHARACTER_LIMIT} character limit`;
        return;
      }
    }

    this.loading = true;
    this.message = '';
    this.error = '';
    let translations: { [lang: string]: { title: string; content: string } } =
      {};
    // Validation with detailed error messages
    if (type === 'about') {
      const errors = [];
      if (!this.aboutEn.trim())
        errors.push('English About content is required');
      if (!this.aboutAr.trim()) errors.push('Arabic About content is required');

      if (errors.length > 0) {
        this.loading = false;
        this.toast.show(errors.join(', '), 'error');
        return;
      }

      translations = {
        en: { title: 'About', content: this.aboutEn },
        ar: { title: 'حول', content: this.aboutAr },
      };
    } else if (type === 'terms') {
      const errors = [];
      if (!this.termsEn.trim())
        errors.push('English Terms content is required');
      if (!this.termsAr.trim()) errors.push('Arabic Terms content is required');

      if (errors.length > 0) {
        this.loading = false;
        this.toast.show(errors.join(', '), 'error');
        return;
      }

      translations = {
        en: { title: 'Terms and Conditions', content: this.termsEn },
        ar: { title: 'الشروط والأحكام', content: this.termsAr },
      };
    } else if (type === 'privacy') {
      const errors = [];
      if (!this.privacyEn.trim())
        errors.push('English Privacy content is required');
      if (!this.privacyAr.trim())
        errors.push('Arabic Privacy content is required');

      if (errors.length > 0) {
        this.loading = false;
        this.toast.show(errors.join(', '), 'error');
        return;
      }

      translations = {
        en: { title: 'Privacy Policy', content: this.privacyEn },
        ar: { title: 'سياسة الخصوصية', content: this.privacyAr },
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
