import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

const BASE_URL = 'https://beat-match-production.up.railway.app';

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await AsyncStorage.getItem('auth_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    router.replace('/auth');
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

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
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
    queryFn: () => apiFetch<DJsResponse>(`/api/djs/browse${query ? `?${query}` : ''}`),
  });
}

export function useDJ(userId: string) {
  return useQuery<DJ>({
    queryKey: ['dj', userId],
    queryFn: () => apiFetch<DJ>(`/api/profiles/dj/${userId}`),
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

export function useBookings() {
  return useQuery<Booking[]>({
    queryKey: ['bookings'],
    queryFn: () => apiFetch<Booking[]>('/api/bookings'),
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

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: () => apiFetch<Conversation[]>('/api/messages/conversations'),
    refetchInterval: 10000,
  });
}

export function useMessages(conversationId: string) {
  return useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: () => apiFetch<Message[]>(`/api/messages/${conversationId}`),
    refetchInterval: 10000,
    enabled: !!conversationId,
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

export function useProfile() {
  return useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: () => apiFetch<Profile>('/api/profiles/me'),
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
