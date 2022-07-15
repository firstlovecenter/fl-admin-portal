import TestRenderer from 'react-test-renderer'
import { MockedProvider } from '@apollo/client/testing'
import ArrivalTimes from './ArrivalTimes'
import { GET_ARRIVAL_TIMES } from './time-gql'
import TestProvider from 'TestProvider.jsx'
import { BrowserRouter } from 'react-router-dom'

const mockedUsedNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUsedNavigate,
}))

const mocks = [
  {
    request: {
      query: GET_ARRIVAL_TIMES,
      variables: {
        id: '0df1f5e9-6d0d-4510-9e0c-fda00d65853',
      },
    },
    result: {
      data: {
        streams: [
          {
            id: '0df1f5e9-6d0d-4510-9e0c-fda00d65853a',
            name: 'Town',
            mobilisationStartTime: '2022-04-13T10:01:12.020Z',
            mobilisationEndTime: '2022-04-13T10:30:12.020Z',
            arrivalStartTime: '2022-04-13T08:00:12.020Z',
            arrivalEndTime: '2022-04-13T12:30:12.020Z',
            __typename: 'Stream',
          },
        ],
      },
    },
  },
]
// console.log(useNavigate())
it('renders without error if user id is present', () => {
  const component = TestRenderer.create(
    <MockedProvider mocks={mocks} addTypename={false}>
      <TestProvider>
        <ArrivalTimes />
      </TestProvider>
    </MockedProvider>
  )

  const tree = component.toJSON()
  //   expect(mockedUsedNavigate).toHaveBeenCalledWith('/stream/set-arrivals-time')
})
