import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Markets from "./pages/Markets";
import MarketDetails from "./pages/MarketDetails";
import CreateMarket from "./pages/CreateMarket";
import BettingMarket from "./pages/BettingMarket";
import Portfolio from "./pages/Portfolio";
import Landing from "./pages/Landing";
import AdminDashboard from "./pages/AdminDashboard";
import Assistant from "./pages/Assistant";
import TrendingMarkets from "./pages/TrendingMarkets";
import Agents from "./pages/Agents";
import AgentDetails from "./pages/AgentDetails";
import Arbitrage from "./pages/Arbitrage";
import AIBuilder from "./pages/AIBuilder";
import Marketplace from "./pages/Marketplace";
import About from "./pages/About";
import Profile from "./pages/Profile";

import ProtectedRoute from "./components/ProtectedRoute";
import useAuthStore from "./store/authStore";

function AdminGuard({ children }) {
  const isAdmin = useAuthStore((state) => state.role) === "admin";
  if (isAdmin) return <Navigate to="/admin" />;
  return children;
}

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Landing />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/about" element={<About />} />

        <Route path="/admin" element={
          <ProtectedRoute adminOnly={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/markets" element={
          <ProtectedRoute>
            <AdminGuard>
              <Markets />
            </AdminGuard>
          </ProtectedRoute>
        } />

        <Route path="/markets/create" element={
          <ProtectedRoute adminOnly={true}>
            <CreateMarket />
          </ProtectedRoute>
        } />

        <Route path="/markets/:id" element={
          <ProtectedRoute>
            <AdminGuard>
              <MarketDetails />
            </AdminGuard>
          </ProtectedRoute>
        } />

        <Route path="/markets/:id/bet" element={
          <ProtectedRoute>
            <AdminGuard>
              <BettingMarket />
            </AdminGuard>
          </ProtectedRoute>
        } />

        <Route path="/portfolio" element={
          <ProtectedRoute>
            <AdminGuard>
              <Portfolio />
            </AdminGuard>
          </ProtectedRoute>
        } />

        <Route path="/assistant" element={
          <ProtectedRoute>
            <AdminGuard>
              <Assistant />
            </AdminGuard>
          </ProtectedRoute>
        } />

        <Route path="/trending" element={
          <ProtectedRoute>
            <AdminGuard>
              <TrendingMarkets />
            </AdminGuard>
          </ProtectedRoute>
        } />

        <Route path="/agents" element={
          <ProtectedRoute>
            <AdminGuard>
              <Agents />
            </AdminGuard>
          </ProtectedRoute>
        } />

        <Route path="/agents/:id" element={
          <ProtectedRoute>
            <AdminGuard>
              <AgentDetails />
            </AdminGuard>
          </ProtectedRoute>
        } />

        <Route path="/arbitrage" element={
          <ProtectedRoute>
            <AdminGuard>
              <Arbitrage />
            </AdminGuard>
          </ProtectedRoute>
        } />

        <Route path="/ai-builder" element={
          <ProtectedRoute>
            <AdminGuard>
              <AIBuilder />
            </AdminGuard>
          </ProtectedRoute>
        } />

        <Route path="/marketplace" element={
          <ProtectedRoute>
            <AdminGuard>
              <Marketplace />
            </AdminGuard>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

      </Routes>

    </BrowserRouter>
  );
}

export default App;