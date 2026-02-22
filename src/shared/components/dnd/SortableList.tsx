import { type Active, DndContext, type DndContextProps, type Over, PointerSensor, TouchSensor, type UniqueIdentifier, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, type SortableContextProps } from '@dnd-kit/sortable';
import { useEffect, useState, type ReactNode } from 'react';
import { SortableItem } from './SortableItem';

export type SortEvent<T> = { from: number; to: number; items: T[] };

type Props<T extends { id: UniqueIdentifier }> = {
  items: T[];
  onSort?: (event: SortEvent<T>) => void;
  renderItem?: (item: T, index: number) => ReactNode;
  children?: ReactNode;
} & Omit<DndContextProps, 'children'> &
  Omit<SortableContextProps, 'items' | 'children'>;

export function SortableList<T extends { id: UniqueIdentifier }>({ items: _items, strategy, onSort, disabled, renderItem, children, ...props }: Props<T>) {
  const [items, setItems] = useState(_items);

  useEffect(() => setItems(_items), [_items])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
  );

  return (
    <DndContext
      {...props}
      sensors={sensors}
      onDragEnd={async (event) => {
        const { active, over } = event;
        if (hasSortableIndex(active) && hasSortableIndex(over)) {
          const swaped = swap(items, active.data.current.sortable.index, over.data.current.sortable.index);
          onSort?.({
            from: active.data.current.sortable.index,
            to: over.data.current.sortable.index,
            items: swaped
          });
          setItems(swaped);
        }
        props.onDragEnd?.(event);
      }}
    >
      <SortableContext items={items} strategy={strategy} disabled={disabled}>
        {!!renderItem
          ? items.map((item, idx) => (
            <SortableItem key={item.id} id={item.id}>
              {renderItem(item, idx)}
            </SortableItem>
          ))
          : children}

      </SortableContext>
    </DndContext>
  );
}

type SortableData = {
  data: { current: { sortable: { index: number } } };
};

export function hasSortableIndex<T extends Active | Over>(value: T | null): value is T & SortableData {
  return value?.data?.current?.sortable.index != null;
}

function swap<T>(array: T[], fromIndex: number, toIndex: number) {
  const item = array[fromIndex];
  if (item == null) return array;
  return array.toSpliced(fromIndex, 1).toSpliced(toIndex, 0, item);
}