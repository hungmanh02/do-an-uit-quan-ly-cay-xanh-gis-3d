import React, { useState, useEffect, useRef } from "react";
import Map3D from "./components/Map3D";
import ExcelImporter from "./components/ExcelImporter";

function App() {
  const [clickCoords, setClickCoords] = useState(null); // Lưu { lon, lat } khi click map trống
  // ===================================================================
  // 🛰️ KHỐI MÃ SỰ KIỆN KHÔNG GIAN (REFS & LAYOUT SIDEBAR)
  // ===================================================================
  const map3DRef = useRef(null);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  // ===================================================================
  // 🔐 PHÂN HỆ XÁC THỰC TÀI KHOẢN (BẢO MẬT HỆ THỐNG CÁN BỘ)
  // ===================================================================
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(""); // "quan_ly" hoặc "nhan_vien"
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // ===================================================================
  // 🌟 PHÂN HỆ ĐA KHU VỰC QUẢN LÝ (DYNAMIC ZONE FILTER)
  // ===================================================================
  const [khuVucId, setKhuVucId] = useState(""); // "" đại diện cho xem toàn thành phố
  const [danhSachKhuVuc, setDanhSachKhuVuc] = useState([]);

  // ===================================================================
  // 🌲 PHÂN HỆ QUẢN TRỊ 1: LỚP BẢN ĐỒ CÂY XANH ĐÔ THỊ (ĐỒNG BỘ MACAYXANH)
  // ===================================================================
  const [isTreeMenuOpen, setIsTreeMenuOpen] = useState(false);
  const [showTreeListModal, setShowTreeListModal] = useState(false);
  const [allTrees, setAllTrees] = useState([]);
  const [selectedTree, setSelectedTree] = useState(null);

  // 🌟 ĐÃ CẬP NHẬT: Cấu trúc form cây xanh ôm khít CSDL PostGIS mới
  const [treeFormData, setTreeFormData] = useState({
    MaCayXanh: "", // Khóa chính viết hoa đồng bộ bảng "CAY_XANH"
    MaTuyenDuong: "1", // Khóa ngoại liên kết tuyến đường (Mặc định trục số 1)
    loaiCay: "", // Thuộc tính Chủng loại (LoaiCay)
    tinhTrang: "Khỏe mạnh", // Thuộc tính Sức khỏe sinh trưởng (TinhTrang)
    chieuCao: "", // Thuộc tính Hình học không gian dọc (ChieuCao)
    duongKinhTan: "", // Thuộc tính Hình học không gian ngang (DuongKinhTan)
    lon: "", // Tọa độ phẳng Kinh độ trục X (lon)
    lat: "", // Tọa độ phẳng Vĩ độ trục Y (lat)
  });

  // ===================================================================
  // 🚨 PHÂN HỆ QUẢN TRỊ 2: LỚP BẢN ĐỒ SỰ CỐ HIỆN TRƯỜNG (ĐỒNG BỘ MASUCO)
  // ===================================================================
  const [isIncidentMenuOpen, setIsIncidentMenuOpen] = useState(false);
  const [showIncidentListModal, setShowIncidentListModal] = useState(false);
  const [suCoList, setSuCoList] = useState([]);

  // 🌟 ĐÃ CẬP NHẬT: Cấu trúc form sự cố khớp với bảng "SU_CO" mới
  const [incidentFormData, setIncidentFormData] = useState({
    MaSuCo: "", // Khóa chính viết hoa đồng bộ bảng "SU_CO"
    tieuDe: "", // Tiêu đề phân loại (tieuDe)
    moTa: "", // Mô tả diễn biến thực địa (moTa)
    trangThai: "Chưa xử lý", // Trạng thái vận hành (trangThai)
    lon: "", // Tọa độ điểm sự cố trục X
    lat: "", // Tọa độ điểm sự cố trục Y
  });

  // 🌐 KHỐI TIẾP NHẬN BÁO CÁO SỰ CỐ CÔNG CỘ PUBLIC (NGƯỜI DÂN CLICK MAP)
  const [publicCoords, setPublicCoords] = useState(null);
  const [tieuDePublic, setTieuDePublic] = useState("");
  const [moTaPublic, setMoTaPublic] = useState("");
  const [isSubmittingPublic, setIsSubmittingPublic] = useState(false);

  // ===================================================================
  // 📅 PHÂN HỆ QUẢN TRỊ 3: SỔ SÁCH NHẬT KÝ CHĂM SÓC LIÊN KẾT (ĐỒNG BỘ MANHATKY)
  // ===================================================================
  const [isDiaryMenuOpen, setIsDiaryMenuOpen] = useState(false);
  const [showDiaryListModal, setShowDiaryListModal] = useState(false);
  const [allDiaries, setAllDiaries] = useState([]);

  // 🌟 ĐÃ CẬP NHẬT: Cấu trúc form nhật ký khớp với bảng "NHAT_KY_CHAM_SOC" mới
  const [diaryFormData, setDiaryFormData] = useState({
    MaNhatKy: "", // Khóa chính viết hoa đồng bộ bảng
    MaCayXanh: "", // Khóa ngoại trỏ thẳng đến mã cây xanh lập thể mới
    loaiCongViec: "Tưới nước",
    ngayThucHien: "",
    ghiChu: "",
  });

  // ===================================================================
  // 🏢 PHÂN HỆ QUẢN TRỊ 4: DANH BẠ ĐƠN VỊ CÔNG TÁC PHỤ TRÁCH HẠ TẦNG (ĐỒNG BỘ MADONVI)
  // ===================================================================
  const [isUnitMenuOpen, setIsUnitMenuOpen] = useState(false);
  const [showUnitListModal, setShowUnitListModal] = useState(false);
  const [allUnits, setAllUnits] = useState([]);

  // 🌟 ĐÃ CẬP NHẬT: Cấu trúc form danh bạ đơn vị quản lý
  const [unitFormData, setUnitFormData] = useState({
    MaDonVi: "", // Khóa chính viết hoa đồng bộ bảng "DON_VI_QUAN_LY"
    tenDonVi: "",
    nguoiDaiDien: "",
    soDienThoai: "",
    khuVucPhuTrach: "",
  });

  // ===================================================================
  // 🛠️ BỘ ĐIỀU PHỐI BIẾN CHUYÊN NGÀNH CHUNG (CRUD CONFIG)
  // ===================================================================
  const [activeCrudTable, setActiveCrudTable] = useState("");
  const [crudAction, setCrudAction] = useState("create");

  const getStatusColor = (status) => {
    switch (status) {
      case "Chưa xử lý":
        return "#ef4444";
      case "Đang xử lý":
        return "#f59e0b";
      case "Đã hoàn thành":
        return "#10b981";
      default:
        return "#94a3b8";
    }
  };

  // 🚀 ĐỒNG BỘ ĐỘNG: Tải danh sách sự cố lề phải tự động co dãn theo phân khu
  const fetchSuCoTuDB = async () => {
    try {
      const url = khuVucId
        ? `http://localhost:5000/api/map/su-co?maKhuVuc=${khuVucId}`
        : "http://localhost:5000/api/map/su-co";
      const response = await fetch(url);
      if (response.ok) {
        const geojson = await response.json();
        const listFromDB = geojson.features.map((feature) => ({
          id: feature.properties.id, // MaSuCo đã được Backend alias thành id
          loai: feature.properties.tieuDe,
          viTri: feature.properties.moTa,
          trangThai: feature.properties.trangThai || "Chưa xử lý",
          lon: feature.geometry.coordinates[0],
          lat: feature.geometry.coordinates[1],
          color: getStatusColor(feature.properties.trangThai || "Chưa xử lý"),
        }));
        setSuCoList(listFromDB);
      }
    } catch (error) {
      console.error("🔴 Lỗi đồng bộ dữ liệu sự cố lề phải:", error);
    }
  };

  useEffect(() => {
    const fetchKhuVuc = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/map/khu-vuc");
        const data = await res.json();

        if (data && data.features) {
          const list = data.features.map((f) => ({
            id: f.properties.id, // MaKhuVuc đã được Backend alias thành id
            name: f.properties.TenKhuVuc,
          }));
          setDanhSachKhuVuc(list);
        } else if (Array.isArray(data)) {
          setDanhSachKhuVuc(data);
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách khu vực thực tế từ DB:", err);
      }
    };

    fetchKhuVuc();
  }, []);

  useEffect(() => {
    fetchSuCoTuDB();
    setSelectedTree(null);
    setClickCoords(null); // Reset điểm gắm tọa độ khi đổi phân khu
  }, [khuVucId]);

  // XỬ LÝ ĐĂNG NHẬP / ĐĂNG XUẤT
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "123456") {
      setIsLoggedIn(true);
      setUserRole("quan_ly"); // Quản lý tối cao: Có toàn quyền CRUD + Import Excel
      setShowLoginModal(false);
      alert("🎉 Đăng nhập quyền QUẢN LÝ thành công!");
    } else if (username === "nhanvien" && password === "123456") {
      setIsLoggedIn(true);
      setUserRole("nhan_vien"); // Nhân viên: Chỉ có quyền xem, Đổi bước sự cố và ghi Nhật ký
      setShowLoginModal(false);
      alert("🎉 Đăng nhập quyền NHÂN VIÊN KỸ THUẬT thành công!");
    } else {
      alert("❌ Tài khoản hoặc mật khẩu không chính xác!");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất tài khoản quản trị?")) {
      setIsLoggedIn(false);
      setActiveCrudTable(null);
      setClickCoords(null);
    }
  };

  // 🔨 THỰC THI THAO TÁC CRUD FORM ADMIN ĐỒNG BỘ POSTGRESQL
  const handleAdminCrudSubmit = async (e) => {
    e.preventDefault();
    console.log("🔍 [THÁM TỬ ADMIN] Đã kích hoạt nút submit form!");
    console.log("🔍 [THÁM TỬ ADMIN] Phân hệ dữ liệu đang xử lý:", activeCrudTable);

    let url = "";
    let method = crudAction === "create" ? "POST" : "PUT";
    let bodyData = {};

    if (activeCrudTable === "cay_xanh") {
      const currentMa = treeFormData.MaCayXanh || "";
      url =
        crudAction === "create"
          ? "http://localhost:5000/api/map/cay-xanh"
          : `http://localhost:5000/api/map/cay-xanh/${currentMa}`;

      // 🌟 ĐỒNG BỘ VÀ ÉP KIỂU SẠCH SẼ: Khớp 100% tên biến bóc tách ở mapRoutes Backend
      bodyData = {
        MaCayXanh: currentMa,
        MaTuyenDuong: parseInt(treeFormData.MaTuyenDuong) || 1,
        loaiCay: treeFormData.loaiCay,
        tinhTrang: treeFormData.tinhTrang,
        chieuCao: parseFloat(treeFormData.chieuCao) || 0,
        duongKinhTan: parseFloat(treeFormData.duongKinhTan) || 0,
        lon: parseFloat(treeFormData.lon) || 0,
        lat: parseFloat(treeFormData.lat) || 0,
      };

      console.log("📡 [THÁM TỬ ADMIN] Gói JSON chuẩn bị đẩy lên API:", bodyData);
    } else if (activeCrudTable === "nhat_ky") {
      url =
        crudAction === "create"
          ? "http://localhost:5000/api/map/nhat-ky"
          : `http://localhost:5000/api/map/nhat-ky/${diaryFormData.id}`;
      bodyData = diaryFormData;
    } else if (activeCrudTable === "don_vi") {
      url =
        crudAction === "create"
          ? "http://localhost:5000/api/map/don-vi"
          : `http://localhost:5000/api/map/don-vi/${unitFormData.id}`;
      bodyData = unitFormData;
    }

    if (!url) {
      console.log("❌ [HỦY TIẾN TRÌNH] URL API trống rỗng!");
      return;
    }

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const resData = await response.json();

      if (response.ok) {
        alert("🎉 Thao tác cơ sở dữ liệu thành công!");
        setActiveCrudTable(null);
        setClickCoords(null); // Clear điểm chấm tọa độ sau khi thêm xong
        fetchSuCoTuDB();
        if (map3DRef.current) map3DRef.current.refreshLayers();
      } else {
        alert(`❌ Thao tác thất bại: ${resData.message || "Lỗi không xác định"}`);
      }
    } catch (err) {
      console.error("🔴 Lỗi chí mạng trong khối fetch lệnh CRUD:", err);
      alert("🔴 Thao tác thất bại do mất kết nối dữ liệu!");
    }
  };

  // 🗑️ THAO TÁC ADMIN: Xóa cây xanh trực tiếp từ nút trên thanh Bottom Bar đen
  const handleAdminDeleteTree = async (treeId) => {
    if (!window.confirm(`⚠️ Cán bộ có chắc chắn muốn xóa vĩnh viễn cây #${treeId} khỏi PostGIS?`)) return;
    try {
      const response = await fetch(`http://localhost:5000/api/map/cay-xanh/${treeId}`, { method: "DELETE" });
      if (response.ok) {
        alert("🗑️ Hệ thống đã giải phóng và xóa thực thể cây xanh thành công!");
        setSelectedTree(null);
        if (map3DRef.current) map3DRef.current.refreshLayers();
      } else {
        alert("Thất bại khi thực hiện xóa.");
      }
    } catch (error) {
      alert("Mất kết nối API Backend!");
    }
  };

  const handleUpdateStatus = async (id, currentStatus) => {
    let nextStatus = "Đang xử lý";
    if (currentStatus === "Chưa xử lý") nextStatus = "Đang xử lý";
    else if (currentStatus === "Đang xử lý") nextStatus = "Đã hoàn thành";
    else return;

    try {
      const response = await fetch(`http://localhost:5000/api/map/su-co/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trang_thai: nextStatus }),
      });
      if (response.ok) {
        fetchSuCoTuDB();
        if (map3DRef.current) map3DRef.current.refreshLayers();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteSuCo = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm(`⚠️ Bạn có chắc chắn muốn xóa vĩnh viễn sự cố #${id}?`)) return;
    try {
      const response = await fetch(`http://localhost:5000/api/map/su-co/${id}`, { method: "DELETE" });
      if (response.ok) {
        alert("🗑️ Đã xóa thực thể sự cố!");
        fetchSuCoTuDB();
        if (map3DRef.current) map3DRef.current.refreshLayers();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handlePublicReportSubmit = async (e) => {
    e.preventDefault();
    if (!publicCoords) return;
    setIsSubmittingPublic(true);
    try {
      const response = await fetch("http://localhost:5000/api/map/su-co", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tieu_de: tieuDePublic,
          mo_ta: moTaPublic,
          nguoi_bao_cao: "Người dân phản ánh",
          longitude: publicCoords.lon,
          latitude: publicCoords.lat,
        }),
      });
      if (response.ok) {
        alert("🎉 Hệ thống tiếp nhận sự cố thành công.");
        setPublicCoords(null);
        setTieuDePublic("");
        setMoTaPublic("");
        setSelectedTree(null);
        fetchSuCoTuDB();
        if (map3DRef.current) map3DRef.current.refreshLayers();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingPublic(false);
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        backgroundColor: "#0f172a",
        fontFamily: "sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ===================================================================
          CỘT TRÁI: SIDEBAR ĐIỀU HÀNH CHUYÊN NGÀNH
          =================================================================== */}
      <div
        style={{
          width: showLeftSidebar ? "320px" : "60px",
          height: "100vh",
          background: "#1e293b",
          borderRight: "1px solid #334155",
          padding: showLeftSidebar ? "20px" : "70px 10px 20px 10px",
          display: "flex",
          boxSizing: "border-box",
          flexDirection: "column",
          zIndex: 10,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
          alignItems: showLeftSidebar ? "stretch" : "center",
        }}
      >
        {showLeftSidebar ? (
          <>
            <div style={{ flexShrink: 0, paddingBottom: "12px", borderBottom: "1px solid #334155" }}>
              <div style={{ fontSize: "10px", color: "#34d399", fontWeight: "bold", letterSpacing: "1px" }}>
                SỞ TÀI NGUYÊN VÀ MÔ TRƯỜNG TP.HCM
              </div>
              <h1 style={{ fontSize: "16px", color: "#fff", margin: "4px 0", fontWeight: "800" }}>
                {isLoggedIn ? "Trung Tâm Quản Trị CSDL" : "Cổng Thông Tin Công Cộng"}
              </h1>

              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", color: "#38bdf8", fontWeight: "bold" }}>
                  🏢 Chọn phân khu không gian:
                </label>
                <select
                  value={khuVucId}
                  onChange={(e) => setKhuVucId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px",
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    color: "#fff",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="">🌐 Toàn bộ TP.HCM (Xem tổng quan)</option>
                  {danhSachKhuVuc &&
                    Array.isArray(danhSachKhuVuc) &&
                    danhSachKhuVuc.map((kv) => {
                      const optionId = kv.id || kv.MaKhuVuc || Math.random();
                      return (
                        <option key={optionId} value={kv.id}>
                          📍 {kv.name || kv.TenKhuVuc || "Phân khu chưa đặt tên"}
                        </option>
                      );
                    })}
                </select>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                padding: "10px 4px 10px 0",
              }}
            >
              {isLoggedIn ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {/* 👑 KHỐI HIỂN THỊ THÔNG TIN VAI TRÒ */}
                  <div
                    style={{
                      padding: "8px 12px",
                      backgroundColor: userRole === "quan_ly" ? "rgba(16, 185, 129, 0.15)" : "rgba(59, 130, 246, 0.15)",
                      border: `1px solid ${userRole === "quan_ly" ? "#10b981" : "#3b82f6"}`,
                      borderRadius: "8px",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        color: userRole === "quan_ly" ? "#10b981" : "#3b82f6",
                        fontWeight: "bold",
                      }}
                    >
                      {userRole === "quan_ly" ? "👑 VAI TRÒ: QUẢN LÝ SỞ (TOÀN QUỀN)" : "🛠️ VAI TRÒ: NHÂN VIÊN THỰC ĐỊA"}
                    </span>
                  </div>

                  <h4 style={{ color: "#38bdf8", fontSize: "11px", margin: "2px 0", fontWeight: "bold" }}>
                    🗂️ DANH MỤC BẢNG DỮ LIỆU CHUYÊN NGÀNH
                  </h4>

                  {/* 🌲 1. PHÂN HỆ CÂY XANH ĐÔ THỊ */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      background: "#0f172a",
                      borderRadius: "8px",
                      border: "1px solid #334155",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      onClick={() => setIsTreeMenuOpen(!isTreeMenuOpen)}
                      style={{
                        padding: "10px 12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        backgroundColor: isTreeMenuOpen ? "#1e293b" : "transparent",
                      }}
                    >
                      <span style={{ color: "#fff", fontSize: "12px", fontWeight: "bold" }}>
                        🌲 1. Bảng Cây Xanh Đô Thị
                      </span>
                      <span
                        style={{
                          color: "#94a3b8",
                          fontSize: "10px",
                          transform: isTreeMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "0.2s",
                        }}
                      >
                        ▼
                      </span>
                    </div>

                    {isTreeMenuOpen && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          background: "#111827",
                          padding: "6px 8px",
                          borderTop: "1px solid #1e293b",
                          gap: "6px",
                        }}
                      >
                        {/* 🌟 Chỉ QUẢN LÝ mới nhìn thấy nút Thêm mới đơn lẻ (POST) */}
                        {userRole === "quan_ly" && (
                          <button
                            onClick={() => {
                              setCrudAction("create");
                              setTreeFormData({
                                MaCayXanh: "",
                                MaTuyenDuong: khuVucId || "1",
                                loaiCay: "",
                                tinhTrang: "Khỏe mạnh",
                                chieuCao: "",
                                duongKinhTan: "",
                                lon: "",
                                lat: "",
                              });
                              setActiveCrudTable("cay_xanh");
                            }}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              backgroundColor: "#1e293b",
                              border: "1px solid #334155",
                              color: "#10b981",
                              borderRadius: "6px",
                              fontSize: "11px",
                              textAlign: "left",
                              cursor: "pointer",
                              fontWeight: "bold",
                            }}
                          >
                            ➕ Thêm mới cây xanh lập thể (POST)
                          </button>
                        )}

                        <button
                          onClick={async () => {
                            try {
                              const url = khuVucId
                                ? `http://localhost:5000/api/map/cay-xanh?maKhuVuc=${khuVucId}`
                                : "http://localhost:5000/api/map/cay-xanh";
                              const res = await fetch(url);
                              if (res.ok) {
                                const geojson = await res.json();
                                setAllTrees(
                                  geojson.features.map((f) => ({
                                    id: f.properties.id,
                                    maTuyenDuong: f.properties.maTuyenDuong,
                                    loaiCay: f.properties.loaiCay,
                                    tinhTrang: f.properties.tinhTrang || "Khỏe mạnh",
                                    chieuCao: f.properties.chieuCao || 0,
                                    duongKinhTan: f.properties.duongKinhTan || 0,
                                    lon: f.geometry?.coordinates?.[0] || 0,
                                    lat: f.geometry?.coordinates?.[1] || 0,
                                  }))
                                );
                                setShowTreeListModal(true);
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            backgroundColor: "#1e293b",
                            border: "1px solid #334155",
                            color: "#38bdf8",
                            borderRadius: "6px",
                            fontSize: "11px",
                            textAlign: "left",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          📋 Xem thuộc tính & Sửa/Xóa cây (GET/PUT/DELETE)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 🚨 2. PHÂN HỆ ĐIỀU PHỐI SỰ CỐ HIỆN TRƯỜNG */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      background: "#0f172a",
                      borderRadius: "8px",
                      border: "1px solid #334155",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      onClick={() => setIsIncidentMenuOpen(!isIncidentMenuOpen)}
                      style={{
                        padding: "10px 12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        backgroundColor: isIncidentMenuOpen ? "#1e293b" : "transparent",
                      }}
                    >
                      <span style={{ color: "#fff", fontSize: "12px", fontWeight: "bold" }}>
                        🚨 2. Bản Đồ Sự Cố Hiện Trường
                      </span>
                      <span
                        style={{
                          color: "#94a3b8",
                          fontSize: "10px",
                          transform: isIncidentMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "0.2s",
                        }}
                      >
                        ▼
                      </span>
                    </div>
                    {isIncidentMenuOpen && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          background: "#111827",
                          padding: "6px 8px",
                          borderTop: "1px solid #1e293b",
                          gap: "6px",
                        }}
                      >
                        <button
                          onClick={() => {
                            fetchSuCoTuDB();
                            setShowIncidentListModal(true);
                          }}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            backgroundColor: "#1e293b",
                            border: "1px solid #334155",
                            color: "#38bdf8",
                            borderRadius: "6px",
                            fontSize: "11px",
                            textAlign: "left",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          📋{" "}
                          {userRole === "quan_ly"
                            ? "Quản lý & Duyệt hủy sự cố (FULL CRUD)"
                            : "⚡ Tiếp nhận & Đổi bước sự cố"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 📅 3. PHÂN HỆ SỔ SÁCH NHẬT KÝ CÔNG VỤ */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      background: "#0f172a",
                      borderRadius: "8px",
                      border: "1px solid #334155",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      onClick={() => setIsDiaryMenuOpen(!isDiaryMenuOpen)}
                      style={{
                        padding: "10px 12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        backgroundColor: isDiaryMenuOpen ? "#1e293b" : "transparent",
                      }}
                    >
                      <span style={{ color: "#fff", fontSize: "12px", fontWeight: "bold" }}>
                        📅 3. Nhật Ký Chăm Sóc Cây
                      </span>
                      <span
                        style={{
                          color: "#94a3b8",
                          fontSize: "10px",
                          transform: isDiaryMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "0.2s",
                        }}
                      >
                        ▼
                      </span>
                    </div>
                    {isDiaryMenuOpen && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          background: "#111827",
                          padding: "6px 8px",
                          borderTop: "1px solid #1e293b",
                          gap: "6px",
                        }}
                      >
                        <button
                          onClick={() => {
                            setCrudAction("create");
                            setDiaryFormData({
                              id: "",
                              cayXanhId: "",
                              loaiCongViec: "Tưới nước",
                              ngayThucHien: new Date().toISOString().split("T")[0],
                              ghiChu: "",
                            });
                            setActiveCrudTable("nhat_ky");
                          }}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            backgroundColor: "#1e293b",
                            border: "1px solid #334155",
                            color: "#10b981",
                            borderRadius: "6px",
                            fontSize: "11px",
                            textAlign: "left",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          ➕ Ghi sổ nhật ký tác nghiệp mới (POST)
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch("http://localhost:5000/api/map/nhat-ky");
                              if (res.ok) {
                                const data = await res.json();
                                setAllDiaries(data);
                                setShowDiaryListModal(true);
                              }
                            } catch (err) {
                              alert("Lỗi tải API!");
                            }
                          }}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            backgroundColor: "#1e293b",
                            border: "1px solid #334155",
                            color: "#38bdf8",
                            borderRadius: "6px",
                            fontSize: "11px",
                            textAlign: "left",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          📋 Tra cứu lịch sử sổ sách (GET/DELETE)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 🏢 4. PHÂN HỆ DANH BẠ ĐƠN VỊ LIÊN KẾT */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      background: "#0f172a",
                      borderRadius: "8px",
                      border: "1px solid #334155",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      onClick={() => setIsUnitMenuOpen(!isUnitMenuOpen)}
                      style={{
                        padding: "10px 12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        backgroundColor: isUnitMenuOpen ? "#1e293b" : "transparent",
                      }}
                    >
                      <span style={{ color: "#fff", fontSize: "12px", fontWeight: "bold" }}>
                        🏢 4. Đơn Vị Quản Lý Hạ Tầng
                      </span>
                      <span
                        style={{
                          color: "#94a3b8",
                          fontSize: "10px",
                          transform: isUnitMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "0.2s",
                        }}
                      >
                        ▼
                      </span>
                    </div>
                    {isUnitMenuOpen && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          background: "#111827",
                          padding: "6px 8px",
                          borderTop: "1px solid #1e293b",
                          gap: "6px",
                        }}
                      >
                        {userRole === "quan_ly" && (
                          <button
                            onClick={() => {
                              setCrudAction("create");
                              setUnitFormData({
                                id: "",
                                tenDonVi: "",
                                nguoiDaiDien: "",
                                soDienThoai: "",
                                khuVucPhuTrach: "Quận 1",
                              });
                              setActiveCrudTable("don_vi");
                            }}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              backgroundColor: "#1e293b",
                              border: "1px solid #334155",
                              color: "#10b981",
                              borderRadius: "6px",
                              fontSize: "11px",
                              textAlign: "left",
                              cursor: "pointer",
                              fontWeight: "bold",
                            }}
                          >
                            ➕ Thêm cơ sở đơn vị mới (POST)
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch("http://localhost:5000/api/map/don-vi");
                              if (res.ok) {
                                const data = await res.json();
                                setAllUnits(data);
                                setShowUnitListModal(true);
                              }
                            } catch (err) {
                              alert("Lỗi tải API!");
                            }
                          }}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            backgroundColor: "#1e293b",
                            border: "1px solid #334155",
                            color: "#38bdf8",
                            borderRadius: "6px",
                            fontSize: "11px",
                            textAlign: "left",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          📋 Tra cứu danh bạ đơn vị (GET)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 🏢 5. TÍNH NĂNG IMPORT TIỆN ÍCH EXCEL (CHỈ QUẢN LÝ CÓ QUỀN) */}
                  {userRole === "quan_ly" && (
                    <div style={{ marginTop: "4px" }}>
                      <ExcelImporter onImportSuccess={() => map3DRef.current?.refreshLayers()} />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {!publicCoords ? (
                    <div
                      style={{
                        background: "#0f172a",
                        padding: "12px",
                        borderRadius: "12px",
                        border: "1px dashed #34d399",
                        fontSize: "11px",
                        color: "#cbd5e1",
                        lineHeight: "1.5",
                      }}
                    >
                      💡 <b>Quy trình công cộng:</b> Mạnh bấm chọn một cây xanh vỉa hè $\rightarrow$ Thanh màu đen hiện
                      len $\rightarrow$ Ấn nút <b>"🚨 Báo sự cố cây này"</b> để lấy chuẩn xác tọa độ gốc thân cây vào
                      đây điền form nhé!
                    </div>
                  ) : (
                    <div
                      style={{
                        background: "#0f172a",
                        padding: "14px",
                        borderRadius: "12px",
                        border: "1px solid #38bdf8",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <h3 style={{ color: "#ef4444", fontSize: "12px", margin: 0, fontWeight: "bold" }}>
                        🚨 GỬI PHẢN ÁNH SỰ CỐ THỰC ĐỊA
                      </h3>
                      <form
                        onSubmit={handlePublicReportSubmit}
                        style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "11px" }}
                      >
                        <div>
                          <span style={{ color: "#94a3b8" }}>Tọa độ gốc thân cây:</span>
                          <div style={{ color: "#38bdf8", fontWeight: "bold", marginTop: "2px" }}>
                            X: {publicCoords?.lon ? parseFloat(publicCoords.lon).toFixed(6) : "0.000000"}, Y:{" "}
                            {publicCoords?.lat ? parseFloat(publicCoords.lat).toFixed(6) : "0.000000"}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label style={{ color: "#cbd5e1" }}>Loại sự cố:</label>
                          <select
                            value={tieuDePublic}
                            onChange={(e) => setTieuDePublic(e.target.value)}
                            required
                            style={{
                              padding: "6px",
                              backgroundColor: "#1e293b",
                              border: "1px solid #475569",
                              color: "#fff",
                              borderRadius: "6px",
                            }}
                          >
                            <option value="">-- Chọn loại vụ việc --</option>
                            <option value="Cây ngã đổ">🌳 Cây ngã đổ chắn đường</option>
                            <option value="Cành cây gãy sập">🌿 Cành gãy vướng dây điện</option>
                            <option value="Sâu bệnh/Héo úa">🐛 Cây mục rỗng gốc hiểm họa</option>
                          </select>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label style={{ color: "#cbd5e1" }}>Mô tả chi tiết:</label>
                          <textarea
                            rows="2"
                            placeholder="Nhập diễn biến hiện trường..."
                            required
                            value={moTaPublic}
                            onChange={(e) => setMoTaPublic(e.target.value)}
                            style={{
                              padding: "6px",
                              backgroundColor: "#1e293b",
                              border: "1px solid #475569",
                              color: "#fff",
                              borderRadius: "6px",
                              resize: "none",
                            }}
                          />
                        </div>
                        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                          <button
                            type="button"
                            onClick={() => setPublicCoords(null)}
                            style={{
                              flex: 1,
                              padding: "6px",
                              backgroundColor: "#475569",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontWeight: "bold",
                            }}
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingPublic}
                            style={{
                              flex: 2,
                              padding: "6px",
                              backgroundColor: "#e11d48",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontWeight: "bold",
                            }}
                          >
                            {isSubmittingPublic ? "Đang gửi..." : "Gửi phản ánh"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </>
              )}

              {/* KHỐI BIỂU ĐỒ LỚP PHỦ THỐNG KÊ */}
              <div
                style={{
                  background: "#0f172a",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid #334155",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div>
                  <div style={{ fontSize: "11px", color: "#cbd5e1", marginBottom: "4px" }}>
                    🟢 Lớp phủ cây xanh khỏe mạnh: <b>85%</b>
                  </div>
                  <div style={{ width: "100%", height: "5px", backgroundColor: "#334155", borderRadius: "3px" }}>
                    <div
                      style={{ width: "85%", height: "100%", backgroundColor: "#10b981", borderRadius: "3px" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#cbd5e1", marginBottom: "4px" }}>
                    🟡 Lớp phủ cây xanh cần chăm sóc: <b>10%</b>
                  </div>
                  <div style={{ width: "100%", height: "5px", backgroundColor: "#334155", borderRadius: "3px" }}>
                    <div
                      style={{ width: "10%", height: "100%", backgroundColor: "#f59e0b", borderRadius: "3px" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#cbd5e1", marginBottom: "4px" }}>
                    🔴 Lớp phủ cây xanh sâu bệnh: <b>5%</b>
                  </div>
                  <div style={{ width: "100%", height: "5px", backgroundColor: "#334155", borderRadius: "3px" }}>
                    <div style={{ width: "5%", height: "100%", backgroundColor: "#ef4444", borderRadius: "3px" }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                flexShrink: 0,
                borderTop: "1px solid #334155",
                paddingTop: "15px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "#4ade80",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#10b981",
                    borderRadius: "50%",
                  }}
                ></span>
                ĐÃ KẾT NỐI HỆ THỐNG POSTGIS
              </div>
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    backgroundColor: "#e11d48",
                    border: "1px solid #be123c",
                    color: "#fff",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  🔓 ĐĂNG XUẤT (ADMIN)
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    backgroundColor: "#3b82f6",
                    border: "1px solid #2563eb",
                    color: "#fff",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  🔐 ĐĂNG NHẬP HỆ THỐNG
                </button>
              )}
            </div>
          </>
        ) : (
          <div style={{ fontSize: "20px" }}>📊</div>
        )}
      </div>

      {/* NÚT ĐÓNG/MỞ SIDEBAR TRÁI */}
      <button
        onClick={() => setShowLeftSidebar(!showLeftSidebar)}
        style={{
          position: "absolute",
          top: "15px",
          left: showLeftSidebar ? "335px" : "85px",
          zIndex: 100,
          backgroundColor: "#1e293b",
          border: "1px solid #475569",
          color: "#fff",
          borderRadius: "6px",
          width: "28px",
          height: "28px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {showLeftSidebar ? "◀" : "☰"}
      </button>

      {/* ===================================================================
          KHU VỰC TRUNG TÂM: BẢN ĐỒ 3D ARCGIS VÀ THANH BOTTOM BAR ĐEN
          =================================================================== */}
      <div style={{ flex: 1, height: "100vh", position: "relative" }}>
        <Map3D
          ref={map3DRef}
          currentKhuVucId={khuVucId}
          onSelectTree={setSelectedTree}
          onReportSuccess={fetchSuCoTuDB}
          onMapClickPublic={(coords) => {
            // 🎯 LÔ-GIC ĐÃ CẬP NHẬT: Nhận diện và gán tọa độ khi click khoảng trống
            if (coords) {
              setClickCoords({ lon: coords.lon, lat: coords.lat });

              // Kịch bản 1: Nếu là người dân thông thường -> Kích hoạt Form báo cáo sự cố công cộng
              if (!isLoggedIn) {
                setPublicCoords({ lon: coords.lon, lat: coords.lat });
                setShowLeftSidebar(true);
              }
            } else {
              setClickCoords(null);
            }
          }}
        />

        {/* 🌟 NÚT CHỨC NĂNG NỔI (ĐÃ THÊM MỚI): Hiện đè trên góc Map phục vụ Cán bộ thêm cây nhanh */}
        {clickCoords && isLoggedIn && (userRole === "quan_ly" || userRole === "nhan_vien") && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 500,
              backgroundColor: "#1e293b",
              border: "2px solid #10b981",
              borderRadius: "12px",
              padding: "10px 16px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.7)",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              animation: "fadeIn 0.2s ease-in-out",
            }}
          >
            <div style={{ fontSize: "12px", color: "#cbd5e1" }}>
              📍 Toạ độ đã chấm:{" "}
              <b style={{ color: "#34d399" }}>
                {clickCoords.lon.toFixed(5)}, {clickCoords.lat.toFixed(5)}
              </b>
            </div>
            <button
              onClick={() => {
                setCrudAction("create");
                // Đổ chuẩn xác tọa độ thực địa vừa chấm vào Form dữ liệu Cây Xanh
                setTreeFormData({
                  MaCayXanh: "",
                  MaTuyenDuong: khuVucId || "1",
                  loaiCay: "",
                  tinhTrang: "Khỏe mạnh",
                  chieuCao: "",
                  duongKinhTan: "",
                  lon: clickCoords.lon,
                  lat: clickCoords.lat,
                });
                setActiveCrudTable("cay_xanh"); // Bung mở Modal Form nhập liệu
              }}
              style={{
                padding: "6px 12px",
                backgroundColor: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              🌳 Thêm cây tại đây
            </button>
            <button
              onClick={() => setClickCoords(null)}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* THANH BOTTOM BAR ĐEN THÔNG TIN CÂY ĐỒNG BỘ NÚT XÓA */}
        {selectedTree && (
          <div
            style={{
              position: "absolute",
              bottom: "30px",
              left: "20px",
              right: showRightSidebar ? "370px" : "20px",
              zIndex: 1000,
              backgroundColor: "rgba(15, 23, 42, 0.96)",
              border: "1px solid #10b981",
              borderRadius: "16px",
              padding: "16px 24px",
              color: "#fff",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
              transition: "all 0.3s ease-in-out",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "40px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "28px", flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                <span style={{ fontSize: "22px" }}>🌲</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <h3
                    style={{ margin: 0, fontSize: "15px", color: "#10b981", fontWeight: "bold", whiteSpace: "nowrap" }}
                  >
                    {selectedTree.loaiCay}
                  </h3>
                  <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>
                    ID: #{selectedTree.id}
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "24px",
                  fontSize: "12px",
                  color: "#94a3b8",
                  alignItems: "center",
                  flexWrap: "nowrap",
                }}
              >
                <span style={{ whiteSpace: "nowrap" }}>
                  📐 Đường kính tán: <b style={{ color: "#fff" }}>{selectedTree.duongKinhTan} m</b>
                </span>
                <span style={{ whiteSpace: "nowrap" }}>
                  📏 Chiều cao thực tế: <b style={{ color: "#fff" }}>{selectedTree.chieuCao} m</b>
                </span>
                <span style={{ whiteSpace: "nowrap" }}>
                  ❤️ Sức khỏe: <b style={{ color: "#38bdf8" }}>{selectedTree.tinhTrang}</b>
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "190px", flexShrink: 0 }}>
                {isLoggedIn ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveCrudTable("su_co");
                        setCrudAction("create");
                        setIncidentFormData({
                          MaSuCo: "",
                          tieuDe: `Sự cố cây #${selectedTree?.id} (${selectedTree?.loaiCay})`,
                          moTa: `Ghi nhận tình trạng: ${selectedTree?.tinhTrang}. Cần xử lý gấp.`,
                          trangThai: "Chưa xử lý",
                          lon: selectedTree?.lon,
                          lat: selectedTree?.lat,
                        });
                      }}
                      style={{
                        width: "100%",
                        padding: "6px 0",
                        backgroundColor: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                      }}
                    >
                      ⚠️ Báo cáo sự cố
                    </button>
                    <div style={{ display: "flex", gap: "6px", width: "100%" }}>
                      <button
                        onClick={() => {
                          setCrudAction("update");
                          setTreeFormData({
                            MaCayXanh: selectedTree.id,
                            MaTuyenDuong: selectedTree.maTuyenDuong || "1",
                            loaiCay: selectedTree.loaiCay,
                            tinhTrang: selectedTree.tinhTrang,
                            chieuCao: selectedTree.chieuCao,
                            duongKinhTan: selectedTree.duongKinhTan,
                            lon: selectedTree.lon,
                            lat: selectedTree.lat,
                          });
                          setActiveCrudTable("cay_xanh");
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: "#f59e0b",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "5px 0",
                          fontSize: "11px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ✏️ Sửa cây
                      </button>
                      <button
                        onClick={() => handleAdminDeleteTree(selectedTree.id)}
                        style={{
                          flex: 1,
                          backgroundColor: "#e11d48",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "5px 0",
                          fontSize: "11px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        🗑️ Xóa cây
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setPublicCoords({ lon: selectedTree.lon, lat: selectedTree.lat });
                      setTieuDePublic("");
                      setMoTaPublic(
                        `Phản ánh sự cố cho cây mã số #${selectedTree.id} (${selectedTree.loaiCay}) vỉa hè.`
                      );
                      setShowLeftSidebar(true);
                    }}
                    style={{
                      width: "100%",
                      backgroundColor: "#e11d48",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 0",
                      fontSize: "11px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    🚨 Báo sự cố cây này
                  </button>
                )}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#64748b",
                  fontFamily: "monospace",
                  whiteSpace: "nowrap",
                  paddingLeft: "12px",
                  borderLeft: "1px solid #334155",
                  lineHeight: "1.4",
                  flexShrink: 0,
                }}
              >
                X: {parseFloat(selectedTree.lon).toFixed(5)}
                <br />
                Y: {parseFloat(selectedTree.lat).toFixed(5)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NÚT ĐÓNG/MỞ SIDEBAR PHẢI */}
      <button
        onClick={() => setShowRightSidebar(!showRightSidebar)}
        style={{
          position: "absolute",
          top: "15px",
          right: showRightSidebar ? "365px" : "15px",
          zIndex: 100,
          backgroundColor: "#1e293b",
          border: "1px solid #475569",
          color: "#fff",
          borderRadius: "6px",
          width: "30px",
          height: "30px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {showRightSidebar ? "▶" : "🚨"}
      </button>

      {/* CỘT PHẢI: DANH SÁCH TIẾP NHẬN SỰ CỐ KHẨN CẤP */}
      <div
        style={{
          width: showRightSidebar ? "350px" : "0px",
          opacity: showRightSidebar ? 1 : 0,
          height: "100vh",
          background: "#1e293b",
          borderLeft: showRightSidebar ? "1px solid #334155" : "none",
          padding: showRightSidebar ? "20px" : "0px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          boxSizing: "border-box",
          zIndex: 10,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
        }}
      >
        <h3 style={{ color: "#38bdf8", fontSize: "13px", margin: 0, fontWeight: "bold" }}>
          🚨 TRUNG TÂM TIẾP NHẬN SỰ CỐ
        </h3>
        <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>
          {isLoggedIn
            ? "Bảng điều phối và xử lý hạ tầng (Admin):"
            : "Danh sách sự cố đang được cơ quan xử lý công khai:"}
        </p>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
          {suCoList.map((sc) => (
            <div
              key={sc.id}
              onClick={() => map3DRef.current?.flyToCoordinates(sc.lon, sc.lat)}
              style={{
                background: "#0f172a",
                padding: "12px",
                borderRadius: "10px",
                borderLeft: `4px solid ${sc.color}`,
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#fff", fontWeight: "bold" }}>{sc.loai}</span>
                {isLoggedIn && (
                  <button
                    onClick={(e) => handleDeleteSuCo(e, sc.id)}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
                  >
                    🗑️
                  </button>
                )}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>📍 Diễn biến: {sc.viTri}</div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "6px",
                  paddingTop: "6px",
                  borderTop: "1px solid #1e293b",
                }}
              >
                <span style={{ fontSize: "10px", color: sc.color }}>
                  ● {!isLoggedIn && sc.trangThai === "Chưa xử lý" ? "Đang được tiếp nhận và khắc phục" : sc.trangThai}
                </span>
                {isLoggedIn && sc.trangThai !== "Đã hoàn thành" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateStatus(sc.id, sc.trangThai);
                    }}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: sc.trangThai === "Chưa xử lý" ? "#3b82f6" : "#10b981",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "9px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    {sc.trangThai === "Chưa xử lý" ? "⚡ Tiếp nhận" : "✔️ Hoàn thành"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===================================================================
          🔏 HỆ THỐNG POPUP MODALS
          =================================================================== */}

      {/* MODAL 1: ĐĂNG NHẬP */}
      {showLoginModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "12px",
              width: "320px",
              padding: "24px",
              color: "#fff",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowLoginModal(false)}
              style={{
                position: "absolute",
                top: "12px",
                right: "16px",
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ✕
            </button>
            <h2
              style={{
                fontSize: "14px",
                color: "#38bdf8",
                fontWeight: "bold",
                margin: "0 0 16px 0",
                textAlign: "center",
              }}
            >
              🔐 ĐĂNG NHẬP HỆ THỐNG QUẢN TRỊ
            </h2>
            <form
              onSubmit={handleLoginSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}
            >
              <input
                type="text"
                placeholder="Tài khoản cán bộ..."
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  padding: "8px",
                  backgroundColor: "#0f172a",
                  border: "1px solid #475569",
                  color: "#fff",
                  borderRadius: "6px",
                }}
              />
              <input
                type="password"
                placeholder="Mật khẩu bảo mật..."
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  padding: "8px",
                  backgroundColor: "#0f172a",
                  border: "1px solid #475569",
                  color: "#fff",
                  borderRadius: "6px",
                }}
              />
              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                🔑 Xác nhận đăng nhập
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FORM THÊM/SỬA CÂY XANH ĐÔ THỊ ĐA PHÂN KHU CHUẨN ĐÉT */}
      {activeCrudTable === "cay_xanh" && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #10b981",
              borderRadius: "16px",
              width: "380px",
              padding: "24px",
              color: "#fff",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
          >
            <h2
              style={{
                fontSize: "14px",
                color: "#10b981",
                fontWeight: "bold",
                margin: "0 0 16px 0",
                textTransform: "uppercase",
              }}
            >
              🌲{" "}
              {crudAction === "create"
                ? "Thêm mới thực thể không gian"
                : `Cập nhật thuộc tính cây #${treeFormData.MaCayXanh}`}
            </h2>
            <form
              onSubmit={handleAdminCrudSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "11px" }}
            >
              {/* CHỌN TUYẾN ĐƯỜNG ĐỂ LIÊN KẾT KHÓA NGOẠI POSTGRESQL */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ color: "#94a3b8" }}>Tuyến đường thuộc quản lý:</label>
                <select
                  value={treeFormData.MaTuyenDuong}
                  onChange={(e) => setTreeFormData({ ...treeFormData, MaTuyenDuong: parseInt(e.target.value) })}
                  style={{
                    padding: "7px",
                    backgroundColor: "#0f172a",
                    border: "1px solid #475569",
                    color: "#fff",
                    borderRadius: "6px",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="1">Trục chính Nguyễn Huệ (Quận 1)</option>
                  <option value="2">Đường Trương Định (Tao Đàn)</option>
                  <option value="3">Trục đi bộ Công viên 23 Tháng 9</option>
                </select>
              </div>

              {/* CHỦNG LOẠI CÂY */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ color: "#94a3b8" }}>Chủng loại cây xanh:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cây Sao Đen, Dầu Rái..."
                  required
                  value={treeFormData.loaiCay}
                  onChange={(e) => setTreeFormData({ ...treeFormData, loaiCay: e.target.value })}
                  style={{
                    padding: "7px",
                    backgroundColor: "#0f172a",
                    border: "1px solid #475569",
                    color: "#fff",
                    borderRadius: "6px",
                  }}
                />
              </div>

              {/* LƯỚI HAI CỘT: CHIỀU CAO VÀ ĐƯỜNG KÍNH TÁN */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ color: "#94a3b8" }}>Chiều cao (m):</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="15.5"
                    required
                    value={treeFormData.chieuCao}
                    onChange={(e) => setTreeFormData({ ...treeFormData, chieuCao: e.target.value })}
                    style={{
                      padding: "7px",
                      backgroundColor: "#0f172a",
                      border: "1px solid #475569",
                      color: "#fff",
                      borderRadius: "6px",
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ color: "#94a3b8" }}>Đường kính tán (m):</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="4.5"
                    required
                    value={treeFormData.duongKinhTan}
                    onChange={(e) => setTreeFormData({ ...treeFormData, duongKinhTan: e.target.value })}
                    style={{
                      padding: "7px",
                      backgroundColor: "#0f172a",
                      border: "1px solid #475569",
                      color: "#fff",
                      borderRadius: "6px",
                    }}
                  />
                </div>
              </div>

              {/* TRẠNG THÁI SỨC KHỎE */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ color: "#94a3b8" }}>Trạng thái sức khỏe sinh trưởng:</label>
                <select
                  value={treeFormData.tinhTrang}
                  onChange={(e) => setTreeFormData({ ...treeFormData, tinhTrang: e.target.value })}
                  style={{
                    padding: "7px",
                    backgroundColor: "#0f172a",
                    border: "1px solid #475569",
                    color: "#fff",
                    borderRadius: "6px",
                  }}
                >
                  <option value="Khỏe mạnh">🟢 Khỏe mạnh (Sinh trưởng tốt)</option>
                  <option value="Cần chăm sóc">🟡 Cần chăm sóc (Héo lá)</option>
                  <option value="Sâu bệnh">🔴 Sâu bệnh đô thị nguy hiểm</option>
                </select>
              </div>

              {/* LƯỚI HAI CỘT: KINH ĐỘ VÀ VĨ ĐỘ FLAT TOẠ ĐỘ THÔ */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ color: "#94a3b8" }}>Kinh độ (X - Longitude):</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="106.7021"
                    required
                    value={treeFormData.lon}
                    onChange={(e) => setTreeFormData({ ...treeFormData, lon: e.target.value })}
                    style={{
                      padding: "7px",
                      backgroundColor: "#0f172a",
                      border: "1px solid #475569",
                      color: "#fff",
                      borderRadius: "6px",
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ color: "#94a3b8" }}>Vĩ độ (Y - Latitude):</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="10.7725"
                    required
                    value={treeFormData.lat}
                    onChange={(e) => setTreeFormData({ ...treeFormData, lat: e.target.value })}
                    style={{
                      padding: "7px",
                      backgroundColor: "#0f172a",
                      border: "1px solid #475569",
                      color: "#fff",
                      borderRadius: "6px",
                    }}
                  />
                </div>
              </div>

              {/* CỤM NÚT ĐIỀU HÀNH FORM */}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCrudTable(null);
                    setClickCoords(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "8px",
                    backgroundColor: "#475569",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: "8px",
                    backgroundColor: "#10b981",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  💥 Lưu vào CSDL PostGIS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: XEM DANH SÁCH SỰ CỐ */}
      {showIncidentListModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "40px",
          }}
        >
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #ef4444",
              borderRadius: "16px",
              width: "90%",
              maxWidth: "850px",
              maxHeight: "80vh",
              padding: "24px",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #334155",
                paddingBottom: "10px",
              }}
            >
              <h2 style={{ fontSize: "14px", color: "#ef4444", fontWeight: "bold", margin: 0 }}>
                📊 QUẢN LÝ THUỘC TÍNH BẢNG: SU_CO ({suCoList.length} bản ghi)
              </h2>
              <button
                onClick={() => setShowIncidentListModal(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontWeight: "bold" }}
              >
                ✕ Đóng
              </button>
            </div>
            <div style={{ flex: 1, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#0f172a",
                      color: "#94a3b8",
                      borderBottom: "1px solid #334155",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "10px" }}>Mã sự cố</th>
                    <th style={{ padding: "10px" }}>Phân loại</th>
                    <th style={{ padding: "10px" }}>Mô tả chi tiết</th>
                    <th style={{ padding: "10px" }}>Trạng thái vận hành</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {suCoList.map((sc) => (
                    <tr key={sc.id} style={{ borderBottom: "1px solid #334155" }}>
                      <td style={{ padding: "10px", color: "#38bdf8" }}>#{sc.id}</td>
                      <td style={{ padding: "10px", fontWeight: "bold" }}>{sc.loai}</td>
                      <td style={{ padding: "10px" }}>{sc.viTri}</td>
                      <td style={{ padding: "10px", color: sc.color }}>● {sc.trangThai}</td>
                      <td style={{ padding: "10px", display: "flex", gap: "6px", justifyContent: "center" }}>
                        <button
                          onClick={() => {
                            handleUpdateStatus(sc.id, sc.trangThai);
                            setTimeout(() => fetchSuCoTuDB(), 300);
                          }}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#334155",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "10px",
                            cursor: "pointer",
                          }}
                        >
                          ⚡ Đổi bước
                        </button>
                        <button
                          onClick={(e) => {
                            handleDeleteSuCo(e, sc.id);
                            setTimeout(() => fetchSuCoTuDB(), 300);
                          }}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#ef4444",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "10px",
                            cursor: "pointer",
                          }}
                        >
                          🗑️ Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: FORM NHẬP NHẬT KÝ */}
      {activeCrudTable === "nhat_ky" && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #f59e0b",
              borderRadius: "16px",
              width: "350px",
              padding: "24px",
              color: "#fff",
            }}
          >
            <h2 style={{ fontSize: "14px", color: "#f59e0b", fontWeight: "bold", margin: "0 0 16px 0" }}>
              📅 GHI SỔ NHẬT KÝ ĐIỀU HÀNH
            </h2>
            <form
              onSubmit={handleAdminCrudSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ color: "#94a3b8" }}>Mã định danh cây xử lý (ID cây):</label>
                <input
                  type="number"
                  required
                  placeholder="Ví dụ: 8, 12, 100..."
                  value={diaryFormData.cayXanhId}
                  onChange={(e) => setDiaryFormData({ ...diaryFormData, cayXanhId: e.target.value })}
                  style={{
                    padding: "8px",
                    backgroundColor: "#0f172a",
                    border: "1px solid #475569",
                    color: "#fff",
                    borderRadius: "6px",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ color: "#94a3b8" }}>Hạng mục công việc công vụ:</label>
                <select
                  value={diaryFormData.loaiCongViec}
                  onChange={(e) => setDiaryFormData({ ...diaryFormData, loaiCongViec: e.target.value })}
                  style={{
                    padding: "8px",
                    backgroundColor: "#0f172a",
                    border: "1px solid #475569",
                    color: "#fff",
                    borderRadius: "6px",
                  }}
                >
                  <option value="Tưới nước">💧 Tưới nước định kỳ</option>
                  <option value="Bón phân">🧫 Bón phân hữu cơ vi sinh</option>
                  <option value="Cắt tỉa cành">✂️ Cắt tỉa cành nhánh hiểm họa</option>
                  <option value="Phun thuốc">🐛 Phun thuốc diệt rầy sinh học</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ color: "#94a3b8" }}>Ngày thực hiện hiện trường:</label>
                <input
                  type="date"
                  required
                  value={diaryFormData.ngayThucHien}
                  onChange={(e) => setDiaryFormData({ ...diaryFormData, ngayThucHien: e.target.value })}
                  style={{
                    padding: "8px",
                    backgroundColor: "#0f172a",
                    border: "1px solid #475569",
                    color: "#fff",
                    borderRadius: "6px",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setActiveCrudTable(null)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    backgroundColor: "#475569",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: "8px",
                    backgroundColor: "#f59e0b",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "bold",
                  }}
                >
                  💾 Ghi nhận sổ sách
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: FORM THÊM ĐƠN VỊ */}
      {activeCrudTable === "don_vi" && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #3b82f6",
              borderRadius: "16px",
              width: "350px",
              padding: "24px",
              color: "#fff",
            }}
          >
            <h2 style={{ fontSize: "14px", color: "#3b82f6", fontWeight: "bold", margin: "0 0 16px 0" }}>
              🏢 THÊM ĐƠN VỊ CÔNG TÁC PHỤ TRÁCH
            </h2>
            <form
              onSubmit={handleAdminCrudSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}
            >
              <input
                type="text"
                required
                placeholder="Tên đơn vị công ty mảng xanh..."
                value={unitFormData.tenDonVi}
                onChange={(e) => setUnitFormData({ ...unitFormData, tenDonVi: e.target.value })}
                style={{
                  padding: "8px",
                  backgroundColor: "#0f172a",
                  border: "1px solid #475569",
                  color: "#fff",
                  borderRadius: "6px",
                }}
              />
              <input
                type="text"
                required
                placeholder="Tên kỹ sư đại diện..."
                value={unitFormData.nguoiDaiDien}
                onChange={(e) => setUnitFormData({ ...unitFormData, nguoiDaiDien: e.target.value })}
                style={{
                  padding: "8px",
                  backgroundColor: "#0f172a",
                  border: "1px solid #475569",
                  color: "#fff",
                  borderRadius: "6px",
                }}
              />
              <input
                type="text"
                required
                placeholder="Số điện thoại nóng đường dây..."
                value={unitFormData.soDienThoai}
                onChange={(e) => setUnitFormData({ ...unitFormData, soDienThoai: e.target.value })}
                style={{
                  padding: "8px",
                  backgroundColor: "#0f172a",
                  border: "1px solid #475569",
                  color: "#fff",
                  borderRadius: "6px",
                }}
              />
              <input
                type="text"
                required
                placeholder="Địa bàn phụ trách (Ví dụ: Phường 5, Q.1)..."
                value={unitFormData.khuVucPhuTrach}
                onChange={(e) => setUnitFormData({ ...unitFormData, khuVucPhuTrach: e.target.value })}
                style={{
                  padding: "8px",
                  backgroundColor: "#0f172a",
                  border: "1px solid #475569",
                  color: "#fff",
                  borderRadius: "6px",
                }}
              />
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setActiveCrudTable(null)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    backgroundColor: "#475569",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: "8px",
                    backgroundColor: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "bold",
                  }}
                >
                  ⚡ Khởi tạo cấu trúc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: DATATABLE LỚN DANH SÁCH CÂY XANH ĐA CHIỀU */}
      {showTreeListModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #10b981",
              borderRadius: "16px",
              width: "95%",
              maxWidth: "1100px",
              maxHeight: "85vh",
              padding: "24px",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #334155",
                paddingBottom: "12px",
              }}
            >
              <h2 style={{ fontSize: "15px", color: "#10b981", fontWeight: "bold", margin: 0 }}>
                📊 DANH SÁCH THUỘC TÍNH QUẦN THỂ CÂY XANH ĐÔ THỊ ({allTrees.length} thực thể Không gian)
              </h2>
              <button
                onClick={() => setShowTreeListModal(false)}
                style={{
                  background: "#334155",
                  border: "none",
                  color: "#94a3b8",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "12px",
                }}
              >
                ✕ Đóng giao diện
              </button>
            </div>
            <div style={{ flex: 1, overflow: "auto", borderRadius: "8px", border: "1px solid #334155" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#0f172a",
                      color: "#94a3b8",
                      borderBottom: "1px solid #334155",
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                    }}
                  >
                    <th style={{ padding: "12px" }}>Mã số (ID)</th>
                    <th style={{ padding: "12px" }}>Chủng loại cây</th>
                    <th style={{ padding: "12px" }}>Chiều cao Vạn tuế</th>
                    <th style={{ padding: "12px" }}>Đường kính tán</th>
                    <th style={{ padding: "12px" }}>Trạng thái sinh trưởng</th>
                    <th style={{ padding: "12px" }}>Tọa độ không gian (X, Y)</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Thao tác dữ liệu</th>
                  </tr>
                </thead>
                <tbody>
                  {allTrees.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        style={{ padding: "40px", color: "#64748b", fontStyle: "italic", textAlign: "center" }}
                      >
                        📭 Không tìm thấy dữ liệu cây xanh nào tương ứng với phân khu này.
                      </td>
                    </tr>
                  ) : (
                    allTrees.map((tree) => (
                      <tr key={tree.id} style={{ borderBottom: "1px solid #334155", backgroundColor: "#1e293b" }}>
                        <td style={{ padding: "12px", fontWeight: "bold", color: "#34d399" }}>#{tree.id}</td>
                        <td style={{ padding: "12px", fontWeight: "bold" }}>{tree.loaiCay}</td>
                        <td style={{ padding: "12px" }}>{tree.chieuCao} m</td>
                        <td style={{ padding: "12px" }}>{tree.duongKinhTan} m</td>
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              backgroundColor:
                                tree.tinhTrang === "Khỏe mạnh"
                                  ? "rgba(16,185,129,0.15)"
                                  : tree.tinhTrang === "Cần chăm sóc"
                                    ? "rgba(245,158,11,0.15)"
                                    : "rgba(239,68,68,0.15)",
                              color:
                                tree.tinhTrang === "Khỏe mạnh"
                                  ? "#10b981"
                                  : tree.tinhTrang === "Cần chăm sóc"
                                    ? "#f59e0b"
                                    : "#ef4444",
                            }}
                          >
                            {tree.tinhTrang}
                          </span>
                        </td>
                        <td style={{ padding: "12px", color: "#38bdf8", fontFamily: "monospace" }}>
                          {parseFloat(tree.lon).toFixed(6)}, {parseFloat(tree.lat).toFixed(6)}
                        </td>
                        <td style={{ padding: "12px", display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button
                            onClick={() => {
                              setCrudAction("update");
                              setTreeFormData({
                                MaCayXanh: tree.id,
                                MaTuyenDuong: tree.maTuyenDuong || "1",
                                loaiCay: tree.loaiCay,
                                tinhTrang: tree.tinhTrang,
                                chieuCao: tree.chieuCao,
                                duongKinhTan: tree.duongKinhTan,
                                lon: tree.lon,
                                lat: tree.lat,
                              });
                              setShowTreeListModal(false);
                              setActiveCrudTable("cay_xanh");
                            }}
                            style={{
                              padding: "5px 12px",
                              backgroundColor: "#f59e0b",
                              color: "#fff",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                          >
                            ✏️ Sửa
                          </button>
                          {isLoggedIn && (
                            <button
                              onClick={async () => {
                                if (window.confirm(`⚠️ Bạn có chắc chắn muốn xóa vĩnh viễn cây #${tree.id}?`)) {
                                  const res = await fetch(`http://localhost:5000/api/map/cay-xanh/${tree.id}`, {
                                    method: "DELETE",
                                  });
                                  if (res.ok) {
                                    alert("🗑️ Đã xóa cây thành công khỏi PostgreSQL!");
                                    setAllTrees(allTrees.filter((t) => t.id !== tree.id));
                                    if (map3DRef.current) map3DRef.current.refreshLayers();
                                  }
                                }
                              }}
                              style={{
                                padding: "5px 12px",
                                backgroundColor: "#ef4444",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "bold",
                                cursor: "pointer",
                              }}
                            >
                              🗑️ Xóa
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: DATATABLE LỚN NHẬT KÝ CHĂM SÓC */}
      {showDiaryListModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999999,
            padding: "40px",
          }}
        >
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #38bdf8",
              borderRadius: "16px",
              width: "95%",
              maxWidth: "1000px",
              maxHeight: "85vh",
              padding: "24px",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #334155",
                paddingBottom: "12px",
              }}
            >
              <h2 style={{ fontSize: "15px", color: "#38bdf8", fontWeight: "bold", margin: 0 }}>
                📅 SỔ TÁC NGHIỆP & LỊCH SỬ CHĂM SÓC CÂY ĐÔ THỊ ({allDiaries?.length || 0} lượt ghi chép)
              </h2>
              <button
                onClick={() => setShowDiaryListModal(false)}
                style={{
                  background: "#334155",
                  border: "none",
                  color: "#94a3b8",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "12px",
                }}
              >
                ✕ Đóng sổ sách
              </button>
            </div>
            <div style={{ flex: 1, overflow: "auto", borderRadius: "8px", border: "1px solid #334155" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#0f172a",
                      color: "#94a3b8",
                      borderBottom: "1px solid #334155",
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                    }}
                  >
                    <th style={{ padding: "12px" }}>Mã nhật ký</th>
                    <th style={{ padding: "12px" }}>Liên kết mã thực thể cây</th>
                    <th style={{ padding: "12px" }}>Ngày thực hiện tác vụ</th>
                    <th style={{ padding: "12px" }}>Nội dung công việc</th>
                    <th style={{ padding: "12px" }}>Ghi chú kỹ thuật</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Quản trị dòng</th>
                  </tr>
                </thead>
                <tbody>
                  {!allDiaries || allDiaries.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        style={{ padding: "40px", color: "#64748b", fontStyle: "italic", textAlign: "center" }}
                      >
                        📭 Không tìm thấy dữ liệu nhật ký chăm sóc nào.
                      </td>
                    </tr>
                  ) : (
                    allDiaries.map((diary) => (
                      <tr key={diary.id} style={{ borderBottom: "1px solid #334155", backgroundColor: "#1e293b" }}>
                        <td style={{ padding: "12px", fontWeight: "bold", color: "#38bdf8" }}>#{diary.id}</td>
                        <td style={{ padding: "12px", fontWeight: "bold", color: "#34d399" }}>
                          🌲 Cây #{diary.cayXanhId}
                        </td>
                        <td style={{ padding: "12px", fontFamily: "monospace" }}>
                          {diary.ngayThucHien ? new Date(diary.ngayThucHien).toLocaleDateString("vi-VN") : "---"}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              backgroundColor: "rgba(56, 189, 248, 0.15)",
                              color: "#38bdf8",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "bold",
                            }}
                          >
                            {diary.loaiCongViec}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            color: "#cbd5e1",
                            maxWidth: "300px",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                          }}
                        >
                          {diary.ghiChu || (
                            <span style={{ color: "#475569", fontStyle: "italic" }}>Không có ghi chú</span>
                          )}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <button
                            onClick={async () => {
                              if (window.confirm(`⚠️ Xóa dòng nhật ký #${diary.id}?`)) {
                                const res = await fetch(`http://localhost:5000/api/map/nhat-ky/${diary.id}`, {
                                  method: "DELETE",
                                });
                                if (res.ok) {
                                  alert("🗑️ Đã xóa dòng!");
                                  setAllDiaries(allDiaries.filter((d) => d.id !== diary.id));
                                }
                              }
                            }}
                            style={{
                              padding: "4px 10px",
                              backgroundColor: "#ef4444",
                              color: "#fff",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                          >
                            🗑️ Gỡ
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
