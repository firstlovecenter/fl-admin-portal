export const fellowshipDownloadMembers = `
    MATCH (fellowship:Fellowship {id: $id})<-[:BELONGS_TO]-(members:Active:Member)
    MATCH (fellowship)<-[:LEADS]-(fellowshipLeader:Member)
    MATCH (fellowship)<-[:HAS]-(bacenta:Bacenta)
    MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Member)
    MATCH (bacenta)<-[:HAS]-(governorship:Governorship)
    MATCH (governorship)<-[:LEADS]-(governorshipLeader:Member)

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
            fellowship: fellowship {
                .id,
                .name,
                leader: fellowshipLeader {
                    .id,
                    .firstName,
                    .lastName,
                    fullName: fellowshipLeader.firstName + ' ' + fellowshipLeader.lastName
                }
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
    }) AS members
`

export const bacentaDownloadMembers = `
    MATCH (bacenta:Bacenta {id: $id})<-[:BELONGS_TO]-(members:Active:Member)
    MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Member)
    MATCH (bacenta)<-[:HAS]-(governorship:Governorship)
    MATCH (governorship)<-[:LEADS]-(governorshipLeader:Member)

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
    }) AS members
`

export const governorshipDownloadMembers = `
    MATCH (governorship:Governorship {id: $id})-[:HAS]->(bacenta:Bacenta)<-[:BELONGS_TO]-(members:Active:Member)
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
    }) AS members
`

export const councilDownloadMembers = `
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
    }) AS members
`

export const streamDownloadMembers = `
    MATCH (stream:Stream {id: $id})-[:HAS]->(council:Council)-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)<-[:BELONGS_TO]-(members:Active:Member)
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
    }) AS members
`

export const campusDownloadMembers = `
    MATCH (campus:Campus {id: $id})-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)<-[:BELONGS_TO]-(members:Active:Member)
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
    }) AS members
`

export const oversightDownloadMembers = `
    MATCH (oversight:Oversight {id: $id})-[:HAS]->(campus:Campus)-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)<-[:BELONGS_TO]-(members:Active:Member)
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
    }) AS members
`
