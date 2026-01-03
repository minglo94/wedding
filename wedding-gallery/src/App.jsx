import React, { useState, useEffect, useRef } from 'react';
import { Upload, Image as ImageIcon, Loader2, Sparkles, X, BookOpen, Quote, Camera, MessageSquare } from 'lucide-react';

// --- CONFIGURATION ---
// 1. Deploy your Google Apps Script
// 2. Paste the Web App URL inside the quotes below:
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzgMVigOQkC6jsXxwfKM88Nmisr-3nFAjmQFCUpM0tKmaUKyfd3NPmXBJlm6lOujOPl/exec"; 

export default function App() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // --- AI / Story State ---
  const [previewFile, setPreviewFile] = useState(null); 
  const [caption, setCaption] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedStory, setGeneratedStory] = useState('');
  const [showStoryModal, setShowStoryModal] = useState(false);
  
  // --- WISHES / DANMAKU STATE ---
  // CHANGED: Default to TRUE to show wishes
  const [showWishes, setShowWishes] = useState(true);

  const apiKey = ""; // Environment handles this

  useEffect(() => {
    fetchImages();
  }, []);

  // Shuffle array utility
  const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  };

  const fetchImages = async () => {
    if (GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
        setError("Please open the code and paste your Google Script URL in the GOOGLE_SCRIPT_URL variable at the top.");
        return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=list`);
      const data = await response.json();
      if (data.status === 'success') {
        // Shuffle images on load for a dynamic feel
        setImages(shuffleArray(data.data));
      } else {
        setError('Failed to load images: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      setError('Connection failed. Check your Script URL.');
    } finally {
      setLoading(false);
    }
  };

  // --- GEMINI FUNCTIONS (Caption only) ---
  const generateCaption = async () => {
    if (!previewFile?.base64) return;
    setIsAnalyzing(true);
    try {
      const base64Data = previewFile.base64.split(',')[1];
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Write a very short, warm wish or aesthetic caption for a wedding/memory wall (max 10 words). Lowercase, minimalist." },
              { inlineData: { mimeType: previewFile.file.type, data: base64Data } }
            ]
          }]
        })
      });
      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (aiText) setCaption(aiText.trim());
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- STATIC STORY FUNCTION ---
  const openStory = () => {
    const staticText = "Welcome to our gallery. Every photo here captures a special moment we've shared together. We are so grateful to have you as part of our journey and these memories will be cherished forever. Thank you for celebrating with us.";
    setGeneratedStory(staticText);
    setShowStoryModal(true);
  };

  // --- UPLOAD HANDLERS ---
  const onFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
        alert("File too large (Max 5MB)");
        return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        setPreviewFile({ file, base64: reader.result });
        setCaption('');
    };
  };

  const handleUploadConfirm = async () => {
    if (!previewFile) return;
    setUploading(true);
    const payload = {
        filename: previewFile.file.name,
        mimeType: previewFile.file.type,
        base64: previewFile.base64,
        description: caption 
    };
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=upload`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.status === 'success') {
          setSuccessMsg('Wishes sent & Photo saved.');
          setPreviewFile(null);
          setTimeout(() => {
              setSuccessMsg('');
              fetchImages();
          }, 2000);
        } else {
          setError(data.message);
        }
    } catch (err) {
        setError('Upload failed.');
    } finally {
        setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f5f2] text-gray-800 font-sans selection:bg-rose-200 flex flex-col overflow-x-hidden">
      
      {/* Styles for Floating Wishes Animation */}
      <style>{`
        @keyframes floatLeft {
          from { transform: translateX(0); }
          to { transform: translateX(-200vw); }
        }
        .danmaku-item {
          animation: floatLeft linear forwards;
          will-change: transform;
        }
      `}</style>

      {/* 1. HERO BANNER */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden shrink-0">
        <img 
            src="https://drive.google.com/thumbnail?id=1-cdGJtdJxBxoeCq7_JWXPXWNZHrErcL4&sz=w1920" 
            alt="Banner" 
            className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center text-center p-4">
            <h1 className="text-4xl md:text-5xl font-serif text-white tracking-wide drop-shadow-lg mb-2">
                Christy & Ming
            </h1>
            <p className="text-white/90 text-lg font-light tracking-widest uppercase">
                2026.02.14
            </p>
        </div>
      </div>

      {/* 2. TOOLBAR */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
           <div className="flex items-center gap-2 text-stone-800">
             <Camera size={20} />
             <span className="font-bold tracking-tight hidden sm:inline">Christy & Ming</span>
           </div>

           <div className="flex items-center gap-3">
              {/* Wishes Toggle */}
              <button 
                  onClick={() => setShowWishes(!showWishes)}
                  className={`p-2 rounded-full transition-colors flex items-center gap-2 ${showWishes ? 'bg-rose-100 text-rose-600' : 'text-stone-500 hover:bg-stone-100'}`}
                  title={showWishes ? "Hide Wishes" : "Show Wishes"}
              >
                  <MessageSquare size={18} className={showWishes ? "fill-rose-600" : ""} />
                  <span className="text-xs font-medium hidden sm:inline">{showWishes ? "Wishes On" : "Wishes Off"}</span>
              </button>

              <button 
                  onClick={openStory}
                  className="hidden md:flex items-center gap-2 px-4 py-2 text-stone-600 hover:text-rose-500 transition-colors text-sm font-medium"
              >
                  <BookOpen size={18} />
                  <span>Story</span>
              </button>

              <label className="cursor-pointer bg-stone-900 hover:bg-stone-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
                  <Upload size={16} />
                  <span>Add Photo</span>
                  <input type="file" accept="image/*" onChange={onFileSelect} className="hidden" />
              </label>
           </div>
        </div>
      </div>

      <main className="flex-grow w-full max-w-7xl mx-auto relative min-h-[500px]">
        
        {/* ALERTS */}
        {error && (
            <div className="absolute top-4 left-0 right-0 z-40 mx-auto max-w-md p-4 bg-red-50 text-red-800 rounded-lg text-center border border-red-100 shadow-lg">
                {error}
            </div>
        )}
        {successMsg && (
            <div className="fixed bottom-8 right-8 bg-stone-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-4 z-50">
                <Sparkles size={16} className="text-yellow-400" />
                {successMsg}
            </div>
        )}

        {/* LOADING STATE */}
        {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#f8f5f2]/80 backdrop-blur-sm h-[500px]">
                <Loader2 size={40} className="animate-spin mb-4 text-stone-400" />
                <p className="font-serif italic text-xl text-stone-500">Developing photos...</p>
            </div>
        )}

        {/* FLOATING WISHES (DANMAKU) LAYER */}
        {showWishes && !loading && (
            <DanmakuOverlay images={images} />
        )}

        {/* EMPTY STATE */}
        {!loading && images.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center text-center py-20">
                <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mb-6">
                    <ImageIcon size={32} className="text-stone-300" />
                </div>
                <h3 className="text-2xl font-serif text-stone-600 mb-2">It's quiet here.</h3>
                <p className="text-stone-400">Upload the first photo to start the collection.</p>
            </div>
        )}

        {/* VIEW: GRID */}
        {!loading && images.length > 0 && (
            <div className="py-12 px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((img, idx) => (
                    <div key={img.id} className="group cursor-pointer">
                        <div className="bg-white p-3 pb-4 rounded-sm shadow-sm hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1">
                            <div className="relative overflow-hidden bg-stone-100 aspect-[4/5]">
                                <img 
                                    src={img.thumbnail} 
                                    alt="Memory" 
                                    loading="lazy"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <a href={img.url} target="_blank" rel="noreferrer" className="text-white border border-white px-4 py-2 rounded-full text-sm hover:bg-white hover:text-black transition-colors">
                                        View Full
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

      </main>

      {/* --- MODALS --- */}

      {/* UPLOAD MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-2 flex justify-end shrink-0">
                    <button onClick={() => setPreviewFile(null)} className="p-2 hover:bg-stone-100 rounded-full"><X size={20}/></button>
                </div>
                <div className="px-6 pb-6 overflow-y-auto">
                    <div className="aspect-[4/3] bg-stone-100 rounded mb-4 overflow-hidden relative shadow-inner">
                         <img src={previewFile.base64} className="w-full h-full object-contain" />
                         <button 
                            onClick={generateCaption} 
                            disabled={isAnalyzing}
                            className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-indigo-600 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 hover:bg-white transition-colors"
                         >
                            <Sparkles size={12} />
                            {isAnalyzing ? "Generating..." : "Auto Wishes"}
                         </button>
                    </div>
                    
                    <label className="block text-sm font-medium text-stone-500 mb-2 uppercase tracking-wide">Your Wishes & Caption</label>
                    <textarea 
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Type your warm wishes for the couple here..."
                        className="w-full border border-stone-200 rounded-lg p-3 text-stone-800 focus:border-stone-800 focus:ring-1 focus:ring-stone-800 focus:outline-none font-serif text-lg mb-6 placeholder:font-sans placeholder:text-stone-400 min-h-[100px]"
                    />

                    <button 
                        onClick={handleUploadConfirm}
                        disabled={uploading}
                        className="w-full bg-stone-900 text-white py-3 rounded-md font-medium hover:bg-stone-800 transition-colors flex justify-center items-center gap-2 shadow-lg"
                    >
                        {uploading ? <Loader2 size={18} className="animate-spin" /> : "Send Wishes & Photo"}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* STORY MODAL (STATIC TEXT) */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/90 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#fffbf7] max-w-2xl w-full p-8 md:p-12 shadow-2xl relative rounded-sm text-center border-4 border-double border-stone-200">
                <button onClick={() => setShowStoryModal(false)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-800"><X size={24}/></button>
                <Quote size={32} className="mx-auto text-rose-300 mb-6 opacity-50" />
                
                <div className="prose prose-stone mx-auto">
                    <p className="font-serif text-xl md:text-2xl leading-relaxed text-stone-700 italic">
                        {generatedStory}
                    </p>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// --- SUB-COMPONENT: DANMAKU (FLOATING WISHES) ---
function DanmakuOverlay({ images }) {
    const [bullets, setBullets] = useState([]);
    
    // 1. Filter out images that actually have descriptions
    const wishes = images
        .filter(img => img.description && img.description.trim().length > 0)
        .map(img => img.description);

    useEffect(() => {
        if (wishes.length === 0) return;

        // Interval to spawn new bullets
        const interval = setInterval(() => {
            // Pick a random wish
            const randomWish = wishes[Math.floor(Math.random() * wishes.length)];
            
            const newBullet = {
                id: Date.now() + Math.random(),
                text: randomWish,
                top: Math.random() * 70 + 15, // Top position between 15% and 85%
                duration: Math.random() * 10 + 15, // Duration between 15s and 25s (Slow float)
                delay: 0,
            };

            setBullets(prev => [...prev, newBullet]);
        }, 3500); // Spawn every 3.5 seconds

        return () => clearInterval(interval);
    }, [wishes]);

    // Cleanup function for when animation ends
    const handleAnimationEnd = (id) => {
        setBullets(prev => prev.filter(b => b.id !== id));
    };

    if (wishes.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
            {bullets.map(b => (
                <div
                    key={b.id}
                    onAnimationEnd={() => handleAnimationEnd(b.id)}
                    className="danmaku-item absolute whitespace-nowrap px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm text-stone-800 font-serif italic text-lg md:text-xl border border-white/50"
                    style={{
                        top: `${b.top}%`,
                        left: '100vw', // Start off-screen right
                        animationDuration: `${b.duration}s`,
                    }}
                >
                    {b.text}
                </div>
            ))}
        </div>
    );
}