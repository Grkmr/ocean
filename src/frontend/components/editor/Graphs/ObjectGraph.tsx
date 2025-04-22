import { ReactFlow, Edge, Node as XYNode, MarkerType } from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import { ObjectsRelationsOverviewObjectGraphPostResponse } from "@/src/api/generated";
import { useObjectGraph } from "@/hooks/api";
import { useEffect, useState } from "react";
import "@xyflow/react/dist/style.css";

const nodeWidth = 200;
const nodeHeight = 100;

const getGraphHeight = (nodes: XYNode[]) => {
	const bottom = Math.max(...nodes.map((n) => n.position.y + nodeHeight));
	return bottom + 100; // padding
};

const createLayoutedGraph = (
	data: ObjectsRelationsOverviewObjectGraphPostResponse,
): {
	nodes: XYNode[];
	edges: Edge[];
} => {
	const dagreGraph = new dagre.graphlib.Graph();
	dagreGraph.setDefaultEdgeLabel(() => ({}));
	dagreGraph.setGraph({
		rankdir: "LR", // horizontal layout
		nodesep: 100,
		ranksep: 200,
	});

	const { object_type_count, attributes, relations } = data;

	Object.entries(object_type_count).forEach(([type]) => {
		dagreGraph.setNode(type, { width: nodeWidth, height: nodeHeight });
	});

	relations.forEach((rel) => {
		dagreGraph.setEdge(rel.src, rel.target);
	});

	const nodes: XYNode[] = Object.entries(object_type_count).map(
		([type, count]) => {
			const objAttrs = attributes.filter(
				(attr) => attr.otype === type && attr.target === "object",
			);

			return {
				id: type,
				data: {
					label: (
						<div style={{ fontSize: 12 }}>
							<strong>{type}</strong>
							<div>Count: {count}</div>
							{objAttrs.length > 0 && (
								<table style={{ fontSize: 10, marginTop: 6 }}>
									<tbody>
										{objAttrs.map((attr, index) => (
											<tr key={index}>
												<td style={{ fontWeight: "bold", paddingRight: 6 }}>
													{attr.name}
												</td>
												<td>{String(attr.type)}</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
						</div>
					),
				},
				position: { x: 0, y: 0 },
				type: "default",
				style: {
					border: "2px solid #666",
					borderRadius: 8,
					padding: 10,
					background: "#fff",
					width: nodeWidth,
				},
				connectable: false,
			};
		},
	);

	// ✅ Offset duplicate edges with same source/target

	let edgeCounter = 0;
	const edges: Edge[] = [];

	const edgeGroups: Record<string, typeof relations> = {};
	relations.forEach((rel) => {
		const key = `${rel.src}->${rel.target}`;
		if (!edgeGroups[key]) edgeGroups[key] = [];
		edgeGroups[key].push(rel);
	});

	for (const group of Object.values(edgeGroups)) {
		const center = (group.length - 1) / 2;
		group.forEach((rel, i) => {
			const offset = (i - center) * 20; // spacing in px

			edges.push({
				id: `e-${edgeCounter++}`,
				source: rel.src,
				target: rel.target,
				label: rel.qualifier,
				type: "smoothstep",
				style: {
					stroke: "#888",
					strokeWidth: 1.5,
					offsetDistance: offset,
				},
				labelStyle: { fill: "#333", fontSize: 12 },
				markerEnd: { type: MarkerType.ArrowClosed },
			});
		});
	}

	dagre.layout(dagreGraph);

	const layouted = nodes.map((node) => {
		const pos = dagreGraph.node(node.id);
		return {
			...node,
			position: {
				x: pos.x - nodeWidth / 2,
				y: pos.y - nodeHeight / 2,
			},
		};
	});

	const minX = Math.min(...layouted.map((n) => n.position.x));
	const minY = Math.min(...layouted.map((n) => n.position.y));

	layouted.forEach((node) => {
		node.position.x -= minX;
		node.position.y -= minY;
	});

	nodes.length = 0;
	nodes.push(...layouted);

	return { nodes, edges };
};

const ObjectGraph: React.FC = () => {
	const { data } = useObjectGraph();
	const [nodes, setNodes] = useState<XYNode[]>([]);
	const [edges, setEdges] = useState<Edge[]>([]);
	const [graphHeight, setGraphHeight] = useState(0);

	useEffect(() => {
		if (data) {
			const { nodes, edges } = createLayoutedGraph(data);
			setNodes(nodes);
			setEdges(edges);
			setGraphHeight(getGraphHeight(nodes));
		}
	}, [data]);

	return (
		<div style={{ width: "100%", height: graphHeight }}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				fitView
				panOnDrag={false}
				zoomOnScroll={false}
				zoomOnPinch={false}
				zoomOnDoubleClick={false}
				panOnScroll={false}
				nodesDraggable={false}
				elementsSelectable={false}
				proOptions={{ hideAttribution: true }}
				preventScrolling={false}
			/>
		</div>
	);
};

export default ObjectGraph;
