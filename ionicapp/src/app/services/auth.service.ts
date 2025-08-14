import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService, LoginRequest, RegisterRequest } from './api.service';

export interface User {
  id: string; // Changed to string for UUID support
  username: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private apiService: ApiService) {
    // Check if user is already logged in from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // In a real app, you would verify the token with the server
      // For now, we'll just set the user as authenticated
      this.isAuthenticatedSubject.next(true);
      // Load user data from localStorage or API
      const userData = localStorage.getItem('user');
      if (userData) {
        this.currentUserSubject.next(JSON.parse(userData));
      }
    }
  }
  
  login(email: string, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const credentials: LoginRequest = {
        email: email,
        password: password
      };
      
      this.apiService.login(credentials).subscribe({
        next: (response) => {
          try {
            // Store user and token in localStorage
            localStorage.setItem('token', response.accessToken);
            localStorage.setItem('user', JSON.stringify(response.user));
            
            // Update subjects
            this.currentUserSubject.next(response.user);
            this.isAuthenticatedSubject.next(true);
            
            resolve(true);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }
  
  register(username: string, email: string, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const userData: RegisterRequest = {
        username: username,
        email: email,
        password: password
      };
      
      this.apiService.register(userData).subscribe({
        next: (response) => {
          // Store user and token from registration response
          localStorage.setItem('token', response.accessToken);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          // Update subjects
          this.currentUserSubject.next(response.user);
          this.isAuthenticatedSubject.next(true);
          
          resolve(true);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }
  
  logout(): void {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Update subjects
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }
  
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
  
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }
}