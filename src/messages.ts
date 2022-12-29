export class APIError extends Error {
  description?: string;
}

export class UserNotAuthorizedError extends APIError { description = "User is not authorized" }
export class MessageNotFoundError extends APIError { description = "Message not found" }
