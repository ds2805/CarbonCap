// API service to connect to Flask backend
// Use your computer's IP address when running on real device
// For simulator/emulator, use http://127.0.0.1:5001
const API_BASE_URL = 'http://10.216.137.16:5001';

export interface User {
  id: number;
  username: string;
  role: string;
}

export interface Credit {
  id: number;
  owner_id: number;
  origin: string;
  signed: boolean;
  signature?: string;
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

// Auth APIs
export async function login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (response.ok) {
      // Get user info from session
      const userResponse = await fetch(`${API_BASE_URL}/api/me`, {
        credentials: 'include',
      });
      if (userResponse.ok) {
        const user = await userResponse.json();
        return { success: true, user };
      }
    }
    return { success: false, error: 'Login failed' };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

// Get all users (for buyer lookup)
export async function getAllUsers(): Promise<User[]> {
  const response = await fetch(`${API_BASE_URL}/api/users`, {
    credentials: 'include',
  });
  if (response.ok) {
    return await response.json();
  }
  return [];
}

export async function register(username: string, password: string, role: string): Promise<{ success: boolean; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('role', role);

    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      return { success: true };
    }
    const error = await response.text();
    return { success: false, error };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE_URL}/logout`, {
    method: 'GET',
    credentials: 'include',
  });
}

// Trader APIs
export async function getTraderCredits(): Promise<Credit[]> {
  const response = await fetch(`${API_BASE_URL}/trader/api/credits`, {
    credentials: 'include',
  });
  if (response.ok) {
    return await response.json();
  }
  return [];
}

export async function getTraderTransactions(): Promise<Transaction[]> {
  const response = await fetch(`${API_BASE_URL}/trader/api/transactions`, {
    credentials: 'include',
  });
  if (response.ok) {
    return await response.json();
  }
  return [];
}

export async function submitTransaction(creditId: number, receiverId: number): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/trader/transactions/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ credit_id: creditId, receiver_id: receiverId }),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, transaction: data };
    }
    return { success: false, error: data.reason || 'Transaction failed' };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

// Verifier APIs
export async function getVerifierCredits(): Promise<{ unsigned: Credit[]; signed: Credit[] }> {
  const response = await fetch(`${API_BASE_URL}/verifier/api/credits`, {
    credentials: 'include',
  });
  if (response.ok) {
    return await response.json();
  }
  return { unsigned: [], signed: [] };
}

export async function submitCredit(ownerId: number, origin: string): Promise<{ success: boolean; credit?: Credit; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/verifier/credits/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ owner_id: ownerId, origin }),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, credit: data };
    }
    return { success: false, error: data.reason || 'Credit submission failed' };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

export async function signCredit(creditId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/verifier/credits/${creditId}/sign`, {
      method: 'POST',
      credentials: 'include',
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true };
    }
    return { success: false, error: data.reason || 'Signing failed' };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

// Admin APIs
export async function getAdminUsers(): Promise<User[]> {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    credentials: 'include',
  });
  if (response.ok) {
    return await response.json();
  }
  return [];
}

export async function getAdminTransactions(): Promise<Transaction[]> {
  const response = await fetch(`${API_BASE_URL}/admin/transactions`, {
    credentials: 'include',
  });
  if (response.ok) {
    return await response.json();
  }
  return [];
}

export async function getAuditLog(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/admin/audit-log`, {
    credentials: 'include',
  });
  if (response.ok) {
    return await response.json();
  }
  return [];
}
