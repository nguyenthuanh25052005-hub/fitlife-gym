import { productGroups } from "../../data/siteData";

export default function ProductMegaMenu() {
  return (
    <div className="mega-menu product-mega">
      <div className="mega-inner">
        {productGroups.map((group) => (
          <div className="mega-column" key={group.heading}>
            <h4>{group.heading}</h4>
            {group.items.map(([icon, title, text]) => (
              <a className="mega-item" href="#features" key={title}>
                <span className="mega-icon">{icon}</span>
                <span>
                  <b>{title}</b>
                  <small>{text}</small>
                </span>
              </a>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
