import GenericTable from "@/components/editor/GenericTable";
import Pagination from "@/components/editor/Pagination";
import { useOcelInfo, usePaginatedEvents } from "@/hooks/api"
import usePagination from "@/hooks/usePagination";
import { EventFilter } from "@/src/api/generated"
import { Api } from "@/src/openapi";
import { useOceanStore } from "@/src/zustand";
import { useEffect, useState } from "react"
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { PageProps } from "../_app";

const EventOverview: React.FC<PageProps> = ({ apiWrapper }) => {
  const session = useOceanStore.useState.session()

  const filter = useState<EventFilter>();
  const { data: ocelSummary } = useOcelInfo({ filter: {} });
  const { handlePageChange } = usePagination()
  const [selectedActivity, selectActivity] = useState<string>()
  const { data: paginatedEvents } = usePaginatedEvents({ filter: { activity_names: [...(selectedActivity ? [selectedActivity] : [])] } })


  useEffect(() => {
    if (!selectedActivity && ocelSummary?.activities[0])
      selectActivity(ocelSummary.activities[0].activity)
  }, [ocelSummary])


  return <>


    {ocelSummary && <>
      <Tabs activeKey={selectedActivity ?? ocelSummary.activities[0].activity ?? ""} onSelect={(newActivity) => { selectActivity(newActivity ?? undefined); handlePageChange(1) }}>
        {ocelSummary.activities.map(({ count, activity }) => <Tab eventKey={activity} title={`${activity} ${count}`} />)}
      </Tabs >
      {paginatedEvents &&
        <><GenericTable events={paginatedEvents?.data ?? []} />
          <Pagination totalPages={paginatedEvents?.totalPages ?? 0} /></>}
    </>}
  </>
}


export default EventOverview;
