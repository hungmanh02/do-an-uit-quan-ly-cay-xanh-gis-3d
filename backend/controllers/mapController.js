// backend/controllers/mapController.js
const db = require("../config/db");

// ===================================================================
// 🌲 1. API: LẤY DANH SÁCH CÂY XANH (Lớp Point 3D GeoJSON)
// ===================================================================
// backend/controllers/mapController.js

exports.getCayXanh = async (req, res) => {
  try {
    // 🎯 Truy vấn bốc các trường tọa độ số thực thô (lon, lat) trực tiếp từ bảng
    const sql = `
      SELECT "MaCayXanh", "MaTuyenDuong", "LoaiCay", "TinhTrang", "ChieuCao", "DuongKinhTan", "lon", "lat"
      FROM "CAY_XANH";
    `;
    const result = await db.query(sql);

    // Tự đóng gói chuỗi Feature GeoJSON chuẩn đét từ bộ nhớ RAM NodeJS
    const features = result.rows.map((row) => {
      const v_lon = parseFloat(row.lon) || 106.70371;
      const v_lat = parseFloat(row.lat) || 10.77402;

      return {
        type: "Feature",
        // Khóa cứng cấu trúc định dạng Point FLAT phẳng cho ArcGIS không thể bắt bẻ lỗi hình học
        geometry: {
          type: "Point",
          coordinates: [v_lon, v_lat],
        },
        properties: {
          id: parseInt(row.MaCayXanh), // 🚀 Ép trường id làm khóa định danh đồ họa 3D ngầm
          MaCayXanh: parseInt(row.MaCayXanh),
          MaTuyenDuong: row.MaTuyenDuong,
          LoaiCay: row.LoaiCay,
          TinhTrang: row.TinhTrang,
          ChieuCao: parseFloat(row.ChieuCao) || 10.0,
          DuongKinhTan: parseFloat(row.DuongKinhTan) || 3.5,
        },
      };
    });

    res.status(200).json({ type: "FeatureCollection", features });
  } catch (error) {
    console.error("🔴 Lỗi chí mạng API getCayXanh:", error.message);
    res.status(500).json({ message: "Lỗi cấu trúc xuất GeoJSON." });
  }
};

// ===================================================================
// 🛣️ 2. API: LẤY DANH SÁCH TUYẾN ĐƯỜNG (Lớp Line GeoJSON)
// ===================================================================
exports.getTuyenDuong = async (req, res) => {
  try {
    const { maKhuVuc } = req.query;
    let sql = `
      SELECT "MaTuyenDuong" AS id, "MaKhuVuc", "TenDuong",
             ST_AsGeoJSON("SHAPE") as geometry 
      FROM "TUYEN_DUONG"
    `;
    const params = [];

    if (maKhuVuc && maKhuVuc !== "") {
      sql += ` WHERE "MaKhuVuc" = $1`;
      params.push(parseInt(maKhuVuc));
    }

    const result = await db.query(sql, params);

    const features = result.rows.map((row) => ({
      type: "Feature",
      geometry: JSON.parse(row.geometry),
      properties: {
        id: row.id,
        maKhuVuc: row.MaKhuVuc,
        tenDuong: row.TenDuong,
      },
    }));

    res.status(200).json({ type: "FeatureCollection", features });
  } catch (error) {
    console.error("🔴 Lỗi getTuyenDuong:", error.message);
    res.status(500).json({ message: "Lỗi truy vấn dữ liệu không gian tuyến đường." });
  }
};

// ===================================================================
// 🏢 3. API: LẤY RANH GIỚI VÙNG QUẢN LÝ (Lớp Polygon GeoJSON)
// ===================================================================
exports.getKhuVuc = async (req, res) => {
  try {
    const sql = `
      SELECT "MaKhuVuc" AS id, "TenKhuVuc",
             ST_AsGeoJSON("SHAPE") as geometry 
      FROM "KHU_VUC_QUAN_LY";
    `;
    const result = await db.query(sql);

    const features = result.rows.map((row) => ({
      type: "Feature",
      geometry: JSON.parse(row.geometry),
      properties: {
        id: row.id,
        tenKhuVuc: row.TenKhuVuc,
      },
    }));

    res.status(200).json({ type: "FeatureCollection", features });
  } catch (error) {
    console.error("🔴 Lỗi getKhuVuc:", error.message);
    res.status(500).json({ message: "Lỗi truy vấn dữ liệu ranh giới vùng hành chính." });
  }
};

// ===================================================================
// 🚨 4. API: GHI NHẬN SỰ CỐ KHẨN CẤP TỪ NGƯỜI DÂN (Point)
// ===================================================================
exports.reportSuCo = async (req, res) => {
  const { tieu_de, mo_ta, longitude, latitude } = req.body;
  try {
    const sql = `
      INSERT INTO "SU_CO" ("tieuDe", "moTa", "trangThai", "lon", "lat", "SHAPE") 
      VALUES ($1, $2, 'Chưa xử lý', $3, $4, $5, ST_SetSRID(ST_MakePoint($3, $4), 4326))
      RETURNING "MaSuCo" AS id;
    `;
    const result = await db.query(sql, [
      tieu_de || "Sự cố cây xanh",
      mo_ta || "",
      parseFloat(longitude),
      parseFloat(latitude),
    ]);

    res.status(201).json({ message: "Báo cáo sự cố không gian thành công!", id: result.rows[0].id });
  } catch (error) {
    console.error("🔴 Lỗi reportSuCo:", error.message);
    res.status(500).json({ message: "Lỗi ghi nhận sự cố hiện trường thực địa." });
  }
};

// ===================================================================
// 🌲 5. API: THÊM MỚI MỘT THỰC THỂ CÂY XANH (PostGIS 3D)
// ===================================================================
exports.createCayXanh = async (req, res) => {
  const { MaTuyenDuong, loaiCay, tinhTrang, chieuCao, duongKinhTan, lon, lat } = req.body;

  if (!loaiCay || !lon || !lat) {
    return res.status(400).json({
      success: false,
      message: "Thất bại: Thiếu các trường bắt buộc (Chủng loại, Kinh độ, Vĩ độ).",
    });
  }

  try {
    const sql = `
      INSERT INTO "CAY_XANH" ("MaTuyenDuong", "LoaiCay", "TinhTrang", "ChieuCao", "DuongKinhTan", "lon", "lat", "SHAPE")
      VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($6, $7), 4326))
      RETURNING "MaCayXanh" AS id; 
    `;

    const result = await db.query(sql, [
      parseInt(MaTuyenDuong) || 1,
      loaiCay,
      tinhTrang || "Khỏe mạnh",
      parseFloat(chieuCao) || 0,
      parseFloat(duongKinhTan) || 0,
      parseFloat(lon),
      parseFloat(lat),
    ]);

    return res.status(201).json({
      success: true,
      message: "🎉 Thêm thực thể cây xanh mới vào bản đồ PostGIS thành công!",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("🔴 Lỗi chí mạng khi thực thi INSERT INTO CAY_XANH:", error.message);
    return res.status(500).json({
      success: false,
      message: `Lỗi cơ sở dữ liệu ngầm: ${error.message}`,
    });
  }
};

// ===================================================================
// ✏️ 6. API: CẬP NHẬT THÔNG TIN THUỘC TÍNH CÂY XANH (PUT)
// ===================================================================
exports.updateCayXanh = async (req, res) => {
  const { id } = req.params; // Nhận MaCayXanh từ đường dẫn url truyền xuống
  const { loaiCay, tinhTrang, chieuCao, duongKinhTan, lon, lat } = req.body;
  try {
    const sql = `
      UPDATE "CAY_XANH" 
      SET "LoaiCay" = $1, "TinhTrang" = $2, "ChieuCao" = $3, "DuongKinhTan" = $4,
          "lon" = $5, "lat" = $6, "SHAPE" = ST_SetSRID(ST_MakePoint($5, $6), 4326)
      WHERE "MaCayXanh" = $7;
    `;
    await db.query(sql, [
      loaiCay,
      tinhTrang,
      parseFloat(chieuCao) || 0,
      parseFloat(duongKinhTan) || 0,
      parseFloat(lon),
      parseFloat(lat),
      parseInt(id),
    ]);

    res.status(200).json({ message: `Cập nhật thuộc tính không gian cây xanh #${id} thành công!` });
  } catch (error) {
    console.error("🔴 Lỗi updateCayXanh:", error.message);
    res.status(500).json({ message: "Lỗi cấu hình cập nhật dữ liệu thuộc tính PostGIS." });
  }
};

// ===================================================================
// 🗑️ 7. API: XÓA CÂY XANH KHỎI HỆ THỐNG (DELETE)
// ===================================================================
exports.deleteCayXanh = async (req, res) => {
  const { id } = req.params;
  try {
    const sql = `DELETE FROM "CAY_XANH" WHERE "MaCayXanh" = $1;`;
    await db.query(sql, [parseInt(id)]);

    res.status(200).json({ message: `Đã xóa hoàn toàn dữ liệu cây xanh mã số #${id} khỏi hệ thống PostGIS.` });
  } catch (error) {
    console.error("🔴 Lỗi deleteCayXanh:", error.message);
    res.status(500).json({ message: "Lỗi phân quyền hoặc xung đột ràng buộc, không thể giải phóng thực thể." });
  }
};
