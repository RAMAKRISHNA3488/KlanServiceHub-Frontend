import React, { useState } from 'react';
import { ResponsiveModal } from '@/components/responsive-modal';
import { AlertTriangle, AlertCircle, Info, Trash2 } from 'lucide-react';

export const useConfirm = (
  defaultTitle = 'Confirm Action',
  defaultMessage = 'Are you sure you want to proceed with this action?',
  defaultVariant = 'primary'
) => {
  const [promise, setPromise] = useState(null);
  const [dialogConfig, setDialogConfig] = useState(null);

  const confirm = (overrideOptions) => {
    let config = {};
    if (typeof overrideOptions === 'string') {
      config = { message: overrideOptions };
    } else if (overrideOptions && typeof overrideOptions === 'object') {
      config = overrideOptions;
    }
    setDialogConfig(config);

    return new Promise((resolve) => {
      setPromise({ resolve });
    });
  };

  const handleClose = () => {
    setPromise(null);
    setDialogConfig(null);
  };

  const handleConfirm = () => {
    promise?.resolve(true);
    handleClose();
  };

  const handleCancel = () => {
    promise?.resolve(false);
    handleClose();
  };

  const title = dialogConfig?.title || defaultTitle;
  const message = dialogConfig?.message || defaultMessage;
  const variant = dialogConfig?.variant || defaultVariant;
  const isDestructive = variant === 'destructive' || variant === 'danger';
  const isWarning = variant === 'warning';
  const confirmText =
    dialogConfig?.confirmText ||
    (isDestructive ? 'Delete' : isWarning ? 'Proceed' : 'Confirm');
  const cancelText = dialogConfig?.cancelText || 'Cancel';
  const warningNotice = dialogConfig?.warningNotice;

  const ConfirmationDialog = () => (
    <ResponsiveModal
      title={title}
      description={typeof message === 'string' ? message : ''}
      open={promise !== null}
      onOpenChange={handleClose}
    >
      <div className="w-full rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
        {/* Header */}
        <div className="flex items-start gap-3">
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
          <div className="pr-6">
            <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">Please confirm your action</p>
          </div>
        </div>

        {/* Body */}
        <div className="mt-4 space-y-3">
          <div className="text-xs text-neutral-700 leading-relaxed font-medium">
            {typeof message === 'string' ? (
              <p>{message}</p>
            ) : (
              message
            )}
          </div>

          {warningNotice && (
            <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-[11px] text-amber-800 flex items-start gap-2.5">
              <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block text-amber-900">Important Notice</span>
                <span>{warningNotice}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 mt-5 border-t border-neutral-100">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm transition ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isDestructive && <Trash2 className="size-3.5" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );

  return [ConfirmationDialog, confirm];
};
