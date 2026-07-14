/** Response contract shared by current and legacy booking APIs. */
export type BookingsResponse<T> = T[] | { bookings: T[] };

/** Normalize both API shapes without importing React Native or network code. */
export function normalizeBookingsResponse<T>(response: BookingsResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return Array.isArray(response?.bookings) ? response.bookings : [];
}
