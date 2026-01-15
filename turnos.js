const API_URL = "https://torre-api.vitoreduardo03.workers.dev";

function buscarTurnos() {
  const telefone = document.getElementById("telefone").value.trim();
  const lista = document.getElementById("lista-turnos");
  const msg = document.getElementById("mensagem");

  lista.innerHTML = "";
  msg.textContent = "";

  if (!telefone) {
    msg.textContent = "Informe seu telefone.";
    msg.style.color = "red";
    return;
  }

  msg.textContent = "Buscando seus turnos...";
  msg.style.color = "black";

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "meus_turnos",
      telefone
    })
  })
    .then(res => res.json())

    .then(data => {
    const listaTurnos =
    data?.mensagem?.mensagem;

  if (!Array.isArray(listaTurnos)) {
    msg.textContent = "Nenhum turno encontrado.";
    msg.style.color = "red";
    return;
  }

  if (listaTurnos.length === 0) {
    msg.textContent = "Nenhum turno encontrado para este telefone.";
    msg.style.color = "red";
    return;
  }

  msg.textContent = "Turnos encontrados:";
  msg.style.color = "green";

  listaTurnos.forEach(turno => {
    const card = document.createElement("div");
    card.className = "turno-card indisponivel";

    card.innerHTML = `
      <div class="turno-data">${turno.data}</div>

      <div class="turno-numero">
        ${turno.turno_id}
      </div>

      <div class="turno-hora">
        ${turno.hora_inicio} – ${turno.hora_fim}
      </div>

      <div class="turno-periodo">
        ${turno.funcao.toUpperCase()}
      </div>

      <div class="turno-status bloqueado">
        CONFIRMADO
      </div>
        `;

        lista.appendChild(card);
        });
    })

    .catch(err => {
      console.error(err);
      msg.textContent = "Erro ao buscar turnos.";
      msg.style.color = "red";
    });
}
