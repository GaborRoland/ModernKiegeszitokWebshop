import express from 'express';
import { authMiddleware, adminMiddleware } from '../auth.js';

export const createOrderRoutes = (db) => {
  const router = express.Router();

  // Új rendelés létrehozása
  router.post('/', authMiddleware, (req, res) => {
    const { items, total_price, discount_percent = 0, coupon_code = '' } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Rendeléshez termékek szükségesek' });
    }

    db.run(
      'INSERT INTO orders (user_id, items, total_price, discount_percent, coupon_code, status) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, JSON.stringify(items), total_price, discount_percent, coupon_code, 'pending'],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Rendelés létrehozása sikertelen' });
        }

        res.json({
          success: true,
          orderId: this.lastID,
          message: 'Rendelés sikeresen létrehozva'
        });
      }
    );
  });

  // Felhasználó rendeléseit lekérni
  router.get('/user/:userId', authMiddleware, (req, res) => {
    // Ellenőrizni, hogy a felhasználó csak a saját rendeléseit lekérheti
    if (parseInt(req.params.userId) !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Hozzáférés megtagadva' });
    }

    db.all(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.params.userId],
      (err, orders) => {
        if (err) {
          return res.status(500).json({ error: 'Adatbázis hiba' });
        }

        // JSON parse az items
        const parsedOrders = orders.map(order => ({
          ...order,
          items: JSON.parse(order.items)
        }));

        res.json(parsedOrders);
      }
    );
  });

  // Összes rendelés (admin)
  router.get('/', authMiddleware, adminMiddleware, (req, res) => {
    db.all(
      'SELECT o.*, u.username FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC',
      (err, orders) => {
        if (err) {
          return res.status(500).json({ error: 'Adatbázis hiba' });
        }

        const parsedOrders = orders.map(order => ({
          ...order,
          items: JSON.parse(order.items)
        }));

        res.json(parsedOrders);
      }
    );
  });

  // Rendelés státusza frissítése (admin)
  router.put('/:id/status', authMiddleware, adminMiddleware, (req, res) => {
    const { status } = req.body;

    const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Érvénytelen státusz' });
    }

    db.run(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, req.params.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Státusz frissítése sikertelen' });
        }

        res.json({
          success: true,
          message: 'Rendelés státusza frissítve'
        });
      }
    );
  });

  return router;
};
