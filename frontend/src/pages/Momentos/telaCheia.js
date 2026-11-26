export default async function telaCheia(alvo, video, paisagem = false) {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  if (typeof video?.webkitEnterFullscreen === 'function' &&
      (!alvo.requestFullscreen || /iPhone|iPad/.test(navigator.userAgent))) {
    video.webkitEnterFullscreen();
    return;
  }
  if (!alvo.requestFullscreen) throw new Error('Tela cheia indisponível neste navegador.');
  await alvo.requestFullscreen();
  if (paisagem && screen.orientation?.lock) {
    try {
      await screen.orientation.lock('landscape');
      document.addEventListener('fullscreenchange', function liberar() {
        if (!document.fullscreenElement) {
          screen.orientation.unlock?.();
          document.removeEventListener('fullscreenchange', liberar);
        }
      });
    } catch { /* A rotação manual continua disponível no navegador. */ }
  }
}
