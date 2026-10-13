 "use client";

import { useEffect, useMemo, useState } from "react";

type Ingredient = { id: string; name: string; recipe: string; note: string };
type HistoryEntry = {
  id: string;
  date: string;
  patokan: number;
  basketGross: number;
  pitcherGross: number;
  basketNet: number;
  pitcherNet: number;
  remainder: number;
  percentage: number;
  recipe: Record<string, number>;
};

const DEFAULT_TARE_BASKOM = 504;
const DEFAULT_TARE_TEKO = 170;
const DEFAULT_PATOKAN = 9044;
const HISTORY_KEY = "kosu-calculator-history-v1";
const SETTINGS_KEY = "kosu-calculator-settings-v1";

const initialIngredients: Ingredient[] = [
  { id: "fm", name: "Fresh Milk", recipe: "3784", note: "Takaran resep 1 batch" },
  { id: "creamer", name: "Creamer", recipe: "3100", note: "Takaran resep 1 batch" },
  { id: "kopi", name: "Kopi", recipe: "2160", note: "Takaran resep 1 batch" },
  { id: "richmilk", name: "Richmilk", recipe: "", note: "Isi takaran sendiri jika ingin menghitung persentase" },
  { id: "oatmilk", name: "Oatmilk", recipe: "", note: "Isi takaran sendiri jika ingin menghitung persentase" },
];

function numberValue(value: string, fallback = 0) {
  if (value.trim() === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatNumber(value: number, decimals = 2) {
  return value.toLocaleString("id-ID", { maximumFractionDigits: decimals });
}

function formatDate(dateString: string) {
  if (!dateString) return "Tanggal tidak diisi";
  const parts = dateString.split("-");
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function todayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export default function Home() {
  const [date, setDate] = useState(todayLocal());
  const [patokan, setPatokan] = useState(String(DEFAULT_PATOKAN));
  const [tareBaskom, setTareBaskom] = useState(String(DEFAULT_TARE_BASKOM));
  const [tareTeko, setTareTeko] = useState(String(DEFAULT_TARE_TEKO));
  const [basketGross, setBasketGross] = useState("");
  const [pitcherGross, setPitcherGross] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"calculator" | "history">("calculator");
  const [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState("");
  // Stok harian sengaja tidak disimpan ke localStorage agar selalu kosong saat membuka ulang.
  const [stock, setStock] = useState({
    fmUtuh: "", fmSisa: "", fmKosuSisa: "",
    creamerKotak1: "", creamerKotak2: "", creamerSisa: "", creamerKosuSisa: "",
    kopiUtuh: "", kopiSisa: "", kopiKosuSisa: "",
    richmilkUtuh: "", richmilkSisa: "",
    oatmilkUtuh: "", oatmilkSisa: "",
  });

  function updateStock(key: keyof typeof stock, value: string) {
    setStock((current) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.patokan !== undefined) setPatokan(String(settings.patokan));
        if (settings.tareBaskom !== undefined) setTareBaskom(String(settings.tareBaskom));
        if (settings.tareTeko !== undefined) setTareTeko(String(settings.tareTeko));
        if (settings.ingredients) setIngredients(settings.ingredients);
      }
    } catch {
      // Ignore malformed local data and continue with defaults.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ patokan, tareBaskom, tareTeko, ingredients }));
  }, [patokan, tareBaskom, tareTeko, ingredients, hydrated]);

  const patokanNum = numberValue(patokan);
  const basketGrossNum = basketGross.trim() === "" ? null : numberValue(basketGross);
  const pitcherGrossNum = pitcherGross.trim() === "" ? null : numberValue(pitcherGross);
  const basketNet = basketGrossNum === null ? null : basketGrossNum - numberValue(tareBaskom);
  const pitcherNet = pitcherGrossNum === null ? null : pitcherGrossNum - numberValue(tareTeko);
  const inputComplete = basketNet !== null && pitcherNet !== null;
  const inputValid = inputComplete && basketNet! >= 0 && pitcherNet! >= 0 && patokanNum > 0;
  const remainder = inputValid ? basketNet! + pitcherNet! : null;
  const percentage = remainder !== null && patokanNum > 0 ? (remainder / patokanNum) * 100 : null;

  const calculatedIngredients = useMemo(() => ingredients.map((item) => {
    const base = item.recipe.trim() === "" ? null : numberValue(item.recipe);
    return { ...item, base, result: base !== null && percentage !== null ? base * percentage / 100 : null };
  }), [ingredients, percentage]);

  function updateIngredient(id: string, recipe: string) {
    setIngredients((current) => current.map((item) => item.id === id ? { ...item, recipe } : item));
  }

  function saveEntry() {
    if (!inputValid || remainder === null || percentage === null) {
      setMessage("Isi berat baskom dan teko dengan angka yang valid terlebih dahulu.");
      return;
    }
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date,
      patokan: patokanNum,
      basketGross: basketGrossNum!,
      pitcherGross: pitcherGrossNum!,
      basketNet: basketNet!,
      pitcherNet: pitcherNet!,
      remainder,
      percentage,
      recipe: Object.fromEntries(ingredients.map((item) => [item.id, numberValue(item.recipe, NaN)]).filter(([, v]) => Number.isFinite(v))) as Record<string, number>,
    };
    setHistory((current) => [entry, ...current].sort((a, b) => b.date.localeCompare(a.date)));
    setMessage("Hitungan berhasil disimpan ke riwayat perangkat ini.");
    setActiveTab("history");
  }

  function deleteEntry(id: string) {
    setHistory((current) => current.filter((entry) => entry.id !== id));
  }

  function exportHistory() {
    const payload = JSON.stringify(history, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "riwayat-kosu.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copySummary() {
    if (!inputValid || remainder === null || percentage === null) {
      setMessage("Isi berat baskom dan teko dengan angka yang valid terlebih dahulu.");
      return;
    }
    const val = (key: keyof typeof stock) => numberValue(stock[key]);
    const has = (key: keyof typeof stock) => stock[key].trim() !== "";
    const fmt = (n: number) => formatNumber(n, 0);
    const fmTotal = val("fmUtuh") + val("fmSisa") + numberValue(ingredients.find((x) => x.id === "fm")?.recipe ?? "") + val("fmKosuSisa");
    const creamerBoxes = val("creamerKotak1") + val("creamerKotak2");
    const creamerUtuhMl = creamerBoxes * 500;
    const creamerTotal = creamerUtuhMl + val("creamerSisa") + numberValue(ingredients.find((x) => x.id === "creamer")?.recipe ?? "") + val("creamerKosuSisa");
    const kopiTotal = val("kopiUtuh") + val("kopiSisa") + numberValue(ingredients.find((x) => x.id === "kopi")?.recipe ?? "") + val("kopiKosuSisa");
    const richmilkTotal = val("richmilkUtuh") + val("richmilkSisa");
    const oatmilkTotal = val("oatmilkUtuh") + val("oatmilkSisa");
    const lines = [
      `*HITUNGAN KOSU (${formatDate(date)})*`,
      "",
      `fm utuh: ${fmt(val("fmUtuh"))}`,
      `fm sisa: ${fmt(val("fmSisa"))}`,
      `fm kosu utuh: ${fmt(numberValue(ingredients.find((x) => x.id === "fm")?.recipe ?? ""))}`,
      `fm kosu sisa: ${fmt(val("fmKosuSisa"))}`,
      `total: ${fmt(fmTotal)}`,
      "",
      `creamer utuh: ${val("creamerKotak1")}+${val("creamerKotak2")}=${creamerBoxes} ${creamerBoxes}x500=${fmt(creamerUtuhMl)}`,
      `creamer sisa: ${fmt(val("creamerSisa"))}`,
      `creamer kosu utuh: ${fmt(numberValue(ingredients.find((x) => x.id === "creamer")?.recipe ?? ""))}`,
      `creamer kosu sisa: ${fmt(val("creamerKosuSisa"))}`,
      `total: ${fmt(creamerUtuhMl)}+${fmt(val("creamerSisa"))}+${fmt(numberValue(ingredients.find((x) => x.id === "creamer")?.recipe ?? ""))}+${fmt(val("creamerKosuSisa"))}=${fmt(creamerTotal)}`,
      "",
      `kopi utuh: ${fmt(val("kopiUtuh"))}`,
      `kopi sisa: ${fmt(val("kopiSisa"))}`,
      `kopi kosu utuh: ${fmt(numberValue(ingredients.find((x) => x.id === "kopi")?.recipe ?? ""))}`,
      `kopi kosu sisa: ${fmt(val("kopiKosuSisa"))}`,
      `total: ${fmt(kopiTotal)}`,
      "",
      `richmilk utuh: ${fmt(val("richmilkUtuh"))}`,
      `richmilk sisa: ${fmt(val("richmilkSisa"))}`,
      `total: ${fmt(richmilkTotal)}`,
      "",
      `oatmilk utuh: ${fmt(val("oatmilkUtuh"))}`,
      `oatmilk sisa: ${fmt(val("oatmilkSisa"))}`,
      `total: ${fmt(oatmilkTotal)}`,
    ];
    // Input kosong ditampilkan sebagai 0 di laporan, dan tidak diingat untuk hitungan berikutnya.
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setMessage("Laporan stok berhasil disalin. Kolom stok tetap kosong saat membuka ulang website.");
    } catch {
      setMessage("Gagal menyalin otomatis. Pastikan website dibuka melalui HTTPS.");
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">K</div>
          <div>
            <p className="eyebrow">INVENTORY TOOL</p>
            <h1>Kosu <span>Calculator</span></h1>
          </div>
        </div>
        <div className="local-pill"><span className="status-dot" /> Tersimpan lokal</div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">DAILY BATCH TRACKER</p>
          <h2>Hitung lebih cepat.<br /><span>Kerja lebih ringan.</span></h2>
          <p className="hero-subtitle">Masukkan hasil timbang baskom dan teko. Berat kemasan, total Kosu sisa, persentase, dan hasil resep dihitung otomatis.</p>
        </div>
        <div className="hero-stat">
          <span>Patokan Kosu utuh</span>
          <strong>{formatNumber(patokanNum, 0)}</strong>
          <small>gram Â· bisa diubah</small>
        </div>
      </section>

      <nav className="tabs" aria-label="Navigasi aplikasi">
        <button className={activeTab === "calculator" ? "tab active" : "tab"} onClick={() => setActiveTab("calculator")}> <span>â—‰</span> Kalkulator </button>
        <button className={activeTab === "history" ? "tab active" : "tab"} onClick={() => setActiveTab("history")}> <span>â—·</span> Riwayat <b>{history.length}</b></button>
      </nav>

      {activeTab === "calculator" ? (
        <div className="content-grid">
          <section className="panel main-panel">
            <div className="section-heading">
              <div><p className="eyebrow">01 / INPUT TIMBANGAN</p><h3>Hitung Kosu sisa</h3></div>
              <span className="step-tag">2 wadah</span>
            </div>
            <div className="field date-field">
              <label htmlFor="date">Tanggal hitungan</label>
              <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="weigh-grid">
              <div className="weigh-card">
                <div className="weigh-title"><div className="icon-box">â–¤</div><div><h4>Baskom</h4><p>Berat wadah {formatNumber(numberValue(tareBaskom), 0)} gr</p></div></div>
                <div className="field"><label htmlFor="basketGross">Berat baskom + isi</label><div className="input-unit"><input id="basketGross" type="number" min="0" inputMode="decimal" placeholder="Contoh: 2.702" value={basketGross} onChange={(e) => setBasketGross(e.target.value)} /><span>gr</span></div></div>
                <div className="net-line"><span>Berat bersih</span><strong>{basketNet === null ? "â€”" : basketNet < 0 ? "Cek angka" : `${formatNumber(basketNet)} gr`}</strong></div>
              </div>
              <div className="weigh-card">
                <div className="weigh-title"><div className="icon-box">â–±</div><div><h4>Teko</h4><p>Berat wadah {formatNumber(numberValue(tareTeko), 0)} gr</p></div></div>
                <div className="field"><label htmlFor="pitcherGross">Berat teko + isi</label><div className="input-unit"><input id="pitcherGross" type="number" min="0" inputMode="decimal" placeholder="Contoh: 1.120" value={pitcherGross} onChange={(e) => setPitcherGross(e.target.value)} /><span>gr</span></div></div>
                <div className="net-line"><span>Berat bersih</span><strong>{pitcherNet === null ? "â€”" : pitcherNet < 0 ? "Cek angka" : `${formatNumber(pitcherNet)} gr`}</strong></div>
              </div>
            </div>

            <div className="field patokan-field">
              <label htmlFor="patokan">Patokan Kosu utuh (gram)</label>
              <input id="patokan" type="number" min="1" inputMode="decimal" value={patokan} onChange={(e) => setPatokan(e.target.value)} />
              <small>Default 9.044. Ubah hanya jika patokan batch berubah.</small>
            </div>

            <div className="result-card">
              <div className="result-top"><div><p className="eyebrow">HASIL HITUNG</p><h3>Total Kosu sisa</h3></div><div className="result-icon">â†—</div></div>
              <div className="result-number">{remainder === null ? "â€”" : inputValid ? formatNumber(remainder) : "Periksa input"} <span>gram</span></div>
              <div className="formula-row"><span>Baskom bersih</span><strong>{basketNet === null || basketNet < 0 ? "â€”" : formatNumber(basketNet)} gr</strong></div>
              <div className="formula-row"><span>Teko bersih</span><strong>{pitcherNet === null || pitcherNet < 0 ? "â€”" : formatNumber(pitcherNet)} gr</strong></div>
              <div className="formula-row total"><span>Persentase Kosu sisa</span><strong>{percentage === null || !inputValid ? "â€”" : `${formatNumber(percentage)}%`}</strong></div>
              <p className="formula-note">Persentase = (baskom bersih + teko bersih) Ã· patokan Kosu utuh Ã— 100%</p>
            </div>

            <div className="action-row">
              <button className="button button-primary" onClick={saveEntry} disabled={!inputValid}>Simpan ke riwayat <span>â†—</span></button>
              <button className="button button-secondary" onClick={copySummary} disabled={!inputValid}>Salin hasil</button>
            </div>
            {message && <p className="message" role="status">{message}</p>}
          </section>

          <section className="panel recipe-panel">
            <div className="section-heading">
              <div><p className="eyebrow">02 / HASIL RESEP</p><h3>Persentase ke bahan</h3></div>
              <span className="step-tag">Editable</span>
            </div>
            <p className="panel-intro">Persentase Kosu diterapkan ke takaran 1 batch. Takaran bisa diubah. Bahan tanpa rumus yang dikonfirmasi dibiarkan kosong.</p>
            <div className="recipe-list">
              {calculatedIngredients.map((item) => (
                <div className="recipe-item" key={item.id}>
                  <div className="recipe-item-head"><div><h4>{item.name}</h4><p>{item.note}</p></div><span className="ingredient-symbol">{item.id === "fm" ? "FM" : item.id === "creamer" ? "CR" : item.id === "kopi" ? "KP" : item.id === "richmilk" ? "RM" : "OM"}</span></div>
                  <div className="field"><label htmlFor={`recipe-${item.id}`}>Takaran resep 1 batch</label><div className="input-unit"><input id={`recipe-${item.id}`} type="number" min="0" inputMode="decimal" placeholder="Isi takaran" value={item.recipe} onChange={(e) => updateIngredient(item.id, e.target.value)} /><span>gr / ml</span></div></div>
                  <div className="recipe-result"><span>Hasil Ã— {percentage === null || !inputValid ? "â€”" : `${formatNumber(percentage)}%`}</span><strong>{item.result === null || !inputValid ? "â€”" : formatNumber(item.result)}</strong></div>
                </div>
              ))}
            </div>
            <div className="hint-box"><span>i</span><p>Richmilk dan oatmilk tidak memiliki takaran resep default karena rumusnya belum dikonfirmasi. Masukkan sendiri jika ingin menghitung hasil persentasenya.</p></div>
          </section>

          <section className="panel stock-panel">
            <div className="section-heading">
              <div><p className="eyebrow">03 / LAPORAN STOK</p><h3>Input stok harian</h3></div>
              <span className="step-tag">Selalu kosong</span>
            </div>
            <p className="panel-intro">Isi stok hari ini. Kolom stok tidak disimpan dan akan kosong kembali saat website dibuka ulang. Takaran Kosu utuh diambil dari resep di atas.</p>
            <div className="stock-grid">
              <div className="stock-card"><h4>Fresh Milk</h4>
                <div className="field"><label>FM utuh</label><input type="number" min="0" inputMode="decimal" placeholder="0" value={stock.fmUtuh} onChange={(e) => updateStock("fmUtuh", e.target.value)} /></div>
                <div className="field"><label>FM sisa</label><input type="number" min="0" inputMode="decimal" placeholder="0" value={stock.fmSisa} onChange={(e) => updateStock("fmSisa", e.target.value)} /></div>
                <div className="field"><label>FM Kosu sisa</label><input type="number" min="0" inputMode="decimal" placeholder="0" value={stock.fmKosuSisa} onChange={(e) => updateStock("fmKosuSisa", e.target.value)} /></div>
              </div>
              <div className="stock-card"><h4>Creamer</h4>
                <div className="stock-two"><div className="field"><label>Kotak 500 ml #1</label><input type="number" min="0" inputMode="numeric" placeholder="0" value={stock.creamerKotak1} onChange={(e) => updateStock("creamerKotak1", e.target.value)} /></div><div className="field"><label>Kotak 500 ml #2</label><input type="number" min="0" inputMode="numeric" placeholder="0" value={stock.creamerKotak2} onChange={(e) => updateStock("creamerKotak2", e.target.value)} /></div></div>
                <div className="field"><label>Creamer sisa</label><input type="number" min="0" inputMode="decimal" placeholder="0" value={stock.creamerSisa} onChange={(e) => updateStock("creamerSisa", e.target.value)} /></div>
                <div className="field"><label>Creamer Kosu sisa</label><input type="number" min="0" inputMode="decimal" placeholder="0" value={stock.creamerKosuSisa} onChange={(e) => updateStock("creamerKosuSisa", e.target.value)} /></div>
              </div>
              <div className="stock-card"><h4>Kopi</h4>
                <div className="field"><label>Kopi utuh</label><input type="number" min="0" inputMode="decimal" placeholder="0" value={stock.kopiUtuh} onChange={(e) => updateStock("kopiUtuh", e.target.value)} /></div>
                <div className="field"><label>Kopi sisa</label><input type="number" min="0" inputMode="decimal" placeholder="0" value={stock.kopiSisa} onChange={(e) => updateStock("kopiSisa", e.target.value)} /></div>
                <div className="field"><label>Kopi Kosu sisa</label><input type="number" min="0" inputMode="decimal" placeholder="0" value={stock.kopiKosuSisa} onChange={(e) => updateStock("kopiKosuSisa", e.target.value)} /></div>
              </div>
              <div className="stock-card"><h4>Richmilk</h4>
                <div className="field"><label>Richmilk utuh</label><input type="number" min="0" inputMode="decimal" placeholder="0" value={stock.richmilkUtuh} onChange={(e) => updateStock("richmilkUtuh", e.target.value)} /></div>
                <div className="field"><label>Richmilk sisa</label><input type="number" min="0" inputMode="decimal" placeholder="0" value={stock.richmilkSisa} onChange={(e) => updateStock("richmilkSisa", e.target.value)} /></div>
              </div>
              <div className="stock-card"><h4>Oatmilk</h4>
                <div className="field"><label>Oatmilk utuh</label><input type="number" min="0" inputMode="decimal" placeholder="0" value={stock.oatmilkUtuh} onChange={(e) => updateStock("oatmilkUtuh", e.target.value)} /></div>
                <div className="field"><label>Oatmilk sisa</label><input type="number" min="0" inputMode="decimal" placeholder="0" value={stock.oatmilkSisa} onChange={(e) => updateStock("oatmilkSisa", e.target.value)} /></div>
              </div>
            </div>
            <div className="action-row"><button className="button button-primary" onClick={copySummary} disabled={!inputValid}>Salin laporan stok <span>â†—</span></button></div>
            {message && <p className="message" role="status">{message}</p>}
          </section>
        </div>
      ) : (
        <section className="panel history-panel">
          <div className="section-heading history-heading">
            <div><p className="eyebrow">SAVED ON THIS DEVICE</p><h3>Riwayat hitungan</h3><p className="panel-intro">Riwayat hanya tersimpan di browser/perangkat ini.</p></div>
            <div className="history-actions">
              <button className="button button-secondary" onClick={exportHistory} disabled={history.length === 0}>Ekspor JSON</button>
              <button className="button button-secondary danger-button" onClick={() => { if (window.confirm("Hapus semua riwayat di perangkat ini?")) setHistory([]); }} disabled={history.length === 0}>Hapus semua</button>
            </div>
          </div>
          {history.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">â—·</div><h4>Belum ada riwayat</h4><p>Simpan hitungan dari tab Kalkulator untuk melihatnya di sini.</p><button className="button button-primary" onClick={() => setActiveTab("calculator")}>Mulai hitung</button></div>
          ) : (
            <div className="history-list">
              {history.map((entry) => (
                <article className="history-entry" key={entry.id}>
                  <div className="history-date"><span>{formatDate(entry.date)}</span><small>Patokan {formatNumber(entry.patokan, 0)}</small></div>
                  <div className="history-metric"><small>Kosu sisa</small><strong>{formatNumber(entry.remainder)} gr</strong></div>
                  <div className="history-metric"><small>Persentase</small><strong className="green-text">{formatNumber(entry.percentage)}%</strong></div>
                  <button className="icon-button" aria-label={`Hapus riwayat ${formatDate(entry.date)}`} onClick={() => deleteEntry(entry.id)}>Ã—</button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <footer className="footer"><span>â—ˆ KOSU CALCULATOR</span><span>Dark mode Â· Mobile ready Â· Local storage</span></footer>
    </main>
  );
}
