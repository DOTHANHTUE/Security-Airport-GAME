import type { User } from 'firebase/auth';
import { Award, CheckCircle2, LogIn, Play, RotateCcw, Trophy } from 'lucide-react';
import { ACHIEVEMENTS, computeOfficerRank } from '../data/itemsAndLevels';
import type { GameState, LevelStats } from '../types/game';

interface RoundModalProps {
  gameState: GameState;
  levelStats: LevelStats | null;
  totalScore: number;
  currentLevel: number;
  overallAccuracy: number;
  totalBagsProcessed: number;
  totalContrabandCaught: number;
  newlyUnlockedIds: string[];
  user: User | null;
  syncStatus: 'idle' | 'saving' | 'saved' | 'error';
  onResume: () => void;
  onNextLevel: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
  onOpenLeaderboard: () => void;
  onSignInAndSync: () => void;
}

export function RoundModal({
  gameState,
  levelStats,
  totalScore,
  currentLevel,
  overallAccuracy,
  totalBagsProcessed,
  totalContrabandCaught,
  newlyUnlockedIds,
  user,
  syncStatus,
  onResume,
  onNextLevel,
  onRestart,
  onReturnTitle,
  onOpenLeaderboard,
  onSignInAndSync,
}: RoundModalProps) {
  if (gameState !== 'PAUSED' && gameState !== 'ROUND_SUMMARY' && gameState !== 'GAME_OVER' && gameState !== 'VICTORY') {
    return null;
  }

  const newlyUnlockedDefs = ACHIEVEMENTS.filter((a) => newlyUnlockedIds.includes(a.id));
  const officerRank = computeOfficerRank(totalScore);

  return (
    <div
      className="fixed inset-0 z-40 bg-slate-950/80 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
        {gameState === 'PAUSED' && (
          <>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold font-display text-slate-100">
                Tạm Dừng Ca Trực
              </h2>
              <p className="text-sm text-slate-400">
                Băng chuyền X-Ray đã tạm khóa. Sẵn sàng tiếp tục soi chiếu bất cứ lúc nào.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onResume}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-sm rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Tiếp tục ca trực</span>
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi lại</span>
              </button>
              <button
                type="button"
                onClick={onReturnTitle}
                className="px-4 py-2.5 text-slate-400 hover:text-slate-100 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Màn hình chính
              </button>
            </div>
          </>
        )}

        {gameState === 'ROUND_SUMMARY' && levelStats && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-emerald-400 font-semibold">
                  Hoàn thành Màn {levelStats.level} · {levelStats.terminalName}
                </div>
                <h2 className="text-2xl font-bold font-display text-slate-100 mt-1">
                  Báo Cáo Kết Thúc Ca Soi Chiếu
                </h2>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-slate-400">Xếp loại</div>
                <div className="text-3xl font-extrabold font-display text-amber-400">
                  {levelStats.grade}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 border border-slate-800 rounded-lg p-4">
              <div>
                <div className="text-xs text-slate-400">Chính xác</div>
                <div className="text-lg font-bold font-mono-tabular text-emerald-400">
                  {levelStats.bagsProcessed > 0
                    ? Math.round((levelStats.correctDecisions / levelStats.bagsProcessed) * 100)
                    : 100}
                  %
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Vật cấm chặn</div>
                <div className="text-lg font-bold font-mono-tabular text-slate-100">
                  {levelStats.contrabandCaught}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Thưởng thời gian</div>
                <div className="text-lg font-bold font-mono-tabular text-sky-400">
                  +{levelStats.timeBonus.toLocaleString('vi-VN')}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Tổng điểm</div>
                <div className="text-lg font-bold font-mono-tabular text-amber-400">
                  {totalScore.toLocaleString('vi-VN')}
                </div>
              </div>
            </div>

            {levelStats.falseAlarms > 0 || levelStats.missedThreats > 0 ? (
              <p className="text-xs text-slate-400">
                Ghi nhận sai sót trong ca: {levelStats.falseAlarms} giữ nhầm hành lý hợp lệ · {levelStats.missedThreats} bỏ lọt vật nguy hiểm.
              </p>
            ) : (
              <p className="text-xs text-emerald-300">
                Ca trực hoàn hảo! Không để lọt nguy cơ an ninh và không gây phiền hà hành khách.
              </p>
            )}

            {newlyUnlockedDefs.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-1.5">
                <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>Huy hiệu mới mở khóa</span>
                </div>
                <div className="text-xs text-amber-100">
                  {newlyUnlockedDefs.map((a) => a.title).join(' · ')}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onNextLevel}
                className="flex-1 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-sm rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                {currentLevel >= 6
                  ? `Tiếp tục Ca Tăng Cường (Màn ${currentLevel + 1})`
                  : `Sang Màn ${currentLevel + 1}`}
              </button>
              <button
                type="button"
                onClick={onOpenLeaderboard}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Bảng xếp hạng
              </button>
            </div>
          </>
        )}

        {(gameState === 'GAME_OVER' || gameState === 'VICTORY') && (
          <>
            <div className="space-y-1">
              <div
                className={`text-xs font-semibold ${
                  gameState === 'VICTORY' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {gameState === 'VICTORY'
                  ? 'Hoàn thành xuất sắc 6 ca trực Quốc tế'
                  : 'Đình chỉ ca trực · Mất an toàn an ninh bay'}
              </div>
              <h2 className="text-2xl font-bold font-display text-slate-100">
                {gameState === 'VICTORY'
                  ? 'Tổng Kết Chiến Dịch An Ninh'
                  : 'Kết Thúc Ca Trực'}
              </h2>
              <p className="text-xs text-slate-400">
                Danh hiệu đạt được: <span className="text-amber-300 font-semibold">{officerRank}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 border border-slate-800 rounded-lg p-4">
              <div>
                <div className="text-xs text-slate-400">Điểm tổng</div>
                <div className="text-lg font-bold font-mono-tabular text-amber-400">
                  {totalScore.toLocaleString('vi-VN')}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Màn đạt tới</div>
                <div className="text-lg font-bold font-mono-tabular text-slate-100">
                  Màn {currentLevel}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Độ chính xác</div>
                <div className="text-lg font-bold font-mono-tabular text-emerald-400">
                  {overallAccuracy}%
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Vật cấm chặn</div>
                <div className="text-lg font-bold font-mono-tabular text-sky-400">
                  {totalContrabandCaught}/{totalBagsProcessed} kiện
                </div>
              </div>
            </div>

            {newlyUnlockedDefs.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-1">
                <div className="text-xs font-semibold text-amber-300">
                  Huy hiệu mới mở khóa
                </div>
                <div className="text-xs text-amber-100">
                  {newlyUnlockedDefs.map((a) => a.title).join(' · ')}
                </div>
              </div>
            )}

            {/* Global Leaderboard Sync Bar */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
              {user ? (
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {syncStatus === 'saving'
                      ? 'Đang đồng bộ thành tích lên Bảng xếp hạng toàn cầu...'
                      : syncStatus === 'error'
                        ? 'Lưu kết quả thất bại. Bạn vẫn có thể xem thành tích cục bộ.'
                        : 'Đã lưu kết quả lên Bảng xếp hạng toàn cầu!'}
                  </span>
                </div>
              ) : (
                <>
                  <span className="text-xs text-slate-300">
                    Đăng nhập Google để lưu thành tích lên Bảng xếp hạng toàn cầu
                  </span>
                  <button
                    type="button"
                    onClick={onSignInAndSync}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Đăng nhập & Lưu điểm</span>
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onRestart}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-sm rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi lại từ Màn 1</span>
              </button>
              <button
                type="button"
                onClick={onOpenLeaderboard}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>Xếp hạng toàn cầu</span>
              </button>
              <button
                type="button"
                onClick={onReturnTitle}
                className="px-3 py-2.5 text-slate-400 hover:text-slate-100 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Trang chủ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
