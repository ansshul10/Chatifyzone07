import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FaRocket, FaTwitter, FaGithub, FaDiscord, FaEnvelope, 
    FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaUserShield, 
    FaGlobe, FaCheckCircle, FaExclamationTriangle, FaInfoCircle,
    FaFingerprint, FaKey, FaMapMarkerAlt, FaServer, FaCodeBranch,
    FaSatellite, FaMicrochip, FaNetworkWired, FaUserCircle
} from "react-icons/fa";
import { toast, Toaster } from "react-hot-toast";
import axiosInstance from "../api/axios";

/**
 * CHATIFY PROFESSIONAL QUANTUM BUILD v3.2.1 - REGISTER MODULE
 * UI/UX Optimization: Compact Scale & High-DPI Responsiveness
 * Feature: 4-Way Animated Kinetic Borders
 * Author: Gourav Kansana
 */

export default function RegisterPage() {
    // --- State Persistence & Management ---
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [systemBooting, setSystemBooting] = useState(true);
    const [loadProgress, setLoadProgress] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    
    const navigate = useNavigate();

    // --- Responsive Detection Logic ---
    useEffect(() => {
        const checkRes = () => setIsMobile(window.innerWidth < 768);
        checkRes();
        window.addEventListener('resize', checkRes);
        return () => window.removeEventListener('resize', checkRes);
    }, []);

    // --- Complex Animation Orchestration ---
    const pageTransition = {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 1 } }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.98 },
        visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { 
                type: "spring", 
                stiffness: 120, 
                damping: 25,
                staggerChildren: 0.1 
            } 
        }
    };

    const elementFade = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    // --- Core System Boot Sequence ---
    useEffect(() => {
        const interval = setInterval(() => {
            setLoadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setSystemBooting(false), 500);
                    return 100;
                }
                return prev + 5;
            });
        }, 30);
        return () => clearInterval(interval);
    }, []);

    // --- Event Interceptors ---
    const handleFutureFeature = useCallback((gateway) => {
        toast.error(`GATEWAY_LOCKED: ${gateway} registration is scheduled for v4.0.`, {
            style: {
                background: '#0a0a0a',
                color: '#ff0000',
                border: '1px solid #ff0000',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'monospace'
            }
        });
    }, []);

    const handleAdminBlock = useCallback((module) => {
        toast(`ADMIN_RESTRICTION: Unauthorized access to ${module}.`, {
            icon: '🔒',
            style: {
                background: '#111',
                color: '#fff',
                fontSize: '11px',
                borderRadius: '8px',
                border: '1px solid #333'
            }
        });
    }, []);

    const handleRegisterSubmit = async (ev) => {
        ev.preventDefault();
        setFormError('');
        setIsLoading(true);

        const statusId = toast.loading("Establishing new identity in Central Intelligence...");

        try {
            await axiosInstance.post('/auth/register', { username, email, password });
            toast.success(`Identity established successfully. Please login.`, { id: statusId });
            setTimeout(() => navigate('/login'), 1500);
        } catch (error) {
            const msg = error.response?.data?.error || "Identity Matrix creation rejected.";
            setFormError(msg);
            toast.error(msg, { id: statusId });
            setIsLoading(false);
        }
    };

    // --- Boot Interface ---
    if (systemBooting) {
        return (
            <div className="h-screen bg-black flex flex-col items-center justify-center font-mono">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "200px" }}
                    className="h-1 bg-[#ff0000] mb-4"
                />
                <p className="text-[#ff0000] text-[10px] tracking-[0.5em] animate-pulse">
                    LOADING CORE: {loadProgress}%
                </p>
            </div>
        );
    }

    return (
        <motion.div 
            className="flex flex-col min-h-screen bg-[#050505] text-white selection:bg-[#FF0000]"
            variants={pageTransition}
            initial="initial"
            animate="animate"
        >
            <Toaster position="top-right" />

            {/* --- Original High-Fidelity Background --- */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#FF0000] opacity-[0.03] blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-blue-600 opacity-[0.02] blur-[120px] rounded-full"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-110"></div>
            </div>

            {/* --- Compact Professional Main Section --- */}
            <main className="flex-grow flex items-center justify-center px-4 py-12 relative z-10">
                
                <motion.div 
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-[420px] relative p-[1px] rounded-[2rem] overflow-hidden shadow-2xl"
                >
                    {/* --- 4-SIDE INFINITE ANIMATED BORDER (KINETIC) --- */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#FF0000] to-transparent animate-k-top"></div>
                        <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-transparent via-[#FF0000] to-transparent animate-k-right"></div>
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#FF0000] to-transparent animate-k-bottom"></div>
                        <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-transparent via-[#FF0000] to-transparent animate-k-left"></div>
                    </div>

                    {/* --- Pro Glassmorphism Form Card --- */}
                    <div className="bg-[#111]/95 backdrop-blur-2xl p-8 md:p-10 rounded-[2rem] border border-white/5 relative z-10">
                        
                        <motion.div variants={elementFade} className="text-center mb-8">
                            <div className="w-16 h-16 bg-black border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner group transition-all hover:border-[#ff0000]/30">
                                <FaFingerprint className="text-3xl text-[#FF0000] group-hover:scale-110 transition-transform" />
                            </div>
                            <h2 className="text-3xl font-black tracking-tighter uppercase italic">
                                Chatify<span className="text-[#FF0000]"></span>
                            </h2>
                            <p className="text-gray-600 text-[9px] mt-2 font-bold uppercase tracking-[0.4em]">Establish Identity Matrix</p>
                        </motion.div>

                        <AnimatePresence>
                            {formError && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 p-3 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-[11px] font-bold"
                                >
                                    <FaExclamationTriangle className="shrink-0" />
                                    <span>{formError}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                            <motion.div variants={elementFade} className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Identity Name</label>
                                <div className="relative group">
                                    <FaUserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-[#FF0000] transition-colors" />
                                    <input 
                                        type="text" 
                                        placeholder="Username"
                                        required
                                        className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl outline-none focus:border-[#FF0000] transition-all text-xs font-medium placeholder:text-gray-800"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </motion.div>

                            <motion.div variants={elementFade} className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Identity Vector</label>
                                <div className="relative group">
                                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-[#FF0000] transition-colors" />
                                    <input 
                                        type="email" 
                                        placeholder="Email Address"
                                        required
                                        className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl outline-none focus:border-[#FF0000] transition-all text-xs font-medium placeholder:text-gray-800"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </motion.div>

                            <motion.div variants={elementFade} className="space-y-1.5">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Access Cipher</label>
                                </div>
                                <div className="relative group">
                                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-[#FF0000] transition-colors" />
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Password"
                                        required
                                        className="w-full pl-11 pr-11 py-3 bg-black/40 border border-white/5 rounded-xl outline-none focus:border-[#FF0000] transition-all text-xs font-mono tracking-widest"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 hover:text-white"
                                    >
                                        {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                    </button>
                                </div>
                            </motion.div>

                            <motion.button 
                                variants={elementFade}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                disabled={isLoading}
                                className={`w-full py-3.5 mt-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${isLoading ? 'bg-gray-900 text-gray-700' : 'bg-[#FF0000] text-white hover:brightness-110 shadow-lg shadow-[#FF0000]/10'}`}
                            >
                                {isLoading ? "Synching Matrix..." : "Register Identity"}
                            </motion.button>
                        </form>

                        {/* Federation Gateways */}
                        <motion.div variants={elementFade} className="mt-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-[1px] bg-white/5 flex-grow"></div>
                                <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Federated Gateways</span>
                                <div className="h-[1px] bg-white/5 flex-grow"></div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { icon: <FaGithub />, lab: 'GitHub' },
                                    { icon: <FaDiscord />, lab: 'Discord' },
                                    { icon: <FaTwitter />, lab: 'Twitter' }
                                ].map((soc, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => handleFutureFeature(soc.lab)}
                                        className="py-3 bg-black border border-white/5 rounded-xl flex justify-center items-center text-lg text-gray-700 hover:text-[#FF0000] hover:border-[#FF0000]/30 transition-all"
                                    >
                                        {soc.icon}
                                    </button>
                                ))}
                            </div>
                        </motion.div>

                        <motion.p variants={elementFade} className="mt-8 text-center text-gray-600 text-[10px] font-black uppercase tracking-widest">
                            Matrix already exists? 
                            <Link to="/login" className="text-[#FF0000] ml-2 hover:underline">Login</Link>
                        </motion.p>
                    </div>
                </motion.div>
            </main>

            {/* --- Professional High-Density Footer --- */}
            <motion.footer
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="py-12 px-6 md:px-20 bg-[#080808] border-t border-white/5"
            >
                <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 sm:text-left text-center">
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                            <FaShieldAlt className="text-[#FF0000] text-lg" />
                            <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Chatify</h3>
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold leading-relaxed tracking-wider">
                            Global decentralized communication node. AES-256 military-grade encryption with zero-knowledge architecture.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] border-l-2 border-[#FF0000] pl-3">Architecture</h3>
                        <ul className="space-y-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                            <li><Link to="/terms" className="hover:text-white transition-colors">Governance</Link></li>
                            <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                            <li><button onClick={() => handleAdminBlock("Audit")} className="hover:text-white transition-colors">Audit</button></li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] border-l-2 border-[#FF0000] pl-3">Connectivity</h3>
                        <div className="flex justify-center sm:justify-start gap-4 text-xl text-gray-800">
                            <button onClick={() => handleAdminBlock("Twitter")} className="hover:text-[#FF0000] transition-transform hover:scale-110"><FaTwitter /></button>
                            <button onClick={() => handleAdminBlock("GitHub")} className="hover:text-[#FF0000] transition-transform hover:scale-110"><FaGithub /></button>
                            <button onClick={() => handleAdminBlock("Discord")} className="hover:text-[#FF0000] transition-transform hover:scale-110"><FaDiscord /></button>
                        </div>
                        <p className="text-[9px] text-gray-700 font-bold uppercase italic">External links restricted by Admin.</p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] border-l-2 border-[#FF0000] pl-3">Headquarter</h3>
                        <div className="bg-black p-4 rounded-xl border border-white/5 space-y-2">
                            <div className="flex items-center gap-2 text-[9px] font-black text-gray-500 uppercase tracking-tight">
                                <FaGlobe className="text-[#FF0000]" /> Laniakea Supercluster
                            </div>
                            <p className="text-[9px] font-bold text-gray-600 uppercase leading-normal">
                                Milky Way Galaxy, Solar System<br />
                                Planet Earth, Continent: Asia, Country: India
                            </p>
                            <div className="pt-2 border-t border-white/5 text-[9px] text-[#FF0000] font-black">
                                support@chatifyzone.in
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-black uppercase tracking-[0.4em] text-gray-700">
                    <p>© 2026 CHATIFY CORE. DECENTRALIZED INTEL.</p>
                    <div className="flex gap-6">
                        <span className="hover:text-white transition-colors">SSL ACTIVE</span>
                        <span className="hover:text-[#ff0000] transition-colors">BETA 3.2</span>
                    </div>
                </div>
            </motion.footer>

            {/* --- Global Professional Animations --- */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes k-top { 0% { left: -100%; } 100% { left: 100%; } }
                @keyframes k-right { 0% { top: -100%; } 100% { top: 100%; } }
                @keyframes k-bottom { 0% { right: -100%; } 100% { right: 100%; } }
                @keyframes k-left { 0% { bottom: -100%; } 100% { bottom: 100%; } }

                .animate-k-top { animation: k-top 4s linear infinite; }
                .animate-k-right { animation: k-right 4s linear infinite; animation-delay: 1s; }
                .animate-k-bottom { animation: k-bottom 4s linear infinite; animation-delay: 2s; }
                .animate-k-left { animation: k-left 4s linear infinite; animation-delay: 3s; }

                body { background-color: #050505; }
                input:focus { border-color: #ff0000 !important; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: #000; }
                ::-webkit-scrollbar-thumb { background: #FF0000; border-radius: 4px; }
            `}} />
        </motion.div>
    );
}