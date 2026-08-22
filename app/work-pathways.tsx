'use client';

import { useState } from 'react';

const paths = [
  { id:'seasonal', duration:'3-6 เดือน', title:'Seasonal Work', description:'โครงการทำงานตามฤดูกาล เปิดประสบการณ์ใหม่ในระยะเวลาที่พอดี' },
  { id:'travel', duration:'6 เดือน - 1 ปี', title:'Work & Travel', description:'ทำงานและท่องเที่ยวต่างประเทศ พร้อมเติบโตทั้งทักษะและมุมมอง', accent:true },
  { id:'skilled', duration:'1-2 ปี', title:'Skilled Work', description:'โอกาสระยะยาวสำหรับผู้มีทักษะ พร้อมคำแนะนำด้านเอกสารและสัญญา' },
];

export default function WorkPathways() {
  const [selected, setSelected] = useState('travel');
  return <div className="path-grid">{paths.map(path => {
    const active = selected === path.id;
    return <article className={`${path.accent ? 'red' : ''} ${active ? 'selected' : ''}`} key={path.id}>
      <button type="button" aria-pressed={active} onClick={()=>setSelected(path.id)}>
        <span className="path-arrow">↗</span><small>{path.duration}</small><h3>{path.title}</h3><p>{path.description}</p>
        <span className="selection-label">{active ? 'เลือกแล้ว ✓' : 'เลือกโปรแกรมนี้'}</span>
      </button>
      <a className="path-cta" href="#contact">สนใจโปรแกรมนี้ <span>→</span></a>
    </article>;
  })}</div>;
}
