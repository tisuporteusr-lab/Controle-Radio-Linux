import { 
  User, Setor, Radio, Manutencao, RadioDetailResponse, 
  DashboardData, RelatorioData, SystemInfo 
} from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TOKEN_KEY = 'radios_auth_token';
const USER_KEY = 'radios_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    if (endpoint !== '/auth/login' && endpoint !== '/auth/verify-admin-password') {
      const isAuthMiddlewareRejection = 
        data.error === 'Token de autenticação não fornecido' ||
        data.error === 'Token inválido ou expirado' ||
        data.error === 'Usuário não encontrado' ||
        data.error === 'Usuário inativo ou desativado pelo administrador';

      if (isAuthMiddlewareRejection || endpoint === '/auth/me') {
        clearStoredAuth();
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
  }

  if (!response.ok) {
    throw new Error(data.error || 'Ocorreu um erro no servidor');
  }

  return data as T;
}

// API Service Functions
export const api = {
  // Auth
  login: (email: string, password: string) => 
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => request<{ user: User }>('/auth/me'),
  verifyAdminPassword: (password: string) => 
    request<{ valid: boolean; message: string }>('/auth/verify-admin-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  // Users
  getUsers: () => request<User[]>('/users'),
  createUser: (userData: any) => request<{ message: string }>('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  updateUser: (id: number, userData: any) => request<{ message: string; user?: User; token?: string }>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),
  deleteUser: (id: number) => request<{ message: string }>(`/users/${id}`, {
    method: 'DELETE',
  }),

  // Setores
  getSetores: () => request<Setor[]>('/setores'),
  createSetor: (setorData: { nome: string; descricao?: string }) => request<{ message: string }>('/setores', {
    method: 'POST',
    body: JSON.stringify(setorData),
  }),
  updateSetor: (id: number, setorData: { nome?: string; descricao?: string; status?: string }) => request<{ message: string }>(`/setores/${id}`, {
    method: 'PUT',
    body: JSON.stringify(setorData),
  }),
  deleteSetor: (id: number) => request<{ message: string }>(`/setores/${id}`, {
    method: 'DELETE',
  }),

  // Radios
  getRadios: (params?: { status?: string; setor_id?: string | number; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.setor_id) q.append('setor_id', String(params.setor_id));
    if (params?.search) q.append('search', params.search);
    return request<Radio[]>(`/radios?${q.toString()}`);
  },
  getRadioDetail: (id: number) => request<RadioDetailResponse>(`/radios/${id}`),
  createRadio: (radioData: any) => request<{ message: string }>('/radios', {
    method: 'POST',
    body: JSON.stringify(radioData),
  }),
  updateRadio: (id: number, radioData: any) => request<{ message: string }>(`/radios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(radioData),
  }),
  deleteRadio: (id: number) => request<{ message: string }>(`/radios/${id}`, {
    method: 'DELETE',
  }),
  deleteAllRadios: () => request<{ message: string }>('/radios-limpar/todos', {
    method: 'DELETE',
  }),
  getTermoPdfUrl: (radioId: number) => `/api/radios/${radioId}/termo-pdf`,
  uploadTermoPdf: (radioId: number, data: { termo_pdf_base64: string; termo_pdf_nome?: string }) =>
    request<{ message: string; termo_pdf_nome: string; termo_pdf_uploaded_at: string }>(`/radios/${radioId}/termo-pdf`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteTermoPdf: (radioId: number) =>
    request<{ message: string }>(`/radios/${radioId}/termo-pdf`, {
      method: 'DELETE',
    }),

  // Manutenções
  getManutencoes: (params?: { status?: string; setor_id?: string | number; data_inicio?: string; data_fim?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.setor_id) q.append('setor_id', String(params.setor_id));
    if (params?.data_inicio) q.append('data_inicio', params.data_inicio);
    if (params?.data_fim) q.append('data_fim', params.data_fim);
    if (params?.search) q.append('search', params.search);
    return request<Manutencao[]>(`/manutencoes?${q.toString()}`);
  },
  createManutencao: (data: { radio_id: number; data_ida: string; defeito: string; observacoes?: string }) => 
    request<{ message: string }>('/manutencoes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  registrarRetorno: (id: number, data: { data_volta: string; servico_realizado?: string; status_retorno_radio: 'em_uso' | 'disponivel' }) => 
    request<{ message: string; dias_em_manutencao: number }>(`/manutencoes/${id}/retorno`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Dashboard
  getDashboard: () => request<DashboardData>('/dashboard'),

  // Relatórios
  getRelatorios: (params?: { data_inicio?: string; data_fim?: string; setor_id?: string | number; modelo?: string }) => {
    const q = new URLSearchParams();
    if (params?.data_inicio) q.append('data_inicio', params.data_inicio);
    if (params?.data_fim) q.append('data_fim', params.data_fim);
    if (params?.setor_id) q.append('setor_id', String(params.setor_id));
    if (params?.modelo) q.append('modelo', params.modelo);
    return request<RelatorioData>(`/relatorios?${q.toString()}`);
  },

  // System info
  getSystemInfo: () => request<SystemInfo>('/system/info'),
};

// Date Format Helpers (DD/MM/YYYY)
export function formatDate(dateString?: string | null): string {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

export function formatToday(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Export CSV Helper with UTF-8 BOM
export function exportToCSV(filename: string, rows: Record<string, any>[], headers: { key: string; label: string }[]) {
  const headerRow = headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(';');
  const dataRows = rows.map(row => {
    return headers.map(h => {
      const val = row[h.key] !== undefined && row[h.key] !== null ? String(row[h.key]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    }).join(';');
  });

  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export PDF Helper with formal structure
export function exportRelatorioToPDF(data: RelatorioData, filterInfo: string) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const primaryColor: [number, number, number] = [30, 41, 59]; // Slate 800
  const accentColor: [number, number, number] = [2, 132, 199]; // Sky 600

  // Title & Header Box
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 26, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE CONTROLE DE MANUTENÇÃO DE RÁDIOS', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Fornecedor: Mendonça | Modelo Principal: Motorola DP450', 14, 18);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 23);

  // Filter Info
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(`Filtros aplicados: ${filterInfo}`, 14, 33);

  // Summary Metrics Badges
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Resumo do Período:', 14, 41);

  const startY = 44;
  const metrics = [
    { label: 'Total Registros', val: String(data.summary.total_filtrado) },
    { label: 'Em Andamento', val: String(data.summary.em_andamento) },
    { label: 'Concluídas', val: String(data.summary.concluidas) },
    { label: 'Tempo Médio', val: `${data.summary.tempo_medio_dias} dias` },
  ];

  metrics.forEach((m, idx) => {
    const x = 14 + idx * 47;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x, startY, 44, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, x + 4, startY + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(m.val, x + 4, startY + 11);
  });

  // Table Data
  const tableData = data.records.map(r => [
    r.identificador_ra,
    r.numero_serie,
    r.setor_nome || '-',
    r.defeito,
    formatDate(r.data_ida),
    r.data_volta ? formatDate(r.data_volta) : 'Em andamento',
    r.status === 'concluida' ? `${r.dias_em_manutencao} d` : `${r.dias_em_manutencao} d (aberto)`,
    r.status === 'concluida' ? 'Concluída' : 'Em Manutenção'
  ]);

  autoTable(doc, {
    startY: 64,
    head: [['RA', 'Nº Série', 'Setor', 'Defeito', 'Data Ida', 'Data Volta', 'Tempo', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: accentColor,
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (dataInfo) => {
      // Footer page numbering
      const str = `Página ${doc.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, 196, 287, { align: 'right' });
      doc.text('Sistema de Controle de Manutenção de Rádios - Confidencial', 14, 287);
    }
  });

  doc.save(`relatorio-manutencao-radios-${formatToday()}.pdf`);
}
