export const councilDownloadMembers = `
    MATCH (council:Council {id: $id})-[:HAS]->(constituency:Constituency)-[:HAS]->(bacenta:Bacenta)<-[:BELONGS_TO]-(members:Member)
    MATCH (constituency)<-[:LEADS]-(constituencyLeader:Member)
    MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Member)

    MATCH (members)-[:HAS_MARITAL_STATUS]->(maritalStatus:MaritalStatus)
    MATCH (members)-[:HAS_GENDER]->(gender:Gender)
    MATCH (members)-[:WAS_BORN_ON]->(dob:TimeGraph)


    RETURN collect(members {
            .id,
            .firstName,
            .lastName,
            .phoneNumber,
            .whatsappNumber,
            .email,
            .visitationArea,
            maritalStatus: maritalStatus {
                .status
            },
            gender: gender {
                .gender
            },
            dob: dob {
                .date
            },
            bacenta: bacenta {
                .id,
                .name,
                leader: bacentaLeader {
                    .id,
                    .firstName,
                    .lastName,
                    fullName: bacentaLeader.firstName + ' ' + bacentaLeader.lastName
                },
                constituency: constituency{
                    .id,
                    .name,
                    leader: constituencyLeader {
                        .id,
                        .firstName,
                        .lastName,
                        fullName: constituencyLeader.firstName + ' ' + constituencyLeader.lastName
                    }
                }
            }
    }) AS members, council
`

export const StreamDownloadMembers = ``
