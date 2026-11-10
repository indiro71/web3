import type { FormEvent } from 'react';
import type { BybitMarketPositionSide, InsuranceQuote } from '../../api/pairs';
import type { Pair } from '../../types/pair';
import {
  AmountField,
  AmountOptionButton,
  AmountOptions,
  ModalActions,
  ModalBackdrop,
  ModalDialog,
  ModalText,
  ModalTitle,
  PrimaryButton,
  SecondaryButton,
} from './PairsDashboard.style';
import { formatDecimal, reopenPositionAmounts } from './PairsDashboard.utils';

interface ReopenPositionModalProps {
  amount: number;
  currentPositionAmount: number;
  canInsure: boolean;
  insuranceSelected: boolean;
  insuranceQuote?: InsuranceQuote;
  insuranceQuoteError?: string;
  refreshInsurance: boolean;
  loading: boolean;
  pair: Pair;
  shouldReopen: boolean;
  side: BybitMarketPositionSide;
  onAmountChange: (amount: number) => void;
  onClose: () => void;
  onConfirm: () => void;
  onInsuranceChange: (enabled: boolean) => void;
  onShouldReopenChange: (shouldReopen: boolean) => void;
}

export function ReopenPositionModal({
  amount,
  currentPositionAmount,
  canInsure,
  insuranceSelected,
  insuranceQuote,
  insuranceQuoteError,
  refreshInsurance,
  loading,
  pair,
  shouldReopen,
  side,
  onAmountChange,
  onClose,
  onConfirm,
  onInsuranceChange,
  onShouldReopenChange,
}: ReopenPositionModalProps) {
  const normalizedSide = side.toUpperCase();
  const leverage = pair.leverage ?? 1;
  const orderValue = amount * leverage;
  const title = refreshInsurance ? 'Обновить страховку'
    : insuranceSelected ? 'Застраховать позицию'
    : shouldReopen ? 'Закрыть и открыть заново' : 'Закрыть позицию';
  const canConfirm = refreshInsurance || (insuranceSelected
    ? Boolean(insuranceQuote)
    : !shouldReopen || reopenPositionAmounts.includes(amount));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onConfirm();
  };

  return (
    <ModalBackdrop role="presentation" onMouseDown={onClose}>
      <ModalDialog onMouseDown={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <ModalTitle>{title}</ModalTitle>
        {refreshInsurance ? (
          <ModalText>
            Страховой ордер для {pair.name} {normalizedSide} будет отменён. После отмены половина
            позиции закроется по рынку, затем исполненный объём будет восстановлен по рынку.
          </ModalText>
        ) : insuranceSelected ? (
          <ModalText aria-live="polite">
            {insuranceQuote
              ? `При откате к ${insuranceQuote.triggerPrice} Bybit закроет ${insuranceQuote.qty} ${pair.symbol} по рынку. Ожидаемый остаток маржи — ${formatDecimal(insuranceQuote.remainingMargin, 4)} USDT.`
              : insuranceQuoteError || 'Получаем параметры ордера с Bybit…'}
          </ModalText>
        ) : (
          <ModalText>
            Будет закрыто 100% позиции {normalizedSide} для {pair.name}.
            {shouldReopen
              ? ` После закрытия будет открыта новая позиция ${normalizedSide} на ${amount} USDT с плечом ${leverage}x. Ориентировочный размер новой позиции: ${orderValue.toFixed(2)} USDT.`
              : ' Новая позиция после закрытия открываться не будет.'}
          </ModalText>
        )}
        <ModalText>
          Текущая позиция: {formatDecimal(currentPositionAmount, 2)} USDT.
        </ModalText>

        {canInsure && !refreshInsurance && (
          <ModalText>
            <label>
              <input
                checked={insuranceSelected}
                disabled={loading}
                onChange={(event) => onInsuranceChange(event.target.checked)}
                role="switch"
                type="checkbox"
              />{' '}
              Застраховать
            </label>
          </ModalText>
        )}

        {!insuranceSelected && !refreshInsurance && (
          <AmountField>
            Действие после продажи
            <AmountOptions $dense>
              <AmountOptionButton
                $active={!shouldReopen}
                aria-pressed={!shouldReopen}
                $dense
                disabled={loading}
                type="button"
                onClick={() => onShouldReopenChange(false)}
              >
                Не покупать
              </AmountOptionButton>
              {reopenPositionAmounts.map((amountOption) => (
                <AmountOptionButton
                  key={amountOption}
                  $active={shouldReopen && amount === amountOption}
                  aria-pressed={shouldReopen && amount === amountOption}
                  $dense
                  disabled={loading}
                  type="button"
                  onClick={() => {
                    onShouldReopenChange(true);
                    onAmountChange(amountOption);
                  }}
                >
                  {amountOption}
                </AmountOptionButton>
              ))}
            </AmountOptions>
          </AmountField>
        )}

        <ModalActions>
          <SecondaryButton disabled={loading} type="button" onClick={onClose}>
            Отмена
          </SecondaryButton>
          <PrimaryButton disabled={loading || !canConfirm} type="submit">
            {loading ? 'Выполнение...' : 'Подтвердить'}
          </PrimaryButton>
        </ModalActions>
      </ModalDialog>
    </ModalBackdrop>
  );
}
