import React, { useState, useEffect } from 'react';
import { gasApi } from './api';
import NovoApontamento from './components/NovoApontamento';
import ListaApontamentos from './components/ListaApontamentos';
import Relatorios from './components/Relatorios';
import Logs from './components/Logs';
import Cadastro from './components/Cadastro';

const LOGO_URL = "https://lh3.googleusercontent.com/d/1u60rekYWjseJ0IV_LY0cz7GfvFavgriH";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [gasUrl, setGasUrl] = useState(localStorage.getItem('gasUrl') || '');
  const [showUrlInput, setShowUrlInput] = useState(!localStorage.getItem('gasUrl'));
  const [loginForm, setLoginForm] = useState({ u: '', p: '' });
  const [loginMsg, setLoginMsg] = useState({ text: '', ok: true });
  
  const [activeTab, setActiveTab] = useState('novo');
  
  const [fornecedores, setFornecedores] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [codigos, setCodigos] = useState<any[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gasUrl) {
      setLoginMsg({ text: 'Configure a URL do Google Apps Script.', ok: false });
      return;
    }
    localStorage.setItem('gasUrl', gasUrl);
    setLoginMsg({ text: 'Autenticando...', ok: true });
    
    try {
      const res = await gasApi('login', { usuario: loginForm.u, senha: loginForm.p });
      setSession(res);
      setLoginMsg({ text: '', ok: true });
      loadInitialData();
    } catch (err: any) {
      setLoginMsg({ text: err.message, ok: false });
    }
  };

  const loadInitialData = async () => {
    try {
      const [f, m, c] = await Promise.all([
        gasApi('listFornecedores'),
        gasApi('listMarcas'),
        gasApi('listCodigos')
      ]);
      setFornecedores(f || []);
      setMarcas(m || []);
      setCodigos(c || []);
    } catch (e: any) {
      console.error('Erro ao carregar dados iniciais:', e);
    }
  };

  const handleLogout = () => {
    setSession(null);
    setLoginForm({ u: '', p: '' });
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-slate-100 to-blue-100">
        <div className="w-full max-w-md bg-white border border-blue-200 rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-32 h-32 p-2 mb-4 rounded-2xl bg-white border border-blue-100 flex items-center justify-center overflow-hidden shadow-sm">
              <img src={LOGO_URL} alt="COMPESCAL" className="max-h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <h1 className="text-2xl font-bold text-blue-900 m-0">Apontamento de Produção</h1>
            <p className="text-sm text-slate-500 mt-1">COMPESCAL — controle por câmara e turno</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            {showUrlInput && (
              <>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">URL do Google Apps Script (Web App)</label>
                  <input 
                    type="url" 
                    value={gasUrl} 
                    onChange={e => setGasUrl(e.target.value)} 
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500 text-sm"
                    required
                  />
                </div>
                <hr className="border-blue-100" />
              </>
            )}
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Usuário</label>
              <input 
                type="text" 
                value={loginForm.u} 
                onChange={e => setLoginForm({...loginForm, u: e.target.value})} 
                className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Senha</label>
              <input 
                type="password" 
                value={loginForm.p} 
                onChange={e => setLoginForm({...loginForm, p: e.target.value})} 
                className="w-full p-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            {loginMsg.text && (
              <div className={`p-3 rounded-lg text-sm ${loginMsg.ok ? 'bg-blue-50 text-blue-900 border border-blue-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {loginMsg.text}
              </div>
            )}
            
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e3eef8] via-[#f0f4f8] to-[#dde8f4] text-[#0f2942] font-sans p-5">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-wrap items-center justify-between gap-4 py-4 border-b-4 border-blue-600 mb-6 print:hidden">
          <div className="flex items-center gap-4">
            <div className="w-auto h-14 p-1.5 rounded-xl bg-white border border-blue-200 flex items-center justify-center overflow-hidden">
              <img src={LOGO_URL} alt="COMPESCAL" className="max-h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-900 m-0">Apontamento de Produção</h1>
              <p className="text-sm text-slate-500 m-0">COMPESCAL — registro na planilha</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>{session.nome || session.usuario}</span>
            <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-white transition-colors">Sair</button>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2 mb-6 print:hidden">
          {[
            { id: 'novo', label: 'Novo apontamento' },
            { id: 'lista', label: 'Lista / Editar' },
            { id: 'rel', label: 'Relatórios' },
            { id: 'logs', label: 'Logs de auditoria' },
            { id: 'cadastro', label: 'Cadastros' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white border-blue-800' 
                  : 'bg-white text-slate-700 border-blue-200 hover:border-blue-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <main>
          {activeTab === 'novo' && (
            <NovoApontamento 
              session={session} 
              codigos={codigos} 
              setCodigos={setCodigos}
              fornecedores={fornecedores} 
              marcas={marcas} 
              refreshLists={loadInitialData}
            />
          )}
          {activeTab === 'lista' && (
            <ListaApontamentos 
              session={session} 
              fornecedores={fornecedores} 
              marcas={marcas} 
              codigos={codigos}
            />
          )}
          {activeTab === 'rel' && (
            <Relatorios 
              fornecedores={fornecedores} 
              marcas={marcas} 
            />
          )}
          {activeTab === 'logs' && (
            <Logs />
          )}
          {activeTab === 'cadastro' && (
            <Cadastro refreshLists={loadInitialData} gasUrl={gasUrl} setGasUrl={setGasUrl} />
          )}
        </main>
      </div>
    </div>
  );
}
