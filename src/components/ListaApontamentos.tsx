import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { gasApi, fmtDate, fmtDateBR } from '../api';

export default function ListaApontamentos({ session, fornecedores, marcas, codigos }: any) {
  const [filtros, setFiltros] = useState({
    di: '',
    df: '',
    camara: '',
    turno: '',
    forn: '',
    marca: ''
  });
  const [lista, setLista] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('apontamentos.pdf');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMsg, setModalMsg] = useState({ text: '', ok: true });
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    carregarLista();
  }, []);

  const handleFiltroChange = (e: any) => {
    setFiltros({ ...filtros, [e.target.id]: e.target.value });
  };

  const carregarLista = async () => {
    setLoading(true);
    try {
      const rows = await gasApi('listApontamentos', {
        dataInicio: filtros.di || null,
        dataFim: filtros.df || null,
        camara: filtros.camara || null,
        turno: filtros.turno || null,
        fornecedor: filtros.forn || null,
        marca: filtros.marca || null,
        cruCozido: 'todos',
        inteiroParte: 'todos',
        descascadoFiltro: 'todos'
      });
      setLista(rows);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item: any) => {
    setEditForm({
      ...item,
      justificativa: ''
    });
    setModalMsg({ text: '', ok: true });
    setModalOpen(true);
  };

  const handleEditChange = (e: any) => {
    const { id, value } = e.target;
    let newForm = { ...editForm, [id]: value };
    
    if (id === 'embMaster' || id === 'apontamentoCx') {
      const m = parseFloat(String(newForm.embMaster).replace(',', '.')) || 0;
      const c = parseFloat(String(newForm.apontamentoCx).replace(',', '.')) || 0;
      newForm.apontamentoKg = (m * c).toFixed(3);
    }
    
    if (id === 'codInterno') {
      const found = codigos.find((c: any) => String(c.codInterno).toLowerCase() === String(value).trim().toLowerCase());
      if (found) newForm.descricaoProduto = found.descricao;
    }
    
    setEditForm(newForm);
  };

  const handleSaveEdit = async () => {
    if (!editForm.fornecedor || !editForm.marca) {
      setModalMsg({ text: 'Selecione fornecedor e marca.', ok: false });
      return;
    }
    if (!editForm.justificativa.trim()) {
      setModalMsg({ text: 'Informe a justificativa.', ok: false });
      return;
    }
    setModalMsg({ text: 'Salvando...', ok: true });
    try {
      await gasApi('atualizarApontamento', {
        ...editForm,
        usuario: session.usuario,
        embMaster: parseFloat(String(editForm.embMaster).replace(',', '.')) || 0,
        apontamentoCx: parseFloat(String(editForm.apontamentoCx).replace(',', '.')) || 0,
        apontamentoKg: parseFloat(String(editForm.apontamentoKg).replace(',', '.')) || 0,
      });
      setModalMsg({ text: 'Alteração salva.', ok: true });
      carregarLista();
      setTimeout(() => setModalOpen(false), 1000);
    } catch (e: any) {
      setModalMsg({ text: e.message, ok: false });
    }
  };

  const handleDelete = async () => {
    if (!editForm.justificativa.trim()) {
      setModalMsg({ text: 'Informe a justificativa para exclusão.', ok: false });
      return;
    }
    if (!window.confirm('Confirma exclusão definitiva deste apontamento?')) return;
    
    setModalMsg({ text: 'Excluindo...', ok: true });
    try {
      await gasApi('excluirApontamento', {
        id: editForm.id,
        usuario: session.usuario,
        justificativa: editForm.justificativa
      });
      setModalOpen(false);
      carregarLista();
    } catch (e: any) {
      setModalMsg({ text: e.message, ok: false });
    }
  };

  const handlePrintPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      let startY = 15;
      let textStartX = 14;
      let maxHeaderY = startY;
      let logoBottomY = startY + 15; // Fallback

      // Tentar adicionar a logo
      const logoUrl = 'https://lh3.googleusercontent.com/d/1u60rekYWjseJ0IV_LY0cz7GfvFavgriH=w1000';
      try {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = logoUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        
        const imgWidth = 30; // Reduzido em 25% (era 40)
        const imgHeight = (img.height * imgWidth) / img.width;
        doc.addImage(img, 'PNG', 14, startY, imgWidth, imgHeight);
        textStartX = 14 + imgWidth + 5;
        logoBottomY = startY + imgHeight;
        maxHeaderY = logoBottomY;
      } catch (e) {
        console.warn('Não foi possível carregar a logo para o PDF', e);
      }

      // Dados da Empresa alinhados pela base da logo
      let line3Y = logoBottomY - 1; // Ajuste fino para a linha base visual
      let line2Y = line3Y - 4;
      let line1Y = line2Y - 5;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Compescal - Comercio de Pescados Aracatiense Ltda.', textStartX, line1Y);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Unidade de Beneficiamento II, BR 304, km 54,5, Bairro Alto da Cheia, Aracati-Ceará.', textStartX, line2Y);
      doc.text('CEP: 62800-000 | CNPJ: 07.108.145/0013-93 | CGF: 06.673.756-7', textStartX, line3Y);
      
      maxHeaderY = Math.max(maxHeaderY, line3Y);
      startY = maxHeaderY + 12;

      // Título do Relatório
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório de Apontamentos', 14, startY);
      startY += 6;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const formatData = (d: string) => d && d.includes('-') ? d.split('-').reverse().join('/') : d;
      const periodoStr = `Período: ${formatData(filtros.di) || 'Início'} até ${formatData(filtros.df) || 'Fim'}`;
      doc.text(periodoStr, 14, startY);
      startY += 6;
      
      const tableData = lista.map(r => [
        fmtDateBR(r.dataEmbalagem),
        r.loteProducao || '-',
        r.loteIDEmb || '-',
        r.fornecedor || '-',
        r.marca || '-',
        r.camara,
        r.turno,
        r.codInterno,
        r.descricaoProduto,
        r.apontamentoCx,
        r.apontamentoKg
      ]);

      autoTable(doc, {
        head: [['Data emb.', 'Lote Prod.', 'Lote ID', 'Fornecedor', 'Marca', 'Câmara', 'Turno', 'Cód.', 'Descrição', 'Cx', 'Kg']],
        body: tableData,
        startY: startY,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [37, 99, 235] } // Tailwind blue-600
      });

      const dataStr = filtros.di ? filtros.di.split('-').reverse().join('-') : 'Geral';
      const turnoStr = filtros.turno || 'Todos';
      const fileName = `Apontamentos_${dataStr}_${turnoStr}.pdf`;

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      
      setPdfFileName(fileName);
      setPdfPreviewUrl(url);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <section className="bg-white border border-blue-200 rounded-xl p-5 mb-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-blue-900">Apontamentos</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4 print:hidden">
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Início</label>
          <input type="date" id="di" value={filtros.di} onChange={handleFiltroChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Fim</label>
          <input type="date" id="df" value={filtros.df} onChange={handleFiltroChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500" />
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
            <option value="">Todos</option>
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
      
      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        <button type="button" onClick={carregarLista} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
          {loading ? 'Carregando...' : 'Aplicar filtros'}
        </button>
        <button type="button" onClick={handlePrintPdf} disabled={isGeneratingPdf} className="bg-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg transition-colors">
          {isGeneratingPdf ? 'Gerando PDF...' : '🖨️ Imprimir / PDF'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-2 font-semibold border-b border-blue-700">Data emb.</th>
              <th className="p-2 font-semibold border-b border-blue-700">Lote Prod.</th>
              <th className="p-2 font-semibold border-b border-blue-700">Lote ID</th>
              <th className="p-2 font-semibold border-b border-blue-700">Fornecedor</th>
              <th className="p-2 font-semibold border-b border-blue-700">Marca</th>
              <th className="p-2 font-semibold border-b border-blue-700">Câmara</th>
              <th className="p-2 font-semibold border-b border-blue-700">Turno</th>
              <th className="p-2 font-semibold border-b border-blue-700">Cód.</th>
              <th className="p-2 font-semibold border-b border-blue-700">Descrição</th>
              <th className="p-2 font-semibold border-b border-blue-700">Cx</th>
              <th className="p-2 font-semibold border-b border-blue-700">Kg</th>
              <th className="p-2 font-semibold border-b border-blue-700 print:hidden">Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(r => (
              <tr key={r.id} className="border-b border-blue-100 hover:bg-blue-50">
                <td className="p-2">{fmtDateBR(r.dataEmbalagem)}</td>
                <td className="p-2">{r.loteProducao || '-'}</td>
                <td className="p-2">{r.loteIDEmb || '-'}</td>
                <td className="p-2">{r.fornecedor || '-'}</td>
                <td className="p-2">{r.marca || '-'}</td>
                <td className="p-2">{r.camara}</td>
                <td className="p-2">{r.turno}</td>
                <td className="p-2">{r.codInterno}</td>
                <td className="p-2">{r.descricaoProduto}</td>
                <td className="p-2">{r.apontamentoCx}</td>
                <td className="p-2">{r.apontamentoKg}</td>
                <td className="p-2 print:hidden">
                  <button onClick={() => openModal(r)} className="text-blue-600 hover:text-blue-800 underline text-xs">Editar</button>
                </td>
              </tr>
            ))}
            {lista.length === 0 && !loading && (
              <tr><td colSpan={12} className="p-4 text-center text-slate-500">Nenhum registro encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">Editar apontamento</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Câmara</label>
                <select id="camara" value={editForm.camara} onChange={handleEditChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500">
                  <option value="01">01</option>
                  <option value="02">02</option>
                  <option value="03">03</option>
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Data de embalagem</label>
                <input type="date" id="dataEmbalagem" value={fmtDate(editForm.dataEmbalagem)} onChange={handleEditChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Lote produção</label>
                <input type="text" id="loteProducao" value={editForm.loteProducao} onChange={handleEditChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Cód. interno</label>
                <input type="text" id="codInterno" value={editForm.codInterno} onChange={handleEditChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Descrição</label>
                <input type="text" id="descricaoProduto" value={editForm.descricaoProduto} readOnly className="w-full p-2 rounded-lg border border-blue-200 bg-slate-50 opacity-80" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Emb. primária</label>
                <select id="embPrimaria" value={editForm.embPrimaria} onChange={handleEditChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500">
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
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Emb. master</label>
                <select id="embMaster" value={editForm.embMaster} onChange={handleEditChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500">
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
                <input type="number" id="apontamentoCx" step="any" min="0" value={editForm.apontamentoCx} onChange={handleEditChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Apontamento (kg)</label>
                <input type="number" id="apontamentoKg" value={editForm.apontamentoKg} readOnly className="w-full p-2 rounded-lg border border-blue-200 bg-slate-50 opacity-80" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Lote ID (emb.)</label>
                <input type="text" id="loteIDEmb" value={editForm.loteIDEmb} onChange={handleEditChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Fornecedor</label>
                <select id="fornecedor" value={editForm.fornecedor} onChange={handleEditChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500">
                  <option value="">Selecione...</option>
                  {fornecedores.map((f: string) => <option key={f} value={f}>{f}</option>)}
                  {editForm.fornecedor && !fornecedores.includes(editForm.fornecedor) && <option value={editForm.fornecedor}>{editForm.fornecedor}</option>}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Marca</label>
                <select id="marca" value={editForm.marca} onChange={handleEditChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500">
                  <option value="">Selecione...</option>
                  {marcas.map((m: string) => <option key={m} value={m}>{m}</option>)}
                  {editForm.marca && !marcas.includes(editForm.marca) && <option value={editForm.marca}>{editForm.marca}</option>}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Turno</label>
                <select id="turno" value={editForm.turno} onChange={handleEditChange} className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500">
                  <option value="Dia">Dia</option>
                  <option value="Noite">Noite</option>
                </select>
              </div>
              <div className="col-span-1 sm:col-span-2 md:col-span-3">
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Justificativa (obrigatória)</label>
                <textarea id="justificativa" value={editForm.justificativa} onChange={handleEditChange} placeholder="Motivo da alteração ou exclusão" className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500 min-h-[72px]"></textarea>
              </div>
            </div>

            {modalMsg.text && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${modalMsg.ok ? 'bg-blue-50 border border-blue-200 text-blue-900' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {modalMsg.text}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-6">
              <button type="button" onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">Salvar alterações</button>
              <button type="button" onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">Excluir registro</button>
              <button type="button" onClick={() => setModalOpen(false)} className="bg-transparent border border-blue-200 hover:border-blue-400 text-blue-900 px-4 py-2 rounded-lg transition-colors">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {pdfPreviewUrl && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800">Visualização do Relatório</h2>
              <div className="flex gap-2">
                <a 
                  href={pdfPreviewUrl} 
                  download={pdfFileName}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  ⬇️ Baixar PDF
                </a>
                <button 
                  onClick={() => {
                    URL.revokeObjectURL(pdfPreviewUrl);
                    setPdfPreviewUrl(null);
                  }} 
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 p-2">
              <iframe src={pdfPreviewUrl} className="w-full h-full rounded border border-slate-300" title="PDF Preview" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
