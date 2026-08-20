export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request') {
    super(400, message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}

/**
 * HTTP 402 Payment Required — plan limit hit. Carries structured details
 * so the frontend can render an inline upgrade prompt showing what was
 * blocked, the current cap, and the next tier that unlocks it.
 */
export interface PlanLimitDetails {
  resource: 'branches' | 'staff' | 'waMsgs';
  currentPlan: string;
  limit: number;
  current: number;
  upgradeTo: string;
}

export class PlanLimitError extends ApiError {
  details: PlanLimitDetails;
  constructor(details: PlanLimitDetails, message?: string) {
    super(402, message || `${details.currentPlan} plan limit reached (${details.current}/${details.limit} ${details.resource}). Upgrade to ${details.upgradeTo} to continue.`);
    this.details = details;
  }
}
