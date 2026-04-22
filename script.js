// 0. Nostetaan CodePenin aikarajaa heti alussa (10 sekuntiin)
window.CP.PenTimer.MAX_TIME_IN_LOOP_WO_EXIT = 10000;

window.melodyLibrary = [];

// 1. Määritellään URL-osoitteet vain KERRAN koodin alussa
const urls = [
    "sessionSet01.js", "sessionSet02.js", "sessionSet03.js", "sessionSet04.js",
    "sessionSet05.js", "sessionSet06.js", "sessionSet07.js", "sessionSet08.js",
    "sessionSet09.js", "sessionSet10.js", "sessionSet11.js", "sessionSet12.js",
    "sessionSet13.js", "sessionSet14.js", "sessionSet15.js", "sessionSet16.js",
    "sessionSet17.js", "sessionSet18.js", "folkwikiSet1.js", "folkwikiSet2.js",
    "folkwikiSet3.js", "fsfolkdiktning02.js", "fsfolkdiktning01.js", "extrasetti5.js"
];

// 2. Apufunktiot sävelkorkeudelle ja sormenjäljelle
function getPitchValue(acc, note, oct) {
    const basePitches = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11, 'H': 11 };
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


// 3. Sovelluksen alustus (sisältää viiveen CodePeniä varten)
async function initApp() {
    const loaderContainer = document.getElementById("loader-container");
    const loaderBar = document.getElementById("loader-bar");
    const loaderPercent = document.getElementById("loader-percent");
    
    console.log("Aloitetaan lataus: " + urls.length + " tietokantaa...");

    for (let i = 0; i < urls.length; i++) {
        try {
            const response = await fetch(urls[i]);
            if (!response.ok) throw new Error("HTTP " + response.status);
            
            const text = await response.text();
            const startIdx = text.indexOf('[');
            const endIdx = text.lastIndexOf(']');
            
            if (startIdx !== -1 && endIdx !== -1) {
                const rawList = text.substring(startIdx, endIdx + 1);
                const data = new Function('return ' + rawList)(); 
                
                if (Array.isArray(data)) {
                    data.forEach(tune => {
                        if (tune.abc) {
                            tune.fingerprint = getFingerprint(tune.abc);
                            window.melodyLibrary.push(tune);
                        }
                    });
                }
            }

            // --- LATAUSPALKIN PÄIVITYS ---
            const progress = Math.round(((i + 1) / urls.length) * 100);
            if (loaderBar) loaderBar.style.width = progress + "%";
            if (loaderPercent) loaderPercent.textContent = progress + "%";

            // Pieni viive CodePeniä varten ja jotta ehdit nähdä palkin liikkuvan
            await new Promise(resolve => setTimeout(resolve, 30));

        } catch (e) {
            console.error("Virhe: " + urls[i], e);
        }
    }

    console.log("Valmis! Kirjastossa on " + window.melodyLibrary.length + " kappaletta.");
    
    // Piilotetaan latauspalkki kun valmista
    if (loaderContainer) {
        setTimeout(() => {
            loaderContainer.style.display = 'none';
        }, 500); // Puolen sekunnin viive, jotta 100% ehtii näkyä
    }
}

// 4. Hakutoiminto
function handleSearch(e) {
    const input = e.target.value;
    ABCJS.renderAbc("search-preview", "L:1/4\nM:none\n" + input, { responsive: 'resize', scale: 0.7 });

    const searchInputClean = input.replace(/\s/g, "");
    if (searchInputClean.length < 3) {
        document.getElementById('results-list').innerHTML = "";
        document.getElementById('match-count').innerText = "0";
        return;
    }

    // Puhdistetaan hakusormenjälki (poistetaan reunaviivat vertailua varten)
    let searchFP = getFingerprint(input).replace(/^\|/, "").replace(/\|$/, "");
    if (!searchFP) return;

    const matches = window.melodyLibrary.filter(t => t.fingerprint && t.fingerprint.includes(searchFP));
    
    const list = document.getElementById('results-list');
    document.getElementById('match-count').innerText = matches.length;
    list.innerHTML = "";

    matches.slice(0, 30).forEach(tune => {
        // 1. Etsitään sävellaji (kuten aiemmin)
        let displayKey = tune.key;
        if (!displayKey && tune.abc) {
            const keyMatch = tune.abc.match(/^K:\s*([A-Ga-g][#b]?\s*[A-Za-z]*)/m);
            displayKey = keyMatch ? keyMatch[1] : "??";
        }

        // 2. Lasketaan alkamistahti
        // Lasketaan alkamistahti
const fpIndex = tune.fingerprint.indexOf(searchFP);
const stringBeforeMatch = tune.fingerprint.substring(0, fpIndex);
        
        // Lasketaan kuinka monta pystyviivaa eli tahtia on ennen osumaa. 
     // Vähennetään 1, jotta alusta alkava melodia on tahdissa 1
const startMeasure = stringBeforeMatch.split('|').length - 1;

// Varmistetaan vielä, ettei luku mene alle yhden (esim. virhetilanteissa)
const finalMeasure = Math.max(1, startMeasure);

        const div = document.createElement('div');
        div.className = 'tune-card';
        // Lisätään alkamistahti näkyviin sävellajin viereen
        div.innerHTML = `
            <h3>${tune.name}</h3>
            <div style="font-size: 0.9em; color: #666;">
                <span>K: ${displayKey}</span> | 
                <span>Alkamistahti: ${startMeasure}</span>
            </div>
        `;
        
        div.onclick = () => {
            ABCJS.renderAbc("paper", tune.abc, { responsive: 'resize' });
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        };
        list.appendChild(div);
    });
}

window.currentDur = "1"; // Oletuskesto

function setupClickHandlers(visualObj) {
    const svg = document.querySelector("#paper svg");
    if (!svg) return;

    svg.addEventListener('click', function(e) {
        // Lasketaan klikkauskohta suhteessa viivastoon
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

        // Tämä on yksinkertaistettu logiikka sävelen laskemiseen (Y-koordinaatti)
        // ABCJS:n koordinaatistossa välit ovat n. 6-10 yksikköä
        // Tässä tarvitaan kalibrointi viivaston nollakohtaan
        const pitch = calculatePitchFromY(svgP.y);
        
        if (pitch) {
            appendNoteToAbc(pitch, window.currentDur);
        }
    });
}

function appendNoteToAbc(pitch, duration) {
    const editor = document.getElementById('abc-editor'); // Tai missä tekstisi on
    const newNote = pitch + duration + " ";
    editor.value += newNote;
    
    // Päivitetään nuottikuva heti
    processAbc(); 
}

// Globaalit muuttujat syöttöä varten
let selectedDuration = "1";

document.addEventListener('DOMContentLoaded', () => {
    const abcEditor = document.querySelector('textarea'); // Varmista että täsmää id/luokkaan
    
    // 1. Keston valinnan hallinta
    const durBtns = document.querySelectorAll('.dur-btn');
    durBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            durBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedDuration = btn.getAttribute('data-dur');
        });
    });

    // 2. Nuottien syöttö paneelista
   const noteBtns = document.querySelectorAll('.note-btn');
noteBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const note = btn.getAttribute('data-note');
        const abcEditor = document.getElementById('searchQuery'); // Varmista, että ID on oikea (Gistissäsi se on searchQuery)
        
        if (!abcEditor) return;

        // Rakennetaan nuotti valitulla kestolla
        const noteString = note + (selectedDuration === "1" ? "" : selectedDuration) + " ";
        
        // 1. Lisätään teksti kursorin kohdalle
        const start = abcEditor.selectionStart;
        const end = abcEditor.selectionEnd;
        const text = abcEditor.value;
        abcEditor.value = text.slice(0, start) + noteString + text.slice(end);
        
        // 2. Siirretään kursori uuden nuotin perään
        abcEditor.selectionStart = abcEditor.selectionEnd = start + noteString.length;
        abcEditor.focus();

        // --- TÄRKEÄ KORJAUS ---
        // 3. Kutsutaan funktiota, joka piirtää nuotit viivastolle
        if (typeof processAbc === 'function') {
            processAbc();
        }
        
        // 4. Jos kyseessä on hakukenttä, laukaistaan myös haku manuaalisesti
        // (Tämä varmistaa, että hakutulokset päivittyvät heti)
        const event = new Event('input', { bubbles: true });
        abcEditor.dispatchEvent(event);
         
        });
    });
});



// Rekisteröidään Service Worker heti
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('Service Worker rekisteröity!', reg))
        .catch(err => console.log('Service Worker virhe:', err));
}
// 5. Käynnistys kun sivu on ladattu
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    const searchInput = document.getElementById('searchQuery');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
});
