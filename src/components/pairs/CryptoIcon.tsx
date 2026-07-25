import { useEffect, useMemo, useState } from 'react';
import type { Pair } from '../../types/pair';
import { CryptoFallback, CryptoLogo } from './PairsDashboard.style';
import { getCryptoIconSources, getPairBaseAsset } from './PairsDashboard.utils';

interface CryptoIconProps {
  pair: Pair;
}

export function CryptoIcon({ pair }: CryptoIconProps) {
  const asset = useMemo(() => getPairBaseAsset(pair), [pair.contract, pair.name, pair.symbol]);
  const iconSources = useMemo(() => getCryptoIconSources(asset), [asset]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const source = iconSources[sourceIndex];
  const label = asset.slice(0, 3).toUpperCase();

  useEffect(() => {
    setSourceIndex(0);
  }, [asset]);

  if (!source) {
    return <CryptoFallback title={asset.toUpperCase()}>{label}</CryptoFallback>;
  }

  return (
    <CryptoLogo
      src={source}
      alt={`${asset.toUpperCase()} icon`}
      loading="lazy"
      decoding="async"
      onError={() => setSourceIndex((currentIndex) => currentIndex + 1)}
    />
  );
}
