import React, { useMemo } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { Form, Button, Row, Col } from "react-bootstrap";
import {
	EventFilter,
	NominalFilter,
	NumericalFilter,
} from "@/src/api/generated";
import AttributeFilterSection from "./AttributeFilter";
import { useOcelInfo } from "@/hooks/api";

type EventFilterFormProps = {
	filter: EventFilter;
	setEventFilter: (newFilter: EventFilter) => void;
	hideSections?: (keyof EventFilter)[];
};

const EventFilterForm: React.FC<EventFilterFormProps> = ({
	filter,
	setEventFilter,
	hideSections = [],
}) => {
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
			...filter,
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
				onSubmit={methods.handleSubmit((rawFilter) => {
					const filter: EventFilter = { ...rawFilter };

					// 🧼 Clean up time_span if both dates are empty
					if (!filter.time_span?.start && !filter.time_span?.end) {
						filter.time_span = undefined;
					}

					// 🧼 Helper: sanitize & split filters by type
					const cleanFilters = (
						filters: any[] | null | undefined,
					): {
						numerical: NumericalFilter[];
						nominal: NominalFilter[];
					} => {
						const numerical: NumericalFilter[] = [];
						const nominal: NominalFilter[] = [];

						if (!filters) return { numerical, nominal };

						for (const f of filters) {
							if (!f?.field_name || !f?.type) continue;

							if (
								f.type === "numerical" &&
								["eq", "lt", "gt"].includes(f.filter) &&
								typeof f.value === "number"
							) {
								numerical.push({
									type: "numerical",
									field_name: f.field_name,
									filter: f.filter,
									value: f.value,
								});
							}

							if (
								f.type === "nominal" &&
								Array.isArray(f.value) &&
								f.value.length > 0
							) {
								nominal.push({
									type: "nominal",
									field_name: f.field_name,
									value: f.value,
								});
							}
						}

						return { numerical, nominal };
					};

					// 🧼 Clean all filter sections
					const { numerical: cleanedObjectCounts } = cleanFilters(
						filter.object_counts,
					);
					const {
						numerical: cleanedObjectNumerical,
						nominal: cleanedObjectNominal,
					} = cleanFilters(filter.object_attributes_values);
					const {
						numerical: cleanedEventNumerical,
						nominal: cleanedEventNominal,
					} = cleanFilters(filter.event_attributes);

					// 🧼 Replace empty arrays with null or clean versions
					filter.activity_names = filter.activity_names?.length
						? filter.activity_names
						: null;
					filter.object_types = filter.object_types?.length
						? filter.object_types
						: null;

					filter.object_counts = cleanedObjectCounts.length
						? cleanedObjectCounts
						: null;
					const objectAttrs = [
						...cleanedObjectNumerical,
						...cleanedObjectNominal,
					];
					filter.object_attributes_values = objectAttrs.length
						? objectAttrs
						: null;

					const eventAttrs = [...cleanedEventNumerical, ...cleanedEventNominal];
					filter.event_attributes = eventAttrs.length ? eventAttrs : null;

					setEventFilter(filter);
				})}
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

				{!hideSections.includes("activity_names") && (
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
				)}

				{!hideSections.includes("object_types") && (
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
				)}
				{/* Object Counts (numeric only) */}
				<h5>Object Counts</h5>
				<AttributeFilterSection
					name="object_counts"
					attributes={
						ocelInfo?.object_summaries?.map(({ object_type }) => ({
							type: "numerical",
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
							? { type: "numerical", attribute: attribute.attribute }
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
							? { type: "numerical", attribute: attribute.attribute }
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
