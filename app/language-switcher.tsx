'use client';

import { useEffect, useState } from 'react';

const thToEn: Record<string, string> = {
  'คอร์สภาษาอังกฤษออนไลน์จาก Learning Plus by Kru Jew': 'Online English courses from Learning Plus by Kru Jew',
  'ข้อสอบเสมือนจริงจาก Learning Plus by Kru Jew': 'Practice exams from Learning Plus by Kru Jew',
  'บริการ':'Services','เกี่ยวกับเรา':'About us','ขั้นตอน':'Process','ปรึกษาฟรี':'Free consultation','ปรึกษาฟรี ↗︎':'Free consultation ↗︎',
  'เปิดประตูสู่':'Open the door to','โอกาสใหม่':'new opportunities','ทั่วโลก':'around the world',
  'วางแผนการเรียน การทำงาน และการเดินทางต่างประเทศอย่างมั่นใจ ด้วยทีมที่ปรึกษาที่ดูแลคุณทุกขั้นตอน':'Plan your study, career and international journey with confidence, supported by advisors at every step.',
  'เริ่มวางแผนกับเรา':'Start planning with us','ดูบริการทั้งหมด':'Explore all services','ปีแห่งประสบการณ์':'years of experience','บริการหลักครบวงจร':'complete core services','ดูแลแบบรายบุคคล':'personal guidance',
  'เรื่องยาก เราช่วยให้ง่าย':'We make complex journeys simple','เรียนภาษาอังกฤษ　✦　เรียนต่อ UK　✦　ทำงานต่างประเทศ　✦　วีซ่าและการเดินทาง　✦　ทัวร์ส่วนตัว':'English courses　✦　Study in the UK　✦　Work abroad　✦　Travel & visas　✦　Private tours','ม.1 / ม.4 · TCAS · NETSAT · TGAT · A-Level':'Grade 7 / Grade 10 · TCAS · NETSAT · TGAT · A-Level',
  'เรียนภาษาอังกฤษ':'English courses','เรียนต่อประเทศอังกฤษ':'Study in the UK','ทำงานต่างประเทศ':'Work abroad','ท่องเที่ยวและวีซ่า':'Travel & visa',
  'ทุกเป้าหมายของคุณ':'Every goal can','ไปได้ไกลกว่าเดิม':'go further','บริการแบบ One-Stop Service ตั้งแต่ค้นหาเส้นทางที่ใช่ เตรียมเอกสาร จนถึงวันที่คุณออกเดินทาง':'One-stop support from finding the right path and preparing documents to your departure day.',
  'Beginner ถึง Advanced พร้อมคอร์ส IELTS, TOEFL, CU-TEP, TU-GET, KEPT และ TCAS':'Beginner to Advanced, including IELTS, TOEFL, CU-TEP, TU-GET, KEPT and TCAS preparation.',
  'Summer Course และหลักสูตรระยะสั้น-ยาว ตั้งแต่ 1 เดือนถึง 1 ปี':'Summer courses and short- to long-term programs from one month to one year.',
  'Seasonal Work, Work & Travel และโอกาสทำงานสำหรับผู้มีทักษะ':'Seasonal Work, Work & Travel and skilled employment opportunities.',
  'วางแผนการเดินทาง วีซ่า ตั๋วเครื่องบิน ทัวร์ส่วนตัว และไกด์':'Travel planning, visas, flights, private tours and guide services.','ดูรายละเอียด':'View details','เลือกเพื่อดูตัวเลือก':'Select to view options',
  'เรียนได้ทั้งตัวต่อตัว กลุ่มเล็ก ออนไลน์ ออนไซต์ และ Hybrid':'Private, small-group, online, on-site and hybrid learning.','เตรียมสอบ IELTS, TOEFL, CU-TEP, TU-GET, KEPT และ TCAS':'Preparation for IELTS, TOEFL, CU-TEP, TU-GET, KEPT and TCAS.','ปรับเนื้อหาและตารางเรียนตามระดับและเป้าหมายของผู้เรียน':'Lessons and schedules tailored to each learner’s level and goals.',
  'ช่วยเลือกเมือง สถาบัน และหลักสูตรที่เหมาะสม':'Choose the right city, institution and course.','ดูแลขั้นตอนสมัครเรียน เอกสาร และการเตรียมตัวก่อนเดินทาง':'Support with applications, documents and pre-departure preparation.','มีทั้ง Summer Course และหลักสูตรระยะสั้นถึงระยะยาว':'Summer courses and short- to long-term programs.',
  'แนะนำ Seasonal Work, Work & Travel และเส้นทางสำหรับผู้มีทักษะ':'Guidance for Seasonal Work, Work & Travel and skilled pathways.','ตรวจสอบคุณสมบัติและช่วยวางแผนเอกสารที่เกี่ยวข้อง':'Eligibility checks and document planning.','ให้คำแนะนำตามระยะเวลา งบประมาณ และเป้าหมายของผู้สมัคร':'Advice tailored to timing, budget and applicant goals.',
  'บริการวางแผนและยื่นวีซ่าหลากหลายประเภท':'Planning and application support for many visa types.','ประสานงานตั๋วเครื่องบิน ทัวร์ส่วนตัว และไกด์':'Coordination for flights, private tours and guides.','ออกแบบแผนการเดินทางให้เหมาะกับเวลาและงบประมาณ':'Travel plans tailored to your time and budget.',
  'ภาษาอังกฤษ':'English that','ที่พาคุณไปถึง':'takes you to','เป้าหมายจริง':'your real goal','เรียนตัวต่อตัว กลุ่มเล็ก ออนไลน์ ออนไซต์ หรือ Hybrid ปรับบทเรียนให้เหมาะกับระดับและเป้าหมายของผู้เรียน':'Private, small-group, online, on-site or hybrid classes tailored to each learner’s level and goal.','สอบถามคอร์สเรียน ↗︎':'Ask about courses ↗︎',
  'เตรียมภาษาเพื่อเรียนต่อและทำงานต่างประเทศ':'English preparation for overseas study and work','คอร์สภาษาไทยสำหรับชาวต่างชาติ':'Thai courses for international learners',
  'พร้อมใช้ชีวิตจริง':'and experience life','ที่ Cambridge':'in Cambridge','สัมผัสบรรยากาศเมืองมหาวิทยาลัยชั้นนำ เรียนภาษา ทำกิจกรรม และพักกับ Host Family อย่างปลอดภัย':'Study in a world-class university city, join activities and stay safely with a host family.','2-3 สัปดาห์':'2-3 weeks','เรียน 30 ชั่วโมง':'30 study hours',
  '“เราไม่ได้พาไปแค่เรียนภาษา แต่พาไปค้นพบความมั่นใจและโลกใบใหม่”':'“We do more than teach English — we help you discover confidence and a new world.”',
  'เลือกเส้นทางที่เหมาะ':'Choose the path that fits','กับจังหวะชีวิตคุณ':'your stage of life','3-6 เดือน':'3-6 months','6 เดือน - 1 ปี':'6 months - 1 year','1-2 ปี':'1-2 years',
  'โครงการทำงานตามฤดูกาล เปิดประสบการณ์ใหม่ในระยะเวลาที่พอดี':'Seasonal work that opens new experiences within a practical timeframe.','ทำงานและท่องเที่ยวต่างประเทศ พร้อมเติบโตทั้งทักษะและมุมมอง':'Work and travel abroad while growing your skills and perspective.','โอกาสระยะยาวสำหรับผู้มีทักษะ พร้อมคำแนะนำด้านเอกสารและสัญญา':'Long-term opportunities for skilled workers, with document and contract guidance.',
  'เลือกแล้ว ✓':'Selected ✓','เลือกโปรแกรมนี้':'Select this program','สนใจโปรแกรมนี้':'I’m interested',
  '4 ขั้นตอน':'4 simple steps','สู่เป้าหมายของคุณ':'to your goal','เรื่องต่างประเทศไม่จำเป็นต้องซับซ้อน เมื่อมีคนที่เข้าใจคอยเดินไปกับคุณ':'Going abroad does not have to be complicated when the right team is beside you.',
  'คุยกับที่ปรึกษา':'Talk to an advisor','เล่าเป้าหมาย งบประมาณ และช่วงเวลาที่ต้องการ':'Share your goals, budget and preferred timing.','ออกแบบแผนเฉพาะคุณ':'Build your personal plan','ทีมงานคัดหลักสูตร โปรแกรม หรือเส้นทางที่เหมาะสม':'We select the right course, program or pathway.','เตรียมเอกสาร':'Prepare documents','ดูแลใบสมัคร วีซ่า เอกสารรับรอง และการจองต่าง ๆ':'We handle applications, visas, supporting documents and bookings.','เดินทางอย่างมั่นใจ':'Travel with confidence','มีทีมงานประสานงานและให้คำแนะนำตลอดทริป':'Our team coordinates and supports you throughout the journey.',
  'คำแนะนำที่ดี':'The right guidance','เปลี่ยนอนาคตได้':'can change your future','Inter Plus Consulting เชื่อว่าทุกคนมีเส้นทางที่เหมาะกับตัวเอง เราจึงเริ่มจากการฟัง ทำความเข้าใจ และวางแผนอย่างตรงจุด ไม่ขายฝัน แต่ช่วยให้คุณเห็นทางเลือกที่เป็นไปได้จริง':'Inter Plus Consulting believes everyone has a path that suits them. We listen, understand and create realistic plans that turn possibilities into action.',
  'ทีมงานมีประสบการณ์และเข้าใจระบบต่างประเทศ':'Experienced team with international-system knowledge','ดูแลครบตั้งแต่เลือกโปรแกรมจนถึงวันเดินทาง':'Complete support from program selection to departure','ให้คำปรึกษาอย่างจริงใจและเหมาะกับแต่ละบุคคล':'Honest, personal and practical advice',
  'สถาบันที่ร่วมงานกับเรา':'Institutions we work with',
  'ข่าวสารและ':'News and','ประกาศล่าสุด':'latest announcements','ติดตามโครงการ คอร์สเรียน และโอกาสใหม่จาก Inter Plus Consulting กดที่รูปเพื่อดูประกาศขนาดใหญ่':'Follow the latest programs, courses and opportunities from Inter Plus Consulting. Select an image to view the full announcement.','ติดตามโครงการ คอร์สเรียน และโอกาสใหม่จาก Inter Plus Consulting กดที่ประกาศเพื่อดูรายละเอียด':'Follow the latest programs, courses and opportunities from Inter Plus Consulting. Select an announcement to view details.','เปิดรับสมัครคอร์สเรียนภาษาอังกฤษที่ Cambridge':'Applications open for an English course in Cambridge','เรียนภาษา ทำกิจกรรม และสัมผัสประสบการณ์ใช้ชีวิตจริงในประเทศอังกฤษ พร้อมทีมดูแลตลอดการเดินทาง':'Study English, join activities and experience life in the UK with support throughout the journey.','วางแผนเรียนต่อต่างประเทศกับที่ปรึกษา':'Plan your overseas study with an advisor','เลือกประเทศ หลักสูตร และเส้นทางที่เหมาะกับเป้าหมาย พร้อมคำแนะนำด้านเอกสารและการเตรียมตัว':'Choose the country, course and pathway that fit your goals, with document and preparation guidance.','ขยายรูป ↗︎':'Enlarge image ↗︎','ดูรายละเอียด ↗︎':'View details ↗︎','กดรูปเพื่อขยาย ↗︎':'Select image to enlarge ↗︎','ประกาศล่าสุด · SUMMER UK COURSE':'Latest announcement · SUMMER UK COURSE','ดูประกาศทั้งหมด ↓':'View all announcements ↓',
  'แล้วพบกันกับโครงการที่จะถึงนี้':'See you at our upcoming program','โครงการและโอกาสใหม่กำลังจะเปิดตัวเร็ว ๆ นี้ ติดตามรายละเอียด กำหนดการ และการเปิดรับสมัครได้ที่ Inter Plus Consulting':'New programs and opportunities are coming soon. Follow Inter Plus Consulting for details, schedules and application dates.','ประกาศล่าสุด · COMING SOON':'Latest announcement · COMING SOON',
  'ไปยังประกาศ ↓':'Go to announcement ↓',
  'ดูประกาศทั้งหมด':'View all announcements',
  'เลื่อนดูประกาศ':'Browse announcements',
  'ประกาศ ·':'Announcement ·',
  'PRIVATE TOUR · นครพนม–ท่าแขก':'PRIVATE TOUR · NAKHON PHANOM–THAKHEK',
  'ทริปนครพนม–ลาว (ท่าแขก) 3 วัน 2 คืน':'Nakhon Phanom–Laos (Thakhek): 3 days, 2 nights',
  'ไหว้พระธาตุพนม ข้ามโขงเที่ยวท่าแขกและท่าฝรั่ง เดินทางสบายด้วยรถตู้ Hyundai H-1 พร้อมอาหารตามแผนและทีมดูแล ราคา 7,000 บาท/ท่าน หรือจองคู่ 13,000 บาท':'Visit Phra That Phanom, cross the Mekong to Thakhek and Tha Falang. Travel in a Hyundai H-1 with planned meals and team support. THB 7,000 per person or THB 13,000 for two.',
  'เที่ยวสบายกับครอบครัวและคนที่คุณรัก: ไหว้พระธาตุศักดิ์สิทธิ์ริมฝั่งโขงที่นครพนม แล้วข้ามไปสัมผัสธรรมชาติและบรรยากาศเมืองท่าแขก แขวงคำม่วน สปป.ลาว พร้อมเช็คอินท่าฝรั่ง':'Enjoy a relaxed family trip: visit the sacred stupa by the Mekong in Nakhon Phanom, then discover Thakhek in Khammouane, Laos, including Tha Falang.',
  'ทริป 3 วัน 2 คืน เดินทางด้วยรถตู้พรีเมียม Hyundai H-1 รวมอาหารตามแผนการเดินทาง และมีทีมงานดูแลใกล้ชิดตลอดทริป':'This 3-day, 2-night trip includes a premium Hyundai H-1 van, meals according to the itinerary and attentive support throughout.',
  'ราคา 7,000 บาทต่อท่าน หรือจองพร้อมกัน 2 ท่าน ราคา 13,000 บาท (เฉลี่ยท่านละ 6,500 บาท)':'THB 7,000 per person, or THB 13,000 for two (THB 6,500 per person).',
  'สอบถามแผนการเดินทางและการจอง: 098-1045788 (ครูจิ๋ว) หรือ 091-7801023 (คุณจูเนียร์)':'Itinerary and booking enquiries: 098-1045788 (Kru Jiw) or 091-7801023 (Khun Junior).',
  'ภาพโปรโมชัน':'Promotion','แผนการเดินทาง':'Itinerary',
  'ทริปสุดคุ้ม นครพนม–ลาว (ท่าแขก) 3 วัน 2 คืน เช็คอินท่าฝรั่ง นั่งรถตู้ VIP กินดี เที่ยวสบาย มีทีมงานดูแล เริ่มต้น 7,000 บาท/ท่าน หรือจองคู่ 13,000 บาท':'Great-value Nakhon Phanom–Thakhek trip: 3 days, 2 nights. Visit Tha Falang, travel in a VIP van and enjoy included meals and team support. From THB 7,000 per person or THB 13,000 for two.',
  'เที่ยวสบาย เดินทางสบาย ไปกับทริป “นครพนม–ลาว (ท่าแขก)” 3 วัน 2 คืน ชวนครอบครัวและคนที่คุณรักมาร่วมเดินทางท่องเที่ยว พักผ่อนจิตใจ ไหว้พระธาตุศักดิ์สิทธิ์ริมฝั่งโขงที่นครพนม แล้วข้ามโขงไปสัมผัสบรรยากาศความสงบและธรรมชาติที่สมบูรณ์ของเมืองท่าแขก แขวงคำม่วน สปป.ลาว พร้อมไฮไลต์เช็คอินนอนแพริมน้ำใสสะอาดที่ “ท่าฝรั่ง”':'Travel in comfort on our 3-day, 2-night Nakhon Phanom–Laos (Thakhek) trip. Bring family and loved ones to relax, visit the sacred stupa by the Mekong in Nakhon Phanom, then cross the river to enjoy the peaceful scenery of Thakhek, Khammouane, Laos. A highlight is an overnight stay on a raft at the clear waters of Tha Falang.',
  'ทริปนี้เราดูแลคุณอย่าง VIP':'We take care of you like a VIP',
  '• นั่งรถตู้ระดับพรีเมียม Hyundai H-1 เบาะนุ่ม นั่งสบายตลอดการเดินทาง':'• Travel in a premium Hyundai H-1 van with comfortable seating throughout.',
  '• อิ่มอร่อยกับอาหารทุกมื้อตามแพลนทริป ไม่ต้องเลือกร้านเองให้ยุ่งยาก':'• Enjoy every meal included in the trip plan—no need to choose restaurants.',
  '• ทีมงานมืออาชีพดูแลใกล้ชิด ใส่ใจในทุกรายละเอียดเพื่อความสุขของทุกคน':'• Our professional team takes care of every detail for your comfort.',
  'ราคาพิเศษจองแพ็กคู่: เพียง 13,000 บาท / 2 ท่าน (จากปกติท่านละ 7,000 บาท เฉลี่ยคนละ 6,500 บาท)':'Special pair booking: THB 13,000 for two (normally THB 7,000 per person; just THB 6,500 each).',
  'แพลนวันหยุดนี้ให้รางวัลตัวเองและคนข้าง ๆ ด้วยการออกไปเที่ยวด้วยกัน สร้างความทรงจำดี ๆ ร่วมกันนะคะ':'Treat yourself and someone special to a relaxing holiday and create wonderful memories together.',
  'สนใจสอบถามรายละเอียดแพลนการเดินทางเพิ่มเติม โทร: 098-1045788 (ครูจิ๋ว) / 091-7801023 (คุณจูเนียร์)':'For itinerary details or bookings, call 098-1045788 (Kru Jiw) or 091-7801023 (Khun Junior).',
  '#เที่ยวแบบครอบครัว #ทัวร์ทำบุญ #เที่ยวลาวกลาง #ท่าแขกคำม่วน #ท่าฝรั่งลาว #เช่ารถตู้พร้อมคนขับ #เที่ยวสนุกเดินทางสบาย #นครพนมเที่ยวไหนดี #สปปลาว':'#FamilyTravel #MeritMakingTrip #CentralLaos #Thakhek #ThaFalang #PrivateVan #NakhonPhanom #Laos',
  'ENGLISH COURSE · ม.ต้น':'ENGLISH COURSE · LOWER SECONDARY','คอร์สภาษาอังกฤษ ม.1–ม.3 ภาคเรียนที่ 2/2569':'English course for Grades 7–9, Semester 2/2026','ปูพื้นฐานไวยากรณ์และโครงสร้างภาษา พร้อมเตรียมสอบเข้า ม.4 ห้องพิเศษและโครงการดัง รับจำนวนจำกัด 15 ที่นั่ง':'Build a strong grammar foundation and prepare for competitive Grade 10 programs. Limited to 15 seats.',
  'ENGLISH COURSE · ม.ปลาย':'ENGLISH COURSE · UPPER SECONDARY','คอร์สภาษาอังกฤษ ม.4–ม.6 ภาคเรียนที่ 2/2569':'English course for Grades 10–12, Semester 2/2026','ปรับพื้นฐานและเตรียมสอบมหาวิทยาลัย ครอบคลุม TOEFL ITP, IELTS, KEPT, CU-TEP, NETSAT, TGAT และ A-Level รับ 15 ที่นั่ง':'Strengthen your foundation and prepare for university entrance exams, including TOEFL ITP, IELTS, KEPT, CU-TEP, NETSAT, TGAT and A-Level. Limited to 15 seats.',
  'ใช้ชีวิตแบบชาวลอนดอน เรียนภาษาอังกฤษที่ Canterbury':'Live like a Londoner and study English in Canterbury','แพ็กเกจ All-inclusive เรียน Speaking for IELTS 30 ชั่วโมง พร้อมที่พัก อาหาร กิจกรรม ทัศนศึกษา ตั๋วเครื่องบินและประกันการเดินทาง':'An all-inclusive package with 30 hours of Speaking for IELTS, accommodation, meals, activities, excursions, flights and travel insurance.',
  'สัมผัสชีวิตจริงและเรียนรู้ที่ Canterbury':'Experience real life and learning in Canterbury','เรียนภาษาอังกฤษผ่านประสบการณ์จริง พัก Residence Apartment ใจกลางเมือง พร้อมกิจกรรมและทัศนศึกษาที่ออกแบบให้เรียนรู้วัฒนธรรมอย่างเต็มที่':'Learn English through real experiences, stay in a city-centre residence and enjoy activities and excursions designed for cultural immersion.',
  'แผนการชำระเงินโปรแกรม Canterbury UK 2027':'Canterbury UK 2027 payment plan','ราคาพิเศษ 164,000 บาทเมื่อจองล่วงหน้า แบ่งชำระ 3 งวด รวมวีซ่า ที่พัก คอร์สเรียน อาหาร ประกัน และทริปท่องเที่ยว':'Early-booking price of THB 164,000, payable in three instalments and including visa, accommodation, course, meals, insurance and excursions.',
  'ภาพบรรยากาศ':'Our atmosphere','บรรยากาศการเรียนและกิจกรรมที่ช่วยเปิดโลกใหม่ให้ผู้เรียนของเรา':'Learning and activity moments that open new worlds for our students.','ครูผู้สอน':'Our teacher','บรรยากาศการเรียน':'Learning atmosphere','กิจกรรมของผู้เรียน':'Student activities','ประสบการณ์ต่างประเทศ':'Overseas experience','ขยาย ↗︎':'Enlarge ↗︎',
  'พร้อมออกเดินทาง':'Ready to travel','แบบไม่ต้องกังวล?':'without the worry?','วีซ่าทุกประเภท':'All visa types','ตั๋วเครื่องบิน':'Flight booking','ทัวร์ส่วนตัว':'Private tours',
  'เริ่มต้นบทใหม่':'Start your next','ของคุณวันนี้':'chapter today','บอกเราว่าคุณสนใจอะไร ทีมที่ปรึกษาจะติดต่อกลับเพื่อช่วยวางแผนเบื้องต้นโดยไม่มีค่าใช้จ่าย':'Tell us what interests you. An advisor will contact you for a free initial consultation.','ครูจิว':'Kru Jew','พี่ลิต้า':'P’Lita',
  'ชื่อ-นามสกุล':'Full name','เบอร์โทร':'Phone number','อีเมล':'Email','บริการที่สนใจ':'Service of interest','เลือกบริการ':'Choose a service','แผนที่คุณให้ความสนใจ':'Plan you are interested in','ส่งข้อมูลให้ที่ปรึกษา ↗︎':'Send to an advisor ↗︎','ติดต่อเรา':'Contact us','โทรศัพท์ • ครูจิว':'Phone • Kru Jew','โทรศัพท์ • พี่ลิต้า':'Phone • P’Lita','โทรออก ↗︎':'Call ↗︎','ส่งอีเมล ↗︎':'Send email ↗︎','ติดต่อผ่าน LINE':'Contact us on LINE','ติดตามบน Facebook':'Follow us on Facebook','แผนที่และที่ตั้ง':'Map & location','Learning Plus By Kru Jew เลขที่ 130 ซอย 1 ตำบลสำราญ อำเภอเมืองยโสธร จังหวัดยโสธร 35000':'Learning Plus By Kru Jew, 130 Soi 1, Samran, Mueang Yasothon, Yasothon 35000','เปิดใน Google Maps ↗︎':'Open in Google Maps ↗︎',
  'สแกนเพื่อเพิ่มเพื่อน':'Scan to add us on LINE','สแกน QR Code หรือกดปุ่มด้านล่างเพื่อติดต่อ Inter Plus Consulting ผ่าน LINE':'Scan the QR code or use the button below to contact Inter Plus Consulting on LINE.','ติดต่อผ่าน LINE ↗︎':'Contact us on LINE ↗︎',
  'แปลและรับรองเอกสาร · ประกันการเดินทาง · จองที่พักและหอพักนักเรียน':'Document translation · Travel insurance · Accommodation & student housing',
  'เสียงจากผู้ใช้บริการ':'What our clients say','เมนู':'Menu','คอร์สออนไลน์ / เข้าสู่ระบบ':'Online courses / Log in','แผนที่':'Map',
  'ส่งข้อมูลเรียบร้อยแล้ว':'Your message has been sent','ส่งข้อมูลอีกครั้ง':'Send another message','กำลังส่ง…':'Sending…',
  'ข้อมูลของคุณใช้เพื่อติดต่อกลับเรื่องบริการที่สนใจเท่านั้น':'Your details are only used to contact you about the service you chose.',
  'หน้าแรก':'Home','ดูบริการอื่น':'See other services','บริการอื่นของเรา':'Our other services','รูปแบบการเรียน':'Learning formats',
  'เลือกรูปแบบที่เหมาะกับตารางชีวิตและสไตล์การเรียนของคุณ':'Choose the format that fits your schedule and learning style.',
  'ตัวต่อตัว':'Private lessons','ปรับเนื้อหาและจังหวะตามผู้เรียนคนเดียว':'Content and pace tailored to one learner.',
  'กลุ่มเล็ก':'Small groups','เรียนกับเพื่อนในระดับใกล้กัน ฝึกสื่อสารได้มากขึ้น':'Learn with peers at a similar level and practise speaking more.',
  'ออนไลน์':'Online','เรียนจากที่ไหนก็ได้ผ่านวิดีโอคอล':'Learn from anywhere via video call.',
  'ออนไซต์ / Hybrid':'On-site / Hybrid','เรียนที่สถาบันในยโสธร หรือผสมกับออนไลน์':'Study at our Yasothon centre, or mix with online lessons.',
  'เลือกโปรแกรมที่สนใจ ระบบจะกรอกข้อมูลในฟอร์มด้านล่างให้อัตโนมัติ':'Choose a program and we will fill in the form below for you.',
  'คอร์สภาษาอังกฤษตั้งแต่ Beginner ถึง Advanced สำหรับนักเรียน ม.ต้น ม.ปลาย และบุคคลทั่วไป ทั้งเตรียมสอบและใช้งานจริง':'English courses from Beginner to Advanced for secondary students and adults, for exams and real-life use.',
  'Summer Course 2-3 สัปดาห์ คอร์สภาษาระยะสั้นถึงระยะยาว และคอร์สพัฒนาทักษะเฉพาะทางในประเทศอังกฤษ':'2-3 week summer courses, short- to long-term language courses and specialised skill courses in the UK.',
  'Seasonal Work 3-6 เดือน, Work & Travel 6 เดือน - 1 ปี และ Skilled Work สัญญาจ้าง 1-2 ปี พร้อมคำแนะนำด้านเอกสาร':'Seasonal Work (3-6 months), Work & Travel (6 months - 1 year) and Skilled Work (1-2 year contracts), with document guidance.',
  'ทัวร์ส่วนตัวต่างประเทศและในประเทศ ทำวีซ่า จองตั๋วเครื่องบิน รถพร้อมคนขับและไกด์ รวมถึงบริการเสริมแปลเอกสาร ประกัน และที่พัก':'Private tours abroad and in Thailand, visas, flights, drivers and guides, plus document translation, insurance and accommodation.',
  'เข้าสู่ระบบ':'Log in','หลังบ้าน':'Admin','คอร์สของฉัน':'My courses','บทความ':'Articles','เข้าสู่ระบบ / คอร์สออนไลน์':'Log in / Online courses',
  'ท่องเที่ยว':'Travel','คำถามที่พบบ่อย':'FAQ','บริการอื่นๆ':'Other services','สนใจโปรแกรมนี้ ↗︎':'I’m interested ↗︎','สอบถามบริการ ↗︎':'Ask about this service ↗︎','แชทผ่าน LINE':'Chat on LINE',
  'ม.ต้น':'Lower secondary','ม.ปลาย':'Upper secondary','บุคคลทั่วไป':'Adult learners',
  'เลือกโปรแกรมเรียนในอังกฤษ':'Choose your UK program','1-3 เดือน / 6 เดือน - 1 ปี':'1-3 months / 6 months - 1 year',
  'โปรแกรมซัมเมอร์ระยะสั้น ไปได้ทั้งแบบเดี่ยวและแบบกลุ่ม เรียนภาษาพร้อมทำกิจกรรมและทัศนศึกษา':'A short summer program for individuals or groups, combining English classes with activities and excursions.',
  'คอร์สเรียนภาษาระยะสั้นถึงระยะยาวแบบเรียนเดี่ยว เลือกระยะเวลาได้ตามความต้องการ':'Individual short- to long-term language courses with a duration that suits you.',
  'คอร์สพัฒนาทักษะเฉพาะทางในประเทศอังกฤษ สำหรับผู้ที่ต้องการต่อยอดความรู้และประสบการณ์':'Specialized skill-development courses in the UK for those who want to build on their knowledge and experience.',
  'วางแผนทริป ทำวีซ่า จองตั๋ว ไปจนถึงรถและไกด์ ทั้งต่างประเทศและในประเทศไทย':'Trip planning, visas, flights, transport and guides — overseas and across Thailand.',
  'การเดินทางต่างประเทศ':'International travel','การท่องเที่ยวในประเทศ':'Domestic travel',
  'จัดทัวร์กลุ่มส่วนตัวต่างประเทศ พร้อมทีมงานให้คำปรึกษาตลอดทริป':'Private group tours abroad, with our team supporting you throughout the trip.',
  'บริการวางแผนการเดินทาง และรับทำวีซ่าทุกประเภท':'Travel planning and applications for all visa types.',
  'บริการจองตั๋วเครื่องบินครอบคลุมทุกเส้นทางทั่วโลก':'Flight bookings for routes all over the world.',
  'รับจัดทัวร์ในประเทศแบบ Solo และ Group ส่วนตัว':'Private solo and group tours within Thailand.',
  'บริการรถนำเที่ยวพร้อมคนขับ และไกด์นำเที่ยวครอบคลุมทุกจังหวัดในประเทศไทย':'Vehicles with drivers and tour guides covering every province in Thailand.',
  'บริการเสริม':'Additional services','ครบจบในที่เดียว':'all in one place',
  'ดูแลรายละเอียดที่มักถูกมองข้าม เพื่อให้การเรียน การทำงาน และการเดินทางของคุณราบรื่นขึ้น':'We take care of the details that are easy to miss, so your study, work and travel go smoothly.',
  'แปลและรับรองเอกสาร':'Document translation & certification','สำหรับการยื่นวีซ่า สมัครเรียน หรือสมัครงานต่างประเทศ':'For visa, study and overseas job applications.',
  'ประกันการเดินทาง':'Travel insurance','ประกันเดินทางต่างประเทศ และประกันสุขภาพสำหรับนักเรียน':'International travel insurance and student health insurance.',
  'จองที่พักและหอพักนักเรียน':'Accommodation & student housing','ช่วยหาที่พักที่ปลอดภัย ใกล้มหาวิทยาลัยหรือสถานที่ทำงาน':'Help finding safe accommodation near your university or workplace.',
  'คำถาม':'Frequently asked','ที่พบบ่อย':'questions','ไม่เจอคำตอบที่ต้องการ? ทักมาคุยกับทีมที่ปรึกษาได้เลย':'Can’t find your answer? Talk to our advisors.','ถามทีมที่ปรึกษา ↗︎':'Ask an advisor ↗︎',
  'ปรึกษาครั้งแรกมีค่าใช้จ่ายไหม?':'Is the first consultation free?','ไม่มีค่าใช้จ่าย ทีมที่ปรึกษาจะคุยเรื่องเป้าหมาย งบประมาณ และช่วงเวลาที่ต้องการ เพื่อช่วยวางแผนเบื้องต้นให้ก่อน':'Yes. Our advisors will discuss your goals, budget and timing to help you build an initial plan.',
  'เรียนภาษาอังกฤษกับ Learning Plus ได้ตั้งแต่ระดับไหน?':'What levels does Learning Plus teach?','รับตั้งแต่ระดับ Beginner ถึง Advanced ทั้งนักเรียน ม.ต้น ม.ปลาย และบุคคลทั่วไป เลือกเรียนได้ทั้งตัวต่อตัว กลุ่มเล็ก ออนไลน์ ออนไซต์ หรือไฮบริด':'Beginner to Advanced, for lower and upper secondary students and adults. Choose private, small-group, online, on-site or hybrid classes.',
  'Summer UK Course ใช้เวลากี่สัปดาห์ ไปคนเดียวได้ไหม?':'How long is the Summer UK Course, and can I join alone?','โปรแกรมซัมเมอร์ใช้เวลาประมาณ 2-3 สัปดาห์ สมัครได้ทั้งแบบเดี่ยวและแบบกลุ่ม':'The summer program runs for about 2-3 weeks, and you can join individually or as a group.',
  'โครงการทำงานต่างประเทศมีระยะเวลาเท่าไร?':'How long are the work-abroad programs?','Seasonal Work ประมาณ 3-6 เดือน, Work & Travel ประมาณ 6 เดือน - 1 ปี และ Skilled Work สัญญาจ้างระยะยาว 1-2 ปี':'Seasonal Work is about 3-6 months, Work & Travel about 6 months to 1 year, and Skilled Work offers 1-2 year contracts.',
  'ยื่นวีซ่าต้องใช้เอกสารอะไรบ้าง?':'What documents do I need for a visa?','เอกสารขึ้นอยู่กับประเทศและประเภทวีซ่า หลังจากปรึกษา ทีมงานจะแจ้งรายการเอกสารที่ต้องเตรียมและช่วยตรวจสอบก่อนยื่น':'It depends on the country and visa type. After your consultation, our team will give you a document checklist and review everything before you apply.',
  'นอกจากเรียนและเดินทาง มีบริการอะไรอีกบ้าง?':'What other services do you offer?','มีบริการแปลและรับรองเอกสาร ประกันการเดินทางและประกันสุขภาพนักเรียน รวมถึงช่วยจองที่พักหรือหอพักนักเรียน':'We offer document translation and certification, travel and student health insurance, and help booking accommodation or student housing.',
};

const placeholders: Record<string, string> = {'กรอกชื่อของคุณ':'Enter your name','08x-xxx-xxxx':'Phone number','you@email.com':'you@email.com','อยากไปประเทศไหน หรือมีคำถามอะไรเพิ่มเติม':'Which country interests you, or what would you like to ask?'};
const enToTh = Object.fromEntries(Object.entries(thToEn).map(([th,en]) => [en, th]));
const placeholderBack = Object.fromEntries(Object.entries(placeholders).map(([th,en]) => [en, th]));

export default function LanguageSwitcher() {
  const [language, setLanguage] = useState<'th'|'en'>('th');

  useEffect(() => {
    document.documentElement.lang = language;
    const dictionary = language === 'en' ? thToEn : enToTh;
    const translateNode = (node: Node) => {
      const value = node.nodeValue ?? '';
      const clean = value.trim();
      if (dictionary[clean]) node.nodeValue = value.replace(clean, dictionary[clean]);
    };
    const translateTree = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) return translateNode(root);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) { translateNode(node); node = walker.nextNode(); }
    };
    translateTree(document.body);
    let observer: MutationObserver | undefined;
    if (language === 'en') {
      observer = new MutationObserver((mutations) => mutations.forEach(mutation => {
        if (mutation.type === 'characterData') translateNode(mutation.target);
        mutation.addedNodes.forEach(translateTree);
      }));
      observer.observe(document.body, { subtree:true, childList:true, characterData:true });
    }
    const attrs = language === 'en' ? placeholders : placeholderBack;
    document.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('[placeholder]').forEach(el => {
      if (attrs[el.placeholder]) el.placeholder = attrs[el.placeholder];
    });
    return () => observer?.disconnect();
  }, [language]);

  return <div className="language-switcher" aria-label="เลือกภาษา"><button className={language==='th'?'active':''} onClick={()=>setLanguage('th')} type="button">TH</button><span>/</span><button className={language==='en'?'active':''} onClick={()=>setLanguage('en')} type="button">EN</button></div>;
}
