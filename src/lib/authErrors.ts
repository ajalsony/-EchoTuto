/**
 * Authentication Error Detection and Translation Utility
 * Specifically handles Supabase email rate limits and duplicate account detection.
 */

export const RATE_LIMIT_MESSAGE =
  'Too many verification emails have been requested. Please wait before trying again. You can configure a custom SMTP provider for higher sending limits.';

export const USER_ALREADY_EXISTS_MESSAGE =
  'An account with this email address is already registered. If your verification email was delayed, please wait before requesting another or proceed to Sign In.';

/**
 * Detects whether an error is due to Supabase email rate limits or HTTP 429.
 */
export function isEmailRateLimitError(error: unknown): boolean {
  if (!error) return false;
  const err = error as { code?: string; status?: number; message?: string };
  const code = (err.code || '').toLowerCase();
  const msg = (err.message || '').toLowerCase();
  const status = err.status;

  return (
    status === 429 ||
    code === 'over_email_send_rate_limit' ||
    code.includes('rate_limit') ||
    msg.includes('over_email_send_rate_limit') ||
    msg.includes('email rate limit') ||
    msg.includes('rate limit exceeded') ||
    msg.includes('too many requests') ||
    msg.includes('only request this once every')
  );
}

/**
 * Detects whether an error indicates the account/email already exists.
 */
export function isUserAlreadyExistsError(error: unknown): boolean {
  if (!error) return false;
  const err = error as { code?: string; status?: number; message?: string };
  const code = (err.code || '').toLowerCase();
  const msg = (err.message || '').toLowerCase();

  return (
    code === 'user_already_exists' ||
    code === 'user_already_registered' ||
    msg.includes('user already registered') ||
    msg.includes('user already exists') ||
    msg.includes('email already in use')
  );
}

/**
 * Translates Supabase auth errors into clear, user-facing error messages.
 */
export function formatAuthError(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';
  if (isEmailRateLimitError(error)) {
    return RATE_LIMIT_MESSAGE;
  }
  if (isUserAlreadyExistsError(error)) {
    return USER_ALREADY_EXISTS_MESSAGE;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}
