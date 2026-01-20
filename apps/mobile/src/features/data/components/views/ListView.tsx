/**
 * List view component - FlatList with document cards
 */

import React from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from "react-native";  
import { useTheme } from "../../../../contexts/ThemeContext";
import type { TableDocument } from "../../types";
import { DocumentCard } from "../../components/DocumentCard";

export interface ListViewProps {
  documents: TableDocument[];
  onDocumentPress: (document: TableDocument, index: number) => void;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  isRefreshing?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
}

export function ListView({
  documents,
  onDocumentPress,
  onRefresh,
  onLoadMore,
  isRefreshing = false,
  isLoadingMore = false,
  hasMore = false,
}: ListViewProps) {
  const { theme } = useTheme();

  const renderItem = ({
    item,
    index,
  }: {
    item: TableDocument;
    index: number;
  }) => (
    <DocumentCard
      document={item}
      onPress={() => onDocumentPress(item, index)}
    />
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text
          style={[styles.footerText, { color: theme.colors.textSecondary }]}
        >
          Loading more...
        </Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isRefreshing) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No documents found
        </Text>
        <Text
          style={[styles.emptySubtext, { color: theme.colors.textTertiary }]}
        >
          {onRefresh ? "Pull to refresh" : "Try adjusting your filters"}
        </Text>
      </View>
    );
  };

  const handleEndReached = () => {
    if (hasMore && !isLoadingMore && onLoadMore) {
      onLoadMore();
    }
  };

  return (
    <FlatList
      data={documents}
      renderItem={renderItem}
      keyExtractor={(item, index) => `${item._id}-${index}`}
      contentContainerStyle={[
        styles.container,
        documents.length === 0 && styles.containerEmpty,
      ]}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={true}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={15}
      windowSize={10}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  containerEmpty: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    marginLeft: 8,
  },
});
