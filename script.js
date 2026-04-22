window.melodyLibrary = [];

const urls = [
    "sessionSet01.js", "sessionSet02.js", "sessionSet03.js", "sessionSet04.js",
    "sessionSet05.js", "sessionSet06.js", "sessionSet07.js", "sessionSet08.js",
    "sessionSet09.js", "sessionSet10.js", "sessionSet11.js", "sessionSet12.js",
    "sessionSet13.js", "sessionSet14.js", "sessionSet15.js", "sessionSet16.js",
    "sessionSet17.js", "sessionSet18.js", "folkwikiSet1.js", "folkwikiSet2.js",
    "folkwikiSet3.js", "fsfolkdiktning01.js", "fsfolkdiktning02.js", "extrasetti5.js"
];

let selectedDuration = "1";
let selectedAccidental = ""; 
let isDottedMode = false; // Varmista että nimi täsmää kaikkialla

// --- APUFUNKTIOT ---

function getPitchValue(acc, note, oct) {
    const basePitches = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
    let p = basePitches[note.toUpperCase()];
    if (note === note.toLowerCase()) p += 12;
    if (oct) {
        for (let char of oct) {
            if (char === ',') p -= 12;
            if (char === "'") p += 12;
        }
    }
    if (acc === '^') p += 1;
    if (acc === '_') p -= 1;
    return p;
}

function getFingerprint(abc) {
    if (!abc) return "";

   // 1. ESIVAIHE: Muunnetaan broken rhythm -merkit (> ja <) numeroiksi.
    // Tehdään tämä HETI alussa, jotta loppufunktio näkee vain numeroita.
    
    // Pitkä-lyhyt (E>G -> E3/2 G/2)
    abc = abc.replace(/([A-Ga-g][,']*)(>)([A-Ga-g][,']*)/g, "$13/2 $3/2");
    
    // Lyhyt-pitkä (E<G -> E/2 G3/2)
    abc = abc.replace(/([A-Ga-g][,']*)(<)([A-Ga-g][,']*)/g, "$1/2 $33/2");

    // Tämän jälkeen jatkuu sävellajin tunnistus...
    const keyMatch = abc.match(/^K:\s*([A-G][#b]?)\s*([A-Za-z]*)/m);
    let root = keyMatch ? keyMatch[1] : "C";
    let mode = keyMatch && keyMatch[2] ? keyMatch[2].toLowerCase() : "maj";



    const modeOffsets = {
        'maj': 0, 'major': 0, 'ion': 0, 'ionian': 0,
        'mix': -1, 'mixolydian': -1,
        'lyd': 1, 'lydian': 1,
        'dor': -2, 'dorian': -2,
        'min': -3, 'minor': -3, 'aeo': -3, 'aeolian': -3,
        'phr': -4, 'phrygian': -4,
        'loc': -5, 'locrian': -5
    };

    const circleOfFifths = {
        'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6, 'C#': 7,
        'F': -1, 'Bb': -2, 'Eb': -3, 'Ab': -4, 'Db': -5, 'Gb': -6, 'Cb': -7
    };

    let sharpCount = (circleOfFifths[root] || 0) + (modeOffsets[mode] || 0);
    const sharpsOrder = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
    const flatsOrder = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
    const currentKeyRules = {};

    if (sharpCount > 0) {
        for (let i = 0; i < sharpCount; i++) currentKeyRules[sharpsOrder[i]] = '^';
    } else if (sharpCount < 0) {
        for (let i = 0; i < Math.abs(sharpCount); i++) currentKeyRules[flatsOrder[i]] = '_';
    }

    let clean = abc.replace(/^[A-Z]:.*/gm, "").replace(/"[^"]*"/g, "").replace(/\{[^}]*\}/g, "").replace(/[|\[\]\s]/g, "");
    const regex = /([\^_=]?)([A-Ga-gHh])([,']*)([0-9/]*)/g;
    let notes = [];
    let match;

    while ((match = regex.exec(clean)) !== null) {
        let acc = match[1];
        const note = match[2];
        const oct = match[3];
        const durStr = match[4];

        if (!acc) {
            acc = currentKeyRules[note.toUpperCase()] || "";
        } else if (acc === "=") {
            acc = "";
        }

        let pitch = getPitchValue(acc, note, oct);
        let duration = 1;
        if (durStr) {
            if (durStr.includes('/')) {
                let parts = durStr.split('/');
                duration = (parseFloat(parts[0]) || 1) / (parseFloat(parts[1]) || 2);
            } else {
                duration = parseFloat(durStr);
            }
        }
        notes.push({ pitch, duration });
    }

    if (notes.length < 2) return "";
    let fp = [];
    for (let i = 1; i < notes.length; i++) {
        let interval = notes[i].pitch - notes[i-1].pitch;
        let durRatio = (notes[i].duration / notes[i-1].duration).toFixed(1);
        fp.push(`${interval}:${durRatio}`);
    }
    return "|" + fp.join("|") + "|";
}

// --- SOVELLUKSEN LOGIIKKA ---

async function initApp() {
    const loaderBar = document.getElementById("loader-bar");
    const loaderPercent = document.getElementById("loader-percent");
    const loaderContainer = document.getElementById("loader-container");

    for (let i = 0; i < urls.length; i++) {
        try {
            const response = await fetch(urls[i]);
            const text = await response.text();
            const startIdx = text.indexOf('[');
            const endIdx = text.lastIndexOf(']');
            
            if (startIdx !== -1 && endIdx !== -1) {
                const data = new Function('return ' + text.substring(startIdx, endIdx + 1))();
                if (Array.isArray(data)) {
                    data.forEach(tune => {
                        if (tune.abc) {
                            tune.fingerprint = getFingerprint(tune.abc);
                            window.melodyLibrary.push(tune);
                        }
                    });
                }
            }
            const progress = Math.round(((i + 1) / urls.length) * 100);
            if (loaderBar) loaderBar.style.width = progress + "%";
            if (loaderPercent) loaderPercent.textContent = progress + "%";
        } catch (e) {
            console.error("Latausvirhe: " + urls[i], e);
        }
    }
    if (loaderContainer) loaderContainer.style.display = 'none';
}

function handleSearch() {
    const abcEditor = document.getElementById('searchQuery');
    if (!abcEditor) return;
    const input = abcEditor.value;
    
    ABCJS.renderAbc("search-preview", "L:1/4\nM:none\n" + input, { responsive: 'resize', scale: 0.7 });

    if (input.replace(/\s/g, "").length < 3) {
        document.getElementById('results-list').innerHTML = "";
        document.getElementById('match-count').innerText = "0";
        return;
    }

    let searchFP = getFingerprint(input).replace(/^\|/, "").replace(/\|$/, "");
    if (!searchFP) return;

    const matches = window.melodyLibrary.filter(t => t.fingerprint && t.fingerprint.includes(searchFP));
    const list = document.getElementById('results-list');
    document.getElementById('match-count').innerText = matches.length;
    list.innerHTML = "";

    matches.slice(0, 30).forEach(tune => {
        let displayKey = tune.key || (tune.abc.match(/^K:\s*([A-Ga-g][#b]?\s*[A-Za-z]*)/m) || ["", "??"])[1];
        const fpIndex = tune.fingerprint.indexOf(searchFP);
        const startMeasure = tune.fingerprint.substring(0, fpIndex).split('|').length;

        const div = document.createElement('div');
        div.className = 'tune-card';
        div.innerHTML = `<h3>${tune.name}</h3><div style="font-size: 0.9em; color: #666;"><span>K: ${displayKey}</span> | <span>Alkamistahti: ${startMeasure}</span></div>`;
        div.onclick = () => {
            ABCJS.renderAbc("paper", tune.abc, { responsive: 'resize' });
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        };
        list.appendChild(div);
    });
}

// --- PÄÄTAPAHTUMANKÄSITTELIJÄ ---

document.addEventListener('DOMContentLoaded', () => {
    initApp();

    const abcEditor = document.getElementById('searchQuery');
    const clearBtn = document.getElementById('clearSearch');
    const durBtns = document.querySelectorAll('.dur-btn');
    const noteBtns = document.querySelectorAll('.note-btn');
    const accBtns = document.querySelectorAll('.acc-btn');
    const dotBtn = document.getElementById('dot-btn');
    const backspaceBtn = document.getElementById('backspace-btn');

    if (abcEditor) abcEditor.addEventListener('input', handleSearch);

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            abcEditor.value = "";
            abcEditor.focus();
            handleSearch();
        });
    }

    durBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            durBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedDuration = btn.getAttribute('data-dur');
        });
    });

    if (dotBtn) {
        dotBtn.addEventListener('click', () => {
            isDottedMode = !isDottedMode;
            dotBtn.classList.toggle('active', isDottedMode);
        });
    }

    accBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                selectedAccidental = "";
            } else {
                accBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedAccidental = btn.getAttribute('data-acc');
            }
        });
    });

    if (backspaceBtn) {
        backspaceBtn.addEventListener('click', () => {
            let text = abcEditor.value.trimEnd();
            const lastSpace = text.lastIndexOf(' ');
            abcEditor.value = lastSpace !== -1 ? text.substring(0, lastSpace + 1) : "";
            abcEditor.focus();
            handleSearch();
        });
    }

    noteBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const note = btn.getAttribute('data-note');
        const currentAcc = (note === 'z') ? "" : selectedAccidental;
        let noteString = "";

        // Määritetään peruskesto
        let durationStr = selectedDuration === "1" ? "" : selectedDuration;

        if (isDottedMode && note !== 'z') {
            // Muunnetaan kestot pisteellisiksi (3/2-suhde)
            if (selectedDuration === "1") durationStr = "3/2";
            else if (selectedDuration === "2") durationStr = "3";
            else if (selectedDuration === "/2") durationStr = "3/4";
            else if (selectedDuration === "/4") durationStr = "3/8";
            
            noteString = currentAcc + note + durationStr + " ";
                
                // Palautetaan piste-nappi normaalitilaan
            isDottedMode = false;
            if (dotBtn) dotBtn.classList.remove('active');
        } else {
            noteString = currentAcc + note + durationStr + " ";
        }

            // Lisätään tekstikenttään
            const start = abcEditor.selectionStart;
        abcEditor.value = abcEditor.value.slice(0, start) + noteString + abcEditor.value.slice(abcEditor.selectionEnd);
        abcEditor.selectionStart = abcEditor.selectionEnd = start + noteString.length;

        selectedAccidental = "";
        accBtns.forEach(b => b.classList.remove('active'));
        abcEditor.focus();
        handleSearch();
        });
    });
}); // TÄMÄ sulkee DOMContentLoadedin

// Service Workerin rekisteröinti
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(console.error);
}
