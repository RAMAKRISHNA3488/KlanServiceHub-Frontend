// Professional Indian GST Tax Invoice Generator for KSH Service Hub

export function formatINR(amount = 0) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function numberToIndianWords(num) {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : 'Only';
  return 'INR ' + str.trim();
}

export function generateInvoiceHtml(invoice, workspace = {}, costSummary = {}, employeeLicenses = []) {
  const invNumber = invoice.invoice_number || invoice.invoiceNumber || 'INV-2026-001';
  const invDate = new Date(invoice.invoice_date || invoice.date || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const subtotal = invoice.amount ? Math.round(invoice.amount / 1.18) : (costSummary.totalAllocatedCostInr || 7999);
  const totalAmount = invoice.amount || (costSummary.totalWithGstInr || 9439);
  const totalTax = totalAmount - subtotal;
  const cgst = Math.round(totalTax / 2);
  const sgst = totalTax - cgst;
  const words = numberToIndianWords(Math.round(totalAmount));

  const wsName = workspace.name || 'Enterprise Workspace';
  const ownerEmail = workspace.email || 'admin@company.com';

  const lineItems = employeeLicenses && employeeLicenses.length > 0 ? employeeLicenses.slice(0, 10) : [];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>KSH Tax Invoice - ${invNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    body {
      background-color: #f8fafc;
      padding: 40px 20px;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .invoice-card {
      max-width: 850px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 48px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 24px;
      margin-bottom: 28px;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-badge {
      width: 44px;
      height: 44px;
      background: #2563eb;
      color: #ffffff;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 20px;
    }

    .brand-name {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
    }

    .brand-sub {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
    }

    .invoice-title-block {
      text-align: right;
    }

    .invoice-title {
      font-size: 24px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .invoice-meta {
      font-size: 12px;
      color: #475569;
      margin-top: 4px;
      line-height: 1.6;
    }

    .status-badge {
      display: inline-block;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      margin-top: 6px;
    }

    .party-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 28px;
    }

    .party-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .party-name {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .party-detail {
      font-size: 12px;
      color: #475569;
      line-height: 1.5;
    }

    .table-wrapper {
      margin-bottom: 24px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    thead th {
      background: #f1f5f9;
      color: #334155;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px 14px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      text-align: left;
    }

    tbody td {
      padding: 12px 14px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }

    .text-right {
      text-align: right;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 24px;
      margin-top: 20px;
    }

    .words-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      padding: 16px;
    }

    .words-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
    }

    .words-text {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }

    .calc-table {
      width: 100%;
      font-size: 12px;
    }

    .calc-table tr td {
      padding: 6px 0;
      border: none;
    }

    .calc-table tr.grand-total td {
      padding-top: 12px;
      border-top: 2px solid #0f172a;
      font-size: 16px;
      font-weight: 900;
      color: #0f172a;
    }

    .footer-row {
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .footer-note {
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
      max-width: 450px;
    }

    .signature-block {
      text-align: right;
    }

    .signature-badge {
      display: inline-block;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      font-weight: 800;
      color: #2563eb;
      border: 1.5px dashed #2563eb;
      padding: 6px 14px;
      border-radius: 6px;
      margin-bottom: 4px;
    }

    .print-bar {
      max-width: 850px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .btn {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .btn:hover {
      background: #1d4ed8;
    }

    .btn-outline {
      background: #ffffff;
      color: #334155;
      border: 1px solid #cbd5e1;
    }

    .btn-outline:hover {
      background: #f8fafc;
    }

    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .print-bar {
        display: none !important;
      }
      .invoice-card {
        border: none;
        box-shadow: none;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <button class="btn btn-outline" onclick="window.close()">Close Window</button>
    <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <div class="invoice-card">
    <!-- Header -->
    <div class="header-row">
      <div class="brand-logo">
        <div class="logo-badge">K</div>
        <div>
          <div class="brand-name">KSH Cloud Services</div>
          <div class="brand-sub">Enterprise Agile SaaS & Seat Licensing</div>
        </div>
      </div>

      <div class="invoice-title-block">
        <div class="invoice-title">Tax Invoice</div>
        <div class="invoice-meta">
          <strong>Invoice No:</strong> ${invNumber}<br>
          <strong>Issue Date:</strong> ${invDate}<br>
          <strong>Place of Supply:</strong> Karnataka (State Code: 29)
        </div>
        <div class="status-badge">✓ ${invoice.status || 'PAID'}</div>
      </div>
    </div>

    <!-- Parties Grid -->
    <div class="party-grid">
      <div>
        <div class="party-title">Supplier / Billed From</div>
        <div class="party-name">KSH Technologies India Pvt Ltd</div>
        <div class="party-detail">
          Level 8, Tech Park Outer Ring Road<br>
          Bengaluru, Karnataka 560103, India<br>
          <strong>GSTIN:</strong> 29AABCU9603R1ZM<br>
          <strong>PAN:</strong> AABCU9603R • <strong>SAC Code:</strong> 998315
        </div>
      </div>

      <div>
        <div class="party-title">Customer / Billed To</div>
        <div class="party-name">${wsName}</div>
        <div class="party-detail">
          <strong>Account Owner:</strong> ${ownerEmail}<br>
          <strong>Workspace ID:</strong> ${workspace.id ? workspace.id.slice(0, 16) : 'ws-prod'}<br>
          <strong>Country:</strong> India<br>
          <strong>Payment Mode:</strong> Online Card / UPI (Authorized)
        </div>
      </div>
    </div>

    <!-- Line Items Table -->
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 45%;">Service & Seat Description</th>
            <th style="width: 15%; text-align: center;">SAC / HSN</th>
            <th style="width: 15%; text-align: center;">Seats / Qty</th>
            <th style="width: 20%;" class="text-right">Amount (INR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>
              <strong>KSH Enterprise Cloud Platform</strong><br>
              <span style="font-size: 11px; color: #64748b;">Monthly base SaaS subscription license with 500GB storage & SLA</span>
            </td>
            <td style="text-align: center;">998315</td>
            <td style="text-align: center;">1 Org</td>
            <td class="text-right">₹${subtotal.toLocaleString('en-IN')}</td>
          </tr>
          ${
            lineItems.length > 0
              ? `
          <tr>
            <td>2</td>
            <td>
              <strong>Allocated Employee Seat Licenses (${lineItems.length} Team Members)</strong><br>
              <span style="font-size: 11px; color: #64748b;">
                ${lineItems.map((e) => `${e.name} (${e.licenseTierName})`).slice(0, 3).join(', ')}${lineItems.length > 3 ? ` + ${lineItems.length - 3} more` : ''}
              </span>
            </td>
            <td style="text-align: center;">998315</td>
            <td style="text-align: center;">${lineItems.length} Seats</td>
            <td class="text-right" style="color: #047857; font-weight: 700;">Included in Tier</td>
          </tr>
          `
              : ''
          }
        </tbody>
      </table>
    </div>

    <!-- Calculations and Words -->
    <div class="summary-grid">
      <div class="words-box">
        <div class="words-title">Amount In Words (INR)</div>
        <div class="words-text">${words}</div>
        <p style="font-size: 11px; color: #64748b; margin-top: 8px;">
          This is a computer-generated tax invoice that is legally valid without a physical signature under the Indian IT Act, 2000.
        </p>
      </div>

      <div>
        <table class="calc-table">
          <tr>
            <td style="color: #64748b;">Subtotal (Taxable Value):</td>
            <td class="text-right" style="font-weight: 700;">₹${subtotal.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">CGST @ 9.0%:</td>
            <td class="text-right" style="font-weight: 700;">₹${cgst.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">SGST @ 9.0%:</td>
            <td class="text-right" style="font-weight: 700;">₹${sgst.toLocaleString('en-IN')}</td>
          </tr>
          <tr class="grand-total">
            <td>Total Invoice (INR):</td>
            <td class="text-right">₹${Math.round(totalAmount).toLocaleString('en-IN')}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-row">
      <div class="footer-note">
        <strong>Terms & Conditions:</strong><br>
        1. All cloud services are billed monthly in advance in Indian Rupees (INR).<br>
        2. Input Tax Credit (ITC) is applicable under GST Law on this valid tax invoice.
      </div>

      <div class="signature-block">
        <div class="signature-badge">DIGITALLY VERIFIED</div>
        <div style="font-size: 11px; font-weight: 800; color: #0f172a;">Authorized Signatory</div>
        <div style="font-size: 10px; color: #64748b;">KSH Technologies India</div>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

export function downloadInvoicePdf(invoice, workspace = {}, costSummary = {}, employeeLicenses = []) {
  const html = generateInvoiceHtml(invoice, workspace, costSummary, employeeLicenses);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

export function downloadInvoiceCsv(invoice, workspace = {}) {
  const invNumber = invoice.invoice_number || invoice.invoiceNumber || 'INV-2026-001';
  const subtotal = invoice.amount ? Math.round(invoice.amount / 1.18) : 7999;
  const totalAmount = invoice.amount || 9439;
  const cgst = Math.round((totalAmount - subtotal) / 2);
  const sgst = (totalAmount - subtotal) - cgst;

  const csvRows = [
    ['TAX INVOICE - KSH CLOUD SERVICES'],
    ['Invoice Number', invNumber],
    ['Invoice Date', invoice.invoice_date || invoice.date || new Date().toISOString().slice(0, 10)],
    ['Status', invoice.status || 'PAID'],
    ['Currency', 'INR (Indian Rupees)'],
    ['GSTIN Supplier', '29AABCU9603R1ZM'],
    ['Customer Workspace', workspace.name || 'Workspace'],
    ['Customer Owner', workspace.email || ''],
    [],
    ['Item #', 'Description', 'SAC Code', 'Qty', 'Amount (INR)'],
    ['1', 'KSH SaaS Subscription License & Seat Quotas', '998315', '1', subtotal],
    [],
    ['Subtotal (Taxable Value)', '', '', '', subtotal],
    ['CGST @ 9%', '', '', '', cgst],
    ['SGST @ 9%', '', '', '', sgst],
    ['Grand Total (INR)', '', '', '', totalAmount],
  ];

  const csvContent = csvRows.map((e) => e.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `tax-invoice-${invNumber}-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadInvoiceJson(invoice, workspace = {}) {
  const invNumber = invoice.invoice_number || invoice.invoiceNumber || 'INV-2026-001';
  const subtotal = invoice.amount ? Math.round(invoice.amount / 1.18) : 7999;
  const totalAmount = invoice.amount || 9439;

  const data = {
    invoiceNumber: invNumber,
    date: invoice.invoice_date || invoice.date || new Date().toISOString(),
    status: invoice.status || 'PAID',
    currency: 'INR',
    currencySymbol: '₹',
    supplier: {
      companyName: 'KSH Technologies India Pvt Ltd',
      gstin: '29AABCU9603R1ZM',
      pan: 'AABCU9603R',
      sacCode: '998315',
      state: 'Karnataka (29)',
    },
    customer: {
      workspaceName: workspace.name || 'Enterprise Workspace',
      ownerEmail: workspace.email || '',
      country: 'India',
    },
    lineItems: [
      {
        itemNumber: 1,
        description: 'KSH Enterprise Cloud SaaS Subscription',
        sac: '998315',
        quantity: 1,
        unitPriceInr: subtotal,
        totalInr: subtotal,
      },
    ],
    pricing: {
      subtotalInr: subtotal,
      cgstRatePercent: 9,
      cgstAmountInr: Math.round((totalAmount - subtotal) / 2),
      sgstRatePercent: 9,
      sgstAmountInr: Math.round((totalAmount - subtotal) / 2),
      totalWithTaxInr: totalAmount,
    },
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `tax-invoice-${invNumber}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
