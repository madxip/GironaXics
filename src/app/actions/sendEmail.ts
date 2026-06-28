"use server";

import { Resend } from 'resend';
import { headers } from 'next/headers';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'GironaXics <hola@gironaxics.cat>';
// Els correus de consulta s'envien des de no-reply@ per evitar que els centres
// rebin còpies de les respostes a hola@ quan fan "Respondre a tots".
const FROM_NOREPLY = 'GironaXics <no-reply@gironaxics.cat>';

// Simple distributed rate limiting by IP (supports Vercel serverless environment)
// It uses Vercel KV / Upstash Redis REST API if configured, falling back to local memory limit
const ipCache = new Map<string, { count: number; lastReset: number }>();
const LIMIT_WINDOW_MS = 60 * 1000; // 1 minut
const MAX_REQUESTS_PER_MINUTE = 3; // màxim 3 correus per minut

function rateLimitLocal(ip: string): boolean {
  const now = Date.now();
  const limitInfo = ipCache.get(ip);

  if (!limitInfo) {
    ipCache.set(ip, { count: 1, lastReset: now });
    return true;
  }

  if (now - limitInfo.lastReset > LIMIT_WINDOW_MS) {
    ipCache.set(ip, { count: 1, lastReset: now });
    return true;
  }

  if (limitInfo.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  limitInfo.count += 1;
  return true;
}

async function rateLimit(ip: string): Promise<boolean> {
  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  if (KV_URL && KV_TOKEN) {
    try {
      const key = `ratelimit:contact:${ip}`;
      const windowSeconds = 60;
      const maxRequests = MAX_REQUESTS_PER_MINUTE;

      // Increment count and get TTL using Upstash pipeline REST endpoint to avoid roundtrips
      const res = await fetch(`${KV_URL}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', key],
          ['TTL', key],
        ]),
        cache: 'no-store',
      });

      if (res.ok) {
        const result = await res.json();
        const currentCount = result[0]?.result;
        const currentTtl = result[1]?.result;

        // If the key is new or has no expiration (TTL is -1), set the expiration
        if (currentCount === 1 || currentTtl === -1) {
          fetch(`${KV_URL}/EXPIRE/${key}/${windowSeconds}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${KV_TOKEN}` },
            cache: 'no-store',
          }).catch((err) => console.error("Error setting redis expire:", err));
        }

        if (currentCount > maxRequests) {
          return false;
        }

        return true;
      }
      console.warn("REST Redis response not OK, falling back to local memory rate limiting.");
    } catch (err) {
      console.error("Distributed rate limiting error, falling back to local memory rate limiting:", err);
    }
  }

  // Fallback to local memory limiter
  return rateLimitLocal(ip);
}

const esc = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export async function sendContactEmail(data: {
  centreEmail: string;
  centreNom: string;
  activitatNom: string;
  nomRemitent: string;
  emailRemitent: string;
  missatge: string;
  website?: string; // honeypot field
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("El servei d'enviament de correus no està configurat (falta RESEND_API_KEY).");
  }

  // 1. Honeypot check
  if (data.website && data.website.trim() !== '') {
    console.warn("Spam detectat (honeypot):", data.emailRemitent);
    return; // Silent discard to avoid letting the bot know
  }

  // 2. IP Rate Limiting
  let ip = '127.0.0.1';
  try {
    const headersList = headers();
    ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  } catch {
    // ignore if headers() cannot be read (e.g. in some dev contexts)
  }

  if (!await rateLimit(ip)) {
    console.warn("Spam detectat (rate-limit per IP):", ip);
    throw new Error("S'ha superat el límit d'enviaments permesos per minut. Si us plau, espera una mica.");
  }

  // 3. Manual validations
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!data.nomRemitent || data.nomRemitent.trim().length === 0 || data.nomRemitent.length > 100) {
    throw new Error("El nom és obligatori i no pot superar els 100 caràcters.");
  }

  if (!data.emailRemitent || !emailRegex.test(data.emailRemitent)) {
    throw new Error("El correu electrònic indicat no és vàlid.");
  }

  if (!data.missatge || data.missatge.trim().length === 0 || data.missatge.length > 2000) {
    throw new Error("El missatge és obligatori i no pot superar els 2000 caràcters.");
  }

  if (!data.centreEmail || !emailRegex.test(data.centreEmail)) {
    throw new Error("Correu de destí invàlid.");
  }

  if (!data.centreNom || data.centreNom.trim().length === 0 || !data.activitatNom || data.activitatNom.trim().length === 0) {
    throw new Error("Dades del centre o de l'activitat incompletes.");
  }
  // 1. Correu al centre
  await resend.emails.send({
    from: FROM_NOREPLY,
    to: data.centreEmail,
    replyTo: data.emailRemitent,
    subject: `[GironaXics] Consulta sobre ${data.activitatNom}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1A1A18">
        <div style="background:#1A6B3A;padding:20px 32px">
          <span style="color:white;font-size:20px;font-weight:700">Girona<span style="color:#F5A623">Xics</span></span>
        </div>
        <div style="padding:32px">
          <h2 style="margin:0 0 8px">Nova consulta rebuda</h2>
          <p style="color:#525250;margin:0 0 24px">Activitat: <strong>${esc(data.activitatNom)}</strong></p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr><td style="padding:8px 0;border-bottom:1px solid #EDE8DF;color:#525250;width:120px">Nom</td><td style="padding:8px 0;border-bottom:1px solid #EDE8DF"><strong>${esc(data.nomRemitent)}</strong></td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #EDE8DF;color:#525250">Correu</td><td style="padding:8px 0;border-bottom:1px solid #EDE8DF"><a href="mailto:${esc(data.emailRemitent)}" style="color:#1A6B3A">${esc(data.emailRemitent)}</a></td></tr>
          </table>
          <div style="background:#F7F4EE;border-radius:4px;padding:20px;margin-bottom:32px;white-space:pre-wrap">${esc(data.missatge)}</div>
          <a href="mailto:${esc(data.emailRemitent)}" style="display:inline-block;background:#1A6B3A;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:700">Respon a ${esc(data.nomRemitent)}</a>
        </div>
        <div style="padding:16px 32px;border-top:1px solid #EDE8DF;font-size:12px;color:#525250">
          Missatge enviat a través de <a href="https://gironaxics.cat" style="color:#1A6B3A">gironaxics.cat</a>
        </div>
      </div>
    `,
  });

  // 2. Còpia de confirmació a la família
  await resend.emails.send({
    from: FROM_NOREPLY,
    to: data.emailRemitent,
    subject: `El teu missatge a ${data.centreNom} s'ha enviat correctament`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1A1A18">
        <div style="background:#1A6B3A;padding:20px 32px">
          <span style="color:white;font-size:20px;font-weight:700">Girona<span style="color:#F5A623">Xics</span></span>
        </div>
        <div style="padding:32px">
          <h2 style="margin:0 0 16px">Missatge enviat ✓</h2>
          <p style="color:#525250;margin:0 0 24px">
            Hola <strong>${esc(data.nomRemitent)}</strong>, hem fet arribar el teu missatge a <strong>${esc(data.centreNom)}</strong> sobre l'activitat <strong>${esc(data.activitatNom)}</strong>.<br/><br/>
            El centre et respondrà directament a <strong>${esc(data.emailRemitent)}</strong> en breu.
          </p>
          <div style="background:#F7F4EE;border-radius:4px;padding:20px;margin-bottom:32px">
            <p style="margin:0 0 8px;font-size:12px;color:#525250;text-transform:uppercase;letter-spacing:0.05em">El teu missatge</p>
            <p style="margin:0;white-space:pre-wrap">${esc(data.missatge)}</p>
          </div>
          <a href="https://gironaxics.cat" style="display:inline-block;background:#1A6B3A;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:700">Torna a GironaXics</a>
        </div>
        <div style="padding:16px 32px;border-top:1px solid #EDE8DF;font-size:12px;color:#525250">
          <a href="https://gironaxics.cat" style="color:#1A6B3A">gironaxics.cat</a> · El directori d'extraescolars de Girona
        </div>
      </div>
    `,
  });
}

export async function sendInternalEmail(data: {
  type: 'contacte' | 'centre' | 'partner';
  nom: string;
  email: string;
  centreNom?: string;
  empresaNom?: string;
  missatge: string;
  website?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("El servei d'enviament de correus no està configurat (falta RESEND_API_KEY).");
  }

  // 1. Honeypot check
  if (data.website && data.website.trim() !== '') {
    console.warn("Spam detectat en correu intern (honeypot):", data.email);
    return; // Silent discard
  }

  // 2. IP Rate Limiting
  let ip = '127.0.0.1';
  try {
    const headersList = headers();
    ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  } catch {
    // ignore
  }

  if (!await rateLimit(ip)) {
    console.warn("Spam detectat en correu intern (rate-limit per IP):", ip);
    throw new Error("S'ha superat el límit d'enviaments permesos per minut. Si us plau, espera una mica.");
  }

  // 3. Validations
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!data.nom || data.nom.trim().length === 0 || data.nom.length > 100) {
    throw new Error("El nom és obligatori i no pot superar els 100 caràcters.");
  }

  if (!data.email || !emailRegex.test(data.email)) {
    throw new Error("El correu electrònic indicat no és vàlid.");
  }

  if (!data.missatge || data.missatge.trim().length === 0 || data.missatge.length > 2000) {
    throw new Error("El missatge és obligatori i no pot superar els 2000 caràcters.");
  }

  if (data.type === 'centre') {
    if (!data.centreNom || data.centreNom.trim().length === 0 || data.centreNom.length > 100) {
      throw new Error("El nom del centre és obligatori i no pot superar els 100 caràcters.");
    }
  }

  if (data.type === 'partner') {
    if (!data.empresaNom || data.empresaNom.trim().length === 0 || data.empresaNom.length > 100) {
      throw new Error("El nom de l'empresa és obligatori i no pot superar els 100 caràcters.");
    }
  }

  // Define subject and HTML content based on type
  const subject = data.type === 'centre' 
    ? `[GironaXics] Sol·licitud de registre de centre: ${data.centreNom}`
    : data.type === 'partner'
      ? `[GironaXics] Nova sol·licitud de Partner / Patrocini: ${data.empresaNom}`
      : `[GironaXics] Nou missatge de contacte general`;

  const htmlContent = data.type === 'centre'
    ? `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1A1A18">
        <div style="background:#1A6B3A;padding:20px 32px">
          <span style="color:white;font-size:20px;font-weight:700">Girona<span style="color:#F5A623">Xics</span></span>
        </div>
        <div style="padding:32px">
          <h2 style="margin:0 0 16px;color:#1A6B3A">Sol·licitud d'Alta de Centre</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr><td style="padding:8px 0;border-bottom:1px solid #EDE8DF;color:#525250;width:160px">Nom del Contacte</td><td style="padding:8px 0;border-bottom:1px solid #EDE8DF"><strong>${esc(data.nom)}</strong></td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #EDE8DF;color:#525250">Nom del Centre</td><td style="padding:8px 0;border-bottom:1px solid #EDE8DF"><strong>${esc(data.centreNom || '')}</strong></td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #EDE8DF;color:#525250">Correu electrònic</td><td style="padding:8px 0;border-bottom:1px solid #EDE8DF"><a href="mailto:${esc(data.email)}" style="color:#1A6B3A">${esc(data.email)}</a></td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:12px;color:#525250;text-transform:uppercase;letter-spacing:0.05em">Activitats que ofereixen:</p>
          <div style="background:#F7F4EE;border-radius:4px;padding:20px;margin-bottom:32px;white-space:pre-wrap">${esc(data.missatge)}</div>
          <a href="mailto:${esc(data.email)}" style="display:inline-block;background:#1A6B3A;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:700">Respon a ${esc(data.nom)}</a>
        </div>
        <div style="padding:16px 32px;border-top:1px solid #EDE8DF;font-size:12px;color:#525250">
          Enviat automàticament per GironaXics
        </div>
      </div>
    `
    : data.type === 'partner'
      ? `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1A1A18">
        <div style="background:#1A6B3A;padding:20px 32px">
          <span style="color:white;font-size:20px;font-weight:700">Girona<span style="color:#F5A623">Xics</span></span>
        </div>
        <div style="padding:32px">
          <h2 style="margin:0 0 16px;color:#1A6B3A">Sol·licitud de Patrocini / Partner de Categoria</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr><td style="padding:8px 0;border-bottom:1px solid #EDE8DF;color:#525250;width:160px">Nom de la Persona</td><td style="padding:8px 0;border-bottom:1px solid #EDE8DF"><strong>${esc(data.nom)}</strong></td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #EDE8DF;color:#525250">Nom de l'Empresa</td><td style="padding:8px 0;border-bottom:1px solid #EDE8DF"><strong>${esc(data.empresaNom || '')}</strong></td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #EDE8DF;color:#525250">Correu electrònic</td><td style="padding:8px 0;border-bottom:1px solid #EDE8DF"><a href="mailto:${esc(data.email)}" style="color:#1A6B3A">${esc(data.email)}</a></td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:12px;color:#525250;text-transform:uppercase;letter-spacing:0.05em">Detalls de la sol·licitud / Categoria d'interès:</p>
          <div style="background:#F7F4EE;border-radius:4px;padding:20px;margin-bottom:32px;white-space:pre-wrap">${esc(data.missatge)}</div>
          <a href="mailto:${esc(data.email)}" style="display:inline-block;background:#1A6B3A;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:700">Respon a ${esc(data.nom)}</a>
        </div>
        <div style="padding:16px 32px;border-top:1px solid #EDE8DF;font-size:12px;color:#525250">
          Enviat automàticament per GironaXics
        </div>
      </div>
    `
      : `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1A1A18">
        <div style="background:#1A6B3A;padding:20px 32px">
          <span style="color:white;font-size:20px;font-weight:700">Girona<span style="color:#F5A623">Xics</span></span>
        </div>
        <div style="padding:32px">
          <h2 style="margin:0 0 16px;color:#1A6B3A">Consulta General de Contacte</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr><td style="padding:8px 0;border-bottom:1px solid #EDE8DF;color:#525250;width:160px">Nom del Contacte</td><td style="padding:8px 0;border-bottom:1px solid #EDE8DF"><strong>${esc(data.nom)}</strong></td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #EDE8DF;color:#525250">Correu electrònic</td><td style="padding:8px 0;border-bottom:1px solid #EDE8DF"><a href="mailto:${esc(data.email)}" style="color:#1A6B3A">${esc(data.email)}</a></td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:12px;color:#525250;text-transform:uppercase;letter-spacing:0.05em">Missatge:</p>
          <div style="background:#F7F4EE;border-radius:4px;padding:20px;margin-bottom:32px;white-space:pre-wrap">${esc(data.missatge)}</div>
          <a href="mailto:${esc(data.email)}" style="display:inline-block;background:#1A6B3A;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:700">Respon a ${esc(data.nom)}</a>
        </div>
        <div style="padding:16px 32px;border-top:1px solid #EDE8DF;font-size:12px;color:#525250">
          Enviat automàticament per GironaXics
        </div>
      </div>
    `;

  await resend.emails.send({
    from: FROM,
    to: 'hola@gironaxics.cat',
    replyTo: data.email,
    subject: subject,
    html: htmlContent,
  });
}

export async function sendApprovalEmail(data: {
  email: string;
  nom: string;
  centreNom: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("El servei d'enviament de correus no està configurat (falta RESEND_API_KEY).");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    throw new Error("El correu electrònic indicat no és vàlid.");
  }

  if (!data.nom || data.nom.trim().length === 0) {
    throw new Error("El nom del contacte és obligatori.");
  }

  if (!data.centreNom || data.centreNom.trim().length === 0) {
    throw new Error("El nom del centre és obligatori.");
  }

  await resend.emails.send({
    from: FROM,
    to: data.email,
    subject: `El teu centre ha estat acceptat a GironaXics!`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1A1A18">
        <div style="background:#1A6B3A;padding:20px 32px">
          <span style="color:white;font-size:20px;font-weight:700">Girona<span style="color:#F5A623">Xics</span></span>
        </div>
        <div style="padding:32px">
          <h2 style="margin:0 0 16px;color:#1A6B3A">Compte Activat! ✓</h2>
          <p style="color:#525250;margin:0 0 24px;line-height:1.6;font-size:15px">
            Hola <strong>${esc(data.nom)}</strong>,<br/><br/>
            Ens plau informar-te que la teva sol·licitud d'alta per al centre <strong>${esc(data.centreNom)}</strong> ha estat acceptada i el teu compte ja està completament actiu!
          </p>
          <p style="color:#525250;margin:0 0 24px;line-height:1.6;font-size:15px">
            A partir d'ara ja pots accedir al teu panell de control per començar a publicar i gestionar les teves activitats extraescolars, de manera que les famílies de Girona les puguin trobar.
          </p>
          <div style="text-align:center;margin:36px 0">
            <a href="https://gironaxics.cat/login" style="display:inline-block;background:#1A6B3A;color:white;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(26,107,58,0.15)">Accedir al meu Panell</a>
          </div>
          <p style="color:#7C7C7A;margin:24px 0 0;font-size:14px;line-height:1.5;border-top:1px solid #EDE8DF;padding-top:20px">
            Si tens qualsevol dubte o necessites ajuda durant el procés de creació d'activitats, pots respondre directament a aquest correu electrònic.
          </p>
        </div>
        <div style="padding:16px 32px;border-top:1px solid #EDE8DF;font-size:12px;color:#7C7C7A;background:#F9F8F6">
          <a href="https://gironaxics.cat" style="color:#1A6B3A;text-decoration:none;font-weight:600">gironaxics.cat</a> · El directori d'extraescolars de Girona
        </div>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(data: {
  email: string;
  nom: string;
  resetUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("El servei d'enviament de correus no està configurat.");
  }
  await resend.emails.send({
    from: FROM,
    to: data.email,
    subject: 'Restabliment de contrasenya — GironaXics',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1A1A18">
        <div style="background:#1A6B3A;padding:20px 32px">
          <span style="color:white;font-size:20px;font-weight:700">Girona<span style="color:#F5A623">Xics</span></span>
        </div>
        <div style="padding:32px">
          <h2 style="margin:0 0 16px;color:#1A6B3A">Restabliment de contrasenya</h2>
          <p style="color:#525250;margin:0 0 24px;line-height:1.6;font-size:15px">
            Hola <strong>${esc(data.nom)}</strong>,<br/><br/>
            Hem rebut una sol·licitud per restablir la contrasenya del teu compte a GironaXics.
            Fes clic al botó de sota per crear una nova contrasenya. L'enllaç és vàlid durant <strong>1 hora</strong>.
          </p>
          <div style="text-align:center;margin:36px 0">
            <a href="${data.resetUrl}" style="display:inline-block;background:#1A6B3A;color:white;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(26,107,58,0.15)">Restablir la contrasenya</a>
          </div>
          <p style="color:#7C7C7A;font-size:13px;line-height:1.5">
            Si no has sol·licitat aquest canvi, pots ignorar aquest correu. La teva contrasenya actual seguirà sent la mateixa.
          </p>
          <p style="color:#7C7C7A;font-size:12px;margin-top:16px;word-break:break-all">
            O copia aquest enllaç al navegador:<br/>
            <a href="${data.resetUrl}" style="color:#1A6B3A">${data.resetUrl}</a>
          </p>
        </div>
        <div style="padding:16px 32px;border-top:1px solid #EDE8DF;font-size:12px;color:#7C7C7A;background:#F9F8F6">
          <a href="https://gironaxics.cat" style="color:#1A6B3A;text-decoration:none;font-weight:600">gironaxics.cat</a> · El directori d'extraescolars de Girona
        </div>
      </div>
    `,
  });
}
