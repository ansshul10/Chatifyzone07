import { useState, useContext, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FaBars, FaTimes, FaUserCircle, FaSignOutAlt, 
    FaCog, FaShieldAlt, FaBell, FaChevronDown, FaUserAlt, FaFingerprint
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../api/axios";
import { UserContext } from "../context/UserContext";

/**
 * CHATIFY ADVANCED NAV-SYSTEM v3.2.2
 * Updated: System Settings now links to real /settings page
 */

export default function Navbar() {
    const { user, setUser } = useContext(UserContext);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();

    // Dynamic Scroll Logic
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Logout Handler
    const logout = async () => {
        const statusId = toast.loading("Terminating session...");
        try {
            await axiosInstance.post('/auth/logout');
            setUser(null);
            setIsProfileOpen(false);
            toast.success("Identity Matrix De-synced.", { id: statusId });
            navigate('/login');
        } catch (err) {
            toast.error("Logout sequence failed.", { id: statusId });
        }
    };

    // Close Dropdown on Click Outside
    useEffect(() => {
        if (!isProfileOpen) return;
        const closeDropdown = (e) => {
            if (!e.target.closest('.profile-dropdown-trigger')) {
                setIsProfileOpen(false);
            }
        };
        window.addEventListener("click", closeDropdown);
        return () => window.removeEventListener("click", closeDropdown);
    }, [isProfileOpen]);

    const navVariants = {
        hidden: { y: -100, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 20 } }
    };

    return (
        <motion.nav
            variants={navVariants}
            initial="hidden"
            animate="visible"
            className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${
                scrolled 
                ? "bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 py-3 shadow-2xl" 
                : "bg-transparent py-5"
            }`}
        >
            <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
                
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <span className="text-xl font-black italic tracking-tighter uppercase text-white">
                        Chatify<span className="text-[#FF0000] animate-pulse"></span>
                    </span>
                </Link>

                {/* Desktop Middle Links */}
                <div className="hidden lg:flex items-center gap-10">
                    {[
                        { name: "Grid", path: "/" },
                        { name: "Protocols", path: "/terms" },
                        { name: "Nodes", path: "/status" }
                    ].map((link) => (
                        <Link 
                            key={link.name} 
                            to={link.path}
                            className={`text-[9px] font-black uppercase tracking-[0.4em] transition-all hover:text-[#FF0000] relative group ${
                                location.pathname === link.path ? "text-[#FF0000]" : "text-gray-500"
                            }`}
                        >
                            {link.name}
                            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#FF0000] transition-all group-hover:w-full"></span>
                        </Link>
                    ))}
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-4">
                    <AnimatePresence mode="wait">
                        {user ? (
                            <motion.div 
                                key="authed"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center gap-4 relative"
                            >
                                {/* Notification (placeholder) */}
                                <button 
                                    onClick={() => toast("Notifications module coming soon", { icon: '🔔' })}
                                    className="p-2.5 text-gray-500 hover:text-[#FF0000] transition-colors relative bg-white/5 rounded-xl border border-white/5"
                                >
                                    <FaBell size={14} />
                                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#FF0000] rounded-full shadow-[0_0_5px_#FF0000]"></span>
                                </button>

                                {/* Profile Dropdown */}
                                <div className="relative profile-dropdown-trigger">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsProfileOpen(!isProfileOpen);
                                        }}
                                        className={`flex items-center gap-3 p-1 pr-4 rounded-full border transition-all duration-300 ${
                                            isProfileOpen ? "bg-[#FF0000]/10 border-[#FF0000]/40" : "bg-white/5 border-white/10 hover:border-white/20"
                                        }`}
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-br from-[#FF0000] to-red-900 rounded-full flex items-center justify-center font-black text-[10px] text-white shadow-lg">
                                            {user.username[0].toUpperCase()}
                                        </div>
                                        <div className="text-left hidden md:block">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white leading-none">
                                                {user.username}
                                            </p>
                                        </div>
                                        <FaChevronDown className={`text-[10px] text-gray-600 transition-transform duration-300 ${isProfileOpen ? "rotate-180 text-[#FF0000]" : ""}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isProfileOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="absolute right-0 mt-4 w-64 bg-[#0A0A0A] border border-white/10 rounded-2xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl z-[110]"
                                            >
                                                <div className="p-4 border-b border-white/5 mb-2">
                                                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1">Identity Vector</p>
                                                    <p className="text-[11px] font-bold text-white truncate">{user.email}</p>
                                                </div>
                                                
                                                <div className="space-y-1">
                                                    <Link 
                                                        to="/profile" 
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="w-full flex items-center gap-3 p-3 text-[10px] font-bold text-gray-400 hover:bg-white/5 hover:text-[#FF0000] rounded-xl transition-all uppercase tracking-widest"
                                                    >
                                                        <FaUserAlt size={12} /> View Profile
                                                    </Link>

                                                    {/* Updated: Real Settings Link */}
                                                    <Link 
                                                        to="/settings" 
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="w-full flex items-center gap-3 p-3 text-[10px] font-bold text-gray-400 hover:bg-white/5 hover:text-[#FF0000] rounded-xl transition-all uppercase tracking-widest"
                                                    >
                                                        <FaCog size={12} /> System Settings
                                                    </Link>
                                                </div>

                                                <div className="h-px bg-white/5 my-2 mx-2"></div>
                                                
                                                <button 
                                                    onClick={logout}
                                                    className="w-full flex items-center gap-3 p-3 text-[10px] font-black text-red-500 hover:bg-red-500/10 rounded-xl transition-all uppercase tracking-[0.2em]"
                                                >
                                                    <FaSignOutAlt size={12} /> De-sync Identity
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="guest"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex items-center gap-4"
                            >
                                <Link to="/login" className="text-[10px] font-black uppercase text-gray-500 hover:text-white transition-all py-2 px-4 tracking-[0.2em]">
                                    Login
                                </Link>
                                <Link to="/register" className="px-6 py-2.5 bg-[#FF0000] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_5px_20px_rgba(255,0,0,0.2)] hover:bg-[#D00000] hover:scale-105 transition-all active:scale-95">
                                    Register
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Mobile Menu Button */}
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="lg:hidden w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-white active:scale-90 transition-all"
                    >
                        {isMenuOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="lg:hidden absolute top-full left-0 w-full bg-[#0A0A0A] border-b border-white/5 shadow-2xl overflow-hidden z-[90]"
                    >
                        <div className="flex flex-col p-8 gap-6">
                            {["Grid", "Protocols", "Nodes"].map((item) => (
                                <Link 
                                    key={item} 
                                    to={item === "Grid" ? "/" : `/${item.toLowerCase()}`} 
                                    onClick={() => setIsMenuOpen(false)}
                                    className="text-sm font-black uppercase tracking-[0.4em] text-gray-500 hover:text-[#FF0000] transition-colors"
                                >
                                    {item}
                                </Link>
                            ))}
                            {user && (
                                <>
                                    <Link 
                                        to="/profile" 
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-sm font-black uppercase tracking-[0.4em] text-gray-500 hover:text-[#FF0000] transition-colors"
                                    >
                                        View Profile
                                    </Link>
                                    <Link 
                                        to="/settings" 
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-sm font-black uppercase tracking-[0.4em] text-gray-500 hover:text-[#FF0000] transition-colors"
                                    >
                                        System Settings
                                    </Link>
                                </>
                            )}
                            <div className="h-px bg-white/5 w-full"></div>
                            {!user ? (
                                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="w-full py-4 bg-[#FF0000] text-center font-black uppercase tracking-widest rounded-2xl text-xs">
                                    Establish Identity
                                </Link>
                            ) : (
                                <button onClick={() => { logout(); setIsMenuOpen(false); }} className="w-full py-4 bg-red-950/30 border border-red-900/50 text-red-500 font-black uppercase tracking-widest rounded-2xl text-xs">
                                    De-sync Session
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}