import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideHttpClient } from '@angular/common/http';
import { GameComponent } from './components/game/game.component';
import { WordService } from './services/word.service';
import { LetterBlockComponent } from './components/letter-block/letter-block.component';
import { KeyboardComponent } from './components/keyboard/keyboard.component';
import { StorageService } from './services/storage.service';
import { CountdownComponent } from './components/countdown/countdown.component';
import { MenuComponent } from './components/menu/menu.component';

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
  ],
  providers: [
    provideHttpClient(),
    WordService,
    StorageService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
