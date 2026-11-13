// Décide s'il faut (re)demander le stockage persistant. Chrome Android refuse souvent
// hors installation : on retente une seule fois quand l'app tourne installée.
export function doitDemanderPersistance({ dejaPersistant, demande, installe }) {
  if (dejaPersistant === true) return false;
  if (demande === undefined) return true;
  return demande.accorde === false && installe === true && demande.installe !== true;
}
