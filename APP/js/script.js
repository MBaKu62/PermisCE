console.log("script chargé");
function toggleFiche(elem) {
  if (!elem) return;
  var content = elem.querySelector(".fiche-content");
  if (!content) return;

  var parent = elem.parentNode;
  if (parent) {
    var all = parent.querySelectorAll(".fiche-content");
    for (var i = 0; i < all.length; i++) {
      if (all[i] !== content) all[i].classList.remove("active");
    }
  }
  content.classList.toggle("active");
}

document.addEventListener("DOMContentLoaded", function () {
  /* =========================
     Helpers
  ========================= */
  function $(id) {
    return document.getElementById(id);
  }

  function toNumber(value) {
    var n = parseFloat(value);
    return isNaN(n) ? null : n;
  }

  function bindClick(id, handler) {
    var el = $(id);
    if (el) el.addEventListener("click", handler);
  }

  function norm(s) {
    if (s === null || s === undefined) s = "";
    return String(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isMatch(userRaw, expectedRaw) {
    var u = norm(userRaw);
    var e = norm(expectedRaw);
    if (!u || !e) return false;

    // réponses très courtes => exact
    if (u.length <= 4) return u === e;

    // sinon => tolérant (inclusion)
    return e.indexOf(u) !== -1 || u.indexOf(e) !== -1;
  }

  /* =========================
     1) Onglets principaux
     (dans ton HTML les href sont "accueil", "mma", etc.)
  ========================= */
  (function initTabs() {
    var links = document.querySelectorAll(".onglets-menu a.onglet");
    if (!links.length) return;

    function getTargetIdFromHref(href) {
      if (!href) return "";
      if (href.charAt(0) === "#") return href.slice(1);
      return href; // ex: "mma"
    }

    function showTab(id) {
      if (!id) return;

      var tabs = document.querySelectorAll(".tab-content");
      for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove("active");

      var target = $(id);
      if (target) target.classList.add("active");

      for (var j = 0; j < links.length; j++) links[j].classList.remove("actif");
      for (var k = 0; k < links.length; k++) {
        var href = links[k].getAttribute("href") || "";
        if (getTargetIdFromHref(href) === id) {
          links[k].classList.add("actif");
          break;
        }
      }
    }

    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function (e) {
        e.preventDefault();
        var href = this.getAttribute("href") || "";
        showTab(getTargetIdFromHref(href));
      });
    }

    var init = "accueil";
    for (var i = 0; i < links.length; i++) {
      if (links[i].classList.contains("actif")) {
        init = getTargetIdFromHref(links[i].getAttribute("href") || "") || init;
        break;
      }
    }
    showTab(init);
  })();

  /* =========================
     2) MMA — Tous les calculs
  ========================= */
  function calcCU(pv, ptac) {
    if (pv === null || ptac === null) return null;
    return ptac - pv;
  }

  // 2.1 Véhicule isolé (CU)
  bindClick("btnCalcCUVeh", function () {
    var pvVeh = $("pvVeh");
    var ptacVeh = $("ptacVeh");
    var res = $("resCUVeh");
    if (!pvVeh || !ptacVeh || !res) return;

    var pv = toNumber(pvVeh.value);
    var ptac = toNumber(ptacVeh.value);

    if (pv === null || ptac === null) {
      res.textContent = "Renseigne PV et PTAC du véhicule.";
      return;
    }

    var cu = calcCU(pv, ptac);
    res.textContent =
      cu < 0
        ? "Incohérent : PV (" + pv + " kg) > PTAC (" + ptac + " kg)."
        : "Charge utile théorique du véhicule : " + cu.toFixed(0) + " kg.";
  });

  // 2.2 Train routier (PTAC camion + PTAC remorque) vs PTRA
  bindClick("btnCheckCR", function () {
    var ptacCamion = $("ptacCamion");
    var ptacRemCR = $("ptacRemCR");
    var ptraCR = $("ptraCR");
    var res = $("resCR");
    if (!ptacCamion || !ptacRemCR || !ptraCR || !res) return;

    var ptCamion = toNumber(ptacCamion.value);
    var ptRem = toNumber(ptacRemCR.value);
    var ptra = toNumber(ptraCR.value);

    if (ptCamion === null || ptRem === null || ptra === null) {
      res.textContent = "Renseigne PTAC camion, PTAC remorque et PTRA.";
      return;
    }

    var somme = ptCamion + ptRem;
    res.textContent =
      "Somme des PTAC (camion + remorque) : " +
      somme.toFixed(0) +
      " kg. " +
      (somme > ptra
        ? "ATTENTION : dépasse le PTRA (" + ptra.toFixed(0) + " kg)."
        : "OK : reste dans la limite du PTRA (" + ptra.toFixed(0) + " kg).");
  });

  // 2.3 Tracteur + semi (PV tracteur + PTAC semi) vs PTRA
  bindClick("btnCheckArticule", function () {
    var pvTract = $("pvTract");
    var ptacSemi = $("ptacSemi");
    var ptraArt = $("ptraArt");
    var res = $("resArt");
    if (!pvTract || !ptacSemi || !ptraArt || !res) return;

    var pvT = toNumber(pvTract.value);
    var ptSemi = toNumber(ptacSemi.value);
    var ptra = toNumber(ptraArt.value);

    if (pvT === null || ptSemi === null || ptra === null) {
      res.textContent = "Renseigne PV tracteur, PTAC semi et PTRA.";
      return;
    }

    var somme = pvT + ptSemi;
    res.textContent =
      "PV tracteur + PTAC semi : " +
      somme.toFixed(0) +
      " kg. " +
      (somme > ptra
        ? "ATTENTION : dépasse le PTRA (" + ptra.toFixed(0) + " kg)."
        : "OK : reste dans la limite du PTRA (" + ptra.toFixed(0) + " kg).");
  });

  // 2.4 Remorque / semi (CU)
  bindClick("btnCalcCURem", function () {
    var pvRem = $("pvRem");
    var ptacRem = $("ptacRem");
    var res = $("resCURem");
    if (!pvRem || !ptacRem || !res) return;

    var pv = toNumber(pvRem.value);
    var ptac = toNumber(ptacRem.value);

    if (pv === null || ptac === null) {
      res.textContent = "Renseigne PV et Masse max autorisée (PTAC) de la remorque / semi.";
      return;
    }

    var cu = calcCU(pv, ptac);
    res.textContent =
      cu < 0
        ? "Incohérent : PV (" + pv + " kg) > PTAC (" + ptac + " kg)."
        : "Charge utile théorique : " + cu.toFixed(0) + " kg.";
  });

  /* =========================
     3) Fiches écrites — Quiz
     (écris tes questions ici)
  ========================= */
  var FICHES_ECRITES = {
    1: [
      { question: "Les accidents corporels entre un poids lourd et une voiture sont majoritairement des accidents avec des véhicules circulant dans le même sens. Vrai ou Faux ?", reponses: ["Vrai"], image: "" },
      { question: "Le non-respect des limitations de tonnage pour le passage sur les ponts peut-il entraîner une suspension du permis de conduire ?", reponses: ["Oui"], image: "" },
      { question: "La rémunération mensuelle d'un conducteur salarié peut être calculée en fonction de la distance parcourue pendant le mois. Vrai ou Faux ?", reponses: ["Faux"], image: "" },
      { question: "Parmi les types de graissage moteur, il existe le graissage par barbotage. Vrai ou faux ?", reponses: ["vrai"], image: "" },
      { question: "Quelle est la périodicité des visites techniques auxquelles sont soumis les véhicules de transport de marchandises de plus de 3,5 t de PTAC ?", reponses: ["12 mois","1 an"], image: "" },
      { question: "Quel sera le poids maximal d'un ensemble composé de : Porteur PTRA : 44 t et PTAC : 26 t Remorque PTAC : 26 t et Poids à Vide : 7t", reponses: ["44 t"], image: "" },
      { question: "En cas de remorquage occasionnel, quelle est la vitesse maximale autorisée ?", reponses: ["25 km/h"], image: "" },
      { question: "Ce signal interdit-il l'accès aux véhicules de plus de 3,50 m ?", reponses: ["Oui"], image: "images/fiche-ecrite/panneau-hauteur.png" },
      { question: "Vous rentrez chez vous le soir avec le camion de l'entreprise. Le matin, le temps de conduite pour vous rendre au dépôt est-il compté comme du temps de conduite ?", reponses: ["Oui"], image: "" },
      { question: "Comment appelle-t-on le dispositif qui assure le freinage pratiquement simultané de tous les véhicules d'un ensemble ?", reponses: ["Le frein continu","Le frein principal", "Le frein de service"], image: "" }
    ],
    2: [
      { question: "Un chiffre doublé (ex: 33) dans le rectangle du haut de la plaque orange placée à l'arrière d'un camion signifie :'produit de nature à polluer les eaux'. Vrai ou Faux ?", reponses: ["Faux"], image: "" },
      { question: "Des interdictions de circulation peuvent être mises en place pour les poids lourds lors des pics de pollution atmosphérique. Vrai ou faux ?", reponses: ["Vrai"], image: "" },
      { question: "Vous conduisez sans vous arrêter depuis 8 h 40 ce matin. Il est 12 h 40. Êtes‑vous en infraction ?", reponses: ["Non"], image: "" },
      { question: "Une huile multigrade classée SAE 20 W 40 peut‑elle être utilisée uniquement en hiver ?", reponses: ["Non"], image: "" },
      { question: "Suite au contrôle technique périodique, quelle lettre figure sur le certificat d’immatriculation lorsque le véhicule est accepté ?", reponses: ["A","la Lettre A"], image: "" },
      { question: "Est‑il possible d’atteler une remorque de 26 t de PTAC, chargée au maximum, derrière un camion de 19 t de PTAC, chargé au maximum, alors que le PTRA indiqué sur la plaque de poids et surface du camion est de 40 t ?", reponses: ["Non"], image: "" },
      { question: "Vous conduisez un camion de plus de 7,5 t de PTAC. Quand finit l’interdiction de circulation en fin de semaine ?", reponses: ["Dimanche à 22 h","Dimanche à 10 h du soir"], image: "" },
      { question: "Le poids indiqué dans ce signal concerne‑t‑il le poids maximal autorisé que peut supporter l’essieu ?", reponses: ["Non"], image: "images/fiche-ecrite/panneau-essieu.png" },
      { question: "Vous vous arrêtez pour faire le plein de carburant. Sur quel symbole devez‑vous positionner le sélecteur d’activité du chronotachygraphe ?", reponses: ["Autres taches","marteaux"], image: "" },
      { question: "Existe‑t‑il des véhicules équipés de 2 ralentisseurs ?", reponses: ["Oui"], image: "" }
    ],
    3: [
      { question: "Les accidents graves entre un poids lourd sont majoritairement des accidents sans autre usager impliqué. Vrai ou Faux ?", reponses: ["Faux"], image: "" },
      { question: "Vous conduisez votre véhicule personnel avec une alcoolémie de 1 g/l de sang. En cas de de condamnation, votre permis poids lourds peut-il être annulé ?", reponses: ["Oui"], image: "" },
      { question: "En double équipage, en France, vous êtes assis à côté du conducteur depuis 1 h. Pouvez-vous reprendre le volant ?", reponses: ["Oui"], image: "" },
      { question: "Vous chargez du sable dans un véhicule isolé, quelle est la charge maximale autorisée sur l'essieu le plus chargé du groupe d'essieux moteur?", reponses: ["11,5t","11,500 t","11 t 500"], image: "" },
      { question: "Mon véhicule a un poids à vide de 5 tonnes et un PTAC de 12 tonnes. Ce signal me concerne-t-il ?", reponses: ["Oui"], image: "images/fiche-ecrite/70-5,5t.png" },
      { question: "Le contrôle et le remplissage du circuit de refroidissement s'effectuent plutôt moteur chaud ou moteur froid ?", reponses: ["Moteur à froid","A froid"], image: "" },
      { question: "Votre camion, en charge, transporte des denrées périssables, avez-vous le droit de continuer votre trajet le samedi après 22 h?", reponses: ["Oui"], image: "" },
      { question: "Pour effectuer un transport national, pouvez-vous laisser la plaque avec la mention 'TIR' visible à l'arrière de votre véhicule ?", reponses: ["Non"], image: "" },
      { question: "Sauf cas d'urgence, quelle est la durée de conduite maximale journalière autorisée en tenant compte des dérogations possibles ?", reponses: ["10 h","10 heures"], image: "" },
      { question: "En règle générale, à quelle vitesse doit être réglé le limiteur de vitesse d'un tracteur routier neuf ?", reponses: ["90 km/h"], image: "" }
    ],
    4: [
      { question: "Ma remorque a un contour de sécurité arrière rétroréfléchissant de couleur rouge. En panne, je suis obligé de la laisser dételée sur la chaussée. Est-il obligatoire de placer le triangle de présignalisation ?", reponses: ["Oui"], image: "" },
      { question: "Dans une entreprise, le chargement est effectué par un manutentionnaire. Une fois terminé, vous appartient-il d'effectuer le contrôle de l'arrimage avant de démarrer ?", reponses: ["Oui"], image: "" },
      { question: "Au bout de comnien de jours, au maximum, l'entreprise doit-elle 'télécharger' les donnés de votre carte conducteur ?", reponses: ["28","28 jours"], image: "" },
      { question: "Quelle est la longueur maximale autorisée d'un ensemble porte-voitures ?", reponses: ["20,35 m"], image: "" },
      { question: "Comment s'appelle le document qui doit accompagner la marchandise lors de tout transport pour compte d'autrui ?", reponses: ["Lettre de voiture"], image: "" },
      { question: "En règle générale, les véhicules lourds utilisent deux batteries de 12 volts montées en ... ?", reponses: ["Série"], image: "" },
      { question: "Un pont dont la hauteur libre est de 5 m (au plus bas) sera obligatoirement signlé par un panneau de hauteur limitée. Vrai ou faux ?", reponses: ["Faux"], image: "" },
      { question: "Sur cette chausée la hauteur des arbres est suceptible d'être inférieure à 4,30 m. Vrai ou faux ?", reponses: ["Vrai"], image: "images/fiche-ecrite/arbres-inclines.png" },
      { question: "Vous avez fait une coupure de 2 h, quelle sera, au minimum, la durée (non réduite) de la période de repos que vous devez prendre à la fin de votre journée de travail pour être en règle vis-à-vis du repos journalier", reponses: ["11 h","11 heures"], image: "" },
      { question: "Dans un camion neuf, le passager doit-il obligatoirement attacher sa ceinture de sécurité ?", reponses: ["Oui"], image: "" }
    ],
    5: [
      { question: "Le modèle français de constat amiable peut-il être utilisé dans les autres pays de l’Union européenne ?", reponses: ["Oui"], image: "" },
      { question: "En transport public, le destinataire doit-il vérifier l’état apparent de la marchandise ou des colis au moment de la livraison en présence du conducteur ?", reponses: ["Oui"], image: "" },
      { question: "En règle générale , vous est-il possible de modifier les activités enregistrées par le chronotachygraphe sur votre carte ?", reponses: ["Non"], image: "" },
      { question: "Le châssis d’un véhicule lourd est principalement constitué de longerons et de … ?", reponses: ["Traverses"], image: "" },
      { question: "Cette limitation de vitesse peut concerner les véhicules autres que les trains routiers, trains doubles et véhicules articulés ?", reponses: ["Oui"], image: "images/fiche-ecrite/50-km-h-remorque.png" },
      { question: "Est-il possible d’atteler une remorque de 19t de PTAC, chargée au maximum , derrière un camion de 19 t de PTAC , chargé au maximum , alors que le PTRA indiqué sur la plaque de poids et surface du camion est de 40 t ?", reponses: ["Oui"], image: "" },
      { question: "Vous conduisez un ensemble routier neuf de 40 t de PTRA. A quel vitesse êtes-vous limité sur autoroute ?", reponses: ["90 km/h"], image: "" },
      { question: "En transport public , à bord de votre véhicule , vous devez posséder l’original ou une copie conforme de la licence communautaire de transport ?", reponses: ["Une copie conforme"], image: "" },
      { question: "En règle générale quel est la durée minimale normale ( non réduite ) de repos hebdomadaire pour un conducteur de camions ?", reponses: ["45 h","45 heures"], image: "" },
      { question: "Une semi-remorque dételée doit-elle être munie d’un extincteur en état de fonctionner ?", reponses: ["Non"], image: "" }
    ],
    6: [
      { question: "Encas d’accident, les données du chronotachygraphe numérique peuvent-elles servir de preuve dans le tribunal ?", reponses: ["Oui"], image: "" },
      { question: "Au-delà de quel taux de surcharge ( en pourcentage – % ) le camion pourra – t – il être immobilisé, jusqu’au déchargement de l’excédent ?", reponses: ["5","5%","5 pour cent"], image: "" },
      { question: "Si , dans la même journée , vous conduisez un véhicule avec un chronotachygraphe numérique après avoir conduit un véhicule avec un chronotachygraphe à disque , devez-vous conserver le disque avec vous ?", reponses: ["Oui"], image: "" },
      { question: "Certains éléments de la chaîne cinématique nécessite d’être vidangés ou … ?", reponses: ["Graissés"], image: "" },
      { question: "Ce signal concerne uniquement les véhicules affectés au transport de marchandises excèdant 3500 kg de PTAC ?", reponses: ["Non"], image: "images/fiche-ecrite/interdiction-de-tourner-a-gauche-vehicule-marchandise.png" },
      { question: "Je dois conduire un train routier de 32 tonnes de PTRA dont la somme des PTAC est 38 tonnes. Quel doit être le poids maximum du train routier lors d’un pesée sur bascule ?", reponses: ["32 t"], image: "" },
      { question: "Vous conduisez un tracteur solo de 19 tonnes de PTAC et de 38 tonnes de PTRA. A quel vitesse êtes-vous limité sur autoroute ?", reponses: ["90 km/h"], image: "" },
      { question: "La lettre de voiture doit détailler la nature des marchandises transportées . Vrai ou Faux ?", reponses: ["Vrai"], image: "" },
      { question: "Quand le repos journalier est fractionné, quelle doit être la durée minimale totale de ce repos ?", reponses: ["12 h","12 heures"], image: "" },
      { question: "Vous chargez du gravier.Vous voulez connaître la charge maximale autorisée par essieu, vous pouvez la trouver sur la plaque du constructeur. Vrai ou Faux ?", reponses: ["Vrai"], image: "" }
    ],
    7: [
      { question: "Une plaque orange sans aucune inscription, placée à l’arrière d’un camion signifie qu’il s’agit d’un transport de matières dangereuses circulant à vide. Vrai ou Faux ?", reponses: ["Faux"], image: "" },
      { question: "Quelle est la catégorie du permis exigée pour conduire un véhicule de transport en commun articulé comportant 60 places circulant à vide ?", reponses: ["D","le permis D"], image: "" },
      { question: "Quelle est , en heures , la durée maximale autorisée de conduite par période de deux semaines consécutives ?", reponses: ["90 h"], image: "" },
      { question: "Qu’aspire le moteur diesel lors du premier temps appelé « admission » ?", reponses: ["De l’air"], image: "" },
      { question: "Lors de la mise en circulation d’un véhicule de transport de marchandises de plus de 3,5 tonnes , vendu carrossé , quel est le délai maximal autorisé pour le présenter à la première visite technique ?", reponses: ["1 an","12 mois"], image: "" },
      { question: "Quelle est la charge utile d’un véhicule dont le PTAC est de 26 tonnes et le poids à vide de 7 tonnes ?", reponses: ["19 t","19 tonnes"], image: "" },
      { question: "Je conduis un véhicule articulé de 38 tonnes de PTRA pesant 14 tonnes a vide. Pour emprunter une route où une barrière de dégel à 12 tonnes avec mention demi-charge autorisée est en place , quel doit être le poids maximum de mon chargement ?", reponses: ["12 t","12 tonnes"], image: "" },
      { question: "La descente dangereuse annoncée possède un dénivelé de 100 mètres pour chaque kilomètre parcouru ?", reponses: ["Oui"], image: "images/fiche-ecrite/descente-dangereuse.png" },
      { question: "Vous avez interrompu votre conduite pendant 1h15 mn. Ce temps peut-il être pris en compte pour le calcul du temps de repos journalier ?", reponses: ["Non"], image: "" },
      { question: "Sur la plaque constructeur d’un véhicule porteur-remorqueur, on trouve inscrite la longueur maximale de l’ensemble que l’on peut constituer avec ce véhicule. Vrai ou Faux ?", reponses: ["Faux"], image: "" }
    ],
    8: [
      { question: "Un X (ex:X362) inscrit à côté du nombre dans le rectangle du haut de la plaque orange placée à l’arrière d’un camion signifie: « produit ayant une réaction dangereuse avec l’eau ».Vrai ou Faux ?", reponses: ["Vrai"], image: "" },
      { question: "A partir de quel âge la périodicité du contrôle médical obligatoire pour le renouvellement du permis de conduire catégories C ou CE est-elle de 2 ans ?", reponses: ["60 ans"], image: "" },
      { question: "Un premier arrêt de 15 mn sur un parking peut-il être considéré comme une pause ?", reponses: ["Oui"], image: "" },
      { question: "La somme des PTAC d’un train routier est de 45 tonnes et son PTRA est de 40 tonnes. Quel poids réel ne faut-il pas dépasser ?", reponses: ["40 t"], image: "" },
      { question: "Ce signal concerne les véhicules affectés au transport de produits dangereux ou au transport de produits explosifs ?", reponses: ["Produits explosifts","Explosifs"], image: "images/fiche-ecrite/acces-interdit-explosif.png" },
      { question: "Le turbocompresseur a pour fonction de diminuer l’air admis dans les cylindres ?", reponses: ["Non"], image: "" },
      { question: "Vous conduisez un tracteur solo de 19 t de PTAC et de 38 t de PTRA. A quelle vitesse êtes-vous limité sur route unique à sens prioritaire ?", reponses: ["80 km/h"], image: "" },
      { question: "Le transport de pièce de grande longueur qui dépassent d’1 mètre à l’avant du camion entre dans la catégorie des transport exceptionnels. Vrai ou Faux ?", reponses: ["Vrai"], image: "" },
      { question: "Un chauffeur a conduit 20 heures la semaine précédente. Selon la règlementation sociale européenne, combien d’heurs maximum peut-il conduire la semaine en cours ?", reponses: ["56 h","56 heures"], image: "" },
      { question: "L’extincteur prévu pour les semi-remorques peut-être placé sur le tracteur. Vrai ou Faux ?", reponses: ["Vrai"], image: "" }
    ],
    9: [
      { question: "En cas d’accident dans lequel votre véhicule est en cause , les forces de l’ordre peuvent-elles imprimer le ticket qui correspond à la journée en cours ?", reponses: ["Oui"], image: "" },
      { question: "Après l’obtention du permis CE , un conducteur possèdant le permis C et travaillant déjà dans une entreprise de transport doit-il suivre une formation complémentaire avant de conduire un véhicule articulé ?", reponses: ["Non"], image: "" },
      { question: "En double équipage , le temps passé sur la couchette d’un véhicule en circulation , est-il considéré comme repos journalier ?", reponses: ["Non"], image: "" },
      { question: "Quel sera le Poids Maximal Autorisé (PMA) pour le véhicule articulé suivant : Tracteur PTRA : 38 t et poids à Vide : 10 t Semi-remorque PTAC : 22 t et poids à Vide : 7 t", reponses: ["32 t"], image: "" },
      { question: "Lors d’un contrôle sur route , dois-je présenter un justificatif de l’employeur pour le ou les jour(s) non travaillé(s) ?", reponses: ["Oui"], image: "" },
      { question: "Le circuit d’alimentation d’un moteur diesel se compose , entre autres éléments , de deux pompes : l’une dite pompe d’injection haute pression, l’autre est dite pompe … ?", reponses: ["D’alimentation"], image: "" },
      { question: "En remorquage occasionnel d’un véhicule isolé de transpport de marchandises , quelle est la longueur maximal autorisée de l’ensemble constitué ?", reponses: ["30 m"], image: "" },
      { question: "Cette signalisation de présignalisation peut annoncer une barrière de dégel : Vrai ou Faux ?", reponses: ["Vrai"], image: "images/fiche-ecrite/deviation.png" },
      { question: "Le conducteur d’un camion de plus de 7,5 tonnes effectuant une collecte de fruits est-il soumis à la règlementation sociale européenne ?", reponses: ["Oui"], image: "" },
      { question: "Le principal avantage du système de freinage antibloquant est-il de réduire les distances de freinage ?", reponses: ["Non"], image: "" }
    ],
    10: [
      { question: "Les accidents mortels entre un poids lourd et une voiture sont majoritairement des accidents avec des véhicules circulant dans le même sens. Vrai ou Faux ?", reponses: ["Faux"], image: "" },
      { question: "Après un contrôle du poids , serez-vous passible d’une amende si la surcharge correspond à 4%(4 pour cent) du poid maximal autorisé ?", reponses: ["Oui"], image: "" },
      { question: "Après 2 heures de conduite , quelle est la durée minimale d’un premier arrêt pouvant être pris en compte comme pause ?", reponses: ["15 minutes"], image: "" },
      { question: "Les filtres à carburant ou filtres principaux sont situés entre la pompe d’alimentation et la pompe d’injection haute pression. Vrai ou Faux ?", reponses: ["Vrai"], image: "" },
      { question: "Ce signal concerne uniquement les véhicules isolés ?", reponses: ["Non"], image: "images/fiche-ecrite/vehicule-10m.png" },
      { question: "Quel sera le Poids Maximal Autorisé (PMA) pour l’ensemble suivant : Porteur PTRA : 44 t et PTAC : 26 t Remorque PTAC : 26 t et poids à Vide : 7t", reponses: [" 44 t"], image: "" },
      { question: "Si les disques à l’arrière d’un camion (isolé), de 38 t de PTRA , sont  » 80 – 90  » , quels sont les disques placés à l’arrière de la remorque lorsque le train routier est formé ?", reponses: ["560 – 80 – 90"], image: "" },
      { question: "Un véhicule qui circule sous le régime « TIR » doit comporter un scellement effectuer par la douane du pays d’origine. Vrai ou Faux ?", reponses: ["Vrai"], image: "" },
      { question: "Un chauffeur a conduit 40 heures la semaine précédente. Selon la règlementation sociale européenne , combien d’heures maximum peut-il conduire la semaine en cours ?", reponses: ["50 h","50 heures"], image: "" },
      { question: "Ai-je le droit d’atteler une semi-remorque dont le type des pneumatiques est différents de celui du véhicule tracteur ?", reponses: ["Oui"], image: "" }
    ],
    11: [
      { question: "Le constat amiable d’accident peut-il constituer un preuve de responsabilité ?", reponses: ["Oui"], image: "" },
      { question: "Circuler avec un seul pneu lisse ou détérioré n’entraîne  pas de contravention si le véhicule possède une roue de secours en bon état. Vrai ou Faux ?", reponses: ["Faux"], image: "" },
      { question: "La rémunération mensuelle d’un conducteur salariée peut-être calculée en fonction de la charge transportée pendant le mois. Vrai ou Faux ?", reponses: ["Faux"], image: "" },
      { question: "Quel sera le Poids Maximal Autorisé (PMA) pour l’ensemble suivant : Porteur remorqueur PTRA : 44 t et PTAC : 26 t Remorque PTAC : 14 t et poids à Vide : 5 t", reponses: ["40 t"], image: "" },
      { question: "Comment appelle-t-on les transports exécutés à titre onéreux pour le compte d’un client ?", reponses: ["Publics","Comptes d'autrui"], image: "" },
      { question: "L’embrayage est un organe mécanique nécessaire au passage des vitesses sur les seules boîtes mécaniques ?", reponses: [" Non"], image: "" },
      { question: "Hors agglomération , sur une route à double sens , vous suivez un camion à 70 km/h. Quel intervalle de sécurité minimum devez-vous respecter ?", reponses: ["50 m"], image: "" },
      { question: "Je circule avec un véhicule mesurant 2,30 mètre de large. A hauteur de ce signal, je peux continuer sur cette route ?", reponses: ["Oui"], image: "images/fiche-ecrite/interdiction-vehicule-plus-de-230-m.png" },
      { question: "En règle générale , quelle est la durée maximale de conduite journalière autorisée en respectant les temps de repos ?", reponses: ["9 h"], image: "" },
      { question: "Le frein de rupture agit-il uniquement sur les roues du véhicule remorqué ?", reponses: ["Non"], image: "" }
    ],
    12: [
      { question: "Le modèle allemand , italien ou espagnol d’un constat européen d’accident , comporte-t-il les mêmes rubriques que le modèle français ?", reponses: ["Oui"], image: "" },
      { question: "Débrancher ou modifier les réglages du limiteur de vitesse peut entraîner une suspension du permis de conduire , même s’il n’y a pas eu d’excès de vitesse constaté.Vrai ou Faux ?", reponses: ["Vrai"], image: "" },
      { question: "Le conducteur peut-il bâcher ou débâcher son véhicule pendant une pause ?", reponses: ["Non"], image: "" },
      { question: "Quel est le PTRA maximal d’un véhicule articulé comportant 4 essieux ?", reponses: ["38 t"], image: "" },
      { question: "Ce signal m’annonce une voie de détresse qui sera située sur ma gauche?", reponses: ["Non"], image: "images/fiche-ecrite/voie-de-detresse-a-droite.png" },
      { question: "Faut-il un seul certificat d’immatriculation pour un ensemble de véhicules constitué d’un camion de 26 t auquel on a attelé un compresseur sur roues de 800 kg ?", reponses: [" Non"], image: "" },
      { question: "La marche arrière sert à inverser le sens de rotation de l’arbre de transmission ?", reponses: ["Oui"], image: "" },
      { question: "Sur une autoroute à 4 voies , un véhicule articulé de 15 m de long peut-il effectuer un dépassement en empruntant la 3ème voie ?", reponses: ["Non"], image: "" },
      { question: "En règle générale , quelle est la durée minimale normale (non réduite ) obligatoire de repos journalier lorsque celui-ci n’est pas fractionné ?", reponses: ["11 h"], image: "" },
      { question: "Si les disques à l’arrière du tracteur d’un véhicule articulé sont 60 – 80 – 90 , quels sont les disques placés à l’arrière de la semi-remorque ?", reponses: ["60 – 80 – 90"], image: "" }
    ],
    13: [
      { question: "Dans une longue descente , en cas de rupture de freins , si j’utilise une voie de détresse , le véhicule que je conduis sera – t – il gravement endommagé ?", reponses: ["Non"], image: "" },
      { question: "Je possède les catégories B – C et CE . Conduire ma voiture personnelle après avoir pris de la drogue peut entraîner la perte de la catégorie B de mon permis de conduire uniquement. Vrai ou Faux ?", reponses: ["Faux"], image: "" },
      { question: "Quelle est la durée maximale autorisée de conduite continue pour un conducteur de camion ?", reponses: ["4 h 30","4 heures 30 minutes"], image: "" },
      { question: "Quelle est la majoration maximale autorisée du PTRA d’un véhicule articulé équipé de 2 dispositifs ralentisseurs : un de 600 kg sur le tracteur et un de 400 kg sur la remorque ?", reponses: ["500 kg"], image: "" },
      { question: "Lors d’un contrôle des temps de conduite et de repos sur la route , en plus de la journée en cours , sur quelle période devez-vous pouvoir présenter les données ?", reponses: ["56 jours"], image: "" },
      { question: "Un pont court permet d’obtenir un couple plus important et une vitesse du véhicule plus faible . Vrai ou Faux ?", reponses: ["Vrai"], image: "" },
      { question: "Sur une autoroute à 3 voies, un véhicule articulé de 15 m de long peut-il effectuer un dépassement en empruntant la 2 ème voie ?", reponses: ["Oui"], image: "" },
      { question: "Je circule , à vide, avec un véhicule de 5 tonnes de poids à vide et de 15 tonnes de PTAC. A hauteur de ce signal , je peux passer ?", reponses: ["Non"], image: "images/fiche-ecrite/5.5.png" },
      { question: "Pouvez-vous prendre votre temps de repos en couchette lorsque le véhicule est à l’arrêt ?", reponses: ["Oui"], image: "" },
      { question: "Le système de freinage électronique (EBS) contrôle la répartition du freinage entre le véhicule tracteur et la remorque qui en sont équipés ?", reponses: ["Oui"], image: "" }
    ],
    14: [
      { question: "Pour diminuer les risques d’accidents , lors de la montée ou la descente d’un camion , de combien de points d’appui le conducteur doit-il se servir ?", reponses: ["3"], image: "" },
      { question: "Lors d’un contrôle sur la route , est-il obligatoire de pouvoir présenter votre carte de qualification conducteur (CQC)?", reponses: ["Oui"], image: "" },
      { question: "Après 4h30 de conduite continue , quelle est la durée minimale de la pause que vous devez respecter ?", reponses: ["45 minutes"], image: "" },
      { question: "La longueur d’un véhicule articulé se calcule en additionnant la longueur du tracteur routier et la longueur de la semi-remorque. Vrai ou Faux ?", reponses: ["Faux"], image: "" },
      { question: "Ce signal peut concerner les véhicules transportant une faible quantité de produits polluants ?<", reponses: ["Oui"], image: "images/fiche-ecrite/polluant.png" },
      { question: "Le mécanisme de l’assistance de direction comprend une   » bielle pendante « . Vrai ou Faux ?", reponses: ["Vrai"], image: "" },
      { question: "Vous conduisez un ensemble routier neuf de 40 t de PTRA . A quelle vitesse êtes-vous limité sur route unique à sens prioritaire ?", reponses: ["80 km/h"], image: "" },
      { question: "Tout véhicule effectuant un transport international doit porter à l’arrière une plaque avec la mention  » TIR  » Vrai ou Faux ?", reponses: ["Faux"], image: "" },
      { question: "L’amplitude de la journée de travail d’un conducteur routier comprend le temps de service et les pauses. Vrai ou  Faux ?", reponses: ["Vrai"], image: "" },
      { question: "En général , un  véhicule articulé neuf doit être équipé d’un extincteur à poudre de 6 kg placé à l’extérieur. Vrai ou Faux ?", reponses: ["Vrai"], image: "" }
    ],
    15: [
      { question: "Les accidents corporels entre un poids lourd et une voiture se produisent en majorité dans les intersections. Vrai ou Faux ?", reponses: ["Faux"], image: "" },
      { question: "Quelle est la périodicité des Formations Continues Obligatoires des conducteurs routiers ?", reponses: ["5 ans"], image: "" },
      { question: "Après 3 heures de conduite continue , s’arrêter 10 mn sur un parking est-il considéré comme une pause ?", reponses: ["Non"], image: "" },
      { question: "Quand j’attelle une semi-remorque porte-voitures à mon tracteur , quelle longueur ne doit pas dépasser le véhicule articulé ainsi constitué ?", reponses: ["16,50 m"], image: "" },
      { question: "Combien de certificat (s) d’immatriculation est/sont attribué(s) à un véhicule articulé ?<", reponses: ["2"], image: "" },
      { question: "Quel type de suspension équipe généralement les véhicules lourds permettant de régler la hauteur du véhicule ?", reponses: ["La suspension pneumatique","pneumatique"], image: "" },
      { question: "Le véhicule porteur-remorqueur d’un train routier  a un PTRA de 38 t. Quelles sont les vitesses indiquées à l’arrière de la remorque ?", reponses: ["60 – 80 – 90","60 km/h – 80 km/h – 90 km"], image: "" },
      { question: "Ce signal m’indique un arrêt d’autobus. Vrai ou Faux ?", reponses: ["Faux"], image: "images/fiche-ecrite/panneau_obligation_voie_bus.png" },
      { question: "En double équipage , en France , vous êtes assis à côté du conducteur.Votre temps de conduite continue est-il interrompu ?", reponses: ["Oui"], image: "" },
      { question: "En circulation, le fait de freiner désactive obligatoirement ler régulateur de vitesse. Vrai ou Faux ?", reponses: ["Vrai"], image: "" }
    ],
    16: [
      { question: "Quand je circule en Espagne, quel numéro de téléphone est-il conseillé d’utiliser pour appeler les secours à partir d’un portable ?", reponses: ["112"], image: "" },
      { question: "Si je perds tous les points de mon permis de conduire à la suite d’infractions commises au volant de ma voiture personnelle, pourrai-je continuer à conduire mon camion ?", reponses: ["Non"], image: "" },
      { question: "Vous avez interrompu votre conduite pendant 45 min. Ce temps peut-il être pris en compte pour le calcul du temps de repos journalier ?", reponses: ["Non"], image: "" },
      { question: "Mon camion de 20 t de PTAC est chargé au maximum. Son PTRA est de 40 t. Si je dois atteler une remorque de 26 t de PTAC, quel doit être le poids réel maximal de la remorque ?", reponses: ["20 t"], image: "" },
      { question: "Dans le cadre du transport public, peut-il y avoir une seule lettre de voiture (avec état récapitulatif) dans le véhicule pour un transport comportant plusieurs destinataires dans la même journée ?<", reponses: ["Oui"], image: "" },
      { question: "Le recreusage des pneumatiques est une opération qui peut s’effectuer uniquement par un spécialiste ?", reponses: ["Oui"], image: "" },
      { question: "Vous conduisez un véhicule de 38 t de PTRA. En règle générale, quand débute l’interdiction de circulation en fin de semaine ?", reponses: ["Samedi à 22h","samedi à 10 h du soir"], image: "" },
      { question: "Ce signal concerne les véhicules affectés aux seuls transports de produits polluants ?", reponses: ["Non"], image: "images/fiche-ecrite/transport-produit-dangereux.png" },
      { question: "Votre véhicule est équipé d’un chronotachygraphe numérique. Vous avez perdu votre carte 'conducteur', combien de jours au maximum pouvez-vous conduire sans carte ?", reponses: ["15","15 jours"], image: "" },
      { question: "Un dolly (ou diabolo) pesant 600 kg doit-il être immatriculé ?", reponses: ["Oui"], image: "" }
    ], 
    17: [
      { question: "En moyenne, il y a plus d’accidents graves impliquant un poids lourd les samedis et veilles de jours fériés que les jours de la semaine. Vrai ou Faux ?", reponses: ["Faux"], image: "" },
      { question: "Sur une route à double sens limité à 70 km/h, lors d’un contrôle routier, votre carte conducteur indique que vous rouliez à 80 km/h. Pouvez-vous être sanctionné ?", reponses: ["Oui"], image: "" },
      { question: "La règlementation sociale européenne s’applique-t-elle à un conducteur non salarié propriétaire de son véhicule ?", reponses: ["Oui"], image: "" },
      { question: "Lorsque le conducteur serre le frein de parc, le cylindre de frein à ressort se remplit d’air. Vrai ou Faux ?", reponses: ["Faux"], image: "" },
      { question: "Suite au contrôle technique périodique, lorsque le véhicule est refusé sans interdiction de circuler, dans quel délai maximum la contre-visite doit-elle être effectuée pour éviter une visite technique complète ?<", reponses: ["1 mois"], image: "" },
      { question: "Mon camion a un PTRA de 40 t et un PV de 10 t. Si le camion est vide, ai-je le droit d’atteler une remorque dont le poids réel est de 15 t ?", reponses: ["Non"], image: "" },
      { question: "Vous conduisez un véhicule articulé neuf de 38 t de PTRA. À quelle vitesse êtes-vous limité sur route non prioritaire ?", reponses: ["60 km/h"], image: "" },
      { question: "Par temps sec, ce signal me concerne ?", reponses: ["Oui"], image: "images/fiche-ecrite/accotement-meuble.png" },
      { question: "Vous attendez votre tour pour décharger sans connaître le temps d’attente. Sur quel symbole devez-vous positionner le sélecteur d’activité du chronotachygraphe ?", reponses: ["Autres tâches","marteaux"], image: "" },
      { question: "Les disques de limitation de vitesse apposés à l’arrière d’un semi-remorque sont-ils identiques à ceux du tracteur routier ?", reponses: ["Oui"], image: "" }
    ],  
    18: [
      { question: "Un X (ex: X83) inscrit à côté du nombre dans le rectangle du haut de la plaque orange placée à l’arrière d’un camion signifie : 'produit très inflammable'. Vrai ou Faux ?", reponses: ["Faux"], image: "" },
      { question: "En cas de récidive de grand excès de vitesse, une suspension du permis peut être assortie d’un permis limité à la conduite professionnelle si l’infraction a été commise avec la voiture personnelle du chauffeur. Vrai ou Faux ?", reponses: ["Faux"], image: "" },
      { question: "Vous conduisez sans vous arrêter depuis 8h ce matin. Il est 12h40. Êtes-vous en infraction ?", reponses: ["Oui"], image: "" },
      { question: "Le circuit de freinage européen rend le freinage de l’essieu avant indépendant du freinage de l’essieu arrière. Vrai ou Faux ?", reponses: ["Vrai"], image: "" },
      { question: "La licence de transport intérieur permet d’effectuer un transport avec un véhicule de 38 t à condition de rester en France. Vrai ou Faux ?<", reponses: ["Faux"], image: "" },
      { question: "Mon camion a un PTRA de 40 t et PV de 10 t. Si le camion est vide, ai-je le droit d’atteler une remorque dont le poids réel est de 13 t ?", reponses: ["Oui"], image: "" },
      { question: "Vous conduisez un véhicule articulé neuf de 38 t de PTRA. À quelle vitesse êtes-vous limité sur route prioritaire à chaussées séparées ?", reponses: ["80 km/h"], image: "" },
      { question: "Ce signal interdit de dépasser les seuls véhicules dont le PTAC dépasse 3,5 tonnes ?", reponses: ["Non"], image: "images/fiche-ecrite/panneau-camion-interdiction-de-depasser.png" },
      { question: "Un chauffeur a conduit 50 heures la semaine précédente. Selon la réglementation sociale européenne, combien d’heures maximum peut-il conduire la semaine en cours ?", reponses: ["40 h","40 heures"], image: "" },
      { question: "Le système de contrôle électronique de stabilité (ESP) agit principalement en virage ?", reponses: ["Oui"], image: "" }
    ],   
    19: [
      { question: "Dans le transport routier , c’est pendant le travail , hors conduite , que l’on dénombre le plus fort taux d’accidents chez les conducteurs ?", reponses: ["Oui"], image: "" },
      { question: "Vous n’avez pas mis de carte dans le chronotachygraphe numérique , lors d’un contrôle sur route , sera-t-il possible de contrôler vos temps de conduite ?", reponses: ["Oui"], image: "" },
      { question: "En double équipage, lorsque le véhicule est en circulation depuis plus de 45 minutes , le conducteur qui n’est pas au volant est-il considéré au repos ?", reponses: ["Non"], image: "" },
      { question: "Le dispositif antiblocage de roues (ABS) peut-il fonctionner en même temps que le ou les dispositifs ralentisseurs ?", reponses: ["Oui"], image: "" },
      { question: "Suite au contrôle technique périodique , quelle lettre figure sur le certificat d’immatriculation lorsque le véhicule est refusé avec interdiction de circuler ?<", reponses: ["R","La lettre R"], image: "" },
      { question: "Vous chargez du sable dans une semi-remorque , quelle peut-être la charge maximale autorisée sur l’essieu le plus chargé du groupe d’essieux arrière ?", reponses: ["10,5 t","10,500 t","10 t 500"], image: "" },
      { question: "Je conduis un camion de 26 t de PTAC et de 10 t de PV . pour emprunter une route où une barrière de dégel à 12 t avec mention demi-charge autorisée, est en place,  quel doit être le poids maximum de mon chargement", reponses: ["8 t","8 tonnes"], image: "" },
      { question: "En agglomération , ce signal est implanté 50 mètres avant le carrefour à sens giratoire ?", reponses: ["Oui"], image: "images/fiche-ecrite/carrefour-giratoire.png" },
      { question: "Vous avez fait une coupure de 4 heures (repos) quelle sera , au minimum , la durée de la période de repos suivante pour être en règle vis-à-vis du repos journalier ?", reponses: ["9 h","9 heures"], image: "" },
      { question: "En général , de combien d’extincteur(s) doit être équipé un véhicule articulé neuf ?", reponses: ["2"], image: "" }
    ],  
    20: [
      { question: "En cas d’accident dans lequel votre véhicule est en cause , les forces de l’ordre peuvent-elles saisir votre carte   'conducteur' ?", reponses: ["Oui"], image: "" },
      { question: "Votre permis porte la mention  » 01:dispositif de correction et/ou de protection de la vision. »Avez-vous le droit de conduire sans porter de lunettes ou de lentilles ?", reponses: ["Non"], image: "" },
      { question: "Un temps de conduite de 4h30 peut-être fractionné au plus , par combien de pause(s) ?", reponses: ["2"], image: "" },
      { question: "Vous conduisez un train routier.Quelle peut-être sa longueur maximale ?", reponses: ["18,75 m"], image: "" },
      { question: "Comment appelle-t-on les transports exécutés à titre onéreux pour le compte d'un client ?", reponses: ["Publics","Compte d'autrui"], image: "" },
      { question: "En principe le ralentisseur hydraulique est située sur … ?", reponses: ["La transmission","L’arbre de transmission"], image: "" },
      { question: "Un pont dont la hauteur libre est de 5 m (au plus bas) sera obligatoirement signalé par un panneau de hauteur limitée. Vrai ou faux ?", reponses: ["Faux"], image: "" },
      { question: "Hors agglomération , ce signal est implanté 100 mètres avant le carrefour à sens giratoire ?", reponses: ["Non"], image: "images/fiche-ecrite/carrefour-giratoire.png" },
      { question: "Vous conduisez un véhicule spécialisé de dépannage. Êtes-vous soumis à la règlementation sociale européenne concernant les temps de conduite et de repos si vous ramenez une voiture de Lille à Marseille ?", reponses: ["Oui"], image: "" },
      { question: "Les disques de limitation de vitesse apposés à l’arrière d’une remorque sont-ils identiques à ceux placés à l’arrière du camion ?", reponses: ["Non"], image: "" }
    ], 
  };

  var feMenu = $("feMenu");
  var feContainer = $("feContainer");
  var feCorriger = $("feCorriger");
  var feReset = $("feReset");
  var feNote = $("feNote");

  if (feMenu && feContainer) {
    var ficheActive = 1;

    function setNote(html) {
      if (!feNote) return;
      feNote.innerHTML = html || "";
    }

    function storageKey(num) {
      return "fe_fiche_" + num;
    }

    function buildMenu() {
      feMenu.innerHTML = "";
      for (var i = 1; i <= 20; i++) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "sous-onglet" + (i === ficheActive ? " actif" : "");
        b.setAttribute("data-fiche", String(i));
        b.textContent = "Fiche " + i;
        feMenu.appendChild(b);
      }
    }

    function saveInputs() {
      var inputs = feContainer.querySelectorAll("input.rep-input[data-qindex]");
      var arr = [];
      for (var i = 0; i < inputs.length; i++) arr.push(inputs[i].value || "");
      localStorage.setItem(storageKey(ficheActive), JSON.stringify(arr));
    }

    function loadInputs() {
      var data = localStorage.getItem(storageKey(ficheActive));
      var arr = [];
      try {
        arr = data ? JSON.parse(data) || [] : [];
      } catch (e) {
        arr = [];
      }

      for (var i = 0; i < arr.length; i++) {
        var input = feContainer.querySelector('input.rep-input[data-qindex="' + i + '"]');
        if (input) input.value = arr[i] || "";
      }
    }

    function renderFiche(num) {
      ficheActive = num;
      setNote("");
      feContainer.innerHTML = "";

      var fiche = FICHES_ECRITES[ficheActive] || [];
      if (!fiche.length) {
        feContainer.innerHTML =
          "<p>Fiche " + ficheActive + " : aucune question. Ajoute-les dans <code>FICHES_ECRITES</code> (script.js).</p>";
        buildMenu();
        return;
      }

      for (var i = 0; i < fiche.length; i++) {
        var q = fiche[i];

        var wrap = document.createElement("div");
        wrap.className = "question";

        var row = document.createElement("div");
        row.className = "fe-qrow";

        if (q.image) {
          var im = document.createElement("img");
          im.src = q.image;
          im.alt = "Illustration question " + (i + 1);
          row.appendChild(im);
        }

        var h4 = document.createElement("h4");
        h4.textContent = "Question " + (i + 1) + " : " + (q.question || "");
        row.appendChild(h4);

        wrap.appendChild(row);

        var input = document.createElement("input");
        input.type = "text";
        input.className = "rep-input";
        input.setAttribute("data-qindex", String(i));
        input.placeholder = "Tape ta réponse...";
        wrap.appendChild(input);

        var fb = document.createElement("div");
        fb.className = "fe-feedback";
        fb.setAttribute("data-fb", String(i));
        wrap.appendChild(fb);

        feContainer.appendChild(wrap);
      }

      loadInputs();
      buildMenu();
    }

    function checkOne(i) {
      var input = feContainer.querySelector('input.rep-input[data-qindex="' + i + '"]');
      var fb = feContainer.querySelector('[data-fb="' + i + '"]');
      var fiche = FICHES_ECRITES[ficheActive] || [];
      var q = fiche[i];
      if (!input || !q) return false;

      input.classList.remove("ok");
      input.classList.remove("ko");
      if (fb) fb.textContent = "";

      var user = input.value || "";
      var ok = false;

      if (user.trim() !== "" && q.reponses && q.reponses.length) {
        for (var r = 0; r < q.reponses.length; r++) {
          if (isMatch(user, q.reponses[r])) {
            ok = true;
            break;
          }
        }
      }

      input.classList.add(ok ? "ok" : "ko");

      if (fb) {
        if (ok) fb.textContent = "✅ Correct";
        else fb.textContent = "❌ Réponse attendue : " + (q.reponses && q.reponses[0] ? q.reponses[0] : "");
      }

      return ok;
    }

    function corrigerTout() {
      var fiche = FICHES_ECRITES[ficheActive] || [];
      if (!fiche.length) return;

      var bonnes = 0;
      for (var i = 0; i < fiche.length; i++) {
        if (checkOne(i)) bonnes++;
      }

      var total = fiche.length;
      var note = "";
      if (bonnes <= 4) note = "Note E (éliminatoire)";
      else if (bonnes === 5) note = "Note 0";
      else if (bonnes === 6) note = "Note 1";
      else if (bonnes <= 8) note = "Note 2";
      else note = "Note 3";

      setNote("Résultat : " + bonnes + "/" + total + " — <strong>" + note + "</strong>");
      saveInputs();
    }

    function resetFiche() {
      localStorage.removeItem(storageKey(ficheActive));
      renderFiche(ficheActive);
      setNote("");
    }

    feMenu.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.classList || !t.classList.contains("sous-onglet")) return;
      var n = parseInt(t.getAttribute("data-fiche") || "1", 10);
      renderFiche(isNaN(n) ? 1 : n);
    });

    feContainer.addEventListener("keydown", function (e) {
      var t = e.target;
      if (!t || t.tagName !== "INPUT") return;
      if (!t.classList || !t.classList.contains("rep-input")) return;

      if (e.key === "Enter") {
        e.preventDefault();
        var idx = parseInt(t.getAttribute("data-qindex") || "0", 10);
        checkOne(idx);
        saveInputs();
        var next = feContainer.querySelector('input.rep-input[data-qindex="' + (idx + 1) + '"]');
        if (next) next.focus();
      }
    });

    feContainer.addEventListener("input", function (e) {
      var t = e.target;
      if (!t || t.tagName !== "INPUT") return;
      if (!t.classList || !t.classList.contains("rep-input")) return;

      var idx = parseInt(t.getAttribute("data-qindex") || "0", 10);
      t.classList.remove("ok");
      t.classList.remove("ko");
      var fb = feContainer.querySelector('[data-fb="' + idx + '"]');
      if (fb) fb.textContent = "";
      saveInputs();
    });

    if (feCorriger) feCorriger.addEventListener("click", corrigerTout);
    if (feReset) feReset.addEventListener("click", resetFiche);
  

    renderFiche(1);
  }
// ===== POPUP INFO (UNIQUE) =====
function openInfoFromBtn(btn, e) {
  if (e) e.stopPropagation();
  var src = (btn && btn.dataset) ? btn.dataset.img : "";
  if (!src) return;
  openInfoImage(src);
}

function openInfoImage(src) {
  var modal = document.getElementById("infoModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "infoModal";
    modal.innerHTML =
      '<div class="infoModal-backdrop">' +
        '<div class="infoModal-box">' +
          '<button class="infoModal-close" type="button">✕</button>' +
          '<img id="infoModalImg" alt="Info">' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    modal.querySelector(".infoModal-backdrop").addEventListener("click", closeInfoImage);
    modal.querySelector(".infoModal-box").addEventListener("click", function (ev) {
      ev.stopPropagation();
    });
    modal.querySelector(".infoModal-close").addEventListener("click", closeInfoImage);
  }

  document.getElementById("infoModalImg").src = src;
  modal.classList.add("active");
}

function closeInfoImage() {
  var modal = document.getElementById("infoModal");
  if (modal) modal.classList.remove("active");
}


  /* =========================
     Service worker
  ========================= */
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }

});
window.openInfoFromBtn = function (btn, e) {
  if (e) e.stopPropagation();
  var src = btn && btn.dataset ? btn.dataset.img : "";
  if (!src) return;
  window.openInfoImage(src);
};

window.openInfoImage = function (src) {
  var modal = document.getElementById("infoModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "infoModal";
    modal.innerHTML =
      '<div class="infoModal-backdrop">' +
        '<div class="infoModal-box">' +
          '<button class="infoModal-close" type="button">✕</button>' +
          '<img id="infoModalImg" alt="Info">' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    modal.querySelector(".infoModal-backdrop").addEventListener("click", window.closeInfoImage);
    modal.querySelector(".infoModal-box").addEventListener("click", function (ev) { ev.stopPropagation(); });
    modal.querySelector(".infoModal-close").addEventListener("click", window.closeInfoImage);
  }

  document.getElementById("infoModalImg").src = src;
  modal.classList.add("active");
};

window.closeInfoImage = function () {
  var modal = document.getElementById("infoModal");
  if (modal) modal.classList.remove("active");
};
