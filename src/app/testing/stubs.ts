import { of } from 'rxjs';
export class MockThemeService { }
export class MockWordService {
  seedWordFromFunc() {
    return of({});
  }
}

export class MockStorageService {
  set(value: any) {
    return;
  }
  get(key: any) {
    return;
  }
  remove() {
    return;
  }
  clear() {
    return;
  }
}
