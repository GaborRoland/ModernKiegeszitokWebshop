const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// JWT token kezelés
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const apiService = {
  // Autentikáció - Regisztráció
  async register(username, email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Regisztráció sikertelen');
      }
      const data = await response.json();
      if (data.token) {
        setAuthToken(data.token);
      }
      return data;
    } catch (error) {
      console.error('Regisztráció hiba:', error);
      throw error;
    }
  },

  // Autentikáció - Bejelentkezés
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Bejelentkezés sikertelen');
      }
      const data = await response.json();
      if (data.token) {
        setAuthToken(data.token);
      }
      return data;
    } catch (error) {
      console.error('Bejelentkezés hiba:', error);
      throw error;
    }
  },

  // Autentikáció - Elfelejtett jelszó
  async resetPassword(email, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, newPassword }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Jelszó visszaállítás sikertelen');
      }
      return await response.json();
    } catch (error) {
      console.error('Jelszó visszaállítás hiba:', error);
      throw error;
    }
  },

  // Autentikáció - Kijelentkezés
  logout() {
    setAuthToken(null);
  },

  // Autentikáció - Token ellenőrzés
  async verifyToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        setAuthToken(null);
        throw new Error('Token érvénytelen');
      }
      return await response.json();
    } catch (error) {
      console.error('Token ellenőrzés hiba:', error);
      setAuthToken(null);
      throw error;
    }
  },

  // Termékek lekérése
  async getProducts() {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      if (!response.ok) {
        throw new Error('Hiba a termékek betöltésekor');
      }
      return await response.json();
    } catch (error) {
      console.error('API hiba:', error);
      throw error;
    }
  },

  // Egy termék lekérése ID alapján
  async getProductById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`);
      if (!response.ok) {
        throw new Error('Termék nem található');
      }
      return await response.json();
    } catch (error) {
      console.error('API hiba:', error);
      throw error;
    }
  },

  // Termékt értékelés - Értékelés hozzáadása
  async addReview(productId, rating, comment) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rating, comment }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Értékelés hozzáadása sikertelen');
      }
      return await response.json();
    } catch (error) {
      console.error('Értékelés hiba:', error);
      throw error;
    }
  },

  // Termékt értékelés - Értékelések lekérése
  async getProductReviews(productId) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`);
      if (!response.ok) {
        throw new Error('Értékelések betöltése sikertelen');
      }
      return await response.json();
    } catch (error) {
      console.error('API hiba:', error);
      throw error;
    }
  },

  // Rendelések - Új rendelés létrehozása
  async createOrder(items, totalPrice, discountPercent = 0, couponCode = '') {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ items, total_price: totalPrice, discount_percent: discountPercent, coupon_code: couponCode }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Rendelés létrehozása sikertelen');
      }
      return await response.json();
    } catch (error) {
      console.error('API hiba:', error);
      throw error;
    }
  },

  // Rendelések - Felhasználó rendeléseit lekérni
  async getUserOrders(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/user/${userId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Rendelések betöltése sikertelen');
      }
      return await response.json();
    } catch (error) {
      console.error('API hiba:', error);
      throw error;
    }
  },

  // Admin - Összes rendelés lekérése
  async getAllOrders() {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Rendelések betöltése sikertelen');
      }
      return await response.json();
    } catch (error) {
      console.error('API hiba:', error);
      throw error;
    }
  },

  // Admin - Rendelés státusza frissítése
  async updateOrderStatus(orderId, status) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Státusz frissítése sikertelen');
      }
      return await response.json();
    } catch (error) {
      console.error('API hiba:', error);
      throw error;
    }
  },

  // Admin - Statisztika lekérése
  async getAdminStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/dashboard/overview`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Statisztika betöltése sikertelen');
      }
      return await response.json();
    } catch (error) {
      console.error('API hiba:', error);
      throw error;
    }
  },

  // Admin - Összes felhasználó lekérése
  async getAllUsers() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Felhasználók betöltése sikertelen');
      }
      return await response.json();
    } catch (error) {
      console.error('API hiba:', error);
      throw error;
    }
  },

  // Admin - Felhasználó szerepkörének módosítása
  async updateUserRole(userId, role) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role }),
      });
      if (!response.ok) {
        throw new Error('Szerepkör frissítése sikertelen');
      }
      return await response.json();
    } catch (error) {
      console.error('API hiba:', error);
      throw error;
    }
  },
};