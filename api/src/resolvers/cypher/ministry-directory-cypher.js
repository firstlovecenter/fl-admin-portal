"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchMemberHubQuery = exports.matchMemberHubCouncilQuery = exports.matchMemberMinistryQuery = exports.matchMemberCreativeArtsQuery = void 0;
exports.matchMemberCreativeArtsQuery = `
  WITH apoc.cypher.runFirstColumnMany(  
    "MATCH (member:Member {id:$id})
    RETURN member", {offset:0, first:5, id: $id}, True) AS x UNWIND x AS member
    RETURN member { .id,.auth_id, .firstName,.lastName,.email,.phoneNumber,.whatsappNumber,.pictureUrl,
    leadsCreativeArts: [ member_creativeArts IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:LEADS]->(creativeArts:CreativeArts)
    RETURN creativeArts", {this:member}, true) | member_creativeArts {.id, .name}],
    isAdminForCreativeArts: [ member_creativeArts IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:IS_ADMIN_FOR]->(creativeArts:CreativeArts)
    RETURN creativeArts", {this:member}, true) | member_creativeArts {.id, .name}]} AS member
  `;
exports.matchMemberMinistryQuery = `
    WITH apoc.cypher.runFirstColumnMany(
        "MATCH (member:Member {id:$id})
        RETURN member", {offset:0, first:5, id: $id}, True) AS x UNWIND x AS member
        RETURN member { .id,.auth_id, .firstName,.lastName,.email,.phoneNumber,.whatsappNumber,.pictureUrl,
        leadsMinistry: [ member_ministry IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:LEADS]->(ministry:Ministry)
        RETURN ministry", {this:member}, true) | member_ministry {.id, .name}],
        isAdminForMinistry: [ member_ministry IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:IS_ADMIN_FOR]->(ministry:Ministry)
        RETURN ministry", {this:member}, true) | member_ministry {.id, .name}]} AS member
    `;
exports.matchMemberHubCouncilQuery = `
    WITH apoc.cypher.runFirstColumnMany(
        "MATCH (member:Member {id:$id})
        RETURN member", {offset:0, first:5, id: $id}, True) AS x UNWIND x AS member
        RETURN member { .id,.auth_id, .firstName,.lastName,.email,.phoneNumber,.whatsappNumber,.pictureUrl,
        leadsHubCouncil: [ member_hubCouncil IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:LEADS]->(hubCouncil:HubCouncil)
        RETURN hubCouncil", {this:member}, true) | member_hubCouncil {.id, .name}]} AS member
    `;
exports.matchMemberHubQuery = `
    WITH apoc.cypher.runFirstColumnMany(
        "MATCH (member:Member {id:$id})
        RETURN member", {offset:0, first:5, id: $id}, True) AS x UNWIND x AS member
        RETURN member { .id,.auth_id, .firstName,.lastName,.email,.phoneNumber,.whatsappNumber,.pictureUrl,
        leadsHub: [ member_hub IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:LEADS]->(hub:Hub)
        RETURN hub", {this:member}, true) | member_hub {.id, .name}]} AS member
    `;
