import apiClient from "./axiosClient";
import type {
  ApiResponse,
  LoginRequestDto,
  LoginResponseDto,
  SignupRequestDto,
  UserDto,
  VerifyTwoFactorDto,
  EnableTwoFactorDto,
  EnableTwoFactorResponseDto,
} from "../types/auth.types";

function unwrapResponse<T>(payload: ApiResponse<T> | T): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in (payload as ApiResponse<T>) &&
    (payload as ApiResponse<T>).data !== undefined
  ) {
    return (payload as ApiResponse<T>).data as T;
  }

  return payload as T;
}

/**
 * All Auth Service API calls.
 * Every function returns the typed data directly (unwrapped from ApiResponse).
 * Errors are thrown — callers handle them with try/catch or React Query's onError.
 */

export const authApi = {
  /**
   * POST /gateway/auth/signup
   * Register a new customer account.
   * Throws ConflictError (409) if email is already registered.
   */
  signup: async (data: SignupRequestDto): Promise<UserDto> => {
    const response = await apiClient.post<ApiResponse<UserDto> | UserDto>(
      "/auth/signup",
      data,
    );
    return unwrapResponse<UserDto>(response.data);
  },

  /**
   * POST /gateway/auth/login
   * Authenticate and receive JWT + user profile.
   * Throws UnauthorizedError (401) on bad credentials.
   */
  login: async (data: LoginRequestDto): Promise<LoginResponseDto> => {
    const response = await apiClient.post<
      ApiResponse<LoginResponseDto> | LoginResponseDto
    >("/auth/login", data);
    return unwrapResponse<LoginResponseDto>(response.data);
  },

  /**
   * GET /gateway/auth/users/:id
   * Fetch a user profile by ID. Requires valid JWT.
   */
  getUserById: async (id: string): Promise<UserDto> => {
    const response = await apiClient.get<ApiResponse<UserDto> | UserDto>(
      `/auth/users/${id}`,
    );
    return unwrapResponse<UserDto>(response.data);
  },

  /**
   * POST /gateway/auth/verify-two-factor
   * Authenticate using 2FA OTP code.
   */
  verifyTwoFactor: async (data: VerifyTwoFactorDto): Promise<LoginResponseDto> => {
    const response = await apiClient.post<
      ApiResponse<LoginResponseDto> | LoginResponseDto
    >("/auth/verify-two-factor", data);
    return unwrapResponse<LoginResponseDto>(response.data);
  },

  /**
   * POST /gateway/auth/enable-two-factor
   * Enable 2FA for the current user. Requires valid JWT.
   */
  enableTwoFactor: async (data: EnableTwoFactorDto): Promise<EnableTwoFactorResponseDto> => {
    const response = await apiClient.post<
      ApiResponse<EnableTwoFactorResponseDto> | EnableTwoFactorResponseDto
    >("/auth/enable-two-factor", data);
    return unwrapResponse<EnableTwoFactorResponseDto>(response.data);
  },

  /**
   * POST /gateway/auth/disable-two-factor
   * Disable 2FA for the current user. Requires valid JWT.
   */
  disableTwoFactor: async (): Promise<void> => {
    await apiClient.post("/auth/disable-two-factor");
  },

  /**
   * POST /gateway/auth/forgot-password
   */
  forgotPassword: async (data: { email: string }): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>("/auth/forgot-password", data);
    return unwrapResponse<{ message: string }>(response.data);
  },

  /**
   * POST /gateway/auth/reset-password
   */
  resetPassword: async (data: { email: string; code: string; newPassword: string }): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>("/auth/reset-password", data);
    return unwrapResponse<{ message: string }>(response.data);
  },
};

export const login = authApi.login;
export const signup = authApi.signup;
export const getUserById = authApi.getUserById;
export const forgotPassword = authApi.forgotPassword;
export const resetPassword = authApi.resetPassword;
