'use client';

import { useState } from 'react';
import RevealSection from './RevealSection';

interface ROIData {
  title: string;
  titleHighlight: string;
  subtitle: string;
  inputProperties: string;
  inputHours: string;
  inputRate: string;
  outputHoursSaved: string;
  outputValueRecovered: string;
  outputCost: string;
  outputNetSavings: string;
  outputROI: string;
  perMonth: string;
  cta: string;
  note: string;
}

const SAVINGS_PERCENT = 0.80;
const PLAN_COST = 349;

export default function ROICalculator({ data }: { data: ROIData }) {
  const [immobili, setImmobili] = useState(10);
  const [ore, setOre] = useState(2);
  const [costo, setCosto] = useState(30);

  const oreRisparmiate = Math.round(immobili * ore * SAVINGS_PERCENT * 10) / 10;
  const valoreRecuperato = Math.round(oreRisparmiate * costo);
  const risparmioNetto = valoreRecuperato - PLAN_COST;
  const roi = valoreRecuperato / PLAN_COST;

  return (
    <section style={{ background: '#1a1a2e', padding: '80px 24px' }}>
      <RevealSection>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#fff', margin: '0 0 12px' }}>
              {data.title}{' '}
              <span
                style={{
                  color: '#f59e0b',
                  textDecoration: 'underline',
                  textDecorationThickness: 3,
                  textUnderlineOffset: 6,
                }}
              >
                {data.titleHighlight}
              </span>
            </h2>
            <p style={{ color: '#a1a1aa', fontSize: 16, margin: 0 }}>{data.subtitle}</p>
          </div>

          {/* Calculator Grid */}
          <div className="roi-grid" style={{ display: 'flex', gap: 32, alignItems: 'stretch' }}>
            {/* Inputs */}
            <div
              style={{
                flex: 1,
                background: '#252547',
                borderRadius: 20,
                border: '3px solid #3b3b6b',
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 32,
              }}
            >
              <SliderInput
                label={data.inputProperties}
                value={immobili}
                onChange={setImmobili}
                min={1}
                max={50}
                step={1}
                format={(v) => `${v}`}
                marks={['1', '25', '50+']}
              />
              <SliderInput
                label={data.inputHours}
                value={ore}
                onChange={setOre}
                min={0.5}
                max={6}
                step={0.5}
                format={(v) => `${v}h`}
                marks={['30 min', '3 ore', '6 ore']}
              />
              <SliderInput
                label={data.inputRate}
                value={costo}
                onChange={setCosto}
                min={15}
                max={100}
                step={5}
                format={(v) => `€${v}`}
                marks={['€15', '€50', '€100']}
              />

              <div
                style={{
                  background: '#1a1a2e',
                  borderRadius: 12,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ color: '#71717a', fontSize: 12 }}>ℹ️</span>
                <span style={{ color: '#71717a', fontSize: 12, lineHeight: 1.4 }}>{data.note}</span>
              </div>
            </div>

            {/* Outputs */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <OutputCard
                label={data.outputHoursSaved}
                value={`${oreRisparmiate}h`}
                color="#f59e0b"
              />
              <OutputCard
                label={data.outputValueRecovered}
                value={`€${valoreRecuperato.toLocaleString('it-IT')}`}
                color="#f59e0b"
              />
              <OutputCard
                label={data.outputCost}
                value={`-€${PLAN_COST}`}
                color="#ef4444"
                subtle
              />
              <OutputCard
                label={data.outputNetSavings}
                value={`€${risparmioNetto.toLocaleString('it-IT')}`}
                color={risparmioNetto > 0 ? '#10b981' : '#ef4444'}
                large
              />

              {/* ROI Badge */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  borderRadius: 16,
                  border: '3px solid #f59e0b',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 900, color: '#1a1a2e' }}>
                  {roi.toFixed(1)}×
                </span>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', opacity: 0.8 }}>
                  {data.outputROI}
                </span>
              </div>

              {/* CTA */}
              <a
                href="#pricing"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px 28px',
                  background: '#f59e0b',
                  color: '#1a1a2e',
                  border: 'none',
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 16,
                  textDecoration: 'none',
                  boxShadow: '0 2px 10px rgba(16,24,40,0.10)',
                  transition: 'all 0.2s',
                  marginTop: 4,
                }}
              >
                {data.cta} →
              </a>
            </div>
          </div>
        </div>
      </RevealSection>

      <style>{`
        @media (max-width: 768px) {
          .roi-grid {
            flex-direction: column !important;
          }
        }
      `}</style>
    </section>
  );
}

/* ─── Slider Input ─── */
function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
  marks,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  marks: string[];
}) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <span style={{ color: '#e4e4e7', fontSize: 14, fontWeight: 600 }}>{label}</span>
        <span style={{ color: '#f59e0b', fontSize: 22, fontWeight: 800 }}>{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="roi-slider"
        style={{
          width: '100%',
          height: 6,
          appearance: 'none',
          WebkitAppearance: 'none',
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percent}%, #3b3b6b ${percent}%, #3b3b6b 100%)`,
          borderRadius: 3,
          outline: 'none',
          cursor: 'pointer',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {marks.map((m) => (
          <span key={m} style={{ color: '#71717a', fontSize: 11 }}>{m}</span>
        ))}
      </div>

      <style>{`
        .roi-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid #fff;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        .roi-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid #fff;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}

/* ─── Output Card ─── */
function OutputCard({
  label,
  value,
  color,
  large,
  subtle,
}: {
  label: string;
  value: string;
  color: string;
  large?: boolean;
  subtle?: boolean;
}) {
  return (
    <div
      style={{
        background: '#252547',
        borderRadius: 14,
        border: large ? `2px solid ${color}40` : '2px solid #3b3b6b',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ color: '#a1a1aa', fontSize: 14, fontWeight: 500 }}>{label}</span>
      <span
        style={{
          color: subtle ? '#ef4444' : color,
          fontSize: large ? 28 : 22,
          fontWeight: 800,
          opacity: subtle ? 0.7 : 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}
