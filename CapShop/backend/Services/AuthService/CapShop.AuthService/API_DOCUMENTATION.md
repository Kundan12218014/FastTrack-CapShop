# CapShop.AuthService API Documentation

This document provides a comprehensive guide to the Authentication Service API endpoints, including the Two-Factor Authentication (2FA) flows, and detailed instructions on how to test them.

## Overview
The Auth Service is responsible for:
- User Registration (Signup)
- User Authentication (Login)
- JSON Web Token (JWT) issuance
- Two-Factor Authentication (Email OTP & Authenticator App)
- User Profile Retrieval
- User Activation Management (Admin)

---

## 🔐 Endpoints

### 1. Register a New User
**Endpoint:** `POST /auth/signup`
**Access:** Public (`AllowAnonymous`)

**Description:** Creates a new user account with role `Customer`.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "johndoe@example.com",
  "phoneNumber": "1234567890",
  "password": "Password123!"
}
```

**Responses:**
- `201 Created`: User created successfully. Returns the created `UserDto`.
- `400/422 Bad Request`: Validation failure.
- `409 Conflict`: Email already exists.

---

### 2. Login
**Endpoint:** `POST /auth/login`
**Access:** Public (`AllowAnonymous`)

**Description:** Authenticates a user. If 2FA is **not enabled**, returns a JWT token immediately. If 2FA **is enabled**, returns a response indicating 2FA is required.

**Request Body:**
```json
{
  "email": "johndoe@example.com",
  "password": "Password123!"
}
```

**Responses:**
- `200 OK` (2FA Disabled): Returns `{ "token": "ey...", "requiresTwoFactor": false }`
- `200 OK` (2FA Enabled): Returns `{ "requiresTwoFactor": true, "twoFactorMethod": "Email" }`. (An OTP is sent if the method is Email).
- `401 Unauthorized`: Invalid credentials.

---

### 3. Verify Two-Factor Authentication
**Endpoint:** `POST /auth/verify-two-factor`
**Access:** Public

**Description:** Submits the OTP (from Email) or TOTP (from Authenticator App) to complete the login process and retrieve the JWT.

**Request Body:**
```json
{
  "email": "johndoe@example.com",
  "code": "123456" 
}
```

**Responses:**
- `200 OK`: Valid code. Returns JWT Token.
- `401 Unauthorized`: Invalid or expired code.

---

### 4. Enable Two-Factor Authentication
**Endpoint:** `POST /auth/enable-two-factor`
**Access:** Protected (`[Authorize]`) - Requires valid JWT as Bearer Token.

**Description:** Enables 2FA for the currently authenticated user. Supported methods: `Email` or `Authenticator`.

**Request Body:**
```json
{
  "method": "Authenticator" // or "Email"
}
```

**Responses:**
- `200 OK`: Returns success message. If method is `Authenticator`, it returns an `authenticatorKey` and `qrCodeUri` for setting up apps like Google Authenticator.
- `401 Unauthorized`: Missing or invalid JWT token.

---

### 5. Disable Two-Factor Authentication
**Endpoint:** `POST /auth/disable-two-factor`
**Access:** Protected (`[Authorize]`)

**Description:** Disables 2FA for the currently authenticated user.

**Request Body:** None

**Responses:**
- `200 OK`: Disabled successfully.

---

### 6. Get User Profile
**Endpoint:** `GET /auth/users/{id}`
**Access:** Protected (`[Authorize]`)

**Description:** Retrieves external user details by ID.

**Responses:**
- `200 OK`: Returns `UserDto`.
- `404 Not Found`: User does not exist.

---

### 7. Activate User
**Endpoint:** `PATCH /auth/users/{id}/activate`
**Access:** Protected (`[Authorize(Roles = "Admin")]`)

**Description:** Updates the active status of a user. Usually executed by Admin.

**Request Body:**
```json
{
  "isActive": true
}
```

**Responses:**
- `204 No Content`: Status updated successfully.
- `403 Forbidden`: User lacks Admin role.

---

## 🧪 Testing Scenarios and Guides

Ensure the API is running locally (e.g., `https://localhost:xxxx`). 
You can use **Postman**, **cURL**, or **Swagger UI** (`/swagger`) to test these endpoints.

### Scenario A: Standard User Journey (No 2FA)

1. **Signup:**
   - Send `POST /auth/signup` with a valid email and password.
   - Verify `201 Created` response.
2. **Login:**
   - Send `POST /auth/login` with identical credentials.
   - Validate `token` exists in the response payload. Copy this token.
3. **Get Protected Data:**
   - Set Header `Authorization: Bearer <your_token>`.
   - Send `GET /auth/users/{id}` (use ID returned from signup).

### Scenario B: Enabling & Using Email 2FA

1. **Login** to get an active JWT Token.
2. **Enable 2FA:**
   - Send `POST /auth/enable-two-factor` with `Authorization: Bearer <token>`.
   - Body: `{ "method": "Email" }`
3. **Re-Login (Triggering 2FA):**
   - Send `POST /auth/login`.
   - The response will show `"requiresTwoFactor": true`.
   - *Check your configured Email inbox* or the application console (for Simulated Emails) to find the 6-digit OTP.
4. **Verify 2FA:**
   - Send `POST /auth/verify-two-factor`.
   - Body: `{ "email": "your_email", "code": "<the_otp_received>" }`
   - You will now receive a fresh JWT string.

### Scenario C: Authenticator App 2FA

1. **Login** to get a JWT Token.
2. **Enable 2FA:**
   - Send `POST /auth/enable-two-factor` with `{ "method": "Authenticator" }`.
   - The API will respond with an `AuthenticatorKey` and a `QrCodeUri`.
   - *Optional:* Copy the `AuthenticatorKey` into Google Authenticator or Microsoft Authenticator as a manual setup key.
3. **Re-Login:**
   - Send `POST /auth/login`. Response indicates 2FA is required.
4. **Verify with Authenticator App:**
   - Get the 6-digit time-based code from your Authenticator app.
   - Send `POST /auth/verify-two-factor` with `{ "email": "your_email", "code": "<app_code>" }`.
   - Receive your final JWT Token.

---

## SMTP Configuration Notes

To fully test Email Two-Factor Authentication, ensure `EmailSettings` in `appsettings.json` is correctly configured:
```json
"EmailSettings": {
    "SenderEmail": "your-email@gmail.com",
    "SenderPassword": "your-google-app-password",
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": "587"
}
```
*Note: If you use Gmail, you must generate an "App Password" from your Google Account settings, rather than using your login password.*
