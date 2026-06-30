/* Aprimoramento progressivo — o app funciona sem JS; isto melhora a experiência.
   1) Barra de progresso no upload de vídeo.
   2) Destaque do consentimento LGPD quando o vídeo contém pessoa identificável. */
(function () {
  'use strict';

  // --- Confirmação de ações destrutivas (CSP-safe: sem onsubmit inline) ---
  // Qualquer <form data-confirm="mensagem"> pede confirmação antes de enviar.
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (form && form.getAttribute && form.hasAttribute('data-confirm')) {
      if (!window.confirm(form.getAttribute('data-confirm'))) {
        e.preventDefault();
      }
    }
  });

  // --- Upload com barra de progresso ---
  var formUpload = document.querySelector('form[enctype="multipart/form-data"]');
  var progresso = document.getElementById('progresso-upload');
  if (formUpload && progresso && window.XMLHttpRequest && window.FormData) {
    formUpload.addEventListener('submit', function (e) {
      var input = document.getElementById('video');
      if (!input || !input.files || !input.files.length) return; // deixa o fluxo normal validar

      e.preventDefault();
      var xhr = new XMLHttpRequest();
      xhr.open('POST', formUpload.getAttribute('action'), true);
      progresso.hidden = false;

      xhr.upload.addEventListener('progress', function (evt) {
        if (evt.lengthComputable) {
          var pct = Math.round((evt.loaded / evt.total) * 100);
          progresso.value = pct;
          progresso.textContent = pct + '%';
          progresso.setAttribute('aria-label', 'Enviando vídeo: ' + pct + '%');
        }
      });

      xhr.onload = function () {
        progresso.hidden = true;
        // Sucesso: o servidor responde com redirect (302); o XHR o segue e expõe
        // status 200 com a URL final — navegamos para ela.
        // Erro (vídeo inválido/grande ou validação): a página é re-renderizada na
        // MESMA URL do POST, que só aceita POST. Navegar para ela viraria um GET
        // 404; então mostramos a resposta recebida, com a mensagem de erro.
        if (xhr.status >= 400) {
          document.open();
          document.write(xhr.responseText);
          document.close();
        } else if (xhr.responseURL) {
          window.location.href = xhr.responseURL;
        } else {
          window.location.reload();
        }
      };
      xhr.onerror = function () {
        progresso.hidden = true;
        alert('Falha no envio do vídeo. Tente novamente.');
      };
      xhr.send(new FormData(formUpload));
    });
  }

  // --- LGPD: realça obrigatoriedade do consentimento ---
  var contemPessoa = document.getElementById('contemPessoa');
  if (contemPessoa) {
    var bloco = contemPessoa.closest('.bloco-lgpd');
    var sincronizar = function () {
      if (bloco) bloco.style.borderColor = contemPessoa.checked ? '#b3261e' : '';
    };
    contemPessoa.addEventListener('change', sincronizar);
    sincronizar();
  }
})();
