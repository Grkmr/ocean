
import { useForm, useFieldArray } from "react-hook-form";
import { Button, Form, Container, Row, Col } from "react-bootstrap";
import { useApplyO2ORule } from "@/hooks/api";

type FormValues = {
  sourceType: string;
  targetType: string;
  relationType: string;
  joinConditions: {
    sourceAttribute: string;
    operator: string;
    targetAttribute: string;
  }[];
};

const operators = ["==", "!=", ">", "<", ">=", "<=", "contains", "regex"];

export const O2ORuleForm = () => {
  const { mutate } = useApplyO2ORule();

  const { register, handleSubmit, control } = useForm<FormValues>({
    defaultValues: {
      sourceType: "",
      targetType: "",
      relationType: "",
      joinConditions: [{ sourceAttribute: "", operator: "==", targetAttribute: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "joinConditions",
  });

  const onSubmit = (data: FormValues) => {
    mutate({

      rule: {
        source_type: data.sourceType,
        target_type: data.targetType,
        relation_type: "o2o" as const,
        join_conditions: data.joinConditions.map(({ targetAttribute, sourceAttribute, operator }) => ({ source_attribute: sourceAttribute, target_attribute: targetAttribute, operator })),
      }

    });
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Form.Group className="mb-3">
          <Form.Label>Source Type</Form.Label>
          <Form.Control {...register("sourceType")} required />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Target Type</Form.Label>
          <Form.Control {...register("targetType")} required />
        </Form.Group>

        <hr />
        <h5>Join Conditions</h5>
        {fields.map((field, idx) => (
          <Row key={field.id} className="mb-2">
            <Col>
              <Form.Control {...register(`joinConditions.${idx}.sourceAttribute`)} placeholder="Source Attr" />
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
              <Form.Control {...register(`joinConditions.${idx}.targetAttribute`)} placeholder="Target Attr" />
            </Col>
            <Col xs="auto">
              <Button variant="danger" onClick={() => remove(idx)}>×</Button>
            </Col>
          </Row>
        ))}

        <Button variant="secondary" onClick={() => append({ sourceAttribute: "", operator: "==", targetAttribute: "" })}>
          + Add Condition
        </Button>

        <hr />
        <Button type="submit" variant="primary" >
          Apply Rule
        </Button>
      </Form>
    </Container>
  );
};
