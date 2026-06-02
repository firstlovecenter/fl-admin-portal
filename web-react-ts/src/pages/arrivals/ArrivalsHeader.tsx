import ArrivalDateSelector from 'components/ArrivalDateSelector/ArrivalDateSelector'

/**
 * Date selector wrapper for the arrivals dashboards. Earlier iterations
 * tried to make this sticky on mobile, but the AppShell's floating sidebar
 * toggle (`absolute right-3 top-3 size-11`) always conflicted with the
 * pinned bar — either the toggle covered the right chevron, or the bar
 * needed `pr-14` and looked squished. The page is now compact enough that
 * the date stays near the top without sticky.
 */
const ArrivalsHeader = () => (
  <div className="mb-3">
    <ArrivalDateSelector />
  </div>
)

export default ArrivalsHeader
