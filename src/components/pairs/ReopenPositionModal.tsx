import type { FormEvent } from 'react';
import type { BybitMarketPositionSide } from '../../api/pairs';
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
  loading: boolean;
  pair: Pair;
  shouldReopen: boolean;
  side: BybitMarketPositionSide;
  onAmountChange: (amount: number) => void;
  onClose: () => void;
  onConfirm: () => void;
  onShouldReopenChange: (shouldReopen: boolean) => void;
}

export function ReopenPositionModal({
  amount,
  currentPositionAmount,
  loading,
  pair,
  shouldReopen,
  side,
  onAmountChange,
  onClose,
  onConfirm,
  onShouldReopenChange,
}: ReopenPositionModalProps) {
  const normalizedSide = side.toUpperCase();
  const leverage = pair.leverage ?? 1;
  const orderValue = amount * leverage;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onConfirm();
  };

  return (
    <ModalBackdrop role="presentation" onMouseDown={onClose}>
      <ModalDialog onMouseDown={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <ModalTitle>{shouldReopen ? 'Закрыть и открыть заново' : 'Закрыть позицию'}</ModalTitle>
        <ModalText>
          Будет продано 100% позиции {normalizedSide} для {pair.name}.
          {shouldReopen
            ? ` После закрытия будет открыта новая позиция ${normalizedSide} на ${amount} USDT с плечом ${leverage}x. Ориентировочный размер новой позиции: ${orderValue.toFixed(2)} USDT.`
            : ' Новая позиция после продажи открываться не будет.'}
        </ModalText>
        <ModalText>
          Текущая позиция: {formatDecimal(currentPositionAmount, 2)} USDT.
        </ModalText>

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

        <ModalActions>
          <SecondaryButton disabled={loading} type="button" onClick={onClose}>
            Отмена
          </SecondaryButton>
          <PrimaryButton disabled={loading || (shouldReopen && !reopenPositionAmounts.includes(amount))} type="submit">
            {loading ? 'Выполнение...' : 'Подтвердить'}
          </PrimaryButton>
        </ModalActions>
      </ModalDialog>
    </ModalBackdrop>
  );
}
