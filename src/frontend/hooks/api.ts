import { CancelablePromise } from "@/src/api/generated"
import { Api } from "@/src/openapi"
import { useOceanStore } from "@/src/zustand"
import { useQuery, UseQueryOptions } from "@tanstack/react-query"

type useQueryWithSessionProps<TData> = Omit<UseQueryOptions<TData>, "queryFn"> & { queryFn: (data: { oceanSessionId: string }) => CancelablePromise<TData> }

const useQueryWithSession = <TData>({ queryFn, ...options }: useQueryWithSessionProps<TData>) => {
  const session = useOceanStore.use.session()
  return useQuery<TData>({
    queryFn: () => {
      if (!session) throw new Error('Missing oceanSessionId in sessionStorage')
      return queryFn({ oceanSessionId: session })
    },
    enabled: !!session,
    ...options,
  })
}


const usePaginatedEvents = () => {
  return useQueryWithSession({
    queryKey: [],
    queryFn: Api.eventsEditorEventsGet
  })
}
