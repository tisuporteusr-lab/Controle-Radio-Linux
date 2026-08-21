export type RadioStatus = 'em_uso' | 'em_manutencao' | 'disponivel' | 'inativo';
export type ManutencaoStatus = 'em_manutencao' | 'concluida';
export type UserProfile = 'admin' | 'usuario';
export type UserStatus = 'ativo' | 'inativo';

export interface User {
  id: number;
  nome: string;
  email: string;
  perfil: UserProfile;
  status: UserStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Setor {
  id: number;
  nome: string;
  descricao?: string;
  status: 'ativo' | 'inativo';
  total_radios_ativos?: number;
  radios_em_manutencao?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Radio {
  id: number;
  numero_serie: string;
  modelo: string;
  identificador_ra: string;
  fornecedor: string;
  setor_id: number;
  setor_nome?: string;
  status: RadioStatus;
  observacoes?: string;
  termo_pdf_nome?: string | null;
  termo_pdf_path?: string | null;
  termo_pdf_uploaded_at?: string | null;
  created_at?: string;
  updated_at?: string;
  total_manutencoes?: number;
  ultima_manutencao_data?: string | null;
  manutencao_ativa_id?: number | null;
  manutencao_ativa_data_ida?: string | null;
  manutencao_ativa_defeito?: string | null;
  dias_em_manutencao_atual?: number | null;
}

export interface Manutencao {
  id: number;
  radio_id: number;
  identificador_ra: string;
  numero_serie: string;
  modelo: string;
  fornecedor?: string;
  setor_id?: number;
  setor_nome?: string;
  radio_status?: RadioStatus;
  data_ida: string;
  data_volta?: string | null;
  defeito: string;
  observacoes?: string;
  servico_realizado?: string | null;
  status: ManutencaoStatus;
  status_retorno?: 'em_uso' | 'disponivel' | null;
  dias_em_manutencao: number;
  created_at?: string;
  updated_at?: string;
}

export interface RadioDetailResponse {
  radio: Radio;
  stats: {
    total_manutencoes: number;
    total_dias_manutencao: number;
    em_aberto: number;
    ultima_manutencao: string | null;
  };
  history: Array<Manutencao & { dias: number }>;
}

export interface DashboardMetrics {
  total_radios: number;
  radios_em_uso: number;
  radios_em_manutencao: number;
  radios_disponiveis: number;
  radios_inativos: number;
  total_manutencoes: number;
  manutencoes_em_andamento: number;
  manutencoes_concluidas: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  active_maintenances: Array<Manutencao & { dias_em_manutencao: number }>;
  sector_distribution: Array<{
    setor_nome: string;
    total_radios: number;
    em_manutencao: number;
  }>;
  recent_activity: Array<Manutencao & { dias: number }>;
}

export interface RelatorioData {
  summary: {
    total_filtrado: number;
    em_andamento: number;
    concluidas: number;
    tempo_medio_dias: number;
  };
  top_problem_radios: Array<{
    ra: string;
    serial: string;
    modelo: string;
    setor: string;
    count: number;
    total_dias: number;
  }>;
  top_defects: Array<{
    defeito: string;
    total: number;
  }>;
  by_sector: Array<{
    setor: string;
    total: number;
  }>;
  by_model: Array<{
    modelo: string;
    total: number;
  }>;
  records: Manutencao[];
}

export interface SystemInfo {
  appName: string;
  version: string;
  serverTime: string;
  networkIps: string[];
  lanAccessExample: string;
  httpsDomainExample: string;
}
