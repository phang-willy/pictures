export type ApiSuccess<T extends Record<string, unknown> = Record<string, never>> = {
  success: true;
} & T;

export type ApiError = {
  success: false;
  message?: string;
  field?: string;
  code?: string;
};

export function success<T extends Record<string, unknown> = Record<string, never>>(
  payload?: T,
): ApiSuccess<T> {
  return {
    success: true,
    ...(payload ?? ({} as T)),
  };
}

export function failure(payload?: Omit<ApiError, 'success'>): ApiError {
  return {
    success: false,
    ...(payload ?? {}),
  };
}
