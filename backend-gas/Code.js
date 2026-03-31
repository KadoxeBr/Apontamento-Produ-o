function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = {
    'Usuarios': ['usuario', 'senha', 'nome', 'role'],
    'Apontamentos': ['id', 'dataHoraRegistro', 'usuario', 'camara', 'dataEmbalagem', 'loteProducao', 'codInterno', 'descricaoProduto', 'embPrimaria', 'embMaster', 'apontamentoCx', 'apontamentoKg', 'loteIDEmb', 'fornecedor', 'marca', 'turno'],
    'Codigos': ['codInterno', 'descricao'],
    'Listas': ['tipo', 'nome'],
    'Logs': ['dataHora', 'usuario', 'acao', 'apontamentoId', 'dadosAnterioresJson', 'justificativa']
  };

  for (var name in sheets) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(sheets[name]);
      
      if (name === 'Usuarios') {
        sheet.appendRow(['admin', 'admin123', 'Administrador', 'admin']);
      }
      
      if (name === 'Listas') {
        var defaultForn = ['Celm', 'TresmM', 'Faifs', 'Barcy', 'J&E', 'Fonseca', 'MMsea', 'Master Maris'];
        var defaultMarc = ['Maris', 'Bacy', 'MasterMaris', 'Faifs', 'Carrefour', 'Qualitá', 'Seara', 'MaterPescados', 'Copacol', 'Ecil', 'Camponela'];
        defaultForn.forEach(function(f) { sheet.appendRow(['FORNECEDOR', f]); });
        defaultMarc.forEach(function(m) { sheet.appendRow(['MARCA', m]); });
      }
      
      if (name === 'Codigos') {
        sheet.appendRow(['EX001', 'Produto exemplo — cozido cabeça descasc']);
      }
    }
  }
}

function doPost(e) {
  try {
    setup();
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var payload = body.payload;
    var result = {};

    if (action === 'login') result = apiLogin(payload);
    else if (action === 'listFornecedores') result = apiListFornecedores();
    else if (action === 'listMarcas') result = apiListMarcas();
    else if (action === 'adicionarListaItem') result = apiAdicionarListaItem(payload);
    else if (action === 'listCodigos') result = apiListCodigos();
    else if (action === 'importCodigos') result = apiImportCodigos(payload);
    else if (action === 'listApontamentos') result = apiListApontamentos(payload);
    else if (action === 'criarApontamento') result = apiCriarApontamento(payload);
    else if (action === 'atualizarApontamento') result = apiAtualizarApontamento(payload);
    else if (action === 'excluirApontamento') result = apiExcluirApontamento(payload);
    else if (action === 'listLogs') result = apiListLogs(payload);
    else throw new Error('Ação desconhecida: ' + action);

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, erro: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetData(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  return rows;
}

function apiLogin(payload) {
  var usuarios = getSheetData('Usuarios');
  for (var i = 0; i < usuarios.length; i++) {
    if (String(usuarios[i].usuario).toLowerCase() === String(payload.usuario).toLowerCase() && 
        String(usuarios[i].senha) === String(payload.senha)) {
      return { ok: true, usuario: usuarios[i].usuario, nome: usuarios[i].nome, role: usuarios[i].role };
    }
  }
  return { ok: false, erro: 'Credenciais inválidas.' };
}

function apiListFornecedores() {
  var listas = getSheetData('Listas');
  var fornecedores = [];
  for (var i = 0; i < listas.length; i++) {
    if (listas[i].tipo === 'FORNECEDOR') fornecedores.push(listas[i].nome);
  }
  return fornecedores.sort(function(a, b) { return a.localeCompare(b, 'pt-BR'); });
}

function apiListMarcas() {
  var listas = getSheetData('Listas');
  var marcas = [];
  for (var i = 0; i < listas.length; i++) {
    if (listas[i].tipo === 'MARCA') marcas.push(listas[i].nome);
  }
  return marcas.sort(function(a, b) { return a.localeCompare(b, 'pt-BR'); });
}

function apiAdicionarListaItem(payload) {
  var tipo = String(payload.tipo || '').toUpperCase();
  var nome = String(payload.nome || '').trim();
  if (tipo !== 'FORNECEDOR' && tipo !== 'MARCA') return { ok: false, erro: 'Tipo inválido.' };
  if (!nome) return { ok: false, erro: 'Nome obrigatório.' };
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Listas');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === tipo && String(data[i][1]).toLowerCase() === nome.toLowerCase()) {
      return { ok: false, erro: 'Já existe na lista.' };
    }
  }
  
  sheet.appendRow([tipo, nome]);
  return { ok: true };
}

function apiListCodigos() {
  return getSheetData('Codigos');
}

function apiImportCodigos(payload) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Codigos');
  var data = sheet.getDataRange().getValues();
  var map = {};
  
  for (var i = 1; i < data.length; i++) {
    var c = String(data[i][0]).trim();
    if (c) map[c.toLowerCase()] = { codInterno: c, descricao: String(data[i][1]) };
  }
  
  for (var j = 0; j < payload.length; j++) {
    var row = payload[j];
    var c = String(row.codInterno || '').trim();
    if (c) map[c.toLowerCase()] = { codInterno: c, descricao: String(row.descricao || '') };
  }
  
  var out = Object.keys(map).map(function(k) { return [map[k].codInterno, map[k].descricao]; });
  out.sort(function(a, b) { return String(a[0]).localeCompare(String(b[0]), 'pt-BR'); });
  
  sheet.clearContents();
  sheet.appendRow(['codInterno', 'descricao']);
  if (out.length > 0) {
    sheet.getRange(2, 1, out.length, 2).setValues(out);
  }
  
  return { ok: true, total: out.length };
}

function mockClass_(desc) {
  var d = String(desc || '').toLowerCase();
  return {
    cruCozido: /cozido|\bcoz\b/.test(d) ? 'Cozido' : 'Cru',
    inteiroParte: /cabe[cç]a/.test(d) ? 'Sem cabeça' : 'Inteiro',
    descascado: /descasc|descas/i.test(d) ? 'Descascado' : 'Não descascado'
  };
}

function apiListApontamentos(payload) {
  var f = payload || {};
  var list = getSheetData('Apontamentos');
  var di = f.dataInicio ? new Date(f.dataInicio) : null;
  var df = f.dataFim ? new Date(f.dataFim) : null;
  if (df) df.setHours(23, 59, 59, 999);
  
  var filtered = [];
  for (var i = 0; i < list.length; i++) {
    var row = list[i];
    if (f.camara && String(row.camara) !== String(f.camara)) continue;
    if (f.turno && String(row.turno) !== String(f.turno)) continue;
    if (f.fornecedor && String(row.fornecedor).toLowerCase().indexOf(String(f.fornecedor).toLowerCase()) === -1) continue;
    if (f.marca && String(row.marca).toLowerCase().indexOf(String(f.marca).toLowerCase()) === -1) continue;
    if (f.codInterno && String(row.codInterno).toLowerCase().indexOf(String(f.codInterno).toLowerCase()) === -1) continue;
    
    var dEmb = row.dataEmbalagem ? new Date(row.dataEmbalagem) : null;
    if (di && dEmb && dEmb < di) continue;
    if (df && dEmb && dEmb > df) continue;
    
    var cls = mockClass_(row.descricaoProduto);
    if (f.cruCozido && f.cruCozido !== 'todos' && cls.cruCozido !== f.cruCozido) continue;
    if (f.inteiroParte && f.inteiroParte !== 'todos' && cls.inteiroParte !== f.inteiroParte) continue;
    if (f.descascadoFiltro && f.descascadoFiltro !== 'todos' && cls.descascado !== f.descascadoFiltro) continue;
    
    filtered.push(row);
  }
  return filtered;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function apiCriarApontamento(payload) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Apontamentos');
  var id = generateUUID();
  var dataHora = new Date().toISOString();
  
  var row = [
    id,
    dataHora,
    payload.usuario || '',
    payload.camara || '',
    payload.dataEmbalagem || '',
    payload.loteProducao || '',
    payload.codInterno || '',
    payload.descricaoProduto || '',
    payload.embPrimaria || '',
    payload.embMaster || 0,
    payload.apontamentoCx || 0,
    payload.apontamentoKg || 0,
    payload.loteIDEmb || '',
    payload.fornecedor || '',
    payload.marca || '',
    payload.turno || ''
  ];
  
  sheet.appendRow(row);
  
  var logsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Logs');
  logsSheet.appendRow([dataHora, payload.usuario || '', 'CREATE', id, '', '']);
  
  return { ok: true, id: id };
}

function apiAtualizarApontamento(payload) {
  var just = String(payload.justificativa || '').trim();
  if (!just) return { ok: false, erro: 'Justificativa obrigatória para alteração.' };
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Apontamentos');
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;
  var ant = null;
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(payload.id)) {
      rowIndex = i + 1;
      ant = {};
      var headers = data[0];
      for (var j = 0; j < headers.length; j++) {
        ant[headers[j]] = data[i][j];
      }
      break;
    }
  }
  
  if (rowIndex === -1) return { ok: false, erro: 'Registro não encontrado.' };
  
  var row = [
    payload.id,
    ant.dataHoraRegistro,
    ant.usuario,
    payload.camara || '',
    payload.dataEmbalagem || '',
    payload.loteProducao || '',
    payload.codInterno || '',
    payload.descricaoProduto || '',
    payload.embPrimaria || '',
    payload.embMaster || 0,
    payload.apontamentoCx || 0,
    payload.apontamentoKg || 0,
    payload.loteIDEmb || '',
    payload.fornecedor || '',
    payload.marca || '',
    payload.turno || ''
  ];
  
  sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  
  var logsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Logs');
  logsSheet.appendRow([new Date().toISOString(), payload.usuario || '', 'UPDATE', payload.id, JSON.stringify(ant), just]);
  
  return { ok: true };
}

function apiExcluirApontamento(payload) {
  var just = String(payload.justificativa || '').trim();
  if (!just) return { ok: false, erro: 'Justificativa obrigatória para exclusão.' };
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Apontamentos');
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;
  var ant = null;
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(payload.id)) {
      rowIndex = i + 1;
      ant = {};
      var headers = data[0];
      for (var j = 0; j < headers.length; j++) {
        ant[headers[j]] = data[i][j];
      }
      break;
    }
  }
  
  if (rowIndex === -1) return { ok: false, erro: 'Registro não encontrado.' };
  
  sheet.deleteRow(rowIndex);
  
  var logsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Logs');
  logsSheet.appendRow([new Date().toISOString(), payload.usuario || '', 'DELETE', payload.id, JSON.stringify(ant), just]);
  
  return { ok: true };
}

function apiListLogs(payload) {
  var fl = payload || {};
  var logs = getSheetData('Logs');
  var di = fl.dataInicio ? new Date(fl.dataInicio) : null;
  var df = fl.dataFim ? new Date(fl.dataFim) : null;
  if (df) df.setHours(23, 59, 59, 999);
  
  var filtered = [];
  for (var i = 0; i < logs.length; i++) {
    var row = logs[i];
    var t = row.dataHora ? new Date(row.dataHora) : null;
    if (di && t && t < di) continue;
    if (df && t && t > df) continue;
    if (fl.usuario && String(row.usuario).toLowerCase().indexOf(String(fl.usuario).toLowerCase()) === -1) continue;
    if (fl.acao && String(row.acao) !== String(fl.acao)) continue;
    filtered.push(row);
  }
  return filtered.reverse();
}
