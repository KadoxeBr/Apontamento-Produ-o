import React, { useState } from 'react';
import { gasApi, fmtDate, fmtDateBR, classificarDescricao } from '../api';

export default function Relatorios({ fornecedores, marcas }: any) {
  const [filtros, setFiltros] = useState({
    di: '',
    df: '',
    cc: 'todos',
    ip: 'todos',
    desc: 'todos',
    camara: '',
    turno: '',
    forn: '',
    marca: ''
  });
  const [lista, setLista] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resumo, setResumo] = useState('');

  const handleFiltroChange = (e: any) => {
    setFiltros({ ...filtros, [e.target.id]: e.target.value });
  };

  const gerarRelatorio = async () => {
    setLoading(true);
    try {
      const rows = await gasApi('listApontamentos', {
        dataInicio: filtros.di || null,
        dataFim: filtros.df || null,
        camara: filtros.camara || null,
        turno: filtros.turno || null,
        fornecedor: filtros.forn || null,
        marca: filtros.marca || null,
        cruCozido: filtros.cc,
        inteiroParte: filtros.ip,
        descascadoFiltro: filtros.desc
      });
      
      setLista(rows);
      
      let sumCx = 0;
      let sumKg = 0;
      rows.forEach((r: any) => {
        sumCx += parseFloat(r.apontamentoCx) || 0;
        sumKg += parseFloat(r.apontamentoKg) || 0;
      });
      
      setResumo(`Registros: ${rows.length} | Total cx: ${sumCx.toFixed(2)} | Total kg: ${sumKg.toFixed(3)}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const exportarCsv = () => {
    if (!lista.length) {
      alert('Gere o relatório antes.');
      return;
    }
    
    const headers = [
      'dataEmbalagem', 'camara', 'turno', 'cruCozido', 'inteiroSemCabeca', 
      'descascado', 'codInterno', 'descricaoProduto', 'apontamentoCx', 
      'apontamentoKg', 'fornecedor', 'marca'
    ];
    
    const lines = [headers.join(';')];
    
    lista.forEach(r => {
      const cl = classificarDescricao(r.descricaoProduto);
      const row = [
        fmtDate(r.dataEmbalagem),
        r.camara,
        r.turno,
        cl.cruCozido,
        cl.inteiroParte,
        cl.descascado,
        r.codInterno,
        `"${String(r.descricaoProduto || '').replace(/"/g, '""')}"`,
        r.apontamentoCx,
        r.apontamentoKg,
        r.fornecedor,
        r.marca
      ];
      lines.push(row.join(';'));
    });
    
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'relatorio_apontamentos.csv';
    a.click();
  };

  return (
    <section className="bg-white border border-blue-200 rounded-xl p-5 mb-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-2 text-blue-900">Relatório analítico</h2>
      <p className="text-xs text-slate-500 mb-4">
        Classificação automática pela descrição: Cru/Cozido (palavras "cozido" ou "coz"); Inteiro/Sem cabeça (presença de "cabeça"); Descascado ("descasc" ou "descas").
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Período — início</label>
          <input type="date" id="di" value={filtros.di} onChange={handleFiltroChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Período — fim</label>
          <input type="date" id="df" value={filtros.df} onChange={handleFiltroChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Cru / Cozido</label>
          <select id="cc" value={filtros.cc} onChange={handleFiltroChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500">
            <option value="todos">Todos</option>
            <option value="Cru">Cru</option>
            <option value="Cozido">Cozido</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Inteiro / Sem cabeça</label>
          <select id="ip" value={filtros.ip} onChange={handleFiltroChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500">
            <option value="todos">Todos</option>
            <option value="Inteiro">Inteiro</option>
            <option value="Sem cabeça">Sem cabeça</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Descascado</label>
          <select id="desc" value={filtros.desc} onChange={handleFiltroChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500">
            <option value="todos">Todos</option>
            <option value="Descascado">Descascado</option>
            <option value="Não descascado">Não descascado</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Câmara</label>
          <select id="camara" value={filtros.camara} onChange={handleFiltroChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500">
            <option value="">Todas</option>
            <option value="01">01</option>
            <option value="02">02</option>
            <option value="03">03</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Turno</label>
          <select id="turno" value={filtros.turno} onChange={handleFiltroChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500">
            <option value="">Todos</option>
            <option value="Dia">Dia</option>
            <option value="Noite">Noite</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Fornecedor</label>
          <select id="forn" value={filtros.forn} onChange={handleFiltroChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500">
            <option value="">Todas</option>
            {fornecedores.map((f: string) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Marca</label>
          <select id="marca" value={filtros.marca} onChange={handleFiltroChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500">
            <option value="">Todas</option>
            {marcas.map((m: string) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" onClick={gerarRelatorio} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
          {loading ? 'Gerando...' : 'Gerar'}
        </button>
        <button type="button" onClick={exportarCsv} className="bg-transparent border border-blue-200 hover:border-blue-400 text-blue-900 px-4 py-2 rounded-lg transition-colors">
          Exportar CSV
        </button>
      </div>

      {resumo && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-blue-50 border border-blue-200 text-blue-900">
          {resumo}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-2 font-semibold border-b border-blue-700">Data emb.</th>
              <th className="p-2 font-semibold border-b border-blue-700">Câmara</th>
              <th className="p-2 font-semibold border-b border-blue-700">Turno</th>
              <th className="p-2 font-semibold border-b border-blue-700">Classif.</th>
              <th className="p-2 font-semibold border-b border-blue-700">Cód.</th>
              <th className="p-2 font-semibold border-b border-blue-700">Descrição</th>
              <th className="p-2 font-semibold border-b border-blue-700">Cx</th>
              <th className="p-2 font-semibold border-b border-blue-700">Kg</th>
              <th className="p-2 font-semibold border-b border-blue-700">Fornecedor</th>
              <th className="p-2 font-semibold border-b border-blue-700">Marca</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(r => {
              const cl = classificarDescricao(r.descricaoProduto);
              return (
                <tr key={r.id} className="border-b border-blue-100 hover:bg-blue-50">
                  <td className="p-2">{fmtDateBR(r.dataEmbalagem)}</td>
                  <td className="p-2">{r.camara}</td>
                  <td className="p-2">{r.turno}</td>
                  <td className="p-2">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-blue-100 border border-blue-200 mr-1 mb-1">{cl.cruCozido}</span>
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-blue-100 border border-blue-200 mr-1 mb-1">{cl.inteiroParte}</span>
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-blue-100 border border-blue-200 mr-1 mb-1">{cl.descascado}</span>
                  </td>
                  <td className="p-2">{r.codInterno}</td>
                  <td className="p-2">{r.descricaoProduto}</td>
                  <td className="p-2">{r.apontamentoCx}</td>
                  <td className="p-2">{r.apontamentoKg}</td>
                  <td className="p-2">{r.fornecedor}</td>
                  <td className="p-2">{r.marca}</td>
                </tr>
              );
            })}
            {lista.length === 0 && !loading && (
              <tr><td colSpan={10} className="p-4 text-center text-slate-500">Nenhum registro encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
