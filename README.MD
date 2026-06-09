# 🛰️ ĐỒ ÁN MÔN HỌC HỆ THỐNG THÔNG TIN ĐỊA LÝ 3 CHIỀU (3D GIS)

## 🎯 ĐỀ TÀI: HỆ THỐNG QUẢN LÝ CÂY XANH TPHCM VÀ HẠ TẦNG ĐÔ THỊ

Hệ thống Web-GIS 3D chuyên sâu hỗ trợ quản lý, giám sát và số hóa thực thể cây xanh đô thị gắn liền với hạ tầng phân khu hành chính và mạng lưới giao thông thực địa. Dự án tập trung vào việc mô hình hóa dữ liệu không gian đa tầng, giúp truy vấn chính xác mối liên hệ giữa khu vực quản lý, tuyến đường và từng thực thể cây xanh.

---

## 💻 CÔNG NGHỆ HỆ THỐNG (TECH STACK)

- **Database**: PostgreSQL (v13+) & **PostGIS Extension** (Xử lý thực thể vùng `Polygon`, đường `LineString`, điểm `Point`).
- **Backend**: Node.js & Express (Thiết lập RESTful API cung cấp dữ liệu không gian GeoJSON/WKT).
- **Frontend**: ReactJS (Vite) & **ArcGIS Maps SDK for JavaScript** (Render không gian lập thể 3D `SceneView`).
- **UI/UX**: Tailwind CSS (Xây dựng hệ thống Dashboard quản trị trực quan).

---

## 📊 LỘ TRÌNH HOÀN THIỆN ĐỒ ÁN THEO TỪNG PHẦN (MILESTONES)

_(Nhóm dựa vào danh sách này để check-list, làm đến đâu dứt điểm đến đó, tránh làm lặp lại tốn thời gian)._

### 🟢 PHẦN 1: THIẾT LẬP NỀN TẢNG VÀ ĐỒNG BỘ HẠ TẦNG KHÔNG GIAN (ĐÃ ĐẠT ĐƯỢC - 100%)

- [x] **1.1.** Tích hợp bản đồ nền vệ tinh không gian 3D thông qua ArcGIS Maps SDK (`SceneView`).
- [x] **1.2.** Xây dựng kịch bản Node.js (`initDb.js`) tự động thiết lập các cấu trúc bảng và khóa ngoại hệ thống.
- [x] **1.3.** Số hóa và import thành công dữ liệu ranh giới đa giác hành chính cấp Phường/Xã tại TP.HCM từ nguồn GeoJSON.
- [x] **1.4.** Khai thác và đồng bộ ngoại tuyến mạng lưới tuyến đường giao thông thực địa của TP.HCM từ dữ liệu Shapefile nhị phân.
- [x] **1.5.** Ứng dụng toán tử không gian `ST_Intersects` để tự động tính toán, phân phối tuyến đường lọt lòng thuộc phạm vi quản lý của từng khu vực hành chính.
- [x] **1.6.** Cơ chế phục hồi/sao lưu dữ liệu tốc độ cao qua file `data_backup.sql` từ pgAdmin, giúp đồng bộ mã nguồn sạch lên GitHub.

### ⚪ PHẦN 2: MỞ RỘNG PHẠM VI VÀ KẾT NỐI API BA TẦNG (ĐANG TRIỂN KHAI)

- [ ] **2.1.** Mở rộng danh mục khu vực quản lý sang **Đặc khu hành chính Côn Đảo** (Cơ chế quản lý đặc thù trực tiếp, không chia phường xã).
- [ ] **2.2.** Hoàn thiện các API Backend phục vụ truy vấn quan hệ ràng buộc ba tầng: **Khu vực quản lý** (Vùng) $\rightarrow$ **Tuyến đường** (Đường) $\rightarrow$ **Cây xanh** (Điểm).
- [ ] **2.3.** Đổ dữ liệu tuyến đường theo từng khu vực từ API lên giao diện Frontend để làm menu cây điều hướng bản đồ.

### ⚪ PHẦN 3: SỐ HÓA VÀ TRỰC QUAN HÓA CÂY XANH 3D (KẾ HOẠCH TIẾP THEO)

- [ ] **3.1.** Ứng dụng hàm `ST_Point` của PostGIS để lưu trữ tọa độ điểm chính xác của từng cây xanh.
- [ ] **3.2.** Trực quan hóa mô hình cây xanh lập thể (3D Tree Symbols) trực tiếp dọc theo các sợi dây `LineString` tuyến đường trên bản đồ ArcGIS.
- [ ] **3.3.** Thiết lập cấu trúc bộ lọc thông minh (Filter Dashboard): Cho phép người dùng lọc nhanh cây xanh theo chủng loại (Xà cừ, Phượng vĩ...) hoặc theo trạng thái sức khỏe trên bản đồ.

### ⚪ PHẦN 4: HỆ THỐNG QUẢN TRỊ CRUD CÂY XANH & PHÂN QUYỀN (PHẦN HOÀN THIỆN ĐỒ ÁN)

- [ ] **4.1.** **Chức năng Thêm cây xanh (Create):** Cho phép Admin click chuột trực tiếp chọn điểm trên bản đồ 3D để tự động lấy tọa độ Lat/Long, nhập chủng loại, chọn tuyến đường và lưu vào DB.
- [ ] **4.2.** **Chức năng Cập nhật cây xanh (Update):** Form giao diện hỗ trợ thay đổi nhanh trạng thái sức khỏe của cây (Khỏe mạnh, Sâu bệnh, Cần chặt hạ sau mưa bão) và cập nhật thông số chiều cao/đường kính thân.
- [ ] **4.3.** **Chức năng Xóa cây xanh (Delete):** Cho phép gỡ bỏ thông tin thực thể cây xanh khỏi hệ thống khi đã bị chặt hạ trên thực tế.
- [ ] **4.4.** **Phân quyền người dùng (RBAC):** \* Cấp quản lý (Admin): Có toàn quyền CRUD cây xanh.
  - Người dân (User): Chỉ có quyền xem bản đồ 3D, tra cứu thông tin cây và gửi phản ánh sự cố.

---

## 🛠️ HƯỚNG DẪN TRIỂN KHAI NHANH

1. **Khai báo Database**: Tạo DB `gis_3d_cay_xanh` trên pgAdmin và chạy `CREATE EXTENSION postgis;`.
2. **Khởi chạy Backend**:
   ```bash
   cd backend
   npm install
   node initDb.js  # Khởi tạo bảng
   npm run dev     # Chạy server với nodemon auto-reload
   ```
