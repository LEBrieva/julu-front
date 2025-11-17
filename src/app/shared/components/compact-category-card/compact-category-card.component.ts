import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CompactCategoryConfig {
  id: string;
  name: string;
  image: string;
  queryParams: Record<string, any>;
}

@Component({
  selector: 'app-compact-category-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compact-category-card.component.html',
  styleUrls: ['./compact-category-card.component.css']
})
export class CompactCategoryCardComponent {
  category = input.required<CompactCategoryConfig>();
  categoryClick = output<CompactCategoryConfig>();

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

