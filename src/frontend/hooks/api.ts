import {
	ApplyO2oRuleEndpointEditorOcelApplyO2oPostResponse,
	ApplyO2ORuleRequest,
	CancelablePromise,
	DistributeRequest,
	DistributeValueEndpointEditorOcelDistributeValuePostResponse,
	EventFilter,
	ObjectFilter,
	UpsertAttributesEndpointEditorOcelUpsertAttributesPostResponse,
	UpsertAttributesRequest,
	UpsertObjectsEndpointEditorOcelUpsertObjectsPostResponse,
	UpsertObjectsRequest,
} from "@/src/api/generated";
import { Api } from "@/src/openapi";
import { useOceanStore } from "@/src/zustand";
import {
	useMutation,
	UseMutationOptions,
	useQuery,
	UseQueryOptions,
} from "@tanstack/react-query";
import usePagination from "./usePagination";

type useQueryWithSessionProps<TData> = Omit<
	UseQueryOptions<TData>,
	"queryFn"
> & { queryFn: (data: { oceanSessionId: string }) => CancelablePromise<TData> };

const useQueryWithSession = <TData>({
	queryFn,
	...options
}: useQueryWithSessionProps<TData>) => {
	const session = useOceanStore.use.session();
	return useQuery<TData>({
		queryFn: () => {
			return queryFn({ oceanSessionId: session! });
		},
		enabled: !!session,
		...options,
	});
};

type MutationFn<TVariables, TData> = (data: {
	oceanSessionId: string;
	variables: TVariables;
}) => CancelablePromise<TData>;

type UseMutationWithSessionProps<TData, TVariables> = Omit<
	UseMutationOptions<TData, unknown, TVariables>,
	"mutationFn"
> & {
	mutationFn: MutationFn<TVariables, TData>;
};

const useMutationWithSession = <TData, TVariables = void>({
	mutationFn,
	...options
}: UseMutationWithSessionProps<TData, TVariables>) => {
	const session = useOceanStore.use.session();

	return useMutation<TData, unknown, TVariables>({
		mutationFn: (variables: TVariables) => {
			return mutationFn({
				oceanSessionId: session!,
				variables,
			});
		},
		...options,
	});
};

export const usePaginatedEvents = ({ filter }: { filter: EventFilter }) => {
	const { currentPage } = usePagination();
	return useQueryWithSession({
		queryKey: [currentPage, filter],
		queryFn: (data) =>
			Api.eventsEditorEventsPost({
				...data,
				requestBody: filter,
				page: currentPage,
			}),
	});
};
export const usePaginatedObjects = ({ filter }: { filter: ObjectFilter }) => {
	const { currentPage } = usePagination();
	return useQueryWithSession({
		queryKey: [currentPage, filter],
		queryFn: (data) =>
			Api.objectsEditorObjectsPost({
				...data,
				requestBody: filter,
				page: currentPage,
			}),
	});
};

export const useOcelInfo = ({ filter }: { filter: EventFilter }) => {
	return useQueryWithSession({
		queryKey: [filter],
		queryFn: (data) => Api.infoEditorInfoPost({ ...data, requestBody: filter }),
	});
};

export const upsertAttributes = () => {
	return useMutationWithSession<
		UpsertAttributesEndpointEditorOcelUpsertAttributesPostResponse,
		UpsertAttributesRequest
	>({
		mutationFn: ({ oceanSessionId, variables }) =>
			Api.upsertAttributesEndpointEditorOcelUpsertAttributesPost({
				oceanSessionId,
				requestBody: variables,
			}),
		onSuccess: () => {},
	});
};
export const upsertObjects = () => {
	return useMutationWithSession<
		UpsertObjectsEndpointEditorOcelUpsertObjectsPostResponse,
		UpsertObjectsRequest
	>({
		mutationFn: ({ oceanSessionId, variables }) =>
			Api.upsertObjectsEndpointEditorOcelUpsertObjectsPost({
				oceanSessionId,
				requestBody: variables,
			}),
		onSuccess: () => {},
	});
};

export const useApplyO2ORule = () => {
	return useMutationWithSession<
		ApplyO2oRuleEndpointEditorOcelApplyO2oPostResponse,
		ApplyO2ORuleRequest
	>({
		mutationFn: ({ oceanSessionId, variables }) => {
			return Api.applyO2oRuleEndpointEditorOcelApplyO2oPost({
				oceanSessionId,
				requestBody: variables,
			});
		},
	});
};
export const useDistributeValue = () => {
	return useMutationWithSession<
		DistributeValueEndpointEditorOcelDistributeValuePostResponse,
		DistributeRequest
	>({
		mutationFn: ({ oceanSessionId, variables }) => {
			return Api.distributeValueEndpointEditorOcelDistributeValuePost({
				oceanSessionId,
				requestBody: variables,
			});
		},
	});
};
