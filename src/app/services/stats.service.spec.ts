import { TestBed } from '@angular/core/testing';
import { StorageService } from 'src/app/services/storage.service';

import { StatsService } from './stats.service';

describe('StatsService', () => {
  let service: StatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: StorageService }
      ]
    });
    service = TestBed.inject(StatsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
