// src/pages/SettingsPage.jsx
// COMPLETE & UPDATED VERSION - February 13, 2026
// Fixed: API call with trailing slash (/settings/)
// Added: Better error handling, loading skeletons, UX improvements

import { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import { 
  FaShieldAlt, FaEye, FaEyeSlash, FaUserSecret, FaBell, 
  FaTrash, FaDownload, FaSignOutAlt, FaBan, 
  FaMobileAlt, FaCheckCircle, FaTimesCircle, FaClock 
} from "react-icons/fa";
import axiosInstance from "../api/axios";
import { UserContext } from "../context/UserContext";

export default function SettingsPage() {
  const { user, setUser } = useContext(UserContext);
  const [settings, setSettings] = useState({
    privacy: {
      readReceipts: true,
      lastSeenVisibility: "everyone",
      bioVisibility: "everyone",
      typingIndicator: true,
      incognitoMode: false,
      notificationPreviews: "show",
      defaultDisappearingTimer: 0,
    },
    mutedChats: [],
    sessions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [passwordForDelete, setPasswordForDelete] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axiosInstance.get("/settings/"); // ← trailing slash added
        setSettings(res.data);
      } catch (err) {
        console.error("Settings fetch error:", err);
        const status = err.response?.status;
        
        if (status === 404) {
          setError("Settings route not found on server (404). Check backend routes.");
          toast.error("Settings API not found (404)");
        } else if (status === 401) {
          setError("Session expired. Please login again.");
          toast.error("Please login again");
          setTimeout(() => {
            setUser(null);
            window.location.href = "/login";
          }, 2000);
        } else {
          setError("Failed to load settings. Please try again later.");
          toast.error("Failed to load settings");
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSettings();
    }
  }, [user, setUser]);

  // Update single privacy field
  const updatePrivacy = async (key, value) => {
    const loadingToast = toast.loading(`Updating ${key}...`);
    try {
      await axiosInstance.put("/settings/privacy", { [key]: value });
      setSettings((prev) => ({
        ...prev,
        privacy: { ...prev.privacy, [key]: value },
      }));
      toast.success("Updated successfully", { id: loadingToast });
    } catch (err) {
      toast.error("Update failed", { id: loadingToast });
      console.error(err);
    }
  };

  // Toggle mute/unmute chat
  const handleMuteToggle = async (chatId, mute = true, duration = null) => {
    const loadingToast = toast.loading(mute ? "Muting..." : "Unmuting...");
    try {
      if (mute) {
        await axiosInstance.post("/settings/mute-chat", {
          chatWith: chatId,
          muteUntil: duration ? new Date(Date.now() + duration).toISOString() : null,
        });
      } else {
        await axiosInstance.delete("/settings/mute-chat", {
          data: { chatWith: chatId },
        });
      }
      // Refresh
      const res = await axiosInstance.get("/settings/");
      setSettings(res.data);
      toast.success(mute ? "Muted" : "Unmuted", { id: loadingToast });
    } catch (err) {
      toast.error("Failed to update mute", { id: loadingToast });
    }
  };

  // Export data as JSON
  const handleExportData = async () => {
    const loadingToast = toast.loading("Exporting data...");
    try {
      const res = await axiosInstance.get("/settings/export");
      const dataStr = JSON.stringify(res.data.data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chatify-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Export complete", { id: loadingToast });
    } catch (err) {
      toast.error("Export failed", { id: loadingToast });
    }
  };

  // Delete account with confirmation
  const handleDeleteAccount = async () => {
    if (deleteConfirm.toLowerCase() !== "delete my account") {
      return toast.error('Type "delete my account" exactly');
    }
    if (!passwordForDelete) {
      return toast.error("Password is required");
    }

    setIsDeleting(true);
    const loadingToast = toast.loading("Deleting account...");
    try {
      await axiosInstance.post("/settings/delete-account", {
        confirmPassword: passwordForDelete,
      });
      toast.success("Account deleted permanently", { id: loadingToast });
      setUser(null);
      setTimeout(() => window.location.href = "/login", 2500);
    } catch (err) {
      toast.error(err.response?.data?.error || "Deletion failed", { id: loadingToast });
    } finally {
      setIsDeleting(false);
    }
  };

  // Logout all other sessions
  const handleLogoutOthers = async () => {
    const loadingToast = toast.loading("Logging out other devices...");
    try {
      await axiosInstance.post("/settings/logout-other");
      toast.success("All other sessions logged out", { id: loadingToast });
      // Refresh
      const res = await axiosInstance.get("/settings/");
      setSettings(res.data);
    } catch (err) {
      toast.error("Failed to logout others", { id: loadingToast });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="text-red-600 text-5xl font-black"
        >
          LOADING...
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="text-red-500 text-2xl font-black mb-6">ERROR</div>
        <p className="text-xl mb-8 max-w-md text-center">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-4 bg-red-900 hover:bg-red-800 rounded-xl font-black uppercase tracking-wider"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <Toaster position="top-right" />

      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-5xl font-black uppercase tracking-[0.3em] text-red-600 mb-12 text-center"
      >
        System Settings
      </motion.h1>

      <div className="max-w-4xl mx-auto space-y-12">

        {/* PRIVACY SECTION */}
        <section className="bg-[#0A0A0A]/80 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-8">
            <FaShieldAlt className="text-3xl text-red-600" />
            <h2 className="text-3xl font-black uppercase tracking-wider">Privacy Controls</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Read Receipts */}
            <div className="space-y-2">
              <label className="font-bold text-lg block">Read Receipts</label>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Show when messages are read</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.privacy.readReceipts}
                    onChange={(e) => updatePrivacy("readReceipts", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-700 rounded-full peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-7"></div>
                </label>
              </div>
            </div>

            {/* Last Seen */}
            <div className="space-y-2">
              <label className="font-bold text-lg block">Last Seen & Online</label>
              <select
                value={settings.privacy.lastSeenVisibility}
                onChange={(e) => updatePrivacy("lastSeenVisibility", e.target.value)}
                className="w-full bg-black border border-white/20 rounded-xl p-3 focus:border-red-600 outline-none"
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">My Contacts</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>

            {/* Bio Visibility */}
            <div className="space-y-2">
              <label className="font-bold text-lg block">Bio Visibility</label>
              <select
                value={settings.privacy.bioVisibility}
                onChange={(e) => updatePrivacy("bioVisibility", e.target.value)}
                className="w-full bg-black border border-white/20 rounded-xl p-3 focus:border-red-600 outline-none"
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">My Contacts</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>

            {/* Typing Indicator */}
            <div className="space-y-2">
              <label className="font-bold text-lg block">Typing Indicator</label>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Show typing status</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.privacy.typingIndicator}
                    onChange={(e) => updatePrivacy("typingIndicator", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-700 rounded-full peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-7"></div>
                </label>
              </div>
            </div>

            {/* Incognito Mode */}
            <div className="space-y-2">
              <label className="font-bold text-lg block">Incognito Mode</label>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Hide activity indicators</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.privacy.incognitoMode}
                    onChange={(e) => updatePrivacy("incognitoMode", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-700 rounded-full peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-7"></div>
                </label>
              </div>
            </div>

            {/* Notification Previews */}
            <div className="space-y-2">
              <label className="font-bold text-lg block">Notification Previews</label>
              <select
                value={settings.privacy.notificationPreviews}
                onChange={(e) => updatePrivacy("notificationPreviews", e.target.value)}
                className="w-full bg-black border border-white/20 rounded-xl p-3 focus:border-red-600 outline-none"
              >
                <option value="show">Show full content</option>
                <option value="sender">Sender only</option>
                <option value="none">No content</option>
              </select>
            </div>

            {/* Disappearing Timer */}
            <div className="space-y-2">
              <label className="font-bold text-lg block">Default Disappearing Messages</label>
              <select
                value={settings.privacy.defaultDisappearingTimer}
                onChange={(e) => updatePrivacy("defaultDisappearingTimer", Number(e.target.value))}
                className="w-full bg-black border border-white/20 rounded-xl p-3 focus:border-red-600 outline-none"
              >
                <option value={0}>Off</option>
                <option value={86400}>24 hours</option>
                <option value={604800}>7 days</option>
                <option value={2592000}>30 days</option>
              </select>
            </div>
          </div>
        </section>

        {/* MUTED CHATS */}
        <section className="bg-[#0A0A0A]/80 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-8">
            <FaBan className="text-3xl text-red-600" />
            <h2 className="text-3xl font-black uppercase tracking-wider">Muted Conversations</h2>
          </div>

          {settings.mutedChats?.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No muted chats yet
            </div>
          ) : (
            <div className="space-y-4">
              {settings.mutedChats.map((mute, index) => (
                <div 
                  key={index}
                  className="flex justify-between items-center bg-black/60 p-5 rounded-xl border border-white/5"
                >
                  <div>
                    <p className="font-bold">Chat ID: {mute.chatWith}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {mute.mutedUntil 
                        ? `Muted until ${new Date(mute.mutedUntil).toLocaleString()}`
                        : "Muted permanently"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleMuteToggle(mute.chatWith, false)}
                    className="px-6 py-2 bg-red-900/70 hover:bg-red-800 rounded-lg text-white transition"
                  >
                    Unmute
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ACCOUNT & DEVICES */}
        <section className="bg-[#0A0A0A]/80 border border-white/10 rounded-2xl p-8 backdrop-blur-sm space-y-10">
          <div className="flex items-center gap-4">
            <FaUserSecret className="text-3xl text-red-600" />
            <h2 className="text-3xl font-black uppercase tracking-wider">Account & Security</h2>
          </div>

          {/* Export */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaDownload className="text-green-500 text-2xl" />
              <h3 className="text-2xl font-bold">Export Your Data</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Get a full copy of your messages, profile and settings
            </p>
            <button
              onClick={handleExportData}
              className="px-8 py-3 bg-green-900/60 hover:bg-green-800 rounded-xl font-bold transition flex items-center gap-2"
            >
              <FaDownload /> Download JSON Export
            </button>
          </div>

          {/* Sessions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FaMobileAlt className="text-blue-500 text-2xl" />
                <h3 className="text-2xl font-bold">Active Devices</h3>
              </div>
              {settings.sessions?.length > 1 && (
                <button
                  onClick={handleLogoutOthers}
                  className="px-6 py-2 bg-yellow-900/60 hover:bg-yellow-800 rounded-lg text-yellow-200 transition text-sm font-bold"
                >
                  Logout All Others
                </button>
              )}
            </div>

            <div className="space-y-4">
              {settings.sessions?.map((s, i) => (
                <div 
                  key={i}
                  className="bg-black/60 p-5 rounded-xl border border-white/5 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{s.deviceInfo || "Unknown Device"}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Last active: {new Date(s.lastActive).toLocaleString()}
                    </p>
                  </div>
                  <FaCheckCircle className="text-green-500 text-xl" />
                </div>
              ))}

              {(!settings.sessions || settings.sessions.length === 0) && (
                <p className="text-center text-gray-500 py-6">
                  No other active sessions
                </p>
              )}
            </div>
          </div>

          {/* Delete Account - Danger Zone */}
          <div className="pt-6 border-t border-red-900/30">
            <div className="flex items-center gap-3 mb-6">
              <FaTrash className="text-red-600 text-2xl" />
              <h3 className="text-2xl font-bold text-red-500">Delete Account</h3>
            </div>
            <p className="text-gray-400 mb-6">
              This will permanently delete your account, messages, and all data. This action cannot be undone.
            </p>

            <div className="space-y-4 max-w-md">
              <input
                type="text"
                placeholder='Type "delete my account" to confirm'
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full bg-black border border-red-900/50 rounded-xl p-4 text-white focus:border-red-600 outline-none placeholder:text-gray-600"
              />
              <input
                type="password"
                placeholder="Enter your password"
                value={passwordForDelete}
                onChange={(e) => setPasswordForDelete(e.target.value)}
                className="w-full bg-black border border-red-900/50 rounded-xl p-4 text-white focus:border-red-600 outline-none"
              />
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirm.toLowerCase() !== "delete my account" || !passwordForDelete}
                className={`w-full py-4 font-black uppercase rounded-xl transition tracking-wider ${
                  isDeleting || deleteConfirm.toLowerCase() !== "delete my account" || !passwordForDelete
                    ? "bg-red-950/50 cursor-not-allowed text-gray-500"
                    : "bg-red-900 hover:bg-red-800 text-white"
                }`}
              >
                {isDeleting ? "Deleting..." : "Permanently Delete Account"}
              </button>
            </div>
          </div>
        </section>
      </div>

      <footer className="text-center text-gray-600 text-sm mt-20 pb-10">
        Chatify Quantum Protocol • © 2026 • All rights reserved
      </footer>
    </div>
  );
}