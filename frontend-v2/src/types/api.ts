/**
 * API type definitions
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Standard API error response
 */
export interface ApiError {
  error: string;
  message: string;
  status: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * User authentication credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * User profile information
 */
export interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  created_at: string;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  user: User;
  token: string;
  refresh_token?: string;
}

/**
 * Credit balance information
 */
export interface CreditBalance {
  remaining: number;
  used: number;
  purchased: number;
}
