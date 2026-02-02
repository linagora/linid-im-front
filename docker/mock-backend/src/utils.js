/**
 * Creates a standardized error response object.
 * @param status The HTTP status code of the error.
 * @param error The message describing the error.
 * @param errorKey A key identifying the type of error.
 * @param errorContext Additional context about the error.
 * @param details Additional details to include in the error response.
 * @returns A standardized error response object.
 */
export function createErrorResponse(
  status,
  error,
  errorKey,
  errorContext = {},
  details = {}
) {
  return {
    error,
    errorKey,
    errorContext,
    status: String(status),
    timestamp: Date.now(),
    ...details,
  };
}
