import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { ThemeServiceConfig, THEME_CONFIG } from '@bcodes/ngx-theme-service'
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { GameComponent } from './components/game/game.component';
import { WordService } from './services/word.service';
import { LetterBlockComponent } from './components/letter-block/letter-block.component';
import { KeyboardComponent } from './components/keyboard/keyboard.component';
import { StorageService } from './services/storage.service';
import { CountdownComponent } from './components/countdown/countdown.component';
import { MenuComponent } from './components/menu/menu.component';

const themeServiceConfig: ThemeServiceConfig = {
  themes: ['light', 'dark'],
  defaultTheme: 'light',
  transitionConfig: {
    className: 'theme-transition',
    duration: 1500
  }
};

@NgModule({
  declarations: [
    AppComponent,
    GameComponent,
    LetterBlockComponent,
    KeyboardComponent,
    CountdownComponent,
    MenuComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [
    WordService,
    StorageService,
    {
      provide: THEME_CONFIG,
      useValue: themeServiceConfig
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
