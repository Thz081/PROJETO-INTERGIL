import React, { useState } from 'react';
import api from '../../api';

const normal = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
const campos = {
  nome: /^(?:NOME(?: COMPLETO)?(?: DO ALUNO| DO ESTUDANTE)?|ALUNO|ESTUDANTE)$/,
  n_inscricao: /MATRICULA|INSCRICAO/,
  data_nascimento: /NASCIMENTO|^NASC\.?$/,
  sexo: /SEXO|GENERO/
};
function lerAba(XLSX, ws, arquivo, aba, salas, date1904) {
  const grade = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, blankrows: true, dateNF: 'dd/mm/yyyy' });
  let indices, inicio = grade.findIndex(row => {
    indices = Object.fromEntries(Object.entries(campos).map(([k,re]) => [k, row.findIndex(c => re.test(normal(c)))]));
    return indices.nome >= 0 && indices.n_inscricao >= 0;
  });
  const texto = normal(aba), curso = normal(aba + ' ' + arquivo);
  const codigoEscolar = texto.match(/(?:ADM|TDS|IDS|DS)([123])IN[- ]*([AB])/);
  const serie = codigoEscolar || texto.match(/([123])\s*[º°ªº. -]*(?:ANO\s*)?([AB])\b/) || texto.match(/([123])\s*([AB])/);
  const sigla = /ADM/.test(curso) ? 'ADM' : /TDS|IDS|DS|SISTEMA/.test(curso) ? 'DS' : '';
  const sugerida = salas.find(s => normal(s.nome) === texto) || salas.find(s => serie && sigla && s.turma.replace(/[^1-3ABDSM]/gi,'') === serie[1] + serie[2] + sigla);
  const linhas = inicio < 0 ? [] : grade.slice(inicio + 1).flatMap((row,i) => {
    if (!row.some(v => String(v).trim())) return [];
    const aluno = Object.fromEntries(Object.keys(campos).map(k => [k, String(row[indices[k]] ?? '').trim()]));
    const celula = ws[XLSX.utils.encode_cell({ r: inicio + i + 1, c: Math.max(indices.data_nascimento, 0) })];
    if (indices.data_nascimento >= 0 && typeof celula?.v === 'number') {
      const d = XLSX.SSF.parse_date_code(celula.v, { date1904 });
      if (d) aluno.data_nascimento = [d.d,d.m,d.y].map(v => String(v).padStart(2,'0')).join('/');
    }
    const genero = normal(aluno.sexo);
    if (['MASCULINO','FEMININO'].includes(genero)) aluno.sexo = genero[0];
    return [{ ...aluno, origem: arquivo + ' / ' + aba + ' / linha ' + (inicio+i+2) }];
  });
  return { arquivo, aba, linhas, turma: sugerida?.turma || '', reconhecida: inicio >= 0 };
}
export default function ImportarAlunos({ salas }) {
  const [abas, setAbas] = useState([]), [completa, setCompleta] = useState(false);
  const [preview, setPreview] = useState(null), [mensagem, setMensagem] = useState(''), [ocupado, setOcupado] = useState(false);
  async function ler(e) {
    const arquivos = [...e.target.files];
    setPreview(null); setAbas([]); setMensagem(''); setOcupado(true);
    try {
      const XLSX = await import('xlsx');
      const lidas = [];
      for (const file of arquivos) {
        const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        for (const aba of wb.SheetNames) lidas.push(lerAba(XLSX, wb.Sheets[aba], file.name, aba, salas, Boolean(wb.Workbook?.WBProps?.date1904)));
      }
      setAbas(lidas);
    } catch { setMensagem('Não foi possível abrir a planilha.'); }
    finally { setOcupado(false); }
  }
  async function importar(confirmar) {
    setOcupado(true); setMensagem('');
    try {
      const linhas = abas.filter(a => a.turma).flatMap(a => a.linhas.map(l => ({ ...l, turma: a.turma })));
      const { data } = await api.post('/admin/importar-alunos', { linhas, completa, confirmar });
      setPreview(confirmar ? null : data);
      if (confirmar) { setAbas([]); setMensagem('Importação concluída.'); }
    } catch (e) { setMensagem(e.response?.data?.message || 'Falha na importação.'); setPreview(null); }
    finally { setOcupado(false); }
  }
  return <section className="admin-section importacao"><h2>Importar alunos</h2>
    <p>Selecione juntas as planilhas de Administração e DS. Confira a turma de cada aba e a prévia dos cadastros.</p>
    <label>Planilhas de alunos <input type="file" multiple accept=".xlsx,.xls" onChange={ler} disabled={ocupado}/></label>
    {abas.map((a,i) => <label key={i}>{a.arquivo} · {a.aba} · {a.linhas.length} linhas
      <select value={a.turma} disabled={ocupado || !a.reconhecida} onChange={e => {
        setPreview(null);setAbas(abas.map((x,j) => j === i ? { ...x, turma: e.target.value } : x));
      }}><option value="">{a.reconhecida ? 'Ignorar aba' : 'Cabeçalho de nome e matrícula ausente'}</option>
      {salas.map(s => <option key={s._id} value={s.turma}>{s.turma} · {s.nome}</option>)}</select></label>)}
    {!!abas.length && <><label><input type="checkbox" checked={completa} disabled={ocupado} onChange={e => {setCompleta(e.target.checked);setPreview(null);}}/> Lista completa das turmas · inativar matrículas ausentes</label>
      <button disabled={ocupado} onClick={() => importar()}>Conferir prévia</button></>}
    {preview && <><h3>Conferência de {preview.previa.length} cadastros</h3>
      <ul>{preview.erros.map((e,i) => <li key={i}>{e}</li>)}</ul><div className="previa-alunos"><table><thead><tr><th>Aluno</th><th>Matrícula</th><th>Origem</th><th>Destino</th><th>Ação</th></tr></thead>
      <tbody>{preview.previa.map((a,i) => <tr key={i}><td>{a.nome}</td><td>{a.matricula}</td><td>{a.de || '—'}</td><td>{a.para || '—'}</td><td>{a.acao}</td></tr>)}</tbody></table></div>
      <button disabled={ocupado || !!preview.erros.length} onClick={() => importar(preview.versao)}>Confirmar importação</button></>}
    {mensagem && <p role="status">{mensagem}</p>}</section>;
}
