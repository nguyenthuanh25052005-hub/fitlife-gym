import { industries } from "../../data/siteData";

export default function IndustryMegaMenu() {
  return (
    <div className="mega-menu industry-mega">
      <div className="mega-inner industry-menu-inner">
        <div>
          <h4>THỂ THAO & GYM</h4>
          {industries.slice(0, 4).map((item) => (
            <a href="#industry-solutions" key={item.id}>{item.label}</a>
          ))}
        </div>
        <div>
          <h4>SỨC KHOẺ & LÀM ĐẸP</h4>
          {industries.slice(4).map((item) => (
            <a href="#industry-solutions" key={item.id}>{item.label}</a>
          ))}
        </div>
      </div>
    </div>
  );
}
