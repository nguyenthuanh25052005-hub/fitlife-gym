import "./App.css";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import MembersPage from "./pages/MembersPage";
import PackagesPage from "./pages/PackagesPage";
import TrainersPage from "./pages/TrainersPage";
import ClassesPage from "./pages/ClassesPage";
import CheckinPage from "./pages/CheckinPage";
import PaymentsPage from "./pages/PaymentsPage";
import ReportsPage from "./pages/ReportsPage";

// User (Member) Pages
import UserLoginPage from "./pages/UserLoginPage";
import UserRegisterPage from "./pages/UserRegisterPage";
import UserDashboardPage from "./pages/UserDashboardPage";
import UserProfilePage from "./pages/UserProfilePage";
import UserSchedulePage from "./pages/UserSchedulePage";
import UserPackagesPage from "./pages/UserPackagesPage";
import UserCoachPage from "./pages/UserCoachPage";
import UserHealthPage from "./pages/UserHealthPage";
import NotificationBell from "./components/common/NotificationBell";
import AccountStatusGuard from "./components/common/AccountStatusGuard";

function App() {
  const token = localStorage.getItem("fitlife_token");
  const userStr = localStorage.getItem("fitlife_user");
  const user = userStr ? JSON.parse(userStr) : {};
  const isLoggedIn = Boolean(token);
  const isMember = user?.role === "member";
  const isAdmin = user?.role === "admin";

  return (
    <BrowserRouter>
      {isLoggedIn && <>
        <AccountStatusGuard />
        <div className="global-notification"><NotificationBell role={isAdmin ? 'admin' : 'member'} /></div>
      </>}
      <Routes>
        {/* Public: Trang chủ */}
        <Route path="/" element={<HomePage />} />

        {/* ===== ADMIN ROUTES ===== */}
        <Route
          path="/login"
          element={isAdmin ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/dashboard"
          element={isAdmin ? <DashboardPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/members"
          element={isAdmin ? <MembersPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/packages"
          element={isAdmin ? <PackagesPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/trainers"
          element={isAdmin ? <TrainersPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/classes"
          element={isAdmin ? <ClassesPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/checkin"
          element={isAdmin ? <CheckinPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/payments"
          element={isAdmin ? <PaymentsPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/reports"
          element={isAdmin ? <ReportsPage /> : <Navigate to="/login" replace />}
        />

        {/* ===== MEMBER ROUTES ===== */}
        <Route
          path="/member/login"
          element={isMember ? <Navigate to="/member/dashboard" replace /> : <UserLoginPage />}
        />
        <Route
          path="/member/register"
          element={isMember ? <Navigate to="/member/dashboard" replace /> : <UserRegisterPage />}
        />
        <Route
          path="/member/dashboard"
          element={isMember ? <UserDashboardPage /> : <Navigate to="/member/login" replace />}
        />
        <Route
          path="/member/profile"
          element={isMember ? <UserProfilePage /> : <Navigate to="/member/login" replace />}
        />
        <Route
          path="/member/schedule"
          element={isMember ? <UserSchedulePage /> : <Navigate to="/member/login" replace />}
        />
        <Route
          path="/member/packages"
          element={isMember ? <UserPackagesPage /> : <Navigate to="/member/login" replace />}
        />
        <Route
          path="/member/coach"
          element={isMember ? <UserCoachPage /> : <Navigate to="/member/login" replace />}
        />
        <Route
          path="/member/health"
          element={isMember ? <UserHealthPage /> : <Navigate to="/member/login" replace />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;