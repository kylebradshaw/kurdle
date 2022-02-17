import { Injectable } from '@angular/core';

@Injectable()
export class StorageService {
  isClient = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isClient = true;
    }
  }

  public clear(force = false) {
    if (this.isClient && force) {
      const version = localStorage.getItem('version') as string;
      const theme = localStorage.getItem('theme') as string;
      localStorage.clear();
      localStorage.setItem('version', version);
      localStorage.setItem('theme', theme);
    }
  }

  public set(key: string, data: string) {
    if (this.isClient) {
      localStorage.setItem(key, data);
    }
  }

  public get(key: string): string {
    let data;
    if (this.isClient) {
      data = localStorage.getItem(key);
    }
    return data as string;
  }

  public remove(key: string): void {
    localStorage.removeItem(key);
  }
}
