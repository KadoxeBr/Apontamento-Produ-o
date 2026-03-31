export async function gasApi(action: string, payload: any = {}) {
  const url = localStorage.getItem('gasUrl');
  if (!url) {
    throw new Error('URL do Google Apps Script não configurada. Configure na tela de login.');
  }

  if (!url.includes('/exec') && !url.includes('/dev')) {
    throw new Error('A URL informada parece inválida. Ela deve terminar com "/exec". Verifique se copiou a URL do "App da Web" e não a do editor.');
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action, payload }),
    });

    const data = await res.json();
    if (data && data.ok === false) {
      throw new Error(data.erro || 'Erro desconhecido na API.');
    }
    return data;
  } catch (error: any) {
    if (error.message === 'Failed to fetch') {
      throw new Error('Falha na comunicação com o Google Apps Script. Verifique a URL ou sua conexão.');
    }
    throw error;
  }
}

export function classificarDescricao(desc: string) {
  const d = String(desc || '').toLowerCase();
  const cruCozido = /cozido|\bcoz\b/.test(d) ? 'Cozido' : 'Cru';
  const inteiroParte = /cabe[cç]a/.test(d) ? 'Sem cabeça' : 'Inteiro';
  const descascado = /descasc|descas/i.test(d) ? 'Descascado' : 'Não descascado';
  return { cruCozido, inteiroParte, descascado };
}

export function fmtDate(d: string | Date | null) {
  if (!d) return '';
  const x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return String(d);
  return x.toISOString().slice(0, 10);
}

export function fmtDateBR(d: string | Date | null) {
  const iso = fmtDate(d);
  if (!iso || !iso.includes('-')) return iso;
  const [y, m, day] = iso.split('-');
  return `${day}/${m}/${y}`;
}

export function fmtDateTime(d: string | Date | null) {
  if (!d) return '';
  const x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return String(d);
  return x.toLocaleString('pt-BR');
}
