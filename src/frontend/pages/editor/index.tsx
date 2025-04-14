import EditorFilterForm from "@/components/editor/EventFilterForm";
import { usePaginatedEvents } from "@/hooks/api";
import { useOceanStore } from "@/src/zustand";
import { Button } from "react-bootstrap";
import { PageProps } from "../_app";
import { Api } from "@/src/openapi";

const EditorPage: React.FC<PageProps> = ({ apiWrapper }) => {
  const session = useOceanStore.use.session()
  const ocel = useOceanStore.use.ocel()
  return <>
    <Button
      onClick={() => {
        if (session) {
          apiWrapper(() => Api.upsertObjectAttributesEditorApiOcelOtypeUpsertAttributesPost({ oceanSessionId: session, otype: ocel?.objectTypes[0] ?? "", requestBody: { new_attributes: { "test": 1 } } }), {})
        }

      }}
    >Test</Button>
  </>
}


export default EditorPage;
