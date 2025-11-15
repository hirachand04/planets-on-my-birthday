const referenceDate = new Date('2000-01-01T00:00:00Z');
const NASA_API_KEY = 'ixB2Rmk6Ii7vDIucR3xiWbbqj7LzVGyJ578EhuDS';
const svg = document.getElementById('solarSvg');
const dateInput = document.getElementById('dateInput');
const detailCard = document.getElementById('detailCard');
const selectedDateEl = document.getElementById('selectedDate');
const selectedWeekdayEl = document.getElementById('selectedWeekday');
const planetSummaryEl = document.getElementById('planetSummary');
const apodMedia = document.getElementById('apodMedia');
const apodTitle = document.getElementById('apodTitle');
const apodExplanation = document.getElementById('apodExplanation');
const apodText = document.getElementById('apodText');
const downloadApodBtn = document.getElementById('downloadApod');
const downloadSolarBtn = document.getElementById('downloadSolar');
const themeToggleBtn = document.getElementById('themeToggle');

const planets = [
    { key: 'mercury', color: getComputedStyle(document.documentElement).getPropertyValue('--mercury').trim() },
    { key: 'venus', color: getComputedStyle(document.documentElement).getPropertyValue('--venus').trim() },
    { key: 'earth', color: getComputedStyle(document.documentElement).getPropertyValue('--earth').trim() },
    { key: 'mars', color: getComputedStyle(document.documentElement).getPropertyValue('--mars').trim() },
    { key: 'jupiter', color: getComputedStyle(document.documentElement).getPropertyValue('--jupiter').trim() },
    { key: 'saturn', color: getComputedStyle(document.documentElement).getPropertyValue('--saturn').trim() },
    { key: 'uranus', color: getComputedStyle(document.documentElement).getPropertyValue('--uranus').trim() },
    { key: 'neptune', color: getComputedStyle(document.documentElement).getPropertyValue('--neptune').trim() }
];

let orbitalPeriods = null;
let svgState = null;
let lastApodData = null;

function loadOrbitalPeriods() {
    return fetch('data/orbital_periods.json').then(r => r.json());
}

function daysSinceReference(date) {
    const d = new Date(date);
    const ms = d.getTime() - referenceDate.getTime();
    return ms / 86400000;
}

function anglesForDate(date) {
    const days = daysSinceReference(date);
    const out = {};
    for (const [k, period] of Object.entries(orbitalPeriods)) {
        const mod = ((days % period) + period) % period;
        out[k] = mod / period * 360;
    }
    return out;
}

function ensureSvgBase() {
    if (svgState) return;
    const size = 600;
    const cx = size / 2;
    const cy = size / 2;
    const sun = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    sun.setAttribute('class', 'sun');
    sun.setAttribute('cx', cx);
    sun.setAttribute('cy', cy);
    sun.setAttribute('r', 16);
    svg.appendChild(sun);
    const baseStep = 32;
    const radii = planets.map((_, i) => baseStep * (i + 2));
    const orbits = [];
    const bodies = [];
    const labels = [];
    for (let i = 0; i < planets.length; i++) {
        const orbit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        orbit.setAttribute('class', 'orbit');
        orbit.setAttribute('cx', cx);
        orbit.setAttribute('cy', cy);
        orbit.setAttribute('r', radii[i]);
        svg.appendChild(orbit);
        orbits.push(orbit);
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        body.setAttribute('r', 6);
        body.setAttribute('fill', planets[i].color);
        svg.appendChild(body);
        bodies.push(body);
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('class', 'planet-label');
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('alignment-baseline', 'hanging');
        label.textContent = planets[i].key;
        svg.appendChild(label);
        labels.push(label);
    }
    svgState = { size, cx, cy, radii, orbits, bodies, labels };
}

function renderAngles(angles) {
    ensureSvgBase();
    const { cx, cy, radii, bodies, labels } = svgState;
    const summary = [];
    for (let i = 0; i < planets.length; i++) {
        const p = planets[i];
        const angle = angles[p.key];
        const rad = angle * Math.PI / 180;
        const r = radii[i];
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        bodies[i].setAttribute('cx', x);
        bodies[i].setAttribute('cy', y);
        const labelY = y + 6 + 8;
        labels[i].setAttribute('x', x);
        labels[i].setAttribute('y', labelY);
        summary.push(p.key + ': ' + angle.toFixed(1) + '°');
    }
    planetSummaryEl.textContent = summary.join(', ');
    showFade(svg);
    showFade(detailCard);
}

function showFade(el) {
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
}

function formatDateISO(date) {
    const d = new Date(date);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

function weekdayName(date) {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, { weekday: 'long' });
}

function getInitialTheme(){
    const saved = localStorage.getItem('theme');
    if(saved) return saved;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}

function currentPlanetColor(key){
    return getComputedStyle(document.documentElement).getPropertyValue('--' + key).trim();
}

function updatePlanetColors(){
    if(!svgState) return;
    for(let i=0;i<planets.length;i++){
        const key = planets[i].key;
        const color = currentPlanetColor(key);
        svgState.bodies[i].setAttribute('fill', color);
    }
}

function applyTheme(theme){
    document.documentElement.setAttribute('data-theme', theme);
    updatePlanetColors();
}

function toggleTheme(){
    const current = document.documentElement.getAttribute('data-theme') || getInitialTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    applyTheme(next);
}

function getApiKey() {
    return NASA_API_KEY;
}

function fetchApod(date) {
    const iso = formatDateISO(date);
    const key = getApiKey();
    const url = `https://api.nasa.gov/planetary/apod?date=${iso}&api_key=${encodeURIComponent(key)}&thumbs=true`;
    return fetch(url).then(r => {
        if (!r.ok) throw new Error('APOD fetch failed');
        return r.json();
    }).then(data => {
        lastApodData = data;
        apodTitle.textContent = data.title || 'Untitled';
        apodExplanation.textContent = data.explanation || '';
        apodMedia.innerHTML = '';
        if (data.media_type === 'image') {
            const img = document.createElement('img');
            img.src = data.url;
            img.alt = data.title || '';
            apodMedia.appendChild(img);
        } else if (data.media_type === 'video') {
            if (data.thumbnail_url) {
                const img = document.createElement('img');
                img.src = data.thumbnail_url;
                img.alt = data.title || '';
                apodMedia.appendChild(img);
            } else {
                const iframe = document.createElement('iframe');
                iframe.src = data.url;
                iframe.loading = 'lazy';
                iframe.allowFullscreen = true;
                apodMedia.appendChild(iframe);
            }
        }
        showFade(apodMedia);
        showFade(apodText);
    }).catch(() => {
        apodTitle.textContent = 'APOD unavailable';
        apodExplanation.textContent = 'Check your API key or try again later.';
        apodMedia.innerHTML = '';
        showFade(apodMedia);
        showFade(apodText);
    });
}

function downloadApod() {
    if (!lastApodData) return;
    let url = null;
    if (lastApodData.media_type === 'image') {
        url = lastApodData.hdurl || lastApodData.url;
    } else {
        url = lastApodData.thumbnail_url || lastApodData.url;
    }
    if (!url) return;
    const iso = selectedDateEl.textContent || formatDateISO(referenceDate);
    const extGuess = (url.split('.').pop() || 'jpg').split('?')[0];
    const a = document.createElement('a');
    a.href = url;
    a.download = `apod-${iso}.${extGuess}`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
}

function solarSvgDataUrl() {
    const clone = svg.cloneNode(true);
    const styles = getComputedStyle(document.documentElement);
    const orbitColor = styles.getPropertyValue('--orbit').trim();
    const sunColor = styles.getPropertyValue('--sun').trim();
    const labelColor = styles.getPropertyValue('--muted').trim();
    clone.querySelectorAll('.orbit').forEach(c => {
        c.setAttribute('stroke', orbitColor);
        c.setAttribute('fill', 'none');
        c.setAttribute('stroke-width', '1.5');
    });
    const sunEl = clone.querySelector('.sun');
    if (sunEl) sunEl.setAttribute('fill', sunColor);
    clone.querySelectorAll('.planet-label').forEach(t => {
        t.setAttribute('fill', labelColor);
        t.setAttribute('font-size', '10');
    });
    const serializer = new XMLSerializer();
    const src = serializer.serializeToString(clone);
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
}

function downloadSolar() {
    const dataUrl = solarSvgDataUrl();
    const img = new Image();
    img.onload = () => {
        const scale = 3;
        const w = 600 * scale;
        const h = 600 * scale;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0b0f1a';
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const iso = selectedDateEl.textContent || formatDateISO(referenceDate);
            const a = document.createElement('a');
            a.href = url;
            a.download = `planets-${iso}.jpg`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 2000);
        }, 'image/jpeg', 0.98);
    };
    img.src = dataUrl;
}

function onDateSelected() {
    const val = dateInput.value;
    if (!val) return;
    const d = new Date(val + 'T00:00:00Z');
    selectedDateEl.textContent = formatDateISO(d);
    selectedWeekdayEl.textContent = weekdayName(d);
    const angles = anglesForDate(d);
    renderAngles(angles);
    fetchApod(d);
}

function init() {
    loadOrbitalPeriods().then(data => {
        orbitalPeriods = data;
        const placeholderDate = referenceDate;
        selectedDateEl.textContent = formatDateISO(placeholderDate);
        selectedWeekdayEl.textContent = weekdayName(placeholderDate);
        const angles = anglesForDate(placeholderDate);
        renderAngles(angles);
        showFade(svg);
    });
    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);
    dateInput.addEventListener('change', onDateSelected);
    if (downloadApodBtn) downloadApodBtn.addEventListener('click', downloadApod);
    if (downloadSolarBtn) downloadSolarBtn.addEventListener('click', downloadSolar);
    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
}

document.addEventListener('DOMContentLoaded', init);