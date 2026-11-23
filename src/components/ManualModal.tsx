import { ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { ITEM_CATALOG } from '../data/itemsAndLevels';

interface ManualModalProps {
  onClose: () => void;
}

export function ManualModal({ onClose }: ManualModalProps) {
  const allItems = Object.values(ITEM_CATALOG);
  const prohibited = allItems.filter((i) => i.isProhibited);
  const decoys = allItems.filter(
    (i) =>
      !i.isProhibited &&
      ['hairdryer', 'electric_toothbrush', 'umbrella', 'thermos_empty', 'camera_dslr', 'powerbank_safe'].includes(i.id)
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sổ tay quy định an ninh soi chiếu"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-100">
              Sổ Tay Quy Định Soi Chiếu Hàng Không
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hướng dẫn nhận diện phổ màu X-ray hai mức năng lượng và phân biệt vật phẩm nguy hiểm
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Đóng sổ tay"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Dual-Energy X-Ray Color Guide */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">
              1. Quy ước màu sắc trên màn hình X-Ray đa năng lượng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-orange-500 shrink-0" />
                  <span className="text-sm font-semibold text-orange-400">
                    Màu Cam · Hữu cơ
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Vải vóc, sách báo, cao su, chất lỏng, và các khối thuốc nổ dẻo (C4, thuốc pháo). Khối hữu cơ dày kèm dây nối là dấu hiệu cảnh báo đỏ.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-emerald-500 shrink-0" />
                  <span className="text-sm font-semibold text-emerald-400">
                    Màu Xanh Lá · Vô cơ / Hỗn hợp
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Bo mạch điện tử, pin Lithium, thủy tinh, nhựa mật độ cao và dao lưỡi gốm tàng hình. Chú ý kiểm tra dung lượng pin và lưỡi gốm.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-blue-600 shrink-0" />
                  <span className="text-sm font-semibold text-blue-400">
                    Màu Xanh Dương · Kim loại nặng
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Thép, đồng, chì: súng ngắn, dao găm, băng đạn, kéo lớn, bình nén khí và lớp giấy bạc cản tia (cần bật chế độ HI-PEN hoặc kiểm tra kỹ).
                </p>
              </div>
            </div>
          </section>

          {/* Prohibited Items */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <h3 className="text-sm font-semibold text-slate-200">
                2. Danh mục vật phẩm nguy hiểm bắt buộc Giữ lại
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {prohibited.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-rose-300 truncate">
                      {item.name}
                    </span>
                    <span className="text-xs font-mono-tabular text-slate-500 shrink-0">
                      Màn {item.minLevel}+
                    </span>
                  </div>
                  <div className="text-xs text-amber-300/90">{item.densityLabel}</div>
                  <p className="text-xs text-slate-400 leading-snug">{item.reason}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Safe Decoys */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <h3 className="text-sm font-semibold text-slate-200">
                3. Vật dụng hợp lệ dễ gây nhầm lẫn (Cần soi kỹ trước khi giữ)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {decoys.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-1"
                >
                  <div className="text-sm font-semibold text-emerald-300">
                    {item.name}
                  </div>
                  <div className="text-xs text-sky-300/90">{item.densityLabel}</div>
                  <p className="text-xs text-slate-400 leading-snug">{item.reason}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Mẹo: Dùng phím 4–7 để chuyển bộ lọc X-Ray tức thì · Phím S hoặc 2 để Kiểm tra chuyên sâu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-white text-slate-950 font-semibold text-sm rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
