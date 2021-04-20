import React, { useState, useCallback, useEffect } from 'react'
import ReactDOM from 'react-dom'
// import registerServiceWorker from './registerServiceWorker'
import { Switch, BrowserRouter as Router } from 'react-router-dom'
import {
  ApolloProvider,
  ApolloClient,
  createHttpLink,
  InMemoryCache,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import './index.css'
import BishopSelect from './pages/BishopSelect'
import BishopDashboard from './pages/BishopDashboard'
import { BishopMembers } from './pages/grids/BishopMembers'
import { CampusTownMembers } from './pages/grids/CampusTownMembers'
import { CentreMembers } from './pages/grids/CentreMembers'
import { BacentaMembers } from './pages/grids/BacentaMembers.js'
import { SontaMembers } from './pages/grids/SontaMembers'
import { SearchPageMobile } from './pages/SearchPageMobile'
import { DisplayMemberDetails } from './pages/DisplayMemberDetails'
import { CreateMember } from './pages/CreateMember'
import { UpdateMemberDetails } from './pages/UpdateMemberDetails'
import CreateCentre from './pages/CreateCentre'
import CreateTownCampus from './pages/CreateTownCampus'
import { UpdateTownCampus } from './pages/UpdateTownCampus'
import { DisplayBacentaDetails } from './pages/DisplayBacentaDetails'
import { DisplayCentreDetails } from './pages/DisplayCentreDetails'
import { DisplayCampusTownDetails } from './pages/DisplayCampusTownDetails'
import { DisplaySontaDetails } from './pages/DisplaySontaDetails'
import { MemberContext, SearchContext } from './contexts/MemberContext'
import { ChurchContext } from './contexts/ChurchContext'
import { DisplayAllBacentas } from './pages/DisplayAllBacentas'
import { DisplayAllCentres } from './pages/DisplayAllCentres'
import { DisplayAllSontas } from './pages/DisplayAllSontas'
import { DisplayAllTownCampuses } from './pages/DisplayAllTownCampuses'
import { CreateBacenta } from './pages/CreateBacenta'
import { UpdateCentre } from './pages/UpdateCentre'
import { DisplaySontasByCampusTown } from './pages/DisplaySontasByCampusTown'
import { UpdateBacenta } from './pages/UpdateBacenta'
import ProtectedRoute from './auth/ProtectedRoute'
import ProtectedRouteHome from './auth/ProtectedRouteHome'
import ProtectedMembersRoute from './auth/ProtectedMembersRoute'
import { MemberFiltersMobile } from './pages/MemberFiltersMobile'
import { MemberTableMobile } from './components/MemberTableMobile'

const AppWithApollo = () => {
  const [accessToken, setAccessToken] = useState()
  const { getAccessTokenSilently, isLoading, loginWithRedirect } = useAuth0()

  const getAccessToken = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently()
      setAccessToken(token)
      sessionStorage.setItem('token', token)
    } catch (err) {
      !isLoading && loginWithRedirect()
    }
  }, [getAccessTokenSilently, loginWithRedirect, isLoading])

  useEffect(() => {
    getAccessToken()
  }, [getAccessToken])

  const httpLink = createHttpLink({
    uri: process.env.REACT_APP_GRAPHQL_URI || '/graphql',
  })

  const authLink = setContext((_, { headers }) => {
    // get the authentication token from local storage if it exists
    const token = sessionStorage.getItem('token')
      ? sessionStorage.getItem('token')
      : accessToken

    // return the headers to the context so httpLink can read them
    return {
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`,
      },
    }
  })

  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            displayMember(_, { args, toReference }) {
              return toReference({
                __typename: 'Member',
                id: args.id,
              })
            },
          },
        },
      },
    }),
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
      : { church: 'town', subChurch: 'centre' }
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
    firstName: '',
    lastName: '',
    email: '',
    bishop: '',
    constituency: '',
    roles: [''],
  })

  const [searchKey, setSearchKey] = useState('a')
  const [filters, setFilters] = useState({
    gender: '',
    maritalStatus: '',
    occupation: '',
    leaderTitle: [],
    leaderRank: [],
    ministry: '',
  })

  const determineChurch = (member) => {
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

    if (!member.bacenta) {
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
    determineChurch(card)

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
      default:
        break
    }

    if (card.link === '') {
      card.link = `/${card.__typename.toLowerCase()}/displaydetails`
    }
  }

  return (
    <Router>
      <ChurchContext.Provider
        value={{
          clickCard,
          determineChurch,
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
          value={{
            memberId,
            setMemberId,
            currentUser,
            setCurrentUser,
          }}
        >
          <SearchContext.Provider value={{ searchKey, setSearchKey }}>
            <Switch>
              <ProtectedRouteHome
                path="/"
                roles={['superAdmin']}
                component={BishopSelect}
                exact
              />
              <ProtectedRouteHome
                path="/dashboard"
                component={BishopDashboard}
                roles={['superAdmin', 'bishopAdmin']}
                exact
              />
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

              <ProtectedMembersRoute
                path="/members"
                roles={['superAdmin', 'bishopAdmin']}
                component={BishopMembers}
                exact
              />
              <ProtectedMembersRoute
                roles={['superAdmin', 'bishopAdmin']}
                path="/campus/members"
                component={CampusTownMembers}
                exact
              />
              <ProtectedMembersRoute
                roles={['superAdmin', 'bishopAdmin', 'coAdmin']}
                path="/town/members"
                component={CampusTownMembers}
                exact
              />
              <ProtectedMembersRoute
                roles={['superAdmin', 'bishopAdmin', 'coAdmin']}
                path="/centre/members"
                component={CentreMembers}
                exact
              />
              <ProtectedMembersRoute
                roles={['superAdmin', 'bishopAdmin', 'coAdmin']}
                path="/bacenta/members"
                component={BacentaMembers}
                exact
              />
              <ProtectedMembersRoute
                roles={['superAdmin', 'bishopAdmin', 'coAdmin']}
                path="/sonta/members"
                component={SontaMembers}
                exact
              />
              <ProtectedMembersRoute
                roles={['superAdmin', 'bishopAdmin', 'coAdmin']}
                path="/mb-members"
                component={MemberTableMobile}
                exact
              />
              <ProtectedMembersRoute
                roles={['superAdmin', 'bishopAdmin', 'coAdmin']}
                path="/pastors"
                component={BishopMembers}
                exact
              />
              <ProtectedRoute
                roles={['superAdmin', 'bishopAdmin', 'coAdmin']}
                path="/member/addmember"
                component={CreateMember}
                exact
              />
              <ProtectedRoute
                roles={['superAdmin', 'bishopAdmin', 'coAdmin']}
                path="/member/editmember"
                component={UpdateMemberDetails}
                exact
              />
              <ProtectedRoute
                roles={['all']}
                path="/member/displaydetails"
                component={DisplayMemberDetails}
                exact
              />
              <ProtectedRoute
                roles={['all']}
                path="/sonta/displaydetails"
                component={DisplaySontaDetails}
                exact
              />
              <ProtectedRoute
                roles={['superAdmin', 'bishopAdmin', 'coAdmin']}
                path="/bacenta/addbacenta"
                component={CreateBacenta}
                exact
              />
              <ProtectedRoute
                roles={['superAdmin', 'bishopAdmin', 'coAdmin']}
                path="/bacenta/editbacenta"
                component={UpdateBacenta}
                exact
              />
              <ProtectedRoute
                roles={['all']}
                path="/bacenta/displaydetails"
                component={DisplayBacentaDetails}
                exact
              />
              <ProtectedRoute
                roles={['all']}
                path="/bacenta/displayall"
                component={DisplayAllBacentas}
                exact
              />
              <ProtectedRoute
                roles={['all']}
                path="/centre/displaydetails"
                component={DisplayCentreDetails}
                exact
              />
              <ProtectedRoute
                roles={['superAdmin', 'bishopAdmin', 'coAdmin']}
                path="/centre/addcentre"
                component={CreateCentre}
                exact
              />
              <ProtectedRoute
                roles={['superAdmin', 'bishopAdmin', 'coAdmin']}
                path="/centre/editcentre"
                component={UpdateCentre}
                exact
              />
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
                roles={['all']}
                path="/town/displayall"
                component={DisplayAllTownCampuses}
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
                path="/campus/displayall"
                component={DisplayAllTownCampuses}
                exact
              />
              <ProtectedRoute
                roles={['all']}
                path="/campus/displaydetails"
                component={DisplayCampusTownDetails}
                exact
              />
              <ProtectedRoute
                roles={['superAdmin', 'bishopAdmin']}
                path="/town/addtown"
                component={CreateTownCampus}
                exact
              />
              <ProtectedRoute
                roles={['superAdmin', 'bishopAdmin']}
                path="/campus/addcampus"
                component={CreateTownCampus}
                exact
              />
              <ProtectedRoute
                roles={['superAdmin', 'bishopAdmin']}
                path="/town/edittown"
                component={UpdateTownCampus}
                exact
              />
              <ProtectedRoute
                roles={['superAdmin', 'bishopAdmin']}
                path="/campus/editcampus"
                component={UpdateTownCampus}
                exact
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
  >
    <AppWithApollo />
  </Auth0Provider>
)

ReactDOM.render(<Main />, document.getElementById('root'))
// registerServiceWorker()
