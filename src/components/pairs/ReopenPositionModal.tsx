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
  side: BybitMarketPositionSide;
  onAmountChange: (amount: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function ReopenPositionModal({
  amount,
  currentPositionAmount,
  loading,
  pair,
  side,
  onAmountChange,
  onClose,
  onConfirm,
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
        <ModalTitle>Закрыть и открыть заново</ModalTitle>
        <ModalText>
          Будет продано 100% позиции {normalizedSide} для {pair.name}. После закрытия будет
          открыта новая позиция {normalizedSide} на {amount} USDT с плечом {leverage}x.
          Ориентировочный размер новой позиции: {orderValue.toFixed(2)} USDT.
        </ModalText>
        <ModalText>
          Текущая позиция: {formatDecimal(currentPositionAmount, 2)} USDT.
        </ModalText>

        <AmountField>
          Новая сумма, USDT
          <AmountOptions $dense>
            {reopenPositionAmounts.map((amountOption) => (
              <AmountOptionButton
                key={amountOption}
                $active={amount === amountOption}
                $dense
                disabled={loading}
                type="button"
                onClick={() => onAmountChange(amountOption)}
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
          <PrimaryButton disabled={loading || !reopenPositionAmounts.includes(amount)} type="submit">
            {loading ? 'Выполнение...' : 'Подтвердить'}
          </PrimaryButton>
        </ModalActions>
      </ModalDialog>
    </ModalBackdrop>
  );
}
