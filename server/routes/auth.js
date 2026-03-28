import express from 'express';
import { generateToken, hashPassword, comparePassword, verifyToken } from '../auth.js';

export const createAuthRoutes = (db) => {
  const router = express.Router();

  // Regisztráció
  router.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Összes mező kitöltése szükséges' });
    }

    const hashedPassword = hashPassword(password);

    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function(err) {
        if (err) {
          return res.status(400).json({ error: 'Felhasználó már létezik' });
        }

        const token = generateToken(this.lastID, 'user');
        res.json({
          success: true,
          token,
          user: { id: this.lastID, username, email }
        });
      }
    );
  });

  // Bejelentkezés
    // Bejelentkezés
  router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail és jelszó szükséges' });
    }

    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (err, user) => {
        if (err || !user) {
          return res.status(401).json({ error: 'Érvénytelen felhasználónév vagy jelszó' });
        }

        if (!comparePassword(password, user.password)) {
          return res.status(401).json({ error: 'Érvénytelen felhasználónév vagy jelszó' });
        }

        const token = generateToken(user.id, user.role);
        res.json({
          success: true,
          token,
          user: { id: user.id, username: user.username, email: user.email, role: user.role }
        });
      }
    );
  });

  // Elfelejtett jelszó - jelszó visszaállítás
  router.post('/reset-password', (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'E-mail és új jelszó szükséges' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'Az új jelszónak legalább 6 karakter hosszúnak kell lennie' });
    }

    const hashedPassword = hashPassword(newPassword);
    db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], function(updateErr) {
      if (updateErr) {
        return res.status(500).json({ error: 'Jelszó módosítása sikertelen' });
      }

      if (!this || this.changes === 0) {
        return res.status(404).json({ error: 'Felhasználó nem található ezzel az e-mail címmel' });
      }

      return res.json({ success: true, message: 'Jelszó sikeresen frissítve' });
    });
  });

  // Token verifikálás
    // Token verifikálás
  router.post('/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token szükséges' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Érvénytelen token' });
    }

    db.get(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [decoded.userId],
      (err, user) => {
        if (err || !user) {
          return res.status(401).json({ error: 'Felhasználó nem található' });
        }

        res.json({
          success: true,
          user
        });
      }
    );
  });

  return router;
};
