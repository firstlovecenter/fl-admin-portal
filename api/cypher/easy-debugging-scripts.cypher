MATCH (trans:CreditTransaction {transactionReference: "31ljknrjmjrwvgm"})-[]-(church)
SET trans.credited = false

RETURN SUM(church.downloadCredtis), SUM(church.downloadCredits) + 10


    MATCH (council:Council {id: $id})-[:HAS]->(constituency:Constituency)-[:HAS]->(bacenta:Bacenta)<-[:BELONGS_TO]-(members:Member)
    MATCH (constituency)<-[:LEADS]-(constituencyLeader:Member)
    MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Member)

    MATCH (members)-[:HAS_MARITAL_STATUS]->(maritalStatus:MaritalStatus)
    MATCH (members)-[:HAS_GENDER]->(gender:Gender)
    MATCH (members)-[:WAS_BORN_ON]->(dob:TimeGraph)


    RETURN council {
        .id,
        .name, 
        .downloadCredits,
        members: members {
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
                }
           
        }
    }

    }


    