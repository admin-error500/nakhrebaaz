import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };
type Address = Record<string, unknown>;

const X = 45;
const RIGHT = 550;
const INK = "#111111";
const GREY = "#666666";
const ORANGE = "#FFAE19";

function money(value: number) {
  return `Rs. ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function dateIN(value: Date) {
  return value.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
  });
}
function line(doc: PDFKit.PDFDocument, y: number) {
  doc.moveTo(X, y).lineTo(RIGHT, y).strokeColor("#DDDDDD").lineWidth(1).stroke();
}
function parseAddress(value: string): Address {
  try {
    const obj: unknown = JSON.parse(value);
    return obj && typeof obj === "object" && !Array.isArray(obj) ? obj as Address : {};
  } catch { return {}; }
}
function field(address: Address, ...keys: string[]) {
  for (const key of keys) {
    const value = address[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}
function stateCode(value: string): string | null {
  const codes: Record<string, string> = {
    "andhra pradesh": "37", "arunachal pradesh": "12", "assam": "18",
    "bihar": "10", "chhattisgarh": "22", "goa": "30", "gujarat": "24",
    "haryana": "06", "himachal pradesh": "02", "jharkhand": "20",
    "karnataka": "29", "kerala": "32", "madhya pradesh": "23",
    "maharashtra": "27", "manipur": "14", "meghalaya": "17",
    "mizoram": "15", "nagaland": "13", "odisha": "21", "orissa": "21",
    "punjab": "03", "rajasthan": "08", "sikkim": "11", "tamil nadu": "33",
    "telangana": "36", "tripura": "16", "uttar pradesh": "09",
    "uttarakhand": "05", "west bengal": "19", "delhi": "07",
    "chandigarh": "04", "puducherry": "34", "pondicherry": "34",
    "jammu and kashmir": "01", "ladakh": "38", "lakshadweep": "31",
    "andaman and nicobar islands": "35", "dadra and nagar haveli and daman and diu": "26",
  };
  const normalized = value
  .trim()
  .toLowerCase()
  .replace(/[.,_-]/g, " ")
  .replace(/\s+/g, " ");
  if (/^\d{1,2}$/.test(normalized)) {
    const code = normalized.padStart(2, "0");
    return Object.values(codes).includes(code) ? code : null;
  }
  const aliases: Record<string, string> = {
  "up": "09",
  "u p": "09",
  "uttarpradesh": "09",
  "nct of delhi": "07",
  "new delhi": "07",
  "hr": "06",
  "haryana": "06",
  "mh": "27",
  "maharastra": "27",
  "nct delhi": "07",
  "j&k": "01",
};

if (aliases[normalized]) {
  return aliases[normalized];
}
  return codes[normalized] ?? null;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

    const { id } = await context.params;
    if (!/^[a-f0-9]{24}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const order = await db.order.findFirst({
      where: { id, ...(user.role === "ADMIN" ? {} : { userId: user.id }) },
      include: { user: { select: { name: true, email: true } }, items: true },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.paymentStatus !== "PAID") {
      return NextResponse.json({ error: "Invoice available after payment confirmation" }, { status: 403 });
    }
    if (order.items.length !== 1) {
      return NextResponse.json({
        error: "This invoice route requires one product per order. Existing multi-item orders must use a legacy invoice route or be migrated carefully.",
      }, { status: 409 });
    }

    const gstin = (process.env.SELLER_GSTIN ?? "").trim().toUpperCase();
    const sellerAddress = process.env.SELLER_REGISTERED_ADDRESS?.trim() ?? "";
    const sellerState = process.env.SELLER_STATE?.trim() ?? "Uttar Pradesh";
    const rateRaw = process.env.INVOICE_GST_RATE_PERCENT;
    const gstRate = Number(rateRaw);
    const hsn = process.env.INVOICE_PRODUCT_HSN?.trim() ?? "";
    const sellerCode = stateCode(sellerState);
    if (!/^\d{2}[A-Z0-9]{10}[1-9A-Z]Z[A-Z0-9]$/.test(gstin) || !sellerAddress ||
        !rateRaw || !Number.isFinite(gstRate) || gstRate < 0 || gstRate > 100 ||
        !sellerCode || gstin.slice(0, 2) !== sellerCode || !/^\d{4,8}$/.test(hsn)) {
      return NextResponse.json({
        error: "Configure valid SELLER_GSTIN, SELLER_REGISTERED_ADDRESS, SELLER_STATE, INVOICE_GST_RATE_PERCENT and INVOICE_PRODUCT_HSN",
      }, { status: 500 });
    }

    const address = parseAddress(order.addressJson);
    const customerState = field(address, "state", "State", "shippingState", "billingState");
    const customerCode = stateCode(customerState);
    if (!customerCode) {
      return NextResponse.json({ error: "Valid customer state is required to determine GST type" }, { status: 422 });
    }
    const sameState = sellerCode === customerCode;

    // Price and shipping are treated as GST-inclusive. This assumes one verified
    // rate/HSN for the product and its allocated shipping. For mixed tax rates,
    // persist item-level tax details at checkout and replace this calculation.
    const item = order.items[0];
    const inclusiveTotal = order.total;
    if (!Number.isSafeInteger(inclusiveTotal) || inclusiveTotal <= 0) {
      return NextResponse.json({ error: "Invalid order amount" }, { status: 422 });
    }

    // TEMPORARY: This is a per-order placeholder, NOT a compliant sequential
    // GST invoice number. Replace with an atomic FY-based sequence before launch.
    const proposedInvoiceNumber = `NB-${order.id.toUpperCase()}`;

    const existing = await db.order.findUnique({
      where: { id: order.id },
      select: { invoiceNumber: true, invoicedAt: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Order no longer exists" }, { status: 404 });
    }

    // Prisma MongoDB distinguishes an explicit null from a missing field.
    // Both must be handled for older and newly created order documents.
    if (!existing.invoiceNumber && !existing.invoicedAt) {
      await db.order.updateMany({
        where: {
          id: order.id,
          paymentStatus: "PAID",
          AND: [
            {
              OR: [
                { invoiceNumber: null },
                { invoiceNumber: { isSet: false } },
              ],
            },
            {
              OR: [
                { invoicedAt: null },
                { invoicedAt: { isSet: false } },
              ],
            },
          ],
        },
        data: {
          invoiceNumber: proposedInvoiceNumber,
          invoicedAt: new Date(),
        },
      });
    }

    const saved = await db.order.findUnique({
      where: { id: order.id },
      select: { invoiceNumber: true, invoicedAt: true },
    });
    if (!saved?.invoiceNumber || !saved.invoicedAt) {
      // Don't overwrite incomplete historical invoices silently.
      return NextResponse.json(
        { error: "Invoice record is incomplete; administrator review required" },
        { status: 409 }
      );
    }
    const invoiceNumber = saved.invoiceNumber;
    const invoiceDate = saved.invoicedAt;

    const doc = new PDFDocument({
      size: "A4", margin: X, bufferPages: true,
      info: { Title: `NakhreBaaz Invoice ${invoiceNumber}`, Author: "NakhreBaaz", Subject: "GST Invoice" },
    });
    const chunks: Buffer[] = [];
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    // Header: centered invoice title, logo, and aligned seller/customer columns.
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(19)
      .text("INVOICE", X, 40, { width: RIGHT - X, align: "center" });

    const logoPath = path.join(process.cwd(), "public", "nakhrebaaz-logo.png");

    const detailsHeadingY = 95;
    const detailsBodyY = 115;
    const sellerX = X;
    const customerX = 310;
    const sellerWidth = 235;
    const customerWidth = 240;

    doc.fillColor(INK).font("Helvetica-Bold").fontSize(10)
      .text("SELLER DETAILS", sellerX, detailsHeadingY, { width: sellerWidth });
    doc.text("CUSTOMER DETAILS", customerX, detailsHeadingY, { width: customerWidth });

    const drawDetails = (lines: string[], x: number, width: number) => {
      let cursor = detailsBodyY;
      doc.fillColor(INK).font("Helvetica").fontSize(9);
      for (const value of lines) {
        doc.text(value, x, cursor, { width, lineGap: 2 });
        cursor = doc.y + 4;
      }
      return cursor;
    };

    const sellerEndY = drawDetails(
      ["NakhreBaaz", sellerAddress, `${sellerState}, India`, `GSTIN: ${gstin}`],
      sellerX,
      sellerWidth
    );
    const customerLines = [
      order.user.name,
      order.user.email,
      field(address, "address", "addressLine1", "line1", "street", "address1"),
      field(address, "addressLine2", "line2", "address2"),
      [
        field(address, "city", "City"),
        customerState,
        field(address, "pincode", "pinCode", "postalCode", "zip"),
      ].filter(Boolean).join(", "),
    ].filter((value): value is string => typeof value === "string" && value.length > 0);
    const customerEndY = drawDetails(customerLines, customerX, customerWidth);

    // Divider below both details columns.
    let y = Math.max(sellerEndY, customerEndY) + 16;
    line(doc, y);
    y += 20;

    // Left: invoice number, then order number. Right: corresponding dates.
    const leftWidth = 305;
    const rightWidth = 190;
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(9)
      .text(`Invoice No: ${invoiceNumber}`, X, y, { width: leftWidth });
    doc.font("Helvetica").fontSize(9)
      .text(`Invoice Date: ${dateIN(invoiceDate)}`, 350, y, { width: rightWidth, align: "right" });
    y += 22;
    doc.font("Helvetica-Bold").fontSize(9)
      .text(`Order No: ${order.id.toUpperCase()}`, X, y, { width: leftWidth });
    doc.font("Helvetica").fontSize(9)
      .text(`Order Date: ${dateIN(order.createdAt)}`, 350, y, { width: rightWidth, align: "right" });
    y += 32;

    // Six columns: taxable price + product taxes = GST-inclusive product amount.
    // Shipping is shown separately as a gross amount (its applicable tax is
    // still accounted for internally; it is not added again on the invoice).
    const productGross = item.price * item.quantity;
    if (productGross !== order.subtotal || order.subtotal + order.shipping !== inclusiveTotal) {
      return NextResponse.json({ error: "Order totals do not match invoice items" }, { status: 422 });
    }
    const productTaxable = Math.round((productGross / (1 + gstRate / 100)) * 100) / 100;
    const productTax = Math.round((productGross - productTaxable) * 100) / 100;
    const productCgst = Math.round((productTax / 2) * 100) / 100;
    const productSgst = Math.round((productTax - productCgst) * 100) / 100;
    const tableColumns = [
      { label: "PRODUCT DETAILS", x: 51, width: 169, align: "left" as const },
      { label: "QTY", x: 221, width: 28, align: "center" as const },
      { label: "PRICE", x: 250, width: 72, align: "right" as const },
      { label: sameState ? "CGST" : "IGST", x: 324, width: 67, align: "right" as const },
      { label: sameState ? "SGST" : "-", x: 393, width: 61, align: "right" as const },
      { label: "TOTAL AMOUNT", x: 456, width: 88, align: "right" as const },
    ];

    doc.rect(X, y, RIGHT - X, 34).fill(INK);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(7);
    for (const col of tableColumns) {
      doc.text(col.label, col.x, y + 12, { width: col.width, align: col.align, lineBreak: false });
    }
    y += 43;

    doc.font("Helvetica-Bold").fontSize(8);
    const productHeight = doc.heightOfString(item.name, { width: 166 });
    doc.font("Helvetica").fontSize(7);
    const variantText = `Size: ${item.size} | Color: ${item.color} | HSN: ${hsn}`;
    const variantHeight = doc.heightOfString(variantText, { width: 166 });
    const rowHeight = Math.max(60, productHeight + variantHeight + 18);
    if (y + rowHeight > 685) {
      doc.addPage();
      y = 60;
    }
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(8)
      .text(item.name, 51, y + 3, { width: 166 });
    doc.fillColor(GREY).font("Helvetica").fontSize(7)
      .text(variantText, 51, y + productHeight + 7, { width: 166 });
    const rowValues = [
      String(item.quantity),
      money(productTaxable),
      money(sameState ? productCgst : productTax),
      sameState ? money(productSgst) : "-",
      money(productGross),
    ];
    doc.fillColor(INK).font("Helvetica").fontSize(7);
    tableColumns.slice(1).forEach((col, index) => {
      doc.text(rowValues[index], col.x, y + 7, {
        width: col.width, align: col.align, lineBreak: false,
      });
    });
    y += rowHeight;
    line(doc, y - 5);

    // Customer-facing totals only. Product tax is itemized above; do not
    // add it a second time to the shipping or paid amount.
    if (y + 230 > 750) { doc.addPage(); y = 65; }
    y += 18;
    const amountRow = (label: string, amount: number) => {
      doc.fillColor(INK).font("Helvetica").fontSize(9)
        .text(label, 295, y, { width: 155 })
        .text(money(amount), 445, y, { width: 95, align: "right" });
      y += 22;
    };
    amountRow("Product Total", order.subtotal);
    amountRow("Shipping Charges", order.shipping);
    y += 5;
    doc.rect(295, y, 245, 36).fill(ORANGE);
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(10)
      .text("PAID AMOUNT", 305, y + 12, { width: 125 })
      .text(money(inclusiveTotal), 432, y + 12, { width: 98, align: "right" });
    y += 56;

    // The brand logo occupies the signature area; the owner can sign directly on it.
    // No pre-printed signature image is included.
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 393, y, { fit: [140, 48], align: "center", valign: "center" });
    }
    doc.moveTo(380, y + 54).lineTo(540, y + 54).strokeColor(INK).stroke();
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(9)
      .text("Authorized Signatory", 380, y + 62, { width: 160, align: "center" })
      .font("Helvetica").text("For NakhreBaaz", 380, y + 78, { width: 160, align: "center" });

    doc.end();
    const pdf = await pdfPromise;
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="NakhreBaaz-${invoiceNumber}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
  console.error("Invoice generation error:", error);

  return NextResponse.json(
    {
      error: "Failed to generate invoice",
    },

    { status: 500 }
  );
}
}