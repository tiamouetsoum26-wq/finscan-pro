const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// ── MAPPING EXACT du template DEPOUILLEMENT_FINSCAN.xlsx ──
const ACTIF_ROWS = {
  'AE':8,'AF':9,'AG':10,'AH':11,
  'AJ':13,'AK':14,'AL':15,'AM':16,'AN':17,'AP':18,
  'AR':20,'AS':21,
  'BA':23,'BB':24,
  'BH':26,'BI':27,'BJ':28,
  'BQ':30,'BR':31,'BS':32,'BU':34
};
// F=col6=BRUT_N, G=col7=AMORT_N, H=col8=NET_N(formule), I=col9=NET_N1, J=col10=NET_N2

const PASSIF_ROWS = {
  'CA':7,'CB':8,'CD':9,'CE':10,'CF':11,'CG':12,'CH':13,'CJ':14,
  'CL':15,'CM':16,'DA':18,'DB':19,'DC':20,
  'DH':23,'DI':24,'DJ':25,'DK':26,'DM':27,'DN':28,
  'DQ':31,'DR':32,'DV':34
};
// N=col14=NET_N, O=col15=NET_N1, P=col16=NET_N2

const CR_ROWS = {
  'TA':9,'RA':10,'RB':11,
  'TB':13,'TC':14,'TD':15,'TE':17,'TF':18,'TG':19,'TH':20,'TI':21,
  'RC':22,'RD':23,'RE':24,'RF':25,'RG':26,'RH':27,'RI':28,'RJ':29,
  'RK':31,'TJ':33,'RL':34,
  'TK':36,'TL':37,'TM':38,'RM':39,'RN':40,
  'TN':43,'TO':44,'RO':45,'RP':46,'RQ':48,'RS':49
};
// I=col9=N, J=col10=N1, K=col11=N2

const TFT_ROWS = {
  'ZA':10,'FA':12,'FB':13,'FC':14,'FD':15,'FE':16,
  'FF':21,'FG':22,'FH':23,'FI':24,'FJ':25,
  'FK':28,'FL':29,'FM':30,'FN':31,
  'FO':34,'FP':35,'FQ':36
};
// I=col9=N, J=col10=N1, K=col11=N2

function colNum(n){ return n - 1; } // xlsx uses 0-based for some ops

function setCellValue(ws, row, col, value) {
  // row et col sont 1-based (comme Excel)
  const cellRef = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
  if (!ws[cellRef]) {
    ws[cellRef] = {};
  }
  // Ne pas écraser les formules
  if (ws[cellRef].f) return; // cellule avec formule → ne pas toucher
  
  if (value === null || value === undefined) return;
  ws[cellRef].v = value;
  ws[cellRef].t = typeof value === 'number' ? 'n' : 's';
  if (typeof value === 'number') {
    ws[cellRef].z = '#,##0';
  }
}

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const data = JSON.parse(event.body);

    // Lire le template
    const templatePath = path.join(__dirname, '../../DEPOUILLEMENT_FINSCAN.xlsx');
    const templateBuffer = fs.readFileSync(templatePath);
    
    // Parser avec préservation des formules
    const wb = XLSX.read(templateBuffer, {
      type: 'buffer',
      cellFormula: true,
      cellNF: true,
      cellStyles: true,
      bookVBA: true
    });

    // Forcer recalcul à l'ouverture
    if (!wb.Workbook) wb.Workbook = {};
    if (!wb.Workbook.CalcPr) wb.Workbook.CalcPr = {};
    wb.Workbook.CalcPr.fullCalcOnLoad = true;
    wb.Workbook.CalcPr.calcMode = 'auto';

    const wsBilan = wb.Sheets['BILAN '];
    const wsCR    = wb.Sheets['C.RESULTAT'];
    const wsTFT   = wb.Sheets['TFT'];

    if (!wsBilan || !wsCR || !wsTFT) {
      throw new Error('Feuilles introuvables dans le template. Vérifiez les noms: BILAN , C.RESULTAT, TFT');
    }

    // ── DATES ──────────────────────────────────────────
    if (data.date_n)  setCellValue(wsBilan, 4, 6,  data.date_n);   // F4
    if (data.date_n1) setCellValue(wsBilan, 4, 9,  data.date_n1);  // I4
    if (data.date_n2) setCellValue(wsBilan, 4, 10, data.date_n2);  // J4
    if (data.exercice_n)  setCellValue(wsTFT, 9, 9,  data.exercice_n);  // I9
    if (data.exercice_n1) setCellValue(wsTFT, 9, 10, data.exercice_n1); // J9
    if (data.exercice_n2) setCellValue(wsTFT, 9, 11, data.exercice_n2); // K9

    // ── BILAN ACTIF ─────────────────────────────────────
    const actifMap = {};
    (data.bilan_actif || []).forEach(p => { actifMap[p.ref] = p; });

    for (const [ref, row] of Object.entries(ACTIF_ROWS)) {
      const p = actifMap[ref];
      if (!p) continue;
      if (p.brut_n  != null) setCellValue(wsBilan, row, 6,  Number(p.brut_n));   // F
      if (p.amort_n != null) setCellValue(wsBilan, row, 7,  Number(p.amort_n));  // G
      // H = formule =Frow-Grow → NE PAS TOUCHER
      if (p.net_n1  != null) setCellValue(wsBilan, row, 9,  Number(p.net_n1));   // I
      if (p.net_n2  != null) setCellValue(wsBilan, row, 10, Number(p.net_n2));   // J
    }

    // ── BILAN PASSIF ────────────────────────────────────
    const passifMap = {};
    (data.bilan_passif || []).forEach(p => { passifMap[p.ref] = p; });

    for (const [ref, row] of Object.entries(PASSIF_ROWS)) {
      const p = passifMap[ref];
      if (!p) continue;
      if (p.net_n  != null) setCellValue(wsBilan, row, 14, Number(p.net_n));   // N
      if (p.net_n1 != null) setCellValue(wsBilan, row, 15, Number(p.net_n1));  // O
      if (p.net_n2 != null) setCellValue(wsBilan, row, 16, Number(p.net_n2));  // P
    }

    // ── C.RESULTAT ──────────────────────────────────────
    const crMap = {};
    (data.cr || []).forEach(p => { crMap[p.ref] = p; });

    for (const [ref, row] of Object.entries(CR_ROWS)) {
      const p = crMap[ref];
      if (!p) continue;
      if (p.n  != null) setCellValue(wsCR, row, 9,  Number(p.n));   // I
      if (p.n1 != null) setCellValue(wsCR, row, 10, Number(p.n1));  // J
      if (p.n2 != null) setCellValue(wsCR, row, 11, Number(p.n2));  // K
    }

    // ── TFT ─────────────────────────────────────────────
    const tftMap = {};
    (data.tft || []).forEach(p => { tftMap[p.ref] = p; });

    for (const [ref, row] of Object.entries(TFT_ROWS)) {
      const p = tftMap[ref];
      if (!p) continue;
      if (p.n  != null) setCellValue(wsTFT, row, 9,  Number(p.n));   // I
      if (p.n1 != null) setCellValue(wsTFT, row, 10, Number(p.n1));  // J
      if (p.n2 != null) setCellValue(wsTFT, row, 11, Number(p.n2));  // K
    }

    // ── Générer le fichier Excel ─────────────────────────
    const outputBuffer = XLSX.write(wb, {
      type: 'buffer',
      bookType: 'xlsx',
      cellFormula: true,
      cellStyles: true,
      bookSST: false
    });

    const b64 = outputBuffer.toString('base64');
    const entreprise = (data.entreprise || 'FinScan').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const filename = `DEPOUILLEMENT_${entreprise}_${data.exercice_n || 'N'}.xlsx`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ file_b64: b64, filename })
    };

  } catch(err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ error: { message: 'Erreur fill_excel: ' + err.message } })
    };
  }
};
