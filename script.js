window.melodyLibrary = [];

const urls = [
    "sessionSet01.js", "sessionSet02.js", "sessionSet03.js", "sessionSet04.js",
    "sessionSet05.js", "sessionSet06.js", "sessionSet07.js", "sessionSet08.js",
    "sessionSet09.js", "sessionSet10.js", "sessionSet11.js", "sessionSet12.js",
    "sessionSet13.js", "sessionSet14.js", "sessionSet15.js", "sessionSet16.js",
    "sessionSet17.js", "sessionSet18.js", "folkwikiSet1.js", "folkwikiSet2.js",
    "folkwikiSet3.js", "fsfolkdiktning01.js", "esavelmat_kansantanssit.js", 
    "esavelmat_kjs.js", "esavelmat_rs1.js", "esavelmat_rs2.js", "esavelmat_hs1.js",
    "esavelmat_ls1.js", "esavelmat_ls2.js", "esavelmat_ls3.js", "esavelmat_ls4.js",
    "suomitest3.js", "fsfolkdiktning02.js", "FinnishTunes.js", "FinnishTunes2.js", 
    "swedish2.js", "norway1.js", "extrasetti5.js"
];

let selectedDuration = "1";
let selectedAccidental = ""; 
let isDottedMode = false;
let synthControl;
let currentAbc;
let visualObj; // Globaali muuttuja temposäädintä varten
let currentWarp = 1.0;

// --- TEMPOFUNKTIO ---
function changeTempo(newBpm) {
    if (!synthControl || !visualObj) return;
    const bpm = parseInt(newBpm);
    const wasPlaying = synthControl.status === "playing";

    synthControl.setTune(visualObj, false, { bpm: bpm })
        .then(() => {
            console.log("Tempo asetettu: " + bpm);
            if (wasPlaying) {
                synthControl.play(); 
            }
            if (document.getElementById('tempoDisplay')) {
                document.getElementById('tempoDisplay').innerText = bpm;
            }
        })
        .catch(err => console.warn("Virhe tempon päivityksessä:", err));
}

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

function playSingleNote(noteAbc) {
    if (!ABCJS.synth.supportsAudio()) return;
    const singleNoteVisual = ABCJS.renderAbc("hidden-paper", "L:1/4\n" + noteAbc, { style: "display:none" })[0];
    const midiContext = new (window.AudioContext || window.webkitAudioContext)();
    const synth = new ABCJS.synth.CreateSynth();

    synth.init({
        visualObj: singleNoteVisual,
        audioContext: midiContext
    }).then(() => {
        return synth.prime();
    }).then(() => {
        synth.start();
        setTimeout(() => {
            synth.stop();
            if (midiContext.state !== 'closed') midiContext.close();
        }, 500);
    }).catch(err => console.warn("Nuotin soitto epäonnistui:", err));
}

function getFingerprint(abc) {
    if (!abc) return "";
    abc = abc.replace(/[><]/g, " ").replace(/[:\[\]{}]/g, "");
    const keyMatch = abc.match(/^K:\s*([A-G][#b]?)\s*([A-Za-z]*)/m);
    let root = keyMatch ? keyMatch[1] : "C";
    let mode = keyMatch && keyMatch[2] ? keyMatch[2].toLowerCase() : "maj";

    const modeOffsets = { 'maj': 0, 'major': 0, 'ion': 0, 'mix': -1, 'lyd': 1, 'dor': -2, 'min': -3, 'm': -3, 'aeo': -3, 'phr': -4, 'loc': -5 };
    const circleOfFifths = { 'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6, 'C#': 7, 'F': -1, 'Bb': -2, 'Eb': -3, 'Ab': -4, 'Db': -5, 'Gb': -6, 'Cb': -7 };

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
        if (match[1] === '|') { barAccidentals = {}; continue; }
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
            } else { duration = parseFloat(durStr); }
        }
        notes.push({ pitch, duration });
    }

    if (notes.length < 2) return "";
    let fp = [];
    for (let i = 1; i < notes.length; i++) {
        let interval = notes[i].pitch - notes[i-1].pitch;
        let ratio = Number((notes[i].duration / notes[i-1].duration).toFixed(1));
        fp.push(`${interval}:${ratio}`);
    }
    return "|" + fp.join("|") + "|";
}

async function initApp() {
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
        } catch (e) { console.error(e); }
    }
    if (loaderContainer) loaderContainer.style.display = 'none';
}

function handleSearch() {
    const abcEditor = document.getElementById('searchQuery');
    const input = abcEditor.value;
    const searchBtn = document.getElementById('search-btn');

    if (input.replace(/\s/g, "").length < 3) {
        alert("Kirjoita vähintään 3 nuottia ennen hakua.");
        return;
    }

    searchBtn.innerText = "Etsitään...";
    searchBtn.disabled = true;

    setTimeout(() => {
        let rawFP = getFingerprint(input);
        if (!rawFP) {
            searchBtn.innerText = "Hae kappaleita";
            searchBtn.disabled = false;
            return;
        }

        let searchIntervals = rawFP.split('|').filter(x => x.length > 0).map(x => x.split(':')[0]).join('|');

        const matches = window.melodyLibrary.filter(t => {
            if (!t.fingerprint) return false;
            let libIntervals = t.fingerprint.split('|').filter(x => x.length > 0).map(x => x.split(':')[0]).join('|');
            return libIntervals.includes(searchIntervals);
        });

        const list = document.getElementById('results-list');
        document.getElementById('match-count').innerText = matches.length;
        list.innerHTML = "";

        matches.slice(0, 50).forEach(tune => {
            const div = document.createElement('div');
            div.className = 'tune-card';
            div.innerHTML = `<h3>${tune.name}</h3>`;
            
            div.onclick = function() {
                currentAbc = tune.abc;
                if (synthControl) synthControl.pause();
                
                const audioContainer = document.getElementById('audio-controls');
                audioContainer.innerHTML = "";
                audioContainer.style.display = 'block';

                const abcWithTempo = tune.abc.includes("Q:") ? tune.abc : "Q:100\n" + tune.abc;
                visualObj = ABCJS.renderAbc("paper", abcWithTempo, { responsive: 'resize', paddingbottom: 30 })[0];

                if (ABCJS.synth.supportsAudio()) {
                    const synth = new ABCJS.synth.CreateSynth();
                    synth.init({ 
                        visualObj: visualObj,
                        audioContext: new (window.AudioContext || window.webkitAudioContext)() 
                    }).then(() => {
                        if (!synthControl) synthControl = new ABCJS.synth.SynthController();
                        synthControl.load("#audio-controls", null, { displayRestart: true, displayPlay: true, displayProgress: true, displayWarp: true });
                        const currentBpm = parseInt(document.getElementById('tempoRange').value) || 100;
                        return synthControl.setTune(visualObj, false, { bpm: currentBpm });
                    });
                }
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            };
            list.appendChild(div);
        });
        searchBtn.innerText = "Hae kappaleita";
        searchBtn.disabled = false;
    }, 50);
}

// --- TAPAHTUMANKUUNTELIJAT ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();

    const tempoRange = document.getElementById('tempoRange');
    const tempoDisplay = document.getElementById('tempoDisplay');
    const abcEditor = document.getElementById('searchQuery');

    if (tempoRange) {
        tempoRange.addEventListener('input', () => {
            const newBpm = tempoRange.value;
            if (tempoDisplay) tempoDisplay.innerText = newBpm;
            changeTempo(newBpm);
        });
    }

    if (abcEditor) {
        abcEditor.addEventListener('input', () => {
            ABCJS.renderAbc("search-preview", "L:1/4\nM:none\n" + abcEditor.value, { responsive: 'resize', scale: 0.7 });
        });
    }

    document.querySelectorAll('.dur-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedDuration = btn.getAttribute('data-dur');
        });
    });

    const dotBtn = document.getElementById('dot-btn');
    if (dotBtn) {
        dotBtn.addEventListener('click', () => {
            isDottedMode = !isDottedMode;
            dotBtn.classList.toggle('active', isDottedMode);
        });
    }

    document.querySelectorAll('.acc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedAccidental = btn.classList.contains('active') ? "" : btn.getAttribute('data-acc');
            document.querySelectorAll('.acc-btn').forEach(b => b.classList.remove('active'));
            if (selectedAccidental) btn.classList.add('active');
        });
    });

    document.querySelectorAll('.note-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const note = btn.getAttribute('data-note');
            playSingleNote(selectedAccidental + note);
            let dur = selectedDuration;
            if (isDottedMode && note !== 'z') {
                const dotMap = { "1": "3/2", "2": "3", "/2": "3/4", "/4": "3/8" };
                dur = dotMap[selectedDuration] || dur;
                isDottedMode = false;
                if (dotBtn) dotBtn.classList.remove('active');
            } else if (selectedDuration === "1") {
                dur = "";
            }
            const noteString = selectedAccidental + note + dur + " ";
            const start = abcEditor.selectionStart;
            abcEditor.value = abcEditor.value.slice(0, start) + noteString + abcEditor.value.slice(abcEditor.selectionEnd);
            abcEditor.selectionStart = abcEditor.selectionEnd = start + noteString.length;
            selectedAccidental = "";
            document.querySelectorAll('.acc-btn').forEach(b => b.classList.remove('active'));
            abcEditor.focus();
            ABCJS.renderAbc("search-preview", "L:1/4\nM:none\n" + abcEditor.value, { responsive: 'resize', scale: 0.7 });
        });
    });

    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);

    const backspaceBtn = document.getElementById('backspace-btn');
    if (backspaceBtn) {
        backspaceBtn.addEventListener('click', () => {
            const start = abcEditor.selectionStart;
            if (start > 0) {
                abcEditor.value = abcEditor.value.slice(0, start - 1) + abcEditor.value.slice(abcEditor.selectionEnd);
                abcEditor.selectionStart = abcEditor.selectionEnd = start - 1;
            }
            ABCJS.renderAbc("search-preview", "L:1/4\nM:none\n" + abcEditor.value, { responsive: 'resize', scale: 0.7 });
            abcEditor.focus();
        });
    }

    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            abcEditor.value = "";
            document.getElementById('results-list').innerHTML = "";
            document.getElementById('match-count').innerText = "0";
            ABCJS.renderAbc("search-preview", ""); 
        });
    }
});
