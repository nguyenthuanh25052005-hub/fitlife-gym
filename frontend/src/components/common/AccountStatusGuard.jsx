import { useEffect, useState } from "react";
import { getMe } from "../../services/authService";

const LOGOUT_DELAY = 5;

export default function AccountStatusGuard() {
  const [disabled, setDisabled] = useState(false);
  const [seconds, setSeconds] = useState(LOGOUT_DELAY);

  useEffect(() => {
    const handleDisabled = () => setDisabled(true);
    window.addEventListener("fitlife:account-disabled", handleDisabled);

    let stopped = false;
    const verify = async () => {
      if (!localStorage.getItem("fitlife_token") || stopped || disabled) return;
      try {
        const result = await getMe();
        if (result?.data?.user?.status !== "active") setDisabled(true);
      } catch (error) {
        if ([401, 403, 404].includes(error.response?.status)) setDisabled(true);
      }
    };

    verify();
    const interval = window.setInterval(verify, 3000);
    return () => {
      stopped = true;
      window.clearInterval(interval);
      window.removeEventListener("fitlife:account-disabled", handleDisabled);
    };
  }, [disabled]);

  useEffect(() => {
    if (!disabled) return undefined;
    document.body.classList.add("account-session-locked");
    const timer = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          localStorage.removeItem("fitlife_token");
          localStorage.removeItem("fitlife_user");
          window.location.replace("/member/login");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => {
      window.clearInterval(timer);
      document.body.classList.remove("account-session-locked");
    };
  }, [disabled]);

  if (!disabled) return null;

  return (
    <div className="account-disabled-overlay" role="alertdialog" aria-modal="true">
      <div className="account-disabled-modal">
        <div className="account-disabled-icon">!</div>
        <span className="account-disabled-kicker">PHIÊN ĐĂNG NHẬP ĐÃ BỊ KHÓA</span>
        <h2>Trạng thái đăng nhập không khả dụng</h2>
        <p>Tài khoản của bạn đã bị quản trị viên xóa hoặc ngừng hoạt động. Bạn không thể tiếp tục thao tác.</p>
        <div className="account-disabled-countdown">
          Tự động đăng xuất sau <strong>{seconds}</strong> giây
        </div>
      </div>
    </div>
  );
}
