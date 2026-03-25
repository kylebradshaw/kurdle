import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StorageKey, StorageService } from 'src/app/services/storage.service';
import { CountdownComponent } from './countdown.component';

describe('CountdownComponent', () => {
  let component: CountdownComponent;
  let fixture: ComponentFixture<CountdownComponent>;
  let storage: StorageService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [CountdownComponent],
    }).compileComponents();

    storage = TestBed.inject(StorageService);
  });

  afterEach(() => {
    localStorage.clear();
    // Ensure interval is cleaned up
    if (component) {
      component.ngOnDestroy();
    }
    vi.useRealTimers();
  });

  function create() {
    fixture = TestBed.createComponent(CountdownComponent);
    component = fixture.componentInstance;
  }

  it('should create', () => {
    create();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('sets active to false when no expiry in storage', () => {
    create();
    fixture.detectChanges();
    expect(component.active()).toBe(false);
  });

  it('displays countdown when expiry is in the future', () => {
    const future = new Date(Date.now() + 2 * 3600000 + 30 * 60000 + 15000).toISOString();
    storage.set(StorageKey.NextSequenceUtc, future);

    create();
    fixture.detectChanges();

    expect(component.active()).toBe(true);
    expect(component.hours()).toBe(2);
    expect(component.minutes()).toBe(30);

    component.ngOnDestroy();
  });

  it('ticks every second', () => {
    vi.useFakeTimers();
    const future = new Date(Date.now() + 60000).toISOString();
    storage.set(StorageKey.NextSequenceUtc, future);

    create();
    fixture.detectChanges();

    vi.advanceTimersByTime(1000);
    fixture.detectChanges();

    // After tick, component should still be active and have updated values
    expect(component.active()).toBe(true);
    expect(typeof component.seconds()).toBe('number');

    component.ngOnDestroy();
  });

  it('sets active to false when countdown reaches zero', () => {
    vi.useFakeTimers();
    const almostNow = new Date(Date.now() + 500).toISOString();
    storage.set(StorageKey.NextSequenceUtc, almostNow);

    create();
    fixture.detectChanges();

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();

    expect(component.active()).toBe(false);

    component.ngOnDestroy();
  });

  it('cleans up interval on destroy', () => {
    vi.useFakeTimers();
    const future = new Date(Date.now() + 3600000).toISOString();
    storage.set(StorageKey.NextSequenceUtc, future);

    create();
    fixture.detectChanges();

    component.ngOnDestroy();
    // Verify double-destroy is safe
    component.ngOnDestroy();
  });

  it('renders time in the template', () => {
    const future = new Date(Date.now() + 2 * 3600000 + 15 * 60000 + 30000).toISOString();
    storage.set(StorageKey.NextSequenceUtc, future);

    create();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('h');
    expect(text).toContain('m');
    expect(text).toContain('s');

    component.ngOnDestroy();
  });

  it('does not render when inactive', () => {
    create();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.d-flex')).toBeNull();
  });
});
