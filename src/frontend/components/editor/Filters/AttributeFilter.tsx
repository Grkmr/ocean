import React from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { Form, Button, Row, Col } from "react-bootstrap";

// Attribute and Filter Types
export type NominalAttribute = {
	attribute: string;
	type: "nominal";
	sample_values: Array<string | number>;
};

export type NumericalAttribute = {
	attribute: string;
	type: "numerical";
};

export type Attribute = NominalAttribute | NumericalAttribute;

export type AttributeFilterSectionProps = {
	name: string;
	attributes: Attribute[];
	onlyNumeric?: boolean;
};

const AttributeFilterSection = ({
	name,
	attributes,
	onlyNumeric,
}: AttributeFilterSectionProps) => {
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
				const isNumerical = attr?.type === "numerical";

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
											.filter((a) => !onlyNumeric || a.type === "numerical")
											.map((a) => (
												<option key={a.attribute} value={a.attribute}>
													{a.attribute}
												</option>
											))}
									</Form.Select>
								</Form.Group>
							</Col>

							{/* Inject `type` as hidden input */}
							<input
								type="hidden"
								{...register(`${name}.${index}.type` as const)}
								value={
									attr?.type === "numerical" ? "numerical" : attr?.type || ""
								}
							/>

							{isNumerical && (
								<>
									<Col md={2}>
										<Form.Group>
											<Form.Label>Filter</Form.Label>
											<Form.Select
												{...register(`${name}.${index}.filter` as const)}
											>
												<option value="eq">==</option>
												<option value="lt">{"<="}</option>
												<option value="gt">{">="}</option>
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
				onClick={() =>
					append({
						field_name: "",
						type: onlyNumeric ? "numerical" : "nominal",
						filter: "eq",
						value: onlyNumeric ? 0 : [],
					})
				}
				className="mb-3"
			>
				+ Add Filter
			</Button>
		</>
	);
};

export default AttributeFilterSection;
