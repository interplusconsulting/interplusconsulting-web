# ตั้งค่าระบบสมาชิก (Supabase)

ระบบ login, คอร์สออนไลน์, หลังบ้าน และบทความ ใช้ Supabase เป็นฐานข้อมูล ทำตามขั้นตอนนี้ครั้งเดียว

## 1. สร้างโปรเจกต์ Supabase
1. สมัครที่ https://supabase.com แล้วกด **New project**
2. ตั้งชื่อ เช่น `interplus` เลือก Region **Southeast Asia (Singapore)** ตั้งรหัสผ่านฐานข้อมูล (เก็บไว้ ไม่ต้องใส่ในเว็บ)

## 2. สร้างตารางและสิทธิ์
1. เมนูซ้าย **SQL Editor → New query**
2. เปิดไฟล์ `supabase/schema.sql` คัดลอกทั้งหมดไปวาง แล้วกด **Run**
3. New query อีกครั้ง วางไฟล์ `supabase/migration-exam-sales.sql` แล้วกด **Run** (ระบบขายข้อสอบแยก)
4. New query อีกครั้ง วางไฟล์ `supabase/seed-announcements.sql` แล้วกด **Run** (คัดลอกประกาศ 6 รายการเดิมเข้าระบบ)

## 3. ตั้งค่าอีเมลและลิงก์
**Authentication → URL Configuration**
- **Site URL**: `https://interplusconsulting-web.netlify.app`
- **Redirect URLs** เพิ่ม:
  - `http://localhost:3000/**`
  - `https://interplusconsulting-web.netlify.app/**`

**Authentication → Sign In / Providers → Email**: เปิด Email ไว้ (ค่าเริ่มต้น) และแนะนำให้เปิด *Confirm email*

> อีเมลของ Supabase แบบฟรีส่งได้จำกัดต่อชั่วโมง ถ้ามีผู้สมัครเยอะ ให้ตั้ง SMTP ของตัวเองที่ **Authentication → Emails → SMTP Settings**

## 4. ใส่ค่าลงไฟล์ `.env.local`
1. คัดลอกไฟล์ `.env.example` เป็น `.env.local` (อยู่ในโฟลเดอร์ `inter-plus-site`)
2. เปิด **Project Settings → API** แล้วคัดลอก
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ห้ามใช้ `service_role` key เด็ดขาด
3. ใส่ข้อมูลบัญชีรับโอน (`NEXT_PUBLIC_BANK_...`, `NEXT_PUBLIC_PROMPTPAY`)
4. ปิดแล้วเปิดเซิร์ฟเวอร์ dev ใหม่

## 5. สร้างแอดมินคนแรก
1. เปิด `/register` สมัครด้วยอีเมลของแอดมิน แล้วยืนยันอีเมล
2. กลับไปที่ **SQL Editor** รัน (เปลี่ยนอีเมลเป็นของจริง):
   ```sql
   update public.profiles set role = 'admin' where email = 'admin@example.com';
   ```
3. ออกจากระบบแล้วเข้าใหม่ จะเข้าหน้า `/admin` ได้ แอดมินคนต่อไปตั้งจากหน้า **จัดการผู้ใช้** ได้เลย

## 6. ขึ้นเว็บจริง (Netlify)
**Netlify → Site configuration → Environment variables** เพิ่มตัวแปรทั้งหมดใน `.env.local` ให้เหมือนกัน แล้ว deploy ใหม่

---

## หน้าในระบบ
| หน้า | ใช้ทำอะไร |
|---|---|
| `/login`, `/register`, `/forgot-password` | เข้าสู่ระบบ สมัคร ลืมรหัสผ่าน |
| `/learn` | คอร์สเรียนของฉัน (เฉพาะคอร์สที่ซื้อและอนุมัติแล้ว) |
| `/learn/courses` | คอร์สเรียนทั้งหมด → ซื้อด้วยการโอนและแนบสลิป |
| `/learn/lesson` | ห้องเรียน: วิดีโอ YouTube/Vimeo, ข้อความ+รูป, PDF, แบบทดสอบ |
| `/learn/orders`, `/learn/profile` | สถานะคำสั่งซื้อ, ข้อมูลส่วนตัว/เปลี่ยนรหัสผ่าน |
| `/admin` | ภาพรวมหลังบ้าน |
| `/admin/orders` | ตรวจสลิป อนุมัติ = เปิดสิทธิ์เรียนทันที |
| `/admin/courses` | สร้าง/แก้คอร์ส ราคา บทเรียน แบบทดสอบ |
| `/admin/posts` | เขียนโพสต์ (แสดงที่ `/blog`) |
| `/admin/announcements` | ประกาศบนหน้าแรก |
| `/admin/users` | ตั้งแอดมิน ระงับบัญชี เพิ่ม/ยกเลิกคอร์สให้ผู้ใช้ |

## ความปลอดภัย
สิทธิ์ทั้งหมดบังคับที่ฐานข้อมูลด้วย Row Level Security (ใน `schema.sql`) เช่น ผู้เรียนเห็นบทเรียนได้เฉพาะคอร์สที่มีสิทธิ์, เปลี่ยน role ตัวเองไม่ได้, กำหนดราคาคำสั่งซื้อเองไม่ได้, ดูคำตอบแบบทดสอบล่วงหน้าไม่ได้, สลิปเห็นได้เฉพาะเจ้าของและแอดมิน
