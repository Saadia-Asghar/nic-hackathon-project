import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AppHome from "./pages/AppHome";
import PostNeed from "./pages/PostNeed";
import NeedDetail from "./pages/NeedDetail";
import SubmitBid from "./pages/SubmitBid";
import ZoneDetail from "./pages/ZoneDetail";
import AlertDetail from "./pages/AlertDetail";
import WorkerProfile from "./pages/WorkerProfile";
import Discover from "./pages/Discover";
import Chat from "./pages/Chat";
import Chats from "./pages/Chats";
import MapPage from "./pages/MapPage";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/app" element={<AppHome />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/needs/new" element={<PostNeed />} />
          <Route path="/needs/:id" element={<NeedDetail />} />
          <Route path="/needs/:id/bid" element={<SubmitBid />} />
          <Route path="/needs/:id/chat" element={<Chat />} />
          <Route path="/zones/:id" element={<ZoneDetail />} />
          <Route path="/alerts/:id" element={<AlertDetail />} />
          <Route path="/workers/:id" element={<WorkerProfile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
