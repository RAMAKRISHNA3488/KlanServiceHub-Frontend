import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertTriangle, AlertCircle, Info, Trash2, X, Check } from 'lucide-react';

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((options) => {
    let config = {};
    if (typeof options === 'string') {
      config = { message: options };
    } else if (options && typeof options === 'object') {
      config = options;
    }

    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState(config);
    });
  }, []);

  const handleClose = useCallback((result = false) => {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
    setDialogState(null);
  }, []);

  const title = dialogState?.title || 'Confirm Action';
  const subtitle = dialogState?.subtitle || 'Confirmation required';
  const message = dialogState?.message || 'Are you sure you want to proceed with this action?';
  const targetName = dialogState?.targetName;
  const variant = dialogState?.variant || 'destructive';
  const isDestructive = variant === 'destructive' || variant === 'danger';
  const isWarning = variant === 'warning';
  const confirmText = dialogState?.confirmText || (isDestructive ? 'Delete' : isWarning ? 'Proceed' : 'Confirm');
  const cancelText = dialogState?.cancelText || 'Cancel';
  const impactTitle = dialogState?.impactTitle || dialogState?.warningTitle || 'Important Impact';
  const impactNotice = dialogState?.impactNotice || dialogState?.warningNotice;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {/* Global Confirmation Modal */}
      {dialogState && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => handleClose(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-10 items-center justify-center rounded-xl border shrink-0 ${
                    isDestructive
                      ? 'bg-red-50 text-red-600 border-red-100'
                      : isWarning
                      ? 'bg-amber-50 text-amber-600 border-amber-100'
                      : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}
                >
                  {isDestructive ? (
                    <AlertTriangle className="size-5 text-red-600" />
                  ) : isWarning ? (
                    <AlertCircle className="size-5 text-amber-600" />
                  ) : (
                    <Info className="size-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
                  <p className="text-[11px] text-neutral-500">{subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100 transition"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="mt-4 space-y-3">
              <div className="text-xs text-neutral-700 leading-relaxed font-medium">
                {targetName ? (
                  <p>
                    Are you sure you want to {isDestructive ? 'remove' : 'proceed with'}{' '}
                    <span className="font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                      &ldquo;{targetName}&rdquo;
                    </span>
                    ? {typeof message === 'string' && message !== targetName ? message : ''}
                  </p>
                ) : typeof message === 'string' ? (
                  <p>{message}</p>
                ) : (
                  message
                )}
              </div>

              {impactNotice && (
                <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-[11px] text-amber-800 flex items-start gap-2.5">
                  <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold block text-amber-900">{impactTitle}</span>
                    <span className="leading-relaxed">{impactNotice}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-4 mt-5 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => handleClose(true)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm transition ${
                  isDestructive
                    ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                    : isWarning
                    ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }`}
              >
                {isDestructive ? <Trash2 className="size-3.5" /> : <Check className="size-3.5" />}
                <span>{confirmText}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useGlobalConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useGlobalConfirm must be used within a ConfirmProvider');
  }
  return context;
};

/**
 * Backward-compatible useConfirm hook.
 * If ConfirmProvider is available in the tree, delegates directly to the global dialog.
 * If not, provides a self-contained local dialog state.
 */
export const useConfirm = (
  defaultTitle = 'Confirm Action',
  defaultMessage = 'Are you sure you want to proceed with this action?',
  defaultVariant = 'destructive'
) => {
  const globalConfirm = useContext(ConfirmContext);
  const [localPromise, setLocalPromise] = useState(null);
  const [localConfig, setLocalConfig] = useState(null);

  const confirm = useCallback(
    (overrideOptions) => {
      let config = {};
      if (typeof overrideOptions === 'string') {
        config = { message: overrideOptions };
      } else if (overrideOptions && typeof overrideOptions === 'object') {
        config = overrideOptions;
      }

      const mergedOptions = {
        title: config.title || defaultTitle,
        message: config.message || defaultMessage,
        variant: config.variant || defaultVariant,
        ...config,
      };

      if (globalConfirm) {
        return globalConfirm(mergedOptions);
      }

      setLocalConfig(mergedOptions);
      return new Promise((resolve) => {
        setLocalPromise({ resolve });
      });
    },
    [globalConfirm, defaultTitle, defaultMessage, defaultVariant]
  );

  const handleClose = (result = false) => {
    localPromise?.resolve(result);
    setLocalPromise(null);
    setLocalConfig(null);
  };

  const title = localConfig?.title || defaultTitle;
  const subtitle = localConfig?.subtitle || 'Confirmation required';
  const message = localConfig?.message || defaultMessage;
  const targetName = localConfig?.targetName;
  const variant = localConfig?.variant || defaultVariant;
  const isDestructive = variant === 'destructive' || variant === 'danger';
  const isWarning = variant === 'warning';
  const confirmText = localConfig?.confirmText || (isDestructive ? 'Delete' : isWarning ? 'Proceed' : 'Confirm');
  const cancelText = localConfig?.cancelText || 'Cancel';
  const impactTitle = localConfig?.impactTitle || localConfig?.warningTitle || 'Important Impact';
  const impactNotice = localConfig?.impactNotice || localConfig?.warningNotice;

  const ConfirmationDialog = () => {
    // If global provider handles it, no local rendering needed
    if (globalConfirm || !localPromise) return null;

    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        onClick={() => handleClose(false)}
      >
        <div
          className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex size-10 items-center justify-center rounded-xl border shrink-0 ${
                  isDestructive
                    ? 'bg-red-50 text-red-600 border-red-100'
                    : isWarning
                    ? 'bg-amber-50 text-amber-600 border-amber-100'
                    : 'bg-blue-50 text-blue-600 border-blue-100'
                }`}
              >
                {isDestructive ? (
                  <AlertTriangle className="size-5 text-red-600" />
                ) : isWarning ? (
                  <AlertCircle className="size-5 text-amber-600" />
                ) : (
                  <Info className="size-5 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
                <p className="text-[11px] text-neutral-500">{subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100 transition"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Body */}
          <div className="mt-4 space-y-3">
            <div className="text-xs text-neutral-700 leading-relaxed font-medium">
              {targetName ? (
                <p>
                  Are you sure you want to {isDestructive ? 'remove' : 'proceed with'}{' '}
                  <span className="font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                    &ldquo;{targetName}&rdquo;
                  </span>
                  ? {typeof message === 'string' && message !== targetName ? message : ''}
                </p>
              ) : typeof message === 'string' ? (
                <p>{message}</p>
              ) : (
                message
              )}
            </div>

            {impactNotice && (
              <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-[11px] text-amber-800 flex items-start gap-2.5">
                <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block text-amber-900">{impactTitle}</span>
                  <span className="leading-relaxed">{impactNotice}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 mt-5 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => handleClose(true)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm transition ${
                isDestructive
                  ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                  : isWarning
                  ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {isDestructive ? <Trash2 className="size-3.5" /> : <Check className="size-3.5" />}
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return [ConfirmationDialog, confirm];
};
