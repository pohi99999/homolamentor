import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFilePromise = promisify(execFile);

// Resend inicializálása csak akkor, ha a kulcs rendelkezésre áll
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      companySize,
      industry,
      propertyType,
      location,
      source,
      // Mobilház specifikus mezők
      project,
      companyName,
      contactName,
      phone,
      preferredSize,
      role,
      projectedVolume,
      fundingStatus,
      message,
    } = body;

    const isMobileHome = project === 'mobilehome';
    const finalName = isMobileHome ? (contactName || name) : name;

    // Minimum ellenőrzés
    if (!finalName || !email) {
      return NextResponse.json(
        { error: 'Name and email are required fields.' },
        { status: 400 }
      );
    }

    const isLeadCapture = source === 'LeadCaptureForm';
    let formName = 'Ingatlan Portál Érdeklődés';
    if (isLeadCapture) {
      formName = 'Afrika-Inkubátor Érdeklődés';
    } else if (isMobileHome) {
      formName = 'Mobilház-Projekt Jelentkezés';
    }

    // HTML E-mail formázás (Luxury Sötét & Arany/Kék stílusban)
    let htmlEmail = '';

    if (isMobileHome) {
      htmlEmail = `
        <div style="background-color: #0b0f19; color: #f1f5f9; font-family: sans-serif; padding: 40px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0 0 10px 0; letter-spacing: 1px;">HOMLAMENTOR KFT</h1>
            <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #38bdf8; background-color: rgba(255,255,255,0.05); padding: 6px 16px; border-radius: 9999px;">
              ${formName}
            </span>
          </div>
          
          <div style="background-color: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 25px; border-radius: 12px; margin-bottom: 25px;">
            <h2 style="color: #ffffff; font-size: 16px; margin: 0 0 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">Partner Információk</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; width: 150px; font-weight: bold;">Kapcsolattartó:</td>
                <td style="padding: 8px 0; color: #ffffff;">${finalName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Cégnév:</td>
                <td style="padding: 8px 0; color: #ffffff;">${companyName || ''}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Pozíció:</td>
                <td style="padding: 8px 0; color: #ffffff;">${role || ''}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">E-mail:</td>
                <td style="padding: 8px 0; color: #ffffff;"><a href="mailto:${email}" style="color: #38bdf8; text-decoration: none;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Telefon:</td>
                <td style="padding: 8px 0; color: #ffffff;">${phone || ''}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Preferált Méret:</td>
                <td style="padding: 8px 0; color: #34d399; font-weight: bold;">${preferredSize || ''} m²</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Tervezett Mennyiség:</td>
                <td style="padding: 8px 0; color: #ffffff;">${projectedVolume || ''} db</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Finanszírozás:</td>
                <td style="padding: 8px 0; color: #ffffff;">${fundingStatus || ''}</td>
              </tr>
              ${message ? `
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-weight: bold; vertical-align: top;">Üzenet:</td>
                <td style="padding: 8px 0; color: #ffffff; white-space: pre-wrap;">${message}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <div style="text-align: center; font-size: 11px; color: #64748b; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;">
            Ezt az e-mailt a HOMLAMENTOR KFT weboldal automatikus hibrid rendszere küldte.
          </div>
        </div>
      `;
    } else {
      htmlEmail = `
        <div style="background-color: #0b0f19; color: #f1f5f9; font-family: sans-serif; padding: 40px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0 0 10px 0; letter-spacing: 1px;">HOMLAMENTOR KFT</h1>
            <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: ${isLeadCapture ? '#34d399' : '#38bdf8'}; background-color: rgba(255,255,255,0.05); padding: 6px 16px; border-radius: 9999px;">
              ${formName}
            </span>
          </div>
          
          <div style="background-color: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 25px; border-radius: 12px; margin-bottom: 25px;">
            <h2 style="color: #ffffff; font-size: 16px; margin: 0 0 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">Ügyfél Információk</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; width: 120px; font-weight: bold;">Név:</td>
                <td style="padding: 8px 0; color: #ffffff;">${finalName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">E-mail:</td>
                <td style="padding: 8px 0; color: #ffffff;"><a href="mailto:${email}" style="color: ${isLeadCapture ? '#34d399' : '#38bdf8'}; text-decoration: none;">${email}</a></td>
              </tr>
              ${isLeadCapture ? `
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Cégméret:</td>
                  <td style="padding: 8px 0; color: #ffffff;">${companySize || ''} fő</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Iparág:</td>
                  <td style="padding: 8px 0; color: #ffffff;">${industry || ''}</td>
                </tr>
              ` : `
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Ingatlan típus:</td>
                  <td style="padding: 8px 0; color: #ffffff;">${propertyType || ''}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Lokáció:</td>
                  <td style="padding: 8px 0; color: #ffffff;">${location || ''}</td>
                </tr>
              `}
            </table>
          </div>

          <div style="text-align: center; font-size: 11px; color: #64748b; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;">
            Ezt az e-mailt a HOMLAMENTOR KFT weboldal automatikus hibrid rendszere küldte.
          </div>
        </div>
      `;
    }

    const subject = isMobileHome
      ? 'ÚJ B2B JELENTKEZÉS: Kínai Mobilház-Projekt Partner'
      : `Új Érdeklődés: ${finalName} (${formName})`;

    // Feladatok párhuzamos futtatása
    const tasks: Promise<{ success?: boolean; error?: boolean; source?: string; message?: string }>[] = [];

    // 1. Resend e-mail küldés
    if (resend) {
      tasks.push(
        resend.emails.send({
          from: 'HOMLAMENTOR <onboarding@resend.dev>', // Resend ingyenes tier korlátozás miatt
          to: ['office.homlamentor@gmail.com'],
          subject: subject,
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
      console.log(`To: office.homlamentor@gmail.com`);
      console.log(`Subject: ${subject}`);
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
            name: finalName,
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

    // 3. Google Sheets CRM Ingestion via GWS CLI (csak mobilház esetén)
    if (isMobileHome) {
      tasks.push(
        new Promise((resolve) => {
          void (async () => {
            try {
              const spreadsheetId = '1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ';
              const datum = new Date().toISOString().split('T')[0];
              const rowValues = [
                datum,
                finalName || '',
                role || '',
                companyName || '',
                email || '',
                phone || '',
                preferredSize || '',
                'Uj Erdeklodo',
              ];

              const paramsStr = JSON.stringify({
                spreadsheetId,
                range: 'Mobilhaz_Jelentkezok!A1',
                valueInputOption: 'USER_ENTERED',
              });

              const bodyStr = JSON.stringify({
                values: [rowValues],
              });

              console.log('Ingesting Mobilház B2B inquiry to GWS CRM...');
              await execFilePromise('gws', [
                'sheets',
                'spreadsheets',
                'values',
                'append',
                '--params',
                paramsStr,
                '--json',
                bodyStr,
              ]);
              console.log('Sikeres Google Sheets CRM rögzítés GWS CLI-vel.');
              resolve({ success: true, source: 'GWS' });
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : 'Unknown GWS error';
              console.error('Hiba a Google Sheets (GWS) CRM rögzítés közben:', message);
              // Nem dobunk végzetes hibát, hogy a többi integráció (Resend, n8n) fusson tovább
              resolve({ error: true, source: 'GWS', message });
            }
            })();
          })
      );
    }

    // Párhuzamos végrehajtás
    const results = await Promise.all(tasks);
    
    // Vizsgáljuk meg a hibákat
    const errors = results.filter((r) => r && r.error);
    const gwsResult = results.find((r) => r && r.source === 'GWS');

    return NextResponse.json({
      success: true,
      message: 'Contact form request processed successfully.',
      integrations: {
        resend: resend ? 'active' : 'mocked',
        n8n: n8nUrl ? 'active' : 'mocked',
        gws: isMobileHome ? (gwsResult && !gwsResult.error ? 'success' : 'failed') : 'not_applicable'
      },
      errors: errors.length > 0 ? errors : undefined
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
