import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string; // Changed to string for UUID support
    username: string;
    email: string;
  };
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: {
    id: string; // Changed to string for UUID support
    username: string;
    email: string;
  };
  accessToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    }),
    withCredentials: true
  };

  constructor(private http: HttpClient) { }

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }),
      withCredentials: true
    };
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, credentials, this.httpOptions)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.baseUrl}/auth/register`, userData, this.httpOptions)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  getUsersWithMessages(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users/with-messages`, this.getAuthHeaders())
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  getMessages(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/chat/messages/${userId}`, this.getAuthHeaders())
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  sendMessage(userId: string, content: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/chat/messages/${userId}`, 
      { content }, 
      this.getAuthHeaders()
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // Handle API errors
  private handleError(error: any) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(errorMessage);
  }
}