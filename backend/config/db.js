const {Pool} = require("pg");
require("dotenv").config(); // 🌟 BẮT BUỘC: Thêm dòng này ở đầu để NodeJS đọc được file .env

// Cấu hình thông số kết nối sử dụng biến môi trường linh hoạt
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "gis_3d_cay_xanh",
  password: process.env.DB_PASSWORD || "admin",
  port: process.env.DB_PORT || 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
