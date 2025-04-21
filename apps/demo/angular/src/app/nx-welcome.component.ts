import { CommonModule, JsonPipe } from '@angular/common';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { EnvironmentService } from '@firemono/demo/angular/environment';
import { Firestore, collectionData, collection, DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from '@angular/fire/firestore';
import { User } from '@firemono/demo/data';

const converter: FirestoreDataConverter<User> = {
  toFirestore(user: User): DocumentData {
    return {
      ...user,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): User {
    const data = snapshot.data(options)!;
    return {
      id: snapshot.id,
      name: data['name'],
      lastUpdate: data['lastUpdate'],
    };
  }
};

@Component({
  selector: 'demo-nx-welcome',
  imports: [CommonModule],
  template: `
    <h1>Welcome to Firemono!</h1>
    <h2>Angular Demo</h2>
    @for(user of users$ | async; track user) {
      <div>
        <p>Id: {{ user.id }}</p>
        <h3>Name: {{ user.name }}</h3>
      </div>
    }
  `,
  styles: [],
  encapsulation: ViewEncapsulation.None,
})
export class NxWelcomeComponent {
  apiUrl = inject(EnvironmentService).apiUrl;

  firestore = inject(Firestore);
  users$ = collectionData<User>(collection(this.firestore, 'user').withConverter(converter));
}
