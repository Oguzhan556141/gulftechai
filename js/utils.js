export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function getNextRegional(regionals) {
    if (!regionals) return null;
    const now = new Date();
    return regionals.find(r => new Date(r.date) > now) || regionals[regionals.length - 1];
}

export function renderMarkdown(text) {
    let html = escapeHtml(text);

    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headers
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Blockquotes
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote style="border-left:3px solid var(--accent);padding-left:12px;color:var(--text-secondary);margin:8px 0;">$1</blockquote>');

    // Tables
    html = html.replace(/^\|(.+)\|$/gm, (match) => {
        const cells = match.split('|').filter(c => c.trim());
        if (cells.every(c => /^[\s-:]+$/.test(c))) return ''; 
        const cellsHtml = cells.map(c => `<td style="padding:8px 12px;border:1px solid var(--border);">${c.trim()}</td>`).join('');
        return `<tr>${cellsHtml}</tr>`;
    });
    html = html.replace(/(<tr>[\s\S]*?<\/tr>)/g, (tableRows) => {
        if (tableRows.includes('<tr>')) {
            return `<table style="border-collapse:collapse;width:100%;margin:12px 0;font-size:0.88rem;">${tableRows}</table>`;
        }
        return tableRows;
    });

    // Lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, (match) => {
        if (!match.startsWith('<ul>')) return `<ul>${match}</ul>`;
        return match;
    });

    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    // Clean up
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>\s*(<h[1-4]|<pre|<ul|<table|<blockquote)/g, '$1');
    html = html.replace(/(<\/h[1-4]|<\/pre>|<\/ul>|<\/table>|<\/blockquote>)\s*<\/p>/g, '$1');

    return html;
}
