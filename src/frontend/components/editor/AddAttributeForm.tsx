
import React, { useState } from "react";
import {
  Button,
  Form,
  Row,
  Col,
  Container,
} from "react-bootstrap";
import { useForm, useFieldArray } from "react-hook-form";
import Papa from "papaparse";
import { upsertAttributes } from "@/hooks/api";

type FormValues = {
  target: "objects" | "events";
  mergeFields: { ocelField: string; csvField: string }[];
  selectedColumns: string[];
};

const OCELObjectOptions = ["ocel:oid", "ocel:type"];
const OCELEventOptions = ["ocel:eid", "ocel:activity"]

const AttributeUpsertForm = () => {

  const { mutate } = upsertAttributes()
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      target: "objects",
      mergeFields: [{ ocelField: "", csvField: "" }],
      selectedColumns: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "mergeFields",
  });

  const target = watch("target");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const onCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields || [];
        setCsvHeaders(headers);
      },
    });
  };

  const onSubmit = async (data: FormValues) => {
    if (!csvFile) return;

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const extTable = result.data as Array<{ [key: string]: unknown }>;

        mutate({
          table: data.target,
          ext_table: extTable,
          merge_fields: data.mergeFields.map(({ ocelField, csvField }) => [
            csvField,
            ocelField,
          ]),
          added_columns: data.selectedColumns.map((col) => [col, col]),
          replace: true,
        });
      },
    });
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit(onSubmit)}>

        <Form.Group className="mb-3" controlId="targetSelect">
          <Form.Label>Target Table</Form.Label>
          <Form.Select {...register("target")} required>
            <option value="objects">Objects</option>
            <option value="events">Events</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3" controlId="csvUpload">
          <Form.Label>Upload CSV</Form.Label>
          <Form.Control type="file" accept=".csv" onChange={onCSVUpload} />
        </Form.Group>

        {csvHeaders.length > 0 && (
          <>
            <hr />
            <h5>Merge Fields</h5>
            {fields.map((field, idx) => (
              <Row key={field.id} className="mb-2 align-items-center">
                <Col>
                  <Form.Select {...register(`mergeFields.${idx}.ocelField`)}>
                    <option value="">OCEL field</option>
                    {(target == "events" ? OCELEventOptions : OCELObjectOptions).map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col>
                  <Form.Select {...register(`mergeFields.${idx}.csvField`)}>
                    <option value="">CSV field</option>
                    {csvHeaders.map((f) => (
                      <option key={f} value={f}>
                        {f}
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
              className="mb-3"
              variant="secondary"
              onClick={() => append({ ocelField: "", csvField: "" })}
            >
              + Add Merge Field
            </Button>

            <hr />
            <h5>Import Columns</h5>
            {csvHeaders.map((col) => (
              <Form.Check
                key={col}
                label={col}
                type="checkbox"
                {...register("selectedColumns")}
                value={col}
              />
            ))}
          </>
        )}

        <hr />
        <Button
          type="submit"
          disabled={csvHeaders.length === 0 || !csvFile}
          variant="primary"
        >
          Submit
        </Button>
      </Form>
    </Container>
  );
}

export default AttributeUpsertForm
