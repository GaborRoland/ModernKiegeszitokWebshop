import jwt from 'jwt-simple';
import bcrypt from 'bcryptjs';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const generateToken = (userId, role = 'user') => {
  const payload = {
    userId,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 nap
  };
  return jwt.encode(payload, SECRET_KEY);
};

export const verifyToken = (token) => {
  try {
    return jwt.decode(token, SECRET_KEY);
  } catch (err) {
    return null;
  }
};

export const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

export const comparePassword = (password, hash) => {
  return bcrypt.compareSync(password, hash);
};

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token hiányzik' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Érvénytelen token' });
  }

  req.userId = decoded.userId;
  req.userRole = decoded.role;
  next();
};

export const adminMiddleware = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin hozzáférés szükséges' });
  }
  next();
};
