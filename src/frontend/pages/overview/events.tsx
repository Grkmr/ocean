import GenericTable from "@/components/editor/GenericTable";
import Pagination from "@/components/editor/Pagination";
import {
	useOcelInfo,
	usePaginatedEvents,
	usePaginatedObjects,
} from "@/hooks/api";
import usePagination from "@/hooks/usePagination";
import { EventFilter } from "@/src/api/generated";
import { Api } from "@/src/openapi";
import { useOceanStore } from "@/src/zustand";
import { useEffect, useState } from "react";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { PageProps } from "../_app";
import { Button } from "react-bootstrap";

const EventOverview: React.FC<PageProps> = ({ apiWrapper }) => {
	const [view, setView] = useState<"events" | "objects">("events");
	const [viewTab, setViewTab] = useState<string>();
	const { data: info } = useOcelInfo({ filter: { event_attributes: null } });
	const { data: events } = usePaginatedEvents({
		filter: {
			event_attributes: null,
			...(view === "events" && viewTab && { activity_names: [viewTab] }),
		},
	});
	const { data: objects } = usePaginatedObjects({
		filter: {
			...(view === "objects" && viewTab && { object_types: [viewTab] }),
		},
	});
	const { handlePageChange } = usePagination();
	return (
		<>
			<Tabs
				id="controlled-tab-example"
				activeKey={view}
				onSelect={(k) => setView(k)}
				className="mb-3"
			>
				<Tab eventKey="events" title="Events" />
				<Tab eventKey="objects" title="Objects" />
			</Tabs>
			{((view === "events" && events) || (view === "objects" && objects)) &&
				info && (
					<>
						{view === "events" ? (
							<>
								<Tabs
									activeKey={viewTab ?? info.activities[0].activity!}
									onSelect={(k) => {
										setViewTab(k);
										handlePageChange(1);
									}}
									className="mb-3"
								>
									{info.activities.map(({ activity }) => (
										<Tab eventKey={activity} title={activity} />
									))}
								</Tabs>
								<GenericTable type={"event"} table={events!.data} />
								<Pagination totalPages={events!.totalPages} />
							</>
						) : (
							<>
								<Tabs
									activeKey={viewTab ?? info.object_summaries[0].object_type!}
									onSelect={(k) => {
										setViewTab(k);
										handlePageChange(1);
									}}
									className="mb-3"
								>
									{info.object_summaries.map(({ object_type }) => (
										<Tab eventKey={object_type} title={object_type} />
									))}
								</Tabs>
								<GenericTable type={"object"} table={objects!.data} />
								<Pagination totalPages={objects!.totalPages} />
							</>
						)}
					</>
				)}
		</>
	);
};

export default EventOverview;
