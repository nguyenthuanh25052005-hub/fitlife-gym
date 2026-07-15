import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductMegaMenu from "../navigation/ProductMegaMenu";
import IndustryMegaMenu from "../navigation/IndustryMegaMenu";
import ResourceMenu from "../navigation/ResourceMenu";

export default function Header({ onDemo }) {
  const [openMenu, setOpenMenu] = useState(null);
  const headerRef = useRef(null);
  const navigate = useNavigate();

  // Kiểm tra người dùng đã đăng nhập hay chưa
  const isLoggedIn = Boolean(localStorage.getItem("fitlife_token"));

  const toggle = (name) => {
    setOpenMenu((current) => (current === name ? null : name));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };

    const handleScroll = () => {
      setOpenMenu(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLoginOrDashboard = () => {
    setOpenMenu(null);

    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <header className="navbar" ref={headerRef}>
      <div className="nav-inner">
        <button
          className="brand"
          type="button"
          onClick={() => {
            setOpenMenu(null);
            navigate("/");
          }}
        >
          Fit<span>Life</span>
        </button>

        <nav>
          <button
            className={openMenu === "product" ? "active" : ""}
            type="button"
            onClick={() => toggle("product")}
          >
            Sản phẩm⌃
          </button>

          <button
            className={openMenu === "industry" ? "active" : ""}
            type="button"
            onClick={() => toggle("industry")}
          >
            Ngành⌃
          </button>

          <a href="#pricing" onClick={() => setOpenMenu(null)}>
            Bảng giá
          </a>

          <div className="resource-wrap">
            <button
              className={openMenu === "resource" ? "active" : ""}
              type="button"
              onClick={() => toggle("resource")}
            >
              Tài nguyên⌃
            </button>

            {openMenu === "resource" && <ResourceMenu />}
          </div>
        </nav>

        <div className="nav-actions">
          <a href="#top" onClick={() => setOpenMenu(null)}>
            ☼ VN | VI
          </a>

          <a
            className="contact"
            href="#footer"
            onClick={() => setOpenMenu(null)}
          >
            Liên hệ
          </a>

          <button
            className="login-button"
            type="button"
            onClick={handleLoginOrDashboard}
          >
            {isLoggedIn ? "Vào Dashboard" : "Đăng nhập"}
          </button>

          <button
            className="demo-button"
            type="button"
            onClick={() => {
              setOpenMenu(null);

              if (typeof onDemo === "function") {
                onDemo();
              }
            }}
          >
            Đặt lịch demo
          </button>
        </div>
      </div>

      {openMenu === "product" && <ProductMegaMenu />}

      {openMenu === "industry" && <IndustryMegaMenu />}
    </header>
  );
}