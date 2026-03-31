import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { gasApi } from '../api';

export default function Cadastro({ refreshLists, gasUrl, setGasUrl }: any) {
  const [msgProd, setMsgProd] = useState({ text: '', ok: true });
  const [msgCli, setMsgCli] = useState({ text: '', ok: true });
  const [msgMarca, setMsgMarca] = useState({ text: '', ok: true });

  const [prodForm, setProdForm] = useState({ codInterno: '', descricao: '' });
  const [clienteNome, setClienteNome] = useState('');
  const [marcaNome, setMarcaNome] = useState('');

  const handleAddProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.codInterno || !prodForm.descricao) {
      setMsgProd({ text: 'Preencha código e descrição.', ok: false });
      return;
    }
    setMsgProd({ text: 'Salvando...', ok: true });
    try {
      await gasApi('importCodigos', [prodForm]);
      setMsgProd({ text: 'Produto cadastrado com sucesso!', ok: true });
      setProdForm({ codInterno: '', descricao: '' });
      refreshLists();
    } catch (err: any) {
      setMsgProd({ text: err.message, ok: false });
    }
  };

  const handleImportXlsx = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setMsgProd({ text: 'Importando...', ok: true });
    
    try {
      const reader = new FileReader();
      reader.onload = async (ev: any) => {
        let rows: any[] = [];
        if (file.name.toLowerCase().endsWith('.csv')) {
          const text = ev.target.result;
          text.split(/\r?\n/).forEach((line: string) => {
            if (!line.trim()) return;
            const p = line.split(/[;,]/);
            rows.push({ codInterno: (p[0] || '').trim(), descricao: (p[1] || '').trim() });
          });
        } else {
          const data = new Uint8Array(ev.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const arr = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          arr.forEach((row: any) => {
            if (!row || !row.length) return;
            rows.push({
              codInterno: String(row[0] != null ? row[0] : '').trim(),
              descricao: String(row[1] != null ? row[1] : '').trim()
            });
          });
        }
        
        // Skip header
        if (rows.length > 0) {
          const c = String(rows[0].codInterno || '');
          const d = String(rows[0].descricao || '');
          if (/^cod|interno|c[oó]d/i.test(c) || /descri|produto/i.test(d)) {
            rows = rows.slice(1);
          }
        }
        
        const validRows = rows.filter(r => r.codInterno);
        const res = await gasApi('importCodigos', validRows);
        setMsgProd({ text: `Importados/atualizados: ${res.total} códigos.`, ok: true });
        refreshLists();
      };
      
      if (file.name.toLowerCase().endsWith('.csv')) reader.readAsText(file);
      else reader.readAsArrayBuffer(file);
    } catch (err: any) {
      setMsgProd({ text: err.message, ok: false });
    }
  };

  const handleAddCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNome.trim()) {
      setMsgCli({ text: 'Informe o nome do cliente.', ok: false });
      return;
    }
    setMsgCli({ text: 'Salvando...', ok: true });
    try {
      await gasApi('adicionarListaItem', { tipo: 'FORNECEDOR', nome: clienteNome.trim() });
      setMsgCli({ text: 'Cliente cadastrado com sucesso!', ok: true });
      setClienteNome('');
      refreshLists();
    } catch (err: any) {
      setMsgCli({ text: err.message, ok: false });
    }
  };

  const handleAddMarca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marcaNome.trim()) {
      setMsgMarca({ text: 'Informe o nome da marca.', ok: false });
      return;
    }
    setMsgMarca({ text: 'Salvando...', ok: true });
    try {
      await gasApi('adicionarListaItem', { tipo: 'MARCA', nome: marcaNome.trim() });
      setMsgMarca({ text: 'Marca cadastrada com sucesso!', ok: true });
      setMarcaNome('');
      refreshLists();
    } catch (err: any) {
      setMsgMarca({ text: err.message, ok: false });
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-blue-900">Configurações do Sistema</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[300px]">
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">URL do Google Apps Script (Web App)</label>
            <input 
              type="url" 
              value={gasUrl} 
              onChange={e => setGasUrl(e.target.value)} 
              className="w-full p-2 rounded-lg border border-blue-200 focus:outline-none focus:border-blue-500" 
            />
          </div>
          <button 
            onClick={() => { 
              localStorage.setItem('gasUrl', gasUrl); 
              alert('URL salva com sucesso!'); 
            }} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors h-[42px]"
          >
            Salvar URL
          </button>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 text-xs text-slate-600">
          <strong>Instruções de Instalação do Backend:</strong>
          <ol className="list-decimal pl-4 mt-2 space-y-1">
            <li>Crie uma nova Planilha no Google Sheets.</li>
            <li>Vá em Extensões &gt; Apps Script.</li>
            <li>Cole o código do arquivo <code>backend-gas/Code.js</code> gerado.</li>
            <li>Clique em Implantar &gt; Nova Implantação &gt; App da Web.</li>
            <li>Execute como: "Você", Acesso: "Qualquer pessoa".</li>
            <li>Copie a URL gerada e cole no campo acima.</li>
          </ol>
        </div>
      </section>

      <section className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-blue-900">Cadastro de Produtos</h2>
        <form onSubmit={handleAddProduto} className="flex flex-wrap items-end gap-4 mb-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Cód. Interno</label>
            <input type="text" value={prodForm.codInterno} onChange={e => setProdForm({...prodForm, codInterno: e.target.value})} className="w-full p-2 rounded-lg border border-blue-200 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex-[2] min-w-[200px]">
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Descrição do Produto</label>
            <input type="text" value={prodForm.descricao} onChange={e => setProdForm({...prodForm, descricao: e.target.value})} className="w-full p-2 rounded-lg border border-blue-200 focus:outline-none focus:border-blue-500" />
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors h-[42px]">Cadastrar Produto</button>
        </form>
        
        <div className="mt-6 pt-4 border-t border-blue-100">
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Ou Importar códigos em lote (Excel/CSV)</label>
          <div className="flex flex-wrap items-center gap-2">
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportXlsx} className="p-1 border border-blue-200 rounded-lg bg-white text-sm" />
          </div>
          <p className="text-xs text-slate-500 mt-1">Planilha com colunas: código interno (A) e descrição (B).</p>
        </div>

        {msgProd.text && <p className={`text-xs mt-3 ${msgProd.ok ? 'text-blue-700' : 'text-red-600'}`}>{msgProd.text}</p>}
      </section>

      <section className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-blue-900">Cadastro de Clientes</h2>
        <form onSubmit={handleAddCliente} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Nome do Cliente</label>
            <input type="text" value={clienteNome} onChange={e => setClienteNome(e.target.value)} className="w-full p-2 rounded-lg border border-blue-200 focus:outline-none focus:border-blue-500" />
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors h-[42px]">Cadastrar Cliente</button>
        </form>
        {msgCli.text && <p className={`text-xs mt-3 ${msgCli.ok ? 'text-blue-700' : 'text-red-600'}`}>{msgCli.text}</p>}
      </section>

      <section className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-blue-900">Cadastro de Marcas</h2>
        <form onSubmit={handleAddMarca} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Nome da Marca</label>
            <input type="text" value={marcaNome} onChange={e => setMarcaNome(e.target.value)} className="w-full p-2 rounded-lg border border-blue-200 focus:outline-none focus:border-blue-500" />
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors h-[42px]">Cadastrar Marca</button>
        </form>
        {msgMarca.text && <p className={`text-xs mt-3 ${msgMarca.ok ? 'text-blue-700' : 'text-red-600'}`}>{msgMarca.text}</p>}
      </section>
    </div>
  );
}
