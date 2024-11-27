import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TabMenuModule } from 'primeng/tabmenu';
import { RippleModule } from 'primeng/ripple';
import { MenuItem } from 'primeng/api';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    TabMenuModule,
    RippleModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  items: MenuItem[] | undefined;
  activeItem: MenuItem | undefined;

  constructor() {
    this.items = [
      { label: 'MODELS', icon: 'pi pi-th-large', routerLink: ['/models'] },
      { label: 'SUBMIT', icon: 'pi pi-cloud-upload', routerLink: ['/submit'] }
    ];
    this.activeItem = this.items[0];
  }

  onActiveItemChange(event: MenuItem) {
    this.activeItem = event;
  }
}
