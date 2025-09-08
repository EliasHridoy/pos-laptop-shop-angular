import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuardService {
  private auth = inject(AuthService);
  private router = inject(Router);
  canActivate() {
    return this.auth.user$.pipe(
      map(u => !!u),
      tap(ok => { if (!ok) this.router.navigateByUrl('/login'); })
    );
  }
}
export const AuthGuard: CanActivateFn = () => inject(AuthGuardService).canActivate();
 
