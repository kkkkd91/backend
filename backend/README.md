# Social Scribe Backend API

This is the backend API for the Social Scribe platform, a tool for creating and managing LinkedIn content. The API provides endpoints for user authentication, onboarding, and workspace management.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [Onboarding](#onboarding)
  - [Workspaces](#workspaces)
- [Database Models](#database-models)
- [Authentication Flow](#authentication-flow)
- [OAuth Integration](#oauth-integration)
- [Email Verification](#email-verification)
- [Team Workspaces](#team-workspaces)

## Features

- **Authentication System**
  - Email/password registration with verification
  - JWT-based authentication
  - Social login with Google and LinkedIn OAuth
  - Password reset functionality

- **User Onboarding**
  - Multi-step onboarding process
  - Progress tracking and resumption
  - Workspace type selection (individual or team)
  - User preferences collection

- **Workspace Management**
  - Individual and team workspaces
  - Role-based access control (Admin, Writer, Viewer)
  - Team member invitations via email
  - Workspace settings management

## Tech Stack

- **Server**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js, JWT, OAuth 2.0
- **Email**: Nodemailer for transactional emails
- **Validation**: Express-validator for input validation
- **Security**: Helmet for HTTP headers, bcrypt for password hashing

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Google & LinkedIn developer accounts for OAuth

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd social-scribe-backend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables (see section below)

4. Start the development server
```bash
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory based on the `.env.example` template:

```
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/social-scribe

# JWT Secret
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRES_IN=30d

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_CALLBACK_URL=http://localhost:5000/api/auth/linkedin/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## API Documentation

### Authentication

#### Register New User
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**: Returns user details and JWT tokens
- **Note**: Sends a verification code to the user's email

#### Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**: Returns user details and JWT tokens

#### Verify Email
- **URL**: `/api/auth/verify-email`
- **Method**: `POST`
- **Authentication**: Bearer Token
- **Body**:
  ```json
  {
    "code": "1234"
  }
  ```
- **Response**: Confirms email verification

#### OAuth Login
- **Google**: `/api/auth/google`
- **LinkedIn**: `/api/auth/linkedin`

### Onboarding

#### Update Onboarding Step
- **URL**: `/api/users/onboarding/step`
- **Method**: `PUT`
- **Authentication**: Bearer Token
- **Body**:
  ```json
  {
    "step": 2
  }
  ```

#### Complete Onboarding
- **URL**: `/api/users/onboarding/complete`
- **Method**: `POST`
- **Authentication**: Bearer Token
- **Body**:
  ```json
  {
    "workspaceName": "My Workspace"
  }
  ```
- **Response**: Creates a workspace and completes onboarding

### Workspaces

#### Get All Workspaces
- **URL**: `/api/workspaces`
- **Method**: `GET`
- **Authentication**: Bearer Token
- **Response**: List of workspaces user has access to

#### Create Workspace
- **URL**: `/api/workspaces`
- **Method**: `POST`
- **Authentication**: Bearer Token
- **Body**:
  ```json
  {
    "name": "Team Workspace",
    "type": "team"
  }
  ```

#### Invite User to Workspace
- **URL**: `/api/workspaces/:workspaceId/invite`
- **Method**: `POST`
- **Authentication**: Bearer Token (Admin only)
- **Body**:
  ```json
  {
    "email": "team@example.com",
    "role": "writer"
  }
  ```
- **Response**: Sends invitation email to the user

## Database Models

### User Model
Stores user information including:
- Authentication details
- Onboarding progress
- Personal preferences
- Email verification status

### Workspace Model
Manages workspace data including:
- Workspace type (individual or team)
- Owner and members
- Permission settings
- Workspace preferences

## Authentication Flow

1. **Registration**:
   - User registers with email/password or OAuth
   - For email registration, a 4-digit verification code is sent
   - User receives JWT tokens regardless of verification status

2. **Email Verification**:
   - User submits the 4-digit code
   - Email is marked as verified upon successful verification

3. **Login**:
   - User can log in with verified credentials
   - OAuth logins are pre-verified
   - JWT tokens (access + refresh) are issued

4. **Token Refresh**:
   - Access token expires after the configured time
   - Refresh token can be used to obtain a new access token

## OAuth Integration

The backend supports both Google and LinkedIn authentication:

1. User initiates OAuth flow via frontend
2. Backend redirects to OAuth provider
3. Provider redirects back with authentication code
4. Backend exchanges code for user information
5. User is created or updated in the database
6. JWT tokens are generated and sent to frontend

## Email Verification

New users registering with email/password receive a 4-digit verification code:

1. Code is generated and stored in the user record
2. Email is sent via configured email service
3. Code expires after 30 minutes
4. User can request a new code if needed

## Team Workspaces

Team workspaces enable collaboration with different permission levels:

1. **Roles**:
   - **Admin**: Can manage workspace settings and invite users
   - **Writer**: Can create and edit content
   - **Viewer**: Can only view content

2. **Invitation Process**:
   - Admin invites user via email
   - Invitee receives email with invitation link
   - Upon acceptance, user is added to workspace
   - Non-registered users are prompted to register 