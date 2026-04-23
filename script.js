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
let isDottedMode = false;

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
    abc = abc.replace(/[><]/g, " ");
    const keyMatch = abc.match(/^K:\s*([A-G][#b]?)\s*([A-Za-z]*)/m);
    let root = keyMatch ? keyMatch[1] : "C";
    let mode = keyMatch && keyMatch[2] ? keyMatch[2].toLowerCase() : "maj";

    const modeOffsets = {
        'maj': 0, 'major': 0, 'ion': 0, 'ionian': 0, 'mix': -1, 'mixolydian': -1,
        'lyd': 1, 'lydian': 1, 'dor': -2, 'dorian': -2, 'min': -3, 'minor': -3, 
        'm': -3, 'aeo': -3, 'aeolian': -3, 'phr': -4, 'phrygian': -4, 'loc': -5, 'locrian': -5
    };

    const circleOfFifths = {
        'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6, 'C#': 7,
        'F': -1, 'Bb': -2, 'Eb': -3, 'Ab': -4, 'Db': -5, 'Gb': -6, 'Cb': -7
    };

    let sharpCount = (circleOfFifths[root] || 0) + (modeOffsets[mode] || 0);
    const sharpsOrder = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
    const flatsOrder = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
    const keyRules = {};

    if (sharpCount > 0) {
        for (let i = 0; i < sharpCount; i++) keyRules[sharpsOrder[i]] = '^';
    } else if (sharpCount < 0) {
        for (let i = 0; i < Math.abs(sharpCount); i++) keyRules[flatsOrder[i]] = '_';
    }

    let clean = abc.replace(/^[A-Z]:.*/gm, "").replace(/"[^"]*"/g, "").replace(/\{[^}]*\}/g, "");
    const regex = /([|])|([\^_=]?)([A-Ga-gHh])([,']*)([0-9/]*)/g;
    
    let notes = [];
    let barAccidentals = {}; 
    let match;

    while ((match = regex.exec(clean)) !== null) {
        if (match[1] === '|') {
            barAccidentals = {}; 
            continue;
        }
        let acc = match[2];
        const note = match[3];
        const oct = match[4];
        const durStr = match[5];
        const noteName = note.toUpperCase();

        if (acc) {
            if (acc === "=") acc = "";
            barAccidentals[noteName] = acc;
        } else {
            acc = barAccidentals.hasOwnProperty(noteName) ? barAccidentals[noteName] : (keyRules[noteName] || "");
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
        let ratio = notes[i].duration / notes[i-1].duration;
        let durRatio = Number(ratio.toFixed(1));
        fp.push(`${interval}:${durRatio}`);
    }
    return "|" + fp.join("|") + "|";
}

// --- LATAUS JA HAKU ---

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
        } catch (e) { console.error(e); }
    }
    if (loaderContainer) loaderContainer.style.display = 'none';
}

function handleSearch() {
    const abcEditor = document.getElementById('searchQuery');
    const input = abcEditor.value;
    
    ABCJS.renderAbc("search-preview", "L:1/4\nM:none\n" + input, { responsive: 'resize', scale: 0.7 });

    if (input.replace(/\s/g, "").length < 3) {
        document.getElementById('results-list').innerHTML = "";
        document.getElementById('match-count').innerText = "0";
        return;
    }

    let rawFP = getFingerprint(input);
    if (!rawFP) return;

    let searchIntervals = rawFP.split('|')
                               .filter(x => x.length > 0)
                               .map(x => x.split(':')[0])
                               .join('|');

    const matches = window.melodyLibrary.filter(t => {
        if (!t.fingerprint) return false;
        let libIntervals = t.fingerprint.split('|')
                                       .filter(x => x.length > 0)
                                       .map(x => x.split(':')[0])
                                       .join('|');
        return libIntervals.includes(searchIntervals);
    });

    const list = document.getElementById('results-list');
    document.getElementById('match-count').innerText = matches.length;
    list.innerHTML = "";

    matches.slice(0, 30).forEach(tune => {
        const div = document.createElement('div');
        div.className = 'tune-card';
        div.innerHTML = `<h3>${tune.name}</h3>`;
        div.onclick = () => {
            ABCJS.renderAbc("paper", tune.abc, { responsive: 'resize' });
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        };
        list.appendChild(div);
    });
}

// --- TAPAHTUMAT ---

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    const abcEditor = document.getElementById('searchQuery');

    // Kesto-napit
    document.querySelectorAll('.dur-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedDuration = btn.getAttribute('data-dur');
        });
    });

    // Piste-nappi
    document.getElementById('dot-btn').addEventListener('click', (e) => {
        isDottedMode = !isDottedMode;
        e.target.classList.toggle('active', isDottedMode);
    });

    // Etumerkki-napit
    document.querySelectorAll('.acc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedAccidental = btn.classList.contains('active') ? "" : btn.getAttribute('data-acc');
            document.querySelectorAll('.acc-btn').forEach(b => b.classList.remove('active'));
            if (selectedAccidental) btn.classList.add('active');
        });
    });

    // Nuotti-napit
    document.querySelectorAll('.note-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const note = btn.getAttribute('data-note');
            let dur = selectedDuration;
            
            if (isDottedMode && note !== 'z') {
                if (selectedDuration === "1") dur = "3/2";
                else if (selectedDuration === "2") dur = "3";
                else if (selectedDuration === "/2") dur = "3/4";
                else if (selectedDuration === "/4") dur = "3/8";
                
                isDottedMode = false;
                const dotBtn = document.getElementById('dot-btn');
                if (dotBtn) dotBtn.classList.remove('active');
            } else if (selectedDuration === "1") {
                dur = "";
            }

            const noteString = selectedAccidental + note + dur + " ";
            const start = abcEditor.selectionStart;
            const end = abcEditor.selectionEnd;
            abcEditor.value = abcEditor.value.slice(0, start) + noteString + abcEditor.value.slice(end);
            abcEditor.selectionStart = abcEditor.selectionEnd = start + noteString.length;
            
            selectedAccidental = "";
            document.querySelectorAll('.acc-btn').forEach(b => b.classList.remove('active'));
            
            abcEditor.focus();
            handleSearch();
        });
    });

    // Tekstikentän muutokset
    abcEditor.addEventListener('input', handleSearch);

    // Tyhjennys
    document.getElementById('clearSearch').addEventListener('click', () => {
        abcEditor.value = "";
        handleSearch();
    });
});
