import { Api } from "@/src/openapi"
import { getLocalStorage } from "@/src/util"
import { useOceanStore } from "@/src/zustand"
import { useQuery } from "@tanstack/react-query"

const EditorFilterForm = () => {
  const session = useOceanStore.use.session()

  const { data } = useQuery({
    queryKey: ["events"], enabled: !!session, queryFn: async () => {
      const session = getLocalStorage("session")
      if (session)
        Api.eventsEditorEventsGet({ oceanSessionId: session })


      return "test"
    }
  })

  return <></>

}

export default EditorFilterForm
