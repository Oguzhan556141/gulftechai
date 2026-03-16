export class MapComponent {
    constructor(data) {
        this.data = data;
        this.container = null;
        this.currentView = 'turkey';
    }

    render() {
        this.container = document.createElement('div');
        this.container.className = 'enhanced-map-wrapper';
        this.showTurkeyMap();
        return this.container;
    }

    showTurkeyMap() {
        this.currentView = 'turkey';
        this.container.innerHTML = '';
        
        const mapContainer = document.createElement('div');
        mapContainer.className = 'map-container';
        
        // Detailed Turkey SVG (Custom Path)
        const svgContent = `
            <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet" class="turkey-svg">
                <defs>
                    <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:var(--accent);stop-opacity:0.2" />
                        <stop offset="100%" style="stop-color:var(--accent-bright);stop-opacity:0.05" />
                    </linearGradient>
                </defs>
                <path class="turkey-detailed-path" d="M11.6,183.1c11-9,22.1-18.1,33.1-27.1c8.4-1,16.8-2.1,25.2-3.1c4.5,4.5,9,9,13.4,13.4c5.1-4.7,10.2-9.4,15.3-14.1
                    c13-7.5,26.1-14.9,39.1-22.4c16.1-2.9,32.2-5.7,48.2-8.6c11.7,3,23.4,6,35.1,9c3,9.7,5.9,19.3,8.9,29c19,5.2,38,10.4,57,15.5
                    c13-11.2,26-22.3,39-33.5c18.1-1.4,36.1-2.9,54.2-4.3c15.2,4.8,30.3,9.5,45.5,14.3c16-5,32.1-9.9,48.1-14.9
                    c21,2.8,42,5.6,63.1,8.5c13.7-4.4,27.5-8.9,41.2-13.3c15.5,1.7,30.9,3.5,46.4,5.2c12.1,10.8,24.3,21.5,36.4,32.3
                    c16,13.9,32.1,27.9,48.1,41.8c2.9,13.1,5.7,26.1,8.6,39.2c-5.4,16-10.8,31.9-16.1,47.9c-11.4,14.5-22.8,29-34.1,43.5
                    c-19,3.8-37.9,7.6-56.9,11.5c-20.1,2.3-40.2,4.5-60.3,6.8c-18.9-3.4-37.9-6.7-56.8-10.1c-17,4-34,7.9-50.9,11.9
                    c-20,0.6-40.1,1.1-60.1,1.7c-21.8-6.1-43.6-12.2-65.4-18.3c-19.1-3-38.1-6-57.2-9.1c-22.5,4.5-45,9-67.5,13.5
                    c-22.6-6-45.2-12-67.8-18c-18.8,3.2-37.6,6.4-56.3,9.6c-24.1-10.1-48.1-20.2-72.2-30.3c-2,14.8-4,29.5-6.1,44.3
                    c-14.5,2.7-29,5.5-43.5,8.2c-12-11.5-24-23-36-34.5c-15.5-1.9-30.9-3.9-46.4-5.8c-11.5-10.3-22.9-20.6-34.4-30.9
                    C8.2,228.6,9.9,205.8,11.6,183.1z" 
                    fill="url(#mapGradient)" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="2 2" />
                <text x="50%" y="88%" fill="var(--accent-gold)" font-size="22" text-anchor="middle" font-family="Outfit" style="opacity:0.6;font-weight:700;letter-spacing:4px">GULFTECH #11392</text>
            </svg>
        `;
        mapContainer.innerHTML = svgContent;

        const locations = {
            'Ataköy, İstanbul': { x: 170, y: 145, color: 'var(--accent)' },
            'Ankara': { x: 380, y: 210, color: 'var(--accent-gold)' }
        };

        this.data.regionals.forEach(r => {
            const coords = locations[r.location] || { x: 180, y: 150 };
            const node = document.createElement('div');
            node.className = 'map-node pulsing-node';
            node.style.left = `${coords.x}px`;
            node.style.top = `${coords.y}px`;
            node.style.background = coords.color || 'var(--accent)';
            node.style.boxShadow = `0 0 20px ${coords.color || 'var(--accent)'}`;
            
            const label = document.createElement('div');
            label.className = 'map-node-label';
            label.innerHTML = `<span style="color:var(--accent-gold)">${r.name}</span><br><span style="font-size:0.7rem;opacity:0.8">${new Date(r.date).toLocaleDateString('tr-TR', {month:'long', day:'numeric'})}</span>`;
            
            node.appendChild(label);
            mapContainer.appendChild(node);
            node.addEventListener('click', () => this.showVenueView(r.location));
        });

        this.container.appendChild(mapContainer);
        
        const hint = document.createElement('div');
        hint.innerHTML = '<div class="map-hint-premium">Salon planı ve lojistik için bir şehre dokun 🦈</div>';
        this.container.appendChild(hint);

        const backBtn = document.getElementById('backToTurkey');
        if (backBtn) backBtn.style.display = 'none';
    }

    showVenueView(location) {
        this.currentView = 'venue';
        const venue = this.data.venues[location];
        if (!venue) return;

        this.container.innerHTML = `
            <div class="venue-header premium-header">
                <h2 class="venue-title">${venue.name}</h2>
                <p class="venue-address">📍 ${venue.address}</p>
            </div>
            <div class="venue-grid">
                <div class="venue-info-card glass-glow">
                    <h4 style="color:var(--accent-gold)">🏗️ Salon Yerleşim Planı</h4>
                    <ul class="venue-info-list">
                        <li><span class="info-label">Pits</span><span>${venue.floorPlan.pits}</span></li>
                        <li><span class="info-label">Oyun Sahası</span><span>${venue.floorPlan.field}</span></li>
                        <li><span class="info-label">Tribünler</span><span>${venue.floorPlan.stands}</span></li>
                        <li><span class="info-label">Yemek Alanı</span><span>${venue.floorPlan.food}</span></li>
                    </ul>
                </div>
                <div class="venue-info-card glass-glow">
                    <h4 style="color:var(--accent-gold)">🚚 Lojistik & Ulaşım</h4>
                    <ul class="venue-info-list">
                        <li><span class="info-label">Ulaşım</span><span>${venue.logistics.transport}</span></li>
                        <li><span class="info-label">Konaklama</span><span>${venue.logistics.accommodation}</span></li>
                        <li><span class="info-label">Notlar</span><span>${venue.logistics.notes}</span></li>
                    </ul>
                </div>
            </div>
            <div class="venue-sim-container">
                <div class="venue-visual-sim-premium">
                    <div class="sim-overlay">SALON PLANI YÜKLENİYOR...</div>
                </div>
            </div>
        `;

        const backBtn = document.getElementById('backToTurkey');
        if (backBtn) {
            backBtn.style.display = 'block';
            backBtn.onclick = () => this.showTurkeyMap();
        }
    }
}

export function renderMap(regionals) {
    const comp = new MapComponent({ regionals });
    return comp.render();
}
