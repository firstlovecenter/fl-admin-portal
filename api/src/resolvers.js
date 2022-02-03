const dotenv = require('dotenv')
const axios = require('axios').default
const cypher = require('./resolver-queries')
const texts = require('./texts.json')

dotenv.config()

let authToken
let authRoles = {}

const formData = require('form-data')
const Mailgun = require('mailgun.js')
const mailgun = new Mailgun(formData)
const mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY })

const notifyMember = (
  member,
  subject,
  body,
  html,
  whatsapp_template,
  whatsapp_placeholders
) => {
  if (whatsapp_template && member?.doWeHaveMoney) {
    //Send WhatsApp or Not
    const sendWhatsAppConfig = {
      method: 'post',
      baseURL: process.env.INFOBIP_BASE_URL,
      url: `/whatsapp/1/message/template`,
      headers: {
        Authorization: `App ${process.env.INFOBIP_API_KEY}`,
      },
      data: {
        messages: [
          {
            from: '233508947494', //First Love Number
            to: member.whatsappNumber, //Member's Number
            content: {
              templateName: whatsapp_template,
              templateData: {
                body: {
                  placeholders: whatsapp_placeholders,
                },
              },
              language: 'en_GB',
            },
            // callbackData: 'Callback data',
          },
        ],
      },
    }

    axios(sendWhatsAppConfig)
      .then(() =>
        console.log(
          'WhatsApp Message Sending to',
          member.firstName + ' ' + member.lastName
        )
      )
      .catch((error) => throwErrorMsg('WhatsApp Message Failed to Send', error))
  }

  mg.messages
    .create('mg.firstlovecenter.com', {
      from: 'FL Accra Admin <no-reply@firstlovecenter.org>',
      to: process.env.TEST_EMAIL_ADDRESS || [
        member.email,
        'admin@firstlovecenter.com',
      ],
      subject: subject,
      text: body,
      html: html || null, //HTML Version of the Message for Better Styling
    })
    .then((msg) => console.log('Mailgun API response', msg)) // logs response data
    .catch((err) => console.log('Mailgun API error', err)) // logs any error
}

const isAuth = (permittedRoles, userRoles) => {
  if (!permittedRoles.some((r) => userRoles.includes(r))) {
    throw 'You are not permitted to run this mutation'
  }
}
const noEmptyArgsValidation = (args) => {
  if (!args.length) {
    throwErrorMsg('args must be passed in array')
  }

  args.map((argument, index) => {
    if (!argument) {
      throwErrorMsg(`${args[index - 1]} Argument Cannot Be Empty`)
    }
  })
}
const throwErrorMsg = (message, error) => {
  let errorVar = ''

  if (error) {
    errorVar = error
  }
  if (error?.response?.data?.message) {
    errorVar = error?.response?.data?.message
  }

  console.error(message, errorVar)
  throw `${message} ${errorVar}`
}
const errorHandling = (member) => {
  if (!member.email) {
    throw `${member.firstName} ${member.lastName} does not have a valid email address. Please add an email address and then try again`
  }
  return
}
const rearrangeCypherObject = (response) => {
  let member = {}

  response.records[0]?.keys.forEach(
    (key, i) => (member[key] = response.records[0]._fields[i])
  )

  return member?.member || member
}
const parseForCache = (servant, church, verb, role) => {
  //Returning the data such that it can update apollo cache
  servant[`${verb}`].push({
    id: church.id,
    [`${role}`]: {
      id: servant.id,
      firstName: servant.firstName,
      lastName: servant.lastName,
    },
  })

  servant[`${verb}`].map((church) => {
    church[`${role}`] = {
      id: servant.id,
      firstName: servant.firstName,
      lastName: servant.lastName,
    }
  })

  return servant
}

const getTokenConfig = {
  method: 'post',
  url: `${process.env.AUTH0_BASE_URL}oauth/token`,
  headers: { 'content-type': 'application/json' },
  data: {
    client_id: process.env.AUTH0_MGMT_CLIENT_ID,
    client_secret: process.env.AUTH0_CLIENT_SECRET,
    audience: `${process.env.AUTH0_BASE_URL}api/v2/`,
    grant_type: 'client_credentials',
  },
}

axios(getTokenConfig)
  .then(async (res) => {
    authToken = res.data.access_token

    const getRolesConfig = {
      method: 'get',
      baseURL: process.env.AUTH0_BASE_URL,
      url: `/api/v2/roles`,
      headers: {
        autho: '',
        Authorization: `Bearer ${authToken}`,
      },
    }

    return axios(getRolesConfig)
  })
  .then((res) => {
    res.data.forEach(
      (role) =>
        (authRoles[role.name] = {
          id: role.id,
          name: role.name,
          description: role.description,
        })
    )
    console.log('Auth token obtained')
  })
  .catch((err) =>
    console.error('There was an error obtaining auth token', err?.data ?? err)
  )

const createAuthUserConfig = (member) => ({
  method: 'post',
  baseURL: process.env.AUTH0_BASE_URL,
  url: `/api/v2/users`,
  headers: {
    autho: '',
    Authorization: `Bearer ${authToken}`,
  },
  data: {
    connection: `flcadmin${process.env.TEST_ENV ? '-test' : ''}`,
    email: member.email,
    given_name: member.firstName,
    family_name: member.lastName,
    name: `${member.firstName} ${member.lastName}`,
    picture:
      member.pictureUrl ||
      'https://res.cloudinary.com/firstlovecenter/image/upload/v1627893621/user_qvwhs7.png',
    user_id: member.id,
    password: 'rAndoMLetteRs',
  },
})

const updateAuthUserConfig = (member) => ({
  method: 'patch',
  baseURL: process.env.AUTH0_BASE_URL,
  url: `/api/v2/users/${member.auth_id}`,
  headers: {
    autho: '',
    Authorization: `Bearer ${authToken}`,
  },
  data: {
    connection: `flcadmin${process.env.TEST_ENV ? '-test' : ''}`,
    email: member.email,
    given_name: member.firstName,
    family_name: member.lastName,
    name: `${member.firstName} ${member.lastName}`,
    picture:
      member.pictureUrl ||
      'https://raw.githubusercontent.com/jaedag/fl-admin-portal/deploy/web-react/src/assets/user.png',
  },
})

const changePasswordConfig = (member) => ({
  method: 'post',
  baseURL: process.env.AUTH0_BASE_URL,
  url: `/api/v2/tickets/password-change`,
  headers: {
    autho: '',
    Authorization: `Bearer ${authToken}`,
  },

  data: {
    connection_id: process.env.AUTH0_DB_CONNECTION_ID,
    email: member.email,
    mark_email_as_verified: true,
  },
})

const deleteAuthUserConfig = (memberId) => ({
  method: 'delete',
  baseURL: process.env.AUTH0_BASE_URL,
  url: `/api/v2/users/${memberId}`,
  headers: {
    autho: '',
    Authorization: `Bearer ${authToken}`,
  },
})

const getAuthIdConfig = (member) => ({
  method: 'get',
  baseURL: process.env.AUTH0_BASE_URL,
  url: `/api/v2/users-by-email?email=${member.email}`,
  headers: {
    autho: '',
    Authorization: `Bearer ${authToken}`,
  },
})
const getUserRoles = (memberId) => ({
  method: 'get',
  baseURL: process.env.AUTH0_BASE_URL,
  url: `/api/v2/users/${memberId}/roles`,
  headers: {
    autho: '',
    Authorization: `Bearer ${authToken}`,
  },
})
const setUserRoles = (memberId, roles) => ({
  method: 'post',
  baseURL: process.env.AUTH0_BASE_URL,
  url: `/api/v2/users/${memberId}/roles`,
  headers: {
    autho: '',
    Authorization: `Bearer ${authToken}`,
  },
  data: {
    roles: roles,
  },
})
const deleteUserRoles = (memberId, roles) => ({
  method: 'delete',
  baseURL: process.env.AUTH0_BASE_URL,
  url: `/api/v2/users/${memberId}/roles`,
  headers: {
    autho: '',
    Authorization: `Bearer ${authToken}`,
  },
  data: {
    roles: roles,
  },
})

const assignRoles = (servant, userRoles, rolesToAssign) => {
  const userRoleIds = userRoles.map((role) => authRoles[role].id)
  const nameOfRoles = Object.entries(authRoles)
    .map((role) => {
      if (rolesToAssign[0] === role[1].id) {
        return role[1].name
      }
    })
    .filter((role) => role)

  if (userRoleIds.includes(rolesToAssign[0])) {
    console.log(
      `${servant.firstName} ${servant.lastName} already has the role`,
      nameOfRoles[0]
    )
    return
  }

  //An assign roles function to simplify assigning roles with an axios request
  if (!userRoleIds.includes(rolesToAssign[0])) {
    return axios(setUserRoles(servant.auth_id, rolesToAssign))
      .then(() =>
        console.log(
          nameOfRoles[0],
          `role successfully added to ${servant.firstName} ${servant.lastName}`
        )
      )
      .catch((err) => throwErrorMsg('There was an error assigning role', err))
  }
  return
}
const removeRoles = (servant, userRoles, rolesToRemove) => {
  const userRoleIds = userRoles.map((role) => authRoles[role].id)

  //A remove roles function to simplify removing roles with an axios request
  if (userRoleIds.includes(rolesToRemove)) {
    return axios(deleteUserRoles(servant.auth_id, [rolesToRemove]))
      .then(() =>
        console.log(
          `Role successfully removed for ${servant.firstName} ${servant.lastName}`
        )
      )
      .catch((err) => throwErrorMsg('There was an error removing role', err))
  }
  return
}

const MakeServant = async (
  context,
  args,
  permittedRoles,
  churchType,
  servantType
) => {
  //Set Up
  let churchLower = churchType.toLowerCase().replace('arrivals', '')

  const servantLower = servantType.toLowerCase()
  isAuth(permittedRoles, context.auth.roles)
  noEmptyArgsValidation([
    `${churchLower}Id`,
    args[`${churchLower}Id`],
    `${servantLower}Id`,
    args[`${servantLower}Id`],
  ])

  let verb = `leads${churchType}`
  if (servantType === 'Admin') {
    verb = `isAdminFor${churchType}`
  }

  const session = context.driver.session()

  const churchResponse = await session.run(cypher.matchChurchQuery, {
    id: args[`${churchLower}Id`],
  })
  const church = rearrangeCypherObject(churchResponse)
  const churchInEmail = `${church.name} ${church.type[0]}`

  const servantResponse = await session.run(cypher.matchMemberQuery, {
    id: args[`${servantLower}Id`],
  })
  let servant = rearrangeCypherObject(servantResponse)

  errorHandling(servant)

  //Check for AuthID of servant
  const authIdResponse = await axios(getAuthIdConfig(servant))
  servant.auth_id = authIdResponse.data[0]?.user_id

  if (!servant.auth_id) {
    try {
      //If servant Does Not Have Auth0 Profile, Create One
      const authProfileResponse = await axios(createAuthUserConfig(servant))
      const passwordTicketResponse = await axios(changePasswordConfig(servant))
      // Send Mail to the Person after Password Change Ticket has been generated
      notifyMember(
        servant,
        'Your Account Has Been Created On The FL Admin Portal',
        null,
        `<p>Hi ${servant.firstName} ${servant.lastName},<br/><br/>Congratulations on being made the <b>${churchType} ${servantType}</b> for <b>${churchInEmail}</b>.<br/><br/>Your account has just been created on the First Love Church Administrative Portal. Please set up your password by clicking <b><a href=${passwordTicketResponse.data.ticket}>this link</a></b>. After setting up your password, you can log in by clicking <b>https://flcadmin.netlify.app/</b><br/><br/>Please go through ${texts.html.helpdesk} to find guidelines and instructions on how to use it as well as answers to questions you may have.</p>${texts.html.subscription}`,
        'servant_account_created',
        [servant.firstName, passwordTicketResponse?.data?.ticket]
      )

      servant.auth_id = authProfileResponse.data.user_id
      const roles = []

      assignRoles(servant, roles, [
        authRoles[`${servantLower}${churchType}`].id,
      ])
      console.log(
        `Auth0 Account successfully created for ${servant.firstName} ${servant.lastName}`
      )

      //Write Auth0 ID of Leader to Neo4j DB
      await session.run(cypher[`make${churchType}${servantType}`], {
        [`${servantLower}Id`]: servant.id,
        [`${churchLower}Id`]: church.id,
        auth_id: servant.auth_id,
        auth: context.auth,
      })
    } catch (error) {
      throwErrorMsg(error)
    }
  } else if (servant.auth_id) {
    //Update a user's Auth Profile with Picture and Name Details
    await axios(updateAuthUserConfig(servant))

    //Check auth0 roles and add roles 'leaderBacenta'
    const userRoleResponse = await axios(getUserRoles(servant.auth_id))
    const roles = userRoleResponse.data.map((role) => role.name)

    assignRoles(servant, roles, [authRoles[`${servantLower}${churchType}`].id])
    //Write Auth0 ID of Admin to Neo4j DB
    await session.run(cypher[`make${churchType}${servantType}`], {
      [`${servantLower}Id`]: servant.id,
      [`${churchLower}Id`]: church.id,
      auth_id: servant.auth_id,
      auth: context.auth,
    })

    //Send Email Using Mailgun
    notifyMember(
      servant,
      'FL Servanthood Status Update',
      null,
      `<p>Hi ${servant.firstName} ${servant.lastName},<br/><br/>Congratulations on your new position as the <b>${churchType} ${servantType}</b> for <b>${churchInEmail}</b>.<br/><br/>Once again we are reminding you to go through ${texts.html.helpdesk} to find guidelines and instructions as well as answers to questions you may have</p>${texts.html.subscription}`,
      'servant_status_update',
      [
        servant.firstName,
        churchType,
        servantType,
        church.name ?? `Bishop`,
        church.type[0] !== 'Member'
          ? church.type[0]
          : `${church.firstName} ${church.lastName}`,
      ]
    )
  }

  return parseForCache(servant, church, verb, servantLower)
}
const RemoveServant = async (
  context,
  args,
  permittedRoles,
  churchType,
  servantType
) => {
  //Set Up
  let churchLower = churchType.toLowerCase().replace('arrivals', '')

  const servantLower = servantType.toLowerCase()
  isAuth(permittedRoles, context.auth.roles)
  noEmptyArgsValidation([
    `${churchLower}Id`,
    args[`${churchLower}Id`],
    `${servantLower}Id`,
    args[`${servantLower}Id`],
  ])

  let verb = `leads${churchType}`
  if (servantType === 'Admin') {
    verb = `isAdminFor${churchType}`
  }

  const session = context.driver.session()

  const churchResponse = await session.run(cypher.matchChurchQuery, {
    id: args[`${churchLower}Id`],
  })
  const church = rearrangeCypherObject(churchResponse)

  const churchInEmail = () => {
    if (church.type[0] === 'ClosedFellowship') {
      return `${church.name} Fellowship which has been closed`
    }

    if (church.type[0] === 'ClosedBacenta') {
      return `${church.name} Bacenta which has been closed`
    }

    return `${church.name} ${church.type[0]}`
  }

  const servantResponse = await session.run(cypher.matchMemberQuery, {
    id: args[`${servantLower}Id`],
  })
  const servant = rearrangeCypherObject(servantResponse)

  if (Object.keys(servant).length === 0) {
    return
  }
  errorHandling(servant)

  if (!servant.auth_id) {
    //if he has no auth_id then there is nothing to do
    return
  }
  if (servant[`${verb}`].length > 1) {
    //If he leads more than one Church don't touch his Auth0 roles
    console.log(
      `${servant.firstName} ${servant.lastName} leads more than one ${churchType}`
    )

    //Send a Mail to That Effect
    notifyMember(
      servant,
      'You Have Been Removed!',
      `Hi ${servant.firstName} ${
        servant.lastName
      },\n\nWe regret to inform you that you have been removed as the ${churchType} ${servantType} for ${churchInEmail()}.\n\nWe however encourage you to strive to serve the Lord faithfully in your other roles. Do not be discouraged by this removal; as you work hard we hope and pray that you will soon be restored to your service to him.${
        texts.string.subscription
      }`,
      null,
      'servant_account_deleted',
      [servant.firstName, churchType, servantType, church.name, church.type[0]]
    )

    return
  }

  //Check auth0 roles and remove roles 'leaderBacenta'
  const userRoleResponse = await axios(getUserRoles(servant.auth_id))
  const roles = userRoleResponse.data.map((role) => role.name)

  //If the person is only a constituency Admin, delete auth0 profile
  if (roles.includes(`${servantLower}${churchType}`) && roles.length === 1) {
    await axios(deleteAuthUserConfig(servant.auth_id))

    console.log(
      `Auth0 Account successfully deleted for ${servant.firstName} ${servant.lastName}`
    )
    //Remove Auth0 ID of Leader from Neo4j DB
    await session.run(cypher.removeMemberAuthId, {
      log: `${servant.firstName} ${servant.lastName} was removed as a ${churchType} ${servantType}`,
      auth_id: servant.auth_id,
      auth: context.auth,
    })

    //Send a Mail to That Effect
    notifyMember(
      servant,
      'Your Servant Account Has Been Deleted',
      `Hi ${servant.firstName} ${
        servant.lastName
      },\n\nThis is to inform you that your servant account has been deleted from the First Love Admin Portal. You will no longer have access to any data\n\nThis is due to the fact that you have been removed as a ${churchType} ${servantType} for ${churchInEmail()}.\n\nWe however encourage you to strive to serve the Lord faithfully. Do not be discouraged from loving God by this removal; we hope it is just temporary.${
        texts.string.subscription
      }`,
      null
    )
    return
  }

  //If the person is a bacenta leader as well as any other position, remove role bacenta leader
  if (roles.includes(`${servantLower}${churchType}`) && roles.length > 1) {
    removeRoles(servant, roles, authRoles[`${servantLower}${churchType}`].id)
    //Send Email Using Mailgun
    notifyMember(
      servant,
      'You Have Been Removed!',
      `Hi ${servant.firstName} ${
        servant.lastName
      },\n\nWe regret to inform you that you have been removed as the ${churchType} ${servantType} for ${churchInEmail()}.\n\nWe however encourage you to strive to serve the Lord faithfully in your other roles. Do not be discouraged by this removal; as you work hard we hope and pray that you will soon be restored to your service to him.${
        texts.string.subscription
      }`
    )
  }

  //Relationship in Neo4j will be removed when the replacement leader is being added
  return parseForCache(servant, church, verb, servantLower)
}

const getComponentServiceAggregates = async (obj, context) => {
  let serviceAggregates = []

  const session = context.driver.session()
  const serviceAggregateResponse = await session.run(
    cypher.getComponentServiceAggregates,
    obj
  )

  serviceAggregateResponse.records.map((record) => {
    let serviceAggregate = {}

    record.keys.forEach((key, i) => (serviceAggregate[key] = record._fields[i]))
    serviceAggregates.push(serviceAggregate)
  })

  return serviceAggregates
}

export const resolvers = {
  // Resolver Parameters
  // Object: the parent result of a previous resolver
  // Args: Field Arguments
  // Context: Context object, database connection, API, etc
  // GraphQLResolveInfo
  Member: {
    fullName: (obj) => {
      return `${obj.firstName} ${obj.lastName}`
    },
  },
  Bacenta: {
    componentServiceAggregate: async (obj, args, context) => {
      return getComponentServiceAggregates(obj, context)
    },
  },
  Constituency: {
    componentServiceAggregate: (obj, args, context) => {
      return getComponentServiceAggregates(obj, context)
    },
  },
  Council: {
    componentServiceAggregate: (obj, args, context) => {
      return getComponentServiceAggregates(obj, context)
    },
  },
  Stream: {
    componentServiceAggregate: (obj, args, context) => {
      return getComponentServiceAggregates(obj, context)
    },
  },
  GatheringService: {
    componentServiceAggregate: (obj, args, context) => {
      return getComponentServiceAggregates(obj, context)
    },
  },

  Mutation: {
    CreateMember: async (object, args, context) => {
      isAuth(
        [
          'adminGatheringService',
          'adminCouncil',
          'adminConstituency',
          'leaderFellowship',
          'leaderBacenta',

          'leaderConstituency',
        ],
        context.auth.roles
      )

      const session = context.driver.session()
      const memberResponse = await session.run(
        cypher.checkMemberEmailExists,
        args
      )

      const memberCheck = rearrangeCypherObject(memberResponse)

      if (memberCheck.email || memberCheck.whatsappNumber) {
        throwErrorMsg(
          'A member with this email address/whatsapp number already exists in the database',
          ''
        )
      }

      const createMemberResponse = await session.run(cypher.createMember, {
        firstName: args?.firstName ?? '',
        middleName: args?.middleName ?? '',
        lastName: args?.lastName ?? '',
        email: args?.email ?? '',
        phoneNumber: args?.phoneNumber ?? '',
        whatsappNumber: args?.whatsappNumber ?? '',
        dob: args?.dob ?? '',
        maritalStatus: args?.maritalStatus ?? '',
        gender: args?.gender ?? '',
        occupation: args?.occupation ?? '',
        fellowship: args?.fellowship ?? '',
        ministry: args?.ministry ?? '',
        pictureUrl: args?.pictureUrl ?? '',
        auth_id: context.auth.jwt.sub ?? '',
      })

      const member = rearrangeCypherObject(createMemberResponse)

      return member
    },
    CloseDownFellowship: async (object, args, context) => {
      isAuth(
        [
          'adminGatheringService',
          'adminStream',
          'adminCouncil',
          'adminConstituency',
          'leaderConstituency',
        ],
        context.auth.roles
      )

      const session = context.driver.session()

      try {
        const fellowshipCheckResponse = await session.run(
          cypher.checkFellowshipHasNoMembers,
          args
        )
        const fellowshipCheck = rearrangeCypherObject(fellowshipCheckResponse)

        if (fellowshipCheck.memberCount) {
          throwErrorMsg(
            `${fellowshipCheck?.name} Fellowship has ${fellowshipCheck?.memberCount} members. Please transfer all members and try again.`
          )
        }

        //Fellowship Leader must be removed since the fellowship is being closed down
        await RemoveServant(
          context,
          args,
          [
            'adminGatheringService',
            'adminStream',
            'adminCouncil',
            'adminConstituency',
          ],
          'Fellowship',
          'Leader'
        )

        const closeFellowshipResponse = await session.run(
          cypher.closeDownFellowship,
          {
            auth: context.auth,
            fellowshipId: args.fellowshipId,
          }
        )

        const fellowshipResponse = rearrangeCypherObject(
          closeFellowshipResponse
        ) //Returns a Bacenta

        return fellowshipResponse.bacenta
      } catch (error) {
        throwErrorMsg(error)
      }
    },

    CloseDownBacenta: async (object, args, context) => {
      isAuth(
        [
          'adminGatheringService',
          'adminStream',
          'adminCouncil',
          'adminConstituency',
        ],
        context.auth.roles
      )

      const session = context.driver.session()

      try {
        const bacentaCheckResponse = await session.run(
          cypher.checkBacentaHasNoMembers,
          args
        )
        const bacentaCheck = rearrangeCypherObject(bacentaCheckResponse)

        if (bacentaCheck.memberCount) {
          throwErrorMsg(
            `${bacentaCheck?.name} Bacenta has ${bacentaCheck?.fellowshipCount} active fellowships. Please close down all fellowships and try again.`
          )
        }

        //Bacenta Leader must be removed since the Bacenta is being closed down
        await RemoveServant(
          context,
          args,
          [
            'adminGatheringService',
            'adminStream',
            'adminCouncil',
            'adminConstituency',
          ],
          'Bacenta',
          'Leader'
        )

        const closeBacentaResponse = await session.run(
          cypher.closeDownBacenta,
          {
            auth: context.auth,
            bacentaId: args.bacentaId,
          }
        )

        const bacentaResponse = rearrangeCypherObject(closeBacentaResponse)
        return bacentaResponse.constituency
      } catch (error) {
        throwErrorMsg(error)
      }
    },

    //Administrative Mutations
    MakeStreamAdmin: async (object, args, context) => {
      return MakeServant(
        context,
        args,
        ['adminGatheringService'],
        'Stream',
        'Admin'
      )
    },
    RemoveStreamAdmin: async (object, args, context) => {
      return RemoveServant(
        context,
        args,
        ['adminGatheringService'],
        'Stream',
        'Admin'
      )
    },
    MakeCouncilAdmin: async (object, args, context) => {
      return MakeServant(
        context,
        args,
        ['adminGatheringService', 'adminStream'],
        'Council',
        'Admin'
      )
    },
    RemoveCouncilAdmin: async (object, args, context) => {
      return RemoveServant(
        context,
        args,
        ['adminGatheringService', 'adminStream'],
        'Council',
        'Admin'
      )
    },
    MakeConstituencyAdmin: async (object, args, context) => {
      return MakeServant(
        context,
        args,
        ['adminGatheringService', 'adminStream', 'adminStream', 'adminCouncil'],
        'Constituency',
        'Admin'
      )
    },
    RemoveConstituencyAdmin: async (object, args, context) => {
      return RemoveServant(
        context,
        args,
        ['adminGatheringService', 'adminStream', 'adminCouncil'],
        'Constituency',
        'Admin'
      )
    },

    //Pastoral Mutations
    MakeFellowshipLeader: async (object, args, context) => {
      return MakeServant(
        context,
        args,
        [
          'adminGatheringService',
          'adminStream',
          'adminCouncil',
          'adminConstituency',
        ],
        'Fellowship',
        'Leader'
      )
    },
    RemoveFellowshipLeader: async (object, args, context) => {
      return RemoveServant(
        context,
        args,
        [
          'adminGatheringService',
          'adminStream',
          'adminCouncil',
          'adminConstituency',
        ],
        'Fellowship',
        'Leader'
      )
    },
    MakeSontaLeader: async (object, args, context) => {
      return MakeServant(
        context,
        args,
        [
          'adminGatheringService',
          'adminStream',
          'adminCouncil',
          'adminConstituency',
        ],
        'Sonta',
        'Leader'
      )
    },
    RemoveSontaLeader: (object, args, context) => {
      return RemoveServant(
        context,
        args,
        [
          'adminGatheringService',
          'adminStream',
          'adminCouncil',
          'adminConstituency',
        ],
        'Sonta',
        'Leader'
      )
    },
    MakeBacentaLeader: async (object, args, context) => {
      return MakeServant(
        context,
        args,
        [
          'adminGatheringService',
          'adminStream',
          'adminCouncil',
          'adminConstituency',
        ],
        'Bacenta',
        'Leader'
      )
    },
    RemoveBacentaLeader: async (object, args, context) => {
      return RemoveServant(
        context,
        args,
        [
          'adminGatheringService',
          'adminStream',
          'adminCouncil',
          'adminConstituency',
        ],
        'Bacenta',
        'Leader'
      )
    },
    MakeConstituencyLeader: async (object, args, context) => {
      return MakeServant(
        context,
        args,
        ['adminGatheringService', 'adminStream', 'adminCouncil'],
        'Constituency',
        'Leader'
      )
    },
    RemoveConstituencyLeader: async (object, args, context) => {
      return RemoveServant(
        context,
        args,
        ['adminGatheringService', 'adminStream', 'adminCouncil'],
        'Constituency',
        'Leader'
      )
    },
    MakeCouncilLeader: async (object, args, context) => {
      return MakeServant(
        context,
        args,
        ['adminGatheringService', 'adminStream'],
        'Council',
        'Leader'
      )
    },
    RemoveCouncilLeader: async (object, args, context) => {
      return RemoveServant(
        context,
        args,
        ['adminGatheringService', 'adminStream'],
        'Council',
        'Leader'
      )
    },
    MakeStreamLeader: async (object, args, context) => {
      return MakeServant(
        context,
        args,
        ['adminGatheringService'],
        'Stream',
        'Leader'
      )
    },
    RemoveStreamLeader: async (object, args, context) => {
      return RemoveServant(
        context,
        args,
        ['adminGatheringService'],
        'Stream',
        'Leader'
      )
    },
    MakeGatheringServiceLeader: async (object, args, context) => {
      return MakeServant(
        context,
        args,
        ['adminGatheringService'],
        'GatheringService',
        'Leader'
      )
    },
    RemoveGatheringServiceLeader: async (object, args, context) => {
      return RemoveServant(
        context,
        args,
        ['adminGatheringService'],
        'GatheringService',
        'Leader'
      )
    },
    //Arrivals Mutations
    MakeConstituencyArrivalsAdmin: async (object, args, context) => {
      return MakeServant(
        context,
        args,
        [
          'adminGatheringService',
          'adminStream',
          'adminCouncil',
          'adminConstituency',
        ],
        'ConstituencyArrivals',
        'Admin'
      )
    },
  },
}
