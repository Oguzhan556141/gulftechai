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
        const uniqueLocations = [...new Set(this.data.regionals.map((r) => r.location))];
        if (uniqueLocations.length === 0) return;

        const frame = document.createElement('iframe');
        frame.className = 'schedule-google-map-frame';
        frame.loading = 'lazy';
        frame.allowFullscreen = true;
        frame.referrerPolicy = 'no-referrer-when-downgrade';

        let selectedLocation = uniqueLocations[0];

        const setMapLocation = (location) => {
            selectedLocation = location;
            const query = encodeURIComponent(`${location}, Turkiye`);
            frame.src = `https://www.google.com/maps?q=${query}&output=embed`;
        };

        setMapLocation(uniqueLocations[0]);

        const mapContainer = document.createElement('div');
        mapContainer.className = 'map-container schedule-google-map';
        mapContainer.appendChild(frame);
        this.container.appendChild(mapContainer);

        const list = document.createElement('div');
        list.className = 'schedule-location-list';

        uniqueLocations.forEach((location, idx) => {
            const regionalCount = this.data.regionals.filter((r) => r.location === location).length;
            const item = document.createElement('button');
            item.className = `schedule-location-item${idx === 0 ? ' active' : ''}`;
            item.type = 'button';
            item.innerHTML = `<span>${location}</span><span>${regionalCount} turnuva</span>`;

            item.addEventListener('click', () => {
                setMapLocation(location);
                list.querySelectorAll('.schedule-location-item').forEach((el) => el.classList.remove('active'));
                item.classList.add('active');
            });

            list.appendChild(item);
        });

        this.container.appendChild(list);

        const actions = document.createElement('div');
        actions.className = 'schedule-map-actions';
        actions.innerHTML = '<button class="btn-open-google" type="button">Salon Detayini Ac</button>';
        const detailsBtn = actions.querySelector('button');
        detailsBtn.addEventListener('click', () => this.showVenueView(selectedLocation));
        this.container.appendChild(actions);

        const hint = document.createElement('div');
        hint.innerHTML = '<div class="map-hint-premium">Konumu degistirmek icin sehri sec, sonra salon detayini ac.</div>';
        this.container.appendChild(hint);

        const backBtn = document.getElementById('backToTurkey');
        if (backBtn) backBtn.style.display = 'none';
    }

    showVenueView(location) {
        this.currentView = 'venue';
        const venue = this.data.venues?.[location];
        if (!venue) return;

        const mapQuery = encodeURIComponent(`${venue.address}, Turkiye`);
        const embedUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
        const openInMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

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
            <div class="venue-map-section">
                <h4 class="venue-map-title">Google Haritalar Onizleme</h4>
                <iframe
                    class="venue-map-frame"
                    src="${embedUrl}"
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                    allowfullscreen
                    title="${venue.name} konum haritasi"
                ></iframe>
                <div class="venue-map-actions">
                    <a class="btn-open-google" href="${openInMapsUrl}" target="_blank" rel="noopener noreferrer">Google Maps'te Ac</a>
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

export function renderMap(data) {
    const comp = new MapComponent(data);
    return comp.render();
}
