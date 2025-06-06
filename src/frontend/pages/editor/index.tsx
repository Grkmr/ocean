import EditorFilterForm from "@/components/editor/EventFilterForm";
import { useObjectGraph, usePaginatedEvents } from "@/hooks/api";
import { useOceanStore } from "@/src/zustand";
import { Button } from "react-bootstrap";
import { PageProps } from "../_app";
import { Api } from "@/src/openapi";
import AttributeUpsertForm from "@/components/editor/AddAttributeForm";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import UpsertObjectsForm from "@/components/editor/UpsertObjectsForm";
import { O2ORuleForm } from "@/components/editor/AddO2OForm";
import { DistributeValueForm } from "@/components/editor/DistributeValueForm";
import ObjectGraph from "@/components/editor/Graphs/ObjectGraph";

const EditorPage: React.FC<PageProps> = ({ apiWrapper }) => {
	return (
		<>
			<Tabs defaultActiveKey="attributes">
				<Tab eventKey="attributes" title="Add Attributes">
					<AttributeUpsertForm />
				</Tab>
				<Tab eventKey="objects" title="Insert Objects">
					<UpsertObjectsForm />
				</Tab>
				<Tab eventKey="o2o" title="Add O2O relations">
					<O2ORuleForm />
				</Tab>
				<Tab eventKey="distribute" title="Distribute Values">
					<DistributeValueForm />
				</Tab>
			</Tabs>
		</>
	);
};

export default EditorPage;
