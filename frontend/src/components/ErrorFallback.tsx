import type { FC } from 'react';

type ErrorFallbackProps = {
  error: Error;
  retry: () => void;
};

export const ErrorFallback: FC<ErrorFallbackProps> = ({ retry }) => {
  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path className="stroke-width-2" strokeLinecap="round" strokeLinejoin="round" d="M12 1v2M12 20v2M4.93 4.93l2.83 2.83m2.17-4.22l2.83 2.83m0 5.86l2.83 2.83m-3.88 1.12l2.83 2.83M12 12H4m16 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-2">Terjadi Kesalahan</h3>
      <p className="text-sm text-gray-500 mb-6">Kami mengalami kesulitan teknis. Silakan coba lagi.</p>

      <button
        onClick={retry}
        className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
      >
        Coba Lagi
      </button>

      <p className="text-xs text-gray-400 mt-4">
        Jika masalah berlanjut, hubungi administrator sistem.
      </p>
    </div>
  );
};
