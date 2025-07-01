# Authentication and Security

## Overview

Acero Applications implements a comprehensive security architecture to protect sensitive data, ensure proper access control, and maintain the integrity of the system. This document outlines the authentication mechanisms, authorization strategies, and security best practices implemented throughout the application.

## Authentication Architecture

### Authentication Methods

The application supports multiple authentication methods:

1. **Username/Password Authentication**: Traditional credential-based authentication
2. **JWT (JSON Web Token)**: Token-based authentication for API requests
3. **OAuth Integration**: Support for external identity providers (optional)

### Implementation with NextAuth.js

The authentication system is built using NextAuth.js with custom providers:

```typescript
// Example NextAuth configuration
export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Verify credentials against database
        const user = await verifyUserCredentials(
          credentials.username,
          credentials.password
        );
        
        if (user) {
          return {
            id: user._id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role,
            // Additional user data
          };
        }
        
        return null;
      }
    }),
    // Additional providers
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        // Additional custom claims
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      // Additional session customization
      return session;
    }
  },
  // Additional configuration
});
```

### User Authentication Flow

1. User submits credentials via login form
2. Credentials are verified against the database (with password hashing)
3. Upon successful verification, JWT is generated and stored in cookies
4. Subsequent requests include the JWT for authenticated API access
5. Session management handles token refresh and expiration

## Authorization Framework

### Role-Based Access Control (RBAC)

Access control is implemented using a role-based approach:

```typescript
// Example role definition
const roles = {
  admin: {
    permissions: ['create:all', 'read:all', 'update:all', 'delete:all']
  },
  manager: {
    permissions: ['create:department', 'read:all', 'update:department', 'delete:none']
  },
  user: {
    permissions: ['create:own', 'read:own', 'update:own', 'delete:none']
  },
  // Additional roles
};
```

### Authorization Middleware

API routes and pages are protected using authorization middleware:

```typescript
// Example API route authorization
export async function GET(req: Request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check permissions
    const hasPermission = await checkPermission(
      session.user.id,
      'read:quotations'
    );
    if (!hasPermission) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Process authorized request
    // ...
  } catch (error) {
    // Error handling
  }
}
```

### Frontend Authorization

UI components adapt based on user permissions:

```tsx
// Example permission-based UI rendering
import { usePermission } from '../hooks/usePermission';

function ActionButton({ resource }) {
  const canEdit = usePermission('update:' + resource);
  const canDelete = usePermission('delete:' + resource);
  
  return (
    <div className="flex gap-2">
      {canEdit && <Button variant="primary">Edit</Button>}
      {canDelete && <Button variant="danger">Delete</Button>}
    </div>
  );
}
```

## Password Management

### Password Storage

Passwords are securely stored using modern hashing techniques:

```typescript
// Example password hashing
import bcrypt from 'bcrypt';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
```

### Password Policies

The application enforces strong password policies:

1. Minimum 8 characters length
2. Mixture of uppercase, lowercase, numbers, and special characters
3. Regular password rotation (configurable)
4. Prevention of password reuse

## Data Protection

### Data Encryption

Sensitive data is protected using encryption:

1. **Transport Layer Security**: HTTPS for all communications
2. **Database Encryption**: Encryption at rest for sensitive fields
3. **File Encryption**: Encrypted storage for uploaded documents

### Implementation Example

```typescript
// Example field encryption
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

## API Security

### API Protection Measures

APIs are secured through multiple mechanisms:

1. **Authentication**: JWT validation for all protected routes
2. **Rate Limiting**: Prevention of abuse and DoS attacks
3. **Input Validation**: Schema validation to prevent injection attacks
4. **CORS Policies**: Controlled cross-origin access

### Implementation

```typescript
// Example API security middleware
export const apiSecurityMiddleware = [
  // Validate JWT
  authMiddleware,
  
  // Rate limiting
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
  }),
  
  // Input validation
  validateRequestSchema,
  
  // CORS
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }),
];
```

## Security Headers

### HTTP Security Headers

The application implements recommended security headers:

```typescript
// Example security headers configuration
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim(),
  },
];
```

## Session Management

### Session Configuration

Sessions are managed securely with appropriate settings:

```typescript
// Example session configuration
session({
  name: 'acero.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    sameSite: 'lax',
  },
  store: sessionStore, // Configured session store
});
```

### Session Storage

For production environments, sessions are stored in:

1. **MongoDB**: Using connect-mongo for persistent sessions
2. **Redis**: For high-performance session management (optional)

## Audit Logging

### Security Event Logging

The application logs security-relevant events:

```typescript
// Example audit logging
export async function auditLog(event: {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ip?: string;
}) {
  await AuditLog.create({
    ...event,
    timestamp: new Date(),
  });
}

// Usage
auditLog({
  userId: user.id,
  action: 'CREATE',
  resource: 'QUOTATION',
  resourceId: quotation._id,
  details: { quoteNo },
  ip: req.ip,
});
```

### Log Analysis

Security logs are monitored for:

1. Failed login attempts
2. Permission violations
3. Unusual access patterns
4. System configuration changes

## Security Best Practices

### Development Practices

1. **Security-focused Code Reviews**: Special attention to authentication, authorization, and data handling
2. **Dependency Scanning**: Regular checking for vulnerable dependencies
3. **Security Testing**: Regular penetration testing and security assessments

### Operational Security

1. **Least Privilege Principle**: Granting minimal necessary permissions
2. **Regular Updates**: Keeping all dependencies and systems updated
3. **Environment Separation**: Clear separation of development, testing, and production environments
4. **Secret Management**: Secure handling of credentials and sensitive configuration
