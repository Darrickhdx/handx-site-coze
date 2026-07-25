import type { CareerExperience } from '@/content/profile';

interface CareerProjectVisualProps {
  kind: NonNullable<CareerExperience['visualKind']>;
  title: string;
}

const palette = {
  paper: '#f0eadf',
  ink: '#202827',
  muted: '#8f958f',
  accent: '#d58b7e',
  sage: '#789083',
  gold: '#c5a062',
} as const;

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <g aria-hidden="true">
      <path d={`M${x1} ${y1}H${x2}`} stroke={palette.accent} strokeWidth="3" strokeDasharray="7 7" />
      <path d={`M${x2 - 10} ${y2 - 7}L${x2} ${y2}L${x2 - 10} ${y2 + 7}`} fill="none" stroke={palette.accent} strokeWidth="3" />
    </g>
  );
}

function VendingPaymentVisual() {
  return (
    <>
      <rect x="72" y="105" width="190" height="245" rx="12" fill={palette.paper} stroke={palette.sage} strokeWidth="3" />
      <rect x="92" y="127" width="112" height="155" rx="7" fill="#d7ded8" />
      {[0, 1, 2].map((row) =>
        [0, 1].map((column) => (
          <rect
            key={`${row}-${column}`}
            x={108 + column * 43}
            y={145 + row * 45}
            width="28"
            height="30"
            rx="5"
            fill={row === 1 && column === 0 ? palette.accent : palette.ink}
            opacity={row === 1 && column === 0 ? 0.9 : 0.72}
          />
        )),
      )}
      <rect x="216" y="141" width="28" height="70" rx="5" fill={palette.ink} />
      <circle cx="230" cy="228" r="12" fill={palette.gold} />
      <text x="167" y="382" textAnchor="middle" fill={palette.paper} fontSize="18">自动贩卖机现场</text>

      <rect x="326" y="145" width="132" height="150" rx="15" fill={palette.ink} stroke={palette.accent} strokeWidth="3" />
      <rect x="348" y="168" width="88" height="58" rx="7" fill={palette.paper} />
      <path d="M361 181h20v20h-20zM404 181h20v20h-20zM382 202h21v11h-21z" fill={palette.ink} />
      <path d="M357 252c22-18 48-18 70 0M368 261c15-11 31-11 47 0" fill="none" stroke={palette.sage} strokeWidth="4" />
      <text x="392" y="327" textAnchor="middle" fill={palette.paper} fontSize="18">嵌入式支付模组</text>

      <path d="M564 179c8-35 55-47 78-19 31-8 59 16 55 47 19 7 28 29 19 47H546c-12-28-3-60 18-75Z" fill="#d7ded8" stroke={palette.sage} strokeWidth="3" />
      <path d="M585 245v-35M613 245v-51M641 245v-25M669 245v-70" stroke={palette.ink} strokeWidth="10" />
      <text x="630" y="290" textAnchor="middle" fill={palette.paper} fontSize="18">支付与销售数据</text>
      <Arrow x1={270} y1={220} x2={314} y2={220} />
      <Arrow x1={470} y1={220} x2={534} y2={220} />
    </>
  );
}

function CounterPaymentVisual() {
  return (
    <>
      <rect x="65" y="130" width="105" height="188" rx="18" fill={palette.paper} stroke={palette.sage} strokeWidth="3" />
      <rect x="81" y="152" width="73" height="120" rx="6" fill={palette.ink} />
      <path d="M94 169h17v17H94zM124 169h17v17h-17zM94 199h17v17H94zM117 193h24v24h-24zM94 230h47v9H94z" fill={palette.paper} />
      <circle cx="117" cy="294" r="8" fill={palette.accent} />
      <text x="118" y="350" textAnchor="middle" fill={palette.paper} fontSize="18">顾客付款码</text>

      <rect x="238" y="160" width="130" height="110" rx="16" fill={palette.ink} stroke={palette.accent} strokeWidth="3" />
      <rect x="268" y="184" width="70" height="45" rx="5" fill={palette.paper} />
      <path d="M286 242h34" stroke={palette.sage} strokeWidth="5" />
      <text x="303" y="320" textAnchor="middle" fill={palette.paper} fontSize="18">通用光学识读</text>

      <path d="M443 160h125v98H443z" fill={palette.paper} stroke={palette.sage} strokeWidth="3" />
      <rect x="461" y="178" width="89" height="45" rx="5" fill="#d7ded8" />
      <path d="M456 272h99M478 258v42M532 258v42" stroke={palette.paper} strokeWidth="8" />
      <text x="505" y="330" textAnchor="middle" fill={palette.paper} fontSize="18">既有 POS / 收银</text>

      <circle cx="676" cy="210" r="58" fill="#d7ded8" stroke={palette.sage} strokeWidth="3" />
      <path d="m648 211 18 18 39-46" fill="none" stroke={palette.ink} strokeWidth="9" />
      <text x="676" y="313" textAnchor="middle" fill={palette.paper} fontSize="18">支付结果回执</text>
      <Arrow x1={178} y1={215} x2={226} y2={215} />
      <Arrow x1={379} y1={215} x2={431} y2={215} />
      <Arrow x1={580} y1={215} x2={606} y2={215} />
    </>
  );
}

function SmartRetailVisual() {
  return (
    <>
      <rect x="53" y="112" width="300" height="245" rx="14" fill={palette.paper} stroke={palette.sage} strokeWidth="3" />
      <path d="M82 149h242M82 211h242M82 273h242M142 149v175M221 149v175" stroke="#b9c6bd" strokeWidth="3" />
      <path d="M94 178c32 46 85 15 109 63s78 52 112 21" fill="none" stroke={palette.accent} strokeWidth="5" strokeDasharray="8 7" />
      {[['102','170'], ['196','232'], ['280','274']].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="10" fill={palette.ink} />
      ))}
      <path d="M92 98v-25h55v25M187 98v-25h55v25M282 98v-25h55v25" fill="none" stroke={palette.gold} strokeWidth="6" />
      <text x="203" y="393" textAnchor="middle" fill={palette.paper} fontSize="18">匿名传感：图像 · Wi-Fi · 蓝牙 · 声音</text>

      <circle cx="450" cy="228" r="75" fill={palette.ink} stroke={palette.accent} strokeWidth="3" />
      <path d="M417 213h66M417 235h66M429 191h42M429 257h42" stroke={palette.paper} strokeWidth="7" />
      <text x="450" y="333" textAnchor="middle" fill={palette.paper} fontSize="18">边缘计算节点</text>

      <rect x="598" y="135" width="150" height="180" rx="14" fill={palette.paper} stroke={palette.sage} strokeWidth="3" />
      <path d="M625 275v-58M662 275v-95M699 275v-38" stroke={palette.ink} strokeWidth="16" />
      <path d="M622 188c35-25 63 18 98-12" fill="none" stroke={palette.accent} strokeWidth="5" />
      <text x="673" y="350" textAnchor="middle" fill={palette.paper} fontSize="18">BI · 动线 · 经营决策</text>
      <Arrow x1={365} y1={228} x2={372} y2={228} />
      <Arrow x1={535} y1={228} x2={585} y2={228} />
    </>
  );
}

function OfflinePaymentVisual() {
  return (
    <>
      <text x="54" y="117" fill={palette.gold} fontSize="16" fontWeight="700">销售数据通道</text>
      <rect x="54" y="138" width="120" height="67" rx="10" fill={palette.paper} />
      <text x="114" y="178" textAnchor="middle" fill={palette.ink} fontSize="18">原 POS / 小票</text>
      <rect x="260" y="138" width="120" height="67" rx="10" fill={palette.ink} stroke={palette.accent} strokeWidth="3" />
      <text x="320" y="178" textAnchor="middle" fill={palette.paper} fontSize="18">酷方网关</text>
      <rect x="470" y="138" width="220" height="67" rx="10" fill="#d7ded8" />
      <text x="580" y="178" textAnchor="middle" fill={palette.ink} fontSize="18">实时销售数据 / 平台</text>
      <Arrow x1={184} y1={171} x2={248} y2={171} />
      <Arrow x1={391} y1={171} x2={458} y2={171} />

      <text x="54" y="270" fill={palette.gold} fontSize="16" fontWeight="700">支付确认通道</text>
      <rect x="54" y="292" width="132" height="74" rx="10" fill={palette.ink} stroke={palette.accent} strokeWidth="3" />
      <text x="120" y="322" textAnchor="middle" fill={palette.paper} fontSize="15">商户端离线设备</text>
      <text x="120" y="347" textAnchor="middle" fill={palette.accent} fontSize="14">生成动态码</text>
      <rect x="272" y="292" width="132" height="74" rx="10" fill={palette.paper} />
      <text x="338" y="322" textAnchor="middle" fill={palette.ink} fontSize="15">消费者联网手机</text>
      <text x="338" y="347" textAnchor="middle" fill={palette.sage} fontSize="14">完成支付</text>
      <rect x="490" y="292" width="190" height="74" rx="10" fill="#d7ded8" />
      <text x="585" y="322" textAnchor="middle" fill={palette.ink} fontSize="15">平台确认 → 商户端</text>
      <text x="585" y="347" textAnchor="middle" fill={palette.accent} fontSize="14">商户端离线 ≠ 全链路离线</text>
      <Arrow x1={198} y1={329} x2={260} y2={329} />
      <Arrow x1={416} y1={329} x2={478} y2={329} />
    </>
  );
}

export function CareerProjectVisual({ kind, title }: CareerProjectVisualProps) {
  const titleId = `career-visual-${kind}`;
  return (
    <figure className="career-project-visual">
      <svg
        viewBox="0 0 800 450"
        role="img"
        aria-labelledby={titleId}
        preserveAspectRatio="xMidYMid meet"
      >
        <title id={titleId}>{title}的原创系统示意图</title>
        <rect width="800" height="450" fill={palette.ink} />
        <path d="M0 32h800M0 418h800" stroke="#ffffff" strokeOpacity="0.12" />
        {kind === 'vending-payment' && <VendingPaymentVisual />}
        {kind === 'counter-payment' && <CounterPaymentVisual />}
        {kind === 'smart-retail' && <SmartRetailVisual />}
        {kind === 'offline-payment' && <OfflinePaymentVisual />}
      </svg>
      <figcaption>
        原创系统示意图，非产品实物复刻｜不复制官网照片、商标、界面或产品独特外观
      </figcaption>
    </figure>
  );
}
