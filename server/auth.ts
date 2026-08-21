import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb, persistDb } from './db.js';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'radios-mendonca-secret-token-key-2026';

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  perfil: 'admin' | 'usuario';
  status: 'ativo' | 'inativo';
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil, status: user.status },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Token de autenticação não fornecido' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    
    // Check if user is still active in DB
    const db = await getDb();
    const result = db.exec("SELECT id, nome, email, perfil, status FROM usuarios WHERE id = ?", [decoded.id]);
    
    if (!result.length || !result[0].values.length) {
      res.status(401).json({ error: 'Usuário não encontrado' });
      return;
    }

    const row = result[0].values[0];
    const user: AuthUser = {
      id: Number(row[0]),
      nome: String(row[1]),
      email: String(row[2]),
      perfil: row[3] as 'admin' | 'usuario',
      status: row[4] as 'ativo' | 'inativo'
    };

    if (user.status !== 'ativo') {
      res.status(403).json({ error: 'Usuário inativo ou desativado pelo administrador' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token inválido ou expirado' });
    return;
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.perfil !== 'admin') {
    res.status(403).json({ error: 'Acesso negado. Apenas administradores podem realizar esta operação.' });
    return;
  }
  next();
}
