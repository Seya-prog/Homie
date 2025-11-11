import Cookies from 'js-cookie';

export interface CookieOptions {
  expires?: number;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  httpOnly?: boolean;
}

class CookieService {
  private defaultOptions: CookieOptions = {
    expires: 7, // 7 days
    secure: process.env.NODE_ENV === 'production', // Only secure in production
    sameSite: 'strict',
  };

  setToken(token: string, options?: CookieOptions): void {
    const cookieOptions = { ...this.defaultOptions, ...options };
    Cookies.set('token', token, cookieOptions);
  }

  getToken(): string | undefined {
    return Cookies.get('token');
  }

  setUser(user: any, options?: CookieOptions): void {
    const cookieOptions = { ...this.defaultOptions, ...options };
    Cookies.set('user', JSON.stringify(user), cookieOptions);
  }

  getUser(): any | null {
    const userStr = Cookies.get('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user from cookie:', error);
      return null;
    }
  }

  removeToken(): void {
    Cookies.remove('token');
  }

  removeUser(): void {
    Cookies.remove('user');
  }

  clearAuth(): void {
    this.removeToken();
    this.removeUser();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const cookieService = new CookieService();
export default cookieService;
