const API_URL = "https://torre-api.vitoreduardo03.workers.dev";

/* =======================================================
   ESTADO GLOBAL
======================================================= */
let modoMultiplo = false;
let turnoSelecionado = null;
let cardSelecionado = null;
let turnosSelecionados = [];
let funcaoAtual = null;
let intervaloAutoUpdate = null;
let travaEnvio = {};

/* =======================================================
   TOGGLE MODO MÚLTIPLO
======================================================= */
function alternarModoMultiplo(checkbox) {
  modoMultiplo = checkbox.checked;

  turnoSelecionado = null;
  cardSelecionado = null;
  turnosSelecionados = [];

  document.querySelectorAll(".turno-card").forEach(card => {
    card.classList.remove("selecionado");
    card.querySelector(".btn-inscrever-card")?.remove();
  });

  document
    .getElementById("barra-multipla")
    .classList.toggle("hidden", !modoMultiplo);
}

/* =======================================================
   CARREGAR TURNOS
======================================================= */
function carregarTurnos() {
  const funcao = document.getElementById("funcao").value;
  const secao = document.getElementById("secao-turnos");
  const grade = document.getElementById("grade-turnos");

  secao.classList.add("hidden");
  grade.innerHTML = "";
  turnoSelecionado = null;
  cardSelecionado = null;
  turnosSelecionados = [];

  if (!funcao) return;

  funcaoAtual = funcao;
  secao.classList.remove("hidden");
  grade.innerHTML = "<p>Carregando turnos...</p>";

  fetch(`${API_URL}/?action=turnos&funcao=${encodeURIComponent(funcao)}`)
    .then(res => res.json())
    .then(data => {
      grade.innerHTML = "";

      if (!Array.isArray(data?.mensagem)) {
        grade.innerHTML = "<p>Nenhum turno disponível</p>";
        return;
      }

      data.mensagem.forEach(turno => {
        const card = document.createElement("div");
        card.className = "turno-card";
        card.dataset.turnoId = turno.turno_id;

        card.innerHTML = gerarConteudoCard(turno, turno.numero_turno);

        const especial = turno.tipo === "abertura" || turno.tipo === "culto" || turno.tipo === "turno_kids";
        const disponivel = !especial && turno.disponivel_para_funcao === true;

        if (disponivel) {
          card.addEventListener("click", () => {
            if (modoMultiplo) toggleTurnoMultiplo(card, turno.turno_id);
            else selecionarTurnoUnico(card, turno.turno_id);
          });
        } else {
          card.classList.add("indisponivel");
        }

        grade.appendChild(card);
      });

      iniciarAutoUpdate();
    });
}

/* =======================================================
   FUNÇÃO ÚNICA PARA RENDERIZAR INSCRITOS  ✅
======================================================= */
function renderizarInscritos(inscritos = []) {
  if (!inscritos.length) {
    return `<div class="inscrito vazio">Nenhum inscrito</div>`;
  }

  return inscritos
    .map(p => {
      let funcaoFormatada = p.funcao
        .replace(/_/g, " ")
        .toLowerCase();

      // 🔥 correções de acentuação (frontend only)
      const mapaAcentos = {
        "violao": "violão",
        "lider musica": "líder de música",
        "lider oracao": "líder de oração",
        "cajon": "cajón"
      };

      funcaoFormatada = mapaAcentos[funcaoFormatada] ?? funcaoFormatada;

      return `
        <div class="inscrito">
          <strong>${p.nome}</strong>
          <span class="funcao">– ${funcaoFormatada}</span>
        </div>
      `;
    })
    .join("");
}


/* =======================================================
   CARD HTML
======================================================= */
function gerarConteudoCard(turno, numero) {
  const especial = turno.tipo === "abertura" || turno.tipo === "culto" || turno.tipo === "turno_kids";

  const titulo =
    turno.tipo === "abertura"
      ? "Abertura"
      : turno.tipo === "culto"
      ? "Culto"
      : turno.tipo === "turno_kids"
      ? "Turno Kids"
      : `Turno ${numero}`;

  const inscritosHTML = !especial
    ? `<div class="turno-inscritos">
        ${renderizarInscritos(turno.inscritos)}
       </div>`
    : "";

  const status = especial || !turno.disponivel_para_funcao
    ? ["Indisponível", "bloqueado"]
    : ["Disponível", "ok"];

  return `
    <div class="turno-data">${formatarData(turno.data)}</div>
    <div class="turno-numero">${titulo}</div>
    <div class="turno-hora">${turno.hora_inicio} – ${turno.hora_fim}</div>
    <div class="turno-periodo">${turno.periodo.toUpperCase()}</div>
    ${inscritosHTML}
    <div class="turno-status ${status[1]}">${status[0]}</div>
  `;
}

/* =======================================================
   AUTO UPDATE — AGORA CONSISTENTE
======================================================= */
function iniciarAutoUpdate() {
  clearInterval(intervaloAutoUpdate);

  intervaloAutoUpdate = setInterval(() => {
    if (!funcaoAtual) return;

    fetch(`${API_URL}/?action=turnos&funcao=${encodeURIComponent(funcaoAtual)}`)
      .then(res => res.json())
      .then(data => {
        data?.mensagem?.forEach(turno => {
          const card = document.querySelector(
            `[data-turno-id="${turno.turno_id}"]`
          );
          if (!card) return;

          const especial = turno.tipo === "abertura" || turno.tipo === "culto" || turno.tipo === "turno_kids";
          const disponivel = !especial && turno.disponivel_para_funcao === true;

          const statusDiv = card.querySelector(".turno-status");
          const inscritosDiv = card.querySelector(".turno-inscritos");

          statusDiv.textContent = disponivel ? "Disponível" : "Indisponível";
          statusDiv.className = `turno-status ${
            disponivel ? "ok" : "bloqueado"
          }`;

          card.classList.toggle("indisponivel", !disponivel);

          if (!disponivel) {
            card.querySelector(".btn-inscrever-card")?.remove();
            card.classList.remove("selecionado");
          }

          if (inscritosDiv && !especial) {
            inscritosDiv.innerHTML = renderizarInscritos(turno.inscritos);
          }
        });
      });
  }, 4000);
}

/* =======================================================
   SELEÇÃO
======================================================= */
function selecionarTurnoUnico(card, turnoId) {
  cardSelecionado?.classList.remove("selecionado");
  cardSelecionado?.querySelector(".btn-inscrever-card")?.remove();

  card.classList.add("selecionado");
  cardSelecionado = card;
  turnoSelecionado = turnoId;

  card.appendChild(criarBotaoInscricao(turnoId));
}

/* =======================================================
   BOTÃO COM FEEDBACK VISUAL
======================================================= */
function criarBotaoInscricao(turnoId) {
  const btn = document.createElement("button");
  btn.className = "btn-inscrever-card";
  btn.textContent = "Enviar inscrição";

  btn.onclick = e => {
    e.stopPropagation();
    enviarInscricao(turnoId, btn);
  };

  return btn;
}

function enviarInscricao(turnoId, btn) {
  if (travaEnvio[turnoId]) return;
  travaEnvio[turnoId] = true;

  const msg = document.getElementById("mensagem");

  btn.textContent = "Inscrevendo...";
  btn.disabled = true;

  const payload = {
    nome: nome.value,
    telefone: telefone.value,
    funcao: funcao.value,
    turno_id: turnoId
  };

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(r => r.json())
    .then(res => {
      if (res.sucesso) {
        btn.textContent = "Inscrito ✓";
        btn.style.background = "#2ecc71";

        // 🔥 nova mensagem visual
        msg.textContent = "Inscrição confirmada!";
        msg.style.color = "green";
      } else {
        btn.textContent = res.mensagem;
        btn.style.background = "#c0392b";

        msg.textContent = res.mensagem;
        msg.style.color = "red";
      }
    })
    .finally(() => {
      travaEnvio[turnoId] = false;
    });
}


/* =======================================================
   UTIL
======================================================= */
function formatarData(d) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}`;
}

/* =======================================================
   MODO MÚLTIPLO — SELECIONAR TURNOS
======================================================= */
function toggleTurnoMultiplo(card, turnoId) {
  const index = turnosSelecionados.indexOf(turnoId);

  if (index === -1) {
    // adiciona
    turnosSelecionados.push(turnoId);
    card.classList.add("selecionado");
  } else {
    // remove
    turnosSelecionados.splice(index, 1);
    card.classList.remove("selecionado");
  }
}

/* =======================================================
   ENVIO MÚLTIPLO DE INSCRIÇÕES
======================================================= */
function enviarInscricoesMultiplas() {
  if (!turnosSelecionados.length) {
    alert("Selecione pelo menos um turno.");
    return;
  }

  const nomeVal = nome.value;
  const telefoneVal = telefone.value;
  const funcaoVal = funcao.value;

  if (!nomeVal || !telefoneVal || !funcaoVal) {
    alert("Preencha nome, telefone e função.");
    return;
  }

  const btn = document.getElementById("btnEnviarMultiplo");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Enviando...";
  }

  const requests = turnosSelecionados.map(turnoId =>
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: nomeVal,
        telefone: telefoneVal,
        funcao: funcaoVal,
        turno_id: turnoId
      })
    }).then(r => r.json())
  );

  Promise.all(requests)
    .then(respostas => {
      const falhou = respostas.find(r => !r.sucesso);
      if (falhou) {
        alert(falhou.mensagem);
      } else {
        alert("Inscrições realizadas com sucesso!");
        turnosSelecionados = [];
        document
          .querySelectorAll(".turno-card.selecionado")
          .forEach(c => c.classList.remove("selecionado"));
      }
    })
    .finally(() => {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Enviar inscrições";
      }
    });
}
