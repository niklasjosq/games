/* ============================================================
   PROFILE — wer spielt gerade?

   Jedes Kind legt sich ein Profil an: Name, ein Tier-Bild und eine
   vierstellige PIN. Die PIN ist nur ein kleiner Riegel, damit man
   nicht versehentlich im Profil vom Geschwisterkind landet — sie ist
   KEIN echter Schutz (sie steht im Klartext im Browser).
   ============================================================ */

const AVATARE = ['🦊', '🐼', '🦄', '🐯', '🐸', '🦉', '🐙', '🦖',
                 '🐧', '🦁', '🐨', '🐝', '🦋', '🐬', '🚀', '⚽'];

const PIN_LAENGE = 4;
const NAME_MAX = 12;

/* ---------- Alle Profile lesen und schreiben ---------- */

function ladeProfile() {
  const liste = leseSpeicher('profile', []);
  return Array.isArray(liste) ? liste : [];
}

function speichereProfile(liste) {
  return schreibeSpeicher('profile', liste);
}

function profilNachId(id) {
  return ladeProfile().find(function (p) { return p.id === id; }) || null;
}

/* ---------- Neues Profil anlegen ----------
   Gibt {ok: true, profil} zurück oder {ok: false, fehler: "..."} */

function neuesProfil(name, avatar, pin) {
  name = String(name || '').trim().slice(0, NAME_MAX);
  pin = String(pin || '').trim();

  if (name.length < 2) return { ok: false, fehler: 'Der Name braucht mindestens 2 Buchstaben.' };
  if (!/^\d{4}$/.test(pin)) return { ok: false, fehler: 'Die PIN muss aus 4 Ziffern bestehen.' };

  const liste = ladeProfile();
  const schonDa = liste.some(function (p) {
    return p.name.toLowerCase() === name.toLowerCase();
  });
  if (schonDa) return { ok: false, fehler: 'Diesen Namen gibt es hier schon.' };

  const profil = {
    id: neueId(),
    name: name,
    avatar: avatar || AVATARE[0],
    pin: pin,
    erstellt: new Date().toISOString().slice(0, 10)
  };
  liste.push(profil);
  speichereProfile(liste);
  return { ok: true, profil: profil };
}

function neueId() {
  // Kurz, eindeutig genug für eine Handvoll Kinder auf einem Gerät
  return 'k' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
}

function loescheProfil(id) {
  const liste = ladeProfile().filter(function (p) { return p.id !== id; });
  speichereProfile(liste);
  loescheProfilDaten(id);
  if (leseSpeicher('aktivProfil', null) === id) meldeAb();
}

function setzePin(id, neuePin) {
  if (!/^\d{4}$/.test(String(neuePin))) return false;
  const liste = ladeProfile();
  const profil = liste.find(function (p) { return p.id === id; });
  if (!profil) return false;
  profil.pin = String(neuePin);
  speichereProfile(liste);
  return true;
}

/* ---------- An- und abmelden ---------- */

function pinStimmt(id, pin) {
  const profil = profilNachId(id);
  return !!profil && profil.pin === String(pin);
}

function meldeAn(id, pin) {
  if (!pinStimmt(id, pin)) return false;
  schreibeSpeicher('aktivProfil', id);
  return true;
}

function meldeAb() {
  loescheSpeicher('aktivProfil');
}

/* Das gerade angemeldete Profil (oder null = Gast) */
function aktivesProfil() {
  const id = leseSpeicher('aktivProfil', null);
  if (!id) return null;
  const profil = profilNachId(id);
  if (!profil) {           // Profil wurde gelöscht — dann sind wir Gast
    meldeAb();
    return null;
  }
  return profil;
}
