import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
  <div style="min-height:70vh; display:grid; place-items:center;">
    <div class="card" style="max-width:420px; width:100%;">
      <h2>Sign in</h2>
      <p class="muted">Only Google authentication is allowed.</p>
      <button class="btn" (click)="signIn()">Continue with Google</button>
    </div>
  </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  signIn() {
    this.auth.loginWithGoogle().subscribe({
      next: () => {
        console.log("login successful and navigating to dashboard"); 
        this.router.navigateByUrl('/dashboard')
      }
    });
  }
}

