export class AppError extends Error {
  constructor(
    public code: number,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.details && { details: this.details }),
    };
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', details?: any) {
    super(1003, `${resource} not found`, 404, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(2000, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(2004, message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(3000, message, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(2001, message, 401);
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super(2002, 'Token expired', 401);
  }
}

export class DuplicateError extends AppError {
  constructor(resource: string, field: string) {
    super(3004, `${resource} with this ${field} already exists`, 409);
  }
}

export class FileUploadError extends AppError {
  constructor(message: string, details?: any) {
    super(5002, message, 500, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', details?: any) {
    super(6000, message, 500, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, details?: any) {
    super(7000, `${service} service error`, 502, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(7001, message, 429);
  }
}
