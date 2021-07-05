import React, { useState, useCallback, useEffect } from 'react'
import ReactDOM from 'react-dom'
// import registerServiceWorker from './registerServiceWorker'
import { Route, Switch, BrowserRouter as Router } from 'react-router-dom'
import {
  ApolloProvider,
  ApolloClient,
  createHttpLink,
  InMemoryCache,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import './index.css'
import FederalAdminDashboard from './pages/dashboards/FederalAdminDashboard.jsx'
import BishopDashboard from './pages/dashboards/BishopDashboard.jsx'
import BishopMembers from './pages/grids/BishopMembers.jsx'
import CampusTownMembers from './pages/grids/CampusTownMembers.jsx'
import CentreMembers from './pages/grids/CentreMembers.jsx'
import BacentaMembers from './pages/grids/BacentaMembers.jsx'
import SontaMembers from './pages/grids/SontaMembers.jsx'
import SearchPageMobile from './pages/mobile/SearchPage'
import DisplayMemberDetails from './pages/display/DetailsMember'
import CreateMember from './pages/create/CreateMember'
import UpdateMember from './pages/update/UpdateMember.jsx'
import CreateBacenta from './pages/create/CreateBacenta'
import CreateCentre from './pages/create/CreateCentre.jsx'
import CreateTownCampus from './pages/create/CreateTownCampus'
import UpdateTownCampus from './pages/update/UpdateTownCampus.jsx'
import DisplayBacentaDetails from './pages/display/DetailsBacenta'
import DisplayCentreDetails from './pages/display/DetailsCentre'
import DisplayCampusTownDetails from './pages/display/DetailsCampusTown.jsx'
import DisplaySontaDetails from './pages/display/DetailsSonta.jsx'
import { MemberContext, SearchContext } from './contexts/MemberContext'
import { ChurchContext } from './contexts/ChurchContext'
import DisplayAllBacentas from './pages/display/AllBacentas'
import DisplayAllCentres from './pages/display/AllCentres'
import DisplayAllSontas from './pages/display/AllSontas'
import DisplayAllTownCampuses from './pages/display/AllTownCampuses'
import UpdateCentre from './pages/update/UpdateCentre'
import DisplaySontasByCampusTown from './pages/display/SontasByCampusTown'
import UpdateBacenta from './pages/update/UpdateBacenta'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import ProtectedRouteHome from './auth/ProtectedRouteHome.jsx'
import ProtectedMembersRoute from './auth/ProtectedMembersRoute.jsx'
import MemberFiltersMobile from './pages/mobile/MemberFilters'
import MemberTableMobile from './components/MemberTableMobile.jsx'
import UserProfileDisplayPage from './pages/user-profile/DisplayPage'
import UserProfileEditPage from './pages/user-profile/EditPage'
import CreateSonta from './pages/create/CreateSonta'
import BacentaService from './pages/record-service/BacentaService'
import BacentaReport from './pages/reports/BacentaReport'

const AppWithApollo = () => {
  const [accessToken, setAccessToken] = useState()
  const { getAccessTokenSilently } = useAuth0()

  const getAccessToken = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently({
        audience: 'https://flcadmin.netlify.app/graphql',
        scope: 'read:current_user',
      })
      // console.log('from get access token', token)
      setAccessToken(token)
      sessionStorage.setItem('token', token)
    } catch (err) {
      // eslint-disable-next-line
      console.error(err)
    }
  }, [getAccessTokenSilently])

  useEffect(() => {
    getAccessToken()
  }, [getAccessToken])

  const httpLink = createHttpLink({
    uri: process.env.REACT_APP_GRAPHQL_URI || '/graphql',
  })

  const authLink = setContext((_, { headers }) => {
    // get the authentication token from local storage if it exists
    const token = sessionStorage.getItem('token') || accessToken
    // return the headers to the context so httpLink can read them
    return {
      headers: {
        ...headers,
        Authorization: token ? `Bearer ${token}` : '',
      },
    }
  })

  const client = new ApolloClient({
    uri: process.env.REACT_APP_GRAPHQL_URI || '/graphql',
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  })

  return (
    <ApolloProvider client={client}>
      <PastorsAdmin />
    </ApolloProvider>
  )
}

const PastorsAdmin = () => {
  const [church, setChurch] = useState(
    sessionStorage.getItem('church')
      ? JSON.parse(sessionStorage.getItem('church'))
      : { church: '', subChurch: '' }
  )

  const [bishopId, setBishopId] = useState(
    sessionStorage.getItem('bishopId') ? sessionStorage.getItem('bishopId') : ''
  )
  const [townId, setTownId] = useState(
    sessionStorage.getItem('townId') ? sessionStorage.getItem('townId') : ''
  )
  const [campusId, setCampusId] = useState(
    sessionStorage.getItem('campusId') ? sessionStorage.getItem('campusId') : ''
  )
  const [bacentaId, setBacentaId] = useState(
    sessionStorage.getItem('bacentaId')
      ? sessionStorage.getItem('bacentaId')
      : ''
  )
  const [centreId, setCentreId] = useState(
    sessionStorage.getItem('centreId') ? sessionStorage.getItem('centreId') : ''
  )
  const [sontaId, setSontaId] = useState(
    sessionStorage.getItem('sontaId') ? sessionStorage.getItem('sontaId') : ''
  )
  const [ministryId, setMinistryId] = useState(
    sessionStorage.getItem('ministryId')
      ? sessionStorage.getItem('ministryId')
      : ''
  )
  const [memberId, setMemberId] = useState(
    sessionStorage.getItem('memberId') ? sessionStorage.getItem('memberId') : ''
  )
  const [currentUser, setCurrentUser] = useState({
    id: '',
    picture: '',
    firstName: '',
    lastName: '',
    bishop: '',
    church: {},
    email: '',
    constituency: '',
    roles: [''],
  })

  const [searchKey, setSearchKey] = useState('')
  const [filters, setFilters] = useState({
    gender: '',
    maritalStatus: '',
    occupation: '',
    leaderTitle: [],
    leaderRank: [],
    ministry: '',
  })

  const determineStream = (member) => {
    //switch case for other church types
    switch (member?.__typename) {
      case 'Town':
        setChurch({ church: 'town', subChurch: 'centre' })
        sessionStorage.setItem(
          'church',
          JSON.stringify({
            church: 'town',
            subChurch: 'centre',
          })
        )
        setBishopId(member.bishop?.id)
        sessionStorage.setItem('bishopId', member.bishop?.id)
        break
      case 'Campus':
        setChurch({ church: 'campus', subChurch: 'centre' })
        sessionStorage.setItem(
          'church',
          JSON.stringify({
            church: 'campus',
            subChurch: 'centre',
          })
        )
        setBishopId(member.bishop?.id)
        sessionStorage.setItem('bishopId', member.bishop?.id)
        break
      case 'Centre':
        setChurch({
          church: member.campus ? 'campus' : 'town',
          subChurch: 'centre',
        })
        sessionStorage.setItem(
          'church',
          JSON.stringify({
            church: member.campus ? 'campus' : 'town',
            subChurch: 'centre',
          })
        )
        setBishopId(
          member.campus ? member.campus.bishop.id : member.town.bishop.id
        )
        sessionStorage.setItem(
          'bishopId',
          member.campus ? member.campus.bishop.id : member.town.bishop.id
        )
        break
      case 'Bacenta':
        setChurch({ church: member.centre?.town ? 'town' : 'campus' })
        sessionStorage.setItem(
          'church',
          JSON.stringify({
            church: member.centre?.town ? 'town' : 'campus',
          })
        )
        setBishopId(
          member.centre?.town
            ? member.centre?.town.bishop.id
            : member.centre?.campus.bishop.id
        )
        sessionStorage.setItem(
          'bishopId',
          member.centre?.town
            ? member.centre?.town.bishop.id
            : member.centre?.campus.bishop.id
        )
        break
      default:
    }

    if (!member?.bacenta) {
      if (!member.townBishop) {
        return
      }
      if (member.townBishop[0]) {
        setChurch({ church: 'town', subChurch: 'centre' })
        sessionStorage.setItem(
          'church',
          JSON.stringify({
            church: 'town',
            subChurch: 'centre',
          })
        )
        setBishopId(member.id)
        sessionStorage.setItem('bishopId', member.id)
        return
      } else if (member.campusBishop[0]) {
        setChurch({ church: 'campus', subChurch: 'centre' })
        sessionStorage.setItem(
          'church',
          JSON.stringify({
            church: 'campus',
            subChurch: 'centre',
          })
        )
        setBishopId(member.id)
        sessionStorage.setItem('bishopId', member.id)
        return
      } else {
        return
      }
    }
    if (member?.bacenta?.centre?.town) {
      setChurch({ church: 'town', subChurch: 'centre' })
      sessionStorage.setItem(
        'church',
        JSON.stringify({
          church: 'town',
          subChurch: 'centre',
        })
      )
      setBishopId(member.bacenta.centre.town.bishop.id)
      sessionStorage.setItem('bishopId', member.bacenta.centre.town.bishop.id)
      return
    } else if (member.leadsTown && member.leadsTown[0]) {
      setChurch({ church: 'town', subChurch: 'centre' })
      sessionStorage.setItem(
        'church',
        JSON.stringify({
          church: 'town',
          subChurch: 'centre',
        })
      )
      setBishopId(member.leadsTown[0].bishop?.id)
      sessionStorage.setItem('bishopId', member.leadsTown[0].bishop?.id)
      return
    } else if (member?.bacenta?.centre?.campus) {
      setChurch({ church: 'campus', subChurch: 'centre' })
      sessionStorage.setItem(
        'church',
        JSON.stringify({
          church: 'campus',
          subChurch: 'centre',
        })
      )
      setBishopId(member?.bacenta?.centre?.campus?.bishop?.id)
      sessionStorage.setItem(
        'bishopId',
        member?.bacenta?.centre?.campus?.bishop?.id
      )
      return
    } else if (member?.leadsCampus[0]) {
      setChurch({ church: 'campus', subChurch: 'centre' })
      sessionStorage.setItem(
        'church',
        JSON.stringify({
          church: 'campus',
          subChurch: 'centre',
        })
      )
      setBishopId(member.leadsCampus[0].bishop?.id)
      sessionStorage.setItem('bishopId', member.leadsCampus[0].bishop?.id)
      return
    }
  }

  const clickCard = (card) => {
    determineStream(card)

    switch (card.__typename) {
      case 'Member':
        setMemberId(card.id)
        sessionStorage.setItem('memberId', card.id)
        break
      case 'Sonta':
        setSontaId(card.id)
        sessionStorage.setItem('sontaId', card.id)
        break
      case 'Bacenta':
        setBacentaId(card.id)
        sessionStorage.setItem('bacentaId', card.id)
        break
      case 'Centre':
        setCentreId(card.id)
        sessionStorage.setItem('centreId', card.id)
        break
      case 'Town':
        setTownId(card.id)
        sessionStorage.setItem('townId', card.id)
        break
      case 'Campus':
        setCampusId(card.id)
        sessionStorage.setItem('campusId', card.id)
        break
      case 'Basonta':
        setSontaId(card.sonta.id)
        sessionStorage.setItem('sontaId', card.sonta.id)
        break
      default:
        break
    }
    if (card.__typename === 'Basonta') {
      card.link = '/sonta/displaydetails'
    }
    if (card.__typename === 'Bishop') {
      setBishopId(card.id)
      card.link = '/dashboard'
    }
    if (card.link === '' || card.constituency === true) {
      card.link = `/${card.__typename.toLowerCase()}/displaydetails`
    }
  }

  // const version = 'v0/5/2'
  return (
    <Router>
      <ChurchContext.Provider
        value={{
          clickCard,
          determineStream,
          filters,
          setFilters,
          church,
          setChurch,
          bishopId,
          setBishopId,
          townId,
          setTownId,
          campusId,
          setCampusId,
          centreId,
          setCentreId,
          bacentaId,
          setBacentaId,
          sontaId,
          setSontaId,
          ministryId,
          setMinistryId,
        }}
      >
        <MemberContext.Provider
          value={{ memberId, setMemberId, currentUser, setCurrentUser }}
        >
          <SearchContext.Provider value={{ searchKey, setSearchKey }}>
            <Switch>
              {/* Landing Pages - Dashboards for Different Roles */}
              <ProtectedRouteHome
                path="/"
                roles={['adminFederal']}
                component={FederalAdminDashboard}
                exact
              />
              <ProtectedRouteHome
                path="/dashboard"
                component={BishopDashboard}
                roles={['adminFederal', 'adminBishop']}
                exact
              />
              <ProtectedRoute
                roles={['adminFederal', 'bacentaLeader']}
                path="/bacenta/report"
                component={BacentaReport}
              />
              {/* Member Display and Edit Pages */}
              <Route
                roles={['all']}
                path="/user-profile"
                component={UserProfileDisplayPage}
                exact
              />
              <ProtectedRoute
                roles={['all']}
                path="/member/displaydetails"
                component={DisplayMemberDetails}
                exact
              />
              <Route
                roles={['all']}
                path="/user-profile/edit"
                component={UserProfileEditPage}
                exact
              />
              <ProtectedRoute
                roles={['adminFederal', 'adminBishop', 'adminConstituency']}
                path="/member/addmember"
                component={CreateMember}
                exact
              />
              <ProtectedRoute
                roles={['adminFederal', 'adminBishop', 'adminConstituency']}
                path="/member/editmember"
                component={UpdateMember}
                exact
              />

              {/* Search Routes */}
              <ProtectedRoute
                roles={['all']}
                path="/member-search"
                component={SearchPageMobile}
                exact
              />
              <ProtectedRoute
                roles={['all']}
                path="/filter-members"
                component={MemberFiltersMobile}
                exact
              />
              {/* Member Grid Display Pages */}
              <ProtectedMembersRoute
                roles={['adminFederal', 'adminBishop']}
                path="/members"
                component={BishopMembers}
                exact
              />
              <ProtectedMembersRoute
                roles={['adminFederal', 'adminBishop']}
                path="/bishop/members"
                component={BishopMembers}
                exact
              />
              <ProtectedMembersRoute
                roles={['adminFederal', 'adminBishop', 'adminConstituency']}
                path="/campus/members"
                component={CampusTownMembers}
                exact
              />
              <ProtectedMembersRoute
                roles={['adminFederal', 'adminBishop', 'adminConstituency']}
                path="/town/members"
                component={CampusTownMembers}
                exact
              />
              <ProtectedMembersRoute
                roles={['adminFederal', 'adminBishop', 'adminConstituency']}
                path="/centre/members"
                component={CentreMembers}
                exact
              />
              <ProtectedMembersRoute
                roles={[
                  'adminFederal',
                  'adminBishop',
                  'adminConstituency',
                  'bacenta Leader',
                ]}
                path="/bacenta/members"
                component={BacentaMembers}
                exact
              />
              <ProtectedMembersRoute
                roles={['adminFederal', 'adminBishop', 'adminConstituency']}
                path="/sonta/members"
                component={SontaMembers}
                exact
              />
              <ProtectedMembersRoute
                roles={['adminFederal', 'adminBishop', 'adminConstituency']}
                path="/mb-members"
                component={MemberTableMobile}
                exact
              />
              <ProtectedRoute
                roles={['all']}
                path="/pastors"
                component={BishopMembers}
                exact
              />
              {/* Pages to Display Church Details  */}
              <ProtectedRoute
                roles={['all']}
                path="/bacenta/displaydetails"
                component={DisplayBacentaDetails}
                exact
              />
              <ProtectedRoute
                roles={['all']}
                path="/centre/displaydetails"
                component={DisplayCentreDetails}
                exact
              />
              <ProtectedRoute
                roles={['all']}
                path="/town/displaydetails"
                component={DisplayCampusTownDetails}
                exact
              />
              <ProtectedRoute
                roles={['all']}
                path="/campus/displaydetails"
                component={DisplayCampusTownDetails}
                exact
              />
              <ProtectedRoute
                roles={['all']}
                path="/sonta/displaydetails"
                component={DisplaySontaDetails}
                exact
              />
              {/* Pages to Display Lists in the Directory */}
              <ProtectedRoute
                roles={['all']}
                path="/centre/displayall"
                component={DisplayAllCentres}
                exact
              />
              <ProtectedRoute
                roles={['all']}
                path="/sonta/displayall"
                component={DisplayAllSontas}
                exact
              />
              <ProtectedRoute
                roles={['all']}
                path="/town/display-sontas"
                component={DisplaySontasByCampusTown}
                exact
              />
              <ProtectedRoute
                roles={['all']}
                path="/campus/display-sontas"
                component={DisplaySontasByCampusTown}
                exact
              />
              <ProtectedRoute
                roles={['adminFederal', 'adminBishop']}
                path="/town/displayall"
                component={DisplayAllTownCampuses}
                exact
              />
              <ProtectedRoute
                roles={['adminFederal', 'adminBishop']}
                path="/campus/displayall"
                component={DisplayAllTownCampuses}
                exact
              />
              <ProtectedRoute
                roles={['all']}
                path="/bacenta/displayall"
                component={DisplayAllBacentas}
                exact
              />
              {/* Pages to Create Directory  */}
              <ProtectedRoute
                roles={['adminFederal', 'adminBishop']}
                path="/town/addtown"
                component={CreateTownCampus}
                exact
              />
              <ProtectedRoute
                roles={['adminFederal', 'adminBishop']}
                path="/campus/addcampus"
                component={CreateTownCampus}
                exact
              />
              <ProtectedRoute
                roles={['adminFederal', 'adminBishop', 'adminConstituency']}
                path="/centre/addcentre"
                component={CreateCentre}
                exact
              />
              <ProtectedRoute
                roles={['adminFederal', 'adminBishop', 'adminConstituency']}
                path="/bacenta/addbacenta"
                component={CreateBacenta}
                exact
              />
              <ProtectedRoute
                roles={['adminFederal', 'adminBishop', 'adminConstituency']}
                path="/sonta/addsonta"
                component={CreateSonta}
                exact
              />
              {/* Pages to Update Directory */}
              <ProtectedRoute
                roles={['adminFederal', 'adminBishop', 'adminConstituency']}
                path="/bacenta/editbacenta"
                component={UpdateBacenta}
                exact
              />
              <ProtectedRoute
                roles={['adminFederal', 'adminBishop', 'adminConstituency']}
                path="/centre/editcentre"
                component={UpdateCentre}
                exact
              />
              <ProtectedRoute
                roles={['adminFederal', 'adminBishop']}
                path="/town/edittown"
                component={UpdateTownCampus}
                exact
              />
              <ProtectedRoute
                roles={['adminFederal', 'adminBishop']}
                path="/campus/editcampus"
                component={UpdateTownCampus}
                exact
              />
              {/* Bacenta Leader Routes */}
              <ProtectedRoute
                roles={['adminFederal', 'bacentaLeader']}
                path="/bacenta/record-service"
                component={BacentaService}
              />
            </Switch>
          </SearchContext.Provider>
        </MemberContext.Provider>
      </ChurchContext.Provider>
    </Router>
  )
}

const Main = () => (
  <Auth0Provider
    domain={process.env.REACT_APP_AUTH0_DOMAIN}
    clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
    redirectUri={window.location.origin}
    audience="https://flcadmin.netlify.app/graphql"
    scope
  >
    <AppWithApollo />
  </Auth0Provider>
)

ReactDOM.render(<Main />, document.getElementById('root'))
// registerServiceWorker()
