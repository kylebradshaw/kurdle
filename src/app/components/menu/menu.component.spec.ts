import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Meta } from '@angular/platform-browser';
import { StorageKey, StorageService } from 'src/app/services/storage.service';
import { ThemeService } from 'src/app/services/theme.service';
import { GameMode } from 'src/app/models/game';
import { MenuComponent } from './menu.component';
import * as helpers from 'src/app/helpers/utils';

describe('MenuComponent', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;
  let storage: StorageService;
  let themeService: ThemeService;

  beforeEach(async () => {
    localStorage.clear();
    vi.spyOn(helpers, 'forceRefresh').mockImplementation(() => {});

    await TestBed.configureTestingModule({
      imports: [MenuComponent],
      providers: [provideHttpClient()],
    }).compileComponents();

    storage = TestBed.inject(StorageService);
    themeService = TestBed.inject(ThemeService);
    fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('adds meta theme-color tag', () => {
    const meta = TestBed.inject(Meta);
    const tag = meta.getTag('name=theme-color');
    expect(tag).toBeTruthy();
  });

  describe('currentTheme', () => {
    it('returns theme from ThemeService', () => {
      expect(component.currentTheme).toBe('light');
    });

    it('updates after toggle', () => {
      component.toggleTheme();
      expect(component.currentTheme).toBe('dark');
    });
  });

  describe('toggleDrawer', () => {
    it('toggles drawToggled', () => {
      expect(component.drawToggled).toBe(false);
      component.toggleDrawer();
      expect(component.drawToggled).toBe(true);
      component.toggleDrawer();
      expect(component.drawToggled).toBe(false);
    });

    it('loads shareText from storage', () => {
      storage.set(StorageKey.ShareText, JSON.stringify({ text: 'test' }));
      component.toggleDrawer();
      expect(component.shareText).toEqual({ text: 'test' });
    });
  });

  describe('canShare', () => {
    it('returns a boolean', () => {
      expect(typeof component.canShare()).toBe('boolean');
    });
  });

  describe('shareGame', () => {
    it('returns early if canShare is false', () => {
      vi.spyOn(component, 'canShare').mockReturnValue(false);
      expect(() => component.shareGame()).not.toThrow();
    });

    it('calls navigator.share when available', async () => {
      vi.spyOn(component, 'canShare').mockReturnValue(true);
      const shareSpy = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', { value: shareSpy, configurable: true, writable: true });
      component.shareText = { text: 'test' };

      component.shareGame();

      expect(shareSpy).toHaveBeenCalledWith({ text: 'test' });
    });

    it('handles share rejection', async () => {
      vi.spyOn(component, 'canShare').mockReturnValue(true);
      const shareSpy = vi.fn().mockRejectedValue(new Error('cancelled'));
      Object.defineProperty(navigator, 'share', { value: shareSpy, configurable: true, writable: true });
      component.shareText = { text: 'test' };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      component.shareGame();

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('toggleTheme', () => {
    it('toggles theme via ThemeService', () => {
      expect(themeService.theme()).toBe('light');
      component.toggleTheme();
      expect(themeService.theme()).toBe('dark');
    });

    it('updates meta theme-color', () => {
      component.toggleTheme();
      const meta = TestBed.inject(Meta);
      const tag = meta.getTag('name=theme-color');
      expect(tag?.content).toBe('#0a0a0a');
    });
  });

  describe('sequenceIdentifier', () => {
    it('returns ???? when no sequence index', () => {
      expect(component.sequenceIdentifier).toBe('????');
    });

    it('returns padded index', () => {
      storage.set(StorageKey.SequenceIdx, '42');
      expect(component.sequenceIdentifier).toBe('0042');
    });

    it('returns ???? for 0', () => {
      storage.set(StorageKey.SequenceIdx, '0');
      expect(component.sequenceIdentifier).toBe('????');
    });
  });

  describe('completedUtcCheckWithinDay', () => {
    it('returns true when completed more than 1 day ago', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
      storage.set(StorageKey.CompletedSequenceUtc, twoDaysAgo);
      expect(component.completedUtcCheckWithinDay).toBe(true);
    });

    it('returns false when completed less than 1 day ago', () => {
      const justNow = new Date(Date.now()).toISOString();
      storage.set(StorageKey.CompletedSequenceUtc, justNow);
      expect(component.completedUtcCheckWithinDay).toBe(false);
    });
  });

  describe('version', () => {
    it('returns version from storage', () => {
      storage.set(StorageKey.Version, '1.2.3');
      expect(component.version).toBe('1.2.3');
    });

    it('returns 0.0.0 when no version', () => {
      expect(component.version).toBe('0.0.0');
    });
  });

  describe('gameMode', () => {
    it('returns game mode from storage', () => {
      storage.set(StorageKey.GameMode, 'RANDOM');
      expect(component.gameMode).toBe('RANDOM');
    });
  });

  describe('template', () => {
    it('renders hamburger icon', () => {
      expect(fixture.nativeElement.querySelector('.hamburger')).toBeTruthy();
    });

    it('renders sequence identifier', () => {
      expect(fixture.nativeElement.textContent).toContain('????');
    });

    it('renders version as 0.0.0 when none set', () => {
      expect(fixture.nativeElement.textContent).toContain('0.0.0');
    });
  });
});
