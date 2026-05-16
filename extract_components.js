const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('index.html', 'utf8');

const extract = (startComment, endComment) => {
  const regex = new RegExp(`<!-- ${startComment} -->([\\s\\S]*?)<!-- ${endComment} -->`, 'i');
  const match = html.match(regex);
  if (!match) return null;
  return match[1].trim();
};

const extractSection = (tag) => {
    const regex = new RegExp(`<!-- ${tag} -->([\\s\\S]*?)(?=<!-- |<script|$)`, 'i');
    const match = html.match(regex);
    if (!match) return null;
    return match[1].trim();
}

const writeComponent = (name, content, useClient = false) => {
  if (!content) {
      console.log(`Failed to extract ${name}`);
      return;
  }
  // Basic React conversion: class to className, onclick to onClick
  let jsx = content
    .replace(/class=/g, 'className=')
    .replace(/onclick=/g, 'onClick=')
    .replace(/stroke-width=/g, 'strokeWidth=')
    .replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
    .replace(/viewBox=/g, 'viewBox=')
    .replace(/<img(.*?)>/g, '<img$1 />')
    .replace(/<input(.*?)>/g, '<input$1 />')
    .replace(/style="([^"]*)"/g, (match, p1) => {
        // Simple inline style to object
        const parts = p1.split(';').filter(x => x.trim());
        let objStr = parts.map(p => {
            const [k, v] = p.split(':').map(x => x.trim());
            const camelK = k.replace(/-([a-z])/g, g => g[1].toUpperCase());
            return `${camelK}: '${v}'`;
        }).join(', ');
        return `style={{${objStr}}}`;
    });
  
  const fileContent = `${useClient ? '"use client";\n\n' : ''}import Link from 'next/link';\n\nexport default function ${name}() {\n  return (\n    <>\n${jsx}\n    </>\n  );\n}\n`;
  fs.writeFileSync(`src/components/${name}.tsx`, fileContent);
  console.log(`Created ${name}.tsx`);
};

writeComponent('Nav', extractSection('Nav'), true);
writeComponent('Hero', extractSection('Hero'));
writeComponent('Stats', extractSection('Stats'), true);
writeComponent('MapaBarris', extractSection('Mapa')); // Might need manual fixing later
writeComponent('Destacades', extractSection('Destacades'));
writeComponent('Categories', extractSection('Categories'));
writeComponent('ComFunciona', extractSection('Com funciona'));
writeComponent('BannerCentres', extractSection('Banner Centres'));
writeComponent('Footer', extractSection('Footer'));
writeComponent('CustomCursor', extractSection('Cursor') || `<div className="cursor" id="custom-cursor"></div>`, true);

