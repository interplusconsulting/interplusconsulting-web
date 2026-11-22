import LineContact from './line-contact';

export default function FloatingContact() {
  return <div className="floating-contact" aria-label="ช่องทางติดต่อด่วน">
    <a className="floating-consult" href="#contact">ปรึกษาฟรี</a>
    <LineContact className="floating-line"><span>LINE</span>แชทผ่าน LINE</LineContact>
  </div>;
}
