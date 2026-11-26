import React, { useEffect, useId, useRef, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import './style.css';

const formatos = {
  imagem: { accept: '.jpg,.jpeg,.png,.webp,.gif', limite: 5, ajuda: 'JPEG, PNG, WebP ou GIF · até 5 MB' },
  pdf: { accept: '.pdf', limite: 10, ajuda: 'PDF · até 10 MB' },
  midia: { accept: '.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm', limite: 100, ajuda: 'Imagem, MP4 ou WebM · até 100 MB' },
  fotoMomento: { accept: '.jpg,.jpeg,.png,.webp,.heic,.heif', limite: 25, ajuda: 'JPEG, PNG, WebP ou HEIC · até 25 MB por foto' },
  videoMomento: { accept: '.mp4,.mov,.webm,.m4v', limite: 480, ajuda: 'MP4, MOV, WebM ou M4V · até 480 MB e 15 minutos' },
  planilha: { accept: '.xls,.xlsx', ajuda: 'Planilhas XLS ou XLSX' }
};

export default function ArquivoCampo({ titulo, tipo, arquivos = [], selecionar, multiple = false, disabled = false, required = false }) {
  const id = useId();
  const input = useRef(null);
  const [erro, setErro] = useState('');
  const { accept, limite, ajuda } = formatos[tipo];

  useEffect(() => {
    if (!arquivos.length) input.current.value = '';
  }, [arquivos.length]);

  function ler(evento) {
    const selecionados = [...evento.target.files];
    const invalido = selecionados.find(arquivo => {
      const extensao = arquivo.name.slice(arquivo.name.lastIndexOf('.')).toLowerCase();
      return !accept.split(',').includes(extensao) || (limite && arquivo.size > limite * 1024 * 1024);
    });
    setErro(invalido ? 'Selecione um arquivo no formato e no tamanho indicados.' : '');
    if (invalido) input.current.value = '';
    selecionar(invalido ? [] : selecionados);
  }

  return <div className="arquivo-campo">
    <label htmlFor={id} className="arquivo-titulo">{titulo}</label>
    <small id={id + '-ajuda'}>{ajuda}</small>
    <div className="arquivo-controles">
      <input id={id} ref={input} type="file" accept={accept} multiple={multiple}
        required={required} disabled={disabled} onChange={ler}
        aria-describedby={id + '-ajuda' + (erro ? ' ' + id + '-erro' : '')}/>
      {arquivos.length > 0 && <button type="button" disabled={disabled}
        aria-label={`Limpar seleção de ${titulo.toLowerCase()}`}
        onClick={() => { selecionar([]); input.current.value = ''; input.current.focus(); }}>
        <FaTimes aria-hidden="true"/> Limpar
      </button>}
    </div>
    {multiple && arquivos.length > 0 && <ul>{arquivos.map((arquivo, indice) => <li key={indice}>{arquivo.name}</li>)}</ul>}
    {erro && <p id={id + '-erro'} role="alert">{erro}</p>}
  </div>;
}
