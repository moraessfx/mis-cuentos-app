/*
 * app.js
 * -----------------------------------------------------------------------
 * Motor de la aplicación "Mis Cuentos". No hay IA ni contenido generado:
 * esta app únicamente muestra, ordena y guarda el progreso sobre el
 * contenido fijo definido en data.js.
 * -----------------------------------------------------------------------
 */

(function () {
  "use strict";

  const APP_EL = document.getElementById("app");
  const STORAGE_KEY = "misCuentosState_v1";

  /* ----------------------------- Estado ------------------------------ */

  function defaultState() {
    return {
      progresoLectura: null, // { storyId, sceneId }
      cuentos: {},
      insignias: []
    };
  }

  function ensureCuento(state, storyId) {
    if (!state.cuentos[storyId]) {
      state.cuentos[storyId] = {
        iniciado: false,
        completado: false,
        escenasVisitadas: [],
        quizRespondido: false,
        quizCorrectas: 0,
        quizTotal: 0,
        tiempoLecturaSeg: 0,
        fechasLectura: []
      };
    }
    return state.cuentos[storyId];
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return Object.assign(defaultState(), parsed);
    } catch (e) {
      return defaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* almacenamiento no disponible: la app sigue funcionando en memoria */
    }
  }

  let state = loadState();

  /* --------------------------- Navegación ----------------------------- */

  let nav = { screen: "home", params: {} };
  let navStack = []; // pila de escenas dentro de un cuento (en memoria)
  let quizIndex = 0;
  let quizAnswers = [];
  let badgesBeforeSession = [];

  function goTo(screen, params) {
    nav = { screen, params: params || {} };
    render();
  }

  /* ----------------------------- Ayudas -------------------------------- */

  function getStory(id) {
    return STORIES.find((s) => s.id === id);
  }

  function getScene(story, sceneId) {
    return story.escenas[sceneId];
  }

  function totalEscenas(story) {
    return Object.keys(story.escenas).length;
  }

  function porcentajeProgreso(story, cuento) {
    if (!cuento) return 0;
    const total = totalEscenas(story);
    const vistas = cuento.escenasVisitadas.length;
    return Math.min(100, Math.round((vistas / total) * 100));
  }

  function hoyISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function normalizarPalabra(w) {
    return w.toLowerCase().replace(/[^a-záéíóúñü]/gi, "");
  }

  function palabrasAprendidasCount() {
    const set = new Set();
    STORIES.forEach((story) => {
      if (!story.disponible) return;
      const cuento = state.cuentos[story.id];
      if (!cuento || !cuento.iniciado) return;
      cuento.escenasVisitadas.forEach((sceneId) => {
        const scene = story.escenas[sceneId];
        if (!scene) return;
        scene.lineas.forEach((linea) => {
          linea.split(/\s+/).forEach((w) => {
            const limpio = normalizarPalabra(w);
            if (limpio.length > 2) set.add(limpio);
          });
        });
      });
    });
    return set.size;
  }

  function contarCuentosTerminadosLocal() {
    return contarCuentosTerminados(state);
  }

  function preguntasCorrectasTotal() {
    return Object.values(state.cuentos).reduce((acc, c) => acc + (c.quizCorrectas || 0), 0);
  }

  function actualizarInsignias() {
    const nuevas = [];
    BADGES.forEach((b) => {
      const yaTiene = state.insignias.includes(b.id);
      if (!yaTiene && b.condicion(state)) {
        state.insignias.push(b.id);
        nuevas.push(b);
      }
    });
    return nuevas;
  }

  /* ------------------------------ Audio -------------------------------- */

  const synth = window.speechSynthesis;
  let currentUtterance = null;
  let wordSpans = []; // [{start, el}]
  let audioState = "idle"; // idle | playing | paused

  function elegirVoz() {
    if (!synth) return null;
    const voces = synth.getVoices();
    return (
      voces.find((v) => v.lang === "es-AR") ||
      voces.find((v) => v.lang && v.lang.toLowerCase().startsWith("es")) ||
      null
    );
  }

  function detenerAudio() {
    if (synth && synth.speaking) synth.cancel();
    currentUtterance = null;
    audioState = "idle";
    limpiarResaltado();
  }

  function limpiarResaltado() {
    wordSpans.forEach((w) => w.el && w.el.classList.remove("word--active"));
  }

  function resaltarPorIndice(charIndex) {
    let objetivo = null;
    for (let i = 0; i < wordSpans.length; i++) {
      if (wordSpans[i].start <= charIndex) objetivo = wordSpans[i];
      else break;
    }
    limpiarResaltado();
    if (objetivo && objetivo.el) objetivo.el.classList.add("word--active");
  }

  function reproducirEscena() {
    if (!synth) return;
    if (audioState === "paused" && currentUtterance) {
      synth.resume();
      audioState = "playing";
      actualizarBotonesAudio();
      return;
    }
    detenerAudio();
    const story = getStory(nav.params.storyId);
    const scene = getScene(story, nav.params.sceneId);
    const texto = scene.lineas.join(" ");
    const utter = new SpeechSynthesisUtterance(texto);
    const voz = elegirVoz();
    if (voz) utter.voice = voz;
    utter.lang = voz ? voz.lang : "es-ES";
    utter.rate = 0.92;
    utter.pitch = 1.05;
    utter.onboundary = function (e) {
      if (typeof e.charIndex === "number") resaltarPorIndice(e.charIndex);
    };
    utter.onend = function () {
      audioState = "idle";
      limpiarResaltado();
      actualizarBotonesAudio();
    };
    utter.onerror = function () {
      audioState = "idle";
      actualizarBotonesAudio();
    };
    currentUtterance = utter;
    audioState = "playing";
    synth.speak(utter);
    actualizarBotonesAudio();
  }

  function pausarAudio() {
    if (synth && synth.speaking) {
      synth.pause();
      audioState = "paused";
      actualizarBotonesAudio();
    }
  }

  function repetirAudio() {
    detenerAudio();
    reproducirEscena();
  }

  function actualizarBotonesAudio() {
    const btnPlay = document.querySelector('[data-action="audio-play"]');
    const btnPause = document.querySelector('[data-action="audio-pause"]');
    if (!btnPlay || !btnPause) return;
    btnPlay.style.display = audioState === "playing" ? "none" : "flex";
    btnPause.style.display = audioState === "playing" ? "flex" : "none";
  }

  /* ---------------------- Seguimiento de tiempo ------------------------- */

  let tiempoInicioLectura = null;

  function iniciarCronometro() {
    tiempoInicioLectura = Date.now();
  }

  function volcarCronometro(storyId) {
    if (!tiempoInicioLectura || !storyId) return;
    const seg = Math.round((Date.now() - tiempoInicioLectura) / 1000);
    if (seg > 0) {
      const cuento = ensureCuento(state, storyId);
      cuento.tiempoLecturaSeg += seg;
      saveState();
    }
    tiempoInicioLectura = null;
  }

  /* ------------------------------ Home ---------------------------------- */

  function renderHome() {
    const enProgreso = state.progresoLectura;
    let storyEnCurso = null;
    if (enProgreso) {
      const c = state.cuentos[enProgreso.storyId];
      if (c && !c.completado) storyEnCurso = getStory(enProgreso.storyId);
    }

    return `
      <div class="screen">
        <div class="home-header">
          <div class="home-header__eyebrow">¡Hola!</div>
          <h1>Mis cuentos</h1>
        </div>

        ${
          storyEnCurso
            ? `
          <button class="current-story-card" data-action="continue-story">
            <div class="current-story-card__thumb"><img src="${storyEnCurso.portada}" alt=""></div>
            <div class="current-story-card__info">
              <div class="current-story-card__label">Estás leyendo</div>
              <div class="current-story-card__title">${storyEnCurso.titulo}</div>
            </div>
          </button>`
            : ""
        }

        <div class="big-nav">
          <button class="big-button big-button--primary" data-action="${storyEnCurso ? "continue-story" : "library"}">
            <span class="big-button__icon">📖</span>
            <span>Continuar cuento</span>
          </button>
          <button class="big-button big-button--library" data-action="library">
            <span class="big-button__icon">📚</span>
            <span>Biblioteca</span>
          </button>
          <button class="big-button big-button--progress" data-action="progress">
            <span class="big-button__icon">🌟</span>
            <span>Mi progreso</span>
          </button>
          <button class="big-button big-button--parents" data-action="parents">
            <span class="big-button__icon">👨‍👩‍👧</span>
            <span>Padres</span>
          </button>
        </div>
      </div>
    `;
  }

  /* ---------------------------- Biblioteca -------------------------------- */

  const DIFICULTADES = [
    { id: "todas", label: "Todas" },
    { id: "facil", label: "Fácil" },
    { id: "medio", label: "Medio" },
    { id: "aventuras", label: "Aventuras" }
  ];

  function renderLibrary() {
    const filtro = nav.params.filtro || "todas";
    const historias = STORIES.filter((s) => filtro === "todas" || s.dificultad === filtro);

    const tarjetas = historias
      .map((story) => {
        const cuento = state.cuentos[story.id];
        const progreso = story.disponible ? porcentajeProgreso(story, cuento) : 0;
        const locked = !story.disponible;
        return `
        <div class="story-card ${locked ? "story-card--locked" : ""}">
          <div class="story-card__thumb"><img src="${story.portada}" alt=""></div>
          <div class="story-card__body">
            <div class="story-card__title">${story.titulo}</div>
            <div class="story-card__meta">
              <span class="pill pill--${story.dificultad}">${story.dificultadLabel}</span>
              <span style="font-size:12px;color:var(--ink-soft);">${story.edad}</span>
            </div>
            ${
              !locked
                ? `<div class="story-card__progress-bar"><div class="story-card__progress-fill" style="width:${progreso}%"></div></div>`
                : ""
            }
            <button class="story-card__cta" data-action="${locked ? "none" : "read-story"}" data-value="${story.id}">
              ${locked ? "Próximamente" : cuento && cuento.iniciado && !cuento.completado ? "Seguir leyendo" : cuento && cuento.completado ? "Leer de nuevo" : "Leer"}
            </button>
          </div>
        </div>`;
      })
      .join("");

    return `
      <div class="screen">
        <div class="topbar">
          <button class="topbar__back" data-action="home" aria-label="Volver">←</button>
          <div class="topbar__title">Biblioteca</div>
        </div>
        <div class="tabs" role="tablist">
          ${DIFICULTADES.map(
            (d) => `<button class="tab" role="tab" aria-selected="${d.id === filtro}" data-action="tab" data-value="${d.id}">${d.label}</button>`
          ).join("")}
        </div>
        <div class="story-list">
          ${tarjetas || '<div class="empty-state">Todavía no hay cuentos en esta categoría.</div>'}
        </div>
      </div>
    `;
  }

  /* ----------------------------- Lectura ---------------------------------- */

  function computarWordSpans(lineas) {
    // Construye los <span> palabra por palabra y calcula el offset de cada
    // una dentro del texto plano (lineas.join(' ')) para poder sincronizar
    // el resaltado con el evento "boundary" del narrador.
    let offset = 0;
    const paragraphs = [];
    const registro = [];
    lineas.forEach((linea, li) => {
      const partes = linea.split(/(\s+)/); // conserva separadores
      let html = "";
      partes.forEach((parte) => {
        if (parte.trim().length === 0) {
          html += parte;
          offset += parte.length;
        } else {
          const start = offset;
          const id = `w-${li}-${start}`;
          html += `<span class="word" id="${id}" data-start="${start}">${parte}</span>`;
          registro.push({ start, id });
          offset += parte.length;
        }
      });
      paragraphs.push(html);
      offset += 1; // por el espacio que usa lineas.join(' ') entre líneas
    });
    return { paragraphs, registro };
  }

  function renderReading() {
    const { storyId, sceneId } = nav.params;
    const story = getStory(storyId);
    const scene = getScene(story, sceneId);
    const cuento = ensureCuento(state, storyId);
    const total = totalEscenas(story);
    const progresoPct = Math.round((scene.numero / total) * 100);

    const { paragraphs, registro } = computarWordSpans(scene.lineas);
    wordSpans = registro.map((r) => ({ start: r.start, el: null })); // se completa tras insertar el DOM

    const puedeVolver = navStack.length > 1;

    let controlesInferiores = "";
    if (scene.decisiones) {
      controlesInferiores = `
        <div class="decisions">
          ${scene.decisiones
            .map(
              (d, i) =>
                `<button class="decision-btn" data-action="scene-decision" data-value="${i}">${d.texto}</button>`
            )
            .join("")}
        </div>`;
    } else if (scene.final) {
      controlesInferiores = `
        <div class="continue-row">
          ${puedeVolver ? `<button class="nav-btn nav-btn--back" data-action="scene-back">←</button>` : ""}
          <button class="nav-btn nav-btn--forward" data-action="to-end">Continuar</button>
        </div>`;
    } else {
      controlesInferiores = `
        <div class="continue-row">
          ${puedeVolver ? `<button class="nav-btn nav-btn--back" data-action="scene-back">←</button>` : ""}
          <button class="nav-btn nav-btn--forward" data-action="scene-continue">Continuar</button>
        </div>`;
    }

    return `
      <div class="screen">
        <div class="topbar">
          <button class="topbar__back" data-action="library" aria-label="Salir del cuento">←</button>
          <div class="topbar__title">${story.titulo}</div>
        </div>
        <div class="reading-progress"><div class="reading-progress__fill" style="width:${progresoPct}%"></div></div>
        <div class="scene-illustration"><img src="${scene.ilustracion}" alt="Ilustración de la escena: ${scene.titulo}"></div>
        <div class="scene-text" id="scene-text">
          ${paragraphs.map((p) => `<p>${p}</p>`).join("")}
        </div>
        <div class="audio-controls">
          <button class="audio-btn" data-action="audio-play" aria-label="Escuchar">
            <span class="audio-btn__icon">🔊</span><span>Escuchar</span>
          </button>
          <button class="audio-btn" data-action="audio-pause" style="display:none" aria-label="Pausar">
            <span class="audio-btn__icon">⏸️</span><span>Pausar</span>
          </button>
          <button class="audio-btn" data-action="audio-repeat" aria-label="Repetir">
            <span class="audio-btn__icon">🔁</span><span>Repetir</span>
          </button>
        </div>
        ${controlesInferiores}
      </div>
    `;
  }

  function afterRenderReading() {
    // conecta los spans reales del DOM con el registro de offsets
    const nodos = document.querySelectorAll("#scene-text .word");
    wordSpans = Array.from(nodos).map((el) => ({ start: parseInt(el.dataset.start, 10), el }));
    audioState = "idle";
    actualizarBotonesAudio();
  }

  function marcarEscenaVisitada(storyId, sceneId) {
    const cuento = ensureCuento(state, storyId);
    if (!cuento.escenasVisitadas.includes(sceneId)) cuento.escenasVisitadas.push(sceneId);
    cuento.iniciado = true;
    if (!cuento.fechasLectura.includes(hoyISO())) cuento.fechasLectura.push(hoyISO());
    state.progresoLectura = { storyId, sceneId };
    saveState();
  }

  function irAEscena(storyId, sceneId, pushHistorial) {
    detenerAudio();
    if (pushHistorial) navStack.push(sceneId);
    marcarEscenaVisitada(storyId, sceneId);
    goTo("reading", { storyId, sceneId });
  }

  /* -------------------------- Fin de cuento -------------------------------- */

  function renderEnd() {
    return `
      <div class="screen end-screen">
        <div class="end-screen__stars">✨ ⭐ ✨</div>
        <h1>FIN</h1>
        <p style="color:var(--ink-soft);font-size:16px;">¡Terminaste el cuento!</p>
        <button class="primary-btn" style="max-width:260px;" data-action="to-quiz">Responder unas preguntas</button>
      </div>
    `;
  }

  /* ------------------------------ Quiz -------------------------------------- */

  function renderQuiz() {
    // Las respuestas correctas no se muestran pregunta por pregunta (para no
    // generar presión); solo se marca la opción elegida. El resultado
    // completo se ve recién en la pantalla de recompensa, al terminar.
    const story = getStory(nav.params.storyId);
    const pregunta = story.preguntas[quizIndex];
    const respuesta = quizAnswers[quizIndex];

    return `
      <div class="screen">
        <div class="quiz-progress">Pregunta ${quizIndex + 1} de ${story.preguntas.length}</div>
        <div class="quiz-question">${pregunta.texto}</div>
        <div class="quiz-options">
          ${pregunta.opciones
            .map((op, i) => {
              const clase = "quiz-option" + (i === respuesta ? " quiz-option--selected" : "");
              return `<button class="${clase}" data-action="quiz-answer" data-value="${i}" ${respuesta !== undefined ? "disabled" : ""}>${op}</button>`;
            })
            .join("")}
        </div>
        ${
          respuesta !== undefined
            ? `<button class="primary-btn" style="margin-top:24px;" data-action="quiz-next">${quizIndex + 1 < story.preguntas.length ? "Siguiente" : "Ver recompensa"}</button>`
            : ""
        }
      </div>
    `;
  }

  /* ----------------------------- Recompensa ----------------------------------- */

  function renderReward() {
    const story = getStory(nav.params.storyId);
    const cuento = state.cuentos[story.id];
    const nuevasInsignias = nav.params.nuevasInsignias || [];
    return `
      <div class="screen reward-screen">
        <div class="reward-badge">⭐</div>
        <h1>¡Cuento terminado!</h1>
        <p style="color:var(--ink-soft);font-size:16px;">Respondiste ${cuento.quizCorrectas} de ${cuento.quizTotal} preguntas correctamente.</p>
        ${
          nuevasInsignias.length
            ? `<p style="color:var(--gold-deep);font-weight:700;">¡Nueva insignia! ${nuevasInsignias.map((b) => b.icono + " " + b.nombre).join(", ")}</p>`
            : ""
        }
        <button class="primary-btn" style="max-width:260px;margin-top:10px;" data-action="home">Volver al inicio</button>
      </div>
    `;
  }

  /* ------------------------------ Progreso ------------------------------------- */

  function renderProgress() {
    const terminados = contarCuentosTerminadosLocal();
    const enProgreso = Object.values(state.cuentos).filter((c) => c.iniciado && !c.completado).length;
    const palabras = palabrasAprendidasCount();
    const correctas = preguntasCorrectasTotal();

    return `
      <div class="screen">
        <div class="topbar">
          <button class="topbar__back" data-action="home" aria-label="Volver">←</button>
          <div class="topbar__title">Mi progreso</div>
        </div>
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-card__value">${terminados}</div><div class="stat-card__label">Cuentos terminados</div></div>
          <div class="stat-card"><div class="stat-card__value">${enProgreso}</div><div class="stat-card__label">Cuentos en progreso</div></div>
          <div class="stat-card"><div class="stat-card__value">${palabras}</div><div class="stat-card__label">Palabras aprendidas</div></div>
          <div class="stat-card"><div class="stat-card__value">${correctas}</div><div class="stat-card__label">Respuestas correctas</div></div>
        </div>
        <div class="section-heading">Insignias</div>
        <div class="badge-grid">
          ${BADGES.map((b) => {
            const ganada = state.insignias.includes(b.id);
            return `
            <div class="badge-card ${ganada ? "badge-card--earned" : ""}">
              <div class="badge-card__icon">${b.icono}</div>
              <div class="badge-card__name">${b.nombre}</div>
            </div>`;
          }).join("")}
        </div>
      </div>
    `;
  }

  /* -------------------------------- Padres --------------------------------------- */

  let gateA = 0;
  let gateB = 0;

  function renderParentsGate() {
    gateA = 2 + Math.floor(Math.random() * 7);
    gateB = 2 + Math.floor(Math.random() * 7);
    return `
      <div class="screen">
        <div class="topbar">
          <button class="topbar__back" data-action="home" aria-label="Volver">←</button>
          <div class="topbar__title">Modo padres</div>
        </div>
        <div class="gate-card">
          <p style="color:var(--ink-soft);">Esta sección es para adultos. Resolvé la cuenta para continuar.</p>
          <div class="gate-card__question">${gateA} + ${gateB} = ?</div>
          <input class="gate-card__input" id="gate-input" type="number" inputmode="numeric" placeholder="Resultado">
          <div class="gate-card__error" id="gate-error"></div>
          <button class="primary-btn" data-action="gate-submit">Entrar</button>
        </div>
      </div>
    `;
  }

  function renderParentsDashboard() {
    const cuentos = state.cuentos;
    const terminados = contarCuentosTerminadosLocal();
    const totalSeg = Object.values(cuentos).reduce((a, c) => a + (c.tiempoLecturaSeg || 0), 0);
    const minutos = Math.round(totalSeg / 60);
    const conQuiz = Object.values(cuentos).filter((c) => c.quizRespondido);
    const comprension = conQuiz.length
      ? Math.round((conQuiz.reduce((a, c) => a + c.quizCorrectas / (c.quizTotal || 1), 0) / conQuiz.length) * 100)
      : 0;
    const diasUnicos = new Set();
    Object.values(cuentos).forEach((c) => (c.fechasLectura || []).forEach((f) => diasUnicos.add(f)));
    const progresoPromedio = (() => {
      const activos = STORIES.filter((s) => s.disponible && cuentos[s.id] && cuentos[s.id].iniciado);
      if (!activos.length) return 0;
      const suma = activos.reduce((a, s) => a + porcentajeProgreso(s, cuentos[s.id]), 0);
      return Math.round(suma / activos.length);
    })();

    return `
      <div class="screen">
        <div class="topbar">
          <button class="topbar__back" data-action="home" aria-label="Volver">←</button>
          <div class="topbar__title">Resumen para padres</div>
        </div>
        <div class="parent-list">
          <div class="parent-row"><span class="parent-row__label">Cuentos leídos</span><span class="parent-row__value">${terminados}</span></div>
          <div class="parent-row"><span class="parent-row__label">Tiempo de lectura</span><span class="parent-row__value">${minutos} min</span></div>
          <div class="parent-row"><span class="parent-row__label">Progreso general</span><span class="parent-row__value">${progresoPromedio}%</span></div>
          <div class="parent-row"><span class="parent-row__label">Comprensión lectora</span><span class="parent-row__value">${comprension}%</span></div>
          <div class="parent-row"><span class="parent-row__label">Días de lectura</span><span class="parent-row__value">${diasUnicos.size}</span></div>
        </div>
        <p class="footnote">Estos datos se guardan solo en este dispositivo.</p>
      </div>
    `;
  }

  /* -------------------------------- Render general --------------------------------- */

  function render() {
    let html = "";
    switch (nav.screen) {
      case "home":
        html = renderHome();
        break;
      case "library":
        html = renderLibrary();
        break;
      case "reading":
        html = renderReading();
        break;
      case "end":
        html = renderEnd();
        break;
      case "quiz":
        html = renderQuiz();
        break;
      case "reward":
        html = renderReward();
        break;
      case "progress":
        html = renderProgress();
        break;
      case "parents-gate":
        html = renderParentsGate();
        break;
      case "parents-dashboard":
        html = renderParentsDashboard();
        break;
      default:
        html = renderHome();
    }
    APP_EL.innerHTML = html;
    if (nav.screen === "reading") afterRenderReading();
  }

  /* -------------------------------- Acciones ---------------------------------------- */

  function manejarAccion(action, value, el) {
    switch (action) {
      case "home":
        detenerAudio();
        goTo("home");
        break;

      case "library":
        detenerAudio();
        goTo("library", { filtro: (nav.params && nav.params.filtro) || "todas" });
        break;

      case "tab":
        goTo("library", { filtro: value });
        break;

      case "progress":
        detenerAudio();
        goTo("progress");
        break;

      case "parents":
        detenerAudio();
        goTo("parents-gate");
        break;

      case "gate-submit": {
        const input = document.getElementById("gate-input");
        const err = document.getElementById("gate-error");
        const val = parseInt(input.value, 10);
        if (val === gateA + gateB) {
          goTo("parents-dashboard");
        } else {
          err.textContent = "No es correcto, probá de nuevo.";
          input.value = "";
          input.focus();
        }
        break;
      }

      case "read-story": {
        const story = getStory(value);
        if (!story.disponible) return;
        const cuento = ensureCuento(state, story.id);
        if (cuento.completado) {
          // vuelve a empezar desde cero al leer de nuevo un cuento terminado
          cuento.escenasVisitadas = [];
          cuento.completado = false;
          cuento.quizRespondido = false;
          cuento.quizCorrectas = 0;
          cuento.quizTotal = 0;
        }
        navStack = [];
        const sceneId =
          cuento.iniciado && !cuento.completado && state.progresoLectura && state.progresoLectura.storyId === story.id
            ? state.progresoLectura.sceneId
            : story.escenaInicial;
        iniciarCronometro();
        irAEscena(story.id, sceneId, true);
        break;
      }

      case "continue-story": {
        if (!state.progresoLectura) {
          goTo("library");
          return;
        }
        navStack = [state.progresoLectura.sceneId];
        iniciarCronometro();
        goTo("reading", { storyId: state.progresoLectura.storyId, sceneId: state.progresoLectura.sceneId });
        break;
      }

      case "scene-continue": {
        const story = getStory(nav.params.storyId);
        const scene = getScene(story, nav.params.sceneId);
        irAEscena(story.id, scene.continuar, true);
        break;
      }

      case "scene-decision": {
        const story = getStory(nav.params.storyId);
        const scene = getScene(story, nav.params.sceneId);
        const decision = scene.decisiones[parseInt(value, 10)];
        irAEscena(story.id, decision.destino, true);
        break;
      }

      case "scene-back": {
        if (navStack.length > 1) {
          navStack.pop();
          const anterior = navStack[navStack.length - 1];
          detenerAudio();
          goTo("reading", { storyId: nav.params.storyId, sceneId: anterior });
        }
        break;
      }

      case "audio-play":
        reproducirEscena();
        break;

      case "audio-pause":
        pausarAudio();
        break;

      case "audio-repeat":
        repetirAudio();
        break;

      case "to-end":
        detenerAudio();
        volcarCronometro(nav.params.storyId);
        goTo("end", { storyId: nav.params.storyId });
        break;

      case "to-quiz": {
        const story = getStory(nav.params.storyId);
        quizIndex = 0;
        quizAnswers = new Array(story.preguntas.length).fill(undefined);
        badgesBeforeSession = state.insignias.slice();
        goTo("quiz", { storyId: story.id });
        break;
      }

      case "quiz-answer": {
        if (quizAnswers[quizIndex] !== undefined) return;
        quizAnswers[quizIndex] = parseInt(value, 10);
        render();
        break;
      }

      case "quiz-next": {
        const story = getStory(nav.params.storyId);
        if (quizIndex + 1 < story.preguntas.length) {
          quizIndex += 1;
          render();
        } else {
          const correctas = quizAnswers.reduce(
            (acc, resp, i) => acc + (resp === story.preguntas[i].correcta ? 1 : 0),
            0
          );
          const cuento = ensureCuento(state, story.id);
          cuento.completado = true;
          cuento.quizRespondido = true;
          cuento.quizCorrectas = correctas;
          cuento.quizTotal = story.preguntas.length;
          if (state.progresoLectura && state.progresoLectura.storyId === story.id) {
            state.progresoLectura = null;
          }
          const nuevasInsignias = actualizarInsignias();
          saveState();
          goTo("reward", { storyId: story.id, nuevasInsignias });
        }
        break;
      }

      default:
        break;
    }
  }

  APP_EL.addEventListener("click", function (e) {
    const target = e.target.closest("[data-action]");
    if (!target || target.getAttribute("data-action") === "none") return;
    manejarAccion(target.getAttribute("data-action"), target.getAttribute("data-value"), target);
  });

  window.addEventListener("beforeunload", function () {
    if (nav.screen === "reading") volcarCronometro(nav.params.storyId);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && nav.screen === "reading") {
      volcarCronometro(nav.params.storyId);
    } else if (!document.hidden && nav.screen === "reading") {
      iniciarCronometro();
    }
  });

  if (synth) {
    synth.onvoiceschanged = function () {
      /* las voces cargan asincrónicamente en algunos navegadores */
    };
  }

  render();
})();
