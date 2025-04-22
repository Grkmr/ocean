import React from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { Form, Button, Row, Col } from "react-bootstrap";
import { EventFilter } from "@/src/api/generated";

// Attribute and Filter Types
export type NominalAttribute = {
	attribute: string;
	type: "nominal";
	sample_values: Array<string | number>;
};

export type NumericAttribute = {
	attribute: string;
	type: "numeric";
};

export type Attribute = NominalAttribute | NumericAttribute;

export type NominalFilter = {
	type: "nominal";
	field_name: string;
	value: Array<string>;
};

export type NumericFilter = {
	type: "numeric";
	field_name: string;
	operator: "==" | "<=" | ">=";
	value: number;
};

export type Filter = NominalFilter | NumericFilter;

type Props = {
	attributes: Attribute[];
};
const AttributeFilterSection = ({
	name,
	attributes,
	onlyNumeric,
}: {
	name: keyof EventFilter;
	attributes: Attribute[];
	onlyNumeric?: boolean;
}) => {
	const { control, register, watch } = useFormContext();
	const { fields, append, remove } = useFieldArray({ control, name });

	const watched = watch(name) || [];

	const getAttr = (fieldName?: string) =>
		attributes.find((a) => a.attribute === fieldName);

	return (
		<>
			{fields.map((field, index) => {
				const selected = watched[index]?.field_name;
				const attr = getAttr(selected);

				const isNumeric = attr?.type === "numeric";

				return (
					<div key={field.id} className="border p-3 mb-2 rounded">
						<Row>
							<Col md={3}>
								<Form.Group>
									<Form.Label>Field</Form.Label>
									<Form.Select
										{...register(`${name}.${index}.field_name` as const)}
									>
										<option value="">Select...</option>
										{attributes
											.filter((a) => !onlyNumeric || a.type === "numeric")
											.map((a) => (
												<option key={a.attribute} value={a.attribute}>
													{a.attribute}
												</option>
											))}
									</Form.Select>
								</Form.Group>
							</Col>

							{isNumeric && (
								<>
									<Col md={2}>
										<Form.Group>
											<Form.Label>Operator</Form.Label>
											<Form.Select
												{...register(`${name}.${index}.operator` as const)}
											>
												<option value="==">==</option>
												<option value="<=">{"<="}</option>
												<option value=">=">{">="}</option>
											</Form.Select>
										</Form.Group>
									</Col>
									<Col md={3}>
										<Form.Group>
											<Form.Label>Value</Form.Label>
											<Form.Control
												type="number"
												{...register(`${name}.${index}.value`, {
													valueAsNumber: true,
												})}
											/>
										</Form.Group>
									</Col>
								</>
							)}

							{attr?.type === "nominal" && attr.sample_values && (
								<Col md={5}>
									<Form.Group>
										<Form.Label>Values</Form.Label>
										<Controller
											control={control}
											name={`${name}.${index}.value`}
											render={({ field }) => (
												<Form.Select
													multiple
													value={field.value || []}
													onChange={(e) =>
														field.onChange(
															Array.from(
																e.target.selectedOptions,
																(opt) => opt.value,
															),
														)
													}
												>
													{attr.sample_values.map((v) => (
														<option key={v.toString()} value={v.toString()}>
															{v}
														</option>
													))}
												</Form.Select>
											)}
										/>
									</Form.Group>
								</Col>
							)}

							<Col md={2} className="d-flex align-items-end">
								<Button
									variant="danger"
									onClick={() => remove(index)}
									className="w-100"
								>
									Remove
								</Button>
							</Col>
						</Row>
					</div>
				);
			})}

			<Button
				variant="secondary"
				type="button"
				onClick={() => append({ field_name: "" })}
				className="mb-3"
			>
				+ Add Filter
			</Button>
		</>
	);
};

export default AttributeFilterSection;
