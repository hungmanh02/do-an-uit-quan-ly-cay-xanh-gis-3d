import React, {useEffect, useRef, useState, useImperativeHandle, forwardRef} from "react";
import * as esriLoader from "esri-loader";
const {loadModules} = esriLoader;

const Map3D = forwardRef((props, ref) => {
  const mapRef = useRef(null);

  // 🌟 KHẮC PHỤC CHÍNH XÁC: Dùng Ref để quản lý thực thể View thay vì biến window toàn cục
  const viewRef = useRef(null);
  const treeLayerRef = useRef(null);
  const suCoLayerRef = useRef(null);

  const [reportForm, setReportForm] = useState({show: false, lon: "", lat: "", type: "Cây ngã đổ", desc: ""});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Xuất các hàm điều khiển ra môi trường App.jsx bên ngoài
  useImperativeHandle(ref, () => ({
    refreshLayers() {
      if (treeLayerRef.current && typeof treeLayerRef.current.refresh === "function") treeLayerRef.current.refresh();
      if (suCoLayerRef.current && typeof suCoLayerRef.current.refresh === "function") suCoLayerRef.current.refresh();
    },

    // 🌟 HÀM BAY CAMERA CHUẨN ĐỒNG BỘ:
    flyToCoordinates(lon, lat) {
      if (viewRef.current) {
        viewRef.current
          .goTo(
            {
              center: [parseFloat(lon), parseFloat(lat)],
              zoom: 19, // Phóng to cận cảnh khu vực sự cố
              tilt: 65, // Tạo góc nghiêng 3D để dễ dàng quan sát
            },
            {
              duration: 1800, // Tốc độ lướt camera mượt mà trong 1.8 giây
              easing: "in-out-cubic", // Hiệu ứng lướt mượt giảm tốc khi đến nơi
            },
          )
          .catch((err) => {
            console.error("Lỗi điều hướng không gian camera:", err);
          });
      } else {
        console.warn("Thực thể bản đồ 3D chưa sẵn sàng tiếp nhận điều hướng.");
      }
    },
  }));

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

        view = new SceneView({
          container: mapRef.current,
          map: map,
          camera: {
            position: {
              x: 106.702514, // Kinh độ trung tâm Nguyễn Huệ, Quận 1
              y: 10.772548, // Vĩ độ Quận 1
              z: 400, // Độ cao camera cách mặt đất (mét) - 400m để nhìn toàn cảnh lập thể
            },
            tilt: 45, // Góc nghiêng camera 45 độ để thấy rõ khối 3D ốc đảo cây xanh
            heading: 0,
          },
          environment: {
            lighting: {
              directShadowsEnabled: true,
              ambientOcclusionEnabled: true,
            },
          },
        });

        // 🌟 GÁN THỰC THỂ VIEW VÀO REF NGAY KHI KHỞI TẠO THÀNH CÔNG
        viewRef.current = view;

        // ===================================================================
        // CÁC LỚP DỮ LIỆU KHÔNG GIAN (Giữ nguyên cấu hình cũ)
        // ===================================================================
        const layerKhuVuc = new GeoJSONLayer({
          url: "http://localhost:5000/api/map/khu-vuc",
          title: "Ranh giới quản lý hành chính",
          renderer: {
            type: "simple",
            symbol: {
              type: "polygon-3d",
              symbolLayers: [
                {
                  type: "fill",
                  material: {color: [16, 185, 129, 0.04]},
                  outline: {color: "rgba(16, 185, 129, 0.6)", width: 2},
                },
              ],
            },
          },
        });
        map.add(layerKhuVuc);

        const layerTuyenDuong = new GeoJSONLayer({
          url: "http://localhost:5000/api/map/tuyen-duong",
          title: "Mạng lưới giao thông vỉa hè",
          renderer: {
            type: "simple",
            symbol: {
              type: "line-3d",
              symbolLayers: [{type: "path", profile: "quad", width: 4, material: {color: "#475569"}}],
            },
          },
        });
        map.add(layerTuyenDuong);

        const treeLayer = new GeoJSONLayer({
          url: "http://localhost:5000/api/map/cay-xanh",
          title: "Quần thể cây xanh lập thể",
          outFields: ["*"],
          renderer: {
            type: "simple",
            symbol: {
              type: "point-3d",
              symbolLayers: [
                {
                  type: "object",
                  resource: {primitive: "cylinder"},
                  material: {color: "#78350f"},
                  width: 0.4,
                  depth: 0.4,
                  anchor: "bottom",
                },
                {
                  type: "object",
                  resource: {primitive: "cone"},
                  material: {color: "#16a34a"},
                  width: 3.0,
                  depth: 3.0,
                  anchor: "center",
                },
              ],
            },
            visualVariables: [
              {type: "size", field: "chieuCao", axis: "height", valueUnit: "meters"},
              {type: "size", field: "duongKinhTan", axis: "width-and-depth", valueUnit: "meters"},
            ],
          },
        });
        map.add(treeLayer);
        treeLayerRef.current = treeLayer;

        const suCoRenderer = {
          type: "simple",
          symbol: {
            type: "point-3d",
            symbolLayers: [
              {
                type: "icon",
                size: 14,
                resource: {primitive: "circle"},
                material: {color: "#ef4444"}, // Đốm tròn màu đỏ rực định vị vị trí sự cố
                outline: {color: "#ffffff", width: 1.5},
              },
            ],
          },
        };

        const suCoLayer = new GeoJSONLayer({
          url: "http://localhost:5000/api/map/su-co",
          title: "Bản đồ nhiệt mật độ sự cố",
          geometryType: "point", // 🌟 BỔ SUNG DÒNG NÀY: Ép ArcGIS nhận diện đây là lớp Điểm (Point)
          outFields: ["*"],
          renderer: suCoRenderer,
          popupTemplate: {
            title: "<span style='color:#ef4444;font-weight:bold;'>🚨 CHI TIẾT SỰ CỐ THỰC ĐỊA</span>",
            content:
              "<b>Phân loại sự cố:</b> {tieuDe}<br><b>Mô tả diễn biến:</b> {moTa}<br><b>Trạng thái:</b> {trangThai}",
          },
        });
        map.add(suCoLayer);
        suCoLayerRef.current = suCoLayer;

        view.on("click", (event) => {
          view.hitTest(event).then((response) => {
            const results = response.results;
            const treeGraphic = results.find((r) => r.graphic && r.graphic.layer === treeLayer);

            if (treeGraphic) {
              // TRƯỜNG HỢP 1: Người dân click TRÚNG cây xanh lập thể
              const attr = treeGraphic.graphic.attributes;

              if (props.onSelectTree) {
                props.onSelectTree({
                  id: attr.id,
                  loaiCay: attr.loaiCay,
                  tinhTrang: attr.tinhTrang,
                  chieuCao: attr.chieuCao,
                  duongKinhTan: attr.duongKinhTan,
                  // Lấy chính xác tọa độ gốc của cây từ CSDL chứ không lấy điểm click lệch vỉa hè
                  lon: treeGraphic.graphic.geometry.longitude,
                  lat: treeGraphic.graphic.geometry.latitude,
                });
              }

              // Đóng Form click điểm bất kỳ (nếu đang mở)
              if (props.onMapClickPublic) props.onMapClickPublic(null);
            } else {
              // TRƯỜNG HỢP 2: Click trượt ra ngoài khoảng trống vỉa hè
              // Bật chế độ lấy tọa độ tự do nếu chưa đăng nhập Admin
              const longitude = event.mapPoint.longitude;
              const latitude = event.mapPoint.latitude;

              if (props.onMapClickPublic) props.onMapClickPublic({lon: longitude, lat: latitude});
              if (props.onSelectTree) props.onSelectTree(null); // Ẩn thanh Bottom Bar màu đen đi
            }
          });
        });
      })
      .catch((err) => console.error("ArcGIS Error: ", err));

    return () => {
      if (view) {
        view.destroy();
        viewRef.current = null;
      }
    };
  }, []);

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
        // 🌟 THÊM DÒNG NÀY: Báo cho App.jsx tải lại danh sách lề phải lập tức
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
