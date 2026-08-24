import { useEffect, useRef } from 'react';
import type { Pair } from '../../types/pair';
import { PairContextMenuButton, PairContextMenuSurface } from './PairsDashboard.style';

interface PairContextMenuProps {
  loading: boolean;
  onClose: () => void;
  onDelete: () => void;
  pair: Pair;
  x: number;
  y: number;
}

export function PairContextMenu({
  loading,
  onClose,
  onDelete,
  pair,
  x,
  y,
}: PairContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', onClose);
    window.addEventListener('scroll', onClose, true);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', onClose);
      window.removeEventListener('scroll', onClose, true);
    };
  }, [onClose]);

  return (
    <PairContextMenuSurface ref={menuRef} $x={x} $y={y} role="menu">
      <PairContextMenuButton disabled={loading} role="menuitem" type="button" onClick={onDelete}>
        {loading ? `Удаление ${pair.name}...` : 'Удалить'}
      </PairContextMenuButton>
    </PairContextMenuSurface>
  );
}
