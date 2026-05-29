// backend/server.js
const express = require("express");
const cors = require("cors");
const mapRoutes = require("./routes/mapRoutes");
const db = require("./config/db"); // Tích hợp bộ kết nối database để test ping lúc khởi động

const app = express();

// Kích hoạt CORS cho phép Frontend React kết nối không bị chặn
app.use(cors());

// Cấu hình Express đọc và giải mã dữ liệu JSON (req.body) gửi từ Client
app.use(express.json());

// Định nghĩa tuyến đường trục trung tâm cho hệ thống GIS Chuyên ngành
app.use("/api/map", mapRoutes);

const PORT = 5000;

// Khởi chạy máy chủ và đồng bộ kiểm tra kết nối PostgreSQL / PostGIS
app.listen(PORT, async () => {
  console.log("\n==================================================================");
  console.log("   🌳   HỆ THỐNG WEB-GIS 3D QUẢN LÝ CÂY XANH ĐÔ THỊ TP.HCM   🌳   ");
  console.log("==================================================================");
  console.log(` 🚀  Trạng thái:   Server Node.js đang khởi chạy THÀNH CÔNG!`);
  console.log(` 🔌  Cổng kết nối: Hoạt động trên Port: [${PORT}]`);

  // 🛰️ PHÂN HỆ KIỂM TRA ĐƯỜNG TRUYỀN NGẦM ĐẾN DATABASE MỚI
  try {
    const resPing = await db.query("SELECT current_database();");
    console.log(` 🗄️  PostgreSQL:  Đã kết nối trực tiếp đến CSDL: [${resPing.rows[0].current_database}]`);
  } catch (err) {
    console.log(` 🔴  PostgreSQL:  ⚠️ CẢNH BÁO: Chưa kết nối được DB! Mạnh kiểm tra lại pgAdmin nhé.`);
  }

  console.log("------------------------------------------------------------------");
  console.log(" 🌐  DANH SÁCH TẤT CẢ CÁC ĐƯỜNG DẪN API (ENDPOINTS) HIỆN CÓ CỦA DỰ ÁN:");
  console.log("------------------------------------------------------------------");

  // 🗺️ TẦNG LỚP PHỦ KHÔNG GIAN GIS (CORE GEOJSON LAYER)
  console.log(" 🌐 1. TẦNG DỮ LIỆU ĐỊA LÝ KHÔNG GIAN ĐÔ THỊ (ARCGIS CHỮA LAYER):");
  console.log(`  🔹 [GET]    Xem Lớp Khu Vực (Polygon): http://localhost:${PORT}/api/map/khu-vuc`);
  console.log(`  🔹 [GET]    Xem Lớp Tuyến Đường (Line): http://localhost:${PORT}/api/map/tuyen-duong`);
  console.log(`  🔹 [GET]    Xem Lớp Cây Xanh (Point 3D): http://localhost:${PORT}/api/map/cay-xanh`);
  console.log(`  🔹 [GET]    Xem Bản Đồ Sự Cố (Heatmap): http://localhost:${PORT}/api/map/su-co`);
  console.log(" . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .");

  // 🌲 PHÂN HỆ BẢNG CÂY XANH ĐÔ THỊ (ADMIN CRUD)
  console.log(" 🌲 2. PHÂN HỆ TÁC NGHIỆP THỰC THỂ CÂY XANH (ADMIN CRUD):");
  console.log(`  🔸 [POST]   Thêm mới cây xanh đơn lẻ:   http://localhost:${PORT}/api/map/cay-xanh`);
  console.log(`  🔸 [PUT]    Cập nhật thuộc tính cây:    http://localhost:${PORT}/api/map/cay-xanh/:id`);
  console.log(`  🔸 [DELETE] Xóa cây khỏi PostGIS CSDL:  http://localhost:${PORT}/api/map/cay-xanh/:id`);
  console.log(`  🟩 [POST]   Nhập file Excel cây xanh:   http://localhost:${PORT}/api/map/import-cay-xanh`);
  console.log(" . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .");

  // 🚨 PHÂN HỆ TIẾP NHẬN SỰ CỐ HIỆN TRƯỜNG
  console.log(" 🚨 3. PHÂN HỆ ĐIỀU PHỐI SỰ CỐ KHẨN CẤP THỰC ĐỊA:");
  console.log(`  🔸 [POST]   Người dân gửi phản ánh sự cố: http://localhost:${PORT}/api/map/su-co`);
  console.log(`  🔸 [PUT]    Cán bộ xử lý / Đổi bước sự cố: http://localhost:${PORT}/api/map/su-co/:id`);
  console.log(`  🔸 [DELETE] Gỡ bỏ vĩnh viễn tin sự cố:   http://localhost:${PORT}/api/map/su-co/:id`);
  console.log(" . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .");

  // 📅 PHÂN HỆ SỔ SÁCH NHẬT KÝ VÀ DANH BẠ ĐƠN VỊ LIÊN KẾT
  console.log(" 📅 4. PHÂN HỆ QUẢN LÝ SỔ SÁCH CÔNG VỤ VÀ DANH BẠ:");
  console.log(`  🔹 [GET]    Xem sổ sách nhật ký chăm sóc: http://localhost:${PORT}/api/map/nhat-ky`);
  console.log(`  🔸 [POST]   Ghi sổ nhật ký công việc mới: http://localhost:${PORT}/api/map/nhat-ky`);
  console.log(`  🔸 [DELETE] Gỡ dòng sổ sách nhật ký cũ:   http://localhost:${PORT}/api/map/nhat-ky/:id`);
  console.log(`  🔹 [GET]    Tra cứu danh bạ đơn vị hạ tầng: http://localhost:${PORT}/api/map/don-vi`);
  console.log(`  🔸 [POST]   Khởi tạo thông tin đơn vị mới: http://localhost:${PORT}/api/map/don-vi`);
  console.log(`  🔸 [DELETE] Gỡ đơn vị khỏi danh sách bảng: http://localhost:${PORT}/api/map/don-vi/:id`);

  console.log("==================================================================");
  console.log(" 💡  Mẹo: Nhấn giữ Ctrl + Click vào các link màu xanh để test nhanh");
  console.log("     cấu trúc chuỗi GeoJSON trả về trực tiếp trên Web Browser.");
  console.log("==================================================================\n");
});
