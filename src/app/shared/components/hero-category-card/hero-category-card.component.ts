import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HeroCategoryConfig {
  id: string;
  name: string;
  tagline: string; // Frase corta llamativa
  description: string;
  benefits: string[]; // Array de 3 beneficios/características
  image: string;
  queryParams: Record<string, any>;
}

@Component({
  selector: 'app-hero-category-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero-category-card.component.html',
  styleUrls: ['./hero-category-card.component.css']
})
export class HeroCategoryCardComponent {
  category = input.required<HeroCategoryConfig>();
  categoryClick = output<HeroCategoryConfig>();

  onClick(): void {
    this.categoryClick.emit(this.category());
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onClick();
    }
  }
}

