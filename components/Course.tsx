'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Brain, Bot, Camera, Mic, Sparkles, AlertTriangle, ShieldCheck, Activity, Pencil, Eraser, Volume2, Search, Eye, Fingerprint, MessageSquare, BookOpen, ArrowRight, Settings, FileImage, Film, FileText, Play, Square } from 'lucide-react';

type ChatGuess = 'correct' | 'wrong' | null;
type TigerResult = 'cat' | 'tiger' | null;
type ListeningTeam = 'burger' | 'pizza' | null;

const SlideDeck = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // --- States for Interactions ---

  // P2: Reveal
  const [revealedCards, setRevealedCards] = useState([false, false, false]);

  // P4: Feeding Game
  const [feedCount, setFeedCount] = useState(0);
  const [feedEffect, setFeedEffect] = useState<string | null>(null);
  const [currentFoodIcon, setCurrentFoodIcon] = useState(0);

  // P5: Chat Principle
  const [chatGuess, setChatGuess] = useState<ChatGuess>(null);

  // P6: Tiger Test
  const [tigerTestResult, setTigerTestResult] = useState<TigerResult>(null);

  // P7: Neural Network (New Mic Logic)
  const [pizzaVotes, setPizzaVotes] = useState(50); // Scale 0-100 for smoother animation
  const [burgerVotes, setBurgerVotes] = useState(20);
  const [isListening, setIsListening] = useState<ListeningTeam>(null);
  const [currentVolume, setCurrentVolume] = useState(0); // 0-100 for visualization
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // P8: Unplugged Game
  const [trainingStep, setTrainingStep] = useState(0);

  // P9: Summary Process
  const [processStep, setProcessStep] = useState(0);

  // P10: Drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // P14: Hierarchy

  // P2: Video Player
  const [videoEnded, setVideoEnded] = useState(false);

  // P4: Sensor interaction
  const [activeSensor, setActiveSensor] = useState<'camera' | 'mic' | null>(null);

  // P14: Agent detail
  const [expandedAgent, setExpandedAgent] = useState<number | null>(null);

  // P15: Hallucination reveal
  const [hallucinationRevealed, setHallucinationRevealed] = useState(false);

  const prevSlideRef = useRef(currentSlide);

  // --- Effects & Helpers ---

  useEffect(() => {
    // Reset slide-specific states when LEAVING a slide
    const prev = prevSlideRef.current;
    if (prev === 8) setTrainingStep(0);
    if (prev === 13) setExpandedAgent(null);
    if (prev === 14) setHallucinationRevealed(false);
    prevSlideRef.current = currentSlide;

    // Reset states when ENTERING a slide
    if (currentSlide === 4) setFeedCount(0);
    if (currentSlide === 5) setChatGuess(null);
    if (currentSlide === 6) setTigerTestResult(null);
    if (currentSlide === 3) setActiveSensor(null);

    // Cleanup Audio on slide change
    if (currentSlide !== 7) {
      stopListening();
    }

    // Auto-play animation for Summary Slide (P10)
    if (currentSlide === 9) {
      setProcessStep(0);
      const timer1 = setTimeout(() => setProcessStep(1), 500);
      const timer2 = setTimeout(() => setProcessStep(2), 2000);
      const timer3 = setTimeout(() => setProcessStep(3), 3500);
      return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
    }
  }, [currentSlide]);

  // --- Audio Logic for P7 ---
  const startListening = async (team: 'burger' | 'pizza') => {
    try {
      if (isListening) stopListening(); // Stop current if any

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize Audio Context
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }
      
      const audioCtx = audioContextRef.current;
      analyserRef.current = audioCtx.createAnalyser();
      sourceRef.current = audioCtx.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      setIsListening(team);

      const updateVolume = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Update volume for visualization (0-100 scale)
        const volumePercent = Math.min(100, (average / 255) * 100);
        setCurrentVolume(volumePercent);

        // 安静时票数下降，声音大时票数增长
        // volume < 30: 下降
        // volume 30-50: 缓慢增长
        // volume 50-70: 中速增长
        // volume 70-80: 快速增长
        // volume > 80: 最快增长
        let delta: number;
        if (volumePercent > 70) {
          delta = average * 0.15; // 最快增长
        } else if (volumePercent > 60) {
          delta = average * 0.09;
        } else if (volumePercent > 40) {
          delta = average * 0.045;
        } else if (volumePercent > 20) {
          delta = average * 0.015;
        } else {
          delta = -0.3; // 安静时缓慢下降
        }

        if (team === 'burger') {
          setBurgerVotes(prev => Math.max(0, Math.min(300, prev + delta)));
        } else {
          setPizzaVotes(prev => Math.max(0, Math.min(300, prev + delta)));
        }

        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();

    } catch (err) {
      console.error("Microphone access denied", err);
      alert("无法访问麦克风，请检查浏览器权限，或使用手动按钮。");
    }
  };

  const stopListening = () => {
    if (sourceRef.current) {
      const stream = sourceRef.current.mediaStream;
      if (stream) stream.getTracks().forEach(track => track.stop());
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsListening(null);
    setCurrentVolume(0);
  };

  const toggleReveal = (index: number) => {
    const newRevealed = [...revealedCards];
    newRevealed[index] = !newRevealed[index];
    setRevealedCards(newRevealed);
  };

  const handleSensorClick = (sensor: 'camera' | 'mic') => {
    setActiveSensor(sensor);
    setTimeout(() => setActiveSensor(null), 2000);
  };

  const handleFeed = () => {
    if (feedCount >= 5) return;
    setFeedCount(c => c + 1);
    const feedbacks = ["AI 吃了一堆文字数据！", "AI 看了好多图片！", "AI 听了各种声音！", "AI 看了无数视频！"];
    setFeedEffect(feedbacks[feedCount % 4]);
    setCurrentFoodIcon((prev) => (prev + 1) % 4);
    setTimeout(() => setFeedEffect(null), 800);
  };

  // Drawing Logic (Slide 11)
  useEffect(() => {
    if (currentSlide === 10 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#2563eb';
      }
    }
  }, [currentSlide]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentSlide !== 10) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || currentSlide !== 10) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // --- Slides Data ---
  const slides = [
    // P1: Cover
    { id: 1, type: "cover", bgColor: "bg-gradient-to-br from-indigo-50 to-blue-100" },
    // P2: Video Intro
    { id: 2, type: "video", bgColor: "bg-slate-900" },
    // P3: Warm-up (Custom Images)
    { id: 3, type: "reveal", bgColor: "bg-yellow-50" },
    // P4: Concept
    { id: 4, type: "senses", bgColor: "bg-pink-50" },
    // P5: Feeding (Rich Data)
    { id: 5, type: "feeding", bgColor: "bg-green-50" },
    // P6: Chat Principle
    { id: 6, type: "chat_principle", bgColor: "bg-teal-50" },
    // P7: Pattern
    { id: 7, type: "pattern", bgColor: "bg-orange-50" },
    // P8: Neural Network (Mic Enabled)
    { id: 8, type: "neural", bgColor: "bg-blue-50" },
    // P9: Unplugged
    { id: 9, type: "unplugged", bgColor: "bg-purple-50" },
    // P10: Summary
    { id: 10, type: "summary_process", bgColor: "bg-slate-50" },
    // P11: Drawing
    { id: 11, type: "drawing", bgColor: "bg-white" },
    // P12: Train AI (魔法时刻：训练自己的AI)
    { id: 12, type: "train_ai", bgColor: "bg-gradient-to-br from-purple-50 to-pink-50" },
    // P13: Hierarchy (AI 未来大厦)
    { id: 13, type: "hierarchy", bgColor: "bg-gradient-to-b from-slate-50 to-slate-200" },
    // P14: Agents (校园 AI 特工)
    { id: 14, type: "agents", bgColor: "bg-indigo-50" },
    // P15: Hallucination
    { id: 15, type: "hallucination", bgColor: "bg-gray-100" },
    // P16: Suggestions
    { id: 16, type: "suggestions", bgColor: "bg-red-50" },
    // P17: End
    { id: 17, type: "end", bgColor: "bg-gradient-to-t from-blue-200 to-white" },
  ];

  const nextSlide = () => { if (currentSlide < slides.length - 1) setCurrentSlide(c => c + 1); };
  const prevSlide = () => { if (currentSlide > 0) setCurrentSlide(c => c - 1); };

  // --- Render Content ---
  const renderContent = (slide: { id: number; type: string; bgColor: string }) => {
    switch (slide.type) {
      case "cover":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-in fade-in duration-700">
            <div className="relative">
              <Bot size={160} className="text-blue-600 animate-bounce" />
              <div className="absolute top-10 right-10 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
            </div>
            <h1 className="text-6xl font-black text-slate-800 tracking-tight">探秘人工智能</h1>
            <div className="bg-white/60 px-8 py-4 rounded-2xl backdrop-blur-sm">
              <p className="text-3xl text-blue-600 font-bold">做 AI 的聪明小主人 🚀</p>
            </div>
            <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mt-8">
              <div className="h-full bg-blue-500 animate-[width_2s_ease-in-out_infinite]" style={{width: '60%'}}></div>
            </div>
            <button onClick={nextSlide} className="mt-2 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-lg font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 animate-pulse">
              点击开始冒险 →
            </button>
          </div>
        );

      case "video":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-4xl font-bold text-white mb-6">AI 导航视频 🎬</h2>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-blue-400">
              <video
                src="https://pub-ae23ea8734be481ea425b35e20c16b40.r2.dev/videos/ai-intro.mp4"
                className="w-full max-w-3xl"
                controls
                onEnded={() => setVideoEnded(true)}
              />
            </div>
            <p className="mt-6 text-blue-300 text-lg">看完视频，猜猜下一位 AI 朋友是谁？</p>
          </div>
        );

      case "reveal":
        return (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <h2 className="text-5xl font-bold text-slate-800 mb-12">猜猜他们是谁？</h2>
            <div className="grid grid-cols-3 gap-8 w-full max-w-5xl">
              {[
                { 
                  hint: "蓝色机器猫", 
                  imgUrl: "https://pub-ae23ea8734be481ea425b35e20c16b40.r2.dev/pics/doraemon.png", 
                  name: "哆啦A梦", 
                  color: "bg-blue-100" 
                },
                { 
                  hint: "暖男医生", 
                  imgUrl: "https://pub-ae23ea8734be481ea425b35e20c16b40.r2.dev/pics/%E5%A4%A7%E7%99%BD.png", 
                  name: "大白", 
                  color: "bg-gray-100" 
                },
                { 
                  hint: "钢铁侠管家", 
                  imgUrl: "https://pub-ae23ea8734be481ea425b35e20c16b40.r2.dev/pics/jarvis_logo.png", 
                  name: "贾维斯", 
                  color: "bg-red-100" 
                }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => toggleReveal(idx)}
                  className={`h-80 rounded-3xl shadow-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-500 transform hover:scale-105 overflow-hidden relative ${revealedCards[idx] ? item.color : 'bg-slate-800'}`}
                >
                  {revealedCards[idx] ? (
                    <>
                      <img src={item.imgUrl} alt={item.name} className="w-48 h-48 mb-4 object-contain animate-in zoom-in mix-blend-multiply" />
                      <h3 className="text-3xl font-bold text-slate-800">{item.name}</h3>
                    </>
                  ) : (
                    <>
                      <span className="text-6xl mb-4">❓</span>
                      <p className="text-white text-xl font-bold">点击揭秘</p>
                      <p className="text-slate-400 mt-2">{item.hint}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-12 text-2xl text-slate-600 font-bold bg-white px-6 py-3 rounded-full shadow-sm">
              共同点：他们都有"超级大脑"，能听懂人话！
            </p>
            <div className="mt-4 bg-blue-100 px-6 py-3 rounded-2xl">
              <p className="text-lg text-blue-800 font-bold">💡 人工智能（AI）= 让机器学会像人一样看、听、思考和做决定的技术</p>
            </div>
          </div>
        );

      case "senses":
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-5xl font-bold text-slate-800 mb-8">AI 怎么感知世界？</h2>
            <div className="flex items-center justify-center space-x-12 w-full max-w-5xl">
              {/* Human */}
              <div className="flex-1 bg-white p-8 rounded-3xl shadow-lg border-b-8 border-orange-200 text-center">
                <h3 className="text-3xl font-bold text-orange-600 mb-6">人类 🧒</h3>
                <div className="flex justify-center space-x-4 mb-4">
                  <div className="flex flex-col items-center"><Eye size={48} className="text-slate-700"/><span className="mt-2">看</span></div>
                  <div className="flex flex-col items-center"><span className="text-4xl">👂</span><span className="mt-2">听</span></div>
                </div>
                <p className="text-slate-500">用五官感受</p>
              </div>

              <div className="text-4xl font-bold text-slate-400">VS</div>

              {/* AI */}
              <div className="flex-1 bg-white p-8 rounded-3xl shadow-lg border-b-8 border-blue-200 text-center">
                <h3 className="text-3xl font-bold text-blue-600 mb-6">AI 🤖</h3>
                <div className="flex justify-center space-x-4 mb-4 relative">
                  <div
                    className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => handleSensorClick('camera')}
                  >
                    <Camera size={48} className="text-slate-700"/>
                    <span className="mt-2">摄像头</span>
                    <span className="text-xs text-blue-400">点击试试</span>
                  </div>
                  <div
                    className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => handleSensorClick('mic')}
                  >
                    <Mic size={48} className="text-slate-700"/>
                    <span className="mt-2">麦克风</span>
                    <span className="text-xs text-blue-400">点击试试</span>
                  </div>
                </div>
                <p className="text-slate-500">用传感器 (Sensors)</p>
              </div>
            </div>

            {/* Sensor feedback bubble */}
            {activeSensor && (
              <div className="mt-4 bg-blue-100 px-6 py-3 rounded-2xl animate-in zoom-in duration-300">
                <p className="text-lg text-blue-800 font-bold">
                  {activeSensor === 'camera' ? '📸 咔嚓！AI 看到了一只猫！' : '🎤 AI 听到了你在说"你好"！'}
                </p>
              </div>
            )}

            <div className="mt-4 bg-pink-100 px-8 py-4 rounded-2xl flex items-center space-x-4">
              <span className="text-4xl">👶</span>
              <p className="text-2xl text-pink-800 font-bold">AI 就像小宝宝，要吃"数据"才能长大！</p>
            </div>
          </div>
        );

      case "feeding":
        // Icons for feeding
        const FoodIcons = [
          <span className="text-7xl">🍔</span>,
          <BookOpen size={72} className="text-blue-500" />,
          <FileImage size={72} className="text-purple-500" />,
          <Film size={72} className="text-red-500" />
        ];
        
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-5xl font-bold text-slate-800 mb-4">互动：给 AI 喂数据</h2>
            <p className="text-2xl text-slate-600 mb-10">全班一起喊口号，点击按钮喂饱它！</p>
            
            <div className="flex items-center space-x-20">
              <div className="relative transition-all duration-500">
                 {feedCount >= 5 ? (
                   <div className="animate-bounce">
                     <Brain size={180} className="text-green-500 drop-shadow-[0_0_30px_rgba(34,197,94,0.6)]" />
                     <div className="absolute -top-6 -right-6 text-5xl animate-spin-slow">✨</div>
                   </div>
                 ) : (
                   <div className={feedEffect ? "scale-110" : ""}>
                      <Bot size={180} className="text-gray-400" />
                      {feedEffect && <div className="absolute -top-10 left-10 text-2xl font-bold text-orange-500 animate-fade-out-up whitespace-nowrap">{feedEffect}</div>}
                   </div>
                 )}
                 <div className="mt-6 text-2xl font-bold bg-white px-4 py-2 rounded-lg shadow">
                   {feedCount >= 5 ? "我学会啦！🧠" : `饥饿度: ${5 - feedCount}/5`}
                 </div>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <button 
                  onClick={handleFeed}
                  disabled={feedCount >= 5}
                  className="group relative bg-white p-8 rounded-[2rem] shadow-xl border-b-[10px] border-green-200 active:border-b-0 active:translate-y-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-50 w-64 h-64 flex flex-col items-center justify-center"
                >
                  <div className="mb-4 group-hover:scale-110 transition-transform">
                    {FoodIcons[feedCount % 4]}
                  </div>
                  <p className="font-bold text-slate-600 text-2xl">投喂数据</p>
                </button>
                <p className="text-slate-400 text-sm">点击投喂：书本、图片、视频...</p>
              </div>
            </div>
          </div>
        );

      case "chat_principle":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-5xl font-bold text-slate-800 mb-2">原理揭秘1：AI 怎么说话？</h2>
            <p className="text-2xl text-slate-500 mb-8">其实它是一个超级厉害的"猜词高手"！</p>

            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-4xl border-4 border-teal-100">
              <div className="flex items-center justify-center space-x-4 mb-8">
                <BookOpen size={48} className="text-teal-500" />
                <p className="text-2xl text-slate-700">AI 读了全世界的书，它知道哪个字通常排在后面。</p>
              </div>

              <div className="bg-slate-100 p-8 rounded-2xl mb-8">
                <p className="text-5xl font-black text-slate-800 tracking-widest">
                  床前明月<span className="text-teal-600 border-b-4 border-teal-600 min-w-[100px] inline-block text-center">{chatGuess === 'correct' ? "光" : (chatGuess === 'wrong' ? "🍪" : "___")}</span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <button 
                  onClick={() => setChatGuess('correct')}
                  className={`p-4 rounded-xl text-2xl font-bold transition-all ${chatGuess === 'correct' ? 'bg-teal-500 text-white scale-105' : 'bg-white border-2 border-teal-200 hover:bg-teal-50'}`}
                >
                  光 (Guang)
                  {chatGuess === 'correct' && <div className="text-sm mt-1">概率 99% ✅</div>}
                </button>
                <button 
                  onClick={() => setChatGuess('wrong')}
                  className={`p-4 rounded-xl text-2xl font-bold transition-all ${chatGuess === 'wrong' ? 'bg-red-500 text-white' : 'bg-white border-2 border-slate-200 hover:bg-slate-50'}`}
                >
                  饼 (Bing)
                  {chatGuess === 'wrong' && <div className="text-sm mt-1">概率 0.1% ❌</div>}
                </button>
                <button 
                  onClick={() => setChatGuess('wrong')}
                  className="p-4 rounded-xl text-2xl font-bold bg-white border-2 border-slate-200 hover:bg-slate-50 opacity-50"
                >
                  鞋 (Xie)
                </button>
              </div>
            </div>
            
            <div className="mt-8 bg-teal-100 px-6 py-3 rounded-xl flex items-center space-x-3">
              <MessageSquare className="text-teal-700" />
              <p className="text-xl text-teal-800 font-bold">AI 不是在"思考"，它是在"猜"下一个字！</p>
            </div>
            <p className="mt-4 text-slate-400 text-base">那 AI 怎么用"眼睛"看东西呢？下一页揭秘 👉</p>
          </div>
        );

      case "pattern":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-5xl font-bold text-slate-800 mb-8">原理揭秘2：AI 怎么认出猫？</h2>
            
            <div className="flex space-x-8 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-lg border-4 border-orange-200">
                <div className="text-8xl mb-4">🐱</div>
                <div className="text-left space-y-2 text-lg text-slate-600 font-bold">
                  <p>✅ 尖耳朵</p>
                  <p>✅ 有胡须</p>
                  <p>✅ 长尾巴</p>
                </div>
              </div>
              
              <div className="flex flex-col justify-center">
                <ChevronRight size={48} className="text-slate-300" />
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border-4 border-red-200 relative overflow-hidden">
                <div className="text-8xl mb-4">🐯</div>
                <div className="text-left space-y-2 text-lg text-slate-600 font-bold">
                  <p>✅ 尖耳朵</p>
                  <p>✅ 有胡须</p>
                  <p className="text-red-500">❓ 有"王"字</p>
                  <p className="text-red-500">❓ 个头太大</p>
                </div>
                {tigerTestResult && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-white text-3xl font-bold backdrop-blur-sm animate-in fade-in">
                    {tigerTestResult === 'cat' ? "❌ 认错了！" : "✅ 不是猫！"}
                  </div>
                )}
              </div>
            </div>

            <div className="space-x-4">
              <p className="text-xl text-slate-600 mb-4">测试一下 AI：右边这只是猫吗？</p>
              <button onClick={() => setTigerTestResult('cat')} className="px-6 py-3 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200">是猫</button>
              <button onClick={() => setTigerTestResult('tiger')} className="px-6 py-3 bg-green-100 text-green-600 rounded-xl font-bold hover:bg-green-200">不是猫</button>
            </div>
          </div>
        );

      case "neural":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-4xl font-bold text-slate-800 mb-2">神经网络：谁大声听谁的！</h2>
            <p className="text-xl text-slate-500 mb-4">游戏：全班大声喊，用声音给 AI 投票！🎤</p>

            {/* 声波分贝仪 */}
            <div className="mb-4 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-600">🔊 分贝仪</span>
                <span className="text-sm font-bold text-slate-600">{Math.round(currentVolume)} dB</span>
              </div>
              {/* 分贝条 */}
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 ${currentVolume > 70 ? 'bg-red-500' : currentVolume > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${currentVolume}%` }}
                />
              </div>
              {/* 声波可视化 */}
              <div className="flex items-center justify-center space-x-1 h-12 mt-2">
                {[...Array(20)].map((_, i) => {
                  const barHeight = isListening
                    ? Math.max(4, Math.min(48, (currentVolume / 100) * 48 + Math.random() * 16))
                    : 4;
                  return (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-75 ${
                        isListening && currentVolume > 50 ? 'bg-blue-500' : 'bg-slate-300'
                      }`}
                      style={{ height: `${barHeight}px` }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex items-end justify-center space-x-16 h-72 mb-4">
              {/* Burger Team */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-32 flex justify-center items-end h-[300px]">
                  <div 
                    className="w-24 bg-orange-200 rounded-t-xl transition-all duration-100 ease-linear border-t-4 border-orange-400 relative overflow-hidden" 
                    style={{height: `${Math.min(300, burgerVotes)}px`}}
                  >
                    {isListening === 'burger' && (
                      <div className="absolute inset-0 bg-orange-300 animate-pulse opacity-50"></div>
                    )}
                  </div>
                  <span className="absolute bottom-4 z-10 text-6xl drop-shadow-md">🍔</span>
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  {isListening === 'burger' ? (
                    <button onClick={stopListening} className="px-4 py-2 bg-red-500 text-white rounded-full animate-pulse flex items-center space-x-2">
                      <Square size={16} fill="white" /> <span>停止</span>
                    </button>
                  ) : (
                    <button onClick={() => startListening('burger')} disabled={!!isListening} className="px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-30 flex items-center space-x-2">
                      <Mic size={16} /> <span>喊汉堡</span>
                    </button>
                  )}
                  
                  {/* Manual Controls Backup */}
                  <div className="flex items-center space-x-1 opacity-50 hover:opacity-100 transition-opacity">
                    <button onClick={() => setBurgerVotes(v => Math.max(10, v - 10))} className="w-6 h-6 bg-gray-200 rounded-full text-xs">-</button>
                    <button onClick={() => setBurgerVotes(v => Math.min(300, v + 10))} className="w-6 h-6 bg-gray-200 rounded-full text-xs">+</button>
                  </div>
                </div>
              </div>

              {/* VS Text */}
              <div className="pb-24 text-4xl font-black text-slate-300 italic">VS</div>

              {/* Pizza Team */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-32 flex justify-center items-end h-[300px]">
                  <div 
                    className="w-24 bg-yellow-200 rounded-t-xl transition-all duration-100 ease-linear border-t-4 border-yellow-400 relative overflow-hidden" 
                    style={{height: `${Math.min(300, pizzaVotes)}px`}}
                  >
                    {isListening === 'pizza' && (
                      <div className="absolute inset-0 bg-yellow-300 animate-pulse opacity-50"></div>
                    )}
                  </div>
                  <span className="absolute bottom-4 z-10 text-6xl drop-shadow-md">🍕</span>
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  {isListening === 'pizza' ? (
                    <button onClick={stopListening} className="px-4 py-2 bg-red-500 text-white rounded-full animate-pulse flex items-center space-x-2">
                      <Square size={16} fill="white" /> <span>停止</span>
                    </button>
                  ) : (
                    <button onClick={() => startListening('pizza')} disabled={!!isListening} className="px-4 py-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 disabled:opacity-30 flex items-center space-x-2">
                      <Mic size={16} /> <span>喊披萨</span>
                    </button>
                  )}

                  {/* Manual Controls Backup */}
                  <div className="flex items-center space-x-1 opacity-50 hover:opacity-100 transition-opacity">
                    <button onClick={() => setPizzaVotes(v => Math.max(10, v - 10))} className="w-6 h-6 bg-gray-200 rounded-full text-xs">-</button>
                    <button onClick={() => setPizzaVotes(v => Math.min(300, v + 10))} className="w-6 h-6 bg-gray-200 rounded-full text-xs">+</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-600 text-white px-8 py-4 rounded-full text-2xl font-bold shadow-lg transition-all duration-500">
              AI 最终决定：吃 {pizzaVotes > burgerVotes ? "🍕 披萨" : (pizzaVotes < burgerVotes ? "🍔 汉堡" : "🤔 声音一样大")}！
            </div>
          </div>
        );

      case "unplugged":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">小小训练师</h2>

            <div className="flex items-center justify-center space-x-8 mb-4">
              {/* Card to Classify */}
              <div className="w-40 h-52 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center border-4 border-slate-200">
                <span className="text-7xl">{trainingStep >= 3 ? '🐕' : '🐺'}</span>
                <span className="text-lg font-bold mt-3 text-slate-500">{trainingStep >= 3 ? '这次呢？' : '这是什么？'}</span>
              </div>

              {/* Robot Action */}
              <div className="flex flex-col space-y-3 min-w-[280px]">
                {trainingStep === 0 && (
                  <button
                    onClick={() => setTrainingStep(1)}
                    className="px-6 py-3 bg-blue-100 text-blue-700 rounded-xl text-lg font-bold hover:bg-blue-200"
                  >
                    机器人：我觉得是 🐶 狗！
                  </button>
                )}

                {trainingStep === 1 && (
                  <div className="animate-in zoom-in duration-300">
                    <div className="flex items-center space-x-3 mb-3">
                      <AlertTriangle className="text-red-500" size={32} />
                      <span className="text-xl font-bold text-red-500">裁判：错啦！</span>
                    </div>
                    <button
                      onClick={() => setTrainingStep(2)}
                      className="px-6 py-3 bg-green-500 text-white rounded-xl text-lg font-bold hover:bg-green-600 shadow-lg"
                    >
                      训练员：纠正它！这是狼！🐺
                    </button>
                  </div>
                )}

                {trainingStep === 2 && (
                  <div className="animate-in zoom-in duration-300">
                    <div className="bg-green-100 p-4 rounded-xl text-green-800 font-bold text-lg mb-3">
                      机器人：收到！尖耳朵+凶狠眼神=狼！✅
                    </div>
                    <button
                      onClick={() => setTrainingStep(3)}
                      className="px-6 py-3 bg-blue-100 text-blue-700 rounded-xl text-lg font-bold hover:bg-blue-200"
                    >
                      再来一张图片试试？👉
                    </button>
                  </div>
                )}

                {trainingStep === 3 && (
                  <div className="animate-in zoom-in duration-300">
                    <button
                      onClick={() => setTrainingStep(4)}
                      className="px-6 py-3 bg-green-100 text-green-700 rounded-xl text-lg font-bold hover:bg-green-200"
                    >
                      机器人：这次我认出来了，是 🐕 柴犬！
                    </button>
                  </div>
                )}

                {trainingStep === 4 && (
                  <div className="bg-green-100 p-4 rounded-xl text-green-800 font-bold text-lg animate-bounce">
                    🎉 训练越多，AI 越聪明！
                  </div>
                )}
              </div>
            </div>

            <p className="text-slate-500 text-base">这就是"监督学习"：AI 犯错 {'->'} 人类纠正 {'->'} AI 变聪明</p>
          </div>
        );

      case "summary_process":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-5xl font-bold text-slate-800 mb-12">总结：AI 变聪明的"三步走"</h2>
            
            <div className="flex items-center justify-center w-full max-w-6xl space-x-4">
              
              {/* Step 1: Training */}
              <div className={`flex flex-col items-center transition-all duration-700 ${processStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="w-48 h-48 bg-green-100 rounded-full flex flex-col items-center justify-center border-4 border-green-300 shadow-lg relative">
                  <span className="text-6xl">🍔</span>
                  <span className="text-sm font-bold text-green-700 mt-2">数据 (Data)</span>
                  <div className="absolute -top-4 -left-4 bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">1</div>
                </div>
                <h3 className="text-2xl font-bold text-slate-700 mt-6">模型训练</h3>
                <p className="text-slate-500">喂数据 (Feeding)</p>
              </div>

              {/* Arrow */}
              <div className={`transition-all duration-700 delay-300 ${processStep >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                <ArrowRight size={48} className="text-slate-300" />
              </div>

              {/* Step 2: Inference */}
              <div className={`flex flex-col items-center transition-all duration-700 delay-500 ${processStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="w-48 h-48 bg-blue-100 rounded-full flex flex-col items-center justify-center border-4 border-blue-300 shadow-lg relative">
                  <div className="flex space-x-2">
                     <Search size={40} className="text-blue-600" />
                     <Volume2 size={40} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-bold text-blue-700 mt-2">找规律+投票</span>
                  <div className="absolute -top-4 -left-4 bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">2</div>
                </div>
                <h3 className="text-2xl font-bold text-slate-700 mt-6">模型推理</h3>
                <p className="text-slate-500">信息识别与处理</p>
              </div>

              {/* Arrow */}
              <div className={`transition-all duration-700 delay-700 ${processStep >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                <ArrowRight size={48} className="text-slate-300" />
              </div>

              {/* Step 3: Tuning */}
              <div className={`flex flex-col items-center transition-all duration-700 delay-1000 ${processStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="w-48 h-48 bg-purple-100 rounded-full flex flex-col items-center justify-center border-4 border-purple-300 shadow-lg relative">
                  <Settings size={60} className="text-purple-600 animate-spin-slow" />
                  <span className="text-sm font-bold text-purple-700 mt-2">纠错 (Correction)</span>
                  <div className="absolute -top-4 -left-4 bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">3</div>
                </div>
                <h3 className="text-2xl font-bold text-slate-700 mt-6">模型调优</h3>
                <p className="text-slate-500">监督学习</p>
              </div>

            </div>
          </div>
        );

      case "drawing":
        return (
          <div className="flex flex-col items-center justify-center h-full">
             <div className="flex justify-between items-center w-full max-w-3xl mb-2">
               <h2 className="text-3xl font-bold text-slate-800">魔法时刻：你画我猜</h2>
               <div className="flex space-x-2">
                  <button onClick={clearCanvas} className="flex items-center space-x-1 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">
                    <Eraser size={16} /> <span>清除</span>
                  </button>
               </div>
             </div>
             
             <div className="relative">
               <canvas 
                 ref={canvasRef}
                 width={600}
                 height={320}
                 className="bg-white rounded-xl shadow-2xl border-4 border-blue-100 cursor-crosshair touch-none"
                 onMouseDown={startDrawing}
                 onMouseMove={draw}
                 onMouseUp={stopDrawing}
                 onMouseLeave={stopDrawing}
               />
               {!isDrawing && (
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-200 pointer-events-none flex flex-col items-center">
                   <Pencil size={48} />
                   <span>请在这里画画</span>
                 </div>
               )}
             </div>
             
             <div className="mt-6 flex flex-col items-center space-y-4">
               <div className="flex items-center space-x-4">
                 <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white animate-pulse">
                   <Search size={24} />
                 </div>
                 <div className="bg-white px-6 py-3 rounded-full shadow-md text-slate-700 font-bold">
                   AI 正在思考... (请老师切换到 Quick, Draw! 网站)
                 </div>
               </div>
               <a
                 href="https://quickdraw.withgoogle.com"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl hover:scale-105"
               >
                 <span>🎮</span>
                 <span>体验真正的 AI 画画游戏</span>
                 <ArrowRight size={18} />
               </a>
             </div>
          </div>
        );

      case "train_ai":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-12">
            <div className="mb-4 animate-bounce">
              <Sparkles size={50} className="text-purple-500" />
            </div>
            <h2 className="text-4xl font-black text-slate-800 mb-2">魔法时刻：训练自己的 AI</h2>
            <p className="text-xl text-slate-600 mb-6">你可以像训练小宠物一样，训练一个专属的 AI 模型！</p>

            <div className="bg-white p-6 rounded-2xl shadow-lg max-w-3xl mb-5 border-3 border-purple-100">
              <div className="grid grid-cols-3 gap-6 mb-5">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl">📸</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800">收集数据</h3>
                  <p className="text-xs text-slate-500 mt-1">拍摄多种角度的照片</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800">训练模型</h3>
                  <p className="text-xs text-slate-500 mt-1">AI 学习识别特征</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800">测试使用</h3>
                  <p className="text-xs text-slate-500 mt-1">看看 AI 学得怎么样</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl">
                <p className="text-sm text-slate-700 mb-2">💡 <span className="font-bold">你可以训练：</span></p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="bg-white px-3 py-1 rounded-full text-xs text-slate-600 shadow-sm">😊 表情识别</span>
                  <span className="bg-white px-3 py-1 rounded-full text-xs text-slate-600 shadow-sm">👋 姿势识别</span>
                  <span className="bg-white px-3 py-1 rounded-full text-xs text-slate-600 shadow-sm">🎵 声音分类</span>
                  <span className="bg-white px-3 py-1 rounded-full text-xs text-slate-600 shadow-sm">🖼️ 图像分类</span>
                </div>
              </div>
            </div>

            <a
              href="https://train.aimaker.space/train"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white rounded-full font-bold text-lg hover:from-purple-600 hover:via-pink-600 hover:to-red-600 transition-all shadow-xl hover:shadow-2xl hover:scale-105 animate-pulse"
            >
              <span>🪄</span>
              <span>开始训练你的 AI</span>
              <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </a>

            <p className="mt-3 text-slate-400 text-xs">类似于 Teachable Machine，但更适合中国小朋友使用</p>
          </div>
        );

      case "agents":
        const agentDetails = [
          "用摄像头拍下你的脸 → AI 比对数据库 → 确认身份开门",
          "听到你说的话 → 转成文字 → 理解意思 → 回答你",
          "记住你看过什么 → 找出相似内容 → 推荐给你",
          "摄像头拍下你运动 → AI 分析动作姿势 → 给出改进建议",
          "传感器监测温度湿度 → AI 判断是否需要浇水 → 自动灌溉",
          "听懂一种语言 → AI 转换 → 用另一种语言说出来",
        ];
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-4xl font-bold text-slate-800 mb-6">校园里的 AI 特工</h2>
            <p className="text-slate-500 mb-4">点击卡片看看它是怎么工作的 👆</p>
            <div className="grid grid-cols-3 gap-4 w-full max-w-5xl">
              {[
                { title: "刷脸进门", icon: <Camera size={40} />, desc: "人脸识别", color: "text-blue-500 bg-blue-50" },
                { title: "小爱/Siri", icon: <Mic size={40} />, desc: "语音识别", color: "text-green-500 bg-green-50" },
                { title: "猜你喜欢", icon: <Activity size={40} />, desc: "推荐算法", color: "text-pink-500 bg-pink-50" },
                { title: "AI 体育", icon: "🏃", desc: "动作分析", color: "text-orange-500 bg-orange-50", isTextIcon: true },
                { title: "AI 种菜", icon: "🌱", desc: "环境监测", color: "text-emerald-500 bg-emerald-50", isTextIcon: true },
                { title: "AI 翻译", icon: "🗣️", desc: "语言转换", color: "text-purple-500 bg-purple-50", isTextIcon: true },
              ].map((app, idx) => (
                <div
                  key={idx}
                  onClick={() => setExpandedAgent(expandedAgent === idx ? null : idx)}
                  className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-md hover:-translate-y-1 transition-all cursor-pointer"
                >
                  <div className={`p-3 rounded-full mb-2 ${app.color}`}>
                    {app.isTextIcon ? <span className="text-4xl">{app.icon}</span> : app.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{app.title}</h3>
                  <p className="text-sm text-slate-500">{app.desc}</p>
                  {expandedAgent === idx && (
                    <div className="mt-3 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-600 text-center animate-in zoom-in duration-200">
                      {agentDetails[idx]}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4 text-slate-400 text-base">AI 这么厉害，它会犯错吗？下一页告诉你真相 😱</p>
          </div>
        );

      case "hallucination":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-12">
            <div className="flex items-center space-x-4 mb-6">
              <AlertTriangle size={48} className="text-yellow-500" />
              <h2 className="text-5xl font-bold text-slate-800">AI 也会"胡说八道"</h2>
            </div>

            <p className="text-lg text-slate-500 mb-6">让我们来考考 AI，看看它会不会犯错 👇</p>

            {/* Interactive quiz - single card */}
            <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-purple-100 max-w-2xl w-full mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <MessageSquare size={24} className="text-purple-500" />
                <p className="text-slate-600 font-bold text-lg">问：世界上最大的动物是什么？</p>
              </div>
              {!hallucinationRevealed ? (
                <button
                  onClick={() => setHallucinationRevealed(true)}
                  className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl font-bold text-lg transition-all hover:scale-105 active:scale-95"
                >
                  🤖 看看 AI 怎么回答
                </button>
              ) : (
                <div className="space-y-3 animate-in fade-in duration-500">
                  <div className="flex items-start space-x-3 bg-red-50 p-4 rounded-2xl">
                    <Bot className="text-blue-500 mt-1 flex-shrink-0" />
                    <p className="text-lg font-bold text-red-500 text-left">AI：是鼠标！因为鼠标也有"鼠"字，而且它能控制电脑这个庞然大物！🐭</p>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-4xl">🤣</span>
                    <p className="text-sm text-slate-400">（正确答案：蓝鲸 🐳 —— AI 把"鼠"字搞混了！）</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-yellow-100 border-l-8 border-yellow-500 p-4 rounded-r-xl text-left max-w-2xl w-full mb-4">
              <h3 className="text-xl font-bold text-yellow-800 mb-1">为什么 AI 会胡说？</h3>
              <p className="text-base text-yellow-700">AI 没有真正的"常识"，它只是在<span className="font-bold">猜下一个字</span>。有时候猜得像模像样，但完全不对！所以写作业时，<span className="font-black underline">绝对不能全抄 AI！</span></p>
            </div>

            <p className="text-slate-400 text-base">那我们该怎样正确使用 AI 呢？看看这些小建议 👇</p>
          </div>
        );

      case "suggestions":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-5xl font-bold text-red-600 mb-8">💌 给小朋友的建议</h2>
            
            <div className="bg-white p-10 rounded-3xl shadow-xl max-w-4xl mb-8 text-left space-y-8 border-4 border-red-100">
              <div className="flex items-center space-x-6">
                <div className="bg-red-100 p-4 rounded-full flex-shrink-0"><Brain size={40} className="text-red-500"/></div>
                <div>
                  <h3 className="text-3xl font-bold text-slate-800 mb-1">1. 不代替思考</h3>
                  <p className="text-xl text-slate-500">可以用 AI 查资料，但不能让它代写作业。</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="bg-green-100 p-4 rounded-full flex-shrink-0"><ShieldCheck size={40} className="text-green-500"/></div>
                <div>
                  <h3 className="text-3xl font-bold text-slate-800 mb-1">2. 安全保护</h3>
                  <p className="text-xl text-slate-500">不在 AI 对话框输入自己的住址和隐私。</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="bg-blue-100 p-4 rounded-full flex-shrink-0"><Search size={40} className="text-blue-500"/></div>
                <div>
                  <h3 className="text-3xl font-bold text-slate-800 mb-1">3. 辨别真伪</h3>
                  <p className="text-xl text-slate-500">AI 有时也会说胡话，我们要有怀疑精神。</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "hierarchy":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-3xl font-bold text-slate-800 mb-1">拓展：AI 的参天大树</h2>
            <p className="text-base text-amber-600 mb-4">🌳 给学有余力的&ldquo;小科学家&rdquo;们 —— 一棵树，看懂 AI 的全貌</p>

            <div className="flex-1 flex items-center justify-center w-full max-w-3xl">
              <img
                src="https://pub-ae23ea8734be481ea425b35e20c16b40.r2.dev/pics/AI%E7%9A%84%E5%8F%82%E5%A4%A9%E5%A4%A7%E6%A0%91.png"
                alt="AI的参天大树"
                className="max-h-[65vh] w-auto object-contain rounded-2xl shadow-lg"
              />
            </div>

            <p className="text-slate-500 text-sm mt-4 max-w-2xl">
              树根是 AI 的&ldquo;大脑&rdquo;（各种大模型），树干是&ldquo;工具&rdquo;（帮 AI 连接世界），枝叶就是我们能用的各种应用。
              <br />
              <span className="text-blue-500">那么在咱们的校园里，AI 都藏在哪些地方呢？翻到下一页，一起去发现吧！👉</span>
            </p>
          </div>
        );

      case "end":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-6xl font-black text-blue-600 mb-8">未来属于你！</h2>
            <div className="flex justify-center items-center space-x-8 mb-12">
              <div className="text-9xl animate-bounce">🧒</div>
              <div className="text-6xl text-slate-300">🤝</div>
              <div className="text-9xl animate-bounce" style={{animationDelay: '0.2s'}}>🤖</div>
            </div>
            <p className="text-3xl font-bold text-slate-700 mb-8">好好学习，未来由你指挥这些"超级大脑"！</p>
            <div className="bg-white/80 backdrop-blur px-8 py-4 rounded-full shadow-lg">
              <p className="text-xl text-blue-500 font-mono">Mission Complete 🌟</p>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className={`w-full h-[680px] ${slides[currentSlide].bgColor} transition-colors duration-700 relative overflow-hidden font-sans select-none rounded-xl border border-slate-200 shadow-2xl`}>
      <div className="w-full h-full p-8">
        {renderContent(slides[currentSlide])}
      </div>

      {/* Navigation */}
      <div className="absolute bottom-6 right-6 flex space-x-4 z-20">
        <button onClick={prevSlide} disabled={currentSlide === 0} className="p-4 rounded-full bg-white/70 hover:bg-white text-slate-700 disabled:opacity-30 transition-all shadow-lg backdrop-blur-md">
          <ChevronLeft size={32} />
        </button>
        <div className="flex items-center px-6 bg-white/70 backdrop-blur-md rounded-full text-slate-700 font-bold text-xl shadow-lg">
          {currentSlide + 1} / {slides.length}
        </div>
        <button onClick={nextSlide} disabled={currentSlide === slides.length - 1} className="p-4 rounded-full bg-white hover:bg-white text-slate-700 disabled:opacity-30 transition-all shadow-lg backdrop-blur-md">
          <ChevronRight size={32} />
        </button>
      </div>
    </div>
  );
};

export default SlideDeck;