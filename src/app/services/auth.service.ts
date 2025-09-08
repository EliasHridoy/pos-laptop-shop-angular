import { Injectable, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, user, signOut } from '@angular/fire/auth';
import { Firestore, collection, doc, getDoc, setDoc, addDoc, query, getDocs, limit } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, from, of, switchMap, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private db = inject(Firestore);
    private router = inject(Router); 

  user$ = user(this.auth);

  loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap(async cred => {
        const u = cred.user;
        const usersCol = collection(this.db, 'users');
        const anyUserSnap = await getDocs(query(usersCol, limit(1)));
        const isFirst = anyUserSnap.empty;

        const userRef = doc(this.db, 'users', u.uid);
        const docSnap = await getDoc(userRef);

        if (isFirst && !docSnap.exists()) {
          await setDoc(userRef, { uid: u.uid, email: u.email, displayName: u.displayName, role: 'ADMIN', createdAt: Date.now() });
          return u;
        }

        const invitesCol = collection(this.db, 'invites');
        const invitesSnap = await getDocs(invitesCol);
        const invited = invitesSnap.docs.map(d => d.data() as any)
          .find(x => x.email?.toLowerCase() === u.email?.toLowerCase());

        if (invited && !docSnap.exists()) {
          await setDoc(userRef, { uid: u.uid, email: u.email, displayName: u.displayName, role: invited.role || 'STAFF', createdAt: Date.now() });
          return u;
        }

        if (!docSnap.exists()) {
          await setDoc(userRef, { uid: u.uid, email: u.email, displayName: u.displayName, role: 'STAFF', createdAt: Date.now() });
        }
        console.log("user doc exists, logging in", u);
        return u;
      })
    );
  }

  logout() {
    return from(signOut(this.auth)).subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: err => console.error(err)
    });
  }

  userDoc$(uid: string): Observable<any> {
    const ref = doc(this.db, 'users', uid);
    return from(getDoc(ref)).pipe(map(s => s.exists() ? s.data() : null));
  }
}
 
