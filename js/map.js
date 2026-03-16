export class MapComponent {
    constructor(data) {
        this.data = data;
        this.container = null;
        this.currentView = 'turkey';
    }

    render() {
        this.container = document.createElement('div');
        this.container.className = 'enhanced-map-wrapper';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.showTurkeyMap();
        return this.container;
    }

    showTurkeyMap() {
        this.currentView = 'turkey';
        this.container.innerHTML = '';
        const mapContainer = document.createElement('div');
        mapContainer.className = 'map-container';
        
        const svgContent = `
            <svg width="100%" height="100%" viewBox="0 0 800 350" preserveAspectRatio="xMidYMid meet" class="turkey-svg">
                <defs>
                    <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:var(--accent);stop-opacity:0.4" />
                        <stop offset="100%" style="stop-color:var(--accent-gold);stop-opacity:0.1" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="blur"/>
                        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                    </filter>
                </defs>
                <path class="turkey-detailed-path" d="M12.4,142.3c4.7-2,9.3-4.1,14-6.1c16.3-4.1,32.7-8.2,49-12.3c10.7,0.7,21.3,1.3,32,2
                    c6,5.3,12.1,10.6,18.1,15.9c3.1-3.1,6.1-6.2,9.2-9.2c16.7-7.2,33.5-14.3,50.2-21.5c15-0.7,30.1-1.5,45.1-2.2
                    c3.1,7,6.1,14,9.2,21c17.5,3.3,35,6.5,52.5,9.8c11.1-6.8,22.2-13.6,33.3-20.4c17.2,0.9,34.4,1.8,51.6,2.7
                    c8.1,3.4,16.2,6.7,24.3,10.1c11.9-4.2,23.8-8.4,35.6-12.6c18.1,5.1,36.2,10.2,54.3,15.3c15.2-1.9,30.3-3.9,45.5-5.8
                    c13,1.9,26.1,3.8,39.1,5.7c8.5,8.8,17,17.5,25.6,26.3c16,13.8,32,27.5,48.1,41.3c2.7,11.8,5.5,23.5,8.2,35.3
                    c-3.1,14.6-6.1,29.3-9.2,43.9c-10.7,13.1-21.4,26.2-32.1,39.2c-17,3.5-34,7.1-51,10.6c-18.7,4.3-37.5,8.7-56.2,13
                    c-16-2-32.1-4.1-48.1-6.1c-15,3-30.1,6.1-45.1,9.1c-17.2,0.6-34.4,1.3-51.6,1.9c-20.9-4.9-41.9-9.7-62.8-14.6
                    c-16.7-1.8-33.5-3.6-50.2-5.4c-20.4,4.6-40.8,9.2-61.2,13.7c-21.3-4.5-42.6-8.9-63.9-13.4c-17.5,1.5-35,3-52.5,4.5
                    c-21.8-8.8-43.5-17.6-65.3-26.4c-11.8,13-23.5,26.1-35.3,39.1c-13.4,2.9-26.7,5.8-40.1,8.7c-10.3-10.1-20.6-20.1-30.8-30.2
                    c-14.6-1.9-29.3-3.8-43.9-5.7c-10.3-9.5-20.6-19.1-30.8-28.6C9.1,180.5,10.7,161.4,12.4,142.3z" 
                    fill="url(#mapGradient)" stroke="var(--accent)" stroke-width="1.2" />
                <text x="50%" y="95%" fill="var(--text-accent)" font-size="12" text-anchor="middle" font-family="Outfit" style="letter-spacing:6px;opacity:0.4;font-weight:700">TÜRKİYE FRC ARENA</text>
            </svg>
        `;
        mapContainer.innerHTML = svgContent;

        const locations = {
            'Başakşehir, İstanbul': { x: 170, y: 145, color: 'var(--accent)' },
            'Ataköy, İstanbul': { x: 170, y: 155, color: 'var(--accent-gold)' },
            'Etimesgut, Ankara': { x: 380, y: 210, color: 'var(--accent)' },
            'Mersin': { x: 440, y: 280, color: 'var(--accent)' },
            'İzmir': { x: 100, y: 220, color: 'var(--accent-gold)' }
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
            label.innerHTML = `<span style="color:var(--accent-gold); font-weight:800">${r.name}</span><br><span style="font-size:0.7rem;opacity:0.8">${new Date(r.date).toLocaleDateString('tr-TR', {month:'long', day:'numeric'})}</span>`;
            
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
            <div class="venue-sim-container" style="height:200px; margin-top:20px;">
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
