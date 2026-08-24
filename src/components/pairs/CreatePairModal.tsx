import { useRef, useState, type FormEvent } from 'react';
import type { CreatePairInput } from '../../api/pairs';
import {
  ModalActions,
  ModalBackdrop,
  ModalDialog,
  ModalField,
  ModalFieldGrid,
  ModalInput,
  ModalTitle,
  PrimaryButton,
  SecondaryButton,
} from './PairsDashboard.style';

interface CreatePairModalProps {
  loading: boolean;
  onClose: () => void;
  onConfirm: (pair: CreatePairInput) => void;
}

const getPairBaseName = (name: string) => name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

export function CreatePairModal({ loading, onClose, onConfirm }: CreatePairModalProps) {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [contract, setContract] = useState('');
  const [exchange, setExchange] = useState('BYBIT');
  const [round, setRound] = useState(2);
  const [order, setOrder] = useState(1);
  const symbolWasEdited = useRef(false);
  const contractWasEdited = useRef(false);

  const handleNameChange = (nextName: string) => {
    const baseName = getPairBaseName(nextName);

    setName(nextName);

    if (!symbolWasEdited.current) {
      setSymbol(baseName ? `${baseName}USDT` : '');
    }

    if (!contractWasEdited.current) {
      setContract(baseName ? `${baseName}_USDT` : '');
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onConfirm({
      contract: contract.trim().toUpperCase(),
      exchange: exchange.trim().toUpperCase(),
      name: name.trim(),
      order,
      round,
      symbol: symbol.trim().toUpperCase(),
    });
  };

  const formIsValid =
    Boolean(name.trim() && symbol.trim() && contract.trim() && exchange.trim()) &&
    Number.isInteger(round) &&
    round >= 0 &&
    Number.isInteger(order) &&
    order >= 0;

  return (
    <ModalBackdrop role="presentation" onMouseDown={onClose}>
      <ModalDialog onMouseDown={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <ModalTitle>Создать новую пару</ModalTitle>

        <ModalField>
          Name
          <ModalInput
            autoFocus
            disabled={loading}
            onChange={(event) => handleNameChange(event.target.value)}
            placeholder="KAS"
            required
            value={name}
          />
        </ModalField>

        <ModalField>
          Symbol
          <ModalInput
            disabled={loading}
            onChange={(event) => {
              symbolWasEdited.current = true;
              setSymbol(event.target.value);
            }}
            placeholder="KASUSDT"
            required
            value={symbol}
          />
        </ModalField>

        <ModalField>
          Contract
          <ModalInput
            disabled={loading}
            onChange={(event) => {
              contractWasEdited.current = true;
              setContract(event.target.value);
            }}
            placeholder="KAS_USDT"
            required
            value={contract}
          />
        </ModalField>

        <ModalField>
          Exchange
          <ModalInput
            disabled={loading}
            onChange={(event) => setExchange(event.target.value)}
            required
            value={exchange}
          />
        </ModalField>

        <ModalFieldGrid>
          <ModalField>
            Round
            <ModalInput
              disabled={loading}
              min="0"
              onChange={(event) => setRound(event.target.valueAsNumber)}
              required
              step="1"
              type="number"
              value={round}
            />
          </ModalField>
          <ModalField>
            Order
            <ModalInput
              disabled={loading}
              min="0"
              onChange={(event) => setOrder(event.target.valueAsNumber)}
              required
              step="1"
              type="number"
              value={order}
            />
          </ModalField>
        </ModalFieldGrid>

        <ModalActions>
          <SecondaryButton disabled={loading} type="button" onClick={onClose}>
            Отмена
          </SecondaryButton>
          <PrimaryButton disabled={loading || !formIsValid} type="submit">
            {loading ? 'Создание...' : 'Создать'}
          </PrimaryButton>
        </ModalActions>
      </ModalDialog>
    </ModalBackdrop>
  );
}
