import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import PDFDocument from 'pdfkit';

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatIDR(n: number) {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(n);
}

function formatDate(d: string | Date | null) {
  if (!d) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(new Date(d));
}

function safeHex(hex?: string | null) {
  return hex && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#0d9488';
}

function lighten(hex: string, ratio: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * ratio);
  return '#' + [mix(r), mix(g), mix(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}

// Indonesian number-to-words
function terbilangNum(n: number): string {
  const s = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  if (n < 12)        return s[n];
  if (n < 20)        return s[n - 10] + ' belas';
  if (n < 100)       return s[Math.floor(n / 10)] + ' puluh' + (n % 10 ? ' ' + s[n % 10] : '');
  if (n < 200)       return 'seratus' + (n % 100 ? ' ' + terbilangNum(n % 100) : '');
  if (n < 1_000)     return s[Math.floor(n / 100)] + ' ratus' + (n % 100 ? ' ' + terbilangNum(n % 100) : '');
  if (n < 2_000)     return 'seribu' + (n % 1_000 ? ' ' + terbilangNum(n % 1_000) : '');
  if (n < 1_000_000) return terbilangNum(Math.floor(n / 1_000)) + ' ribu' + (n % 1_000 ? ' ' + terbilangNum(n % 1_000) : '');
  if (n < 1_000_000_000) return terbilangNum(Math.floor(n / 1_000_000)) + ' juta' + (n % 1_000_000 ? ' ' + terbilangNum(n % 1_000_000) : '');
  return terbilangNum(Math.floor(n / 1_000_000_000)) + ' miliar' + (n % 1_000_000_000 ? ' ' + terbilangNum(n % 1_000_000_000) : '');
}
function terbilang(n: number) {
  if (n === 0) return 'Nol Rupiah';
  const w = terbilangNum(Math.round(n));
  return w.charAt(0).toUpperCase() + w.slice(1) + ' Rupiah';
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function getReceiptData(invoiceCode: string) {
  let invTable = 'invoices';
  let txTable  = 'transactions';
  const m = invoiceCode.match(/INV-(\d{4})(\d{2})\d{2}-/);
  if (m) {
    const sfx = `y${m[1]}m${m[2]}`;
    const [ic, tc] = await Promise.all([
      query(`SELECT to_regclass($1) as e`, [`public.invoices_${sfx}`]),
      query(`SELECT to_regclass($1) as e`, [`public.transactions_${sfx}`]),
    ]);
    if (ic[0].e) invTable = `invoices_${sfx}`;
    if (tc[0].e) txTable  = `transactions_${sfx}`;
  }

  const [invoices, ngoRows] = await Promise.all([
    query(`
      SELECT
        i.id, i.invoice_code,
        i.donor_name_snapshot, i.donor_email, i.donor_phone,
        i.base_amount, i.admin_fee, i.total_amount,
        i.status, i.is_anonymous, i.doa, i.created_at,
        COALESCE(i.paid_at, i.created_at) AS payment_date,
        d.name  AS donor_name_db,
        d.email AS donor_email_db,
        pm.name AS payment_method_name
      FROM "${invTable}" i
      LEFT JOIN donors          d  ON d.id  = i.donor_id
      LEFT JOIN payment_methods pm ON pm.id = i.payment_method_id
      WHERE i.invoice_code = $1
    `, [invoiceCode]),
    query(`
      SELECT ngo_name, logo_url, primary_color, address,
             whatsapp_number, legal_info
      FROM ngo_configs LIMIT 1
    `, []),
  ]);

  if (!invoices.length) return null;
  const invoice  = invoices[0];
  const lineItems = await query(`
    SELECT t.qty, t.amount, c.title AS campaign_title, cv.name AS variant_name
    FROM "${txTable}" t
    JOIN campaigns c               ON c.id  = t.campaign_id
    LEFT JOIN campaign_variants cv ON cv.id = t.variant_id
    WHERE t.invoice_id = $1
  `, [invoice.id]);

  return { invoice, ngo: ngoRows[0] ?? {}, lineItems };
}

// ─── Logo fetch (before PDF doc creation to avoid z-order bugs) ───────────────

async function fetchLogo(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch (e) {
    console.warn('[PDF] logo fetch failed:', e);
    return null;
  }
}

// ─── PDF builder ─────────────────────────────────────────────────────────────

async function buildPdf(data: NonNullable<Awaited<ReturnType<typeof getReceiptData>>>): Promise<Buffer> {
  const { invoice, ngo, lineItems } = data;

  const primary     = safeHex(ngo.primary_color);
  const primaryMid  = lighten(primary, 0.82);  // section header bg
  const primaryLite = lighten(primary, 0.92);  // alt table row

  const dark  = '#1e293b';
  const muted = '#64748b';

  // ── Fetch logo FIRST (before doc is created) ──────────────────────────────
  const logoBuf = ngo.logo_url ? await fetchLogo(ngo.logo_url) : null;

  // A4 constants
  const PW = 595.28, PH = 841.89;
  const M  = 38;           // margin
  const CW = PW - M * 2;   // 519.28

  const doc = new PDFDocument({ size: 'A4', margin: M, compress: true,
    info: { Title: `Bukti Donasi ${invoice.invoice_code}` },
  });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));

  // ═══════════════════════════════════════════════════════
  // 1. HEADER  (height = 64)
  // ═══════════════════════════════════════════════════════
  const H_Y = M, H_H = 64;
  const SPLIT = CW * 0.56;

  // Left bg
  doc.rect(M, H_Y, SPLIT, H_H).fill(primaryMid);
  // Right bg (primary)
  doc.rect(M + SPLIT, H_Y, CW - SPLIT, H_H).fill(primary);

  // ── Logo (left panel) ────────────────────────────────
  const LOGO_MAX_W = 80, LOGO_MAX_H = 44;
  let textStartX = M + 10;

  if (logoBuf) {
    try {
      // Place logo at left with fit box – no align/valign (more compatible)
      doc.image(logoBuf, M + 8, H_Y + (H_H - LOGO_MAX_H) / 2, {
        fit: [LOGO_MAX_W, LOGO_MAX_H],
      });
      textStartX = M + LOGO_MAX_W + 14;
    } catch (e) {
      console.warn('[PDF] image embed failed:', e);
    }
  }

  // NGO name (left panel)
  const nameW = SPLIT - (textStartX - M) - 8;
  doc
    .fillColor(primary)
    .fontSize(logoBuf ? 13 : 15)
    .font('Helvetica-Bold')
    .text(ngo.ngo_name || 'Lembaga Donasi', textStartX, H_Y + (H_H - 28) / 2, {
      width: nameW, lineBreak: true,
    });

  // ── BUKTI DONASI (right panel) ────────────────────────
  const R_X = M + SPLIT, R_W = CW - SPLIT;
  doc
    .fillColor('#ffffff')
    .fontSize(13).font('Helvetica-Bold')
    .text('BUKTI DONASI', R_X, H_Y + 10, { width: R_W, align: 'center' });
  doc
    .fontSize(7.5).font('Helvetica')
    .text(invoice.invoice_code, R_X, H_Y + 30, { width: R_W, align: 'center' });
  doc
    .fontSize(7)
    .text(formatDate(invoice.created_at), R_X, H_Y + 43, { width: R_W, align: 'center' });

  // ── NGO address line ──────────────────────────────────
  let y = H_Y + H_H + 7;
  const addrParts = [ngo.address, ngo.whatsapp_number ? `WA: ${ngo.whatsapp_number}` : null].filter(Boolean);
  doc.fillColor(muted).fontSize(7.5).font('Helvetica')
    .text(addrParts.join('   |   '), M, y, { width: CW, lineBreak: false });
  y += 13;

  // Divider
  doc.moveTo(M, y).lineTo(M + CW, y).strokeColor('#cbd5e1').lineWidth(0.6).stroke();
  y += 10;

  // ═══════════════════════════════════════════════════════
  // 2. TWO-COLUMN INFO  (Donor | Transaction)
  // ═══════════════════════════════════════════════════════
  const COL_W = (CW - 14) / 2;   // two equal columns with 14px gap
  const COL2_X = M + COL_W + 14;
  const SH = 18;   // section header height
  const IR = 14;   // info row height
  const FS_LABEL = 7.5, FS_VAL = 8;
  const LP = 6;    // left padding inside col

  const donorName = invoice.is_anonymous
    ? 'Hamba Allah'
    : invoice.donor_name_snapshot || invoice.donor_name_db || '-';

  // Section header helper
  const secHead = (title: string, x: number, w: number, yy: number) => {
    doc.rect(x, yy, w, SH).fill(primaryMid);
    doc.fillColor(primary).fontSize(8).font('Helvetica-Bold')
      .text(title, x + LP, yy + 4, { width: w - LP * 2 });
  };

  // Info row helper (single column)
  const iRow = (label: string, val: string, x: number, w: number, yy: number) => {
    const LW = w * 0.42;
    doc.fillColor(muted).fontSize(FS_LABEL).font('Helvetica')
      .text(label, x + LP, yy + 1, { width: LW, lineBreak: false });
    doc.fillColor(dark).fontSize(FS_VAL).font('Helvetica')
      .text(val || '-', x + LP + LW, yy + 1, { width: w - LW - LP * 2, lineBreak: false });
  };

  // ── Left column: Donor ────────────────────────────────
  secHead('Data Donatur', M, COL_W, y);
  let yL = y + SH + 2;
  iRow('Nama',    donorName,                                          M, COL_W, yL); yL += IR;
  iRow('Email',   invoice.donor_email || invoice.donor_email_db || '-', M, COL_W, yL); yL += IR;
  iRow('Telepon', invoice.donor_phone || '-',                         M, COL_W, yL); yL += IR;

  // ── Right column: Transaction ─────────────────────────
  secHead('Detail Transaksi', COL2_X, COL_W, y);
  let yR = y + SH + 2;
  iRow('No. Invoice',   invoice.invoice_code,                  COL2_X, COL_W, yR); yR += IR;
  iRow('Tgl Donasi',    formatDate(invoice.created_at),         COL2_X, COL_W, yR); yR += IR;
  iRow('Tgl Bayar',     formatDate(invoice.payment_date),       COL2_X, COL_W, yR); yR += IR;
  iRow('Metode',        invoice.payment_method_name || '-',     COL2_X, COL_W, yR); yR += IR;
  iRow('Status',        invoice.status === 'PAID' ? 'Lunas ✓' : invoice.status,
                                                                 COL2_X, COL_W, yR); yR += IR;

  y = Math.max(yL, yR) + 10;

  // ═══════════════════════════════════════════════════════
  // 3. PROGRAM TABLE
  // ═══════════════════════════════════════════════════════
  // Section title
  doc.rect(M, y, CW, SH).fill(primaryMid);
  doc.fillColor(primary).fontSize(8).font('Helvetica-Bold')
    .text('Program yang Didukung', M + LP, y + 4, { width: CW - LP * 2 });
  y += SH + 1;

  // Column definitions: Program | Qty | Nominal/sat | Total
  const TC = [CW * 0.48, CW * 0.08, CW * 0.22, CW * 0.22];
  const TX = [M, M + TC[0], M + TC[0] + TC[1], M + TC[0] + TC[1] + TC[2]];
  const TR_H = 18, T_PAD = 5;
  const hAligns: ('left' | 'center' | 'right')[] = ['left', 'center', 'right', 'right'];

  // Table header row
  const TH_LABELS = ['Nama Program', 'Qty', 'Nominal', 'Total'];
  doc.rect(M, y, CW, TR_H).fill(primary);
  TH_LABELS.forEach((h, i) => {
    doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold')
      .text(h, TX[i] + T_PAD, y + 5, {
        width: TC[i] - T_PAD * 2,
        align: hAligns[i],
        lineBreak: false,
      });
  });
  y += TR_H;

  // Data rows
  let grandTotal = 0;
  (lineItems as any[]).forEach((item, idx) => {
    const bg = idx % 2 === 0 ? '#ffffff' : primaryLite;
    doc.rect(M, y, CW, TR_H).fill(bg).stroke('#e2e8f0');

    const label    = item.variant_name ? `${item.campaign_title} (${item.variant_name})` : item.campaign_title;
    const qty      = Number(item.qty   || 1);
    const amount   = Number(item.amount || 0);
    const rowTotal = qty * amount;
    grandTotal    += rowTotal;

    const cells   = [label, String(qty), formatIDR(amount), formatIDR(rowTotal)];
    cells.forEach((v, i) => {
      doc.fillColor(dark).fontSize(7.5).font('Helvetica')
        .text(v, TX[i] + T_PAD, y + 5, {
          width: TC[i] - T_PAD * 2,
          align: hAligns[i],
          lineBreak: false,
        });
    });
    y += TR_H;
  });

  // ── Summary rows ─────────────────────────────────────
  const sumRow = (label: string, val: string, bold = false, hl = false) => {
    const bg = hl ? primaryLite : '#f8fafc';
    doc.rect(M, y, CW, TR_H).fill(bg).stroke('#e2e8f0');
    doc
      .fillColor(hl ? primary : muted)
      .fontSize(8).font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .text(label, M + T_PAD, y + 5, { width: CW * 0.72 });
    doc
      .fillColor(hl ? primary : dark)
      .fontSize(8).font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .text(val, TX[3] + T_PAD, y + 5, { width: TC[3] - T_PAD * 2, align: 'right', lineBreak: false });
    y += TR_H;
  };

  if (Number(invoice.admin_fee) > 0) {
    sumRow('Nominal Donasi',   formatIDR(Number(invoice.base_amount)));
    sumRow('Biaya Layanan',    formatIDR(Number(invoice.admin_fee)));
  }
  sumRow('TOTAL PEMBAYARAN', formatIDR(Number(invoice.total_amount)), true, true);
  y += 5;

  // ── Terbilang ─────────────────────────────────────────
  doc.fillColor(dark).fontSize(8).font('Helvetica-Oblique')
    .text(`Terbilang: ${terbilang(Number(invoice.total_amount))}`, M, y, { width: CW });
  y += 14;

  // ── Doa / Pesan ───────────────────────────────────────
  if (invoice.doa) {
    doc.fillColor(muted).fontSize(7.5).font('Helvetica-Oblique')
      .text(`Pesan: "${invoice.doa}"`, M, y, { width: CW });
    y += 14;
  }

  // ═══════════════════════════════════════════════════════
  // 4. FOOTER (pinned at page bottom)
  // ═══════════════════════════════════════════════════════
  const F_Y = PH - M - 46;
  doc.moveTo(M, F_Y).lineTo(M + CW, F_Y).strokeColor('#e2e8f0').lineWidth(0.6).stroke();
  doc.fillColor(muted).fontSize(7.5).font('Helvetica')
    .text(
      `Terima kasih atas kepercayaan dan kebaikan Anda. ${ngo.ngo_name || ''} berkomitmen menyalurkan donasi secara transparan dan amanah.`,
      M, F_Y + 7, { width: CW, align: 'center' }
    );
  if (ngo.legal_info) {
    doc.fontSize(6.5).text(ngo.legal_info, M, F_Y + 22, { width: CW, align: 'center' });
  }
  doc.fillColor(primary).fontSize(7.5).font('Helvetica-Bold')
    .text(ngo.ngo_name || '', M, F_Y + 34, { width: CW, align: 'center' });

  doc.end();

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ invoiceCode: string }> }
) {
  const { invoiceCode } = await params;
  try {
    const data = await getReceiptData(invoiceCode);
    if (!data) return NextResponse.json({ status: 'error', message: 'Invoice not found' }, { status: 404 });

    const pdf = await buildPdf(data);

    return new Response(pdf as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="bukti-donasi-${invoiceCode}.pdf"`,
        'Content-Length': String(pdf.length),
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (err: any) {
    console.error('[PDF] error:', err);
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}
