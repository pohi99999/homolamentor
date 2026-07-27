import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFilePromise = promisify(execFile);

// Resend inicializálása
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      companyName,
      name,
      email,
      phone,
      targetedSector,
      investmentVolume,
    } = body;

    // Minimum ellenőrzés
    if (!companyName || !name || !email || !targetedSector) {
      return NextResponse.json(
        { error: 'Company name, Representative name, Email and Targeted Sector are required fields.' },
        { status: 400 }
      );
    }

    const formName = 'Nemzetközi Divízió - Afrika Projekt Finanszírozás';

    // HTML E-mail formázás (Premium Dark Luxury & Gold/Blue)
    const htmlEmail = `
      <div style="background-color: #0b0f19; color: #f1f5f9; font-family: sans-serif; padding: 40px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0 0 10px 0; letter-spacing: 1px;">HOMLAMENTOR KFT</h1>
          <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #fbbf24; background-color: rgba(251,191,36,0.05); padding: 6px 16px; border-radius: 9999px; border: 1px solid rgba(251,191,36,0.15);">
            ${formName}
          </span>
        </div>
        
        <div style="background-color: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 25px; border-radius: 12px; margin-bottom: 25px;">
          <h2 style="color: #ffffff; font-size: 16px; margin: 0 0 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">Befektetői Információk</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #94a3b8; width: 160px; font-weight: bold;">Cég / Intézmény:</td>
              <td style="padding: 8px 0; color: #ffffff; font-weight: bold;">${companyName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Képviselő:</td>
              <td style="padding: 8px 0; color: #ffffff;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">E-mail:</td>
              <td style="padding: 8px 0; color: #ffffff;"><a href="mailto:${email}" style="color: #38bdf8; text-decoration: none;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Telefon:</td>
              <td style="padding: 8px 0; color: #ffffff;">${phone || 'Nincs megadva'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Célzott Szektor:</td>
              <td style="padding: 8px 0; color: #fbbf24; font-weight: bold;">${targetedSector}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Befektetési Volumen:</td>
              <td style="padding: 8px 0; color: #34d399; font-weight: bold;">${investmentVolume || 'Nincs megadva'}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; font-size: 11px; color: #64748b; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;">
          Ezt az e-mailt a HOMLAMENTOR KFT weboldal automatikus hibrid rendszere küldte.
        </div>
      </div>
    `;

    const subject = `ÚJ INTÉZMÉNYI BEFEKTETŐ: Afrika Projekt Finanszírozás - ${companyName}`;

    // Feladatok párhuzamos futtatása
    const tasks: Promise<{ success?: boolean; error?: boolean; source?: string; message?: string }>[] = [];

    // 1. Resend e-mail küldés a megadott címekre
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

    // 2. Google Sheets CRM Ingestion via GWS CLI
    tasks.push(
      new Promise((resolve) => {
        void (async () => {
          try {
            const spreadsheetId = '1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ';
            
            // Nev, Pozicio, Alap/Bank, Orszag, LinkedIn_URL, Email, Celzott_Szektor, Statusz, Telefon, Volumen
            const rowValues = [
              name || '',           // Nev
              '',                   // Pozicio
              companyName || '',    // Alap/Bank
              '',                   // Orszag
              '',                   // LinkedIn_URL
              email || '',          // Email
              targetedSector || '', // Celzott_Szektor
              'Uj Erdeklodo',       // Statusz
              phone || '',          // Telefon (Oszlop I)
              investmentVolume || '' // Volumen (Oszlop J)
            ];

            const paramsStr = JSON.stringify({
              spreadsheetId,
              range: 'Afrika_Projekt_Finanszirozas!A1',
              valueInputOption: 'USER_ENTERED',
            });

            const bodyStr = JSON.stringify({
              values: [rowValues],
            });

            console.log('Ingesting African Project Finance B2B inquiry to GWS CRM...');
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
            resolve({ error: true, source: 'GWS', message });
          }
        })();
      })
    );

    // Párhuzamos végrehajtás
    const results = await Promise.all(tasks);
    const errors = results.filter((r) => r && r.error);

    return NextResponse.json({
      success: true,
      message: 'Investor contact request processed successfully.',
      integrations: {
        resend: resend ? 'active' : 'mocked',
        gws: 'success'
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('API International Contact route error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message },
      { status: 500 }
    );
  }
}
