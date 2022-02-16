import { Injectable, OnInit } from '@angular/core';
import { StorageService } from 'src/app/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class StatsService implements OnInit {
  constructor(
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    console.log(`stats.service.ts: ngOnInit()`);
  }
}
