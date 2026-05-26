"use client";

import { useState } from "react";
import { Calculator, ChevronDown, Info } from "lucide-react";

type SellerType = "privato" | "impresa";
type HomeType = "prima" | "seconda";

function formatEuro(n: number): string {
  return n.toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function TaxCalculator() {
  const [price, setPrice] = useState("");
  const [rendita, setRendita] = useState("");
  const [seller, setSeller] = useState<SellerType>("privato");
  const [home, setHome] = useState<HomeType>("prima");
  const [mortgage, setMortgage] = useState("");
  const [agencyPct, setAgencyPct] = useState("3");
  const [showResult, setShowResult] = useState(false);

  const priceNum = parseFloat(price.replace(/\./g, "").replace(",", ".")) || 0;
  const renditaNum =
    parseFloat(rendita.replace(/\./g, "").replace(",", ".")) || 0;
  const mortgageNum =
    parseFloat(mortgage.replace(/\./g, "").replace(",", ".")) || 0;
  const agencyNum = parseFloat(agencyPct.replace(",", ".")) || 0;

  const calculate = () => {
    if (priceNum <= 0) return;
    setShowResult(true);
  };

  // Calculations
  const valoreCatastale =
    home === "prima" ? renditaNum * 115.5 : renditaNum * 126;

  let impostaRegistro = 0;
  let impostaIpotecaria = 0;
  let impostaCatastale = 0;
  let iva = 0;

  if (seller === "privato") {
    if (home === "prima") {
      impostaRegistro = Math.max(
        renditaNum > 0 ? valoreCatastale * 0.02 : priceNum * 0.02,
        1000
      );
    } else {
      impostaRegistro = Math.max(
        renditaNum > 0 ? valoreCatastale * 0.09 : priceNum * 0.09,
        1000
      );
    }
    impostaIpotecaria = 50;
    impostaCatastale = 50;
  } else {
    // Impresa
    iva = home === "prima" ? priceNum * 0.04 : priceNum * 0.1;
    impostaRegistro = 200;
    impostaIpotecaria = 200;
    impostaCatastale = 200;
  }

  const totalImposte =
    impostaRegistro + impostaIpotecaria + impostaCatastale + iva;

  // Notaio (stima)
  let notaio = 3000;
  if (priceNum > 300000) notaio = 5000;
  else if (priceNum > 200000) notaio = 4000;
  else if (priceNum > 100000) notaio = 3500;
  else notaio = 2500;
  if (mortgageNum > 0) notaio += 1000;

  // Agenzia
  const agenzia = priceNum * (agencyNum / 100) * 1.22; // + IVA 22%

  // Perizia + istruttoria
  const perizia = mortgageNum > 0 ? 300 : 0;
  const istruttoria = mortgageNum > 0 ? mortgageNum * 0.003 : 0;
  const impostaSostitutiva =
    mortgageNum > 0
      ? home === "prima"
        ? mortgageNum * 0.0025
        : mortgageNum * 0.02
      : 0;

  const totalSpese =
    totalImposte +
    notaio +
    agenzia +
    perizia +
    istruttoria +
    impostaSostitutiva;

  const totalComplessivo = priceNum + totalSpese;

  const selectStyle: React.CSSProperties = {
    appearance: "none",
    padding: "10px 36px 10px 14px",
    border: "2px solid #e4e4e7",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    background: `#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 12px center`,
    color: "#1a1a2e",
    cursor: "pointer",
    width: "100%",
  };

  const inputStyle: React.CSSProperties = {
    padding: "10px 14px",
    border: "2px solid #e4e4e7",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    color: "#1a1a2e",
    width: "100%",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    color: "#71717a",
    marginBottom: 6,
    display: "block",
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "3px solid #1a1a2e",
        borderRadius: 20,
        boxShadow: "6px 6px 0px #f59e0b",
        padding: "32px 32px 28px",
        marginBottom: 28,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#fef3c7",
            border: "2px solid #1a1a2e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Calculator size={22} color="#1a1a2e" />
        </div>
        <div>
          <h3
            style={{
              fontSize: 20,
              fontWeight: 800,
              margin: 0,
            }}
          >
            Calcolatore imposte e costi
          </h3>
          <p style={{ fontSize: 13, color: "#71717a", margin: 0 }}>
            Inserisci i dati per stimare tutti i costi dell&apos;acquisto
          </p>
        </div>
      </div>

      {/* Form */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <label style={labelStyle}>Prezzo immobile (€) *</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="es. 180000"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              setShowResult(false);
            }}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>
            Rendita catastale (€)
            <span
              title="La trovi nella visura catastale. Se non la conosci, lascia vuoto: il calcolo userà il prezzo"
              style={{ cursor: "help", marginLeft: 4 }}
            >
              <Info size={12} style={{ display: "inline", verticalAlign: "middle" }} />
            </span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="es. 800"
            value={rendita}
            onChange={(e) => {
              setRendita(e.target.value);
              setShowResult(false);
            }}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Acquisto da</label>
          <select
            value={seller}
            onChange={(e) => {
              setSeller(e.target.value as SellerType);
              setShowResult(false);
            }}
            style={selectStyle}
          >
            <option value="privato">Privato</option>
            <option value="impresa">Impresa (costruttore)</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Tipo immobile</label>
          <select
            value={home}
            onChange={(e) => {
              setHome(e.target.value as HomeType);
              setShowResult(false);
            }}
            style={selectStyle}
          >
            <option value="prima">Prima casa</option>
            <option value="seconda">Seconda casa</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Importo mutuo (€)</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="0 = nessun mutuo"
            value={mortgage}
            onChange={(e) => {
              setMortgage(e.target.value);
              setShowResult(false);
            }}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Agenzia (%)</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="es. 3"
            value={agencyPct}
            onChange={(e) => {
              setAgencyPct(e.target.value);
              setShowResult(false);
            }}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Calculate button */}
      <button
        onClick={calculate}
        disabled={priceNum <= 0}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          padding: "14px 24px",
          background: priceNum > 0 ? "#1a1a2e" : "#d4d4d8",
          color: priceNum > 0 ? "#fff" : "#a1a1aa",
          border: "3px solid",
          borderColor: priceNum > 0 ? "#1a1a2e" : "#d4d4d8",
          borderRadius: 12,
          fontWeight: 800,
          fontSize: 15,
          cursor: priceNum > 0 ? "pointer" : "not-allowed",
          transition: "all 0.15s",
        }}
      >
        <Calculator size={18} />
        Calcola costi
      </button>

      {/* Results */}
      {showResult && priceNum > 0 && (
        <div
          style={{
            marginTop: 24,
            paddingTop: 24,
            borderTop: "2px solid #f3f4f6",
          }}
        >
          <h4
            style={{
              fontSize: 16,
              fontWeight: 800,
              margin: "0 0 16px",
              color: "#1a1a2e",
            }}
          >
            Riepilogo costi stimati
          </h4>

          {/* Imposte */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#a1a1aa",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              Imposte
            </div>
            {seller === "impresa" && (
              <Row
                label={`IVA (${home === "prima" ? "4" : "10"}%)`}
                value={iva}
              />
            )}
            <Row label="Imposta di registro" value={impostaRegistro} />
            <Row label="Imposta ipotecaria" value={impostaIpotecaria} />
            <Row label="Imposta catastale" value={impostaCatastale} />
            {renditaNum > 0 && seller === "privato" && (
              <div
                style={{
                  fontSize: 12,
                  color: "#a1a1aa",
                  padding: "4px 0 4px 12px",
                  fontStyle: "italic",
                }}
              >
                Calcolate sul valore catastale di {formatEuro(valoreCatastale)}{" "}
                (sistema prezzo-valore)
              </div>
            )}
          </div>

          {/* Spese accessorie */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#a1a1aa",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              Spese accessorie
            </div>
            <Row label="Notaio (stima)" value={notaio} />
            {agencyNum > 0 && (
              <Row label={`Agenzia (${agencyPct}% + IVA)`} value={agenzia} />
            )}
            {mortgageNum > 0 && (
              <>
                <Row label="Perizia bancaria" value={perizia} />
                <Row label="Istruttoria mutuo" value={istruttoria} />
                <Row
                  label={`Imposta sostitutiva mutuo (${home === "prima" ? "0,25" : "2"}%)`}
                  value={impostaSostitutiva}
                />
              </>
            )}
          </div>

          {/* Totals */}
          <div
            style={{
              borderTop: "2px solid #1a1a2e",
              paddingTop: 12,
            }}
          >
            <Row
              label="Totale spese extra"
              value={totalSpese}
              bold
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0 4px",
                marginTop: 8,
                borderTop: "2px solid #f59e0b",
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 900 }}>
                Costo totale stimato
              </span>
              <span
                style={{ fontSize: 20, fontWeight: 900, color: "#f59e0b" }}
              >
                {formatEuro(totalComplessivo)}
              </span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#a1a1aa",
                marginTop: 4,
              }}
            >
              Prezzo immobile ({formatEuro(priceNum)}) + spese extra (
              {formatEuro(totalSpese)})
            </div>
          </div>

          {/* Disclaimer */}
          <p
            style={{
              fontSize: 12,
              color: "#a1a1aa",
              marginTop: 16,
              lineHeight: 1.5,
              fontStyle: "italic",
            }}
          >
            * Stime indicative basate su aliquote e fasce standard. I costi
            reali possono variare in base alla zona, al notaio scelto e alla
            banca. Per un calcolo preciso consulta il tuo notaio.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 0",
        fontSize: bold ? 15 : 14,
        fontWeight: bold ? 800 : 500,
        color: bold ? "#1a1a2e" : "#3f3f46",
      }}
    >
      <span>{label}</span>
      <span style={{ fontWeight: 700 }}>{formatEuro(value)}</span>
    </div>
  );
}
