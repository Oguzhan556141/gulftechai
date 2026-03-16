import { UI } from './ui.js';

export function renderMap(regionals) {
    const container = document.createElement('div');
    container.className = 'map-container';
    
    // Simple visual representation of Turkey map
    const inner = document.createElement('div');
    inner.className = 'map-placeholder';
    inner.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
            <path d="M50,150 L150,100 L250,80 L400,100 L600,80 L750,100 L780,250 L650,300 L400,320 L200,300 L50,250 Z" 
                  fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
            <text x="50%" y="50%" fill="rgba(255,255,255,0.1)" font-size="24" text-anchor="middle" font-family="Outfit">TÜRKİYE FRC REGIONALS</text>
        </svg>
    `;

    // Add nodes based on coordinates (estimated for visual effect)
    const locations = {
        'İstanbul': { x: 180, y: 120 },
        'Ankara': { x: 400, y: 180 },
        'Ataköy, İstanbul': { x: 170, y: 130 }
    };

    regionals.forEach(r => {
        const coords = locations[r.location] || locations['İstanbul'];
        const node = document.createElement('div');
        node.className = 'map-node';
        node.style.left = `${coords.x}px`;
        node.style.top = `${coords.y}px`;
        
        const label = document.createElement('div');
        label.className = 'map-node-label';
        label.textContent = `${r.name} (${r.location})`;
        
        node.appendChild(label);
        inner.appendChild(node);
    });

    container.appendChild(inner);
    return container;
}
