export const CONSTANTS = {
  ADMIN_SESSION_ID: 'admin_session',
  TOKEN_FILE_PATH: 'tokens.json',
  TOKEN_EXPIRY_BUFFER_MS: 5 * 60 * 1000, // 5 minutes
  ADSENSE_SCOPES: ['https://www.googleapis.com/auth/adsense.readonly'],
  API_VERSION: 'v2',
  
  HTTP_STATUS: {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    SERVICE_UNAVAILABLE: 503,
    INTERNAL_SERVER_ERROR: 500
  },
  
  ERRORS: {
    ADMIN_AUTH_REQUIRED: 'Admin authentication required',
    SERVICE_UNAVAILABLE: 'Service unavailable',
    INVALID_PARAMS: 'Invalid parameters',
    TOKEN_REFRESH_FAILED: 'Token refresh failed',
    FETCH_FAILED: 'Failed to fetch data'
  }
};