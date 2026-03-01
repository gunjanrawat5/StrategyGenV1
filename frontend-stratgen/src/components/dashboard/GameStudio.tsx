import { useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  LayoutDashboard,
  Users,
  Box,
  Layers,
  Star,
  Settings,
  MoreHorizontal,
  Upload,
  Image as ImageIcon,
  Volume2,
  Play,
  Pause,
  Code,
  ChevronUp,
  ChevronDown,
  Minus,
  Square,
  X,
  Zap,
} from 'lucide-react';

// ============================================================================
// PYTHON CODE
// ============================================================================
const PYTHON_CODE = `class Player:
    def double_jump(self):
        if self.jumps_remaining > 0:
            self.velocity_y = -12
            self.jumps_remaining -= 1

    def update_enemies(self, enemies):
        for enemy in enemies:
            enemy.speed += 2.0
            enemy.update()

# Initialize game objects
player = Player(x=200, y=300)
enemies = [Enemy(x=500, y=300, speed=3.0)]
platforms = [Platform(x=0, y=380, width=800)]

# Game loop
while game_running:
    dt = clock.tick(60) / 1000.0
    player.handle_input()
    player.update(dt, platforms)
    for enemy in enemies:
        enemy.update(dt)
    renderer.draw_scene(player, enemies, platforms)
`;

// ============================================================================
// TOGGLE SWITCH
// ============================================================================
const Toggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) => (
  <button
    onClick={onChange}
    className="relative flex-shrink-0 rounded-full focus:outline-none transition-all duration-200"
    style={{
      width: 36,
      height: 20,
      background: checked ? 'linear-gradient(90deg,#1565C0,#1E88E5)' : '#252525',
      border: checked ? '1px solid #1565C0' : '1px solid #333',
      boxShadow: checked ? '0 0 8px rgba(30,136,229,0.45)' : 'none',
    }}
  >
    <span
      className="absolute top-0.5 rounded-full bg-white shadow"
      style={{
        width: 15,
        height: 15,
        transition: 'transform 0.18s',
        transform: checked ? 'translateX(17px)' : 'translateX(2px)',
      }}
    />
  </button>
);

// ============================================================================
// GRADIENT SLIDER
// ============================================================================
const GradientSlider = ({
  value, min, max, step, onChange, label, displayValue,
}: {
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; label: string; displayValue: string;
}) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="flex justify-between items-center" style={{ marginBottom: 7 }}>
        <span style={{ fontSize: 9, color: '#666', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ fontSize: 10, color: '#888' }}>({displayValue})</span>
      </div>
      <div className="relative rounded-full" style={{ height: 4, background: '#222' }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #1565C0 0%, #00BCD4 100%)' }}
        />
        <div
          className="absolute rounded-full bg-white"
          style={{
            width: 10, height: 10,
            top: '50%', left: `${pct}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 5px rgba(0,188,212,0.7)',
          }}
        />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ margin: 0 }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// CYBERPUNK CANVAS
// ============================================================================
const CyberpunkCanvas = () => (
  <div
    className="relative w-full h-full overflow-hidden"
    style={{ background: 'linear-gradient(180deg,#0d0526 0%,#1a0a3e 48%,#0a1828 100%)' }}
  >
    {/* Stars */}
    {([
      [5,7],[12,4],[19,13],[28,7],[37,10],[46,5],[55,13],[63,7],[72,11],[81,5],[89,15],[95,8],
      [9,21],[23,18],[36,25],[51,19],[67,23],[83,17],[92,26],
    ] as [number,number][]).map(([l,t],i) => (
      <div key={i} className="absolute rounded-full"
        style={{ left:`${l}%`, top:`${t}%`, width:i%4===0?2:1, height:i%4===0?2:1,
          background:'white', opacity:0.28+(i%5)*0.08 }} />
    ))}

    {/* Far buildings */}
    <svg className="absolute bottom-0 left-0 w-full" style={{height:'75%'}}
      viewBox="0 0 800 300" preserveAspectRatio="none">
      <rect x="0"   y="95"  width="28"  height="205" fill="#07031a"/>
      <rect x="32"  y="55"  width="44"  height="245" fill="#07031a"/>
      <rect x="80"  y="108" width="21"  height="192" fill="#07031a"/>
      <rect x="106" y="65"  width="36"  height="235" fill="#07031a"/>
      <rect x="147" y="88"  width="30"  height="212" fill="#07031a"/>
      <rect x="182" y="48"  width="50"  height="252" fill="#07031a"/>
      <rect x="237" y="78"  width="27"  height="222" fill="#07031a"/>
      <rect x="268" y="32"  width="40"  height="268" fill="#07031a"/>
      <rect x="313" y="82"  width="37"  height="218" fill="#07031a"/>
      <rect x="355" y="52"  width="53"  height="248" fill="#07031a"/>
      <rect x="413" y="72"  width="30"  height="228" fill="#07031a"/>
      <rect x="448" y="43"  width="46"  height="257" fill="#07031a"/>
      <rect x="499" y="80"  width="36"  height="220" fill="#07031a"/>
      <rect x="540" y="36"  width="41"  height="264" fill="#07031a"/>
      <rect x="586" y="63"  width="50"  height="237" fill="#07031a"/>
      <rect x="641" y="90"  width="31"  height="210" fill="#07031a"/>
      <rect x="677" y="46"  width="47"  height="254" fill="#07031a"/>
      <rect x="729" y="75"  width="71"  height="225" fill="#07031a"/>
      {/* Lit windows */}
      <rect x="37"  y="70"  width="4" height="4" fill="#3a2a7a" opacity="0.9"/>
      <rect x="47"  y="70"  width="4" height="4" fill="#6a2a8a" opacity="0.9"/>
      <rect x="37"  y="83"  width="4" height="4" fill="#3a2a7a" opacity="0.7"/>
      <rect x="113" y="80"  width="5" height="5" fill="#2a3a9a" opacity="0.8"/>
      <rect x="124" y="80"  width="5" height="5" fill="#2a3a9a" opacity="0.8"/>
      <rect x="188" y="65"  width="5" height="5" fill="#4a2a8a" opacity="0.9"/>
      <rect x="200" y="65"  width="5" height="5" fill="#8a2a7a" opacity="0.9"/>
      <rect x="275" y="50"  width="6" height="6" fill="#3a2a7a" opacity="0.8"/>
      <rect x="287" y="50"  width="6" height="6" fill="#2a3a9a" opacity="0.8"/>
      <rect x="362" y="70"  width="6" height="6" fill="#4a2a8a" opacity="0.7"/>
      <rect x="375" y="70"  width="6" height="6" fill="#6a2a6a" opacity="0.8"/>
      <rect x="455" y="60"  width="5" height="5" fill="#2a4a9a" opacity="0.9"/>
      <rect x="547" y="53"  width="6" height="6" fill="#8a2a7a" opacity="0.9"/>
      <rect x="560" y="53"  width="6" height="6" fill="#2a3a9a" opacity="0.8"/>
      <rect x="593" y="77"  width="6" height="6" fill="#4a2a7a" opacity="0.7"/>
      <rect x="684" y="62"  width="5" height="5" fill="#3a3a8a" opacity="0.8"/>
    </svg>

    {/* Mid buildings */}
    <svg className="absolute bottom-0 left-0 w-full" style={{height:'58%'}}
      viewBox="0 0 800 220" preserveAspectRatio="none">
      <rect x="0"   y="68"  width="46"  height="152" fill="#0c0620"/>
      <rect x="50"  y="36"  width="63"  height="184" fill="#0c0620"/>
      <rect x="117" y="56"  width="40"  height="164" fill="#0c0620"/>
      <rect x="161" y="26"  width="73"  height="194" fill="#0c0620"/>
      <rect x="238" y="50"  width="48"  height="170" fill="#0c0620"/>
      <rect x="290" y="20"  width="60"  height="200" fill="#0c0620"/>
      <rect x="354" y="43"  width="68"  height="177" fill="#0c0620"/>
      <rect x="426" y="30"  width="56"  height="190" fill="#0c0620"/>
      <rect x="486" y="56"  width="72"  height="164" fill="#0c0620"/>
      <rect x="562" y="36"  width="50"  height="184" fill="#0c0620"/>
      <rect x="616" y="60"  width="66"  height="160" fill="#0c0620"/>
      <rect x="686" y="40"  width="114" height="180" fill="#0c0620"/>
      {/* Neon top edges */}
      <rect x="50"  y="36"  width="63" height="1" fill="#ff00cc" opacity="0.55"/>
      <rect x="290" y="20"  width="60" height="1" fill="#cc00ff" opacity="0.6"/>
      <rect x="161" y="26"  width="1"  height="194" fill="#8800ff" opacity="0.22"/>
      <rect x="562" y="36"  width="50" height="1" fill="#ff00aa" opacity="0.45"/>
    </svg>

    {/* Ground */}
    <div className="absolute bottom-0 left-0 right-0" style={{
      height:38, background:'linear-gradient(180deg,#0c1a2e,#050d1a)',
      borderTop:'1.5px solid rgba(0,210,255,0.42)',
      boxShadow:'0 -6px 30px rgba(0,180,255,0.2)',
    }}/>

    {/* Platform 1 – lower left, cyan */}
    <div className="absolute" style={{
      bottom:92, left:'7%', width:155, height:11,
      background:'#0c1e38', borderTop:'2px solid rgba(0,200,255,0.88)',
      boxShadow:'0 0 18px 4px rgba(0,180,255,0.35),0 0 36px rgba(0,120,200,0.14)',
    }}/>

    {/* Platform 2 – mid-left, magenta */}
    <div className="absolute" style={{
      bottom:158, left:'22%', width:125, height:11,
      background:'#1a0d30', borderTop:'2px solid rgba(220,0,255,0.9)',
      boxShadow:'0 0 20px 4px rgba(200,0,255,0.38),0 0 40px rgba(130,0,220,0.16)',
    }}/>

    {/* Platform 3 – center, teal */}
    <div className="absolute" style={{
      bottom:115, left:'41%', width:215, height:11,
      background:'#0c1e38', borderTop:'2px solid rgba(0,255,185,0.88)',
      boxShadow:'0 0 22px 5px rgba(0,220,175,0.36),0 0 44px rgba(0,160,120,0.14)',
    }}/>

    {/* Platform 4 – upper right, orange */}
    <div className="absolute" style={{
      bottom:194, right:'7%', width:145, height:11,
      background:'#1a0d30', borderTop:'2px solid rgba(255,110,0,0.88)',
      boxShadow:'0 0 20px 4px rgba(255,90,0,0.36),0 0 40px rgba(200,60,0,0.14)',
    }}/>

    {/* CHARACTER (blue/cyan runner) */}
    <div className="absolute" style={{bottom:43, left:'31%'}}>
      <svg width="22" height="42" viewBox="0 0 22 42" fill="none">
        <circle cx="11" cy="6" r="5.2" fill="#00CFFF"/>
        <rect x="7" y="12" width="8" height="14" rx="2" fill="#0080CC"/>
        <line x1="7" y1="15" x2="1" y2="23" stroke="#0090DD" strokeWidth="3" strokeLinecap="round"/>
        <line x1="15" y1="15" x2="21" y2="21" stroke="#0090DD" strokeWidth="3" strokeLinecap="round"/>
        <line x1="9"  y1="26" x2="5"  y2="40" stroke="#004f99" strokeWidth="3" strokeLinecap="round"/>
        <line x1="13" y1="26" x2="17" y2="38" stroke="#004f99" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    </div>

    {/* ENEMY (orange) on platform 3 */}
    <div className="absolute" style={{bottom:127, left:'52%'}}>
      <svg width="20" height="38" viewBox="0 0 20 38" fill="none">
        <circle cx="10" cy="5.5" r="4.8" fill="#FF5500"/>
        <rect x="6" y="11" width="8" height="13" rx="2" fill="#CC2200"/>
        <line x1="6"  y1="14" x2="1"  y2="20" stroke="#CC2200" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="14" y1="14" x2="19" y2="19" stroke="#CC2200" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="8"  y1="24" x2="5"  y2="36" stroke="#991100" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="12" y1="24" x2="15" y2="35" stroke="#991100" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    </div>

    {/* COIN */}
    <div className="absolute rounded-full" style={{
      width:20, height:20, bottom:183, left:'39%',
      background:'radial-gradient(circle at 35% 35%,#FFE566,#FF9800)',
      boxShadow:'0 0 14px 5px rgba(255,180,0,0.55)',
    }}/>

    {/* Top-left overlay badge */}
    <div className="absolute top-3 left-3 font-bold text-white"
      style={{ fontSize:10, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)',
        padding:'4px 10px', borderRadius:4, letterSpacing:'0.04em' }}>
      LIVE GAME PREVIEW (HTML5/WebGL Canvas)
    </div>

    {/* Top-right badge */}
    <div className="absolute top-3 right-3 font-medium"
      style={{ fontSize:11, color:'rgba(255,255,255,0.88)',
        background:'rgba(18,10,42,0.75)', backdropFilter:'blur(6px)',
        padding:'4px 10px', borderRadius:4, border:'1px solid rgba(80,50,160,0.4)' }}>
      CyberRunner v0.3
    </div>

    {/* Bottom labels */}
    <div className="absolute bottom-3 left-3" style={{fontSize:11,color:'#888'}}>
      CyberRunner v0.3
    </div>
    <div className="absolute bottom-3 right-3"
      style={{ fontSize:11, color:'#888', background:'rgba(0,0,0,0.45)',
        padding:'2px 8px', borderRadius:3 }}>
      Running Canvas)
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function GameStudio() {
  const [omnibarText, setOmnibarText] = useState(
    'Create a double jump for the player and increase enemy speed'
  );
  const [showEditor, setShowEditor] = useState(true);
  const [editorCode, setEditorCode] = useState(PYTHON_CODE);

  const [genre,       setGenre]       = useState('Platformer');
  const [theme,       setTheme]       = useState('Cyberpunk');
  const [perspective, setPerspective] = useState('2D Side-Scroller');
  const [gravity,     setGravity]     = useState(true);
  const [enemies,     setEnemies]     = useState(true);
  const [doubleJump,  setDoubleJump]  = useState(true);

  const [aiExpanded,     setAiExpanded]     = useState(true);
  const [temperature,    setTemperature]    = useState(0.7);
  const [topP,           setTopP]           = useState(0.9);
  const [contextLength,  setContextLength]  = useState(32);
  const [systemPrompt,   setSystemPrompt]   = useState(
    '(Default: Act as a reliable Python game developer...)'
  );

  const [activeEntity, setActiveEntity] = useState('player');

  const entityList = [
    { id:'player', label:'Player',        tag:'Active', emoji:'🏃' },
    { id:'enemy',  label:'Enemy_Bot',     tag:null,     emoji:'🤖' },
    { id:'plat',   label:'Platform_Base', tag:null,     emoji:'📦' },
    { id:'coin',   label:'Coin_Pickup',   tag:null,     emoji:'🪙' },
  ];

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden"
      style={{ background:'#0d0d0d', color:'#fff',
        fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap');
        * { box-sizing:border-box; }
        select { -webkit-appearance:none; appearance:none; }
        input[type=range] { -webkit-appearance:none; appearance:none; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#2a2a2a; border-radius:2px; }
      `}</style>

      {/* ── HEADER ── */}
      <header className="flex items-center justify-between flex-shrink-0 px-4"
        style={{ height:54, background:'#111', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>

        <div className="flex items-center gap-3">
          {/* Hex logo */}
          <div className="flex items-center justify-center flex-shrink-0"
            style={{ width:38, height:38,
              background:'linear-gradient(135deg,#1a0a3e,#3d1a78)',
              clipPath:'polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)',
              boxShadow:'0 0 22px rgba(100,50,200,0.4)' }}>
            <Zap size={17} style={{color:'#00A3FF'}}/>
          </div>
          <div className="leading-none">
            <div style={{fontSize:16,fontWeight:800,letterSpacing:'0.06em',color:'#fff'}}>OVERLORD</div>
            <div style={{fontSize:10,color:'#555',marginTop:2,letterSpacing:'0.04em'}}>Game Creator Studio</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded"
            style={{background:'#1a1a1a',border:'1px solid #262626'}}>
            <div className="rounded-full flex-shrink-0"
              style={{width:8,height:8,background:'#4CAF50',boxShadow:'0 0 6px #4CAF50'}}/>
            <span style={{fontSize:12,color:'rgba(255,255,255,0.82)',fontWeight:500}}>
              H200 Online (VRAM: 98/141GB)
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            {([Minus, Square, X] as const).map((Icon,i) => (
              <button key={i}
                className="flex items-center justify-center rounded transition-all"
                style={{width:28,height:28,color:'#555',background:'transparent'}}
                onMouseEnter={e=>{
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.background = i===2?'rgba(200,50,50,0.28)':'#222';
                  b.style.color = i===2?'#f88':'#aaa';
                }}
                onMouseLeave={e=>{
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.background='transparent'; b.style.color='#555';
                }}>
                <Icon size={i===1?11:14}/>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── 3-COLUMN LAYOUT ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ══ LEFT SIDEBAR ══ */}
        <aside className="flex flex-shrink-0"
          style={{width:280, borderRight:'1px solid rgba(255,255,255,0.05)'}}>

          {/* Icon strip */}
          <div className="flex flex-col items-center py-3 gap-0.5 flex-shrink-0"
            style={{width:44,background:'#0d0d0d',borderRight:'1px solid rgba(255,255,255,0.04)'}}>
            {([
              {Icon:LayoutDashboard, active:true},
              {Icon:Users,           active:false},
              {Icon:Box,             active:false},
              {Icon:Layers,          active:false},
              {Icon:Star,            active:false},
            ] as const).map(({Icon,active},i)=>(
              <button key={i}
                className="flex items-center justify-center rounded transition-all"
                style={{width:32,height:32,margin:'2px 0',
                  background:active?'rgba(0,163,255,0.12)':'transparent',
                  color:active?'#00A3FF':'#3e3e3e'}}>
                <Icon size={15}/>
              </button>
            ))}
            <div style={{flex:1}}/>
            <button className="flex items-center justify-center rounded"
              style={{width:32,height:32,color:'#3e3e3e',background:'transparent'}}>
              <Settings size={15}/>
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col flex-1 overflow-hidden" style={{background:'#111'}}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 flex-shrink-0"
              style={{height:36,borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <span style={{fontSize:10,fontWeight:700,color:'#666',
                letterSpacing:'0.1em',textTransform:'uppercase'}}>
                Assets &amp; Entities
              </span>
              <span style={{fontSize:10,color:'#333'}}>15%</span>
            </div>

            {/* Entities */}
            <div className="flex-1 overflow-y-auto p-2">
              <div style={{fontSize:10,color:'#444',letterSpacing:'0.12em',
                textTransform:'uppercase',padding:'4px 6px 8px'}}>
                Entities
              </div>
              {entityList.map(e=>{
                const active = activeEntity===e.id;
                return (
                  <button key={e.id} onClick={()=>setActiveEntity(e.id)}
                    className="w-full flex items-center gap-2.5 rounded mb-0.5 text-left transition-all"
                    style={{padding:'7px 8px',
                      background:active
                        ?'linear-gradient(90deg,rgba(110,55,210,0.28) 0%,rgba(110,55,210,0.03) 100%)'
                        :'transparent',
                      borderLeft:active?'2px solid rgba(140,80,240,0.85)':'2px solid transparent'}}>
                    <span style={{fontSize:15}}>{e.emoji}</span>
                    <span style={{fontSize:12,color:active?'#d8c8ff':'#777'}}>{e.label}</span>
                    {e.tag&&<span style={{marginLeft:'auto',fontSize:10,color:'#555'}}>({e.tag})</span>}
                  </button>
                );
              })}
            </div>

            {/* Upload */}
            <div className="flex-shrink-0 p-3"
              style={{borderTop:'1px solid rgba(255,255,255,0.05)'}}>
              <div style={{fontSize:11,color:'#4a4a4a',fontWeight:500,marginBottom:8}}>Upload Assets</div>
              <div className="flex flex-col items-center gap-2 rounded-lg p-4 cursor-pointer"
                style={{border:'1.5px dashed rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.01)'}}
                onMouseEnter={e=>((e.currentTarget as HTMLDivElement).style.background='rgba(0,163,255,0.03)')}
                onMouseLeave={e=>((e.currentTarget as HTMLDivElement).style.background='rgba(255,255,255,0.01)')}>
                <div className="flex items-center justify-center rounded-full"
                  style={{width:40,height:40,background:'rgba(0,163,255,0.08)',
                    border:'1px solid rgba(0,163,255,0.18)'}}>
                  <Upload size={18} style={{color:'#00A3FF'}}/>
                </div>
                <span style={{fontSize:11,color:'#444'}}>Drag &amp; Drop</span>
                <div className="flex items-center gap-3">
                  <ImageIcon size={14} style={{color:'#383838'}}/>
                  <Box size={14} style={{color:'#383838'}}/>
                  <Volume2 size={14} style={{color:'#383838'}}/>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ══ CENTER ══ */}
        <main className="flex flex-col flex-1 overflow-hidden">

          {/* Live Preview (60%) */}
          <section className="flex flex-col flex-shrink-0"
            style={{height:'60%', borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
            <div className="flex items-center justify-between px-3 flex-shrink-0"
              style={{height:36,background:'#111',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <span style={{fontSize:11,fontWeight:600,color:'#bbb',letterSpacing:'0.05em'}}>
                Live Preview (Level 1)
              </span>
              <button style={{color:'#3e3e3e'}}><MoreHorizontal size={16}/></button>
            </div>
            <div className="flex-1 overflow-hidden"><CyberpunkCanvas/></div>
          </section>

          {/* Omnibar + Editor (40%) */}
          <section className="flex flex-col flex-1 overflow-hidden">
            {/* Section header */}
            <div className="flex items-center justify-between px-3 flex-shrink-0"
              style={{height:36,background:'#111',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <span style={{fontSize:11,fontWeight:600,color:'#bbb',letterSpacing:'0.05em'}}>
                Omnibar &amp; Code Editor
              </span>
              <span style={{fontSize:10,color:'#333'}}>25%</span>
            </div>

            {/* Omnibar */}
            <div className="flex-shrink-0 px-3 py-2" style={{background:'#111'}}>
              <div className="flex items-center gap-2 px-3 rounded-md"
                style={{height:38,background:'#0d0d0d',
                  border:'1px solid rgba(0,163,255,0.22)',
                  boxShadow:'0 0 0 2px rgba(0,163,255,0.06)'}}>
                <input type="text" value={omnibarText}
                  onChange={e=>setOmnibarText(e.target.value)}
                  className="flex-1 bg-transparent outline-none"
                  style={{fontSize:13,color:'#ddd'}}
                  placeholder="Type a command…"/>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-2 px-3 flex-shrink-0"
              style={{height:34,background:'#0d0d0d',
                borderBottom:'1px solid rgba(255,255,255,0.05)',
                borderTop:'1px solid rgba(255,255,255,0.04)'}}>

              {/* </> Code button */}
              <button onClick={()=>setShowEditor(!showEditor)}
                className="flex items-center gap-1.5 rounded flex-shrink-0 transition-all"
                style={{padding:'3px 9px',fontSize:11,fontWeight:600,
                  background:showEditor?'rgba(245,158,11,0.13)':'rgba(255,255,255,0.04)',
                  color:showEditor?'#F59E0B':'#555',
                  border:showEditor?'1px solid rgba(245,158,11,0.28)':'1px solid rgba(255,255,255,0.06)'}}>
                <Code size={13}/> Code
              </button>

              <div style={{width:1,height:16,background:'#222'}}/>

              {/* File tab */}
              <div className="flex items-center gap-1.5 rounded"
                style={{padding:'3px 9px',background:'#1a1a1a',
                  border:'1px solid rgba(255,255,255,0.07)',fontSize:11,color:'#bbb'}}>
                <span style={{color:'#3C9EE7',fontSize:13}}>🐍</span>
                <span>game_logic.py</span>
                <button style={{marginLeft:3,color:'#444',lineHeight:1}}><X size={11}/></button>
              </div>

              <div style={{flex:1}}/>

              {/* Actions */}
              <div className="flex items-center gap-0.5">
                {([Play,Pause,MoreHorizontal] as const).map((Icon,i)=>(
                  <button key={i}
                    className="flex items-center justify-center rounded transition-colors"
                    style={{width:24,height:24,color:'#3e3e3e',background:'transparent'}}
                    onMouseEnter={e=>{
                      const b=e.currentTarget as HTMLButtonElement;
                      b.style.color='#00A3FF'; b.style.background='#1a1a1a';
                    }}
                    onMouseLeave={e=>{
                      const b=e.currentTarget as HTMLButtonElement;
                      b.style.color='#3e3e3e'; b.style.background='transparent';
                    }}>
                    <Icon size={13}/>
                  </button>
                ))}
              </div>
            </div>

            {/* Monaco */}
            <div className="flex-1 overflow-hidden">
              {showEditor ? (
                <Editor height="100%" defaultLanguage="python"
                  value={editorCode}
                  onChange={(v:string|undefined)=>setEditorCode(v||'')}
                  theme="vs-dark"
                  options={{
                    minimap:{enabled:false}, fontSize:12,
                    fontFamily:"'Fira Code',monospace",
                    lineNumbers:'on', scrollBeyondLastLine:false,
                    automaticLayout:true, padding:{top:10,bottom:10},
                    tabSize:4, renderLineHighlight:'line', lineNumbersMinChars:3,
                  }}/>
              ):(
                <div className="w-full h-full flex items-center justify-center"
                  style={{background:'#0d0d0d',color:'#333',fontSize:12}}>
                  {'Editor hidden – click </> Code to show'}
                </div>
              )}
            </div>
          </section>
        </main>

        {/* ══ RIGHT PANEL ══ */}
        <aside className="flex flex-col flex-shrink-0 overflow-y-auto"
          style={{width:260,background:'#111',borderLeft:'1px solid rgba(255,255,255,0.05)'}}>

          {/* Header */}
          <div className="flex items-center justify-between px-3 flex-shrink-0"
            style={{height:36,borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
            <span style={{fontSize:10,fontWeight:700,color:'#666',
              letterSpacing:'0.1em',textTransform:'uppercase'}}>
              Game Studio Settings
            </span>
            <span style={{fontSize:10,color:'#333'}}>15%</span>
          </div>

          {/* GAME RULES */}
          <div className="p-3" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#ccc',
              letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:12}}>
              Game Rules
            </div>

            {/* Dropdowns */}
            {[
              {label:'GENRE',       value:genre,       setter:setGenre,       opts:['Platformer','RPG','Shooter','Puzzle']},
              {label:'THEME',       value:theme,       setter:setTheme,       opts:['Cyberpunk','Fantasy','Steampunk','Retro']},
              {label:'PERSPECTIVE', value:perspective, setter:setPerspective, opts:['2D Side-Scroller','2D Top-Down','3D First-Person','3D Third-Person']},
            ].map(({label,value,setter,opts})=>(
              <div key={label} style={{marginBottom:10}}>
                <div style={{fontSize:9,color:'#555',letterSpacing:'0.12em',
                  textTransform:'uppercase',marginBottom:4}}>{label}:</div>
                <div className="relative">
                  <select value={value} onChange={e=>setter(e.target.value)}
                    className="w-full outline-none cursor-pointer"
                    style={{padding:'6px 26px 6px 10px',fontSize:12,color:'#ddd',
                      background:'#1a1a1a',border:'1px solid rgba(255,255,255,0.08)',borderRadius:4}}>
                    {opts.map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                  <ChevronDown size={11}
                    style={{position:'absolute',right:8,top:'50%',
                      transform:'translateY(-50%)',color:'#555',pointerEvents:'none'}}/>
                </div>
              </div>
            ))}

            {/* Toggles */}
            <div style={{marginTop:14,display:'flex',flexDirection:'column',gap:11}}>
              {[
                {label:'Enable Gravity', state:gravity,    setter:setGravity},
                {label:'Enable Enemies', state:enemies,    setter:setEnemies},
                {label:'Double Jump',    state:doubleJump, setter:setDoubleJump},
              ].map(({label,state,setter})=>(
                <div key={label} className="flex items-center justify-between">
                  <span style={{fontSize:12,color:'#bbb'}}>
                    {label}{' '}
                    <span style={{fontSize:10,color:'#555'}}>({state?'ON':'OFF'})</span>
                  </span>
                  <Toggle checked={state} onChange={()=>setter(!state)}/>
                </div>
              ))}
            </div>
          </div>

          {/* AI SETTINGS */}
          <div className="p-3">
            <button onClick={()=>setAiExpanded(!aiExpanded)}
              className="flex items-center justify-between w-full"
              style={{marginBottom:aiExpanded?10:0}}>
              <span style={{fontSize:11,fontWeight:700,color:'#ccc',
                letterSpacing:'0.08em',textTransform:'uppercase'}}>
                AI Settings
              </span>
              {aiExpanded
                ?<ChevronUp size={13} style={{color:'#555'}}/>
                :<ChevronDown size={13} style={{color:'#555'}}/>
              }
            </button>

            {aiExpanded&&(
              <>
                <div style={{fontSize:10,color:'#777',fontWeight:600,marginBottom:14,marginLeft:1}}>
                  Hyperparameters
                </div>
                <GradientSlider label="Temperature"    value={temperature}   min={0}  max={1}   step={0.1} onChange={setTemperature}   displayValue={temperature.toFixed(1)}/>
                <GradientSlider label="Top_P"          value={topP}          min={0}  max={1}   step={0.1} onChange={setTopP}          displayValue={topP.toFixed(1)}/>
                <GradientSlider label="Context Length" value={contextLength} min={4}  max={128} step={4}   onChange={setContextLength} displayValue={`${contextLength}k`}/>

                {/* System Prompt */}
                <div style={{marginTop:4}}>
                  <div style={{fontSize:9,color:'#555',letterSpacing:'0.12em',
                    textTransform:'uppercase',marginBottom:6}}>
                    System Prompt Override
                  </div>
                  <div className="relative">
                    <textarea value={systemPrompt}
                      onChange={e=>setSystemPrompt(e.target.value)}
                      rows={4} className="w-full resize-none outline-none"
                      style={{padding:'8px 10px',fontSize:11,color:'#999',
                        background:'#1a1a1a',border:'1px solid rgba(255,255,255,0.07)',
                        borderRadius:4,lineHeight:1.5}}
                      onFocus={e=>(e.currentTarget.style.borderColor='rgba(0,163,255,0.3)')}
                      onBlur={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.07)')}/>
                    {/* Gemini-style diamond */}
                    <div className="absolute bottom-2 right-2" style={{opacity:0.45}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <defs>
                          <linearGradient id="gem" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#4FC3F7"/>
                            <stop offset="100%" stopColor="#9C27B0"/>
                          </linearGradient>
                        </defs>
                        <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" fill="url(#gem)"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
