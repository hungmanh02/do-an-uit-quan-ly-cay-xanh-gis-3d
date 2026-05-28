import React, {useEffect, useRef, useState, useImperativeHandle, forwardRef} from "react";
import * as esriLoader from "esri-loader";
const {loadModules} = esriLoader;

const Map3D = forwardRef((props, ref) => {
  const mapRef = useRef(null);

  // Quản lý các thực thể không gian bằng Ref để tránh rò rỉ bộ nhớ RAM trình duyệt
  const viewRef = useRef(null);
  const layerKhuVucRef = useRef(null);
  const layerTuyenDuongRef = useRef(null);
  const treeLayerRef = useRef(null);
  const suCoLayerRef = useRef(null);

  const [reportForm, setReportForm] = useState({show: false, lon: "", lat: "", type: "Cây ngã đổ", desc: ""});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Xuất các hàm điều khiển ra môi trường App.jsx bên ngoài
  useImperativeHandle(ref, () => ({
    refreshLayers() {
      if (layerKhuVucRef.current && typeof layerKhuVucRef.current.refresh === "function")
        layerKhuVucRef.current.refresh();
      if (layerTuyenDuongRef.current && typeof layerTuyenDuongRef.current.refresh === "function")
        layerTuyenDuongRef.current.refresh();
      if (treeLayerRef.current && typeof treeLayerRef.current.refresh === "function") treeLayerRef.current.refresh();
      if (suCoLayerRef.current && typeof suCoLayerRef.current.refresh === "function") suCoLayerRef.current.refresh();
    },

    // Hàm lướt camera mượt mà đến tọa độ chỉ định khi bấm danh sách sự cố lề phải
    flyToCoordinates(lon, lat) {
      if (viewRef.current) {
        viewRef.current
          .goTo(
            {
              center: [parseFloat(lon), parseFloat(lat)],
              zoom: 19, // Cận cảnh hiện trường sự cố
              tilt: 62, // Góc nghiêng lập thể xem khối 3D cây xanh
            },
            {
              duration: 1800,
              easing: "in-out-cubic", // Tốc độ mượt mà giảm tốc khi đến nơi
            },
          )
          .catch((err) => {
            console.error("Lỗi điều hướng camera:", err);
          });
      }
    },
  }));

  // ===================================================================
  // 🛰️ EFFECT 1: KHỞI TẠO BẢN ĐỒ 3D ARCGIS LẦN ĐẦU TIÊN (LOAD TRANG)
  // ===================================================================
  useEffect(() => {
    let view;

    loadModules(["esri/Map", "esri/views/SceneView", "esri/layers/GeoJSONLayer", "esri/config"], {css: true})
      .then(([Map, SceneView, GeoJSONLayer, esriConfig]) => {
        esriConfig.apiKey =
          "AAPK973c5d6c5c06497394db4372579dfcc1UfGk45X8wzM9b-Nf53k0VfG4_P-XpG7bWhR6k9-Z_6vK6MhG9vK-jR_m_L_J9vKG";

        const map = new Map({
          basemap: "osm",
          ground: "world-elevation",
        });

        // 🌟 KHỞI TẠO MẶC ĐỊNH: Camera ở độ cao lớn bao quát toàn bộ TP.HCM
        view = new SceneView({
          container: mapRef.current,
          map: map,
          camera: {
            position: {
              x: 106.66017, // Tọa độ tâm địa lý TP.HCM (Khu vực Quận 10/Quận 3)
              y: 10.76262,
              z: 12000, // Độ cao 12.000 mét bao quát toàn thành phố lúc load trang
            },
            tilt: 0, // Góc nhìn phẳng từ trên xuống giống 2D chuẩn tổng quan
            heading: 0,
          },
          environment: {
            lighting: {
              directShadowsEnabled: true, // Kích hoạt bóng đổ thân cây thực tế theo thời gian
              ambientOcclusionEnabled: true,
            },
          },
        });

        viewRef.current = view;
        const timestamp = new Date().getTime();

        // 🟢 TẦNG ĐÁY 1: Lớp ranh giới phân vùng quản lý (Polygon viền hồng nền tối mờ)
        const rendererKhuVuc = {
          type: "simple",
          symbol: {
            type: "polygon-3d",
            symbolLayers: [
              {
                type: "fill",
                material: {color: [15, 23, 42, 0.4]}, // Slate-900 độ trong suốt 40%
                outline: {color: [244, 63, 94, 0.9], size: 2.5}, // Viền hồng Rose-500 dày 2.5px
              },
            ],
          },
        };

        const layerKhuVuc = new GeoJSONLayer({
          url: `http://localhost:5000/api/map/khu-vuc?t=${timestamp}`,
          title: "Ranh giới quản lý hành chính",
          renderer: rendererKhuVuc,
          outFields: ["*"],
        });

        // 🔵 TẦNG GIỮA 2: Lớp mạng lưới tim đường / hành lang vỉa hè kỹ thuật (LineString phẳng lì)
        const layerTuyenDuong = new GeoJSONLayer({
          url: `http://localhost:5000/api/map/tuyen-duong?t=${timestamp}`,
          title: "Mạng lưới giao thông vỉa hè",
          geometryType: "polyline",
          outFields: ["*"],
          elevationInfo: {mode: "on-the-ground"},
          renderer: {
            type: "simple",
            symbol: {
              type: "line-3d",
              symbolLayers: [
                {
                  type: "line",
                  size: 4.0, // Độ rộng vỉa hè 4 mét
                  material: {color: "#475569"}, // Tông màu xám đường phố đô thị
                },
              ],
            },
          },
        });

        // 🌲 TẦNG ĐỈNH 3: Quần thể thực thể cây xanh lập thể 3D hình khối (Cylinder + Cone)
        const treeLayer = new GeoJSONLayer({
          url: `http://localhost:5000/api/map/cay-xanh?t=${timestamp}`,
          title: "Quần thể cây xanh lập thể",
          outFields: ["*"],
          renderer: {
            type: "simple",
            symbol: {
              type: "point-3d",
              symbolLayers: [
                {
                  type: "object",
                  resource: {primitive: "cylinder"}, // Gốc thân cây trụ gỗ nâu
                  material: {color: "#78350f"},
                  width: 0.4,
                  depth: 0.4,
                  anchor: "bottom",
                },
                {
                  type: "object",
                  resource: {primitive: "cone"}, // Tán lá cây xanh hình nón lập thể
                  material: {color: "#16a34a"},
                  width: 3.0,
                  depth: 3.0,
                  anchor: "center",
                },
              ],
            },
            // Biến đổi kích thước hình khối 3D đè khít theo dữ liệu thực tế từ PostgreSQL
            visualVariables: [
              {type: "size", field: "chieuCao", axis: "height", valueUnit: "meters"},
              {type: "size", field: "duongKinhTan", axis: "width-and-depth", valueUnit: "meters"},
            ],
          },
        });

        // 🚨 TẦNG PHÒNG THỦ: Lớp cảnh báo đốm đỏ mật độ sự cố thực địa (Point)
        const suCoLayer = new GeoJSONLayer({
          url: `http://localhost:5000/api/map/su-co?t=${timestamp}`,
          title: "Bản đồ nhiệt mật độ sự cố",
          geometryType: "point",
          outFields: ["*"],
          renderer: {
            type: "simple",
            symbol: {
              type: "point-3d",
              symbolLayers: [
                {
                  type: "icon",
                  size: 14,
                  resource: {primitive: "circle"},
                  material: {color: "#ef4444"}, // Màu đỏ cảnh báo
                  outline: {color: "#ffffff", width: 1.5},
                },
              ],
            },
          },
          popupTemplate: {
            title: "<span style='color:#ef4444;font-weight:bold;'>🚨 CHI TIẾT SỰ CỐ THỰC ĐỊA</span>",
            content:
              "<b>Phân loại sự cố:</b> {tieuDe}<br><b>Mô tả diễn biến:</b> {moTa}<br><b>Trạng thái:</b> {trangThai}",
          },
        });

        // Ép các lớp xếp chồng đè lên nhau theo chuẩn cấu trúc trật tự địa lý GIS
        map.addMany([layerKhuVuc, layerTuyenDuong, treeLayer, suCoLayer]);

        // Đổ ngược luồng vào Ref để các Effect khác tái sử dụng mà không nạp lại Map
        layerKhuVucRef.current = layerKhuVuc;
        layerTuyenDuongRef.current = layerTuyenDuong;
        treeLayerRef.current = treeLayer;
        suCoLayerRef.current = suCoLayer;

        // 🌟 ĐÃ GỠ BỎ ĐOẠN CODE layerTuyenDuong.when TỰ ĐỘNG ÉP CAMERA BAY VỀ QUẬN 1 LÚC ĐẦU
        // Giúp bản đồ giữ nguyên vị trí bao quát toàn thành phố lúc vừa vào hệ thống.

        // XỬ LÝ SỰ KIỆN CLICK CHUỘT TRÊN MÀN HÌNH BẢN ĐỒ
        view.on("click", (event) => {
          view.hitTest(event).then((response) => {
            const results = response.results;
            const treeGraphic = results.find((r) => r.graphic && r.graphic.layer === treeLayer);

            if (treeGraphic) {
              const attr = treeGraphic.graphic.attributes;
              if (props.onSelectTree) {
                props.onSelectTree({
                  id: attr.id,
                  loaiCay: attr.loaiCay,
                  tinhTrang: attr.tinhTrang,
                  chieuCao: attr.chieuCao,
                  duongKinhTan: attr.duongKinhTan,
                  lon: treeGraphic.graphic.geometry.longitude,
                  lat: treeGraphic.graphic.geometry.latitude,
                });
              }
              if (props.onMapClickPublic) props.onMapClickPublic(null);
            } else {
              const longitude = event.mapPoint.longitude;
              const latitude = event.mapPoint.latitude;

              if (props.onMapClickPublic) props.onMapClickPublic({lon: longitude, lat: latitude});
              if (props.onSelectTree) props.onSelectTree(null);
            }
          });
        });
      })
      .catch((err) => console.error("ArcGIS Setup Error: ", err));

    return () => {
      if (view) {
        view.destroy();
        viewRef.current = null;
      }
    };
  }, []);

  // ===================================================================
  // 🌟 EFFECT 2: LẮNG NGHE ĐỔI KHU VỰC - PHÂN CẤP CAMERA LINH HOẠT
  // ===================================================================
  useEffect(() => {
    if (!viewRef.current || !layerKhuVucRef.current) return;

    const maKhuVuc = props.currentKhuVucId || "";
    const timestamp = new Date().getTime();

    // 🌐 KỊCH BẢN 1: Khi chọn "Toàn bộ TP.HCM" (maKhuVuc rỗng "")
    if (maKhuVuc === "") {
      console.log("🏙️ Camera lùi về khoảng không gian bao quát toàn bộ TP.HCM");

      // Tải lại toàn bộ dữ liệu thô không lọc không gian
      layerKhuVucRef.current.url = `http://localhost:5000/api/map/khu-vuc?t=${timestamp}`;
      layerTuyenDuongRef.current.url = `http://localhost:5000/api/map/tuyen-duong?t=${timestamp}`;
      layerKhuVucRef.current.refresh();
      layerTuyenDuongRef.current.refresh();

      // Cất cánh camera lên độ cao lớn ngắm trọn vẹn ranh giới TP.HCM
      viewRef.current
        .goTo(
          {
            center: [106.66017, 10.76262], // Tâm bản đồ thành phố
            z: 12000, // Độ cao không trung 12km
            tilt: 0, // Trở về góc phẳng 2D bao quát tốt nhất
            heading: 0,
          },
          {duration: 1500, easing: "in-out-cubic"},
        )
        .catch(() => {});

      return; // Ngắt tiến trình tại đây, không cho lao camera xuống cận cảnh phân khu
    }
    // ----------------------------------------------------------------
    // 🏢 KỊCH BẢN 2 & 3: Khi chọn Quận 1 hoặc các phân khu cụ thể (maKhuVuc KHÁC rỗng)
    // ----------------------------------------------------------------
    console.log(`🚀 Đang chuyển mạch và đồng bộ tọa độ cho phân khu ID: ${maKhuVuc}`);

    // Cập nhật API lọc động gửi xuống PostgreSQL
    layerKhuVucRef.current.url = `http://localhost:5000/api/map/khu-vuc?maKhuVuc=${maKhuVuc}&t=${timestamp}`;
    layerTuyenDuongRef.current.url = `http://localhost:5000/api/map/tuyen-duong?maKhuVuc=${maKhuVuc}&t=${timestamp}`;

    // Ép làm tươi đồ họa đồ thị
    layerKhuVucRef.current.refresh();
    layerTuyenDuongRef.current.refresh();

    // 🌟 SỬA ĐOẠN NÀY: Dùng hàm queryExtent để bắt lớp dữ liệu tính toán tọa độ thật từ DB vừa trả về
    layerKhuVucRef.current.when(() => {
      // Thiết lập câu lệnh truy vấn quét toàn bộ thực thể vừa nạp của Layer
      const query = layerKhuVucRef.current.createQuery();

      layerKhuVucRef.current
        .queryExtent(query)
        .then((response) => {
          // response.extent chính là tọa độ bao vây CHÍNH XÁC 100% của phân khu vừa chọn
          if (response && response.extent) {
            return viewRef.current.goTo(response.extent, {
              duration: 1400,
              easing: "in-out-cubic",
            });
          }
        })
        .then(() => {
          // Sau khi sà xuống đúng vùng đất mới, tiến hành nghiêng góc phối cảnh 3D ngắm cây
          return viewRef.current.goTo({tilt: 52, heading: 325}, {duration: 500});
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            console.error("🔴 Lỗi tính toán định vị không gian phân khu:", err);
          }
        });
    });
  }, [props.currentKhuVucId]);

  // Hàm xử lý đẩy dữ liệu phản ánh sự cố lề tự do của người dân lên máy chủ API
  const handlePostSuCo = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/api/map/su-co", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          tieu_de: reportForm.type,
          mo_ta: reportForm.desc,
          nguoi_bao_cao: "Người dân phản ánh qua WebGIS",
          longitude: parseFloat(reportForm.lon),
          latitude: parseFloat(reportForm.lat),
        }),
      });

      if (response.ok) {
        alert("🎉 Hệ thống đã tiếp nhận vị trí phản ánh sự cố thành công!");
        setReportForm({show: false, lon: "", lat: "", type: "Cây ngã đổ", desc: ""});
        if (suCoLayerRef.current && typeof suCoLayerRef.current.refresh === "function") {
          suCoLayerRef.current.refresh();
        }
        if (props.onReportSuccess) props.onReportSuccess();
      } else {
        alert("Gặp lỗi trong quá trình ghi nhận không gian.");
      }
    } catch (error) {
      console.error(error);
      alert("Mất kết nối máy chủ API Backend!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{width: "100%", height: "100%", position: "relative"}}>
      <div ref={mapRef} style={{width: "100%", height: "100%"}} />

      {reportForm.show && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "370px",
            zIndex: 1000,
            backgroundColor: "rgba(15, 23, 42, 0.96)",
            border: "1px solid #f43f5e",
            padding: "18px",
            borderRadius: "16px",
            color: "#fff",
            fontFamily: "sans-serif",
            width: "260px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
          }}
        >
          <button
            type="button"
            onClick={() => setReportForm({...reportForm, show: false})}
            style={{
              position: "absolute",
              top: "12px",
              right: "14px",
              background: "none",
              border: "none",
              color: "#94a3b8",
              fontSize: "14px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ✕
          </button>
          <h3 style={{margin: "0 0 12px 0", fontSize: "13px", color: "#f43f5e", fontWeight: "bold"}}>
            🚨 PHẢN ÁNH SỰ CỐ THỰC ĐỊA
          </h3>
          <form
            onSubmit={handlePostSuCo}
            style={{display: "flex", flexDirection: "column", gap: "8px", fontSize: "11px"}}
          >
            <div>
              <label style={{color: "#94a3b8"}}>Vị trí click Maps:</label>
              <div style={{color: "#38bdf8", marginTop: "2px", fontWeight: "600"}}>
                X: {reportForm.lon}, Y: {reportForm.lat}
              </div>
            </div>
            <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
              <label style={{color: "#94a3b8"}}>Loại sự cố:</label>
              <select
                value={reportForm.type}
                onChange={(e) => setReportForm({...reportForm, type: e.target.value})}
                style={{
                  padding: "6px",
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  color: "#fff",
                  borderRadius: "6px",
                }}
              >
                <option value="Cây ngã đổ">🌳 Cây ngã đổ chắn đường</option>
                <option value="Cành cây gãy sập">🌿 Cành gãy vướng dây điện</option>
                <option value="Sâu bệnh/Héo úa">🐛 Cây mục rỗng gốc hiểm họa</option>
              </select>
            </div>
            <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
              <label style={{color: "#94a3b8"}}>Mô tả chi tiết:</label>
              <textarea
                rows="2"
                placeholder="Ví dụ: Cây phượng vĩ đổ đè lề đường..."
                required
                value={reportForm.desc}
                onChange={(e) => setReportForm({...reportForm, desc: e.target.value})}
                style={{
                  padding: "6px",
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  color: "#fff",
                  borderRadius: "6px",
                  resize: "none",
                }}
              />
            </div>
            <div style={{display: "flex", gap: "8px", marginTop: "6px"}}>
              <button
                type="button"
                onClick={() => setReportForm({...reportForm, show: false})}
                style={{
                  flex: 1,
                  padding: "7px",
                  backgroundColor: "#475569",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  flex: 2,
                  padding: "7px",
                  backgroundColor: "#e11d48",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {isSubmitting ? "Đang gửi..." : "💥 Gửi phản ánh"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
});

export default Map3D;
