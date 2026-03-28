import express from 'express';
import { authMiddleware, adminMiddleware } from '../auth.js';

export const createProductRoutes = (db) => {
  const router = express.Router();

  // Összes termék lekérése
  router.get('/', (req, res) => {
    db.all('SELECT * FROM products', (err, products) => {
      if (err) {
        return res.status(500).json({ error: 'Adatbázis hiba' });
      }
      res.json(products);
    });
  });

  // Egy termék lekérése ID alapján
  router.get('/:id', (req, res) => {
    db.get(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id],
      (err, product) => {
        if (err || !product) {
          return res.status(404).json({ error: 'Termék nem található' });
        }
        res.json(product);
      }
    );
  });

  // Új termék hozzáadása (admin)
  router.post('/', authMiddleware, adminMiddleware, (req, res) => {
    const { name, description, price, image, images } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Név és ár szükséges' });
    }

    db.run(
      'INSERT INTO products (name, description, price, image, images) VALUES (?, ?, ?, ?, ?)',
      [name, description, price, image, JSON.stringify(images || [image])],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Termék hozzáadása sikertelen' });
        }

        res.json({
          success: true,
          id: this.lastID,
          message: 'Termék sikeresen hozzáadva'
        });
      }
    );
  });

  // Termék szerkesztése (admin)
  router.put('/:id', authMiddleware, adminMiddleware, (req, res) => {
    const { name, description, price, image, images } = req.body;

    db.run(
      'UPDATE products SET name = ?, description = ?, price = ?, image = ?, images = ? WHERE id = ?',
      [name, description, price, image, JSON.stringify(images || [image]), req.params.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Termék szerkesztése sikertelen' });
        }

        res.json({
          success: true,
          message: 'Termék sikeresen szerkesztve'
        });
      }
    );
  });

  // Termék törlése (admin)
  router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
    db.run(
      'DELETE FROM products WHERE id = ?',
      [req.params.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Termék törlése sikertelen' });
        }

        res.json({
          success: true,
          message: 'Termék sikeresen törölve'
        });
      }
    );
  });

  return router;
};
