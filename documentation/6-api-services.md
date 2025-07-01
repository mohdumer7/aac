# API Services

## Overview

Acero Applications implements a comprehensive API service layer that provides data access and business logic operations for frontend components. The API architecture combines Next.js API routes with additional Express server endpoints, creating a unified interface for all application modules.

## API Architecture

### Structure

The API services are organized into:

```
/src
├── app/api/            # Next.js API routes
├── services/           # Frontend service definitions
│   ├── api.ts          # Base API configuration
│   └── endpoints/      # API endpoint definitions
├── server/             # Server-side implementation
│   ├── managers/       # Data access managers
│   └── services/       # Business logic services
```

### Implementation Patterns

Acero Applications uses the following patterns for API implementation:

1. **RTK Query**: For frontend data fetching and state management
2. **API Route Handlers**: For server-side request processing
3. **Manager Pattern**: For database operations and data access
4. **Service Layer**: For encapsulating business logic

## Frontend Service Integration

### Base API Configuration

The `api.ts` file configures the base RTK Query API:

```typescript
// Core API configuration with baseUrl and default settings
export const api = createApi({
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api/',
    prepareHeaders: (headers, { getState }) => {
      // Authentication headers and other preparations
      return headers;
    }
  }),
  endpoints: () => ({})
});
```

### Endpoint Definitions

Each module has specialized endpoint definitions:

```typescript
// Example from applicationApi.ts
export const applicationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getApplications: builder.query({
      query: (params) => ({
        url: `applications`,
        params
      })
    }),
    getApplication: builder.query({
      query: (id) => `applications/${id}`
    }),
    createApplication: builder.mutation({
      query: (data) => ({
        url: 'applications',
        method: 'POST',
        body: data
      })
    }),
    // Additional endpoints...
  })
});

export const {
  useGetApplicationsQuery,
  useLazyGetApplicationQuery,
  useCreateApplicationMutation,
  // Additional hooks...
} = applicationApi;
```

## API Endpoints

### AQM Module Endpoints

```
GET    /api/quotations              # Get all quotations with filtering
GET    /api/quotations/:id          # Get a specific quotation
POST   /api/quotations              # Create a new quotation
PUT    /api/quotations/:id          # Update an existing quotation
DELETE /api/quotations/:id          # Soft delete a quotation
GET    /api/quotations/:id/proposals # Get proposals for a quotation
POST   /api/proposals               # Create a new proposal
GET    /api/proposals/:id/revisions # Get revisions for a proposal
POST   /api/proposals/:id/revisions # Add a new revision
```

### Master Data Endpoints

```
GET    /api/master/:entity          # Get entities (users, departments, etc.)
GET    /api/master/:entity/:id      # Get specific entity by ID
POST   /api/master/:entity          # Create new master data entity
PUT    /api/master/:entity/:id      # Update master data entity
DELETE /api/master/:entity/:id      # Delete master data entity
```

### HR Wizard Endpoints

```
GET    /api/employees               # Get employee profiles with filtering
GET    /api/employees/:id           # Get specific employee profile
POST   /api/employees               # Create new employee profile
PUT    /api/employees/:id           # Update employee profile
GET    /api/employees/:id/documents # Get employee documents
POST   /api/employees/:id/documents # Upload employee document
GET    /api/employees/:id/benefits  # Get employee benefits
PUT    /api/employees/:id/benefits  # Update employee benefits
```

### Inventory Management Endpoints

```
GET    /api/products               # Get product catalog with filtering
POST   /api/products               # Create new product
PUT    /api/products/:id           # Update product information
GET    /api/inventory              # Get inventory status
POST   /api/inventory/transactions # Record inventory movement
GET    /api/assets                 # Get asset information
PUT    /api/assets/:id/assign      # Update asset assignment
```

### IT Applications Endpoints

```
GET    /api/itapplications/accounts # Get IT accounts
POST   /api/itapplications/accounts # Create new IT account
GET    /api/itapplications/usage    # Get usage data
POST   /api/itapplications/usage    # Record new usage data
GET    /api/itapplications/printers # Get printer information
```

### Ticket System Endpoints

```
GET    /api/tickets                # Get tickets with filtering
POST   /api/tickets                # Create new ticket
PUT    /api/tickets/:id            # Update existing ticket
GET    /api/tickets/:id/history    # Get ticket history
POST   /api/tickets/:id/comments   # Add comment to a ticket
GET    /api/tickets/:id/tasks      # Get tasks for a ticket
POST   /api/tickets/:id/tasks      # Create task for a ticket
```

### SML Endpoints

```
GET    /api/sml/groups             # Get media group structure
POST   /api/sml/groups             # Create new media group
GET    /api/sml/files              # Get files with filtering
POST   /api/sml/upload             # Upload new media files
GET    /api/sml/files/:id          # Get specific file metadata and content
PUT    /api/sml/files/:id          # Update file metadata
GET    /api/sml/files/:id/versions # Get file version history
```

### Authentication Endpoints

```
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
GET    /api/auth/session           # Get current session information
POST   /api/auth/password/reset    # Reset password
```

### Notification Endpoints

```
GET    /api/notifications          # Get user notifications
PUT    /api/notifications/:id/read # Mark notification as read
DELETE /api/notifications/:id      # Delete notification
```

## Server-Side Implementation

### API Route Handlers

Next.js API routes are implemented with appropriate handlers:

```typescript
// Example API route handler
export async function GET(req: Request) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());
    
    // Process the request through the manager layer
    const data = await QuotationManager.getQuotations(params);
    
    // Return successful response
    return NextResponse.json({ 
      success: true, 
      data 
    });
  } catch (error) {
    // Error handling
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.statusCode || 500 }
    );
  }
}
```

### Manager Layer

Managers handle data access and database operations:

```typescript
// Example manager implementation
export class QuotationManager {
  static async getQuotations(params) {
    const { search, status, customer, page = 1, limit = 10 } = params;
    
    // Build query conditions
    const query: any = { isDeleted: false };
    if (search) query.$text = { $search: search };
    if (status) query.status = status;
    if (customer) query.customer = new mongoose.Types.ObjectId(customer);
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    const quotations = await Quotation.find(query)
      .populate('customer')
      .populate('status')
      .sort({ createdOn: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Quotation.countDocuments(query);
    
    return {
      data: quotations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    };
  }
  
  // Additional methods for CRUD operations
}
```

### Service Layer

Services encapsulate complex business logic:

```typescript
// Example service implementation
export class QuotationService {
  static async createQuotation(data, userId) {
    // Validate input data
    // Generate quote number
    const quoteNo = await this.generateQuoteNumber();
    
    // Create quotation record
    const quotation = await QuotationManager.createQuotation({
      ...data,
      quoteNo,
      createdBy: userId
    });
    
    // Trigger approval workflow if needed
    await ApprovalService.initiateApproval(quotation._id, 'quotation');
    
    // Send notifications
    await NotificationService.sendNotification({
      title: 'New Quotation Created',
      message: `Quotation ${quoteNo} has been created and requires review`,
      type: 'quotation',
      users: await this.getReviewerIds()
    });
    
    return quotation;
  }
  
  // Additional business logic methods
}
```

## Authentication and Authorization

### Authentication Strategies

The API implements multiple authentication strategies:

1. **Credentials Authentication**: Username and password login
2. **JWT Token Authentication**: For API requests
3. **Session Authentication**: For web interface

### Authorization Middleware

API endpoints are protected by authorization middleware:

```typescript
// Example authorization middleware
export async function authorize(req, res, next) {
  try {
    // Get token from request
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user information
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
```

## Error Handling

### Standardized Error Responses

All API endpoints return consistent error responses:

```typescript
{
  success: false,
  message: "Error message describing the issue",
  code: "ERROR_CODE",
  details: {} // Optional additional information
}
```

### Custom Error Classes

The application defines custom error classes:

```typescript
export class AppError extends Error {
  statusCode: number;
  code: string;
  
  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation error', details = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}
```

## Socket.IO Integration

The application uses Socket.IO for real-time updates:

```typescript
// Socket.IO server initialization
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  // Handle user authentication
  socket.on("authenticate", (token) => {
    try {
      const user = verifyToken(token);
      socket.userId = user.id;
      socket.join(`user:${user.id}`);
      socket.emit("authenticated");
    } catch (error) {
      socket.emit("authentication_error", error.message);
    }
  });
  
  // Handle notifications
  socket.on("subscribe_notifications", () => {
    if (socket.userId) {
      socket.join(`notifications:${socket.userId}`);
    }
  });
});

// Emit notification from anywhere in the application
export function sendNotification(userId, notification) {
  io.to(`user:${userId}`).emit("notification", notification);
}
```

## API Documentation

### Swagger/OpenAPI Integration

The application includes API documentation using OpenAPI:

```typescript
// OpenAPI schema definition
const openApiSchema = {
  openapi: '3.0.0',
  info: {
    title: 'Acero Applications API',
    version: '1.0.0',
    description: 'API documentation for Acero Applications'
  },
  servers: [
    {
      url: '/api',
      description: 'API Server'
    }
  ],
  paths: {
    // API path definitions
  },
  components: {
    // Schema components
  }
};
```

## Performance Optimization

### Caching Strategies

The API implements several caching strategies:

1. **Client-side Caching**: RTK Query caching for frontend data
2. **Response Caching**: Cache-Control headers for appropriate endpoints
3. **Query Optimization**: Optimized database queries with selective population

### Pagination and Filtering

All list endpoints implement pagination and filtering:

```typescript
// Example pagination implementation
export async function getList(model, query, options) {
  const { page = 1, limit = 10, sort = '-createdOn' } = options;
  const skip = (page - 1) * limit;
  
  const data = await model.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));
    
  const total = await model.countDocuments(query);
  
  return {
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  };
}
```

## Best Practices for API Usage

1. **Error Handling**:
   - Always check for error responses
   - Handle different error types appropriately
   - Implement proper error logging

2. **Performance Optimization**:
   - Use appropriate pagination and filtering
   - Limit fields returned using projection
   - Optimize population for nested data

3. **Security Considerations**:
   - Always validate input data
   - Use proper authentication for protected endpoints
   - Implement rate limiting for public endpoints

4. **Versioning Strategy**:
   - Consider API versioning for breaking changes
   - Maintain backward compatibility when possible
   - Document API changes comprehensively
