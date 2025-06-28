export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public status: string = 'error'
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400, 'fail');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401, 'fail');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403, 'fail');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'fail');
  }
} 