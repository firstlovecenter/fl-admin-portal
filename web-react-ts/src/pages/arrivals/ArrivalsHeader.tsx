import ArrivalDateSelector from 'components/ArrivalDateSelector/ArrivalDateSelector'

/**
 * Date selector for the arrivals dashboards. On mobile the toolbar sticks
 * to the top of the viewport so the week + chip row stays in reach as the
 * user scrolls through the counter tabs below; on `lg+` the dashboard's
 * own layout handles positioning (no sticky needed).
 *
 * The `-mx-4 px-4` cancels the parent `<main>`'s mobile horizontal padding
 * so the sticky surface stretches edge to edge — without this the sticky
 * card has a visible gutter against the page background.
 */
const ArrivalsHeader = () => (
  <div className="sticky top-0 z-20 -mx-4 mb-3 bg-background/85 px-4 py-2 pr-14 backdrop-blur supports-[backdrop-filter]:bg-background/75 lg:static lg:m-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-0">
    <ArrivalDateSelector />
  </div>
)

export default ArrivalsHeader
