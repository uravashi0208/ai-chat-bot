import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [IonicModule, FormsModule, HttpClientModule],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  error: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit() {
  }

  // Password strength indicators
  hasMinLength(): boolean {
    return !!(this.password && this.password.length >= 1);
  }

  hasGoodLength(): boolean {
    return !!(this.password && this.password.length >= 6);
  }

  hasUpperCase(): boolean {
    return !!(this.password && this.password.length >= 8 && /[A-Z]/.test(this.password));
  }

  hasNumber(): boolean {
    return !!(this.password && this.password.length >= 8 && /[A-Z]/.test(this.password) && /[0-9]/.test(this.password));
  }

  passwordsMatch(): boolean {
    return !!(this.password && this.confirmPassword && this.password === this.confirmPassword);
  }

  async register() {
    if (!this.username || !this.email || !this.password || !this.confirmPassword) {
      this.error = 'Please fill in all fields';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.isLoading = true;
    this.error = '';

    try {
      const success = await this.authService.register(this.username, this.email, this.password);
      if (success) {
        // Navigate to dashboard on successful registration
        this.router.navigate(['/dashboard']);
      } else {
        this.error = 'Registration failed. Please try again.';
      }
    } catch (err: any) {
      if (err.status === 409) {
        this.error = 'Username or email already exists';
      } else {
        this.error = 'Registration failed. Please try again.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}