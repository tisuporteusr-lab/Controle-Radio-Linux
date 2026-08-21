import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { getDb, persistDb, TERMOS_DIR } from './db.js';
import { authenticateToken, requireAdmin, generateToken, AuthRequest } from './auth.js';
import os from 'os';

const router = Router();

// Helper to save PDF from base64 string to disk
function saveTermoPdf(radioIdOrPrefix: string | number, originalName: string, base64Data: string): { fileName: string; filePath: string } {
  if (!fs.existsSync(TERMOS_DIR)) {
    fs.mkdirSync(TERMOS_DIR, { recursive: true });
  }

  // Remove potential data URI prefix (e.g. data:application/pdf;base64,)
  const cleanBase64 = base64Data.replace(/^data:[a-zA-Z0-9\/\-+.]+;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');

  // Sanitize filename
  const cleanOriginalName = originalName ? path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, '_') : 'termo_uso.pdf';
  const fileName = `termo_radio_${radioIdOrPrefix}_${Date.now()}_${cleanOriginalName}`;
  const filePath = path.join(TERMOS_DIR, fileName);

  fs.writeFileSync(filePath, buffer);
  return { fileName: cleanOriginalName, filePath: fileName };
}

// Helper to delete PDF file
function deleteTermoPdfFile(storedPath?: string | null) {
  if (!storedPath) return;
  try {
    const fullPath = path.isAbsolute(storedPath) ? storedPath : path.join(TERMOS_DIR, path.basename(storedPath));
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.error('Erro ao deletar arquivo de termo PDF:', err);
  }
}

// Helper to convert SQLite result to object array
function queryRows<T = any>(db: any, sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

// Calculate days between two dates (YYYY-MM-DD)
function calculateDays(startDateStr: string, endDateStr?: string | null): number {
  const start = new Date(startDateStr);
  const end = endDateStr ? new Date(endDateStr) : new Date();
  
  // Set both to start of day in UTC
  const d1 = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const d2 = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  
  const diffTime = d2 - d1;
  const days = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
  return days;
}

// ================= AUTH ROUTES =================

router.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email e senha são obrigatórios' });
    return;
  }

  const db = await getDb();
  const rows = queryRows(db, 'SELECT * FROM usuarios WHERE email = ?', [email.trim().toLowerCase()]);
  
  if (!rows.length) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }

  const user = rows[0];
  if (user.status !== 'ativo') {
    res.status(403).json({ error: 'Este usuário está inativo no sistema' });
    return;
  }

  const isMatch = bcrypt.compareSync(password, user.senha_hash);
  if (!isMatch) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }

  const tokenUser = {
    id: user.id,
    nome: user.nome,
    email: user.email,
    perfil: user.perfil,
    status: user.status
  };

  const token = generateToken(tokenUser);
  res.json({
    token,
    user: tokenUser
  });
});

router.get('/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// Verify Admin password for high-privilege operations
router.post('/auth/verify-admin-password', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { password } = req.body;
  if (!password) {
    res.status(400).json({ error: 'Senha de administrador é obrigatória' });
    return;
  }

  const db = await getDb();
  const rows = queryRows(db, 'SELECT senha_hash FROM usuarios WHERE id = ?', [req.user!.id]);
  if (!rows.length) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }

  const isMatch = bcrypt.compareSync(password, rows[0].senha_hash);
  if (!isMatch) {
    res.status(401).json({ error: 'Senha de administrador incorreta' });
    return;
  }

  res.json({ valid: true, message: 'Senha confirmada com sucesso' });
});

// ================= USER MANAGEMENT (ADMIN ONLY) =================

router.get('/users', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const db = await getDb();
  const users = queryRows(db, `
    SELECT id, nome, email, perfil, status, created_at, updated_at 
    FROM usuarios ORDER BY id ASC
  `);
  res.json(users);
});

router.post('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { nome, email, password, perfil } = req.body;
  if (!nome || !email || !password || !perfil) {
    res.status(400).json({ error: 'Nome, email, senha e perfil são obrigatórios' });
    return;
  }

  if (!['admin', 'usuario'].includes(perfil)) {
    res.status(400).json({ error: 'Perfil inválido (deve ser admin ou usuario)' });
    return;
  }

  const db = await getDb();

  const existing = queryRows(db, 'SELECT id FROM usuarios WHERE email = ?', [email.trim().toLowerCase()]);
  if (existing.length > 0) {
    res.status(400).json({ error: 'Já existe um usuário cadastrado com este e-mail' });
    return;
  }

  const hash = bcrypt.hashSync(password, 10);
  db.run(
    `INSERT INTO usuarios (nome, email, senha_hash, perfil, status) VALUES (?, ?, ?, ?, 'ativo')`,
    [nome.trim(), email.trim().toLowerCase(), hash, perfil]
  );
  persistDb();

  res.status(201).json({ message: 'Usuário cadastrado com sucesso' });
});

router.put('/users/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { nome, email, password, perfil, status } = req.body;

  const db = await getDb();
  const existing = queryRows(db, 'SELECT * FROM usuarios WHERE id = ?', [id]);
  if (!existing.length) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }

  // Prevent demoting or deactivating the last active admin
  if (existing[0].perfil === 'admin' && (perfil === 'usuario' || status === 'inativo')) {
    const activeAdmins = queryRows(db, "SELECT COUNT(*) as count FROM usuarios WHERE perfil = 'admin' AND status = 'ativo' AND id != ?", [id]);
    if (activeAdmins[0].count === 0) {
      res.status(400).json({ error: 'Operação recusada: O sistema deve possuir ao menos um Administrador ativo.' });
      return;
    }
  }

  if (email && email.trim().toLowerCase() !== existing[0].email) {
    const dup = queryRows(db, 'SELECT id FROM usuarios WHERE email = ? AND id != ?', [email.trim().toLowerCase(), id]);
    if (dup.length > 0) {
      res.status(400).json({ error: 'Já existe outro usuário com este e-mail' });
      return;
    }
  }

  const current = existing[0];
  const newNome = nome !== undefined ? nome.trim() : current.nome;
  const newEmail = email !== undefined ? email.trim().toLowerCase() : current.email;
  const newPerfil = perfil !== undefined ? perfil : current.perfil;
  const newStatus = status !== undefined ? status : current.status;
  const newHash = password && password.trim() ? bcrypt.hashSync(password.trim(), 10) : current.senha_hash;

  db.run(
    `UPDATE usuarios SET nome = ?, email = ?, senha_hash = ?, perfil = ?, status = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`,
    [newNome, newEmail, newHash, newPerfil, newStatus, id]
  );
  persistDb();

  const isCurrentUser = Number(id) === req.user!.id;
  let newToken: string | undefined;
  const updatedUser = {
    id: Number(id),
    nome: newNome,
    email: newEmail,
    perfil: newPerfil as 'admin' | 'usuario',
    status: newStatus as 'ativo' | 'inativo'
  };

  if (isCurrentUser) {
    newToken = generateToken(updatedUser);
  }

  res.json({ 
    message: 'Usuário atualizado com sucesso',
    user: updatedUser,
    token: newToken
  });
});

router.delete('/users/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (Number(id) === req.user!.id) {
    res.status(400).json({ error: 'Você não pode excluir sua própria conta de administrador enquanto estiver conectado.' });
    return;
  }

  const db = await getDb();

  const existing = queryRows(db, 'SELECT * FROM usuarios WHERE id = ?', [id]);
  if (!existing.length) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }

  if (existing[0].perfil === 'admin') {
    const activeAdmins = queryRows(db, "SELECT COUNT(*) as count FROM usuarios WHERE perfil = 'admin' AND status = 'ativo' AND id != ?", [id]);
    if (activeAdmins[0].count === 0) {
      res.status(400).json({ error: 'Não é possível excluir o único administrador ativo do sistema.' });
      return;
    }
  }

  db.run('DELETE FROM usuarios WHERE id = ?', [id]);
  persistDb();

  res.json({ message: `Usuário ${existing[0].nome} excluído com sucesso.` });
});

// ================= SETORES (SECTORS) =================

router.get('/setores', authenticateToken, async (req: Request, res: Response) => {
  const db = await getDb();
  const setores = queryRows(db, `
    SELECT s.*, 
      (SELECT COUNT(*) FROM radios r WHERE r.setor_id = s.id AND r.status != 'inativo') as total_radios_ativos,
      (SELECT COUNT(*) FROM radios r WHERE r.setor_id = s.id AND r.status = 'em_manutencao') as radios_em_manutencao
    FROM setores s 
    ORDER BY s.nome ASC
  `);
  res.json(setores);
});

router.post('/setores', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const { nome, descricao } = req.body;
  if (!nome || !nome.trim()) {
    res.status(400).json({ error: 'Nome do setor é obrigatório' });
    return;
  }

  const db = await getDb();
  const existing = queryRows(db, 'SELECT id FROM setores WHERE LOWER(nome) = LOWER(?)', [nome.trim()]);
  if (existing.length > 0) {
    res.status(400).json({ error: 'Já existe um setor com este nome' });
    return;
  }

  db.run(`INSERT INTO setores (nome, descricao, status) VALUES (?, ?, 'ativo')`, [nome.trim(), descricao?.trim() || '']);
  persistDb();

  res.status(201).json({ message: 'Setor cadastrado com sucesso' });
});

router.put('/setores/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, descricao, status } = req.body;

  const db = await getDb();
  const existing = queryRows(db, 'SELECT * FROM setores WHERE id = ?', [id]);
  if (!existing.length) {
    res.status(404).json({ error: 'Setor não encontrado' });
    return;
  }

  if (nome && nome.trim().toLowerCase() !== existing[0].nome.toLowerCase()) {
    const dup = queryRows(db, 'SELECT id FROM setores WHERE LOWER(nome) = LOWER(?) AND id != ?', [nome.trim(), id]);
    if (dup.length > 0) {
      res.status(400).json({ error: 'Já existe outro setor com este nome' });
      return;
    }
  }

  const newNome = nome !== undefined ? nome.trim() : existing[0].nome;
  const newDesc = descricao !== undefined ? descricao.trim() : existing[0].descricao;
  const newStatus = status !== undefined ? status : existing[0].status;

  db.run(
    `UPDATE setores SET nome = ?, descricao = ?, status = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`,
    [newNome, newDesc, newStatus, id]
  );
  persistDb();

  res.json({ message: 'Setor atualizado com sucesso' });
});

router.delete('/setores/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getDb();

  const existing = queryRows(db, 'SELECT * FROM setores WHERE id = ?', [id]);
  if (!existing.length) {
    res.status(404).json({ error: 'Setor não encontrado' });
    return;
  }

  // Count how many radios are currently assigned to this sector
  const linkedRadios = queryRows(db, 'SELECT COUNT(*) as count FROM radios WHERE setor_id = ?', [id]);
  const radioCount = linkedRadios[0]?.count || 0;

  // Unlink radios from this sector (set setor_id to NULL)
  db.run('UPDATE radios SET setor_id = NULL WHERE setor_id = ?', [id]);

  // Delete the sector
  db.run('DELETE FROM setores WHERE id = ?', [id]);
  persistDb();

  const msg = radioCount > 0 
    ? `Setor "${existing[0].nome}" excluído com sucesso. (${radioCount} rádio(s) foram desvinculados)`
    : `Setor "${existing[0].nome}" excluído com sucesso.`;

  res.json({ message: msg });
});

// ================= RÁDIOS =================

router.get('/radios', authenticateToken, async (req: Request, res: Response) => {
  const db = await getDb();
  const { status, setor_id, search } = req.query;

  let sql = `
    SELECT 
      r.id, r.numero_serie, r.modelo, r.identificador_ra, r.fornecedor, r.status, r.observacoes, r.setor_id,
      r.termo_pdf_nome, r.termo_pdf_path, r.termo_pdf_uploaded_at,
      r.created_at, r.updated_at,
      s.nome as setor_nome,
      (SELECT COUNT(*) FROM manutencoes m WHERE m.radio_id = r.id) as total_manutencoes,
      (SELECT MAX(m.data_ida) FROM manutencoes m WHERE m.radio_id = r.id) as ultima_manutencao_data,
      (SELECT m.id FROM manutencoes m WHERE m.radio_id = r.id AND m.status = 'em_manutencao' LIMIT 1) as manutencao_ativa_id,
      (SELECT m.data_ida FROM manutencoes m WHERE m.radio_id = r.id AND m.status = 'em_manutencao' LIMIT 1) as manutencao_ativa_data_ida,
      (SELECT m.defeito FROM manutencoes m WHERE m.radio_id = r.id AND m.status = 'em_manutencao' LIMIT 1) as manutencao_ativa_defeito
    FROM radios r
    LEFT JOIN setores s ON r.setor_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status && status !== 'todos') {
    sql += ' AND r.status = ?';
    params.push(status);
  }

  if (setor_id && setor_id !== 'todos') {
    sql += ' AND r.setor_id = ?';
    params.push(Number(setor_id));
  }

  if (search) {
    const term = `%${String(search).trim()}%`;
    sql += ' AND (r.identificador_ra LIKE ? OR r.numero_serie LIKE ? OR r.modelo LIKE ? OR s.nome LIKE ?)';
    params.push(term, term, term, term);
  }

  sql += ' ORDER BY r.identificador_ra ASC';

  const radios = queryRows(db, sql, params);

  // Compute calculated days for active maintenance
  const enhancedRadios = radios.map(r => {
    let dias_em_manutencao_atual = null;
    if (r.status === 'em_manutencao' && r.manutencao_ativa_data_ida) {
      dias_em_manutencao_atual = calculateDays(r.manutencao_ativa_data_ida);
    }
    return {
      ...r,
      dias_em_manutencao_atual
    };
  });

  res.json(enhancedRadios);
});

router.get('/radios/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getDb();

  const radioRows = queryRows(db, `
    SELECT 
      r.id, r.numero_serie, r.modelo, r.identificador_ra, r.fornecedor, r.status, r.observacoes, r.setor_id,
      r.termo_pdf_nome, r.termo_pdf_path, r.termo_pdf_uploaded_at,
      r.created_at, r.updated_at,
      s.nome as setor_nome
    FROM radios r
    LEFT JOIN setores s ON r.setor_id = s.id
    WHERE r.id = ?
  `, [id]);

  if (!radioRows.length) {
    res.status(404).json({ error: 'Rádio não encontrado' });
    return;
  }

  const radio = radioRows[0];

  // Get full maintenance history
  const history = queryRows(db, `
    SELECT id, radio_id, data_ida, data_volta, defeito, observacoes, servico_realizado, status, status_retorno, created_at
    FROM manutencoes
    WHERE radio_id = ?
    ORDER BY data_ida DESC, id DESC
  `, [id]);

  let total_dias_manutencao = 0;
  const enhancedHistory = history.map(m => {
    const dias = calculateDays(m.data_ida, m.data_volta);
    total_dias_manutencao += dias;
    return {
      ...m,
      dias
    };
  });

  const stats = {
    total_manutencoes: history.length,
    total_dias_manutencao,
    em_aberto: history.filter(h => h.status === 'em_manutencao').length,
    ultima_manutencao: history.length > 0 ? history[0].data_ida : null
  };

  res.json({
    radio,
    stats,
    history: enhancedHistory
  });
});

// Download / View Termo PDF
router.get('/radios/:id/termo-pdf', async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getDb();

  const radioRows = queryRows(db, 'SELECT id, identificador_ra, termo_pdf_nome, termo_pdf_path FROM radios WHERE id = ?', [id]);
  if (!radioRows.length || !radioRows[0].termo_pdf_path) {
    res.status(404).send('Termo de uso em PDF não encontrado para este rádio.');
    return;
  }

  const radio = radioRows[0];
  const storedPath = radio.termo_pdf_path;
  const fullPath = path.isAbsolute(storedPath) ? storedPath : path.join(TERMOS_DIR, path.basename(storedPath));

  if (!fs.existsSync(fullPath)) {
    res.status(404).send('O arquivo PDF do termo não foi encontrado no servidor.');
    return;
  }

  const filename = radio.termo_pdf_nome || `Termo_${radio.identificador_ra}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
  res.sendFile(fullPath);
});

router.post('/radios', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const {
    numero_serie,
    modelo,
    identificador_ra,
    fornecedor,
    setor_id,
    status,
    observacoes,
    termo_pdf_base64,
    termo_pdf_nome
  } = req.body;

  if (!numero_serie || !identificador_ra || !setor_id) {
    res.status(400).json({ error: 'Número de série, Identificador RA e Setor são obrigatórios' });
    return;
  }

  const db = await getDb();

  // Validate unique serial number
  const dupSerial = queryRows(db, 'SELECT id FROM radios WHERE LOWER(numero_serie) = LOWER(?)', [numero_serie.trim()]);
  if (dupSerial.length > 0) {
    res.status(400).json({ error: `Já existe um rádio com o número de série "${numero_serie.trim()}"` });
    return;
  }

  // Validate unique RA
  const dupRA = queryRows(db, 'SELECT id FROM radios WHERE LOWER(identificador_ra) = LOWER(?)', [identificador_ra.trim()]);
  if (dupRA.length > 0) {
    res.status(400).json({ error: `Já existe um rádio com o identificador RA "${identificador_ra.trim()}"` });
    return;
  }

  const validStatus = ['em_uso', 'em_manutencao', 'disponivel', 'inativo'].includes(status) ? status : 'em_uso';
  const defaultModelo = modelo && modelo.trim() ? modelo.trim() : 'Motorola DP450';
  const defaultFornecedor = fornecedor && fornecedor.trim() ? fornecedor.trim() : 'Mendonça';

  let savedPdfNome: string | null = null;
  let savedPdfPath: string | null = null;
  let savedPdfUploadAt: string | null = null;

  if (termo_pdf_base64 && typeof termo_pdf_base64 === 'string') {
    try {
      const saved = saveTermoPdf(identificador_ra.trim(), termo_pdf_nome || 'termo_assinado.pdf', termo_pdf_base64);
      savedPdfNome = saved.fileName;
      savedPdfPath = saved.filePath;
      savedPdfUploadAt = new Date().toISOString();
    } catch (err: any) {
      console.error('Erro ao gravar PDF do termo:', err);
    }
  }

  db.run(
    `INSERT INTO radios (numero_serie, modelo, identificador_ra, fornecedor, setor_id, status, observacoes, termo_pdf_nome, termo_pdf_path, termo_pdf_uploaded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      numero_serie.trim(),
      defaultModelo,
      identificador_ra.trim(),
      defaultFornecedor,
      Number(setor_id),
      validStatus,
      observacoes?.trim() || '',
      savedPdfNome,
      savedPdfPath,
      savedPdfUploadAt
    ]
  );
  persistDb();

  res.status(201).json({ message: 'Rádio cadastrado com sucesso' });
});

router.put('/radios/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    numero_serie,
    modelo,
    identificador_ra,
    fornecedor,
    setor_id,
    status,
    observacoes,
    termo_pdf_base64,
    termo_pdf_nome,
    remover_termo_pdf
  } = req.body;

  const db = await getDb();
  const existing = queryRows(db, 'SELECT * FROM radios WHERE id = ?', [id]);
  if (!existing.length) {
    res.status(404).json({ error: 'Rádio não encontrado' });
    return;
  }

  const current = existing[0];

  // Validate unique serial number if changed
  if (numero_serie && numero_serie.trim().toLowerCase() !== current.numero_serie.toLowerCase()) {
    const dupSerial = queryRows(db, 'SELECT id FROM radios WHERE LOWER(numero_serie) = LOWER(?) AND id != ?', [numero_serie.trim(), id]);
    if (dupSerial.length > 0) {
      res.status(400).json({ error: `Já existe outro rádio com o número de série "${numero_serie.trim()}"` });
      return;
    }
  }

  // Validate unique RA if changed
  if (identificador_ra && identificador_ra.trim().toLowerCase() !== current.identificador_ra.toLowerCase()) {
    const dupRA = queryRows(db, 'SELECT id FROM radios WHERE LOWER(identificador_ra) = LOWER(?) AND id != ?', [identificador_ra.trim(), id]);
    if (dupRA.length > 0) {
      res.status(400).json({ error: `Já existe outro rádio com o identificador RA "${identificador_ra.trim()}"` });
      return;
    }
  }

  const newNS = numero_serie !== undefined ? numero_serie.trim() : current.numero_serie;
  const newMod = modelo !== undefined ? modelo.trim() : current.modelo;
  const newRA = identificador_ra !== undefined ? identificador_ra.trim() : current.identificador_ra;
  const newForn = fornecedor !== undefined ? fornecedor.trim() : current.fornecedor;
  const newSetor = setor_id !== undefined ? Number(setor_id) : current.setor_id;
  const newStatus = status !== undefined ? status : current.status;
  const newObs = observacoes !== undefined ? observacoes.trim() : current.observacoes;

  let newPdfNome = current.termo_pdf_nome;
  let newPdfPath = current.termo_pdf_path;
  let newPdfUploadedAt = current.termo_pdf_uploaded_at;

  if (remover_termo_pdf) {
    deleteTermoPdfFile(current.termo_pdf_path);
    newPdfNome = null;
    newPdfPath = null;
    newPdfUploadedAt = null;
  } else if (termo_pdf_base64 && typeof termo_pdf_base64 === 'string') {
    deleteTermoPdfFile(current.termo_pdf_path);
    try {
      const saved = saveTermoPdf(newRA, termo_pdf_nome || 'termo_assinado.pdf', termo_pdf_base64);
      newPdfNome = saved.fileName;
      newPdfPath = saved.filePath;
      newPdfUploadedAt = new Date().toISOString();
    } catch (err: any) {
      console.error('Erro ao atualizar PDF do termo:', err);
    }
  }

  db.run(
    `UPDATE radios SET 
      numero_serie = ?, 
      modelo = ?, 
      identificador_ra = ?, 
      fornecedor = ?, 
      setor_id = ?, 
      status = ?, 
      observacoes = ?, 
      termo_pdf_nome = ?, 
      termo_pdf_path = ?, 
      termo_pdf_uploaded_at = ?, 
      updated_at = datetime('now', 'localtime') 
     WHERE id = ?`,
    [newNS, newMod, newRA, newForn, newSetor, newStatus, newObs, newPdfNome, newPdfPath, newPdfUploadedAt, id]
  );
  persistDb();

  res.json({ message: 'Rádio atualizado com sucesso' });
});

// Direct upload of termo PDF for existing radio
router.post('/radios/:id/termo-pdf', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { termo_pdf_base64, termo_pdf_nome } = req.body;

  if (!termo_pdf_base64) {
    res.status(400).json({ error: 'Arquivo PDF em base64 não fornecido' });
    return;
  }

  const db = await getDb();
  const existing = queryRows(db, 'SELECT * FROM radios WHERE id = ?', [id]);
  if (!existing.length) {
    res.status(404).json({ error: 'Rádio não encontrado' });
    return;
  }

  const current = existing[0];
  deleteTermoPdfFile(current.termo_pdf_path);

  const saved = saveTermoPdf(current.identificador_ra, termo_pdf_nome || 'termo_assinado.pdf', termo_pdf_base64);
  const now = new Date().toISOString();

  db.run(
    'UPDATE radios SET termo_pdf_nome = ?, termo_pdf_path = ?, termo_pdf_uploaded_at = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?',
    [saved.fileName, saved.filePath, now, id]
  );
  persistDb();

  res.json({
    message: 'Termo de uso anexado com sucesso',
    termo_pdf_nome: saved.fileName,
    termo_pdf_path: saved.filePath,
    termo_pdf_uploaded_at: now
  });
});

// Remove termo PDF from existing radio
router.delete('/radios/:id/termo-pdf', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getDb();
  const existing = queryRows(db, 'SELECT * FROM radios WHERE id = ?', [id]);
  if (!existing.length) {
    res.status(404).json({ error: 'Rádio não encontrado' });
    return;
  }

  deleteTermoPdfFile(existing[0].termo_pdf_path);

  db.run(
    'UPDATE radios SET termo_pdf_nome = NULL, termo_pdf_path = NULL, termo_pdf_uploaded_at = NULL, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?',
    [id]
  );
  persistDb();

  res.json({ message: 'Termo de uso removido com sucesso' });
});

router.delete('/radios/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getDb();
  const existing = queryRows(db, 'SELECT * FROM radios WHERE id = ?', [id]);
  if (!existing.length) {
    res.status(404).json({ error: 'Rádio não encontrado' });
    return;
  }

  // Delete attached PDF file if exists
  deleteTermoPdfFile(existing[0].termo_pdf_path);

  // Delete all maintenance records associated with this radio
  db.run('DELETE FROM manutencoes WHERE radio_id = ?', [id]);
  
  // Delete the radio
  db.run('DELETE FROM radios WHERE id = ?', [id]);
  persistDb();

  res.json({ message: `Rádio ${existing[0].identificador_ra} excluído com sucesso.` });
});

router.delete('/radios-limpar/todos', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const db = await getDb();
  
  // Fetch all radios to delete their PDF files
  const allRadios = queryRows(db, 'SELECT termo_pdf_path FROM radios');
  for (const r of allRadios) {
    deleteTermoPdfFile(r.termo_pdf_path);
  }

  db.run('DELETE FROM manutencoes');
  db.run('DELETE FROM radios');
  persistDb();
  res.json({ message: 'Todos os rádios e manutenções foram removidos com sucesso. A base agora está limpa.' });
});

// ================= CONTROLE DE MANUTENÇÃO =================

router.get('/manutencoes', authenticateToken, async (req: Request, res: Response) => {
  const db = await getDb();
  const { status, setor_id, data_inicio, data_fim, search } = req.query;

  let sql = `
    SELECT 
      m.id, m.radio_id, m.data_ida, m.data_volta, m.defeito, m.observacoes, m.servico_realizado, m.status, m.status_retorno,
      m.created_at, m.updated_at,
      r.identificador_ra, r.numero_serie, r.modelo, r.fornecedor, r.status as radio_status,
      s.nome as setor_nome, s.id as setor_id
    FROM manutencoes m
    JOIN radios r ON m.radio_id = r.id
    LEFT JOIN setores s ON r.setor_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status && status !== 'todos') {
    sql += ' AND m.status = ?';
    params.push(status);
  }

  if (setor_id && setor_id !== 'todos') {
    sql += ' AND r.setor_id = ?';
    params.push(Number(setor_id));
  }

  if (data_inicio) {
    sql += ' AND m.data_ida >= ?';
    params.push(String(data_inicio));
  }

  if (data_fim) {
    sql += ' AND m.data_ida <= ?';
    params.push(String(data_fim));
  }

  if (search) {
    const term = `%${String(search).trim()}%`;
    sql += ' AND (r.identificador_ra LIKE ? OR r.numero_serie LIKE ? OR r.modelo LIKE ? OR s.nome LIKE ? OR m.defeito LIKE ?)';
    params.push(term, term, term, term, term);
  }

  sql += ' ORDER BY CASE WHEN m.status = "em_manutencao" THEN 0 ELSE 1 END, m.data_ida DESC, m.id DESC';

  const rows = queryRows(db, sql, params);

  const enhanced = rows.map(m => ({
    ...m,
    dias_em_manutencao: calculateDays(m.data_ida, m.data_volta)
  }));

  res.json(enhanced);
});

// Create new maintenance record (Sending radio to maintenance)
router.post('/manutencoes', authenticateToken, async (req: Request, res: Response) => {
  const { radio_id, data_ida, defeito, observacoes } = req.body;

  if (!radio_id || !data_ida || !defeito || !defeito.trim()) {
    res.status(400).json({ error: 'Rádio, data de ida e defeito apresentado são obrigatórios' });
    return;
  }

  const db = await getDb();

  // Validate radio exists and is not inactive or already in maintenance
  const radioRows = queryRows(db, 'SELECT id, status, identificador_ra FROM radios WHERE id = ?', [radio_id]);
  if (!radioRows.length) {
    res.status(404).json({ error: 'Rádio não encontrado' });
    return;
  }

  const radio = radioRows[0];
  if (radio.status === 'inativo') {
    res.status(400).json({ error: 'Este rádio está inativo e não pode ser enviado para manutenção.' });
    return;
  }

  if (radio.status === 'em_manutencao') {
    res.status(400).json({ error: `O rádio ${radio.identificador_ra} já se encontra em manutenção. Registre o retorno antes de abrir um novo envio.` });
    return;
  }

  // Insert maintenance
  db.run(
    `INSERT INTO manutencoes (radio_id, data_ida, data_volta, defeito, observacoes, status)
     VALUES (?, ?, NULL, ?, ?, 'em_manutencao')`,
    [Number(radio_id), data_ida, defeito.trim(), observacoes?.trim() || '']
  );

  // Update radio status to 'em_manutencao'
  db.run(
    `UPDATE radios SET status = 'em_manutencao', updated_at = datetime('now', 'localtime') WHERE id = ?`,
    [Number(radio_id)]
  );

  persistDb();

  res.status(201).json({ message: 'Manutenção registrada com sucesso. O status do rádio foi atualizado para "Em manutenção".' });
});

// Register Return from maintenance
router.put('/manutencoes/:id/retorno', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data_volta, servico_realizado, status_retorno_radio } = req.body;

  if (!data_volta) {
    res.status(400).json({ error: 'A data de retorno é obrigatória' });
    return;
  }

  const validStatusRetorno = ['em_uso', 'disponivel'].includes(status_retorno_radio) ? status_retorno_radio : 'em_uso';

  const db = await getDb();
  const manRows = queryRows(db, `
    SELECT m.*, r.id as r_id, r.identificador_ra 
    FROM manutencoes m
    JOIN radios r ON m.radio_id = r.id
    WHERE m.id = ?
  `, [id]);

  if (!manRows.length) {
    res.status(404).json({ error: 'Registro de manutenção não encontrado' });
    return;
  }

  const man = manRows[0];
  if (man.status === 'concluida') {
    res.status(400).json({ error: 'Esta manutenção já foi concluída anteriormente.' });
    return;
  }

  // Validate return date is not prior to ida date
  if (data_volta < man.data_ida) {
    res.status(400).json({ error: `A data de retorno (${data_volta}) não pode ser anterior à data de envio (${man.data_ida}).` });
    return;
  }

  // Update maintenance record
  db.run(
    `UPDATE manutencoes 
     SET data_volta = ?, servico_realizado = ?, status = 'concluida', status_retorno = ?, updated_at = datetime('now', 'localtime')
     WHERE id = ?`,
    [data_volta, servico_realizado?.trim() || '', validStatusRetorno, id]
  );

  // Update radio status to chosen returning state ('em_uso' or 'disponivel')
  db.run(
    `UPDATE radios 
     SET status = ?, updated_at = datetime('now', 'localtime') 
     WHERE id = ?`,
    [validStatusRetorno, man.radio_id]
  );

  persistDb();

  const days = calculateDays(man.data_ida, data_volta);

  res.json({
    message: `Retorno registrado com sucesso! O rádio permaneceu ${days} dia(s) em manutenção e seu status foi alterado para "${validStatusRetorno === 'em_uso' ? 'Em uso' : 'Disponível'}".`,
    dias_em_manutencao: days
  });
});

// ================= DASHBOARD =================

router.get('/dashboard', authenticateToken, async (req: Request, res: Response) => {
  const db = await getDb();

  // Summary counts
  const totalRadios = queryRows(db, "SELECT COUNT(*) as count FROM radios WHERE status != 'inativo'")[0]?.count || 0;
  const radiosEmUso = queryRows(db, "SELECT COUNT(*) as count FROM radios WHERE status = 'em_uso'")[0]?.count || 0;
  const radiosEmManutencao = queryRows(db, "SELECT COUNT(*) as count FROM radios WHERE status = 'em_manutencao'")[0]?.count || 0;
  const radiosDisponiveis = queryRows(db, "SELECT COUNT(*) as count FROM radios WHERE status = 'disponivel'")[0]?.count || 0;
  const radiosInativos = queryRows(db, "SELECT COUNT(*) as count FROM radios WHERE status = 'inativo'")[0]?.count || 0;

  const totalManutencoes = queryRows(db, "SELECT COUNT(*) as count FROM manutencoes")[0]?.count || 0;
  const manutencoesEmAndamento = queryRows(db, "SELECT COUNT(*) as count FROM manutencoes WHERE status = 'em_manutencao'")[0]?.count || 0;
  const manutencoesConcluidas = queryRows(db, "SELECT COUNT(*) as count FROM manutencoes WHERE status = 'concluida'")[0]?.count || 0;

  // Active Maintenances list
  const activeMaintenances = queryRows(db, `
    SELECT 
      m.id, m.radio_id, m.data_ida, m.defeito, m.observacoes, m.status,
      r.identificador_ra, r.numero_serie, r.modelo, r.fornecedor,
      s.nome as setor_nome
    FROM manutencoes m
    JOIN radios r ON m.radio_id = r.id
    LEFT JOIN setores s ON r.setor_id = s.id
    WHERE m.status = 'em_manutencao'
    ORDER BY m.data_ida ASC
  `).map(m => ({
    ...m,
    dias_em_manutencao: calculateDays(m.data_ida)
  }));

  // Radios by Sector distribution
  const sectorDist = queryRows(db, `
    SELECT s.nome as setor_nome, COUNT(r.id) as total_radios,
      SUM(CASE WHEN r.status = 'em_manutencao' THEN 1 ELSE 0 END) as em_manutencao
    FROM setores s
    LEFT JOIN radios r ON r.setor_id = s.id AND r.status != 'inativo'
    WHERE s.status = 'ativo'
    GROUP BY s.id
    ORDER BY total_radios DESC
  `);

  // Recent maintenance activity (last 6 items)
  const recentActivity = queryRows(db, `
    SELECT 
      m.id, m.data_ida, m.data_volta, m.defeito, m.status, m.servico_realizado,
      r.identificador_ra, r.modelo, s.nome as setor_nome
    FROM manutencoes m
    JOIN radios r ON m.radio_id = r.id
    LEFT JOIN setores s ON r.setor_id = s.id
    ORDER BY m.created_at DESC
    LIMIT 6
  `).map(m => ({
    ...m,
    dias: calculateDays(m.data_ida, m.data_volta)
  }));

  res.json({
    metrics: {
      total_radios: totalRadios,
      radios_em_uso: radiosEmUso,
      radios_em_manutencao: radiosEmManutencao,
      radios_disponiveis: radiosDisponiveis,
      radios_inativos: radiosInativos,
      total_manutencoes: totalManutencoes,
      manutencoes_em_andamento: manutencoesEmAndamento,
      manutencoes_concluidas: manutencoesConcluidas
    },
    active_maintenances: activeMaintenances,
    sector_distribution: sectorDist,
    recent_activity: recentActivity
  });
});

// ================= RELATÓRIOS (ANALYTICS & REPORTS) =================

router.get('/relatorios', authenticateToken, async (req: Request, res: Response) => {
  const db = await getDb();
  const { data_inicio, data_fim, setor_id, modelo } = req.query;

  let whereClause = ' WHERE 1=1 ';
  const params: any[] = [];

  if (data_inicio) {
    whereClause += ' AND m.data_ida >= ? ';
    params.push(String(data_inicio));
  }
  if (data_fim) {
    whereClause += ' AND m.data_ida <= ? ';
    params.push(String(data_fim));
  }
  if (setor_id && setor_id !== 'todos') {
    whereClause += ' AND r.setor_id = ? ';
    params.push(Number(setor_id));
  }
  if (modelo && modelo !== 'todos') {
    whereClause += ' AND r.modelo = ? ';
    params.push(String(modelo));
  }

  // 1. All filtered records for table & export
  const records = queryRows(db, `
    SELECT 
      m.id, m.data_ida, m.data_volta, m.defeito, m.servico_realizado, m.status, m.status_retorno,
      r.identificador_ra, r.numero_serie, r.modelo, r.fornecedor,
      s.nome as setor_nome
    FROM manutencoes m
    JOIN radios r ON m.radio_id = r.id
    LEFT JOIN setores s ON r.setor_id = s.id
    ${whereClause}
    ORDER BY m.data_ida DESC
  `, params).map(r => ({
    ...r,
    dias_em_manutencao: calculateDays(r.data_ida, r.data_volta)
  }));

  // 2. Average maintenance turnaround time (days) for concluded ones
  const concluded = records.filter(r => r.status === 'concluida');
  const avgTurnaround = concluded.length > 0
    ? (concluded.reduce((acc, curr) => acc + curr.dias_em_manutencao, 0) / concluded.length).toFixed(1)
    : 0;

  // 3. Radios with most frequent maintenance (Top problem radios)
  const radioProblemMap = new Map<string, { ra: string; serial: string; modelo: string; setor: string; count: number; total_dias: number }>();
  records.forEach(r => {
    const key = r.identificador_ra;
    const existing = radioProblemMap.get(key) || {
      ra: r.identificador_ra,
      serial: r.numero_serie,
      modelo: r.modelo,
      setor: r.setor_nome || 'Sem setor',
      count: 0,
      total_dias: 0
    };
    existing.count += 1;
    existing.total_dias += r.dias_em_manutencao;
    radioProblemMap.set(key, existing);
  });
  const topProblemRadios = Array.from(radioProblemMap.values())
    .sort((a, b) => b.count - a.count || b.total_dias - a.total_dias)
    .slice(0, 10);

  // 4. Most frequent defects breakdown
  const defectMap = new Map<string, number>();
  records.forEach(r => {
    const d = r.defeito.trim();
    defectMap.set(d, (defectMap.get(d) || 0) + 1);
  });
  const topDefects = Array.from(defectMap.entries())
    .map(([defeito, total]) => ({ defeito, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // 5. Maintenances by Sector
  const sectorCountMap = new Map<string, number>();
  records.forEach(r => {
    const s = r.setor_nome || 'Não definido';
    sectorCountMap.set(s, (sectorCountMap.get(s) || 0) + 1);
  });
  const bySector = Array.from(sectorCountMap.entries())
    .map(([setor, total]) => ({ setor, total }))
    .sort((a, b) => b.total - a.total);

  // 6. Maintenances by Model
  const modelCountMap = new Map<string, number>();
  records.forEach(r => {
    const m = r.modelo || 'Motorola DP450';
    modelCountMap.set(m, (modelCountMap.get(m) || 0) + 1);
  });
  const byModel = Array.from(modelCountMap.entries())
    .map(([modelo, total]) => ({ modelo, total }))
    .sort((a, b) => b.total - a.total);

  res.json({
    summary: {
      total_filtrado: records.length,
      em_andamento: records.filter(r => r.status === 'em_manutencao').length,
      concluidas: concluded.length,
      tempo_medio_dias: Number(avgTurnaround)
    },
    top_problem_radios: topProblemRadios,
    top_defects: topDefects,
    by_sector: bySector,
    by_model: byModel,
    records
  });
});

// ================= SYSTEM & NETWORK INFO =================

router.get('/system/info', (req: Request, res: Response) => {
  const networkInterfaces = os.networkInterfaces();
  const ips: string[] = [];

  Object.keys(networkInterfaces).forEach((ifname) => {
    networkInterfaces[ifname]?.forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    });
  });

  res.json({
    appName: 'Controle de Manutenção de Rádios - Mendonça / Motorola DP450',
    version: '1.0.0',
    serverTime: new Date().toISOString(),
    networkIps: ips,
    lanAccessExample: ips.length > 0 ? `http://${ips[0]}:3000` : 'http://192.168.x.x:3000',
    httpsDomainExample: 'https://radios.empresa.com.br'
  });
});

export default router;
