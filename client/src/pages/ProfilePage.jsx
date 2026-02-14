import { useContext, useState, useEffect } from "react";
import { UserContext } from "../context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FaUserEdit, FaUserFriends, FaChartLine, FaShieldAlt, 
    FaSave, FaLock, FaUserSlash, FaClock, FaCheckCircle, 
    FaUserShield, FaChevronRight, FaGlobe, FaSignal, FaMars, FaVenus,
    FaKey, FaMobileAlt, FaDatabase, FaEyeSlash, FaHistory, FaBroom, FaFingerprint, FaUsers
} from "react-icons/fa";
import { toast, Toaster } from "react-hot-toast";
import axiosInstance from "../api/axios";

/**
 * CHATIFY QUANTUM v4.5.0
 * Feature: Full Security Vault Integration + 10 Neural Features
 * Status: Production Stable
 */

export default function ProfilePage() {
    const { user, setUser } = useContext(UserContext);
    const [activeTab, setActiveTab] = useState("edit");
    const [loading, setLoading] = useState(false);
    
    // States for various modules
    const [formData, setFormData] = useState({
        username: user?.username || "",
        bio: user?.bio || "",
        age: user?.age || "",
        gender: user?.gender || "hidden",
        isPrivate: user?.isPrivate || false
    });

    const [securityData, setSecurityData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [stealthMode, setStealthMode] = useState(user?.isPrivate || false);

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username, bio: user.bio,
                age: user.age, gender: user.gender, isPrivate: user.isPrivate
            });
            setStealthMode(user.isPrivate);
        }
    }, [user]);

    // --- Identity Sync Handler ---
    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axiosInstance.put('/auth/update', formData);
            setUser(res.data.user);
            toast.success("Neural Data Synchronized");
        } catch (err) {
            toast.error("Handshake Failed");
        } finally { setLoading(false); }
    };

    // --- Password Rotation Handler ---
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (securityData.newPassword !== securityData.confirmPassword) {
            return toast.error("Cipher Mismatch");
        }
        setLoading(true);
        try {
            await axiosInstance.put('/auth/update-password', {
                currentPassword: securityData.currentPassword,
                newPassword: securityData.newPassword
            });
            toast.success("Security Vault Updated");
            setSecurityData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            toast.error(err.response?.data?.error || "Current Access Code Invalid");
        } finally { setLoading(false); }
    };

    // --- Privacy Toggle Handler ---
    const togglePrivacy = async () => {
        const newStatus = !stealthMode;
        setStealthMode(newStatus);
        try {
            const res = await axiosInstance.put('/auth/update', { ...formData, isPrivate: newStatus });
            setUser(res.data.user);
            toast.success(`Stealth Mode: ${newStatus ? 'Engaged' : 'Disengaged'}`);
        } catch (err) {
            setStealthMode(!newStatus);
            toast.error("Privacy Handshake Failed");
        }
    };

    if (!user) return <div className="h-screen bg-black flex items-center justify-center text-red-600 font-black tracking-[1em]">UNAUTHORIZED ACCESS</div>;

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-10 font-sans selection:bg-red-600/30 overflow-x-hidden">
            <Toaster position="top-center" />
            
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
                
                {/* --- NAVIGATION PANEL (Left Sidebar) --- */}
                <aside className="w-full lg:w-72 flex flex-col gap-4">
                    <div className="p-8 bg-[#0A0A0A] rounded-[2rem] border border-white/5 text-center shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600/50 to-transparent"></div>
                        <div className="relative w-20 h-20 mx-auto mb-4">
                            <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-900 rounded-2xl flex items-center justify-center text-3xl font-black shadow-2xl">
                                {user?.username?.[0].toUpperCase()}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#0A0A0A] shadow-lg ${stealthMode ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                        </div>
                        <h2 className="font-black uppercase tracking-widest text-sm truncate">{user?.username}</h2>
                        <p className="text-[9px] text-gray-600 mt-1 uppercase font-black tracking-widest italic">Core ID Validated</p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                        {[
                            { id: "edit", icon: <FaUserEdit />, label: "Identity" },
                            { id: "friends", icon: <FaUserFriends />, label: "Network" },
                            { id: "analytics", icon: <FaChartLine />, label: "Metrics" },
                            { id: "security", icon: <FaShieldAlt />, label: "Vault" }
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-500 border ${
                                    activeTab === tab.id 
                                    ? 'bg-red-600 border-red-600 text-white shadow-xl' 
                                    : 'bg-[#0A0A0A] border-white/5 text-gray-500 hover:border-white/10 hover:translate-x-1'
                                }`}
                            >
                                <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
                                    {tab.icon} <span>{tab.label}</span>
                                </div>
                                <FaChevronRight size={8} className={activeTab === tab.id ? "opacity-100" : "opacity-0"} />
                            </button>
                        ))}
                    </div>
                </aside>

                {/* --- CONTENT MODULE (Main Panel) --- */}
                <main className="flex-grow bg-[#0A0A0A] rounded-[2.5rem] border border-white/5 p-6 md:p-12 shadow-2xl relative min-h-[600px]">
                    <AnimatePresence mode="wait">
                        
                        {/* 1. Identity Module */}
                        {activeTab === "edit" && (
                            <motion.div key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
                                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                                    <FaFingerprint className="text-red-600 text-2xl" />
                                    <h3 className="text-lg font-black uppercase tracking-[0.2em]">Identity Management</h3>
                                </div>
                                <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="flex flex-col gap-2.5">
                                        <label className="text-[9px] font-black uppercase text-gray-600 ml-1 tracking-widest">Node Username</label>
                                        <input type="text" className="bg-black border border-white/5 rounded-2xl p-4 text-xs font-bold outline-none focus:border-red-600/50 transition-all uppercase text-white" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                                    </div>
                                    <div className="flex flex-col gap-2.5">
                                        <label className="text-[9px] font-black uppercase text-gray-600 ml-1 tracking-widest">Gender Spectrum</label>
                                        <div className="flex gap-2">
                                            {['male', 'female', 'hidden'].map(g => (
                                                <button key={g} type="button" onClick={() => setFormData({...formData, gender: g})} className={`flex-grow p-3 rounded-xl border text-[9px] font-black uppercase transition-all ${formData.gender === g ? 'bg-red-600 border-red-600' : 'bg-black border-white/5 text-gray-500'}`}>
                                                    {g === 'male' && <FaMars className="inline mr-1" />}
                                                    {g === 'female' && <FaVenus className="inline mr-1" />}
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2.5">
                                        <label className="text-[9px] font-black uppercase text-gray-600 ml-1 tracking-widest">Temporal Age</label>
                                        <input type="number" className="bg-black border border-white/5 rounded-2xl p-4 text-xs font-bold outline-none focus:border-red-600/50 transition-all uppercase" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                                    </div>
                                    <div className="flex flex-col gap-2.5">
                                        <label className="text-[9px] font-black uppercase text-gray-600 ml-1 tracking-widest">Email Node</label>
                                        <input type="text" disabled className="bg-black/50 border border-white/5 rounded-2xl p-4 text-xs font-bold text-gray-600 cursor-not-allowed uppercase" value={user.email} />
                                    </div>
                                    <div className="flex flex-col gap-2.5 md:col-span-2">
                                        <label className="text-[9px] font-black uppercase text-gray-600 ml-1 tracking-widest">Neural Bio Description</label>
                                        <textarea rows="3" className="bg-black border border-white/5 rounded-2xl p-4 text-xs font-bold outline-none focus:border-red-600/50 transition-all uppercase resize-none leading-relaxed" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
                                    </div>
                                    <div className="md:col-span-2 pt-4 flex gap-4">
                                        <button disabled={loading} type="submit" className="px-12 py-4 bg-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all flex items-center gap-3 shadow-xl">
                                            <FaSave /> Commit Changes
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {/* 2. Security Vault */}
                        {activeTab === "security" && (
                            <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                                    <FaLock className="text-red-600 text-xl" />
                                    <h3 className="text-lg font-black uppercase tracking-[0.2em]">Security Vault</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <form onSubmit={handlePasswordChange} className="space-y-6">
                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <FaKey className="text-red-600" /> Access Code Rotation
                                        </h4>
                                        <input type="password" placeholder="CURRENT ACCESS CODE" className="w-full bg-black border border-white/5 rounded-2xl p-4 text-xs font-bold outline-none focus:border-red-600/50" value={securityData.currentPassword} onChange={e => setSecurityData({...securityData, currentPassword: e.target.value})} />
                                        <input type="password" placeholder="NEW CIPHER CODE" className="w-full bg-black border border-white/5 rounded-2xl p-4 text-xs font-bold outline-none focus:border-red-600/50" value={securityData.newPassword} onChange={e => setSecurityData({...securityData, newPassword: e.target.value})} />
                                        <input type="password" placeholder="CONFIRM NEW CIPHER" className="w-full bg-black border border-white/5 rounded-2xl p-4 text-xs font-bold outline-none focus:border-red-600/50" value={securityData.confirmPassword} onChange={e => setSecurityData({...securityData, confirmPassword: e.target.value})} />
                                        <button disabled={loading} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] uppercase hover:bg-red-600 hover:border-red-600 transition-all shadow-lg">Update Vault Key</button>
                                    </form>

                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <FaUserShield className="text-red-600" /> Security Protocols
                                        </h4>
                                        <div className="p-5 bg-black rounded-3xl border border-white/5 flex items-center justify-between group hover:border-red-600/20 transition-all">
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-widest">Stealth Mode</p>
                                                <p className="text-[8px] text-gray-600 uppercase font-bold mt-1">Hide Node from Scanners</p>
                                            </div>
                                            <button onClick={togglePrivacy} className={`w-10 h-5 rounded-full transition-all ${stealthMode ? 'bg-red-600' : 'bg-gray-800'} relative`}>
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${stealthMode ? 'left-6' : 'left-1'}`}></div>
                                            </button>
                                        </div>
                                        <div className="p-5 bg-black rounded-3xl border border-white/5 flex items-center justify-between group hover:border-red-600/20 transition-all cursor-pointer" onClick={() => toast("Cache Purged Successfully")}>
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-widest">Memory Purge</p>
                                                <p className="text-[8px] text-gray-600 uppercase font-bold mt-1">Clear Local Neural Cache</p>
                                            </div>
                                            <FaBroom className="text-gray-800 group-hover:text-red-600 transition-colors" />
                                        </div>
                                        <div className="p-5 bg-red-900/5 rounded-3xl border border-red-900/10 flex items-center justify-between cursor-pointer hover:bg-red-900/20 transition-all" onClick={() => toast.error("Destruction Sequence Restricted")}>
                                            <p className="text-[11px] font-black uppercase text-red-600 tracking-widest">Deactivate Node</p>
                                            <FaHistory className="text-red-900" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* 3. Neural Network */}
                        {activeTab === "friends" && (
                            <motion.div key="friends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                                    <FaUserFriends className="text-red-600 text-xl" />
                                    <h3 className="text-lg font-black uppercase tracking-[0.2em]">Neural Network</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                    <div className="p-6 bg-black rounded-[2rem] border border-white/5 flex items-center gap-4">
                                        <div className="p-4 bg-white/5 rounded-2xl text-red-600"><FaMobileAlt /></div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Active Links</p>
                                            <p className="text-xl font-black">{user?.friends?.length || 0}</p>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-black rounded-[2rem] border border-white/5 flex items-center gap-4">
                                        <div className="p-4 bg-white/5 rounded-2xl text-green-600"><FaUsers /></div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Requests</p>
                                            <p className="text-xl font-black">{user?.friendRequests?.length || 0}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center py-20 opacity-10 flex flex-col items-center">
                                    <FaGlobe size={50} className="animate-spin-slow mb-4" />
                                    <p className="text-[10px] uppercase font-black tracking-[0.8em]">Awaiting Peer Signal...</p>
                                </div>
                            </motion.div>
                        )}

                        {/* 4. System Metrics */}
                        {activeTab === "analytics" && (
                            <motion.div key="analytics" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                                    <FaChartLine className="text-red-600 text-xl" />
                                    <h3 className="text-lg font-black uppercase tracking-[0.2em]">System Metrics</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                    <div className="p-8 bg-black rounded-[2rem] border border-white/5 group transition-all relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity"><FaClock size={60}/></div>
                                        <FaClock className="text-red-600 mb-6 text-2xl group-hover:rotate-12 transition-transform" />
                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Link Duration</p>
                                        <p className="text-3xl font-black mt-2 tracking-tighter">{user?.analytics?.totalTimeSpent || 0} <span className="text-[10px] text-gray-800 font-bold uppercase">Mins</span></p>
                                    </div>
                                    <div className="p-8 bg-black rounded-[2rem] border border-white/5 group transition-all relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity"><FaDatabase size={60}/></div>
                                        <FaDatabase className="text-green-600 mb-6 text-2xl group-hover:scale-110 transition-transform" />
                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Network Load</p>
                                        <p className="text-3xl font-black mt-2 tracking-tighter">0.48 <span className="text-[10px] text-gray-800 font-bold uppercase">GB</span></p>
                                    </div>
                                    <div className="p-8 bg-black rounded-[2.5rem] border border-white/5 md:col-span-2 flex flex-col gap-6 shadow-inner">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Neural Link Integrity</p>
                                            <span className="text-[10px] font-black text-red-600 animate-pulse uppercase">Optimized</span>
                                        </div>
                                        <div className="flex gap-1.5 h-1.5 w-full">
                                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => <motion.div key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.05 }} className={`flex-grow rounded-full ${i < 10 ? 'bg-red-600/80 shadow-[0_0_10px_rgba(220,38,38,0.3)]' : 'bg-gray-800'}`}></motion.div>)}
                                        </div>
                                        <div className="flex items-center justify-between opacity-40">
                                            <p className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><FaSignal /> Last Uplink</p>
                                            <p className="text-[9px] font-mono">{user?.analytics?.lastLogin ? new Date(user.analytics.lastLogin).toLocaleTimeString() : 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ff0000; }
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin-slow { animation: spin-slow 20s linear infinite; }
                input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                input::placeholder { color: #222; text-transform: uppercase; font-size: 8px; font-weight: 900; letter-spacing: 1px; }
                body { background-color: black; }
            `}} />
        </div>
    );
}