// frontend/src/components/ExcelImporter.jsx
import React, {useState} from "react";

const ExcelImporter = ({onImportSuccess}) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("⚠️ Vui lòng chọn file Excel danh sách cây xanh!");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Gọi chính xác API Import cây xanh mới sửa ở Backend
      const response = await fetch("http://localhost:5000/api/map/import-cay-xanh", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message);
        setFile(null);
        // Gọi hàm callback để làm mới lại các lớp layer cây xanh trên bản đồ ArcGIS 3D
        if (onImportSuccess) onImportSuccess();
      } else {
        alert(`❌ Lỗi: ${data.error || "Không thể import dữ liệu."}`);
      }
    } catch (error) {
      console.error("Lỗi:", error);
      alert("🔴 Lỗi kết nối đến máy chủ API!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#0f172a",
        padding: "16px",
        borderRadius: "12px",
        border: "1px dashed #475569",
        marginTop: "15px",
      }}
    >
      <h3 style={{color: "#34d399", fontSize: "12px", margin: "0 0 10px 0", fontWeight: "bold"}}>
        📥 NẠP DANH SÁCH CÂY XANH ĐÔ THỊ
      </h3>
      <form onSubmit={handleUpload} style={{display: "flex", flexDirection: "column", gap: "10px"}}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            padding: "8px 12px",
            color: "#cbd5e1",
            fontSize: "11px",
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          🌲 {file ? `Đã chọn: ${file.name}` : "Chọn tệp Excel 100 cây Quận 1..."}
          <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} style={{display: "none"}} />
        </label>

        {file && (
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: loading ? "#475569" : "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "⌛ Đang dựng thực thể GIS..." : "💥 Tiến hành Import vào PostGIS"}
          </button>
        )}
      </form>
    </div>
  );
};

export default ExcelImporter;
