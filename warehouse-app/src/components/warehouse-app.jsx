import { useState, useEffect, useRef, createContext, useContext } from "react";
import {
  Archive, Package, Snowflake, Home, Wrench, Shirt, Plus, Minus, X, Camera,
  AlertTriangle, Trash2, Settings, Check, Loader2, Barcode, ShoppingCart,
  CheckCircle2, XCircle, ImageOff, RotateCcw, Globe, Users, Copy, LogOut
} from "lucide-react";
import { LANGS, tFactory } from "./translations.js";
import * as cloud from "./sync.js";

const LangContext = createContext((k) => k);
function useT() { return useContext(LangContext); }

/* ---------------------------------------------------------------
   Constants
--------------------------------------------------------------- */

const KIND_ICON = { pantry: Archive, fridge: Package, freezer: Snowflake, other: Home };

const FOOD_CATEGORIES = [
  { id: "snacks", kind: "pantry" }, { id: "grains", kind: "pantry" }, { id: "canned", kind: "pantry" },
  { id: "baking", kind: "pantry" }, { id: "bread", kind: "pantry" }, { id: "dairy", kind: "fridge" },
  { id: "produce", kind: "fridge" }, { id: "meat_fresh", kind: "fridge" }, { id: "condiments", kind: "fridge" },
  { id: "beverages", kind: "fridge" }, { id: "leftovers", kind: "fridge" }, { id: "frozen_veg", kind: "freezer" },
  { id: "frozen_meat", kind: "freezer" }, { id: "frozen_meals", kind: "freezer" },
];

// Categories where "how full is the container" usually matters more than a piece count.
const LEVEL_CATEGORIES = new Set(["grains", "baking", "beverages", "condiments"]);

const UNITS = ["pcs", "g", "kg", "ml", "l"];
const AMOUNT_STEP = { pcs: 1, g: 50, ml: 50, kg: 0.25, l: 0.25 };

const TOOL_CATEGORIES = ["hand", "power", "painting", "plumbing", "electrical", "garden", "safety"];

const JOBS = [
  { id: "shelf", toolKeys: ["drill", "level", "screwdriver", "tape_measure", "wall_anchors"] },
  { id: "faucet", toolKeys: ["adjustable_wrench", "plumbers_tape", "screwdriver", "bucket"] },
  { id: "paint", toolKeys: ["paint_roller", "paint_brush", "painters_tape", "drop_cloth", "ladder"] },
  { id: "furniture", toolKeys: ["screwdriver", "allen_key_set", "rubber_mallet"] },
  { id: "tire", toolKeys: ["jack", "lug_wrench", "tire_gauge"] },
  { id: "electrical", toolKeys: ["voltage_tester", "wire_strippers", "screwdriver", "electrical_tape"] },
];

const CLOTHING_CATEGORIES = ["tops", "bottoms", "outerwear", "dresses", "shoes", "accessories"];

// Displays a translated name for seed/demo data (via nameKey), or the literal
// name the person typed for anything they added themselves.
function displayName(obj, t) {
  return obj.nameKey ? t(obj.nameKey) : obj.name;
}

// createdAt keeps ordering stable across devices: locations oldest-first,
// everything else newest-first.
const seedAsc = (list) => list.map((it, i) => ({ ...it, createdAt: i }));
const seedDesc = (list) => list.map((it, i) => ({ ...it, createdAt: list.length - i }));

const DEFAULT_LOCATIONS = seedAsc([
  { id: "loc_pantry", nameKey: "loc_pantry", kind: "pantry" },
  { id: "loc_fridge", nameKey: "loc_fridge", kind: "fridge" },
  { id: "loc_freezer", nameKey: "loc_freezer", kind: "freezer" },
  { id: "loc_cellar", nameKey: "loc_cellar", kind: "other" },
]);

const inDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

const DEFAULT_FOOD = seedDesc([
  { id: "f1", nameKey: "food_frozen_peas", category: "frozen_veg", location: "loc_freezer", quantity: 1, unit: "kg", expiry: inDays(120) },
  { id: "f2", nameKey: "food_whole_milk", category: "dairy", location: "loc_fridge", quantity: 2, unit: "pcs", trackLevel: true, level: 60, expiry: inDays(3) },
  { id: "f3", nameKey: "food_potato_chips", category: "snacks", location: "loc_pantry", quantity: 2, unit: "pcs", expiry: inDays(60) },
  { id: "f4", nameKey: "food_greek_yogurt", category: "dairy", location: "loc_fridge", quantity: 4, unit: "pcs", expiry: inDays(1) },
]);

const DEFAULT_TOOLS = seedDesc([
  { id: "t1", key: "drill", category: "power", owned: true },
  { id: "t2", key: "screwdriver", category: "hand", owned: true },
  { id: "t3", key: "level", category: "hand", owned: true },
  { id: "t4", key: "tape_measure", category: "hand", owned: true },
  { id: "t5", key: "adjustable_wrench", category: "hand", owned: false },
  { id: "t6", key: "ladder", category: "safety", owned: true },
  { id: "t7", key: "paint_roller", category: "painting", owned: false },
]);

const DEFAULT_CLOTHING = seedDesc([
  { id: "c1", name: "Denim Jacket", category: "outerwear", color: "#3F5B8C", photo: null, status: "clean" },
  { id: "c2", name: "White Tee", category: "tops", color: "#e8e5dc", photo: null, status: "dirty" },
  { id: "c3", name: "Running Shoes", category: "shoes", color: "#4a453c", photo: null, status: "clean" },
]);

const EMPTY_DATA = { locations: [], food: [], tools: [], clothing: [] };

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function sortCol(col, list) {
  const dir = col === "locations" ? 1 : -1;
  return [...list].sort((a, b) => dir * ((a.createdAt || 0) - (b.createdAt || 0)));
}

const normalizeCode = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
const formatCode = (code) => code.replace(/(.{5})(?=.)/g, "$1-");
const errorDetail = (e) => (e && (e.code || e.message)) || "";

/* ---------------------------------------------------------------
   Storage helpers (Claude artifact storage, falls back to localStorage)
--------------------------------------------------------------- */

const hasClaudeStorage = typeof window !== "undefined" && !!window.storage;

async function loadKey(key, fallback) {
  try {
    if (hasClaudeStorage) {
      const res = await window.storage.get(key);
      return res && res.value ? JSON.parse(res.value) : fallback;
    }
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
async function saveKey(key, value) {
  try {
    if (hasClaudeStorage) { await window.storage.set(key, JSON.stringify(value)); }
    else { window.localStorage.setItem(key, JSON.stringify(value)); }
  } catch { /* noop */ }
}

/* ---------------------------------------------------------------
   Domain logic
--------------------------------------------------------------- */

const round2 = (n) => Math.round(n * 100) / 100;

// Take `amount` out of an item. Returns the updated item, or null when nothing is left.
function applyConsume(item, amount) {
  const remaining = round2((item.quantity || 0) - amount);
  return remaining <= 0 ? null : { ...item, quantity: remaining };
}

// Set how full the open container is. At 0 the container is used up: the next
// one (if any) starts at 100%, otherwise the item is finished (null).
function applyLevel(item, level) {
  if (level > 0) return { ...item, level };
  const containers = (item.quantity || 1) - 1;
  return containers <= 0 ? null : { ...item, quantity: containers, level: 100 };
}

function expiryStatus(dateStr) {
  if (!dateStr) return { tone: "neutral", kind: "no_date", days: null };
  const days = Math.ceil((new Date(dateStr) - new Date(new Date().toDateString())) / 86400000);
  if (days < 0) return { tone: "danger", kind: "expired", days };
  if (days === 0) return { tone: "danger", kind: "today", days };
  if (days <= 3) return { tone: "warn", kind: "days_left", days };
  return { tone: "ok", kind: "fresh", days };
}

function expiryLabel(t, st) {
  if (st.kind === "no_date") return t("stamp_no_date");
  if (st.kind === "expired") return t("stamp_expired");
  if (st.kind === "today") return t("stamp_today");
  if (st.kind === "days_left") return t("stamp_days_left", { d: st.days });
  return t("stamp_fresh");
}

const OFF_RULES = [
  { kw: ["ice-cream", "ice cream", "sorbet", "frozen-desserts", "frozen-meals", "ready-meals"], cat: "frozen_meals" },
  { kw: ["frozen-vegetables", "frozen-fruits", "frozen"], cat: "frozen_veg" },
  { kw: ["frozen-meats", "frozen-fish"], cat: "frozen_meat" },
  { kw: ["dairies", "milk", "cheese", "yogurt", "cream", "eggs"], cat: "dairy" },
  { kw: ["fresh-vegetables", "fresh-fruits", "vegetables", "fruits"], cat: "produce" },
  { kw: ["meats", "poultry", "fish-and-fish-products", "seafood"], cat: "meat_fresh" },
  { kw: ["breads", "bakery", "viennoiseries"], cat: "bread" },
  { kw: ["snacks", "chips", "crisps", "biscuits", "cookies", "candies", "chocolates"], cat: "snacks" },
  { kw: ["beverages", "drinks", "waters", "sodas", "juices", "coffees", "teas"], cat: "beverages" },
  { kw: ["sauces", "condiments", "ketchups", "mustards", "spreads"], cat: "condiments" },
  { kw: ["pastas", "rices", "cereals", "flours"], cat: "grains" },
  { kw: ["spices", "herbs", "baking"], cat: "baking" },
  { kw: ["canned", "tinned", "jarred", "preserved"], cat: "canned" },
];

function guessCategoryFromTags(tagsStr) {
  const s = (tagsStr || "").toLowerCase();
  for (const rule of OFF_RULES) if (rule.kw.some((k) => s.includes(k))) return rule.cat;
  return null;
}

function suggestedLocation(categoryId, locations) {
  const cat = FOOD_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return null;
  return locations.find((l) => l.kind === cat.kind) || null;
}

function resizeImage(file, maxSize = 320, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.onerror = reject;
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------------------------------------------------------------
   Barcode scanning + public product databases
--------------------------------------------------------------- */

// "granted" | "denied" | "prompt". Safari has no Permissions API for the camera,
// so it reports "prompt" and the browser asks on first use.
async function cameraPermission() {
  try {
    const status = await navigator.permissions.query({ name: "camera" });
    return status.state;
  } catch {
    return "prompt";
  }
}

// Starts reading barcodes from the camera into `video`. Uses the browser's native
// BarcodeDetector when available (Chrome/Android) and falls back to ZXing
// (Safari, iOS, other WebViews). Resolves to a function that stops the camera.
async function startBarcodeScanner(video, onCode) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("unsupported");

  if ("BarcodeDetector" in window) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
    video.srcObject = stream;
    await video.play();

    const wanted = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"];
    let formats = wanted;
    try {
      const supported = await window.BarcodeDetector.getSupportedFormats();
      formats = wanted.filter((f) => supported.includes(f));
    } catch { /* use defaults */ }
    const detector = formats.length ? new window.BarcodeDetector({ formats }) : new window.BarcodeDetector();

    let active = true;
    const tick = async () => {
      if (!active) return;
      try {
        const codes = await detector.detect(video);
        if (codes.length > 0) { onCode(codes[0].rawValue); return; }
      } catch { /* keep trying */ }
      if (active) requestAnimationFrame(tick);
    };
    tick();

    return () => {
      active = false;
      stream.getTracks().forEach((tr) => tr.stop());
      video.srcObject = null;
    };
  }

  const { BrowserMultiFormatReader } = await import("@zxing/browser");
  const reader = new BrowserMultiFormatReader();
  const controls = await reader.decodeFromVideoDevice(undefined, video, (result) => {
    if (result) onCode(result.getText());
  });
  return () => controls.stop();
}

// Public, free, CORS-enabled product databases (same API, different catalogues).
const PRODUCT_DATABASES = ["world.openfoodfacts.org", "world.openproductsfacts.org"];

// Returns the product, null if no database knows the barcode, or throws if none could be reached.
async function lookupBarcode(code) {
  let unreachable = 0;
  for (const host of PRODUCT_DATABASES) {
    try {
      const res = await fetch(`https://${host}/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,generic_name,brands,categories_tags,categories`);
      if (!res.ok) { if (res.status !== 404) unreachable += 1; continue; }
      const data = await res.json();
      if (data.status === 1 && data.product) return data.product;
    } catch {
      unreachable += 1;
    }
  }
  if (unreachable === PRODUCT_DATABASES.length) throw new Error("network");
  return null;
}

/* ---------------------------------------------------------------
   Small shared UI
--------------------------------------------------------------- */

function Stamp({ children, tone = "neutral" }) {
  return <span className={`stamp stamp-${tone}`}>{children}</span>;
}

function Chip({ active, onClick, icon: Icon, children }) {
  return (
    <button className={`chip ${active ? "chip-active" : ""}`} onClick={onClick} type="button">
      {Icon && <Icon size={13} strokeWidth={2.3} />}
      {children}
    </button>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="empty">
      <Icon size={30} strokeWidth={1.5} />
      <div className="empty-title">{title}</div>
      <div className="empty-sub">{subtitle}</div>
    </div>
  );
}

function Sheet({ title, onClose, children, accent }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" style={{ "--accent": accent }} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <span className="sheet-title">{title}</span>
          <button className="icon-btn" onClick={onClose} type="button"><X size={18} /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

/* ---------------------------------------------------------------
   Food domain
--------------------------------------------------------------- */

// Slider for "how much is left in the container I'm using". The parent gives it a
// `key` that includes the saved level, so it resets whenever the value changes
// (including when someone else in the family changes it).
function LevelSlider({ value, onCommit }) {
  const t = useT();
  const [draft, setDraft] = useState(value);
  const dirty = useRef(false);

  function commit() {
    if (!dirty.current) return;
    dirty.current = false;
    if (draft === 0 && !window.confirm(t("level_finish_confirm"))) { setDraft(value); return; }
    onCommit(draft);
  }

  return (
    <div className="level">
      <div className="level-top"><span>{t("level_label")}</span><span className="mono">{draft}%</span></div>
      <input
        className="level-range" type="range" min="0" max="100" step="5" value={draft}
        aria-label={t("level_label")}
        onChange={(e) => { dirty.current = true; setDraft(Number(e.target.value)); }}
        onPointerUp={commit} onTouchEnd={commit} onMouseUp={commit} onKeyUp={commit}
      />
      <div className="level-scale"><span>{t("level_empty")}</span><span>{t("level_full")}</span></div>
    </div>
  );
}

function FoodTicket({ item, location, onDelete, onUse, onLevel }) {
  const t = useT();
  const st = expiryStatus(item.expiry);
  const cat = FOOD_CATEGORIES.find((c) => c.id === item.category);
  const unitLabel = item.unit === "pcs" ? t("unit_pcs") : item.unit;
  return (
    <div className="ticket">
      <div className="ticket-row">
        <div>
          <div className="ticket-name">{displayName(item, t)}</div>
          <div className="ticket-meta">{cat ? t(`cat_${cat.id}`) : t("uncategorized")} · {location ? displayName(location, t) : "—"}</div>
        </div>
        <button className="icon-btn ghost" onClick={() => onDelete(item.id)} type="button" aria-label="Remove item"><Trash2 size={15} /></button>
      </div>

      {item.trackLevel && (
        <LevelSlider key={`${item.id}-${item.level ?? 100}`} value={item.level ?? 100} onCommit={(v) => onLevel(item.id, v)} />
      )}

      <div className="ticket-row bottom">
        <span className="mono">{item.quantity} {unitLabel}</span>
        <div className="ticket-actions">
          {!item.trackLevel && (
            <button className="btn btn-ghost small" onClick={() => onUse(item.id)} type="button"><Minus size={13} /> {t("use_btn")}</button>
          )}
          <Stamp tone={st.tone}>{expiryLabel(t, st)}</Stamp>
        </div>
      </div>
    </div>
  );
}

// Remove an amount Y from an item that has X (pieces, grams, litres…).
function ConsumeSheet({ item, onClose, onApply, accent }) {
  const t = useT();
  const step = AMOUNT_STEP[item.unit] || 1;
  const [amount, setAmount] = useState(step);
  const amt = Number(amount) || 0;
  const remaining = round2(item.quantity - amt);
  const finishes = amt > 0 && remaining <= 0;
  const unitLabel = item.unit === "pcs" ? t("unit_pcs") : item.unit;

  return (
    <Sheet title={t("consume_title")} onClose={onClose} accent={accent}>
      <div className="consume">
        <div>
          <div className="consume-name">{displayName(item, t)}</div>
          <div className="consume-stock mono">{item.quantity} {unitLabel}</div>
        </div>

        <div className="field">
          <span className="field-label">{t("consume_amount")}</span>
          <div className="stepper">
            <button className="icon-btn step-btn" type="button" onClick={() => setAmount(Math.max(0, round2(amt - step)))}><Minus size={16} /></button>
            <input className="input" type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button className="icon-btn step-btn" type="button" onClick={() => setAmount(round2(amt + step))}><Plus size={16} /></button>
          </div>
        </div>

        {finishes
          ? <div className="warn-box"><AlertTriangle size={16} />{t("consume_finishes")}</div>
          : <div className="inline-note mono">{t("consume_remaining", { n: Math.max(remaining, 0), unit: unitLabel })}</div>}

        <button className="btn btn-primary" type="button" disabled={amt <= 0} onClick={() => { onApply(amt); onClose(); }}>
          {t("consume_confirm_btn")}
        </button>
      </div>
    </Sheet>
  );
}

function CameraDialog({ onAllow, onCancel, accent }) {
  const t = useT();
  return (
    <div className="dialog-overlay">
      <div className="dialog" role="dialog" aria-modal="true" style={{ "--accent": accent }}>
        <div className="dialog-icon"><Camera size={26} /></div>
        <div className="dialog-title">{t("cam_title")}</div>
        <p className="dialog-body">{t("cam_body")}</p>
        <div className="dialog-actions">
          <button className="btn btn-ghost" type="button" onClick={onCancel}>{t("cam_not_now")}</button>
          <button className="btn btn-accent" type="button" onClick={onAllow}>{t("cam_allow")}</button>
        </div>
      </div>
    </div>
  );
}

function AddFoodModal({ locations, onClose, onAdd, accent }) {
  const t = useT();
  const [mode, setMode] = useState("manual");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("pcs");
  const [locationId, setLocationId] = useState("");
  const [expiry, setExpiry] = useState("");
  const [trackLevel, setTrackLevel] = useState(false);
  const [barcode, setBarcode] = useState("");

  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [camDialog, setCamDialog] = useState(false);
  const videoRef = useRef(null);
  const stopRef = useRef(null);
  const handledRef = useRef(false);

  const suggested = category ? suggestedLocation(category, locations) : null;
  const chosen = locations.find((l) => l.id === locationId);
  const mismatch = suggested && chosen && chosen.id !== suggested.id;

  useEffect(() => () => { if (stopRef.current) stopRef.current(); }, []);

  function applyCategory(newCategory) {
    setCategory(newCategory);
    setTrackLevel(LEVEL_CATEGORIES.has(newCategory));
    const s = suggestedLocation(newCategory, locations);
    if (s) setLocationId(s.id);
  }

  function stopScan() {
    if (stopRef.current) { stopRef.current(); stopRef.current = null; }
    setScanning(false);
  }

  // Entry point for the camera: skips the popup if permission is already granted.
  async function requestCamera() {
    if (stopRef.current) return;
    setScanError("");
    const state = await cameraPermission();
    if (state === "granted") await startScan();
    else if (state === "denied") setScanError(t("cam_denied"));
    else setCamDialog(true);
  }

  async function startScan() {
    if (stopRef.current) return;
    setScanError("");
    handledRef.current = false;
    try {
      stopRef.current = await startBarcodeScanner(videoRef.current, handleCode);
      setScanning(true);
    } catch (e) {
      if (e && e.message === "unsupported") setScanError(t("scan_err_unsupported"));
      else if (e && (e.name === "NotAllowedError" || e.name === "SecurityError")) setScanError(t("cam_denied"));
      else setScanError(t("scan_err_camera", { msg: (e && e.message) || "" }));
    }
  }

  async function handleCode(code) {
    if (handledRef.current) return;
    handledRef.current = true;
    stopScan();
    await lookup(code);
  }

  async function lookup(code) {
    setLookupLoading(true);
    setScanError("");
    setBarcode(code);
    try {
      const p = await lookupBarcode(code);
      if (!p) { setScanError(t("scan_err_no_product")); return; }
      setName(p.product_name || p.generic_name || p.brands || code);
      const guess = guessCategoryFromTags(p.categories_tags ? p.categories_tags.join(" ") : p.categories || "");
      if (guess) applyCategory(guess);
      setMode("manual");
    } catch {
      setScanError(t("scan_err_lookup_fail"));
    } finally {
      setLookupLoading(false);
    }
  }

  function submit() {
    if (!name.trim() || !locationId) return;
    const qty = Number(quantity) || 1;
    const item = {
      id: uid(), name: name.trim(), category, location: locationId, expiry,
      quantity: trackLevel ? Math.max(1, Math.round(qty)) : qty,
      unit: trackLevel ? "pcs" : unit,
    };
    if (trackLevel) { item.trackLevel = true; item.level = 100; }
    if (barcode) item.barcode = barcode;
    onAdd(item);
    onClose();
  }

  return (
    <>
      <Sheet title={t("add_food_title")} onClose={onClose} accent={accent}>
        <div className="seg">
          <button className={`seg-btn ${mode === "manual" ? "seg-active" : ""}`} onClick={() => { stopScan(); setMode("manual"); }} type="button">{t("mode_manual")}</button>
          <button className={`seg-btn ${mode === "scan" ? "seg-active" : ""}`} onClick={() => { setMode("scan"); requestCamera(); }} type="button">
            <Barcode size={14} /> {t("mode_scan")}
          </button>
        </div>

        <div className="scan-block" hidden={mode !== "scan"}>
          <div className={`camera-wrap ${scanning ? "" : "camera-off"}`}>
            <video ref={videoRef} className="camera-video" muted playsInline />
            <div className="scan-line" />
            <button className="btn btn-danger" onClick={stopScan} type="button">{t("stop_camera")}</button>
          </div>
          {!scanning && (
            <button className="btn btn-accent" onClick={requestCamera} type="button" disabled={lookupLoading}>
              <Camera size={16} /> {t("start_camera")}
            </button>
          )}
          {lookupLoading && <div className="inline-note"><Loader2 size={14} className="spin" /> {t("looking_up")}</div>}
          {scanError && <div className="warn-box"><AlertTriangle size={14} />{scanError}</div>}
          <div className="or-row">{t("or_type_barcode")}</div>
          <div className="row-inline">
            <input className="input" inputMode="numeric" placeholder="e.g. 7622210951309" value={manualBarcode} onChange={(e) => setManualBarcode(e.target.value)} />
            <button className="btn btn-accent" type="button" disabled={!manualBarcode || lookupLoading} onClick={() => lookup(manualBarcode.trim())}>{t("look_up_btn")}</button>
          </div>
        </div>

        {mode === "manual" && (
          <div className="form">
            <Field label={t("field_name")}>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name_placeholder_food")} />
            </Field>
            <Field label={t("field_category")}>
              <select className="input" value={category} onChange={(e) => applyCategory(e.target.value)}>
                <option value="">{t("choose_category")}</option>
                {FOOD_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{t(`cat_${c.id}`)}</option>)}
              </select>
            </Field>
            <div className="row-inline">
              <Field label={t("field_quantity")}>
                <input className="input" type="number" min="0" step={trackLevel ? "1" : "any"} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </Field>
              {!trackLevel && (
                <Field label={t("field_unit")}>
                  <select className="input" value={unit} onChange={(e) => setUnit(e.target.value)}>
                    {UNITS.map((u) => <option key={u} value={u}>{u === "pcs" ? t("unit_pcs") : u}</option>)}
                  </select>
                </Field>
              )}
            </div>
            <label className="check-row">
              <input type="checkbox" checked={trackLevel} onChange={(e) => setTrackLevel(e.target.checked)} />
              <span>{t("track_level")}</span>
            </label>
            <Field label={t("field_location")}>
              <select className="input" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                <option value="">{t("choose_location")}</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{displayName(l, t)}</option>)}
              </select>
            </Field>

            {mismatch && (
              <div className="warn-box">
                <AlertTriangle size={16} />
                <div>
                  {t("mismatch_text", { cat: t(`cat_${category}`), loc: displayName(suggested, t) })} {t("mismatch_note")}
                  <div className="warn-actions">
                    <button className="btn btn-ghost small" type="button" onClick={() => setLocationId(suggested.id)}>{t("use_instead_btn", { loc: displayName(suggested, t) })}</button>
                  </div>
                </div>
              </div>
            )}

            <Field label={t("field_expiry")}>
              <input className="input" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            </Field>

            <button className="btn btn-primary" type="button" disabled={!name.trim() || !locationId} onClick={submit}>{t("add_to_warehouse_btn")}</button>
          </div>
        )}
      </Sheet>

      {camDialog && (
        <CameraDialog
          accent={accent}
          onCancel={() => setCamDialog(false)}
          onAllow={() => { setCamDialog(false); startScan(); }}
        />
      )}
    </>
  );
}

function FoodTab({ locations, foodItems, onAdd, onDelete, onUpdate, accent }) {
  const t = useT();
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [consumeId, setConsumeId] = useState(null);

  const expiring = foodItems.filter((f) => ["danger", "warn"].includes(expiryStatus(f.expiry).tone));
  const visible = foodItems.filter((f) => {
    if (filter === "all") return true;
    if (filter === "expiring") return ["danger", "warn"].includes(expiryStatus(f.expiry).tone);
    return f.location === filter;
  });

  const grouped = locations.map((l) => ({ location: l, items: visible.filter((f) => f.location === l.id) })).filter((g) => g.items.length > 0 || filter === g.location.id);
  const consuming = consumeId ? foodItems.find((f) => f.id === consumeId) : null;

  const ticket = (it, location) => (
    <FoodTicket
      key={it.id} item={it} location={location} onDelete={onDelete}
      onUse={setConsumeId}
      onLevel={(id, level) => onUpdate(id, (cur) => applyLevel(cur, level))}
    />
  );

  return (
    <div className="tab-pane">
      {expiring.length > 0 && (
        <div className="banner" onClick={() => setFilter("expiring")}>
          <AlertTriangle size={15} />
          {expiring.length} {t("banner_attention")}
        </div>
      )}
      <div className="chip-row">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>{t("filter_all")}</Chip>
        <Chip active={filter === "expiring"} onClick={() => setFilter("expiring")} icon={AlertTriangle}>{t("filter_expiring")}</Chip>
        {locations.map((l) => <Chip key={l.id} active={filter === l.id} onClick={() => setFilter(l.id)} icon={KIND_ICON[l.kind]}>{displayName(l, t)}</Chip>)}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Package} title={t("food_empty_title")} subtitle={t("food_empty_sub")} />
      ) : filter === "all" || filter === "expiring" ? (
        grouped.map((g) => g.items.length > 0 && (
          <div key={g.location.id} className="group">
            <div className="group-title">{displayName(g.location, t)}</div>
            <div className="ticket-list">
              {g.items.map((it) => ticket(it, g.location))}
            </div>
          </div>
        ))
      ) : (
        <div className="ticket-list">
          {visible.map((it) => ticket(it, locations.find((l) => l.id === it.location)))}
        </div>
      )}

      <button className="fab" style={{ "--accent": accent }} onClick={() => setShowAdd(true)} type="button" aria-label="Add food"><Plus size={22} /></button>
      {showAdd && <AddFoodModal locations={locations} onClose={() => setShowAdd(false)} onAdd={onAdd} accent={accent} />}
      {consuming && (
        <ConsumeSheet
          item={consuming} accent={accent} onClose={() => setConsumeId(null)}
          onApply={(amt) => onUpdate(consuming.id, (cur) => applyConsume(cur, amt))}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   Tools domain
--------------------------------------------------------------- */

function AddToolModal({ onClose, onAdd, accent }) {
  const t = useT();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("hand");
  const [owned, setOwned] = useState(true);
  function submit() {
    if (!name.trim()) return;
    onAdd({ id: uid(), name: name.trim(), category, owned });
    onClose();
  }
  return (
    <Sheet title={t("add_tool_title")} onClose={onClose} accent={accent}>
      <div className="form">
        <Field label={t("field_name")}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name_placeholder_tool")} />
        </Field>
        <Field label={t("field_category")}>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {TOOL_CATEGORIES.map((c) => <option key={c} value={c}>{t(`tcat_${c}`)}</option>)}
          </select>
        </Field>
        <div className="seg">
          <button className={`seg-btn ${owned ? "seg-active" : ""}`} type="button" onClick={() => setOwned(true)}>{t("own_this")}</button>
          <button className={`seg-btn ${!owned ? "seg-active" : ""}`} type="button" onClick={() => setOwned(false)}>{t("need_to_buy")}</button>
        </div>
        <button className="btn btn-primary" type="button" disabled={!name.trim()} onClick={submit}>{t("add_tool_title")}</button>
      </div>
    </Sheet>
  );
}

function toolDisplayName(tool, t) {
  return tool.key ? t(`tool_${tool.key}`) : tool.name;
}

function JobChecklist({ tools, accent }) {
  const t = useT();
  const [jobId, setJobId] = useState("");
  const job = JOBS.find((j) => j.id === jobId);
  const ownedKeys = new Set(tools.filter((tl) => tl.owned && tl.key).map((tl) => tl.key));
  const missing = job ? job.toolKeys.filter((k) => !ownedKeys.has(k)) : [];

  return (
    <div className="job-block" style={{ "--accent": accent }}>
      <div className="group-title">{t("job_check_title")}</div>
      <select className="input" value={jobId} onChange={(e) => setJobId(e.target.value)}>
        <option value="">{t("pick_job")}</option>
        {JOBS.map((j) => <option key={j.id} value={j.id}>{t(`job_${j.id}`)}</option>)}
      </select>
      {job && (
        <>
          <div className="job-list">
            {job.toolKeys.map((k) => {
              const have = ownedKeys.has(k);
              return (
                <div key={k} className="job-row">
                  {have ? <CheckCircle2 size={16} className="tone-ok" /> : <XCircle size={16} className="tone-danger" />}
                  <span className={have ? "" : "strike-muted"}>{t(`tool_${k}`)}</span>
                </div>
              );
            })}
          </div>
          {missing.length === 0 ? (
            <div className="summary-ok"><Check size={14} /> {t("job_all_set")}</div>
          ) : (
            <div className="summary-warn"><ShoppingCart size={14} /> {t("job_buy_or_borrow", { list: missing.map((k) => t(`tool_${k}`)).join(", ") })}</div>
          )}
        </>
      )}
    </div>
  );
}

function ToolsTab({ tools, onAdd, onToggle, onDelete, accent }) {
  const t = useT();
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const visible = filter === "all" ? tools : tools.filter((tl) => tl.category === filter);

  return (
    <div className="tab-pane">
      <div className="chip-row">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>{t("filter_all")}</Chip>
        {TOOL_CATEGORIES.map((c) => <Chip key={c} active={filter === c} onClick={() => setFilter(c)}>{t(`tcat_${c}`)}</Chip>)}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Wrench} title={t("tools_empty_title")} subtitle={t("tools_empty_sub")} />
      ) : (
        <div className="ticket-list">
          {visible.map((tl) => (
            <div key={tl.id} className="ticket">
              <div className="ticket-row">
                <div>
                  <div className="ticket-name">{toolDisplayName(tl, t)}</div>
                  <div className="ticket-meta">{t(`tcat_${tl.category}`)}</div>
                </div>
                <button className="icon-btn ghost" onClick={() => onDelete(tl.id)} type="button" aria-label="Remove tool"><Trash2 size={15} /></button>
              </div>
              <div className="ticket-row bottom">
                <button className="stamp-btn" onClick={() => onToggle(tl.id)} type="button">
                  <Stamp tone={tl.owned ? "ok" : "danger"}>{tl.owned ? t("stamp_owned") : t("stamp_need_buy")}</Stamp>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <JobChecklist tools={tools} accent={accent} />

      <button className="fab" style={{ "--accent": accent }} onClick={() => setShowAdd(true)} type="button" aria-label="Add tool"><Plus size={22} /></button>
      {showAdd && <AddToolModal onClose={() => setShowAdd(false)} onAdd={onAdd} accent={accent} />}
    </div>
  );
}

/* ---------------------------------------------------------------
   Clothing domain
--------------------------------------------------------------- */

function AddClothingModal({ onClose, onAdd, accent }) {
  const t = useT();
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CLOTHING_CATEGORIES[0]);
  const [color, setColor] = useState("#3F5B8C");
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try { setPhoto(await resizeImage(file)); } finally { setBusy(false); }
  }

  function submit() {
    if (!name.trim()) return;
    onAdd({ id: uid(), name: name.trim(), category, color, photo, status: "clean" });
    onClose();
  }

  return (
    <Sheet title={t("add_clothing_title")} onClose={onClose} accent={accent}>
      <div className="form">
        <div className="photo-upload">
          {photo ? <img src={photo} alt="" className="photo-preview" /> : <div className="photo-placeholder"><ImageOff size={22} /></div>}
          <label className="btn btn-ghost small file-btn">
            {busy ? t("processing_photo") : t("choose_photo")}
            <input type="file" accept="image/*" hidden onChange={handleFile} />
          </label>
        </div>
        <Field label={t("field_name")}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name_placeholder_clothing")} />
        </Field>
        <Field label={t("field_category")}>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CLOTHING_CATEGORIES.map((c) => <option key={c} value={c}>{t(`ccat_${c}`)}</option>)}
          </select>
        </Field>
        <Field label={t("field_color")}>
          <input className="input color-input" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </Field>
        <button className="btn btn-primary" type="button" disabled={!name.trim()} onClick={submit}>{t("add_to_wardrobe_btn")}</button>
      </div>
    </Sheet>
  );
}

function ClothingTab({ items, onAdd, onToggle, onDelete, accent }) {
  const t = useT();
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const visible = items.filter((c) => (catFilter === "all" || c.category === catFilter) && (statusFilter === "all" || c.status === statusFilter));
  const dirtyCount = items.filter((c) => c.status === "dirty").length;

  return (
    <div className="tab-pane">
      <div className="stats-row">
        <div className="stat"><span className="stat-num">{items.length}</span><span className="stat-label">{t("cloth_stat_total")}</span></div>
        <div className="stat"><span className="stat-num">{items.length - dirtyCount}</span><span className="stat-label">{t("cloth_stat_ready")}</span></div>
        <div className="stat"><span className="stat-num">{dirtyCount}</span><span className="stat-label">{t("cloth_stat_dirty")}</span></div>
      </div>
      <div className="chip-row">
        <Chip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>{t("filter_all")}</Chip>
        <Chip active={statusFilter === "clean"} onClick={() => setStatusFilter("clean")}>{t("cloth_stat_ready")}</Chip>
        <Chip active={statusFilter === "dirty"} onClick={() => setStatusFilter("dirty")}>{t("cloth_stat_dirty")}</Chip>
      </div>
      <div className="chip-row">
        <Chip active={catFilter === "all"} onClick={() => setCatFilter("all")}>{t("filter_all_types")}</Chip>
        {CLOTHING_CATEGORIES.map((c) => <Chip key={c} active={catFilter === c} onClick={() => setCatFilter(c)}>{t(`ccat_${c}`)}</Chip>)}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Shirt} title={t("food_empty_title")} subtitle={t("cloth_empty_sub")} />
      ) : (
        <div className="cloth-grid">
          {visible.map((c) => (
            <div key={c.id} className="cloth-card">
              <div className="cloth-photo" style={{ background: c.photo ? "transparent" : c.color }}>
                {c.photo ? <img src={c.photo} alt={c.name} /> : <Shirt size={26} color="rgba(255,255,255,0.85)" />}
                <button className="icon-btn ghost overlay-btn" onClick={() => onDelete(c.id)} type="button" aria-label="Remove"><Trash2 size={13} /></button>
              </div>
              <div className="cloth-name">{c.name}</div>
              <div className="cloth-meta">{t(`ccat_${c.category}`)}</div>
              <button className="stamp-btn" onClick={() => onToggle(c.id)} type="button">
                <Stamp tone={c.status === "clean" ? "ok" : "warn"}>{c.status === "clean" ? t("stamp_ready") : t("stamp_dirty")}</Stamp>
              </button>
            </div>
          ))}
        </div>
      )}

      <button className="fab" style={{ "--accent": accent }} onClick={() => setShowAdd(true)} type="button" aria-label="Add clothing"><Plus size={22} /></button>
      {showAdd && <AddClothingModal onClose={() => setShowAdd(false)} onAdd={onAdd} accent={accent} />}
    </div>
  );
}

/* ---------------------------------------------------------------
   Family sharing + locations settings
--------------------------------------------------------------- */

function FamilyCard({ configured, householdId, status, busy, messageKey, messageDetail, onCreate, onJoin, onLeave }) {
  const t = useT();
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(formatCode(householdId));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  }

  return (
    <div className="family-card">
      <div className="family-head"><Users size={17} /> {t("family_title")}</div>

      {!configured && <div className="warn-box"><AlertTriangle size={16} />{t("family_not_configured")}</div>}

      {configured && !householdId && (
        <>
          <div className="family-desc">{t("family_desc")}</div>
          <button className="btn btn-primary" type="button" disabled={busy} onClick={onCreate}>
            {busy ? <Loader2 size={15} className="spin" /> : <Users size={15} />} {t("family_create")}
          </button>
          <div className="row-inline">
            <input className="input code-input" value={code} maxLength={14} placeholder={t("family_code_placeholder")} onChange={(e) => setCode(e.target.value)} />
            <button className="btn btn-accent" type="button" disabled={busy || normalizeCode(code).length < 6} onClick={() => onJoin(code)}>{t("family_join")}</button>
          </div>
        </>
      )}

      {configured && householdId && (
        <>
          <div className="family-desc">
            {status === "connecting" && <Loader2 size={13} className="spin inline-icon" />}
            {t("family_connected")}
          </div>
          <div className="code-box">
            <span className="code-text">{formatCode(householdId)}</span>
            <button className="btn btn-ghost small" type="button" onClick={copy}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {t("family_copy")}
            </button>
          </div>
          {status === "error" && <div className="warn-box"><AlertTriangle size={16} />{t("family_error")}</div>}
          <button className="btn btn-ghost small" type="button" onClick={onLeave}><LogOut size={14} /> {t("family_leave")}</button>
        </>
      )}

      {messageKey && (
        <div className="warn-box">
          <AlertTriangle size={16} />
          <div>
            {t(messageKey)}
            {messageDetail && <div className="error-code mono">{messageDetail}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function LocationsTab({ locations, foodItems, onAdd, onDelete, onReset, family }) {
  const t = useT();
  const [name, setName] = useState("");
  const [kind, setKind] = useState("pantry");

  function submit() {
    if (!name.trim()) return;
    onAdd({ id: uid(), name: name.trim(), kind });
    setName("");
  }

  function tryDelete(id) {
    if (foodItems.some((f) => f.location === id)) {
      window.alert(t("delete_location_blocked_alert"));
      return;
    }
    onDelete(id);
  }

  return (
    <div className="tab-pane">
      <FamilyCard {...family} />

      <div className="group-title">{t("locations_title")}</div>
      <div className="ticket-list">
        {locations.map((l) => {
          const Icon = KIND_ICON[l.kind];
          return (
            <div key={l.id} className="loc-row">
              <Icon size={17} />
              <div className="loc-info">
                <div className="ticket-name">{displayName(l, t)}</div>
                <div className="ticket-meta">{t(`kind_placement_${l.kind}`)}</div>
              </div>
              <button className="icon-btn ghost" onClick={() => tryDelete(l.id)} type="button" aria-label="Delete location"><Trash2 size={15} /></button>
            </div>
          );
        })}
      </div>

      <div className="group-title">{t("add_location_title")}</div>
      <div className="form">
        <Field label={t("field_name")}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name_placeholder_location")} />
        </Field>
        <Field label={t("field_behaves_like")}>
          <select className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="pantry">{t("kind_full_pantry")}</option>
            <option value="fridge">{t("kind_full_fridge")}</option>
            <option value="freezer">{t("kind_full_freezer")}</option>
            <option value="other">{t("kind_full_other")}</option>
          </select>
        </Field>
        <button className="btn btn-primary" type="button" disabled={!name.trim()} onClick={submit}>{t("add_location_btn")}</button>
      </div>

      {onReset && (
        <button className="btn btn-ghost small reset-btn" type="button" onClick={onReset}><RotateCcw size={13} /> {t("reset_demo_btn")}</button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   App shell
--------------------------------------------------------------- */

export default function WarehouseApp() {
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState("en");
  const [data, setData] = useState(EMPTY_DATA);
  const [tab, setTab] = useState("food");

  // Family sync: householdId === null means local-only mode.
  const [householdId, setHouseholdId] = useState(null);
  const [live, setLive] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [syncDetail, setSyncDetail] = useState("");

  useEffect(() => {
    (async () => {
      const [locs, food, tls, cloth, savedLang, savedHid] = await Promise.all([
        loadKey("wh_locations", DEFAULT_LOCATIONS),
        loadKey("wh_food", DEFAULT_FOOD),
        loadKey("wh_tools", DEFAULT_TOOLS),
        loadKey("wh_clothing", DEFAULT_CLOTHING),
        loadKey("wh_lang", "en"),
        loadKey("wh_household", null),
      ]);
      const useCloud = Boolean(cloud.isConfigured && savedHid);
      setData(useCloud ? EMPTY_DATA : { locations: locs, food, tools: tls, clothing: cloth });
      setLang(savedLang);
      if (useCloud) setHouseholdId(savedHid);
      setLoading(false);
    })();
  }, []);

  // Live listeners while connected to a family group.
  useEffect(() => {
    if (!householdId) return undefined;
    let cancelled = false;
    let stop = null;

    cloud.subscribe(
      householdId,
      (col, items) => {
        if (cancelled) return;
        setData((d) => ({ ...d, [col]: items }));
        setLive(true);
        setSyncError(false);
      },
      (err) => { console.error("[Warehouse] live sync error:", err); if (!cancelled) setSyncError(true); },
    )
      .then((unsubscribe) => { if (cancelled) unsubscribe(); else stop = unsubscribe; })
      .catch((err) => { console.error("[Warehouse] live sync failed to start:", err); if (!cancelled) setSyncError(true); });

    return () => { cancelled = true; if (stop) stop(); };
  }, [householdId]);

  const t = tFactory(lang);

  function changeLang(code) {
    setLang(code);
    saveKey("wh_lang", code);
  }

  /* ---- data operations: same API for local mode and family mode ---- */

  function syncFailed(err) {
    console.error("[Warehouse] sync write failed:", err);
    setSyncError(true);
  }

  function writeLocal(col, list) {
    setData((d) => ({ ...d, [col]: list }));
    saveKey(`wh_${col}`, list);
  }

  function addItem(col, item) {
    const full = { ...item, createdAt: Date.now() };
    if (householdId) cloud.setItem(householdId, col, full).catch(syncFailed);
    else writeLocal(col, [...data[col], full]);
  }

  // fn(currentItem) returns the new item, or null to delete it.
  function updateItem(col, id, fn) {
    const current = data[col].find((i) => i.id === id);
    if (!current) return;
    const next = fn(current);
    if (householdId) {
      const op = next ? cloud.setItem(householdId, col, next) : cloud.removeItem(householdId, col, id);
      op.catch(syncFailed);
    } else {
      writeLocal(col, data[col].flatMap((i) => (i.id !== id ? [i] : next ? [next] : [])));
    }
  }

  function resetDemo() {
    writeLocal("locations", DEFAULT_LOCATIONS);
    writeLocal("food", DEFAULT_FOOD);
    writeLocal("tools", DEFAULT_TOOLS);
    writeLocal("clothing", DEFAULT_CLOTHING);
  }

  /* ---- family group management ---- */

  async function createGroup() {
    setSyncBusy(true);
    setSyncMsg("");
    setSyncDetail("");
    try {
      const code = cloud.generateCode();
      await cloud.createHousehold(code, data);
      await saveKey("wh_household", code);
      setLive(false);
      setSyncError(false);
      setHouseholdId(code);
    } catch (e) {
      console.error("[Warehouse] creating the family group failed:", e);
      setSyncMsg("family_error");
      setSyncDetail(errorDetail(e));
    } finally {
      setSyncBusy(false);
    }
  }

  async function joinGroup(rawCode) {
    const code = normalizeCode(rawCode);
    if (!code || !window.confirm(t("family_join_confirm"))) return;
    setSyncBusy(true);
    setSyncMsg("");
    setSyncDetail("");
    try {
      if (!(await cloud.householdExists(code))) { setSyncMsg("family_not_found"); return; }
      await saveKey("wh_household", code);
      setData(EMPTY_DATA);
      setLive(false);
      setSyncError(false);
      setHouseholdId(code);
    } catch (e) {
      console.error("[Warehouse] joining the family group failed:", e);
      setSyncMsg("family_error");
      setSyncDetail(errorDetail(e));
    } finally {
      setSyncBusy(false);
    }
  }

  function leaveGroup() {
    if (!window.confirm(t("family_leave_confirm"))) return;
    Object.keys(EMPTY_DATA).forEach((col) => saveKey(`wh_${col}`, data[col]));
    saveKey("wh_household", null);
    setLive(false);
    setSyncError(false);
    setSyncMsg("");
    setSyncDetail("");
    setHouseholdId(null);
  }

  const syncStatus = !householdId ? "local" : syncError ? "error" : live ? "live" : "connecting";

  const locations = sortCol("locations", data.locations);
  const foodItems = sortCol("food", data.food);
  const tools = sortCol("tools", data.tools);
  const clothing = sortCol("clothing", data.clothing);

  const family = {
    configured: cloud.isConfigured, householdId, status: syncStatus, busy: syncBusy, messageKey: syncMsg, messageDetail: syncDetail,
    onCreate: createGroup, onJoin: joinGroup, onLeave: leaveGroup,
  };

  const TABS = [
    { id: "food", label: t("nav_food"), icon: Package, accent: "var(--food)" },
    { id: "tools", label: t("nav_tools"), icon: Wrench, accent: "var(--tools)" },
    { id: "clothing", label: t("nav_wardrobe"), icon: Shirt, accent: "var(--clothing)" },
    { id: "locations", label: t("nav_locations"), icon: Settings, accent: "var(--ink)" },
  ];

  return (
    <LangContext.Provider value={t}>
      <div className="app-root">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

          .app-root {
            --bg: #E9E5DB; --surface: #FFFFFF; --surface-alt: #F3F0E8; --ink: #221F1A; --ink-soft: #766F60;
            --line: #D7D0BF; --food: #3F6B4F; --tools: #B5651D; --clothing: #3F5B8C;
            --danger: #C1443C; --warn: #C97F1E; --ok: #3F6B4F;
            font-family: 'Inter', sans-serif; color: var(--ink); background: var(--bg);
            max-width: 440px; width: 100%; margin: 0 auto; min-height: 100vh; min-height: 100dvh; position: relative;
            display: flex; flex-direction: column; padding-bottom: 76px; box-sizing: border-box;
          }
          .app-root * { box-sizing: border-box; }
          .mono { font-family: 'JetBrains Mono', monospace; }

          .app-header { padding: calc(22px + env(safe-area-inset-top)) calc(18px + env(safe-area-inset-right)) 12px calc(18px + env(safe-area-inset-left)); display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
          .wordmark { font-family: 'Anton', sans-serif; font-size: 26px; letter-spacing: 1.5px; line-height: 1; }
          .tagline { font-size: 12px; color: var(--ink-soft); margin-top: 4px; letter-spacing: 0.3px; }
          .header-right { display: flex; align-items: center; gap: 8px; }
          .lang-picker { display: flex; align-items: center; gap: 5px; background: var(--surface); border: 1px solid var(--line);
            border-radius: 8px; padding: 5px 6px; }
          .lang-select { border: none; background: none; font-size: 12px; font-weight: 600; color: var(--ink); max-width: 92px; }
          .lang-select:focus { outline: none; }
          .sync-pill { display: flex; align-items: center; gap: 6px; background: var(--surface); border: 1px solid var(--line);
            border-radius: 8px; padding: 7px 8px; color: var(--ink); cursor: pointer; }
          .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--warn); }
          .dot-live { background: var(--ok); } .dot-error { background: var(--danger); }

          .banner { margin: 0 18px 10px; background: #FBE9D8; border: 1px solid #ECC48D; color: #8A4B0E;
            padding: 10px 12px; border-radius: 10px; font-size: 13px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 600; }

          .tab-pane { padding: 4px calc(18px + env(safe-area-inset-right)) 12px calc(18px + env(safe-area-inset-left)); flex: 1; }

          .chip-row { display: flex; gap: 7px; overflow-x: auto; padding: 6px 0 12px; }
          .chip-row::-webkit-scrollbar { display: none; }
          .chip { flex: none; display: flex; align-items: center; gap: 5px; padding: 7px 12px; border-radius: 999px;
            border: 1px solid var(--line); background: var(--surface); font-size: 12.5px; font-weight: 600; color: var(--ink-soft);
            cursor: pointer; white-space: nowrap; }
          .chip-active { background: var(--ink); border-color: var(--ink); color: #fff; }

          .group { margin-bottom: 6px; }
          .group-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--ink-soft); margin: 14px 0 8px; }

          .ticket-list { display: flex; flex-direction: column; gap: 10px; }
          .ticket { position: relative; background: var(--surface); border: 1px solid var(--line); border-left: 3px dashed var(--line);
            border-radius: 10px; padding: 12px 14px; }
          .ticket-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
          .ticket-row.bottom { margin-top: 8px; }
          .ticket-actions { display: flex; align-items: center; gap: 8px; }
          .ticket-name { font-weight: 700; font-size: 14.5px; }
          .ticket-meta { font-size: 12px; color: var(--ink-soft); margin-top: 2px; }

          .level { margin: 10px 0 2px; }
          .level-top { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; color: var(--ink-soft); }
          .level-range { width: 100%; height: 24px; margin: 4px 0 0; accent-color: var(--food); cursor: pointer; }
          .level-scale { display: flex; justify-content: space-between; font-size: 10.5px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.4px; }

          .stamp { display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 700;
            letter-spacing: 0.6px; padding: 3px 8px; border-radius: 4px; border: 1.5px solid; transform: rotate(-3deg); }
          .stamp-ok { color: var(--ok); border-color: var(--ok); background: rgba(63,107,79,0.08); }
          .stamp-warn { color: var(--warn); border-color: var(--warn); background: rgba(201,127,30,0.1); }
          .stamp-danger { color: var(--danger); border-color: var(--danger); background: rgba(193,68,60,0.09); }
          .stamp-neutral { color: var(--ink-soft); border-color: var(--line); }
          .stamp-btn { background: none; border: none; padding: 0; cursor: pointer; }

          .icon-btn { background: none; border: none; color: var(--ink-soft); cursor: pointer; padding: 4px; border-radius: 6px; display: flex; }
          .icon-btn.ghost:hover { background: var(--surface-alt); color: var(--danger); }

          .loc-row { display: flex; align-items: center; gap: 10px; background: var(--surface); border: 1px solid var(--line);
            border-radius: 10px; padding: 11px 13px; }
          .loc-info { flex: 1; }

          .stats-row { display: flex; gap: 10px; margin: 6px 0 12px; }
          .stat { flex: 1; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 10px; text-align: center; }
          .stat-num { display: block; font-family: 'Anton', sans-serif; font-size: 20px; }
          .stat-label { font-size: 11px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.4px; }

          .cloth-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .cloth-card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 10px; }
          .cloth-photo { position: relative; width: 100%; aspect-ratio: 1; border-radius: 8px; overflow: hidden;
            display: flex; align-items: center; justify-content: center; margin-bottom: 8px; }
          .cloth-photo img { width: 100%; height: 100%; object-fit: cover; }
          .overlay-btn { position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.35); color: #fff; }
          .overlay-btn:hover { background: rgba(0,0,0,0.55); color: #fff; }
          .cloth-name { font-weight: 700; font-size: 13px; }
          .cloth-meta { font-size: 11px; color: var(--ink-soft); margin: 1px 0 6px; }

          .job-block { margin-top: 18px; background: var(--surface-alt); border: 1px solid var(--line); border-radius: 12px; padding: 14px; }
          .job-list { display: flex; flex-direction: column; gap: 7px; margin: 10px 0; }
          .job-row { display: flex; align-items: center; gap: 8px; font-size: 13.5px; }
          .tone-ok { color: var(--ok); flex: none; } .tone-danger { color: var(--danger); flex: none; }
          .strike-muted { color: var(--ink-soft); }
          .summary-ok { color: var(--ok); font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
          .summary-warn { color: var(--danger); font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }

          .empty { text-align: center; padding: 40px 20px; color: var(--ink-soft); }
          .empty-title { font-weight: 700; margin-top: 10px; color: var(--ink); }
          .empty-sub { font-size: 13px; margin-top: 3px; }

          .fab { position: fixed; bottom: calc(84px + env(safe-area-inset-bottom)); right: calc(50% - 220px + 18px + env(safe-area-inset-right)); width: 52px; height: 52px; border-radius: 50%;
            background: var(--accent, var(--ink)); color: #fff; border: none; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 6px 16px rgba(0,0,0,0.25); cursor: pointer; }
          @media (max-width: 480px) { .fab { right: calc(18px + env(safe-area-inset-right)); } }

          .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; max-width: 440px; margin: 0 auto; background: var(--surface);
            border-top: 1px solid var(--line); display: flex; padding: 8px calc(6px + env(safe-area-inset-right)) calc(8px + env(safe-area-inset-bottom)) calc(6px + env(safe-area-inset-left)); }
          .nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; background: none; border: none;
            color: var(--ink-soft); font-size: 10.5px; font-weight: 600; padding: 6px 0; cursor: pointer; border-radius: 8px; }
          .nav-btn.active { color: var(--accent); }

          .overlay { position: fixed; inset: 0; background: rgba(20,18,14,0.45); display: flex; align-items: flex-end; z-index: 50; }
          .sheet { background: var(--surface); width: 100%; max-width: 440px; margin: 0 auto; border-radius: 18px 18px 0 0;
            max-height: 88vh; overflow-y: auto; animation: slideup 0.18s ease-out; }
          @keyframes slideup { from { transform: translateY(24px); opacity: 0.6; } to { transform: translateY(0); opacity: 1; } }
          .sheet-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid var(--line);
            position: sticky; top: 0; background: var(--surface); z-index: 1; }
          .sheet-title { font-family: 'Anton', sans-serif; font-size: 17px; letter-spacing: 0.4px; }
          .sheet-body { padding: 16px 18px calc(26px + env(safe-area-inset-bottom)); }

          .form { display: flex; flex-direction: column; gap: 12px; }
          .field { display: flex; flex-direction: column; gap: 5px; flex: 1; }
          .field-label { font-size: 12px; font-weight: 700; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.4px; }
          .input { border: 1px solid var(--line); border-radius: 8px; padding: 10px 11px; font-size: 14px; font-family: inherit;
            background: var(--surface); color: var(--ink); width: 100%; }
          .input:focus { outline: 2px solid var(--accent, var(--ink)); outline-offset: 1px; }
          .code-input { font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 1px; }
          .color-input { padding: 3px; height: 40px; cursor: pointer; }
          .row-inline { display: flex; gap: 10px; }
          .check-row { display: flex; align-items: center; gap: 9px; font-size: 13.5px; font-weight: 600; cursor: pointer; }
          .check-row input { width: 18px; height: 18px; accent-color: var(--accent, var(--ink)); }

          .consume { display: flex; flex-direction: column; gap: 14px; }
          .consume-name { font-weight: 700; font-size: 17px; }
          .consume-stock { font-size: 13px; color: var(--ink-soft); margin-top: 2px; }
          .stepper { display: flex; align-items: center; gap: 8px; }
          .step-btn { width: 42px; height: 42px; flex: none; border: 1px solid var(--line); border-radius: 8px; background: var(--surface-alt);
            color: var(--ink); align-items: center; justify-content: center; }

          .seg { display: flex; background: var(--surface-alt); border-radius: 9px; padding: 3px; gap: 3px; margin-bottom: 12px; }
          .seg-btn { flex: 1; border: none; background: none; padding: 8px 6px; border-radius: 7px; font-size: 12.5px; font-weight: 700;
            color: var(--ink-soft); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; }
          .seg-active { background: var(--surface); color: var(--ink); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

          .btn { border: none; border-radius: 9px; padding: 11px 16px; font-size: 14px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 7px; font-family: inherit; }
          .btn:disabled { opacity: 0.45; cursor: not-allowed; }
          .btn-primary { background: var(--ink); color: #fff; }
          .btn-accent { background: var(--accent, var(--ink)); color: #fff; }
          .btn-danger { background: var(--danger); color: #fff; margin-top: 10px; }
          .btn-ghost { background: var(--surface-alt); color: var(--ink); }
          .btn.small { padding: 7px 12px; font-size: 12.5px; }
          .reset-btn { margin-top: 18px; }
          .file-btn { position: relative; }

          .scan-block { display: flex; flex-direction: column; gap: 10px; }
          .scan-block[hidden] { display: none; }
          .camera-wrap { position: relative; border-radius: 12px; overflow: hidden; background: #000; }
          .camera-off { display: none; }
          .camera-video { width: 100%; display: block; aspect-ratio: 4/3; object-fit: cover; }
          .scan-line { position: absolute; left: 8%; right: 8%; top: 50%; height: 2px; background: #FF5B4C; box-shadow: 0 0 8px #FF5B4C; }
          .camera-wrap .btn { position: absolute; bottom: 10px; left: 10px; right: 10px; margin-top: 0; }
          .inline-note { font-size: 12.5px; color: var(--ink-soft); display: flex; align-items: center; gap: 6px; }
          .inline-icon { display: inline-block; vertical-align: -2px; margin-right: 5px; }
          .or-row { text-align: center; font-size: 11.5px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
          .spin { animation: spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }

          .warn-box { display: flex; gap: 9px; background: #FBE9D8; border: 1px solid #ECC48D; color: #8A4B0E;
            padding: 10px 12px; border-radius: 10px; font-size: 12.5px; line-height: 1.4; }
          .warn-box svg { flex: none; margin-top: 1px; }
          .warn-actions { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }

          .dialog-overlay { position: fixed; inset: 0; background: rgba(20,18,14,0.55); display: flex; align-items: center;
            justify-content: center; padding: 24px; z-index: 60; }
          .dialog { background: var(--surface); border-radius: 16px; padding: 22px 20px 18px; max-width: 340px; width: 100%;
            text-align: center; animation: pop 0.16s ease-out; }
          @keyframes pop { from { transform: scale(0.94); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          .dialog-icon { width: 52px; height: 52px; border-radius: 50%; background: var(--surface-alt); color: var(--accent, var(--ink));
            display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; }
          .dialog-title { font-family: 'Anton', sans-serif; font-size: 18px; letter-spacing: 0.4px; }
          .dialog-body { font-size: 13.5px; color: var(--ink-soft); line-height: 1.45; margin: 8px 0 16px; }
          .dialog-actions { display: flex; gap: 10px; }
          .dialog-actions .btn { flex: 1; }

          .family-card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 14px;
            margin-bottom: 6px; display: flex; flex-direction: column; gap: 10px; }
          .family-head { display: flex; align-items: center; gap: 8px; font-weight: 700; }
          .error-code { margin-top: 4px; font-size: 11px; opacity: 0.85; word-break: break-all; }
          .family-desc { font-size: 12.5px; color: var(--ink-soft); line-height: 1.4; }
          .code-box { display: flex; align-items: center; justify-content: space-between; gap: 10px; background: var(--surface-alt);
            border: 1px dashed var(--line); border-radius: 10px; padding: 10px 12px; }
          .code-text { font-family: 'JetBrains Mono', monospace; font-size: 17px; font-weight: 700; letter-spacing: 2px; }

          .photo-upload { display: flex; align-items: center; gap: 12px; }
          .photo-preview { width: 64px; height: 64px; border-radius: 10px; object-fit: cover; }
          .photo-placeholder { width: 64px; height: 64px; border-radius: 10px; background: var(--surface-alt); color: var(--ink-soft);
            display: flex; align-items: center; justify-content: center; }

          .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 10px; color: var(--ink-soft); }
        `}</style>

        {loading ? (
          <div className="loading-screen"><Loader2 size={22} className="spin" /> {t("loading_text")}</div>
        ) : (
          <>
            <div className="app-header">
              <div>
                <div className="wordmark">WAREHOUSE</div>
                <div className="tagline">{t("tagline")}</div>
              </div>
              <div className="header-right">
                {householdId && (
                  <button className="sync-pill" type="button" title={t("family_title")} onClick={() => setTab("locations")}>
                    <Users size={14} /><span className={`dot dot-${syncStatus}`} />
                  </button>
                )}
                <div className="lang-picker" title={t("language_title")}>
                  <Globe size={14} />
                  <select className="lang-select" value={lang} onChange={(e) => changeLang(e.target.value)} aria-label={t("language_title")}>
                    {LANGS.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {tab === "food" && (
              <FoodTab
                locations={locations} foodItems={foodItems} accent="var(--food)"
                onAdd={(it) => addItem("food", it)}
                onDelete={(id) => updateItem("food", id, () => null)}
                onUpdate={(id, fn) => updateItem("food", id, fn)}
              />
            )}
            {tab === "tools" && (
              <ToolsTab
                tools={tools} accent="var(--tools)"
                onAdd={(it) => addItem("tools", it)}
                onToggle={(id) => updateItem("tools", id, (tl) => ({ ...tl, owned: !tl.owned }))}
                onDelete={(id) => updateItem("tools", id, () => null)}
              />
            )}
            {tab === "clothing" && (
              <ClothingTab
                items={clothing} accent="var(--clothing)"
                onAdd={(it) => addItem("clothing", it)}
                onToggle={(id) => updateItem("clothing", id, (c) => ({ ...c, status: c.status === "clean" ? "dirty" : "clean" }))}
                onDelete={(id) => updateItem("clothing", id, () => null)}
              />
            )}
            {tab === "locations" && (
              <LocationsTab
                locations={locations} foodItems={foodItems} family={family}
                onAdd={(l) => addItem("locations", l)}
                onDelete={(id) => updateItem("locations", id, () => null)}
                onReset={householdId ? null : resetDemo}
              />
            )}

            <div className="bottom-nav">
              {TABS.map((tb) => {
                const Icon = tb.icon;
                return (
                  <button key={tb.id} className={`nav-btn ${tab === tb.id ? "active" : ""}`} style={{ "--accent": tb.accent }} onClick={() => setTab(tb.id)} type="button">
                    <Icon size={19} strokeWidth={tab === tb.id ? 2.4 : 2} />
                    {tb.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </LangContext.Provider>
  );
}