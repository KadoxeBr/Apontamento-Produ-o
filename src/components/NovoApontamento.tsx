import React, { useState } from 'react';
import { gasApi, fmtDate } from '../api';

export default function NovoApontamento({ session, codigos, setCodigos, fornecedores, marcas, refreshLists }: any) {
  const [msg, setMsg] = useState({ text: '', ok: true });
  const [showCodigos, setShowCodigos] = useState(false);
  
  const [form, setForm] = useState({
    camara: '01',
    dataEmb: fmtDate(new Date()),
    loteProd: '',
    cod: '',
    desc: '',
    embP: '',
    embM: '',
    cx: '0',
    kg: '0',
    loteEmb: '',
    forn: '',
    marca: '',
    turno: 'Dia'
  });

  const calcKg = (embM: string | number, cx: string | number) => {
    const m = parseFloat(String(embM).replace(',', '.')) || 0;
    const c = parseFloat(String(cx).replace(',', '.')) || 0;
    return (m * c).toFixed(3);
  };

  const handleFormChange = (e: any) => {
    const { id, value } = e.target;
    let newForm = { ...form, [id]: value };
    
    if (id === 'embM' || id === 'cx') {
      newForm.kg = calcKg(newForm.embM, newForm.cx);
    }
    
    if (id === 'cod') {
      const found = codigos.find((c: any) => String(c.codInterno).toLowerCase() === String(value).trim().toLowerCase());
      newForm.desc = found ? found.descricao : '';
    }
    
    setForm(newForm);
  };

  const handleLimpar = () => {
    setForm({
      ...form,
      loteProd: '',
      cod: '',
      desc: '',
      embP: '',
      embM: '',
      cx: '0',
      kg: '0',
      loteEmb: '',
      forn: '',
      marca: ''
    });
    setMsg({ text: '', ok: true });
  };

  const handleSalvar = async () => {
    if (!form.forn || !form.marca) {
      setMsg({ text: 'Selecione fornecedor e marca.', ok: false });
      return;
    }
    setMsg({ text: 'Salvando...', ok: true });
    try {
      await gasApi('criarApontamento', {
        usuario: session.usuario,
        camara: form.camara,
        dataEmbalagem: form.dataEmb,
        loteProducao: form.loteProd,
        codInterno: String(form.cod).trim(),
        descricaoProduto: form.desc,
        embPrimaria: form.embP,
        embMaster: parseFloat(form.embM.replace(',', '.')) || 0,
        apontamentoCx: parseFloat(form.cx.replace(',', '.')) || 0,
        apontamentoKg: parseFloat(form.kg.replace(',', '.')) || 0,
        loteIDEmb: form.loteEmb,
        fornecedor: form.forn,
        marca: form.marca,
        turno: form.turno
      });
      setMsg({ text: 'Apontamento registrado.', ok: true });
      handleLimpar();
    } catch (e: any) {
      setMsg({ text: e.message, ok: false });
    }
  };

  const filteredCodigos = (form.cod 
    ? (codigos || []).filter((c: any) => 
        String(c.codInterno).toLowerCase().includes(String(form.cod).toLowerCase()) || 
        String(c.descricao || '').toLowerCase().includes(String(form.cod).toLowerCase())
      )
    : (codigos || [])
  ).slice(0, 50);

  return (
    <section className="bg-white border border-blue-200 rounded-xl p-5 mb-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-blue-900">Novo apontamento</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Câmara</label>
          <select id="camara" value={form.camara} onChange={handleFormChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
            <option value="01">01</option>
            <option value="02">02</option>
            <option value="03">03</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Data de embalagem</label>
          <input type="date" id="dataEmb" value={form.dataEmb} onChange={handleFormChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Lote produção</label>
          <input type="text" id="loteProd" value={form.loteProd} onChange={handleFormChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
        </div>
        <div className="relative">
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Cód. interno</label>
          <input 
            type="text" 
            id="cod" 
            value={form.cod} 
            onChange={(e) => {
              handleFormChange(e);
              setShowCodigos(true);
            }} 
            onFocus={() => setShowCodigos(true)}
            onBlur={() => setTimeout(() => setShowCodigos(false), 200)}
            autoComplete="off" 
            placeholder="Buscar código ou descrição..."
            className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
          />
          {showCodigos && (
            <ul className="absolute z-10 w-full bg-white border border-blue-200 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
              {filteredCodigos.length > 0 ? (
                filteredCodigos.map((c: any) => (
                  <li 
                    key={c.codInterno} 
                    className="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-slate-100 last:border-0"
                    onMouseDown={(e) => {
                      // Prevent blur from firing before click
                      e.preventDefault();
                    }}
                    onClick={() => {
                      setForm({ ...form, cod: c.codInterno, desc: c.descricao });
                      setShowCodigos(false);
                    }}
                  >
                    <span className="font-semibold text-blue-900">{c.codInterno}</span>
                    <span className="text-slate-600 ml-2">- {c.descricao}</span>
                  </li>
                ))
              ) : (
                <li className="p-2 text-sm text-slate-500 text-center">Nenhum código encontrado</li>
              )}
            </ul>
          )}
        </div>
        <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4">
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Descrição do produto</label>
          <input type="text" id="desc" value={form.desc} readOnly placeholder="Preenchido pelo código interno" className="w-full p-2 rounded-lg border border-blue-200 bg-slate-50 opacity-80" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Emb. primária</label>
          <select id="embP" value={form.embP} onChange={handleFormChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
            <option value="">Selecione...</option>
            <option value="180g">180g</option>
            <option value="200g">200g</option>
            <option value="300g">300g</option>
            <option value="380g">380g</option>
            <option value="400g">400g</option>
            <option value="500g">500g</option>
            <option value="800g">800g</option>
            <option value="1kg">1kg</option>
            <option value="2kg">2kg</option>
            <option value="2,5kg">2,5kg</option>
            <option value="5kg">5kg</option>
            <option value="20kg">20kg</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Emb. master (qtd por cx)</label>
          <select id="embM" value={form.embM} onChange={handleFormChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
            <option value="">Selecione...</option>
            <option value="2.8">2,8kg</option>
            <option value="4.5">4,5kg</option>
            <option value="5">5kg</option>
            <option value="5.6">5,6kg</option>
            <option value="7.6">7,6kg</option>
            <option value="8">8kg</option>
            <option value="9">9kg</option>
            <option value="10">10kg</option>
            <option value="20">20kg</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Apontamento (cx)</label>
          <input type="number" id="cx" step="any" min="0" value={form.cx} onChange={handleFormChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Apontamento (kg)</label>
          <input type="number" id="kg" value={form.kg} readOnly className="w-full p-2 rounded-lg border border-blue-200 bg-slate-50 opacity-80" />
          <p className="text-xs text-slate-500 mt-1">cx × Emb. master</p>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Lote ID (emb.)</label>
          <input type="text" id="loteEmb" value={form.loteEmb} onChange={handleFormChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Cliente / Fornecedor</label>
          <select id="forn" value={form.forn} onChange={handleFormChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
            <option value="">Selecione...</option>
            {fornecedores.map((f: string) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Marca</label>
          <select id="marca" value={form.marca} onChange={handleFormChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
            <option value="">Selecione...</option>
            {marcas.map((m: string) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Turno</label>
          <select id="turno" value={form.turno} onChange={handleFormChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
            <option value="Dia">Dia</option>
            <option value="Noite">Noite</option>
          </select>
        </div>
      </div>

      {msg.text && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${msg.ok ? 'bg-blue-50 border border-blue-200 text-blue-900' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        <button type="button" onClick={handleSalvar} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">Salvar apontamento</button>
        <button type="button" onClick={handleLimpar} className="bg-transparent border border-blue-200 hover:border-blue-400 text-blue-900 px-4 py-2 rounded-lg transition-colors">Limpar formulário</button>
      </div>
    </section>
  );
}
