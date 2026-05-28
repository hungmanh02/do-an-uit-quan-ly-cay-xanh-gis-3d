import React, {useState} from "react";

const ManagementModal = ({type, onClose, onSuccess}) => {
  // Quản lý state cho form động
  const [treeForm, setTreeForm] = useState({
    loai_cay: "",
    tinh_trang: "Bình thường",
    chieu_cao: "",
    duong_kinh_tan: "",
    lon: "",
    lat: "",
  });
  const [roadForm, setRoadForm] = useState({ten_duong: "", loai_duong: "Đường nhựa", chieu_dai: ""});
  const [areaForm, setAreaForm] = useState({ten_khu_vuc: "", don_vi: "Quận 1"});

  const titles = {
    tree: "🌳 THÊM CÂY XANH ĐÔ THỊ MỚI (POSTGIS)",
    road: "🛣️ CẬP NHẬT TUYẾN ĐƯỜNG PHÂN CẤP VỈA HÈ",
    area: "📐 QUẢN LÝ RANH GIỚI KHU VỰC HÀNH CHÍNH",
    report: "📊 TRUNG TÂM XUẤT BÁO CÁO THỐNG KÊ BIẾN ĐỘNG",
  };

  // Xử lý gửi API POST cho từng phân hệ cụ thể
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    let url = "";
    let bodyData = {};

    if (type === "tree") {
      url = "http://localhost:5000/api/map/cay-xanh";
      bodyData = {
        loai_cay: treeForm.loai_cay,
        tinh_trang: treeForm.tinh_trang,
        chieu_cao: parseFloat(treeForm.chieu_cao),
        duong_kinh_tan: parseFloat(treeForm.duong_kinh_tan),
        longitude: parseFloat(treeForm.lon),
        latitude: parseFloat(treeForm.lat),
      };
    } else if (type === "road") {
      url = "http://localhost:5000/api/map/tuyen-duong";
      bodyData = roadForm;
    } else if (type === "area") {
      url = "http://localhost:5000/api/map/khu-vuc";
      bodyData = areaForm;
    }

    if (type === "report") {
      alert("📥 Đang xuất file Excel báo cáo thống kê tình hình cây xanh đô thị...");
      onClose();
      return;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(bodyData),
      });

      if (response.ok) {
        alert("🎉 Ghi nhận thực thể không gian vào CSDL PostGIS thành công!");
        onSuccess(); // Refresh lại lớp bản đồ và đóng modal
      } else {
        alert("Lỗi không thể đồng bộ.");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối API máy chủ!");
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={contentStyle}>
        {/* Header Modal */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            borderBottom: "1px solid #334155",
            paddingBottom: "10px",
          }}
        >
          <h2 style={{color: "#34d399", fontSize: "14px", margin: 0, fontWeight: "bold"}}>{titles[type]}</h2>
          <button
            onClick={onClose}
            style={{background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px"}}
          >
            ✕
          </button>
        </div>

        {/* Form xử lý động theo phân hệ đường link được chọn */}
        <form onSubmit={handleFormSubmit} style={{display: "flex", flexDirection: "column", gap: "12px"}}>
          {/* TAB 1: FORM CÂY XANH */}
          {type === "tree" && (
            <>
              <input
                style={inputStyle}
                type="text"
                placeholder="Loại cây (Ví dụ: Dầu Rái)"
                required
                value={treeForm.loai_cay}
                onChange={(e) => setTreeForm({...treeForm, loai_cay: e.target.value})}
              />
              <select
                style={inputStyle}
                value={treeForm.tinh_trang}
                onChange={(e) => setTreeForm({...treeForm, tinh_trang: e.target.value})}
              >
                <option value="Bình thường">🟢 Bình thường</option>
                <option value="Cần chăm sóc">🟡 Cần chăm sóc</option>
                <option value="Sâu bệnh">🔴 Sâu bệnh</option>
              </select>
              <div style={{display: "flex", gap: "8px"}}>
                <input
                  style={inputStyle}
                  type="number"
                  step="0.1"
                  placeholder="Cao (m)"
                  required
                  value={treeForm.chieu_cao}
                  onChange={(e) => setTreeForm({...treeForm, chieu_cao: e.target.value})}
                />
                <input
                  style={inputStyle}
                  type="number"
                  step="0.1"
                  placeholder="Tán (m)"
                  required
                  value={treeForm.duong_kinh_tan}
                  onChange={(e) => setTreeForm({...treeForm, duong_kinh_tan: e.target.value})}
                />
              </div>
              <div style={{display: "flex", gap: "8px"}}>
                <input
                  style={inputStyle}
                  type="number"
                  step="0.000001"
                  placeholder="Kinh độ (X)"
                  required
                  value={treeForm.lon}
                  onChange={(e) => setTreeForm({...treeForm, lon: e.target.value})}
                />
                <input
                  style={inputStyle}
                  type="number"
                  step="0.000001"
                  placeholder="Vĩ độ (Y)"
                  required
                  value={treeForm.lat}
                  onChange={(e) => setTreeForm({...treeForm, lat: e.target.value})}
                />
              </div>
            </>
          )}

          {/* TAB 2: FORM TUYẾN ĐƯỜNG */}
          {type === "road" && (
            <>
              <input
                style={inputStyle}
                type="text"
                placeholder="Tên tuyến đường vỉa hè"
                required
                value={roadForm.ten_duong}
                onChange={(e) => setRoadForm({...roadForm, ten_duong: e.target.value})}
              />
              <select
                style={inputStyle}
                value={roadForm.loai_duong}
                onChange={(e) => setRoadForm({...roadForm, loai_duong: e.target.value})}
              >
                <option value="Đường nhựa">Đường nhựa cao cấp</option>
                <option value="Đường bê tông">Đường bê tông</option>
                <option value="Đất cát vỉa hè">Hạ tầng đất vỉa hè</option>
              </select>
            </>
          )}

          {/* TAB 3: FORM KHU VỰC */}
          {type === "area" && (
            <>
              <input
                style={inputStyle}
                type="text"
                placeholder="Tên ranh giới hành chính"
                required
                value={areaForm.ten_khu_vuc}
                onChange={(e) => setAreaForm({...areaForm, ten_khu_vuc: e.target.value})}
              />
            </>
          )}

          {/* TAB 4: FORM XUẤT BÁO CÁO */}
          {type === "report" && (
            <div
              style={{
                color: "#94a3b8",
                fontSize: "12px",
                lineHeight: "1.5",
                padding: "10px",
                backgroundColor: "#0f172a",
                borderRadius: "8px",
              }}
            >
              📊 Hệ thống tự động truy vấn không gian SQL, thống kê mật độ phân phủ cây xanh và phân tích tỉ lệ sâu bệnh
              của Sở TN&MT.
            </div>
          )}

          {/* Nút bấm tác vụ */}
          <div style={{display: "flex", gap: "10px", marginTop: "10px"}}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>
              Hủy
            </button>
            <button type="submit" style={saveBtnStyle}>
              {type === "report" ? "⚡ Xuất Excel" : "💾 Lưu vào PostGIS"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Kiểu dáng thiết kế kính mờ Modal (Glassmorphism)
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(15, 23, 42, 0.75)",
  backdropFilter: "blur(5px)",
  zIndex: 10001,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};
const contentStyle = {
  background: "#1e293b",
  padding: "20px",
  borderRadius: "14px",
  width: "340px",
  border: "1px solid #334155",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
  fontFamily: "sans-serif",
};
const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "6px",
  color: "#fff",
  outline: "none",
  fontSize: "12px",
  boxSizing: "border-box",
};
const saveBtnStyle = {
  flex: 2,
  padding: "8px",
  background: "#10b981",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "12px",
};
const cancelBtnStyle = {
  flex: 1,
  padding: "8px",
  background: "#475569",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "12px",
};

export default ManagementModal;
