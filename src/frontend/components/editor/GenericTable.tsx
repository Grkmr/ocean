import { EventFilter, OcelEvent, OcelObject } from "@/src/api/generated";
import { useMemo } from "react";
import { Table } from "react-bootstrap";

type GenericTableProps =
	| { type: "object"; table: OcelObject[] }
	| { type: "event"; table: OcelEvent[] };

const GenericTable: React.FC<GenericTableProps> = ({ type, table }) => {
	const header = useMemo(() => {
		return Array.from(
			table.reduce((acc, { attr }) => {
				Object.entries(attr).forEach(([key, value]) => {
					if (value !== undefined && value !== null) {
						acc.add(key);
					}
				});
				return acc;
			}, new Set<string>()),
		);
	}, [table]);
	const objectHeader = useMemo(() => {
		if (type != "object") {
			return [];
		}

		return Array.from(
			(table as OcelObject[]).reduce((acc, { relations }) => {
				if (relations == null) {
					return acc;
				}

				Object.entries(relations).forEach(([key, value]) => {
					if (value !== undefined && value !== null && value.length !== 0) {
						acc.add(key);
					}
				});
				return acc;
			}, new Set<string>()),
		);
	}, [table]);

	return (
		<Table responsive={"sm"}>
			<thead>
				<th>#</th>
				{type === "event" && <th>Timestamp</th>}
				{header.map((headerTitle) => (
					<th>{headerTitle}</th>
				))}
				{objectHeader.map((headerTitle) => (
					<th>{headerTitle}</th>
				))}
				{type === "object"}
			</thead>
			<tbody>
				{table.map((tableItem) => (
					<tr>
						<td>{tableItem.id}</td>
						{type === "event" && <td>{tableItem.timestamp!}</td>}
						{header.map((headerTitle) => (
							<td>{tableItem.attr[headerTitle]! as string}</td>
						))}
						{objectHeader.map((headerTitle) => (
							<td>
								{(tableItem as OcelObject).relations != null
									? (tableItem as OcelObject).relations[headerTitle]?.join(",")
									: ""}
							</td>
						))}
					</tr>
				))}
			</tbody>
		</Table>
	);
};

export default GenericTable;
