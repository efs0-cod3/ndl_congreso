// Dashboard de leads. Nunca habla con Supabase directamente: todo pasa por
// /api/leads, que es quien tiene la llave de lectura en el servidor.
const CLAVE_KEY = "ndl_dashboard_clave_v1";

const login = document.getElementById("login");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const loginBtn = document.getElementById("loginBtn");
const panel = document.getElementById("panel");
const lista = document.getElementById("lista");
const vacio = document.getElementById("vacio");
const panelError = document.getElementById("panelError");
const buscador = document.getElementById("buscador");

let leads = [];
let filtro = "todos";

function getClave() {
  try { return sessionStorage.getItem(CLAVE_KEY) || localStorage.getItem(CLAVE_KEY) || ""; }
  catch (e) { return ""; }
}
function setClave(valor) {
  try { localStorage.setItem(CLAVE_KEY, valor); } catch (e) {}
}
function borrarClave() {
  try { localStorage.removeItem(CLAVE_KEY); sessionStorage.removeItem(CLAVE_KEY); } catch (e) {}
}

async function pedir(opciones = {}) {
  const respuesta = await fetch("/api/leads", {
    ...opciones,
    headers: { "Content-Type": "application/json", "x-clave": getClave(), ...(opciones.headers || {}) },
  });
  if (respuesta.status === 401) {
    const error = new Error("Clave incorrecta");
    error.noAutorizado = true;
    throw error;
  }
  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => ({}));
    throw new Error(cuerpo.error || "Error " + respuesta.status);
  }
  return respuesta.json();
}

/* ---------- formato ---------- */

function fecha(iso) {
  const d = new Date(iso);
  return d.toLocaleString("es-DO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// 8094045609 -> 18094045609, para que wa.me abra el chat directo.
function whatsapp(telefono) {
  const digitos = String(telefono || "").replace(/\D/g, "");
  if (digitos.length === 10 && /^(809|829|849)/.test(digitos)) return "1" + digitos;
  if (digitos.length === 11 && digitos.startsWith("1")) return digitos;
  return digitos;
}

function escapar(texto) {
  return String(texto == null ? "" : texto)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* ---------- render ---------- */

function visibles() {
  const q = buscador.value.trim().toLowerCase();
  return leads.filter(function (lead) {
    if (filtro === "pendientes" && lead.contactado) return false;
    if (filtro === "nfc" && lead.fuente !== "nfc") return false;
    if (filtro === "qr" && lead.fuente !== "qr") return false;
    if (!q) return true;
    return [lead.nombre, lead.clinica_consultorio, lead.ciudad, lead.telefono]
      .some(function (campo) { return String(campo || "").toLowerCase().includes(q); });
  });
}

function pintarStats() {
  document.getElementById("statTotal").textContent = leads.length;
  document.getElementById("statPendientes").textContent = leads.filter(function (l) { return !l.contactado; }).length;
  document.getElementById("statNfc").textContent = leads.filter(function (l) { return l.fuente === "nfc"; }).length;
  document.getElementById("statQr").textContent = leads.filter(function (l) { return l.fuente === "qr"; }).length;
  document.getElementById("actualizado").textContent =
    "Actualizado " + new Date().toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });
}

function pintarLista() {
  const filas = visibles();
  vacio.hidden = filas.length > 0;
  lista.innerHTML = filas.map(function (lead) {
    const tipos = (lead.tipos_trabajo || []).map(function (t) {
      return '<span class="tipo">' + escapar(t) + "</span>";
    }).join("");
    return (
      '<article class="lead' + (lead.contactado ? " contactado" : "") + '" data-id="' + escapar(lead.id) + '">' +
        '<div class="lead-top">' +
          '<div>' +
            '<b class="lead-nombre">' + escapar(lead.nombre) + "</b>" +
            '<span class="lead-clinica">' + escapar(lead.clinica_consultorio || "—") + "</span>" +
          "</div>" +
          '<span class="fuente ' + escapar(lead.fuente) + '">' + escapar((lead.fuente || "").toUpperCase()) + "</span>" +
        "</div>" +
        '<div class="lead-meta">' + escapar(lead.ciudad || "—") + " · " + escapar(fecha(lead.created_at)) +
          (lead.email ? " · " + escapar(lead.email) : "") + "</div>" +
        (tipos ? '<div class="tipos">' + tipos + "</div>" : "") +
        '<div class="lead-acciones">' +
          '<a class="btn-wa" href="https://wa.me/' + escapar(whatsapp(lead.telefono)) + '" target="_blank" rel="noopener noreferrer">WhatsApp ' + escapar(lead.telefono) + "</a>" +
          '<button type="button" class="btn-check" data-accion="contactar">' +
            (lead.contactado ? "✓ Contactado" : "Marcar contactado") +
          "</button>" +
        "</div>" +
      "</article>"
    );
  }).join("");
}

function pintar() {
  pintarStats();
  pintarLista();
}

/* ---------- datos ---------- */

async function cargar() {
  try {
    panelError.hidden = true;
    const datos = await pedir();
    leads = datos.leads || [];
    pintar();
  } catch (error) {
    if (error.noAutorizado) return mostrarLogin("La clave dejó de ser válida.");
    panelError.textContent = error.message;
    panelError.hidden = false;
  }
}

async function alternarContactado(id, boton) {
  const lead = leads.find(function (l) { return l.id === id; });
  if (!lead) return;
  const nuevo = !lead.contactado;
  boton.disabled = true;
  try {
    await pedir({ method: "PATCH", body: JSON.stringify({ id: id, contactado: nuevo }) });
    lead.contactado = nuevo;
    lead.contactado_at = nuevo ? new Date().toISOString() : null;
    pintar();
  } catch (error) {
    if (error.noAutorizado) return mostrarLogin("La clave dejó de ser válida.");
    panelError.textContent = "No se pudo guardar el cambio: " + error.message;
    panelError.hidden = false;
    boton.disabled = false;
  }
}

function exportarCSV() {
  const columnas = ["nombre", "clinica_consultorio", "telefono", "ciudad", "email", "tipos_trabajo", "fuente", "contactado", "created_at"];
  const escaparCampo = function (valor) {
    if (Array.isArray(valor)) valor = valor.join(" / ");
    return '"' + String(valor == null ? "" : valor).replace(/"/g, '""') + '"';
  };
  const filas = visibles().map(function (lead) {
    return columnas.map(function (c) { return escaparCampo(lead[c]); }).join(",");
  });
  // BOM para que Excel abra bien los acentos.
  const csv = "﻿" + columnas.join(",") + "\n" + filas.join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "leads-congreso-" + new Date().toISOString().slice(0, 10) + ".csv";
  enlace.click();
  URL.revokeObjectURL(url);
}

/* ---------- pantallas ---------- */

function mostrarLogin(mensaje) {
  borrarClave();
  panel.hidden = true;
  login.hidden = false;
  loginError.textContent = mensaje || "";
  loginBtn.disabled = false;
  loginBtn.textContent = "Entrar";
}

function mostrarPanel() {
  login.hidden = true;
  panel.hidden = false;
  cargar();
}

/* ---------- eventos ---------- */

loginForm.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  loginError.textContent = "";
  loginBtn.disabled = true;
  loginBtn.textContent = "Entrando…";
  setClave(document.getElementById("clave").value);
  try {
    await pedir();
    mostrarPanel();
  } catch (error) {
    mostrarLogin(error.noAutorizado ? "Clave incorrecta." : error.message);
  }
});

document.getElementById("salirBtn").addEventListener("click", function () {
  mostrarLogin("");
});
document.getElementById("recargarBtn").addEventListener("click", cargar);
document.getElementById("csvBtn").addEventListener("click", exportarCSV);
buscador.addEventListener("input", pintarLista);

document.getElementById("filtros").addEventListener("click", function (evento) {
  const chip = evento.target.closest(".chip");
  if (!chip) return;
  filtro = chip.dataset.filtro;
  document.querySelectorAll("#filtros .chip").forEach(function (c) {
    c.classList.toggle("activo", c === chip);
  });
  pintarLista();
});

lista.addEventListener("click", function (evento) {
  const boton = evento.target.closest('[data-accion="contactar"]');
  if (!boton) return;
  alternarContactado(boton.closest(".lead").dataset.id, boton);
});

// Si ya entró antes en este teléfono, no vuelve a pedir la clave.
if (getClave()) mostrarPanel();
