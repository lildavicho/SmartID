# User & Auth Modules

Complete authentication and authorization system with JWT tokens, role-based access control, and password hashing.

## Overview

The system consists of two modules:
- **UserModule**: User management and CRUD operations
- **AuthModule**: Authentication with JWT tokens

## Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (RBAC)
- ✅ Custom guards and decorators
- ✅ Comprehensive validation
- ✅ Complete test coverage

## User Roles

```typescript
enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',  // Full system access
  ADMIN = 'ADMIN',               // Institution admin
  PRINCIPAL = 'PRINCIPAL',       // School principal
  INSPECTOR = 'INSPECTOR',       // School inspector
  TEACHER = 'TEACHER',           // Teacher
}
```

## User Status

```typescript
enum UserStatus {
  ACTIVE = 'ACTIVE',       // Can login
  INACTIVE = 'INACTIVE',   // Cannot login
  SUSPENDED = 'SUSPENDED', // Temporarily blocked
}
```

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Register
```http
POST /auth/register
```
**Request:**
```json
{
  "email": "teacher@school.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "TEACHER",
  "institutionId": "uuid" // optional
}
```
**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "teacher@school.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "TEACHER"
  }
}
```

#### Login
```http
POST /auth/login
```
**Request:**
```json
{
  "email": "teacher@school.com",
  "password": "securepassword123"
}
```
**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "teacher@school.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "TEACHER"
  }
}
```

### Protected Endpoints (Require JWT Token)

#### Get Profile
```http
GET /auth/profile
Authorization: Bearer {token}
```
**Response:**
```json
{
  "userId": "user-uuid",
  "email": "teacher@school.com",
  "role": "TEACHER"
}
```

#### Get All Users (Admin Only)
```http
GET /users
Authorization: Bearer {token}
```
**Roles Required:** ADMIN, SUPER_ADMIN

**Response:**
```json
[
  {
    "id": "user-uuid",
    "email": "teacher@school.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "TEACHER",
    "status": "ACTIVE",
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

#### Get User by ID
```http
GET /users/:id
Authorization: Bearer {token}
```

#### Change Password
```http
PATCH /users/:id/password
Authorization: Bearer {token}
```
**Request:**
```json
{
  "oldPassword": "currentpassword",
  "newPassword": "newsecurepassword123"
}
```

**Note:** Users can only change their own password unless they are ADMIN or SUPER_ADMIN.

#### Delete User (Super Admin Only)
```http
DELETE /users/:id
Authorization: Bearer {token}
```
**Roles Required:** SUPER_ADMIN

## Authentication Flow

### 1. Register/Login
```
Client → POST /auth/register or /auth/login
Server → Validates credentials
Server → Generates JWT token
Server → Returns token + user data
```

### 2. Protected Request
```
Client → GET /auth/profile
Client → Includes: Authorization: Bearer {token}
Server → JwtAuthGuard validates token
Server → JwtStrategy extracts user from payload
Server → Attaches user to request
Server → Returns protected data
```

### 3. Role-Based Access
```
Client → GET /users (Admin only)
Client → Includes: Authorization: Bearer {token}
Server → JwtAuthGuard validates token
Server → RolesGuard checks user role
Server → Allows/Denies based on role
```

## Guards

### JwtAuthGuard

Validates JWT tokens on protected routes.

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@CurrentUser() user: CurrentUserData) {
  return user;
}
```

### RolesGuard

Checks if user has required role.

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Get('users')
async findAll() {
  return this.userService.findAll();
}
```

## Decorators

### @Public()

Marks a route as public (no authentication required).

```typescript
@Public()
@Post('login')
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}
```

### @Roles(...roles)

Specifies which roles can access a route.

```typescript
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Get('users')
async findAll() {
  return this.userService.findAll();
}
```

### @CurrentUser()

Injects current user data into route handler.

```typescript
@Get('profile')
async getProfile(@CurrentUser() user: CurrentUserData) {
  // user = { userId, email, role }
  return user;
}
```

## JWT Configuration

### Environment Variables

```env
JWT_SECRET=your-super-secret-key-change-in-production
```

### Token Payload

```typescript
{
  sub: "user-uuid",      // User ID
  email: "user@example.com",
  role: "TEACHER",
  iat: 1234567890,       // Issued at
  exp: 1234654290        // Expires (1 day)
}
```

### Token Expiration

- **Default:** 1 day
- Configured in `AuthModule`

## Password Security

### Hashing

Passwords are hashed using **bcrypt** with 10 salt rounds.

```typescript
const hashedPassword = await bcrypt.hash(plainPassword, 10);
```

### Verification

```typescript
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

### Requirements

- Minimum 8 characters
- Maximum 100 characters
- Validated with `@MinLength(8)` decorator

## Validation

All DTOs include comprehensive validation:

### RegisterDto
- `email`: Must be valid email format
- `password`: Minimum 8 characters
- `firstName`: 2-100 characters
- `lastName`: 2-100 characters
- `role`: Must be valid UserRole enum
- `institutionId`: Optional UUID

### LoginDto
- `email`: Required, valid email
- `password`: Required

### ChangePasswordDto
- `oldPassword`: Minimum 8 characters
- `newPassword`: Minimum 8 characters, maximum 100

## Error Handling

### Common Errors

| Error | Status | Description |
|-------|--------|-------------|
| Email already exists | 409 Conflict | During registration |
| Invalid credentials | 401 Unauthorized | Wrong email/password |
| User not active | 401 Unauthorized | Account suspended/inactive |
| Unauthorized | 401 Unauthorized | Invalid/expired token |
| Forbidden | 403 Forbidden | Insufficient permissions |
| User not found | 404 Not Found | Invalid user ID |

### Example Error Response

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

## Testing

### Run Tests

```bash
# Unit tests
npm test

# Specific test file
npm test user.service.spec.ts

# With coverage
npm test -- --coverage
```

### Test Coverage

- ✅ Password hashing
- ✅ Password verification
- ✅ User creation with duplicate email
- ✅ Login with correct credentials
- ✅ Login with incorrect credentials
- ✅ Login with inactive user
- ✅ JWT token generation
- ✅ Guard behavior

## Usage Examples

### Frontend Integration

```typescript
// Login
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { access_token, user } = await response.json();

// Store token
localStorage.setItem('token', access_token);

// Use token in requests
const profile = await fetch('/auth/profile', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
```

### NestJS Service Usage

```typescript
@Injectable()
export class SomeService {
  constructor(private authService: AuthService) {}

  async someMethod() {
    // Register user
    const result = await this.authService.register({
      email: 'user@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.TEACHER,
    });

    // Login
    const loginResult = await this.authService.login({
      email: 'user@example.com',
      password: 'password123',
    });

    // Verify token
    const payload = await this.authService.verifyToken(token);
  }
}
```

## Security Best Practices

### Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Use HTTPS in production
- [ ] Enable CORS with specific origins
- [ ] Implement rate limiting
- [ ] Add refresh tokens (future enhancement)
- [ ] Log authentication attempts
- [ ] Implement account lockout after failed attempts
- [ ] Add email verification
- [ ] Implement password reset flow

### Token Storage

**Frontend:**
- ✅ Store in memory (most secure)
- ✅ Store in httpOnly cookies
- ❌ Avoid localStorage (XSS vulnerable)

### Password Policy

Consider implementing:
- Password strength requirements
- Password history (prevent reuse)
- Regular password rotation
- Multi-factor authentication (MFA)

## Future Enhancements

- [ ] Refresh tokens
- [ ] Email verification
- [ ] Password reset via email
- [ ] Two-factor authentication (2FA)
- [ ] OAuth integration (Google, Microsoft)
- [ ] Session management
- [ ] Account lockout mechanism
- [ ] Password strength meter
- [ ] Audit logging
- [ ] IP-based restrictions

## Dependencies

Required packages:

```json
{
  "@nestjs/jwt": "^10.0.0",
  "@nestjs/passport": "^10.0.0",
  "passport": "^0.6.0",
  "passport-jwt": "^4.0.1",
  "bcrypt": "^5.1.0",
  "@types/bcrypt": "^5.0.0",
  "@types/passport-jwt": "^3.0.9"
}
```

## Troubleshooting

### Token Expired

**Error:** `401 Unauthorized`

**Solution:** Login again to get a new token.

### Invalid Token

**Error:** `401 Unauthorized - Invalid token`

**Solution:** Check token format and ensure it's properly included in Authorization header.

### Forbidden Access

**Error:** `403 Forbidden`

**Solution:** User doesn't have required role. Check `@Roles()` decorator.

### Password Too Short

**Error:** `400 Bad Request - Password must be at least 8 characters long`

**Solution:** Use a password with minimum 8 characters.
