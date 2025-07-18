import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [NgIf],
  templateUrl: './access-denied.component.html',
  styleUrl: './access-denied.component.css',
})
export class AccessDeniedComponent {
  @Input() message: string = 'You do not have permission to view this content.';
  @Input() icon: string = '/icons/access.svg';
  @Input() title: string = 'Access Denied';
}
