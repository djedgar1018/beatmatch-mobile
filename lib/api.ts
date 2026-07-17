import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { normalizeBookingsResponse, type BookingsResponse } from './bookings-contract';

const BASE_URL = 'https://beat-match-production.up.railway.app';

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

type ApiFetchOptions = RequestInit & {
  /** Set false for public endpoints so a guest is not pushed to login. */
  authRequired?: boolean;
  /** Set false for public endpoints to avoid stale tokens breaking guest browsing. */
  includeAuthToken?: boolean;
};

async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { authRequired = true, includeAuthToken = true, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Attach token from storage if available (React Native cookies unreliable)
  if (includeAuthToken) {
    try {
      const token = await AsyncStorage.getItem('api_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch (_) {}
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
    credentials: includeAuthToken ? 'include' : 'omit',
  });

  if (res.status === 401) {
    if (authRequired) {
      await AsyncStorage.multiRemove(['auth_user', 'api_token']);
      // Avoid redirect loop — only redirect if not already on auth screen
      try { router.replace('/auth'); } catch (_) {}
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'DJ' | 'VENUE' | 'ADMIN';
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'DJ' | 'VENUE';
}

export interface AuthResponse {
  token?: string;
  user: AuthUser;
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  const raw = await apiFetch<Record<string, unknown>>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  // Server returns flat user OR {user: AuthUser} — normalize both
  const user = (raw.user as AuthUser) ?? (raw as unknown as AuthUser);
  // Normalize userType to uppercase
  if (user.userType) user.userType = (user.userType as string).toUpperCase() as 'DJ' | 'VENUE' | 'ADMIN';
  // Save token if provided
  const token = (raw.apiToken ?? raw.token) as string | undefined;
  if (token) await AsyncStorage.setItem('api_token', token);
  return user;
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  const raw = await apiFetch<Record<string, unknown>>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const user = (raw.user as AuthUser) ?? (raw as unknown as AuthUser);
  if (user.userType) user.userType = (user.userType as string).toUpperCase() as 'DJ' | 'VENUE' | 'ADMIN';
  const token = (raw.apiToken ?? raw.token) as string | undefined;
  if (token) await AsyncStorage.setItem('api_token', token);
  return user;
}

export async function getMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/auth/user');
}

// ---------------------------------------------------------------------------
// DJs
// ---------------------------------------------------------------------------

export interface DJ {
  id: string;
  userId: string;
  stageName: string;
  bio?: string;
  location?: string;
  hourlyRate?: number;
  rating?: number;
  genres?: string[];
  yearsExperience?: number;
  profileImageUrl?: string;
  user?: { firstName: string; lastName: string; email: string };
}

export interface DJsResponse {
  djs: DJ[];
  total: number;
  page: number;
  limit: number;
}

export function useDJs(params?: { search?: string; genre?: string; page?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.genre) searchParams.set('genre', params.genre);
  if (params?.page) searchParams.set('page', String(params.page));

  const query = searchParams.toString();
  return useQuery<DJsResponse>({
    queryKey: ['djs', params],
    queryFn: () => apiFetch<DJsResponse>(`/api/djs/browse${query ? `?${query}` : ''}`, { authRequired: false, includeAuthToken: false }),
  });
}

export function useDJ(userId: string) {
  return useQuery<DJ>({
    queryKey: ['dj', userId],
    queryFn: () => apiFetch<DJ>(`/api/profiles/dj/${userId}`, { authRequired: false, includeAuthToken: false }),
    enabled: !!userId,
  });
}

// ---------------------------------------------------------------------------
// Media posts (TikTok-style video portfolio)
// ---------------------------------------------------------------------------

export interface MediaPost {
  id: string;
  userId: string;
  mediaUrl: string;
  thumbnailUrl?: string | null;
  mediaType: 'video' | 'image';
  title?: string | null;
  description?: string | null;
  tags?: string[] | null;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  createdAt: string;
}

export function useUserMedia(userId: string) {
  return useQuery<MediaPost[]>({
    queryKey: ['media', 'user', userId],
    queryFn: async () => {
      const { posts } = await apiFetch<{ posts: MediaPost[] }>(
        `/api/media/user/${userId}`,
        { authRequired: false, includeAuthToken: false }
      );
      return posts;
    },
    enabled: !!userId,
  });
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export interface Booking {
  id: string;
  eventName: string;
  eventDate: string;
  duration: number;
  description?: string;
  proposedRate?: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED' | 'CANCELLED';
  djId?: string;
  venueId?: string;
  djProfile?: { stageName: string; profileImageUrl?: string };
  venue?: { name?: string };
  createdAt: string;
}

export interface CreateBookingPayload {
  djUserId: string;
  eventName: string;
  eventDate: string;
  duration: number;
  description?: string;
  proposedRate?: number;
}

export function useBookings(enabled = true) {
  return useQuery<Booking[]>({
    queryKey: ['bookings'],
    queryFn: async () => normalizeBookingsResponse(
      await apiFetch<BookingsResponse<Booking>>('/api/bookings')
    ),
    enabled,
    // A booking can be created/changed outside this mounted tab. Keep the list
    // fresh instead of retaining the first cached response for the app session.
    refetchInterval: 30000,
    refetchOnReconnect: true,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) =>
      apiFetch<Booking>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantImageUrl?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export function useConversations(enabled = true) {
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: () => apiFetch<Conversation[]>('/api/messages/conversations'),
    enabled,
    refetchInterval: 45000,
  });
}

export function useMessages(conversationId: string, enabled = true) {
  return useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: () => apiFetch<Message[]>(`/api/messages/${conversationId}`),
    refetchInterval: 45000,
    enabled: !!conversationId && enabled,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { conversationId: string; content: string }) =>
      apiFetch<Message>('/api/messages', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  userId: string;
  stageName?: string;
  bio?: string;
  location?: string;
  hourlyRate?: number;
  genres?: string[];
  yearsExperience?: number;
  profileImageUrl?: string;
  userType?: 'DJ' | 'VENUE';
  user?: AuthUser;
}

export function useProfile(enabled = true) {
  return useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: () => apiFetch<Profile>('/api/profiles/me'),
    enabled,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Profile>) =>
      apiFetch<Profile>('/api/profiles/me', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
