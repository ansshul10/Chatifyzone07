import { useContext, useEffect, useState, useRef } from "react";
import { UserContext } from "../context/UserContext";
import { SocketContext } from "../context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import CryptoJS from "crypto-js";
import {
    FaPaperPlane, FaSearch, FaUserCircle, FaPowerOff,
    FaShieldAlt, FaCircle, FaLock, FaMicrochip, FaGlobe,
    FaEllipsisV, FaUsers, FaTrash, FaPlus, FaUnlock, FaEdit, FaKey, FaSignal, FaMars, FaVenus, FaUserShield, FaChevronLeft
} from "react-icons/fa";
import { toast, Toaster } from "react-hot-toast";
import axiosInstance from "../api/axios";

/**
 * CHATIFY QUANTUM v4.7.2
 * Status: Full Correct Version - All Systems Functional + Privacy Settings Integrated
 * Features: Self-Filter, Reliable Handshake, AES-256 Encryption, Privacy Controls
 * Typing Indicator: Real-time typing... with privacy toggle (on/off)
 */

export default function ChatPage() {
    const { user, setUser } = useContext(UserContext);
    const { socket, onlineUsers } = useContext(SocketContext);
    const [allUsers, setAllUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [newMessageText, setNewMessageText] = useState("");
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isE2EE, setIsE2EE] = useState(false);
    const [encryptionKey, setEncryptionKey] = useState("");
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [myGender, setMyGender] = useState("male");
    const [typingUsers, setTypingUsers] = useState({}); // { userId: boolean }
    const scrollRef = useRef(null);

    // Privacy settings from user object (loaded via UserContext)
    const privacy = user?.privacy || {
        readReceipts: true,
        lastSeenVisibility: "everyone",
        bioVisibility: "everyone",
        typingIndicator: true,
        incognitoMode: false,
        notificationPreviews: "show",
        defaultDisappearingTimer: 0
    };

    const myId = user?.id || user?._id;

    // Identify current active conversation node
    const activeChat = allUsers.find(u => u._id === selectedUserId);

    // ─── Crypto Core Functions ───
    const encryptPayload = (text) => {
        if (!isE2EE || !encryptionKey) return text;
        return CryptoJS.AES.encrypt(text, encryptionKey).toString();
    };

    const decryptPayload = (ciphertext, isEnc) => {
        if (!isEnc) return { content: ciphertext, isVisible: true };
        if (!encryptionKey) return { content: ciphertext, isVisible: false };
        try {
            const bytes = CryptoJS.AES.decrypt(ciphertext, encryptionKey);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);
            if (!originalText) throw new Error();
            return { content: originalText, isVisible: true };
        } catch (e) {
            return { content: ciphertext, isVisible: false };
        }
    };

    // ─── Phase 1: Network Discovery ───
    useEffect(() => {
        const fetchRegistry = async () => {
            try {
                if (!user) return;
                const res = await axiosInstance.get('/auth/users');
                const filteredNodes = res.data.filter(u => u._id !== myId);
                setAllUsers(filteredNodes);
                setIsLoading(false);
            } catch (err) {
                toast.error("Network Scan Failed");
                setIsLoading(false);
            }
        };
        fetchRegistry();
    }, [user, myId]);

    // ─── Phase 2: Historical Messages ───
    useEffect(() => {
        if (!selectedUserId || !myId) return;
        axiosInstance.get(`/messages/${selectedUserId}/${myId}`)
            .then(res => setMessages(res.data))
            .catch(() => toast.error("Sync Error: Historical Packets Lost"));
    }, [selectedUserId, myId]);

    // ─── Reload on socket reconnect ───
    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            if (selectedUserId && myId) {
                axiosInstance.get(`/messages/${selectedUserId}/${myId}`)
                    .then(res => setMessages(res.data))
                    .catch(() => {});
            }
        };

        socket.on('connect', handleConnect);

        return () => {
            socket.off('connect', handleConnect);
        };
    }, [socket, selectedUserId, myId]);

    // ─── Socket Listeners ───
    useEffect(() => {
        if (!socket) return;

        const handleReceive = (data) => {
            if (data.sender === selectedUserId || data.recipient === selectedUserId) {
                setMessages(prev => [...prev, data]);
            }
        };

        const handleConfirm = ({ tempId, savedMsg }) => {
            setMessages(prev => prev.map(m => m._id === tempId ? savedMsg : m));
        };

        const handleUpdate = (updated) => {
            setMessages(prev => prev.map(m => m._id === updated._id ? updated : m));
        };

        const handleDelete = (msgId) => {
            setMessages(prev => prev.filter(m => m._id !== msgId));
        };

        // Typing events
        const handleUserTyping = ({ userId }) => {
            if (userId === selectedUserId) {
                setTypingUsers(prev => ({ ...prev, [userId]: true }));
            }
        };

        const handleStopTyping = ({ userId }) => {
            setTypingUsers(prev => {
                const newState = { ...prev };
                delete newState[userId];
                return newState;
            });
        };

        // Read receipt update
        const handleMessagesRead = ({ messageIds }) => {
            setMessages(prev => prev.map(msg =>
                messageIds.includes(msg._id) ? { ...msg, read: true } : msg
            ));
        };

        socket.on('receive_message', handleReceive);
        socket.on('message_sent_confirm', handleConfirm);
        socket.on('message_updated', handleUpdate);
        socket.on('message_deleted', handleDelete);
        socket.on('user_typing', handleUserTyping);
        socket.on('user_stop_typing', handleStopTyping);
        socket.on('messages_read_update', handleMessagesRead);

        return () => {
            socket.off('receive_message', handleReceive);
            socket.off('message_sent_confirm', handleConfirm);
            socket.off('message_updated', handleUpdate);
            socket.off('message_deleted', handleDelete);
            socket.off('user_typing', handleUserTyping);
            socket.off('user_stop_typing', handleStopTyping);
            socket.off('messages_read_update', handleMessagesRead);
        };
    }, [socket, selectedUserId]);

    // ─── Auto-scroll ───
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ─── Send Message ───
    const sendMessage = async (ev) => {
        ev.preventDefault();
        const myId = user?.id || user?._id;

        if (!newMessageText.trim() || !selectedUserId) return;
        
        if (!socket || !socket.connected) {
            return toast.error("Handshake Mismatch: Core Socket Offline");
        }

        if (isE2EE && !encryptionKey) return toast.error("Cipher Key Required");

        const cipherText = encryptPayload(newMessageText);

        const tempId = Date.now().toString();
        const payload = {
            _id: tempId,
            sender: myId,
            recipient: selectedUserId,
            text: cipherText,
            isEncrypted: isE2EE,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            reactions: [],
            disappearingIn: privacy.defaultDisappearingTimer > 0 ? privacy.defaultDisappearingTimer : undefined
        };

        // Optimistic UI
        setMessages(prev => [...prev, payload]);

        // Send to server
        socket.emit('send_message', payload);

        // Stop typing signal
        if (privacy.typingIndicator && !privacy.incognitoMode) {
            socket.emit('stop_typing', { recipient: selectedUserId });
        }

        setNewMessageText("");
        setEditingMessageId(null);
    };

    // ─── React to message ───
    const reactToMessage = (msgId, emoji) => {
        if (!msgId) return;
        socket.emit('react_message', { msgId, emoji, recipient: selectedUserId });
        setMessages(prev => prev.map(m =>
            m._id === msgId ? { ...m, reactions: [...(m.reactions || []), emoji] } : m
        ));
    };

    // ─── Auto-send read receipts when chat opens ───
    useEffect(() => {
        if (!socket || !selectedUserId || !privacy.readReceipts || privacy.incognitoMode) return;

        const unread = messages.filter(m => m.recipient === myId && !m.read);
        if (unread.length > 0) {
            const ids = unread.map(m => m._id);
            socket.emit('messages_read', { recipient: selectedUserId, messageIds: ids });
        }
    }, [messages, selectedUserId, socket, privacy.readReceipts, privacy.incognitoMode, myId]);

    // ─── Typing handler (local) ───
    useEffect(() => {
        if (!socket || !selectedUserId || !privacy.typingIndicator || privacy.incognitoMode) return;

        let timeout;

        const handleTyping = () => {
            socket.emit('typing', { recipient: selectedUserId });
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                socket.emit('stop_typing', { recipient: selectedUserId });
            }, 3000); // 3 seconds inactivity → stop typing
        };

        const handleKeyPress = () => {
            if (newMessageText.trim()) handleTyping();
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            clearTimeout(timeout);
            socket.emit('stop_typing', { recipient: selectedUserId });
        };
    }, [socket, selectedUserId, newMessageText, privacy.typingIndicator, privacy.incognitoMode]);

    if (isLoading) {
        return (
            <div className="h-screen bg-black flex items-center justify-center font-black text-red-600 tracking-widest animate-pulse text-sm">
                QUANTUM_GRID_BOOTING...
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-64px)] bg-black text-white overflow-hidden font-sans relative">
            <Toaster position="top-right" />

            {/* SIDEBAR */}
            <aside className={`
                ${selectedUserId ? 'hidden lg:flex' : 'flex'}
                w-full lg:w-80 bg-[#0A0A0A] border-r border-white/5 flex-col z-30 shadow-2xl transition-all duration-300
            `}>
                <div className="p-5 border-b border-white/5">
                    <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 text-[10px]" />
                        <input
                            type="text" placeholder="SCAN NETWORK NODES"
                            className="w-full bg-black/60 border border-white/5 rounded-xl py-3 pl-11 text-[9px] font-black outline-none focus:border-red-600/40 transition-all uppercase placeholder:text-gray-800"
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {allUsers.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())).map(node => (
                        <div
                            key={node._id}
                            onClick={() => { setSelectedUserId(node._id); setMessages([]); }}
                            className={`p-4 flex items-center gap-4 cursor-pointer rounded-2xl border transition-all ${
                                selectedUserId === node._id ? 'bg-red-600/10 border-red-600/20 shadow-lg' : 'bg-transparent border-transparent hover:bg-white/5'
                            }`}
                        >
                            <div className="relative shrink-0">
                                <div className={`w-10 h-10 bg-black border rounded-xl flex items-center justify-center font-black text-xs ${selectedUserId === node._id ? 'border-red-600 text-red-600' : 'border-white/10 text-gray-600'}`}>
                                    {node.username[0].toUpperCase()}
                                </div>
                                {onlineUsers.includes(node._id) && privacy.lastSeenVisibility !== 'nobody' && (
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#0A0A0A] rounded-full shadow-[0_0_8px_#22c55e]"></div>
                                )}
                            </div>
                            <div className="flex flex-col text-left">
                                <span className={`text-[11px] font-black uppercase truncate tracking-wider ${selectedUserId === node._id ? 'text-white' : 'text-gray-500'}`}>
                                    {node.username}
                                </span>
                                <span className="text-[8px] font-bold text-gray-700 uppercase tracking-tighter italic">Verified Node</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-[#080808] border-t border-white/5">
                    <div className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-2xl group transition-all hover:border-white/10">
                        <div className="flex items-center gap-3">
                            <div className={`relative p-0.5 rounded-lg border ${myGender === "male" ? 'border-blue-500/40' : 'border-pink-500/40'}`}>
                                <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-950 rounded-md flex items-center justify-center font-black text-[10px] text-white">
                                    {user?.username?.[0]?.toUpperCase()}
                                </div>
                                <div
                                    className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-black cursor-pointer transition-all ${myGender === "male" ? 'bg-blue-500 shadow-[0_0_5px_#3b82f6]' : 'bg-pink-500 shadow-[0_0_5px_#ec4899]'}`}
                                    onClick={() => setMyGender(myGender === "male" ? "female" : "male")}
                                />
                            </div>
                            <div className="text-left leading-tight">
                                <p className="text-[10px] font-black uppercase text-white truncate max-w-[80px]">{user?.username}</p>
                                <p className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter tracking-widest">Authorized</p>
                            </div>
                        </div>
                        <button onClick={() => axiosInstance.post('/auth/logout').then(() => setUser(null))} className="text-gray-600 hover:text-red-600 transition-all p-2 hover:bg-red-600/10 rounded-lg border-none bg-transparent">
                            <FaPowerOff size={14} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CHAT INTERFACE */}
            <main className={`
                ${selectedUserId ? 'flex' : 'hidden lg:flex'}
                flex-grow flex-col z-10 bg-black relative transition-all duration-300
            `}>
                {selectedUserId ? (
                    <>
                        <header className="px-6 py-4 bg-[#0A0A0A]/95 border-b border-white/5 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md shadow-xl">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setSelectedUserId(null)} className="lg:hidden p-2 text-gray-500 hover:text-white transition-all border-none bg-transparent">
                                    <FaChevronLeft size={14} />
                                </button>
                                <FaUserCircle className="text-3xl text-gray-700" />
                                <div className="text-left leading-none">
                                    <h2 className="text-xs font-black uppercase text-white tracking-widest mb-1">
                                        {activeChat?.username}
                                    </h2>
                                    {typingUsers[selectedUserId] && privacy.typingIndicator && !privacy.incognitoMode && (
                                        <span className="text-[9px] text-green-400 animate-pulse">typing...</span>
                                    )}
                                    <div className="flex items-center gap-2">
                                        {isE2EE ? <FaLock className="text-[9px] text-green-500 animate-pulse" /> : <FaUnlock className="text-[9px] text-gray-700" />}
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${isE2EE ? 'text-green-600' : 'text-gray-600'}`}>
                                            {isE2EE ? 'Quantum AES 256 Active' : 'Unsecured Link'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {isE2EE && (
                                    <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} className="flex items-center bg-black border border-white/10 rounded-xl px-3 py-1.5 gap-2 shadow-inner">
                                        <FaKey className="text-[10px] text-red-600" />
                                        <input
                                            type="password" placeholder="SHARED KEY"
                                            className="bg-transparent text-[9px] font-black uppercase outline-none w-24 placeholder:text-gray-800 text-red-500 shadow-none border-none ring-0"
                                            value={encryptionKey} onChange={e => setEncryptionKey(e.target.value)}
                                        />
                                    </motion.div>
                                )}
                                <button
                                    onClick={() => setIsE2EE(!isE2EE)}
                                    className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all duration-500 ${isE2EE ? 'bg-green-600 text-white shadow-lg shadow-green-900/20 border-green-600' : 'bg-white/5 text-gray-600 hover:text-white border-transparent'}`}
                                >
                                    E2EE {isE2EE ? 'ON' : 'OFF'}
                                </button>
                            </div>
                        </header>

                        <div className="flex-grow overflow-y-auto p-5 md:px-20 lg:px-32 space-y-6 custom-scrollbar relative">
                            {messages.map((msg) => {
                                const result = decryptPayload(msg.text, msg.isEncrypted);
                                const isMe = msg.sender === myId;
                                return (
                                    <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group mb-2`}>
                                        <div className="relative flex items-end gap-3 max-w-[90%] md:max-w-[75%] lg:max-w-[60%]">
                                            <div className={`px-5 py-3 rounded-[22px] text-sm font-medium leading-relaxed relative shadow-lg transition-all duration-300 ${
                                                isMe
                                                ? 'bg-black border border-white/10 text-white rounded-br-[4px]'
                                                : 'bg-[#1E1E1E] border border-white/5 text-white rounded-bl-[4px]'
                                            }`}>
                                                {!result.isVisible ? (
                                                    <div className="flex flex-col gap-2 min-w-[180px] py-1 text-left">
                                                        <div className="flex items-center gap-2 text-red-600/80">
                                                            <FaShieldAlt className="text-xs" />
                                                            <span className="text-[9px] font-black uppercase tracking-[0.1em] italic">Encrypted Payload</span>
                                                        </div>
                                                        <p className="text-[10px] opacity-10 break-all font-mono h-3 overflow-hidden">{result.content}</p>
                                                        <div className="text-[8px] font-bold text-gray-600 bg-white/5 p-1 px-3 rounded-lg border border-white/5 w-fit uppercase">Access Key Required</div>
                                                    </div>
                                                ) : (
                                                    <span className="tracking-tight">{result.content}</span>
                                                )}
                                                {msg.reactions?.length > 0 && (
                                                    <div className="absolute -bottom-2 -right-1 flex items-center bg-[#111] border border-white/10 rounded-full px-2 py-0.5 scale-110 shadow-2xl z-20">
                                                        <span className="text-[10px]">{msg.reactions[msg.reactions.length-1]}</span>
                                                    </div>
                                                )}
                                                {/* Read status (blue ticks) */}
                                                {isMe && msg.read && privacy.readReceipts && !privacy.incognitoMode && (
                                                    <span className="absolute -bottom-1 right-3 text-blue-400 text-xs">✓✓</span>
                                                )}
                                            </div>

                                            <div className="opacity-0 group-hover:opacity-100 flex gap-3 mb-2 transition-all duration-300">
                                                {isMe ? (
                                                    <>
                                                        <FaEdit onClick={() => { setEditingMessageId(msg._id); setNewMessageText(result.content); }} className="text-gray-700 hover:text-blue-500 transition-colors cursor-pointer text-xs" />
                                                        <FaTrash onClick={() => socket.emit('delete_message', { msgId: msg._id, recipient: selectedUserId })} className="text-gray-700 hover:text-red-600 transition-colors cursor-pointer text-xs" />
                                                    </>
                                                ) : (
                                                    <div className="flex gap-2 bg-black/60 p-1 rounded-full border border-white/10 shadow-lg">
                                                        <button onClick={() => reactToMessage(msg._id, '❤️')} className="text-xs hover:scale-150 transition-transform px-1 border-none bg-transparent">❤️</button>
                                                        <button onClick={() => reactToMessage(msg._id, '🔥')} className="text-xs hover:scale-150 transition-transform px-1 border-none bg-transparent">🔥</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-2 mt-1.5 mx-3 opacity-30 text-[7px] font-black uppercase tracking-[0.2em] ${isMe ? 'flex-row-reverse' : ''}`}>
                                            {msg.isEncrypted && <FaLock className="text-[6px]" />}
                                            <span>{msg.timestamp || 'DATA SYNC'}</span>
                                            {msg.disappearingIn && <span className="text-yellow-400">• Disappears</span>}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={scrollRef} />
                        </div>

                        {/* INPUT AREA */}
                        <div className="p-5 md:p-8 bg-[#0A0A0A] border-t border-white/5 relative">
                            {editingMessageId && (
                                <div className="absolute -top-10 left-0 right-0 bg-blue-900/10 text-blue-400 text-[9px] py-2 px-10 border-t border-blue-500/30 flex justify-between uppercase font-black backdrop-blur-md">
                                    <span className="animate-pulse tracking-widest uppercase">Revising Data Packet</span>
                                    <button onClick={() => {setEditingMessageId(null); setNewMessageText("")}} className="text-white hover:text-red-600 font-black border-none bg-transparent uppercase">Cancel</button>
                                </div>
                            )}
                            <form onSubmit={sendMessage} className="max-w-5xl mx-auto flex items-center gap-4">
                                <div className="relative flex-grow">
                                    <input
                                        value={newMessageText}
                                        onChange={ev => setNewMessageText(ev.target.value)}
                                        placeholder={isE2EE ? (encryptionKey ? "ENCRYPTING PACKET STREAM..." : "KEY REQUIRED TO ENCRYPT") : "ENTER TRANSMISSION PACKET..."}
                                        className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-[11px] font-black tracking-tight outline-none focus:border-red-600/40 transition-all text-white uppercase placeholder:text-gray-900 shadow-inner"
                                    />
                                    <FaSignal className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-800 text-[10px] hidden md:block" />
                                </div>
                                <button
                                    type="submit"
                                    className="p-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 shadow-xl shadow-red-900/20 transition-all flex items-center justify-center min-w-[50px] group border-none"
                                >
                                    <FaPaperPlane className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </button>
                            </form>
                            <p className="text-center text-[7px] font-black text-gray-800 uppercase tracking-[0.5em] mt-5 italic">Quantum Cryptography Protocol v4.7.1</p>
                        </div>
                    </>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center opacity-10 p-10 text-center">
                        <FaGlobe className="text-[8rem] lg:text-[14rem] mb-10 animate-spin-slow" />
                        <h2 className="text-xl lg:text-3xl font-black uppercase tracking-[0.8em]">Handshake Idle</h2>
                        <p className="mt-4 text-[10px] font-black tracking-widest uppercase">Awaiting connection request with remote node</p>
                    </div>
                )}
            </main>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ff0000; }
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin-slow { animation: spin-slow 80s linear infinite; }
                body { background-color: black; }
                input:-webkit-autofill,
                input:-webkit-autofill:hover,
                input:-webkit-autofill:focus {
                    -webkit-text-fill-color: white;
                    -webkit-box-shadow: 0 0 0px 1000px #000 inset;
                    transition: background-color 5000s ease-in-out 0s;
                }
            `}} />
        </div>
    );
}