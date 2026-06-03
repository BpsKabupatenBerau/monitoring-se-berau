/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Database,
  Edit,
  Filter,
  Info,
  Plus,
  Search,
  Trash2
} from 'lucide-react';
import { Plot, User } from '../types';
import { berauDistricts } from '../data/berauDistricts';

interface PlotManagementProps {
  plots: Plot[];
  users: User[];
  onAddPlot: (plot: Omit<Plot, 'id'>) => Promise<void> | void;
  onUpdatePlot: (id: string, updated: Partial<Plot>) => Promise<void> | void;
  onDeletePlot: (id: string) => void;
}

export default function PlotManagement({
  plots,
  onAddPlot,
  onUpdatePlot,
  onDeletePlot
}: PlotManagementProps) {
  const [districtFilter, setDistrictFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlotId, setEditingPlotId] = useState<string | null>(null);
  const [idSubsls, setIdSubsls] = useState('');
  const [district, setDistrict] = useState('Kelay');
  const [village, setVillage] = useState('');
  const [sls, setSls] = useState('');
  const [subSls, setSubSls] = useState('');
  const [namaSls, setNamaSls] = useState('');
  const [targetPrelist, setTargetPrelist] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setEditingPlotId(null);
    setIdSubsls('');
    setDistrict('Kelay');
    setVillage('');
    setSls('');
    setSubSls('');
    setNamaSls('');
    setTargetPrelist(0);
    setErrorMsg('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (plot: Plot) => {
    setEditingPlotId(plot.id);
    setIdSubsls(plot.idSubsls || plot.id);
    setDistrict(plot.district);
    setVillage(plot.village);
    setSls(plot.sls);
    setSubSls(plot.subSls);
    setNamaSls(plot.namaSls || '');
    setTargetPrelist(plot.targetPrelist || 0);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!idSubsls.trim() || !village.trim() || !sls.trim() || !subSls.trim() || !namaSls.trim()) {
      setErrorMsg('Harap lengkapi ID Sub-SLS, wilayah, SLS, Sub-SLS, dan nama SLS.');
      return;
    }

    if (targetPrelist < 0) {
      setErrorMsg('Target prelist tidak boleh negatif.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Omit<Plot, 'id'> = {
        idSubsls: idSubsls.trim(),
        district,
        village: village.trim(),
        sls: sls.trim(),
        subSls: subSls.trim(),
        namaSls: namaSls.trim(),
        targetPrelist,
        assignedPplId: '',
        assignedPmlId: '',
      };

      if (editingPlotId) {
        await onUpdatePlot(editingPlotId, payload);
      } else {
        await onAddPlot(payload);
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan master plot SLS.';
      setErrorMsg(message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPlots = plots.filter(plot => {
    const matchesDistrict = !districtFilter || plot.district === districtFilter;
    const haystack = [
      plot.id,
      plot.idSubsls,
      plot.district,
      plot.village,
      plot.sls,
      plot.subSls,
      plot.namaSls || '',
    ].join(' ').toLowerCase();
    return matchesDistrict && (!searchQuery || haystack.includes(searchQuery.toLowerCase()));
  });

  return (
    <div className="space-y-6" id="plot-management-panel">
      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-display font-semibold text-slate-900 flex items-center gap-2">
            <Database size={20} className="text-indigo-600" /> Master Plot / Sub-SLS SE2026
          </h1>
          <p className="text-slate-500 text-xs">
            Master wilayah berisi identitas Sub-SLS dan target prelist. Relasi Korwil, PML, dan PPL diatur melalui menu Pengguna Sensus.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus size={14} /> Tambah Sub-SLS
        </button>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={13} className="text-slate-400 shrink-0" />
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="bg-white border border-slate-200 outline-none text-xs px-2.5 py-1.5 rounded-lg w-full sm:w-44"
            >
              <option value="">-- Semua Kecamatan --</option>
              {berauDistricts.map(dist => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Cari idsubsls, desa, SLS, nama SLS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 outline-none text-xs px-2.5 py-1.5 pl-8 rounded-lg w-full sm:w-64 font-mono"
            />
            <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
          </div>
        </div>

        <span className="text-[11px] font-mono text-slate-400 shrink-0">
          Showing {filteredPlots.length} of {plots.length} Sub-SLS
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100/80 bg-slate-50/50 text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-4">ID Sub-SLS</th>
                <th className="py-3 px-4">Kecamatan</th>
                <th className="py-3 px-4">Desa / Kelurahan</th>
                <th className="py-3 px-4">SLS</th>
                <th className="py-3 px-4">Sub-SLS</th>
                <th className="py-3 px-4">Nama SLS</th>
                <th className="py-3 px-4 text-right">Target Prelist</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPlots.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    <Info size={24} className="mx-auto text-slate-300 mb-2" />
                    Tidak ada Sub-SLS yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredPlots.map(plot => (
                  <tr key={plot.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{plot.idSubsls || plot.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{plot.district}</td>
                    <td className="py-3 px-4 text-slate-650">{plot.village}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{plot.sls}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-black">
                        {plot.subSls}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{plot.namaSls || '-'}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-800">{plot.targetPrelist ?? 0}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(plot)}
                          className="p-1 px-2 border border-slate-100 hover:border-slate-200 bg-white rounded hover:bg-slate-50 transition-colors"
                          title="Edit Sub-SLS"
                        >
                          <Edit size={12} className="text-slate-500" />
                        </button>
                        <button
                          onClick={() => onDeletePlot(plot.id)}
                          className="p-1 px-2 border border-slate-100 hover:border-slate-200 bg-white rounded hover:bg-rose-50 hover:border-rose-150 transition-colors"
                          title="Hapus Sub-SLS"
                        >
                          <Trash2 size={12} className="text-rose-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 text-white p-4">
              <h3 className="font-display font-semibold text-sm">
                {editingPlotId ? 'Ubah Master Sub-SLS' : 'Tambah Master Sub-SLS'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-700">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg">{errorMsg}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold block text-slate-400">ID Sub-SLS <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 640305000100100"
                    value={idSubsls}
                    onChange={(e) => setIdSubsls(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 outline-none p-2.5 rounded-lg focus:bg-white text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold block text-slate-400">Kecamatan <span className="text-rose-500">*</span></label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 outline-none p-2.5 rounded-lg focus:bg-white text-xs"
                  >
                    {berauDistricts.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold block text-slate-400">Desa / Kelurahan <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Merasa"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 outline-none p-2.5 rounded-lg focus:bg-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold block text-slate-400">Nama SLS <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Merasa RT 01"
                    value={namaSls}
                    onChange={(e) => setNamaSls(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 outline-none p-2.5 rounded-lg focus:bg-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold block text-slate-400">SLS <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="00100"
                    value={sls}
                    onChange={(e) => setSls(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 outline-none p-2.5 rounded-lg focus:bg-white text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold block text-slate-400">Sub-SLS <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="RT 02"
                    value={subSls}
                    onChange={(e) => setSubSls(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 outline-none p-2.5 rounded-lg focus:bg-white text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold block text-slate-400">Target Prelist <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={targetPrelist || ''}
                    onChange={(e) => setTargetPrelist(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 outline-none p-2.5 rounded-lg focus:bg-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-2.5 rounded-lg font-bold"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Sub-SLS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
