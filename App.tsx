
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GamePhase, GameState, CharacterClass, Item, LogEntry, Location, LootItem, Rarity, Pet, SpecialInteraction } from './types';
import { CLASSES, ITEMS, LOCATIONS, RARITY_COLORS, PETS, SHOP_ITEMS } from './constants';
import { getInitialScenario, processOutcome } from './services/geminiService';
import { 
  ChevronRight, 
  Shield, 
  Sword, 
  Map as MapIcon, 
  Dices, 
  ArrowLeft, 
  Sparkles,
  Loader2,
  Save,
  Download,
  Zap,
  Package,
  Heart,
  Trophy,
  Coins,
  Store,
  ShoppingCart,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  Sparkle
} from 'lucide-react';

// --- Sound Utilities ---
const playSound = (type: 'dice' | 'success' | 'failure' | 'gold' | 'click' | 'equip' | 'loot') => {
  const sounds = {
    dice: 'https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3', 
    success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
    failure: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
    gold: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    equip: 'https://assets.mixkit.co/active_storage/sfx/1120/1120-preview.mp3',
    loot: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3'
  };
  const audio = new Audio(sounds[type]);
  audio.volume = 0.3;
  audio.play().catch(() => {}); 
};

// --- Components ---

const KarmaIndicator: React.FC<{ karma: number }> = ({ karma }) => {
  const isGood = karma > 20;
  const isEvil = karma < -20;
  
  return (
    <div className="space-y-2 group">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
        <div className={`flex items-center gap-1 transition-colors ${isEvil ? 'text-red-500' : 'opacity-30'}`}>
          <Zap className="w-3 h-3" /> 악성
        </div>
        <span className="font-cinzel text-sm group-hover:scale-110 transition-transform">{karma > 0 ? '+' : ''}{Math.floor(karma)}</span>
        <div className={`flex items-center gap-1 transition-colors ${isGood ? 'text-blue-500' : 'opacity-30'}`}>
          <Sparkles className="w-3 h-3" /> 선성
        </div>
      </div>
      <div className="h-2 w-full bg-black/5 rounded-full relative overflow-hidden shadow-inner">
        <div className="absolute h-full transition-all duration-1000 ease-out bg-gradient-to-r from-red-500 via-gray-400 to-blue-500" style={{ width: '100%', opacity: 0.1 }}></div>
        <div 
          className={`absolute h-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.2)] ${karma >= 0 ? 'bg-blue-500 left-1/2' : 'bg-red-500 right-1/2'}`}
          style={{ width: `${Math.abs(karma) / 2}%` }}
        ></div>
        <div className="absolute left-1/2 top-0 w-0.5 h-full bg-black/20 -translate-x-1/2"></div>
      </div>
    </div>
  );
};

const Header: React.FC<{ onSave: () => void; onLoad: () => void; phase: GamePhase }> = ({ onSave, onLoad, phase }) => {
  return (
    <header className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3 group cursor-default">
          <div className="w-6 h-6 md:w-8 md:h-8 bg-black flex items-center justify-center rotate-45 group-hover:rotate-[225deg] transition-transform duration-700">
            <span className="text-white font-cinzel text-sm md:text-lg -rotate-45 group-hover:-rotate-[225deg] transition-transform duration-700">E</span>
          </div>
          <h1 className="font-cinzel font-black tracking-[0.2em] md:tracking-[0.4em] text-lg md:text-2xl">ETHEREAL INK</h1>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <button onClick={onSave} className="flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
            <Save className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">저장</span>
          </button>
          <button onClick={onLoad} className="flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
            <Download className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">불러오기</span>
          </button>
        </div>
      </div>
    </header>
  );
};

const DiceAnimation: React.FC<{ result: number, success: boolean }> = ({ result, success }) => {
  const [displayValue, setDisplayValue] = useState(1);
  const [isFinal, setIsFinal] = useState(false);

  useEffect(() => {
    playSound('dice');
    let count = 0;
    const interval = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 20) + 1);
      count++;
      if (count > 25) { 
        clearInterval(interval);
        setDisplayValue(result);
        setIsFinal(true);
        playSound(success ? 'success' : 'failure');
      }
    }, 70);
    return () => clearInterval(interval);
  }, [result, success]);

  return (
    <div className="fixed inset-0 z-[110] bg-black/90 flex flex-col items-center justify-center animate-in fade-in duration-300">
       <div className={`w-32 h-32 md:w-48 md:h-48 bg-white border-4 rounded-2xl flex items-center justify-center transition-all duration-500 transform shadow-[0_0_80px_rgba(255,255,255,0.2)] ${isFinal ? (success ? 'border-green-500 scale-110' : 'border-red-500 scale-110') : 'border-black animate-bounce'}`}>
         <span className={`font-cinzel text-6xl md:text-8xl font-bold ${isFinal ? (success ? 'text-green-600' : 'text-red-600') : 'text-black'}`}>{displayValue}</span>
       </div>
       {isFinal && (
         <div className="mt-8 md:mt-12 text-white font-cinzel text-2xl md:text-4xl tracking-[0.5em] uppercase animate-in slide-in-from-bottom-4">
           {success ? 'SUCCESS' : 'FAILURE'}
         </div>
       )}
    </div>
  );
};

const LootRewardPopup: React.FC<{ loot: LootItem, onClose: () => void }> = ({ loot, onClose }) => {
  const rColor = RARITY_COLORS[loot.rarity] || '#000000';
  useEffect(() => { playSound('loot'); }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="bg-white p-1 rounded-sm shadow-2xl animate-in zoom-in-95 duration-500" style={{ backgroundColor: rColor, boxShadow: `0 0 100px ${rColor}44` }}>
        <div className="bg-white p-6 md:p-10 max-w-sm text-center rounded-sm">
          <Trophy className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-6 animate-float" style={{ color: rColor }} />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 mb-2">새로운 보물 획득</p>
          <h3 className="font-cinzel text-2xl md:text-3xl font-bold mb-4 tracking-tighter">{loot.name}</h3>
          
          <div className="flex justify-center gap-4 mb-6">
            <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 text-white rounded-full" style={{ backgroundColor: rColor }}>{loot.rarity}</span>
            <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 border border-black/10 rounded-full">{loot.type}</span>
          </div>

          <p className="text-sm italic font-serif opacity-60 mb-8 leading-relaxed">"{loot.description}"</p>
          
          <div className="grid grid-cols-3 gap-2 mb-8 border-t border-black/5 pt-6">
             {['strength', 'intelligence', 'dexterity'].map((s: any) => {
               const val = (loot.statBonuses as any)[s];
               if (!val) return null;
               return (
                 <div key={s} className="bg-black/5 p-2 rounded">
                    <p className="text-[7px] font-black uppercase opacity-40">{s.slice(0,3)}</p>
                    <p className="font-cinzel text-sm font-bold">+{Math.floor(val)}</p>
                 </div>
               );
             })}
          </div>

          <button onClick={() => { playSound('click'); onClose(); }} className="w-full py-4 bg-black text-white font-cinzel text-xs tracking-widest hover:bg-gold-bg transition-all rounded-sm active:scale-95">가방에 넣기</button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.CLASS_SELECT);
  const [gameState, setGameState] = useState<GameState>({
    characterClass: null, selectedItems: [], pet: null, inventory: [], 
    equipped: {}, location: null, history: [], hp: 20, maxHp: 20, karma: 0, gold: 100 
  });

  const [currentScenario, setCurrentScenario] = useState<{ narrative: string, actions: any[], specialInteraction?: SpecialInteraction } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [rollInfo, setRollInfo] = useState<any>(null);
  const [showDiceOverlay, setShowDiceOverlay] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [lootReward, setLootReward] = useState<LootItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [gameState.history, loading]);

  const saveGame = () => {
    localStorage.setItem('ethereal_ink_save', JSON.stringify({ phase, gameState, currentScenario }));
    alert('Progress saved to the ethereal scrolls.');
  };

  const loadGame = () => {
    const saved = localStorage.getItem('ethereal_ink_save');
    if (saved) {
      const data = JSON.parse(saved);
      setPhase(data.phase);
      setGameState(data.gameState);
      setCurrentScenario(data.currentScenario);
    }
  };

  const calculateTotalStat = useCallback((statName: 'strength' | 'intelligence' | 'dexterity') => {
    if (!gameState.characterClass) return 0;
    let base = (gameState.characterClass.stats as any)[statName] || 0;
    if (gameState.pet?.bonus?.stat === statName) base += gameState.pet.bonus.value;
    (Object.values(gameState.equipped) as (LootItem | undefined)[]).forEach(item => {
      if (item?.statBonuses) base += (item.statBonuses as any)[statName] || 0;
    });
    return Math.floor(base);
  }, [gameState.characterClass, gameState.pet, gameState.equipped]);

  const toggleEquip = (item: LootItem) => {
    const isEquipped = gameState.equipped[item.type]?.id === item.id;
    if (isEquipped) {
      playSound('click');
      setGameState(prev => {
        const newEquipped = { ...prev.equipped };
        delete newEquipped[item.type];
        return { ...prev, equipped: newEquipped };
      });
    } else {
      playSound('equip');
      setGameState(prev => ({
        ...prev,
        equipped: { ...prev.equipped, [item.type]: item }
      }));
    }
  };

  const handleAction = async (action: any) => {
    setIsRolling(true);
    const d20 = Math.floor(Math.random() * 20) + 1;
    const bonus = Math.floor((calculateTotalStat(action.statRequired as any) - 10) / 2);
    const total = d20 + bonus;
    const success = total >= action.difficulty;

    setRollInfo({ total, success });
    setShowDiceOverlay(true);

    setGameState(prev => ({
      ...prev,
      history: [...prev.history, { type: 'choice', text: `선택: ${action.label}`, timestamp: Date.now() }]
    }));

    setTimeout(async () => {
      setShowDiceOverlay(false);
      setLoading(true);
      try {
        const next = await processOutcome(gameState, action.label, total, success, currentScenario!.narrative);
        if (next.loot) {
          const newItem = { ...next.loot, id: Math.random().toString(36).substr(2, 9) };
          setLootReward(newItem);
          setGameState(prev => ({ ...prev, inventory: [...prev.inventory, newItem] }));
        }
        setCurrentScenario(next);
        setGameState(prev => ({
          ...prev,
          gold: Math.floor(prev.gold + (next.goldReward || 0)),
          karma: Math.floor(prev.karma + (next.karmaDelta || 0)),
          history: [...prev.history, { type: 'narrative', text: next.narrative, timestamp: Date.now(), success }]
        }));
      } catch (e) { console.error(e); } finally { setLoading(false); setIsRolling(false); }
    }, 3000);
  };

  const buyItem = (item: LootItem) => {
    if (gameState.gold >= (item.price || 0)) {
      playSound('gold');
      const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
      setGameState(prev => ({
        ...prev,
        gold: prev.gold - (item.price || 0),
        inventory: [...prev.inventory, newItem]
      }));
      alert(`${item.name}을(를) 구매했습니다!`);
    } else {
      playSound('failure');
      alert('골드가 부족합니다.');
    }
  };

  // --- Detailed Render Functions ---

  const renderClassSelect = () => (
    <div className="max-w-6xl mx-auto py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h2 className="font-cinzel text-3xl md:text-5xl mb-4 text-center tracking-widest px-4">직업 선택</h2>
      <p className="text-center text-black/40 mb-10 md:mb-16 uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs font-bold px-4">당신을 부르는 고대의 원형을 선택하십시오</p>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 px-4">
        {CLASSES.map(cls => (
          <button
            key={cls.id}
            onClick={() => { playSound('click'); setGameState(p => ({ ...p, characterClass: cls })); setPhase(GamePhase.PET_SELECT); }}
            className="group relative flex flex-col items-center p-6 md:p-10 border border-black/5 hover:border-black transition-all duration-500 hover:shadow-2xl bg-white active:scale-95 rounded-sm overflow-hidden"
          >
            <span className="text-4xl md:text-7xl mb-4 md:mb-8 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500 transform">{cls.icon}</span>
            <h3 className="font-cinzel text-sm md:text-2xl mb-2 md:mb-4 tracking-widest group-hover:text-gold-bg transition-colors">{cls.name}</h3>
            <p className="hidden md:block text-sm text-black/50 text-center leading-relaxed mb-8 h-16">{cls.description}</p>
            <div className="flex justify-between w-full text-[9px] md:text-[11px] tracking-widest font-bold uppercase pt-4 md:pt-6 border-t border-black/5 relative z-10">
              {['strength', 'intelligence', 'dexterity'].map((s: any) => (
                <div key={s} className="flex flex-col items-center">
                  <span className="opacity-40">{s === 'strength' ? '힘' : s === 'intelligence' ? '지능' : '민첩'}</span>
                  <span className="text-sm md:text-xl font-cinzel">{(cls.stats as any)[s] || 0}</span>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderPetSelect = () => (
    <div className="max-w-6xl mx-auto py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h2 className="font-cinzel text-3xl md:text-5xl mb-4 text-center tracking-widest px-4">신비한 동료</h2>
      <p className="text-center text-black/40 mb-10 md:mb-16 uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs font-bold px-4">당신의 여정을 함께할 영물을 선택하십시오</p>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 px-4">
        {PETS.map(pet => (
          <button
            key={pet.id}
            onClick={() => { playSound('click'); setGameState(p => ({ ...p, pet })); setPhase(GamePhase.ITEM_SELECT); }}
            className="group relative flex flex-col items-center p-6 md:p-8 border border-black/5 hover:border-black transition-all duration-500 hover:shadow-xl bg-white active:scale-95 rounded-sm"
          >
            <span className="text-4xl md:text-7xl mb-4 md:mb-6 grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-125">{pet.icon}</span>
            <h3 className="font-cinzel text-base md:text-xl mb-1 md:mb-2 tracking-widest">{pet.name}</h3>
            <p className="hidden md:block text-xs text-black/40 text-center mb-6 h-12 leading-relaxed">{pet.description}</p>
            <div className="mt-auto w-full pt-4 border-t border-black/5 text-[8px] md:text-[10px] font-black tracking-widest uppercase text-gold-bg text-center">{pet.effectDescription}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderItemSelect = () => (
    <div className="max-w-6xl mx-auto py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h2 className="font-cinzel text-3xl md:text-5xl mb-4 text-center tracking-widest px-4">초기 장비</h2>
      <p className="text-center text-black/40 mb-10 md:mb-16 uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs font-bold px-4">미지의 세계로 가져갈 세 가지 유물을 선택하십시오</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10 md:mb-16 px-4">
        {ITEMS.map(item => {
          const isSelected = gameState.selectedItems.find(i => i.id === item.id);
          return (
            <button
              key={item.id}
              onClick={() => {
                playSound('click');
                setGameState(prev => {
                  const already = prev.selectedItems.find(i => i.id === item.id);
                  if (already) return { ...prev, selectedItems: prev.selectedItems.filter(i => i.id !== item.id) };
                  if (prev.selectedItems.length < 3) return { ...prev, selectedItems: [...prev.selectedItems, item] };
                  return prev;
                });
              }}
              className={`p-4 md:p-6 border text-left transition-all duration-300 relative rounded-sm ${isSelected ? 'border-black bg-black text-white shadow-xl scale-105' : 'border-black/5 bg-white hover:border-black/20 hover:scale-[1.02]'}`}
            >
              <h3 className="font-cinzel text-base md:text-lg mb-1 md:mb-2 tracking-widest">{item.name}</h3>
              <p className={`text-[10px] md:text-xs leading-relaxed ${isSelected ? 'text-white/60' : 'text-black/40'}`}>{item.description}</p>
              {isSelected && <Sparkles className="absolute top-4 right-4 w-3 h-3 md:w-4 md:h-4 text-gold-bg animate-pulse" />}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col items-center px-4">
        <p className="text-[10px] font-black tracking-widest uppercase mb-6 opacity-30">선택됨: {gameState.selectedItems.length} / 3</p>
        <button
          disabled={gameState.selectedItems.length === 0}
          onClick={() => { playSound('click'); setPhase(GamePhase.WORLD_MAP); }}
          className="w-full md:w-auto px-12 md:px-16 py-4 bg-black text-white font-cinzel text-base md:text-lg tracking-[0.2em] md:tracking-[0.3em] hover:bg-gold-bg hover:scale-105 active:scale-95 transition-all disabled:opacity-20 shadow-2xl rounded-sm"
        >
          운명에 몸을 맡기다
        </button>
      </div>
    </div>
  );

  const renderWorldMap = () => (
    <div className="max-w-7xl mx-auto py-8 md:py-12 animate-in fade-in duration-1000 px-4">
      <h2 className="font-cinzel text-3xl md:text-5xl mb-4 text-center tracking-widest">세계 지도</h2>
      <p className="text-center text-black/40 mb-10 md:mb-16 uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs font-bold">여정의 시작점을 선택하십시오</p>
      <div className="relative aspect-square md:aspect-[21/9] bg-white border-2 border-black/10 shadow-2xl overflow-hidden rounded-sm p-4 group">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] bg-repeat"></div>
        {LOCATIONS.map(loc => (
          <div key={loc.id} className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center group/marker z-10" style={{ left: `${loc.x}%`, top: `${loc.y}%` }}>
            <button
              onClick={async () => {
                playSound('click');
                setLoading(true);
                try {
                  const scene = await getInitialScenario(gameState.characterClass!, gameState.selectedItems, loc.name, 0);
                  setCurrentScenario(scene);
                  setGameState(p => ({ ...p, location: loc.name, history: [{ type: 'narrative', text: scene.narrative, timestamp: Date.now() }] }));
                  setPhase(GamePhase.ADVENTURE);
                } catch (e) { console.error(e); } finally { setLoading(false); }
              }}
              className="relative w-8 h-8 md:w-12 md:h-12 flex items-center justify-center focus:outline-none"
            >
              <div className="absolute w-full h-full bg-black/5 rounded-full animate-ping opacity-20"></div>
              <div className="w-4 h-4 md:w-6 md:h-6 bg-black rotate-45 group-hover/marker:scale-125 group-hover/marker:bg-gold-bg transition-all duration-300 shadow-xl border-2 border-white"></div>
            </button>
            <div className="w-40 md:w-64 bg-white/95 backdrop-blur-md border border-black/10 p-2 md:p-4 shadow-2xl opacity-0 group-hover/marker:opacity-100 transition-all pointer-events-none -translate-x-2 group-hover/marker:translate-x-4 border-l-4 border-l-gold-bg hidden md:block">
              <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                <span className="text-xl md:text-2xl">{loc.icon}</span>
                <h3 className="font-cinzel text-xs md:text-base font-bold tracking-widest">{loc.name}</h3>
              </div>
              <p className="text-[9px] md:text-[11px] text-black/60 italic leading-relaxed">{loc.description}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <Loader2 className="w-8 h-8 md:w-12 md:h-12 animate-spin mb-4 gold-text" />
            <p className="font-cinzel text-sm md:text-xl tracking-widest uppercase px-4 text-center">운명의 서사시를 여는 중...</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAdventure = () => (
    <div className="max-w-7xl mx-auto py-4 md:py-8 h-auto lg:h-[80vh] flex flex-col lg:flex-row gap-4 md:gap-8 overflow-y-auto lg:overflow-hidden animate-in fade-in duration-700 px-4">
      {/* Narrative Panel */}
      <div className="flex-1 min-h-[50vh] md:min-h-[60vh] lg:min-h-0 bg-white border border-black/5 shadow-2xl rounded-sm flex flex-col overflow-hidden relative">
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-gold-bg to-transparent shrink-0"></div>
        <div ref={scrollRef} className="flex-1 p-6 md:p-10 overflow-y-auto space-y-6 md:space-y-8 scroll-smooth">
          {gameState.history.map((log, i) => (
            <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              {log.type === 'choice' ? (
                <div className="flex justify-end my-4"><div className="bg-black text-white px-4 md:px-6 py-2 rounded-full font-cinzel text-[10px] md:text-xs tracking-widest border border-gold-bg/30">{log.text}</div></div>
              ) : (
                <p className={`text-base md:text-xl leading-relaxed font-serif ${log.success === false ? 'opacity-40 line-through' : 'opacity-90'}`}>{log.text}</p>
              )}
            </div>
          ))}
          {loading && <div className="flex items-center gap-3 text-black/20 italic text-[10px] md:text-xs uppercase tracking-widest"><Loader2 className="w-3 h-3 animate-spin" /> 서사시를 기록하는 중...</div>}
        </div>
        <div className="p-4 md:p-8 lg:p-10 border-t border-black/5 bg-[#fafafa] shrink-0">
          <div className="grid grid-cols-1 gap-3 md:gap-4">
            {currentScenario?.actions.map((act, i) => (
              <button
                key={i}
                disabled={loading || isRolling}
                onClick={() => handleAction(act)}
                className="group flex justify-between items-center p-4 md:p-5 border border-black/10 bg-white hover:border-black transition-all active:scale-[0.99] rounded-sm shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-4 md:gap-6">
                  <span className="text-[8px] md:text-[10px] font-black opacity-10 group-hover:opacity-100 transition-opacity uppercase tracking-widest">#0{i+1}</span>
                  <span className="font-cinzel text-xs md:text-base font-bold tracking-widest text-left">{act.label}</span>
                </div>
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                  <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest opacity-20 group-hover:opacity-100 transition-opacity">{act.statRequired} DC {act.difficulty}</span>
                  <ChevronRight className="w-3 h-3 md:w-4 md:h-4 opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Sidebar */}
      <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-4 md:gap-6 shrink-0 pb-20 lg:pb-0">
        <div className="p-6 md:p-8 bg-white border border-black/5 shadow-xl rounded-sm space-y-6 md:space-y-8">
          <div className="flex items-center gap-4 md:gap-6 group">
            <div className="text-4xl md:text-6xl animate-float transform group-hover:-rotate-12 transition-transform">{gameState.characterClass?.icon}</div>
            <div>
              <h3 className="font-cinzel text-lg md:text-2xl font-bold tracking-widest">{gameState.characterClass?.name}</h3>
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-30">방랑자 Level 1</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['strength', 'intelligence', 'dexterity'].map((s: any) => {
              const val = calculateTotalStat(s);
              const bonus = Math.floor((val - 10) / 2);
              return (
                <div key={s} className="bg-black/5 p-2 md:p-3 text-center rounded-sm group hover:bg-gold-bg/5 transition-colors">
                  <p className="text-[7px] md:text-[8px] font-black uppercase opacity-40 mb-1">{s === 'strength' ? '힘' : s === 'intelligence' ? '지능' : '민첩'}</p>
                  <p className="font-cinzel text-lg md:text-xl font-bold">{val}</p>
                  <p className="text-[8px] md:text-[9px] font-bold text-gold-bg">({bonus >= 0 ? '+' : ''}{bonus})</p>
                </div>
              );
            })}
          </div>
          <div className="space-y-4 md:space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-2 text-red-500"><Heart className="w-3 h-3 fill-current" /> Vitality</div>
                <span>{Math.floor(gameState.hp)} / {Math.floor(gameState.maxHp)}</span>
              </div>
              <div className="h-1.5 md:h-2 bg-black/5 rounded-full overflow-hidden border border-black/5 p-0.5">
                <div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-1000 rounded-full" style={{ width: `${(gameState.hp/gameState.maxHp)*100}%` }}></div>
              </div>
            </div>
            <KarmaIndicator karma={gameState.karma} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <button onClick={() => { playSound('click'); setShowInventory(true); }} className="flex flex-col items-center gap-2 md:gap-3 p-4 md:p-6 bg-white border border-black/5 hover:border-black transition-all shadow-lg rounded-sm active:scale-95 group">
            <Package className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">인벤토리</span>
          </button>
          <button onClick={() => { playSound('click'); setShowShop(true); }} className="flex flex-col items-center gap-2 md:gap-3 p-4 md:p-6 bg-white border border-black/5 hover:border-black transition-all shadow-lg rounded-sm active:scale-95 group">
            <Store className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">상점</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderInventoryOverlay = () => (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl h-[90vh] md:h-[85vh] flex flex-col rounded-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
        <div className="p-4 md:p-8 border-b border-black/5 flex justify-between items-center bg-[#fafafa]">
          <h3 className="font-cinzel text-xl md:text-2xl font-bold tracking-widest uppercase">장비와 유물</h3>
          <button onClick={() => setShowInventory(false)} className="text-[10px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity p-2">닫기 (ESC)</button>
        </div>
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Equipped Slots */}
          <div className="w-full md:w-1/3 p-4 md:p-10 bg-black/[0.02] border-r border-black/5 space-y-4 md:space-y-8 overflow-y-auto shrink-0">
            <h4 className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] opacity-30 border-b pb-2">장착 중</h4>
            {['무기', '방어구', '장신구'].map((type: any) => {
              const item = (gameState.equipped as any)[type];
              return (
                <div key={type} onClick={() => item && toggleEquip(item)} className={`p-3 md:p-5 border flex items-center justify-between rounded-sm transition-all shadow-sm group cursor-pointer ${item ? 'bg-white border-black/10 hover:border-black/30' : 'bg-black/[0.01] border-black/5 border-dashed'}`}>
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-8 h-8 md:w-12 md:h-12 border border-black/5 flex items-center justify-center bg-white rounded-sm shadow-sm">
                       {type === '무기' ? <Sword className={`w-3 h-3 md:w-5 md:h-5 ${item ? 'text-black' : 'opacity-10'}`} /> : type === '방어구' ? <Shield className={`w-3 h-3 md:w-5 md:h-5 ${item ? 'text-black' : 'opacity-10'}`} /> : <Zap className={`w-3 h-3 md:w-5 md:h-5 ${item ? 'text-black' : 'opacity-10'}`} />}
                    </div>
                    <div>
                      <p className="text-[7px] md:text-[8px] font-bold opacity-30 uppercase">{type}</p>
                      <p className={`font-cinzel text-[10px] md:text-sm font-bold tracking-widest ${item ? 'text-black' : 'text-black/20'}`}>{item?.name || '비어 있음'}</p>
                    </div>
                  </div>
                  {item && <span className="text-[7px] md:text-[8px] font-black uppercase text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">해제</span>}
                </div>
              );
            })}
          </div>
          {/* Right: Bag Items */}
          <div className="flex-1 p-4 md:p-10 overflow-y-auto bg-white">
            <h4 className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] opacity-30 border-b pb-2 mb-4 md:mb-6">가방 목록</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {gameState.inventory.length === 0 && <p className="text-[10px] md:text-xs text-black/20 italic text-center py-10">가방이 비어 있습니다.</p>}
              {gameState.inventory.map(item => {
                const isEquipped = gameState.equipped[item.type]?.id === item.id;
                const rColor = RARITY_COLORS[item.rarity];
                return (
                  <div 
                    key={item.id} 
                    onClick={() => toggleEquip(item)} 
                    style={{ borderLeft: `4px solid ${rColor}` }} 
                    className={`p-3 md:p-4 border transition-all rounded-sm cursor-pointer hover:shadow-lg relative group ${isEquipped ? 'bg-black/5 border-black shadow-md' : 'bg-white border-black/5'}`}
                  >
                    <div className="flex justify-between items-start mb-1 md:mb-2">
                      <span className="text-[7px] md:text-[8px] font-black uppercase px-2 py-0.5 text-white rounded-sm" style={{ backgroundColor: rColor }}>{item.rarity}</span>
                      {isEquipped && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                    </div>
                    <h5 className="font-cinzel text-xs md:text-sm font-bold tracking-widest">{item.name}</h5>
                    <p className="text-[9px] md:text-[10px] opacity-50 italic mb-2 md:mb-3">"{item.description}"</p>
                    <div className="flex gap-2 text-[7px] md:text-[8px] font-bold uppercase text-black/40">
                      {item.statBonuses.strength && <span className="text-red-600">STR +{Math.floor(item.statBonuses.strength)}</span>}
                      {item.statBonuses.intelligence && <span className="text-blue-600">INT +{Math.floor(item.statBonuses.intelligence)}</span>}
                      {item.statBonuses.dexterity && <span className="text-green-600">DEX +{Math.floor(item.statBonuses.dexterity)}</span>}
                    </div>
                    <div className="absolute bottom-2 md:bottom-4 right-2 md:right-4 opacity-0 group-hover:opacity-100 transition-opacity text-[7px] md:text-[8px] font-black uppercase text-gold-bg flex items-center gap-1">
                      {isEquipped ? '해제하려면 클릭' : <><Sparkle className="w-2 h-2" /> 장착하려면 클릭</>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderShopOverlay = () => (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl h-[85vh] md:h-[70vh] flex flex-col rounded-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
        <div className="p-4 md:p-8 border-b border-black/5 flex flex-col md:flex-row md:items-center justify-between bg-[#fafafa] gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <Store className="w-5 h-5 md:w-6 md:h-6" />
            <h3 className="font-cinzel text-xl md:text-2xl font-bold tracking-widest uppercase">에테르 상점</h3>
          </div>
          <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8">
            <div className="flex items-center gap-2 text-gold-bg">
              <Coins className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-cinzel text-lg md:text-xl font-bold">{Math.floor(gameState.gold)}</span>
            </div>
            <button onClick={() => setShowShop(false)} className="text-[10px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity p-2">닫기 (ESC)</button>
          </div>
        </div>
        <div className="flex-1 p-4 md:p-10 overflow-y-auto bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {SHOP_ITEMS.map(item => {
              const rColor = RARITY_COLORS[item.rarity];
              const canAfford = gameState.gold >= (item.price || 0);
              return (
                <div key={item.id} className="p-4 md:p-6 border border-black/5 rounded-sm hover:border-black/20 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex justify-between items-start mb-3 md:mb-4">
                      <span className="text-[7px] md:text-[8px] font-black uppercase px-2 py-0.5 text-white rounded-sm" style={{ backgroundColor: rColor }}>{item.rarity}</span>
                      <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest opacity-40">{item.type}</span>
                    </div>
                    <h5 className="font-cinzel text-base md:text-lg font-bold tracking-widest mb-1 md:mb-2 group-hover:text-gold-bg transition-colors">{item.name}</h5>
                    <p className="text-[10px] md:text-xs opacity-50 italic mb-3 md:mb-4">"{item.description}"</p>
                    <div className="flex gap-3 md:gap-4 text-[8px] md:text-[9px] font-bold uppercase mb-4 md:mb-6">
                      {item.statBonuses.strength && <span className="text-red-600">STR +{Math.floor(item.statBonuses.strength)}</span>}
                      {item.statBonuses.intelligence && <span className="text-blue-600">INT +{Math.floor(item.statBonuses.intelligence)}</span>}
                      {item.statBonuses.dexterity && <span className="text-green-600">DEX +{Math.floor(item.statBonuses.dexterity)}</span>}
                    </div>
                  </div>
                  <button 
                    onClick={() => buyItem(item)}
                    disabled={!canAfford}
                    className={`w-full py-2 md:py-3 flex items-center justify-center gap-2 md:gap-3 font-cinzel text-[10px] md:text-xs tracking-widest transition-all rounded-sm ${canAfford ? 'bg-black text-white hover:bg-gold-bg' : 'bg-black/5 text-black/20 cursor-not-allowed'}`}
                  >
                    <ShoppingCart className="w-3 h-3" />
                    구매하기 ({item.price} G)
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f6f2] pb-10 md:pb-20 overflow-x-hidden selection:bg-black selection:text-white">
      <Header onSave={saveGame} onLoad={loadGame} phase={phase} />
      <main className="max-w-7xl mx-auto">
        {phase === GamePhase.CLASS_SELECT && renderClassSelect()}
        {phase === GamePhase.PET_SELECT && renderPetSelect()}
        {phase === GamePhase.ITEM_SELECT && renderItemSelect()}
        {phase === GamePhase.WORLD_MAP && renderWorldMap()}
        {phase === GamePhase.ADVENTURE && renderAdventure()}
      </main>

      {/* Global Overlays */}
      {showInventory && renderInventoryOverlay()}
      {showShop && renderShopOverlay()}
      {lootReward && <LootRewardPopup loot={lootReward} onClose={() => setLootReward(null)} />}
      {showDiceOverlay && <DiceAnimation result={rollInfo.total} success={rollInfo.success} />}

      {/* Status Bar */}
      {phase >= GamePhase.WORLD_MAP && (
        <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-black/5 px-4 md:px-8 py-2 md:py-3 flex justify-between items-center z-[100] text-[7px] md:text-[9px] tracking-[0.1em] md:tracking-[0.2em] font-black uppercase shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="flex gap-4 md:gap-12">
            <div className="flex items-center gap-2 md:gap-3 shrink-0"><span className="opacity-30 hidden sm:inline">직업</span><span className="font-cinzel text-[10px] md:text-xs text-gold-bg tracking-widest truncate max-w-[80px] md:max-w-none">{gameState.characterClass?.name}</span></div>
            <div className="flex items-center gap-2 md:gap-3 group shrink-0"><Coins className="w-3 h-3 text-gold-bg" /><span className="font-cinzel text-[10px] md:text-xs text-gold-bg tracking-widest">{Math.floor(gameState.gold)} G</span></div>
          </div>
          <div className="flex gap-4 md:gap-12 items-center">
            <div className="flex items-center gap-2 md:gap-3 shrink-0"><Heart className="w-3 h-3 text-red-500 fill-current animate-pulse" /><span className="font-cinzel text-[10px] md:text-xs">{Math.floor(gameState.hp)} / {Math.floor(gameState.maxHp)}</span></div>
            <div className="flex items-center gap-2 md:gap-3 shrink-0"><Zap className="w-3 h-3 text-blue-500" /><span className="font-cinzel text-[10px] md:text-xs">{gameState.karma > 0 ? '+' : ''}{Math.floor(gameState.karma)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
