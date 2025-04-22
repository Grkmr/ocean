import React, { useMemo } from "react";
import {
	useForm,
	FormProvider,
	useFormContext,
	Controller,
	useFieldArray,
} from "react-hook-form";
import { Form, Button, Row, Col } from "react-bootstrap";
import { EventFilter } from "@/src/api/generated";
import AttributeFilterSection from "./AttributeFilter";
import { useObjectGraph, useOcelInfo } from "@/hooks/api";

// --- Main Form ---
const EventFilterForm: React.FC = () => {
	const methods = useForm<EventFilter>({
		defaultValues: {
			activity_names: [],
			object_types: [],
			object_counts: [],
			object_attributes_values: [],
			event_attributes: [],
			time_span: {
				start: "",
				end: "",
			},
		},
	});

	const { data: ocelInfo } = useOcelInfo({ filter: {} });

	const attributes = useMemo(() => {
		return (
			ocelInfo?.object_summaries.flatMap(({ attributes }) => attributes) ?? []
		);
	}, [ocelInfo?.object_summaries]);

	const event_attributes = useMemo(() => {
		return Object.values(ocelInfo?.event_summaries ?? {}).flatMap(
			(attributes) => attributes,
		);
	}, [ocelInfo?.event_summaries]);

	return (
		<FormProvider {...methods}>
			<Form
				onSubmit={() => {}}
				style={{ display: "flex", flexDirection: "column" }}
			>
				{/* Time Span */}
				<h5>Time Span</h5>
				<Row className="mb-3">
					<Col>
						<Form.Group>
							<Form.Label>From</Form.Label>
							<Form.Control
								type="datetime-local"
								{...methods.register("time_span.start")}
							/>
						</Form.Group>
					</Col>
					<Col>
						<Form.Group>
							<Form.Label>To</Form.Label>
							<Form.Control
								type="datetime-local"
								{...methods.register("time_span.end")}
							/>
						</Form.Group>
					</Col>
				</Row>

				{/* Activity Names */}
				<Form.Group className="mb-3">
					<Form.Label>Activity Names</Form.Label>
					<Controller
						control={methods.control}
						name="activity_names"
						render={({ field }) => (
							<Form.Select
								multiple
								value={field.value || []}
								onChange={(e) =>
									field.onChange(
										Array.from(e.target.selectedOptions, (opt) => opt.value),
									)
								}
							>
								{ocelInfo?.activities.map(({ activity }) => (
									<option key={activity} value={activity}>
										{activity}
									</option>
								))}
							</Form.Select>
						)}
					/>
				</Form.Group>

				{/* Object Types */}
				<Form.Group className="mb-3">
					<Form.Label>Object Types</Form.Label>
					<Controller
						control={methods.control}
						name="object_types"
						render={({ field }) => (
							<Form.Select
								multiple
								value={field.value || []}
								onChange={(e) =>
									field.onChange(
										Array.from(e.target.selectedOptions, (opt) => opt.value),
									)
								}
							>
								{ocelInfo?.object_summaries.map(({ object_type }) => (
									<option key={object_type} value={object_type}>
										{object_type}
									</option>
								))}
							</Form.Select>
						)}
					/>
				</Form.Group>

				{/* Object Counts (numeric only) */}
				<h5>Object Counts</h5>
				<AttributeFilterSection
					name="object_counts"
					attributes={
						ocelInfo?.object_summaries?.map(({ object_type }) => ({
							type: "numeric",
							attribute: object_type,
						})) ?? []
					}
					onlyNumeric
				/>

				{/* Object Attributes */}
				<h5>Object Attributes</h5>
				<AttributeFilterSection
					name="object_attributes_values"
					attributes={attributes.map((attribute) =>
						attribute.type === "numerical"
							? { type: "numeric", attribute: attribute.attribute }
							: {
									type: "nominal",
									attribute: attribute.attribute,
									sample_values: attribute.sample_values,
								},
					)}
				/>

				{/* Event Attributes */}
				<h5>Event Attributes</h5>
				<AttributeFilterSection
					name="event_attributes"
					attributes={event_attributes.map((attribute) =>
						attribute.type === "numerical"
							? { type: "numeric", attribute: attribute.attribute }
							: {
									type: "nominal",
									attribute: attribute.attribute,
									sample_values: attribute.sample_values,
								},
					)}
				/>

				<Button variant="primary" type="submit" className="mt-4">
					Submit Filter
				</Button>
			</Form>
		</FormProvider>
	);
};

export default EventFilterForm;
