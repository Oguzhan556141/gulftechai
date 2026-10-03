export class MapComponent {
    constructor(data) {
        this.data = data || {};
        this.container = null;
        this.selectedRegional = null;
    }

    render() {
        this.container = document.createElement('div');
        this.container.className = 'enhanced-map-wrapper';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.showRegionalsView();
        return this.container;
    }

    resolveVenue(regional) {
        if (!regional) return null;
        const vKey = regional.venue || regional.venueKey || regional.location;
        const venue = this.data.venues?.[vKey] ||
            this.data.venues?.[regional.location] || {
                name: regional.venue || regional.name,
                address: regional.address || `${regional.location}, Türkiye`,
                mapQuery: regional.mapQuery || `${regional.venue || regional.name}, ${regional.location}`,
                logistics: {
                    transport: 'Metro, raylı sistemler veya şehir içi toplu taşıma ile erişim sağlanabilir.',
                    accommodation: 'Bölgedeki oteller ve konaklama tesisleri.',
                    notes: 'Turnuva alanında güvenlik ve akreditasyon kurallarına dikkat edilmelidir.'
                },
                floorPlan: {
                    pits: 'Giriş katı takım hazırlık ve pit alanları',
                    field: 'Merkez arena müsabaka sahası',
                    stands: 'İzleyici ve takım tribünleri',
                    food: 'Kafeterya ve dinlenme alanları'
                }
            };
        return venue;
    }

    showRegionalsView() {
        this.container.innerHTML = '';
        const regionals = this.data.regionals || [];
        if (regionals.length === 0) {
            this.container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)">Kayıtlı turnuva bulunamadı.</div>';
            return;
        }

        // Set default selected regional
        this.selectedRegional = regionals[0];

        // 1. Header Banner
        const header = document.createElement('div');
        header.className = 'schedule-header-banner';
        header.innerHTML = `
            <div class="schedule-header-badge">🌐 FIRST Robotics Competition 2027</div>
            <h3 class="schedule-header-title">2027 Sezonu Resmi Turnuva Takvimi</h3>
            <p class="schedule-header-sub">frc-events.firstinspires.org Resmi Takvimi • Türkiye Bölgesel Turnuvaları & Dünya Şampiyonası</p>
        `;
        this.container.appendChild(header);

        // Filter Tabs
        const filterBar = document.createElement('div');
        filterBar.className = 'schedule-filter-tabs';
        filterBar.innerHTML = `
            <button type="button" class="schedule-tab-btn active" data-filter="turkey">🇹🇷 Türkiye Turnuvaları (6)</button>
            <button type="button" class="schedule-tab-btn" data-filter="championship">🏆 Dünya Şampiyonası</button>
            <button type="button" class="schedule-tab-btn" data-filter="international">🌍 Global / Prestijli (5)</button>
            <button type="button" class="schedule-tab-btn" data-filter="all">Tümü (${regionals.length})</button>
        `;
        this.container.appendChild(filterBar);

        // 2. Regionals Selector
        const selectorSection = document.createElement('div');
        selectorSection.className = 'schedule-selector-section';
        selectorSection.innerHTML = `
            <div class="schedule-section-label">
                <span>🎯 Turnuva Seçin (Regional Listesi)</span>
                <span class="schedule-count-pill" id="scheduleVisibleCount">${regionals.filter(r => r.category === 'turkey').length} Turnuva Gösteriliyor</span>
            </div>
        `;

        const regionalGrid = document.createElement('div');
        regionalGrid.className = 'schedule-regional-grid';

        const regionalCards = [];

        regionals.forEach((reg, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `schedule-regional-card${idx === 0 ? ' active' : ''}`;
            btn.dataset.category = reg.category || 'turkey';
            
            const dateStr = reg.dateDisplay || new Date(reg.date).toLocaleDateString('tr-TR');
            const venueName = reg.venue || reg.location;
            const codeBadge = reg.code ? `<span class="regional-card-status">${reg.code}</span>` : `<span class="regional-card-status">2027</span>`;

            btn.innerHTML = `
                <div class="regional-card-top">
                    <span class="regional-card-name">${reg.name}</span>
                    ${codeBadge}
                </div>
                <div class="regional-card-meta">
                    <span class="regional-meta-date">📅 ${dateStr}</span>
                    <span class="regional-meta-venue">📍 ${venueName}</span>
                </div>
            `;

            btn.addEventListener('click', () => {
                this.selectedRegional = reg;
                regionalCards.forEach(c => c.btn.classList.remove('active'));
                btn.classList.add('active');
                this.updateSpotlight(reg);
            });

            regionalCards.push({ btn, reg });
            regionalGrid.appendChild(btn);
        });

        // Filter tabs logic
        const tabBtns = filterBar.querySelectorAll('.schedule-tab-btn');
        const countPill = selectorSection.querySelector('#scheduleVisibleCount');

        const applyFilter = (filter) => {
            let visibleCount = 0;
            let firstVisibleCard = null;

            regionalCards.forEach(({ btn, reg }) => {
                const match = filter === 'all' || reg.category === filter;
                btn.style.display = match ? 'flex' : 'none';
                if (match) {
                    visibleCount++;
                    if (!firstVisibleCard) firstVisibleCard = { btn, reg };
                }
            });

            if (countPill) countPill.textContent = `${visibleCount} Turnuva Gösteriliyor`;

            // If selected regional is hidden by filter, select the first visible one
            if (firstVisibleCard && (!this.selectedRegional || (filter !== 'all' && this.selectedRegional.category !== filter))) {
                this.selectedRegional = firstVisibleCard.reg;
                regionalCards.forEach(c => c.btn.classList.remove('active'));
                firstVisibleCard.btn.classList.add('active');
                this.updateSpotlight(firstVisibleCard.reg);
            }
        };

        tabBtns.forEach(tBtn => {
            tBtn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tBtn.classList.add('active');
                applyFilter(tBtn.dataset.filter);
            });
        });

        // Apply default filter (turkey)
        applyFilter('turkey');

        selectorSection.appendChild(regionalGrid);
        this.container.appendChild(selectorSection);

        // 3. Spotlight & Map Section Container
        const spotlightWrapper = document.createElement('div');
        spotlightWrapper.className = 'schedule-spotlight-wrapper';
        spotlightWrapper.id = 'scheduleSpotlightWrapper';
        this.container.appendChild(spotlightWrapper);

        // Initial populate of spotlight
        this.updateSpotlight(this.selectedRegional);

        // Hide back button in modal footer if present
        const backBtn = document.getElementById('backToTurkey');
        if (backBtn) backBtn.style.display = 'none';
    }

    updateSpotlight(regional) {
        const wrapper = this.container.querySelector('#scheduleSpotlightWrapper');
        if (!wrapper) return;

        const venue = this.resolveVenue(regional);
        const mapQuery = venue.mapQuery || `${venue.name}, ${venue.address || regional.location}`;
        const encodedQuery = encodeURIComponent(mapQuery);
        const embedUrl = `https://maps.google.com/maps?q=${encodedQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        const openMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedQuery}`;

        const dateStr = regional.dateDisplay || new Date(regional.date).toLocaleDateString('tr-TR');

        wrapper.innerHTML = `
            <div class="schedule-active-header">
                <div class="schedule-active-info">
                    <span class="schedule-active-tag">SEÇİLİ TURNUVA VE MEKAN</span>
                    <h2 class="schedule-active-title">${regional.name}</h2>
                    <p class="schedule-active-address">📍 <strong>${venue.name}</strong> — ${venue.address || regional.location}</p>
                    <div class="schedule-active-dates">
                        <span class="date-badge">🗓️ ${dateStr}</span>
                        <span class="venue-badge">🏟️ ${venue.name}</span>
                        ${regional.code ? `<span class="venue-badge" style="color:var(--accent);">🏷️ Kod: ${regional.code}</span>` : ''}
                    </div>
                </div>
                <div class="schedule-active-actions">
                    ${regional.code ? `
                    <a class="btn-open-google tertiary" href="https://frc-events.firstinspires.org/2027/${regional.code}" target="_blank" rel="noopener noreferrer" title="FIRST Resmi Etkinlik Sayfası">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        FIRST Sayfası
                    </a>` : ''}
                    <a class="btn-open-google primary" href="${openMapsUrl}" target="_blank" rel="noopener noreferrer" title="Google Haritalar'da Tam Konumu Gör">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        Google Maps'te Aç
                    </a>
                    <a class="btn-open-google secondary" href="${directionsUrl}" target="_blank" rel="noopener noreferrer" title="Mekana Yol Tarifi Al">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
                        Yol Tarifi Al
                    </a>
                </div>
            </div>

            <!-- Google Maps Embed Frame -->
            <div class="venue-map-section">
                <div class="venue-map-frame-wrapper">
                    <iframe
                        class="venue-map-frame"
                        src="${embedUrl}"
                        loading="lazy"
                        referrerpolicy="no-referrer-when-downgrade"
                        allowfullscreen
                        title="${regional.name} - ${venue.name} Tam Konum Haritası"
                    ></iframe>
                    <div class="map-overlay-badge">
                        <span>📍 ${venue.name}</span>
                    </div>
                </div>
            </div>

            <!-- Venue Details Grid -->
            <div class="venue-grid" style="margin-top:16px;">
                <div class="venue-info-card glass-glow">
                    <h4>🏗️ Salon Yerleşim Planı</h4>
                    <ul class="venue-info-list">
                        <li><span class="info-label">Pits</span><span>${venue.floorPlan.pits}</span></li>
                        <li><span class="info-label">Oyun Sahası</span><span>${venue.floorPlan.field}</span></li>
                        <li><span class="info-label">Tribünler</span><span>${venue.floorPlan.stands}</span></li>
                        <li><span class="info-label">Yemek Alanı</span><span>${venue.floorPlan.food}</span></li>
                    </ul>
                </div>
                <div class="venue-info-card glass-glow">
                    <h4>🚚 Lojistik & Ulaşım</h4>
                    <ul class="venue-info-list">
                        <li><span class="info-label">Ulaşım</span><span>${venue.logistics.transport}</span></li>
                        <li><span class="info-label">Konaklama</span><span>${venue.logistics.accommodation}</span></li>
                        <li><span class="info-label">Notlar</span><span>${venue.logistics.notes}</span></li>
                    </ul>
                </div>
            </div>
        `;
    }
}

export function renderMap(data) {
    const comp = new MapComponent(data);
    return comp.render();
}

