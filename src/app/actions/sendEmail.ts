"use server";


import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'GironaXics <hola@gironaxics.cat>';

export async function sendContactEmail(data: {
  centreEmail: string;
  centreNom: string;
  activitatNom: string;
  nomRemitent: string;
  emailRemitent: string;
  missatge: string;
}) {
  // 1. Correu al centre
  await resend.emails.send({
    from: FROM,
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
          <p style="color:#525250;margin:0 0 24px">Activitat: <strong>${data.activitatNom}</strong></p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr><td style="padding:8px 0;border-bottom:1px solid #EDE8DF;color:#525250;width:120px">Nom</td><td style="padding:8px 0;border-bottom:1px solid #EDE8DF"><strong>${data.nomRemitent}</strong></td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #EDE8DF;color:#525250">Correu</td><td style="padding:8px 0;border-bottom:1px solid #EDE8DF"><a href="mailto:${data.emailRemitent}" style="color:#1A6B3A">${data.emailRemitent}</a></td></tr>
          </table>
          <div style="background:#F7F4EE;border-radius:4px;padding:20px;margin-bottom:32px;white-space:pre-wrap">${data.missatge}</div>
          <a href="mailto:${data.emailRemitent}" style="display:inline-block;background:#1A6B3A;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:700">Respon a ${data.nomRemitent}</a>
        </div>
        <div style="padding:16px 32px;border-top:1px solid #EDE8DF;font-size:12px;color:#525250">
          Missatge enviat a través de <a href="https://gironaxics.cat" style="color:#1A6B3A">gironaxics.cat</a>
        </div>
      </div>
    `,
  });

  // 2. Còpia de confirmació a la família
  await resend.emails.send({
    from: FROM,
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
            Hola <strong>${data.nomRemitent}</strong>, hem fet arribar el teu missatge a <strong>${data.centreNom}</strong> sobre l'activitat <strong>${data.activitatNom}</strong>.<br/><br/>
            El centre et respondrà directament a <strong>${data.emailRemitent}</strong> en breu.
          </p>
          <div style="background:#F7F4EE;border-radius:4px;padding:20px;margin-bottom:32px">
            <p style="margin:0 0 8px;font-size:12px;color:#525250;text-transform:uppercase;letter-spacing:0.05em">El teu missatge</p>
            <p style="margin:0;white-space:pre-wrap">${data.missatge}</p>
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
