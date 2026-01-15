const API_URL = "https://torre-api.vitoreduardo03.workers.dev";

/* ============================
   ESTADO GLOBAL
============================ */
let modoMultiplo = false;
let cardSelecionado = null;
let turnoSelecionado = null;
let turnosSelecionados = [];

/* ============================
   RESET TOTAL
============================ */
function resetSelecao() {
  cardSelecionado = null;
  turnoSelecionado = null;
  turnosSelecionados = [];

  document.querySelectorAll(".turno-card").forEach(card => {
    card.classList.remove("selecionado");
    const btn = card.querySelector(".btn-inscrever-card");
    if (btn) btn.remove();
  });
}

/* ============================
   TOGGLE MODO MÚLTIPLO
============================ */
function alternarModoMultiplo(checkbox) {
  modoMultiplo = checkbox.checked;

  resetSelecao();

  const barra = document.getElementById("barra-multipla");

  if (modoMultiplo) {
    barra.classList.remove("hidden");
  } else {
    barra.classList.add("hidden");
  }
}

/* ============================
   CARREGAR TURNOS
============================ */
function carregarTurnos() {
  const funcao = document.getElementById("funcao").value;
  const secao = document.getElementById("secao-turnos");
  const grade = document.getElementById("grade-turnos");

  resetSelecao();
  grade.innerHTML = "";

  if (!funcao) {
    secao.classList.add("hidden");
    return;
  }

  secao.classList.remove("hidden");
  grade.innerHTML = "<p>Carregando turnos...</p>";

  fetch(`${API_URL}/?action=turnos&funcao=${encodeURIComponent(funcao)}`)
    .then(res => res.json())
    .then(data => {
      grade.innerHTML = "";

      if (!data?.sucesso || !Array.isArray(data.mensagem)) {
        grade.innerHTML = "<p>Nenhum turno disponível</p>";
        return;
      }

      let contador = 1;

      data.mensagem.forEach(turno => {
        const card = document.createElement("div");
        card.className = "turno-card";

        const disponivel =
          turno.disponivel_para_funcao === undefined
            ? true
            : turno.disponivel_para_funcao === true;

        if (!disponivel) card.classList.add("indisponivel");

        card.innerHTML = `
          <div class="turno-data">${formatarData(turno.data)}</div>
          <div class="turno-numero">Turno ${contador}</div>
          <div class="turno-hora">
            ${formatarHora(turno.hora_inicio)} – ${formatarHora(turno.hora_fim)}
          </div>
          <div class="turno-periodo">${turno.periodo.toUpperCase()}</div>
          <div class="turno-status ${disponivel ? "ok" : "bloqueado"}">
            ${disponivel ? "Disponível" : "Indisponível"}
          </div>
        `;

        if (disponivel) {
          card.addEventListener("click", () => {
            if (modoMultiplo) {
              toggleTurnoMultiplo(card, turno.turno_id);
            } else {
              selecionarTurnoUnico(card, turno.turno_id);
            }
          });
        }

        grade.appendChild(card);
        contador++;
      });
    });
}

/* ============================
   MODO ÚNICO
============================ */
function selecionarTurnoUnico(card, turnoId) {
  if (cardSelecionado && cardSelecionado !== card) {
    cardSelecionado.classList.remove("selecionado");
    const btnOld = cardSelecionado.querySelector(".btn-inscrever-card");
    if (btnOld) btnOld.remove();
  }

  if (cardSelecionado === card) return;

  cardSelecionado = card;
  turnoSelecionado = turnoId;
  card.classList.add("selecionado");

  const btn = document.createElement("button");
  btn.className = "btn-inscrever-card";
  btn.textContent = "Enviar inscrição";

  btn.onclick = e => {
    e.stopPropagation();
    enviarInscricao(turnoId);
  };

  card.appendChild(btn);
}

/* ============================
   MODO MÚLTIPLO
============================ */
function toggleTurnoMultiplo(card, turnoId) {
  const idx = turnosSelecionados.indexOf(turnoId);

  if (idx === -1) {
    turnosSelecionados.push(turnoId);
    card.classList.add("selecionado");
  } else {
    turnosSelecionados.splice(idx, 1);
    card.classList.remove("selecionado");
  }
}

/* ============================
   ENVIO MÚLTIPLO
============================ */
function enviarMultiplos() {
  const msg = document.getElementById("mensagem");

  if (!turnosSelecionados.length) {
    msg.textContent = "Selecione pelo menos um turno.";
    msg.style.color = "red";
    return;
  }

  const nome = document.getElementById("nome").value;
  const telefone = document.getElementById("telefone").value;
  const funcao = document.getElementById("funcao").value;

  msg.textContent = "Enviando inscrições...";
  msg.style.color = "black";

  Promise.all(
    turnosSelecionados.map(id =>
      fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone, funcao, turno_id: id })
      })
    )
  ).then(() => {
    msg.textContent = "Inscrições realizadas com sucesso!";
    msg.style.color = "green";
    carregarTurnos();
  });
}

/* ============================
   ENVIO ÚNICO
============================ */
function enviarInscricao(turnoId) {
  const msg = document.getElementById("mensagem");
  const nome = document.getElementById("nome").value;
  const telefone = document.getElementById("telefone").value;
  const funcao = document.getElementById("funcao").value;

  if (!nome || !telefone || !funcao) {
    msg.textContent = "Preencha todos os campos.";
    msg.style.color = "red";
    return;
  }

  msg.textContent = "Enviando inscrição...";
  msg.style.color = "black";

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, telefone, funcao, turno_id: turnoId })
  })
    .then(res => res.json())
    .then(() => {
      msg.textContent = "Inscrição realizada com sucesso!";
      msg.style.color = "green";
      carregarTurnos();
    });
}

/* ============================
   FORMATADORES
============================ */
function formatarData(dataISO) {
  const [_, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}`;
}

function formatarHora(valor) {
  if (typeof valor === "string") return valor;
  return `${valor.getHours().toString().padStart(2, "0")}:${valor
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}
