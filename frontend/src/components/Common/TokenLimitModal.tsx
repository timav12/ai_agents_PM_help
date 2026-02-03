import { AlertTriangle, Mail, X } from 'lucide-react';

interface TokenLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokensUsed: number;
  tokenLimit: number;
}

export default function TokenLimitModal({ isOpen, onClose, tokensUsed, tokenLimit }: TokenLimitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          Token Limit Reached
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-center mb-4">
          You have used all your available tokens.
        </p>

        {/* Usage stats */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Tokens Used</span>
            <span className="font-semibold text-gray-900">
              {tokensUsed.toLocaleString()} / {tokenLimit.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 rounded-full"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Contact info */}
        <div className="text-center">
          <p className="text-gray-600 mb-3">
            To increase your limit, please contact us:
          </p>
          <a
            href="mailto:info@ntoolz.com"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <Mail className="w-5 h-5" />
            info@ntoolz.com
          </a>
        </div>
      </div>
    </div>
  );
}
