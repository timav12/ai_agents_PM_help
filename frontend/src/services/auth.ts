import api from './api';

const TOKEN_KEY = 'ai_agents_token';
const USER_KEY = 'ai_agents_user';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  token_limit: number;
  tokens_used: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Store token
export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  // Set default header for all requests
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Get token
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Remove token
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  delete api.defaults.headers.common['Authorization'];
};

// Store user
export const setUser = (user: User) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Get user
export const getUser = (): User | null => {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};

// Check if authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Initialize auth from storage
export const initAuth = () => {
  const token = getToken();
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Auth API calls
export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
