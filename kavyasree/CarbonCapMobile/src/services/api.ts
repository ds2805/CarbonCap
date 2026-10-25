// CarbonCap Mobile API Service
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function resolveDefaultBaseUrl(): string {
  if (Platform.OS === 'web') {
    return 'http://127.0.0.1:5001';
  }

  // If running in Expo Go on mobile, extract host IP that phone connected to
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:5001`;
    }
  }

  // Fallback to computer's Wi-Fi network IP
  return 'http://192.168.1.6:5001';
}

let currentApiBaseUrl = resolveDefaultBaseUrl();

export function getApiBaseUrl(): string {
  return currentApiBaseUrl;
}

export function setApiBaseUrl(url: string) {
  let cleaned = url.trim();
  if (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1);
  }
  currentApiBaseUrl = cleaned;
}

export interface User {
  id: number;
  username: string;
  role: string;
  created_at?: string;
}

export interface Credit {
  id: number;
  owner_id: number;
  origin: string;
  signed: boolean;
  signature?: string;
  created_at?: string;
}

export interface Transaction {
  id: number;
  credit_id: number;
  sender_id: number;
  receiver_id: number;
  status: string;
  timestamp: string;
  prev_hash?: string;
  hash?: string;
  anomaly_score?: number;
}

export interface AuditLogItem {
  id: number;
  event_type: string;
  actor_id: number | null;
  details: string;
  timestamp: string;
}

// Active user session state to guarantee mobile session persistence over LAN
let activeUser: User | null = null;

export function setActiveUser(user: User | null) {
  activeUser = user;
}

export function getActiveUser(): User | null {
  return activeUser;
}

function getHeaders(contentType: boolean = false): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }
  if (activeUser?.id) {
    headers['X-User-Id'] = String(activeUser.id);
    headers['X-User-Role'] = activeUser.role;
  }
  return headers;
}

// ==================== AUTH APIs ====================

export async function login(
  username: string, 
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch(`${currentApiBaseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok && data.id) {
      activeUser = data as User;
      return { success: true, user: data as User };
    }
    return { success: false, error: data.error || 'Invalid credentials' };
  } catch (error: any) {
    return { 
      success: false, 
      error: `Network error connecting to ${currentApiBaseUrl}. Make sure Flask backend is running.` 
    };
  }
}

export async function register(
  username: string, 
  password: string, 
  role: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch(`${currentApiBaseUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password, role }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true, user: data as User };
    }
    return { success: false, error: data.error || 'Registration failed' };
  } catch (error: any) {
    return { 
      success: false, 
      error: `Network error connecting to ${currentApiBaseUrl}.` 
    };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch(`${currentApiBaseUrl}/api/me`, {
      headers: getHeaders(false),
      credentials: 'include',
    });
    if (response.ok) {
      const u = await response.json();
      activeUser = u;
      return u;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const response = await fetch(`${currentApiBaseUrl}/api/users`, {
      headers: getHeaders(false),
      credentials: 'include',
    });
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch {
    return [];
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${currentApiBaseUrl}/logout`, {
      method: 'GET',
      headers: getHeaders(false),
      credentials: 'include',
    });
  } catch {}
  activeUser = null;
}

// ==================== TRADER APIs ====================

export async function getTraderCredits(): Promise<Credit[]> {
  try {
    const response = await fetch(`${currentApiBaseUrl}/trader/api/credits`, {
      headers: getHeaders(false),
      credentials: 'include',
    });
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch {
    return [];
  }
}

export async function getTraderTransactions(): Promise<Transaction[]> {
  try {
    const response = await fetch(`${currentApiBaseUrl}/trader/api/transactions`, {
      headers: getHeaders(false),
      credentials: 'include',
    });
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch {
    return [];
  }
}

export async function submitTransaction(
  creditId: number, 
  receiverId: number
): Promise<{ success: boolean; status?: string; transaction_id?: number; hash?: string; reason?: string; error?: string }> {
  try {
    const response = await fetch(`${currentApiBaseUrl}/trader/transactions/new`, {
      method: 'POST',
      headers: getHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ credit_id: creditId, receiver_id: receiverId }),
    });

    const data = await response.json();
    if (response.ok && data.status === 'valid') {
      return { 
        success: true, 
        status: data.status, 
        transaction_id: data.transaction_id, 
        hash: data.hash 
      };
    }
    return { 
      success: false, 
      status: data.status, 
      reason: data.reason || 'Transaction blocked by fraud engine',
      error: data.reason || 'Transaction failed' 
    };
  } catch (error: any) {
    return { success: false, error: 'Network error communicating with server' };
  }
}

// ==================== VERIFIER APIs ====================

export async function getVerifierCredits(): Promise<{ unsigned: Credit[]; signed: Credit[] }> {
  try {
    const response = await fetch(`${currentApiBaseUrl}/verifier/api/credits`, {
      headers: getHeaders(false),
      credentials: 'include',
    });
    if (response.ok) {
      return await response.json();
    }
    return { unsigned: [], signed: [] };
  } catch {
    return { unsigned: [], signed: [] };
  }
}

export async function submitCredit(
  ownerId: number, 
  origin: string
): Promise<{ success: boolean; status?: string; credit_id?: number; reason?: string; error?: string }> {
  try {
    const response = await fetch(`${currentApiBaseUrl}/verifier/credits/new`, {
      method: 'POST',
      headers: getHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ owner_id: ownerId, origin }),
    });

    const data = await response.json();
    if (response.ok && data.status === 'signed') {
      return { 
        success: true, 
        status: data.status, 
        credit_id: data.credit_id, 
        reason: data.reason 
      };
    }
    return { 
      success: false, 
      status: data.status, 
      reason: data.reason || 'Credit rejected by verifier engine',
      error: data.reason || 'Credit submission failed' 
    };
  } catch (error: any) {
    return { success: false, error: 'Network error communicating with server' };
  }
}

export async function signCredit(
  creditId: number
): Promise<{ success: boolean; status?: string; credit_id?: number; reason?: string; error?: string }> {
  try {
    const response = await fetch(`${currentApiBaseUrl}/verifier/credits/${creditId}/sign`, {
      method: 'POST',
      headers: getHeaders(true),
      credentials: 'include',
    });

    const data = await response.json();
    if (response.ok && data.status === 'signed') {
      return { 
        success: true, 
        status: data.status, 
        credit_id: data.credit_id, 
        reason: data.reason 
      };
    }
    return { 
      success: false, 
      status: data.status, 
      reason: data.reason || 'Signing rejected',
      error: data.reason || 'Signing failed' 
    };
  } catch (error: any) {
    return { success: false, error: 'Network error communicating with server' };
  }
}

// ==================== ADMIN APIs ====================

export async function getAdminUsers(): Promise<User[]> {
  try {
    const response = await fetch(`${currentApiBaseUrl}/admin/users`, {
      headers: getHeaders(false),
      credentials: 'include',
    });
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch {
    return [];
  }
}

export async function getAdminTransactions(): Promise<Transaction[]> {
  try {
    const response = await fetch(`${currentApiBaseUrl}/admin/transactions`, {
      headers: getHeaders(false),
      credentials: 'include',
    });
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch {
    return [];
  }
}

export async function getAuditLog(): Promise<AuditLogItem[]> {
  try {
    const response = await fetch(`${currentApiBaseUrl}/admin/audit-log`, {
      headers: getHeaders(false),
      credentials: 'include',
    });
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch {
    return [];
  }
}

export async function deactivateUser(userId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${currentApiBaseUrl}/admin/users/${userId}/deactivate`, {
      method: 'POST',
      headers: getHeaders(false),
      credentials: 'include',
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true };
    }
    return { success: false, error: data.reason || 'Failed to deactivate user' };
  } catch (error: any) {
    return { success: false, error: 'Network error' };
  }
}
