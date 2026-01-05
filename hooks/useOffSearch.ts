// hooks/useOffSearch.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { OFFProduct } from "../types/off";
import {
  applyClientFilter,
  searchProducts,
  sortProducts,
  type ClientFilter,
  type ServerFilter,
  type SortKey,
} from "../lib/openfoodfacts";
import { useDebounce } from "../lib/useDebounce";

const STORAGE_FILTER_KEY = "SEARCH_FILTERS_V1";
const STORAGE_SORT_KEY = "SEARCH_SORT_V1";

export type SearchState = {
  query: string;
  setQuery: (q: string) => void;
  serverFilter: ServerFilter;
  setServerFilter: (f: ServerFilter) => void;
  clientFilter: ClientFilter;
  setClientFilter: (f: ClientFilter) => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  page: number;
  setPage: (p: number) => void;
  isLoading: boolean;
  error?: string;
  items: OFFProduct[];
  total: number;
  reload: () => void;
};

const defaultServerFilter: ServerFilter = { countryJP: true, langJA: true };
const defaultClientFilter: ClientFilter = {
  imageOnly: true,
  brand: undefined,
  category: undefined,
  kcalMin: undefined,
  kcalMax: undefined,
  proteinMin: undefined,
  proteinMax: undefined,
};
const defaultSort: SortKey = "relevance";

export function useOffSearch(pageSize = 24): SearchState {
  const [query, setQuery] = useState("");
  const [serverFilter, setServerFilter] = useState<ServerFilter>(defaultServerFilter);
  const [clientFilter, setClientFilter] = useState<ClientFilter>(defaultClientFilter);
  const [sort, setSort] = useState<SortKey>(defaultSort);
  const [page, setPage] = useState(1);

  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [raw, setRaw] = useState<OFFProduct[]>([]);
  const [total, setTotal] = useState(0);

  const debouncedQuery = useDebounce(query, 400);
  const abortRef = useRef<AbortController | null>(null);

  // 復元
  useEffect(() => {
    (async () => {
      try {
        const savedFilter = await AsyncStorage.getItem(STORAGE_FILTER_KEY);
        const savedSort = await AsyncStorage.getItem(STORAGE_SORT_KEY);
        if (savedFilter) {
          const parsed = JSON.parse(savedFilter);
          setServerFilter((prev) => ({ ...prev, ...parsed.serverFilter }));
          setClientFilter((prev) => ({ ...prev, ...parsed.clientFilter }));
        }
        if (savedSort) setSort(savedSort as SortKey);
      } catch {}
    })();
  }, []);

  // 保存
  useEffect(() => {
    const payload = JSON.stringify({ serverFilter, clientFilter });
    AsyncStorage.setItem(STORAGE_FILTER_KEY, payload).catch(() => {});
  }, [serverFilter, clientFilter]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_SORT_KEY, sort).catch(() => {});
  }, [sort]);

  const fetchData = useCallback(async () => {
    const q = (debouncedQuery || "").trim();

    //  クエリ空ならAPI叩かず リストを空に
    if (q.length === 0) {
      abortRef.current?.abort();
      setLoading(false);
      setError(undefined);
      setTotal(0);
      setRaw([]);
      return;
    }

    setLoading(true);
    setError(undefined);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await searchProducts({
        query: q,
        page,
        pageSize,
        serverFilter,
      });
      if (controller.signal.aborted) return;

      setTotal(res.count || 0);
      setRaw(res.products || []);
    } catch (e: any) {
      if (e?.name !== "AbortError") setError(String(e?.message || e));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [debouncedQuery, page, pageSize, serverFilter]);

  // 条件が変わればページを1へ
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, serverFilter, clientFilter, sort]);

  // 実検索
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const items = useMemo(() => {
    const filtered = applyClientFilter(raw, clientFilter);
    return sortProducts(filtered, sort);
  }, [raw, clientFilter, sort]);

  const reload = () => fetchData();

  return {
    query,
    setQuery,
    serverFilter,
    setServerFilter,
    clientFilter,
    setClientFilter,
    sort,
    setSort,
    page,
    setPage,
    isLoading,
    error,
    items,
    total,
    reload,
  };
}
