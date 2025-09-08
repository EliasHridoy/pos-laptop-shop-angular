import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminGuardService {
  private auth = inject(AuthService);
  private router = inject(Router);
  canActivate() {
    return this.auth.user$.pipe(
      switchMap(u => u ? this.auth.userDoc$(u.uid) : of(null)),
      map(doc => doc?.role === 'ADMIN'),
      tap(ok => { if (!ok) this.router.navigateByUrl('/dashboard'); })
    );
  }
}
export const AdminGuard: CanActivateFn = () => inject(AdminGuardService).canActivate();
 
