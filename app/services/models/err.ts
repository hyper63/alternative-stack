export class NotFoundError extends Error {
  public status = 404;
  constructor(message?: string) {
    super(message);
    this.message = this.message || "Not Found";
  }
}

export class ConflictError extends Error {
  public status = 409;
  constructor(message?: string) {
    super(message);
    this.message = this.message || "Conflict";
  }
}

export class UnauthorizedError extends Error {
  public status = 401;
  constructor(message?: string) {
    super(message);
    this.message = this.message || "Unauthorized";
  }
}
