import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  showSplash = true;
  splashAnimationComplete = false;
  
  constructor() {}
  
  ngOnInit() {
    // Show splash screen for 2.5 seconds
    setTimeout(() => {
      this.splashAnimationComplete = true;
      
      // Hide splash screen after fade out animation
      setTimeout(() => {
        this.showSplash = false;
      }, 500);
    }, 2500);
  }
}
