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
const upload = multer({ storage: storage });

// ===================================================================
// 🚀 FILE EXCEL: IMPORT DANH SÁCH CÂY XANH ĐÔ THỊ VÀO POSTGIS MỚI
// ===================================================================
router.post("/import-cay-xanh", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Vui lòng đính kèm file Excel." });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let importedCount = 0;

    for (const row of sheetData) {
      const { MaTuyenDuong, LoaiCay, TinhTrang, ChieuCao, DuongKinhTan, KinhDo, ViDo } = row;
      if (!KinhDo || !ViDo) continue;

      // 🌟 ĐỒNG BỘ: Sử dụng chữ hoa nháy kép khớp CSDL mới
      const query = `
        INSERT INTO "CAY_XANH" ("MaTuyenDuong", "LoaiCay", "TinhTrang", "ChieuCao", "DuongKinhTan", "lon", "lat", "SHAPE")
        VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($6, $7), 4326));
      `;

      await db.query(query, [
        parseInt(MaTuyenDuong) || 1,
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
    res.status(500).json({ error: "Thất bại khi bóc tách cấu trúc file Excel", detail: err.message });
  }
});

// ===================================================================
// 🌲 PHÂN HỆ 1: BẢNG CÂY XANH ĐÔ THỊ (FULL CRUD) - ĐỒNG BỘ "MaCayXanh"
// ===================================================================

// 1.2 [POST] THÊM MỚI CÂY XANH ĐƠN LẺ (Từ Form Quản trị)
router.post("/cay-xanh", async (req, res) => {
  const { MaTuyenDuong, loaiCay, tinhTrang, chieuCao, duongKinhTan, lon, lat } = req.body;
  try {
    const query = `
      INSERT INTO "CAY_XANH" ("MaTuyenDuong", "LoaiCay", "TinhTrang", "ChieuCao", "DuongKinhTan", "lon", "lat", "SHAPE")
      VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($6, $7), 4326))
      RETURNING "MaCayXanh";
    `;
    const result = await db.query(query, [
      parseInt(MaTuyenDuong) || 1,
      loaiCay,
      tinhTrang || "Khỏe mạnh",
      parseFloat(chieuCao) || 0,
      parseFloat(duongKinhTan) || 0,
      parseFloat(lon),
      parseFloat(lat),
    ]);
    res.status(201).json({ success: true, message: "Đã đồng bộ cây mới vào PostGIS!", id: result.rows[0].MaCayXanh });
  } catch (err) {
    console.error("🔴 Lỗi API /cay-xanh (POST):", err);
    res.status(500).json({ error: "Thất bại khi thêm thực thể cây xanh", detail: err.message });
  }
});

// 1.3 [PUT] CẬP NHẬT THUỘC TÍNH CÂY XANH (Dùng cho nút Sửa từ danh sách)
router.put("/cay-xanh/:id", async (req, res) => {
  const { id } = req.params; // Nhận MaCayXanh từ đường dẫn URL
  const { loaiCay, tinhTrang, chieuCao, duongKinhTan, lon, lat } = req.body;
  try {
    const query = `
      UPDATE "CAY_XANH" 
      SET "LoaiCay" = $1, "TinhTrang" = $2, "ChieuCao" = $3, "DuongKinhTan" = $4, "lon" = $5, "lat" = $6,
          "SHAPE" = ST_SetSRID(ST_MakePoint($5, $6), 4326)
      WHERE "MaCayXanh" = $7;
    `;
    await db.query(query, [
      loaiCay,
      tinhTrang,
      parseFloat(chieuCao) || 0,
      parseFloat(duongKinhTan) || 0,
      parseFloat(lon),
      parseFloat(lat),
      parseInt(id),
    ]);
    res.json({ success: true, message: `Đã cập nhật dữ liệu cây xanh #${id} thành công.` });
  } catch (err) {
    console.error("🔴 Lỗi API /cay-xanh/:id (PUT):", err);
    res.status(500).json({ error: "Thất bại khi cập nhật cây xanh" });
  }
});

// 1.4 [DELETE] XÓA CÂY XANH KHỎI HỆ THỐNG
router.delete("/cay-xanh/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM "CAY_XANH" WHERE "MaCayXanh" = $1;', [parseInt(id)]);
    res.json({ success: true, message: `Đã xóa thực thể cây xanh #${id} khỏi hệ thống không gian.` });
  } catch (err) {
    console.error("🔴 Lỗi API /cay-xanh/:id (DELETE):", err);
    res.status(500).json({ error: "Thất bại khi xóa cây xanh" });
  }
});

// ===================================================================
// 🚨 PHÂN HỆ 2: BẢNG SỰ CỐ HIỆN TRƯỜNG (FULL CRUD & PUBLIC API) - ĐỒNG BỘ "MaSuCo"
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
        SELECT "MaSuCo" AS id, "tieuDe", "moTa", "trangThai", "SHAPE" AS geom 
        FROM "SU_CO"
        WHERE "SHAPE" IS NOT NULL
      ) t;
    `;
    const result = await db.query(query);
    res.json(result.rows[0].geojson);
  } catch (err) {
    console.error("🔴 Lỗi API /su-co (GET):", err);
    res.status(500).json({ error: "Lỗi truy vấn lớp Sự Cố", detail: err.message });
  }
});

// 2.2 [POST] TIẾP NHẬN SỰ CỐ
router.post("/su-co", async (req, res) => {
  const { tieu_de, mo_ta, nguoi_bao_cao, longitude, latitude } = req.body;
  try {
    const query = `
      INSERT INTO "SU_CO" ("tieuDe", "moTa", "nguoiBaoCao", "trangThai", "lon", "lat", "SHAPE")
      VALUES ($1, $2, $3, 'Chưa xử lý', $4, $5, ST_SetSRID(ST_MakePoint($4, $5), 4326))
      RETURNING "MaSuCo";
    `;
    const result = await db.query(query, [
      tieu_de,
      mo_ta,
      nguoi_bao_cao || "Người dân ẩn danh",
      parseFloat(longitude),
      parseFloat(latitude),
    ]);
    res.status(201).json({ success: true, message: "Đã ghi nhận vị trí sự cố!", id: result.rows[0].MaSuCo });
  } catch (err) {
    console.error("🔴 Lỗi API /su-co (POST):", err);
    res.status(500).json({ error: "Thất bại khi lưu sự cố vào CSDL" });
  }
});

// 2.3 [PUT] CẬP NHẬT TIẾN ĐỘ ĐIỀU PHỐI (Chuyển bước Tiếp nhận -> Hoàn thành)
router.put("/su-co/:id", async (req, res) => {
  const { id } = req.params;
  const { trang_thai } = req.body;
  try {
    const query = `UPDATE "SU_CO" SET "trangThai" = $1 WHERE "MaSuCo" = $2;`;
    await db.query(query, [trang_thai, parseInt(id)]);
    res.json({ success: true, message: `Đã cập nhật sự cố #${id} sang: ${trang_thai}` });
  } catch (err) {
    console.error("🔴 Lỗi API /su-co/:id (PUT):", err);
    res.status(500).json({ error: "Thất bại khi cập nhật trạng thái sự cố" });
  }
});

// 2.4 [DELETE] GỠ BỎ SỰ CỐ KHỎI HỆ THỐNG
router.delete("/su-co/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM "SU_CO" WHERE "MaSuCo" = $1;', [parseInt(id)]);
    res.json({ success: true, message: `Đã xóa dữ liệu sự cố #${id} thành công.` });
  } catch (err) {
    console.error("🔴 Lỗi API /su-co/:id (DELETE):", err);
    res.status(500).json({ error: "Thất bại khi xóa bản ghi sự cố" });
  }
});

// ===================================================================
// 📅 PHÂN HỆ 3: PHÂN HỆ NHẬT KÝ CHĂM SÓC CÂY XANH
// ===================================================================
router.get("/nhat-ky", async (req, res) => {
  try {
    const queryText = `
      SELECT 
        "MaNhatKy" AS id, 
        "MaCay" AS "cayXanhId", 
        "NgayThucHien" AS "ngayThucHien", 
        "LoaiCongViec" AS "loaiCongViec", 
        "GhiChu" AS "ghiChu"
      FROM "NHAT_KY_CHAM_SOC"
      ORDER BY "MaNhatKy" DESC;
    `;
    const result = await db.query(queryText);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("🔴 Lỗi truy vấn bảng NHAT_KY_CHAM_SOC (GET):", err.message);
    res.status(500).json({ error: "Lỗi cấu trúc truy vấn SQL Backend sập ngầm!" });
  }
});

router.post("/nhat-ky", async (req, res) => {
  const { cayXanhId, loaiCongViec, ngayThucHien, ghiChu } = req.body;
  try {
    const query = `
      INSERT INTO "NHAT_KY_CHAM_SOC" ("MaCay", "LoaiCongViec", "NgayThucHien", "GhiChu")
      VALUES ($1, $2, $3, $4) 
      RETURNING "MaNhatKy";
    `;
    const result = await db.query(query, [parseInt(cayXanhId), loaiCongViec, ngayThucHien || new Date(), ghiChu || ""]);
    res.status(201).json({ success: true, id: result.rows[0].MaNhatKy });
  } catch (err) {
    console.error("🔴 Lỗi API /nhat-ky (POST):", err.message);
    res.status(500).json({ error: "Không thể thêm dòng nhật ký công vụ mới vào PostgreSQL" });
  }
});

router.delete("/nhat-ky/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM "NHAT_KY_CHAM_SOC" WHERE "MaNhatKy" = $1;', [parseInt(id)]);
    res.json({ success: true, message: "Đã xóa dòng nhật ký công vụ thành công." });
  } catch (err) {
    console.error("🔴 Lỗi API /nhat-ky (DELETE):", err.message);
    res.status(500).json({ error: "Xóa dòng nhật ký tác nghiệp thất bại từ hệ thống" });
  }
});

// ===================================================================
// 🏢 PHÂN HỆ 4: BẢNG ĐƠN VỊ QUẢN LÝ HẠ TẦNG
// ===================================================================
router.get("/don-vi", async (req, res) => {
  try {
    const query = `
      SELECT "MaDonVi" AS id, "TenDonVi" AS "tenDonVi", 
             "NguoiDaiDien" AS "nguoiDaiDien", "SoDienThoai" AS "soDienThoai", "KhuVucPhuTrach" AS "khuVucPhuTrach"
      FROM "DON_VI_QUAN_LY"
      ORDER BY "MaDonVi" ASC;
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("🔴 Lỗi API /don-vi (GET):", err);
    res.status(500).json({ error: "Thất bại khi lấy dữ liệu danh bạ đơn vị" });
  }
});

router.post("/don-vi", async (req, res) => {
  const { tenDonVi, nguoiDaiDien, soDienThoai, khuVucPhuTrach } = req.body;
  try {
    const query = `
      INSERT INTO "DON_VI_QUAN_LY" ("TenDonVi", "NguoiDaiDien", "SoDienThoai", "KhuVucPhuTrach")
      VALUES ($1, $2, $3, $4) RETURNING "MaDonVi";
    `;
    const result = await db.query(query, [tenDonVi, nguoiDaiDien, soDienThoai, khuVucPhuTrach]);
    res.status(201).json({ success: true, id: result.rows[0].MaDonVi });
  } catch (err) {
    console.error("🔴 Lỗi API /don-vi (POST):", err);
    res.status(500).json({ error: "Thất bại khi thêm đơn vị phụ trách" });
  }
});

router.delete("/don-vi/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM "DON_VI_QUAN_LY" WHERE "MaDonVi" = $1;', [parseInt(id)]);
    res.json({ success: true, message: "Đã gỡ đơn vị ra khỏi hệ thống." });
  } catch (err) {
    res.status(500).json({ error: "Xóa đơn vị thất bại" });
  }
});

// ===================================================================
// 🗺️ ĐỒNG BỘ LỚP PHỦ HÌNH HỌC ĐỊA LÝ (KHU VỰC, TUYẾN ĐƯỜNG, CÂY XANH)
// ===================================================================

// LẤY RANH GIỚI KHU VỰC
router.get("/khu-vuc", async (req, res) => {
  try {
    const { maKhuVuc } = req.query;
    let queryText = "";
    const params = [];

    if (maKhuVuc && maKhuVuc !== "") {
      queryText = `
        SELECT "MaKhuVuc" AS id, "TenKhuVuc",
               ST_AsGeoJSON("SHAPE")::json as geometry_osm 
        FROM "KHU_VUC_QUAN_LY"
        WHERE "MaKhuVuc" = $1
      `;
      params.push(parseInt(maKhuVuc));
    } else {
      queryText = `
        SELECT "MaKhuVuc" AS id, "TenKhuVuc",
               ST_AsGeoJSON("SHAPE")::json as geometry_osm
        FROM "KHU_VUC_QUAN_LY"
      `;
    }

    const result = await db.query(queryText, params);
    const geojson = {
      type: "FeatureCollection",
      features: result.rows.map((row) => ({
        type: "Feature",
        id: row.id,
        properties: { id: row.id, TenKhuVuc: row.TenKhuVuc },
        geometry: row.geometry_osm,
      })),
    };
    return res.json(geojson);
  } catch (error) {
    console.error("🔴 Lỗi API /khu-vuc:", error.message);
    res.status(500).json({ error: "Lỗi hệ thống lớp nền khu vực" });
  }
});

// LẤY TUYẾN ĐƯỜNG THEO KHU VỰC
router.get("/tuyen-duong", async (req, res) => {
  try {
    const { maKhuVuc } = req.query;
    let queryText = `
      SELECT "MaTuyenDuong" AS id, "TenDuong", ST_AsGeoJSON("SHAPE")::json as geometry 
      FROM "TUYEN_DUONG"
    `;
    const params = [];

    if (maKhuVuc && maKhuVuc !== "") {
      queryText += ` WHERE "MaKhuVuc" = $1`;
      params.push(parseInt(maKhuVuc));
    }

    const result = await db.query(queryText, params);
    const geojson = {
      type: "FeatureCollection",
      features: result.rows.map((row) => ({
        type: "Feature",
        properties: { id: row.id, tenDuong: row.TenDuong },
        geometry: row.geometry,
      })),
    };
    res.json(geojson);
  } catch (error) {
    console.error("🔴 Lỗi API /tuyen-duong:", error.message);
    res.status(500).json({ error: "Lỗi lọc tuyến đường" });
  }
});

// LẤY DANH SÁCH CÂY XANH (ÉP TỌA ĐỘ PHẲNG TRÁNH LỖI TABLE FEATURE LAYER)
router.get("/cay-xanh", async (req, res) => {
  try {
    const { maKhuVuc } = req.query;

    let queryText = `
      SELECT "MaCayXanh" AS id, "MaTuyenDuong", "LoaiCay", "TinhTrang", "ChieuCao", "DuongKinhTan", "lon", "lat"
      FROM "CAY_XANH"
    `;
    const params = [];

    if (maKhuVuc && maKhuVuc !== "") {
      queryText += ` WHERE "MaTuyenDuong" = $1`;
      params.push(parseInt(maKhuVuc));
    }

    let result = await db.query(queryText, params);

    // Bẫy lỗi Table phòng thủ nếu mảng trống rỗng
    if (result.rows.length === 0) {
      const fallbackQuery = `SELECT "MaCayXanh" AS id, "MaTuyenDuong", "LoaiCay", "TinhTrang", "ChieuCao", "DuongKinhTan", "lon", "lat" FROM "CAY_XANH"`;
      result = await db.query(fallbackQuery);
    }

    const geojson = {
      type: "FeatureCollection",
      features: result.rows.map((row) => {
        const v_lon = parseFloat(row.lon) || 106.70371;
        const v_lat = parseFloat(row.lat) || 10.77402;
        const v_height = parseFloat(row.ChieuCao) || 10.0;
        const v_diameter = parseFloat(row.DuongKinhTan) || 4.0;

        return {
          type: "Feature",
          id: parseInt(row.id),
          properties: {
            id: parseInt(row.id),
            maTuyenDuong: row.MaTuyenDuong,
            loaiCay: row.LoaiCay || "Cây xanh đô thị",
            tinhTrang: row.TinhTrang || "Khỏe mạnh",
            chieuCao: v_height,
            duongKinhTan: v_diameter,
          },
          geometry: {
            type: "Point",
            coordinates: [v_lon, v_lat],
          },
        };
      }),
    };

    return res.json(geojson);
  } catch (error) {
    console.error("🔴 Lỗi API /cay-xanh (GET):", error.message);
    return res.status(500).json({ error: "Lỗi hệ thống đồng bộ lớp cây xanh" });
  }
});

module.exports = router;
