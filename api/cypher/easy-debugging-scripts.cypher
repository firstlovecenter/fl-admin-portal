CALL {
       MATCH (member:Active:Member {email:$param0}) RETURN member LIMIT 1
   }
   WITH member AS this0
   CALL {
       WITH this0
       MATCH (this0)-[this1:BELONGS_TO]->(this2:Bacenta)
       CALL {
           WITH this2
           MATCH (this2)<-[this3:HAS]-(this4:Governorship)
           CALL {
               WITH this4
               MATCH (this4)<-[this5:HAS]-(this6:Council)
               CALL {
                   WITH this6
                   MATCH (this6)<-[this7:HAS]-(this8:Stream)
                   CALL {
                       WITH this8
                       MATCH (this8)<-[this9:HAS]-(this10:Campus)
                       CALL {
                           WITH this10
                           MATCH (this10)<-[this11:HAS]-(this12:Oversight)
                           CALL {
                               WITH this12
                               MATCH (this12)<-[this13:HAS]-(this14:Denomination)
                               WITH this14 { .id } AS this14
                               RETURN head(collect(this14)) AS var15
                           }
                           WITH this12 { .id, denomination: var15 } AS this12
                           RETURN head(collect(this12)) AS var16
                       }
                       WITH this10 { .id, .noIncomeTracking, .currency, .conversionRateToDollar, oversight: var16 } AS this10
                       RETURN head(collect(this10)) AS var17
                   }
                   WITH this8 { .id, campus: var17 } AS this8
                   RETURN head(collect(this8)) AS var18
               }
               WITH this6 { .id, stream: var18 } AS this6
               RETURN head(collect(this6)) AS var19
           }
           WITH this4 { .id, council: var19 } AS this4
           RETURN head(collect(this4)) AS var20
       }
       WITH this2 { .id, governorship: var20 } AS this2
       RETURN head(collect(this2)) AS var21
   }
   CALL {
       WITH this0
       CALL {
           WITH this0
           WITH this0 AS this
           MATCH (this)-[r:HAS_TITLE]->(title:Title)
           WHERE NOT r.inactive = true
           RETURN title.name AS currentTitle ORDER BY title.priority DESC LIMIT 1
       }
       WITH currentTitle AS this22
       RETURN this22 AS var23
   }
   CALL {
       WITH this0
       CALL {
           WITH this0
           WITH this0 AS this
           MATCH (this)-[:BELONGS_TO]->(:Fellowship)<-[:HAS*4]-(stream:Stream)
           RETURN DISTINCT toLower(stream.name) as stream
       }
       WITH stream AS this24
       RETURN this24 AS var25
   }
   WITH this0 { .id, .firstName, .lastName, .pictureUrl, currentTitle: var23, stream_name: var25, bacenta: var21 } AS this0
   RETURN this0 AS this