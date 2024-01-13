import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { Subscription, interval, tap } from 'rxjs';

@Component({
  selector: 'portfolio-v2-page-not-found',
  standalone: true,
  imports: [CommonModule, NgFor],
  templateUrl: './page_not_found.component.html',
  styleUrl: './page_not_found.component.css',
})
export class PageNotFoundComponent implements OnInit, OnDestroy {
    
  public isLeftGIFVisible: boolean = true;
  public isRightGIFVisible: boolean = true;
  public sub!: Subscription;

  private readonly quotesArray: string[] = [
    "99 bugs in my code, 99 bugs in my code... Take one down, fix em' around, 404 bugs in my code",
    "Error 404. Your Haiku could not be found",
    "Webpages? Where we're going, we don't need webpages",
    "The page you're looking for is on a coffee break. It needs its caffeine fix to get back online.",
    "How do we know we exist?"
  ];

  private readonly qIndex: number = Math.floor(Math.random() * this.quotesArray.length);
  public randomQuote: string[] = this.quotesArray[this.qIndex].split(' ');
  
  private readonly visibilityTimer: number = 4000;

  ngOnInit(): void {
    this.sub = interval(this.visibilityTimer)
    .pipe(
      tap(() => {
        this.isLeftGIFVisible = !this.isLeftGIFVisible;
        this.isRightGIFVisible = !this.isLeftGIFVisible;
        console.log(`left ${this.isLeftGIFVisible}: right ${this.isRightGIFVisible}`);
      })
    ).subscribe();
    console.log(this.randomQuote);
  }

  ngOnDestroy(): void {
    if(this.sub) {
      this.sub.unsubscribe();
    }
  }

}
