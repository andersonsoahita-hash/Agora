/* Test de type d'orateur : modèle propre à l'appli, non scientifique.
   Chaque réponse ajoute des points à 3 axes : L (logos), E (ethos), P (pathos). */
window.AO_DATA = window.AO_DATA || {};
window.AO_DATA.typeQuiz = [
  { q: 'Avant un discours, tu commences par…', o: [
    { t: 'Écrire un plan avec les arguments', s: { L: 3 } },
    { t: 'Penser à ce qui me rend légitime sur ce sujet', s: { E: 3 } },
    { t: 'Chercher une histoire ou une image forte', s: { P: 3 } }] },
  { q: 'Face à une salle hostile, tu…', o: [
    { t: 'Réponds point par point avec des faits', s: { L: 3 } },
    { t: 'Restes calme et tiens ta ligne', s: { E: 3 } },
    { t: 'Cherche à toucher ce qu’ils ressentent', s: { P: 3 } }] },
  { q: 'Ce qu’on te dit le plus souvent après avoir parlé :', o: [
    { t: '« C’était clair et bien construit »', s: { L: 3 } },
    { t: '« On te sent sincère et sûr »', s: { E: 3 } },
    { t: '« Ça m’a touché / j’ai retenu ton histoire »', s: { P: 3 } }] },
  { q: 'Ta plus grande tentation à l’oral :', o: [
    { t: 'Trop d’informations', s: { L: 2, P: -1 } },
    { t: 'Compter sur ma réputation, négliger les preuves', s: { E: 2, L: -1 } },
    { t: 'Trop d’émotion, pas assez de preuves', s: { P: 2, L: -1 } }] },
  { q: 'Tu préfères conclure par…', o: [
    { t: 'Un récapitulatif net des trois points', s: { L: 3 } },
    { t: 'Un engagement personnel', s: { E: 3 } },
    { t: 'Une image ou une phrase qui reste', s: { P: 3 } }] },
  { q: 'Pour convaincre quelqu’un d’hésitant, tu…', o: [
    { t: 'Montre les chiffres', s: { L: 3 } },
    { t: 'Montre que tu as déjà fait ce que tu proposes', s: { E: 3 } },
    { t: 'Fais-lui imaginer ce que ça changera', s: { P: 3 } }] },
  { q: 'Ton point fort naturel à l’oral :', o: [
    { t: 'L’ordre et la précision', s: { L: 3 } },
    { t: 'L’aplomb et le calme', s: { E: 3 } },
    { t: 'L’énergie et le rythme', s: { P: 3 } }] },
  { q: 'Quand tu écoutes un grand orateur, tu remarques d’abord…', o: [
    { t: 'La structure et les preuves', s: { L: 3 } },
    { t: 'Sa présence et son autorité', s: { E: 3 } },
    { t: 'L’émotion et la musicalité', s: { P: 3 } }] }
];

/* Détermine l'archétype à partir des scores (premier axe, deuxième axe). */
window.AO_DATA.archetypeFor = function (sc) {
  const order = ['L', 'E', 'P'].sort((a, b) => sc[b] - sc[a]);
  const key = order[0] + order[1];
  const map = { LE: 'architecte', LP: 'pedagogue', EL: 'garant', EP: 'rassembleur', PE: 'tribun', PL: 'conteur' };
  return map[key];
};
