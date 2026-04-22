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
    let clean = abc.replace(/^[A-Z]:.*/gm, "").replace(/"[^"]*"/g, "").replace(/\{[^}]*\}/g, "").replace(/[|\[\]\s]/g, "");
    const regex = /([\^_=]?)([A-Ga-gHh])([,']*)([0-9/]*)/g;
    let notes = [];
    let match;
    while ((match = regex.exec(clean)) !== null) {
        let pitch = getPitchValue(match[1], match[2], match[3]);
        let durStr = match[4];
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
        div.innerHTML = `
            <h3>${tune.name}</h3>
            <div style="font-size: 0.9em; color: #666;">
                <span>K: ${displayKey}</span> | <span>Alkamistahti: ${startMeasure}</span>
            </div>
        `;
        div.onclick = () => {
            ABCJS.renderAbc("paper", tune.abc, { responsive: 'resize' });
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        };
        list.appendChild(div);
    });
}

// --- TAPAHTUMANKÄSITTELIJÄT ---

document.addEventListener('DOMContentLoaded', () => {
    initApp();

    const abcEditor = document.getElementById('searchQuery');
    const clearBtn = document.getElementById('clearSearch');
    const durBtns = document.querySelectorAll('.dur-btn');
    const noteBtns = document.querySelectorAll('.note-btn');

    if (abcEditor) {
        abcEditor.addEventListener('input', handleSearch);
    }

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

    noteBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const note = btn.getAttribute('data-note');
            const noteString = note + (selectedDuration === "1" ? "" : selectedDuration) + " ";
            const start = abcEditor.selectionStart;
            abcEditor.value = abcEditor.value.slice(0, start) + noteString + abcEditor.value.slice(abcEditor.selectionEnd);
            abcEditor.selectionStart = abcEditor.selectionEnd = start + noteString.length;
            abcEditor.focus();
            handleSearch();
        });
    });
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(console.error);
}
