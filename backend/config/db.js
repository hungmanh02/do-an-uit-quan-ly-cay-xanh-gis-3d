const {Pool} = require("pg");

// Cấu hình thông số kết nối CSDL của nhóm
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "gis_3d_cay_xanh",
  password: "admin", // Thay bằng mật khẩu CSDL của nhóm
  port: 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
