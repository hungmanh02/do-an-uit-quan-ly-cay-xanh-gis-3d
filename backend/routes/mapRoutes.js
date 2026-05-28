// backend/routes/mapRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

// Cấu hình lưu trữ tạm cho file Excel
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({storage: storage});

// ===================================================================
// 🚀 FILE EXCEL: IMPORT DANH SÁCH CÂY XANH ĐÔ THỊ VÀO POSTGIS
// ===================================================================
router.post("/import-cay-xanh", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({success: false, message: "Vui lòng đính kèm file Excel."});
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let importedCount = 0;

    for (const row of sheetData) {
      const {LoaiCay, TinhTrang, ChieuCao, DuongKinhTan, KinhDo, ViDo} = row;
      if (!KinhDo || !ViDo) continue;

      const query = `
        INSERT INTO CAY_XANH ("LoaiCay", "TinhTrang", "ChieuCao", "DuongKinhTan", "SHAPE")
        VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326));
      `;

      await db.query(query, [
        LoaiCay,
        TinhTrang || "Khỏe mạnh",
        ChieuCao ? parseFloat(ChieuCao) : 0,
        DuongKinhTan ? parseFloat(DuongKinhTan) : 0,
        parseFloat(KinhDo),
        parseFloat(ViDo),
      ]);

      importedCount++;
    }

    fs.unlinkSync(req.file.path);
    res.json({
      success: true,
      message: `🚀 Hệ thống đã nạp thành công ${importedCount} cây xanh trung tâm vào cơ sở dữ liệu PostGIS!`,
    });
  } catch (err) {
    console.error("🔴 Lỗi xử lý Import cây xanh:", err);
    res.status(500).json({error: "Thất bại khi bóc tách cấu trúc file Excel", detail: err.message});
  }
});

// ===================================================================
// 🌲 PHÂN HỆ 1: BẢNG CÂY XANH ĐÔ THỊ (FULL CRUD)
// ===================================================================

// 1.1 [GET] LẤY DANH SÁCH CÂY XANH (Trả về GeoJSON chuẩn cho ArcGIS 3D)
router.get("/cay-xanh", async (req, res) => {
  try {
    // Sử dụng các hàm không gian của PostGIS để ép cấu trúc thành GeoJSON chuẩn đét
    const queryText = `
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', json_agg(ST_AsGeoJSON(t.*)::json)
      )
      FROM (
        SELECT 
          "MaCay" AS id, 
          "LoaiCay" AS "loaiCay", 
          "TinhTrang" AS "tinhTrang", 
          "ChieuCao" AS "chieuCao", 
          "DuongKinhTan" AS "duongKinhTan",
          "SHAPE" -- 🌟 BẮT BUỘC: Giữ nguyên cột GEOMETRY để ST_AsGeoJSON xử lý tọa độ 3D
        FROM CAY_XANH
      ) AS t;
    `;

    const result = await db.query(queryText);

    // Trả về đối tượng FeatureCollection hoàn chỉnh cho ArcGIS nạp Layer
    res.status(200).json(result.rows[0].json_build_object);
  } catch (err) {
    console.error("🔴 Lỗi xuất GeoJSON cây xanh đô thị:", err.message);
    res.status(500).json({error: "Lỗi cấu trúc dữ liệu không gian!"});
  }
});

// 1.2 [POST] THÊM MỚI CÂY XANH ĐƠN LẺ (Từ Form Quản trị)
router.post("/cay-xanh", async (req, res) => {
  const {loaiCay, tinhTrang, chieuCao, duongKinhTan, lon, lat} = req.body;
  try {
    const query = `
      INSERT INTO CAY_XANH ("LoaiCay", "TinhTrang", "ChieuCao", "DuongKinhTan", "SHAPE")
      VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326))
      RETURNING "MaCay";
    `;
    const result = await db.query(query, [
      loaiCay,
      tinhTrang || "Khỏe mạnh",
      parseFloat(chieuCao),
      parseFloat(duongKinhTan),
      parseFloat(lon),
      parseFloat(lat),
    ]);
    res.status(201).json({success: true, message: "Đã đồng bộ cây mới vào PostGIS!", id: result.rows[0].MaCay});
  } catch (err) {
    console.error("🔴 Lỗi API /cay-xanh (POST):", err);
    res.status(500).json({error: "Thất bại khi thêm thực thể cây xanh", detail: err.message});
  }
});

// 1.3 [PUT] 🌟 BỔ SUNG: CẬP NHẬT THUỘC TÍNH CÂY XANH (Dùng cho nút Sửa từ danh sách)
router.put("/cay-xanh/:id", async (req, res) => {
  const {id} = req.params;
  const {loaiCay, tinhTrang, chieuCao, duongKinhTan, lon, lat} = req.body;
  try {
    const query = `
      UPDATE CAY_XANH 
      SET "LoaiCay" = $1, "TinhTrang" = $2, "ChieuCao" = $3, "DuongKinhTan" = $4,
          "SHAPE" = ST_SetSRID(ST_MakePoint($5, $6), 4326)
      WHERE "MaCay" = $7;
    `;
    await db.query(query, [
      loaiCay,
      tinhTrang,
      parseFloat(chieuCao),
      parseFloat(duongKinhTan),
      parseFloat(lon),
      parseFloat(lat),
      id,
    ]);
    res.json({success: true, message: `Đã cập nhật dữ liệu cây xanh #${id} thành công.`});
  } catch (err) {
    console.error("🔴 Lỗi API /cay-xanh/:id (PUT):", err);
    res.status(500).json({error: "Thất bại khi cập nhật cây xanh"});
  }
});

// 1.4 [DELETE] 🌟 BỔ SUNG: XÓA CÂY XANH KHỎI HỆ THỐNG
router.delete("/cay-xanh/:id", async (req, res) => {
  const {id} = req.params;
  try {
    await db.query('DELETE FROM CAY_XANH WHERE "MaCay" = $1;', [id]);
    res.json({success: true, message: `Đã xóa thực thể cây xanh #${id} khỏi hệ thống không gian.`});
  } catch (err) {
    console.error("🔴 Lỗi API /cay-xanh/:id (DELETE):", err);
    res.status(500).json({error: "Thất bại khi xóa cây xanh"});
  }
});

// ===================================================================
// 🚨 PHÂN HỆ 2: BẢNG SỰ CỐ HIỆN TRƯỜNG (FULL CRUD & PUBLIC API)
// ===================================================================

// 2.1 [GET] LẤY DANH SÁCH SỰ CỐ
router.get("/su-co", async (req, res) => {
  try {
    const query = `
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(json_agg(ST_AsGeoJSON(t.*)::json), '[]'::json)
      ) as geojson
      FROM (
        SELECT "MaSuCo" AS id, "TieuDe" AS "tieuDe", "MoTa" AS "moTa", "TrangThai" AS "trangThai", "SHAPE" AS geom 
        FROM SU_CO
        WHERE "SHAPE" IS NOT NULL
      ) t;
    `;
    const result = await db.query(query);
    res.json(result.rows[0].geojson);
  } catch (err) {
    console.error("🔴 Lỗi API /su-co (GET):", err);
    res.status(500).json({error: "Lỗi truy vấn lớp Sự Cố", detail: err.message});
  }
});

// 2.2 [POST] TIẾP NHẬN SỰ CỐ (Dùng chung cho cả Form Admin và Form Public của người dân)
router.post("/su-co", async (req, res) => {
  const {tieu_de, mo_ta, nguoi_bao_cao, longitude, latitude} = req.body;
  try {
    const query = `
      INSERT INTO SU_CO ("TieuDe", "MoTa", "NguoiBaoCao", "TrangThai", "SHAPE")
      VALUES ($1, $2, $3, 'Chưa xử lý', ST_SetSRID(ST_MakePoint($4, $5), 4326))
      RETURNING "MaSuCo";
    `;
    const result = await db.query(query, [tieu_de, mo_ta, nguoi_bao_cao || "Người dân ẩn danh", longitude, latitude]);
    res.status(201).json({success: true, message: "Đã ghi nhận vị trí sự cố!", id: result.rows[0].MaSuCo});
  } catch (err) {
    console.error("🔴 Lỗi API /su-co (POST):", err);
    res.status(500).json({error: "Thất bại khi lưu sự cố vào CSDL"});
  }
});

// 2.3 [PUT] CẬP NHẬT TIẾN ĐỘ ĐIỀU PHỐI (Chuyển bước Tiếp nhận -> Hoàn thành)
router.put("/su-co/:id", async (req, res) => {
  const {id} = req.params;
  const {trang_thai} = req.body;
  try {
    const query = `UPDATE SU_CO SET "TrangThai" = $1 WHERE "MaSuCo" = $2;`;
    await db.query(query, [trang_thai, id]);
    res.json({success: true, message: `Đã cập nhật sự cố #${id} sang: ${trang_thai}`});
  } catch (err) {
    console.error("🔴 Lỗi API /su-co/:id (PUT):", err);
    res.status(500).json({error: "Thất bại khi cập nhật trạng thái sự cố"});
  }
});

// 2.4 [DELETE] GỠ BỎ SỰ CỐ KHỎI HỆ THỐNG
router.delete("/su-co/:id", async (req, res) => {
  const {id} = req.params;
  try {
    await db.query('DELETE FROM SU_CO WHERE "MaSuCo" = $1;', [id]);
    res.json({success: true, message: `Đã xóa dữ liệu sự cố #${id} thành công.`});
  } catch (err) {
    console.error("🔴 Lỗi API /su-co/:id (DELETE):", err);
    res.status(500).json({error: "Thất bại khi xóa bản ghi sự cố"});
  }
});

// ===================================================================
// 📅 PHÂN HỆ 3: 🌟 ĐỒNG BỘ TRỌN GÓI - PHÂN HỆ NHẬT KÝ CHẠM SÓC CÂY XANH
// ===================================================================

// 3.1 [GET] LẤY TOÀN BỘ SỔ SÁCH NHẬT KÝ (Gộp tên cột để map thẳng lên Frontend)
router.get("/nhat-ky", async (req, res) => {
  try {
    const queryText = `
      SELECT 
        "MaNhatKy" AS id, 
        "MaCay" AS "cayXanhId", 
        "NgayThucHien" AS "ngayThucHien", 
        "LoaiCongViec" AS "loaiCongViec", 
        "GhiChu" AS "ghiChu"
      FROM NHAT_KY_CHAM_SOC
      ORDER BY "MaNhatKy" DESC;
    `;

    const result = await db.query(queryText);
    // Trả mảng dữ liệu sạch về cho Frontend vẽ bảng Datatable công vụ
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("🔴 Lỗi truy vấn bảng NHAT_KY_CHAM_SOC (GET):", err.message);
    res.status(500).json({error: "Lỗi cấu trúc truy vấn SQL Backend sập ngầm!"});
  }
});

// 3.2 [POST] GHI SỔ NHẬT KÝ CÔNG VIỆC MỚI (Đã vá lỗi MaCay và bổ sung GhiChu)
router.post("/nhat-ky", async (req, res) => {
  // 🌟 ĐÃ BỔ SUNG: Tiếp nhận thêm trường ghiChu từ diaryFormData của Frontend gửi lên
  const {cayXanhId, loaiCongViec, ngayThucHien, ghiChu} = req.body;

  try {
    // 🌟 ĐÃ SỬA LỖI: Đổi từ "MaCayXanh" thành "MaCay" cho khớp 100% với khóa ngoại database
    const query = `
      INSERT INTO NHAT_KY_CHAM_SOC ("MaCay", "LoaiCongViec", "NgayThucHien", "GhiChu")
      VALUES ($1, $2, $3, $4) 
      RETURNING "MaNhatKy";
    `;

    const result = await db.query(query, [
      parseInt(cayXanhId),
      loaiCongViec,
      ngayThucHien || new Date(), // Nếu Frontend không truyền ngày, tự động lấy ngày hiện tại
      ghiChu || "",
    ]);

    // 🌟 ĐÃ SỬA LỖI: Trả ra đúng trường viết hoa đầu "MaNhatKy" từ kết quả trả về của Postgres
    res.status(201).json({success: true, id: result.rows[0].MaNhatKy});
  } catch (err) {
    console.error("🔴 Lỗi API /nhat-ky (POST):", err.message);
    res.status(500).json({error: "Không thể thêm dòng nhật ký công vụ mới vào PostgreSQL"});
  }
});

// 3.3 [DELETE] XÓA VĨNH VIỄN MỘT DÒNG NHẬT KÝ
router.delete("/nhat-ky/:id", async (req, res) => {
  const {id} = req.params;
  try {
    const query = `DELETE FROM NHAT_KY_CHAM_SOC WHERE "MaNhatKy" = $1;`;
    await db.query(query, [parseInt(id)]);

    res.json({success: true, message: "Đã xóa dòng nhật ký công vụ thành công."});
  } catch (err) {
    console.error("🔴 Lỗi API /nhat-ky (DELETE):", err.message);
    res.status(500).json({error: "Xóa dòng nhật ký tác nghiệp thất bại từ hệ thống"});
  }
});

// ===================================================================
// 🏢 PHÂN HỆ 4: 🌟 BỔ SUNG TRỌN GÓI - BẢNG ĐƠN VỊ QUẢN LÝ HẠ TẦNG
// ===================================================================

// 4.1 [GET] TRA CỨU DANH BẠ ĐƠN VỊ TỪ POSTGRESQL
router.get("/don-vi", async (req, res) => {
  try {
    const query = `
      SELECT "MaDonVi" AS id, "TenDonVi" AS "tenDonVi", 
             "NguoiDaiDien" AS "nguoiDaiDien", "SoDienThoai" AS "soDienThoai", "KhuVucPhuTrach" AS "khuVucPhuTrach"
      FROM DON_VI_QUAN_LY
      ORDER BY "MaDonVi" ASC;
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("🔴 Lỗi API /don-vi (GET):", err);
    res.status(500).json({error: "Thất bại khi lấy dữ liệu danh bạ đơn vị"});
  }
});

// 4.2 [POST] KHỞI TẠO ĐƠN VỊ QUẢN LÝ MỚI
router.post("/don-vi", async (req, res) => {
  const {tenDonVi, nguoiDaiDien, soDienThoai, khuVucPhuTrach} = req.body;
  try {
    const query = `
      INSERT INTO DON_VI_QUAN_LY ("TenDonVi", "NguoiDaiDien", "SoDienThoai", "KhuVucPhuTrach")
      VALUES ($1, $2, $3, $4) RETURNING "MaDonVi";
    `;
    const result = await db.query(query, [tenDonVi, nguoiDaiDien, soDienThoai, khuVucPhuTrach]);
    res.status(201).json({success: true, id: result.rows[0].MaDonVi});
  } catch (err) {
    console.error("🔴 Lỗi API /don-vi (POST):", err);
    res.status(500).json({error: "Thất bại khi thêm đơn vị phụ trách"});
  }
});

// 4.3 [DELETE] XÓA ĐƠN VỊ KHỎI DANH DANH SÁCH BẢNG CSDL
router.delete("/don-vi/:id", async (req, res) => {
  const {id} = req.params;
  try {
    await db.query('DELETE FROM DON_VI_QUAN_LY WHERE "MaDonVi" = $1;', [id]);
    res.json({success: true, message: "Đã gỡ đơn vị ra khỏi hệ thống."});
  } catch (err) {
    res.status(500).json({error: "Xóa đơn vị thất bại"});
  }
});

// ===================================================================
// 🗺️ LỚP NỀN KHÔNG GIAN BẢO LƯU GỐC (DÀNH CHO KHU VỰC VÀ TUYẾN ĐƯỜNG VỈA HÈ)
// ===================================================================
router.get("/khu-vuc", async (req, res) => {
  try {
    const query = `
      SELECT json_build_object('type', 'FeatureCollection','features', COALESCE(json_agg(ST_AsGeoJSON(t.*)::json), '[]'::json)) as geojson
      FROM (SELECT "MaKhuVuc" AS id, "TenKhuVuc" AS "tenKhuVuc", "DonViPhuTrach" AS "donViPhuTrach", "SHAPE" AS geom FROM KHU_VUC_QUAN_LY) t;
    `;
    const result = await db.query(query);
    res.json(result.rows[0].geojson);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

router.get("/tuyen-duong", async (req, res) => {
  try {
    const query = `
      SELECT json_build_object('type', 'FeatureCollection','features', COALESCE(json_agg(ST_AsGeoJSON(t.*)::json), '[]'::json)) as geojson
      FROM (SELECT "MaTuyenDuong" AS id, "TenDuong" AS "tenDuong", "LoaiDuong" AS "loaiDuong", "SHAPE" AS geom FROM TUYEN_DUONG) t;
    `;
    const result = await db.query(query);
    res.json(result.rows[0].geojson);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

module.exports = router;
