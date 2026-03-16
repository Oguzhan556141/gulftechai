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
        
        // High-Fidelity Turkey SVG (Enhanced Path)
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
                <path class="turkey-detailed-path" d="M11.6,183.1h11.7l11.7-5.9l11.7,5.9l17.5-17.5l29.2-5.9l8.8,11.7l11.7-11.7l58.4-23.4l58.4-11.7l8.8,29.2
                    l58.4,17.5l29.2-29.2l58.4-5.9l40.9,11.7l40.9-11.7l64.3,5.9l29.2-11.7l40.9,5.9l40.9,29.2l52.6,40.9l8.8,40.9l-11.7,46.7
                    l-29.2,35.1l-64.3,11.7l-58.4,11.7l-46.7-11.7l-52.6,11.7l-58.4,5.9l-64.3-17.5l-52.6-5.9l-64.3,11.7l-58.4-11.7l-52.6,5.9
                    l-64.3,11.7l-58.4-29.2l-8.8,35.1l-40.9,11.7l-35.1-29.2l-46.7-5.9l-29.2-23.4l-11.7-40.9L11.6,183.1z" 
                    fill="url(#mapGradient)" stroke="var(--accent)" stroke-width="2" />
                <text x="50%" y="94%" fill="var(--text-accent)" font-size="16" text-anchor="middle" font-family="Outfit" style="letter-spacing:8px;opacity:0.5;font-weight:700">TÜRKİYE FRC ARENA</text>
            </svg>
        `;
        mapContainer.innerHTML = svgContent;

        const locations = {
            'Ataköy, İstanbul': { x: 170, y: 145, color: 'var(--accent)' },
            'Ankara': { x: 380, y: 210, color: 'var(--accent-gold)' },
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
