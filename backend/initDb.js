// ===================================================================
// 🛰️ PHÂN HỆ KHỞI TẠO VÀ ĐỒNG BỘ HOÀN TOÀN CƠ SỞ DỮ LIỆU POSTGIS 3D
// ===================================================================
const { Pool } = require("pg");

// Cấu hình kết nối PostgreSQL với DB mới: gis_3d_cay_xanh
const db = new Pool({
  user: "postgres",
  host: "localhost",
  database: "gis_3d_cay_xanh", // 🌟 ĐÃ ĐỔI: Tên Database chuyên ngành mới của Mạnh
  password: "admin", // Mật khẩu pgAdmin của Mạnh
  port: 5432,
});

const initDatabase = async () => {
  console.log("🔄 BẮT ĐẦU TIẾN TRÌNH XÓA SẠCH VÀ TÁI CẤU TRÚC CSDL (ĐỒNG BỘ MACAYXANH)...");
  try {
    // 1. Kích hoạt tiện ích mở rộng không gian PostGIS nếu chưa có
    await db.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    console.log("  🍀 Đã kiểm tra và kích hoạt Extension PostGIS.");

    // ===================================================================
    // 🗑️ BƯỚC 1: XÓA SỔ TOÀN BỘ CÁC BẢNG CŨ ĐỂ DỌN RÁC HỆ THỐNG
    // ===================================================================
    const dropTablesQuery = `
      DROP TABLE IF EXISTS "CAY_XANH" CASCADE;
      DROP TABLE IF EXISTS "cay_xanh" CASCADE;
      DROP TABLE IF EXISTS "SU_CO" CASCADE;
      DROP TABLE IF EXISTS "su_co" CASCADE;
      DROP TABLE IF EXISTS "TUYEN_DUONG" CASCADE;
      DROP TABLE IF EXISTS "tuyen_duong" CASCADE;
      DROP TABLE IF EXISTS "KHU_VUC_QUAN_LY" CASCADE;
      DROP TABLE IF EXISTS "khu_vuc_quan_ly" CASCADE;
      DROP TABLE IF EXISTS "nhat_ky_cham_soc" CASCADE;
      DROP TABLE IF EXISTS "nguoi_dung" CASCADE;
    `;
    await db.query(dropTablesQuery);
    console.log("  🗑️ Đã giải phóng và xóa sạch cấu trúc cũ.");

    // ===================================================================
    // 🏗️ BƯỚC 2: KHỞI TẠO LẠI HỆ THỐNG BẢNG MỚI CHUẨN HOÁ KHÓA "MA"
    // ===================================================================

    // 🏢 Bảng 1: Khu Vực Quản Lý
    await db.query(`
      CREATE TABLE "KHU_VUC_QUAN_LY" (
        "MaKhuVuc" SERIAL PRIMARY KEY,
        "TenKhuVuc" VARCHAR(255) NOT NULL,
        "SHAPE" geometry(Polygon, 4326)
      );
    `);
    console.log("  🏢 Tạo mới bảng KHU_VUC_QUAN_LY thành công.");

    // 🛣️ Bảng 2: Tuyến Đường / Hành Lang Vỉa Hè (Sửa thành LineString)
    await db.query(`
      CREATE TABLE "TUYEN_DUONG" (
        "MaTuyenDuong" SERIAL PRIMARY KEY,
        "MaKhuVuc" INTEGER REFERENCES "KHU_VUC_QUAN_LY"("MaKhuVuc") ON DELETE CASCADE,
        "TenDuong" VARCHAR(255) NOT NULL,
        "SHAPE" geometry(LineString, 4326) -- 🌟 ĐÃ SỬA: Dùng cấu trúc LineString chuẩn PostGIS
      );
    `);
    console.log("  🛣️ Tạo mới bảng TUYEN_DUONG thành công.");

    // 🌲 Bảng 3: Quần Thể Cây Xanh Lập Thể 3D (Sửa id/Ma thành MaCayXanh)
    await db.query(`
      CREATE TABLE "CAY_XANH" (
        "MaCayXanh" SERIAL PRIMARY KEY, -- 🌟 ĐÃ ĐỔI: Khóa chính đồng bộ danh xưng MaCayXanh
        "MaTuyenDuong" INTEGER REFERENCES "TUYEN_DUONG"("MaTuyenDuong") ON DELETE CASCADE,
        "LoaiCay" VARCHAR(255) NOT NULL,
        "DuongKinhTan" DOUBLE PRECISION DEFAULT 3.0,
        "ChieuCao" DOUBLE PRECISION DEFAULT 8.0,
        "TinhTrang" VARCHAR(100) DEFAULT 'Khỏe mạnh',
        "lon" DOUBLE PRECISION NOT NULL,
        "lat" DOUBLE PRECISION NOT NULL,
        "SHAPE" geometry(Point, 4326)
      );
    `);
    console.log("  🌲 Tạo mới bảng CAY_XANH thành công (Khóa chính: MaCayXanh).");

    // 🚨 Bảng 4: Bản Đồ Sự Cố Hiện Trường Thực Địa
    await db.query(`
      CREATE TABLE "SU_CO" (
        "MaSuCo" SERIAL PRIMARY KEY,
        "tieuDe" VARCHAR(255) NOT NULL,
        "moTa" TEXT,
        "trangThai" VARCHAR(100) DEFAULT 'Chưa xử lý',
        "lon" DOUBLE PRECISION NOT NULL,
        "lat" DOUBLE PRECISION NOT NULL,
        "SHAPE" geometry(Point, 4326)
      );
    `);
    console.log("  🚨 Tạo mới bảng SU_CO thành công.");

    // ===================================================================
    // 📥 BƯỚC 3: NẠP DỮ LIỆU KHÔNG GIAN MẪU XUỐNG CSDL ĐỒNG BỘ
    // ===================================================================
    console.log("📥 ĐANG NẠP DỮ LIỆU KHÔNG GIAN ĐÔ THỊ MẪU...");

    // 1. Chèn Khu Vực
    const resKhuVuc = await db.query(`
      INSERT INTO "KHU_VUC_QUAN_LY" ("TenKhuVuc", "SHAPE")
      VALUES (
        'Phân khu Trọng điểm Quận 1', 
        ST_GeomFromText('POLYGON((106.700 10.770, 106.708 10.770, 106.708 10.778, 106.700 10.778, 106.700 10.770))', 4326)
      ) RETURNING "MaKhuVuc";
    `);
    const codeKhuVuc = resKhuVuc.rows[0].MaKhuVuc;

    // 2. Chèn Tuyến Đường
    const resDuong = await db.query(
      `
      INSERT INTO "TUYEN_DUONG" ("MaKhuVuc", "TenDuong", "SHAPE")
      VALUES (
        $1, 
        'Đại lộ Nguyễn Huệ', 
        ST_GeomFromText('LINESTRING(106.7041 10.7750, 106.7025 10.7715)', 4326)
      ) RETURNING "MaTuyenDuong";
    `,
      [codeKhuVuc]
    );
    const codeTuyenDuong = resDuong.rows[0].MaTuyenDuong;

    // 3. Chèn Cây Xanh lập thể (MaCayXanh tự tăng)
    const seedTreesQuery = `
      INSERT INTO "CAY_XANH" ("MaTuyenDuong", "LoaiCay", "DuongKinhTan", "ChieuCao", "TinhTrang", "lon", "lat", "SHAPE")
      VALUES 
      ($1, 'Cây Sao Đen', 4.5, 16.5, 'Khỏe mạnh', 106.70385, 10.77420, ST_SetSRID(ST_MakePoint(106.70385, 10.77420), 4326)),
      ($1, 'Cây Giáng Hương', 5.0, 14.0, 'Khỏe mạnh', 106.70345, 10.77350, ST_SetSRID(ST_MakePoint(106.70345, 10.77350), 4326)),
      ($1, 'Cây Dầu Rái', 3.8, 18.2, 'Cần chăm sóc', 106.70295, 10.77260, ST_SetSRID(ST_MakePoint(106.70295, 10.77260), 4326));
    `;
    await db.query(seedTreesQuery, [codeTuyenDuong]);

    // 4. Chèn Sự Cố
    const seedSuCoQuery = `
      INSERT INTO "SU_CO" ("tieuDe", "moTa", "trangThai", "lon", "lat", "SHAPE")
      VALUES 
      ('Cành cây gãy sập', 'Cành xà cừ sà thấp vướng dây cáp viễn thông gần tòa nhà Bitexco', 'Chưa xử lý', 106.7042, 10.7718, ST_SetSRID(ST_MakePoint(106.7042, 10.7718), 4326)),
      ('Cây ngã đổ', 'Cây phượng vĩ mục rỗng gốc đổ chắn một phần hành lang đi bộ', 'Đang xử lý', 106.7032, 10.7738, ST_SetSRID(ST_MakePoint(106.7032, 10.7738), 4326));
    `;
    await db.query(seedSuCoQuery);

    console.log("🌟 [THÀNH CÔNG RỰC RỠ] ĐÃ KHỞI TẠO VÀ ĐỒNG BỘ TOÀN DIỆN DATABASE: gis_3d_cay_xanh!");
  } catch (error) {
    console.error("🔴 LỖI CHÍ MẠNG TRONG QUÁ TRÌNH KHỞI TẠO DATABASE:", error.message);
  } finally {
    await db.end();
    process.exit();
  }
};

initDatabase();
