"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamDownloadMembers = exports.councilDownloadMembers = void 0;
exports.councilDownloadMembers = `
    MATCH (council:Council {id: $id})-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)<-[:BELONGS_TO]-(members:Active:Member)
    MATCH (governorship)<-[:LEADS]-(governorshipLeader:Member)
    MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Member)

    MATCH (members)-[:HAS_MARITAL_STATUS]->(maritalStatus:MaritalStatus)
    MATCH (members)-[:HAS_GENDER]->(gender:Gender)
    MATCH (members)-[:WAS_BORN_ON]->(dob:TimeGraph)
    OPTIONAL MATCH (members)-[:BELONGS_TO]->(basonta:Basonta)


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
            basonta: basonta {
                .id,
                .name
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
                governorship: governorship{
                    .id,
                    .name,
                    leader: governorshipLeader {
                        .id,
                        .firstName,
                        .lastName,
                        fullName: governorshipLeader.firstName + ' ' + governorshipLeader.lastName
                    }
                }
            }
    }) AS members, council
`;
exports.StreamDownloadMembers = ``;
