import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeBookingsResponse } from '../lib/bookings-contract.ts';

const currentBooking = {
  id: 'booking-jada-current',
  eventName: 'Jada booking',
  eventDate: '2026-07-18T20:00:00.000Z',
  duration: 4,
  status: 'accepted',
  createdAt: '2026-07-13T20:00:00.000Z',
};

test('normalizes the production wrapped bookings response', () => {
  assert.deepEqual(normalizeBookingsResponse({ bookings: [currentBooking] }), [currentBooking]);
});

test('preserves the legacy direct-array response', () => {
  assert.deepEqual(normalizeBookingsResponse([currentBooking]), [currentBooking]);
});

test('fails safely for a malformed wrapped payload', () => {
  assert.deepEqual(normalizeBookingsResponse({ bookings: null }), []);
});
