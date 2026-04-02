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

export interface VerifyTwoFactorDto {
  email: string;
  code: string;
}

export interface EnableTwoFactorDto {
  method: "Email" | "Authenticator";
}

export interface EnableTwoFactorResponseDto {
  message?: string;
  method?: string;
  authenticatorKey?: string;
  qrCodeUri?: string;
}

export interface AuthState {
  token: string | null;
  user: UserDto | null;
  role: "Customer" | "Admin" | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  pendingTwoFactorEmail: string | null;
  
  setAuth: (token: string, user: UserDto, role: "Customer" | "Admin") => void;
  clearAuth: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  setPendingTwoFactor: (email: string | null) => void;
}
