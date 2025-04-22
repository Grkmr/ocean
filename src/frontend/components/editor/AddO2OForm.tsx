import { useForm, useFieldArray } from "react-hook-form";
import { Button, Form, Container, Row, Col } from "react-bootstrap";
import { useApplyO2ORule, useOcelInfo } from "@/hooks/api";
import { OCELSummary } from "@/src/api/generated";

type FormValues = {
	sourceType: string;
	targetType: string;
	qualifier: string;
	relationType: string;
	joinConditions: {
		sourceAttribute: string;
		operator: string;
		targetAttribute: string;
	}[];
};

const operators = ["==", "!=", ">", "<", ">=", "<="] as const;

const getAttributeValues = (
	objectSummary: OCELSummary["object_summaries"],
	objectType: string,
) => [
	"ocel:oid",
	...objectSummary
		.find(({ object_type }) => object_type === objectType)!
		.attributes.map(({ attribute }) => attribute),
];

export const O2ORuleForm = () => {
	const { data: ocelInfo } = useOcelInfo({
		filter: { event_attributes: null },
	});
	const { mutate } = useApplyO2ORule();

	const { register, handleSubmit, control, watch } = useForm<FormValues>({
		defaultValues: {
			sourceType: "",
			targetType: "",
			qualifier: "",
			relationType: "",
			joinConditions: [
				{ sourceAttribute: "", operator: "==", targetAttribute: "" },
			],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: "joinConditions",
	});

	const sourceType = watch("sourceType");
	const targetType = watch("targetType");

	const onSubmit = (data: FormValues) => {
		mutate(
			{
				rule: {
					source_type: data.sourceType,
					target_type: data.targetType,
					relation_type: "o2o",
					qualifier: data.qualifier,
					join_conditions: data.joinConditions.map((c) => ({
						source_attribute: c.sourceAttribute,
						target_attribute: c.targetAttribute,
						operator: c.operator,
					})),
				},
			},
			{
				onSuccess: () => alert("O2O added successfully!"),
				onError: () => alert("Something went wrong."),
			},
		);
	};

	return (
		<Container>
			<Form onSubmit={handleSubmit(onSubmit)}>
				<Form.Group className="mb-3">
					<Form.Label>Source Type</Form.Label>
					<Form.Select {...register("sourceType")} required>
						<option value="" hidden>
							Select Source Type
						</option>
						{ocelInfo?.object_summaries.map(({ object_type }) => (
							<option key={object_type} value={object_type}>
								{object_type}
							</option>
						))}
					</Form.Select>
				</Form.Group>

				<Form.Group className="mb-3">
					<Form.Label>Target Type</Form.Label>
					<Form.Select {...register("targetType")} required>
						<option value="" hidden>
							Select Target Type
						</option>
						{ocelInfo?.object_summaries.map(({ object_type }) => (
							<option key={object_type} value={object_type}>
								{object_type}
							</option>
						))}
					</Form.Select>
				</Form.Group>

				<Form.Group className="mb-3">
					<Form.Label>Qualifier</Form.Label>
					<Form.Control
						type="text"
						placeholder="Enter qualifier"
						{...register("qualifier")}
					/>
				</Form.Group>
				<hr />
				{sourceType && targetType && (
					<>
						<h5>Join Conditions</h5>
						{fields.map((field, idx) => (
							<Row key={field.id} className="mb-2">
								<Col>
									<Form.Select
										{...register(`joinConditions.${idx}.sourceAttribute`)}
									>
										<option value="">Source Attr</option>
										{getAttributeValues(
											ocelInfo!.object_summaries,
											sourceType,
										).map((attribute) => (
											<option key={attribute} value={attribute}>
												{attribute}
											</option>
										))}
									</Form.Select>
								</Col>
								<Col>
									<Form.Select {...register(`joinConditions.${idx}.operator`)}>
										{operators.map((op) => (
											<option key={op} value={op}>
												{op}
											</option>
										))}
									</Form.Select>
								</Col>
								<Col>
									<Form.Select
										{...register(`joinConditions.${idx}.targetAttribute`)}
									>
										<option value="">Target Attr</option>
										{getAttributeValues(
											ocelInfo!.object_summaries,
											targetType,
										).map((attribute) => (
											<option key={attribute} value={attribute}>
												{attribute}
											</option>
										))}
									</Form.Select>
								</Col>
								<Col xs="auto">
									<Button variant="danger" onClick={() => remove(idx)}>
										×
									</Button>
								</Col>
							</Row>
						))}

						<Button
							variant="secondary"
							onClick={() =>
								append({
									sourceAttribute: "",
									operator: "==",
									targetAttribute: "",
								})
							}
						>
							+ Add Condition
						</Button>
					</>
				)}

				<hr />
				<Button type="submit" variant="primary">
					Apply Rule
				</Button>
			</Form>
		</Container>
	);
};
