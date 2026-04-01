export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: "Customer" | "Admin";
  isActive: boolean;
  createdAt: string;
}

export interface LoginResponseDto {
  token?: string;
  role?: "Customer" | "Admin";
  user?: UserDto;
  expiresAt?: string;
  requiresTwoFactor?: boolean;
  twoFactorMethod?: "Email" | "Authenticator";
}

export interface SignupRequestDto {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface AuthState {
  token: string | null;
  user: UserDto | null;
  role: "Customer" | "Admin" | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setAuth: (token: string, user: UserDto, role: "Customer" | "Admin") => void;
  clearAuth: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}
