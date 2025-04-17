
import { useForm } from "react-hook-form";
import { Button, Form, Container, Row, Col } from "react-bootstrap";
import { useDistributeValue, useOcelInfo } from "@/hooks/api";
import Papa from "papaparse";
import { useState } from "react";

type CSVRow = { [key: string]: string };

type FormValues = {
  timestampField: string;
  valueField: string;
};

export const DistributeValueForm = () => {
  const { mutate } = useDistributeValue();
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [weights, setWeights] = useState<{ activity: string; weight: number }[]>([]);
  const { data } = useOcelInfo({ filter: { event_attributes: [] } });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      timestampField: "",
      valueField: "",
    },
  });

  const onCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setCsvData(result.data);
        setCsvHeaders(result.meta.fields || []);
      },
    });
  };

  const onSubmit = (form: FormValues) => {
    if (!csvData.length) return;

    const timetable = csvData.map((row) => [
      row[form.timestampField],
      parseFloat(row[form.valueField]),
    ]);

    const weightsDict = Object.fromEntries(
      weights
        .filter(({ activity }) => activity.trim() !== "")
        .map(({ activity, weight }) => [activity, weight])
    );

    mutate({
      timetable,
      timestamp_field: form.timestampField,
      value_field: form.valueField,
      weights: weightsDict,
    }, {
      onSuccess: () => alert("Values distributed successfully!"),
      onError: () => alert("Something went wrong."),
    });
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Form.Group className="mb-3">
          <Form.Label>Upload CSV</Form.Label>
          <Form.Control type="file" accept=".csv" onChange={onCSVUpload} />
        </Form.Group>

        {csvHeaders.length > 0 && (
          <Row className="mb-3">
            <Col>
              <Form.Label>Timestamp Column</Form.Label>
              <Form.Select {...register("timestampField")} required>
                <option value="">Select...</option>
                {csvHeaders.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </Form.Select>
            </Col>
            <Col>
              <Form.Label>Value Column</Form.Label>
              <Form.Select {...register("valueField")} required>
                <option value="">Select...</option>
                {csvHeaders.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        )}

        <hr />
        <Form.Label>Weights</Form.Label>
        {weights.map((entry, idx) => (
          <Row key={idx} className="mb-2">
            <Col>
              <Form.Select
                value={entry.activity}
                onChange={(e) => {
                  const newWeights = [...weights];
                  newWeights[idx].activity = e.target.value;
                  setWeights(newWeights);
                }}
              >
                <option value="">Select activity...</option>
                {data?.activities.map(({ activity }) => (
                  <option key={activity} value={activity}>{activity}</option>
                ))}
              </Form.Select>
            </Col>
            <Col>
              <Form.Control
                type="number"
                value={entry.weight}
                onChange={(e) => {
                  const newWeights = [...weights];
                  newWeights[idx].weight = parseFloat(e.target.value);
                  setWeights(newWeights);
                }}
              />
            </Col>
            <Col xs="auto">
              <Button
                variant="danger"
                onClick={() => setWeights(weights.filter((_, i) => i !== idx))}
              >
                ×
              </Button>
            </Col>
          </Row>
        ))}
        <Button
          variant="secondary"
          className="mb-3"
          disabled={!data?.activities.length}
          onClick={() => setWeights([...weights, { activity: "", weight: 1 }])}
        >
          + Add Weight
        </Button>

        <hr />
        <Button type="submit" disabled={!csvData.length} variant="primary">
          Distribute
        </Button>
      </Form>
    </Container>
  );
};
