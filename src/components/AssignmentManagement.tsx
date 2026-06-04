import React, { useEffect, useMemo, useState } from 'react';
import {
  getAssignments,
  getKorwilList,
  getPmlList,
  getPplList,
  bulkAssignPlots
} from '../lib/supabaseService';

export default function AssignmentManagement({
  readOnly = false,
}: {
  readOnly?: boolean;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [korwils, setKorwils] = useState<any[]>([]);
  const [pmls, setPmls] = useState<any[]>([]);
  const [ppls, setPpls] = useState<any[]>([]);

  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const [selectedKorwil, setSelectedKorwil] = useState('');
  const [selectedPml, setSelectedPml] = useState('');
  const [selectedPpl, setSelectedPpl] = useState('');

  const [filterKecamatan, setFilterKecamatan] = useState('');
  const [filterDesa, setFilterDesa] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [
      assignments,
      korwilData,
      pmlData,
      pplData
    ] = await Promise.all([
      getAssignments(),
      getKorwilList(),
      getPmlList(),
      getPplList()
    ]);

    setRows(assignments);
    setKorwils(korwilData);
    setPmls(pmlData);
    setPpls(pplData);
  }

  const filteredRows = useMemo(() => {
    return rows.filter(row => {

      if (
        filterKecamatan &&
        row.kecamatan !== filterKecamatan
      ) {
        return false;
      }

      if (
        filterDesa &&
        row.desa !== filterDesa
      ) {
        return false;
      }

      if (
        search &&
        !row.idsubsls
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [rows, filterKecamatan, filterDesa, search]);

  const desaOptions = useMemo(() => {
    let data = rows;
    if (filterKecamatan) {
      data = data.filter(
        r => r.kecamatan === filterKecamatan
      );
    }

    return [...new Set(data.map(r => r.desa))].sort();
  }, [rows, filterKecamatan]);

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);
  const paginatedRows = filteredRows.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [filterKecamatan, filterDesa, search]);

  async function handleAssign() {
    if (readOnly) return;

    if (selectedRows.length === 0) {
      alert('Pilih minimal satu SubSLS');
      return;
    }

    await bulkAssignPlots(
      selectedRows,
      selectedKorwil || null,
      selectedPml || null,
      selectedPpl || null
    );

    alert('Penugasan berhasil');

    await loadData();

    setSelectedRows([]);
  }

  return (
    <div className="geo-card p-6 space-y-6">

      <h2 className="font-display font-black text-xl">
        Penugasan Wilayah
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

      <div className="geo-card p-3">
        <div className="text-xs">
          Total SubSLS
        </div>
        <div className="text-xl font-bold">
          {rows.length}
        </div>
      </div>


      <div className="geo-card p-3">
        <div className="text-xs">
          Hasil Filter
        </div>
        <div className="text-xl font-bold">
          {filteredRows.length}
        </div>
      </div>


      <div className="geo-card p-3">
        <div className="text-xs">
          Dipilih
        </div>
        <div className="text-xl font-bold">
          {selectedRows.length}
        </div>
      </div>


      <div className="geo-card p-3">
        <div className="text-xs">
          Sudah Assigned
        </div>
        <div className="text-xl font-bold">
          {
            rows.filter(
              r =>
                r.korwil_id ||
                r.pml_id ||
                r.ppl_id
            ).length
          }
        </div>
      </div>


    </div>

      {/* Filters */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

        <input
          placeholder="Cari IDSUBSLS"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="geo-input"
        />

        <select
          value={filterKecamatan}
          onChange={(e) => {setFilterKecamatan(e.target.value);
              setFilterDesa('');
          }} 
        >
          <option value="">Semua Kecamatan</option>

          {[...new Set(rows.map(r => r.kecamatan))]
            .sort()
            .map(kec => (
              <option key={kec}>
                {kec}
              </option>
            ))}
        </select>

        <select
          value={filterDesa}
          onChange={(e) => setFilterDesa(e.target.value)}
        >
          <option value="">Semua Desa</option>

          {desaOptions.map(desa => (
            <option key={desa}>
              {desa}
            </option>
          ))}
        </select>

      </div>

      {/* Table */}

      <div className="overflow-auto border">

        <table className="w-full text-sm">

          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={
                    paginatedRows.length > 0 &&
                    paginatedRows.every(
                      row =>
                        selectedRows.includes(
                          row.id
                        )
                    )
                  }
                  onChange={(e) => {


                    const pageIds =
                      paginatedRows.map(
                        r => r.id
                      );


                    if (e.target.checked) {


                      setSelectedRows(prev => [
                        ...new Set([
                          ...prev,
                          ...pageIds
                        ])
                      ]);


                    } else {


                      setSelectedRows(prev =>
                        prev.filter(
                          id =>
                            !pageIds.includes(id)
                        )
                      );


                    }


                  }}
                />
              </th>
            </tr>
          </thead>

          <tbody>

            {paginatedRows.map(row => (

              <tr key={row.id}>

                <td>
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(row.id)}
                    onChange={(e) => {

                      if (e.target.checked) {
                        setSelectedRows(prev => [
                          ...prev,
                          row.id
                        ]);
                      } else {
                        setSelectedRows(prev =>
                          prev.filter(
                            id => id !== row.id
                          )
                        );
                      }
                    }}
                  />
                </td>

                <td>{row.idsubsls}</td>
                <td>{row.kecamatan}</td>
                <td>{row.desa}</td>

                <td>
                  {row.korwil?.nama_lengkap ?? '-'}
                </td>

                <td>
                  {row.pml?.nama_lengkap ?? '-'}
                </td>

                <td>
                  {row.ppl?.nama_lengkap ?? '-'}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        <div className="geo-card p-3">
          <div className="text-xs">
            Total SubSLS
          </div>
          <div className="text-xl font-bold">
            {rows.length}
          </div>
        </div>

        <div className="geo-card p-3">
          <div className="text-xs">
            Hasil Filter
          </div>
          <div className="text-xl font-bold">
            {filteredRows.length}
          </div>
        </div>

        <div className="geo-card p-3">
          <div className="text-xs">
            Dipilih
          </div>
          <div className="text-xl font-bold">
            {selectedRows.length}
          </div>
        </div>

        <div className="geo-card p-3">
          <div className="text-xs">
            Sudah Assigned
          </div>
          <div className="text-xl font-bold">
            {
              rows.filter(
                r =>
                  r.korwil_id ||
                  r.pml_id ||
                  r.ppl_id
              ).length
            }
          </div>
        </div>

      </div><div className="flex items-center justify-between p-3 border-t">

        <div className="text-sm">

          Menampilkan
          {' '}

          {(page - 1) * PAGE_SIZE + 1}

          -

          {Math.min(
            page * PAGE_SIZE,
            filteredRows.length
          )}

          dari

          {' '}

          {filteredRows.length}
        </div>

        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() =>
              setPage(p => p - 1)
            }
            className="geo-button"
          >
            Prev
          </button>

          <div className="px-3 py-2">
            {page} / {totalPages}
          </div>

          <button
            disabled={
              page === totalPages
            }
            onClick={() =>
              setPage(p => p + 1)
            }
            className="geo-button"
          >
            Next
          </button>
        </div>
      </div>

      </div>

      {/* Assignment Panel */}

      {!readOnly && (

        <div className="geo-card p-4 space-y-3">

          <div>
            Selected :
            <strong>
              {' '}
              {selectedRows.length}
            </strong>
          </div>

          <div className="grid md:grid-cols-3 gap-3">

            <select
              value={selectedKorwil}
              onChange={(e) =>
                setSelectedKorwil(
                  e.target.value
                )
              }
            >
              <option value="">
                Pilih Korwil
              </option>

              {korwils.map(k => (
                <option
                  key={k.id}
                  value={k.id}
                >
                  {k.nama_lengkap}
                </option>
              ))}
            </select>

            <select
              value={selectedPml}
              onChange={(e) =>
                setSelectedPml(
                  e.target.value
                )
              }
            >
              <option value="">
                Pilih PML
              </option>

              {pmls.map(p => (
                <option
                  key={p.id}
                  value={p.id}
                >
                  {p.nama_lengkap}
                </option>
              ))}
            </select>

            <select
              value={selectedPpl}
              onChange={(e) =>
                setSelectedPpl(
                  e.target.value
                )
              }
            >
              <option value="">
                Pilih PPL
              </option>

              {ppls.map(p => (
                <option
                  key={p.id}
                  value={p.id}
                >
                  {p.nama_lengkap}
                </option>
              ))}
            </select>

          </div>

          <button
            onClick={handleAssign}
            className="geo-button"
          >
            Assign
          </button>

        </div>

      )}

    </div>
  );
}