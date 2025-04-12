const { newMembersListQuery } = require('../cypher')
const { CAMPUS_NAME } = require('../utils/constants')

const newMembersList = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(newMembersListQuery, {
        campusName: CAMPUS_NAME,
      })
    )

    const headerRow = [
      'Stream',
      'Council',
      'Bishop',
      'Governor',
      'Governorship',
      'Bacenta Leader',
      'Member First Name',
      'Member Last Name',
      'Member Phone Number',
      'Member Whatsapp Number',
      'Registration Date',
    ]

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('Stream'),
        record.get('Council'),
        record.get('Bishop'),
        record.get('Governor'),
        record.get('Governorship'),
        record.get('BacentaLeader'),
        record.get('MemberFirstName'),
        record.get('MemberLastName'),
        record.get('MemberPhoneNumber'),
        record.get('MemberWhatsappNumber'),
        record.get('RegistrationDate'),
      ]),
    ]

    return returnValues
  } catch (error) {
    console.error('Error reading data from the DB', error)
  } finally {
    await session.close()
  }

  return []
}

module.exports = { newMembersList }
module.exports.default = newMembersList
