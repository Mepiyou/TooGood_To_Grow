const PLAFOND_CENTIMES = 99999999;

const refus = erreur => ({ ok: false, erreur });

// Conversion par chaînes pour éviter tout arrondi flottant (0,29 × 100 ≠ 29).
export function parseMontant(texte) {
  const s = String(texte ?? '').replace(/\s/g, '');
  if (s === '') return refus('Saisis un montant.');
  if (s.startsWith('-')) return refus('Le montant doit être supérieur à 0 €.');

  const m = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(s);
  if (!m) {
    if (/^\d+[.,]\d{3,}$/.test(s)) return refus('Deux décimales maximum.');
    return refus('Montant invalide.');
  }

  const centimes = Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0') || '0');
  if (centimes === 0) return refus('Le montant doit être supérieur à 0 €.');
  if (centimes > PLAFOND_CENTIMES) return refus('Montant invalide.');
  return { ok: true, centimes };
}

// Valeur de départ du champ montant en modification : « 450 », « 12,50 ».
export function centimesVersSaisie(centimes) {
  const euros = Math.trunc(centimes / 100);
  const reste = centimes % 100;
  return reste === 0 ? String(euros) : `${euros},${String(reste).padStart(2, '0')}`;
}
