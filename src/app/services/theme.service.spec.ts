import { TestBed } from '@angular/core/testing';
import { StorageKey, StorageService } from 'src/app/services/storage.service';
import { ThemeService, ThemeValue } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let storage: StorageService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
    storage = TestBed.inject(StorageService);
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('defaults to light theme when nothing in storage', () => {
    expect(service.theme()).toBe('light');
  });

  it('applies data-theme attribute on creation', () => {
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('loads dark theme from storage', () => {
    localStorage.clear();
    storage.set(StorageKey.Theme, 'dark');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const freshService = TestBed.inject(ThemeService);
    expect(freshService.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('defaults to light for invalid stored value', () => {
    localStorage.clear();
    storage.set(StorageKey.Theme, 'invalid');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const freshService = TestBed.inject(ThemeService);
    expect(freshService.theme()).toBe('light');
  });

  describe('toggle()', () => {
    it('toggles from light to dark', () => {
      service.toggle();
      expect(service.theme()).toBe('dark');
      expect(storage.get(StorageKey.Theme)).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('toggles from dark back to light', () => {
      service.toggle(); // light → dark
      service.toggle(); // dark → light
      expect(service.theme()).toBe('light');
      expect(storage.get(StorageKey.Theme)).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('persists to storage on toggle', () => {
      service.toggle();
      expect(storage.get(StorageKey.Theme)).toBe('dark');
    });
  });
});
