import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { StorageService } from 'src/app/services/storage.service';
import { nextRoundTime } from 'src/app/helpers';

@Component({
  standalone: true,
  selector: 'app-countdown',
  templateUrl: './countdown.component.html',
  styleUrls: ['./countdown.component.scss']
})
export class CountdownComponent implements OnInit, OnDestroy {
  private readonly storageService = inject(StorageService);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  readonly seconds = signal(0);
  readonly minutes = signal(0);
  readonly hours = signal(0);
  readonly active = signal(false);

  ngOnInit(): void {
    this.tick();
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    const expires = this.storageService.get('nextSequenceUtc');
    if (!expires) {
      this.active.set(false);
      return;
    }
    const next = nextRoundTime(expires);
    this.seconds.set(next.seconds);
    this.minutes.set(next.minutes);
    this.hours.set(next.hours);
    this.active.set(next.hours > 0 || next.minutes > 0 || next.seconds > 0);
  }
}
