
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
  Video,
  Loader2,
  Upload,
  Save,
  Download,
  Zap,
  Package,
  Heart,
  Trophy,
  Coins,
  Store,
  ShoppingCart,
  Volume2,
  Info,
  CircleAlert,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  XCircle,
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
  audio.volume = 0.4;
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
          <CircleAlert className="w-3 h-3" /> 악성
        </div>
        <span className="font-cinzel text-sm group-hover:scale-110 transition-transform">{karma > 0 ? '+' : ''}{karma}</span>
        <div className={`flex items-center gap-1 transition-colors ${isGood ? 'text-blue-500' : 'opacity-30'}`}>
          <Sparkles className="w-3 h-3" /> 선성
        </div>
      </div>
      <div className="h-2 w-full bg-black/5 rounded-full relative overflow-hidden shadow-inner">
        <div 
          className="absolute h-full transition-all duration-1000 ease-out bg-gradient-to-r from-red-500 via-gray-400 to-blue-500"
          style={{ width: '100%', opacity: 0.1 }}
        ></div>
        <div 
          className={`absolute h-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.2)] ${karma >= 0 ? 'bg-blue-500 left-1/2' : 'bg-red-500 right-1/2'}`}
          style={{ width: `${Math.abs(karma) / 2}%` }}
        ></div>
        <div className="absolute left-1/2 top-0 w-0.5 h-full bg-black/20 -translate-x-1/2"></div>
      </div>
    </div>
  );
};

const Header: React.FC<{ onSave?: () => void, onLoad?: () => void, phase: GamePhase }> = ({ onSave, onLoad, phase }) => (
  <header className="py-4 px-8 flex justify-between items-center border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
    <div className="flex items-center gap-3 group cursor-default">
      <div className="w-8 h-8 bg-black flex items-center justify-center rotate-45 group-hover:rotate-[225deg] transition-transform duration-700">
        <span className="text-white font-cinzel text-lg -rotate-45 group-hover:-rotate-[225deg] transition-transform duration-700">E</span>
      </div>
      <h1 className="font-cinzel text-xl tracking-widest font-bold">ETHEREAL INK</h1>
    </div>
    <div className="flex gap-4 items-center">
      {phase >= GamePhase.WORLD_MAP && (
        <div className="flex gap-2">
          <button onClick={() => { playSound('click'); onSave?.(); }} className="p-2 hover:bg-black hover:text-white transition-all border border-black/5 rounded flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest active:scale-95">
            <Save className="w-3 h-3" /> 저장
          </button>
          <button onClick={() => { playSound('click'); onLoad?.(); }} className="p-2 hover:bg-black hover:text-white transition-all border border-black/5 rounded flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest active:scale-95">
            <Download className="w-3 h-3" /> 로드
          </button>
        </div>
      )}
    </div>
  </header>
);

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative flex flex-col items-center">
        <div 
          className={`w-48 h-48 flex items-center justify-center border-4 rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.6)] bg-white transition-all duration-500 transform ${
            isFinal ? (success ? 'border-green-500 scale-110 rotate-0' : 'border-red-500 scale-110 rotate-0') : 'border-gold-bg animate-bounce rotate-12'
          }`}
          style={{
            backgroundColor: isFinal ? (success ? '#ecfdf5' : '#fef2f2') : 'white'
          }}
        >
          <span className={`text-8xl font-cinzel font-bold transition-colors duration-500 ${
            isFinal ? (success ? 'text-green-600' : 'text-red-600') : 'text-black/10'
          }`}>
            {displayValue}
          </span>
        </div>
        
        {isFinal && (
          <div className="mt-10 flex flex-col items-center animate-in slide-in-from-bottom-6 duration-500">
            <div className={`px-16 py-4 border-4 font-cinzel text-4xl tracking-[0.5em] font-bold uppercase shadow-2xl transition-all ${
              success ? 'border-green-500 text-green-600 bg-white' : 'border-red-500 text-red-600 bg-white'
            }`}>
              {success ? 'SUCCESS' : 'FAILURE'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const LootRewardPopup: React.FC<{ loot: LootItem, onClose: () => void }> = ({ loot, onClose }) => {
  const rarityColor = RARITY_COLORS[loot.rarity] || '#000000';
  
  useEffect(() => {
    playSound('loot');
  }, []);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div 
        className="relative bg-white p-1 rounded-sm animate-in zoom-in-95 duration-500 transform shadow-2xl"
        style={{ 
          backgroundColor: rarityColor,
          boxShadow: `0 0 80px ${rarityColor}44` 
        }}
      >
        <div className="bg-white p-10 max-w-sm w-full rounded-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rotate-45 opacity-5" style={{ backgroundColor: rarityColor }}></div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-8 relative" style={{ backgroundColor: `${rarityColor}15` }}>
               <Trophy className="w-12 h-12 animate-float" style={{ color: rarityColor }} />
               <Sparkle className="absolute top-0 right-0 w-6 h-6 animate-pulse" style={{ color: rarityColor }} />
            </div>
            
            <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40 mb-2">New Loot Found</p>
            <h3 className="font-cinzel text-4xl font-bold mb-4 tracking-tighter">{loot.name}</h3>
            
            <div className="flex gap-3 mb-8">
              <span className="text-[10px] font-black uppercase px-4 py-1.5 text-white rounded-full shadow-lg transition-transform hover:scale-110 cursor-default" style={{ backgroundColor: rarityColor }}>{loot.rarity}</span>
              <span className="text-[10px] font-black uppercase px-4 py-1.5 border border-black/10 rounded-full bg-black/5">{loot.type}</span>
            </div>

            <div className="p-6 bg-black/[0.02] rounded-lg mb-10 border border-black/5 w-full">
              <p className="text-sm text-black/70 italic leading-relaxed font-serif">
                "{loot.description}"
              </p>
            </div>
            
            <div className="w-full grid grid-cols-3 gap-4 mb-12 pb-8 border-b border-black/5">
               {['strength', 'intelligence', 'dexterity'].map((stat) => {
                 const val = (loot.statBonuses as any)[stat];
                 if (!val) return null;
                 return (
                   <div key={stat} className="flex flex-col items-center p-2 rounded bg-black/[0.03]">
                      <span className="text-[8px] font-black uppercase opacity-40 mb-1">{stat.slice(0, 3)}</span>
                      <span className="text-sm font-cinzel font-bold" style={{ color: rarityColor }}>+{Math.floor(val)}</span>
                   </div>
                 );
               })}
            </div>

            <button 
              onClick={() => { playSound('click'); onClose(); }}
              className="group relative w-full py-5 bg-black text-white font-cinzel text-sm tracking-[0.4em] hover:bg-gold-bg transition-all active:scale-95 shadow-2xl rounded-sm overflow-hidden"
            >
              <span className="relative z-10">ADD TO COLLECTION</span>
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.CLASS_SELECT);
  const [gameState, setGameState] = useState<GameState>({
    characterClass: null,
    selectedItems: [],
    pet: null,
    inventory: [],
    equipped: {},
    location: null,
    history: [],
    hp: 20,
    maxHp: 20,
    karma: 0,
    gold: 50 
  });

  const [currentScenario, setCurrentScenario] = useState<{ narrative: string, actions: any[], specialInteraction?: SpecialInteraction } | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [rollInfo, setRollInfo] = useState<{ roll: number, bonus: number, total: number, difficulty: number, success: boolean } | null>(null);
  const [showDiceOverlay, setShowDiceOverlay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [lootReward, setLootReward] = useState<LootItem | null>(null);
  const [quizInput, setQuizInput] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameState.history, loading]);

  const saveGame = () => {
    localStorage.setItem('ethereal_ink_save_v7', JSON.stringify({ phase, gameState, currentScenario }));
    alert('Progress saved to the ethereal scrolls.');
  };

  const loadGame = () => {
    const saved = localStorage.getItem('ethereal_ink_save_v7');
    if (saved) {
      const data = JSON.parse(saved);
      setPhase(data.phase);
      setGameState(data.gameState);
      setCurrentScenario(data.currentScenario);
    }
  };

  const handleClassSelect = (cls: CharacterClass) => {
    playSound('click');
    setGameState(prev => ({ ...prev, characterClass: cls }));
    setPhase(GamePhase.PET_SELECT);
  };

  const handlePetSelect = (pet: Pet) => {
    playSound('click');
    setGameState(prev => {
      let newMaxHp = prev.maxHp;
      let newHp = prev.hp;
      if (pet.id === 'dragon') {
        newMaxHp += 10;
        newHp += 10;
      }
      return { ...prev, pet, maxHp: newMaxHp, hp: newHp };
    });
    setPhase(GamePhase.ITEM_SELECT);
  };

  const toggleItem = (item: Item) => {
    playSound('click');
    setGameState(prev => {
      const isSelected = prev.selectedItems.find(i => i.id === item.id);
      if (isSelected) return { ...prev, selectedItems: prev.selectedItems.filter(i => i.id !== item.id) };
      if (prev.selectedItems.length < 3) return { ...prev, selectedItems: [...prev.selectedItems, item] };
      return prev;
    });
  };

  const handleLocationSelect = async (loc: Location) => {
    playSound('click');
    setLoading(true);
    setGameState(prev => ({ ...prev, location: loc.name }));
    try {
      const scenario = await getInitialScenario(gameState.characterClass!, gameState.selectedItems, loc.name, gameState.karma);
      setCurrentScenario(scenario);
      setPhase(GamePhase.ADVENTURE);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const calculateTotalStat = useCallback((statName: 'strength' | 'intelligence' | 'dexterity') => {
    if (!gameState.characterClass || !gameState.characterClass.stats) return 0;
    let base = (gameState.characterClass.stats as any)[statName] || 0;
    if (gameState.pet?.bonus?.stat === statName) base += gameState.pet.bonus.value;
    Object.values(gameState.equipped).forEach(item => {
      const loot = item as (LootItem | undefined);
      if (loot && loot.statBonuses) {
        const bonus = (loot.statBonuses as any)[statName];
        if (typeof bonus === 'number') base += bonus;
      }
    });
    return Math.floor(base);
  }, [gameState.characterClass, gameState.pet, gameState.equipped]);

  const handleAction = async (action: any) => {
    setIsRolling(true);
    const d20 = Math.floor(Math.random() * 20) + 1;
    const statName = action.statRequired as 'strength' | 'intelligence' | 'dexterity';
    const totalStat = calculateTotalStat(statName);
    const bonus = Math.floor((totalStat - 10) / 2);
    const total = d20 + bonus;
    const success = total >= action.difficulty;

    setRollInfo({ roll: d20, bonus, total, difficulty: action.difficulty, success });
    setShowDiceOverlay(true);

    setGameState(prev => ({
      ...prev,
      history: [...prev.history, { type: 'choice', text: `나의 선택: "${action.label}"`, timestamp: Date.now() }]
    }));

    setTimeout(async () => {
      setShowDiceOverlay(false);
      setLoading(true);
      try {
        const next = await processOutcome(gameState, action.label, total, success, currentScenario!.narrative);
        setCurrentScenario(next);
        setQuizInput("");
        
        if (next.loot) {
          const lootItem: LootItem = { ...next.loot, id: Math.random().toString(36).substr(2, 9) };
          setLootReward(lootItem);
          setGameState(prev => ({ ...prev, inventory: [...prev.inventory, lootItem] }));
        }

        if (next.goldReward > 0) playSound('gold');

        setGameState(prev => ({
          ...prev,
          karma: Math.max(-100, Math.min(100, prev.karma + (next.karmaDelta || 0))),
          gold: prev.gold + (next.goldReward || 0),
          history: [...prev.history, { 
            type: 'outcome', 
            text: next.narrative + (next.goldReward ? ` (+${next.goldReward} Gold 획득)` : ""), 
            timestamp: Date.now(), 
            success 
          }]
        }));
      } catch (err) { console.error(err); } finally {
        setLoading(false);
        setIsRolling(false);
        setRollInfo(null);
      }
    }, 3200);
  };

  const handleQuizSubmit = async () => {
    if (!currentScenario?.specialInteraction?.answer) return;
    const isCorrect = quizInput.trim().toLowerCase() === currentScenario.specialInteraction.answer.trim().toLowerCase();
    
    setLoading(true);
    try {
      const next = await processOutcome(gameState, `수수께끼 답 제출: ${quizInput}`, 20, isCorrect, currentScenario.narrative);
      setCurrentScenario(next);
      setQuizInput("");
      
      setGameState(prev => ({
        ...prev,
        gold: prev.gold + (isCorrect ? 50 : 0),
        history: [
          ...prev.history, 
          { type: 'choice', text: `수수께끼 답안 제출: "${quizInput}"`, timestamp: Date.now() },
          { type: 'outcome', text: isCorrect ? "정답입니다! 통찰력으로 위기를 모면했습니다." : "틀렸습니다. 수수께끼를 풀지 못해 운명에 맡깁니다.", timestamp: Date.now(), success: isCorrect }
        ]
      }));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const buyItem = (item: LootItem) => {
    if (gameState.gold >= (item.price || 0)) {
      playSound('gold');
      setGameState(prev => ({
        ...prev,
        gold: prev.gold - (item.price || 0),
        inventory: [...prev.inventory, { ...item, id: Math.random().toString(36).substr(2, 9) }]
      }));
    }
  };

  const toggleEquip = (item: LootItem) => {
    const isEquipped = gameState.equipped[item.type]?.id === item.id;
    if (isEquipped) {
      unequipItem(item.type);
    } else {
      equipItem(item);
    }
  };

  const equipItem = (item: LootItem) => {
    playSound('equip');
    setGameState(prev => ({
      ...prev,
      equipped: { ...prev.equipped, [item.type]: item }
    }));
  };

  const unequipItem = (type: keyof typeof gameState.equipped) => {
    playSound('click');
    setGameState(prev => {
      const newEquipped = { ...prev.equipped };
      delete newEquipped[type];
      return { ...prev, equipped: newEquipped };
    });
  };

  // --- Render Sections ---

  const renderClassSelect = () => (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h2 className="font-cinzel text-5xl mb-4 text-center tracking-widest">직업 선택</h2>
      <p className="text-center text-black/40 mb-16 uppercase tracking-[0.3em] text-xs font-bold font-inter">Choose your path among the ancient archetypes</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {CLASSES.map(cls => (
          <button
            key={cls.id}
            onClick={() => handleClassSelect(cls)}
            className="group relative flex flex-col items-center p-10 border border-black/5 hover:border-black transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] bg-white active:scale-95 rounded-sm overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
            <span className="text-7xl mb-8 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500 transform">{cls.icon}</span>
            <h3 className="font-cinzel text-2xl mb-4 group-hover:gold-text transition-colors tracking-widest">{cls.name}</h3>
            <p className="text-sm text-black/50 text-center leading-relaxed mb-8 h-16">{cls.description}</p>
            <div className="flex justify-between w-full text-[11px] tracking-widest font-bold uppercase pt-6 border-t border-black/5 relative z-10">
              {['strength', 'intelligence', 'dexterity'].map((s: any) => (
                <div key={s} className="flex flex-col items-center">
                  <span className="opacity-40">{s === 'strength' ? '힘' : s === 'intelligence' ? '지능' : '민첩'}</span>
                  <span className="text-xl font-cinzel">{(cls.stats as any)[s] || 0}</span>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderPetSelect = () => (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h2 className="font-cinzel text-5xl mb-4 text-center tracking-widest">신비한 동료</h2>
      <p className="text-center text-black/40 mb-16 uppercase tracking-[0.3em] text-xs font-bold">Select a mystical beast to accompany your journey</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {PETS.map(pet => (
          <button
            key={pet.id}
            onClick={() => handlePetSelect(pet)}
            className="group relative flex flex-col items-center p-8 border border-black/5 hover:border-black transition-all duration-500 hover:shadow-xl bg-white active:scale-95 rounded-sm"
          >
            <span className="text-7xl mb-6 grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-125">{pet.icon}</span>
            <h3 className="font-cinzel text-xl mb-2 tracking-widest">{pet.name}</h3>
            <p className="text-xs text-black/40 text-center mb-6 h-12 leading-relaxed">{pet.description}</p>
            <div className="mt-auto w-full pt-4 border-t border-black/5">
               <p className="text-[10px] font-black tracking-widest uppercase text-gold-bg text-center">{pet.effectDescription}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderItemSelect = () => (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h2 className="font-cinzel text-5xl mb-4 text-center tracking-widest">초기 장비</h2>
      <p className="text-center text-black/40 mb-16 uppercase tracking-[0.3em] text-xs font-bold">Choose three relics to carry into the unknown</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {ITEMS.map(item => {
          const isSelected = gameState.selectedItems.find(i => i.id === item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleItem(item)}
              className={`p-6 border text-left transition-all duration-300 relative rounded-sm ${isSelected ? 'border-black bg-black text-white shadow-xl scale-105' : 'border-black/5 bg-white hover:border-black/20 hover:scale-[1.02]'}`}
            >
              <h3 className="font-cinzel text-lg mb-2 tracking-widest">{item.name}</h3>
              <p className={`text-xs leading-relaxed ${isSelected ? 'text-white/60' : 'text-black/40'}`}>{item.description}</p>
              {isSelected && <Sparkles className="absolute top-4 right-4 w-4 h-4 text-gold-bg animate-pulse" />}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col items-center">
        <p className="text-[10px] font-black tracking-widest uppercase mb-6 opacity-30">선택됨: {gameState.selectedItems.length} / 3</p>
        <button
          disabled={gameState.selectedItems.length === 0}
          onClick={() => { playSound('click'); setPhase(GamePhase.WORLD_MAP); }}
          className="px-16 py-4 bg-black text-white font-cinzel text-lg tracking-[0.3em] hover:bg-gold-bg hover:scale-105 active:scale-95 transition-all disabled:opacity-20 shadow-2xl rounded-sm"
        >
          운명에 몸을 맡기다
        </button>
      </div>
    </div>
  );

  const renderWorldMap = () => (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-in fade-in duration-700">
      <h2 className="font-cinzel text-5xl mb-4 text-center tracking-widest">세계 지도</h2>
      <p className="text-center text-black/40 mb-16 uppercase tracking-[0.3em] text-xs font-bold">Choose your point of arrival on the ancient map</p>
      <div className="relative aspect-[21/9] bg-white border border-black/10 shadow-2xl overflow-hidden rounded-sm group p-4 border-2">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] bg-repeat"></div>
        {LOCATIONS.map(loc => (
          <div
            key={loc.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-0 transition-all duration-500 z-10 hover:z-20"
            style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
          >
            <button
              onClick={() => handleLocationSelect(loc)}
              className="relative w-12 h-12 flex items-center justify-center group/marker focus:outline-none"
            >
              <div className="absolute w-full h-full bg-black/5 rounded-full animate-ping opacity-20"></div>
              <div className="w-6 h-6 bg-black rotate-45 group-hover/marker:scale-125 group-hover/marker:bg-gold-bg transition-all duration-300 shadow-xl border-2 border-white"></div>
            </button>
            <div className="w-72 bg-white/95 backdrop-blur-md border border-black/10 p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] opacity-0 group-hover:opacity-100 transition-all pointer-events-none border-l-4 border-l-gold-bg -translate-x-2 group-hover:translate-x-2">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl drop-shadow-sm">{loc.icon}</span>
                <h3 className="font-cinzel text-base font-bold tracking-widest text-black">{loc.name}</h3>
              </div>
              <p className="text-[11px] text-black/60 leading-relaxed font-serif italic border-t border-black/5 pt-2 mt-1">{loc.description}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <Loader2 className="w-12 h-12 animate-spin mb-4 gold-text" />
            <p className="font-cinzel text-xl tracking-widest text-black uppercase">운명의 서사시를 여는 중...</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAdventure = () => (
    <div className="max-w-7xl mx-auto py-8 px-6 h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-8 overflow-hidden">
      {/* Narrative Panel */}
      <div className="flex-1 flex flex-col h-full bg-white border border-black/5 shadow-2xl relative rounded-sm overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-gold-bg to-transparent"></div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-12 scroll-smooth">
          {gameState.history.length === 0 && currentScenario && (
            <div className="animate-in fade-in duration-1000">
              <p className="text-xl leading-relaxed font-serif text-black/80 first-letter:text-6xl first-letter:float-left first-letter:mr-4 first-letter:font-cinzel first-letter:gold-text">
                {currentScenario.narrative}
              </p>
            </div>
          )}
          {gameState.history.map((log, i) => (
            <div key={i} className={`animate-in fade-in slide-in-from-bottom-4 duration-700`}>
              {log.type === 'choice' ? (
                <div className="flex justify-end my-4 animate-in slide-in-from-right-4">
                  <div className="bg-black text-white px-6 py-3 rounded-full font-cinzel text-sm shadow-lg border border-gold-bg/30">
                    {log.text}
                  </div>
                </div>
              ) : (
                <p className={`text-lg leading-relaxed font-serif ${log.success === false ? 'text-black/50 line-through decoration-red-400/30' : 'text-black/90'}`}>
                  {log.text}
                </p>
              )}
            </div>
          ))}
          {loading && (
             <div className="flex items-center gap-4 text-black/20 italic">
               <div className="w-4 h-4 border-2 border-black/10 border-t-black/40 rounded-full animate-spin"></div>
               <span className="text-xs uppercase tracking-[0.2em]">운명의 서사시가 서술되는 중...</span>
             </div>
          )}
        </div>

        {/* Interaction Panel */}
        <div className="p-10 border-t border-black/5 bg-[#fafafa]">
          {currentScenario?.specialInteraction ? (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              {currentScenario.specialInteraction.type === 'dialogue' ? (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-6 bg-white border-l-4 border-gold-bg shadow-sm rounded-r-lg">
                    <MessageSquare className="w-6 h-6 text-gold-bg flex-shrink-0 animate-pulse" />
                    <div>
                      <h4 className="font-cinzel text-sm font-bold text-gold-bg mb-1 uppercase tracking-widest">{currentScenario.specialInteraction.npcName}</h4>
                      <p className="text-[10px] text-black/40 mb-3 italic">({currentScenario.specialInteraction.npcPersonality})</p>
                      <p className="text-lg font-serif italic text-black/80 leading-relaxed">"{currentScenario.specialInteraction.npcDialogue}"</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {currentScenario.actions.map((action, idx) => (
                      <button
                        key={idx}
                        disabled={loading || isRolling}
                        onClick={() => handleAction(action)}
                        className="group flex items-center justify-between p-4 border border-black/5 bg-white hover:border-black transition-all text-left shadow-sm active:scale-[0.99] rounded-sm"
                      >
                        <div className="flex items-center gap-4">
                           <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gold-bg/10 text-[10px] font-bold group-hover:bg-gold-bg group-hover:text-white transition-colors">{idx + 1}</span>
                           <span className="font-cinzel text-sm font-bold tracking-widest">{action.label}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-black/20 group-hover:text-black transition-colors">{action.statRequired} DC {action.difficulty}</span>
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-6 bg-black text-white border-l-4 border-gold-bg shadow-lg rounded-r-lg">
                    <HelpCircle className="w-6 h-6 text-gold-bg flex-shrink-0 animate-bounce" />
                    <div>
                      <h4 className="font-cinzel text-xs font-bold text-gold-bg mb-2 uppercase tracking-widest">수수께끼</h4>
                      <p className="text-lg font-serif leading-relaxed">{currentScenario.specialInteraction.question}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      value={quizInput}
                      onChange={(e) => setQuizInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && quizInput && handleQuizSubmit()}
                      placeholder="답안을 입력하십시오..."
                      className="flex-1 p-4 border border-black/10 font-cinzel text-sm focus:outline-none focus:border-black shadow-inner rounded-sm"
                    />
                    <button 
                      onClick={handleQuizSubmit}
                      disabled={!quizInput || loading}
                      className="px-8 bg-black text-white font-cinzel text-sm hover:bg-gold-bg transition-all disabled:opacity-20 active:scale-95 rounded-sm"
                    >
                      제출
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {currentScenario?.actions.map((action, idx) => (
                <button
                  key={idx}
                  disabled={loading || isRolling}
                  onClick={() => handleAction(action)}
                  className="group flex items-center justify-between p-5 border border-black/5 bg-white hover:border-black hover:shadow-lg transition-all text-left disabled:opacity-30 active:scale-[0.99] rounded-sm shadow-sm"
                >
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] uppercase font-black tracking-[0.3em] opacity-20 group-hover:opacity-100 transition-opacity">#{idx + 1}</span>
                    <span className="font-cinzel text-base font-bold tracking-widest">{action.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-black/20 group-hover:text-black transition-colors">{action.statRequired} DC {action.difficulty}</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Panel */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        <div className="p-8 bg-white border border-black/5 shadow-xl space-y-6 rounded-sm">
          <div className="flex items-center gap-6 group">
            <div className="text-6xl transform group-hover:-rotate-12 transition-transform drop-shadow-sm animate-float">{gameState.characterClass?.icon}</div>
            <div className="flex flex-col">
              <h3 className="font-cinzel text-2xl font-bold tracking-widest">{gameState.characterClass?.name}</h3>
              <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Level 1 Wanderer</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['strength', 'intelligence', 'dexterity'].map((s: any) => {
              const total = calculateTotalStat(s);
              const bonus = Math.floor((total - 10) / 2);
              const isPetStat = gameState.pet?.bonus?.stat === s;
              return (
                <div key={s} className={`p-3 text-center border transition-all duration-500 rounded-sm ${isPetStat ? 'border-gold-bg bg-gold-bg/5 scale-105 shadow-sm' : 'bg-black/5 border-transparent hover:border-black/10'}`}>
                  <p className="text-[9px] uppercase font-bold opacity-40 mb-1">{s === 'strength' ? '힘' : s === 'intelligence' ? '지능' : '민첩'}</p>
                  <p className="font-cinzel text-xl font-bold">{Math.floor(total)}</p>
                  <p className="text-[9px] font-bold text-gold-text">({bonus >= 0 ? '+' : ''}{Math.floor(bonus)})</p>
                </div>
              );
            })}
          </div>

          <div className="space-y-6 pt-4 border-t border-black/5">
             <div className="space-y-3">
               <div className="flex justify-between items-center px-1">
                 <div className="flex items-center gap-2 text-red-500">
                    <Heart className="w-4 h-4 fill-current animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest font-inter">Vitality</span>
                 </div>
                 <span className="font-cinzel text-xl font-bold">{gameState.hp} / {gameState.maxHp}</span>
               </div>
               <div className="h-3 w-full bg-black/5 rounded-full overflow-hidden border border-black/5 p-0.5 shadow-inner">
                 <div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-1000 rounded-full shadow-[0_0_10px_rgba(220,0,0,0.3)]" style={{ width: `${(gameState.hp/gameState.maxHp)*100}%` }}></div>
               </div>
             </div>
             
             <KarmaIndicator karma={gameState.karma} />

             {gameState.pet && (
               <div className="bg-black/5 p-4 rounded-sm border border-black/5 flex items-center gap-4 animate-in slide-in-from-right-4 group hover:bg-black/10 transition-colors">
                  <div className="text-4xl group-hover:scale-125 transition-transform">{gameState.pet.icon}</div>
                  <div className="flex flex-col">
                    <h4 className="font-cinzel text-sm font-bold tracking-widest">{gameState.pet.name}</h4>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gold-text font-inter">{gameState.pet.effectDescription}</p>
                  </div>
               </div>
             )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => { playSound('click'); setShowInventory(true); }}
            className="p-5 bg-white border border-black/5 hover:border-black transition-all flex flex-col items-center gap-3 group shadow-lg rounded-sm active:scale-95"
          >
            <Package className="w-6 h-6 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black tracking-widest uppercase font-inter">인벤토리</span>
          </button>
          <button 
            onClick={() => { playSound('click'); setShowShop(true); }}
            className="p-5 bg-white border border-black/5 hover:border-black transition-all flex flex-col items-center gap-3 group shadow-lg rounded-sm active:scale-95"
          >
            <Store className="w-6 h-6 group-hover:scale-110 group-hover:-rotate-12 transition-transform" />
            <span className="text-[10px] font-black tracking-widest uppercase font-inter">상점</span>
          </button>
        </div>
      </div>

      {/* Overlays */}
      {showShop && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl rounded-sm overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-black/5 flex justify-between items-center bg-black text-white">
                <div className="flex items-center gap-4">
                  <Store className="w-6 h-6 text-gold-bg animate-pulse" />
                  <h3 className="font-cinzel text-2xl font-bold tracking-widest uppercase">에테르 상점</h3>
                </div>
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3 px-6 py-2 border border-white/20 rounded-full bg-white/5 shadow-inner">
                    <Coins className="w-4 h-4 text-gold-bg" />
                    <span className="font-cinzel text-2xl text-gold-bg">{gameState.gold}</span>
                  </div>
                  <button onClick={() => { playSound('click'); setShowShop(false); }} className="text-white/40 hover:text-white transition-colors uppercase font-bold text-[10px] tracking-widest">나가기</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-12 grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#fdfdfd]">
                {SHOP_ITEMS.map(item => (
                  <div key={item.id} className="p-6 border border-black/5 bg-white hover:border-black transition-all flex justify-between group shadow-sm hover:scale-[1.02] rounded-sm">
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 text-white" style={{ backgroundColor: RARITY_COLORS[item.rarity] }}>{item.rarity}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border border-black/10">{item.type}</span>
                      </div>
                      <h4 className="font-cinzel text-lg font-bold tracking-widest">{item.name}</h4>
                      <p className="text-xs text-black/50 italic font-serif">"{item.description}"</p>
                      <div className="flex gap-4 text-[9px] font-bold uppercase text-black/60 pt-2 font-inter">
                         {item.statBonuses?.strength && <span className="text-red-500">STR +{Math.floor(item.statBonuses.strength)}</span>}
                         {item.statBonuses?.intelligence && <span className="text-blue-500">INT +{Math.floor(item.statBonuses.intelligence)}</span>}
                         {item.statBonuses?.dexterity && <span className="text-green-500">DEX +{Math.floor(item.statBonuses.dexterity)}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                       <div className="flex items-center gap-2 bg-black/5 px-3 py-1 rounded-sm border border-black/5 shadow-inner">
                          <Coins className="w-3 h-3 text-gold-bg" />
                          <span className="font-cinzel text-lg font-bold">{Math.floor(item.price || 0)}</span>
                       </div>
                       <button 
                        onClick={() => buyItem(item)}
                        disabled={gameState.gold < (item.price || 0)}
                        className="flex items-center gap-2 px-6 py-2 bg-black text-white text-[10px] font-black tracking-widest uppercase hover:bg-gold-bg transition-all disabled:opacity-20 active:scale-95 shadow-md rounded-sm font-inter"
                       >
                         <ShoppingCart className="w-3 h-3" /> 구매
                       </button>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>
      )}

      {showInventory && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl rounded-sm animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-8 border-b border-black/5 flex justify-between items-center bg-[#fafafa]">
              <h3 className="font-cinzel text-2xl font-bold tracking-widest uppercase">장비와 유물</h3>
              <button onClick={() => { playSound('click'); setShowInventory(false); }} className="text-black/30 hover:text-black transition-colors uppercase font-bold text-[10px] tracking-widest">닫기 (ESC)</button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-0">
              {/* Left Column: Currently Equipped */}
              <div className="w-full md:w-1/3 p-10 bg-black/[0.02] border-r border-black/5 space-y-8 overflow-y-auto">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-black/40 border-b border-black/5 pb-2">장착 중</h4>
                <div className="space-y-4">
                  {['무기', '방어구', '장신구'].map((type: any) => {
                    const item = (gameState.equipped as any)[type];
                    return (
                      <div key={type} className={`p-5 border flex items-center justify-between rounded-sm transition-all shadow-sm group ${item ? 'bg-white border-black/10 hover:border-black/30' : 'bg-black/[0.01] border-black/5 border-dashed'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 border flex items-center justify-center rounded-sm shadow-sm transition-transform group-hover:scale-105 ${item ? 'bg-white border-black/5' : 'bg-transparent border-black/5'}`}>
                             {type === '무기' ? <Sword className={`w-5 h-5 ${item ? 'text-black' : 'opacity-10'}`} /> : type === '방어구' ? <Shield className={`w-5 h-5 ${item ? 'text-black' : 'opacity-10'}`} /> : <Zap className={`w-5 h-5 ${item ? 'text-black' : 'opacity-10'}`} />}
                          </div>
                          <div>
                            <p className="text-[9px] uppercase font-bold opacity-30">{type}</p>
                            <p className={`font-cinzel text-sm font-bold tracking-widest ${item ? 'text-black' : 'text-black/20'}`}>{item?.name || '비어 있음'}</p>
                          </div>
                        </div>
                        {item && (
                          <button 
                            onClick={() => unequipItem(type)} 
                            className="text-[9px] font-bold uppercase text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            해제
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Right Column: Inventory Items */}
              <div className="flex-1 p-10 space-y-8 overflow-y-auto bg-white">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-black/40 border-b border-black/5 pb-2">가방 목록</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gameState.inventory.length === 0 && <p className="text-xs text-black/30 py-8 text-center italic font-serif">가방이 비어 있습니다.</p>}
                  {gameState.inventory.map(item => {
                    const rColor = RARITY_COLORS[item.rarity] || '#000000';
                    // Fix: Explicitly cast values of gameState.equipped as LootItem | undefined to avoid 'unknown' type error.
                    const isEquipped = (Object.values(gameState.equipped) as (LootItem | undefined)[]).some(e => e?.id === item.id);
                    
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => toggleEquip(item)}
                        style={{ borderLeftColor: rColor, borderLeftWidth: '4px' }}
                        className={`p-4 border transition-all bg-white relative group rounded-sm shadow-sm cursor-pointer active:scale-[0.98] overflow-hidden ${isEquipped ? 'border-black ring-1 ring-black/5 bg-black/[0.02]' : 'border-black/5 hover:border-black/20 hover:shadow-lg'}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 text-white rounded-sm" style={{ backgroundColor: rColor }}>{item.rarity}</span>
                          <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest font-inter">{item.type}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-cinzel text-sm font-bold tracking-widest">{item.name}</h5>
                          {isEquipped && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                        </div>
                        <p className="text-[10px] text-black/50 leading-tight mb-4 italic font-serif">"{item.description}"</p>
                        
                        <div className="flex gap-2 text-[8px] font-bold uppercase opacity-60 font-inter">
                           {item.statBonuses.strength && <span className="text-red-600">STR+{Math.floor(item.statBonuses.strength)}</span>}
                           {item.statBonuses.intelligence && <span className="text-blue-600">INT+{Math.floor(item.statBonuses.intelligence)}</span>}
                           {item.statBonuses.dexterity && <span className="text-green-600">DEX+{Math.floor(item.statBonuses.dexterity)}</span>}
                        </div>

                        <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-all text-[8px] font-black uppercase tracking-widest text-gold-bg flex items-center gap-1 font-inter">
                          {isEquipped ? (
                            <span className="text-red-400">클릭하여 해제</span>
                          ) : (
                            <><Sparkle className="w-2 h-2" /> 클릭하여 장착</>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {lootReward && (
        <LootRewardPopup loot={lootReward} onClose={() => setLootReward(null)} />
      )}

      {showDiceOverlay && rollInfo && (
        <DiceAnimation result={rollInfo.total} success={rollInfo.success} />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f6f2] selection:bg-gold-bg selection:text-white pb-20 overflow-x-hidden">
      <Header onSave={saveGame} onLoad={loadGame} phase={phase} />
      <main>
        {phase === GamePhase.CLASS_SELECT && renderClassSelect()}
        {phase === GamePhase.PET_SELECT && renderPetSelect()}
        {phase === GamePhase.ITEM_SELECT && renderItemSelect()}
        {phase === GamePhase.WORLD_MAP && renderWorldMap()}
        {phase === GamePhase.ADVENTURE && renderAdventure()}
      </main>

      {phase >= GamePhase.WORLD_MAP && (
        <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-black/5 px-8 py-3 flex justify-between items-center z-40 text-[9px] tracking-[0.2em] font-black uppercase shadow-[0_-20px_50px_rgba(0,0,0,0.05)] font-inter">
          <div className="flex gap-12">
            <div className="flex items-center gap-3">
              <span className="opacity-30">직업</span>
              <span className="font-cinzel text-xs text-gold-text tracking-widest">{gameState.characterClass?.name}</span>
            </div>
            <div className="flex items-center gap-3 group cursor-default">
              <Coins className="w-3 h-3 text-gold-bg group-hover:rotate-12 transition-transform" />
              <span className="font-cinzel text-xs text-gold-bg tracking-widest">{Math.floor(gameState.gold)} GOLD</span>
            </div>
          </div>
          <div className="flex gap-12 items-center">
            <div className="flex items-center gap-3 group">
               <Heart className="w-3 h-3 text-red-500 fill-current animate-pulse" />
               <div className="h-1.5 w-24 bg-black/5 rounded-full overflow-hidden border border-black/5 shadow-inner">
                 <div className="h-full bg-red-500 transition-all duration-700" style={{ width: `${(gameState.hp/gameState.maxHp)*100}%` }}></div>
               </div>
               <span className="font-cinzel text-xs">{Math.floor(gameState.hp)} / {Math.floor(gameState.maxHp)}</span>
            </div>
            <div className="flex items-center gap-3">
               <Zap className={`w-3 h-3 ${gameState.karma >= 0 ? 'text-blue-500' : 'text-red-500'}`} />
               <span className="font-cinzel text-xs">{gameState.karma > 0 ? '+' : ''}{Math.floor(gameState.karma)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
