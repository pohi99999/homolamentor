import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Resend inicializálása csak akkor, ha a kulcs rendelkezésre áll
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, companySize, industry, propertyType, location, source } = body;

    // Minimum ellenőrzés
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required fields.' },
        { status: 400 }
      );
    }

    const isLeadCapture = source === 'LeadCaptureForm';
    const formName = isLeadCapture ? 'Afrika-Inkubátor Érdeklődés' : 'Ingatlan Portál Érdeklődés';

    // HTML E-mail formázás (Luxury Sötét & Arany/Kék stílusban)
    const htmlEmail = `
      <div style="background-color: #0b0f19; color: #f1f5f9; font-family: sans-serif; padding: 40px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0 0 10px 0; letter-spacing: 1px;">HOMOLAMENTOR</h1>
          <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: ${isLeadCapture ? '#34d399' : '#38bdf8'}; background-color: rgba(255,255,255,0.05); padding: 6px 16px; border-radius: 9999px;">
            ${formName}
          </span>
        </div>
        
        <div style="background-color: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 25px; border-radius: 12px; margin-bottom: 25px;">
          <h2 style="color: #ffffff; font-size: 16px; margin: 0 0 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">Ügyfél Információk</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #94a3b8; width: 120px; font-weight: bold;">Név:</td>
              <td style="padding: 8px 0; color: #ffffff;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">E-mail:</td>
              <td style="padding: 8px 0; color: #ffffff;"><a href="mailto:${email}" style="color: ${isLeadCapture ? '#34d399' : '#38bdf8'}; text-decoration: none;">${email}</a></td>
            </tr>
            ${isLeadCapture ? `
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Cégméret:</td>
                <td style="padding: 8px 0; color: #ffffff;">${companySize} fő</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Iparág:</td>
                <td style="padding: 8px 0; color: #ffffff;">${industry}</td>
              </tr>
            ` : `
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Ingatlan típus:</td>
                <td style="padding: 8px 0; color: #ffffff;">${propertyType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Lokáció:</td>
                <td style="padding: 8px 0; color: #ffffff;">${location}</td>
              </tr>
            `}
          </table>
        </div>

        <div style="text-align: center; font-size: 11px; color: #64748b; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;">
          Ezt az e-mailt a HomolaMentor KFT weboldal automatikus hibrid rendszere küldte.
        </div>
      </div>
    `;

    // Feladatok párhuzamos futtatása
    const tasks: Promise<{ success?: boolean; error?: boolean; source?: string; message?: string }>[] = [];

    // 1. Resend e-mail küldés
    if (resend) {
      tasks.push(
        resend.emails.send({
          from: 'HomolaMentor <noreply@resend.dev>', // Ha van egyedi domain, ide jöhet
          to: ['homlamentor@gmail.com', 'peterpohankapersonal@gmail.com'],
          subject: `Új Érdeklődés: ${name} (${formName})`,
          html: htmlEmail,
        })
          .then((res) => {
            if (res.error) {
              return { error: true, source: 'Resend', message: res.error.message };
            }
            return { success: true, source: 'Resend' };
          })
          .catch((err) => {
            console.error('Error sending email via Resend:', err);
            return { error: true, source: 'Resend', message: err.message };
          })
      );
    } else {
      console.log('--- RESEND EMAIL MOCK ---');
      console.log(`To: homlamentor@gmail.com, peterpohankapersonal@gmail.com`);
      console.log(`Subject: Új Érdeklődés: ${name} (${formName})`);
      console.log('--- END MOCK ---');
    }

    // 2. n8n webhook hívása
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nUrl) {
      tasks.push(
        fetch(n8nUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...body,
            timestamp: new Date().toISOString(),
          }),
        })
          .then(async (res) => {
            if (!res.ok) {
              throw new Error(`n8n responded with status ${res.status}`);
            }
            return { success: true, source: 'n8n' };
          })
          .catch((err) => {
            console.error('Error sending webhook to n8n:', err);
            return { error: true, source: 'n8n', message: err.message };
          })
      );
    } else {
      console.log('--- N8N WEBHOOK MOCK ---');
      console.log(`Payload:`, JSON.stringify(body));
      console.log('--- END MOCK ---');
    }

    // Párhuzamos végrehajtás
    const results = await Promise.all(tasks);
    
    // Vizsgáljuk meg, hogy történt-e valami kritikus hiba a futó feladatoknál
    const errors = results.filter((r) => r && r.error);
    if (errors.length > 0 && errors.length === tasks.length) {
      // Ha minden integráció elbukott
      return NextResponse.json(
        { error: 'Failed to send data to backend integrations.', details: errors },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contact form request processed successfully.',
      integrations: {
        resend: resend ? 'active' : 'mocked',
        n8n: n8nUrl ? 'active' : 'mocked',
      }
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('API Contact route error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message },
      { status: 500 }
    );
  }
}
