import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

const pad = (n:number) => String(n).padStart(2,'0');
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
const firstOfMonthISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-01`; };

@Component({
  selector: 'app-date-range',
  standalone: true,
  imports: [FormsModule],
  template: `
  <div style="display:flex; gap:8px; align-items:end;">
    <label>From <input type="date" class="input" [(ngModel)]="from" (change)="emit()" /></label>
    <label>To <input type="date" class="input" [(ngModel)]="to" (change)="emit()" /></label>
  </div>
  `
})
export class DateRangeComponent {
  from = firstOfMonthISO();
  to = todayISO();
  @Output() changed = new EventEmitter<{from:string,to:string}>();
  emit(){ this.changed.emit({ from: this.from, to: this.to }); }
}
 
