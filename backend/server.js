// backend/server.js
const express = require("express");
const cors = require("cors");
const mapRoutes = require("./routes/mapRoutes");

const app = express();

// Kích hoạt CORS cho Frontend kết nối
app.use(cors());

// Cấu hình Express đọc dữ liệu JSON (req.body)
app.use(express.json());

// Định nghĩa tuyến đường trung tâm cho hệ thống GIS
app.use("/api/map", mapRoutes);

const PORT = 5000;

// Khởi chạy máy chủ và hiển thị danh sách tất cả API
app.listen(PORT, () => {
  console.log("\n==================================================================");
  console.log("   🌳   HỆ THỐNG WEB-GIS 3D QUẢN LÝ CÂY XANH ĐÔ THỊ TP.HCM   🌳   ");
  console.log("==================================================================");
  console.log(` 🚀  Trạng thái:   Server Node.js đang khởi chạy THÀNH CÔNG!`);
  console.log(` 🔌  Cổng kết nối: Hoạt động trên Port: [${PORT}]`);
  console.log("------------------------------------------------------------------");
  console.log(" 🌐  DANH SÁCH TẤT CẢ CÁC ĐƯỜNG DẪN API (ENDPOINTS) CỦA ĐỒ ÁN:");
  console.log("------------------------------------------------------------------");
  console.log(` 🔹 [GET]  Cây Xanh (Point 3D): http://localhost:${PORT}/api/map/cay-xanh`);
  console.log(` 🔹 [GET]  Tuyến Đường (Line):  http://localhost:${PORT}/api/map/tuyen-duong`);
  console.log(` 🔹 [GET]  Khu Vực (Polygon):   http://localhost:${PORT}/api/map/khu-vuc`);
  console.log(` 🔸 [POST] Báo Cáo Sự Cố GIS:   http://localhost:${PORT}/api/map/su-co`);
  console.log("==================================================================");
  console.log(" 💡  Mẹo: Nhấn giữ Ctrl + Click vào các link màu xanh để test nhanh");
  console.log("     dữ liệu GeoJSON trả về trực tiếp trên trình duyệt.");
  console.log("==================================================================\n");
});
