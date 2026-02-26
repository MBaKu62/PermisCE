// ------------------ Onglets principaux ------------------
document.querySelectorAll('.onglet').forEach(link => {
  link.addEventListener('click', function(e){
    e.preventDefault();
    const target = this.getAttribute('href').substring(1);

    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    document.getElementById(target).classList.add('active');

    document.querySelectorAll('.onglet').forEach(o => o.classList.remove('actif'));
    this.classList.add('actif');
  });
});

// ------------------ Fiches / thèmes ------------------
function toggleFiche(elem) {
  const content = elem.querySelector('.fiche-content');
  if (!content) return;

  // fermer tous les autres thèmes ouverts dans le même onglet
  elem.parentNode.querySelectorAll('.fiche-content').forEach(fc => {
    if (fc !== content) fc.classList.remove('active');
  });

  content.classList.toggle('active');

  // mettre à jour hauteur parent
  const tab = elem.closest('.tab-content');
  if (tab) tab.style.height = 'auto';
}

// ------------------ Questions / réponses (fiche écrite) ------------------
function toggleAnswer(elem) {
  const answer = elem.querySelector('.answer');
  if (!answer) return;

  // fermer les autres réponses dans le même container
  const parent = elem.parentNode;
  parent.querySelectorAll('.answer').forEach(a => {
    if (a !== answer) a.classList.remove('active');
  });

  answer.classList.toggle('active');

  // mise à jour hauteur parent
  const tab = elem.closest('.tab-content');
  if (tab) tab.style.height = 'auto';
}

// ------------------ MMA / Calcul CU ------------------
document.addEventListener('DOMContentLoaded', function() {

  function toNumber(value) {
    const n = parseFloat(value);
    return isNaN(n) ? null : n;
  }

  function calcCU(pv, ptac) {
    if (pv === null || ptac === null) return null;
    return ptac - pv;
  }

  // --- Véhicule isolé ---
  const pvVeh    = document.getElementById('pvVeh');
  const ptacVeh  = document.getElementById('ptacVeh');
  const resCUVeh = document.getElementById('resCUVeh');

  document.getElementById('btnCalcCUVeh').addEventListener('click', function() {
    const pv   = toNumber(pvVeh.value);
    const ptac = toNumber(ptacVeh.value);
    if (pv === null || ptac === null) {
      resCUVeh.textContent = "Renseigne PV et PTAC du véhicule.";
      return;
    }
    const cu = calcCU(pv, ptac);
    resCUVeh.textContent = cu < 0
      ? `Incohérent : PV (${pv} kg) > PTAC (${ptac} kg).`
      : `Charge utile théorique du véhicule : ${cu.toFixed(0)} kg.`;
  });

  // --- Véhicule articulé ---
  const pvRem    = document.getElementById('pvRem');
  const ptacRem  = document.getElementById('ptacRem');
  const resCURem = document.getElementById('resCURem');

  document.getElementById('btnCalcCURem').addEventListener('click', function() {
    const pv   = toNumber(pvRem.value);
    const ptac = toNumber(ptacRem.value);
    if (pv === null || ptac === null) {
      resCURem.textContent = "Renseigne PV et PTAC de la remorque / semi.";
      return;
    }
    const cu = calcCU(pv, ptac);
    resCURem.textContent = cu < 0
      ? `Incohérent : PV (${pv} kg) > PTAC (${ptac} kg).`
      : `Charge utile théorique : ${cu.toFixed(0)} kg.`;
  });

  // --- Train routier ---
  const ptacCamion = document.getElementById('ptacCamion');
  const ptacRemCR  = document.getElementById('ptacRemCR');
  const ptraCR     = document.getElementById('ptraCR');
  const resCR      = document.getElementById('resCR');

  document.getElementById('btnCheckCR').addEventListener('click', function() {
    const ptCamion = toNumber(ptacCamion.value);
    const ptRem    = toNumber(ptacRemCR.value);
    const ptra     = toNumber(ptraCR.value);
    if (ptCamion === null || ptRem === null || ptra === null) {
      resCR.textContent = "Renseigne PTAC camion, PTAC remorque et PTRA.";
      return;
    }
    const somme = ptCamion + ptRem;
    resCR.textContent = `Somme des PTAC (camion + remorque) : ${somme.toFixed(0)} kg. ` +
                        (somme > ptra ? `ATTENTION : dépasse le PTRA (${ptra.toFixed(0)} kg).`
                                      : `OK : reste dans la limite du PTRA (${ptra.toFixed(0)} kg).`);
  });

  // --- Tracteur + semi ---
  const pvTract  = document.getElementById('pvTract');
  const ptacSemi = document.getElementById('ptacSemi');
  const ptraArt  = document.getElementById('ptraArt');
  const resArt   = document.getElementById('resArt');

  document.getElementById('btnCheckArticule').addEventListener('click', function() {
    const pvT    = toNumber(pvTract.value);
    const ptSemi = toNumber(ptacSemi.value);
    const ptra   = toNumber(ptraArt.value);
    if (pvT === null || ptSemi === null || ptra === null) {
      resArt.textContent = "Renseigne PV tracteur, PTAC semi et PTRA.";
      return;
    }
    const somme = pvT + ptSemi;
    resArt.textContent = `PV tracteur + PTAC semi : ${somme.toFixed(0)} kg. ` +
                         (somme > ptra ? `ATTENTION : dépasse le PTRA (${ptra.toFixed(0)} kg).`
                                       : `OK : reste dans la limite du PTRA (${ptra.toFixed(0)} kg).`);
  });

  // ------------------ Sous-onglets fiches écrites ------------------
  document.querySelectorAll('#ficheecrite .sous-onglet').forEach(link => {
    link.addEventListener('click', function(e){
      e.preventDefault();
      const target = this.getAttribute('href').substring(1);

      // fermer tous les sous-onglets
      document.querySelectorAll('#ficheecrite .sous-tab-content').forEach(tc => {
        tc.classList.remove('active');
      });

      document.getElementById(target).classList.add('active');

      document.querySelectorAll('#ficheecrite .sous-onglet').forEach(o => o.classList.remove('actif'));
      this.classList.add('actif');

      // mise à jour hauteur du conteneur
      const parentTab = document.getElementById('ficheecrite').closest('.tab-content');
      if (parentTab) parentTab.style.height = 'auto';
    });
  });
});