import GenericTable from "@/components/editor/GenericTable";
import Pagination from "@/components/editor/Pagination";
import {
	useOcelInfo,
	usePaginatedEvents,
	usePaginatedObjects,
} from "@/hooks/api";
import usePagination from "@/hooks/usePagination";
import { useMemo, useState } from "react";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { useRouter } from "next/router";
import { Stack } from "react-bootstrap";

const ObjectOverview: React.FC = () => {
	const [viewTab, setViewTab] = useState<string>();
	const router = useRouter();
	const { data: info } = useOcelInfo({ filter: {} });
	const { data: events } = usePaginatedEvents({
		filter: {
			...(viewTab && { activity_names: [viewTab] }),
		},
	});

	const eventTypes = useMemo(
		() => info?.activities.map(({ activity }) => activity) ?? [],
		[info?.event_summaries],
	);

	const { handlePageChange } = usePagination();
	return (
		<>
			<Tabs
				id="controlled-tab-example"
				activeKey={"events"}
				onSelect={(newTab) => {
					if (newTab === "objects") {
						router.push("objects");
					}
				}}
				className="mb-3"
			>
				<Tab eventKey="events" title="Events" />
				<Tab eventKey="objects" title="Objects" />
			</Tabs>
			{info && events && (
				<Stack gap={3}>
					<Tabs
						activeKey={viewTab ?? Object.keys(info.event_summaries)[0]}
						onSelect={(newEventType) => {
							if (newEventType != null && eventTypes.includes(newEventType)) {
								setViewTab(newEventType);
								handlePageChange(1);
							}
						}}
						className="mb-3"
					>
						{eventTypes.map((eventType) => (
							<Tab eventKey={eventType} title={eventType} />
						))}
					</Tabs>
					<GenericTable type={"event"} table={events!.data} />
					<Pagination totalPages={events!.totalPages} />
				</Stack>
			)}
		</>
	);
};

export default ObjectOverview;
