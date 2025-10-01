import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container [ngSwitch]="name">
      <svg *ngSwitchCase="'save'" [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M5 13v6a1 1 0 001 1h12a1 1 0 001-1v-6" stroke="currentColor" [attr.stroke-width]="strokeWidth" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M20 8v-.5A2.5 2.5 0 0017.5 5H6.5A2.5 2.5 0 004 7.5V8" stroke="currentColor" [attr.stroke-width]="strokeWidth" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 3v9" stroke="currentColor" [attr.stroke-width]="strokeWidth" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>

      <svg *ngSwitchCase="'edit'" [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="currentColor" [attr.stroke-width]="strokeWidth" stroke-linejoin="round" stroke-linecap="round"/>
        <path d="M20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" stroke="currentColor" [attr.stroke-width]="strokeWidth" stroke-linejoin="round" stroke-linecap="round"/>
      </svg>

      <svg *ngSwitchCase="'delete'" [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M3 6h18" stroke="currentColor" [attr.stroke-width]="strokeWidth" stroke-linecap="round"/>
        <path d="M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6" stroke="currentColor" [attr.stroke-width]="strokeWidth" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 11v6M14 11v6" stroke="currentColor" [attr.stroke-width]="strokeWidth" stroke-linecap="round"/>
        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" [attr.stroke-width]="strokeWidth" stroke-linecap="round"/>
      </svg>

      <svg *ngSwitchCase="'view'" [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M2.5 12s3.5-7.5 9.5-7.5S21.5 12 21.5 12s-3.5 7.5-9.5 7.5S2.5 12 2.5 12z" stroke="currentColor" [attr.stroke-width]="strokeWidth" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="12" r="2.5" stroke="currentColor" [attr.stroke-width]="strokeWidth" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>

      <!-- fallback: simple square if unknown -->
      <svg *ngSwitchDefault [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect x="4" y="4" width="16" height="16" stroke="currentColor" [attr.stroke-width]="strokeWidth" rx="2"/>
      </svg>
    </ng-container>
  `,
  styles: [``]
})
export class IconComponent {
  @Input() name: 'save' | 'edit' | 'delete' | 'view' | string = 'view';
  @Input() size: number = 16;
  @Input() strokeWidth: number = 1.25;
}
