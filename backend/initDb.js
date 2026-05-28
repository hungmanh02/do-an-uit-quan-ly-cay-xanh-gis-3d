// backend/initDb.js
const db = require("./config/db");

async function initializeDatabase() {
  console.log("================================================================");
  console.log("⏳   BẮT ĐẦU KHỞI TẠO TOÀN BỘ CƠ SỞ DỮ LIỆU KHÔNG GIAN ĐỒ ÁN...  ");
  console.log("================================================================");

  try {
    // 1. Kích hoạt tiện ích mở rộng PostGIS không gian (Bắt buộc)
    console.log("1. Kích hoạt Extension PostGIS không gian...");
    await db.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);

    // 2. Dọn dẹp sạch sẽ cấu trúc cũ trước khi tạo mới để tránh lỗi xung đột hệ thống
    console.log("2. Dọn dẹp các cấu trúc bảng cũ trong hệ thống...");
    await db.query(`DROP TABLE IF EXISTS NGUOI_DUNG CASCADE;`);
    await db.query(`DROP TABLE IF EXISTS SU_CO CASCADE;`);
    await db.query(`DROP TABLE IF EXISTS NHAT_KY_CHAM_SOC CASCADE;`);
    await db.query(`DROP TABLE IF EXISTS CAY_XANH CASCADE;`);
    await db.query(`DROP TABLE IF EXISTS TUYEN_DUONG CASCADE;`);
    await db.query(`DROP TABLE IF EXISTS KHU_VUC_QUAN_LY CASCADE;`);
    await db.query(`DROP TABLE IF EXISTS DON_VI_QUAN_LY CASCADE;`);

    // 3. TẠO BẢNG 1: KHU_VUC_QUAN_LY (Mô hình dữ liệu vùng)
    console.log("3. Đang khởi tạo bảng 1: KHU_VUC_QUAN_LY (Đa giác)...");
    await db.query(`
      CREATE TABLE KHU_VUC_QUAN_LY (
          "MaKhuVuc" SERIAL PRIMARY KEY,
          "TenKhuVuc" VARCHAR(100) NOT NULL,
          "DonViPhuTrach" VARCHAR(100) NOT NULL,
          "SHAPE" GEOMETRY(Polygon, 4326) 
      );
    `);

    // 4. TẠO BẢNG 2: TUYEN_DUONG (Mô hình mạng lưới vỉa hè)
    console.log("4. Đang khởi tạo bảng 2: TUYEN_DUONG (Đường)...");
    await db.query(`
      CREATE TABLE TUYEN_DUONG (
          "MaTuyenDuong" SERIAL PRIMARY KEY,
          "TenDuong" VARCHAR(100) NOT NULL,
          "LoaiDuong" VARCHAR(50),
          "MaKhuVuc" INT REFERENCES KHU_VUC_QUAN_LY("MaKhuVuc") ON DELETE SET NULL,
          "SHAPE" GEOMETRY(LineString, 4326)
      );
    `);

    // 5. TẠO BẢNG 3: CAY_XANH (Thực thể Điểm 3D lập thể)
    console.log("5. Đang khởi tạo bảng 3: CAY_XANH (Điểm 3D)...");
    await db.query(`
      CREATE TABLE CAY_XANH (
          "MaCay" SERIAL PRIMARY KEY,
          "LoaiCay" VARCHAR(50) NOT NULL,
          "TinhTrang" VARCHAR(30) NOT NULL,
          "ChieuCao" FLOAT NOT NULL,      
          "DuongKinhTan" FLOAT NOT NULL,  
          "NgayTrong" DATE DEFAULT CURRENT_DATE, 
          "MaTuyenDuong" INT REFERENCES TUYEN_DUONG("MaTuyenDuong") ON DELETE SET NULL, 
          "SHAPE" GEOMETRY(Point, 4326)    
      );
    `);

    // 6. TẠO BẢNG 4: NHAT_KY_CHAM_SOC (Temporal Log quản lý vòng đời)
    console.log("6. Đang khởi tạo bảng 4: NHAT_KY_CHAM_SOC (Trục Thời gian)...");
    await db.query(`
      CREATE TABLE NHAT_KY_CHAM_SOC (
          "MaNhatKy" SERIAL PRIMARY KEY,
          "MaCay" INT REFERENCES CAY_XANH("MaCay") ON DELETE CASCADE, 
          "NgayThucHien" DATE NOT NULL DEFAULT CURRENT_DATE,
          "LoaiCongViec" VARCHAR(100) NOT NULL,
          "GhiChu" TEXT
      );
    `);

    // 7. TẠO BẢNG 5: SU_CO (Phân hệ tương tác thu thập điểm nóng)
    console.log("7. Đang khởi tạo bảng 5: SU_CO (Phản ánh hiện trường)...");
    await db.query(`
      CREATE TABLE SU_CO (
          "MaSuCo" SERIAL PRIMARY KEY,
          "TieuDe" VARCHAR(100) NOT NULL,
          "MoTa" TEXT,
          "NguoiBaoCao" VARCHAR(50) NOT NULL,
          "ThoiGian" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "TrangThai" VARCHAR(30) NOT NULL DEFAULT 'Chưa xử lý',
          "HinhAnh" VARCHAR(255),
          "MaCay" INT REFERENCES CAY_XANH("MaCay") ON DELETE SET NULL,
          "SHAPE" GEOMETRY(Point, 4326)
      );
    `);

    // 8. TẠO BẢNG MỚI: NGUOI_DUNG (Phân quyền bảo mật Cán bộ / Nhân viên)
    console.log("8. Đang khởi tạo bảng quản trị: NGUOI_DUNG (Phân quyền hệ thống)...");
    await db.query(`
      CREATE TABLE NGUOI_DUNG (
          "MaNguoiDung" SERIAL PRIMARY KEY,
          "TaiKhoan" VARCHAR(100) NOT NULL UNIQUE,
          "MatKhau" VARCHAR(255) NOT NULL,
          "HoTen" VARCHAR(150) NOT NULL,
          "SoDienThoai" VARCHAR(20),
          "VaiTro" VARCHAR(50) NOT NULL DEFAULT 'Nhân viên',
          CONSTRAINT chk_vaitro CHECK ("VaiTro" IN ('Nhân viên', 'Quản trị'))
      );
    `);

    // 9. NẠP DỮ LIỆU ĐỒNG BỘ MẪU
    console.log("9. Đang nạp dữ liệu mẫu đồng bộ không gian khớp vùng nhìn Maps...");

    // 9.1 Vùng quản lý mẫu Quận 10
    await db.query(`
      INSERT INTO KHU_VUC_QUAN_LY ("TenKhuVuc", "DonViPhuTrach", "SHAPE") 
      VALUES (
        'Khu vực quản lý Quận 10', 
        'Công ty TNHH MTV Công viên Cây xanh TP.HCM', 
        ST_SetSRID(ST_MakePolygon(ST_GeomFromText('LINESTRING(106.660000 10.760000, 106.670000 10.760000, 106.670000 10.768000, 106.660000 10.768000, 106.660000 10.760000)')), 4326)
      );
    `);

    // 9.2 Tuyến đường mẫu Ngô Quyền
    await db.query(`
      INSERT INTO TUYEN_DUONG ("TenDuong", "LoaiDuong", "MaKhuVuc", "SHAPE")
      VALUES (
        'Đường Ngô Quyền', 
        'Đường chính đô thị', 
        1,
        ST_SetSRID(ST_MakeLine(ST_MakePoint(106.663000, 10.761000), ST_MakePoint(106.664000, 10.766000)), 4326)
      );
    `);

    // 9.3 3 cá thể cây xanh mọc dọc đường Ngô Quyền
    await db.query(`
      INSERT INTO CAY_XANH ("LoaiCay", "TinhTrang", "ChieuCao", "DuongKinhTan", "MaTuyenDuong", "SHAPE") VALUES
      ('Cây Sao Đen', 'Khỏe mạnh', 16.5, 5.0, 1, ST_SetSRID(ST_MakePoint(106.663500, 10.763500), 4326)),
      ('Cây Dầu Rái', 'Cần chăm sóc', 19.0, 6.5, 1, ST_SetSRID(ST_MakePoint(106.663700, 10.764200), 4326)),
      ('Cây Bằng Lăng', 'Cần chăm sóc', 7.8, 3.5, 1, ST_SetSRID(ST_MakePoint(106.663300, 10.762800), 4326));
    `);

    // 9.4 🌟 ĐÃ SỬA LỖI: Đồng bộ lịch sử tác nghiệp dùng trường chữ "Mã" viết hoa
    await db.query(`
      INSERT INTO NHAT_KY_CHAM_SOC ("MaCay", "LoaiCongViec", "GhiChu") VALUES
      (1, 'Kiểm tra định kỳ', 'Cây phát triển bình thường, thân gỗ vững chắc.'),
      (2, 'Cắt tỉa cành khô', 'Đã hạ độ cao chuẩn bị phòng chống mùa bão lũ.');
    `);

    // 9.5 Nạp dữ liệu sự cố khẩn cấp
    await db.query(`
      INSERT INTO SU_CO ("TieuDe", "MoTa", "NguoiBaoCao", "TrangThai", "MaCay", "SHAPE") VALUES
      ('Cây Sao Đen nghiêng nguy hiểm', 'Sau giông lốc gốc cây có dấu hiệu sụt lún lề đường', 'Cán bộ tuần tra Đội 2', 'Chưa xử lý', 1, ST_SetSRID(ST_MakePoint(106.663500, 10.763500), 4326)),
      ('Cành gãy sà thấp', 'Cành cây che khuất biển hiệu giao thông', 'Người dân phản ánh', 'Chưa xử lý', 2, ST_SetSRID(ST_MakePoint(106.663700, 10.764200), 4326));
    `);

    // 9.6 Nạp tài khoản kiểm thử quyền Quản trị & Nhân viên
    await db.query(`
      INSERT INTO NGUOI_DUNG ("TaiKhoan", "MatKhau", "HoTen", "SoDienThoai", "VaiTro") VALUES
      ('admin_gis', 'admin123@', 'Đỗ Hùng Mạnh', '0901234567', 'Quản trị'),
      ('nhanvien_01', 'nv123@', 'Nguyễn Văn Bình', '0908888999', 'Nhân viên');
    `);

    console.log("================================================================");
    console.log("🟢 THÀNH CÔNG: Đã di cư cấu trúc và nạp không gian đồng bộ 100%!");
    console.log("================================================================");
    process.exit(0);
  } catch (error) {
    console.error("🔴 Lỗi nghiêm trọng trong quá trình Migration:", error);
    process.exit(1);
  }
}

initializeDatabase();
