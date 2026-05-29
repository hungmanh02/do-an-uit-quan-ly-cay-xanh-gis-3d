import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { loadModules } from "esri-loader";

const Map3D = forwardRef((props, ref) => {
  const mapRef = useRef(null);

  const viewRef = useRef(null);
  const layerKhuVucRef = useRef(null);
  const layerTuyenDuongRef = useRef(null);
  const treeLayerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    refreshLayers() {
      if (layerKhuVucRef.current && typeof layerKhuVucRef.current.refresh === "function")
        layerKhuVucRef.current.refresh();
      if (layerTuyenDuongRef.current && typeof layerTuyenDuongRef.current.refresh === "function")
        layerTuyenDuongRef.current.refresh();
      if (treeLayerRef.current && typeof treeLayerRef.current.refresh === "function") treeLayerRef.current.refresh();
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

        // ===================================================================
        // 🌲 LỚP CÂY XANH 3D ĐỒNG KHỐI TRÒN TRỊA
        // ===================================================================
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
          console.log("🌲 [HỆ THỐNG GIS] Đã nạp bản đồ cây xanh 3D!");
        });

        layerKhuVucRef.current = layerKhuVuc;
        layerTuyenDuongRef.current = layerTuyenDuong;
        treeLayerRef.current = treeTrunkLayer;

        // ===================================================================
        // 🖱️ XỬ LÝ SỰ KIỆN CLICK: XEM THÔNG TIN HOẶC LẤY TỌA ĐỘ THÊM CÂY MỚI
        // ===================================================================
        view.on("click", (event) => {
          if (event.native) {
            if (typeof event.native.preventDefault === "function") event.native.preventDefault();
            if (typeof event.native.stopPropagation === "function") event.native.stopPropagation();
          }
          if (event.stopPropagation) {
            event.stopPropagation();
          }

          view.hitTest(event).then((response) => {
            const results = response.results;
            const treeGraphic = results.find(
              (r) => r.graphic && (r.graphic.layer === treeTrunkLayer || r.graphic.layer === treeCrownLayer)
            );

            // Trường hợp 1: Click trúng cây có sẵn -> Hiện thông tin cây đó
            if (treeGraphic) {
              const attr = treeGraphic.graphic.attributes;

              // Đóng form thêm cây mới lại nếu đang mở
              if (props && typeof props.onMapClickPublic === "function") {
                props.onMapClickPublic(null);
              }

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
            }
            // Trường hợp 2: Click ra khoảng trống lề đường -> Lấy tọa độ phục vụ Thêm cây mới
            else {
              // Reset bảng chi tiết cây cũ
              if (props && typeof props.onSelectTree === "function") {
                props.onSelectTree(null);
              }

              // Lấy chuẩn xác tọa độ kinh/vĩ độ nơi Admin vừa click
              if (event.mapPoint) {
                const longitude = event.mapPoint.longitude;
                const latitude = event.mapPoint.latitude;

                console.log(`🎯 Đã chấm tọa độ thực địa mới: Lon: ${longitude}, Lat: ${latitude}`);

                // Bắn tọa độ ra cấu trúc App.jsx lề ngoài để mở Form Thêm Cây
                if (props && typeof props.onMapClickPublic === "function") {
                  props.onMapClickPublic({
                    lon: longitude,
                    lat: latitude,
                  });
                }
              }
            }
          });
        });
      })
      .catch((err) => console.error("❌ Lỗi khởi tạo: ", err));

    return () => {};
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
});

export default Map3D;
