import { SUPABASE_URL, SUPABASE_ANON_KEY, TABLE } from "./config.js";

var PENDING_KEY = "ndl_leads_pending_v1";

var params = new URLSearchParams(window.location.search);
var fuente = (params.get("src") || params.get("fuente") || "nfc").toLowerCase();
var srcLabels = { nfc: "NFC", qr: "QR", landing: "LINK" };
document.getElementById("srcBadge").textContent = srcLabels[fuente] || fuente.toUpperCase();

function getPending(){
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]"); }
  catch(e){ return []; }
}
function setPending(arr){
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(arr)); } catch(e){}
}

function insertLead(payload){
  return fetch(SUPABASE_URL + "/rest/v1/" + TABLE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": "Bearer " + SUPABASE_ANON_KEY,
      "Prefer": "return=minimal"
    },
    body: JSON.stringify(payload)
  }).then(function(res){
    if (!res.ok) throw new Error("HTTP " + res.status);
    return true;
  });
}

// Try to flush any leads saved locally from a previous failed attempt.
function flushPending(){
  var pending = getPending();
  if (!pending.length) return;
  var remaining = [];
  var chain = Promise.resolve();
  pending.forEach(function(item){
    chain = chain.then(function(){
      return insertLead(item).catch(function(){ remaining.push(item); });
    });
  });
  chain.then(function(){ setPending(remaining); });
}
flushPending();

var form = document.getElementById("leadForm");
var submitBtn = document.getElementById("submitBtn");
var errorMsg = document.getElementById("errorMsg");

form.addEventListener("submit", function(e){
  e.preventDefault();
  errorMsg.classList.remove("show");

  var nombre = document.getElementById("nombre").value.trim();
  var clinica = document.getElementById("clinica").value.trim();
  var whatsapp = document.getElementById("whatsapp").value.trim();
  var ciudad = document.getElementById("ciudad").value.trim();
  var email = document.getElementById("email").value.trim();
  var tipos = Array.prototype.slice.call(
    document.querySelectorAll('#tiposTrabajo input:checked')
  ).map(function(el){ return el.value; });
  var consent = document.getElementById("consent").checked;

  if (!nombre || !clinica || !whatsapp || !ciudad){
    errorMsg.textContent = "Completa nombre, clínica, WhatsApp y ciudad para continuar.";
    errorMsg.classList.add("show");
    return;
  }
  if (!consent){
    errorMsg.textContent = "Debes aceptar recibir información por WhatsApp/correo para activar tu beneficio.";
    errorMsg.classList.add("show");
    return;
  }

  var payload = {
    nombre: nombre,
    clinica_consultorio: clinica,
    telefono: whatsapp,
    ciudad: ciudad,
    email: email || null,
    tipos_trabajo: tipos,
    fuente: fuente,
    acepta_contacto: consent
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando…";

  insertLead(payload).then(function(){
    document.getElementById("successName").textContent = nombre.split(" ")[0];
    document.getElementById("formCard") || form.classList.add("hide");
    form.style.display = "none";
    document.getElementById("success").classList.add("show");
  }).catch(function(){
    var pending = getPending();
    pending.push(payload);
    setPending(pending);
    errorMsg.textContent = "No pudimos enviar tu registro por conexión. Tus datos quedaron guardados en este teléfono e intentaremos de nuevo automáticamente.";
    errorMsg.classList.add("show");
    submitBtn.disabled = false;
    submitBtn.textContent = "Activar mi beneficio";
  });
});
