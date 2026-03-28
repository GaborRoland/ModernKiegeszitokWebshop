import express from 'express';
import { authMiddleware, adminMiddleware } from '../auth.js';

export const createAdminRoutes = (db) => {
  const router = express.Router();

  // Összes felhasználó lekérése (admin)
  router.get('/users', authMiddleware, adminMiddleware, (req, res) => {
    db.all(
      'SELECT id, username, email, role, created_at FROM users',
      (err, users) => {
        if (err) {
          return res.status(500).json({ error: 'Adatbázis hiba' });
        }

        res.json(users);
      }
    );
  });

  // Felhasználó szerepkörének módosítása (admin)
  router.put('/users/:id/role', authMiddleware, adminMiddleware, (req, res) => {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Érvénytelen szerepkör' });
    }

    db.run(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, req.params.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Felhasználó frissítése sikertelen' });
        }

        res.json({
          success: true,
          message: 'Felhasználó szerepköre frissítve'
        });
      }
    );
  });

  // Felhasználó törlése (admin)
  router.delete('/users/:id', authMiddleware, adminMiddleware, (req, res) => {
    // Megakadályozni az utolsó admin törlését
    db.get('SELECT COUNT(*) as count FROM users WHERE role = "admin"', (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Adatbázis hiba' });
      }

      if (row.count === 1) {
        return res.status(400).json({ error: 'Az utolsó admin nem törölhető' });
      }

      db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Felhasználó törlése sikertelen' });
        }

        res.json({
          success: true,
          message: 'Felhasználó sikeresen törölve'
        });
      });
    });
  });

  // Összes termék statisztika (admin)
  router.get('/stats/products', authMiddleware, adminMiddleware, (req, res) => {
    db.get(
      `SELECT 
        COUNT(*) as totalProducts,
        AVG(price) as avgPrice,
        MIN(price) as minPrice,
        MAX(price) as maxPrice
      FROM products`,
      (err, stats) => {
        if (err) {
          return res.status(500).json({ error: 'Adatbázis hiba' });
        }

        res.json(stats);
      }
    );
  });

  // Rendelési statisztika (admin)
  router.get('/stats/orders', authMiddleware, adminMiddleware, (req, res) => {
    db.get(
      `SELECT 
        COUNT(*) as totalOrders,
        SUM(total_price) as totalRevenue,
        AVG(total_price) as avgOrderValue,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as deliveredOrders
      FROM orders`,
      (err, stats) => {
        if (err) {
          return res.status(500).json({ error: 'Adatbázis hiba' });
        }

        res.json(stats);
      }
    );
  });

  // Felhasználó statisztika (admin)
  router.get('/stats/users', authMiddleware, adminMiddleware, (req, res) => {
    db.get(
      `SELECT 
        COUNT(*) as totalUsers,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as adminUsers,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as regularUsers
      FROM users`,
      (err, stats) => {
        if (err) {
          return res.status(500).json({ error: 'Adatbázis hiba' });
        }

        res.json(stats);
      }
    );
  });

  // Összes értékelés statisztika (admin)
  router.get('/stats/reviews', authMiddleware, adminMiddleware, (req, res) => {
    db.get(
      `SELECT 
        COUNT(*) as totalReviews,
        AVG(rating) as avgRating,
        COUNT(CASE WHEN rating >= 4 THEN 1 END) as positiveReviews,
        COUNT(CASE WHEN rating <= 2 THEN 1 END) as negativeReviews
      FROM reviews`,
      (err, stats) => {
        if (err) {
          return res.status(500).json({ error: 'Adatbázis hiba' });
        }

        res.json(stats);
      }
    );
  });

  // Összes termék lekérése (admin view - kiterjesztett info)
  router.get('/products', authMiddleware, adminMiddleware, (req, res) => {
    db.all(
      `SELECT p.*, COUNT(r.id) as review_count, AVG(r.rating) as avg_rating
       FROM products p
       LEFT JOIN reviews r ON p.id = r.product_id
       GROUP BY p.id`,
      (err, products) => {
        if (err) {
          return res.status(500).json({ error: 'Adatbázis hiba' });
        }

        const parsedProducts = products.map(p => ({
          ...p,
          images: p.images ? JSON.parse(p.images) : []
        }));

        res.json(parsedProducts);
      }
    );
  });

  // Rendszer teljes statisztika (admin dashboard)
  router.get('/dashboard/overview', authMiddleware, adminMiddleware, (req, res) => {
    const stats = {};

    // Orders stats
    db.get(
      'SELECT COUNT(*) as total, SUM(total_price) as revenue FROM orders',
      (err, orderStats) => {
        if (err) {
          return res.status(500).json({ error: 'Adatbázis hiba' });
        }

        stats.orders = {
          total: orderStats.total,
          revenue: orderStats.revenue || 0
        };

        // Users stats
        db.get('SELECT COUNT(*) as total FROM users', (err, userStats) => {
          if (err) {
            return res.status(500).json({ error: 'Adatbázis hiba' });
          }

          stats.users = {
            total: userStats.total
          };

          // Products stats
          db.get('SELECT COUNT(*) as total FROM products', (err, productStats) => {
            if (err) {
              return res.status(500).json({ error: 'Adatbázis hiba' });
            }

            stats.products = {
              total: productStats.total
            };

            res.json(stats);
          });
        });
      }
    );
  });

  return router;
};
