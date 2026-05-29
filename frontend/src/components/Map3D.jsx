import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { loadModules } from "esri-loader";

const Map3D = forwardRef((props, ref) => {
  const mapRef = useRef(null);

  const viewRef = useRef(null);
  const layerKhuVucRef = useRef(null);
  const layerTuyenDuongRef = useRef(null);

  // 🎯 CHÌA KHÓA: Khai báo Ref riêng biệt cho cả Thân và Tán để điều khiển làm tươi đồng thời
  const treeTrunkRef = useRef(null);
  const treeCrownRef = useRef(null);

  // Xuất các hàm điều phối dòng đời ra App.jsx lề ngoài
  useImperativeHandle(ref, () => ({
    refreshLayers() {
      console.log("🔄 [HỆ THỐNG GIS] Đang làm tươi đồng bộ toàn bộ các tầng dữ liệu không gian...");

      // 1. Làm tươi lớp Ranh giới và Tuyến đường
      if (layerKhuVucRef.current && typeof layerKhuVucRef.current.refresh === "function")
        layerKhuVucRef.current.refresh();
      if (layerTuyenDuongRef.current && typeof layerTuyenDuongRef.current.refresh === "function")
        layerTuyenDuongRef.current.refresh();

      // 🎯 SỬA LỖI CHÍ MẠNG: Ép cả Thân cây và Tán lá nạp lại đồng thời
      // Thêm cấu hình thời gian ngầm vào URL trước khi refresh để bẻ gãy cache của ArcGIS 4.25
      const freshTimestamp = new Date().getTime();

      if (treeTrunkRef.current) {
        treeTrunkRef.current.url = `http://localhost:5000/api/map/cay-xanh?t=${freshTimestamp}`;
        if (typeof treeTrunkRef.current.refresh === "function") treeTrunkRef.current.refresh();
      }

      if (treeCrownRef.current) {
        treeCrownRef.current.url = `http://localhost:5000/api/map/cay-xanh?t=${freshTimestamp}`;
        if (typeof treeCrownRef.current.refresh === "function") treeCrownRef.current.refresh();
      }

      console.log("🚀 [HỆ THỐNG GIS] Đã bẻ gãy cache đồ hoạ! Thân và Tán đã cập nhật dữ liệu mới!");
    },

    flyToCoordinates(lon, lat) {
      if (viewRef.current) {
        viewRef.current.goTo(
          { center: [parseFloat(lon), parseFloat(lat)], zoom: 19, tilt: 62 },
          { duration: 1800, easing: "in-out-cubic" }
        );
      }
    },
  }));

  // Hàm hỗ trợ làm tươi lớp tán lá phòng thủ
  const treeCrownLayerKhongGianRefresh = () => {
    if (treeCrownRef.current && typeof treeCrownRef.current.refresh === "function") {
      treeCrownRef.current.refresh();
    }
  };

  // ===================================================================
  // 🛰️ EFFECT 1: KHỞI TẠO BẢN ĐỒ LÕI LẬP THỂ 3D (CHỈ CHẠY 1 LẦN DUY NHẤT)
  // ===================================================================
  useEffect(() => {
    loadModules(
      [
        "esri/Map",
        "esri/views/SceneView",
        "esri/layers/GeoJSONLayer",
        "esri/config",
        "esri/renderers/SimpleRenderer",
        "esri/symbols/PointSymbol3D",
        "esri/symbols/ObjectSymbol3DLayer",
      ],
      { css: true }
    )
      .then(([Map, SceneView, GeoJSONLayer, esriConfig, SimpleRenderer, PointSymbol3D, ObjectSymbol3DLayer]) => {
        esriConfig.apiKey =
          "AAPK973c5d6c5c06497394db4372579dfcc1UfGk45X8wzM9b-Nf53k0VfG4_P-XpG7bWhR6k9-Z_6vK6MhG9vK-jR_m_L_J9vKG";

        const map = new Map({
          basemap: "osm",
          ground: "world-elevation",
        });

        const view = new SceneView({
          container: mapRef.current,
          map: map,
          camera: {
            position: [106.70371, 10.77402, 150],
            tilt: 50,
            heading: 0,
          },
        });

        viewRef.current = view;

        const currentTimestamp = new Date().getTime();

        const layerKhuVuc = new GeoJSONLayer({
          url: `http://localhost:5000/api/map/khu-vuc?t=${currentTimestamp}`,
          elevationInfo: { mode: "on-the-ground" },
          renderer: new SimpleRenderer({
            symbol: {
              type: "polygon-3d",
              symbolLayers: [
                {
                  type: "fill",
                  material: { color: [15, 23, 42, 0.2] },
                  outline: { color: [244, 63, 94, 0.8], width: 2 },
                },
              ],
            },
          }),
        });

        const layerTuyenDuong = new GeoJSONLayer({
          url: `http://localhost:5000/api/map/tuyen-duong?t=${currentTimestamp}`,
          geometryType: "polyline",
          elevationInfo: { mode: "relative-to-ground", offset: 0.3 },
          renderer: new SimpleRenderer({
            symbol: { type: "line-3d", symbolLayers: [{ type: "line", size: 4.0, material: { color: "#475569" } }] },
          }),
        });

        const treeApiUrl = `http://localhost:5000/api/map/cay-xanh?t=${currentTimestamp}`;

        const treeTrunkLayer = new GeoJSONLayer({
          url: treeApiUrl,
          title: "Thân cây đô thị",
          geometryType: "point",
          outFields: ["id", "maTuyenDuong", "loaiCay", "tinhTrang", "chieuCao", "duongKinhTan"],
          elevationInfo: { mode: "relative-to-ground", offset: 0 },
          renderer: {
            type: "simple",
            symbol: new PointSymbol3D({
              symbolLayers: [
                new ObjectSymbol3DLayer({
                  resource: { primitive: "cylinder" },
                  material: { color: "#78350f" },
                  width: 1.0,
                  depth: 1.0,
                  height: 4.5,
                  anchor: "bottom",
                }),
              ],
            }),
          },
        });

        const treeCrownLayer = new GeoJSONLayer({
          url: treeApiUrl,
          title: "Tán lá lập thể",
          geometryType: "point",
          outFields: ["id", "maTuyenDuong", "loaiCay", "tinhTrang", "chieuCao", "duongKinhTan"],
          elevationInfo: { mode: "relative-to-ground", offset: 4.2 },
          renderer: {
            type: "simple",
            symbol: new PointSymbol3D({
              symbolLayers: [
                new ObjectSymbol3DLayer({
                  resource: { primitive: "cone" },
                  material: { color: "#16a34a" },
                  width: 4.5,
                  depth: 4.5,
                  height: 5.5,
                  anchor: "bottom",
                }),
              ],
            }),
            visualVariables: [{ type: "size", field: "duongKinhTan", axis: "width-and-depth", valueUnit: "meters" }],
          },
        });

        view.when(() => {
          map.addMany([layerKhuVuc, layerTuyenDuong, treeTrunkLayer, treeCrownLayer]);
          console.log("🌲 [HỆ THỐNG GIS] Đã kết nối quần thể 3D thông suốt!");
        });

        layerKhuVucRef.current = layerKhuVuc;
        layerTuyenDuongRef.current = layerTuyenDuong;

        // Đổ luồng vào hai Ref điều khiển độc lập
        treeTrunkRef.current = treeTrunkLayer;
        treeCrownRef.current = treeCrownLayer;

        // CLICK MAP TƯƠNG TÁC THỰC ĐỊA
        view.on("click", (event) => {
          if (event.native) {
            if (typeof event.native.preventDefault === "function") event.native.preventDefault();
            if (typeof event.native.stopPropagation === "function") event.native.stopPropagation();
          }
          if (event.stopPropagation) event.stopPropagation();

          view.hitTest(event).then((response) => {
            const results = response.results;
            const treeGraphic = results.find(
              (r) => r.graphic && (r.graphic.layer === treeTrunkLayer || r.graphic.layer === treeCrownLayer)
            );

            if (treeGraphic) {
              const attr = treeGraphic.graphic.attributes;
              if (props && typeof props.onMapClickPublic === "function") props.onMapClickPublic(null);

              if (props && typeof props.onSelectTree === "function") {
                props.onSelectTree({
                  id: attr.id,
                  maTuyenDuong: attr.maTuyenDuong,
                  loaiCay: attr.loaiCay,
                  tinhTrang: attr.tinhTrang,
                  chieuCao: attr.chieuCao,
                  duongKinhTan: attr.duongKinhTan,
                  lon: treeGraphic.graphic.geometry.longitude,
                  lat: treeGraphic.graphic.geometry.latitude,
                });
              }
            } else {
              if (props && typeof props.onSelectTree === "function") props.onSelectTree(null);
              if (event.mapPoint) {
                const longitude = event.mapPoint.longitude;
                const latitude = event.mapPoint.latitude;
                if (props && typeof props.onMapClickPublic === "function") {
                  props.onMapClickPublic({ lon: longitude, lat: latitude });
                }
              }
            }
          });
        });
      })
      .catch((err) => console.error("❌ Lỗi khởi tạo: ", err));

    return () => {};
  }, []);

  // ===================================================================
  // 🌟 EFFECT 2 (SỬA LỖI 1): ĐỒNG BỘ CHUYỂN MẠCH PHÂN KHU CAMERA ĐỘNG ĐOÀN HỆ
  // ===================================================================
  useEffect(() => {
    // Chờ lõi đồ họa viewRef sẵn sàng hoàn toàn mới cho phép chuyển mạch phân khu
    if (!viewRef.current || !layerKhuVucRef.current || !layerTuyenDuongRef.current) return;

    const maKhuVuc = props.currentKhuVucId || "";
    const timestamp = new Date().getTime();

    if (maKhuVuc === "") {
      // Đưa về góc nhìn rộng mặc định ban đầu
      layerKhuVucRef.current.url = `http://localhost:5000/api/map/khu-vuc?t=${timestamp}`;
      layerTuyenDuongRef.current.url = `http://localhost:5000/api/map/tuyen-duong?t=${timestamp}`;
      layerKhuVucRef.current.refresh();
      layerTuyenDuongRef.current.refresh();

      viewRef.current
        .goTo(
          { center: [106.70371, 10.77402], zoom: 17, tilt: 45, heading: 0 },
          { duration: 1500, easing: "in-out-cubic" }
        )
        .catch(() => {});
      return;
    }

    // Nạp đường dẫn lọc động dữ liệu từ Postgres
    layerKhuVucRef.current.url = `http://localhost:5000/api/map/khu-vuc?maKhuVuc=${maKhuVuc}&t=${timestamp}`;
    layerTuyenDuongRef.current.url = `http://localhost:5000/api/map/tuyen-duong?maKhuVuc=${maKhuVuc}&t=${timestamp}`;

    // Ép làm tươi đồ họa
    layerKhuVucRef.current.refresh();
    layerTuyenDuongRef.current.refresh();

    // 🚀 CHÌA KHÓA KHƠI THÔNG CAMERA: Quét tọa độ tính toán lập tức bao quanh vùng đất mới
    layerKhuVucRef.current.when(() => {
      const query = layerKhuVucRef.current.createQuery();
      layerKhuVucRef.current
        .queryExtent(query)
        .then((response) => {
          if (response && response.extent) {
            // Lao vọt camera chuẩn chỉnh đến bao quát phân khu trên DB
            return viewRef.current.goTo(response.extent, {
              duration: 1400,
              easing: "in-out-cubic",
            });
          }
        })
        .then(() => {
          // Nghiêng góc phối cảnh lập thể ngắm cây xanh 3D
          return viewRef.current.goTo({ tilt: 52, heading: 325 }, { duration: 500 });
        })
        .catch((err) => {
          if (err.name !== "AbortError") console.error("🔴 Lỗi tính toán định vị phân khu:", err);
        });
    });
  }, [props.currentKhuVucId]); // Lắng nghe chuẩn xác sự kiện đổi Phân Khu lề ngoài

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
});

export default Map3D;
