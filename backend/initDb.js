const {Pool} = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "gis_3d_cay_xanh",
  password: process.env.DB_PASSWORD || "admin",
  port: process.env.DB_PORT || 5432,
});

const initDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log("🚀 Bắt đầu nạp hệ thống dữ liệu thực tế đa phân khu Quận 1...");

    await client.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);

    // Dọn sạch dữ liệu cũ để tránh xung đột khóa ngoại và tọa độ
    await client.query(`
      DROP TABLE IF EXISTS "SU_CO" CASCADE;
      DROP TABLE IF EXISTS "NHAT_KY_CHAM_SOC" CASCADE;
      DROP TABLE IF EXISTS "CAY_XANH" CASCADE;
      DROP TABLE IF EXISTS "TUYEN_DUONG" CASCADE;
      DROP TABLE IF EXISTS "KHU_VUC_QUAN_LY" CASCADE;
    `);

    // Dựng khung cấu trúc chữ hoa có cột "id" tự tăng đồng bộ với App.jsx
    // Dựng khung cấu trúc chữ hoa chuẩn hệ tọa độ WGS84 (SRID 4326)
    await client.query(`
      CREATE TABLE "KHU_VUC_QUAN_LY" (
        "id" SERIAL PRIMARY KEY,
        "TenKhuVuc" VARCHAR(255) NOT NULL,
        "DienTich" FLOAT,
        "NguoiTuanTra" VARCHAR(100),
        "SHAPE" geometry(Polygon, 4326)
      );
    `);

    await client.query(`
      CREATE TABLE "TUYEN_DUONG" (
        "id" SERIAL PRIMARY KEY,
        "MaKhuVuc" INT REFERENCES "KHU_VUC_QUAN_LY"("id") ON DELETE CASCADE,
        "TenDuong" VARCHAR(255) NOT NULL,
        "ChieuDai" FLOAT,
        "SHAPE" geometry(LineString, 4326) -- 🌟 SỬA ĐOẠN NÀY: Thay 'Polyline' bằng 'LineString' viết hoa chữ L và S
      );
    `);

    await client.query(`
      CREATE TABLE "CAY_XANH" (
        "id" SERIAL PRIMARY KEY,
        "MaTuyenDuong" INT REFERENCES "TUYEN_DUONG"("id") ON DELETE SET NULL,
        "LoaiCay" VARCHAR(255) NOT NULL,
        "DuongKinhTan" FLOAT,
        "ChieuCao" FLOAT,
        "TinhTrang" VARCHAR(100),
        "lon" FLOAT,
        "lat" FLOAT,
        "SHAPE" geometry(Point, 4326)
      );
    `);

    await client.query(`
      CREATE TABLE "SU_CO" (
        "id" SERIAL PRIMARY KEY,
        "MaCay" INT REFERENCES "CAY_XANH"("id") ON DELETE SET NULL,
        "TieuDe" VARCHAR(255) NOT NULL,
        "MoTa" TEXT,
        "TrangThai" VARCHAR(50) DEFAULT 'Chưa xử lý',
        "lon" FLOAT,
        "lat" FLOAT,
        "SHAPE" geometry(Point, 4326)
      );
    `);

    // ===================================================================
    // 🗺️ SEED DỮ LIỆU THỰC TẾ LÕI TRUNG TÂM QUẬN 1
    // ===================================================================

    // PHÂN KHU 1: PHỐ ĐI BỘ NGUYỄN HUỆ
    await client.query(`
      INSERT INTO "KHU_VUC_QUAN_LY" ("id", "TenKhuVuc", "DienTich", "NguoiTuanTra", "SHAPE") VALUES
      (1, 'Phân khu Phố đi bộ Nguyễn Huệ', 45000.0, 'Đỗ Hùng Mạnh', 
       ST_GeomFromText('POLYGON((106.7011 10.7766, 106.7025 10.7768, 106.7067 10.7720, 106.7054 10.7711, 106.7011 10.7766))', 4326));
    `);

    await client.query(`
      INSERT INTO "TUYEN_DUONG" ("id", "MaKhuVuc", "TenDuong", "ChieuDai", "SHAPE") VALUES
      (1, 1, 'Trục chính Nguyễn Huệ', 820.0, 
       ST_GeomFromText('LINESTRING(106.7012533351664 10.776516025516706, 106.70617787073219 10.771530743137287)', 4326));
    `);

    await client.query(`
      INSERT INTO "CAY_XANH" ("id", "MaTuyenDuong", "LoaiCay", "DuongKinhTan", "ChieuCao", "TinhTrang", "lon", "lat", "SHAPE") VALUES
      (10, 1, 'Cây Giáng Hương #1', 6.5, 18.0, 'Khỏe mạnh', 106.70221, 10.77552, ST_SetSRID(ST_MakePoint(106.70221, 10.77552), 4326)),
      (11, 1, 'Cây Sao Đen #2', 7.0, 22.5, 'Cần chăm sóc', 106.70385, 10.77388, ST_SetSRID(ST_MakePoint(106.70385, 10.77388), 4326)),
      (12, 1, 'Cây Dầu Rái #3', 5.5, 20.0, 'Khỏe mạnh', 106.70542, 10.77231, ST_SetSRID(ST_MakePoint(106.70542, 10.77231), 4326));
    `);

    // PHÂN KHU 2: CÔNG VIÊN TAO ĐÀN
    await client.query(`
      INSERT INTO "KHU_VUC_QUAN_LY" ("id", "TenKhuVuc", "DienTich", "NguoiTuanTra", "SHAPE") VALUES
      (2, 'Phân khu Công viên Tao Đàn', 90000.0, 'Nguyễn Văn Cán Bộ', 
       ST_GeomFromText('POLYGON((106.6895 10.7758, 106.6936 10.7780, 106.6957 10.7745, 106.6915 10.7724, 106.6895 10.7758))', 4326));
    `);

    await client.query(`
      INSERT INTO "TUYEN_DUONG" ("id", "MaKhuVuc", "TenDuong", "ChieuDai", "SHAPE") VALUES
      (2, 2, 'Đường Trương Định (Lõi Công Viên)', 410.0, 
       ST_GeomFromText('LINESTRING(106.6936 10.7780, 106.6915 10.7724)', 4326));
    `);

    await client.query(`
      INSERT INTO "CAY_XANH" ("id", "MaTuyenDuong", "LoaiCay", "DuongKinhTan", "ChieuCao", "TinhTrang", "lon", "lat", "SHAPE") VALUES
      (20, 2, 'Cây Đa Cổ Thụ', 12.0, 28.0, 'Khỏe mạnh', 106.6928, 10.7755, ST_SetSRID(ST_MakePoint(106.6928, 10.7755), 4326)),
      (21, 2, 'Cây Sao Đen Cổ Thụ', 8.5, 32.0, 'Sâu bệnh', 106.6921, 10.7738, ST_SetSRID(ST_MakePoint(106.6921, 10.7738), 4326));
    `);

    // PHÂN KHU 3: CÔNG VIÊN 23 THÁNG 9 (KHU B)
    await client.query(`
      INSERT INTO "KHU_VUC_QUAN_LY" ("id", "TenKhuVuc", "DienTich", "NguoiTuanTra", "SHAPE") VALUES
      (3, 'Phân khu Công viên 23 Tháng 9', 55000.0, 'Tổ Tuần Tra Đô Thị', 
       ST_GeomFromText('POLYGON((106.6908 10.7686, 106.6961 10.7709, 106.6968 10.7697, 106.6914 10.7674, 106.6908 10.7686))', 4326));
    `);

    await client.query(`
      INSERT INTO "TUYEN_DUONG" ("id", "MaKhuVuc", "TenDuong", "ChieuDai", "SHAPE") VALUES
      (3, 3, 'Trục đi bộ nội khu Công viên', 620.0, 
       ST_GeomFromText('LINESTRING(106.6908 10.7686, 106.6961 10.7709)', 4326));
    `);

    await client.query(`
      INSERT INTO "CAY_XANH" ("id", "MaTuyenDuong", "LoaiCay", "DuongKinhTan", "ChieuCao", "TinhTrang", "lon", "lat", "SHAPE") VALUES
      (30, 3, 'Cây Bàng Đài Loan', 4.5, 12.0, 'Khỏe mạnh', 106.6925, 10.7692, ST_SetSRID(ST_MakePoint(106.6925, 10.7692), 4326)),
      (31, 3, 'Cây Phượng Vĩ #31', 7.0, 15.5, 'Khỏe mạnh', 106.6948, 10.7702, ST_SetSRID(ST_MakePoint(106.6948, 10.7702), 4326));
    `);

    // Gieo một số sự cố mẫu tại các phân khu để test bộ lọc lề phải
    await client.query(`
      INSERT INTO "SU_CO" ("MaCay", "TieuDe", "MoTa", "TrangThai", "lon", "lat", "SHAPE") VALUES
      (11, 'Cây mục rỗng lề Nguyễn Huệ', 'Phát hiện thân cây Sao Đen số 11 nứt gốc sau mưa.', 'Chưa xử lý', 106.70385, 10.77388, ST_SetSRID(ST_MakePoint(106.70385, 10.77388), 4326)),
      (21, 'Nguy cơ sập cành Tao Đàn', 'Cành cây Sao Đen cổ thụ khô héo, cần xe cẩu cắt tỉa.', 'Đang xử lý', 106.6921, 10.7738, ST_SetSRID(ST_MakePoint(106.6921, 10.7738), 4326));
    `);

    console.log("🎉 [THÀNH CÔNG] Đã gieo trọn gói hệ thống dữ liệu thực tế 3 phân khu lớn Quận 1!");
  } catch (err) {
    console.error("🔴 Thất bại:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
};

initDatabase();
