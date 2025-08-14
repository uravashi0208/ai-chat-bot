import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  canActivate(): boolean {
    if (!this.authService.isAuthenticated()) {
      return true;
    }

    // Already logged in so redirect to dashboard
    this.router.navigate(['/dashboard']);
    return false;
  }
}