/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Plot, DailySubmission, Issue } from '../types';

// Pre-populated Users list for Berau Regency Economic Census 2026 (SE2026)
export const initialUsers: User[] = [
  // Administrators
  { id: 'admin', username: 'admin', name: 'Admin BPS Berau', role: 'ADMIN' },
  
  // Regional Coordinators (PJ Wilayah)
  { id: 'rc_kelay', username: 'rc_kelay', name: 'Hendra Wijaya', role: 'REGIONAL_COORDINATOR', district: 'Kelay' },
  { id: 'rc_topen', username: 'rc_topen', name: 'Rina Kartika', role: 'REGIONAL_COORDINATOR', district: 'Tanjung Redeb' },
  { id: 'rc_sambaliung', username: 'rc_sambaliung', name: 'Ahmad Sofyan', role: 'REGIONAL_COORDINATOR', district: 'Sambaliung' },

  // Field Supervisors (PML)
  { id: 'sukarsono', username: 'sukarsono', name: 'Sukarsono', role: 'PML', district: 'Kelay', regCoId: 'rc_kelay' },
  { id: 'pml_yuni', username: 'pml_yuni', name: 'Yuni Lestari', role: 'PML', district: 'Kelay', regCoId: 'rc_kelay' },
  { id: 'pml_bambang', username: 'pml_bambang', name: 'Bambang Utomo', role: 'PML', district: 'Tanjung Redeb', regCoId: 'rc_topen' },
  { id: 'pml_dewi', username: 'pml_dewi', name: 'Dewi Rahma', role: 'PML', district: 'Sambaliung', regCoId: 'rc_sambaliung' },

  // Field Enumerators (PPL) under Sukarsono (Kelay)
  { id: 'ppl_pandu', username: 'ppl_pandu', name: 'Pandu Baskoro', role: 'PPL', district: 'Kelay', pmlId: 'sukarsono' },
  { id: 'ppl_anis', username: 'ppl_anis', name: 'Anis Rahmawati', role: 'PPL', district: 'Kelay', pmlId: 'sukarsono' },
  { id: 'ppl_dodi', username: 'ppl_dodi', name: 'Dodi Ardiansyah', role: 'PPL', district: 'Kelay', pmlId: 'sukarsono' },
  { id: 'ppl_eko', username: 'ppl_eko', name: 'Eko Prasetyo', role: 'PPL', district: 'Kelay', pmlId: 'sukarsono' },
  { id: 'ppl_farhan', username: 'ppl_farhan', name: 'Farhan Ramadhan', role: 'PPL', district: 'Kelay', pmlId: 'sukarsono' },

  // Field Enumerators (PPL) under Yuni Lestari (Kelay)
  { id: 'ppl_gina', username: 'ppl_gina', name: 'Gina Amelia', role: 'PPL', district: 'Kelay', pmlId: 'pml_yuni' },
  { id: 'ppl_hari', username: 'ppl_hari', name: 'Hari Budiman', role: 'PPL', district: 'Kelay', pmlId: 'pml_yuni' },

  // Field Enumerators (PPL) under Bambang Utomo (Tanjung Redeb)
  { id: 'ppl_indra', username: 'ppl_indra', name: 'Indra Hermawan', role: 'PPL', district: 'Tanjung Redeb', pmlId: 'pml_bambang' },
  { id: 'ppl_joko', username: 'ppl_joko', name: 'Joko Susilo', role: 'PPL', district: 'Tanjung Redeb', pmlId: 'pml_bambang' },

  // Field Enumerators (PPL) under Dewi Rahma (Sambaliung)
  { id: 'ppl_kiki', username: 'ppl_kiki', name: 'Kiki Fatmala', role: 'PPL', district: 'Sambaliung', pmlId: 'pml_dewi' },
  { id: 'ppl_lukman', username: 'ppl_lukman', name: 'Lukman Hakim', role: 'PPL', district: 'Sambaliung', pmlId: 'pml_dewi' }
];

// Initial Master Plots dataset derived from official SE2026 assignments
export const initialPlots: Plot[] = [
  // Kelay - Sukarsono Supervising
  { id: 'plot_001', idSubsls: 'plot_001', district: 'Kelay', village: 'Merasa', sls: '00100', subSls: 'RT 01', assignedPplId: 'ppl_pandu', assignedPmlId: 'sukarsono' },
  { id: 'plot_002', idSubsls: 'plot_002', district: 'Kelay', village: 'Merasa', sls: '00100', subSls: 'RT 02', assignedPplId: 'ppl_pandu', assignedPmlId: 'sukarsono' },
  { id: 'plot_003', idSubsls: 'plot_003', district: 'Kelay', village: 'Muara Lesan', sls: '00200', subSls: 'RT 01', assignedPplId: 'ppl_anis', assignedPmlId: 'sukarsono' },
  { id: 'plot_004', idSubsls: 'plot_004', district: 'Kelay', village: 'Muara Lesan', sls: '00200', subSls: 'RT 02', assignedPplId: 'ppl_anis', assignedPmlId: 'sukarsono' },
  { id: 'plot_005', idSubsls: 'plot_005', district: 'Kelay', village: 'Long Gih', sls: '00300', subSls: 'RT 01', assignedPplId: 'ppl_dodi', assignedPmlId: 'sukarsono' },
  { id: 'plot_006', idSubsls: 'plot_006', district: 'Kelay', village: 'Sido Mulyo', sls: '00400', subSls: 'RT 01', assignedPplId: 'ppl_eko', assignedPmlId: 'sukarsono' },
  { id: 'plot_007', idSubsls: 'plot_007', district: 'Kelay', village: 'Sido Mulyo', sls: '00400', subSls: 'RT 02', assignedPplId: 'ppl_eko', assignedPmlId: 'sukarsono' },
  { id: 'plot_008', idSubsls: 'plot_008', district: 'Kelay', village: 'Sido Mulyo', sls: '00400', subSls: 'RT 03', assignedPplId: 'ppl_farhan', assignedPmlId: 'sukarsono' },

  // Kelay - Yuni Lestari Supervising
  { id: 'plot_009', idSubsls: 'plot_009', district: 'Kelay', village: 'Lesan Dayak', sls: '00500', subSls: 'RT 01', assignedPplId: 'ppl_gina', assignedPmlId: 'pml_yuni' },
  { id: 'plot_010', idSubsls: 'plot_010', district: 'Kelay', village: 'Lesan Dayak', sls: '00500', subSls: 'RT 02', assignedPplId: 'ppl_gina', assignedPmlId: 'pml_yuni' },
  { id: 'plot_011', idSubsls: 'plot_011', district: 'Kelay', village: 'Mapulu', sls: '00600', subSls: 'RT 01', assignedPplId: 'ppl_hari', assignedPmlId: 'pml_yuni' },

  // Tanjung Redeb - Bambang Utomo Supervising
  { id: 'plot_012', idSubsls: 'plot_012', district: 'Tanjung Redeb', village: 'Bugis', sls: '00101', subSls: 'RT 01', assignedPplId: 'ppl_indra', assignedPmlId: 'pml_bambang' },
  { id: 'plot_013', idSubsls: 'plot_013', district: 'Tanjung Redeb', village: 'Bugis', sls: '00101', subSls: 'RT 02', assignedPplId: 'ppl_indra', assignedPmlId: 'pml_bambang' },
  { id: 'plot_014', idSubsls: 'plot_014', district: 'Tanjung Redeb', village: 'Karang Ambun', sls: '00201', subSls: 'RT 03', assignedPplId: 'ppl_joko', assignedPmlId: 'pml_bambang' },
  { id: 'plot_015', idSubsls: 'plot_015', district: 'Tanjung Redeb', village: 'Gayam', sls: '00301', subSls: 'RT 05', assignedPplId: 'ppl_joko', assignedPmlId: 'pml_bambang' },

  // Sambaliung - Dewi Rahma Supervising
  { id: 'plot_016', idSubsls: 'plot_016', district: 'Sambaliung', village: 'Sambaliung', sls: '00102', subSls: 'RT 01', assignedPplId: 'ppl_kiki', assignedPmlId: 'pml_dewi' },
  { id: 'plot_017', idSubsls: 'plot_017', district: 'Sambaliung', village: 'Sambaliung', sls: '00102', subSls: 'RT 02', assignedPplId: 'ppl_kiki', assignedPmlId: 'pml_dewi' },
  { id: 'plot_018', idSubsls: 'plot_018', district: 'Sambaliung', village: 'Bebiban', sls: '00202', subSls: 'RT 01', assignedPplId: 'ppl_lukman', assignedPmlId: 'pml_dewi' }
];

// Initial Daily Monitoring Submissions (June 1st, 2026 & June 2nd, 2026)
export const initialSubmissions: DailySubmission[] = [
  // YESTERDAY: June 1st, 2026
  {
    id: 'sub_001',
    date: '2026-06-01',
    plotId: 'plot_001',
    pplId: 'ppl_pandu',
    completedUnits: 12,
    status: 'IN_PROGRESS',
    issueIndicator: false,
    issueDescription: '',
    timestamp: '2026-06-01T15:30:00Z'
  },
  {
    id: 'sub_002',
    date: '2026-06-01',
    plotId: 'plot_003',
    pplId: 'ppl_anis',
    completedUnits: 15,
    status: 'COMPLETED',
    issueIndicator: false,
    issueDescription: '',
    timestamp: '2026-06-01T16:15:00Z'
  },
  {
    id: 'sub_003',
    date: '2026-06-01',
    plotId: 'plot_005',
    pplId: 'ppl_dodi',
    completedUnits: 8,
    status: 'IN_PROGRESS',
    issueIndicator: true,
    issueDescription: 'Akses ke dusun Long Gih terhambat jembatan rusak akibat luapan air sungai Kelay.',
    timestamp: '2026-06-01T14:45:00Z'
  },
  {
    id: 'sub_004',
    date: '2026-06-01',
    plotId: 'plot_006',
    pplId: 'ppl_eko',
    completedUnits: 18,
    status: 'IN_PROGRESS',
    issueIndicator: false,
    issueDescription: '',
    timestamp: '2026-06-01T17:02:00Z'
  },
  {
    id: 'sub_005',
    date: '2026-06-01',
    plotId: 'plot_009',
    pplId: 'ppl_gina',
    completedUnits: 10,
    status: 'COMPLETED',
    issueIndicator: false,
    issueDescription: '',
    timestamp: '2026-06-01T16:55:00Z'
  },
  {
    id: 'sub_006',
    date: '2026-06-01',
    plotId: 'plot_012',
    pplId: 'ppl_indra',
    completedUnits: 25,
    status: 'IN_PROGRESS',
    issueIndicator: false,
    issueDescription: '',
    timestamp: '2026-06-01T17:30:00Z'
  },
  {
    id: 'sub_007',
    date: '2026-06-01',
    plotId: 'plot_014',
    pplId: 'ppl_joko',
    completedUnits: 5,
    status: 'BLOCKED',
    issueIndicator: true,
    issueDescription: 'Banyak pemilik usaha menolak diwawancarai karena sedang sibuk pameran pembangunan daerah.',
    timestamp: '2026-06-01T13:10:00Z'
  },
  {
    id: 'sub_008',
    date: '2026-06-01',
    plotId: 'plot_016',
    pplId: 'ppl_kiki',
    completedUnits: 14,
    status: 'IN_PROGRESS',
    issueIndicator: false,
    issueDescription: '',
    timestamp: '2026-06-01T16:00:00Z'
  },

  // TODAY: June 2nd, 2026 (Partially submitted to demonstrate live real-time compliance tracking!)
  {
    id: 'sub_009',
    date: '2026-06-02',
    plotId: 'plot_001',
    pplId: 'ppl_pandu',
    completedUnits: 16,
    status: 'COMPLETED',
    issueIndicator: false,
    issueDescription: '',
    timestamp: '2026-06-02T13:40:00Z'
  },
  {
    id: 'sub_010',
    date: '2026-06-02',
    plotId: 'plot_004',
    pplId: 'ppl_anis',
    completedUnits: 20,
    status: 'IN_PROGRESS',
    issueIndicator: false,
    issueDescription: '',
    timestamp: '2026-06-02T14:15:00Z'
  },
  {
    id: 'sub_011',
    date: '2026-06-02',
    plotId: 'plot_007',
    pplId: 'ppl_eko',
    completedUnits: 11,
    status: 'COMPLETED',
    issueIndicator: false,
    issueDescription: '',
    timestamp: '2026-06-02T15:10:00Z'
  }
];

// Initial Issues list derived from submissions
export const initialIssues: Issue[] = [
  {
    id: 'issue_001',
    submissionId: 'sub_003',
    pplId: 'ppl_dodi',
    pplName: 'Dodi Ardiansyah',
    plotId: 'plot_005',
    areaLabel: 'Kelay - Long Gih - RT 01',
    date: '2026-06-01',
    description: 'Akses ke dusun Long Gih terhambat jembatan rusak akibat luapan air sungai Kelay.',
    status: 'OPEN'
  },
  {
    id: 'issue_002',
    submissionId: 'sub_007',
    pplId: 'ppl_joko',
    pplName: 'Joko Susilo',
    plotId: 'plot_014',
    areaLabel: 'Tanjung Redeb - Karang Ambun - RT 03',
    date: '2026-06-01',
    description: 'Banyak pemilik usaha menolak diwawancarai karena sedang sibuk pameran pembangunan daerah.',
    status: 'OPEN'
  }
];

// List of all districts in Berau Regency for selection filters
export const berauDistricts = [
  'Kelay',
  'Tanjung Redeb',
  'Sambaliung',
  'Gunung Tabur',
  'Biduk-Biduk',
  'Talisayan',
  'Maratua',
  'Derawan',
  'Segah',
  'Tabalar',
  'Batu Putih',
  'Sabanar',
  'Teluk Bayur'
];
