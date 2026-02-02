import { create } from 'zustand';
import { 
  User, 
  getToken, 
  getUser, 
  setToken, 
  setUser, 
  removeToken, 
  authApi,
  initAuth,
} from '../services/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getUser(),
  isAuthenticated: !!getToken(),
  isLoading: false,
  error: null,
  
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({ email, password });
      setToken(response.access_token);
      
      // Get user info
      const user = await authApi.getMe();
      setUser(user);
      
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Login failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },
  
  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.register({ email, password, name });
      
      // Auto-login after registration
      const response = await authApi.login({ email, password });
      setToken(response.access_token);
      
      const user = await authApi.getMe();
      setUser(user);
      
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Registration failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },
  
  logout: () => {
    removeToken();
    set({ user: null, isAuthenticated: false });
  },
  
  checkAuth: async () => {
    const token = getToken();
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    
    initAuth();
    
    try {
      const user = await authApi.getMe();
      setUser(user);
      set({ user, isAuthenticated: true });
    } catch {
      removeToken();
      set({ isAuthenticated: false, user: null });
    }
  },
  
  clearError: () => set({ error: null }),
}));
