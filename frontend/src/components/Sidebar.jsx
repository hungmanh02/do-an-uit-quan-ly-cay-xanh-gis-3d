import React from "react";

function Sidebar({selectedTree, setFilterType, filterType}) {
  return (
    <div className="w-80 h-full bg-slate-800 border-r border-slate-700 p-6 flex flex-col gap-6 shadow-2xl z-20">
      <div>
        <h2 className="text-lg font-semibold text-slate-200">Bộ lọc trạng thái</h2>
        <div className="flex flex-col gap-2 mt-3">
          {["ALL", "Tốt", "Cần cắt tỉa", "Nguy hiểm"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterType(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all text-left ${
                filterType === status
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {status === "ALL" ? "🌳 Hiển thị tất cả" : status}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-slate-700" />

      {/* Hiển thị thuộc tính chi tiết thực thể khi click (Popup đồng bộ Sidebar) */}
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-slate-200">Chi tiết thực thể</h2>
        {selectedTree ? (
          <div className="mt-4 p-4 rounded-lg bg-slate-900/50 border border-slate-700 flex flex-col gap-3 animate-fade-in">
            <div>
              <span className="text-xs text-slate-400 block">Mã số cây</span>
              <span className="text-sm font-mono font-bold text-emerald-400">#{selectedTree.id}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Chủng loại sinh học</span>
              <span className="text-sm font-medium text-slate-200">{selectedTree.loaiCay}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Chiều cao hiện tại</span>
              <span className="text-sm font-medium text-slate-200">{selectedTree.chieuCao} mét</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Đường kính vùng tán</span>
              <span className="text-sm font-medium text-slate-200">{selectedTree.duongKinhTan} mét</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Tình trạng sức khỏe</span>
              <span className="inline-block mt-1 px-2 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400">
                {selectedTree.tinhTrang}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 mt-4 italic">
            Vui lòng click vào mô hình cây xanh 3D trên bản đồ để tra cứu thông tin nhanh...
          </p>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
