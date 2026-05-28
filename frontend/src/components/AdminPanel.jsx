import React, {Component} from "react";

class AdminPanel extends Component {
  constructor(props) {
    super(props);
    // Khởi tạo State ban đầu cho Class Component
    this.state = {
      loai_cay: "",
      tinh_trang: "Bình thường",
      chieu_cao: "",
      duong_kinh_tan: "",
      longitude: "",
      latitude: "",
    };

    // Bind các hàm xử lý dữ liệu để không bị mất ngữ cảnh 'this'
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
  }

  // Lifecycle theo dõi sự thay đổi của Props (khi người dùng click chọn cây khác trên bản đồ)
  componentDidUpdate(prevProps) {
    // Nếu có cây xanh được chọn mới và khác với cây cũ trước đó
    if (this.props.selectedTree && this.props.selectedTree !== prevProps.selectedTree) {
      const {loaiCay, tinhTrang, chieuCao, duongKinhTan, lon, lat} = this.props.selectedTree;
      // Đồng bộ dữ liệu cây được chọn vào state để hiển thị lên Form chỉnh sửa
      this.setState({
        loai_cay: loaiCay || "",
        tinh_trang: tinhTrang || "Bình thường",
        chieu_cao: chieuCao || "",
        duong_kinh_tan: duongKinhTan || "",
        longitude: lon || "",
        latitude: lat || "",
      });
    }
  }

  // Hàm xử lý thay đổi dữ liệu đồng bộ cho tất cả các ô Input trong Form
  handleInputChange(event) {
    const {name, value} = event.target;
    this.setState({
      [name]: value,
    });
  }

  // [POST] Gửi dữ liệu yêu cầu THÊM hoặc SỬA cây xanh xuống Backend Node.js
  async handleSubmit(event) {
    event.preventDefault();
    const {selectedTree, onCrudSuccess} = this.props;

    // Nếu đang chọn một cây cụ thể -> Chuyển sang chế độ CẬP NHẬT (PUT), ngược lại -> THÊM MỚI (POST)
    const isEdit = !!selectedTree;
    const url = isEdit
      ? `http://localhost:5000/api/map/cay-xanh/${selectedTree.id}`
      : `http://localhost:5000/api/map/cay-xanh`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          loai_cay: this.state.loai_cay,
          tinh_trang: this.state.tinh_trang,
          chieu_cao: parseFloat(this.state.chieu_cao),
          duong_kinh_tan: parseFloat(this.state.duong_kinh_tan),
          longitude: parseFloat(this.state.longitude),
          latitude: parseFloat(this.state.latitude),
        }),
      });

      if (response.ok) {
        alert(isEdit ? "Cập nhật thông tin cây xanh thành công!" : "Đã thêm cây xanh mới vào PostGIS!");
        // Gọi hàm Callback từ Component cha để vẽ lại (Refresh) lớp ArcGIS Layer
        if (onCrudSuccess) onCrudSuccess();

        // Reset Form về trạng thái trống nếu là thêm mới
        if (!isEdit) {
          this.setState({
            loai_cay: "",
            tinh_trang: "Bình thường",
            chieu_cao: "",
            duong_kinh_tan: "",
            longitude: "",
            latitude: "",
          });
        }
      } else {
        const errData = await response.json();
        alert("Lỗi hệ thống: " + errData.message);
      }
    } catch (error) {
      console.error(error);
      alert("Không thể kết nối đến máy chủ quản trị Backend!");
    }
  }

  // [DELETE] Gọi API yêu cầu xóa hoàn toàn thực thể cây xanh khỏi cơ sở dữ liệu
  async handleDelete() {
    const {selectedTree, onCrudSuccess} = this.props;
    if (!selectedTree) return;

    if (window.confirm(`Bạn có chắc chắn muốn xóa cây xanh mã số #${selectedTree.id} khỏi hệ thống GIS?`)) {
      try {
        const response = await fetch(`http://localhost:5000/api/map/cay-xanh/${selectedTree.id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          alert(`Đã xóa hoàn toàn cây xanh mã số #${selectedTree.id} khỏi Database PostGIS.`);
          if (onCrudSuccess) onCrudSuccess();
        } else {
          alert("Lỗi phân quyền, không thể xóa thực thể.");
        }
      } catch (error) {
        console.error(error);
        alert("Mất kết nối máy chủ!");
      }
    }
  }

  render() {
    const {selectedTree} = this.props;

    return (
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "80px",
          zIndex: 1000,
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          border: "1px solid #334155",
          padding: "18px",
          borderRadius: "16px",
          color: "#fff",
          fontFamily: "sans-serif",
          width: "270px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
        }}
      >
        <h3
          style={{margin: "0 0 12px 0", fontSize: "13px", color: "#10b981", fontWeight: "bold", letterSpacing: "0.5px"}}
        >
          ⚙️ PHÂN HỆ QUẢN TRỊ VIÊN (CLASS)
        </h3>

        {/* KHU VỰC 1: XÓA THỰC THỂ KHÔNG GIAN ĐỘNG */}
        <div style={{marginBottom: "15px", paddingBottom: "12px", borderBottom: "1px solid #334155"}}>
          <label style={{fontSize: "11px", color: "#94a3b8", fontWeight: "bold"}}>Đối tượng đang chọn:</label>
          {selectedTree ? (
            <div style={{marginTop: "6px"}}>
              <div style={{fontSize: "12px", color: "#38bdf8", marginBottom: "6px"}}>
                Mã cây: #{selectedTree.id} - {selectedTree.loaiCay}
              </div>
              <button
                type="button"
                onClick={this.handleDelete}
                style={{
                  width: "100%",
                  padding: "7px",
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "11px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  transition: "0.2s",
                }}
              >
                🗑️ Xóa cây này khỏi hệ thống
              </button>
            </div>
          ) : (
            <div style={{fontSize: "11px", color: "#64748b", fontStyle: "italic", marginTop: "4px"}}>
              Nhấp chọn 1 cây trên bản đồ để kích hoạt quản trị...
            </div>
          )}
        </div>

        {/* KHU VỰC 2: FORM THÊM / CHỈNH SỬA THUỘC TÍNH ĐA NĂNG */}
        <form
          onSubmit={this.handleSubmit}
          style={{display: "flex", flexDirection: "column", gap: "8px", fontSize: "11px"}}
        >
          <label style={{color: "#94a3b8", fontWeight: "bold"}}>
            {selectedTree ? "📝 Chỉnh sửa thuộc tính cây:" : "➕ Thêm cây mới vào bản đồ:"}
          </label>

          <input
            type="text"
            name="loai_cay"
            placeholder="Tên loài cây (Ví dụ: Sao Đen)"
            required
            value={this.state.loai_cay}
            onChange={this.handleInputChange}
            style={{
              padding: "6px",
              backgroundColor: "#1e293b",
              border: "1px solid #475569",
              color: "#fff",
              borderRadius: "6px",
            }}
          />

          <select
            name="tinh_trang"
            value={this.state.tinh_trang}
            onChange={this.handleInputChange}
            style={{
              padding: "6px",
              backgroundColor: "#1e293b",
              border: "1px solid #475569",
              color: "#fff",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            <option value="Bình thường">🟢 Bình thường</option>
            <option value="Cần chăm sóc">🟡 Cần chăm sóc</option>
            <option value="Sâu bệnh">🔴 Sâu bệnh</option>
          </select>

          <div style={{display: "flex", gap: "6px"}}>
            <input
              type="number"
              name="chieu_cao"
              step="0.1"
              placeholder="Cao (m)"
              required
              value={this.state.chieu_cao}
              onChange={this.handleInputChange}
              style={{
                flex: 1,
                padding: "6px",
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                color: "#fff",
                borderRadius: "6px",
              }}
            />
            <input
              type="number"
              name="duong_kinh_tan"
              step="0.1"
              placeholder="Tán (m)"
              required
              value={this.state.duong_kinh_tan}
              onChange={this.handleInputChange}
              style={{
                flex: 1,
                padding: "6px",
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                color: "#fff",
                borderRadius: "6px",
              }}
            />
          </div>

          <div style={{display: "flex", gap: "6px"}}>
            <input
              type="number"
              name="longitude"
              step="0.000001"
              placeholder="Kinh độ (X)"
              required
              value={this.state.longitude}
              onChange={this.handleInputChange}
              style={{
                flex: 1,
                padding: "6px",
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                color: "#fff",
                borderRadius: "6px",
              }}
            />
            <input
              type="number"
              name="latitude"
              step="0.000001"
              placeholder="Vĩ độ (Y)"
              required
              value={this.state.latitude}
              onChange={this.handleInputChange}
              style={{
                flex: 1,
                padding: "6px",
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                color: "#fff",
                borderRadius: "6px",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: selectedTree ? "#eab308" : "#10b981",
              color: selectedTree ? "#0f172a" : "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              marginTop: "4px",
              transition: "0.2s",
            }}
          >
            {selectedTree ? "⚡ Cập nhật dữ liệu" : "💾 Thêm vào PostGIS"}
          </button>
        </form>
      </div>
    );
  }
}

export default AdminPanel;
