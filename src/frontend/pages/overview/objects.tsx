import GenericTable from "@/components/editor/GenericTable";
import Pagination from "@/components/editor/Pagination";
import { useOcelInfo, usePaginatedObjects } from "@/hooks/api";
import usePagination from "@/hooks/usePagination";
import { useMemo, useState } from "react";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { useRouter } from "next/router";
import ObjectGraph from "@/components/editor/Graphs/ObjectGraph";
import { Accordion, Stack } from "react-bootstrap";

const ObjectOverview: React.FC = () => {
	const [viewTab, setViewTab] = useState<string>();
	const router = useRouter();
	const { data: info } = useOcelInfo({ filter: { event_attributes: null } });
	const { data: objects } = usePaginatedObjects({
		filter: {
			...(viewTab && { object_types: [viewTab] }),
		},
	});

	const objectTypes = useMemo(
		() =>
			info?.object_summaries.flatMap(({ object_type }) => object_type) ?? [],
		[info?.object_summaries],
	);

	const { handlePageChange } = usePagination();
	return (
		<>
			<Tabs
				id="controlled-tab-example"
				activeKey={"objects"}
				onSelect={(newTab) => {
					if (newTab === "events") {
						router.push("events");
					}
				}}
				className="mb-3"
			>
				<Tab eventKey="events" title="Events" />
				<Tab eventKey="objects" title="Objects" />
			</Tabs>
			{info && objects && (
				<Stack gap={3}>
					<Accordion defaultActiveKey="0">
						<Accordion.Item eventKey="0">
							<Accordion.Header>Overview</Accordion.Header>
							<Accordion.Body>
								<ObjectGraph />
							</Accordion.Body>
						</Accordion.Item>
						<Accordion.Item eventKey="1">
							<Accordion.Header>Filter</Accordion.Header>
							<Accordion.Body></Accordion.Body>
						</Accordion.Item>
					</Accordion>
					<Tabs
						activeKey={viewTab ?? info.object_summaries[0].object_type!}
						onSelect={(newObjectType) => {
							if (
								newObjectType != null &&
								objectTypes.includes(newObjectType)
							) {
								setViewTab(newObjectType);
								handlePageChange(1);
							}
						}}
						className="mb-3"
					>
						{objectTypes.map((objectType) => (
							<Tab eventKey={objectType} title={objectType} />
						))}
					</Tabs>
					<GenericTable type={"object"} table={objects!.data} />
					<Pagination totalPages={objects!.totalPages} />
				</Stack>
			)}
		</>
	);
};

export default ObjectOverview;
