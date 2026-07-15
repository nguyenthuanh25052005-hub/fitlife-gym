import { useState } from "react";
import { faqs } from "../../data/siteData";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  return (
    <section className="section faq" id="faq">
      <div className="section-head"><span className="mini">FAQ</span><h2>Câu hỏi thường gặp</h2></div>
      <div className="faq-list">
        {faqs.map((item, index) => (
          <div className="faq-item-wrap" key={item.question}>
            <button className="faq-item" onClick={() => setOpenIndex(openIndex === index ? null : index)}><span>{item.question}</span><b>{openIndex === index ? "−" : "+"}</b></button>
            {openIndex === index && <p className="faq-answer">{item.answer}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
