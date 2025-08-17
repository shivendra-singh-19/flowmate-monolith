interface ErrorDetails {
  message: string;
  code?: string;
  details?: any; // Can be any additional information
}

class BaseError extends Error {
  public code?: string;
  public details?: any;

  constructor({ message, code, details }: ErrorDetails) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  constructor(details: any) {
    super({ message: 'Validation Error', code: 'VALIDATION_ERROR', details });
  }
}

export class NotFoundError extends BaseError {
  constructor(details: any) {
    super({ message: 'Not Found', code: 'NOT_FOUND_ERROR', details });
  }
}

export class AuthenticationError extends BaseError {
  constructor(details: any) {
    super({
      message: 'Authentication Error',
      code: 'AUTHENTICATION_ERROR',
      details,
    });
  }
}

export class AuthorizationError extends BaseError {
  constructor(details: any) {
    super({
      message: 'Authorization Error',
      code: 'AUTHORIZATION_ERROR',
      details,
    });
  }
}

export class InternalServerError extends BaseError {
  constructor(details: any) {
    super({
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
      details,
    });
  }
}
