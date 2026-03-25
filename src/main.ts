import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { AppComponent } from './app/app.component';
import { GameComponent } from './app/components/game/game.component';

const routes = [
  { path: '', component: GameComponent },
  { path: '**', redirectTo: '/' },
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
  ],
}).catch(err => console.error(err));
