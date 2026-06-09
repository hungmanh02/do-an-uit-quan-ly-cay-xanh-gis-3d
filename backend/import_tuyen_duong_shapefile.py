# ===================================================================
# 🛰️ FILE: backend/import_tuyen_duong_shapefile.py
# 🎯 NHIỆM VỤ: Đọc Shapefile Geofabrik, sửa lỗi tương thích Polyline '__geometry__'
# ===================================================================

import os
import shapefile
import psycopg2
from shapely.geometry import shape

# 🎯 1. TỰ ĐỘNG ĐỊNH VỊ FILE SHAPEFILE NẰM TRONG THƯ MỤC BACKEND
THU_MUC_HIEN_TAI = os.path.dirname(os.path.abspath(__file__)) if '__file__' in locals() else '.'
BASE_SHP_NAME = os.path.join(THU_MUC_HIEN_TAI, "gis_osm_roads_free_1")

DB_SETTINGS = {
    "host": "localhost",
    "port": 5432,
    "database": "gis_3d_cay_xanh",
    "user": "postgres",
    "password": "admin"
}

def chuan_hoa_ten_duong(name):
    if not name or str(name).lower() in ['nan', 'none', '']:
        return "Đường Chưa Đặt Tên"
    try:
        name_str = name.decode('utf-8') if isinstance(name, bytes) else str(name)
        words = name_str.split()
        return " ".join([w.capitalize() for w in words])
    except:
        return "Đường Chưa Đặt Tên"

try:
    print(f"⏳ [HỆ THỐNG GIS] Đang đọc cấu trúc Shapefile: {BASE_SHP_NAME}.shp...")
    if not os.path.exists(BASE_SHP_NAME + ".shp"):
        raise FileNotFoundError(f"🚨 Không tìm thấy file 'gis_osm_roads_free_1.shp' trong thư mục backend!")

    # Mở file Shapefile Offline
    sf = shapefile.Reader(BASE_SHP_NAME, encoding="utf-8")
    records = sf.shapeRecords()
    print(f"📊 Đã nạp thành công {len(records)} phân đoạn đường toàn quốc vào bộ nhớ.")

    conn = psycopg2.connect(**DB_SETTINGS)
    cursor = conn.cursor()
    
    print("🚀 Kết nối PostGIS thành công. Đang tính toán không gian cắt đường về Phường/Xã...")
    count = 0

    for item in records:
        geom_type = item.shape.shapeType
        
        # Chỉ bốc thực thể hình học dạng đường (PolyLine/PolyLineZ/PolyLineM)
        if geom_type not in [3, 13, 23]: 
            continue
            
        # Đọc thuộc tính tên đường từ cột 'name' trong file DBF
        attrs = item.record.as_dict()
        ten_duong_raw = attrs.get('name', 'Đường Chưa Đặt Tên')
        ten_duong = chuan_hoa_ten_duong(ten_duong_raw)
        
        # 🎯 VÁ LỖI TẠI ĐÂY: Sử dụng __geo_interface__ chuẩn của thư viện pyshp
        # giúp Shapely giải mã hình học Polyline mà không lo lệch phiên bản
        try:
            shapely_geom = shape(item.shape.__geo_interface__)
        except:
            # Phương án dự phòng nếu cả 2 thuộc tính giao tiếp đều lỗi
            shapely_geom = shape(item.shape)
            
        wkt_geom = shapely_geom.wkt
        
        # 🎯 THUẬT TOÁN GIAO CẮT KHÔNG GIAN (Spatial Filter):
        # Kiểm tra xem sợi dây đường này có chạm vào đa giác "SHAPE" hành chính nào của Mạnh không
        sql_find_khuvuc = """
            SELECT "MaKhuVuc" FROM "KHU_VUC_QUAN_LY"
            WHERE ST_Intersects("SHAPE", ST_GeomFromText(%s, 4326))
            LIMIT 1;
        """
        cursor.execute(sql_find_khuvuc, (wkt_geom,))
        result = cursor.fetchone()
        
        ma_khu_vuc = result[0] if result else None
        
        # Nếu con đường thuộc địa phận TP.HCM đã nạp, đẩy thẳng vào bảng TUYEN_DUONG
        if ma_khu_vuc:
            sql_insert = """
                INSERT INTO "TUYEN_DUONG" ("MaKhuVuc", "TenDuong", "SHAPE")
                VALUES (%s, %s, ST_GeomFromText(%s, 4326));
            """
            cursor.execute(sql_insert, (ma_khu_vuc, ten_duong, wkt_geom))
            count += 1
            
            if count % 1000 == 0:
                print(f"🛰️  Đã xử lý và lưu thành công {count} tuyến đường thực địa...")

    # Xác nhận lưu dữ liệu vĩnh viễn
    conn.commit()
    print("\n" + "="*60)
    print(f"🎉 ĐẠI THÀNH CÔNG! TIẾN TRÌNH IMPORT TỪ SHAPEFILE HOÀN THÀNH!")
    print(f"📦 Tổng số tuyến đường thực tế đã phân loại theo Phường/Xã của Mạnh: {count} tuyến.")
    print("="*60)

except Exception as e:
    print(f"🚨 Lỗi thực thi không gian: {e}")
    if 'conn' in locals(): conn.rollback()
finally:
    if 'cursor' in locals(): cursor.close()
    if 'conn' in locals(): conn.close()