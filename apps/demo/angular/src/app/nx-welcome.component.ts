import { CommonModule, JsonPipe } from '@angular/common';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { EnvironmentService } from '@firemono/demo-angular-environment';
import { Firestore, collectionData, collection } from '@angular/fire/firestore';

@Component({
  selector: 'demo-nx-welcome',
  imports: [CommonModule, JsonPipe],
  template: `
    <h1>Welcome to Firemono!</h1>
    <h2>Angular Demo</h2>
  `,
  styles: [],
  encapsulation: ViewEncapsulation.None,
})
export class NxWelcomeComponent {
  apiUrl = inject(EnvironmentService).apiUrl;

  firestore = inject(Firestore);
  itemCollection = collection(this.firestore, 'items');
  item$ = collectionData(this.itemCollection);
}
