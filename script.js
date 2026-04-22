// 0. Nostetaan CodePenin aikarajaa heti alussa (10 sekuntiin)
window.CP.PenTimer.MAX_TIME_IN_LOOP_WO_EXIT = 10000;

window.melodyLibrary = [];

// 1. Määritellään URL-osoitteet vain KERRAN koodin alussa
const urls = [
    "https://gist.githubusercontent.com/janneojajarvi/af644185586173aa730845768853cae7/raw/6eedf654c2a566f114d1500966fbff742dca6f9a/sessionSet01.js",
    "https://gist.githubusercontent.com/janneojajarvi/4c1d2db5969d829904ba9c0fdaa54c58/raw/0e91777c9aeb15867932ad76cf6d010beeb1192a/sessionSet02.js",
    "https://gist.githubusercontent.com/janneojajarvi/cfe73575c263c347ac4d965068cb9eb3/raw/c09b858904d5237813817364b6d2c0942569cba5/sessionSet03.js",
    "https://gist.githubusercontent.com/janneojajarvi/46f13049d9cbae926802be8a95b7eb5e/raw/13215b1c32744eb1369f523bb1397569c79e7414/sessionSet04.js",
    "https://gist.githubusercontent.com/janneojajarvi/4c7b52b826f21b46dff8676827c3e10b/raw/c5f59ec9f04217ac4eb61a654b3fa07e5d3d0b9b/sessionSet05.js",
    "https://gist.githubusercontent.com/janneojajarvi/89558ec48805f4f732c820463fb4c19f/raw/85dcc170db09390e5139b0a0d37cb0510998d5f5/sessionSet06.js",
    "https://gist.githubusercontent.com/janneojajarvi/31bc330b464b2b6b15b923e3e497764d/raw/29e6de3abf1bf2735197f52762647e4fa15e8d2c/sessionSet07.js",
    "https://gist.githubusercontent.com/janneojajarvi/2370235f953421f816db9b8a2803ec52/raw/ef5698bb882ffaaf6ee9d323f99f5ad82828c43f/sessionSet08.js",
    "https://gist.githubusercontent.com/janneojajarvi/78b5496c73337484dcb9ae6e383806a2/raw/ede541b9ad054f2e426e4b2af531523f715de380/sessionSet09.js",
    "https://gist.githubusercontent.com/janneojajarvi/a71451137634b51cae660eaeed3430ad/raw/70ffa030c06a5e221d854b2139cf3d8eb3c6c9e2/sessionSet10.js",
    "https://gist.githubusercontent.com/janneojajarvi/a25ff25c5f5189ec2060e12f58b70bc7/raw/d129881b960db55ffb30352ddfec30f9b13fef6b/sessionSet11.js",
    "https://gist.githubusercontent.com/janneojajarvi/ad79fec4b5bd5eeba9786fe6e1e0dc5e/raw/9c14e78846afa05c240240d1b4a1edf336e93364/sessionSet12.js",
    "https://gist.githubusercontent.com/janneojajarvi/76274bcff2e3a632998256d6cdbd347e/raw/86c72e0c113a122b95a5b23af4500b79a0ebc9fa/sessionSet13.js",
    "https://gist.githubusercontent.com/janneojajarvi/d1567bf9bc935dac0aeceac182554fcf/raw/292027103381d8dee9539550307639e1c9781f47/sessionSet14.js",
    "https://gist.githubusercontent.com/janneojajarvi/360e2cf4691030329245d4dc25123550/raw/4f17ea6dd3db27dcc0f130fb95be47b419118b87/sessionSet15.js",
    "https://gist.githubusercontent.com/janneojajarvi/3839c39d9e4be3f39adaecc0ea3d5318/raw/29d65213ff131913af4c59d5d36cd6ff2389278c/sessionSet16.js",
    "https://gist.githubusercontent.com/janneojajarvi/74e11c0af59247cf5c974996dafd9e3e/raw/28ce132f8d4809705f751c34ad676c177f1aa081/sessionSet17.js",
    "https://gist.githubusercontent.com/janneojajarvi/426a5f6bc7e1a4657132a5c124cd4344/raw/a11534d29ceb297d1c3b99dd895b8d440fd1019b/sessionSet18.js",
    "https://gist.githubusercontent.com/janneojajarvi/daa48d8a5429539148525aecec2e6039/raw/40ac06dc024cc2b344b911e046bfa2046c60b669/folkwikiSet1.js",
    "https://gist.githubusercontent.com/janneojajarvi/b48805f16099426ecf2ebd16eaed78e8/raw/c2a3cc03be8134fc6ffc143b6f48cde90a4808bf/folkwikiSet2.js",
    "https://gist.githubusercontent.com/janneojajarvi/1af08b867b7d5aba6d233e4ce509a32a/raw/74d8e08d28947afc46dd89363a2249ced549a298/folkwikiSet3.js",
    "https://gist.githubusercontent.com/janneojajarvi/71cdf9dff96ed8dfc58d8e4fc751f2c6/raw/99c8b1579eb60985d4d21fc8723a115eaee4d629/fsfolkdiktning02.js",
    "https://gist.githubusercontent.com/janneojajarvi/c4d86dfb78294278394e0f744a06d079/raw/350d615df7ed4de642c77b8c7c421351b0a51bcd/fsfolkdiktning01.js",
    "https://gist.githubusercontent.com/janneojajarvi/92e2cb8563d91579c164961351b9c255/raw/45c8d6cf2bc7eef4ecdc404e62c1a2dbff43ae6c/extrasetti5.js"
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
