import { Observable, interval, of } from 'rxjs';
import { map, tap, takeWhile} from 'rxjs/operators';
import { StorageService } from 'src/app/services/storage.service';
import { Component, Input, OnInit } from '@angular/core';
import { nextRoundTime } from 'src/app/helpers';

@Component({
  selector: 'app-countdown',
  templateUrl: './countdown.component.html',
  styleUrls: ['./countdown.component.scss']
})
export class CountdownComponent implements OnInit {
  seconds: number = 0;
  minutes: number = 0;
  hours: number = 0;
  now: number = 0;
  countdown$: Observable<any> = of({});

  constructor(
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.countdown$ = interval(1000).pipe(
      tap(() => {
        const expires = this.storageService.get('nextSequenceUtc');
        const next = nextRoundTime(expires);
        this.seconds = next.seconds;
        this.minutes = next.minutes;
        this.hours = next.hours;
      }),
      map(_ => `${this.hours}:${this.minutes}:${this.seconds}`),
      takeWhile((val: string) => val !== `0:0:0`),
    );
  }

}
