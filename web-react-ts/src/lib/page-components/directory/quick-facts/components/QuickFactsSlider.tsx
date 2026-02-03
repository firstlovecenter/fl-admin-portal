import React from 'react'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import BussingQuickFactsCard, {
  BussingQuickFactsProps,
} from './BussingQuickFactsCard'
import AttendanceQuickFactsCard, {
  AttendanceQuickFactsProps,
} from './AttendanceQuickFactsCard'
import IncomeQuickFactsCard, {
  IncomeQuickFactsProps,
} from './IncomeQuickFactsCard'

type QuickFactsSliderProps = {
  attendanceDetails: AttendanceQuickFactsProps['attendanceDetails']
  bussingDetails?: BussingQuickFactsProps['bussingDetails']
  incomeDetails: IncomeQuickFactsProps['incomeDetails']
}

const QuickFactsSlider = (props: QuickFactsSliderProps) => {
  const { attendanceDetails, incomeDetails, bussingDetails } = props

  const settings = {
    dots: false,
    infinite: true,
    speed: 900,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
  }

  return (
    <Slider {...settings} className="quick-facts-shadow">
      <div>
        <AttendanceQuickFactsCard attendanceDetails={attendanceDetails} />
      </div>
      <div>
        <IncomeQuickFactsCard incomeDetails={incomeDetails} />
      </div>
      {bussingDetails !== undefined && (
        <div>
          <BussingQuickFactsCard bussingDetails={bussingDetails} />
        </div>
      )}
    </Slider>
  )
}

export default QuickFactsSlider
