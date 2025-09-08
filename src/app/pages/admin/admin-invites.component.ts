import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Firestore, addDoc, collection, getDocs } from '@angular/fire/firestore';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-admin-invites',
  standalone: true,
  imports: [FormsModule, NgFor],
  template: `
    <h2>Admin · Invites</h2>
    <div class="card">
      <div class="grid two">
        <input class="input" placeholder="Email to invite" [(ngModel)]="email" />
        <select class="input" [(ngModel)]="role">
          <option value="STAFF">STAFF</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>
      <button class="btn" (click)="invite()">Create Invite</button>
      <div style="margin-top:12px;">
        <b>Existing Invites</b>
        <ul>
          <li *ngFor="let i of invites">{{i.email}} → {{i.role}}</li>
        </ul>
      </div>
    </div>
  `
})
export class AdminInvitesComponent implements OnInit {
  private db = inject(Firestore);
  email=''; role='STAFF'; invites:any[] = [];
  async ngOnInit(){
    const snap = await getDocs(collection(this.db, 'invites'));
    this.invites = snap.docs.map(d => d.data() as any);
  }
  async invite(){
    await addDoc(collection(this.db, 'invites'), { email: this.email, role: this.role, createdAt: Date.now() });
    alert('Invite created');
    this.email=''; this.ngOnInit();
  }
}
 
