/**
 * Inter Plus Consulting — email the admin when a new order (course or exam) arrives.
 *
 * Install (once, signed in as the Gmail account that should SEND the emails):
 *   1. Open https://script.google.com → New project → paste this whole file over Code.gs
 *   2. Replace PASTE_SECRET_HERE below with the secret (the same one stored in Supabase)
 *   3. Deploy → New deployment → type "Web app" → Execute as: Me → Who has access: Anyone → Deploy
 *   4. Allow the permissions Google asks for (send email as you)
 *   5. Copy the Web app URL (https://script.google.com/macros/s/…/exec) and store it in Supabase
 *
 * Supabase calls this URL from the database trigger in supabase/migration-order-email.sql.
 * Requests without the right secret are ignored.
 */

const SECRET = 'PASTE_SECRET_HERE';
const ADMIN_EMAIL = 'interplusconsulting@gmail.com';
const SITE_URL = 'https://interplusconsulting-web.netlify.app';

function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return reply({ ok: false, error: 'bad json' }); }
  if (!data || data.secret !== SECRET) return reply({ ok: false, error: 'forbidden' });

  if (data.type === 'test') {
    MailApp.sendEmail({ to: ADMIN_EMAIL, subject: 'ทดสอบการแจ้งเตือนคำสั่งซื้อ — Inter Plus Consulting', htmlBody: '<p>ระบบแจ้งเตือนคำสั่งซื้อทางอีเมลใช้งานได้แล้ว ✅</p>', name: 'Inter Plus Consulting' });
    return reply({ ok: true });
  }

  if (data.type === 'new_order') {
    const o = data.order || {};
    const kind = o.item_type === 'exam' ? 'ข้อสอบ' : 'คอร์ส';
    const amount = Number(o.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const when = o.created_at ? Utilities.formatDate(new Date(o.created_at), 'Asia/Bangkok', 'd MMM yyyy HH:mm') : '-';
    const rows = [
      ['รายการ', kind + ': ' + esc(o.item_title)],
      ['ยอดที่ต้องโอน', '<b style="color:#ef2d32;font-size:18px">' + amount + ' บาท</b>'],
      ['ผู้ซื้อ', esc(o.buyer_name) || '-'],
      ['อีเมล', esc(o.buyer_email) || '-'],
      ['เบอร์โทร', esc(o.buyer_phone) || '-'],
      ['เลขอ้างอิงสลิป', esc(o.slip_ref) || '-'],
      ['เวลา', when],
    ].map(function (r) { return '<tr><td style="padding:6px 12px 6px 0;color:#5b6e7d;white-space:nowrap">' + r[0] + '</td><td style="padding:6px 0">' + r[1] + '</td></tr>'; }).join('');
    const html =
      '<div style="font-family:Tahoma,Arial,sans-serif;font-size:15px;color:#0b2944;max-width:560px">' +
      '<h2 style="margin:0 0 12px">มีคำสั่งซื้อใหม่ รอตรวจสลิป</h2>' +
      '<table style="border-collapse:collapse">' + rows + '</table>' +
      '<p style="margin:18px 0"><a href="' + SITE_URL + '/admin/orders" style="background:#ef2d32;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">เปิดหน้าตรวจสลิป</a></p>' +
      '<p style="color:#7d8f9c;font-size:13px">ก่อนอนุมัติ กรุณาเช็กในแอปธนาคารว่ามีเงินเข้า ' + amount + ' บาท ตรงตามยอด</p></div>';
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: 'คำสั่งซื้อใหม่: ' + kind + ' ' + (o.item_title || '') + ' (' + amount + ' บาท)',
      htmlBody: html,
      name: 'Inter Plus Consulting',
      replyTo: o.buyer_email || ADMIN_EMAIL,
    });
    return reply({ ok: true });
  }

  return reply({ ok: false, error: 'unknown type' });
}

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
