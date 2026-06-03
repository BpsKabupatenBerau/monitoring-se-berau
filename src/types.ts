/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'ADMIN' | 'REGIONAL_COORDINATOR' | 'PML' | 'PPL';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email?: string;
  password?: string;
  district?: string;       // For Regional Coordinator, PML, PPL
  pmlId?: string;          // For PPL to point to their supervisor
  regCoId?: string;        // For PML to point to their Coordinator
}

export interface Plot {
  id: string;
  idSubsls: string;        // Official Sub-SLS identifier
  district: string;        // Kecamatan
  village: string;         // Desa/Kelurahan
  sls: string;             // Satuan Lingkungan Setempat
  subSls: string;          // Sub-SLS (e.g. RT 01, RT 02)
  namaSls?: string;        // Human-readable SLS name
  targetPrelist?: number;  // Target prelist count
  assignedPplId: string;   // Derived from PPL assignment where available
  assignedPmlId: string;   // Derived from PML assignment where available
}

export type MonitoringStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export interface DailySubmission {
  id: string;
  date: string;            // YYYY-MM-DD
  plotId: string;
  pplId: string;
  submittedByPmlId?: string; // PML who entered the data (and is supervisor)
  completedUnits: number;
  status: MonitoringStatus;
  issueIndicator: boolean;
  issueDescription: string;
  timestamp: string;       // ISO Timestamp
  lastModifiedTimestamp?: string; // last modification timestamp for audit trail
}

export interface Issue {
  id: string;
  submissionId: string;
  pplId: string;
  pplName: string;
  plotId: string;
  areaLabel: string;       // Descriptive location label
  date: string;            // YYYY-MM-DD
  description: string;
  status: 'OPEN' | 'RESOLVED';
  resolutionNotes?: string;
  resolvedAt?: string;
}

// Stats metrics
export interface DashboardStats {
  totalPlots: number;
  reportedPlots: number;   // Number of plots with at least one submission or completed
  unreportedPlots: number; // Plots with no reports in general or not started
  totalIssues: number;
  openIssues: number;
  progressPercentage: number;
}

export interface AssignmentRow {
  id: string;
  idsubsls: string;
  kecamatan: string;
  desa: string;
  nama_sls?: string;

  korwil_id?: string | null;
  pml_id?: string | null;
  ppl_id?: string | null;

  korwil?: {
    id: string;
    nama_lengkap: string;
  } | null;

  pml?: {
    id: string;
    nama_lengkap: string;
  } | null;

  ppl?: {
    id: string;
    nama_lengkap: string;
  } | null;
}