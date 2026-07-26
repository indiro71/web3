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

interface BuyPositionModalProps {
  amount: number;
  loading: boolean;
  pair: Pair;
  side: BybitMarketPositionSide;
  onAmountChange: (amount: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}

const allowedAmounts = [5, 10];

export function BuyPositionModal({
  amount,
  loading,
  pair,
  side,
  onAmountChange,
  onClose,
  onConfirm,
}: BuyPositionModalProps) {
  const normalizedSide = side.toUpperCase();
  const orderValue = amount * (pair.leverage ?? 1);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onConfirm();
  };

  return (
    <ModalBackdrop role="presentation" onMouseDown={onClose}>
      <ModalDialog onMouseDown={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <ModalTitle>Подтвердить докупку</ModalTitle>
        <ModalText>
          Будет докуплено {amount} долларов позиции {normalizedSide} с плечом {pair.leverage ?? 1}x для
          монеты {pair.name}. Ориентировочный размер позиции: {orderValue.toFixed(2)} USDT.
        </ModalText>

        <AmountField>
          Сумма, USDT
          <AmountOptions>
            {allowedAmounts.map((amountOption) => (
              <AmountOptionButton
                key={amountOption}
                $active={amount === amountOption}
                disabled={loading}
                type="button"
                onClick={() => onAmountChange(amountOption)}
              >
                {amountOption} USDT
              </AmountOptionButton>
            ))}
          </AmountOptions>
        </AmountField>

        <ModalActions>
          <SecondaryButton disabled={loading} type="button" onClick={onClose}>
            Отмена
          </SecondaryButton>
          <PrimaryButton disabled={loading || !allowedAmounts.includes(amount)} type="submit">
            {loading ? 'Покупка...' : 'Подтвердить'}
          </PrimaryButton>
        </ModalActions>
      </ModalDialog>
    </ModalBackdrop>
  );
}
