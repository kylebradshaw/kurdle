import LogRocket from 'logrocket';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  ngOnInit(): void {
    // only trigger for kurdle.fun and kurdle.netlify.app
    if (window.location.origin.includes(`kurdle`)) {
      LogRocket.init('l8o4ge/kurdle');
    }
  }
}
