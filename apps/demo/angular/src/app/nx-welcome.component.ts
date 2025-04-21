import { CommonModule } from '@angular/common';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { EnvironmentService } from '@firemono/demo-angular-environment';

@Component({
  selector: 'demo-nx-welcome',
  imports: [CommonModule],
  template: `
    <h1>Welcome to Firemono!</h1>
    <h2>Angular Demo</h2>
    <h3>API URL: {{ apiUrl }}</h3>
  `,
  styles: [],
  encapsulation: ViewEncapsulation.None,
})
export class NxWelcomeComponent {
  apiUrl = inject(EnvironmentService).apiUrl;
}
