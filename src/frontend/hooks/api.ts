import { CancelablePromise } from "@/src/api/generated"
import { Api } from "@/src/openapi"
import { useOceanStore } from "@/src/zustand"
import { useQuery, UseQueryOptions } from "@tanstack/react-query"
import usePagination from "./usePagination"

type useQueryWithSessionProps<TData> = Omit<UseQueryOptions<TData>, "queryFn"> & { queryFn: (data: { oceanSessionId: string }) => CancelablePromise<TData> }

const useQueryWithSession = <TData>({ queryFn, ...options }: useQueryWithSessionProps<TData>) => {
  const session = useOceanStore.use.session()
  return useQuery<TData>({
    queryFn: () => {
      return queryFn({ oceanSessionId: session! })
    },
    enabled: !!session,
    ...options,
  })
}



export const usePaginatedEvents = () => {
  const { currentPage } = usePagination()
  return useQueryWithSession({
    queryKey: [currentPage],
    queryFn: (data) => Api.eventsEditorEventsPost({ ...data, requestBody: {}, page: currentPage })
  })
}
