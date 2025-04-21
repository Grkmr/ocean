import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import Papa from "papaparse";
import { Container, Form, Row, Col, Button } from "react-bootstrap";
import { upsertObjects } from "@/hooks/api";
import { UpsertObjectsRequest } from "@/src/api/generated";

const OCELObjectOptions = ["ocel:oid", "ocel:type"];

type FormValues = {
	objectFields: {
		oidField: string;
		otypeField: string;
	};
	addedAttributes: { csvField: string; ocelField: string }[];
};

const UpsertObjectsForm = () => {
	const { mutate, isPending } = upsertObjects();

	const {
		register,
		control,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<FormValues>({
		defaultValues: {
			objectFields: {
				oidField: "ocel:oid",
				otypeField: "ocel:type",
			},
			addedAttributes: [{ csvField: "", ocelField: "" }],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: "addedAttributes",
	});

	const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
	const [csvData, setCsvData] = useState<any[]>([]);

	const onCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			complete: (result) => {
				setCsvHeaders(result.meta.fields || []);
				setCsvData(result.data as any[]);
			},
		});
	};

	const onSubmit = (data: FormValues) => {
		const payload: UpsertObjectsRequest = {
			ext_table: csvData,
			object_fields: [data.objectFields.oidField, data.objectFields.otypeField],
			added_attributes: data.addedAttributes.map(({ csvField, ocelField }) => [
				csvField,
				ocelField,
			]),
		};

		mutate(payload, {
			onSuccess: () => alert("Objects upserted successfully!"),
			onError: () => alert("Something went wrong."),
		});
	};

	return (
		<Container>
			<Form onSubmit={handleSubmit(onSubmit)}>
				{/* CSV Upload */}
				<Form.Group className="mb-3">
					<Form.Label>Upload CSV</Form.Label>
					<Form.Control type="file" accept=".csv" onChange={onCSVUpload} />
				</Form.Group>

				{/* Object ID & Type Fields */}
				<Form.Group className="mb-3">
					<Form.Label>Object ID Field</Form.Label>
					<Form.Select {...register("objectFields.oidField")} required>
						{OCELObjectOptions.map((f) => (
							<option key={f} value={f}>
								{f}
							</option>
						))}
					</Form.Select>
				</Form.Group>

				<Form.Group className="mb-3">
					<Form.Label>Object Type Field</Form.Label>
					<Form.Select {...register("objectFields.otypeField")} required>
						{OCELObjectOptions.map((f) => (
							<option key={f} value={f}>
								{f}
							</option>
						))}
					</Form.Select>
				</Form.Group>

				{/* Added Attributes */}
				{csvHeaders.length > 0 && (
					<>
						<hr />
						<h5>Added Attributes</h5>
						{fields.map((field, idx) => (
							<Row key={field.id} className="mb-2 align-items-center">
								<Col>
									<Form.Select {...register(`addedAttributes.${idx}.csvField`)}>
										<option value="">CSV Field</option>
										{csvHeaders.map((f) => (
											<option key={f} value={f}>
												{f}
											</option>
										))}
									</Form.Select>
								</Col>
								<Col>
									<Form.Control
										{...register(`addedAttributes.${idx}.ocelField`)}
										placeholder="OCEL Attribute"
										required
									/>
								</Col>
								<Col xs="auto">
									<Button variant="danger" onClick={() => remove(idx)}>
										×
									</Button>
								</Col>
							</Row>
						))}
						<Button
							className="mb-3"
							variant="secondary"
							onClick={() => append({ csvField: "", ocelField: "" })}
						>
							+ Add Attribute
						</Button>
					</>
				)}

				<hr />
				<Button
					type="submit"
					disabled={csvHeaders.length === 0 || isPending}
					variant="primary"
				>
					Submit
				</Button>
			</Form>
		</Container>
	);
};

export default UpsertObjectsForm;
