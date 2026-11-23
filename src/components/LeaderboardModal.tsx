import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { Award, History, LogIn, LogOut, Trophy, X } from 'lucide-react';
import { ACHIEVEMENTS } from '../data/itemsAndLevels';
import {
  fetchGlobalLeaderboard,
  fetchPersonalRuns,
  signInWithGoogle,
  signOutUser,
  updateLeaderboardCallsign,
} from '../firebase';
import type {
  LeaderboardEntry,
  PlayerCareerLocal,
  ScreeningRunRecord,
} from '../types/game';

interface LeaderboardModalProps {
  user: User | null;
  career: PlayerCareerLocal;
  onUpdateOfficerName: (name: string) => void;
  onClose: () => void;
}

type ModalTab = 'GLOBAL' | 'ACHIEVEMENTS' | 'HISTORY';

export function LeaderboardModal({
  user,
  career,
  onUpdateOfficerName,
  onClose,
}: LeaderboardModalProps) {
  const [tab, setTab] = useState<ModalTab>('GLOBAL');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [runs, setRuns] = useState<ScreeningRunRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState<string>(career.officerName);
  const [savingName, setSavingName] = useState<boolean>(false);
  const [authBusy, setAuthBusy] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const globalList = await fetchGlobalLeaderboard();
      setEntries(globalList);
      if (user) {
        const myRuns = await fetchPersonalRuns(user.uid);
        setRuns(myRuns);
      } else {
        setRuns([]);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? 'Không thể tải dữ liệu bảng xếp hạng. Vui lòng thử lại.'
          : 'Lỗi kết nối.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const handleGoogleSignIn = async () => {
    setAuthBusy(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch {
      setErrorMsg('Đăng nhập Google không thành công hoặc đã bị hủy.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    setAuthBusy(true);
    try {
      await signOutUser();
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSaveName = async () => {
    const clean = nameInput.trim().slice(0, 40);
    if (!clean) return;
    onUpdateOfficerName(clean);
    if (!user) return;
    setSavingName(true);
    try {
      await updateLeaderboardCallsign(user, clean, {
        bestScore: career.bestScore,
        highestLevel: career.highestLevel,
        bestAccuracy: career.bestAccuracy,
        totalContrabandCaught: career.totalContrabandCaught,
        achievementsCount: career.unlockedAchievements.length,
      });
      await loadData();
    } catch {
      setErrorMsg('Không thể cập nhật biệt danh trên máy chủ.');
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Bảng xếp hạng và thành tích"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold font-display text-slate-100">
              Bảng Xếp Hạng & Thành Tích Toàn Cầu
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              Thành tích cá nhân cao nhất: {career.bestScore.toLocaleString('vi-VN')} điểm · Màn {career.highestLevel} · {career.unlockedAchievements.length}/{ACHIEVEMENTS.length} huy hiệu
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={authBusy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={authBusy}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{authBusy ? 'Đang kết nối...' : 'Đăng nhập Google'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Đóng bảng xếp hạng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs & Callsign bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setTab('GLOBAL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                tab === 'GLOBAL'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Xếp hạng toàn cầu</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('ACHIEVEMENTS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                tab === 'ACHIEVEMENTS'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Huy hiệu ({career.unlockedAchievements.length}/{ACHIEVEMENTS.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('HISTORY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                tab === 'HISTORY'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Lịch sử ca trực</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              maxLength={40}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Tên cán bộ hiển thị..."
              aria-label="Tên cán bộ hiển thị"
              className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400 w-44"
            />
            <button
              type="button"
              onClick={handleSaveName}
              disabled={savingName}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {savingName ? 'Đang lưu...' : 'Lưu tên'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="mb-4 px-4 py-2.5 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-200">
              {errorMsg}
            </div>
          )}

          {tab === 'GLOBAL' && (
            <div>
              {loading ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  Đang tải bảng xếp hạng toàn cầu...
                </div>
              ) : entries.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="text-sm text-slate-300">
                    Chưa có cán bộ nào ghi danh trên bảng xếp hạng toàn cầu.
                  </p>
                  <p className="text-xs text-slate-500">
                    Hãy hoàn thành một ca trực và đăng nhập Google để trở thành người dẫn đầu đầu tiên!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs text-slate-400">
                        <th className="py-2.5 pr-3 font-medium">Hạng</th>
                        <th className="py-2.5 px-3 font-medium">Cán bộ An ninh</th>
                        <th className="py-2.5 px-3 font-medium">Cấp bậc</th>
                        <th className="py-2.5 px-3 font-medium text-right">Màn cao nhất</th>
                        <th className="py-2.5 px-3 font-medium text-right">Chính xác</th>
                        <th className="py-2.5 px-3 font-medium text-right">Vật cấm chặn</th>
                        <th className="py-2.5 pl-3 font-medium text-right">Điểm kỷ lục</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70 text-sm">
                      {entries.map((entry, idx) => {
                        const isMe = user?.uid === entry.uid;
                        return (
                          <tr
                            key={entry.uid}
                            className={
                              isMe
                                ? 'bg-amber-500/10 text-amber-100'
                                : 'hover:bg-slate-800/40 text-slate-200'
                            }
                          >
                            <td className="py-3 pr-3 font-mono-tabular font-bold text-slate-300">
                              #{idx + 1}
                            </td>
                            <td className="py-3 px-3 font-semibold">
                              {entry.officerName}
                              {isMe && (
                                <span className="ml-2 text-xs font-normal text-amber-400">
                                  · Bạn
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-xs text-slate-400">
                              {entry.officerRank}
                            </td>
                            <td className="py-3 px-3 text-right font-mono-tabular">
                              Màn {entry.highestLevel}
                            </td>
                            <td className="py-3 px-3 text-right font-mono-tabular text-emerald-400">
                              {entry.bestAccuracy}%
                            </td>
                            <td className="py-3 px-3 text-right font-mono-tabular">
                              {entry.totalContrabandCaught}
                            </td>
                            <td className="py-3 pl-3 text-right font-mono-tabular font-bold text-amber-400">
                              {entry.bestScore.toLocaleString('vi-VN')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'ACHIEVEMENTS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACHIEVEMENTS.map((ach) => {
                const unlocked = career.unlockedAchievements.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`rounded-lg border p-4 flex items-start gap-3 transition-colors ${
                      unlocked
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-slate-950/60 border-slate-800 opacity-65'
                    }`}
                  >
                    <Award
                      className={`w-5 h-5 mt-0.5 shrink-0 ${
                        unlocked ? 'text-amber-400' : 'text-slate-600'
                      }`}
                    />
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            unlocked ? 'text-amber-200' : 'text-slate-300'
                          }`}
                        >
                          {ach.title}
                        </span>
                        <span className="text-xs text-slate-400">
                          · {unlocked ? 'Đã mở khóa' : 'Chưa đạt'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {ach.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'HISTORY' && (
            <div>
              {!user ? (
                <div className="py-12 text-center space-y-3">
                  <p className="text-sm text-slate-300">
                    Đăng nhập bằng Google để lưu trữ và theo dõi lịch sử các ca trực trên mọi thiết bị.
                  </p>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Đăng nhập Google ngay
                  </button>
                </div>
              ) : runs.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  Chưa có ca trực nào được ghi nhận cho tài khoản này.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs text-slate-400">
                        <th className="py-2.5 pr-3 font-medium">Màn đạt được</th>
                        <th className="py-2.5 px-3 font-medium">Danh hiệu</th>
                        <th className="py-2.5 px-3 font-medium text-right">Hành lý</th>
                        <th className="py-2.5 px-3 font-medium text-right">Chặn vật cấm</th>
                        <th className="py-2.5 px-3 font-medium text-right">Chính xác</th>
                        <th className="py-2.5 pl-3 font-medium text-right">Điểm số</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70 text-sm">
                      {runs.map((run) => (
                        <tr key={run.id} className="text-slate-200">
                          <td className="py-3 pr-3 font-mono-tabular">Màn {run.levelReached}</td>
                          <td className="py-3 px-3 text-xs text-slate-300">{run.rankTitle}</td>
                          <td className="py-3 px-3 text-right font-mono-tabular">
                            {run.bagsProcessed}
                          </td>
                          <td className="py-3 px-3 text-right font-mono-tabular text-emerald-400">
                            {run.contrabandCaught}
                          </td>
                          <td className="py-3 px-3 text-right font-mono-tabular">
                            {run.accuracy}%
                          </td>
                          <td className="py-3 pl-3 text-right font-mono-tabular font-bold text-amber-400">
                            {run.score.toLocaleString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
