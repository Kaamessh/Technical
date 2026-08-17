export function extractErrorMessage(err: any, fallback: string = 'An error occurred'): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;

  const serverError = err.response?.data?.error || err.response?.data?.message || err.response?.data;
  if (typeof serverError === 'string') return serverError;
  if (serverError && typeof serverError === 'object') {
    if (typeof serverError.message === 'string') return serverError.message;
    if (typeof serverError.error === 'string') return serverError.error;
    try {
      return JSON.stringify(serverError);
    } catch (e) {
      return fallback;
    }
  }

  if (typeof err.message === 'string') return err.message;
  return fallback;
}
