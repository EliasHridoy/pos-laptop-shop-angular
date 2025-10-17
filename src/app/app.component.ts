import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe, NgIf],
  template: `
  <header>
    <div class="container" style="display:flex; align-items:center; gap:16px; height:56px;">
      <div class="logo">
        <svg viewBox="0 0 24 24" width="22" aria-hidden="true"><path fill="#fff" d="M3 4h18v2H3V4zm2 4h14v2H5V8zm-2 4h18v2H3v-2zm2 4h14v2H5v-2z"/></svg>
        <strong>Laptop POS</strong>
      </div>
      <nav class="nav">
        <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
        <a routerLink="/catalog/categories" routerLinkActive="active">Categories</a>
        <a routerLink="/catalog/products" routerLinkActive="active">Products</a>
        <!-- <a routerLink="/purchases" routerLinkActive="active">Purchases</a> -->
        <a routerLink="/sales/new" routerLinkActive="active">New Sale</a>
        <a routerLink="/sales" routerLinkActive="active">Sales</a>
        <a routerLink="/returns" routerLinkActive="active">Returns</a>
        <a routerLink="/services" routerLinkActive="active">Service</a>
        <a routerLink="/reports/sales" routerLinkActive="active">Reports</a>
        <a routerLink="/admin/invites" routerLinkActive="active">Admin</a>
      </nav>
      <div style="margin-left:auto"></div>
      <div *ngIf="(auth.user$ | async) as u" class="nav">
        <span>{{u.displayName || u.email}}</span>
        <button class="btn secondary" (click)="auth.logout()">Logout</button>
      </div>
    </div>
  </header>
  <main class="container" style="padding:16px 0;">
    <router-outlet></router-outlet>
  </main>
  <footer>© Laptop Shop POS</footer>
  `
})
export class AppComponent {
  auth = inject(AuthService);
  title = 'pos-laptop-shop-angular';

}
