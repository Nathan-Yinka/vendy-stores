export interface StandardResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export const successResponse = <T>(data: T, message = "OK"): StandardResponse<T> => ({
  success: true,
  message,
  data,
});
