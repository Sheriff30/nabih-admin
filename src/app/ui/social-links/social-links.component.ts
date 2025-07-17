import { Component, OnInit } from '@angular/core';
import {
  SocialLinksService,
  SocialMediaLinkResource,
} from '../../services/sociallinks.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-social-links',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './social-links.component.html',
  styleUrl: './social-links.component.css',
})
export class SocialLinksComponent implements OnInit {
  socialLinks: SocialMediaLinkResource[] = [];
  editedLinks: SocialMediaLinkResource[] = [];
  loading = false;
  saving = false;
  error: string | null = null;

  constructor(
    private socialLinksService: SocialLinksService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.fetchSocialLinks();
  }

  fetchSocialLinks(): void {
    this.loading = true;
    this.error = null;
    const token = localStorage.getItem('token');
    if (!token) {
      this.error = 'No authentication token found.';
      this.loading = false;
      return;
    }
    this.socialLinksService.getSocialMediaLinks(token).subscribe({
      next: (res) => {
        this.socialLinks = res.data.social_media;
        // Make a deep copy for editing
        this.editedLinks = this.socialLinks.map((link) => ({ ...link }));
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load social links.';
        this.loading = false;
      },
    });
  }

  onInputChange(
    index: number,
    field: keyof SocialMediaLinkResource,
    value: any
  ) {
    (this.editedLinks[index] as any)[field] = value;
  }

  saveLinks() {
    this.saving = true;
    this.error = null;
    const token = localStorage.getItem('token');
    if (!token) {
      this.toast.show('No authentication token found.', 'error');
      this.saving = false;
      return;
    }
    // Check for changes
    const changedLinks = this.editedLinks.filter((edited, i) => {
      const original = this.socialLinks[i];
      return (
        edited.type !== original.type ||
        edited.title !== original.title ||
        edited.url !== original.url ||
        edited.username !== original.username ||
        edited.description !== original.description ||
        edited.is_active !== original.is_active
      );
    });
    if (changedLinks.length === 0) {
      this.toast.show('No changes to save.', 'info');
      this.saving = false;
      return;
    }
    // Enhanced Validation
    for (const link of changedLinks) {
      const original = this.socialLinks.find((l) => l.id === link.id);
      if (!link.title || !link.title.trim()) {
        this.toast.show('Title is required for all links.', 'warning');
        if (original) link.title = original.title;
        this.saving = false;
        return;
      }
      if (link.title.length > 255) {
        this.toast.show('Title must be 255 characters or less.', 'warning');
        if (original) link.title = original.title;
        this.saving = false;
        return;
      }
      if (link.type !== 'phone') {
        if (!link.url || !link.url.trim()) {
          this.toast.show(
            'URL is required for all links except phone.',
            'warning'
          );
          if (original) link.url = original.url;
          this.saving = false;
          return;
        }
        if (link.url.length > 255) {
          this.toast.show('URL must be 255 characters or less.', 'warning');
          if (original) link.url = original.url;
          this.saving = false;
          return;
        }
        // Simple URL validation
        try {
          new URL(link.url);
        } catch {
          this.toast.show(
            'Please enter a valid URL (e.g., https://example.com).',
            'warning'
          );
          if (original) link.url = original.url;
          this.saving = false;
          return;
        }
      }
      if (link.type === 'phone') {
        if (!link.username || !link.username.trim()) {
          this.toast.show(
            'Phone number is required for phone links.',
            'warning'
          );
          if (original) link.username = original.username;
          this.saving = false;
          return;
        }
        if (link.username.length > 255) {
          this.toast.show(
            'Phone number must be 255 characters or less.',
            'warning'
          );
          if (original) link.username = original.username;
          this.saving = false;
          return;
        }
        // Regex for international phone numbers: starts with +, digits, spaces, dashes allowed, 8-20 chars
        const phonePattern = /^\+?[0-9\s-]{8,20}$/;
        if (!phonePattern.test(link.username.trim())) {
          this.toast.show(
            'Please enter a valid phone number (e.g., +966 55 123 4567).',
            'warning'
          );
          if (original) link.username = original.username;
          this.saving = false;
          return;
        }
      }
      if (link.description && link.description.length > 1000) {
        this.toast.show(
          'Description must be 1000 characters or less.',
          'warning'
        );
        if (original) link.description = original.description;
        this.saving = false;
        return;
      }
    }
    // Save only changed links
    const updateObservables = changedLinks.map((link) =>
      this.socialLinksService.updateSocialMediaLink(token, link.id, {
        type: link.type,
        title: link.title,
        url: link.url,
        username: link.username,
        description: link.description,
        is_active: link.is_active,
      })
    );
    Promise.all(updateObservables.map((obs) => obs.toPromise()))
      .then(() => {
        this.toast.show('Social links updated successfully!', 'success');
        this.saving = false;
        this.fetchSocialLinks(); // Reload after save
      })
      .catch(() => {
        this.toast.show('Failed to save social links.', 'error');
        this.saving = false;
      });
  }
}
