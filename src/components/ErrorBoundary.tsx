import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'Đã xảy ra lỗi không xác định.',
    };
  }

  override componentDidCatch(error: Error) {
    console.error('AeroGuard ErrorBoundary caught error:', error);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold font-display text-amber-400">
              Hệ thống Soi Chiếu Gián Đoạn
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Đã phát sinh sự cố trong quá trình vận hành hoặc kết nối dữ liệu bảng xếp hạng.
            </p>
            <div className="text-xs font-mono-tabular bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-400 break-words max-h-36 overflow-auto">
              {this.state.errorMessage}
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
            >
              Khởi động lại Trạm Soi Chiếu
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
