# Data Models

## Overview

Acero Applications uses MongoDB as its database system, with Mongoose as the Object-Document Mapper (ODM). This document provides a comprehensive overview of the data models that form the foundation of the application, their relationships, and design patterns.

## Model Organization

The models in Acero Applications are organized into domain-specific directories:

```
/src/models
├── aqm/              # AQM (Acero Quotation Manager) models
├── approvals/        # Approval workflow models
├── chat/             # Chat and messaging models
├── hiring/           # Hiring process models
├── itapplications/   # IT Applications models
├── master/           # Master data models
├── notification/     # Notification models
├── sml/              # Shared Media Library models
└── ticket/           # Ticket system models
```

## Core Model Design Patterns

### 1. Base Document Structure

Most models in the application follow a consistent base structure:

```typescript
{
  // Unique identifier
  _id: mongoose.Schema.Types.ObjectId,
  
  // Common metadata fields
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdOn: { type: Date, default: Date.now },
  modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  modifiedOn: { type: Date },
  isDeleted: { type: Boolean, default: false },
  
  // Domain-specific fields
  // ...
}
```

### 2. Reference and Embedding Strategies

The application uses a mix of strategies for modeling relationships:

- **References**: Used for many-to-one and many-to-many relationships
- **Embedded Documents**: Used for tightly coupled one-to-many relationships
- **Denormalization**: Strategic data duplication for performance optimization

### 3. Soft Delete Pattern

Instead of physically removing records, most models implement a soft delete pattern using the `isDeleted` flag.

## AQM Models

### QuotationModel (`aqm/QuotationModel.model.ts`)

Central model for storing quotation data:

```typescript
{
  quoteNo: String,
  revision: Number,
  quoteDate: Date,
  status: { type: String, ref: 'QuoteStatus' },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerType: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerType' },
  projectName: String,
  projectType: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectType' },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  // Additional fields for quotation details, pricing, etc.
}
```

### ProposalRevisions (`aqm/ProposalRevisions.model.ts`)

Tracks revisions for proposals:

```typescript
{
  proposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal' },
  revNo: Number,
  revDate: Date,
  description: String,
  fileLocation: String,
  // Additional revision metadata
}
```

### Proposals (`aqm/Proposals.model.ts`)

Stores proposal document information:

```typescript
{
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  proposalNo: String,
  proposalDate: Date,
  fileName: String,
  fileLocation: String,
  // Additional proposal metadata
}
```

## Master Data Models

### User (`master/User.model.ts`)

Core user model with authentication and profile information:

```typescript
{
  username: String,
  password: String,
  email: String,
  firstName: String,
  lastName: String,
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  designation: { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
  // Additional user properties
}
```

### Organization Hierarchy Models

Models that define the organizational structure:

- **Department**: Organizational departments
- **Designation**: Job positions and titles
- **Role**: User roles and permissions
- **Team**: Team structures and composition
- **TeamMember**: Team membership associations

### Reference Data Models

Models for standardized reference data:

- **Currency**: Currency codes and exchange rates
- **Country/Region/Continent**: Geographic hierarchy
- **IndustryType**: Industry categorizations
- **BuildingType**: Building structure types
- **ProjectType**: Project classification
- **QuoteStatus**: Status values for quotations

## IT Applications Models

### AccountMaster (`itapplications/AccountMaster.model.ts`)

Manages IT service accounts:

```typescript
{
  accountName: String,
  accountNumber: String,
  providerType: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderType' },
  startDate: Date,
  endDate: Date,
  status: String,
  // Additional account details
}
```

### UsageDetail (`itapplications/UsageDetail.model.ts`)

Tracks usage of IT services:

```typescript
{
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountMaster' },
  period: String,
  usageAmount: Number,
  usageDate: Date,
  billAmount: Number,
  // Additional usage metrics
}
```

## Ticket System Models

### Ticket (`ticket/Ticket.model.ts`)

Core ticket tracking model:

```typescript
{
  ticketNo: String,
  title: String,
  description: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketCategory' },
  priority: String,
  status: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate: Date,
  // Additional ticket fields
}
```

### TicketTask (`ticket/TicketTask.model.ts`)

Subtasks associated with tickets:

```typescript
{
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  description: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: String,
  dueDate: Date,
  completionDate: Date,
  // Additional task properties
}
```

## SML Models

### SMLFile (`sml/SMLFile.model.ts`)

Tracks media file metadata:

```typescript
{
  fileName: String,
  originalName: String,
  mimeType: String,
  size: Number,
  path: String,
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'SmlGroup' },
  subGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'SmlSubGroup' },
  tags: [String],
  // Additional file metadata
}
```

### SmlGroup and SmlSubGroup (`sml/Group.model.ts`, `sml/SmlSubGroup.model.ts`)

Organizational structure for media files:

```typescript
// Group
{
  name: String,
  description: String,
  accessRights: [{
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    permission: String
  }]
}

// SubGroup
{
  name: String,
  description: String,
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'SmlGroup' }
}
```

## HR Module Models

### User-related HR Models

Extended user information models:

- **UserPersonalDetails**: Personal information
- **UserBenefits**: Benefits and compensation
- **UserEmploymentDetails**: Employment specifics
- **UserVisaDetails**: Visa and work permit information
- **UserIdentification**: Identification documents

## Approval System Models

### ApprovalFlow (`approvals/ApprovalFlow.model.ts`)

Defines approval workflows:

```typescript
{
  name: String,
  description: String,
  entityType: String,
  steps: [{
    level: Number,
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    isRequired: Boolean
  }]
}
```

## Notification Model

### Notification (`notification/Notification.ts`)

Manages system notifications:

```typescript
{
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  message: String,
  type: String,
  isRead: { type: Boolean, default: false },
  relatedEntity: {
    type: String,
    id: mongoose.Schema.Types.ObjectId
  }
}
```

## Database Indexing Strategy

Important indices are defined on:

- Frequently queried fields
- Fields used in sorting operations
- Foreign key references
- Text fields requiring text search

Examples:
- `User` model: Indexed on `username` and `email`
- `Quotation` model: Indexed on `quoteNo`, `customer`, and `status`
- `Ticket` model: Indexed on `ticketNo`, `status`, and `assignedTo`

## Data Validation

Validation is implemented at multiple levels:

1. **Schema-level Validation**: Using Mongoose schema validators
2. **Application-level Validation**: Using Zod schemas in API routes
3. **UI-level Validation**: Using React Hook Form with Zod resolvers

## Best Practices for Model Usage

1. **Consistent Reference Usage**:
   - Use consistent population patterns
   - Consider performance implications of deep populations

2. **Transaction Handling**:
   - Use MongoDB transactions for operations spanning multiple collections
   - Ensure proper error handling and rollback

3. **Schema Evolution**:
   - Plan for backward compatibility when modifying schemas
   - Use migration scripts for significant schema changes

4. **Performance Considerations**:
   - Be mindful of document size and nesting depth
   - Use projection to limit fields returned by queries
   - Use appropriate indices for common query patterns
