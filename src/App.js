import React, { useMemo, useState } from "react";

/**
 * 仕様（更新）
 * - 位置指定は x（px）
 * - 幅指定は width のみ
 *   - 単階/縦長（全階共通幅）は number
 *   - メゾネットの新仕様:
 *     - ユニットに isMaisonette: true を持たせる
 *     - メゾネットの場合は align（'left'|'right'）と「上階の幅（width もしくは { top }）」を指定
 *     - 表示は上下が繋がった同一領域（上下同幅の縦長）で描画
 *
 * - 後方互換:
 *   - [top, bottom] や { top, bottom, align } も引き続き描画可能（L字）
 */

// 物件定義
const PROPERTIES = [
  { id: "hills", name: "〇〇ヒルズ", floors: [17, 16, 15, 14], buildingWidth: 1100 },
  { id: "aoyama", name: "青山タワー", floors: [28, 27, 26, 25], buildingWidth: 1200 },
];

// 「〇〇ヒルズ」= 既存のモックをそのまま移植
const HILLS_UNITS = [
  // 17F
  { id: "1701", name: "1701", floors: [17], x: 10, width: 130, status: "occupied", note: "DARK, 2BR", contract: { tenant: "田中太郎", startDate: "2023-04-01", endDate: "2025-03-31", rent: 85000, deposit: 170000 } },
  { id: "1702", name: "1702", floors: [17], x: 145, width: 130, status: "reserved", note: "LIGHT, 3BR", contract: { tenant: "佐藤花子", startDate: "2024-02-01", endDate: "2026-01-31", rent: 120000, deposit: 240000 } },
  { id: "1703", name: "1703", floors: [17], x: 280, width: 130, status: "reserved", note: "LIGHT, 3BR", contract: { tenant: "山田次郎", startDate: "2024-03-15", endDate: "2026-03-14", rent: 115000, deposit: 230000 } },
  { id: "1704", name: "1704", floors: [17], x: 415, width: 130, status: "vacant", note: "LIGHT, 1BR" },

  // メゾネット（新仕様）— 左寄せ、上階の幅=180（上下同幅で縦長表示）
  {
    id: "1605",
    name: "1605 メゾネット",
    floors: [17, 16],
    x: 550,
    isMaisonette: true,
    align: "left",
    width: { top: 80, bottom: 180 }, // 上階の幅のみ指定（下階は自動的に同幅）
    status: "reserved",
    note: "DARK, 3BR メゾネット（左寄せ・上下異幅）",
    contract: { tenant: "鈴木一郎", startDate: "2024-01-01", endDate: "2025-12-31", rent: 180000, deposit: 360000 }
  },
  { id: "1705", name: "1705", floors: [17], x: 635, width: 110, status: "vacant", note: "LIGHT, 1BR" },
  { id: "1706", name: "1706", floors: [17], x: 750, width: 110, status: "vacant", note: "DARK, 1BR" },
  { id: "1707", name: "1707", floors: [17], x: 865, width: 170, status: "model", note: "モデルルーム 2BR" },

  // 16F
  { id: "1601", name: "1601", floors: [16], x: 10, width: 130, status: "occupied", note: "DARK, 2BR", contract: { tenant: "高橋美咲", startDate: "2022-06-01", endDate: "2024-05-31", rent: 90000, deposit: 180000 } },
  { id: "1602", name: "1602", floors: [16], x: 145, width: 130, status: "reserved", note: "DARK, 3BR", contract: { tenant: "伊藤健太", startDate: "2024-04-01", endDate: "2026-03-31", rent: 125000, deposit: 250000 } },
  { id: "1603", name: "1603", floors: [16], x: 280, width: 130, status: "reserved", note: "LIGHT, 3BR", contract: { tenant: "中村由美", startDate: "2024-05-01", endDate: "2026-04-30", rent: 130000, deposit: 260000 } },
  { id: "1604", name: "1604", floors: [16], x: 415, width: 130, status: "special", note: "SA" },
  { id: "1606", name: "1606", floors: [16], x: 735, width: 160, status: "maintenance", note: "設備/工事" },
  { id: "1607", name: "1607", floors: [16], x: 900, width: 135, status: "vacant", note: "DARK, 1BR" },

  // 15F
  { id: "1501", name: "1501", floors: [15], x: 10, width: 130, status: "reserved", note: "DARK, 2BR", contract: { tenant: "小林正雄", startDate: "2024-06-01", endDate: "2026-05-31", rent: 95000, deposit: 190000 } },
  { id: "1502", name: "1502", floors: [15], x: 145, width: 130, status: "vacant", note: "LIGHT, 2BR" },
  { id: "1503", name: "1503", floors: [15], x: 280, width: 130, status: "hold", note: "内見予定" },
  { id: "1504", name: "1504", floors: [15], x: 415, width: 130, status: "reserved", note: "契約編集中", contract: { tenant: "斎藤真理", startDate: "2024-07-01", endDate: "2026-06-30", rent: 100000, deposit: 200000 } },
  { id: "1505", name: "1505", floors: [15], x: 550, width: 180, status: "occupied", note: "長期賃貸", contract: { tenant: "株式会社ABC", startDate: "2021-01-01", endDate: "2026-12-31", rent: 200000, deposit: 400000 } },
  { id: "1506", name: "1506", floors: [15], x: 735, width: 190, status: "special", note: "SA 2BR" },

  // メゾネット（新仕様）— 右寄せ、上下の幅をそれぞれ指定
  {
    id: "1407",
    name: "1407 メゾネット",
    floors: [15, 14],
    x: 930,
    isMaisonette: true,
    align: "right",
    width: { top: 100, bottom: 180 }, // 上階50px、下階80px
    status: "vacant",
    note: "LIGHT, 3BR メゾネット（右寄せ・上下異幅）",
  },

  // 14F
  { id: "1401", name: "1401", floors: [14], x: 10, width: 130, status: "occupied", note: "DARK, 2BR", contract: { tenant: "松本和子", startDate: "2023-09-01", endDate: "2025-08-31", rent: 88000, deposit: 176000 } },
  { id: "1402", name: "1402", floors: [14], x: 145, width: 130, status: "vacant", note: "LIGHT, 2BR" },
  { id: "1403", name: "1403", floors: [14], x: 280, width: 130, status: "maintenance", note: "リノベ中" },
  { id: "1404", name: "1404", floors: [14], x: 415, width: 130, status: "reserved", note: "契約編集中", contract: { tenant: "田村健一", startDate: "2024-08-01", endDate: "2026-07-31", rent: 105000, deposit: 210000 } },
  { id: "1405", name: "1405", floors: [14], x: 550, width: 180, status: "occupied", note: "長期賃貸", contract: { tenant: "株式会社XYZ", startDate: "2020-03-01", endDate: "2025-02-28", rent: 195000, deposit: 390000 } },
  { id: "1406", name: "1406", floors: [14], x: 735, width: 110, status: "hold", note: "内見予定" },
];

// 追加モック: さくらレジデンス
const SAKURA_UNITS = [
  // 12F
  { id: "1201", name: "1201", floors: [12], x: 10, width: 130, status: "occupied", note: "2BR" },
  { id: "1202", name: "1202", floors: [12], x: 145, width: 130, status: "reserved", note: "3BR" },
  { id: "1203", name: "1203", floors: [12], x: 280, width: 140, status: "vacant", note: "1BR" },
  { id: "1204", name: "1204", floors: [12], x: 425, width: 160, status: "special", note: "SA" },
  { id: "1205", name: "1205", floors: [12], x: 590, width: 140, status: "model", note: "モデル" },
  { id: "1206", name: "1206", floors: [12], x: 735, width: 230, status: "hold", note: "内見予定" },

  // 11F
  { id: "1101", name: "1101", floors: [11], x: 10, width: 140, status: "occupied", note: "法人契約" },
  { id: "1102", name: "1102", floors: [11], x: 155, width: 140, status: "special", note: "SOHO" },
  {
    id: "1103M", name: "1103 メゾネット", floors: [11, 10], x: 310,
    isMaisonette: true, align: "left", width: { top: 90, bottom: 170 },
    status: "reserved", note: "3BR メゾネット",
  },
  { id: "1104", name: "1104", floors: [11], x: 485, width: 180, status: "maintenance", note: "工事中" },
  { id: "1105", name: "1105", floors: [11], x: 670, width: 150, status: "vacant", note: "1BR" },
  { id: "1106", name: "1106", floors: [11], x: 825, width: 145, status: "vacant", note: "1BR" },

  // 10F
  { id: "1001", name: "1001", floors: [10], x: 10, width: 140, status: "occupied", note: "長期" },
  { id: "1002", name: "1002", floors: [10], x: 155, width: 140, status: "reserved", note: "申込" },
  { id: "1004", name: "1004", floors: [10], x: 485, width: 180, status: "maintenance", note: "工事中" },
  { id: "1005", name: "1005", floors: [10], x: 670, width: 150, status: "reserved", note: "調整中" },
  { id: "1006", name: "1006", floors: [10], x: 825, width: 145, status: "hold", note: "内見予定" },

  // 9F
  { id: "0901", name: "0901", floors: [9], x: 10, width: 180, status: "occupied", note: "2BR" },
  { id: "0902", name: "0902", floors: [9], x: 195, width: 150, status: "reserved", note: "2BR" },
  { id: "0904", name: "0904", floors: [9], x: 350, width: 150, status: "model", note: "モデル" },
  { id: "0905", name: "0905", floors: [9], x: 505, width: 200, status: "maintenance", note: "改修" },
  {
    id: "0906M", name: "0906 メゾネット", floors: [9, 8], x: 720,
    isMaisonette: true, align: "right", width: { top: 220, bottom: 180 },
    status: "vacant", note: "2BR メゾネット(右寄せ)",
  },

  // 8F
  { id: "0801", name: "0801", floors: [8], x: 10, width: 180, status: "vacant", note: "1BR" },
  { id: "0802", name: "0802", floors: [8], x: 195, width: 150, status: "hold", note: "調整中" },
  { id: "0804", name: "0804", floors: [8], x: 350, width: 150, status: "model", note: "モデル" },
  { id: "0805", name: "0805", floors: [8], x: 505, width: 200, status: "maintenance", note: "改修" },
];

// 追加モック: 青山タワー
const AOYAMA_UNITS = [
  // 28F
  { id: "2801", name: "2801", floors: [28], x: 10, width: 150, status: "occupied", note: "2BR" },
  { id: "2802", name: "2802", floors: [28], x: 165, width: 180, status: "reserved", note: "3BR" },
  { id: "2803", name: "2803", floors: [28], x: 350, width: 180, status: "vacant", note: "1BR" },
  { id: "2804", name: "2804", floors: [28], x: 535, width: 200, status: "model", note: "モデル" },
  { id: "2805", name: "2805", floors: [28], x: 885, width: 120, status: "special", note: "SA" },
  { id: "2806", name: "2806", floors: [28], x: 1010, width: 175, status: "special", note: "SA" },

  // 27F
  { id: "2701", name: "2701", floors: [27], x: 10, width: 200, status: "occupied", note: "法人" },
  { id: "2702", name: "2702", floors: [27], x: 215, width: 140, status: "maintenance", note: "工事" },
  { id: "2703", name: "2703", floors: [27], x: 360, width: 180, status: "reserved", note: "申込" },
  { id: "2704", name: "2704", floors: [27], x: 545, width: 190, status: "vacant", note: "1BR" },
  {
    id: "2705M", name: "2705 メゾネット", floors: [28, 27], x: 740,
    isMaisonette: true, align: "left", width: { top: 140, bottom: 260 },
    status: "hold", note: "3BR メゾネット",
  },
  { id: "2706", name: "2706", floors: [27], x: 1005, width: 175, status: "vacant", note: "1BR" },

  // 26F
  { id: "2601", name: "2601", floors: [26], x: 10, width: 160, status: "occupied", note: "2BR" },
  { id: "2602", name: "2602", floors: [26], x: 175, width: 160, status: "special", note: "SOHO" },
  { id: "2603", name: "2603", floors: [26], x: 340, width: 180, status: "model", note: "モデル" },
  { id: "2604", name: "2604", floors: [26], x: 525, width: 200, status: "maintenance", note: "改修" },
  { id: "2605", name: "2605", floors: [26], x: 730, width: 160, status: "vacant", note: "1BR" },
  { id: "2606", name: "2606", floors: [26], x: 895, width: 185, status: "vacant", note: "1BR" },

  // 25F
  { id: "2501", name: "2501", floors: [25], x: 10, width: 160, status: "occupied", note: "長期" },
  { id: "2502", name: "2502", floors: [25], x: 175, width: 160, status: "reserved", note: "申込" },
  { id: "2503", name: "2503", floors: [25], x: 340, width: 180, status: "vacant", note: "2BR" },
  { id: "2504", name: "2504", floors: [25], x: 525, width: 200, status: "maintenance", note: "改修" },
  { id: "2505", name: "2505", floors: [25], x: 730, width: 205, status: "hold", note: "内見予定" },
  {
    id: "2506M", name: "2506 メゾネット", floors: [26, 25], x: 1085,
    isMaisonette: true, align: "right", width: { top: 130, bottom: 260 },
    status: "reserved", note: "3BR メゾネット",
  },

];

const INITIAL_UNITS = {
  hills: HILLS_UNITS,
  sakura: SAKURA_UNITS,
  aoyama: AOYAMA_UNITS,
};

export default function App() {
  // レイアウト共通
  const FLOOR_HEIGHT = 120;
  const PADDING_LEFT = 64;
  const PADDING_TOP = 20;

  // 選択中の物件
  const [currentPropertyId, setCurrentPropertyId] = useState("hills");
  const currentProperty = PROPERTIES.find((p) => p.id === currentPropertyId) || PROPERTIES[0];
  const FLOORS = currentProperty.floors;
  const BUILDING_WIDTH = currentProperty.buildingWidth;
  const SVG_W = PADDING_LEFT + BUILDING_WIDTH + 24;
  const SVG_H = PADDING_TOP * 2 + FLOOR_HEIGHT * FLOORS.length;

  // ステータス色（プライマリカラーを#3867D1）
  const STATUS_BASE = useMemo(
    () => ({
      vacant: "#9ca3af",
      reserved: "#ec4899",
      occupied: "#16a34a",
      hold: "#3867D1",
      model: "#8b5cf6",
      special: "#f59e0b",
      maintenance: "#a16207",
    }),
    []
  );
  const STATUS_FILL = useMemo(
    () => ({
      vacant: "#f3f4f6",
      reserved: "#fce7f3",
      occupied: "#dcfce7",
      hold: "#dbeafe",
      model: "#ede9fe",
      special: "#fef3c7",
      maintenance: "#fef3c7",
    }),
    []
  );

  // 物件ごとの units を保持
  const [propertyUnits, setPropertyUnits] = useState(INITIAL_UNITS);

  // 編集・選択
  const [selected, setSelected] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ status: '', note: '' });
  const [hasChanges, setHasChanges] = useState(false);

  // 現在表示中の units（現在の物件に紐づく）
  const units = propertyUnits[currentPropertyId] || [];

  // 認証関数
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    if (loginData.username === 'admin' && loginData.password === 'h@kamata') {
      setIsAuthenticated(true);
      setLoginData({ username: '', password: '' });
    } else {
      setLoginError('ユーザー名またはパスワードが正しくありません');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSelected(null);
    setLoginData({ username: '', password: '' });
    setLoginError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    if (loginError) setLoginError('');
  };

  // 物件選択
  const handlePropertySelect = (propertyId) => {
    if (propertyId === currentPropertyId) return;
    setCurrentPropertyId(propertyId);
    // 選択中の区画/編集状態はリセット
    setSelected(null);
    setIsEditing(false);
    setHasChanges(false);
  };

  // 編集機能
  const handleEditClick = () => {
    if (selected) {
      setEditData({
        status: selected.status,
        note: selected.note || ''
      });
      setIsEditing(true);
    }
  };

  // 区画選択時に編集モードを自動開始
  const handleUnitSelect = (unit) => {
    setSelected(unit);
    setEditData({
      status: unit.status,
      note: unit.note || ''
    });
    setIsEditing(true);
    setHasChanges(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
    if (selected) {
      const hasStatusChange = name === 'status' && value !== selected.status;
      const hasNoteChange = name === 'note' && value !== (selected.note || '');
      setHasChanges(hasStatusChange || hasNoteChange);
    }
  };

  const handleSave = () => {
    if (!selected) return;
    setPropertyUnits(prev => ({
      ...prev,
      [currentPropertyId]: (prev[currentPropertyId] || []).map(u =>
        u.id === selected.id ? { ...u, status: editData.status, note: editData.note } : u
      ),
    }));
    setSelected(prev => prev ? ({ ...prev, status: editData.status, note: editData.note }) : prev);
    setHasChanges(false);
  };

  const handleCancel = () => {
    if (selected) {
      setEditData({
        status: selected.status,
        note: selected.note || ''
      });
      setHasChanges(false);
    }
  };

  // ヘルパ
  const floorIndex = (f) => FLOORS.indexOf(f);
  const yForFloorTop = (f) => PADDING_TOP + floorIndex(f) * FLOOR_HEIGHT;

  const statusLabel = (k) =>
    ({
      vacant: "空室",
      reserved: "申込/成約予定",
      occupied: "入居中/長期賃貸",
      hold: "HOLD/内見予定",
      model: "モデル",
      special: "SA/特別",
      maintenance: "工事/権利者",
    }[k] || k);

  const rangeText = (floors) => {
    if (!floors?.length) return "-";
    const top = Math.max(...floors);
    const bot = Math.min(...floors);
    return top === bot ? `${top}F` : `${top}F–${bot}F（メゾネット）`;
  };

  // テキストの折り返しと省略表示
  const formatMemoText = (text, maxWidth = 100) => {
    if (!text) return "";
    const maxChars = Math.floor(maxWidth / 8);
    if (text.length <= maxChars) return text;
    const firstLineMaxChars = Math.floor(maxChars * 0.8);
    const firstLine = text.substring(0, firstLineMaxChars);
    const secondLine = text.substring(firstLineMaxChars);
    if (secondLine.length <= firstLineMaxChars) {
      return [firstLine, secondLine];
    } else {
      return [firstLine, secondLine.substring(0, firstLineMaxChars - 3) + "..."];
    }
  };

  // 幾何の正規化（xとwidthだけをpxに）
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const toLShape = (top, bottom, align = "left") => ({
    type: "l",
    align: align === "right" ? "right" : "left",
    widthTop: Math.max(10, Math.round(top || 0)),
    widthBottom: Math.max(10, Math.round(bottom || top || 0)),
  });
  const toRect = (w) => ({
    type: "rect",
    width: Math.max(10, Math.round(w || 140)),
  });

  const normalizeUnit = (u) => {
    let xPx = Math.round(u.x || 0);
    xPx = clamp(xPx, 0, BUILDING_WIDTH);

    const isMaisonette = !!u.isMaisonette || !!u.maisonette; // 後方互換: maisonette でも可

    // width の解釈
    let geom;

    if (isMaisonette && u.floors?.length === 2) {
      // 新仕様: メゾネットは align + 上下の幅をそれぞれ指定可能
      const align =
        (u.align || (typeof u.width === "object" ? u.width.align : null) || "left") === "right"
          ? "right"
          : "left";
      let topW, bottomW;
      if (typeof u.width === "number") {
        topW = u.width;
        bottomW = u.width; // 数値の場合は上下同幅
      } else if (typeof u.width === "object") {
        topW = u.width.top ?? u.width.both ?? 140;
        bottomW = u.width.bottom ?? u.width.both ?? topW;
      } else {
        topW = 140;
        bottomW = 140;
      }
      geom = toLShape(topW, bottomW, align); // 上下の幅をそれぞれ指定
    } else if (Array.isArray(u.width) && u.floors?.length === 2) {
      // 旧仕様: [top, bottom] => L字（左寄せ）
      geom = toLShape(u.width[0], u.width[1], "left");
    } else if (u.width && typeof u.width === "object" && u.floors?.length === 2) {
      // 旧仕様: { top, bottom, align }
      const { top, bottom, align } = u.width;
      geom = toLShape(top, bottom ?? top, align);
    } else {
      // number または L字条件不成立 => 矩形
      const w = typeof u.width === "number" ? u.width : (u.width?.top ?? u.width?.both ?? 140);
      geom = toRect(w);
    }

    // はみ出し防止
    if (geom.type === "rect") {
      geom.width = clamp(geom.width, 10, BUILDING_WIDTH - xPx);
    } else {
      // 上段は常に [x, x + widthTop] 内に収める
      geom.widthTop = clamp(geom.widthTop, 10, BUILDING_WIDTH - xPx);
      const right = xPx + geom.widthTop;

      if (isMaisonette && u.floors?.length === 2) {
        // 新仕様: 上下の幅をそれぞれ制限
        if (geom.align === "left") {
          geom.widthBottom = clamp(geom.widthBottom, 10, BUILDING_WIDTH - xPx);
        } else {
          // 右寄せ: 下段の左端が0以上になるように調整
          const right = xPx + geom.widthTop;
          geom.widthBottom = clamp(geom.widthBottom, 10, right);
        }
      } else {
        // 旧仕様: 下段幅の制限
        if (geom.align === "left") {
          geom.widthBottom = clamp(geom.widthBottom, 10, BUILDING_WIDTH - xPx);
        } else {
          geom.widthBottom = clamp(geom.widthBottom, 10, right);
        }
      }
    }

    return { ...u, xPx, geom, isMaisonette };
  };

  const normalizedUnits = useMemo(() => units.map(normalizeUnit), [units, BUILDING_WIDTH, FLOORS]);

  // メゾネットL字パス（2層想定）: hairline防止で0.5px補正
  const makeMaisonetteLPath = ({ x, topFloor, widthTop, widthBottom, align }) => {
    const xLeft = PADDING_LEFT + x;
    const fh = FLOOR_HEIGHT;
    const yTop = yForFloorTop(topFloor) + 0.5;
    const yMid = yTop + fh;
    const yBottom = yTop + fh * 2 - 0.5;

    if (align === "left") {
      return [
        "M", xLeft, yTop,
        "H", xLeft + widthTop,
        "V", yMid,
        "H", xLeft + widthBottom,
        "V", yBottom,
        "H", xLeft,
        "Z",
      ].join(" ");
    } else {
      const xRight = xLeft + widthTop;
      const xTopLeft = xRight - widthTop;
      const xBottomLeft = xRight - widthBottom;
      return [
        "M", xTopLeft, yTop,
        "H", xRight,
        "V", yBottom,
        "H", xBottomLeft,
        "V", yMid,
        "H", xTopLeft,
        "Z",
      ].join(" ");
    }
  };

  // 認証されていない場合はログインフォームを表示
  if (!isAuthenticated) {
    return (
      <div className="app-root">
        <Style />
        <div className="login-container">
          <div className="login-form">
            <div className="login-header">
              <h1>〇〇ヒルズ</h1>
              <p>区画管理システム</p>
            </div>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="username">ユーザー名</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={loginData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">パスワード</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              {loginError && <div className="error-message">{loginError}</div>}
              <button type="submit" className="login-button">ログイン</button>
            </form>
            <div className="login-info">
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      <Style />
      <header className="app-header">
        <div className="title">
          <span className="brand">区画ビュー</span>
          <span className="subtitle">断面図 + 契約可視化</span>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          ログアウト
        </button>
      </header>

      <main className={`layout with-left ${selected ? 'with-panel' : ''}`}>
        {/* 左サイド：物件選択 */}
        <aside className="property-panel" aria-label="物件一覧">
          <h3 className="property-title">物件</h3>
          <div className="property-list">
            {PROPERTIES.map((p) => {
              const isActive = p.id === currentPropertyId;
              return (
                <button
                  key={p.id}
                  className={`property-item ${isActive ? 'active' : ''}`}
                  onClick={() => handlePropertySelect(p.id)}
                  aria-pressed={isActive}
                >
                  <div className="property-name">{p.name}</div>
                  <div className="property-meta">
                    <span>{p.floors[0]}F–{p.floors[p.floors.length - 1]}F</span>
                    <span>幅 {p.buildingWidth}px</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* 中央：キャンバス */}
        <section className="canvas-wrap" role="region" aria-label="区画断面図" onClick={(e) => e.stopPropagation()}>
          <div className="building-header">
            <div className="building-icon">🏢</div>
            <h1 className="building-name">{currentProperty.name}</h1>
          </div>
          <div className="legend-section">
            <Legend STATUS_BASE={STATUS_BASE} />
          </div>
          <div className="compass-bar">
            <div className="compass-item">北西</div>
            <div className="compass-item">西角</div>
            <div className="compass-item">南西</div>
            <div className="compass-item">南角</div>
            <div className="compass-item">南東</div>
            <div className="compass-item">東角</div>
            <div className="compass-item">北東</div>
            <div className="compass-item">北角</div>
          </div>
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            width="100%"
            height={SVG_H}
            aria-label="building-section"
          >
            <defs>
              <filter id="softShadow" x="-20%" y="-20%" width="160%" height="180%">
                <feDropShadow dx="0" dy="1" stdDeviation="0.6" floodColor="#000000" floodOpacity="0.05" />
                <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#000000" floodOpacity="0.07" />
              </filter>
            </defs>

            {/* 外枠 */}
            <rect
              x={PADDING_LEFT}
              y={PADDING_TOP}
              width={BUILDING_WIDTH}
              height={FLOOR_HEIGHT * FLOORS.length}
              className="outline"
              rx="10"
              ry="10"
            />
            {/* 階ガイド */}
            {FLOORS.map((f, idx) => {
              const y = PADDING_TOP + idx * FLOOR_HEIGHT;
              return (
                <g key={`g-${f}`}>
                  <line
                    x1={PADDING_LEFT}
                    y1={y}
                    x2={PADDING_LEFT + BUILDING_WIDTH}
                    y2={y}
                    className="grid-line"
                  />
                  <text x={10} y={y + FLOOR_HEIGHT / 2 + 4} className="floor-label">
                    {f}F
                  </text>
                </g>
              );
            })}
            {/* 最下段ライン */}
            <line
              x1={PADDING_LEFT}
              y1={PADDING_TOP + FLOOR_HEIGHT * FLOORS.length}
              x2={PADDING_LEFT + BUILDING_WIDTH}
              y2={PADDING_TOP + FLOOR_HEIGHT * FLOORS.length}
              className="grid-line"
            />

            {/* 区画 */}
            {normalizedUnits.map((u) => {
              const base = STATUS_BASE[u.status] || "#cbd5e1";
              const fill = STATUS_FILL[u.status] || "#f8fafc";
              const onClick = () => handleUnitSelect(u);
              const isSelected = selected?.id === u.id;

              // 単階 or 縦長（矩形）
              if (u.geom.type === "rect") {
                const topFloor = Math.max(...u.floors);
                const bottomFloor = Math.min(...u.floors);
                if (floorIndex(topFloor) === -1 || floorIndex(bottomFloor) === -1) return null;

                const x = PADDING_LEFT + u.xPx;
                const y = yForFloorTop(topFloor) + 1;
                const height =
                  (floorIndex(bottomFloor) - floorIndex(topFloor) + 1) * FLOOR_HEIGHT - 2;
                const w = u.geom.width;

                return (
                  <g key={u.id} className={`unit ${isSelected ? 'selected' : ''}`} style={{ filter: "url(#softShadow)" }}>
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={height}
                      fill={fill}
                      stroke={base}
                      className="unit-shape"
                      rx="12"
                      ry="12"
                      onClick={onClick}
                    />
                    <text
                      x={x + w / 2}
                      y={y + height / 2 + 4}
                      textAnchor="middle"
                      className="unit-label"
                      style={{ fill: "#111827" }}
                    >
                      {u.name}
                    </text>
                    {(() => {
                      const memoText = formatMemoText(u.note, Math.max(w - 20, 60));
                      if (Array.isArray(memoText)) {
                        return (
                          <>
                            <text
                              x={x + w / 2}
                              y={y + height / 2 + 15}
                              textAnchor="middle"
                              className="unit-memo"
                              style={{ fill: "#6b7280", fontSize: "9px" }}
                            >
                              {memoText[0]}
                            </text>
                            <text
                              x={x + w / 2}
                              y={y + height / 2 + 28}
                              textAnchor="middle"
                              className="unit-memo"
                              style={{ fill: "#6b7280", fontSize: "9px" }}
                            >
                              {memoText[1]}
                            </text>
                          </>
                        );
                      } else {
                        return (
                          <text
                            x={x + w / 2}
                            y={y + height / 2 + 15}
                            textAnchor="middle"
                            className="unit-memo"
                            style={{ fill: "#6b7280", fontSize: "9px" }}
                          >
                            {memoText}
                          </text>
                        );
                      }
                    })()}
                  </g>
                );
              }

              // メゾネット/L字（floorsは2層想定）
              const topFloor = Math.max(...u.floors);
              const bottomFloor = Math.min(...u.floors);
              if (floorIndex(topFloor) === -1 || floorIndex(bottomFloor) === -1) return null;

              // 新仕様のメゾネット（上下異幅）か旧仕様のL字かを判定
              if (u.isMaisonette) {
                // 新仕様: 上下異幅のL字表示
                const d = makeMaisonetteLPath({
                  x: u.xPx,
                  topFloor,
                  widthTop: u.geom.widthTop,
                  widthBottom: u.geom.widthBottom,
                  align: u.geom.align,
                });

                const xLeft = PADDING_LEFT + u.xPx;
                const labelX = u.geom.align === "right"
                  ? (xLeft + u.geom.widthTop) - u.geom.widthBottom / 2
                  : xLeft + u.geom.widthBottom / 2;
                const labelY = yForFloorTop(bottomFloor) + FLOOR_HEIGHT / 2 + 4;

                return (
                  <g key={u.id} className={`unit ${isSelected ? 'selected' : ''}`} style={{ filter: "url(#softShadow)" }}>
                    <path
                      d={d}
                      fill={fill}
                      stroke={base}
                      className="unit-shape unit-shape-l"
                      onClick={onClick}
                    />
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      className="unit-label"
                      style={{ fill: "#111827" }}
                    >
                      {u.name}
                    </text>
                    {(() => {
                      const memoText = formatMemoText(u.note, Math.max(u.geom.widthBottom - 20, 60));
                      if (Array.isArray(memoText)) {
                        return (
                          <>
                            <text
                              x={labelX}
                              y={labelY + 12}
                              textAnchor="middle"
                              className="unit-memo"
                              style={{ fill: "#6b7280", fontSize: "9px" }}
                            >
                              {memoText[0]}
                            </text>
                            <text
                              x={labelX}
                              y={labelY + 25}
                              textAnchor="middle"
                              className="unit-memo"
                              style={{ fill: "#6b7280", fontSize: "9px" }}
                            >
                              {memoText[1]}
                            </text>
                          </>
                        );
                      } else {
                        return (
                          <text
                            x={labelX}
                            y={labelY + 12}
                            textAnchor="middle"
                            className="unit-memo"
                            style={{ fill: "#6b7280", fontSize: "9px" }}
                          >
                            {memoText}
                          </text>
                        );
                      }
                    })()}
                  </g>
                );
              } else {
                // 旧仕様: L字表示
                const d = makeMaisonetteLPath({
                  x: u.xPx,
                  topFloor,
                  widthTop: u.geom.widthTop,
                  widthBottom: u.geom.widthBottom,
                  align: u.geom.align,
                });

                const xLeft = PADDING_LEFT + u.xPx;
                const yTop = yForFloorTop(topFloor) + 1;
                const labelX =
                  u.geom.align === "right"
                    ? xLeft + u.geom.widthTop - Math.min(u.geom.widthTop, 120) / 2
                    : xLeft + Math.min(u.geom.widthTop, 120) / 2;
                const labelY = yTop + FLOOR_HEIGHT / 2 + 4;

                return (
                  <g key={u.id} className={`unit ${isSelected ? 'selected' : ''}`} style={{ filter: "url(#softShadow)" }}>
                    <path
                      d={d}
                      fill={fill}
                      stroke={base}
                      className="unit-shape unit-shape-l"
                      onClick={onClick}
                    />
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      className="unit-label"
                      style={{ fill: "#111827" }}
                    >
                      {u.name}
                    </text>
                  </g>
                );
              }
            })}
          </svg>
        </section>

        {/* 右サイド：詳細 */}
        {selected && (
          <aside className="side-panel">
            <div className="detail">
              <div className="detail-header">
                <h3>{selected.name}</h3>
                <button 
                  className="close-btn"
                  onClick={() => setSelected(null)}
                  aria-label="詳細を閉じる"
                >
                  ×
                </button>
              </div>
              
              <div className="row">
                <span className="k">ID</span>
                <span className="v">{selected.id}</span>
              </div>
              <div className="row">
                <span className="k">階</span>
                <span className="v">{rangeText(selected.floors)}</span>
              </div>
              <div className="row">
                <span className="k">契約状況</span>
                <span className="v">
                  <select 
                    name="status" 
                    value={editData.status} 
                    onChange={handleEditChange}
                    className="edit-select"
                  >
                    <option value="vacant">空室</option>
                    <option value="reserved">申込</option>
                    <option value="occupied">入居中</option>
                    <option value="maintenance">工事</option>
                    <option value="hold">保留</option>
                  </select>
                </span>
              </div>
              <div className="row">
                <span className="k">メモ</span>
                <span className="v">
                  <textarea 
                    name="note" 
                    value={editData.note} 
                    onChange={handleEditChange}
                    className="edit-textarea"
                    placeholder="メモを入力..."
                    rows="3"
                  />
                </span>
              </div>
              
              {hasChanges && (
                <div className="edit-actions">
                  <button className="save-btn" onClick={handleSave}>
                    保存
                  </button>
                  <button className="cancel-btn" onClick={handleCancel}>
                    キャンセル
                  </button>
                </div>
              )}
              
              {(selected.status === "reserved" || selected.status === "occupied") && selected.contract && (
                <div className="contract-section">
                  <h4>契約情報</h4>
                  <div className="contract-details">
                    <div className="row">
                      <span className="k">入居者</span>
                      <span className="v">{selected.contract.tenant}</span>
                    </div>
                    <div className="row">
                      <span className="k">契約期間</span>
                      <span className="v">
                        {selected.contract.startDate} ～ {selected.contract.endDate}
                      </span>
                    </div>
                    <div className="row">
                      <span className="k">家賃</span>
                      <span className="v">¥{selected.contract.rent.toLocaleString()}/月</span>
                    </div>
                    <div className="row">
                      <span className="k">敷金</span>
                      <span className="v">¥{selected.contract.deposit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}

/** 凡例 */
function Legend({ STATUS_BASE }) {
  const items = [
    ["vacant", "空室"],
    ["reserved", "申込/成約予定"],
    ["occupied", "入居中/長期賃貸"],
    ["hold", "HOLD/内見予定"],
    ["model", "モデルルーム"],
    ["special", "SA/特別"],
    ["maintenance", "工事・権利者"],
  ];
  return (
    <div className="legend">
      {items.map(([k, label]) => (
        <div className="badge" key={k}>
          <span className="dot" style={{ background: STATUS_BASE[k] }} />
          {label}
        </div>
      ))}
    </div>
  );
}

/** スタイル（左サイド用クラスを追加） */
function Style() {
  return (
    <style>{`
  :root{
    --bg:#ffffff;
    --panel:#ffffff;
    --text:#111827;
    --muted:#6b7280;
    --border:#e5e7eb;
    --line:#eef2f7;
    --primary:#3867D1;
    --primary-light:#dbeafe;
    --accent:#2563eb;
    --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  }
  *{ box-sizing:border-box; }
  body { 
    margin:0; 
    background:var(--bg); 
    color:var(--text); 
    font:14px/1.5 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif; 
  }
  .app-root { 
    min-height:100vh; 
    display:flex; 
    flex-direction:column; 
    background:var(--bg); 
  }
  .app-header {
    position:sticky; 
    top:0; 
    z-index:10;
    background:var(--panel);
    border-bottom:1px solid var(--border);
    padding:16px;
    display:flex; 
    gap:16px; 
    align-items:center; 
    justify-content:space-between;
    box-shadow: var(--shadow);
  }
  .logout-button {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  .logout-button:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
  }
  .login-form {
    background: white;
    padding: 40px;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
  }
  .login-header {
    text-align: center;
    margin-bottom: 32px;
  }
  .login-header h1 {
    color: var(--primary);
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 8px 0;
  }
  .login-header p {
    color: #6b7280;
    font-size: 16px;
    margin: 0;
  }
  .form-group {
    margin-bottom: 20px;
  }
  .form-group label {
    display: block;
    margin-bottom: 8px;
    color: #374151;
    font-weight: 600;
    font-size: 14px;
  }
  .form-group input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.2s ease;
    box-sizing: border-box;
  }
  .form-group input:focus {
    outline: none;
    border-color: var(--primary);
  }
  .error-message {
    color: #dc2626;
    font-size: 14px;
    margin-bottom: 16px;
    padding: 8px 12px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
  }
  .login-button {
    width: 100%;
    background: var(--primary);
    color: white;
    border: none;
    padding: 14px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  .login-button:hover {
    background: #1d4ed8;
  }
  .login-info {
    margin-top: 24px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    text-align: center;
  }
  .login-info p {
    margin: 4px 0;
    font-size: 14px;
    color: #6b7280;
  }
  .title { 
    display:flex; 
    gap:12px; 
    align-items:baseline; 
  }
  .brand { 
    font-size:18px; 
    font-weight:700; 
    letter-spacing:.2px; 
    color: var(--primary);
  }
  .subtitle { 
    font-size:13px; 
    color:var(--muted); 
  }
  .legend { 
    display:flex; 
    flex-wrap:wrap; 
    gap:8px; 
  }
  .badge { 
    display:inline-flex; 
    gap:6px; 
    align-items:center; 
    padding:6px 12px; 
    border:1px solid var(--border); 
    background:#ffffff; 
    border-radius:999px; 
    font-size:12px;
    transition: all 0.2s ease;
  }
  .badge:hover {
    box-shadow: var(--shadow);
  }
  .dot { 
    width:12px; 
    height:12px; 
    border-radius:3px; 
    display:inline-block; 
  }
  .layout {
    display:grid; 
    grid-template-columns: 1fr; 
    gap:16px; 
    padding:16px; 
    width:100%; 
    max-width:1400px; 
    margin:0 auto;
    flex: 1;
    transition: all 0.3s ease;
  }
  /* 左サイドがある前提のレイアウト */
  .layout.with-left {
    grid-template-columns: 240px 1fr;
  }
  .layout.with-left.with-panel {
    grid-template-columns: 240px 1fr 340px;
  }
  .canvas-wrap {
    background:var(--panel); 
    border:1px solid var(--border); 
    border-radius:16px; 
    overflow:auto; 
    padding:12px;
    box-shadow: var(--shadow);
  }
  .building-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border-radius: 12px;
    border: 1px solid var(--border);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  .building-icon {
    font-size: 32px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }
  .building-name {
    font-size: 24px;
    font-weight: 700;
    color: var(--primary);
    margin: 0;
    letter-spacing: 0.5px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  .legend-section {
    margin-bottom: 16px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid var(--border);
  }
  .compass-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px 8px;
    background: linear-gradient(90deg, #e0f2fe 0%, #f0f9ff 50%, #e0f2fe 100%);
    border: 1px solid #bae6fd;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    flex-wrap: wrap;
    gap: 4px;
    width: 1000px;
    margin-left: auto;
    margin-right: auto;
  }
  .compass-item {
    font-size: 12px;
    font-weight: 600;
    color: #0369a1;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 16px;
    border: 1px solid #7dd3fc;
    text-align: center;
    min-width: 50px;
    flex: 1;
    max-width: 80px;
    transition: all 0.2s ease;
  }
  .compass-item:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .side-panel {
    background:var(--panel); 
    border:1px solid var(--border); 
    border-radius:16px; 
    padding:20px;
    box-shadow: var(--shadow);
    height: fit-content;
    position: sticky;
    top: 100px;
    animation: slideIn 0.3s ease;
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  h2 { font-size:16px; margin:0 0 16px; color: var(--text); font-weight: 600; }
  .empty-state { text-align: center; padding: 40px 20px; }
  .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
  .muted { color:var(--muted); margin: 0; }
  .detail { display:grid; gap:12px; }
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
  }
  .detail-header h3 { margin: 0; font-size: 18px; font-weight: 600; color: var(--primary); }
  .close-btn {
    background: none; border: none; font-size: 24px; color: var(--muted);
    cursor: pointer; padding: 4px; border-radius: 4px; transition: all 0.2s ease;
  }
  .close-btn:hover { background: var(--border); color: var(--text); }
  .row { display:flex; gap:12px; align-items:center; padding: 8px 0; }
  .k { width:100px; color:#6b7280; font-weight: 500; font-size: 13px; }
  .v { flex:1; font-weight: 500; }
  .status-badge { color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .grid-line { stroke: var(--line); stroke-width:1; }
  .outline { fill:#ffffff; stroke:#e5e7eb; stroke-width:1; }
  .floor-label { fill:#64748b; font-size:12px; }
  .unit { transition: all .2s ease; }
  .unit:hover { transform: translateY(-2px); }
  .unit.selected { transform: translateY(-2px) scale(1.02); }
  .unit-label { fill:#111827; font-weight:700; font-size:12px; pointer-events:none; }
  .unit-memo { fill:#6b7280; font-weight:500; font-size:10px; pointer-events:none; }
  .contract-section { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }
  .contract-section h4 { font-size: 14px; font-weight: 600; color: var(--primary); margin: 0 0 12px 0; }
  .contract-details { display: grid; gap: 8px; }
  .edit-actions { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border); display: flex; gap: 12px; justify-content: flex-end; }
  .edit-btn, .save-btn, .cancel-btn {
    padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all 0.2s ease; border: 1px solid transparent;
  }
  .edit-btn { background: var(--primary); color: white; border-color: var(--primary); }
  .edit-btn:hover { background: #1d4ed8; border-color: #1d4ed8; }
  .save-btn { background: var(--primary); color: white; border-color: var(--primary); }
  .save-btn:hover { background: #1d4ed8; border-color: #1d4ed8; }
  .cancel-btn { background: #6b7280; color: white; border-color: #6b7280; }
  .cancel-btn:hover { background: #4b5563; border-color: #4b5563; }
  .edit-select {
    width: 100%; padding: 6px 12px; border: 2px solid #e5e7eb; border-radius: 6px;
    font-size: 14px; background: white; cursor: pointer; transition: border-color 0.2s ease;
  }
  .edit-select:focus { outline: none; border-color: var(--primary); }
  .edit-textarea {
    width: 100%; padding: 8px 12px; border: 2px solid #e5e7eb; border-radius: 6px;
    font-size: 14px; font-family: inherit; resize: vertical; min-height: 60px; transition: border-color 0.2s ease;
  }
  .edit-textarea:focus { outline: none; border-color: var(--primary); }
  .unit-shape { cursor:pointer; stroke-width:2; vector-effect: non-scaling-stroke; shape-rendering: geometricPrecision; transition: all 0.2s ease; }
  .unit-shape:hover { stroke-width: 3; }
  .unit.selected .unit-shape { stroke-width: 4; filter: brightness(1.05); }
  .unit-shape-l { stroke-linejoin: round; stroke-linecap: round; }

  /* 物件サイドパネル */
  .property-panel {
    background:var(--panel);
    border:1px solid var(--border);
    border-radius:16px;
    padding:12px;
    box-shadow: var(--shadow);
    height: fit-content;
    position: sticky;
    top: 100px;
    align-self: start;
  }
  .property-title {
    margin: 8px 8px 12px 8px;
    font-size: 14px;
    font-weight: 700;
    color: var(--primary);
  }
  .property-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .property-item {
    width: 100%;
    text-align: left;
    background: #ffffff;
    border:1px solid var(--border);
    border-radius:10px;
    padding: 10px 12px;
    cursor: pointer;
    transition: all .2s ease;
  }
  .property-item:hover {
    box-shadow: var(--shadow);
    transform: translateY(-1px);
  }
  .property-item.active {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px var(--primary-light) inset;
  }
  .property-name {
    font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 4px;
  }
  .property-meta {
    display: flex; gap: 8px; color: var(--muted); font-size: 12px;
  }

  @media (max-width: 1200px) {
    .layout { gap: 12px; }
    .layout.with-left { grid-template-columns: 1fr; }
    .layout.with-left.with-panel { grid-template-columns: 1fr; }
    .property-panel { position: static; }
    .legend { flex-direction: column; gap: 6px; }
    .app-header { flex-direction: column; align-items: stretch; gap: 12px; }
  }
  @media (max-width: 960px) {
    .layout { grid-template-columns: 1fr; gap: 12px; }
    .side-panel { position: static; order: -1; }
    .app-header { padding: 12px; }
    .title { flex-direction: column; gap: 4px; }
    .brand { font-size: 16px; }
    .legend { justify-content: center; }
  }
  @media (max-width: 640px) {
    .layout { padding: 12px; }
    .canvas-wrap { padding: 8px; }
    .side-panel { padding: 16px; }
    .building-header { padding: 12px 16px; margin-bottom: 12px; }
    .building-icon { font-size: 24px; }
    .building-name { font-size: 18px; }
    .legend { gap: 4px; }
    .badge { padding: 4px 8px; font-size: 11px; }
    .compass-bar { padding: 8px 4px; gap: 2px; width: 100%; margin-left: 0; margin-right: 0; }
    .compass-item { font-size: 10px; padding: 3px 6px; min-width: 40px; max-width: 60px; }
    .detail-header h3 { font-size: 16px; }
    .k { width: 80px; font-size: 12px; }
    .v { font-size: 13px; }
  }
  @media (max-width: 480px) {
    .app-header { padding: 8px; }
    .layout { padding: 8px; }
    .row { flex-direction: column; align-items: flex-start; gap: 4px; }
    .k { width: auto; }
  }
  `}</style>
  );
}
