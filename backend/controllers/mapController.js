// backend/controllers/mapController.js
const db = require("../config/db");

// 1. API: Lấy danh sách cây xanh (Lớp Point 3D)
exports.getCayXanh = async (req, res) => {
  try {
    const sql = `
      SELECT id, loai_cay, tinh_trang, chieu_cao, duong_kinh_tan, id_tuyen_duong,
             ST_AsGeoJSON(shape) as geometry 
      FROM CAY_XANH;
    `;
    const result = await db.query(sql);

    const features = result.rows.map((row) => ({
      type: "Feature",
      geometry: JSON.parse(row.geometry),
      properties: {
        id: row.id,
        loaiCay: row.loai_cay,
        tinhTrang: row.tinh_trang,
        chieuCao: row.chieu_cao,
        duongKinhTan: row.duong_kinh_tan,
        idTuyenDuong: row.id_tuyen_duong,
      },
    }));

    res.status(200).json({type: "FeatureCollection", features});
  } catch (error) {
    console.error("Lỗi getCayXanh:", error);
    res.status(500).json({message: "Lỗi truy vấn dữ liệu không gian cây xanh."});
  }
};

// 2. API: Lấy danh sách tuyến đường (Lớp Line)
exports.getTuyenDuong = async (req, res) => {
  try {
    const sql = `
      SELECT id, ten_duong, loai_duong, id_khu_vuc,
             ST_AsGeoJSON(shape) as geometry 
      FROM TUYEN_DUONG;
    `;
    const result = await db.query(sql);

    const features = result.rows.map((row) => ({
      type: "Feature",
      geometry: JSON.parse(row.geometry),
      properties: {
        id: row.id,
        tenDuong: row.ten_duong,
        loaiDuong: row.loai_duong,
        idKhuVuc: row.id_khu_vuc,
      },
    }));

    res.status(200).json({type: "FeatureCollection", features});
  } catch (error) {
    console.error("Lỗi getTuyenDuong:", error);
    res.status(500).json({message: "Lỗi truy vấn dữ liệu không gian tuyến đường."});
  }
};

// 3. API: Lấy ranh giới vùng quản lý (Lớp Polygon)
exports.getKhuVuc = async (req, res) => {
  try {
    const sql = `
      SELECT id, ten_khu_vuc, don_vi_phu_trach,
             ST_AsGeoJSON(shape) as geometry 
      FROM KHU_VUC_QUAN_LY;
    `;
    const result = await db.query(sql);

    const features = result.rows.map((row) => ({
      type: "Feature",
      geometry: JSON.parse(row.geometry),
      properties: {
        id: row.id,
        tenKhuVuc: row.ten_khu_vuc,
        donViPhuTrach: row.don_vi_phu_trach,
      },
    }));

    res.status(200).json({type: "FeatureCollection", features});
  } catch (error) {
    console.error("Lỗi getKhuVuc:", error);
    res.status(500).json({message: "Lỗi truy vấn dữ liệu ranh giới vùng."});
  }
};

// 4. API: Ghi nhận sự cố khẩn cấp từ người dân (Ghi nhận Point)
exports.reportSuCo = async (req, res) => {
  const {loai_su_co, mo_ta, longitude, latitude} = req.body;
  try {
    const sql = `
      INSERT INTO SU_CO (loai_su_co, mo_ta, shape) 
      VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326))
      RETURNING id;
    `;
    const result = await db.query(sql, [loai_su_co, mo_ta, longitude, latitude]);
    res.status(201).json({message: "Báo cáo sự cố thành công!", id: result.rows[0].id});
  } catch (error) {
    console.error("Lỗi reportSuCo:", error);
    res.status(500).json({message: "Lỗi ghi nhận sự cố."});
  }
};
// [POST] THÊM CÂY XANH MỚI (Hỗ trợ hình học 3D)
exports.createCayXanh = async (req, res) => {
  const {loai_cay, tinh_trang, chieu_cao, duong_kinh_tan, longitude, latitude} = req.body;
  try {
    const sql = `
      INSERT INTO CAY_XANH (loai_cay, tinh_trang, chieu_cao, duong_kinh_tan, shape)
      VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326))
      RETURNING id;
    `;
    const result = await db.query(sql, [loai_cay, tinh_trang, chieu_cao, duong_kinh_tan, longitude, latitude]);
    res.status(201).json({message: "Thêm cây xanh mới vào bản đồ thành công!", id: result.rows[0].id});
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Lỗi không thể tạo thực thể cây xanh mới."});
  }
};

// [PUT] CẬP NHẬT THÔNG TIN CÂY XANH (Ví dụ sửa trạng thái Sức khỏe, Chiều cao khi cây lớn)
exports.updateCayXanh = async (req, res) => {
  const {id} = req.params;
  const {loai_cay, tinh_trang, chieu_cao, duong_kinh_tan, longitude, latitude} = req.body;
  try {
    const sql = `
      UPDATE CAY_XANH 
      SET loai_cay = $1, tinh_trang = $2, chieu_cao = $3, duong_kinh_tan = $4,
          shape = ST_SetSRID(ST_MakePoint($5, $6), 4326)
      WHERE id = $7;
    `;
    await db.query(sql, [loai_cay, tinh_trang, chieu_cao, duong_kinh_tan, longitude, latitude, id]);
    res.status(200).json({message: `Cập nhật thông tin cây xanh mã số #${id} thành công!`});
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Lỗi cấu hình cập nhật dữ liệu thuộc tính."});
  }
};

// [DELETE] XÓA CÂY XANH KHỎI DATABASE
exports.deleteCayXanh = async (req, res) => {
  const {id} = req.params;
  try {
    const sql = `DELETE FROM CAY_XANH WHERE id = $1;`;
    await db.query(sql, [id]);
    res.status(200).json({message: `Đã xóa hoàn toàn dữ liệu cây xanh mã số #${id} khỏi hệ thống.`});
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Lỗi phân quyền hoặc xung đột ràng buộc, không thể xóa."});
  }
};
// API Lấy dữ liệu Đa giác mạng lưới khu vực hành chính
router.get("/khu-vuc", async (req, res) => {
  try {
    const query = `
      SELECT json_build_object('type', 'FeatureCollection', 'features', json_agg(ST_AsGeoJSON(t.*)::json)) as geojson
      FROM (SELECT "MaKhuVuc" AS id, "TenKhuVuc" AS "tenKhuVuc", "SHAPE" AS geom FROM KHU_VUC_QUAN_LY) t;
    `;
    const result = await pool.query(query);
    res.json(result.rows[0].geojson || {type: "FeatureCollection", features: []});
  } catch (err) {
    res.status(500).json({error: "Lỗi lớp ranh giới"});
  }
});

// API Lấy dữ liệu Chuỗi đường giao thông vỉa hè
router.get("/tuyen-duong", async (req, res) => {
  try {
    const query = `
      SELECT json_build_object('type', 'FeatureCollection', 'features', json_agg(ST_AsGeoJSON(t.*)::json)) as geojson
      FROM (SELECT "MaTuyenDuong" AS id, "TenDuong" AS "tenDuong", "SHAPE" AS geom FROM TUYEN_DUONG) t;
    `;
    const result = await pool.query(query);
    res.json(result.rows[0].geojson || {type: "FeatureCollection", features: []});
  } catch (err) {
    res.status(500).json({error: "Lỗi lớp tuyến đường"});
  }
});
