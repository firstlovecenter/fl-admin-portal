import ArrivalDateSelector from 'components/ArrivalDateSelector/ArrivalDateSelector'

/**
 * Slim wrapper around the date selector for the arrivals dashboards. The
 * download button used to live here too, but it now sits beside the
 * "Bacenta Status" title in the dashboard body, so the picker stands
 * alone — no duplicate download UI on the page.
 */
const ArrivalsHeader = () => (
  <div className="mb-4">
    <ArrivalDateSelector />
  </div>
)

export default ArrivalsHeader
