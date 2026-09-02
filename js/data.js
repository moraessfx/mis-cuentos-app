/*
 * data.js
 * -----------------------------------------------------------------------
 * Todo el contenido de la aplicación vive en este archivo, como datos
 * estáticos. No hay generación de texto, decisiones ni preguntas en
 * tiempo real: todo está previamente escrito y almacenado aquí.
 *
 * Para agregar un cuento nuevo en el futuro, alcanza con sumar un objeto
 * más al array STORIES con la misma forma. El motor de la aplicación
 * (js/app.js) no necesita cambios.
 * -----------------------------------------------------------------------
 */

const STORIES = [
  {
    id: "luna-estrella",
    titulo: "Luna y la estrella perdida",
    portada: "assets/illustrations/cover.svg",
    dificultad: "facil",
    dificultadLabel: "Fácil",
    edad: "5 a 7 años",
    disponible: true,
    escenaInicial: "e1",
    escenas: {
      e1: {
        id: "e1",
        numero: 1,
        titulo: "Una luz en el jardín",
        ilustracion: "assets/illustrations/escena1.svg",
        lineas: [
          "Luna estaba mirando las estrellas desde su ventana.",
          "De repente, vio una luz caer del cielo.",
          "—¡Oh! ¿Qué fue eso? —dijo Luna.",
          "La luz había caído en su jardín."
        ],
        decisiones: [
          { texto: "Salir al jardín", destino: "e2" },
          { texto: "Volver a la cama", destino: "e3" }
        ]
      },
      e2: {
        id: "e2",
        numero: 2,
        titulo: "La estrella",
        ilustracion: "assets/illustrations/escena2.svg",
        lineas: [
          "Luna salió corriendo al jardín.",
          "Cerca de un árbol encontró una pequeña estrella.",
          "La estrella temblaba y brillaba muy poquito.",
          "—¿Estás perdida? —preguntó Luna.",
          "La estrella hizo tic, tic con su pequeña luz."
        ],
        decisiones: [
          { texto: "Al bosque", destino: "e4" },
          { texto: "A la colina", destino: "e5" }
        ]
      },
      e3: {
        id: "e3",
        numero: 3,
        titulo: "Un extraño ruido",
        ilustracion: "assets/illustrations/escena3.svg",
        lineas: [
          "Luna volvió a su habitación.",
          "Se metió en la cama y cerró los ojos.",
          "Pero entonces escuchó:",
          "¡Toc, toc, toc!",
          "Luna abrió los ojos.",
          "El ruido venía de la ventana."
        ],
        continuar: "e2"
      },
      e4: {
        id: "e4",
        numero: 4,
        titulo: "El bosque",
        ilustracion: "assets/illustrations/escena4.svg",
        lineas: [
          "Luna caminó hasta el bosque con la estrella entre sus manos.",
          "Allí encontró un búho sentado sobre una rama.",
          "—Yo conozco el camino hasta el cielo —dijo el búho.",
          "—¿Me puedes ayudar?",
          "El búho señaló dos caminos."
        ],
        decisiones: [
          { texto: "El camino de los árboles altos", destino: "e6" },
          { texto: "El camino de las flores", destino: "e7" }
        ]
      },
      e5: {
        id: "e5",
        numero: 5,
        titulo: "La colina",
        ilustracion: "assets/illustrations/escena5.svg",
        lineas: [
          "Luna subió lentamente la colina.",
          "Desde arriba podía ver todo el pueblo.",
          "La estrella comenzó a brillar con mucha fuerza.",
          "Entonces Luna vio algo en el cielo.",
          "Una línea de pequeñas luces aparecía entre las nubes."
        ],
        continuar: "e6"
      },
      e6: {
        id: "e6",
        numero: 6,
        titulo: "El puente de luz",
        ilustracion: "assets/illustrations/escena6.svg",
        lineas: [
          "Luna llegó hasta un pequeño puente.",
          "El puente estaba hecho de luz.",
          "La estrella comenzó a subir.",
          "—¡Espera! —dijo Luna.",
          "La estrella se detuvo.",
          "Luna entendió que había llegado el momento de despedirse."
        ],
        decisiones: [
          { texto: "Se despide de la estrella", destino: "e8" },
          { texto: "Intenta quedarse con ella", destino: "e7" }
        ]
      },
      e7: {
        id: "e7",
        numero: 7,
        titulo: "Una sorpresa",
        ilustracion: "assets/illustrations/escena7.svg",
        lineas: [
          "Luna abrazó la estrella.",
          "De repente, la estrella brilló muchísimo.",
          "¡FUUUUSH!",
          "Una lluvia de pequeñas luces llenó el jardín.",
          "La estrella volvió a subir lentamente hacia el cielo.",
          "Antes de desaparecer, dejó una pequeña luz junto a Luna."
        ],
        continuar: "e8"
      },
      e8: {
        id: "e8",
        numero: 8,
        titulo: "Buenas noches",
        ilustracion: "assets/illustrations/escena8.svg",
        lineas: [
          "Luna miró hacia arriba.",
          "La pequeña estrella ya estaba en el cielo.",
          "Ahora brillaba más que todas las demás.",
          "Luna sonrió.",
          "—Buenas noches, pequeña estrella.",
          "Después volvió a su cama.",
          "Y desde aquella noche, cada vez que Luna miraba al cielo...",
          "una estrella parecía guiñarle el ojo."
        ],
        final: true
      }
    },
    preguntas: [
      {
        id: "p1",
        texto: "¿Qué encontró Luna en el jardín?",
        opciones: ["Una estrella", "Un perro", "Una pelota"],
        correcta: 0
      },
      {
        id: "p2",
        texto: "¿Quién ayudó a Luna en el bosque?",
        opciones: ["Un búho", "Un conejo", "Un gato"],
        correcta: 0
      },
      {
        id: "p3",
        texto: "¿Dónde volvió la estrella al final?",
        opciones: ["Al cielo", "Al mar", "A la casa"],
        correcta: 0
      }
    ]
  },
  {
    id: "bosque-encantado",
    titulo: "El bosque encantado",
    portada: "assets/illustrations/proximamente.svg",
    dificultad: "medio",
    dificultadLabel: "Medio",
    edad: "6 a 8 años",
    disponible: false
  },
  {
    id: "gran-aventura",
    titulo: "La gran aventura",
    portada: "assets/illustrations/proximamente.svg",
    dificultad: "aventuras",
    dificultadLabel: "Aventuras",
    edad: "7 años",
    disponible: false
  }
];

// Las opciones de respuesta de cada pregunta se barajan una sola vez por
// cuento (no en cada render) para que el orden sea estable durante la
// sesión de lectura, evitando cualquier apariencia de contenido generado
// al vuelo.
const ANSWER_ORDER_SEED = 7;

const BADGES = [
  {
    id: "primer-cuento",
    nombre: "Primer cuento",
    descripcion: "Terminaste tu primer cuento.",
    icono: "⭐",
    condicion: (progreso) => contarCuentosTerminados(progreso) >= 1
  },
  {
    id: "gran-lector",
    nombre: "Gran lector",
    descripcion: "Respondiste todas las preguntas de un cuento.",
    icono: "📖",
    condicion: (progreso) => algunCuentoConQuizPerfecto(progreso)
  },
  {
    id: "tres-cuentos",
    nombre: "3 cuentos terminados",
    descripcion: "¡Ya llevás tres cuentos completos!",
    icono: "🌟",
    condicion: (progreso) => contarCuentosTerminados(progreso) >= 3
  },
  {
    id: "cinco-cuentos",
    nombre: "5 cuentos terminados",
    descripcion: "¡Cinco cuentos! Sos una lectora increíble.",
    icono: "🏆",
    condicion: (progreso) => contarCuentosTerminados(progreso) >= 5
  }
];

function contarCuentosTerminados(progreso) {
  return Object.values(progreso.cuentos || {}).filter((c) => c.completado).length;
}

function algunCuentoConQuizPerfecto(progreso) {
  return Object.values(progreso.cuentos || {}).some(
    (c) => c.quizRespondido && c.quizCorrectas === (c.quizTotal || 3)
  );
}
