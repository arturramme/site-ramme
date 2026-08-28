/* ==========================================================================
   RAMME TECH — main.js
   Melhoria progressiva apenas. Sem JS a pagina continua navegavel:
   as ancoras funcionam, o menu fica visivel e o tema segue o sistema.
   Sem dependencias.
   ========================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;

  /* ----------------------------------------------------------------------
     1. Tema
     O tema inicial ja foi resolvido pelo script inline no <head>.
     Aqui tratamos apenas a troca manual e a mudanca de preferencia do SO.
     ---------------------------------------------------------------------- */
  var THEME_KEY = 'ramme-theme';
  // Escuro e o padrao do site (ver tokens.css); claro so por escolha.
  var THEME_COLOR = { light: '#f4f7fa', dark: '#060b10' };
  function syncThemeColor(theme) {
    var meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', THEME_COLOR[theme] || THEME_COLOR.dark);
  }

  function applyTheme(theme, persist) {
    root.setAttribute('data-theme', theme);
    syncThemeColor(theme);
    if (persist) {
      try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* modo privado */ }
    }
  }

  syncThemeColor(root.getAttribute('data-theme') || 'dark');

  var themeToggle = document.querySelector('[data-theme-toggle]');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
    });
  }

  /* ----------------------------------------------------------------------
     2. Navegacao mobile
     ---------------------------------------------------------------------- */
  var header = document.querySelector('[data-header]');
  var navToggle = document.querySelector('[data-nav-toggle]');
  var nav = document.getElementById('nav-principal');

  function setNav(open) {
    if (!header || !navToggle) return;
    header.setAttribute('data-nav', open ? 'open' : 'closed');
    navToggle.setAttribute('aria-expanded', String(open));
    var label = navToggle.querySelector('.sr-only');
    if (label) label.textContent = open ? 'Fechar menu de navegação' : 'Abrir menu de navegação';
  }

  if (navToggle && nav) {
    setNav(false);

    navToggle.addEventListener('click', function () {
      setNav(navToggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setNav(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
        setNav(false);
        navToggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (navToggle.getAttribute('aria-expanded') !== 'true') return;
      if (!header.contains(event.target)) setNav(false);
    });
  }

  /* ----------------------------------------------------------------------
     3. Estado do header ao rolar
     ---------------------------------------------------------------------- */
  if (header) {
    var ticking = false;

    var updateHeader = function () {
      header.setAttribute('data-scrolled', String(window.scrollY > 8));
      ticking = false;
    };

    updateHeader();

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateHeader);
    }, { passive: true });
  }

  /* ----------------------------------------------------------------------
     4. Secao ativa na navegacao (scrollspy)
     Marca o link correspondente com aria-current, util para leitores de
     tela e para o estado visual.
     ---------------------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav__link'));

  if (navLinks.length && 'IntersectionObserver' in window) {
    var linkById = {};
    var targets = [];

    navLinks.forEach(function (link) {
      var id = (link.getAttribute('href') || '').slice(1);
      var section = id && document.getElementById(id);
      if (!section) return;
      linkById[id] = link;
      targets.push(section);
    });

    var hero = document.getElementById('inicio');
    if (hero) targets.push(hero);

    var setActive = function (id) {
      navLinks.forEach(function (link) { link.removeAttribute('aria-current'); });
      if (linkById[id]) linkById[id].setAttribute('aria-current', 'true');
    };

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    targets.forEach(function (section) { spy.observe(section); });
  }

  /* ----------------------------------------------------------------------
     5. Revelacao ao entrar na viewport
     Padrao reaproveitado pelas proximas secoes: basta adicionar a classe
     .reveal (e, opcionalmente, --reveal-delay) no HTML.
     ---------------------------------------------------------------------- */
  var revealables = document.querySelectorAll('.reveal');

  if (revealables.length) {
    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealables.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var reveal = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

      revealables.forEach(function (el) { reveal.observe(el); });
    }
  }

  /* ----------------------------------------------------------------------
     6. Copiar e-mail
     ---------------------------------------------------------------------- */
  document.querySelectorAll('[data-copiar]').forEach(function (botao) {
    var alvo = botao.getAttribute('data-copiar');
    var texto = botao.querySelector('[data-copiar-texto]');
    var original = texto ? texto.textContent : '';
    var timer;

    var confirmar = function () {
      botao.setAttribute('data-copiado', 'true');
      if (texto) texto.textContent = 'Copiado';
      clearTimeout(timer);
      timer = setTimeout(function () {
        botao.removeAttribute('data-copiado');
        if (texto) texto.textContent = original;
      }, 2000);
    };

    // Usado quando nao ha Clipboard API ou quando ela recusa (contexto
    // inseguro, permissao negada).
    var copiarLegado = function () {
      var campo = document.createElement('textarea');
      campo.value = alvo;
      campo.setAttribute('readonly', '');
      campo.style.position = 'fixed';
      campo.style.opacity = '0';
      document.body.appendChild(campo);
      campo.select();
      try { document.execCommand('copy'); confirmar(); } catch (e) { /* silencioso */ }
      document.body.removeChild(campo);
    };

    botao.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(alvo).then(confirmar, copiarLegado);
        return;
      }
      copiarLegado();
    });
  });

  /* ----------------------------------------------------------------------
     7. Formulario de contato
     Validacao propria (o form usa novalidate) para mensagens em portugues
     e consistentes com o visual. O envio usa data-endpoint quando existir;
     sem endpoint configurado, cai para o cliente de e-mail — ver README.
     ---------------------------------------------------------------------- */
  var formulario = document.querySelector('[data-formulario]');

  if (formulario) {
    var estado = formulario.querySelector('[data-estado]');
    var botaoTexto = formulario.querySelector('[data-enviar-texto]');
    var rotuloEnviar = botaoTexto ? botaoTexto.textContent : '';
    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var campoDe = function (input) { return input.closest('[data-campo]'); };

    var mostrarErro = function (input, mensagem) {
      var campo = campoDe(input);
      if (!campo) return;
      campo.setAttribute('data-erro', 'true');
      input.setAttribute('aria-invalid', 'true');
      var alvo = campo.querySelector('.campo__erro');
      if (alvo) alvo.textContent = mensagem;
    };

    var limparErro = function (input) {
      var campo = campoDe(input);
      if (!campo) return;
      campo.removeAttribute('data-erro');
      input.removeAttribute('aria-invalid');
      var alvo = campo.querySelector('.campo__erro');
      if (alvo) alvo.textContent = '';
    };

    var validar = function (input) {
      var valor = input.value.trim();

      if (input.name === 'nome') {
        return valor ? null : 'Informe seu nome.';
      }

      if (input.name === 'email') {
        if (!valor) return 'Informe seu e-mail.';
        return EMAIL.test(valor) ? null : 'Confira o e-mail: parece incompleto.';
      }

      if (input.name === 'telefone' && valor) {
        return valor.replace(/\D/g, '').length >= 8 ? null : 'Confira o telefone.';
      }

      return null;
    };

    var campos = Array.prototype.slice.call(
      formulario.querySelectorAll('[data-campo] input, [data-campo] textarea')
    );

    campos.forEach(function (input) {
      // So valida ao sair do campo; depois do primeiro erro, corrige ao vivo.
      input.addEventListener('blur', function () {
        var erro = validar(input);
        if (erro) mostrarErro(input, erro); else limparErro(input);
      });

      input.addEventListener('input', function () {
        var campo = campoDe(input);
        if (campo && campo.hasAttribute('data-erro') && !validar(input)) limparErro(input);
      });
    });

    var dizer = function (mensagem, tipo) {
      if (!estado) return;
      estado.textContent = mensagem;
      if (tipo) estado.setAttribute('data-tipo', tipo);
      else estado.removeAttribute('data-tipo');
    };

    var porEmail = function (dados) {
      var corpo = [
        'Nome: ' + dados.nome,
        'E-mail: ' + dados.email,
        'Telefone: ' + (dados.telefone || '-'),
        '',
        dados.observacao || ''
      ].join('\n');

      window.location.href = 'mailto:contato@ramme.dev'
        + '?subject=' + encodeURIComponent('Contato pelo site - ' + dados.nome)
        + '&body=' + encodeURIComponent(corpo);

      dizer('Abrimos seu cliente de e-mail com a mensagem pronta.', 'ok');
    };

    formulario.addEventListener('submit', function (event) {
      event.preventDefault();

      // Campo-armadilha preenchido: robo. Encerra sem enviar nem avisar.
      var armadilha = formulario.querySelector('[name="setor"]');
      if (armadilha && armadilha.value) return;

      var primeiroInvalido = null;

      campos.forEach(function (input) {
        var erro = validar(input);
        if (erro) {
          mostrarErro(input, erro);
          if (!primeiroInvalido) primeiroInvalido = input;
        } else {
          limparErro(input);
        }
      });

      if (primeiroInvalido) {
        dizer('Confira os campos destacados.', 'erro');
        primeiroInvalido.focus();
        return;
      }

      var dados = {
        nome: formulario.elements.nome.value.trim(),
        email: formulario.elements.email.value.trim(),
        telefone: formulario.elements.telefone.value.trim(),
        observacao: formulario.elements.observacao.value.trim()
      };

      var endpoint = formulario.getAttribute('data-endpoint');

      if (!endpoint) {
        porEmail(dados);
        return;
      }

      formulario.setAttribute('data-enviando', 'true');
      if (botaoTexto) botaoTexto.textContent = 'Enviando...';
      dizer('');

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(dados)
      }).then(function (resposta) {
        if (!resposta.ok) throw new Error(String(resposta.status));
        formulario.reset();
        dizer('Mensagem enviada. Retornamos em breve.', 'ok');
      }).catch(function () {
        dizer('Não consegui enviar agora. Escreva para contato@ramme.dev.', 'erro');
      }).then(function () {
        formulario.removeAttribute('data-enviando');
        if (botaoTexto) botaoTexto.textContent = rotuloEnviar;
      });
    });
  }

  /* ----------------------------------------------------------------------
     8. Ano do rodape
     ---------------------------------------------------------------------- */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
