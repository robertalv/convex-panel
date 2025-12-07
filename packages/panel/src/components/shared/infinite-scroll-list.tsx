import { InfiniteLoader } from "react-window-infinite-loader";
import AutoSizer from "react-virtualized-auto-sizer";
import {
  ListOnScrollProps,
  FixedSizeList,
  FixedSizeListProps,
} from "react-window";
import React, {
  useEffect,
  RefObject,
  MutableRefObject,
  useCallback,
  forwardRef,
  useRef,
} from "react";

export function InfiniteScrollList<T, U>({
  items,
  totalNumItems,
  pageSize = 10,
  loadMoreThreshold = 25,
  loadMore,
  itemSize,
  itemData,
  RowOrLoading,
  listRef,
  outerRef,
  onScroll,
  className,
  itemKey,
  overscanCount,
  initialScrollOffset,
  style,
}: {
  items: T[];
  totalNumItems?: number;
  pageSize?: number;
  loadMoreThreshold?: number;
  loadMore?: (pageSize: number) => void;
  itemSize: number;
  itemData: U;
  RowOrLoading: React.ComponentType<{
    index: number;
    style: React.CSSProperties;
    data: U;
  }>;
  listRef?: MutableRefObject<FixedSizeList | null>;
  outerRef: RefObject<HTMLElement | null> | RefObject<HTMLDivElement | null>;
  onScroll?: (props: ListOnScrollProps) => void;
  className?: string;
  style?: React.CSSProperties;
  itemKey?: (index: number, data: U) => string;
  overscanCount?: number;
  initialScrollOffset?: number;
}) {
  const initialLoadTriggeredRef = useRef(false);
  
  useEffect(() => {
    if (!loadMore) return;
    
    if (items.length === 0 && !initialLoadTriggeredRef.current) {
      initialLoadTriggeredRef.current = true;
      const timeoutId = setTimeout(() => {
        if (loadMore) {
          loadMore(pageSize);
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
    
    if (items.length > 0) {
      initialLoadTriggeredRef.current = false;
    }
  }, [items.length, loadMore, pageSize]);
  
  useEffect(() => {
    if (!loadMore || items.length === 0) return;
    
    if (
      outerRef.current?.clientHeight &&
      items.length * itemSize <=
        (outerRef.current as any).scrollTop + outerRef.current.clientHeight
    ) {
      loadMore(pageSize);
    }
  }, [items.length, loadMore, itemSize, outerRef, pageSize]);

  return (
    <AutoSizer>
      {({ height, width }: { height: number | undefined; width: number | undefined }) => {
        if (!loadMore) {
          return (
            <List
              outerRef={outerRef}
              overscanCount={overscanCount}
              initialScrollOffset={initialScrollOffset}
              ref={(node: any) => {
                if (listRef) {
                  listRef.current = node;
                }
              }}
              onScroll={onScroll}
              className={className || "scrollbar"}
              style={style}
              itemData={itemData}
              itemCount={items.length}
              height={height!}
              width={width!}
              itemSize={itemSize}
              itemKey={itemKey}
              listRef={listRef}
            >
              {RowOrLoading}
            </List>
          );
        }

        const Loader = InfiniteLoader as any;
        return (
          <Loader
            isItemLoaded={(idx: number) => items.length > idx}
            itemCount={Math.max(items.length, totalNumItems || 0)}
            loadMoreItems={() => loadMore && loadMore(pageSize)}
            minimumBatchSize={pageSize}
            threshold={loadMoreThreshold}
          >
            {({ onItemsRendered, ref }: any) => (
              <List
                outerRef={outerRef}
                listRef={listRef}
                overscanCount={overscanCount}
                initialScrollOffset={initialScrollOffset}
                ref={ref}
                onScroll={onScroll}
                className={className || "scrollbar"}
                style={style}
                onItemsRendered={onItemsRendered}
                itemData={itemData}
                itemCount={Math.max(items.length, totalNumItems || 0)}
                height={
                  height!
                }
                width={
                  width!
                }
                itemSize={itemSize}
                itemKey={itemKey}
              >
                {RowOrLoading}
              </List>
            )}
          </Loader>
        );
      }}
    </AutoSizer>
  );
}

const List = forwardRef<
  any,
  FixedSizeListProps & {
    listRef?: MutableRefObject<FixedSizeList | null>;
  }
>(function List({ children, listRef, ...props }, ref) {
  const setRefs = useCallback(
    (node: any) => {
      if (typeof ref === "function") {
        ref(node);
      }
      if (listRef) {
        // eslint-disable-next-line no-param-reassign
        listRef.current = node;
      }
    },
    [ref, listRef],
  );
  return (
    <FixedSizeList ref={setRefs} {...props}>
      {children}
    </FixedSizeList>
  );
});
