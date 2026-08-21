import fs from 'fs';
import path from 'path';
import initSqlJs, { Database } from 'sql.js';
import bcrypt from 'bcryptjs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'radios.sqlite');
export const TERMOS_DIR = path.join(DB_DIR, 'termos');

let db: Database;

// Helper to save DB to disk
export function persistDb() {
  if (!db) return;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(TERMOS_DIR)) {
      fs.mkdirSync(TERMOS_DIR, { recursive: true });
    }
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Error persisting database:', err);
  }
}

export async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(TERMOS_DIR)) {
    fs.mkdirSync(TERMOS_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const filebuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(filebuffer);
      console.log('Loaded existing database from disk.');
    } catch (e) {
      console.error('Error loading existing db, creating fresh one:', e);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
    console.log('Created new in-memory SQLite database.');
  }

  initSchemaAndSeed(db);
  persistDb();
  return db;
}

function initSchemaAndSeed(db: Database) {
  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      perfil TEXT NOT NULL CHECK(perfil IN ('admin', 'usuario')),
      status TEXT NOT NULL DEFAULT 'ativo' CHECK(status IN ('ativo', 'inativo')),
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS setores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      descricao TEXT,
      status TEXT NOT NULL DEFAULT 'ativo' CHECK(status IN ('ativo', 'inativo')),
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS radios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_serie TEXT UNIQUE NOT NULL,
      modelo TEXT NOT NULL DEFAULT 'Motorola DP450',
      identificador_ra TEXT UNIQUE NOT NULL,
      fornecedor TEXT NOT NULL DEFAULT 'Mendonça',
      setor_id INTEGER,
      status TEXT NOT NULL DEFAULT 'disponivel' CHECK(status IN ('em_uso', 'em_manutencao', 'disponivel', 'inativo')),
      observacoes TEXT,
      termo_pdf_nome TEXT,
      termo_pdf_path TEXT,
      termo_pdf_uploaded_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (setor_id) REFERENCES setores (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS manutencoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      radio_id INTEGER NOT NULL,
      data_ida TEXT NOT NULL,
      data_volta TEXT,
      defeito TEXT NOT NULL,
      observacoes TEXT,
      servico_realizado TEXT,
      status TEXT NOT NULL DEFAULT 'em_manutencao' CHECK(status IN ('em_manutencao', 'concluida')),
      status_retorno TEXT CHECK(status_retorno IN ('em_uso', 'disponivel')),
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (radio_id) REFERENCES radios (id) ON DELETE CASCADE
    );
  `);

  // Migrations for existing databases
  try {
    db.run("ALTER TABLE radios ADD COLUMN termo_pdf_nome TEXT");
  } catch (e) {
    // Column already exists
  }
  try {
    db.run("ALTER TABLE radios ADD COLUMN termo_pdf_path TEXT");
  } catch (e) {
    // Column already exists
  }
  try {
    db.run("ALTER TABLE radios ADD COLUMN termo_pdf_uploaded_at TEXT");
  } catch (e) {
    // Column already exists
  }

  // Seed default Users if empty
  const userCount = db.exec("SELECT COUNT(*) as count FROM usuarios")[0]?.values[0][0] as number;
  if (!userCount || userCount === 0) {
    const adminHash = bcrypt.hashSync('admin123', 10);
    const userHash = bcrypt.hashSync('user123', 10);

    db.run(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, status) VALUES 
      (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?)`,
      [
        'Administrador do Sistema', 'admin@usr', adminHash, 'admin', 'ativo',
        'Operador de Rádios', 'operador@usr', userHash, 'usuario', 'ativo'
      ]
    );
    console.log('Seeded default users: admin@usr / operador@usr');
  } else {
    // Migrate existing seeded users to @usr if present
    db.run("UPDATE usuarios SET email = 'admin@usr' WHERE email = 'admin@empresa.com.br'");
    db.run("UPDATE usuarios SET email = 'operador@usr' WHERE email = 'operador@empresa.com.br'");
  }

  // Seed default Setores if empty
  const sectorCount = db.exec("SELECT COUNT(*) as count FROM setores")[0]?.values[0][0] as number;
  if (!sectorCount || sectorCount === 0) {
    const defaultSectors = [
      ['Portaria', 'Controle de acesso e guarita principal'],
      ['Produção', 'Linha operacional de fabricação'],
      ['Expedição', 'Logística, carga e descarga de mercadorias'],
      ['Segurança', 'Vigilância patrimonial e rondas'],
      ['Manutenção Predial', 'Equipe de conservação e reparos fabris'],
      ['Administrativo', 'Escritório central e diretoria'],
      ['Almoxarifado', 'Gestão de estoque e suprimentos']
    ];

    for (const [nome, desc] of defaultSectors) {
      db.run(`INSERT INTO setores (nome, descricao, status) VALUES (?, ?, 'ativo')`, [nome, desc]);
    }
    console.log('Seeded default sectors.');
  }
}
