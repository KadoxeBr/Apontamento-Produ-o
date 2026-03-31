import React, { useState } from 'react';
import { gasApi, fmtDateTime } from '../api';

export default function Logs() {
  const [filtros, setFiltros] = useState({
    di: '',
    df: '',
    user: '',
    acao: ''
  });
  const [lista, setLista] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFiltroChange = (e: any) => {
    setFiltros({ ...filtros, [e.target.id]: e.target.value });
  };

  const carregarLogs = async () => {
    setLoading(true);
    try {
      const rows = await gasApi('listLogs', {
        dataInicio: filtros.di || null,
        dataFim: filtros.df || null,
        usuario: filtros.user || null,
        acao: filtros.acao || null
      });
      setLista(rows);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white border border-blue-200 rounded-xl p-5 mb-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-blue-900">Logs (alterações e exclusões)</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Início</label>
          <input type="date" id="di" value={filtros.di} onChange={handleFiltroChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Fim</label>
          <input type="date" id="df" value={filtros.df} onChange={handleFiltroChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Usuário (contém)</label>
          <input type="text" id="user" value={filtros.user} onChange={handleFiltroChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Ação</label>
          <select id="acao" value={filtros.acao} onChange={handleFiltroChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500">
            <option value="">Todas</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
      </div>
      
      <div className="mb-4">
        <button type="button" onClick={carregarLogs} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
          {loading ? 'Carregando...' : 'Carregar logs'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-2 font-semibold border-b border-blue-700">Data/hora</th>
              <th className="p-2 font-semibold border-b border-blue-700">Usuário</th>
              <th className="p-2 font-semibold border-b border-blue-700">Ação</th>
              <th className="p-2 font-semibold border-b border-blue-700">ID apontamento</th>
              <th className="p-2 font-semibold border-b border-blue-700">Justificativa</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((r, i) => (
              <tr key={i} className="border-b border-blue-100 hover:bg-blue-50">
                <td className="p-2">{fmtDateTime(r.dataHora)}</td>
                <td className="p-2">{r.usuario}</td>
                <td className="p-2">{r.acao}</td>
                <td className="p-2">{r.apontamentoId}</td>
                <td className="p-2">{r.justificativa}</td>
              </tr>
            ))}
            {lista.length === 0 && !loading && (
              <tr><td colSpan={5} className="p-4 text-center text-slate-500">Nenhum registro encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
