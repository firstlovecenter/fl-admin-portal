#### 8.1.3 (2025-09-06)

##### Chores

- update frontend deployment ([d1cc34f9](https://github.com/firstlovecenter/fl-admin-portal/commit/d1cc34f9b65fc78c82ac2840a5b07c3fca85b314))

##### Documentation Changes

- update deploy workflows commit message ([fa391590](https://github.com/firstlovecenter/fl-admin-portal/commit/fa391590be25c810c16c2e08b4656248eec3531d))

##### New Features

- integrate CloudinaryImage component and enhance image styling ([2dda48ef](https://github.com/firstlovecenter/fl-admin-portal/commit/2dda48ef24454504e218b2a0afd35f581a1d967a))
- implement S3 image upload functionality with presigned URLs ([6b13a5b9](https://github.com/firstlovecenter/fl-admin-portal/commit/6b13a5b92a50b3b023250bb13b4e81fe310a66c3))

##### Bug Fixes

- enhance S3 deployment with proper cache control for static assets and HTML files ([9f29cbe6](https://github.com/firstlovecenter/fl-admin-portal/commit/9f29cbe63580897955a943abfd22391fdcd9a954))

##### Refactors

- simplify CloudinaryImage component by removing unused ([16a7731b](https://github.com/firstlovecenter/fl-admin-portal/commit/16a7731b27afb14fdce4aaee41ebe3d68dca7f3d))

#### 8.1.1 (2025-09-03)

### 8.1.0 (2025-09-03)

##### Chores

- bump version to 8.0.2 in package.json ([df0d7533](https://github.com/firstlovecenter/fl-admin-portal/commit/df0d7533fa9b610c6ea8f5b8d1cc077f8d71ddac))
- comment out paths filter in frontend deployment workflow ([18056156](https://github.com/firstlovecenter/fl-admin-portal/commit/180561569afbd20cc1950f43a53e35c9d011d6a4))
- remove .npmrc files ([31a30b59](https://github.com/firstlovecenter/fl-admin-portal/commit/31a30b59a5a6c785e1342d1afa908131f5b4ba96))

##### New Features

- implement S3 image upload functionality with presigned URLs ([27c3b4a7](https://github.com/firstlovecenter/fl-admin-portal/commit/27c3b4a771aeb3130128ff6ce9b2c62878826902))
- add pagination controls and refactor queries for graphs in Church Components ([4f1176e1](https://github.com/firstlovecenter/fl-admin-portal/commit/4f1176e1691d97ea1e96f2b581715b1f8a94ab3c))
- update navigation controls in BacentaGraphs for improved week display ([34396874](https://github.com/firstlovecenter/fl-admin-portal/commit/343968749ebc94e64a166dbe1f5ceb86f78c3d42))
- add pagination support for service and bussing records in GraphQL queries and components ([1b4f05b0](https://github.com/firstlovecenter/fl-admin-portal/commit/1b4f05b08a132dbc30f5117e6c3a83ffeeba76d7))
- update delete service record mutation and restrict role view to fishers ([0093e82e](https://github.com/firstlovecenter/fl-admin-portal/commit/0093e82e6ed9e66f60aa0fa31c78743fb313095e))
- button FSA-34 Added delete button for fishers ([718133ba](https://github.com/firstlovecenter/fl-admin-portal/commit/718133baa85a4286a8702ec165567ecc7239504c))
- update column names for member count queries to improve clarity ([906f3755](https://github.com/firstlovecenter/fl-admin-portal/commit/906f3755549d8029dfdcbfcf25e308721000d354))
- refine attendance and income calculations for rehearsal records to ensure consistent rounding ([44703f0d](https://github.com/firstlovecenter/fl-admin-portal/commit/44703f0dd78f37dc86d7fcf5a77a0828693e3508))
- refine attendance and income calculations i ([10fbe4b4](https://github.com/firstlovecenter/fl-admin-portal/commit/10fbe4b4467279d30e6cf8b5fd05f5460adf0e3f))
- improve income calculations for rehearsal records to ensure consistent rounding ([8e138495](https://github.com/firstlovecenter/fl-admin-portal/commit/8e13849501413343fecfd761169d873dcc5c96ad))
- simplify income calculations for service records to ensure consistent rounding ([1a72e88f](https://github.com/firstlovecenter/fl-admin-portal/commit/1a72e88f982934f11e24b89fa8865e8c89c7c15d))
- update CAMPUS_NAME constant to include 'FL' prefix ([3a6c0a0c](https://github.com/firstlovecenter/fl-admin-portal/commit/3a6c0a0ca04d51c8a5e9c02dea7e659a19abea99))
- remove unused higher church utilities and simplify aggregateCypher ([f2dec71c](https://github.com/firstlovecenter/fl-admin-portal/commit/f2dec71c5b303da27cc711ebf84f327ea6c0abac))
- add query validation for various background functions and remove unused service-utils file ([85e3bdce](https://github.com/firstlovecenter/fl-admin-portal/commit/85e3bdce8362707e3993661ac5c323c2e7309cdd))
- add query validation and logging for various Cypher queries in background functions ([d83538f0](https://github.com/firstlovecenter/fl-admin-portal/commit/d83538f0bbc6e890ba36285979ba7162ac2361b5))
- update income calculations to ensure consistent rounding for financial records ([dadad7e6](https://github.com/firstlovecenter/fl-admin-portal/commit/dadad7e6640b7cbe968dd6413cd63cd63b2b3300))
- update Cypher queries to include oversight relationship for campus and council ([675ba34d](https://github.com/firstlovecenter/fl-admin-portal/commit/675ba34d9a52277827c44dba6f7eaf03df9d5b9e))
- add isManualBanking field to servant church list queries ([afb60ce1](https://github.com/firstlovecenter/fl-admin-portal/commit/afb60ce16d5f83428ea7f6c5343f4cf917998cc7))
- add isManualBanking field to Stream, Council, Governorship, and Bacenta types ([0c774e45](https://github.com/firstlovecenter/fl-admin-portal/commit/0c774e454a75724d6a5a82e5563803ea698a8897))
- enhance AWS Secrets Manager integration and refactor Google Sheets credential handling ([4df773d3](https://github.com/firstlovecenter/fl-admin-portal/commit/4df773d324d501d23f161c16af604e2e77f9cb65))
- add functionality to update Google Sheets with data from Neo4j ([550012fb](https://github.com/firstlovecenter/fl-admin-portal/commit/550012fb53fda9fb4a6c8617017f259b1e2232b3))
- implement Accra New Members and Hillary's Monthly Report jobs ([b13353b0](https://github.com/firstlovecenter/fl-admin-portal/commit/b13353b0f555df099c72d594637d458f95e98d52))
- implement Bacenta Graph Aggregator with Neo4j integration ([cd433652](https://github.com/firstlovecenter/fl-admin-portal/commit/cd4336529e754c83e5753913547d5e84d2bd37d6))
- add Accra campus weekly functions and update notification base URL ([4e82aefa](https://github.com/firstlovecenter/fl-admin-portal/commit/4e82aefaebbe2f02c68626ae8aeab221aff35960))
- add getWeekNumber function to sendNotificationSMS for week calculation ([0a1d0a38](https://github.com/firstlovecenter/fl-admin-portal/commit/0a1d0a38fe8638482dea6ca84acd3088cdcad221))
- add services-not-banked function and remove obsolete gsheets-services-not-banked ([b85c57e3](https://github.com/firstlovecenter/fl-admin-portal/commit/b85c57e3fd4dad43281a47fe69431d7acf1ac48b))
- implement dynamic code selection for the day using JSON data ([0d750c78](https://github.com/firstlovecenter/fl-admin-portal/commit/0d750c788a9c9e0b82de55ccdf6a4502d6d335ff))
- implement Payment Webhook Lambda function and Code of the Day functionality ([5fb66aee](https://github.com/firstlovecenter/fl-admin-portal/commit/5fb66aee2da0c2431559f13f5392fa31535eaeaa))
- implement Payment Webhook Lambda function with Firebase and Neo4j integration ([1cdca608](https://github.com/firstlovecenter/fl-admin-portal/commit/1cdca608160355a73f7c51acd7a3b74e10a1c8cb))
- implement CORS headers for GraphQL function responses ([eeefbc3c](https://github.com/firstlovecenter/fl-admin-portal/commit/eeefbc3cc10910df43b9a5cd8eae5d3b584ebad7))
- add CORS preflight handling in GraphQL function ([a9cd720c](https://github.com/firstlovecenter/fl-admin-portal/commit/a9cd720ca7ea1e802c9130a692474c461b2e09e4))
- add npm authentication setup in frontend and lambda deployment workflows ([e57c8bd0](https://github.com/firstlovecenter/fl-admin-portal/commit/e57c8bd0ca3b9af7fa5850ed6ef023a2ff2fa406))
- integrate AWS Secrets Manager for secret management and update deployment branch to develop ([3bad185f](https://github.com/firstlovecenter/fl-admin-portal/commit/3bad185f8e54a877048b303db47b249107d31e7b))
- add GitHub Actions workflow for frontend deployment to S3 and CloudFront ([9401abd7](https://github.com/firstlovecenter/fl-admin-portal/commit/9401abd79b9efbc9e723a592ce0baf719df1d96f))
- add GitHub Actions workflow for AWS Lambda deployment and update .gitignore for deployment ([d516fd37](https://github.com/firstlovecenter/fl-admin-portal/commit/d516fd3755b67b65cfb6cdfec9f4a0d9e334a0a2))
- update role permissions for directory CRUD operations to include adminCouncil ([6be8353c](https://github.com/firstlovecenter/fl-admin-portal/commit/6be8353c3ddb83d83d5fae267f3003f9fee16de1))
- remove obsolete Cypher scripts and add TimeGraph merging functionality with uniqueness constra ([ddcd232c](https://github.com/firstlovecenter/fl-admin-portal/commit/ddcd232cdf58cbf35a1eab392e55112bbe0de99a))
- rename column in GraphQL schema for clarity in BussingRecord ([6803f9ce](https://github.com/firstlovecenter/fl-admin-portal/commit/6803f9ce3bc3df782b85af0606930edc95cf38ef))
- add pointer cursor style to interactive elements and update Cypher queries for clarity ([09080a0d](https://github.com/firstlovecenter/fl-admin-portal/commit/09080a0d743b4829229ba5130da22b792dfefa12))
- comment out Code of the Day submission functionality in CampusDashboard ([88f14d65](https://github.com/firstlovecenter/fl-admin-portal/commit/88f14d65174bddb8011d49e83a317f9bab4fbbc8))
- update GraphQL schema to enhance clarity of arrival queries ([500c28bd](https://github.com/firstlovecenter/fl-admin-portal/commit/500c28bdb4b13b9dadbb3e81366f6f06035c50c7))
- rename return values in GraphQL schema for clarity in arrivals queries ([3b1dc470](https://github.com/firstlovecenter/fl-admin-portal/commit/3b1dc4706849f31d55cad935986f6f3375bb1c76))
- include roles in JWT object for enhanced authorization handling ([cd31abb3](https://github.com/firstlovecenter/fl-admin-portal/commit/cd31abb37a929c4ce8b0ced28e9489799e37013b))
- update JWT handling to include roles from token and improve development script ([0fdf1423](https://github.com/firstlovecenter/fl-admin-portal/commit/0fdf142309517c5090fbe88a75fd9f60e6c10a01))
- enhance GraphQL schema with descriptive aliases for improved clarity in vehicle payment queri ([8b1cd654](https://github.com/firstlovecenter/fl-admin-portal/commit/8b1cd6544d60b4bbd0fc90ae7b2851401553d80a))

##### Bug Fixes

- clarify return value by renaming stream count to streamCount ([7ed87c62](https://github.com/firstlovecenter/fl-admin-portal/commit/7ed87c62620c05daeb0dcb9b08229fb7da8ffe67))
- return count of streams with alias for clarity ([3b8eee8e](https://github.com/firstlovecenter/fl-admin-portal/commit/3b8eee8e175d3f9a052f046985c5b54adc979a6f))
- rename lambdaHandler to handler for AWS Lambda export ([8e69b133](https://github.com/firstlovecenter/fl-admin-portal/commit/8e69b1338e2409756e62aea662feead281f6bb92))
- update secret name environment variable to AWS_SECRET_NAME in secrets loading functions ([dcf536a0](https://github.com/firstlovecenter/fl-admin-portal/commit/dcf536a03a0fc5142884d960553355633ffb1114))
- update getStreamFinancials calls to use await for proper async handling ([baad5a9e](https://github.com/firstlovecenter/fl-admin-portal/commit/baad5a9e3fa46747e62053c68368da8cdade80d9))
- update deployment workflow to trigger on 'deploy' branch and specific paths ([a0be6d50](https://github.com/firstlovecenter/fl-admin-portal/commit/a0be6d506b3cadf77718dd84a247be9810f4be85))
- update GraphQL queries to return member counts with descriptive aliases ([869e42c3](https://github.com/firstlovecenter/fl-admin-portal/commit/869e42c3e4754e3d1f0d0b984f71ff1c5571f818))
- enhance error handling for GraphQL request body parsing ([588522c6](https://github.com/firstlovecenter/fl-admin-portal/commit/588522c6a508b100fa18317e95251e19f078b40d))
- update GraphQL URI to use VITE_SYNAGO_GRAPHQL_URI ([ae85d72c](https://github.com/firstlovecenter/fl-admin-portal/commit/ae85d72c9c2d01dd63fe4f568e50b8bf99c8590e))
- stop logging out snippets of secrets ([63388f11](https://github.com/firstlovecenter/fl-admin-portal/commit/63388f11cc8c62a512e9c2023262bbcde9272c9d))
- streamline secrets retrieval in frontend deployment workflow ([b82946ca](https://github.com/firstlovecenter/fl-admin-portal/commit/b82946ca0b1ef0563cfbc810426c7211bacbe18b))
- remove unused TEST_PHONE_NUMBER secret retrieval from frontend deployment workflow ([f691d622](https://github.com/firstlovecenter/fl-admin-portal/commit/f691d622c2a6512e8301297a6525bfe54d5a0f1f))
- retrieve secrets from AWS Secrets Manager in frontend deployment workflow ([08193fc2](https://github.com/firstlovecenter/fl-admin-portal/commit/08193fc27a32a861bc53ec1efc6c680c8bdbfa2f))
- update GitHub Actions workflow to trigger on backend file changes ([c5b9ff88](https://github.com/firstlovecenter/fl-admin-portal/commit/c5b9ff88eabccbe10b95bf4cff10d4a5491cf951))
- refactor GraphQL handler to improve request processing and JWT authentication ([a2eb80ae](https://github.com/firstlovecenter/fl-admin-portal/commit/a2eb80ae2d86d44ae15d8b1c2c8f1e03745de0df))
- refactor GraphQL server initialization to load secrets dynamically ([8323f183](https://github.com/firstlovecenter/fl-admin-portal/commit/8323f1838b21f0bd1e828f9b0578ce429d489a7b))
- add new dependencies for Apollo Client, AWS SDK, and utility libraries ([f959951d](https://github.com/firstlovecenter/fl-admin-portal/commit/f959951de82ff0228b38c9fc2ae4f936d9876902))
- add jd-date-utils package for date manipulation ([6b85fcd1](https://github.com/firstlovecenter/fl-admin-portal/commit/6b85fcd166db6fbd85996633b0d5b6d24d127fff))
- add dotenv package for environment variable management ([4e7f6bc6](https://github.com/firstlovecenter/fl-admin-portal/commit/4e7f6bc6923f43f619194f06f1590758a1272baa))
- update TypeScript configuration to target ES2022 and use NodeNext module resolution ([2872c938](https://github.com/firstlovecenter/fl-admin-portal/commit/2872c938f519184197686117a81ebfe222218cc9))
- remove path restriction for Lambda deployment trigger ([91b90c29](https://github.com/firstlovecenter/fl-admin-portal/commit/91b90c29afd2a22deeef276931278f8b844d220b))
- correct path for tsconfig.json creation in Lambda deployment workflow ([91b54c44](https://github.com/firstlovecenter/fl-admin-portal/commit/91b54c44e99f8b0ad76dab2119814bf402a85ee1))
- enhance transaction confirmation handling and add tsconfig.json creation in Lambda workflow ([a1ca7304](https://github.com/firstlovecenter/fl-admin-portal/commit/a1ca7304aba5245caad651a0ab5dbb9479a53cc4))
- update Lambda deployment workflow to trigger on backend file changes ([480afdbf](https://github.com/firstlovecenter/fl-admin-portal/commit/480afdbf45f6ebab8cee12ba1348a5a9e420eac3))
- update Lambda deployment workflow to use a structured directory for compiled TypeScript resolve ([66d7fff6](https://github.com/firstlovecenter/fl-admin-portal/commit/66d7fff6432ab71126605cd493dc0562b10c08f2))
- update deployment workflows to trigger only on specific file changes ([c682fd0f](https://github.com/firstlovecenter/fl-admin-portal/commit/c682fd0f7846587dce801b9d425056f8cfc522d7))
- update TypeScript installation path and enhance dep management in Lambda deployment workflow ([3f4f6388](https://github.com/firstlovecenter/fl-admin-portal/commit/3f4f638833531f7b003dc8e1557b5e1e1b189555))
- streamline TypeScript compilation process in Lambda deployment workflow ([cd7948bf](https://github.com/firstlovecenter/fl-admin-portal/commit/cd7948bfe307170d4ae683935f3bed76da47acc0))
- enhance Lambda deployment workflow by copying package.json and installing dependencies ([e956e60f](https://github.com/firstlovecenter/fl-admin-portal/commit/e956e60f6e51ac7f405d3fd36812282a0c3c044f))
- remove main branch trigger from Lambda deployment workflow ([0395e4d3](https://github.com/firstlovecenter/fl-admin-portal/commit/0395e4d398908257402a8fe96575e5a3268e067a))
- set working directory for npm authentication in Lambda deployment workflow ([5381812f](https://github.com/firstlovecenter/fl-admin-portal/commit/5381812fc694ba08ea5ce22d12b393be2984ef7b))
- update npm authentication token from GITHUB_TOKEN to PAT_TOKEN in deployment workflows ([df6c63f2](https://github.com/firstlovecenter/fl-admin-portal/commit/df6c63f29372686619d0e0c54c5d802f51128d23))
- update @jaedag/admin-portal-types to version 1.5.16 in package.json and package-lock.json ([d265bb7c](https://github.com/firstlovecenter/fl-admin-portal/commit/d265bb7c283ac90c778e1ef2bfff536bf608795d))
- update @jaedag/admin-portal-types to version 1.5.16 in package.json and package-lock.json ([5452cff7](https://github.com/firstlovecenter/fl-admin-portal/commit/5452cff7fbf2bb7edc4e4ae2ecc533c2a36fa169))
- update Lambda deployment function name to use ARN instead of secret ([48c29f9a](https://github.com/firstlovecenter/fl-admin-portal/commit/48c29f9a8e2f0b58a011a582142716b4345423aa))
- update deployment workflow to change directory for npm install and clarify Slack notification ([e743ef63](https://github.com/firstlovecenter/fl-admin-portal/commit/e743ef63422a3cb468fa152b58158530ac4ea7dc))
- return attendance and income for leaders in email ([#476](https://github.com/firstlovecenter/fl-admin-portal/pull/476)) ([6a17e325](https://github.com/firstlovecenter/fl-admin-portal/commit/6a17e3258731e3dc2e7627cef9c875a81e0191e2))

##### Refactors

- simplify Cypher queries by removing unnecessary WITH clauses ([8edf7c72](https://github.com/firstlovecenter/fl-admin-portal/commit/8edf7c7264e56078e21c6c89880c1e2df1b54187))
- convert ES module syntax to CommonJS for compatibility ([fe098206](https://github.com/firstlovecenter/fl-admin-portal/commit/fe098206134a10a342fb4f56cbd7ea9aa60baba6))
- convert exports to CommonJS module format for AWS Lambda compatibility ([e12bb819](https://github.com/firstlovecenter/fl-admin-portal/commit/e12bb8190807e9f5e2b5075c86ee3c149d37b2e7))
- convert exports to CommonJS module format in Accra new members queries ([aa42151d](https://github.com/firstlovecenter/fl-admin-portal/commit/aa42151deff2af0b3d51ff37c10da4b78f066b8c))
- add Accra New Members functionality with Google Sheets integration ([b5f1b57b](https://github.com/firstlovecenter/fl-admin-portal/commit/b5f1b57b87a112b3eb2a1c5f6b669da18035fbd5))
- simplify secrets loading logic and improve error handling ([f9a4b4bc](https://github.com/firstlovecenter/fl-admin-portal/commit/f9a4b4bc13835fb1758f68dadb3926cc547684f8))
- enhance service graph aggregator with AWS Secrets Manager integration ([ca547cbf](https://github.com/firstlovecenter/fl-admin-portal/commit/ca547cbffcb059647e6efbddb99916040f1f75d4))
- add service graph aggregator functionality ([5a624b96](https://github.com/firstlovecenter/fl-admin-portal/commit/5a624b9631d9f4e08848b382375b6680db6020a0))
- remove payment-background function and its associated package.json file ([154aa856](https://github.com/firstlovecenter/fl-admin-portal/commit/154aa8566d183ddc8a00401f41fcdfae46d4e573))
- remove gsheets-accra-background function files and related constants ([1a49aa25](https://github.com/firstlovecenter/fl-admin-portal/commit/1a49aa25ee38d0c4c79746323699e195271eabef))
- change export syntax from ES6 to CommonJS in modules ([5b143991](https://github.com/firstlovecenter/fl-admin-portal/commit/5b143991e44c39b579ceba241057544c69d053e9))
- change export syntax from ES6 to CommonJS in cypher and constants modules ([770d95e8](https://github.com/firstlovecenter/fl-admin-portal/commit/770d95e8273658ec4c67db10f6575670c166e104))
- remove package.json and package-lock.json for code-of-the-day-setter function ([d925dd05](https://github.com/firstlovecenter/fl-admin-portal/commit/d925dd05f0a1195c432d4fea481e83e626b90f0e))
- comment out logging of code of the day in executeQuery function ([67f40ac3](https://github.com/firstlovecenter/fl-admin-portal/commit/67f40ac314b3ed0f59db51162a4f7da70f9492cd))
- enhance logging in executeQuery function to include code of the day details ([b9f5a754](https://github.com/firstlovecenter/fl-admin-portal/commit/b9f5a754bae52fc9890e50c62a20f83f32feebef))
- remove redundant dependency installation step and streamline function packaging process ([40b8b3d5](https://github.com/firstlovecenter/fl-admin-portal/commit/40b8b3d5f1fb2dc2e2ac992caa5cf27da734cbbb))
- streamline background functions compilation process and enha ([b1644343](https://github.com/firstlovecenter/fl-admin-portal/commit/b16443431ed847776e52d258b8f6381521b51d32))
- enhance logging in code of the day function for better traceability ([958b32d6](https://github.com/firstlovecenter/fl-admin-portal/commit/958b32d69fae271a6c1ad0da5ac4a731cab005b6))
- remove unnecessary copying of shared resources in deployment workflow ([1b00061f](https://github.com/firstlovecenter/fl-admin-portal/commit/1b00061fd6f531efee592317c2034e153fe3a109))
- convert code of the day to lambda ([5d059f00](https://github.com/firstlovecenter/fl-admin-portal/commit/5d059f00f786e7e2569ec03a6b29745b75d25a9e))
- update Slack notification actions in deployment workflows for improved clarity and message ([f6234fab](https://github.com/firstlovecenter/fl-admin-portal/commit/f6234fab1a1a620c0b7d9315e0f79d937041135f))
- update secrets handling in deploy workflow for improved security and clarity ([a8ecda43](https://github.com/firstlovecenter/fl-admin-portal/commit/a8ecda43827827019d9102a79929028073e34dd4))
- remove onCompleted handler from CreateGovernorship for cleaner code ([767f9255](https://github.com/firstlovecenter/fl-admin-portal/commit/767f92552c961829f65807aa51b05509c9169bcf))
- update loadSecrets import statements for consistency and clarity ([9c4ba6e1](https://github.com/firstlovecenter/fl-admin-portal/commit/9c4ba6e1d8955aab1c53cad867ab2099d49dc6ef))
- update axios calls to use await for improved readability and error handling ([51fd17f7](https://github.com/firstlovecenter/fl-admin-portal/commit/51fd17f7436697b37d76ab58121bad494c7153ec))
- replace getSecrets module with loadSecrets for improved secret management ([97715dc9](https://github.com/firstlovecenter/fl-admin-portal/commit/97715dc9028fd7f75f88bdd51927f640b8d75997))
- remove unused Neo4j authentication plugin from GraphQL server ([cefba5c1](https://github.com/firstlovecenter/fl-admin-portal/commit/cefba5c1d76a6e01bf7bd5fb85c2cc8f3f5cbc17))
- remove commented-out encryption options from Neo4j driver initialization ([662c7bdd](https://github.com/firstlovecenter/fl-admin-portal/commit/662c7bdddebcfa87298ec87e0ff1dfca7a18a908))
- update GraphQL server implementation with Neo4j integration and enhanced error handling ([147ab29f](https://github.com/firstlovecenter/fl-admin-portal/commit/147ab29fdb95f104269e1afc73ba3a9d67ed21ca))

#### 8.0.1 (2025-03-06)

##### New Features

- update GraphQL schema to enhance clarity with descriptive aliases ([93e07ad9](https://github.com/firstlovecenter/fl-admin-portal/commit/93e07ad9e6bc3864abb592648456298951aedc3f))
- enhance GraphQL schema with distinct service and defaulter counts for improved reporting ([ad277eeb](https://github.com/firstlovecenter/fl-admin-portal/commit/ad277eeb8fa1987c630f0d1d28a7249b9e0e2a95))
- add bacenta aggregation script and Neo4j constraints for performance optimization ([dcd4eec8](https://github.com/firstlovecenter/fl-admin-portal/commit/dcd4eec877f1b53fa71a4ea56b94c060687b08ba))
- add background aggregators for bacenta and service graphs with optimized queries ([0a3bc557](https://github.com/firstlovecenter/fl-admin-portal/commit/0a3bc5578463d2bff65185dd85af5d12bf555bc1))

##### Bug Fixes

- update service graph aggregator scheduling to run hourly ([b422c37d](https://github.com/firstlovecenter/fl-admin-portal/commit/b422c37da40908057ed4c8b8f4dca91edf13210c))
- update service graph aggregator scheduling to run every minute ([d5f3420f](https://github.com/firstlovecenter/fl-admin-portal/commit/d5f3420fbdd53bc29f951f37f62e3ed0ecc97b92))
- update scheduling for graph aggregators to run at specified intervals ([2abf8b4a](https://github.com/firstlovecenter/fl-admin-portal/commit/2abf8b4ae589efe3e8d4a827bb1f6075117f8786))
- update GraphQL queries to use 'result' alias for clarity in return values ([3eeba874](https://github.com/firstlovecenter/fl-admin-portal/commit/3eeba87437707e6d87127ad2f3c9936f93f3f1ff))
- enhance error handling in GraphQL resolvers for improved reliability ([a567ba30](https://github.com/firstlovecenter/fl-admin-portal/commit/a567ba302e01d03e216094c28fae1f736f32abd3))
- update GraphQL queries to include aliasing for clarity and consistency in column naming ([03945077](https://github.com/firstlovecenter/fl-admin-portal/commit/03945077442f95025aef5c95671e59d19ea0493f))
- update column names in GraphQL schema for consistency and clarity ([e7655a54](https://github.com/firstlovecenter/fl-admin-portal/commit/e7655a54ac1ad9e94bbb42799909b5ea16f6761c))
- update Cypher queries to include aliasing for clarity and correct column naming in GQL ([6e68f9eb](https://github.com/firstlovecenter/fl-admin-portal/commit/6e68f9eb5f28a0ff972a278be96b0bed974d9673))
- simplify Cypher queries by removing unnecessary MATCH clauses and aggregations ([43163bd9](https://github.com/firstlovecenter/fl-admin-portal/commit/43163bd91bb929774278890d61bc21490677e885))

##### Refactors

- adjust GraphQL query to use 'bacenta' instead of 'fellowship' ([565f3fd4](https://github.com/firstlovecenter/fl-admin-portal/commit/565f3fd43397d76f8475a3bc2a4e65e77b51ca9e))

## 8.0.0 (2025-03-04)

##### Chores

- update Neo4j dependencies and refactor authorization plugin integration ([f488b21a](https://github.com/firstlovecenter/fl-admin-portal/commit/f488b21a3ab23e5ee260bb47355e462c2367a7cc))

##### Bug Fixes

- change target field type from Int! to Int in campaigns-swollen-sunday GraphQL schema ([9293aa99](https://github.com/firstlovecenter/fl-admin-portal/commit/9293aa999b2dca43bf0417daeba172be19d31e2f))
- refactor bankingProof logic to use CASE statement for clarity in GraphQL schema ([0467358d](https://github.com/firstlovecenter/fl-admin-portal/commit/0467358dc1ea80596fc6becbc4bcb145f6243bf8))
- standardize return count naming to memberCount in directory CRUD mutations ([598dab68](https://github.com/firstlovecenter/fl-admin-portal/commit/598dab68af77d6f1e42fe3a6b94818ce10e01ac5))
- update GraphQL schema to return stream name consistently ([9cf66f95](https://github.com/firstlovecenter/fl-admin-portal/commit/9cf66f95d70472f789bce8d1cccefc1cbcfe0703))
- rename column references from "services" to "records" in GraphQL schema ([3d514b9a](https://github.com/firstlovecenter/fl-admin-portal/commit/3d514b9a701fdd8a8b3e83dafa583577f359f8bf))
- import jwtDecode from jwt-decode for JWT handling in GraphQL ([80399dce](https://github.com/firstlovecenter/fl-admin-portal/commit/80399dceaf0752d3fc2902cd3ce20381720b843f))
- conditionally write combined schema file based on environment ([a942d8bd](https://github.com/firstlovecenter/fl-admin-portal/commit/a942d8bd76073da3d6cf6414bcb2d84c29df0acd))
- add jwt-decode package and update context to handle JWT in Apollo Server ([7301fa25](https://github.com/firstlovecenter/fl-admin-portal/commit/7301fa25095ec75012d153591a476c2baa96ffc8))
- update JWT secret handling and improve schema error logging ([cf31a887](https://github.com/firstlovecenter/fl-admin-portal/commit/cf31a887b3a8c1bb53c012f2ec37b7706ee9e408))
- replace executeWrite with run for session queries in multiple aggregators ([7b82faf1](https://github.com/firstlovecenter/fl-admin-portal/commit/7b82faf1f1d4f0148dc0c0fddf7fff730845a259))
- update package-lock.json to reflect changes in dependencies and lockfile version ([c005797a](https://github.com/firstlovecenter/fl-admin-portal/commit/c005797ab93dded5381f6bd20322a88da8a41dec))
- update user roles retrieval to use JWT for consistency in campaigns resolver ([11fe45b9](https://github.com/firstlovecenter/fl-admin-portal/commit/11fe45b930544caafdecd2da8876313b8fdd97f7))
- update resolvers to use JWT for role and auth_id references ([2f7c3bee](https://github.com/firstlovecenter/fl-admin-portal/commit/2f7c3bee866122acd66fa18c873cb95f999d35c9))
- replace auth context references with jwt for consistency across resolvers ([a28c21be](https://github.com/firstlovecenter/fl-admin-portal/commit/a28c21be86108c437d4f76ba71b10a4f42607628))
- update auth_id references to use $jwt.sub for consistency across resolvers and schemas ([043807bb](https://github.com/firstlovecenter/fl-admin-portal/commit/043807bb8b49db1903ae1aa60e0926db833f04a5))
- update authentication context to use JWT roles and enhance resolver logic ([f61937e9](https://github.com/firstlovecenter/fl-admin-portal/commit/f61937e97aaf00588457dddb634fa3b033ff5dca))
- standardize column names in GraphQL schema for consistency ([1044ddff](https://github.com/firstlovecenter/fl-admin-portal/commit/1044ddff5c3a90a442b0e4ff8d5a45323b7d9e69))
- refactor Cypher queries for Member type and enhance JWT handling in context ([cf863c66](https://github.com/firstlovecenter/fl-admin-portal/commit/cf863c66eeeecc15b1a3853d90cfb14ba962f1bf))
- update authentication roles to use OR syntax in GraphQL mutations ([ea62b1d3](https://github.com/firstlovecenter/fl-admin-portal/commit/ea62b1d3fd146dd34a43ad4460a3a7aaa6cf65ee))
- enhance error logging for GraphQL schema initialization ([03812d65](https://github.com/firstlovecenter/fl-admin-portal/commit/03812d655b9c788bc548b6795f981b71a214dc30))
- remove unused Cypher script and update GraphQL mutation return value ([cee653b1](https://github.com/firstlovecenter/fl-admin-portal/commit/cee653b10becdf6263e4350fc125ad27d104c9dc))
- update dependencies for @apollo/server, @neo4j/graphql, graphql, ([ec9a7a23](https://github.com/firstlovecenter/fl-admin-portal/commit/ec9a7a233fd2cfc7ee21918f4ea0151adef6afe9))
- update neo4j-driver dependency to version 5.28.1 across multiple functions ([ccbe1e64](https://github.com/firstlovecenter/fl-admin-portal/commit/ccbe1e64fbc482c4527bca97b28fbe19ee32dbb3))
- improve performance of GraphQL queries by optimizing resolver functions ([8d85a02a](https://github.com/firstlovecenter/fl-admin-portal/commit/8d85a02af39ddc6f4e00da295677f1fe47d385a3))
- update authentication roles handling in GraphQL schema and remove hardcoded roles path ([257bf92c](https://github.com/firstlovecenter/fl-admin-portal/commit/257bf92cdce31478030d8cb8bc689ea7cee360fc))
- update .gitignore to include combined-schema wildcard and change output file extension to .gql ([5dfc7486](https://github.com/firstlovecenter/fl-admin-portal/commit/5dfc748651b751fef0906f974c09df8c0df5fa89))
- update .gitignore to include combined-schema.graphql ([113cfc17](https://github.com/firstlovecenter/fl-admin-portal/commit/113cfc17214fa6251932705f9e443e4bb9400137))
- write combined GraphQL schema to file and add columnName argument to cypher directives ([33dd7c42](https://github.com/firstlovecenter/fl-admin-portal/commit/33dd7c42f84f998f6d7d891a8a3abcfbd5cdd12b))
- enhance error logging and standardize relationship directives in GraphQL schema ([0c77fa84](https://github.com/firstlovecenter/fl-admin-portal/commit/0c77fa842c9b0b6cf6814105103b0df02cf82246))
- update GraphQL schema to ([3d76a213](https://github.com/firstlovecenter/fl-admin-portal/commit/3d76a213cf30c278f6053ad776ddc3cfa8e81b92))
- add columnName argument to various GraphQL types for consistency ([76ed1617](https://github.com/firstlovecenter/fl-admin-portal/commit/76ed1617cd25803a237ce4bf42ca3136ef23fc2f))
- add columnName argument to cypher directives for consistency in GraphQL schema ([5d487417](https://github.com/firstlovecenter/fl-admin-portal/commit/5d487417e1b89327678b7b3362bab70add82c0bc))
- update authentication directives to use jwt roles_INCLUDES for consistency ([dd170662](https://github.com/firstlovecenter/fl-admin-portal/commit/dd1706620c878d4afa50cba664b79294aa7e9492))
- remove authentication directives from various GraphQL types for consistency ([02867109](https://github.com/firstlovecenter/fl-admin-portal/commit/02867109358dc8fac83e182196f74231270ebcf2))
- add columnName argument to currentUser and memberByEmail queries for consistency ([f7d0e135](https://github.com/firstlovecenter/fl-admin-portal/commit/f7d0e135cf7545a7c8daa7c8358a74087a963169))
- rename multiplicationRecords to multiplicationStats for consistency in GraphQL schema ([af4ad5b8](https://github.com/firstlovecenter/fl-admin-portal/commit/af4ad5b8ceec0d365a18e08572d2eed1665a400b))
- add columnName argument to userRecords and update related GraphQL types for consistency ([12d07821](https://github.com/firstlovecenter/fl-admin-portal/commit/12d07821a3cf77388e85e41bbc0283292317936b))
- add columnName argument to multiplicationRecords and target fields in campaigns-multiplication ([3c3f441e](https://github.com/firstlovecenter/fl-admin-portal/commit/3c3f441e06e5e688f62aaeb1d65a4321ef627dbb))
- add columnName argument to downloadCredits mutation and remove unused columnName fields in campus and stream types ([b6cec651](https://github.com/firstlovecenter/fl-admin-portal/commit/b6cec65139f6f65f2adc924d7f13512af3bf41c2))
- add columnName arguments to various GraphQL directives for improved clarity ([8155f162](https://github.com/firstlovecenter/fl-admin-portal/commit/8155f162590da6e77aae3188efd9c5f49904cd1d))
- added columnName argument to @cypher directives in arrivlals.graphql ([e2e9aaf9](https://github.com/firstlovecenter/fl-admin-portal/commit/e2e9aaf92c0b78aff0cd26ffbc5816cbc82b69bf))
- added columnName argument to @cypher directives in arrivlals-payment.graphql ([498a958c](https://github.com/firstlovecenter/fl-admin-portal/commit/498a958c9a6d734a4ebd86cc9b98c364bb01b1b1))
- added columnName argument to @cypher directives in aggregates.graphql ([7f469d2b](https://github.com/firstlovecenter/fl-admin-portal/commit/7f469d2b485da5cfe4729603c81c748e72bd9909))
- added columnName argument to @cypher directives in accounts.graphql ([db80c1fa](https://github.com/firstlovecenter/fl-admin-portal/commit/db80c1fa2c8c02d0734f42c3eae9b555dca6d1dd))
- added columnName argument to @cypher directives in directory.graphql ([6039df8d](https://github.com/firstlovecenter/fl-admin-portal/commit/6039df8d5d95e6fbee0abb331256bb4dba88f35e))
- handle schema retrieval errors in GraphQL server startup ([45016fc2](https://github.com/firstlovecenter/fl-admin-portal/commit/45016fc24faa0d92b4e6943e3de6870e6d074689))

##### Refactors

- ensure church display pages are working effectively ([a9adbab5](https://github.com/firstlovecenter/fl-admin-portal/commit/a9adbab50fecfae1c752ab6608ba9988966086b3))
- update recipient identifiers with names in notification functions ([71df68e3](https://github.com/firstlovecenter/fl-admin-portal/commit/71df68e3b55bb882f6a53e459ee655ade5f3c2e2))

#### 7.18.64 (2025-02-12)

##### Chores

- remove sensitive information logging from index.js ([de19d1cf](https://github.com/firstlovecenter/fl-admin-portal/commit/de19d1cf7d214809f90db3b33e142efc235b8999))

##### New Features

- show maintenance mode message ([31fbdbee](https://github.com/firstlovecenter/fl-admin-portal/commit/31fbdbeea66800ad16227d3d553e9eb2e4a77d84))

##### Bug Fixes

- enable JWT secret and roles path in GraphQL configuration ([d1ceaaf1](https://github.com/firstlovecenter/fl-admin-portal/commit/d1ceaaf1b14e1d42ee405669ab3d06a26a0a1495))
- restore user authentication logic and re-enable related components ([f0f1c38a](https://github.com/firstlovecenter/fl-admin-portal/commit/f0f1c38ad3d1795eb2e9d670f49a2649d07223be))
- add new recipient phone number to gsheets update function ([c99c5835](https://github.com/firstlovecenter/fl-admin-portal/commit/c99c5835d8ef3473c708c0cebce99909a4867394))
- wrong logic for retrieving anagkazo banking defaulters ([f3cdb49b](https://github.com/firstlovecenter/fl-admin-portal/commit/f3cdb49b22a0c4e0519e2dbe9da0ff910b083aa6))
- add Hillary's phone number to SMS recipient lists in multiple functions ([98a59652](https://github.com/firstlovecenter/fl-admin-portal/commit/98a596528986cca5cdbf08df89a7cac84f83122f))
- update error message in sendBulkSMS function for clarity ([afd44f64](https://github.com/firstlovecenter/fl-admin-portal/commit/afd44f641e7419e70ba0a724ef40f22a5ee46149))
- parameterize week value in GraphQL query for improved flexibility ([26ca4b38](https://github.com/firstlovecenter/fl-admin-portal/commit/26ca4b38968650175eb6f5b79f1586c22957316d))
- update GraphQL query to use fixed week value and enhance record matching logic ([84a0a3bb](https://github.com/firstlovecenter/fl-admin-portal/commit/84a0a3bb4f31ab2c338d2b5e3d1ba4343f9ee00b))

##### Refactors

- simplify Cypher queries and update Neo4j driver configuration logging ([8fe1529a](https://github.com/firstlovecenter/fl-admin-portal/commit/8fe1529a206cd6d8e0077194f2ae4104999d36b6))

#### 7.18.63 (2024-12-08)

##### Chores

- update version in meta.json and add optional chaining for ([b4caaa35](https://github.com/firstlovecenter/fl-admin-portal/commit/b4caaa35f520f8dac1c799145cb4fad0e24f28ac))

##### New Features

- enhance GraphQL queries and improve type handling in ConfirmAnagkazoBanking component ([39ab7450](https://github.com/firstlovecenter/fl-admin-portal/commit/39ab745049831acb330d7ec8e2c56158b194ab3b))
- update Cypher queries to use governorship context and improve record handling ([e59d0e79](https://github.com/firstlovecenter/fl-admin-portal/commit/e59d0e79f4519a2b647e779bc2bb658f30af0674))

##### Refactors

- simplify LabelList usage and add null check for category in ChurchGraph component ([38de3ba0](https://github.com/firstlovecenter/fl-admin-portal/commit/38de3ba01c54ff002aaaca4178590661d51fb1df))

#### 7.18.62 (2024-11-30)

##### New Features

- rename constituency banking defaulters to governorship banking defaulters across the app ([7cb9e3a6](https://github.com/firstlovecenter/fl-admin-portal/commit/7cb9e3a6441f9a1007b463d3a5ec83671c25c08e))
- rename constituency banking defaulters to governorship banking defaulters across the application ([853a8bb5](https://github.com/firstlovecenter/fl-admin-portal/commit/853a8bb5f4e858e43c89df06fa70c76e0f0c96a5))
- optimize Cypher queries by removing redundant MATCH clauses and improving performance ([685542c0](https://github.com/firstlovecenter/fl-admin-portal/commit/685542c0cf2e971c6d99a94e377eba45a4d1f513))
- add functionality to zero all null bussing records in the database ([4132371b](https://github.com/firstlovecenter/fl-admin-portal/commit/4132371b5eec2a7a8c0f78f2b55de48a6df7d0f9))
- simplify Cypher queries by removing unnecessary MATCH clauses ([6b5dc5e9](https://github.com/firstlovecenter/fl-admin-portal/commit/6b5dc5e9746f17776b8a8a03617eb2289ce464a0))
- update schedule time for gsheets services not banked handler ([8ea18fe1](https://github.com/firstlovecenter/fl-admin-portal/commit/8ea18fe193e7e86041ad55b3d7a5daca47f76e7e))
- add SMS notification for services not banked updates and include new recipient ([f86bcf6f](https://github.com/firstlovecenter/fl-admin-portal/commit/f86bcf6f5e8cecc0fa37316cfd3b7635c7c6a7f7))

#### 7.18.61 (2024-11-10)

##### New Features

- enhance service aggregation queries to include total attendance and income calculations ([6e3e61ed](https://github.com/firstlovecenter/fl-admin-portal/commit/6e3e61ed2a498447ceb7b71ccce0d8df820dfaca))
- remove unused bacenta aggregation functions from graph aggregator ([c3932d50](https://github.com/firstlovecenter/fl-admin-portal/commit/c3932d50f4d2efa62d330b1639052b3e9bd23613))
- add service graph aggregator and refactor graph aggregation functions ([4ca19d18](https://github.com/firstlovecenter/fl-admin-portal/commit/4ca19d189fdc8190133a08f6a262c936d2877e71))
- update schedule frequency for graph aggregation handler to run hourly ([783b3ed4](https://github.com/firstlovecenter/fl-admin-portal/commit/783b3ed4ffb91ae5991a09e73abeeadb18d27a2d))
- update busing aggregation queries to set month property and refactor function calls ([60ffe648](https://github.com/firstlovecenter/fl-admin-portal/commit/60ffe6487ebc0d5ab20e739e82ce0dddbed0abc2))
- add busing aggregation queries and reset attendance records ([7654bcd0](https://github.com/firstlovecenter/fl-admin-portal/commit/7654bcd001e01edbdf694a2a8c253199963eb2d8))
- remove service aggregation in filling service resolver ([2e4f0311](https://github.com/firstlovecenter/fl-admin-portal/commit/2e4f0311df9e565c9eb592d5922fdf1307738c4f))
- update schedule frequency for graph aggregation handler ([e3e3cdcd](https://github.com/firstlovecenter/fl-admin-portal/commit/e3e3cdcdde07cdf99929c6be28d37069f4f342c2))
- enhance logging for graph aggregation processes ([627614ea](https://github.com/firstlovecenter/fl-admin-portal/commit/627614eacaceeaf55fdc3c47b4c94ce4ae0b8e19))
- add path for graph-aggregate-corrector secrets in encrypt-secrets.js ([aeb38d0a](https://github.com/firstlovecenter/fl-admin-portal/commit/aeb38d0a3e20213f64925f4ec6c9431dba055d9c))
- update graph aggregation logic and adjust schedule frequency ([8fb0be94](https://github.com/firstlovecenter/fl-admin-portal/commit/8fb0be94f20be653dcd1bcc3873208f0107279e8))
- add console log for aggregation completion in graph-aggregate-corrector ([472b162b](https://github.com/firstlovecenter/fl-admin-portal/commit/472b162b7ce2661b12222a3e07d2df8278a86663))
- implement bg function to aggregate church graphs ([42693dad](https://github.com/firstlovecenter/fl-admin-portal/commit/42693dad43ed319c5b2cc2cc9c80a3bfe37ffd02))

#### 7.18.60 (2024-11-09)

#### 7.18.59 (2024-11-09)

#### 7.18.58 (2024-11-09)

#### 7.18.57 (2024-11-09)

##### Refactors

- update role permissions for closing down Bacenta to use 'Governorship' ([df0400b0](https://github.com/firstlovecenter/fl-admin-portal/commit/df0400b07294058a23ba4fbbc94bac6fdbd470de))
- update accounts-utils to use UTC methods and uncomment code in ExpenseForm ([7f17fe85](https://github.com/firstlovecenter/fl-admin-portal/commit/7f17fe850f445456826c06bdd9823f020e37cbbc))

#### 7.18.56 (2024-10-31)

##### Documentation Changes

- update CHANGELOG.md ([3f9fee4b](https://github.com/firstlovecenter/fl-admin-portal/commit/3f9fee4b88a6bf7154ea0b98f84e222f8763ec76))
- update CHANGELOG.md ([2d6edb45](https://github.com/firstlovecenter/fl-admin-portal/commit/2d6edb458246e7ff2c47b6295c88577faf97b355))

##### New Features

- implement function to write the new members list for the past week ([170377eb](https://github.com/firstlovecenter/fl-admin-portal/commit/170377eb9a2200de1b49ef85f8c652d1ae8ac0ab))

##### Bug Fixes

- reverse update gsheets-accra-background.js ([178cbc70](https://github.com/firstlovecenter/fl-admin-portal/commit/178cbc70aaee800d8b9420d87306776c099ebef5))
- update gsheets-accra-background.js ([e36eff59](https://github.com/firstlovecenter/fl-admin-portal/commit/e36eff5985a9227f61fca104f5d8b5934d8bcb35))

##### Other Changes

- update import statement for newMembersList query ([a21f37e9](https://github.com/firstlovecenter/fl-admin-portal/commit/a21f37e9a01318b6cd2f4b1bf96d8de9b90b36ba))

##### Refactors

- update easy-debugging-scripts.cypher and ExpenseForm.tsx to comment out unused code ([dd89c236](https://github.com/firstlovecenter/fl-admin-portal/commit/dd89c2368410cee59f7c4700d28238a2105ebec5))
- update helpdesk link in texts.json ([1567e1ef](https://github.com/firstlovecenter/fl-admin-portal/commit/1567e1ef07348d3f8c672c33a338f878024c42f3))
- update gsheets-accra-new-members.js to correct the scheduled day for running the handler ([2f3e4011](https://github.com/firstlovecenter/fl-admin-portal/commit/2f3e4011f837f3ea4fe24e582975a4a8bcb15550))
- add new recipient to gsheets-accra-new-members.js ([b6383572](https://github.com/firstlovecenter/fl-admin-portal/commit/b638357299b709d8bd1631690c807e231b2abfb7))
- update secrets.js paths in encrypt-secrets.js ([2a312e2b](https://github.com/firstlovecenter/fl-admin-portal/commit/2a312e2be9d638e9f8b46d121a4be17a12b32938))
- update gsheets-accra-new-members.js to correct the scheduled day for running the handler ([43765494](https://github.com/firstlovecenter/fl-admin-portal/commit/43765494a9c24b84b636b7c4b8c6a971edd626a3))
- update gsheets-accra-new-members.js to write new members list to correct cell range ([c4fecee6](https://github.com/firstlovecenter/fl-admin-portal/commit/c4fecee61c7185178888f8fdd660f4fba4984eb0))
- update arrivals-cypher.ts to include "Car" vehicles ([667bb748](https://github.com/firstlovecenter/fl-admin-portal/commit/667bb7485e4d120964ef0effa2707cf68d2e2038))
- add additional recipient to gsheets-accra-background.js ([c0226650](https://github.com/firstlovecenter/fl-admin-portal/commit/c0226650bc739a1b1e280186e3e55eaaf8c9be47))
- update STREAM_SERVICE_DAY_OPTIONS to include Thursday ([4d4e67b4](https://github.com/firstlovecenter/fl-admin-portal/commit/4d4e67b48f9876c459e6d9f9af2c3d4b1239e9ff))

#### 7.18.55 (2024-10-07)

#### 7.18.54 (2024-10-07)

##### Refactors

- update STREAM_SERVICE_DAY_OPTIONS to include Thursday ([d6e87e44](https://github.com/firstlovecenter/fl-admin-portal/commit/d6e87e44bcbaae6f07b242700a5aa391c868e76a))

#### 7.18.53 (2024-10-01)

##### Refactors

- update STREAM_SERVICE_DAY_OPTIONS to include Thursday ([221eed76](https://github.com/firstlovecenter/fl-admin-portal/commit/221eed761d3ec3a8243fa1b51bf2eeea2b3e9e42))

#### 7.18.52 (2024-09-27)

##### Refactors

- update to display the correct timing for Thursdays which is 6am to 10am ([e396ffaf](https://github.com/firstlovecenter/fl-admin-portal/commit/e396ffafed244394945249c2c2a13325dd74d6d4))
- update leader title in DetailsGovernorship component ([5467c5ec](https://github.com/firstlovecenter/fl-admin-portal/commit/5467c5ec0d1f686ba05bb70394b8b0b247c44607))

#### 7.18.51 (2024-09-26)

##### Refactors

- change the word team to governorship ([74ba5a53](https://github.com/firstlovecenter/fl-admin-portal/commit/74ba5a5316d7389f083c34664be2458c843f4187))
- remove unused secrets.build call ([2de1a689](https://github.com/firstlovecenter/fl-admin-portal/commit/2de1a6899b7a1a428f7b5237203ea0ef392e0d5e))
- remove unused secrets.build call ([166b0699](https://github.com/firstlovecenter/fl-admin-portal/commit/166b0699d07a1435c8356b7534bfedd2f394fa65))

#### 7.18.50 (2024-09-24)

##### Bug Fixes

- remove personalContr calc from arrivals ([4d359537](https://github.com/firstlovecenter/fl-admin-portal/commit/4d35953747828443237252c94723649f32b90d22))
- remove bussingCost and personalContribution from bacenta form ([1b2f90a3](https://github.com/firstlovecenter/fl-admin-portal/commit/1b2f90a33e5e3135d6e3e12b3683e5c67b2e2835))
- car option is available on all days not just swells ([b6ee21e0](https://github.com/firstlovecenter/fl-admin-portal/commit/b6ee21e0da53df6772a511b06bb79751b5d815b8))

##### Refactors

- change word constituency to word team ([156ae928](https://github.com/firstlovecenter/fl-admin-portal/commit/156ae928a2affdd93b53e89970819c8241bddfef))
- remove graduation status from bacenta ([8f023c56](https://github.com/firstlovecenter/fl-admin-portal/commit/8f023c569d7ad77e94c314d3e0fdd1e5272df672))
- comment out unused code in treasury-resolvers.ts and banking-resolver.ts ([34dab8bf](https://github.com/firstlovecenter/fl-admin-portal/commit/34dab8bf2ab6f554e14a36788295632d74803a33))

#### 7.18.49 (2024-09-18)

##### Documentation Changes

- update CHANGELOG.md ([2cc0d076](https://github.com/firstlovecenter/fl-admin-portal/commit/2cc0d0761754726026b4df8de8c3ffd4682d6a9a))

##### Refactors

- remove redundant runner variable in release script ([dd19453d](https://github.com/firstlovecenter/fl-admin-portal/commit/dd19453dc406d797e6362d390808a50c7d674733))
- add new stream options in financial-utils and StreamForm ([1b2a2756](https://github.com/firstlovecenter/fl-admin-portal/commit/1b2a275655aaff4c44886360aa8a413d26ede93f))

#### 7.18.48 (2024-09-18)

##### Refactors

- add new stream options in financial-utils and StreamForm ([1b2a2756](https://github.com/firstlovecenter/fl-admin-portal/commit/1b2a275655aaff4c44886360aa8a413d26ede93f))

#### 7.18.47 (2024-09-03)

##### Refactors

- update bacenta member check condition in directory resolvers ([431a866e](https://github.com/firstlovecenter/fl-admin-portal/commit/431a866ee773ca68336d31ec6db7b0e3ba5cfe19))

#### 7.18.46 (2024-09-01)

##### Refactors

- update history queries to fetch 100 records instead of 10 ([4c7d931e](https://github.com/firstlovecenter/fl-admin-portal/commit/4c7d931e409740adf25d65d48728c69093edc33c))

#### 7.18.45 (2024-09-01)

##### Bug Fixes

- fix checker for bacenta members before deleting ([20ff5dec](https://github.com/firstlovecenter/fl-admin-portal/commit/20ff5dec877bf43a79e47ccdcce6f2046573f4da))
- update the checkBacenta Has no members ([4eb9fbbe](https://github.com/firstlovecenter/fl-admin-portal/commit/4eb9fbbe0af8d9c9baf47cdd10d31da6909e78bd))

##### Refactors

- update history queries to fetch 100 records instead of 10 ([f7d56fe0](https://github.com/firstlovecenter/fl-admin-portal/commit/f7d56fe0bbeee66dfee1b82bca3d24000bf69035))
- update code of the day for september ([04b3c6ff](https://github.com/firstlovecenter/fl-admin-portal/commit/04b3c6ffc084201fc4601697f63e0c8583fe3948))
- update member search queries to use Bacenta instead of Fellowship ([c0d41250](https://github.com/firstlovecenter/fl-admin-portal/commit/c0d412505f5123444a326722d4f906fcf93795e1))
- update member search queries to use Bacenta instead of Fellowship ([62d35ca8](https://github.com/firstlovecenter/fl-admin-portal/commit/62d35ca87dee1e5a4900a344fa1028edadfcd7dd))
- update permission case for council in permitLeader ([a41888ad](https://github.com/firstlovecenter/fl-admin-portal/commit/a41888ada5fe10592a1b613ab23d171e476d8ae4))

#### 7.18.44 (2024-08-14)

##### Refactors

- update TrendsMenu permission to use permitLeaderAdmin instead of permitAdmin ([647356fd](https://github.com/firstlovecenter/fl-admin-portal/commit/647356fd5bfbb0ae0e060e8b455e56e8680c5076))

#### 7.18.43 (2024-08-10)

##### Refactors

- update link to service details page in BankingDefaulters ([94306252](https://github.com/firstlovecenter/fl-admin-portal/commit/94306252b5ad7a9f2b5826f1e5c9b1583b783cff))
- update link to service details page in BankingDefaulters ([a429794f](https://github.com/firstlovecenter/fl-admin-portal/commit/a429794fb19e0cc020ed37b31bd4690ea73f2688))

#### 7.18.42 (2024-08-08)

##### Bug Fixes

- download credit only is subtracted when > 0 ([6eb23efa](https://github.com/firstlovecenter/fl-admin-portal/commit/6eb23efad62b916beee8f9c52fb694b6a6e76736))
- bring back poimen checkers for banking ([eb175ddf](https://github.com/firstlovecenter/fl-admin-portal/commit/eb175ddfb3b549ede2ad6c87528de14e9befa64e))

##### Refactors

- handle optional basonta name in DownloadCouncilMembership ([4431725c](https://github.com/firstlovecenter/fl-admin-portal/commit/4431725c272e8b56a9d70141e3caf6220ccbcfb5))
- update download credits member cypher and council download reports ([e3060d91](https://github.com/firstlovecenter/fl-admin-portal/commit/e3060d919302f27ba817412f2767685b2821b14b))
- update download credits member cypher and council download reports ([4a46c140](https://github.com/firstlovecenter/fl-admin-portal/commit/4a46c14018e1d5e0ef556081ce77ca97f476e51e))
- demote green to red and remove green label ([e67838af](https://github.com/firstlovecenter/fl-admin-portal/commit/e67838aff5108c87ef046761172c9f6a2d0e6e16))

#### 7.18.41 (2024-08-05)

##### Refactors

- update ListQueries to include memberCount instead of stream_name ([7934475b](https://github.com/firstlovecenter/fl-admin-portal/commit/7934475b4490b9c7d01bd21fecc45c620349e382))
- update MemberTable to display bacenta name instead of fellowship name ([142f9d1b](https://github.com/firstlovecenter/fl-admin-portal/commit/142f9d1bc34857af307d410befb0f706b4bd2f30))
- update phone number formatting in MemberDisplay ([cdb2244e](https://github.com/firstlovecenter/fl-admin-portal/commit/cdb2244e04df4df930ffffe9488c4ffca59dd066))

#### 7.18.40 (2024-08-04)

##### Chores

- ensure npx is available for commit-msg hook ([f806c352](https://github.com/firstlovecenter/fl-admin-portal/commit/f806c35297e451e47b999330416898153315e946))
- update code of the day for August ([336125ed](https://github.com/firstlovecenter/fl-admin-portal/commit/336125edbcf3322b72cd1c4f650aa3094b1a75bb))

##### New Features

- add Basonta information to council member download ([12f3b746](https://github.com/firstlovecenter/fl-admin-portal/commit/12f3b746529962c1a565db29661cda81269a814c))

##### Refactors

- update phone number formatting in MemberDisplay ([0c3de3db](https://github.com/firstlovecenter/fl-admin-portal/commit/0c3de3db98e16459ca84df29f9da23c165fc7f50))
- update phone number formatting in MemberDisplay ([4c25b7ef](https://github.com/firstlovecenter/fl-admin-portal/commit/4c25b7eff5a2f8bcc56c9f0800b5785854daf6cd))
- the ServicesMenu component to use correct property name for church type ([3566ec18](https://github.com/firstlovecenter/fl-admin-portal/commit/3566ec18c58cfc8c21d1448c42702e0d788f5370))

#### 7.18.39 (2024-08-02)

##### Chores

- update @jaedag/admin-portal-api-core to version 2.2.2 ([6554450a](https://github.com/firstlovecenter/fl-admin-portal/commit/6554450aaf2617a8024de76832bca59d2ed2a5f1))

#### 7.18.38 (2024-08-01)

##### Chores

- update @jaedag/admin-portal-api-core to version 2.2.1 ([0d02d0c3](https://github.com/firstlovecenter/fl-admin-portal/commit/0d02d0c307317eaefdbc56bd3d1dfe401cdaff0a))

##### New Features

- update routes and components for council confirm payment delay ([a32cf98d](https://github.com/firstlovecenter/fl-admin-portal/commit/a32cf98de3216aae7ca462742c315d2fe63bdcb9))

#### 7.18.37 (2024-08-01)

##### New Features

- implement deduction of credits upon download ([ac892967](https://github.com/firstlovecenter/fl-admin-portal/commit/ac8929678944bea93704f41c3cb63228faa54d16))
- implement payment options for council membership ([380454a5](https://github.com/firstlovecenter/fl-admin-portal/commit/380454a5f67c74859d9ef92070d0213140ae553f))
- implement auto credit of accounts ([dc61231e](https://github.com/firstlovecenter/fl-admin-portal/commit/dc61231e2452eec81ff000cb08915f32ea8ad6a6))
- implement backend resolver to pay for download credits ([e7f1d646](https://github.com/firstlovecenter/fl-admin-portal/commit/e7f1d6461ef4f1795143710f228b615f80d4ca21))
- implement feature to download membership list as a report ([9ff6ca36](https://github.com/firstlovecenter/fl-admin-portal/commit/9ff6ca361bba2f676cdb84ef31e262cbb8058aae))
- add conditional rendering for Defaulters menu button based on church type ([d65a4519](https://github.com/firstlovecenter/fl-admin-portal/commit/d65a45193882e274e808bb9048a318e64ab26763))

##### Bug Fixes

- update amount calculation for initiating Paystack charge ([80c7636a](https://github.com/firstlovecenter/fl-admin-portal/commit/80c7636a3146daa1015d14984b9c608951df3b5d))
- fix bug where online giving was not absorbed to serviceRecord ([d470d5d4](https://github.com/firstlovecenter/fl-admin-portal/commit/d470d5d4218dc6c22a6c98f4e798414dd2d2c907))

##### Refactors

- update member's fellowship to bacenta in resolver-cypher.ts ([ca7a8f21](https://github.com/firstlovecenter/fl-admin-portal/commit/ca7a8f213332d91e556fcd27207e1d6c3fd5a91e))
- optimize GSheets query for fetching services not banked ([12dfbe48](https://github.com/firstlovecenter/fl-admin-portal/commit/12dfbe4807f3b74beed574faf6c8ec0bff71c6ca))

#### 7.18.36 (2024-07-24)

##### Bug Fixes

- allow constituency admins to delete members ([9bf5051d](https://github.com/firstlovecenter/fl-admin-portal/commit/9bf5051de8d8cf96c368448e411f31977abc1760))

#### 7.18.35 (2024-07-24)

##### Chores

- update permit roles for directory mutation ([2c333a7f](https://github.com/firstlovecenter/fl-admin-portal/commit/2c333a7f1ac9353444a7900806f3d81b36a557cf))
- update scheduled time for gsheets-services-not-banked function ([efb682b4](https://github.com/firstlovecenter/fl-admin-portal/commit/efb682b42aad3f3fb99ad20e33e1883b4e15230f))

##### Bug Fixes

- fix unauthorized error handling in AppWithApollo component ([7c235d16](https://github.com/firstlovecenter/fl-admin-portal/commit/7c235d16da0826cf527a1c83613baea0ce8c8260))

##### Refactors

- optimize GSheets query for fetching services not banked ([0bd90039](https://github.com/firstlovecenter/fl-admin-portal/commit/0bd900393aec20b1faba72eb8d61d6d6c8845af4))

#### 7.18.34 (2024-07-19)

##### New Features

- update DefaultersQueries to include council name in services list ([20ee8688](https://github.com/firstlovecenter/fl-admin-portal/commit/20ee8688adefeb63486407064f63cbb5957223c6))

#### 7.18.33 (2024-07-16)

##### New Features

- implement button to delete member title ([c156eb3c](https://github.com/firstlovecenter/fl-admin-portal/commit/c156eb3ca026f96be689ae5b43aacd7d997c88e2))

#### 7.18.32 (2024-07-16)

##### Bug Fixes

- fix broken bacenta banking slip submission ([5b7a95c2](https://github.com/firstlovecenter/fl-admin-portal/commit/5b7a95c2399c89a9ef1e87edbcb1a279d17106f2))

##### Refactors

- handle unauthorized GraphQL errors in AppWithApollo component ([3b834ff0](https://github.com/firstlovecenter/fl-admin-portal/commit/3b834ff07240eca3e11b135af7029700e500f38c))
- handle network errors in AppWithApollo component ([56cb7259](https://github.com/firstlovecenter/fl-admin-portal/commit/56cb7259de026dc92cf287807915b0988f722a8c))
- update cypher queries to use current year in bacenta-checker-background ([f464c876](https://github.com/firstlovecenter/fl-admin-portal/commit/f464c876f3e304a0caa7d7c5f0776579084d0a82))
- update cypher queries to use current year in bacenta-checker-background ([aa131e2c](https://github.com/firstlovecenter/fl-admin-portal/commit/aa131e2c86cae24caea8497ad2303bbb2d77b706))
- update cypher queries to use current year in bacenta-checker-background ([3249e7c7](https://github.com/firstlovecenter/fl-admin-portal/commit/3249e7c76b31b62c64f28584e64b6a3a2cc2909f))
- update cypher queries to use current year in bacenta-checker-background ([81e82b30](https://github.com/firstlovecenter/fl-admin-portal/commit/81e82b301c953240ee3145c9b4e61c0e3a499354))
- update service query to use Bacenta instead of Fellowship ([1a9f0922](https://github.com/firstlovecenter/fl-admin-portal/commit/1a9f09220fc0870b5f670f1231ea0f7ff827817b))
- update service query to match all campuses ([838237aa](https://github.com/firstlovecenter/fl-admin-portal/commit/838237aab614204a60dea18412c200a767126966))
- update navigation paths for failed payments in ConfirmPayment component ([c0bb5590](https://github.com/firstlovecenter/fl-admin-portal/commit/c0bb5590b270a70f36afb4735aa5227ce57d8baa))

#### 7.18.31 (2024-07-11)

##### Refactors

- update service query to match all campuses ([35f5f04b](https://github.com/firstlovecenter/fl-admin-portal/commit/35f5f04bc877a8cbb65c8d719736f382afa6bac6))
- update banking-cypher to use Bacenta instead of Fellowship ([ff4a738f](https://github.com/firstlovecenter/fl-admin-portal/commit/ff4a738f7e4f3eadf11453bad40ecc3d68ee7e57))
- update banking-cypher to use Bacenta instead of Fellowship ([ae7c3127](https://github.com/firstlovecenter/fl-admin-portal/commit/ae7c3127493fa9ef4e2b181c6a6c3e8ee7d686ba))
- update banking-cypher to use Bacenta instead of Fellowship ([cca09e1e](https://github.com/firstlovecenter/fl-admin-portal/commit/cca09e1e8b338bf151ab0f7c04262a56b2a76881))

#### 7.18.30 (2024-07-11)

##### Bug Fixes

- bacenta service cancellationn form ([5e6b9102](https://github.com/firstlovecenter/fl-admin-portal/commit/5e6b9102aecd8fbd52fefb43a4607ebf52111ad9))

##### Refactors

- update banking-cypher to use Bacenta instead of Fellowship ([66021b21](https://github.com/firstlovecenter/fl-admin-portal/commit/66021b21aabca4f6af443c3c2272cc353c1b4790))
- update service query to match all campuses ([869aca41](https://github.com/firstlovecenter/fl-admin-portal/commit/869aca41fa5f24b66bb36474dfd4e2784d7e551a))

#### 7.18.29 (2024-07-11)

##### Bug Fixes

- fix service defaulters and changing bacenta service day ([1e5313b5](https://github.com/firstlovecenter/fl-admin-portal/commit/1e5313b5adf9ca6c51bbf9a6647d22edb133b72f))
- reemove poimen checker in synago app ([af478f86](https://github.com/firstlovecenter/fl-admin-portal/commit/af478f86ad20cd4aa67b0c8e34ac9838c193618f))

##### Refactors

- update MemberDisplay component to use Bacenta instead of Fellowship ([71ed1c76](https://github.com/firstlovecenter/fl-admin-portal/commit/71ed1c7694dba8d205d6cc6c643f50f756c1410b))
- update service cancellation logic to use Bacenta instead of Fellowship ([72e4658f](https://github.com/firstlovecenter/fl-admin-portal/commit/72e4658fc2a6646107eba0a431e51524e62c4701))

#### 7.18.28 (2024-07-09)

##### Refactors

- update createMember resolver to use bacenta instead of fellowship ([92321e06](https://github.com/firstlovecenter/fl-admin-portal/commit/92321e069ebbc22b7197778208e3565fdeb90887))

#### 7.18.27 (2024-07-09)

##### Bug Fixes

- fix issue updating member details ([1caaf7dc](https://github.com/firstlovecenter/fl-admin-portal/commit/1caaf7dcb3e6565e6fe199b4dbe6d813990881c3))

#### 7.18.26 (2024-07-08)

##### Chores

- remove unused code and update member details display ([88e0c558](https://github.com/firstlovecenter/fl-admin-portal/commit/88e0c558caabf76de7af3b0e6acf7701934b58a1))

##### Bug Fixes

- update DisplayPage to use bacenta instead of fellowship ([37a1b775](https://github.com/firstlovecenter/fl-admin-portal/commit/37a1b7754c2a7a330fb08849e4ec0177243b7aea))
- replace IC and Graduated with Red and Green ([126ab084](https://github.com/firstlovecenter/fl-admin-portal/commit/126ab08493f72373c84fe92832d154444277ff44))
- replace ic and graduated with red and green ([2d030bf4](https://github.com/firstlovecenter/fl-admin-portal/commit/2d030bf4e8e17a1944cb4491f0dfc30c8f5ae163))
- members list on constituency level ([d62a8822](https://github.com/firstlovecenter/fl-admin-portal/commit/d62a8822154d1c140bde02816c8915600bf0e5c2))

##### Refactors

- implement createbacenta form ([84946cf7](https://github.com/firstlovecenter/fl-admin-portal/commit/84946cf748de2c1cee464c958841ecebeb6b9c3c))
- refactor DetailsBacenta, DetailsOversight, DetailsDenomination ([9b7ae4a4](https://github.com/firstlovecenter/fl-admin-portal/commit/9b7ae4a4db8e46f067ebeeb8db14105f104ac367))

#### 7.18.25 (2024-07-07)

##### New Features

- fix self banking on bacenta level, hopefully ([2494fcb0](https://github.com/firstlovecenter/fl-admin-portal/commit/2494fcb0bdcc2f94c0c2fc6a56a6eee3ab2a18bc))

#### 7.18.24 (2024-07-07)

##### Chores

- refactor account open logic and update account blocked message ([7d25d707](https://github.com/firstlovecenter/fl-admin-portal/commit/7d25d70708601db5185aa301948dc5702d3dabb7))
- update dependencies and secrets for hillary-monthly-background ([62d80a14](https://github.com/firstlovecenter/fl-admin-portal/commit/62d80a1429a64aae755627b78d49f23c7ba860a0))
- add recipient for monthly background message ([686086a2](https://github.com/firstlovecenter/fl-admin-portal/commit/686086a26184f8df6b139585cd2b696588abb60e))
- refactor monthly background message generation ([c8a86f7e](https://github.com/firstlovecenter/fl-admin-portal/commit/c8a86f7e05d3b753a0f405ac77af1434912866cf))
- update monthly data retrieval query and remove unnecessary code ([608c03e9](https://github.com/firstlovecenter/fl-admin-portal/commit/608c03e9063d745b218de554d9cc2166e34c4782))
- remove unnecessary code and update monthly data retrieval query ([1be5cc0f](https://github.com/firstlovecenter/fl-admin-portal/commit/1be5cc0faf07f92d6c6332408225279a72f7a4b8))
- update checkMemberHasNoActiveRelationships query ([f4672fe9](https://github.com/firstlovecenter/fl-admin-portal/commit/f4672fe906f2d74b0708660918f830f568fff10c))
- update meeting day and status in DetailsBacenta component ([243291cf](https://github.com/firstlovecenter/fl-admin-portal/commit/243291cfb70b36579026b1dce1916f72c4a611e6))
- update email and portal names in servant account creation and deletion messages ([54b199f5](https://github.com/firstlovecenter/fl-admin-portal/commit/54b199f52f9836269234f746f15194e7081f7b8a))
- exclude deprecated fields in Neo4jGraphQL configuration ([dee047fd](https://github.com/firstlovecenter/fl-admin-portal/commit/dee047fdfb4b4832fcf43f630829ccb1ced4b5cd))

##### New Features

- improve delete note button in MemberDisplay component ([984dcb8e](https://github.com/firstlovecenter/fl-admin-portal/commit/984dcb8e1a70446d2d326e832a7d01956834460a))
- optimize sticky note functionality and improve UI in MemberDisplay component ([98e9e4d3](https://github.com/firstlovecenter/fl-admin-portal/commit/98e9e4d3235024a4585e9a80640938027080d2e4))
- add functionality to leave a sticky note on member profile ([b06e583c](https://github.com/firstlovecenter/fl-admin-portal/commit/b06e583cba5d4d4f24b1dc6c4a3339d02cfe7dda))
- update catch phrase in Login component ([ceaee566](https://github.com/firstlovecenter/fl-admin-portal/commit/ceaee5661747301d6050a54de571ad6cd13ca8e3))
- implement saving contact information ([17f7bb17](https://github.com/firstlovecenter/fl-admin-portal/commit/17f7bb1750538cf58152734743e5f9815a616f7e))
- implement feature to save contacts on member display screen ([4348c062](https://github.com/firstlovecenter/fl-admin-portal/commit/4348c0629a896b54f1d8f7c358477d749f6fa366))
- implement hillary monthly background ([ef744166](https://github.com/firstlovecenter/fl-admin-portal/commit/ef744166f81f4a1236e65d457a49be9b9b9a0e26))
- implement bacenta services forms ([d8f10569](https://github.com/firstlovecenter/fl-admin-portal/commit/d8f10569f2fd55fa7b9995cd125425434019807a))

##### Bug Fixes

- correct lastMonth calculation in hillary-monthly-background ([3d5d225c](https://github.com/firstlovecenter/fl-admin-portal/commit/3d5d225c7cf293638e691125f4746ff329681621))
- update lastMonth calculation in hillary-monthly-background ([4f3eb99d](https://github.com/firstlovecenter/fl-admin-portal/commit/4f3eb99d56eaa9e961b459e4c4ac8668b0a6f2cd))
- update lastMonth calculation in hillary-monthly-background ([90907e65](https://github.com/firstlovecenter/fl-admin-portal/commit/90907e65f571f1a1c2f4d70beb8bdf7f85c2d853))
- remove ability to close down bacentas ([423dead1](https://github.com/firstlovecenter/fl-admin-portal/commit/423dead1589647899ab8a4ab2a0de66ca715b2f8))

##### Refactors

- update title abbreviations in resolvers.ts ([9e52d763](https://github.com/firstlovecenter/fl-admin-portal/commit/9e52d763bad9e02a51988b2c28a2f88d1000b72b))
- adjust attendance and vehicle logic in arrivalsMutation resolver ([f83fdfcf](https://github.com/firstlovecenter/fl-admin-portal/commit/f83fdfcfc3419384278b44f8cfb233ded9543480))
- update cypher queries to assign properties and relationships to bacenta ([fa2efffd](https://github.com/firstlovecenter/fl-admin-portal/commit/fa2efffd0ede1fc1df64dfe1de507e63f9ea35fa))

#### 7.18.23 (2024-05-26)

##### Bug Fixes

- update permissions for graph routes ([05a80d77](https://github.com/firstlovecenter/fl-admin-portal/commit/05a80d77cc13bd37c1d3785473afd802b1b7d6f5))

#### 7.18.22 (2024-05-12)

##### Refactors

- remove commented code in directory helper functions ([5820eb7d](https://github.com/firstlovecenter/fl-admin-portal/commit/5820eb7dbfed63e249cccd1959fcd1ddb673f96f))

#### 7.18.21 (2024-05-11)

##### New Features

- add admin roles for denominations and oversight in directory CRUD schema ([942230f7](https://github.com/firstlovecenter/fl-admin-portal/commit/942230f727a29341404e3a0fbf17e902022a938c))

##### Refactors

- remove commented code in directory helper functions ([774f1633](https://github.com/firstlovecenter/fl-admin-portal/commit/774f163335ce251f9ea6b44c443c2995c5226ae0))

#### 7.18.20 (2024-05-01)

##### Refactors

- directory-resolvers.ts and schema.graphql, and update CreateMemberAccount mutation ([6db8773d](https://github.com/firstlovecenter/fl-admin-portal/commit/6db8773ddf0c30ceed4bd926272c1aefedd2cb14))

#### 7.18.19 (2024-05-01)

##### New Features

- update member authentication ID in resolver-cypher.ts and directory-resolvers.ts ([ab5a5d18](https://github.com/firstlovecenter/fl-admin-portal/commit/ab5a5d18b4f7f5676b57128000c7fd888a625014))
- implement button that makes round trip to db ([b69f6085](https://github.com/firstlovecenter/fl-admin-portal/commit/b69f60850d8e6c0a0535d96a875609af0aee028a))
- add debug scripts to retrieve specific service records and their associated member details ([6876837d](https://github.com/firstlovecenter/fl-admin-portal/commit/6876837dc37222f6ea17b02e6c4f606a72901b85))
- update email notification content in ([d7c46560](https://github.com/firstlovecenter/fl-admin-portal/commit/d7c4656070233069c94cdd0137c870e47792852d))
- add 'onStageAttendanceAggregate' to the list of noIncomeGraphLevels in global-utils.ts ([7b16f30a](https://github.com/firstlovecenter/fl-admin-portal/commit/7b16f30ad1a576ab2fc270c3bd9fed66a66055f7))
- add uniqueServiceRecordTransaction and uniqueTransactionReference constraints ([df69bd98](https://github.com/firstlovecenter/fl-admin-portal/commit/df69bd987c64777cf42b0558338e3930386a006f))
- update email notification content in bacenta-checker-background.js ([92ca889c](https://github.com/firstlovecenter/fl-admin-portal/commit/92ca889c0a4bd14ac25dfe029150f12e98153e77))
- add email notification for successful Bacenta Checker Background Job ([5016d1cb](https://github.com/firstlovecenter/fl-admin-portal/commit/5016d1cb621bf770f9b6efa4224435687a20c230))

##### Bug Fixes

- fix typo in banking-cypher.ts and financial-utils.ts ([5371d8d7](https://github.com/firstlovecenter/fl-admin-portal/commit/5371d8d742986a6869d3d64a3a485749edbeeb9b))
- update imclDefaulters count for anagkazo banking ([131e194b](https://github.com/firstlovecenter/fl-admin-portal/commit/131e194bafa4e5427740c1c13b3094fcc56bd4bf))
- missing serviceDay check in rehearsal-resolver.ts ([d272372e](https://github.com/firstlovecenter/fl-admin-portal/commit/d272372e7e4ba3bc10c3f5c7fb3c734641e2016e))
- commented out code in rehearsal-resolver.ts ([61b33e53](https://github.com/firstlovecenter/fl-admin-portal/commit/61b33e53a668c5e977f8909fba7ed85b73023f9e))

##### Refactors

- close-church-creativearts-cypher.ts to exclude closed fellowships ([8e34098f](https://github.com/firstlovecenter/fl-admin-portal/commit/8e34098fce029bfcddd7cfecf7993f6f03736ab0))
- recordOnStageAttendance query in rehearsal-cypher.ts ([91262dbb](https://github.com/firstlovecenter/fl-admin-portal/commit/91262dbb263a697eef1a2d3f28dab01f2a9dba56))
- rehearsal-cypher.ts to use ([8accc668](https://github.com/firstlovecenter/fl-admin-portal/commit/8accc6686a7db2aa0acd37c757d6e0d5a26a8bab))
- refactor cypher queries in before-next-update.cypher and poimen-issue-fixes.cypher ([9fb45acf](https://github.com/firstlovecenter/fl-admin-portal/commit/9fb45acf6530298ad49fb5f0bb1cf4158dc33330))

#### 7.18.18 (2024-04-14)

##### New Features

- add history logging for demoting and promoting Bacenta status ([054b9635](https://github.com/firstlovecenter/fl-admin-portal/commit/054b9635cfc91239a6ed61e9ce84d4492a91ae20))
- remove old bacenta status work ([1ede8bff](https://github.com/firstlovecenter/fl-admin-portal/commit/1ede8bff9c7797f99f58fcad062183be18c51542))
- implemeentation of bacenta checker background fn ([4b96e28e](https://github.com/firstlovecenter/fl-admin-portal/commit/4b96e28e5413dd9cf340c5cae82bac49ad9ea457))
- add Cypher query to retrieve campus, church, pastor, stream, ([d8d74d3d](https://github.com/firstlovecenter/fl-admin-portal/commit/d8d74d3dd6ffa0b733d40d316d5b9f10c0df005a))

##### Bug Fixes

- update Bacenta count display in DetailsStream, DetailsCampus, ([a6bb92ae](https://github.com/firstlovecenter/fl-admin-portal/commit/a6bb92aed8c6fbcd31ee667bced470a471b8a305))
- add secrets.js for bacenta-checker-background ([519d4f1f](https://github.com/firstlovecenter/fl-admin-portal/commit/519d4f1fb9ba08d4b5bb22f2aa1f572cc99d3026))
- update schedule time for bacenta-checker-background.js ([b2e1b1dc](https://github.com/firstlovecenter/fl-admin-portal/commit/b2e1b1dc49edd45289b1b5f345bb4faf2ca86640))
- update cypher.js to include bussing date filter ([0535b36f](https://github.com/firstlovecenter/fl-admin-portal/commit/0535b36fede3c7d8de25a65e24a7b464394d49a8))

#### 7.18.17 (2024-04-11)

##### Refactors

- update account menu roles ([3641476e](https://github.com/firstlovecenter/fl-admin-portal/commit/3641476ee0458aec3e66210866bb39326f06e6fe))

#### 7.18.16 (2024-04-09)

##### Bug Fixes

- add tellerConfirmationTime field to ServiceRecord and update related components ([0b11fa2a](https://github.com/firstlovecenter/fl-admin-portal/commit/0b11fa2a48891bc0a0485c5098d08b3b1c252634))

##### Refactors

- code to add bank account field in ministry details ([bd4e20a9](https://github.com/firstlovecenter/fl-admin-portal/commit/bd4e20a9e76397af6116e835bc19da18a51530c6))
- refactor banking-cypher.ts to support multiple record types ([73be28d8](https://github.com/firstlovecenter/fl-admin-portal/commit/73be28d8c1be73de94ceb476e2a710f8da2bef46))
- code to update transaction status in payment-background.js ([97b2f783](https://github.com/firstlovecenter/fl-admin-portal/commit/97b2f783cf3750028c94f038ce1e506629506d52))
- code to update HubCouncilSundayAttendance and HubCouncilFormMenu ([712fb8b0](https://github.com/firstlovecenter/fl-admin-portal/commit/712fb8b051696a5cd4f0d11d49cb0d85979adb02))
- rehearsal-cypher and rehearsal-resolver files ([d90c64df](https://github.com/firstlovecenter/fl-admin-portal/commit/d90c64df61b0b4e614a159f04fc5265079cc8c5e))
- code to update HubCouncilSundayAttendance and HubCouncilFormMenu ([2c92e5c2](https://github.com/firstlovecenter/fl-admin-portal/commit/2c92e5c2f7697e5b5cca2b3bb2e239c1266c2587))
- refactor code to delete MinistryAttendanceRecord and update HubSundayMeetingDetails comp ([7aa92b8b](https://github.com/firstlovecenter/fl-admin-portal/commit/7aa92b8bf0ed9058cfd7ff3277357ce3c336e862))

#### 7.18.15 (2024-04-07)

##### Bug Fixes

- fix issue with Meeting Forms button not showing ([a2541c10](https://github.com/firstlovecenter/fl-admin-portal/commit/a2541c1040964005ec2a15507c7047941ca6afff))
- fix error in cancelLowerChurchRehearsals ([1f7dfb20](https://github.com/firstlovecenter/fl-admin-portal/commit/1f7dfb20a008fec3b98b16abb81b9ce0e9719c1b))

#### 7.18.14 (2024-04-07)

##### New Features

- add new codes for upcoming weeks ([37ef3188](https://github.com/firstlovecenter/fl-admin-portal/commit/37ef318852eab5586613f53b30dacc038d1be4fc))

##### Bug Fixes

- fix typos and rename component for CancelledRehearsalsThisWeek ([5454390d](https://github.com/firstlovecenter/fl-admin-portal/commit/5454390d9e9836f1ace74097967374e55655c9db))

#### 7.18.13 (2024-04-04)

##### Bug Fixes

- allow creative peopele to see comparative bacenta side pages ([c3930077](https://github.com/firstlovecenter/fl-admin-portal/commit/c39300777a58d36b2a468708657854ee5876c2cd))
- commented out anagkazo from automated gsheet accra ([66633433](https://github.com/firstlovecenter/fl-admin-portal/commit/66633433e11e9827f531dc3f35a9521412d00822))

#### 7.18.12 (2024-04-02)

##### New Features

- moved defaulters into the church list options ([5df298e4](https://github.com/firstlovecenter/fl-admin-portal/commit/5df298e45ac9a0f62cafc8b846132233b075caaf))

##### Bug Fixes

- remove unused account options ([f0d4c757](https://github.com/firstlovecenter/fl-admin-portal/commit/f0d4c757a2c3498294446d7f99f9e0ec7f8e26bf))

#### 7.18.11 (2024-04-01)

##### New Features

- update ministry role in AllMinistries component ([4377edf9](https://github.com/firstlovecenter/fl-admin-portal/commit/4377edf9d07da19859fe144bcb6a6102af009198))

##### Bug Fixes

- add isAdminForOversight field to MemberRoleList and ReadQueries ([1241ad79](https://github.com/firstlovecenter/fl-admin-portal/commit/1241ad7959120a30b8287e29370f0f32097aa688))

#### 7.18.10 (2024-03-12)

##### New Features

- update code of the day for March ([a595f935](https://github.com/firstlovecenter/fl-admin-portal/commit/a595f9354e8904805e2e9abf90b1e203142827ef))

##### Bug Fixes

- add month field to AggregateBussingRecord and AggregateServiceRecord ([af159300](https://github.com/firstlovecenter/fl-admin-portal/commit/af15930054b28074d39d672ce344c9c730254d20))
- remove console.log statement in banking-resolver.ts ([7c147136](https://github.com/firstlovecenter/fl-admin-portal/commit/7c147136f3dfdcfd8edb42479a1c91bd0cdc5d7b))
- fix error in banking resolver ([86efa01d](https://github.com/firstlovecenter/fl-admin-portal/commit/86efa01d0df0af3689d3fce2229e0b321ddee2c1))
- error handling in banking resolver ([9be1733d](https://github.com/firstlovecenter/fl-admin-portal/commit/9be1733d219328692fe7d4c7ffef2ce2cf513339))
- refactor authentication in banking resolver ([0bf4f5bd](https://github.com/firstlovecenter/fl-admin-portal/commit/0bf4f5bdac97712f4562b67654cc8a4005cf5172))

##### Refactors

- displayChurchDetails component ([6497eec1](https://github.com/firstlovecenter/fl-admin-portal/commit/6497eec1a29ce272bb125dfcd7d22c1528886b1f))

#### 7.18.9 (2024-03-07)

##### New Features

- add gsheets-accra-background and gsheets-update-outaccra-background functions ([cc79e68e](https://github.com/firstlovecenter/fl-admin-portal/commit/cc79e68e00fa710e786ea6a99f6238d1cbc56784))

##### Bug Fixes

- update roles from 'Stream' to 'Campus' ([94da2680](https://github.com/firstlovecenter/fl-admin-portal/commit/94da2680b3b27bff08fcc08bf07346c37e2612a6))
- add payment background function and secrets encryption ([1bd6ab04](https://github.com/firstlovecenter/fl-admin-portal/commit/1bd6ab046a309954a703516dab808591899d1be3))
- update secrets.js file paths in encrypt-secrets.js ([e5f0105d](https://github.com/firstlovecenter/fl-admin-portal/commit/e5f0105dd402a86f0815b879c9dd7b982e71e68a))
- update error logging in banking resolver ([14751d1a](https://github.com/firstlovecenter/fl-admin-portal/commit/14751d1a17541c0f2631785fc815ed92fa4fb848))

##### Refactors

- anagkazoAmountNotBankedQuery in cypher.js ([b307d7c9](https://github.com/firstlovecenter/fl-admin-portal/commit/b307d7c9606da2dcb8f2d6dbf542572ee6d5e2ee))

#### 7.18.8 (2024-03-04)

##### Bug Fixes

- add console log for error response data ([15e3b196](https://github.com/firstlovecenter/fl-admin-portal/commit/15e3b196baf661203651ffb4d6b6679e560eb9a4))

#### 7.18.7 (2024-03-03)

##### New Features

- update RoleView roles to permitAdmin('Stream') ([3759e925](https://github.com/firstlovecenter/fl-admin-portal/commit/3759e925cbe0cf55fc460505e43e4507d6746f56))
- update gsheets-accra.js with new data positions ([b70ef0b0](https://github.com/firstlovecenter/fl-admin-portal/commit/b70ef0b0a059f602f3ba649ef7ec3b0a32e037b7))

##### Bug Fixes

- update roles in servicesRoutes.ts ([91c2e57e](https://github.com/firstlovecenter/fl-admin-portal/commit/91c2e57e33d68d5319ddf7a5e296758e60e64d24))

#### 7.18.6 (2024-02-29)

##### New Features

- add Oversight Dashboard component and related GraphQL queries ([050190ff](https://github.com/firstlovecenter/fl-admin-portal/commit/050190ffcd24c4c9182109da32b79efa890fc8f6))

##### Bug Fixes

- add 'Stream' and 'Bishop' columns to councilList query ([22f3665f](https://github.com/firstlovecenter/fl-admin-portal/commit/22f3665fd3f565039d8997b54d10724e99d58be4))

#### 7.18.5 (2024-02-28)

##### New Features

- update banking roles from 'Campus' to 'Stream' ([cb2b0f43](https://github.com/firstlovecenter/fl-admin-portal/commit/cb2b0f43b741991c751267d2cdbb4a4cee0ad2e6))

#### 7.18.4 (2024-02-27)

##### New Features

- add anagkazoAmountBanked query execution ([92c144e4](https://github.com/firstlovecenter/fl-admin-portal/commit/92c144e457ead203402045e18af22b38835814f0))
- add debugging scripts and update ServicesMenu component ([3ac116e1](https://github.com/firstlovecenter/fl-admin-portal/commit/3ac116e18d09ec14bdea61fb2f8678a82d79beb1))

##### Bug Fixes

- update RoleView roles in ServiceDetails component ([23669504](https://github.com/firstlovecenter/fl-admin-portal/commit/2366950487354d06120e87372c9fd26e5a96c5fa))
- update banking resolver error handling ([841fcc4e](https://github.com/firstlovecenter/fl-admin-portal/commit/841fcc4eabfe6cf6db32032fbd38d269c781e499))
- remove unused import and commented code, handle transaction not found error ([40643420](https://github.com/firstlovecenter/fl-admin-portal/commit/4064342006a3988cfaf33855f967f632ce5ef08c))
- correctly import secrets for auto gsheets functions ([05105ad9](https://github.com/firstlovecenter/fl-admin-portal/commit/05105ad9a7108dd4ffd4ee8f6ba757fea5718bee))

##### Refactors

- anagkazoAmountBankedQuery to not include Donald's attendance and income ([956553f0](https://github.com/firstlovecenter/fl-admin-portal/commit/956553f08f22b59b47ce1bef83a0c4043f5f1ede))

#### 7.18.3 (2024-02-13)

##### New Features

- add basontaMemberSearch query to SearchMember component ([3488f40a](https://github.com/firstlovecenter/fl-admin-portal/commit/3488f40aa845de392fd8ab5079bcc6c3057821f2))
- add anagkazoAmountBankedData to writeToGsheet function ([c572f0a9](https://github.com/firstlovecenter/fl-admin-portal/commit/c572f0a9332bc2241b934addbb52d7b9197689a6))

##### Bug Fixes

- update schedule for gsheets-accra and gsheets-update-outaccra functions ([785885a2](https://github.com/firstlovecenter/fl-admin-portal/commit/785885a2272fa6c6fa11331e585f2a3a90325e57))
- update schedule for gsheets-accra and gsheets-update-outaccra ([68d7789a](https://github.com/firstlovecenter/fl-admin-portal/commit/68d7789a0262878f533e3ca42f2421b55f27b22d))
- update writeToGSheet function to use update instead of append ([6cbf0c59](https://github.com/firstlovecenter/fl-admin-portal/commit/6cbf0c593b6c53af65821a95d574257913efe1b5))
- add writeToGsheet for amountBankedData ([a8756bcb](https://github.com/firstlovecenter/fl-admin-portal/commit/a8756bcb5683151d51523f8ff5012b53e2a4f279))

##### Refactors

- service-cypher.ts to include record description in the query ([d60a59d0](https://github.com/firstlovecenter/fl-admin-portal/commit/d60a59d0f4caf06cbeb7b602ae92e0707b7a966a))

#### 7.18.2 (2024-02-11)

##### New Features

- add undo transaction functionality ([eff79641](https://github.com/firstlovecenter/fl-admin-portal/commit/eff7964124f39bbc7c8119cbbdc0cfd61b9f91d5))

##### Bug Fixes

- remove unused import and update import path ([723cdf1b](https://github.com/firstlovecenter/fl-admin-portal/commit/723cdf1baacd46c067b8437a0cbe1633ab5596b8))
- fixing bugs and adding new features ([f8a76d4e](https://github.com/firstlovecenter/fl-admin-portal/commit/f8a76d4e58b3640cff47ad7b0b4fd8ad7e8f08ef))
- add text-center class to transaction details div ([13b1a11a](https://github.com/firstlovecenter/fl-admin-portal/commit/13b1a11a58c96429009a949c2d39b58b0f931373))

#### 7.18.1 (2024-02-07)

##### Bug Fixes

- implement undo transaction button ([f0c123b9](https://github.com/firstlovecenter/fl-admin-portal/commit/f0c123b99db860e96c3829b9e7e6020b57294603))
- remove non-required exclamation marks in Council schema ([7f1d43b2](https://github.com/firstlovecenter/fl-admin-portal/commit/7f1d43b2c0c57d8fc5a92eeb2247ef71e4c2db31))
- add gsheets-services-not-banked function and dependencies ([19ce419a](https://github.com/firstlovecenter/fl-admin-portal/commit/19ce419ae98230a5d909a74c966bfb06879f1fe7))
- add gsheets-not-banked function and dependencies ([0e4aa84f](https://github.com/firstlovecenter/fl-admin-portal/commit/0e4aa84f4ba516ef5885dd6a755f7b3c1b9f18f9))
- update 'Council' field to display as a comma-separated string ([3721c9b6](https://github.com/firstlovecenter/fl-admin-portal/commit/3721c9b63bfb67b07426e16df3529fe0cf7c6656))
- recipient typo and add additional recipient numbers ([1704fa82](https://github.com/firstlovecenter/fl-admin-portal/commit/1704fa82522eb1f73935a0ff61913892ae0116fb))
- update councilListQuery and writeToGsheet functions ([182dbddb](https://github.com/firstlovecenter/fl-admin-portal/commit/182dbddbfa9af65410408ece5c39606140292879))
- update schedule for gsheets functions ([0bfd79a6](https://github.com/firstlovecenter/fl-admin-portal/commit/0bfd79a614a43a07363b019778747b0001583134))

##### Refactors

- cypher.js to collect distinct council names ([b4db1413](https://github.com/firstlovecenter/fl-admin-portal/commit/b4db1413b929bc97fe4f9c737fee30371d3130b9))
- add npmrc and package.json files for gsheets-accra and gsheets-update-outaccra functions ([afced8e7](https://github.com/firstlovecenter/fl-admin-portal/commit/afced8e7b76f7c3e54fd1ed17263221cd33cad2e))

### 7.18.0 (2024-02-07)

##### Bug Fixes

- update package name to accra-gsheets ([9703482d](https://github.com/firstlovecenter/fl-admin-portal/commit/9703482d05c2f4480ca7ac544232e4d6fcbe8b9f))
- remove admin-portal-types from root ([3c788425](https://github.com/firstlovecenter/fl-admin-portal/commit/3c788425215f93010d6bc6a857694f91b0c21897))
- add secrets build for services-not-banked function ([21b7fba3](https://github.com/firstlovecenter/fl-admin-portal/commit/21b7fba3ddce0b76a4411f3fadb59f9935fd6c90))
- add new functions for updating Google Sheets with data from Neo4j ([5a899c95](https://github.com/firstlovecenter/fl-admin-portal/commit/5a899c955b6f9e91ca0d206023b80c13dfa9bbbe))
- add .npmrc files for accra-gsheets and update-outaccra-gsheets functions ([1a7a1bf8](https://github.com/firstlovecenter/fl-admin-portal/commit/1a7a1bf80a40d15ce4ad49850bfd771d858486d4))
- add npmrc file ([88988b15](https://github.com/firstlovecenter/fl-admin-portal/commit/88988b15cd327fa967f17214b3439fdea1d566af))
- update debugging scripts and payment functions ([c254a5d5](https://github.com/firstlovecenter/fl-admin-portal/commit/c254a5d5612ccdda8db6b7df796c4481ba7254d7))
- typo in service-cypher.ts ([84adb01c](https://github.com/firstlovecenter/fl-admin-portal/commit/84adb01cdfc5bc46009598fb2d8d5e4afacec497))
- update code of the day ([de6bef97](https://github.com/firstlovecenter/fl-admin-portal/commit/de6bef97f24503a31b77fd80e849ff7452d2d75c))
- update banking slip URL and add new admin permissions ([128ba88c](https://github.com/firstlovecenter/fl-admin-portal/commit/128ba88c5ca179f99c68d093afee318d7ebf1824))
- update account opening hours ([784a671c](https://github.com/firstlovecenter/fl-admin-portal/commit/784a671c3629f685b4c70f6f8d80c279bcb4ba40))

#### 7.17.8 (2024-02-01)

##### Bug Fixes

- update account opening hours ([c69a13f1](https://github.com/firstlovecenter/fl-admin-portal/commit/c69a13f14173f5ac4dd66d9b8d8e13c804b48624))

#### 7.17.7 (2024-01-30)

##### Bug Fixes

- update Cypher queries and add new marital status option ([daafb339](https://github.com/firstlovecenter/fl-admin-portal/commit/daafb339d922f78c765c68e73aa631b7046b64bc))

##### Refactors

- service-cypher.ts to include serviceDate in aggregate record ([2e4dfc6e](https://github.com/firstlovecenter/fl-admin-portal/commit/2e4dfc6e4476b5bde2b623ce237a008b6d6314a6))

#### 7.17.6 (2024-01-29)

##### New Features

- add 'oa_sunyani' stream option ([188dd4dd](https://github.com/firstlovecenter/fl-admin-portal/commit/188dd4dd49f433ce9c2ea1346cf0cbdedee8e0f5))
- update handler function ([a7864d72](https://github.com/firstlovecenter/fl-admin-portal/commit/a7864d72e0c4bbc6a435c1a5ca54ba6cc86a0fbb))
- update gsheet with neo4j data ([ada7522a](https://github.com/firstlovecenter/fl-admin-portal/commit/ada7522a61961b09a51147b2dfd694724ffc748c))
- add update-g-sheets function and package.json ([9fdf14db](https://github.com/firstlovecenter/fl-admin-portal/commit/9fdf14dbcbf08e35fa7c2b01ce1260d5321c5614))
- add personalized greeting in SMS messages ([6dc79dc0](https://github.com/firstlovecenter/fl-admin-portal/commit/6dc79dc041158131cb0fe25f6abc688f3f7d6abf))

##### Bug Fixes

- update schedule for update-g-sheets.js ([aefff4b5](https://github.com/firstlovecenter/fl-admin-portal/commit/aefff4b528bf55748ff60a96803f4448accd5c6d))
- update console log messages and requestBody in update-g-sheets.js ([1e0d0a4a](https://github.com/firstlovecenter/fl-admin-portal/commit/1e0d0a4aeedf4e3bdfb0725f384ffab7dd6d9a0c))
- update gsecrets.js and update-g-sheets.js files ([cd1ad556](https://github.com/firstlovecenter/fl-admin-portal/commit/cd1ad556e968d91ec30ae832b38ba9013a6e6736))
- ipdate Google Sheets credentials ([9c3bc4ba](https://github.com/firstlovecenter/fl-admin-portal/commit/9c3bc4ba60fa8d3ccc7406f2a71f88991dd632b9))
- add console log statement to print data ([bba1b242](https://github.com/firstlovecenter/fl-admin-portal/commit/bba1b2427420e4b9117bc3a7a5b253e28c8791e2))
- update package.json and file paths ([4b1198e8](https://github.com/firstlovecenter/fl-admin-portal/commit/4b1198e8ec22482085ff351755d1be5f8cbae3e9))
- add googleapis dependency ([9753a637](https://github.com/firstlovecenter/fl-admin-portal/commit/9753a637561d746d6db4ef27f6648aa7c4dadbe0))
- update react-bootstrap version to 2.10.0 ([9452002c](https://github.com/firstlovecenter/fl-admin-portal/commit/9452002c2fe57ec1af6001c72bed0f16a7fea6f7))
- update dependencies and secrets.js path ([64360881](https://github.com/firstlovecenter/fl-admin-portal/commit/6436088143e4633f1f6f7ca3c3fd90a46eba9a8a))
- fix Google API import and update schedule time ([3f196856](https://github.com/firstlovecenter/fl-admin-portal/commit/3f1968562bfa568342c712bc24994e7d39710093))
- add debugging scripts and update banking slip URL ([4fa7c5db](https://github.com/firstlovecenter/fl-admin-portal/commit/4fa7c5db10507127f735826c6820aba31a13b6ef))
- update subaccount in financial-utils.ts ([24b65013](https://github.com/firstlovecenter/fl-admin-portal/commit/24b65013ca44f6ee0b43cdaeaf2330ba85a6a283))
- add convertNeoWeekdayToJSWeekday function to arrivals-utils.ts ([8c4c338e](https://github.com/firstlovecenter/fl-admin-portal/commit/8c4c338e00e86e7f8a44d8285db3708800467041))
- update subaccount names in financial-utils.ts ([0185f9bb](https://github.com/firstlovecenter/fl-admin-portal/commit/0185f9bbf92a9839610a58ea76eca76c1badc104))
- error handling in banking resolver ([a5dd19fa](https://github.com/firstlovecenter/fl-admin-portal/commit/a5dd19fa63432737622edfca67f26d3a91e6df54))
- error handling and close sessions in treasury resolvers ([9a7736fb](https://github.com/firstlovecenter/fl-admin-portal/commit/9a7736fb0b19b8717c5302ecff73b8af3ca81cf4))
- update sorting order for bussing records ([6397c9d8](https://github.com/firstlovecenter/fl-admin-portal/commit/6397c9d8bd9ff7c8b7f2b74214371dd334418782))

##### Refactors

- data retrieval and update process ([b7781179](https://github.com/firstlovecenter/fl-admin-portal/commit/b7781179e3f29077e713e548d07ef75604c37278))
- fetchData function to include date filtering ([d7d16559](https://github.com/firstlovecenter/fl-admin-portal/commit/d7d165595783960e0b1a5dc946da3a2eba9de803))
- initializeDatabase function in update-g-sheets.js ([b5d1ae9f](https://github.com/firstlovecenter/fl-admin-portal/commit/b5d1ae9fce8df2c2f00e04902052baa58ab634da))

#### 7.17.5 (2024-01-19)

##### Bug Fixes

- remove unnecessary code and simplify isArrivalsToday function ([905e13fc](https://github.com/firstlovecenter/fl-admin-portal/commit/905e13fc60508ea4997164eae037a7b979dddb71))

#### 7.17.4 (2024-01-17)

##### New Features

- update code of the day function till jann 2024 ([fa50dbc2](https://github.com/firstlovecenter/fl-admin-portal/commit/fa50dbc240ed3e8d92e685e11e82d0f7e55c06d5))

##### Bug Fixes

- remove network errors from snack bar ([1f90eb9c](https://github.com/firstlovecenter/fl-admin-portal/commit/1f90eb9c51da012ef6c947c3f27ea65edce87a4a))
- null description check in service-cypher.ts ([abc34199](https://github.com/firstlovecenter/fl-admin-portal/commit/abc34199693cc336efa7b31c6f9c5a94fe337c9a))

#### 7.17.3 (2024-01-11)

##### Bug Fixes

- update import statement for ChurchLevel in AllCampusConstituencies.tsx ([430f5618](https://github.com/firstlovecenter/fl-admin-portal/commit/430f5618d0991e67e5b54e9a92ceaab4ffcd3905))

#### 7.17.2 (2024-01-11)

##### Chores

- update Apollo Client and Server versions in package.json Update dependencies in web-react-ts/package.json ([7c076897](https://github.com/firstlovecenter/fl-admin-portal/commit/7c076897ecdab301187285249a914c121080904a))

##### New Features

- implement joint rehearsal feature for hub council and ministry levels ([6eb0bd59](https://github.com/firstlovecenter/fl-admin-portal/commit/6eb0bd591e0792e1c4574a1843d737a380845b44))
- add Ministry Rehearsal Service and Details pages ([c3e7d64f](https://github.com/firstlovecenter/fl-admin-portal/commit/c3e7d64fcf9697b6bd49974f17cf3559b1d4c06a))
- update church filters and add MinistryFormMenu component ([fbae475e](https://github.com/firstlovecenter/fl-admin-portal/commit/fbae475e6480e50bfa46019c0a3cbe4a18cdd335))
- implement hub council joint rehearsal filling ([060877fb](https://github.com/firstlovecenter/fl-admin-portal/commit/060877fbbf4652a0559c1aade72df722b91603dc))

##### Bug Fixes

- fix issue with matching member and IMCL status ([99cd69a4](https://github.com/firstlovecenter/fl-admin-portal/commit/99cd69a415de6bf63af66e0f5e2ce15fd8905f52))
- remove unused code for displaying meeting forms ([40689171](https://github.com/firstlovecenter/fl-admin-portal/commit/406891717c37d03765c89429d5bc4df30a9123b3))
- add additional church types to banking checker query ([37c16ccc](https://github.com/firstlovecenter/fl-admin-portal/commit/37c16ccc19acf5cb8d8acfe44420cb852bc25143))
- changes for joint rehearsal ([82dacedf](https://github.com/firstlovecenter/fl-admin-portal/commit/82dacedfa6405a4bb83f1c1dd5fa72b429352c0d))

#### 7.17.1 (2024-01-08)

##### Documentation Changes

- update CHANGELOG.md ([153d0a3a](https://github.com/firstlovecenter/fl-admin-portal/commit/153d0a3aadd15816ca375df6fbb8dbf7d2f680a2))
- update CHANGELOG.md ([ead97690](https://github.com/firstlovecenter/fl-admin-portal/commit/ead9769088b231c4d498c03f781b62ba9df639c2))

##### New Features

- implement stream special service form ([3870f9be](https://github.com/firstlovecenter/fl-admin-portal/commit/3870f9befb9c06aab01d533043f6cc34b8a90c94))
- resolver for manually confirming offering payment ([f822dcf0](https://github.com/firstlovecenter/fl-admin-portal/commit/f822dcf065c0bb176dd4878d0354488075c4b795))

##### Bug Fixes

- update labels for foreign currency and cheques in ServiceDetails and ServiceForm ([ce34785b](https://github.com/firstlovecenter/fl-admin-portal/commit/ce34785b35e71ae40ead485bf0e77ddaf4c2e536))
- properly format data in the foreign currency and cheques column ([25fe63ff](https://github.com/firstlovecenter/fl-admin-portal/commit/25fe63ffd5f719fd2d0e18b2abfa2f9934c9d5c6))
- allow confirming of banking status when status is not just failed, but abandon ([e43fd23f](https://github.com/firstlovecenter/fl-admin-portal/commit/e43fd23f9f7ea7dd73319e1d084522696a2588c3))
- implement frontend feature to manually confirm offering ([c109bf1b](https://github.com/firstlovecenter/fl-admin-portal/commit/c109bf1b8f1dbe35ceeafdaa10b4cd1b9909d060))
- return year of aggregate record in descending order ([f64ca6ab](https://github.com/firstlovecenter/fl-admin-portal/commit/f64ca6ab3fc41fb477717bd83d92f808ae334eaf))

##### Refactors

- refactor sorting logic and update card border color ([fe29b37a](https://github.com/firstlovecenter/fl-admin-portal/commit/fe29b37aa361a39d7bfbe2d66b8668cd15e47acb))
- update title for Add Treasurers button ([425deb90](https://github.com/firstlovecenter/fl-admin-portal/commit/425deb9056762b45280625559182f6c3c07afcc3))

### 7.17.0 (2024-01-07)

### 7.16.0 (2024-01-07)

##### New Features

- implement stream special service form ([3870f9be](https://github.com/firstlovecenter/fl-admin-portal/commit/3870f9befb9c06aab01d533043f6cc34b8a90c94))
- resolver for manually confirming offering payment ([f822dcf0](https://github.com/firstlovecenter/fl-admin-portal/commit/f822dcf065c0bb176dd4878d0354488075c4b795))

##### Bug Fixes

- allow confirming of banking status when status is not just failed, but abandon ([e43fd23f](https://github.com/firstlovecenter/fl-admin-portal/commit/e43fd23f9f7ea7dd73319e1d084522696a2588c3))
- implement frontend feature to manually confirm offering ([c109bf1b](https://github.com/firstlovecenter/fl-admin-portal/commit/c109bf1b8f1dbe35ceeafdaa10b4cd1b9909d060))
- return year of aggregate record in descending order ([f64ca6ab](https://github.com/firstlovecenter/fl-admin-portal/commit/f64ca6ab3fc41fb477717bd83d92f808ae334eaf))

##### Refactors

- refactor sorting logic and update card border color ([fe29b37a](https://github.com/firstlovecenter/fl-admin-portal/commit/fe29b37aa361a39d7bfbe2d66b8668cd15e47acb))
- update title for Add Treasurers button ([425deb90](https://github.com/firstlovecenter/fl-admin-portal/commit/425deb9056762b45280625559182f6c3c07afcc3))

#### 7.15.6 (2024-01-02)

##### Bug Fixes

- update year filter in GraphQL queries ([e7e7c9f5](https://github.com/firstlovecenter/fl-admin-portal/commit/e7e7c9f56c25eadb7bfc0937c3d2e271c5e84fcf))
- add debugging scripts and update service resolvers ([a93f3b74](https://github.com/firstlovecenter/fl-admin-portal/commit/a93f3b747f69001a834b9d3910ebcf16deb4d2ff))
- update service-resolvers.ts to include 'Council' label in the condition ([e46e5ea9](https://github.com/firstlovecenter/fl-admin-portal/commit/e46e5ea91126fc2b4f9def1623b2cd95ddcda469))
- attendance recording for Sunday bussing ([d50cf9ba](https://github.com/firstlovecenter/fl-admin-portal/commit/d50cf9baedf6e631897f3610f36d0d3a95d5b142))

##### Refactors

- refactor service label check in serviceMutation ([79834ce9](https://github.com/firstlovecenter/fl-admin-portal/commit/79834ce98f7017a8c309fbb84b6913570fbdfce4))

#### 7.15.5 (2023-12-17)

#### 7.15.4 (2023-12-17)

#### 7.15.3 (2023-12-17)

##### New Features

- arrivalDate is used to retrieve payment data and not today's date ([94e8932f](https://github.com/firstlovecenter/fl-admin-portal/commit/94e8932f598d2abe5d418c03d4719e6676b68529))
- update bussing data aggregation to add numberOfCars ([f5341962](https://github.com/firstlovecenter/fl-admin-portal/commit/f53419621edb352640d3ff970fbc177e3115a422))

##### Bug Fixes

- service record and bussing issues ([4991bc33](https://github.com/firstlovecenter/fl-admin-portal/commit/4991bc33a067c686fb856ea416d7c6d5190bb8fe))
- update role check in MemberForm component ([0b1a90f3](https://github.com/firstlovecenter/fl-admin-portal/commit/0b1a90f3a0ffab340bad89c2a989add76930e63e))
- update transaction balance formatting ([094f5237](https://github.com/firstlovecenter/fl-admin-portal/commit/094f523710c70438aac8ddfeaafdc596b30ff74a))
- update balance display format in TransactionCard ([7f5403a4](https://github.com/firstlovecenter/fl-admin-portal/commit/7f5403a4b24e13e84c6304ca63aff7266ff06341))
- issues with service records and add debugging scripts ([78fc2e30](https://github.com/firstlovecenter/fl-admin-portal/commit/78fc2e30dd508032fad69e4618732ab7ea4e149a))

#### 7.15.2 (2023-12-07)

##### Documentation Changes

- add completed year to README ([8164f464](https://github.com/firstlovecenter/fl-admin-portal/commit/8164f4640525752ab379c5d28e0966d7a643a453))

##### New Features

- add IMCL checking and attendance recording logic ([6aab6585](https://github.com/firstlovecenter/fl-admin-portal/commit/6aab65853815774154d54c3a23929d4d38489ee7))
- implement number of vehicles in bussing aggregate graphs ([0a7cef5d](https://github.com/firstlovecenter/fl-admin-portal/commit/0a7cef5de8b1e05a425af9c5299ee76d8ddc428e))

##### Bug Fixes

- stream admins should delete members ([0389ac7d](https://github.com/firstlovecenter/fl-admin-portal/commit/0389ac7d5134704816d0c4ec1da57c2d6b2237f5))
- exclude stream services when absorbing transaction ([763b71ff](https://github.com/firstlovecenter/fl-admin-portal/commit/763b71ff245f6423c0e9ad4304e7362c4d2c85cf))
- fix clickCard function calls in ServiceForm ([19fee919](https://github.com/firstlovecenter/fl-admin-portal/commit/19fee9193a67dbb42b735c93021b5a9bfc03be93))
- fix IMCL check condition in directory mutation ([8da2def0](https://github.com/firstlovecenter/fl-admin-portal/commit/8da2def05d084b54fa75f36e0416959b25ff38d4))

##### Refactors

- service-cypher.ts to absorb all transactions and update aggregate records ([df6fe3c8](https://github.com/firstlovecenter/fl-admin-portal/commit/df6fe3c897ad6dd92a49fb07c5fd6b272b600d63))

#### 7.15.1 (2023-12-04)

##### New Features

- fishers admins can now fill forms up to 7 days in the past ([f21b0579](https://github.com/firstlovecenter/fl-admin-portal/commit/f21b0579c96bc25aa633c96d7f536263ed8e6919))

### 7.15.0 (2023-12-04)

##### New Features

- correct transaction history when transferring from weekday to bussing ([95e3da23](https://github.com/firstlovecenter/fl-admin-portal/commit/95e3da23a294811a8c37b4a6da9f964f0c942bf8))
- implement account balances on each transaction ([d532262c](https://github.com/firstlovecenter/fl-admin-portal/commit/d532262c3ac3e77349549a6461fddea720b329b6))

#### 7.14.12 (2023-12-03)

##### Chores

- update trans.createdAt and trans.lastModified to use trans.timestamp ([9c73ea9d](https://github.com/firstlovecenter/fl-admin-portal/commit/9c73ea9d3ab04c3f1734804b400631264a924551))
- update package versions ([b7b11421](https://github.com/firstlovecenter/fl-admin-portal/commit/b7b11421fcfb2c4ae06db1efeca54fd03dcd616b))

##### Bug Fixes

- typo and update transaction description and type ([044b69ab](https://github.com/firstlovecenter/fl-admin-portal/commit/044b69ab27ea2d70645bcd622f19a72112363b1a))
- add new code of the day entries ([2fe9ae37](https://github.com/firstlovecenter/fl-admin-portal/commit/2fe9ae377602e3f7c8cd14d1cdf5628005043196))
- fix IMCL check in banking-cypher and add UpdateMemberFellowship mutation ([04bd2ebf](https://github.com/firstlovecenter/fl-admin-portal/commit/04bd2ebf0b79f7b0c7342d3b7de5e4db55c6c5c1))

#### 7.14.11 (2023-11-30)

##### New Features

- delete timestamp and add createdAt and lastModified fields ([372ddc66](https://github.com/firstlovecenter/fl-admin-portal/commit/372ddc66e02266f8c29048861dc9256a05a09498))

##### Bug Fixes

- remove transaction timestamps ([5b4e6789](https://github.com/firstlovecenter/fl-admin-portal/commit/5b4e6789fa6d716ce6fd0d73f379522fea1e63ce))

#### 7.14.10 (2023-11-26)

##### Chores

- update CSS and UserDashboard component ([7e75699d](https://github.com/firstlovecenter/fl-admin-portal/commit/7e75699d9b6865df01fef4fd5b0c7cce89100286))
- merge admin 636 story/on stage attendance ([484daa50](https://github.com/firstlovecenter/fl-admin-portal/commit/484daa50a84264c907617a140950b0353f393b85))

##### New Features

- implement graphs for denomination level ([bf420ce2](https://github.com/firstlovecenter/fl-admin-portal/commit/bf420ce22b15f8c68cb6bdf947e13c243516d926))
- implement graphs for denomination level ([2864b3c9](https://github.com/firstlovecenter/fl-admin-portal/commit/2864b3c9de8c9e956e925edc24ba541e82c52dcb))
- add event prop to ServiceForm component ([25956766](https://github.com/firstlovecenter/fl-admin-portal/commit/25956766dae8c63bc8b43e69c05904858363baca))
- finish implementation of stage attendance form ([20693c23](https://github.com/firstlovecenter/fl-admin-portal/commit/20693c23deeed88dbc181e6b8b01f04876d806af))
- add vacationStatus field to SERVANT_CHURCH_LIST and DISPLAY_MINISTRY queries ([a0ede809](https://github.com/firstlovecenter/fl-admin-portal/commit/a0ede8094956a97625891e3b71dff281e39181b5))
- on stage attendance ([87da1f87](https://github.com/firstlovecenter/fl-admin-portal/commit/87da1f8706d4383975d750c505f7d57d178a516a))
- on stage attendance ([1334ffc2](https://github.com/firstlovecenter/fl-admin-portal/commit/1334ffc2ddd9b9dcb462cfb5d80584f99c6d80c3))

##### Bug Fixes

- customise userdashboard graphs per role ([c550b775](https://github.com/firstlovecenter/fl-admin-portal/commit/c550b775050762e90fa2428ccf99e356d5e2a171))
- add text-center class to Col component in banking-slip pages ([83ae46db](https://github.com/firstlovecenter/fl-admin-portal/commit/83ae46dbfa749b5cee617adf4298dec30c7ba3ea))
- fix relationship check and create current history record if necessary ([34bc737b](https://github.com/firstlovecenter/fl-admin-portal/commit/34bc737beb8d5b6490b7992a99a50edca04b1061))
- remove unused code for Creative Arts ([c9e2c3a7](https://github.com/firstlovecenter/fl-admin-portal/commit/c9e2c3a722bf2db31070f70b7c64d5c43bd89566))
- add MultiImageUpload component to StageAttendanceForm ([be04356f](https://github.com/firstlovecenter/fl-admin-portal/commit/be04356f6d285406afc6f3e959c3a01ed31609e4))
- fix ministry stage attendance record type ([a4f263b7](https://github.com/firstlovecenter/fl-admin-portal/commit/a4f263b7cb6284b2c3799d159c156d24760ba1f0))
- fix church type condition and add ministry on stage attendance route ([1f191c39](https://github.com/firstlovecenter/fl-admin-portal/commit/1f191c39d60be04a111d6930938fb4098ab5230d))
- add vacationStatus query in Ministry type ([cf29939d](https://github.com/firstlovecenter/fl-admin-portal/commit/cf29939ddeb5187f643122b6ecbee6ea961cd6f4))

##### Refactors

- refactor all church graphs ([c36fb017](https://github.com/firstlovecenter/fl-admin-portal/commit/c36fb017e428d30931d21ca9a7717acf177d6690))
- refactor all church graphs ([592e9192](https://github.com/firstlovecenter/fl-admin-portal/commit/592e91929d00e944a8e6c193ec1c6edfc589d420))
- variable names in rehearsal-cypher.ts ([743a2d25](https://github.com/firstlovecenter/fl-admin-portal/commit/743a2d25b09f96574495cf4907f4296acadb4d24))
- create sub sections for service recording ([96938a1f](https://github.com/firstlovecenter/fl-admin-portal/commit/96938a1f4f00153327245526c1a9f4c95cd9c881))

#### 7.14.9 (2023-11-25)

##### Bug Fixes

- limit fields that can be edited by a leader ([4adfcc9f](https://github.com/firstlovecenter/fl-admin-portal/commit/4adfcc9fe3bccdf1f25a619f9be2a9d20364eca8))
- only an admin can change the unique details of phoneNumber, whatsapp and email ([6756332c](https://github.com/firstlovecenter/fl-admin-portal/commit/6756332c502f37dd5dfba00f2a4fb4604a004a0a))
- remove roles from users who don't actually havethem ([50f0ab82](https://github.com/firstlovecenter/fl-admin-portal/commit/50f0ab82710b129a562f594558fe5360e7452388))
- update manifest.json with new portal name ([11097b2f](https://github.com/firstlovecenter/fl-admin-portal/commit/11097b2fd5a7fdc3b3a74fa2883d9e3bbca38e3a))
- update login URL in email template ([40d9c44c](https://github.com/firstlovecenter/fl-admin-portal/commit/40d9c44cee84aa0e6ae0d7d372a4471eb17e535b))
- members can only be deleted by campus admins ([bcef869f](https://github.com/firstlovecenter/fl-admin-portal/commit/bcef869f2c5538df2183ccca09c3dfbbc0e31722))
- fix account open validation for valid days ([079bfc18](https://github.com/firstlovecenter/fl-admin-portal/commit/079bfc18b2adb52d105c86883fdeae6cb690904f))
- fix cypher queries and add optional matches for constituency ([5e637e56](https://github.com/firstlovecenter/fl-admin-portal/commit/5e637e562a97ebbf5124a20fb33a7dbcf435c81f))
- typo in repository URL ([b2e7cb4e](https://github.com/firstlovecenter/fl-admin-portal/commit/b2e7cb4ee430d055b1676b53bf141f5f0723e4ed))
- fix directory search query ([6aaea648](https://github.com/firstlovecenter/fl-admin-portal/commit/6aaea648cb0562a83ab70b9e0a18a9d0f3b4d5ad))
- update directory search queries ([0473dd23](https://github.com/firstlovecenter/fl-admin-portal/commit/0473dd232d22c98d0a5b240646cf702d913bd37d))

##### Refactors

- reposition Last3WeeksCard component ([c70e5216](https://github.com/firstlovecenter/fl-admin-portal/commit/c70e5216ca8b229282ced7205481b88d08cc5710))

#### 7.14.8 (2023-11-20)

##### Bug Fixes

- fix constituency and hub count check in close-church-cypher.ts ([6fe13103](https://github.com/firstlovecenter/fl-admin-portalgit/commit/6fe13103f307348d8605e6ffdbeea20e5c9bd37f))
- fix condition in setBacentaICStatus function ([884b6a6f](https://github.com/firstlovecenter/fl-admin-portalgit/commit/884b6a6f8b4951a024e861e8a4eca453d8d97c89))
- return only bussing records from last 4 weeks ([99f8257e](https://github.com/firstlovecenter/fl-admin-portalgit/commit/99f8257eef041313d417b35bfe43cf4f80c32da4))

##### Refactors

- refactor directory search query and update member search query ([85f63c2d](https://github.com/firstlovecenter/fl-admin-portalgit/commit/85f63c2d2fce18e58c0dc05a9099d6f1be50e0e2))

#### 7.14.7 (2023-11-19)

##### Documentation Changes

- update CHANGELOG.md ([c8c7e843](https://github.com/firstlovecenter/fl-admin-portalgit/commit/c8c7e84339967b7db56afba2b9a569b642aa831f))
- update CHANGELOG.md ([cc2214f1](https://github.com/firstlovecenter/fl-admin-portalgit/commit/cc2214f19d966560dee6f699f3e86c00daa7fe02))
- update CHANGELOG.md ([c1f6903a](https://github.com/firstlovecenter/fl-admin-portalgit/commit/c1f6903ada27e3c1d7bd57583b828bb8e4ac170e))
- update CHANGELOG.md ([91e236e3](https://github.com/firstlovecenter/fl-admin-portalgit/commit/91e236e3529564a636b54835e8882a871d7058f0))

##### Bug Fixes

- fix roleview ([a75a05e3](https://github.com/firstlovecenter/fl-admin-portalgit/commit/a75a05e3802628a233c1c42caad3c8c004a26ab0))
- update roleview ([81cc9fad](https://github.com/firstlovecenter/fl-admin-portalgit/commit/81cc9fad13cfa4295221f0ba9fc051fab2e06f98))
- remove unused 'auth' variable ([11e89a67](https://github.com/firstlovecenter/fl-admin-portalgit/commit/11e89a672b2b83dd4af832cfc3f0d16df8f72aca))

#### 7.14.6 (2023-11-19)

#### 7.14.5 (2023-11-19)

#### 7.14.4 (2023-11-19)

#### 7.14.3 (2023-11-19)

##### Bug Fixes

- fix roleview ([1e42bfb4](https://github.com/firstlovecenter/fl-admin-portalgit/commit/1e42bfb45ded76f765d730f530e927886a0210e8))
- update roleview ([c80507d3](https://github.com/firstlovecenter/fl-admin-portalgit/commit/c80507d3075b6e2613289358fd6d86cd5e9252ad))

#### 7.14.2 (2023-11-17)

##### Bug Fixes

- transaction status check in ReceiptPage component ([23df391f](https://github.com/firstlovecenter/fl-admin-portalgit/commit/23df391fd38c1d5a76879f242443835dec70f839))
- update expected income field to cash field in banking slip submissions ([e012adbb](https://github.com/firstlovecenter/fl-admin-portalgit/commit/e012adbb268b52018d929af717baa514902b6533))

##### Refactors

- getLastServiceRecord query to include additional church types ([4e5c1c5d](https://github.com/firstlovecenter/fl-admin-portalgit/commit/4e5c1c5d533beda1535ded3a29c79db7b513c0b9))

#### 7.14.1 (2023-11-17)

##### Refactors

- noBankingProof condition in ServiceDetails component ([a3d0b29e](https://github.com/firstlovecenter/fl-admin-portalgit/commit/a3d0b29ea04f5c20a3f12f009100a88221baeb1e))

### 7.14.0 (2023-11-15)

### 7.13.0 (2023-11-15)

### 7.12.0 (2023-11-15)

### 7.11.0 (2023-11-15)

##### New Features

- implement account lock on expense form ([f0ff8df2](https://github.com/firstlovecenter/fl-admin-portalgit/commit/f0ff8df21bf4076b909ee812464b5de02218dee7))

##### Bug Fixes

- sstart account lock ([9ea9fb09](https://github.com/firstlovecenter/fl-admin-portalgit/commit/9ea9fb094a60dc5b7cc6ac6bed0ecee103620f50))
- update Campus Council List heading to display campus name ([d9f1f915](https://github.com/firstlovecenter/fl-admin-portalgit/commit/d9f1f915d83f985a5631b6a15b04a8e40a32bbb6))

#### 7.10.41 (2023-11-15)

##### New Features

- implement self banking for stream ([687ee3ea](https://github.com/firstlovecenter/fl-admin-portalgit/commit/687ee3ead4d361f92cc692b2679e303163bafb4d))

#### 7.10.40 (2023-11-14)

##### Bug Fixes

- remove duplicate prop ([a7546b2d](https://github.com/firstlovecenter/fl-admin-portalgit/commit/a7546b2d3bd0ba5c59c966cd1ea5ebc5124a5c27))
- charge calculation in account transactions and display charge in transaction history ([fcf2136e](https://github.com/firstlovecenter/fl-admin-portalgit/commit/fcf2136e08cf4bc8840d1e71f3186eab06a17753))

#### 7.10.39 (2023-11-14)

##### Refactors

- searchMember component to improve performance and readability. ([72b6705b](https://github.com/firstlovecenter/fl-admin-portalgit/commit/72b6705b04cd1f3a37b9ba4d7ce51c2b73daf944))

#### 7.10.38 (2023-11-12)

##### Bug Fixes

- fix bussing expense transaction and comment out insufficient funds check ([a951d46f](https://github.com/firstlovecenter/fl-admin-portalgit/commit/a951d46f73b406f9cb08c11b60de2d821081ec6a))
- add pictureUrl to member query, update accountType in ExpenseForm, and adjust transaction amounts in GraphQL schema and CouncilTransactionHistory ([0bbe8535](https://github.com/firstlovecenter/fl-admin-portalgit/commit/0bbe8535bb37f360f92603f93fb90f025ee59a3d))
- remove unused secrets.build call ([bc11ee20](https://github.com/firstlovecenter/fl-admin-portalgit/commit/bc11ee20b5e5e38b32b1c2b54c862889e27dc6fa))
- remove notify function and dependencies ([76073f84](https://github.com/firstlovecenter/fl-admin-portalgit/commit/76073f843747fd6cfcba190945272b71cb5ab2eb))
- update README.md with completed Phase 4 of project ([ba2a4109](https://github.com/firstlovecenter/fl-admin-portalgit/commit/ba2a4109857ce0b63a3e2018e6c952be39f7f5e2))
- update First Love logo and heading in README.md ([8334e137](https://github.com/firstlovecenter/fl-admin-portalgit/commit/8334e13756be2a44284b42ef1ead64da5b428309))
- increase number of transactions displayed in CampusTransactionHistory and CouncilTransactionHistory ([33173cf9](https://github.com/firstlovecenter/fl-admin-portalgit/commit/33173cf92a1ea6821fbf9be6be0a1b08e68fa1d3))

#### 7.10.37 (2023-11-10)

##### Bug Fixes

- update CSV export button text ([1ede4b01](https://github.com/firstlovecenter/fl-admin-portalgit/commit/1ede4b01f49121b202c51b91ac6cd5b0b156ac54))
- formatting and naming inconsistencies in transaction history components ([ae82d352](https://github.com/firstlovecenter/fl-admin-portalgit/commit/ae82d3525b877319ca009882373a5e3cef4e6893))
- missing recipient error in notify.js ([92ae8b1b](https://github.com/firstlovecenter/fl-admin-portalgit/commit/92ae8b1be00310800c506cbc851aec8af3aa6027))
- missing message validation in send-sms endpoint ([715f304e](https://github.com/firstlovecenter/fl-admin-portalgit/commit/715f304e789365f4bf23c5f7d0e2adb1c585b696))
- update API endpoint path for SMS notifications ([bb4f0b18](https://github.com/firstlovecenter/fl-admin-portalgit/commit/bb4f0b1835b2a0f38497767ae3fe8a62b74b9a09))
- refactor notify.js to use express router ([426dbf28](https://github.com/firstlovecenter/fl-admin-portalgit/commit/426dbf282961be8e950fdd97ab0203c98340bf6b))
- add serverless-http package to dependencies ([7c2e0de2](https://github.com/firstlovecenter/fl-admin-portalgit/commit/7c2e0de26f85217eacb24d3a88fb9c80edc4cb45))
- add body-parser middleware and use serverless-http for deployment ([a5e1dc3d](https://github.com/firstlovecenter/fl-admin-portalgit/commit/a5e1dc3d0c16a6565c2566d07ba42762822ad9e9))
- add notification function and update secrets path ([8c3e2e80](https://github.com/firstlovecenter/fl-admin-portalgit/commit/8c3e2e80566342e70cceae397ee2c4e627df87b2))
- add checkmark icon to transaction history table ([b4626381](https://github.com/firstlovecenter/fl-admin-portalgit/commit/b4626381cac0e2e73c7adf3dc109283689fff6c7))

##### Refactors

- transaction history display ([c2ac9838](https://github.com/firstlovecenter/fl-admin-portalgit/commit/c2ac9838b9aacd188a896bd6d3d0346287eb6cb8))
- request body parsing in notify.js ([e09716cc](https://github.com/firstlovecenter/fl-admin-portalgit/commit/e09716cc14badd80d4c0701ca380ccecbebaac37))
- notify.js to simplify middleware usage ([7929f1f6](https://github.com/firstlovecenter/fl-admin-portalgit/commit/7929f1f69cc9f7afcab69435741d98c5e179a659))
- notify.js to use middleware ([b60d6b1b](https://github.com/firstlovecenter/fl-admin-portalgit/commit/b60d6b1b3782a2467c09d1c0387386d26a80966f))

#### 7.10.36 (2023-11-09)

##### Chores

- update package versions to 7.10.35 ([4b91e6bf](https://github.com/firstlovecenter/fl-admin-portalgit/commit/4b91e6bf7f6de3cb2050e7c1ef1559af50c408dc))

##### Bug Fixes

- remove download expense report button and add transaction history button to Campus Dashboard ([dccac2be](https://github.com/firstlovecenter/fl-admin-portalgit/commit/dccac2be57c0aad444d1d089f46d1e05b9f01506))
- bussing society balance can go into debt ([e5fd6d8f](https://github.com/firstlovecenter/fl-admin-portalgit/commit/e5fd6d8fe932ae99cb2f38f7ce7bc5ea24654873))
- servant authentication and campus arrivals admin mutation ([c0bc3f01](https://github.com/firstlovecenter/fl-admin-portalgit/commit/c0bc3f01fcd35c9276bdd89cbc6b5dbadc7e9558))
- remove currentUser from sessionStorage when logging out ([b4bf1428](https://github.com/firstlovecenter/fl-admin-portalgit/commit/b4bf142832b7124b818cf5faa57abc578c76f336))

#### 7.10.35 (2023-11-08)

##### Bug Fixes

- add new filters and update member data ([2fd8c05b](https://github.com/firstlovecenter/fl-admin-portalgit/commit/2fd8c05b4fa4db1e52cc19d3fd296d6e0413787c))
- update UpdateHub.tsx ([cd7f6017](https://github.com/firstlovecenter/fl-admin-portalgit/commit/cd7f60172e0d7281a0912e12bb42d13e3f4bd7af))
- udate SearchHubQueries.ts ([a7e08ce5](https://github.com/firstlovecenter/fl-admin-portalgit/commit/a7e08ce592e6f73df431f20cce379ce863583cca))
- refactor directory search query to return full member object ([df864689](https://github.com/firstlovecenter/fl-admin-portalgit/commit/df86468993964d2dc6b0f26fe302625e5044c8f9))
- refactor directory search Cypher query to include creative levels ([463a8089](https://github.com/firstlovecenter/fl-admin-portalgit/commit/463a80894e2b8cccf335611341fe7ac712dcee9f))

#### 7.10.34 (2023-11-06)

##### Chores

- Finish Sonta History Pages ([#463](https://github.com/firstlovecenter/fl-admin-portalgit/pull/463)) ([9ebf85fe](https://github.com/firstlovecenter/fl-admin-portalgit/commit/9ebf85fe7094a3dd0dd29dc7ada04e4f6d9bcb8d))

##### Bug Fixes

- refactor reusable forms to conditionally render select options based on new form flag ([41d8f352](https://github.com/firstlovecenter/fl-admin-portalgit/commit/41d8f352c68513c72871ca7a104b1264f6c658de))
- add creativeArts prop to leader search component in reusable forms ([fd503630](https://github.com/firstlovecenter/fl-admin-portalgit/commit/fd5036307481097dadabb7cede4c03f3a121a772))
- update hub creation and search functionality ([9aeafa85](https://github.com/firstlovecenter/fl-admin-portalgit/commit/9aeafa85670db4f85d3279f173dd3892f94586fc))
- add authentication check to SetPermissions component ([1b818426](https://github.com/firstlovecenter/fl-admin-portalgit/commit/1b81842636f731950652458e7c2e682af8519746))
- add Hub Council members grid and update Hub Council details link ([93b72cef](https://github.com/firstlovecenter/fl-admin-portalgit/commit/93b72cef9803deb03fa098fa2d22f0d510e3f778))
- allow constituencies to see hubs attached to them ([737bce86](https://github.com/firstlovecenter/fl-admin-portalgit/commit/737bce86330509aae27305b0db7597c88c7555a6))
- correct typo in constituency form 2 ([b3da3717](https://github.com/firstlovecenter/fl-admin-portalgit/commit/b3da3717943f0b85df302be44ff9458142cf5ee6))
- correct typo in constituency form ([a53db58f](https://github.com/firstlovecenter/fl-admin-portalgit/commit/a53db58f90fc3ba400580ca1f5a8e8307393fbf4))
- implement breadcrumb on hub level ([c349e7bf](https://github.com/firstlovecenter/fl-admin-portalgit/commit/c349e7bf3166c1a223b374a80f2a5a15a0d914c0))

##### Other Changes

- //github.com/firstlovecenter/fl-admin-portal into deploy ([9c9edf72](https://github.com/firstlovecenter/fl-admin-portalgit/commit/9c9edf721f47ec6340dfd83545916eedd762d8c4))

#### 7.10.33 (2023-11-05)

##### Bug Fixes

- updated the easy debugging script ([f4b000ca](https://github.com/firstlovecenter/fl-admin-portalgit/commit/f4b000ca0a69a49a52e7ce09978ef8bafef673e1))
- tweak member search to show all members from the creative arts of the hub ([a87dd861](https://github.com/firstlovecenter/fl-admin-portalgit/commit/a87dd861ceef5fedbf0646807247524c782bfcb1))
- implement ability to move creative arts levels across bacenta levels ([9d5c30d7](https://github.com/firstlovecenter/fl-admin-portalgit/commit/9d5c30d7f56024fcced04a1eeadd666e8dfe56d6))
- enable movement of hubs across constituencies ([78953de5](https://github.com/firstlovecenter/fl-admin-portalgit/commit/78953de5670c4c7c2e1eb8c8c85ef5fdc0ee947c))
- update code of the day for november ([0e5d3175](https://github.com/firstlovecenter/fl-admin-portalgit/commit/0e5d31751421974858192d1f5b0fffec9e4634cc))
- fix issue with bankServiceOffering error display ([5eb1544b](https://github.com/firstlovecenter/fl-admin-portalgit/commit/5eb1544b34c6cb14f63a731d163d98d8e5350bc4))
- add history to sonta churches ([61fcba8d](https://github.com/firstlovecenter/fl-admin-portalgit/commit/61fcba8d122dafd43335d9529898fdb21276be62))
- update permissions for hubcouncil graphs pages ([ebe79c5b](https://github.com/firstlovecenter/fl-admin-portalgit/commit/ebe79c5b46a7e7348852eee83b306a5629a81225))

#### 7.10.32 (2023-10-31)

##### Bug Fixes

- allow ministry and creativearts admims to look at the bacenta directory ([93706182](https://github.com/firstlovecenter/fl-pastoral-care/commit/937061826a1665cadb8d7a32701487700d8148d2))
- update dismiss button on error snackbar ([f4d2d18e](https://github.com/firstlovecenter/fl-pastoral-care/commit/f4d2d18e4422e5371309d585773cea7eccd21e0f))
- ministry meetings mutations ([5079f2c1](https://github.com/firstlovecenter/fl-pastoral-care/commit/5079f2c174b4c15755d556a98e73b222810a6807))
- enable cancelling of stream services ([5e93c48b](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e93c48ba1864040e3bc37f3565d5263db3490b4))

#### 7.10.31 (2023-10-29)

##### Bug Fixes

- fix gatheringStreams query ([37ef0c97](https://github.com/firstlovecenter/fl-pastoral-care/commit/37ef0c9741534b76be708b209879a88e1f45e636))
- implement cancelling stream service ([1db95dbf](https://github.com/firstlovecenter/fl-pastoral-care/commit/1db95dbf806602a45a84bb28b1fe8f7a49fe5f25))
- increase arrivals counting buffer to 15 minutes ([fd313495](https://github.com/firstlovecenter/fl-pastoral-care/commit/fd313495e124318df84f53cb275a67507160918a))

#### 7.10.30 (2023-10-29)

##### New Features

- implement error toast on all apollo errors ([ae5de8e1](https://github.com/firstlovecenter/fl-pastoral-care/commit/ae5de8e1ad6cd9ac607273c23b5fb411a02ef15a))

##### Bug Fixes

- implement routes for all stream services ([9a3a1c0a](https://github.com/firstlovecenter/fl-pastoral-care/commit/9a3a1c0ae3f92b92cd700f86adaae30677dc88ca))
- fix currentUser.id ([a141d51b](https://github.com/firstlovecenter/fl-pastoral-care/commit/a141d51b4498b21c1d0392322183f3dca8724333))
- initial implementation showing toast on all apollo error ([6376c841](https://github.com/firstlovecenter/fl-pastoral-care/commit/6376c84168d584d9fdb45f98f580aba59d257166))
- after absorbing transactions, dollar income should reflect ([d9a55efd](https://github.com/firstlovecenter/fl-pastoral-care/commit/d9a55efd12f0065ef4fef470a5b27fb96a7ff8ca))

#### 7.10.29 (2023-10-26)

##### Bug Fixes

- implement uploading banking slip for stream services ([77412112](https://github.com/firstlovecenter/fl-pastoral-care/commit/77412112c236148fc67adc6c212a8d9f03cb6d75))

#### 7.10.28 (2023-10-26)

##### Bug Fixes

- remove onclick from search member avatar suggestion comp ([9af8ba0b](https://github.com/firstlovecenter/fl-pastoral-care/commit/9af8ba0b24310f959217ffdee5fc2ead04cda245))

#### 7.10.27 (2023-10-26)

##### Bug Fixes

- update permissions for ministry levels ([aa394989](https://github.com/firstlovecenter/fl-pastoral-care/commit/aa3949890b0b73506c5635b0a7d2c2bef6f3d456))
- add picture of arrivals admin ([dcd09c85](https://github.com/firstlovecenter/fl-pastoral-care/commit/dcd09c85d64c009fee2928789a2bdd15a3093b5c))
- center loading placeholder on user display page ([3a65a85a](https://github.com/firstlovecenter/fl-pastoral-care/commit/3a65a85aa599eb9902fda6a795d8992326538a96))

#### 7.10.26 (2023-10-23)

##### New Features

- close down creative arts churches ([ce2336ac](https://github.com/firstlovecenter/fl-pastoral-care/commit/ce2336ac9aca96a044dd99aacf145f2d6da21259))

##### Bug Fixes

- show name input box for creating hub ([936e0b27](https://github.com/firstlovecenter/fl-pastoral-care/commit/936e0b27c1082dae46b762968f01025bda92f384))
- allow council heads to view the hubs and hubcouncils ([d63430f1](https://github.com/firstlovecenter/fl-pastoral-care/commit/d63430f12f7c5778bd9e7da4f9c4fb828597f05b))
- permissions for closing creative arts churches ([f38e0a05](https://github.com/firstlovecenter/fl-pastoral-care/commit/f38e0a059ba94da7b08b3a1c91660b19a1f40bd4))
- update permissions for closing down creativearts ([362eecd5](https://github.com/firstlovecenter/fl-pastoral-care/commit/362eecd5970569dcf1bc995b3ae9443b208d7017))
- bugs preventing CloseDownMinistry from not returning correctly ([cde7bf57](https://github.com/firstlovecenter/fl-pastoral-care/commit/cde7bf57d8a022e95620de45221667a3ac8c7f00))
- close down creative arts ([e3914170](https://github.com/firstlovecenter/fl-pastoral-care/commit/e3914170ab6ee90866f9462ee67bcbd507bf3396))
- set campusId to initialValues for CreateCreativeArts ([4a2d3a59](https://github.com/firstlovecenter/fl-pastoral-care/commit/4a2d3a59dcfccae3249e6d7847bd01369215ca02))
- store adminId in initialValues for updateforms ([5f97c96b](https://github.com/firstlovecenter/fl-pastoral-care/commit/5f97c96b1a312244d4542cc06dc60e2c6feea6a0))
- refactor frontend to pass leaderId and adminId ([6be2cb7c](https://github.com/firstlovecenter/fl-pastoral-care/commit/6be2cb7c9ab6976bb9da28ea24e25d629fcaad1b))
- type definitions ([d1b04007](https://github.com/firstlovecenter/fl-pastoral-care/commit/d1b04007d7beaf9a5c6ae478e5a85445efe9ab01))
- resolver for closing overight, streams, campuses and councils ([818c3a5f](https://github.com/firstlovecenter/fl-pastoral-care/commit/818c3a5f95efb51eb0f1e3e21db38b60f0f2db63))

#### 7.10.25 (2023-10-21)

##### Bug Fixes

- bug preventing membersearch ([2129d23d](https://github.com/firstlovecenter/fl-pastoral-care/commit/2129d23dc889723a477deb02b6b3adb4cd278c3c))

#### 7.10.24 (2023-10-21)

##### Bug Fixes

- implement a search member from hubcouncil ([f891e54e](https://github.com/firstlovecenter/fl-pastoral-care/commit/f891e54e051b0d411c6db877ef25d18d5d60f5bf))
- fix bug with vars for getConstituencyBacentas ([baba446a](https://github.com/firstlovecenter/fl-pastoral-care/commit/baba446a1823bcf6accc04cb2a12e2bc39323958))
- fix bug with cypher to show form defaulters at constituency level ([aed4bf39](https://github.com/firstlovecenter/fl-pastoral-care/commit/aed4bf39f832ec31725399219d610bf022257232))
- fix bug with refetch after closing down churches ([ba162695](https://github.com/firstlovecenter/fl-pastoral-care/commit/ba1626952879ec6b828da934cc91669efd43843b))
- minor changes to church history heading ([a059efc9](https://github.com/firstlovecenter/fl-pastoral-care/commit/a059efc9c34d52182a9a00fbc0c72b421b06c4b6))
- correct resolvers incorrectly creative agg reherasal records ([86a534f4](https://github.com/firstlovecenter/fl-pastoral-care/commit/86a534f47b46055e115e22fcf6e035dd5eae49c8))
- implement graphs for all sonta levels ([0e0f7e96](https://github.com/firstlovecenter/fl-pastoral-care/commit/0e0f7e962de9bc5125e5725b76fbb44277436df6))
- allow creative arts leaders to see the corresponding bacenta level ([e0df20b4](https://github.com/firstlovecenter/fl-pastoral-care/commit/e0df20b472e5cd6cd13e3defadaf3221e125fd0c))
- implement fellowship defaulters lists for all sonta levels ([cf211a75](https://github.com/firstlovecenter/fl-pastoral-care/commit/cf211a752217a3159d40514e5d65264bc5961277))
- customise church icon in church list components ([edc49d29](https://github.com/firstlovecenter/fl-pastoral-care/commit/edc49d29bfcd3edd61414d69d6be4281f4bab8e1))
- implement lint staged in api package.json ([d36c43fa](https://github.com/firstlovecenter/fl-pastoral-care/commit/d36c43fa9f5f756a37ec0f81216518a25417b6e3))
- implement lint staged in api package.json ([06935adf](https://github.com/firstlovecenter/fl-pastoral-care/commit/06935adfbe9b327493efdae17058826f9226d45a))
- fix minor bugs for oversight admin view ([fd152676](https://github.com/firstlovecenter/fl-pastoral-care/commit/fd1526766cfe3486c38996e490e2ddc3817ed07a))
- fix errors in compilation 2 ([9f5ccce0](https://github.com/firstlovecenter/fl-pastoral-care/commit/9f5ccce0928f57d6f449e08eccabe49ad0745c4a))
- fix errors in compilation ([f1f6da4e](https://github.com/firstlovecenter/fl-pastoral-care/commit/f1f6da4e9d8f3aa6bca37b30594ff8667fd15313))
- give council admins the ability to create a hub fellowship ([56ea0acd](https://github.com/firstlovecenter/fl-pastoral-care/commit/56ea0acda803f228a221009e2edf5c435b5d2953))
- add padding to weeks onn display church details page ([bda17a17](https://github.com/firstlovecenter/fl-pastoral-care/commit/bda17a17239c8ea3abb822b06aa91d45179d97e8))

#### 7.10.23 (2023-10-16)

##### Documentation Changes

- update CHANGELOG.md ([e097699f](https://github.com/firstlovecenter/fl-pastoral-care/commit/e097699f8d94288922d8f418b981a47dd5a8f288))
- update CHANGELOG.md ([00e9b7c2](https://github.com/firstlovecenter/fl-pastoral-care/commit/00e9b7c2a27be8ef5fbb2f37dd066313123724aa))
- update CHANGELOG.md ([afa0d78a](https://github.com/firstlovecenter/fl-pastoral-care/commit/afa0d78ab97b7c1aadf93d9f6827899014fcd6e0))

##### Bug Fixes

- remove online options from fellowship form ([572dc9a7](https://github.com/firstlovecenter/fl-pastoral-care/commit/572dc9a7759c1f1c2c2ab68f19369e7caaec93b2))
- fix issue returning number of banking defaulters for rehearsal record ([4a454cc9](https://github.com/firstlovecenter/fl-pastoral-care/commit/4a454cc94810fe86248c983376d1d5c01ee6d11e))
- fix bug in cypher query for form defaulters ([902ad89f](https://github.com/firstlovecenter/fl-pastoral-care/commit/902ad89f50738f0ca1e8feed51c3476bca2ce858))
- update sonta defaulters queries ([28a29a64](https://github.com/firstlovecenter/fl-pastoral-care/commit/28a29a644cb938eaf6a519b6d6170924843c080f))
- rearrange member lists ([c0f43c95](https://github.com/firstlovecenter/fl-pastoral-care/commit/c0f43c95e0b8705e8f016d6929da179487f5dc63))
- update permissions for updating mmember emails ([9502e58e](https://github.com/firstlovecenter/fl-pastoral-care/commit/9502e58e5e6304827ce7b75d38ebf17efe68e9c2))
- fix query finding out hubs left to have rehearsals ([458cf21e](https://github.com/firstlovecenter/fl-pastoral-care/commit/458cf21e9d35fcbe157aad319387c8f05a723b7a))
- implement column wrapping in defaultters dashboard accordion ([7c45fe9c](https://github.com/firstlovecenter/fl-pastoral-care/commit/7c45fe9c64ce527aad67d86464a793b1d94c54e6))

#### 7.10.22 (2023-10-16)

#### 7.10.21 (2023-10-16)

#### 7.10.20 (2023-10-16)

##### Bug Fixes

- remove online options from fellowship form ([369cd128](https://github.com/firstlovecenter/fl-pastoral-care/commit/369cd1286d8c22237fbb00719045484dbdd4525b))
- fix bug in cypher query for form defaulters ([902ad89f](https://github.com/firstlovecenter/fl-pastoral-care/commit/902ad89f50738f0ca1e8feed51c3476bca2ce858))
- update sonta defaulters queries ([28a29a64](https://github.com/firstlovecenter/fl-pastoral-care/commit/28a29a644cb938eaf6a519b6d6170924843c080f))
- rearrange member lists ([c0f43c95](https://github.com/firstlovecenter/fl-pastoral-care/commit/c0f43c95e0b8705e8f016d6929da179487f5dc63))
- update permissions for updating mmember emails ([9502e58e](https://github.com/firstlovecenter/fl-pastoral-care/commit/9502e58e5e6304827ce7b75d38ebf17efe68e9c2))
- fix query finding out hubs left to have rehearsals ([458cf21e](https://github.com/firstlovecenter/fl-pastoral-care/commit/458cf21e9d35fcbe157aad319387c8f05a723b7a))
- implement column wrapping in defaultters dashboard accordion ([7c45fe9c](https://github.com/firstlovecenter/fl-pastoral-care/commit/7c45fe9c64ce527aad67d86464a793b1d94c54e6))

#### 7.10.19 (2023-10-14)

##### New Features

- implement campus by creative arts defaulter pages ([2b4fd01d](https://github.com/firstlovecenter/fl-pastoral-care/commit/2b4fd01d922862ac086c72f9de7638d0439e70d3))
- sonta defaulter queries ([4f4e8a77](https://github.com/firstlovecenter/fl-pastoral-care/commit/4f4e8a7766c5af3fa5fd3a12fb399cb4337bc95c))

##### Bug Fixes

- implement lists of defaulters on clicking card ([6413d204](https://github.com/firstlovecenter/fl-pastoral-care/commit/6413d20421e54a086e33f9838a19512aa8402038))
- update joint service order on defaulters dashboard ([cecb9869](https://github.com/firstlovecenter/fl-pastoral-care/commit/cecb986988388aaa459a0ef9a964850a01033372))
- implement church by subchurch for creative arts defaulters ([a6005f7b](https://github.com/firstlovecenter/fl-pastoral-care/commit/a6005f7bb6616bf29256cc8b41d5d9e3b0c7d2c9))
- add sonta queries to campus church level ([77bc548c](https://github.com/firstlovecenter/fl-pastoral-care/commit/77bc548c37ee1cdb46dab21d367b6aef45b71bc5))
- implement defaulter dashboard for all sonta levels ([14e0f7ce](https://github.com/firstlovecenter/fl-pastoral-care/commit/14e0f7ce33c4838a07700d2a58b00197301f9b37))
- update defaulters dashboard for rehearsal queries ([6f8ee4bd](https://github.com/firstlovecenter/fl-pastoral-care/commit/6f8ee4bdf56bb714495ec3d0156429b16d0ff2ff))
- initial implementation of sonta quireis ([2645898e](https://github.com/firstlovecenter/fl-pastoral-care/commit/2645898ea9a9cccd95def2102954cf7739d6dede))
- errors on sonta defaulters queries ([9554b2d7](https://github.com/firstlovecenter/fl-pastoral-care/commit/9554b2d7c76036490db4017ce9c6cf4a05c3818c))
- update church sonta details permissions ([8992a1a0](https://github.com/firstlovecenter/fl-pastoral-care/commit/8992a1a029ab1830360b72cd1be933ffc9928435))
- fix bug with CloseDown CA and ministry ([c5c83d82](https://github.com/firstlovecenter/fl-pastoral-care/commit/c5c83d823aa229aa96615b27b0f9ecd9393989fc))

#### 7.10.18 (2023-10-13)

##### Bug Fixes

- remove linkto hub page in DetailsHubCouncil ([c4babbce](https://github.com/firstlovecenter/fl-pastoral-care/commit/c4babbcedcf0bc6540eca5e9feb3d932cce92b5a))
- merge from admin-616 ([92389734](https://github.com/firstlovecenter/fl-pastoral-care/commit/92389734263f7ba80dd8445a427563ca33d55fb7))
- fix permissions for defaulters dashboard ([5b332f8e](https://github.com/firstlovecenter/fl-pastoral-care/commit/5b332f8eca8285ffbb52b4c35178f3877780a48a))
- rearrage order of church levels ([1d973892](https://github.com/firstlovecenter/fl-pastoral-care/commit/1d9738925b4b91b3ffde524fcc79b333d27558ac))

#### 7.10.17 (2023-10-13)

##### New Features

- implement church by subchurch from denomination to constituency ([3fdbcb68](https://github.com/firstlovecenter/fl-pastoral-care/commit/3fdbcb68fb5d729e62b3eff26061e3ae3d3258a8))

##### Bug Fixes

- optioally render stream defaulters ([fc8d5265](https://github.com/firstlovecenter/fl-pastoral-care/commit/fc8d5265f4d2ba74d691ac0ba969c2c4cc8092e2))
- implement defaulters dashboards for oversight and denomination ([16bb5412](https://github.com/firstlovecenter/fl-pastoral-care/commit/16bb5412120b5776b3e9b7581827a186ae6e1f6f))
- implement pages for stream service defaulters onn campus level ([72d1e283](https://github.com/firstlovecenter/fl-pastoral-care/commit/72d1e2832b39537157dcb2c4aae350f1ebcbc089))
- fix error with showing services filled on detailsfellowship ([1bab61fc](https://github.com/firstlovecenter/fl-pastoral-care/commit/1bab61fc0e8f1f46d69ccb5993456c2ea6eb4972))
- include hub council in search results ([c46aeff8](https://github.com/firstlovecenter/fl-pastoral-care/commit/c46aeff8e95d9ccb998f8f95533b2e8be278b3d9))

#### 7.10.16 (2023-10-12)

##### New Features

- **venues:** add venue form and display venues ([#448](https://github.com/firstlovecenter/fl-pastoral-care/pull/448)) ([b6f734af](https://github.com/firstlovecenter/fl-pastoral-care/commit/b6f734afe0a34432190d0fbafe4407a9ccdcd5a6))

##### Bug Fixes

- add missing import of permitLeaderAdminArrivals ([58545e61](https://github.com/firstlovecenter/fl-pastoral-care/commit/58545e6113ed769b4025450a97647acd325225d4))

#### 7.10.15 (2023-10-12)

##### Bug Fixes

- update delete member category ([36e157c8](https://github.com/firstlovecenter/fl-pastoral-care/commit/36e157c80031cec55a7800375c6984a9cb312471))
- correct types in arrivals state pages ([5263af80](https://github.com/firstlovecenter/fl-pastoral-care/commit/5263af80341a6fb019cb6079cd5a51ada9a63961))
- fix types after enforcing for member places ([10a657e4](https://github.com/firstlovecenter/fl-pastoral-care/commit/10a657e4a6617f9f41a2c9efe3206e5288539c2f))
- fix member count on displayAll pages from bacenta side ([05cd5ebc](https://github.com/firstlovecenter/fl-pastoral-care/commit/05cd5ebc0bb96d05391b2360ef4c026d9f54f776))
- fix bug where allhubcouncil page links hubCouncil to hub display page ([9f31f296](https://github.com/firstlovecenter/fl-pastoral-care/commit/9f31f296cc2623f369771301432bbec08e563409))
- correct use of churchId variable in getting higher Churches ([45c499f0](https://github.com/firstlovecenter/fl-pastoral-care/commit/45c499f082c8bde86594d9cf43614fbd3f6a3d2b))
- allow clicking of admin on church details page ([2f0c42f8](https://github.com/firstlovecenter/fl-pastoral-care/commit/2f0c42f8b6f31f772204482327a2b0e23520e29f))
- add picture to the admin name on church details ([ead623ac](https://github.com/firstlovecenter/fl-pastoral-care/commit/ead623aca3bb8d78058531baaa5b918103e4b3d8))

#### 7.10.14 (2023-10-10)

##### Bug Fixes

- add member image to member search component ([19470fd1](https://github.com/firstlovecenter/fl-pastoral-care/commit/19470fd1b72e74fbb9dd98404b36eb7be879d892))
- fix hubFellowship counts on stream and council ([79c2409e](https://github.com/firstlovecenter/fl-pastoral-care/commit/79c2409e996f9fe2d73753937045aabaaf675837))

#### 7.10.13 (2023-10-09)

##### Bug Fixes

- fix bug preventing changing of hub leader ([2bb64d89](https://github.com/firstlovecenter/fl-pastoral-care/commit/2bb64d899f29d48d25444142ec05b7ac8910f6d7))
- fix little itches with creating ministries and hubcouncils ([c973e9fe](https://github.com/firstlovecenter/fl-pastoral-care/commit/c973e9fe8593c9c0a78d93f93f0e248150284b4b))
- implement directory lock for creating bacentas ([d6ae1a64](https://github.com/firstlovecenter/fl-pastoral-care/commit/d6ae1a6456b27578fb362ca9fd678190caa0e6a7))
- improve permissions ministry admin ([8e9cb31c](https://github.com/firstlovecenter/fl-pastoral-care/commit/8e9cb31cbddb08d629817238ff360c4f1c4c97bd))
- change view all history button to outline success ([ed3de8e0](https://github.com/firstlovecenter/fl-pastoral-care/commit/ed3de8e0043ac5f491aa37223a5560204cb705e9))

#### 7.10.12 (2023-10-08)

##### Bug Fixes

- minor changes to ui ([6c3d5455](https://github.com/firstlovecenter/fl-pastoral-care/commit/6c3d5455483d3d759f7360b0420434e2e6217d5b))
- aggregate hub rehearsal workign properly now ([3984bb1f](https://github.com/firstlovecenter/fl-pastoral-care/commit/3984bb1fc502a8259d46e81035e811d9da9dd188))
- logging out now clears session storage ([36d8e169](https://github.com/firstlovecenter/fl-pastoral-care/commit/36d8e1699f162bd15a9a4449fe3302187bbcb590))
- permission for stream admins to create bacentas ([a497d390](https://github.com/firstlovecenter/fl-pastoral-care/commit/a497d390f87c659b83c719fa7bc60f5dc143283c))
- add whitespace to readme ([4cd36b1b](https://github.com/firstlovecenter/fl-pastoral-care/commit/4cd36b1b43feaca80af53551ac94c1d56e41688c))
- implement hub council leader user flow ([0b7c951b](https://github.com/firstlovecenter/fl-pastoral-care/commit/0b7c951b8832c33b485768b943356be37201d41b))
- fix bug in code-of-the-day function ([63d651f2](https://github.com/firstlovecenter/fl-pastoral-care/commit/63d651f299a6c771f37c190565d68dc875e4214c))
- fixed bugs in updating denomination and hubcouncil ([2631d519](https://github.com/firstlovecenter/fl-pastoral-care/commit/2631d5194c8b52ba37f9bb4cef91789f2092f7ed))

#### 7.10.11 (2023-10-07)

##### Bug Fixes

- update field on hubCouncil form ([c810cffa](https://github.com/firstlovecenter/fl-pastoral-care/commit/c810cffa32be65dbd84a42614ba4cdedd5aa6613))
- show hub council on memberrole list ([925bc5a1](https://github.com/firstlovecenter/fl-pastoral-care/commit/925bc5a10edd27a36bae70b9322b8d88b9c62894))
- change label for sonta forms ([e0d35c6d](https://github.com/firstlovecenter/fl-pastoral-care/commit/e0d35c6d192fc7f3c4092e3c41365fe87ce5837d))
- correctly pass hubCouncilId when creating hub ([6d926be8](https://github.com/firstlovecenter/fl-pastoral-care/commit/6d926be88908999e8cb2164bb01778dd9dbd4ab8))
- add a conditional to check if there are no hubs for all hubs page ([a0800656](https://github.com/firstlovecenter/fl-pastoral-care/commit/a08006565871cb019c15f43e88cbdea832b35a9b))

#### 7.10.10 (2023-10-06)

##### Bug Fixes

- refactor allhubs page for correct display ([5d306f63](https://github.com/firstlovecenter/fl-pastoral-care/commit/5d306f63974e40aff31544aa3d410ab1fdd35a13))

#### 7.10.9 (2023-10-06)

#### 7.10.8 (2023-10-06)

##### Bug Fixes

- implement optional types on sonta form values ([f7415106](https://github.com/firstlovecenter/fl-pastoral-care/commit/f741510609b74e365a6e55ef5a03e4ff055819ad))
- fix bugs breaking the build ([70807ea9](https://github.com/firstlovecenter/fl-pastoral-care/commit/70807ea97402b6afaf687c4f6399ada4b2486108))
- tweak colours for role card ([42e7895e](https://github.com/firstlovecenter/fl-pastoral-care/commit/42e7895ec539ef5157c02f91aff86233ec0cfbaa))
- tweak permissions to allow viewing of hubcouncil details ([9ef02d41](https://github.com/firstlovecenter/fl-pastoral-care/commit/9ef02d417d4e543f421a5c15f7f8ea5240e4f2fb))
- fix bug breaking allhubs paages ([01ad5d15](https://github.com/firstlovecenter/fl-pastoral-care/commit/01ad5d150e0ccf854c03a89ea0955a01d77a934f))

#### 7.10.7 (2023-10-06)

##### Bug Fixes

- fix bug breaking allministry hubs ([93b3b0b3](https://github.com/firstlovecenter/fl-pastoral-care/commit/93b3b0b3e6427f12fbfe9d3949cce986426b09b1))
- fix broken expense form ([420d3aca](https://github.com/firstlovecenter/fl-pastoral-care/commit/420d3acabce7007502b38600da061e0f2c4309a6))
- change the word 'purse' to 'society' ([46f8b037](https://github.com/firstlovecenter/fl-pastoral-care/commit/46f8b037a69f54477487b5834fbbeeb744ed9203))
- update options for stream bank accounts ([9adf89fe](https://github.com/firstlovecenter/fl-pastoral-care/commit/9adf89fe988f14bb120314ee1c7a392155e650f3))
- change ministry to basonta for activating inactive member ([ca0a98cc](https://github.com/firstlovecenter/fl-pastoral-care/commit/ca0a98cc3f0be7b85eb524a70e002df170e88df4))
- implement better loading for leader avatar component ([3e76851b](https://github.com/firstlovecenter/fl-pastoral-care/commit/3e76851b1ccb1641d920ef7b3dfcdb62fb6370d5))
- update service aggregate cypher to be more accurate 2 ([3385dd99](https://github.com/firstlovecenter/fl-pastoral-care/commit/3385dd990b73cf36940c08fbb6d959e3f21d1f3a))
- update service cypher to be the most accurate ([257a15c9](https://github.com/firstlovecenter/fl-pastoral-care/commit/257a15c9d92d704021ac5135ee56b1e91e413863))
- remove view of Downloading reports to only campus level ([b10d10b6](https://github.com/firstlovecenter/fl-pastoral-care/commit/b10d10b6d89b7f5389522e63143ae3acfbcde6fb))
- implement feature to download fellowship services this week ([b712677e](https://github.com/firstlovecenter/fl-pastoral-care/commit/b712677e88661fc5977dc289c1ab9d8ad3025657))
- add finishing touches to accounts ([c634fb04](https://github.com/firstlovecenter/fl-pastoral-care/commit/c634fb04547cbeba35073734e4ac99b916d79128))
- fix bug in updatecampus cypher ([27abae5e](https://github.com/firstlovecenter/fl-pastoral-care/commit/27abae5e6dd3609e1b2618f2efd80c8fc42c67a8))
- code of the day now returns a random dictionary word if no code of the day ([8cf6a524](https://github.com/firstlovecenter/fl-pastoral-care/commit/8cf6a52427e95ea4ab041a412f16312669debf11))
- update code of the day for october ([92d87670](https://github.com/firstlovecenter/fl-pastoral-care/commit/92d876708899190789c7ec34dffa8ea4a326ed81))
- implement feature to click to fellowship from member details page ([381c2bc1](https://github.com/firstlovecenter/fl-pastoral-care/commit/381c2bc124a436cb2afaad54e98578a790fb99fb))
- implement leader avatar which redirects to member details page ([4b41d443](https://github.com/firstlovecenter/fl-pastoral-care/commit/4b41d44301c07219b26780df0e423b62e0673bdc))
- implement permissions on routes for hub leader ([481a7cb4](https://github.com/firstlovecenter/fl-pastoral-care/commit/481a7cb4585358248d4d70989aa84070357db203))
- implement ability to cancel hub rehearsals ([4c7dfd78](https://github.com/firstlovecenter/fl-pastoral-care/commit/4c7dfd789422bc9282a38377310659d1b8975dcd))
- implement sunday hub meeting form ([245269a6](https://github.com/firstlovecenter/fl-pastoral-care/commit/245269a6b2654c9a5541940d028e415cf2c68920))
- implement filling of hub rehearsal service ([f9960765](https://github.com/firstlovecenter/fl-pastoral-care/commit/f9960765e8d4f83888ea182c52985bf0861beb6e))
- revert aggregate cypher to previous working ([fba77a62](https://github.com/firstlovecenter/fl-pastoral-care/commit/fba77a629545aeb86c994b196bfcbd994cb74f6a))
- more console.logs to help ([bab360d5](https://github.com/firstlovecenter/fl-pastoral-care/commit/bab360d5ae50fc9d1a71147985fa0eed5dbdf9c1))
- console.log getServantandChurch for a bug where it throws the set leader error ([f4ab9325](https://github.com/firstlovecenter/fl-pastoral-care/commit/f4ab932527cdbdaf7c5c4de73db37ff20e808448))
- check only service records within this week for imcl Defaulters ([48d34f58](https://github.com/firstlovecenter/fl-pastoral-care/commit/48d34f589b866aff165cc92d863dc97e61dccc79))
- fixed wrong syntax in imcl checker ([23f56854](https://github.com/firstlovecenter/fl-pastoral-care/commit/23f56854a3ee9d571723dae20da21b389ac37f67))
- fixed wrong syntax in imcl checker ([a6e3993d](https://github.com/firstlovecenter/fl-pastoral-care/commit/a6e3993d158b81395ef1ed636088d480d3cbac6d))
- change to checking for absent members instead of imcls ([7d494b26](https://github.com/firstlovecenter/fl-pastoral-care/commit/7d494b2601dda7ee058266d47c9f986617c1a9a9))
- remove lost sheep from imcl count ([874b8b6f](https://github.com/firstlovecenter/fl-pastoral-care/commit/874b8b6f92c0c7f1b0f08bd9317fd4e2b75a791e))
- update sms messages to show account involved in transaction ([d6e1789d](https://github.com/firstlovecenter/fl-pastoral-care/commit/d6e1789dd34bc616849ff5720e42526e341abfed))
- fix cypher error updating stream ([13fe12b8](https://github.com/firstlovecenter/fl-pastoral-care/commit/13fe12b8a1e1d7c0b8c02d3c0ac7ce1783571c10))
- change delete category from deceased to anagkazo gradutate ([0f3260c0](https://github.com/firstlovecenter/fl-pastoral-care/commit/0f3260c0381b86229753efb6b9ebfd093dda4dd9))
- allow campus admin to request expense ([41686137](https://github.com/firstlovecenter/fl-pastoral-care/commit/41686137c4c1d5f5cc1407fb0ed18eacbd1a003b))

#### 7.10.6 (2023-09-27)

##### Bug Fixes

- updated account details ([2c98ef3f](https://github.com/firstlovecenter/fl-pastoral-care/commit/2c98ef3f1e5e0c8058a7e2bac8a8d3b0cc8e3ee7))
- remove unnecessary fields for admin ([da10fde8](https://github.com/firstlovecenter/fl-pastoral-care/commit/da10fde8f7a94d71cff210cbf1d8ca9ec1971595))
- show the admin for the ministry level ([404a99fb](https://github.com/firstlovecenter/fl-pastoral-care/commit/404a99fb17a27545cfa824f42894e341feebf7d5))
- update change admin modal for sonnta churches ([ed5ae637](https://github.com/firstlovecenter/fl-pastoral-care/commit/ed5ae63749064197b8a2bd7bf29747a5841e0904))
- add a description to member deletion ([bd3e1e74](https://github.com/firstlovecenter/fl-pastoral-care/commit/bd3e1e74ecb2d7a6111c1ef0275342cf009a426f))
- remove duplicate CURRENT_HISTORY on some church levels ([4c70a94f](https://github.com/firstlovecenter/fl-pastoral-care/commit/4c70a94f5fa940326ad6acbec0f9ca962fba135f))
- minor upgrades ([9cf259a9](https://github.com/firstlovecenter/fl-pastoral-care/commit/9cf259a9a6f1c6c253c201de1f14f3fdc9b4a515))

#### 7.10.5 (2023-09-25)

##### Bug Fixes

- change link ([74fafe6f](https://github.com/firstlovecenter/fl-pastoral-care/commit/74fafe6f24adf575dde0e552873a5b458ee257f8))

#### 7.10.4 (2023-09-25)

##### Bug Fixes

- change redirection of MemberForm.tsx to fellowship details ([585e69de](https://github.com/firstlovecenter/fl-pastoral-care/commit/585e69de1360c8cf5ef4fc3525967754e83f7990))
- properly set ids in setPermissions component ([2728d13a](https://github.com/firstlovecenter/fl-pastoral-care/commit/2728d13a45e5294a4efb9e6ec82e670880aeb7a6))
- instead of adding the deposited amount, they just update the latest balance ([49942766](https://github.com/firstlovecenter/fl-pastoral-care/commit/49942766c24e13202682d0b4aff7544dab2997a3))
- remove console.log ([fa991b72](https://github.com/firstlovecenter/fl-pastoral-care/commit/fa991b7282bd0f27d2aa7496a0a26295ad4ea6f8))
- add construction as an option of category ([76feea35](https://github.com/firstlovecenter/fl-pastoral-care/commit/76feea3553e062908d7a459d37720679bf230aa3))
- bring balances to front of council list ([601bb13a](https://github.com/firstlovecenter/fl-pastoral-care/commit/601bb13a9bcafe8c0ca52c357f3000078d592096))
- change ministry to basonta on usereditpage ([ee7ad20a](https://github.com/firstlovecenter/fl-pastoral-care/commit/ee7ad20a42fc2ff9da890d6c05c990105da78d16))

#### 7.10.3 (2023-09-24)

##### Bug Fixes

- order council names in alphabetical order ([2252de75](https://github.com/firstlovecenter/fl-pastoral-care/commit/2252de755717fc724390c732733c4ac43d3a7c87))
- change mentions of basonta to ministry which were breaking the build ([a89d2492](https://github.com/firstlovecenter/fl-pastoral-care/commit/a89d24927ebcc1b60f211183e6a8ec555dd329fe))
- make all creativearts also have label Basonta ([66bc3b97](https://github.com/firstlovecenter/fl-pastoral-care/commit/66bc3b97d76abd8cfeb263663370db8185cc9d78))
- mark all creativeArts as Basonta ([cac96e14](https://github.com/firstlovecenter/fl-pastoral-care/commit/cac96e14448ee35c3ad1118feeadc141e4d935d7))
- hide 'Add title' button onn member form ([e132857f](https://github.com/firstlovecenter/fl-pastoral-care/commit/e132857fb1df7fd0f2a91ca75bfa6dcbc8155171))
- don't display both old image and new image when uploading image ([305b354b](https://github.com/firstlovecenter/fl-pastoral-care/commit/305b354b8ccc025deee82ad7013e577808a14205))
- remove errant comma from createcouncil ([720ab36c](https://github.com/firstlovecenter/fl-pastoral-care/commit/720ab36c5294f939dbc61188df93cdc8396d24fa))
- update hubfellowships on stream deatils ([8c22dc11](https://github.com/firstlovecenter/fl-pastoral-care/commit/8c22dc115eae267bd13544a478f7158a4a6bcbaf))
- fix bug preventing updating weekend bussing entry ([9dd990cf](https://github.com/firstlovecenter/fl-pastoral-care/commit/9dd990cf2136dfceb6b69e7653fbccb0f87e2511))
- update arrivals payment sheet to have council head name ([da8f74f0](https://github.com/firstlovecenter/fl-pastoral-care/commit/da8f74f03a62046928035102d40a7bf93b755660))
- bug with aggregate service cypher ([2d748cb2](https://github.com/firstlovecenter/fl-pastoral-care/commit/2d748cb26d3c1f38d27ed3d52094c0ef6286eee9))
- add number of services to all aggregate church levels ([5e51d258](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e51d258bfcdb31f0fde1573a00e9040f6fe4245))
- correct args for service utils ([2cb2d623](https://github.com/firstlovecenter/fl-pastoral-care/commit/2cb2d62370ce761f94c9766d75c36e4fb77968b6))
- prevent double form filling for council services ([1173a760](https://github.com/firstlovecenter/fl-pastoral-care/commit/1173a76081f881ed33471a1bbbc9686d3130f711))
- add leader names to the defaulters churchBySubchurch ([c2629ec4](https://github.com/firstlovecenter/fl-pastoral-care/commit/c2629ec4adee1bc9836097dcaaa99b03202840a1))
- update sender id for notify function ([aee4e17d](https://github.com/firstlovecenter/fl-pastoral-care/commit/aee4e17d86dbf6ae74072f2204eab55c01f67f3f))
- implement sending sms on council deposit ([7dbdb706](https://github.com/firstlovecenter/fl-pastoral-care/commit/7dbdb706fc9510c7837b6fd81892722f34ae7efd))
- change accountbalancecard on campus dashboard ([1330cfd5](https://github.com/firstlovecenter/fl-pastoral-care/commit/1330cfd56a9ceb391661042c19f2091e0785b22a))
- add council leader names to council names ([f041eca2](https://github.com/firstlovecenter/fl-pastoral-care/commit/f041eca2c3af054cf7182964299026035ec19a59))
- update permissions for council dashboard ([e35aa0c9](https://github.com/firstlovecenter/fl-pastoral-care/commit/e35aa0c9922440df99e4e3716e853d1f55b2a4bb))
- update permissions for accountsRoutes ([0ebf0032](https://github.com/firstlovecenter/fl-pastoral-care/commit/0ebf0032c7d59e4c8423b829c68cd0fae7149962))

##### Refactors

- refactor service aggregation flow for higherChurch levels ([8697292b](https://github.com/firstlovecenter/fl-pastoral-care/commit/8697292be22078a1149f70121d984b0baed7968a))

#### 7.10.2 (2023-09-22)

##### Bug Fixes

- update permissions for nav menu accounts ([876892ef](https://github.com/firstlovecenter/fl-pastoral-care/commit/876892ef960fd0b44d21788f942a9baa9ac35622))
- update permissions for nav menu accounts ([2d858f74](https://github.com/firstlovecenter/fl-pastoral-care/commit/2d858f74122b03c91f8fe16b187efe8aac97f068))

#### 7.10.1 (2023-09-22)

##### Bug Fixes

- fix permissions for defaulters ([ebf542ac](https://github.com/firstlovecenter/fl-pastoral-care/commit/ebf542ac534728fd1ab925c04cec82fdf862973e))

### 7.10.0 (2023-09-21)

##### New Features

- **accounts:** implement a preset HR Amount from GS Admin ([0f0a8257](https://github.com/firstlovecenter/fl-pastoral-care/commit/0f0a8257f3369841488c3b7df71d3ad4fd7be436))

##### Bug Fixes

- implement preset bussing amounts ([838c9121](https://github.com/firstlovecenter/fl-pastoral-care/commit/838c912111cb884e3f23734601690cefc19d50d8))
- rounded edges of search image picture ([8840a092](https://github.com/firstlovecenter/fl-pastoral-care/commit/8840a092fc8605b95cc27d7b1ab79d28243f7dd4))
- fix issue where stream ministries weren't appearing ([ad0b0c61](https://github.com/firstlovecenter/fl-pastoral-care/commit/ad0b0c611b8e60de7fd2059f4e19c75316af4bd0))
- update display of search results ([b2c8ccf8](https://github.com/firstlovecenter/fl-pastoral-care/commit/b2c8ccf80e456298d6c41fef357ccd764a5272d6))
- make coloring autosuggest drop down better ([baf32c3e](https://github.com/firstlovecenter/fl-pastoral-care/commit/baf32c3ee1e1c746712596e6e8b7b29e86aa43a7))
- update query to search for members ([4d372e90](https://github.com/firstlovecenter/fl-pastoral-care/commit/4d372e9042b179313a57c4db59ceb7147ba1c906))
- fix incorrect types on ServiceDetails.tsx ([fa6343b4](https://github.com/firstlovecenter/fl-pastoral-care/commit/fa6343b41e0e7e1f5c8f7a1730a9d58e3b05426b))

#### 7.9.26 (2023-09-19)

##### Bug Fixes

- fix bug where navigating to sub churches still shows you your highest level churches ([f5d2782b](https://github.com/firstlovecenter/fl-pastoral-care/commit/f5d2782be3c4520fc78012de675d24970789c8bf))
- remove all unnecessary mentions of sonta from the app ([ae6ae351](https://github.com/firstlovecenter/fl-pastoral-care/commit/ae6ae351f3fbe6a092055cdd63b494fc0fe40461))
- add middle name to search parameters ([eccca01f](https://github.com/firstlovecenter/fl-pastoral-care/commit/eccca01f79aefb545d8eed21753f429ac0dbb7ad))

#### 7.9.25 (2023-09-19)

##### Bug Fixes

- allow closing of constituencies by passing adminId ([3f08c7eb](https://github.com/firstlovecenter/fl-pastoral-care/commit/3f08c7ebd343435dea9c213dd615bc4350e922bd))
- update search to provide good results for creative arts and oversight ([0478cfca](https://github.com/firstlovecenter/fl-pastoral-care/commit/0478cfcab809723fe4bf4153fc8b9d28be0fc057))

#### 7.9.24 (2023-09-19)

##### Bug Fixes

- add some solid color and opacity to navbar ([76fd6750](https://github.com/firstlovecenter/fl-pastoral-care/commit/76fd675006c3039994934360046179a20ff1799d))
- minor ui changes to autosuggest box ([6ed0467c](https://github.com/firstlovecenter/fl-pastoral-care/commit/6ed0467c57853beb698c9fa775363287971befd7))
- modify search to bring results of all members and churches you have access to ([dae26e53](https://github.com/firstlovecenter/fl-pastoral-care/commit/dae26e5368a5e23f28267105995e3b50563e481f))
- remove leaderSonta from protectedroute ([826ee475](https://github.com/firstlovecenter/fl-pastoral-care/commit/826ee47578b5bec9e2532040f0de61ee2bceddd3))

#### 7.9.23 (2023-09-18)

#### 7.9.22 (2023-09-18)

#### 7.9.21 (2023-09-18)

#### 7.9.20 (2023-09-18)

##### Bug Fixes

- fix broken permissions on Constituency form ([83c59463](https://github.com/firstlovecenter/fl-pastoral-care/commit/83c5946381aad995a6b366793f117762c03cdb6f))
- update permissions for defaulters dashboard ([b3dbd39f](https://github.com/firstlovecenter/fl-pastoral-care/commit/b3dbd39f6472461ecb54768d5541514203d377ed))
- implement old_history log to prevent confusion ([88061bcc](https://github.com/firstlovecenter/fl-pastoral-care/commit/88061bcc73ee9eb25e135693ccee2367e0a13f03))

#### 7.9.19 (2023-09-18)

##### Bug Fixes

- remove unused duplicate mutations ([d197cea7](https://github.com/firstlovecenter/fl-pastoral-care/commit/d197cea7dab59d7903758b10624c158542df4e8f))
- minor updates to data display in ui ([49448971](https://github.com/firstlovecenter/fl-pastoral-care/commit/49448971feece934fa13ec6a40bd57badaf552ca))
- fix bugs in directory cypher ([a6d2bd7a](https://github.com/firstlovecenter/fl-pastoral-care/commit/a6d2bd7a976123b2fa02225e94b50e75589c628c))

#### 7.9.18 (2023-09-17)

##### Bug Fixes

- remove unused vars for update church details mutations ([9ce6ac6a](https://github.com/firstlovecenter/fl-pastoral-care/commit/9ce6ac6a39e5288c94c96e2109b2ec061b1d887d))
- fix some invalid types breaking the build ([16ae71b7](https://github.com/firstlovecenter/fl-pastoral-care/commit/16ae71b752f4586efa4e3ae6389b66a511e2454a))

#### 7.9.17 (2023-09-17)

##### Bug Fixes

- fix directory pages for fellowship, bacenta, constituency, council ([a3b48e28](https://github.com/firstlovecenter/fl-pastoral-care/commit/a3b48e283d565b65cc5343157101e2796cc3193c))
- fix bug preventing stream admin from searching ([e5926497](https://github.com/firstlovecenter/fl-pastoral-care/commit/e59264973d85d08d4921aeb0fa956f797b907e81))
- make change admin modal nicer looking ([f57edf54](https://github.com/firstlovecenter/fl-pastoral-care/commit/f57edf545c0512bb1022cbb2ea14870226af608a))
- fix bug with anagkazo defaulters 4 ([f9ac1499](https://github.com/firstlovecenter/fl-pastoral-care/commit/f9ac1499a3333c4acb3bb208f410a1bf50c0096c))
- fix bug with anagkazo defaulters 3 ([09a28956](https://github.com/firstlovecenter/fl-pastoral-care/commit/09a28956fdb4cd01967fe9420802bfbb592d339e))
- fix bug with anagkazo defaulters 2 ([593a0ac3](https://github.com/firstlovecenter/fl-pastoral-care/commit/593a0ac36ee420a4a3a96458f7e39bfe1044578b))
- fix bug preventing annagkazo banking ([170a7186](https://github.com/firstlovecenter/fl-pastoral-care/commit/170a7186d04ee64eb83c8a5479519dc567b52864))
- implement modal for moving bacentas across constituencies ([ee15dbe7](https://github.com/firstlovecenter/fl-pastoral-care/commit/ee15dbe7d360eb5f66f0c74c5d8e6238dadd6b3d))
- implement modal for moving constituencies across councils ([8e0777af](https://github.com/firstlovecenter/fl-pastoral-care/commit/8e0777afd7f3166aed5108a849337c9dea1dc17c))
- update code-of-the-day function for sept ([1b6abe36](https://github.com/firstlovecenter/fl-pastoral-care/commit/1b6abe362607f312d9e67f930b49bed26daf6f81))
- make it possible for vacation fellowships to be made into hub fellowships ([e17f79e1](https://github.com/firstlovecenter/fl-pastoral-care/commit/e17f79e127c407d6d87c990cce171f1b41479bca))

##### Refactors

- refactor all directory pages for moving lower churches ([1510002f](https://github.com/firstlovecenter/fl-pastoral-care/commit/1510002f9330a561e619ff4936a3a15f6579eea7))

#### 7.9.16 (2023-09-16)

##### New Features

- **creativearts:**
  - implement defaulters dashboard for all creative arts levels ([f15be886](https://github.com/firstlovecenter/fl-pastoral-care/commit/f15be8869a34e6f4a91510611c881e192b902c9d))
  - scaffold pages for creative arts graphs ([4df2c484](https://github.com/firstlovecenter/fl-pastoral-care/commit/4df2c484f6303cff997ac843dcca2850c981d3f5))

##### Bug Fixes

- fix broken import of css file ([02be4e94](https://github.com/firstlovecenter/fl-pastoral-care/commit/02be4e9488dc5031d02b4f9ce139aa1727e71ad0))
- fix bug on member role list for creativeArtsLeaders ([7bf8a532](https://github.com/firstlovecenter/fl-pastoral-care/commit/7bf8a532fef1d015078587b20d9933c7e90bb094))
- finish church by subchurch queries ([f992fa0a](https://github.com/firstlovecenter/fl-pastoral-care/commit/f992fa0a3cfea1469b2b189d29019af84d7be629))
- fix sonta bugs ([2724d184](https://github.com/firstlovecenter/fl-pastoral-care/commit/2724d18443ebc629b33e83af4bacc79d91bc76e6))
- cypher bug in connectChurch ([879b3f3f](https://github.com/firstlovecenter/fl-pastoral-care/commit/879b3f3fb7884462b1573f519c461d829391a31f))

#### 7.9.15 (2023-09-15)

##### Bug Fixes

- fix issues with sonta and oa ([29bbf0f8](https://github.com/firstlovecenter/fl-pastoral-care/commit/29bbf0f833f2f5d07b217e80f0837ca2fe7db1e7))
- **outside-accra:**
  - add cypher query to connect leaders ([a89ae84c](https://github.com/firstlovecenter/fl-pastoral-care/commit/a89ae84c95d7913684c5fd36feacddc8179b94b0))
  - add cypher query to match Oversight member ([b2bda326](https://github.com/firstlovecenter/fl-pastoral-care/commit/b2bda326353bd27e89034795e57621575ea13709))

#### 7.9.14 (2023-09-15)

##### New Features

- **creativearts:**
  - finalise changes to update creative arts ([349c175d](https://github.com/firstlovecenter/fl-pastoral-care/commit/349c175d963f7b4f0cc5b1c3d4df0efe6b3ef151))
  - implement update creative arts page ([cd962c95](https://github.com/firstlovecenter/fl-pastoral-care/commit/cd962c956010a301ac4a446a19ceda44652fa2a4))

##### Bug Fixes

- add church oversight type to resolver cypher ([fc88e32c](https://github.com/firstlovecenter/fl-pastoral-care/commit/fc88e32cc496579426397cac376f2f791e6abf7c))
- add denomition to permission levels ([5e926e40](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e926e40feda0a7cbe8c98bb1e1cfa0305a5f218))
- add admins to oversight and campus levels ([35e63608](https://github.com/firstlovecenter/fl-pastoral-care/commit/35e63608c39c1da214bf85af1218f481c26ea6e4))
- separate useChurchLevel and useSontaLevel ([4f38ebb6](https://github.com/firstlovecenter/fl-pastoral-care/commit/4f38ebb6c646b788a7f49636404e30b39dcd3fb2))
- **outside-accra:** implement resolver for oversight admin ([1b4569c1](https://github.com/firstlovecenter/fl-pastoral-care/commit/1b4569c1392438fe6803830231d6d140567ff21a))

#### 7.9.13 (2023-09-15)

##### New Features

- **creativearts:**
  - initiate hub rehearsal and sunday meeting form ([b0710afb](https://github.com/firstlovecenter/fl-pastoral-care/commit/b0710afb616e67b577c755af32f94acb77f80505))
  - implement defaulters for hub leaders ([692d7cfd](https://github.com/firstlovecenter/fl-pastoral-care/commit/692d7cfd7560a913ba2354f1b941126dacf23cca))

##### Bug Fixes

- **creativearts:** viewing all hubs is now restricted to the select ministry ([10339e33](https://github.com/firstlovecenter/fl-pastoral-care/commit/10339e3354f464a0daed67e305916202e6a07dd1))
- **shepherding-control:** all YTD data is now ACTUALLY YTD ([8ed8b571](https://github.com/firstlovecenter/fl-pastoral-care/commit/8ed8b57125e6669035a7a99910c5a9c64dfe0e28))
- **imcl:** update error handling of imcl lists for anagkazo ([268418e6](https://github.com/firstlovecenter/fl-pastoral-care/commit/268418e608698ed635b08aaf637fe1d2f956e299))

#### 7.9.12 (2023-09-14)

##### New Features

- implement flows to creative arts at all church levels ([4286fcb0](https://github.com/firstlovecenter/fl-pastoral-care/commit/4286fcb0fc8e97e72c6602b4f971136813854e3c))

##### Bug Fixes

- update stylinng of map ([29dd0847](https://github.com/firstlovecenter/fl-pastoral-care/commit/29dd0847bc3938c18d0d89a27d52b24bcdbcae2d))
- bug with infowindow on map colouring ([c9f13593](https://github.com/firstlovecenter/fl-pastoral-care/commit/c9f135934d73ef10762dc98b816f69ecdd5703e6))

#### 7.9.11 (2023-09-12)

##### Bug Fixes

- bring back alert for throwToSentry ([c46502ff](https://github.com/firstlovecenter/fl-pastoral-care/commit/c46502ffecefe7448367fcd63672214c1ff2a910))

#### 7.9.10 (2023-09-11)

##### Bug Fixes

- fix bug preventing search from working ([e16794cd](https://github.com/firstlovecenter/fl-pastoral-care/commit/e16794cd19408ab8fa14cbc808588aab08b5bda6))

#### 7.9.9 (2023-09-11)

##### Bug Fixes

- minor improvements ([b45b8218](https://github.com/firstlovecenter/fl-pastoral-care/commit/b45b82182795faa607c18d2d5ca5c515591174a6))

#### 7.9.8 (2023-09-11)

##### Bug Fixes

- refactor setPermissions to use useQuery instead of useLazyQuery ([ae113331](https://github.com/firstlovecenter/fl-pastoral-care/commit/ae11333110a21af32312fb1bad22e29bc2d5d210))

#### 7.9.7 (2023-09-11)

##### Bug Fixes

- log some vars to the console ([be387b72](https://github.com/firstlovecenter/fl-pastoral-care/commit/be387b72cb414762a56e35a8cbec89c1442c2d47))

#### 7.9.6 (2023-09-11)

##### Bug Fixes

- fix bug in setPermissions ([741e2445](https://github.com/firstlovecenter/fl-pastoral-care/commit/741e244553f3804f7034daf9c2b7892f6f2ec293))

#### 7.9.5 (2023-09-11)

##### Bug Fixes

- update styling of popup box ([c03f09e1](https://github.com/firstlovecenter/fl-pastoral-care/commit/c03f09e179f76623375c5af6546164c30ba11b29))

#### 7.9.4 (2023-09-11)

##### Bug Fixes

- fixed issue with arrivals backdating ([35b7cb12](https://github.com/firstlovecenter/fl-pastoral-care/commit/35b7cb12710b05daf4db18726487fdaebaa86300))
- fixed final bugs with creative arts search ([02d49d6c](https://github.com/firstlovecenter/fl-pastoral-care/commit/02d49d6c15ff279b34d2873b07fb3683c3883270))
- implement search functionality for all levels of creativearts ([fbbe9966](https://github.com/firstlovecenter/fl-pastoral-care/commit/fbbe9966e7cfbf0420a62fc1e594a915fa77a3a0))
- add a no data component for coucils ([322a6a96](https://github.com/firstlovecenter/fl-pastoral-care/commit/322a6a966379f604f4402162b412d354255f32a4))
- implement backend for searching for creative arts church groups ([10d3a17f](https://github.com/firstlovecenter/fl-pastoral-care/commit/10d3a17f83872d656c9121ed82390f3e58536994))
- add number of hubs to all hubs display ([8f937c33](https://github.com/firstlovecenter/fl-pastoral-care/commit/8f937c3313d6944f0d052dc20c18e87e73b36fed))

#### 7.9.3 (2023-09-10)

##### Bug Fixes

- update hub view to show councils ([3638601d](https://github.com/firstlovecenter/fl-pastoral-care/commit/3638601d9d84c76a8fb40142dd4da16258a13517))
- update code-of-the-day function ([1c3e44dc](https://github.com/firstlovecenter/fl-pastoral-care/commit/1c3e44dc8908ed441d4d1dd69cd8acf91b7640a5))
- fix breaking change for memberrolelist with creativeArtsAdmins ([f89cf1e3](https://github.com/firstlovecenter/fl-pastoral-care/commit/f89cf1e364ef2282c9b68adea4d7c9c1419ded09))
- bring back the directory lock ([ec8dbb2c](https://github.com/firstlovecenter/fl-pastoral-care/commit/ec8dbb2ce2073c9c4e52f08ddae8ddb19c49515f))

#### 7.9.2 (2023-09-09)

##### Bug Fixes

- fix botched roles on allHubs.tsx ([4c3f3a49](https://github.com/firstlovecenter/fl-pastoral-care/commit/4c3f3a499895cd963e36d76baeee4b18212b9c89))

#### 7.9.1 (2023-09-09)

##### Bug Fixes

- remove directory lock for creattive arts admin ([01544f01](https://github.com/firstlovecenter/fl-pastoral-care/commit/01544f0163aab37595b897f5b74fe57cc000b343))
- change color of sonta view trends btn ([c6c06907](https://github.com/firstlovecenter/fl-pastoral-care/commit/c6c069073ec9c713bfa9fdf637473ed93d5c1776))

### 7.9.0 (2023-09-09)

##### New Features

- design the flow for the creative arts admin ([61bb36c0](https://github.com/firstlovecenter/fl-pastoral-care/commit/61bb36c0f9818b47cfc93e9d68a0e5778ebd191e))
- implement functionality to assign creative arts admins and ministry admins ([b9fbd507](https://github.com/firstlovecenter/fl-pastoral-care/commit/b9fbd50710bcad9919e22befdfbce2bf3e1714a6))
- add better handling for loading state of member roles ([fe694a29](https://github.com/firstlovecenter/fl-pastoral-care/commit/fe694a298d204702d2338fe54de10c041562c68b))
- add creative arts roles to the memberrolelist ([dfb99f99](https://github.com/firstlovecenter/fl-pastoral-care/commit/dfb99f99c3f36220715be348bf3de8fae130e851))

##### Bug Fixes

- implement member list for all creative arts levels ([6a3248de](https://github.com/firstlovecenter/fl-pastoral-care/commit/6a3248dedc5d1b230ed42a7e3064e45064d7bd61))
- update gql queries to show sonta roles on member display ([cc1fe2f9](https://github.com/firstlovecenter/fl-pastoral-care/commit/cc1fe2f983a6c9bfbb073583d15c81b84e5bd03c))
- update easy-debuggion cypher script ([b1e6b86b](https://github.com/firstlovecenter/fl-pastoral-care/commit/b1e6b86b278bbdd7d422cd53174b3fef3c1851fe))

#### 7.8.6 (2023-09-07)

##### Bug Fixes

- fix bug preventing members from not displaying ([fdefd96b](https://github.com/firstlovecenter/fl-pastoral-care/commit/fdefd96bd24b149b6007bb67c93b7c77da8fbe87))

#### 7.8.5 (2023-09-07)

##### New Features

- remove the need for churchBySubchurch page in arrivals ([76cc1e4d](https://github.com/firstlovecenter/fl-pastoral-care/commit/76cc1e4dd1776008b34ee2361c02bfecdbcab32e))

##### Bug Fixes

- fix bug preventing members from not displaying ([56da69e3](https://github.com/firstlovecenter/fl-pastoral-care/commit/56da69e367423486607fa6d721a61c1ddb9c8582))
- implement a button to load all unvisited members for a council ([07a17e85](https://github.com/firstlovecenter/fl-pastoral-care/commit/07a17e85e0c5e4023fe593f3b621fcb9f132b9ae))
- online giving is now counted during council services ([01c7b4f4](https://github.com/firstlovecenter/fl-pastoral-care/commit/01c7b4f4693255cbd4dacabd1f76a6f65048a4d9))
- fix ui issues with placeholder and member display page ([e0b90c49](https://github.com/firstlovecenter/fl-pastoral-care/commit/e0b90c49a782629389c7b780dfca1fdffc1282ad))
- correct wrong looading state on search page ([3f120846](https://github.com/firstlovecenter/fl-pastoral-care/commit/3f120846400d406644d6405c35004e8cbad9d869))
- update loader for search page ([6f0e66c7](https://github.com/firstlovecenter/fl-pastoral-care/commit/6f0e66c72ba0fdbe0aecacc86f83b264c1cfbc52))
- fix broken import statements 2 ([96f4bd69](https://github.com/firstlovecenter/fl-pastoral-care/commit/96f4bd69bc86ec84d18d236791991eceb1f9f307))
- fix broken import statements ([ca68bbab](https://github.com/firstlovecenter/fl-pastoral-care/commit/ca68bbabd7b5f66a8d6e1f78ca75ba18dbb8f77d))
- fix bug preventing back button in arrivals flow ([ae438dcb](https://github.com/firstlovecenter/fl-pastoral-care/commit/ae438dcb048c8af9dabb341c903742c7d3cfcfe8))
- navbar now toggles with light mode ([5badc001](https://github.com/firstlovecenter/fl-pastoral-care/commit/5badc001f6ee16a163f0c8cd737b3c71efe640be))

#### 7.8.4 (2023-09-05)

##### Bug Fixes

- fix bug where graphs wouldn't show even after loading ([ef1bfa1d](https://github.com/firstlovecenter/fl-pastoral-care/commit/ef1bfa1d029b65878f9727331c8346255b4a723b))
- update colors on arrivals ([cc9c2e15](https://github.com/firstlovecenter/fl-pastoral-care/commit/cc9c2e1514b7176553f590f3cdd83a0bd15c4890))
- fix loading of member display trends btn ([8a1b342c](https://github.com/firstlovecenter/fl-pastoral-care/commit/8a1b342c861d61f05affa52918bb60d74e17cab5))

#### 7.8.3 (2023-09-04)

##### Bug Fixes

- add some fun new loaders ([a210c9bd](https://github.com/firstlovecenter/fl-pastoral-care/commit/a210c9bde1655273d83ddf4250e931fd3c2ae7d7))
- update style in service forms ([563f3def](https://github.com/firstlovecenter/fl-pastoral-care/commit/563f3def81d8029f1b4f80acc0bd3560f33bd4ff))
- **ui:**
  - fix text overflow on details card for bacenta details ([928a34b2](https://github.com/firstlovecenter/fl-pastoral-care/commit/928a34b2e9b630655a522658b03bf89f9ad9fd40))
  - fix colors on search page ([af7511f0](https://github.com/firstlovecenter/fl-pastoral-care/commit/af7511f0561215f3ad0ad227956e16052de5843d))

#### 7.8.2 (2023-09-04)

##### Bug Fixes

- fix bugs breaking the build 2 ([52067ebd](https://github.com/firstlovecenter/fl-pastoral-care/commit/52067ebd5d3013fa2c5601ab4bf9991358f9ce33))
- fix bugs breaking the build ([676664c0](https://github.com/firstlovecenter/fl-pastoral-care/commit/676664c096da36782d2d6b39724ff8b3537810e0))
- initial implementation for hub graph page ([bb03e26e](https://github.com/firstlovecenter/fl-pastoral-care/commit/bb03e26e64b1ac54c591dd14d78d0be28ddc5ba5))
- implement aggregation of hub fellowships on hub ([09fc8b67](https://github.com/firstlovecenter/fl-pastoral-care/commit/09fc8b671d6ed9fd6a73cc9dd1b5dd21802609b1))
- implement graphs on hub level churches ([911daed1](https://github.com/firstlovecenter/fl-pastoral-care/commit/911daed1680f5c03f6b077509a67c1ebe0d24206))
- add a page container and some extra styling for menu buttons in light mode ([b7ffe164](https://github.com/firstlovecenter/fl-pastoral-care/commit/b7ffe164d32c50f087124787431a71e41b17dd9b))
- implement chakra-ui style colours for theme ([ceec3b9b](https://github.com/firstlovecenter/fl-pastoral-care/commit/ceec3b9b2126b71059fd5b87b595b04dbe995288))
- fix bug preventing fellowships from displaying correctly ([7445b381](https://github.com/firstlovecenter/fl-pastoral-care/commit/7445b381189b63e35b32749832b046195ae4b814))
- fix bug on error screen button ([fabf595d](https://github.com/firstlovecenter/fl-pastoral-care/commit/fabf595da06e4c8b2896c5baee320c12011976c0))
- fix bug on error screen button ([f6370d3a](https://github.com/firstlovecenter/fl-pastoral-care/commit/f6370d3a21e103588e3b490220b45db30d5a4a7f))
- edit text on error screen ([b2c75ede](https://github.com/firstlovecenter/fl-pastoral-care/commit/b2c75ede8dbd617c75d5b9455da15502e235336f))
- remove errant a ([34566f83](https://github.com/firstlovecenter/fl-pastoral-care/commit/34566f832f94e87db96140b90d53fe23c6f0d78d))

##### Refactors

- **ui:** revamped color scheme for entire frontend ([89ca0119](https://github.com/firstlovecenter/fl-pastoral-care/commit/89ca0119e623f1701ad3793824e4c4f5affcb105))

#### 7.8.1 (2023-09-02)

##### Bug Fixes

- implement a button to send crash report ([33130688](https://github.com/firstlovecenter/fl-pastoral-care/commit/331306889f8532c80893ab9241bf3c6d54702d90))
- fix annoying blue link flash ([ff3d4cd4](https://github.com/firstlovecenter/fl-pastoral-care/commit/ff3d4cd4c287d98beba1d8c9fb47437c352fcd85))

### 7.8.0 (2023-09-02)

##### New Features

- update fellowship details screen to show creative arts breadcrumb ([ad560e12](https://github.com/firstlovecenter/fl-pastoral-care/commit/ad560e1283d599468fe6689a3b9ec4756c448229))
- implement feature to create hub fellowships ([90ba612e](https://github.com/firstlovecenter/fl-pastoral-care/commit/90ba612e60ed72cccbabd149cb4cef2ea7507da0))
- implement all create mutations ([3868c179](https://github.com/firstlovecenter/fl-pastoral-care/commit/3868c179f606d78b80db89820e77ad24d890af27))

##### Bug Fixes

- implement truncating texts after 2 lines ([3b1bdf3a](https://github.com/firstlovecenter/fl-pastoral-care/commit/3b1bdf3ac86a5aad5ca7a1b9292cfda2f10a2ab5))
- update code of the day to end of September ([d305e61d](https://github.com/firstlovecenter/fl-pastoral-care/commit/d305e61d18ea1aa9abd353f7dc01be486b683897))
- minor improvement to return councils from ministry ([868f7790](https://github.com/firstlovecenter/fl-pastoral-care/commit/868f779074a59fe67a278b8dd4f469c7da8c0d9c))
- change creativeArts relationship name on main churches ([fe7036de](https://github.com/firstlovecenter/fl-pastoral-care/commit/fe7036dec4bfcbf9ba65191d1372b2869ea4ec95))
- make fellowship.hub nullable ([a031e762](https://github.com/firstlovecenter/fl-pastoral-care/commit/a031e762f2447801faaf2ceac37309481ebb9556))
- prevent normal fellowship details from breaking ([3d5545b2](https://github.com/firstlovecenter/fl-pastoral-care/commit/3d5545b2ed557b3a2e3478a3344a084be84bb1a0))
- add roleview on hub fellowship options ([016d88a6](https://github.com/firstlovecenter/fl-pastoral-care/commit/016d88a63979c8dc260a054237a7aeb3ee4649a4))
- fix bugs in creating creative arts ([75c1db8b](https://github.com/firstlovecenter/fl-pastoral-care/commit/75c1db8bdd2e6bc36db8c7d935bc085e0d24c1b3))
- fix typo ([bb508af9](https://github.com/firstlovecenter/fl-pastoral-care/commit/bb508af962fafec150d288ad188ab4268ed2fabd))
- add som e spaces ([c4da2a0e](https://github.com/firstlovecenter/fl-pastoral-care/commit/c4da2a0e729ad09141b40e60777d7516245bccb8))

#### 7.7.10 (2023-08-18)

##### New Features

- implement an input box for admin to re enter the transaction ref from frontend ([46dc7e85](https://github.com/firstlovecenter/fl-pastoral-care/commit/46dc7e8594d3a00fe0da239ec514876497240dd5))

##### Bug Fixes

- add a script to clear IMCLs for this week ([3bdfb361](https://github.com/firstlovecenter/fl-pastoral-care/commit/3bdfb3614368f397894c062f3317be91ea1dad85))
- fix issue where some church graphs were not showing ([61fcb351](https://github.com/firstlovecenter/fl-pastoral-care/commit/61fcb3510049367d5e851c10bac10b101de71ff7))
- update dependencies ([4abce29e](https://github.com/firstlovecenter/fl-pastoral-care/commit/4abce29e8c2f545dca060eda626ee82f6cc21d2f))
- update dependencies ([52e55950](https://github.com/firstlovecenter/fl-pastoral-care/commit/52e559505c40eff30257f07c424fe769b578ae1c))
- update @neo4j/graphql package ([6d11f800](https://github.com/firstlovecenter/fl-pastoral-care/commit/6d11f8001a82275262687b3d3c20fba5e809d189))
- update stream account options frontend ([48e6d5af](https://github.com/firstlovecenter/fl-pastoral-care/commit/48e6d5af0a0704d6a983a5d3e3fa508ac821ccdb))
- update kwabenya and adenta campus paystack accounts ([0339254c](https://github.com/firstlovecenter/fl-pastoral-care/commit/0339254cfd9f55e6476a1cc78b79467b4ed93465))
- implement filter on banking slip lists ([4f01f17f](https://github.com/firstlovecenter/fl-pastoral-care/commit/4f01f17f8995b1592caceff952cf450fb26b26a7))
- implement pagination on self banking service list ([6a21725e](https://github.com/firstlovecenter/fl-pastoral-care/commit/6a21725e6f6cbbb8a768d0d0e9742fc1e4a022a3))
- implement second session for anagkazo treasury resolver ([ae26d52a](https://github.com/firstlovecenter/fl-pastoral-care/commit/ae26d52af59cc39b55c06626baeee189a0407d59))
- increase limit of self banked services ([ac452e07](https://github.com/firstlovecenter/fl-pastoral-care/commit/ac452e07955dab63039acc043ccaedd86361362a))
- fix typename bug not allowing map markers to load ([007f8c8d](https://github.com/firstlovecenter/fl-pastoral-care/commit/007f8c8d225b7615a99ff99815007ecb6d8c3827))
- update typo in object path ([cd08518a](https://github.com/firstlovecenter/fl-pastoral-care/commit/cd08518accb1e56beb77441b6cd83cf43161481b))
- minor improvements to typedefs for maps ([24079c3c](https://github.com/firstlovecenter/fl-pastoral-care/commit/24079c3cccab6cfa9bf62ea3f0010deb3212bb0e))

#### 7.7.10 (2023-07-31)

##### Bug Fixes

- update typo in object path ([cd08518a](https://github.com/firstlovecenter/fl-pastoral-care/commit/cd08518accb1e56beb77441b6cd83cf43161481b))
- minor improvements to typedefs for maps ([24079c3c](https://github.com/firstlovecenter/fl-pastoral-care/commit/24079c3cccab6cfa9bf62ea3f0010deb3212bb0e))

#### 7.7.9 (2023-07-31)

##### Bug Fixes

- remove table variant for user dashboard ([501033ba](https://github.com/firstlovecenter/fl-pastoral-care/commit/501033baac14e9c1444e3f413d655c14162dab5b))
- update color scheme with bootstrap dark mode v5.3 ([1cf1931d](https://github.com/firstlovecenter/fl-pastoral-care/commit/1cf1931dc4f1cfd6d46b41a5f5027f8cee372b47))

#### 7.7.8 (2023-07-30)

##### Bug Fixes

- colour the backgroup of the table on the user dashboard ([44165d5b](https://github.com/firstlovecenter/fl-pastoral-care/commit/44165d5bc65f293f185ea6f81b2f71591e04fa14))

#### 7.7.7 (2023-07-30)

##### Chores

- update dependencies ([c91918b5](https://github.com/firstlovecenter/fl-pastoral-care/commit/c91918b5eadd38028905d2094a5da0c24989b42b))

##### Documentation Changes

- update CHANGELOG.md ([72a8c309](https://github.com/firstlovecenter/fl-pastoral-care/commit/72a8c309628f7abc4f5d880fbc6a9d5a5e786e07))
- update CHANGELOG.md ([d53b9b73](https://github.com/firstlovecenter/fl-pastoral-care/commit/d53b9b73041d08a0f1819ebac43714ddb047553b))
- update CHANGELOG.md ([4184ded4](https://github.com/firstlovecenter/fl-pastoral-care/commit/4184ded450c9d6322622afb1633c53878a8ba65a))

##### New Features

- prevent a person from banking for a service if he has not filled poimen app ([9581a8ba](https://github.com/firstlovecenter/fl-pastoral-care/commit/9581a8ba299eb5579c8e75c3b81b0def292d90d6))

##### Bug Fixes

- remove loophole for anagkazo to bank without filling on poimen app ([b133ccb0](https://github.com/firstlovecenter/fl-pastoral-care/commit/b133ccb0fde20420c7cc2a335828f70c54322e56))
- attempt to fix serviceWorker bug 1 ([2c841885](https://github.com/firstlovecenter/fl-pastoral-care/commit/2c8418851bc236099d06e8ca1287d28a71d1b3b7))
- update the condition check for imclNotFilled ([4fb3ea42](https://github.com/firstlovecenter/fl-pastoral-care/commit/4fb3ea42b1fb24388d85295128d1832ed52d2b1a))
- add IMCL as a condition for banking ([bd038484](https://github.com/firstlovecenter/fl-pastoral-care/commit/bd0384840b8714be529dfac63af5694d9aeda1a9))
- remove sentry error tracking from dev backend server ([f56f8ff6](https://github.com/firstlovecenter/fl-pastoral-care/commit/f56f8ff6d83f8d8ef457cdf4f5692b8c9c1480de))
- increase permission level needed to make arrivals admin ([9b47ea28](https://github.com/firstlovecenter/fl-pastoral-care/commit/9b47ea28eb1d62e8171d9c28d7f2dfe27642b855))
- minor changes ([b8927103](https://github.com/firstlovecenter/fl-pastoral-care/commit/b89271031f6d5077723f90bb5e00cb0627638efd))
- console.log neoRes from payment webhook ([17b89f34](https://github.com/firstlovecenter/fl-pastoral-care/commit/17b89f340bd044831ce8438d94010ee53d8c94f9))
- after selecting a leader name displayed should not include last name ([2150fbfd](https://github.com/firstlovecenter/fl-pastoral-care/commit/2150fbfdf554a30bf4a662caa36cd5e2696e5096))
- update peacock settings ([2d13366b](https://github.com/firstlovecenter/fl-pastoral-care/commit/2d13366b1eced0a55ce3a8d0f7ca7fdf2f8d6c2b))
- delete a few errant files 2 ([4f43340d](https://github.com/firstlovecenter/fl-pastoral-care/commit/4f43340da4598825e238815cacf7ea624725ee1a))
- delete a few errant files ([50df103e](https://github.com/firstlovecenter/fl-pastoral-care/commit/50df103e1ca18d574afb79ae46ae123020553753))
- bug fixes to make all creative arts aspects work ([de6f92e9](https://github.com/firstlovecenter/fl-pastoral-care/commit/de6f92e9587c28cf38ec50eee805fed6390302c7))
- edit all federal ministry mentions to creativeArts ([aeb0d9c0](https://github.com/firstlovecenter/fl-pastoral-care/commit/aeb0d9c0a50bb7907b9e75b055dca675d45da7f1))
- remove new sonta leader ([5daeba6b](https://github.com/firstlovecenter/fl-pastoral-care/commit/5daeba6b87f9bab0146837c42648c32ee9838a00))

##### Other Changes

- //github.com/firstlovecenter/fl-admin-portal into deploy ([cf2df1bb](https://github.com/firstlovecenter/fl-pastoral-care/commit/cf2df1bb5f65555a72a1b4135cd565104a3fcaee))

##### Refactors

- convert PWA to vite compatible config ([1894d487](https://github.com/firstlovecenter/fl-pastoral-care/commit/1894d487b106e2d146f630a97c79392449cabbb6))

#### 7.7.6 (2023-07-30)

#### 7.7.5 (2023-07-30)

#### 7.7.4 (2023-07-30)

##### Chores

- update dependencies ([385d34c5](https://github.com/firstlovecenter/fl-pastoral-care/commit/385d34c55fa366f58e339b4648f24bc26dd992a8))

##### New Features

- prevent a person from banking for a service if he has not filled poimen app ([b6a43747](https://github.com/firstlovecenter/fl-pastoral-care/commit/b6a43747891c33470010ce98a0ef8ebba5930e87))

##### Bug Fixes

- remove loophole for anagkazo to bank without filling on poimen app ([25bb6aed](https://github.com/firstlovecenter/fl-pastoral-care/commit/25bb6aed3dd9cefe57810bf95dba02a42551b178))
- attempt to fix serviceWorker bug 1 ([05e1ee94](https://github.com/firstlovecenter/fl-pastoral-care/commit/05e1ee94fe4237255c4032959b7db44d798a3d6d))
- update the condition check for imclNotFilled ([7719e9b1](https://github.com/firstlovecenter/fl-pastoral-care/commit/7719e9b1a88a0e89933a1681a7379b1db9a0c036))
- add IMCL as a condition for banking ([fef6d636](https://github.com/firstlovecenter/fl-pastoral-care/commit/fef6d63666eb6ea3e820c2cd6e8df6f0848279eb))
- remove sentry error tracking from dev backend server ([3e30a9ec](https://github.com/firstlovecenter/fl-pastoral-care/commit/3e30a9ec3ad38f00294ceabf563dc951cd2a6885))
- minor changes ([b8927103](https://github.com/firstlovecenter/fl-pastoral-care/commit/b89271031f6d5077723f90bb5e00cb0627638efd))
- console.log neoRes from payment webhook ([17b89f34](https://github.com/firstlovecenter/fl-pastoral-care/commit/17b89f340bd044831ce8438d94010ee53d8c94f9))
- after selecting a leader name displayed should not include last name ([2150fbfd](https://github.com/firstlovecenter/fl-pastoral-care/commit/2150fbfdf554a30bf4a662caa36cd5e2696e5096))
- update peacock settings ([2d13366b](https://github.com/firstlovecenter/fl-pastoral-care/commit/2d13366b1eced0a55ce3a8d0f7ca7fdf2f8d6c2b))
- delete a few errant files 2 ([4f43340d](https://github.com/firstlovecenter/fl-pastoral-care/commit/4f43340da4598825e238815cacf7ea624725ee1a))
- delete a few errant files ([50df103e](https://github.com/firstlovecenter/fl-pastoral-care/commit/50df103e1ca18d574afb79ae46ae123020553753))
- bug fixes to make all creative arts aspects work ([de6f92e9](https://github.com/firstlovecenter/fl-pastoral-care/commit/de6f92e9587c28cf38ec50eee805fed6390302c7))
- edit all federal ministry mentions to creativeArts ([aeb0d9c0](https://github.com/firstlovecenter/fl-pastoral-care/commit/aeb0d9c0a50bb7907b9e75b055dca675d45da7f1))
- remove new sonta leader ([5daeba6b](https://github.com/firstlovecenter/fl-pastoral-care/commit/5daeba6b87f9bab0146837c42648c32ee9838a00))

##### Refactors

- convert PWA to vite compatible config ([f814a5a5](https://github.com/firstlovecenter/fl-pastoral-care/commit/f814a5a58464a2cb588870f03276949e0ce7a5fd))

#### 7.7.3 (2023-07-05)

##### Bug Fixes

- remove all mentions of leadSonta from the app ([1588245c](https://github.com/firstlovecenter/fl-pastoral-care/commit/1588245c0dc422a0bbf91dec4dd7e56cc755c6aa))
- add 'denomination' to churchLevel ([ffbff662](https://github.com/firstlovecenter/fl-pastoral-care/commit/ffbff662431bb44e1ad71a7de489c5c19a807c33))
- reorganise sonta church groups ([#438](https://github.com/firstlovecenter/fl-pastoral-care/pull/438)) ([1631cbad](https://github.com/firstlovecenter/fl-pastoral-care/commit/1631cbad90158e29c226453223438ab1892bfd33))
- fix spelling mistake campuss ([eaf5313e](https://github.com/firstlovecenter/fl-pastoral-care/commit/eaf5313e1773b78b9f41eaa89f44cd37a7cef937))

#### 7.7.2 (2023-07-04)

##### New Features

- include middle initials in member search box ([87938934](https://github.com/firstlovecenter/fl-pastoral-care/commit/87938934097d5bd28c9e8695988fe8f002288ef5))

##### Bug Fixes

- fix firestore update transactionStatus ([0f5dcc75](https://github.com/firstlovecenter/fl-pastoral-care/commit/0f5dcc750a8f67d3d7472edeb2686d7a2aed2b51))
- fix bug in bussesOnTheWayCount cypher ([fc920c8a](https://github.com/firstlovecenter/fl-pastoral-care/commit/fc920c8abca28ac7aea32fe99687c238500a0a0b))
- update code of the day to the end of August ([0ba15db2](https://github.com/firstlovecenter/fl-pastoral-care/commit/0ba15db27bb2d9aed505eb9138f600a0d3e258e5))
- increase transaction wait time to 2 mins ([428aeebb](https://github.com/firstlovecenter/fl-pastoral-care/commit/428aeebb6524116c4d9e1fe078feae1f30fa6877))
- set transactionRef as the first think in the banking resolver before checking OTP ([6663cd1b](https://github.com/firstlovecenter/fl-pastoral-care/commit/6663cd1bb9193c5effd34e981695df7f01a2fbf4))
- log out categories ([7d46875d](https://github.com/firstlovecenter/fl-pastoral-care/commit/7d46875d701c88876a07f6c8ca157d4e9a7b0d26))
- improve values returned in payment webhook ([9877959b](https://github.com/firstlovecenter/fl-pastoral-care/commit/9877959bc26445f7ffdcec814b8436455ba6a87b))
- increase wait time for confirm bankign to 90s ([02389ec2](https://github.com/firstlovecenter/fl-pastoral-care/commit/02389ec221ad30277edb3dd77cf6bb8ceca9d584))

##### Other Changes

- //github.com/firstlovecenter/fl-admin-portal into deploy ([a8ff38fb](https://github.com/firstlovecenter/fl-pastoral-care/commit/a8ff38fbccba77fc9afc97206d2950ab0d8b544f))

##### Refactors

- change nomenclature at B Josh's request ([7128523d](https://github.com/firstlovecenter/fl-pastoral-care/commit/7128523d9ed07052503400c5b175557f3dd9fe7d))
- add the name synago to places ([7f4f87cd](https://github.com/firstlovecenter/fl-pastoral-care/commit/7f4f87cdb55f133f2efedc6e195236dc3a5d8de9))
- add the name synago to places ([97aac04b](https://github.com/firstlovecenter/fl-pastoral-care/commit/97aac04bf54c01b1b7a635368f596d9181360055))

#### 7.7.1 (2023-06-26)

##### New Features

- allow other people to confirm your transaction from the self banking receipt page ([3b62069c](https://github.com/firstlovecenter/fl-pastoral-care/commit/3b62069cfbd087176b47950444b54858d68df7b4))

##### Bug Fixes

- add instructions on what to check when payment fails ([fef40cb4](https://github.com/firstlovecenter/fl-pastoral-care/commit/fef40cb4f693fab9a5d3776ff40872a58c6cf10b))
- update error message when transaction fails ([6016b3a6](https://github.com/firstlovecenter/fl-pastoral-care/commit/6016b3a6112ec443d65e2080263c61d1637f22bd))
- console.log results from payment function ([39895508](https://github.com/firstlovecenter/fl-pastoral-care/commit/3989550817ee29ce527bebe6e01fecde045320d6))
- vehicle less than 8 should not be counted ([8c76d4bb](https://github.com/firstlovecenter/fl-pastoral-care/commit/8c76d4bbd27241fca197d7287f31e6313d76235e))
- modify throwToSentry error 10 ([26f7d631](https://github.com/firstlovecenter/fl-pastoral-care/commit/26f7d6311d93ba012ae7cdb27bf1142ee99a9db1))
- modify throwToSentry error 9 ([8428f954](https://github.com/firstlovecenter/fl-pastoral-care/commit/8428f9545cf10c3c450ed8c62e67bf65927d0eed))
- modify throwToSentry error 8 ([84d662c8](https://github.com/firstlovecenter/fl-pastoral-care/commit/84d662c8984d4b60adc45ee491771929b9d6b031))
- modify throwToSentry error 7 ([2cc3474b](https://github.com/firstlovecenter/fl-pastoral-care/commit/2cc3474bf0af4a06bcccd8cc3fb224bc51d3a7c0))
- modify throwToSentry error 6 ([5206f457](https://github.com/firstlovecenter/fl-pastoral-care/commit/5206f4575c47ed2e6e550752639b63b07367040c))
- modify throwToSentry error 5 ([d31d27e1](https://github.com/firstlovecenter/fl-pastoral-care/commit/d31d27e14d78b4a4728f587c9e55fae6c1c36974))
- modify throwToSentry error 4 ([47af6f02](https://github.com/firstlovecenter/fl-pastoral-care/commit/47af6f0298c018e9964e33521c5661fde4c2d7da))
- modify throwToSentry error 3 ([de1574fa](https://github.com/firstlovecenter/fl-pastoral-care/commit/de1574fa87b61d83033cff84c5ac60412c43145b))
- modify throwToSentry error 2 ([e019bf37](https://github.com/firstlovecenter/fl-pastoral-care/commit/e019bf37f2261f20ae8fb40ed593d7bf42b7b98c))
- modify throwToSentry error ([d7a44944](https://github.com/firstlovecenter/fl-pastoral-care/commit/d7a4494403b69dba30aa741f1e07f4ded709a7fb))
- update errors logged to the console ([4b1ac3e2](https://github.com/firstlovecenter/fl-pastoral-care/commit/4b1ac3e2afa66e48bcc3cab479af6b7fd8abf24d))
- console.log error message from try-catch ([77fb9710](https://github.com/firstlovecenter/fl-pastoral-care/commit/77fb9710513ae42f168ee531730054e23a695b4a))
- console.error error message ([94605e1c](https://github.com/firstlovecenter/fl-pastoral-care/commit/94605e1cb90c6c25d047c200e1d7d69141c072c8))
- better handle paystack error ([1a9b8d71](https://github.com/firstlovecenter/fl-pastoral-care/commit/1a9b8d71a76b4f9f9e80f4ee0f0cb403cca98d77))
- better handle paystack error ([0cb3220c](https://github.com/firstlovecenter/fl-pastoral-care/commit/0cb3220cc96e2f91368baba5e4652b04bd875c58))
- console.error paymentResponse ([cf952b92](https://github.com/firstlovecenter/fl-pastoral-care/commit/cf952b92302d899f653f505c36fa47219f19e8de))
- remove unneeded stream_name var from confirm banking ([f8b1fde6](https://github.com/firstlovecenter/fl-pastoral-care/commit/f8b1fde61e288badd7c2a1ba29bf819c6cb352da))
- enable update of firestore database on payment function ([dd5fe694](https://github.com/firstlovecenter/fl-pastoral-care/commit/dd5fe69413e046acf43b775b8ee407e404a89483))
- return better error when there are problems with payment ([114c0303](https://github.com/firstlovecenter/fl-pastoral-care/commit/114c03030ddee5d126d8b498814582ba1ca3afda))
- rearrange table of service details ([9886c599](https://github.com/firstlovecenter/fl-pastoral-care/commit/9886c5991641c9c11dcb8a88df4b52006872418b))
- fix bug preventign some fields from showing up in offering ([a64a9f40](https://github.com/firstlovecenter/fl-pastoral-care/commit/a64a9f40dd52f55e53c653131dc049140cb81bc2))
- remove the count of cars from the bussesOnTheWay and bussesHaveArrived ([eac9cbda](https://github.com/firstlovecenter/fl-pastoral-care/commit/eac9cbdad42cc4cf372d10b1af79811984e8352d))
- update service details page ([7809458e](https://github.com/firstlovecenter/fl-pastoral-care/commit/7809458ee470e91fa145522b8ad5716f5dae4c64))
- create a new type of fellowship called online fellowship ([0ff5f3e4](https://github.com/firstlovecenter/fl-pastoral-care/commit/0ff5f3e4fa989680d78224ce9f3c3d8fda32ea75))
- fix bug causing servieRecord not to absorb online giving transactions ([edab6b18](https://github.com/firstlovecenter/fl-pastoral-care/commit/edab6b181428c014a45924d5b967293b46ff1de8))
- correct import of STREAM_COUNCIL_SEARCH ([f56999ee](https://github.com/firstlovecenter/fl-pastoral-care/commit/f56999ee7facea0f8729560e563e0b9db88fa396))

##### Other Changes

- //github.com/firstlovecenter/fl-admin-portal into deploy ([6b13ebde](https://github.com/firstlovecenter/fl-pastoral-care/commit/6b13ebdef88dfef9c551d3a68fd5575691fbc86e))

##### Refactors

- rewrite SendVehicleSupport ([a3c7b3c6](https://github.com/firstlovecenter/fl-pastoral-care/commit/a3c7b3c6199fed19dc25b077afaceee816676d6c))

### 7.7.0 (2023-06-20)

##### New Features

- implement creating of new oversights ([8258191b](https://github.com/firstlovecenter/fl-pastoral-care/commit/8258191be09cb7b1c5bf8976784aaea2ff4f0620))
- set priority property on serviceLog nodes ([51222f5c](https://github.com/firstlovecenter/fl-pastoral-care/commit/51222f5c10d117ad071db3b7a46ccb7a4b25fe5a))

##### Bug Fixes

- implement updateOversight ([065218ad](https://github.com/firstlovecenter/fl-pastoral-care/commit/065218adf7f2bdf912f14321c273be149d993aef))
- update button to show Last 4 Weeks ([28144572](https://github.com/firstlovecenter/fl-pastoral-care/commit/28144572a0fbe56e00b047c7212a2167ed6999fd))
- implement display all oversights page ([af002dc3](https://github.com/firstlovecenter/fl-pastoral-care/commit/af002dc380e94ac7fbd61e7312ad671a77dabc7b))
- implement denomination display page ([6d1e7bb3](https://github.com/firstlovecenter/fl-pastoral-care/commit/6d1e7bb3533cb88010c12ac133c9b3b4bf1b8ce3))
- implement breadcrumb that leads to denomination ([cf0a94b8](https://github.com/firstlovecenter/fl-pastoral-care/commit/cf0a94b8c0285f9f8571ca07f336200269fc9ca8))
- update banking-cypher.ts ([c9d7f4e4](https://github.com/firstlovecenter/fl-pastoral-care/commit/c9d7f4e4ee044ca3b9afc55f13b8df44e2395144))
- fix typo in creating council ([4b076346](https://github.com/firstlovecenter/fl-pastoral-care/commit/4b076346a8c264bdbaf39f0695bcf3d25869c3a7))
- update directory-crud cypher for creating churches ([df4605cc](https://github.com/firstlovecenter/fl-pastoral-care/commit/df4605cccc62521f7342ce30bac71c067a6a87ca))
- update cypher to add priority label when creating new churches ([d7197433](https://github.com/firstlovecenter/fl-pastoral-care/commit/d719743352db96c7fe8692ec3b883034b048a787))
- little updates for creating a new campus ([3b66805a](https://github.com/firstlovecenter/fl-pastoral-care/commit/3b66805aefd8e522767d7db10de01be10025ea88))
- little updates for creating a new campus ([042052e7](https://github.com/firstlovecenter/fl-pastoral-care/commit/042052e79ad4f78add7a01f18be13134924e1371))
- bring back delay on confirmation to enable time for webhook ([0e846b61](https://github.com/firstlovecenter/fl-pastoral-care/commit/0e846b610bbb091de8600a0b240eda39a6ad2cbb))
- update before-next-update-cypher ([7bcfcded](https://github.com/firstlovecenter/fl-pastoral-care/commit/7bcfcdedd228fec305d82fe5b161a7846714fc2f))
- update args in servantCypher fns ([2014d4cc](https://github.com/firstlovecenter/fl-pastoral-care/commit/2014d4cc1a3d2ed3b58d794886f6f0ade118d1ba))
- set priority number on history log node ([3ed231d7](https://github.com/firstlovecenter/fl-pastoral-care/commit/3ed231d7f6300c3c1a72e65007c153d2f948e627))
- remove delay timer on confirming payments ([29057593](https://github.com/firstlovecenter/fl-pastoral-care/commit/29057593a75e0266318210037499a19c3311b222))
- more directly relay information from paystack servers to the client ([6406b752](https://github.com/firstlovecenter/fl-pastoral-care/commit/6406b7526854a5c3424650bfbb9c3e8873876494))
- remove edge case conditions for setting transaction status failed ([ec4bc0d7](https://github.com/firstlovecenter/fl-pastoral-care/commit/ec4bc0d756fb01de123ff9d5e3f3ad6ce55ee19a))
- correct bug making constituency banking impossible ([9257fe83](https://github.com/firstlovecenter/fl-pastoral-care/commit/9257fe83b5068097fa3e39b58b4c56ab286e8e89))
- send debugging email ([1a131d22](https://github.com/firstlovecenter/fl-pastoral-care/commit/1a131d22ff414b1eea812fd49bc6128912ae919b))
- implement an error if the subaccount is empty ([aa9e8a96](https://github.com/firstlovecenter/fl-pastoral-care/commit/aa9e8a96b31d9b92e5f392cdfa05a777fec39f8b))
- remove unnecessary email sent ([d2573a64](https://github.com/firstlovecenter/fl-pastoral-care/commit/d2573a647f54d0bd1643160be9e029bfe1e28dee))
- update email sent ([e0e8233e](https://github.com/firstlovecenter/fl-pastoral-care/commit/e0e8233e483e6eb201e65a4220e986303c1499d2))
- fix bug where money was being sent to the wrong account ([d57dec07](https://github.com/firstlovecenter/fl-pastoral-care/commit/d57dec07452432e3fa94c984552f8850a9d6f5fc))
- mail axios req body to me ([dc0c7a62](https://github.com/firstlovecenter/fl-pastoral-care/commit/dc0c7a62336fdee91531b12c56efbe4a4dfd5910))
- vacation churches can now bank ([1c6a6023](https://github.com/firstlovecenter/fl-pastoral-care/commit/1c6a6023f31686653c1ae23a341af341798a5a08))
- duplicate members are completely removed as members ([83bd144f](https://github.com/firstlovecenter/fl-pastoral-care/commit/83bd144f900644ba1b11887e91b73cb7df9cba53))
- minor bug improvements to getLastServiceRecord fn ([f7d77889](https://github.com/firstlovecenter/fl-pastoral-care/commit/f7d7788921ff781ff04310866d22fd77eeb02cd4))
- only gs arrivals admins have free reign ([40783e9b](https://github.com/firstlovecenter/fl-pastoral-care/commit/40783e9b4f79e919efefa9877a29ab7cba410cff))
- allow arrivals admins to have free reign on all days of the week ([3b718824](https://github.com/firstlovecenter/fl-pastoral-care/commit/3b71882496b8b0e174aea0f74425a2fce16d38e8))
- minor fix on bussingThisWeek query ([f0d1c1b2](https://github.com/firstlovecenter/fl-pastoral-care/commit/f0d1c1b26dda354fc0b9b404e67bf5a175ebdd33))
- minor fix on bussingThisWeek query ([89ac44c3](https://github.com/firstlovecenter/fl-pastoral-care/commit/89ac44c358395aff07c477d3e2eab49a031edff2))
- allow council joint service to be filled more than once in a week ([abfa3a3b](https://github.com/firstlovecenter/fl-pastoral-care/commit/abfa3a3bf2fec7ff1f2cbb44f17f53ea85ce2f39))
- minor improvements to banking resolvers ([30389570](https://github.com/firstlovecenter/fl-pastoral-care/commit/303895704b6bd58fb6d3e35512c7eb3886640a50))
- return correct data from mutation ([2e6d07c7](https://github.com/firstlovecenter/fl-pastoral-care/commit/2e6d07c79e23508b21176fe29add50b36479bc57))

##### Other Changes

- //github.com/firstlovecenter/fl-admin-portal into deploy ([8ccc22b7](https://github.com/firstlovecenter/fl-pastoral-care/commit/8ccc22b7a81bc10ff3692193a9a4fd4486688b7d))

##### Refactors

- change the word GATHERING_SERVICE to CAMPUS ([daf8a679](https://github.com/firstlovecenter/fl-pastoral-care/commit/daf8a679349ca3b57570edf5c5379a740a2b7f07))
- move computing of priority within makeServantCypher function ([161fef40](https://github.com/firstlovecenter/fl-pastoral-care/commit/161fef40cf81586eefc09a18148885c59d8c1c96))
- change 'gathering service' to 'campus' ([07dcab7c](https://github.com/firstlovecenter/fl-pastoral-care/commit/07dcab7c5358f8c8736fa1bd9d9f22a3fdf2d8f2))
- fix some spelling mistakes causing broken file imports ([5ed685b0](https://github.com/firstlovecenter/fl-pastoral-care/commit/5ed685b0fb688ac8fa19f6875b75994220be54bf))
- fix some spelling mistakes causing broken file imports ([ca7b010b](https://github.com/firstlovecenter/fl-pastoral-care/commit/ca7b010bb82b982b322e2907eaf4ffa061d1c530))
- change gatheringservice to campus ([6eb94b5a](https://github.com/firstlovecenter/fl-pastoral-care/commit/6eb94b5a5284279ff4aba8c673c84e91d85f361d))

#### 7.6.17 (2023-06-09)

##### Bug Fixes

- remove unused import of StreamOptions ([6da6fecb](https://github.com/firstlovecenter/fl-pastoral-care/commit/6da6fecb205283058e5fd6a72cad03625ff93c42))
- prevent mutation from rewriting cache with incomplete data ([efffa3d5](https://github.com/firstlovecenter/fl-pastoral-care/commit/efffa3d569c5055d2360125cf8779a0305ec0533))
- remove duplicate running of payment webhook ([a2fcce49](https://github.com/firstlovecenter/fl-pastoral-care/commit/a2fcce49028aeeb3be34fa4ee2adb780e9b6c019))
- fix broken reference in arrivals money file ([27d333af](https://github.com/firstlovecenter/fl-pastoral-care/commit/27d333af1625c7886ce9f64cf9617e022351211b))
- if transaction occurred in the last minute, return pending ([dcb112b3](https://github.com/firstlovecenter/fl-pastoral-care/commit/dcb112b3bc154e92186d56cb9cc9d3fcc5ebab96))
- fix gs admin not being able to upload banking slip ([a5cdfa9c](https://github.com/firstlovecenter/fl-pastoral-care/commit/a5cdfa9ce557a4b1863c055147a919715a5b005b))
- update directory lock for display church details ([f40c52f5](https://github.com/firstlovecenter/fl-pastoral-care/commit/f40c52f57b3701d92e58de273574b45ac9043526))
- push the monday edit access to start after 12noon ([731aba9d](https://github.com/firstlovecenter/fl-pastoral-care/commit/731aba9da1582f884c5bd1f7b8b297dc52411087))
- add monday as a day for directory changes ([6431e649](https://github.com/firstlovecenter/fl-pastoral-care/commit/6431e64938bbfff3bf2c4f020aca15b9ca3da02c))
- correct wrongfully setting bussingThisWeek as array ([785c900f](https://github.com/firstlovecenter/fl-pastoral-care/commit/785c900f52761b8b8af32975c2f4b58aa768ca80))
- update frontend object path for bussingThisWeek ([3819a0c5](https://github.com/firstlovecenter/fl-pastoral-care/commit/3819a0c5bf3ba81bc81237a98e3d333f317d68ac))
- correct slight glitches in the arrivals calc for second busses ([09192a05](https://github.com/firstlovecenter/fl-pastoral-care/commit/09192a05921e3bb39ea58b44c896103fb6d50f01))
- remove breaking lines ([69009176](https://github.com/firstlovecenter/fl-pastoral-care/commit/69009176d0639c74abf4646f6166560552cb721b))
- add a limit to bussingThisWeek query ([d8d51f65](https://github.com/firstlovecenter/fl-pastoral-care/commit/d8d51f652d4f31115782cb4342721aed5733f06b))
- update bussingStatusQueries ([e8639c47](https://github.com/firstlovecenter/fl-pastoral-care/commit/e8639c478dfac2bdbd764a178943841672c85f33))

##### Other Changes

- 30 mins ([a3b80832](https://github.com/firstlovecenter/fl-pastoral-care/commit/a3b808321ffd10ff02c2754e1694d203d1de664b))

#### 7.6.16 (2023-06-04)

##### Documentation Changes

- update build command ([6e83a4ef](https://github.com/firstlovecenter/fl-pastoral-care/commit/6e83a4ef4b6729702334cb8bff9ef7d2e11fe496))
- write cypher to set serviceRecord.cash to income ([74d6bfdf](https://github.com/firstlovecenter/fl-pastoral-care/commit/74d6bfdf42e81404640367325b36f251ce3ae96e))
- write cypher to set serviceRecord.cash to income ([33dd296e](https://github.com/firstlovecenter/fl-pastoral-care/commit/33dd296e78ed16a299f92c9d34bc3cf663b8fd9c))

##### New Features

- implement showing number of services in bar graph ([0cf0fdf5](https://github.com/firstlovecenter/fl-pastoral-care/commit/0cf0fdf5e249fac52425b6b20593cacafdc49b33))
- log out the env vars ([72f451f8](https://github.com/firstlovecenter/fl-pastoral-care/commit/72f451f8282f4ec2cb06dd8c78820fcd29a3c3a3))
- implement doppler staging environment ([170b84ca](https://github.com/firstlovecenter/fl-pastoral-care/commit/170b84cac3c1207bd56f9b005d60b83f7aaa3440))

##### Bug Fixes

- removed non null on numberOfServices ([5264bfda](https://github.com/firstlovecenter/fl-pastoral-care/commit/5264bfdaab7d8bf7bd2bb651c3593ce0a8374e4b))
- implement numberOfServices on all churchlevels ([1f194bca](https://github.com/firstlovecenter/fl-pastoral-care/commit/1f194bcac2d98131ea1eefb0fe3d6eab4b78f889))
- bug where past bussing data wasnt being returned ([4462ba69](https://github.com/firstlovecenter/fl-pastoral-care/commit/4462ba692ccdb48c99ffef95086bddaa8cc7ff9b))
- improve self banking user flow ([68d6fb5d](https://github.com/firstlovecenter/fl-pastoral-care/commit/68d6fb5d6e37bd947cfebe43ff5d4f4baa88bb21))
- only oversight admin can confirm offering ([bd3e0958](https://github.com/firstlovecenter/fl-pastoral-care/commit/bd3e0958de2c3a273ec8951055221135425e17a5))
- load the home page on error ([61fa5108](https://github.com/firstlovecenter/fl-pastoral-care/commit/61fa510807920e876fd35a81d5edc7b3f2d20e4b))
- change secrets to secrets.ts ([ebd95d71](https://github.com/firstlovecenter/fl-pastoral-care/commit/ebd95d715dcaecacdd900b9d60eba6b27aa75210))
- fix bug preventing doppler usage when in dev on localhost ([20657497](https://github.com/firstlovecenter/fl-pastoral-care/commit/206574971b668402873ca03e49c2a8c56f3355e5))
- delete app.json file from root ([a7a8cfa7](https://github.com/firstlovecenter/fl-pastoral-care/commit/a7a8cfa7cb0208f04c2e2157cf0464e38154e0cb))
- update netlify.toml build prod ([2103e74f](https://github.com/firstlovecenter/fl-pastoral-care/commit/2103e74f00411cbab2ac6a26fc7f6aeb259826d4))
- setup doppler config ([d314d729](https://github.com/firstlovecenter/fl-pastoral-care/commit/d314d729eadab4a7e6cf0f260e2991b1657c9d6c))
- delete howYouJoined as an option in createMember form ([f5a540b3](https://github.com/firstlovecenter/fl-pastoral-care/commit/f5a540b3cd6413e33f2276f46b38127bb3260b17))
- update DashboardQueries.ts ([f0c0afef](https://github.com/firstlovecenter/fl-pastoral-care/commit/f0c0afef6b17c8b41bc8fe9763b5910044f29f5e))
- revert to original setting ([893a9295](https://github.com/firstlovecenter/fl-pastoral-care/commit/893a92957691f56e5bda68657fefe333ef940efa))
- update netlify.toml build scripts ([06f9c3cf](https://github.com/firstlovecenter/fl-pastoral-care/commit/06f9c3cfead904a5a5e947332bd82fbc7a62b387))
- log env vars in vite.config.ts ([1c030122](https://github.com/firstlovecenter/fl-pastoral-care/commit/1c0301229240ee54d62d6e12e21b5bb204ebf5c1))
- log process.env to the command line ([8cc5c007](https://github.com/firstlovecenter/fl-pastoral-care/commit/8cc5c0076fcdfd501d1729e55c76bf1c31aa2841))
- attempt populateEnv in web-react-ts ([792632bb](https://github.com/firstlovecenter/fl-pastoral-care/commit/792632bbb946a4923f85447ba5e9c21e3acc18ae))
- get SENTRY_AUTH_TOKEN from process.env ([7881deaa](https://github.com/firstlovecenter/fl-pastoral-care/commit/7881deaa1ec75e3f6199476944af0243e588493e))
- log out loaded Secrets ([b703be27](https://github.com/firstlovecenter/fl-pastoral-care/commit/b703be2748ee15d6dcf472addfe8e1d2b0cd5219))
- inject secrets as env variables 2 ([72fb6e07](https://github.com/firstlovecenter/fl-pastoral-care/commit/72fb6e07b0cc24c3a0c0124da288a873ec083ff8))
- inject secrets as env variables ([937c3d5e](https://github.com/firstlovecenter/fl-pastoral-care/commit/937c3d5e46fd8c4bef8e27f5984105d8ce4122f4))
- update with encrypt-secrets ([d39d2196](https://github.com/firstlovecenter/fl-pastoral-care/commit/d39d21962b864bc83823eb09d4bcf7427bb2cd45))
- update currency options for sierra leone ([936f098b](https://github.com/firstlovecenter/fl-pastoral-care/commit/936f098b295d0e65330b16443bb88b6c61fa55da))
- update create stream with bankAccount ([cff9c1b9](https://github.com/firstlovecenter/fl-pastoral-care/commit/cff9c1b9c4c49a92707c49e14dd8bf27cca4fc57))
- remove firebase config from payemnt.js ([de63ae26](https://github.com/firstlovecenter/fl-pastoral-care/commit/de63ae263f30f997021372265fcf1cbe499cb6a3))
- delete doppler.yaml ([ecadad01](https://github.com/firstlovecenter/fl-pastoral-care/commit/ecadad015e3caccd1d0c9c1bd7439d9f7570f1d2))
- update doppler commands for building ([7782faa3](https://github.com/firstlovecenter/fl-pastoral-care/commit/7782faa34734f63ee05556f4196430c6278e1b93))
- delete doppler.yaml ([24ef44c3](https://github.com/firstlovecenter/fl-pastoral-care/commit/24ef44c32b1feec63343ae0a82458ea5c1f5bea3))
- update build.js ([09b64c7c](https://github.com/firstlovecenter/fl-pastoral-care/commit/09b64c7cd7f3cdb8891dd035707e81a8a6f84937))
- update doppler.yaml 4 ([a4bfb890](https://github.com/firstlovecenter/fl-pastoral-care/commit/a4bfb8900c6467fda24dd1d28aa554d39fdf379a))
- update doppler.yaml 3 ([f8b5781e](https://github.com/firstlovecenter/fl-pastoral-care/commit/f8b5781e5c22079a52a3689b056635aee5a87601))
- update doppler.yaml 2 ([2592ff95](https://github.com/firstlovecenter/fl-pastoral-care/commit/2592ff956a4cb1a7ed749fb7fb92010910c61133))
- update doppler.yaml ([5f7d4273](https://github.com/firstlovecenter/fl-pastoral-care/commit/5f7d42730b1fecfad2dda86efe17f7129fb467d3))
- udpate build command ([d091fee7](https://github.com/firstlovecenter/fl-pastoral-care/commit/d091fee75b207811a248a167e6f4f87da5f2f1ce))
- update netlify build command ([ea88adbd](https://github.com/firstlovecenter/fl-pastoral-care/commit/ea88adbd5de455fdc9c603259a91eee1cc76ffc6))
- udpate payment function ([54eec8c6](https://github.com/firstlovecenter/fl-pastoral-care/commit/54eec8c609064f9ae417e50c6793dc63104c87a8))
- install firebase-admin for api package.json ([b975bee1](https://github.com/firstlovecenter/fl-pastoral-care/commit/b975bee13dfad7a1f4161e77b6351d20a390c204))
- add property cash to type ServiceRecord ([855e1361](https://github.com/firstlovecenter/fl-pastoral-care/commit/855e13617aa96be4314d0cee7b16b7b483acc34f))
- implement payment webhook function for firebase transactions ([5418dfb6](https://github.com/firstlovecenter/fl-pastoral-care/commit/5418dfb64ee8def8da6871e5051a8e54fe68c4a0))
- filling service form absorbs all hanging transactions ([79f2ce6d](https://github.com/firstlovecenter/fl-pastoral-care/commit/79f2ce6d8d2f39f9e949f531c60396d866620245))

##### Other Changes

- //github.com/firstlovecenter/fl-admin-portal into deploy ([40eb25c3](https://github.com/firstlovecenter/fl-pastoral-care/commit/40eb25c371cfec0183807a580e96f669d39be371))

#### 7.6.15 (2023-05-23)

##### Bug Fixes

- implement dynamic selection of bank accounts per stream ([910f2561](https://github.com/firstlovecenter/fl-pastoral-care/commit/910f2561b1ddaeee9945511cd88a36f48aee9838))

#### 7.6.14 (2023-05-23)

##### Bug Fixes

- prevent double form filling in a week for all levels except oversight and denomination ([3bb50f93](https://github.com/firstlovecenter/fl-pastoral-care/commit/3bb50f9321de7e8e02bc19a0fd5c545ece8ce520))
- prevent double form filling in a week for all levels ([fb3f18c1](https://github.com/firstlovecenter/fl-pastoral-care/commit/fb3f18c195487ade96171f4437aff009f1540e78))
- add adminDenomination to permit Admin ([ea52768b](https://github.com/firstlovecenter/fl-pastoral-care/commit/ea52768bd05283fdb070be1df5476a26a7f1723c))

#### 7.6.13 (2023-05-21)

##### New Features

- add title to many places of the app ([039404cf](https://github.com/firstlovecenter/fl-pastoral-care/commit/039404cf8262644f775cd6d996cc928155f2b712))

##### Bug Fixes

- update nameWithTitle on bussingStatus Queries ([e86deec4](https://github.com/firstlovecenter/fl-pastoral-care/commit/e86deec450414c6919201a6345bbaad5f8c958f6))
- add auth rules to updating member title ([731ec1a4](https://github.com/firstlovecenter/fl-pastoral-care/commit/731ec1a40bb96706598797167280ec183c3e02e0))
- udpate the cypher to close councils ([9226e5a0](https://github.com/firstlovecenter/fl-pastoral-care/commit/9226e5a04d614c1907f1ffe083aea045a64b95fa))
- add navigation to the confirm payment button ([7b1fc849](https://github.com/firstlovecenter/fl-pastoral-care/commit/7b1fc8491bf03ea003657dd8ba6fb11a2d20eb3d))
- fix bug not allowing member title filters ([d64c2d50](https://github.com/firstlovecenter/fl-pastoral-care/commit/d64c2d50ae7629cf6d82e1065afd494d74dbb211))
- add name to member title form ([1fcb65a9](https://github.com/firstlovecenter/fl-pastoral-care/commit/1fcb65a9d530470262f0a3838f9cabf1f3ab7185))
- update member deletion options ([fc6afdd9](https://github.com/firstlovecenter/fl-pastoral-care/commit/fc6afdd9e60b52b8c787aac619a1254cabd97045))

#### 7.6.12 (2023-05-17)

##### Bug Fixes

- improvements to the nameWithTitle property ([e870caa5](https://github.com/firstlovecenter/fl-pastoral-care/commit/e870caa5108212ab27d29b9323ffd7ffc78060e3))
- update member title form ([1eebea47](https://github.com/firstlovecenter/fl-pastoral-care/commit/1eebea47973667832717d0a2d1a0f29e393351bd))
- implement form for updating member titles ([3101b3e6](https://github.com/firstlovecenter/fl-pastoral-care/commit/3101b3e6b1250be761fccbad211249372d4473dc))
- ts-nocheck on \_fields in equipment resolvers ([8162cd83](https://github.com/firstlovecenter/fl-pastoral-care/commit/8162cd830621592d50e286f3e69c8649aadab51b))
- fix bug with council service aggregations ([aaa94ba8](https://github.com/firstlovecenter/fl-pastoral-care/commit/aaa94ba80a52a88b61b4dbb4afff009e5f6282e9))
- solves admin-584 ([f3725211](https://github.com/firstlovecenter/fl-pastoral-care/commit/f37252114646489528bb095b08ea7c8f7de4e0ce))
- admin-576 solves breaking of ServiceDetails Page ([0c87789f](https://github.com/firstlovecenter/fl-pastoral-care/commit/0c87789f256c51f66a02e685c2f3f39a9c024d12))
- admin-571 if no currentUser navigate to /arrivals ([28a30552](https://github.com/firstlovecenter/fl-pastoral-care/commit/28a305528c545d8d8395902fc9323c81e5876591))
- admin-571 fixed bug breaking the page ([9507221c](https://github.com/firstlovecenter/fl-pastoral-care/commit/9507221cc8ecdc07ec833dd79f904a54e2d6ed81))
- prevent error when there is no .stream_name on ServicesMenu ([e4e56ed3](https://github.com/firstlovecenter/fl-pastoral-care/commit/e4e56ed3d51b8b8ff246e378b94b105145915057))

##### Refactors

- minor improvemens and migrations to updated session config ([6078b494](https://github.com/firstlovecenter/fl-pastoral-care/commit/6078b49471d5a60860b3dbc198061c3d2aced64a))
- change session.run to updated session.executeRead/Write ([fe4d774d](https://github.com/firstlovecenter/fl-pastoral-care/commit/fe4d774d80bd4a9318b914d0e48f99d04886a380))

#### 7.6.11 (2023-05-12)

##### Bug Fixes

- add friday as stream service day option ([61f5aea7](https://github.com/firstlovecenter/fl-pastoral-care/commit/61f5aea753671cae67a383f40ffbcd9540ae1a87))
- udpate currency options list with full names ([2e7d59a6](https://github.com/firstlovecenter/fl-pastoral-care/commit/2e7d59a6729f4e01db1d04ddc55c7ba5cafebe70))

#### 7.6.10 (2023-05-12)

##### Documentation Changes

- update CHANGELOG.md ([06e16854](https://github.com/firstlovecenter/fl-pastoral-care/commit/06e1685430df843bb23370c5ead6d88b8f21bbe5))
- update CHANGELOG.md ([f8ed353c](https://github.com/firstlovecenter/fl-pastoral-care/commit/f8ed353cf2e1a07a0828c98153b206c9cab3d546))

##### Bug Fixes

- udpate currency options list ([93da3048](https://github.com/firstlovecenter/fl-pastoral-care/commit/93da3048678d73a2e5945ed74303473f20822a61))
- update member deletion history log text ([0687e451](https://github.com/firstlovecenter/fl-pastoral-care/commit/0687e451722b05087898f18448a94aba67464494))
- exchange double quotes for single quotes ([bcc2f284](https://github.com/firstlovecenter/fl-pastoral-care/commit/bcc2f2842b11587133c6dc05026839b1d0fd1b94))
- update delete member category options ([0d673c64](https://github.com/firstlovecenter/fl-pastoral-care/commit/0d673c64844b069f316d3e6fcf0c19718111495e))
- update member deletion history log text ([36d32ed9](https://github.com/firstlovecenter/fl-pastoral-care/commit/36d32ed9c120efa0b6fa4494c8eb3dcca2bc7a79))
- update cloudinary uplaodgs ([da4535db](https://github.com/firstlovecenter/fl-pastoral-care/commit/da4535db06fe30044d2121e2f22e269d73f40b4c))
- subfolder cloudinary uploads ([f23f1be5](https://github.com/firstlovecenter/fl-pastoral-care/commit/f23f1be5369620df0a2ed309bdbb83be4c75007e))
- update arrivalsQueries and bussingStatusQueries with arrivalDate ([80cb93e6](https://github.com/firstlovecenter/fl-pastoral-care/commit/80cb93e6f5dfc964e826545eb636cb121b13e966))
- remove whitespace ([d8942ed5](https://github.com/firstlovecenter/fl-pastoral-care/commit/d8942ed50d10900b47fd5b4ebe7a11ab4c04cc1b))
- fix number of bacentas on ChurchBySubChurch pages ([6ea55bbe](https://github.com/firstlovecenter/fl-pastoral-care/commit/6ea55bbe1f797887abf7e6c769e6ef73383333a6))

##### Refactors

- include whitespace ([2b576cb0](https://github.com/firstlovecenter/fl-pastoral-care/commit/2b576cb0a3d29f25175ecb6b7444153c5bc7e1d8))

#### 7.6.9 (2023-05-09)

#### 7.6.8 (2023-05-09)

#### 7.6.7 (2023-05-09)

##### New Features

- implement a button to navigate to location in google maps ([0b07bb5c](https://github.com/firstlovecenter/fl-pastoral-care/commit/0b07bb5cb5f4deaac60e3446df9d420a2886231b))
- admin-572 implement arrivals history ([b657856f](https://github.com/firstlovecenter/fl-pastoral-care/commit/b657856fc330175e181417661ed2b2961713bc33))

##### Bug Fixes

- minor improvements to arrivals dashboards ([e0022f13](https://github.com/firstlovecenter/fl-pastoral-care/commit/e0022f139b557f1e6b4caf1545d6176818df988e))
- reorder howYouJoined options ([0ab6f2e0](https://github.com/firstlovecenter/fl-pastoral-care/commit/0ab6f2e0aeec123685f3a9b78c9552a3d3fa72da))
- change howYouJoined option to 'Service With A Pastor' ([99351e9f](https://github.com/firstlovecenter/fl-pastoral-care/commit/99351e9ffd9de4e2cc0cc4bc3afca4c7185a43b0))
- fix bug preventing arrivals data from being displayed when date is changed ([eb7176c5](https://github.com/firstlovecenter/fl-pastoral-care/commit/eb7176c531eb8bf38ea2970889d2e5c700cea585))
- clear easy debugging scripts ([cf4f09c8](https://github.com/firstlovecenter/fl-pastoral-care/commit/cf4f09c857abb064a077e8cf0c14812d2dd11fcb))
- extend date filter to arrivals payment queries ([#429](https://github.com/firstlovecenter/fl-pastoral-care/pull/429)) ([92d036a2](https://github.com/firstlovecenter/fl-pastoral-care/commit/92d036a21d8cbf21e0e8728d2071baebad6e1b3a))
- implement arrivals history ([#428](https://github.com/firstlovecenter/fl-pastoral-care/pull/428)) ([5755f732](https://github.com/firstlovecenter/fl-pastoral-care/commit/5755f7326b7f083f8c935798588148f3c0ce7472))
- fix bug breaking the build ([2428e9f4](https://github.com/firstlovecenter/fl-pastoral-care/commit/2428e9f4195f8147c581e6173348719c1c7547c2))

#### 7.6.6 (2023-05-07)

##### New Features

- implement more description for venue map icons ([abbdebf1](https://github.com/firstlovecenter/fl-pastoral-care/commit/abbdebf1503315579857b9bae3a3350fcc7eae51))
- implement more description for fellowship map icons ([7479c7bd](https://github.com/firstlovecenter/fl-pastoral-care/commit/7479c7bdd40415ec9a6430bc18befd6a4969282a))

##### Bug Fixes

- implement better more descriptive map info window ([b75f3aea](https://github.com/firstlovecenter/fl-pastoral-care/commit/b75f3aea6446546181e9076531a538d22ab8d71d))
- update 'invitation by friend' to 'invitation by friend or family' ([e07293f0](https://github.com/firstlovecenter/fl-pastoral-care/commit/e07293f0d9fcd4f81886dbd44b209b81f2d483a7))

#### 7.6.5 (2023-05-05)

##### Bug Fixes

- update reasonCategory for deleting members ([fc9298f4](https://github.com/firstlovecenter/fl-pastoral-care/commit/fc9298f46dab516c48f8cb322bf750699ad5da48))
- add GMD as a currency option ([ae86736b](https://github.com/firstlovecenter/fl-pastoral-care/commit/ae86736b7c580fbc16324a57a4bf04bc24e4cefa))
- add permissions for all leaders to see campaign screens ([c3761303](https://github.com/firstlovecenter/fl-pastoral-care/commit/c3761303a23a58740c43e200fd04513c41293dc7))

#### 7.6.4 (2023-05-04)

##### Bug Fixes

- add permission for council multiplication ([6b99ab44](https://github.com/firstlovecenter/fl-pastoral-care/commit/6b99ab44d87876734c578bcdf260a06cb9d97a14))
- change visitationLocation to visitationArea ([8659278f](https://github.com/firstlovecenter/fl-pastoral-care/commit/8659278f0183349d792abc94b784552e1044bfec))
- change idlLocation to visitationLocation ([31ce27c4](https://github.com/firstlovecenter/fl-pastoral-care/commit/31ce27c45b375a7169af34280c864aa8e451136f))

#### 7.6.3 (2023-05-03)

##### Bug Fixes

- log all apollo errors to the console as well for sentry ([6dca7b8f](https://github.com/firstlovecenter/fl-pastoral-care/commit/6dca7b8f127374430c3e11818f36d4fd67e78f3f))
- update label in gs form ([1dd4d037](https://github.com/firstlovecenter/fl-pastoral-care/commit/1dd4d03769a107e094b1826d421745aabfea824f))
- add ariary to currency options ([beb204c0](https://github.com/firstlovecenter/fl-pastoral-care/commit/beb204c03996bcb273f63952e031c518d3ae5e78))
- update code of the day to include new values ([66bbe6a5](https://github.com/firstlovecenter/fl-pastoral-care/commit/66bbe6a570b216ae4bf5f210d5c456162706a51b))

#### 7.6.2 (2023-04-30)

##### New Features

- implement switching currencies when selecting any church in the church list ([cb796cfa](https://github.com/firstlovecenter/fl-pastoral-care/commit/cb796cfa7e540f1e2696f7490f8108605999620a))

##### Bug Fixes

- implement npmrc with gh package manager ([d9029b88](https://github.com/firstlovecenter/fl-pastoral-care/commit/d9029b888aa0d3238279942e47011efd834c0a5d))
- fix calculateVehicleTopUp ([0c113c90](https://github.com/firstlovecenter/fl-pastoral-care/commit/0c113c90f1bfc7053ae00ee82d9e1064838489fd))

#### 7.6.1 (2023-04-29)

##### New Features

- implement graphs for oversight level ([ca29a03e](https://github.com/firstlovecenter/fl-pastoral-care/commit/ca29a03e261d2ee7bd33dcf867959424b49287fe))

##### Bug Fixes

- revert to apollo-server-lambda ([c1022188](https://github.com/firstlovecenter/fl-pastoral-care/commit/c102218826c535abae5af394688545664acc1667))
- correct exports of gql handler ([2499b07f](https://github.com/firstlovecenter/fl-pastoral-care/commit/2499b07fbfe89a20097323615f476034427aa477))
- return graphqlHandler() ([224ff932](https://github.com/firstlovecenter/fl-pastoral-care/commit/224ff932d2ca0b6a73e6b292fe74bf88bcb7d2d6))
- revert back to apollo client ([017253a0](https://github.com/firstlovecenter/fl-pastoral-care/commit/017253a0b71ae45bc0eec641c861cd72c2820567))
- update apollo/client package ([7f1fcbee](https://github.com/firstlovecenter/fl-pastoral-care/commit/7f1fcbeec68e0e497062cfd87a1aa6250f0ab82a))
- switch to apollo-server-lambda ([238d291d](https://github.com/firstlovecenter/fl-pastoral-care/commit/238d291dc1414508be9b015c795ea390b1907896))
- switch to apollo-server-lambda ([321569db](https://github.com/firstlovecenter/fl-pastoral-care/commit/321569dbc6c897b79d0847e6b90ed5670d2c16bb))
- export graphqlHandler function ([835894cd](https://github.com/firstlovecenter/fl-pastoral-care/commit/835894cd164e26a523c665207ae7b95a47d68054))
- correct export of graphqlHandler ([9de5f280](https://github.com/firstlovecenter/fl-pastoral-care/commit/9de5f2800b8347261861f4e6d842bf2c3114d51c))
- update apollo server lambda v4 config ([#426](https://github.com/firstlovecenter/fl-pastoral-care/pull/426)) ([7394f3d6](https://github.com/firstlovecenter/fl-pastoral-care/commit/7394f3d6c25baf9879683781bad073cd441de8d8))
- refactor context function ([04f6d28f](https://github.com/firstlovecenter/fl-pastoral-care/commit/04f6d28f02a2450bea66ccbd6e3ad45d9e57563b))
- console.log event object ([a88d123c](https://github.com/firstlovecenter/fl-pastoral-care/commit/a88d123cf4e2dd63875f4a80e344897408b61d4d))
- pass context in graphql js ([d04428ef](https://github.com/firstlovecenter/fl-pastoral-care/commit/d04428ef0222fa81263fcf82a50ca4f104cf1c26))

### 7.6.0 (2023-04-28)

##### Chores

- delete comments in graphql.js ([5f6aa3fe](https://github.com/firstlovecenter/fl-pastoral-care/commit/5f6aa3fede8fe192da5f955ee0c111d38194d50c))
- retrieve accidentally deleted multiplication folder ([3db5cec8](https://github.com/firstlovecenter/fl-pastoral-care/commit/3db5cec8cae0d0bd0191f84cfc37aa880b7e7b69))
- update graphql config ([979fe8b2](https://github.com/firstlovecenter/fl-pastoral-care/commit/979fe8b2f61bdcd9a3c5774460a6fd1d48f28dcf))
- update graphql config ([ef77a56a](https://github.com/firstlovecenter/fl-pastoral-care/commit/ef77a56abd0fea1b3716d18903f948c258280c64))
- fix merge conflicts ([f561dc1b](https://github.com/firstlovecenter/fl-pastoral-care/commit/f561dc1b5b0e1208dd087e6eedddd28133b65b04))
- edit index.js ([5e598208](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e598208f03d93b5ef586b380f3185c31b6fcfc2))
- update neo4j/graph auth plugin ([e2b21895](https://github.com/firstlovecenter/fl-pastoral-care/commit/e2b2189566fc6ca9ddb313359d5290c9a003d6d2))
- update apollo server to v4 ([ee4a786f](https://github.com/firstlovecenter/fl-pastoral-care/commit/ee4a786f6dfbcc8990e0dfe28e4279456b8b4a18))
- update packages in graphql function ([eb2ec9eb](https://github.com/firstlovecenter/fl-pastoral-care/commit/eb2ec9ebae4eadc6b832ddf20f13814768f1214b))

##### Documentation Changes

- update CHANGELOG.md ([4c8595e3](https://github.com/firstlovecenter/fl-pastoral-care/commit/4c8595e30f1574ae491bc9207cbb928bc1d9de4e))
- update CHANGELOG.md ([bdf0f26a](https://github.com/firstlovecenter/fl-pastoral-care/commit/bdf0f26a05ef1615a90517d13962a8894b8692ef))

##### New Features

- implement currency switching on clicking campus card ([35a3419f](https://github.com/firstlovecenter/fl-pastoral-care/commit/35a3419f8564ef25ab52ed86d6443349e83eff92))

##### Bug Fixes

- install dep aws-integration in root folder ([ee0f91c2](https://github.com/firstlovecenter/fl-pastoral-care/commit/ee0f91c243599016d33adb29649903c0cbecd17c))
- update packages intending to clear cache and deploy ([33bf9e6b](https://github.com/firstlovecenter/fl-pastoral-care/commit/33bf9e6bcb66ea763cf2edaf24f6e9ffdd65e1f3))
- revert to apollo-server-lambda ([0cb09690](https://github.com/firstlovecenter/fl-pastoral-care/commit/0cb0969017f33d5e121dc28ce393f00ff9c445d2))
- update neo4j-driver ([fae37fc3](https://github.com/firstlovecenter/fl-pastoral-care/commit/fae37fc3700c5052bf97f0aa356e672e803c1cca))
- install graphql package ([101c267e](https://github.com/firstlovecenter/fl-pastoral-care/commit/101c267ef6945f0d6c72db5ca3303dc8ac2d5f7a))
- reinstall npm packages in graphql function ([a3e67208](https://github.com/firstlovecenter/fl-pastoral-care/commit/a3e6720874c50b487e3a58124e3770172260b05d))
- update packages ([df669b0d](https://github.com/firstlovecenter/fl-pastoral-care/commit/df669b0d7a990ee532fb6d037456275391990cd9))
- update packages ([8bc9e371](https://github.com/firstlovecenter/fl-pastoral-care/commit/8bc9e371f00a4c108e4f438ebc8ac0935a5db94b))
- update packages ([513d3458](https://github.com/firstlovecenter/fl-pastoral-care/commit/513d3458c8f867d15f5b4726a1e5db047e2d690f))
- fix stray bugs in arrivals payments flow ([da591bf6](https://github.com/firstlovecenter/fl-pastoral-care/commit/da591bf6e2940a196067d7fa3da809d20d4e2c79))

#### 7.5.14 (2023-04-27)

#### 7.5.13 (2023-04-27)

##### Documentation Changes

- update CHANGELOG.md ([a17b8998](https://github.com/firstlovecenter/fl-pastoral-care/commit/a17b89987a40b43e8e0905818033b978b7bc5f69))
- update CHANGELOG.md ([a32de772](https://github.com/firstlovecenter/fl-pastoral-care/commit/a32de7721e032f0b0a5b72556a16864ba04555e5))

##### New Features

- implement currency switching on clicking campus card ([721546b1](https://github.com/firstlovecenter/fl-pastoral-care/commit/721546b1225162ebca873b28e5c512fe29deda96))
- update history limit property ([7cb49931](https://github.com/firstlovecenter/fl-pastoral-care/commit/7cb49931498b9452129268e10c1003da89d4d1d6))
- admin-561 create separate history page ([33974fc7](https://github.com/firstlovecenter/fl-pastoral-care/commit/33974fc78ec25de057af7e408e3f8d42def7e4da))
- admin-561 create separate history page ([fe888719](https://github.com/firstlovecenter/fl-pastoral-care/commit/fe8887195c4ec87704c62078a37eaa2ee6a642a6))
- admin-561 create history pages for various church levels ([01983906](https://github.com/firstlovecenter/fl-pastoral-care/commit/019839062e0b0a5ed1547719b1db26f2e7d5f261))

##### Bug Fixes

- update packages ([24c231cd](https://github.com/firstlovecenter/fl-pastoral-care/commit/24c231cda61cc63483c7cd0efcb48dadc6e75554))
- update packages ([f227be13](https://github.com/firstlovecenter/fl-pastoral-care/commit/f227be13ac4bb102f9fbe46491f33221934d8b19))
- fix stray bugs in arrivals payments flow ([fe98279c](https://github.com/firstlovecenter/fl-pastoral-care/commit/fe98279c9c54a6a3d628fe71e58b0a84d2b7cfd4))
- update package.json with latest workinng settings ([af24bf76](https://github.com/firstlovecenter/fl-pastoral-care/commit/af24bf76d7b1010a14ff00bb6102755daeaff411))
- without choosing a fellowship from the dropdown, you cannot create a member ([bb650b2e](https://github.com/firstlovecenter/fl-pastoral-care/commit/bb650b2ed410595811e32fceab3816b0fb85a5cd))

#### 7.5.12 (2023-04-26)

##### Bug Fixes

- update packages ([8bc9e371](https://github.com/firstlovecenter/fl-pastoral-care/commit/8bc9e371f00a4c108e4f438ebc8ac0935a5db94b))
- update packages ([513d3458](https://github.com/firstlovecenter/fl-pastoral-care/commit/513d3458c8f867d15f5b4726a1e5db047e2d690f))

#### 7.5.11 (2023-04-26)

##### New Features

- implement currency switching on clicking campus card ([35a3419f](https://github.com/firstlovecenter/fl-pastoral-care/commit/35a3419f8564ef25ab52ed86d6443349e83eff92))
- update history limit property ([7cb49931](https://github.com/firstlovecenter/fl-pastoral-care/commit/7cb49931498b9452129268e10c1003da89d4d1d6))
- admin-561 create separate history page ([33974fc7](https://github.com/firstlovecenter/fl-pastoral-care/commit/33974fc78ec25de057af7e408e3f8d42def7e4da))
- admin-561 create separate history page ([fe888719](https://github.com/firstlovecenter/fl-pastoral-care/commit/fe8887195c4ec87704c62078a37eaa2ee6a642a6))
- admin-561 create history pages for various church levels ([01983906](https://github.com/firstlovecenter/fl-pastoral-care/commit/019839062e0b0a5ed1547719b1db26f2e7d5f261))

##### Bug Fixes

- fix stray bugs in arrivals payments flow ([da591bf6](https://github.com/firstlovecenter/fl-pastoral-care/commit/da591bf6e2940a196067d7fa3da809d20d4e2c79))
- without choosing a fellowship from the dropdown, you cannot create a member ([bb650b2e](https://github.com/firstlovecenter/fl-pastoral-care/commit/bb650b2ed410595811e32fceab3816b0fb85a5cd))

#### 7.5.10 (2023-04-23)

##### Continuous Integration

- configure sentry to upload source maps with vite in react ([52b13395](https://github.com/firstlovecenter/fl-pastoral-care/commit/52b13395ac800748dd73fea1eb520a539ade4622))

##### Documentation Changes

- update readme for project scripts ([af1ab5c0](https://github.com/firstlovecenter/fl-pastoral-care/commit/af1ab5c05342f7c3a382692a332205ef578bfd12))

##### Bug Fixes

- return stream name for anagkazo patch ([9110b968](https://github.com/firstlovecenter/fl-pastoral-care/commit/9110b96873901148a238878858b8971c64af696c))
- update member howYouJoined options ([12322528](https://github.com/firstlovecenter/fl-pastoral-care/commit/123225285e3089928756f52e799def48a2863df4))
- prevent aggregateServiceWithDollar graph bars from being clicked ([aeea9848](https://github.com/firstlovecenter/fl-pastoral-care/commit/aeea9848e343fc3aabee66ab0080d9976f3f7edf))
- fix error writing dollar income ([a8427866](https://github.com/firstlovecenter/fl-pastoral-care/commit/a8427866c9c8dfe86c07ec67a3bb1ceaac8d2fa9))
- implement graph on campus level to show dollars ([f0ed20a9](https://github.com/firstlovecenter/fl-pastoral-care/commit/f0ed20a910a98feacf55cc1f2329941f1f08d0b0))
- aggregate dollar income on all church levels ([71c611ea](https://github.com/firstlovecenter/fl-pastoral-care/commit/71c611ea7f411037cee0dfaf257c14683e57aeb3))

#### 7.5.9 (2023-04-22)

##### Bug Fixes

- version bump ([c0fc09a6](https://github.com/firstlovecenter/fl-pastoral-care/commit/c0fc09a60f0a7af693c9cec3dffb7853030d0f01))

#### 6.6.7 (2023-04-22)

##### Bug Fixes

- update release scripts ([c747aaa7](https://github.com/firstlovecenter/fl-pastoral-care/commit/c747aaa7d63af707cccdb6b02994cf3bdcbda30e))

#### 6.6.6 (2023-04-22)

##### Bug Fixes

- fix broken test file ([74c31059](https://github.com/firstlovecenter/fl-pastoral-care/commit/74c3105942dd5a396de7e36ac4f60173c6b04ba5))

#### 6.6.5 (2023-04-22)

##### Bug Fixes

- fix breaking change in vehicle change ([677478a0](https://github.com/firstlovecenter/fl-pastoral-care/commit/677478a0ecf4ca6319d0160426b078a07deafa57))
- implement dollar income calculation on filling service form ([fb7d5798](https://github.com/firstlovecenter/fl-pastoral-care/commit/fb7d579830fb6ff96c8e3e49a524c5f32873c90e))
- change static ghs value to currentUser.currency ([5e91ce9a](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e91ce9ac6f96f0e41a89e9ebee78a5e5efbcdfb))
- update easy debugging script ([02ca122e](https://github.com/firstlovecenter/fl-pastoral-care/commit/02ca122e740828ba61d88006ca01eefa48d5ee02))

#### 6.6.4 (2023-04-22)

##### Bug Fixes

- fix stream meetingDay dayNumber ([2a3b62c0](https://github.com/firstlovecenter/fl-pastoral-care/commit/2a3b62c0aa085dee9e14aed282de5825021639c4))
- implement update option on edit profile form ([8e1ba5c2](https://github.com/firstlovecenter/fl-pastoral-care/commit/8e1ba5c23889512554e91d135d89a7e96f0965ce))

#### 6.6.3 (2023-04-21)

##### New Features

- add howYouJoined property on user profile page ([99be4477](https://github.com/firstlovecenter/fl-pastoral-care/commit/99be4477ff33356ec586f0532cdd6099776fb081))

#### 6.6.2 (2023-04-21)

##### New Features

- add option born into the church for howYouJoined ([007ed6ac](https://github.com/firstlovecenter/fl-pastoral-care/commit/007ed6ace073de09beb0e1f0ec5ce5337549ca67))
- implement a section in the form for how you joined the church for new registration ([07c7b540](https://github.com/firstlovecenter/fl-pastoral-care/commit/07c7b540547f073887c6869d9cf472fd3987eb3e))

##### Bug Fixes

- update the title of campus members page ([da0878bb](https://github.com/firstlovecenter/fl-pastoral-care/commit/da0878bb6b06a21b268cc4aaa8864ebbcc9588c0))

#### 6.6.1 (2023-04-20)

##### Bug Fixes

- add denomination to roles in dashboard utils ([6041f908](https://github.com/firstlovecenter/fl-pastoral-care/commit/6041f908463848fe2111163e040e2d3c1c821e1c))

### 6.6.0 (2023-04-20)

##### New Features

- implement search for oversight role ([96af0f15](https://github.com/firstlovecenter/fl-pastoral-care/commit/96af0f159b3a00c423bbf9e8e8a1d253219c2198))
- implement select stream meeting day in form ([e918140d](https://github.com/firstlovecenter/fl-pastoral-care/commit/e918140dfa1ce9cf810e9870558da2ce1c80136a))

##### Bug Fixes

- final tidy ups to noincometracking property ([03798ffd](https://github.com/firstlovecenter/fl-pastoral-care/commit/03798ffdebafc47809e7c67a096bf805b58e2bd4))
- change the prop noIncome to noIncomeTracking ([201c4cd0](https://github.com/firstlovecenter/fl-pastoral-care/commit/201c4cd0324aaf13172e95c15596bad50337237b))
- fix oversight display page not showing leader ([1469ef47](https://github.com/firstlovecenter/fl-pastoral-care/commit/1469ef47a89c58a0423e398495b8096b46693ebb))
- implement no currency and conversion rate ([3a5e1709](https://github.com/firstlovecenter/fl-pastoral-care/commit/3a5e170905704d428b268c2f6b3e17aa33bd4987))
- ditched private package and put in global-utils ([09217d69](https://github.com/firstlovecenter/fl-pastoral-care/commit/09217d691f964d1175fddb554af5e465cbc579f4))
- update npmrc file - deleted ([634b4e4d](https://github.com/firstlovecenter/fl-pastoral-care/commit/634b4e4dd62f8bd0abaf0aef846d3e2870ca8a7e))
- update npmrc file ([a9d7be27](https://github.com/firstlovecenter/fl-pastoral-care/commit/a9d7be27bf8d4c76a4c0b9906ec8eb557e648ae4))
- remove .npmrc file ([15f7a95d](https://github.com/firstlovecenter/fl-pastoral-care/commit/15f7a95de3c89786ae04a23b2b2259df8f4b8135))
- add npm authentication ([da0febef](https://github.com/firstlovecenter/fl-pastoral-care/commit/da0febef7c59cb5bdd69650770ba6ecdbcb08083))
- remove whitespace ([b6537d36](https://github.com/firstlovecenter/fl-pastoral-care/commit/b6537d361625c078d85ef496cd230fb5aecf5280))
- implement checking of stream meeting Day for arrivals Day ([a907d756](https://github.com/firstlovecenter/fl-pastoral-care/commit/a907d756db7e977c6d3b7a23154d1b3d2dfa1508))
- implement checking of stream meeting Day for arrivals Day ([71c08ffd](https://github.com/firstlovecenter/fl-pastoral-care/commit/71c08ffd156fc1a65c4fc264ea2c02c3f07f16ac))
- implement cypher query to create sunday as a meeting day ([4fdedbfc](https://github.com/firstlovecenter/fl-pastoral-care/commit/4fdedbfc47cb14e61b8bbf076895ca2673f3bcdb))
- update delete script to also log on the church when a member is deleted ([73d8571d](https://github.com/firstlovecenter/fl-pastoral-care/commit/73d8571d6f917048ce1db9ef096222726ba04092))

#### 6.5.12 (2023-04-18)

##### New Features

- update member delete form ([7ab06b85](https://github.com/firstlovecenter/fl-pastoral-care/commit/7ab06b855de97982874e1d6bf1bf850f049df953))

#### 6.5.11 (2023-04-17)

##### Chores

- fix merge conflicts in easy-debugging script ([989d5285](https://github.com/firstlovecenter/fl-pastoral-care/commit/989d5285485512f8f5168fa127fe89ee6c105107))

##### New Features

- remove the sabbath feature ([7c633978](https://github.com/firstlovecenter/fl-pastoral-care/commit/7c633978545450a35b2392c2778f5c243737a5d1))
- implement cypher script to change church level Names ([f0a7a936](https://github.com/firstlovecenter/fl-pastoral-care/commit/f0a7a936ccc8f9de0a1eed836503010cf918fd72))
- implement financial info on vehicle details page ([9bbaf6e4](https://github.com/firstlovecenter/fl-pastoral-care/commit/9bbaf6e431cf969b89e663f68a90185e2a071a4c))
- implement arrivals payment at the council level and not the stream level ([3b835030](https://github.com/firstlovecenter/fl-pastoral-care/commit/3b835030982bb16b62cda7454e0cf2b9e11e1c36))
- implement three sections of arrivals monitoring ([8538f7e8](https://github.com/firstlovecenter/fl-pastoral-care/commit/8538f7e8feafc6aa597b77d6c8d600bb5cc6d870))
- implement user flow for creating arrivals payment team members ([ba2242b6](https://github.com/firstlovecenter/fl-pastoral-care/commit/ba2242b6155c8fae845d758f3612e99df3b7a2f8))
- implement user flow for paying arrivals vehicles ([fd9c0101](https://github.com/firstlovecenter/fl-pastoral-care/commit/fd9c0101119a191a8ccfb7e402327cba77ff138f))
- implement arrivals pay vehicle page ([4bc380c0](https://github.com/firstlovecenter/fl-pastoral-care/commit/4bc380c0cb5b3eaeef0f6ed1c8f990ffa7ac2888))
- implement arrivalsPayer role and toggle for paid and unpaid ([12c51f8c](https://github.com/firstlovecenter/fl-pastoral-care/commit/12c51f8c4b65b8698b4a0bcd3fd5851fa45d6678))
- implement screen for vehicle to be paid ([c071ac49](https://github.com/firstlovecenter/fl-pastoral-care/commit/c071ac496cfc0a72bbb64b5b60701462502a48b1))

##### Bug Fixes

- change arrivals payment money into float ([ba13af6b](https://github.com/firstlovecenter/fl-pastoral-care/commit/ba13af6b1070564e9834cf6b66a2bae7bb56bea3))
- fix bug preventing arrivals payers from being removed ([bdd13307](https://github.com/firstlovecenter/fl-pastoral-care/commit/bdd133070dcb12219cdc038250b9682e36f0da83))
- final touches to the arrivals payment system ([64084d91](https://github.com/firstlovecenter/fl-pastoral-care/commit/64084d915491ad391fe560127931259d80db101c))
- adjust transfer recipient to show the name of the leader as well as the momoName ([f3ac2ef3](https://github.com/firstlovecenter/fl-pastoral-care/commit/f3ac2ef366d5d47ec8c3f2499e5aa097efaa94d0))
- update easy debugging script ([6eaab2a6](https://github.com/firstlovecenter/fl-pastoral-care/commit/6eaab2a6f5979b07b186bdcd4cc830a59bbbeb17))
- bacentas are now created as graduated instead of IC ([680b4859](https://github.com/firstlovecenter/fl-pastoral-care/commit/680b485997eb7a1333f19fa9e2fba1e1560ea1a4))
- bacentas which have been paid should be returned from api for bacenta Payment Info ([e2ca8d50](https://github.com/firstlovecenter/fl-pastoral-care/commit/e2ca8d50f3c860a8bfc37ee57a24ba25f68133aa))
- initial migrating to session.executeWrite syntax ([de4f3802](https://github.com/firstlovecenter/fl-pastoral-care/commit/de4f38026a263be3e79aaa690a1f035f769063c3))
- scaffold arrivals payment platform ([a78e88ae](https://github.com/firstlovecenter/fl-pastoral-care/commit/a78e88aed49ced9e40c7facd9f541b85cf72519d))
- remove unnecessary leader has no momo payment details warning ([a5105901](https://github.com/firstlovecenter/fl-pastoral-care/commit/a5105901f878dbeedc0f45c944f1c35de4dbccdb))

#### 6.5.10 (2023-04-09)

##### Bug Fixes

- update easy debugging script ([c1b9ba40](https://github.com/firstlovecenter/fl-pastoral-care/commit/c1b9ba40e54b3dc3b82d2c7e365809ff43ab9196))
- change swell weekend to swollen weekend ([8b03ef00](https://github.com/firstlovecenter/fl-pastoral-care/commit/8b03ef00314d91e6b06d7142d8685a02ceb43fdd))
- fix bug preventing constituency from being closed down ([38e7e0a9](https://github.com/firstlovecenter/fl-pastoral-care/commit/38e7e0a93b3b12eda945bb8a02f1bf34db797d58))
- active BacentaCount should include both graduated and IC Bacentas ([a680c32a](https://github.com/firstlovecenter/fl-pastoral-care/commit/a680c32adac662f8e035d5a024a2d1507e99a267))
- if a vehicle is less than 8, it is automatically classed as a car ([21945c15](https://github.com/firstlovecenter/fl-pastoral-care/commit/21945c15cd77bd16f889710e19bb19923916c3ee))

#### 6.5.9 (2023-04-02)

##### Bug Fixes

- fix error choosing timegrpah instead of swelldate ([1de05274](https://github.com/firstlovecenter/fl-pastoral-care/commit/1de05274eb70b39931a810ce9fedb6d7ad6f2689))
- add required option for form mobilisation ([2b6a14ae](https://github.com/firstlovecenter/fl-pastoral-care/commit/2b6a14ae5313923f07b8264b5e227f83e5f2700c))

#### 6.5.8 (2023-04-02)

##### Bug Fixes

- fix private car option not showing on swell dates ([f60703de](https://github.com/firstlovecenter/fl-pastoral-care/commit/f60703dea846c1df6cf9543b80d6a2c656279e24))
- change text saying 'Resident Pastor' to 'Lead Pastor' ([7e3e0a22](https://github.com/firstlovecenter/fl-pastoral-care/commit/7e3e0a22062b3fa8b647e84a4b033d27189a99aa))
- add permission for gs admin to upload banking slip for constituency ([00cacf47](https://github.com/firstlovecenter/fl-pastoral-care/commit/00cacf47f08c66b65bf1becbaf8e9b28d1d5933f))
- remove delete member when registering member ([6d08237f](https://github.com/firstlovecenter/fl-pastoral-care/commit/6d08237f5c2d6f390de813a33973b03dabb6a5fc))

#### 6.5.7 (2023-04-01)

##### Bug Fixes

- implement upload of banking slip by gs admin ([1d498366](https://github.com/firstlovecenter/fl-pastoral-care/commit/1d498366334e68e9eca68d46a9374d54e34d101a))
- give gs admin ability to create new bacentas ([98b9c853](https://github.com/firstlovecenter/fl-pastoral-care/commit/98b9c853c1fa5567c7e4169353b3df204d82e567))
- bring back resolver to submit banking slip in anticipation of new feature ([ae9fa924](https://github.com/firstlovecenter/fl-pastoral-care/commit/ae9fa92494fb48bad7cc965489c7545cf9614da2))
- return more verbose data coming from confirming offering ([4ea260b8](https://github.com/firstlovecenter/fl-pastoral-care/commit/4ea260b86993d559157ac663c50bcc522f2b7ad8))
- some minor improvements to the banking flow ([e2808271](https://github.com/firstlovecenter/fl-pastoral-care/commit/e2808271f89fb8cccb0d1899831f2c6777e33dcf))
- add permissions for adminns to change bacenta leaders ([60d2038f](https://github.com/firstlovecenter/fl-pastoral-care/commit/60d2038fe8d7d2f38952c4a5659cad61125ec39b))

#### 6.5.6 (2023-03-28)

##### Bug Fixes

- closing down constituency also removes constituency admin ([7d9930d8](https://github.com/firstlovecenter/fl-pastoral-care/commit/7d9930d80cd810440737c940e38fb428ea6d270d))
- add permissions for admins to make bacenta leaders ([89a18db3](https://github.com/firstlovecenter/fl-pastoral-care/commit/89a18db382d1c2a337f5eddd0a980136f8c272d2))
- when closing down a constituency, the admin should also be removed ([397e80a2](https://github.com/firstlovecenter/fl-pastoral-care/commit/397e80a2422b2a4c6e745b2e3888c77c6f794de2))
- searching for google places displays the name correctly ([57d14591](https://github.com/firstlovecenter/fl-pastoral-care/commit/57d14591d7d9210553f84258b4a0a56b661f5a63))
- update vite config to start server at localhost instead of 127.0.0.1 ([da1811de](https://github.com/firstlovecenter/fl-pastoral-care/commit/da1811deffbca269661eee909e62380ba6892be0))
- removed code that returns lpIvyTopUp in the system ([52a7c787](https://github.com/firstlovecenter/fl-pastoral-care/commit/52a7c787869fcee3945381b5d1820cb04efcfdd0))
- fix bug preventing new constituencies from being created ([29b47e63](https://github.com/firstlovecenter/fl-pastoral-care/commit/29b47e6319aaaf0ab6e19968d74753d1997cec53))

#### 6.5.5 (2023-03-25)

##### Bug Fixes

- bring back permissions for arrivals gs admin to create bacentas ([5dfcbce4](https://github.com/firstlovecenter/fl-pastoral-care/commit/5dfcbce46e138848eed1ede11768d8a64ea1db36))
- implement more descriptive error handling for errors with payment ([fd5a2d6a](https://github.com/firstlovecenter/fl-pastoral-care/commit/fd5a2d6a0ca754dd8256d06742ab810e7c4c6c16))
- implement more descriptive error handling for errors with payment ([7556f8f7](https://github.com/firstlovecenter/fl-pastoral-care/commit/7556f8f79a60e869c7c1cee170551e3122c1f40e))
- update labels on new and inactive members for poimen app ([0ff29ef8](https://github.com/firstlovecenter/fl-pastoral-care/commit/0ff29ef8331f7e87e1bfc799a736c96f2f2ce73c))

##### Refactors

- rewrite the code of the day function using async-await syntax only ([730d6be9](https://github.com/firstlovecenter/fl-pastoral-care/commit/730d6be9a12face7c3a7aa54f9de676152400dfd))

#### 6.5.4 (2023-03-24)

##### Bug Fixes

- church update screens to handle leaderEmail variable ([33d92345](https://github.com/firstlovecenter/fl-pastoral-care/commit/33d923454b709c618dc4bb4518c7f4d2c389cd53))
- fix bug where members without emails were able to be made as leaders ([d3a475ff](https://github.com/firstlovecenter/fl-pastoral-care/commit/d3a475ffd93bc3f6de64fa1516f791d15f608c3d))
- better error handling when a leader doesn't have an email ([d1904b5b](https://github.com/firstlovecenter/fl-pastoral-care/commit/d1904b5b693962d1d8bc6af3a550ed18d2c48f25))
- remove unnecessary white space ([c89af588](https://github.com/firstlovecenter/fl-pastoral-care/commit/c89af588d4e39c41d56228fdc5a52d08f9e3943b))
- code of the day should return the latest code before today instead of just today's code ([6b870925](https://github.com/firstlovecenter/fl-pastoral-care/commit/6b8709252e9391e2bf793677e5367df8065f6ba8))
- fix require statement to es6 syntax to prevent breaking the vite build ([008523a6](https://github.com/firstlovecenter/fl-pastoral-care/commit/008523a6908483e9b9ebaa674d5f58f7d43a37e2))
- when cancelled services is 0 text should be green on defaulter cards ([03b09f9e](https://github.com/firstlovecenter/fl-pastoral-care/commit/03b09f9e4985f8083dc6c4b76ea2504f905c21b2))
- restore option for stream services to be recorded ([51bb1875](https://github.com/firstlovecenter/fl-pastoral-care/commit/51bb187525f035e620cd11bebc09b0883199c501))

##### Other Changes

- //github.com/firstlovecenter/fl-admin-portal into deploy ([92259cbd](https://github.com/firstlovecenter/fl-pastoral-care/commit/92259cbd103aaec29d031d3ff03c04a3be46c944))

##### Refactors

- reorganise sonta leader resolvers, prevent unnecesary error from throwing ([b91bd038](https://github.com/firstlovecenter/fl-pastoral-care/commit/b91bd038fc1056edf963e7880d61122743c13de6))

#### 6.5.3 (2023-03-22)

##### Bug Fixes

- update the bacenta figure and the IC figure on church level details ([37a1c911](https://github.com/firstlovecenter/fl-pastoral-care/commit/37a1c9110b2219f5fb78e3f97fd85044553dff7c))
- fix bug where maps searches were returning members without location data ([297c4f76](https://github.com/firstlovecenter/fl-pastoral-care/commit/297c4f76c44ffca2896767a6cd4d15ac4ce2c811))
- remove option for uploading banking slip from api ([4b6fe74f](https://github.com/firstlovecenter/fl-pastoral-care/commit/4b6fe74fdeb0e15b65c6478e308b72c4b7f6a367))

#### 6.5.2 (2023-03-21)

##### Bug Fixes

- delete fellowship submission page ([c332fa43](https://github.com/firstlovecenter/fl-pastoral-care/commit/c332fa43bd92722ddd13e032bc731b0d0358d8a2))
- remove fellowship banking slip option ([4cbc9ee5](https://github.com/firstlovecenter/fl-pastoral-care/commit/4cbc9ee5e55ac04891768f4e9b20522b8e95d557))
- add memberId for member search ([0ff38d15](https://github.com/firstlovecenter/fl-pastoral-care/commit/0ff38d15ec92953921642eec54603194233b9d9e))
- fix bugs in parsing data for cache ([1c3ec05a](https://github.com/firstlovecenter/fl-pastoral-care/commit/1c3ec05a56809660471289c0a32aeffc3d686c39))
- fix bugs preventing the movement of members ([27d67731](https://github.com/firstlovecenter/fl-pastoral-care/commit/27d67731824d18f14599bc9c24b1405768ca533c))
- fix issue with update sonta mutation ([1c692d5a](https://github.com/firstlovecenter/fl-pastoral-care/commit/1c692d5a1b8ed3c41274212425c626794f53936e))
- placesSearchQueries should always return empty array ([17015b01](https://github.com/firstlovecenter/fl-pastoral-care/commit/17015b01847c6b7edbacc9567e71abfd5727ec84))

##### Refactors

- move and rename cypher script files in api ([c8803991](https://github.com/firstlovecenter/fl-pastoral-care/commit/c8803991972b6446870b770cda9c6a6440689ccf))

#### 6.5.1 (2023-03-21)

### 6.5.0 (2023-03-21)

##### New Features

- migrate from CRA to vite ([f29221f1](https://github.com/firstlovecenter/fl-pastoral-care/commit/f29221f1b234660ba6baf80d7e1747a939b04b92))

##### Bug Fixes

- remove redundant code ([175c7356](https://github.com/firstlovecenter/fl-pastoral-care/commit/175c735616f7576b43dd2ee1b62c455630edb401))
- remove unused imports ([e6f0ad36](https://github.com/firstlovecenter/fl-pastoral-care/commit/e6f0ad361c5ba47c6e03c26c323e547aa125d8d9))
- write recipientCode to db from paystack ([6bc6d4a0](https://github.com/firstlovecenter/fl-pastoral-care/commit/6bc6d4a0e9cd63aa16343fc0b0800728d2166d08))
- remove sonta church levels from service form filled already ([6bc20a5f](https://github.com/firstlovecenter/fl-pastoral-care/commit/6bc20a5f33ae2b0565645b120006108dfed6ea73))
- update allConstituencies page to show council name instead of council leader cons ([5edc9c5d](https://github.com/firstlovecenter/fl-pastoral-care/commit/5edc9c5df35fbd3bd275261523946a7f650b6a9c))
- update permissions for gs arrivalsAdmin to edit constituencies ([9e77dc0e](https://github.com/firstlovecenter/fl-pastoral-care/commit/9e77dc0e5c78a3f3b3097cfc5e5cf8c17b6e5c53))
- fix bug where params were expected from bacentas that should be sending money params ([46dc8932](https://github.com/firstlovecenter/fl-pastoral-care/commit/46dc8932d54ae5b31086d9f2a0bdf7ff23da702c))

### 6.5.0 (2023-03-21)

##### New Features

- migrate from CRA to vite ([f29221f1](https://github.com/firstlovecenter/fl-pastoral-care/commit/f29221f1b234660ba6baf80d7e1747a939b04b92))

##### Bug Fixes

- remove redundant code ([175c7356](https://github.com/firstlovecenter/fl-pastoral-care/commit/175c735616f7576b43dd2ee1b62c455630edb401))
- remove unused imports ([e6f0ad36](https://github.com/firstlovecenter/fl-pastoral-care/commit/e6f0ad361c5ba47c6e03c26c323e547aa125d8d9))
- write recipientCode to db from paystack ([6bc6d4a0](https://github.com/firstlovecenter/fl-pastoral-care/commit/6bc6d4a0e9cd63aa16343fc0b0800728d2166d08))
- remove sonta church levels from service form filled already ([6bc20a5f](https://github.com/firstlovecenter/fl-pastoral-care/commit/6bc20a5f33ae2b0565645b120006108dfed6ea73))
- update allConstituencies page to show council name instead of council leader cons ([5edc9c5d](https://github.com/firstlovecenter/fl-pastoral-care/commit/5edc9c5df35fbd3bd275261523946a7f650b6a9c))
- update permissions for gs arrivalsAdmin to edit constituencies ([9e77dc0e](https://github.com/firstlovecenter/fl-pastoral-care/commit/9e77dc0e5c78a3f3b3097cfc5e5cf8c17b6e5c53))
- fix bug where params were expected from bacentas that should be sending money params ([46dc8932](https://github.com/firstlovecenter/fl-pastoral-care/commit/46dc8932d54ae5b31086d9f2a0bdf7ff23da702c))

#### 6.4.4 (2023-03-19)

##### Chores

- merge branch 'arrivals-payment-new' into deploy ([a26a7ff8](https://github.com/firstlovecenter/fl-pastoral-care/commit/a26a7ff8b5d6e38a7c1aee581367e4cbf5f3b7f9))
- merge branch 'deploy' into arrivals-payment-new ([a8377a0d](https://github.com/firstlovecenter/fl-pastoral-care/commit/a8377a0df9d357c1d26fef8b462d7dc79e5188fc))

##### New Features

- implement automated payment with paystack api ([c007a39b](https://github.com/firstlovecenter/fl-pastoral-care/commit/c007a39b9efaff68abc1c80bc53773b9e202f2ce))
- implement code to create recipient on paystack portal ([09300de8](https://github.com/firstlovecenter/fl-pastoral-care/commit/09300de8acf954d03b0fc04b28eaa1977325bf63))

##### Bug Fixes

- fix bug preventing leaders from updating momo number ([58c29cea](https://github.com/firstlovecenter/fl-pastoral-care/commit/58c29cea0f5f8d542a8105850d423bb4648503b6))
- update metadata in paystack recipient creation ([77f7cf75](https://github.com/firstlovecenter/fl-pastoral-care/commit/77f7cf75b4f50500bea20b0368001e07c257415c))
- fix bug with automatic code of the day setter ([6cc7bb3e](https://github.com/firstlovecenter/fl-pastoral-care/commit/6cc7bb3eaa6d68dfab0bb97023f32b52239d83b1))
- throw errors from bacenta status utils to sentry ([32d8e4af](https://github.com/firstlovecenter/fl-pastoral-care/commit/32d8e4af7060fa23f9a1989459852f08e8b604c9))
- set more descriptive error logging ([17751c11](https://github.com/firstlovecenter/fl-pastoral-care/commit/17751c11ade4506a278f63260861c23e2a44fa82))
- send sms for bacenta status change ([52a9a255](https://github.com/firstlovecenter/fl-pastoral-care/commit/52a9a255d84d625d28375fa1e5b06897553836ea))
- send sms for bacenta status change ([088c64ec](https://github.com/firstlovecenter/fl-pastoral-care/commit/088c64ec179f9cd11c051cf33099fa187f3029fc))
- fix bug where top ups were not being properly calculated ([7908fa4e](https://github.com/firstlovecenter/fl-pastoral-care/commit/7908fa4edc790f2548822dc6591367f97070cea5))
- add permission for arrivals admin to close down bacenta ([646e0b11](https://github.com/firstlovecenter/fl-pastoral-care/commit/646e0b11d20e71a76a9dd2980224489e14edf4e5))
- add permission for bacenta leader to be made by arrivals admins ([15e1b558](https://github.com/firstlovecenter/fl-pastoral-care/commit/15e1b5589906b098030607c0677c9d4d13efb177))
- **arrivals:**
  - implement only arrivals related church levels showing in arrivals menu ([3e8bbc97](https://github.com/firstlovecenter/fl-pastoral-care/commit/3e8bbc974dd9a3392ead14a4c4a4b1ca2c2797d7))
  - remove recipientCode on bacenta when momoNumber is updated ([a3116310](https://github.com/firstlovecenter/fl-pastoral-care/commit/a3116310e504b6bcbf215eaf0562b1712ddfc12a))

##### Refactors

- remove redundant imports ([0d3da1f0](https://github.com/firstlovecenter/fl-pastoral-care/commit/0d3da1f0175a4343ed1f89b90037679b2b40cf5f))
- remove redundant imports ([6e4208e8](https://github.com/firstlovecenter/fl-pastoral-care/commit/6e4208e80c18b9f376161f7d037f7e882215fcb6))

#### 6.4.3 (2023-03-17)

##### Bug Fixes

- remove directory lock for arrivals admins in the front end ([fea6cef4](https://github.com/firstlovecenter/fl-pastoral-care/commit/fea6cef40b0dbd8569432fe042bc6feec855cc89))
- remove directory lock for arrivals admins ([184fc13c](https://github.com/firstlovecenter/fl-pastoral-care/commit/184fc13c6128d049d4c81447675d6cac939b07a8))

#### 6.4.2 (2023-03-17)

##### Bug Fixes

- implement permission for gs arrivalsAdmin to view all streams ([b9a50c1a](https://github.com/firstlovecenter/fl-pastoral-care/commit/b9a50c1a04c14301f38717f9024969788cff5679))
- make map overlay buttons the same size ([dc54a206](https://github.com/firstlovecenter/fl-pastoral-care/commit/dc54a206871f6a8447bb4cd9756d6084fe8f98c1))
- implement some styling on the buttons in the map overlay ([fd74fa2a](https://github.com/firstlovecenter/fl-pastoral-care/commit/fd74fa2a160d296a13227e28a07a65050283ea2a))
- implement permission for map to be viewed by the whole church ([81b2f9e9](https://github.com/firstlovecenter/fl-pastoral-care/commit/81b2f9e9c3e38b6e698bcfeaba65864156c94f80))
- implement marker when selecting first lovecenter and current location ([d2210f74](https://github.com/firstlovecenter/fl-pastoral-care/commit/d2210f74a94850b0eca010910ca6eda2233dc3db))
- decrease initial zoom on map load ([8e6ca6c2](https://github.com/firstlovecenter/fl-pastoral-care/commit/8e6ca6c23b15524499d83dd72d1b4ca3e73c5e0c))
- remove redundant constituency bussing button ([e99fe70b](https://github.com/firstlovecenter/fl-pastoral-care/commit/e99fe70b6a8b7a509cb6a0f7bb1410c12e213c10))
- return a little data about members on the map ([7c9f0598](https://github.com/firstlovecenter/fl-pastoral-care/commit/7c9f0598b4124b77bdc57ebcf5654cf7f2783146))
- ensure that all created bacentas have topup of amount 0 ([4abbf057](https://github.com/firstlovecenter/fl-pastoral-care/commit/4abbf0571b84b8934eb780889b78fb550109bf5c))
- prevent text from wrapping on bacenta details page ([07f965bb](https://github.com/firstlovecenter/fl-pastoral-care/commit/07f965bb139742ffaf2a8b52aa67515f24f1ce38))

#### 6.4.1 (2023-03-15)

##### Documentation Changes

- update CHANGELOG.md ([5052c634](https://github.com/firstlovecenter/fl-pastoral-care/commit/5052c634f2799d04a4f006325c03d7d6d135dd65))
- update CHANGELOG.md ([c324c639](https://github.com/firstlovecenter/fl-pastoral-care/commit/c324c6390a5824890fcd61dc718da7313941973b))
- update CHANGELOG.md ([28869ea3](https://github.com/firstlovecenter/fl-pastoral-care/commit/28869ea3bc0b9544e38f5151212dead288d38bb9))
- update CHANGELOG.md ([9cc4ca05](https://github.com/firstlovecenter/fl-pastoral-care/commit/9cc4ca05b5987b65d7b9ecc7e7a046b569bf9bf6))

##### New Features

- **arrivals:** include onne way and top up amount as a property on bacenta node ([f7aa13cc](https://github.com/firstlovecenter/fl-pastoral-care/commit/f7aa13cc913d371bc56e31ca2d459db797dd8b9a))

##### Bug Fixes

- add outbound status to graphql query to display bacenta ([98e404df](https://github.com/firstlovecenter/fl-pastoral-care/commit/98e404df4eca98406cbbec9992f3f81236c451f8))
- remove unused function convertToString ([cdf7e56e](https://github.com/firstlovecenter/fl-pastoral-care/commit/cdf7e56e469f5ece37badce4a853c851be6ffa66))
- bacenta status change bug for bussing 8 and above ([cf2099ce](https://github.com/firstlovecenter/fl-pastoral-care/commit/cf2099ce1bd07e82acb226138a84db6c5887a86a))
- fix vehicle top up with arrivals 8.0 changes ([2ccbd5d7](https://github.com/firstlovecenter/fl-pastoral-care/commit/2ccbd5d79f176dd5258196772b5c290e74f758ce))
- switch from computed top up values to static values ([673f2474](https://github.com/firstlovecenter/fl-pastoral-care/commit/673f247455b224e6d54391c05949b992839dbcfb))
- add permission for arrivals admins to change leaders ([b77bdf74](https://github.com/firstlovecenter/fl-pastoral-care/commit/b77bdf740517d6b732fb233dcc5922583e818d60))
- redesign of maps button ([27ec9bd6](https://github.com/firstlovecenter/fl-pastoral-care/commit/27ec9bd6012f2d41ccb492be5e399572aeffdb83))
- adjust proportions for change constituency bussing costs button ([bc1b5e17](https://github.com/firstlovecenter/fl-pastoral-care/commit/bc1b5e173be68ed673686793337a03bca23a994c))
- correct typo on graph pages ([a75186d8](https://github.com/firstlovecenter/fl-pastoral-care/commit/a75186d8c86af0e4eee18ec9701328fe06517ff3))

### 6.4.0 (2023-03-14)

### 6.3.0 (2023-03-14)

### 6.2.0 (2023-03-14)

### 6.1.0 (2023-03-14)

##### New Features

- **arrivals:** include onne way and top up amount as a property on bacenta node ([e9311940](https://github.com/firstlovecenter/fl-pastoral-care/commit/e931194041415694f490f9a1a717fb9f37004e93))

##### Bug Fixes

- fix vehicle top up with arrivals 8.0 changes ([bdfb5270](https://github.com/firstlovecenter/fl-pastoral-care/commit/bdfb52708ccf6a75fa7ef256a63a0dd74fc588f9))
- switch from computed top up values to static values ([4ee09f7d](https://github.com/firstlovecenter/fl-pastoral-care/commit/4ee09f7d8e96d92c023f9ecd0e048861f31c8f76))
- add permission for arrivals admins to change leaders ([24151bc3](https://github.com/firstlovecenter/fl-pastoral-care/commit/24151bc35bc2823b7d2bcfc766a8d4a46ec702f6))
- redesign of maps button ([d8990ebf](https://github.com/firstlovecenter/fl-pastoral-care/commit/d8990ebfb45587268acf9a5c8caf221a40b7997a))
- adjust proportions for change constituency bussing costs button ([bc1b5e17](https://github.com/firstlovecenter/fl-pastoral-care/commit/bc1b5e173be68ed673686793337a03bca23a994c))
- correct typo on graph pages ([a75186d8](https://github.com/firstlovecenter/fl-pastoral-care/commit/a75186d8c86af0e4eee18ec9701328fe06517ff3))

#### 6.0.3 (2023-03-14)

##### Bug Fixes

- add council to swollen sunday target template ([be4a34a2](https://github.com/firstlovecenter/fl-pastoral-care/commit/be4a34a26c9d8b250c3a33dbcfac0da1ee481b0d))
- fix small leader picture on member cards ([c96aa974](https://github.com/firstlovecenter/fl-pastoral-care/commit/c96aa97426d81f048136cc89777a248a9e08b8f6))
- enable car option only for swell dates ([63f0c706](https://github.com/firstlovecenter/fl-pastoral-care/commit/63f0c706b3c424b4bc1ba46e1dd01301dbcdf002))
- remove car option for bussing ([7f8b7c98](https://github.com/firstlovecenter/fl-pastoral-care/commit/7f8b7c98134ad40f138776b30c29c234b1a7bc9b))
- change condition for car option to after first bussing ([5acdece1](https://github.com/firstlovecenter/fl-pastoral-care/commit/5acdece1a05a691b0dde2bf09911bc8e444c75dc))

#### 6.0.2 (2023-03-12)

##### New Features

- implement picture of leader on graphs ([fbf20aee](https://github.com/firstlovecenter/fl-pastoral-care/commit/fbf20aeedd227e3e434fc8e690e1c2de8fecf7fb))
- includee subaccount in payment api call ([bea899ab](https://github.com/firstlovecenter/fl-pastoral-care/commit/bea899ab9ad7d6d1770a462eb7c206fac45348f8))

##### Bug Fixes

- remove redundant code ([0857184d](https://github.com/firstlovecenter/fl-pastoral-care/commit/0857184d5bd50956520eb69495bc3655f71c69f5))
- update permissions for undoing cancelled service ([38a7b3ef](https://github.com/firstlovecenter/fl-pastoral-care/commit/38a7b3ef5a0f94d5e27fc4c8b983735ee67c7824))
- remove directory lock for creating bacentas ([4abd8931](https://github.com/firstlovecenter/fl-pastoral-care/commit/4abd8931341346238667e8e41440a4819b5cedb3))
- fix spelling mistake with env variables ([bb9eb780](https://github.com/firstlovecenter/fl-pastoral-care/commit/bb9eb7808a6b4349e837cd5500cd231a46b6583b))
- implement a scheduled function to set the code of the day each weekend ([f4ab0f47](https://github.com/firstlovecenter/fl-pastoral-care/commit/f4ab0f47bda71831cae62a7a1682dfe7da6cb35a))
- fix multiple history logs being created when a church is closeed down ([c2abbb27](https://github.com/firstlovecenter/fl-pastoral-care/commit/c2abbb278763c4676c3a910f2967d8e130e928f1))
- fix spelling error ([1ec85566](https://github.com/firstlovecenter/fl-pastoral-care/commit/1ec855667080930319d2435e94b439344829b393))
- fix spelling error ([ca6b42f5](https://github.com/firstlovecenter/fl-pastoral-care/commit/ca6b42f58110780d505b193e5976405322969cf8))

#### 6.0.1 (2023-03-12)

##### New Features

- implement self banking for council services ([2bf36168](https://github.com/firstlovecenter/fl-pastoral-care/commit/2bf361682aeaccbf0f07b746d359bf6daf83fdc7))

##### Bug Fixes

- remove reference to expressPay in self banking ([d1818ae1](https://github.com/firstlovecenter/fl-pastoral-care/commit/d1818ae1e6692fb51f3e9795ec89dcff7a0f56fe))

## 6.0.0 (2023-03-11)

##### Chores

- merge branch 'admin-515-STORY/show-fellowship-location' into deploy ([ddf7bc19](https://github.com/firstlovecenter/fl-pastoral-care/commit/ddf7bc19473d67a316412b7b4e91cb5a791ecd2b))

##### Documentation Changes

- update cypher import scripts for map areas ([7e8a1236](https://github.com/firstlovecenter/fl-pastoral-care/commit/7e8a123692e45d937682e4b20883d46fab3ff80e))

##### New Features

- add outdoor venues to map places search ([8f8f68e2](https://github.com/firstlovecenter/fl-pastoral-care/commit/8f8f68e299f2e2befa7ddf943965f67f17bf708d))
- implement css class for selected marker point ([ee95f45d](https://github.com/firstlovecenter/fl-pastoral-care/commit/ee95f45d94b4dfd1c1f42a45394c5e457b14dcb3))
- implement styling for marker icons and labels ([e0ea32c1](https://github.com/firstlovecenter/fl-pastoral-care/commit/e0ea32c1d3f0c905076eea75bab340f74a08e327))
- display markers for places within a 5km radius ([a983d1f3](https://github.com/firstlovecenter/fl-pastoral-care/commit/a983d1f3acae37cc6d04360eda7d41947175daa2))
- implement cypher script for importing university outreach venues ([6da5d64d](https://github.com/firstlovecenter/fl-pastoral-care/commit/6da5d64deddcb87a202f539339658a45778097a3))
- implemented resolver for returning member places search ([a1f646af](https://github.com/firstlovecenter/fl-pastoral-care/commit/a1f646afab806b53b7cedd6802f52253605deaee))
- implement resolver for member places search ([e8ebb28b](https://github.com/firstlovecenter/fl-pastoral-care/commit/e8ebb28b348890b21dd3897c14e5d8aef3f52f35))
- add registrationDate as a property on member ([bc363474](https://github.com/firstlovecenter/fl-pastoral-care/commit/bc363474fb397b3867b15e2c7585ca3244482409))
- implement panning map to selected place or person ([6ffe36ad](https://github.com/firstlovecenter/fl-pastoral-care/commit/6ffe36ad5f4a8e0cf972cda10de71d8f7f45be39))
- enable search box for searching FLC database ([5e07533d](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e07533d6314527e9ea5b6b0c76db1157a3f0fbf))
- add search of members to google places combobox ([fe4fc5be](https://github.com/firstlovecenter/fl-pastoral-care/commit/fe4fc5be5ed3508b3841001a58683dcad7f11ec1))
- implement button to search for google places in maps ([9472c9d5](https://github.com/firstlovecenter/fl-pastoral-care/commit/9472c9d56114190d2f426645f2aeb7227299596b))
- implement foating action button and menu overlay on map ([ac88e1dd](https://github.com/firstlovecenter/fl-pastoral-care/commit/ac88e1dd250604563cc104bfe2297c0c2ed6797c))
- implement fellowship map landing page ([7db72ac0](https://github.com/firstlovecenter/fl-pastoral-care/commit/7db72ac019911df864bc6449f29f2569a93895d3))

##### Bug Fixes

- fix bug not showing member picture on map ([9b351843](https://github.com/firstlovecenter/fl-pastoral-care/commit/9b3518431fe4c7dfee17405f3e959fb0fa7fd038))
- fix bugs with styling of outdoor venues ([1833e5ce](https://github.com/firstlovecenter/fl-pastoral-care/commit/1833e5cec35182bfbf3907f401f08334ec62b015))
- add a marker icon for member place type ([acbe4c96](https://github.com/firstlovecenter/fl-pastoral-care/commit/acbe4c96d3ac09951e2819bac383879541b4d67c))
- fix bug preventing constituency from being closed when there has been no service ([480a9801](https://github.com/firstlovecenter/fl-pastoral-care/commit/480a98011df7128d1aec206448991b8a1ecaeee2))
- add teller ConfirmationTime as a property for outstanding offering check ([c083c9e9](https://github.com/firstlovecenter/fl-pastoral-care/commit/c083c9e9e5176d78ab587b0cb8dccd985860cedb))
- implement custom icons for map markers ([358165e5](https://github.com/firstlovecenter/fl-pastoral-care/commit/358165e586bd69b1adc173df0d0a58c1f13a0d87))
- include cypher script for making urvan and sprinter costs the same as constituency ([555212dd](https://github.com/firstlovecenter/fl-pastoral-care/commit/555212dd93826a885fe098bb870e2f86a5c98db8))
- show each card correctly depending on which costs are available ([da3c3277](https://github.com/firstlovecenter/fl-pastoral-care/commit/da3c3277adf597e425a2c294fc6f9213b0ef15fb))
- add styling for marker component ([ac460612](https://github.com/firstlovecenter/fl-pastoral-care/commit/ac460612f68186f57fef1fbb130472ba9e2db54a))
- return transaction Reference after confirming transaction ([d929332b](https://github.com/firstlovecenter/fl-pastoral-care/commit/d929332b2bdc341e4cf1efda88ddc35cef88feb4))
- implement searching of FLC database for uni outreach venues ([df59c79d](https://github.com/firstlovecenter/fl-pastoral-care/commit/df59c79d11125f0a8af8e30f2b595e64c53c09bc))
- remove console.log from backend api ([9bd2fd09](https://github.com/firstlovecenter/fl-pastoral-care/commit/9bd2fd097aa2ddfa3e8bf0b35a6ad3075e564f61))
- changed specific churchlevel maps to generic view maps ([d7fb0e62](https://github.com/firstlovecenter/fl-pastoral-care/commit/d7fb0e628955c0997729952006395c4b1b1eccb7))
- infer types for suggestions ([d0033887](https://github.com/firstlovecenter/fl-pastoral-care/commit/d003388797a3866cc434fcc113a432229d762fad))

##### Refactors

- change original location to visitationArea and introduced a new location property ([b98ddbfd](https://github.com/firstlovecenter/fl-pastoral-care/commit/b98ddbfdcabec74206f7cba922e15febbae446b7))

### 5.10.0 (2023-03-10)

##### New Features

- implement a manual submission of banking slip for gs admins ([2090fd3e](https://github.com/firstlovecenter/fl-pastoral-care/commit/2090fd3ee2e586c27f4e2bc9a17a18f8f504391a))
- implement button to undo a cancelled service ([96378838](https://github.com/firstlovecenter/fl-pastoral-care/commit/9637883809e1878ebc283596c26d70bb5e8dce6c))

##### Bug Fixes

- implement roles on the mutation in the api ([a7126394](https://github.com/firstlovecenter/fl-pastoral-care/commit/a7126394301cf1475082c043228070cb75bf85f2))
- implement a role view on the undocancelledservice button ([51b8388a](https://github.com/firstlovecenter/fl-pastoral-care/commit/51b8388a4fe51ff23148b74a0ae62e198e8c5833))
- change wrong param to service Record Id ([668969b3](https://github.com/firstlovecenter/fl-pastoral-care/commit/668969b3c24fefa25ca1321d10e9ff44050e313c))
- remove redundant code breaking the build ([931f7f08](https://github.com/firstlovecenter/fl-pastoral-care/commit/931f7f083ecce23d5a683eea781fbe58d2f17412))
- fix bug where anagkazo services are being seen as not banked ([d662d741](https://github.com/firstlovecenter/fl-pastoral-care/commit/d662d7418690da95b235077d3534cc1d27ead372))
- fix bug where anagkazo services are being seen as not banked ([798f3589](https://github.com/firstlovecenter/fl-pastoral-care/commit/798f3589f2a6718b7f42109d9b7caf2e8d3ea0be))
- fix bug where anagkazo services are being seen as not banked ([7d06a6eb](https://github.com/firstlovecenter/fl-pastoral-care/commit/7d06a6ebcfcea9461313de6f16fd557ef33922c3))
- implement a field for viewing anagkazo confirmers on service details page ([f612ab84](https://github.com/firstlovecenter/fl-pastoral-care/commit/f612ab848b275058c855794cec5c6751d776ad53))

#### 5.9.28 (2023-03-09)

##### Bug Fixes

- implement permission for only campus admin to create bacentas ([95c778a5](https://github.com/firstlovecenter/fl-pastoral-care/commit/95c778a5b8e1e8af67b1139983383801864c9c58))
- update constituency bussing costs ([e8ceaf47](https://github.com/firstlovecenter/fl-pastoral-care/commit/e8ceaf474cee07587a8df565d400395a5870807f))
- ensure that bussing data is added per week, and not per day ([608f91ae](https://github.com/firstlovecenter/fl-pastoral-care/commit/608f91ae662e30a6e681cf7737ad68115452295a))
- optionally display foreign currency of a service ([6bbb68bb](https://github.com/firstlovecenter/fl-pastoral-care/commit/6bbb68bb86398acaf65b789351b73583076b7e17))

#### 5.9.27 (2023-03-05)

##### Bug Fixes

- add optional chain on foreigncurrency ([37409ee4](https://github.com/firstlovecenter/fl-pastoral-care/commit/37409ee47a48e6ad31141bebe3bd1ed5692bcb93))

#### 5.9.26 (2023-03-05)

##### Bug Fixes

- add numberOfTithers to other display service details ([6606d028](https://github.com/firstlovecenter/fl-pastoral-care/commit/6606d028f08da20116ef88b8f2a9605a52655942))

#### 5.9.25 (2023-03-05)

##### Documentation Changes

- update README ([230e44da](https://github.com/firstlovecenter/fl-pastoral-care/commit/230e44da50fe20ddca58ace73525787a99df974d))

##### New Features

- add number of tithers and foreign currency as fields on service details ([af2db295](https://github.com/firstlovecenter/fl-pastoral-care/commit/af2db2958d9ff29377d91cbaec0bb79b1261075d))

##### Bug Fixes

- remove unneeded poll intervals ([c10d1354](https://github.com/firstlovecenter/fl-pastoral-care/commit/c10d13542af8468ce86400b5a23e6323f61464a0))

#### 5.9.24 (2023-03-05)

##### Bug Fixes

- replace hardcoded poll intervals with global constants ([679d4753](https://github.com/firstlovecenter/fl-pastoral-care/commit/679d475308db2f1d819565c921686e1617c01e25))

#### 5.9.23 (2023-03-05)

##### New Features

- add poll interval on arrivals state screens ([425d08cd](https://github.com/firstlovecenter/fl-pastoral-care/commit/425d08cdc8b0a4c180ed6627850e280ef465be37))
- implement polling on arrivals screens every 2 seconds ([6452a704](https://github.com/firstlovecenter/fl-pastoral-care/commit/6452a704dd42d28970cb405103ee264dd99aa3c1))

##### Bug Fixes

- fixed condition where a bacenta that has submitted two vehicles was being zeroed when the vehicles were submitted both before counting ([4bc5fff1](https://github.com/firstlovecenter/fl-pastoral-care/commit/4bc5fff13bab1a06a415c14ac03f67f05174754a))
- add condition for handling null values in parseNeoNumber ([ce5521ba](https://github.com/firstlovecenter/fl-pastoral-care/commit/ce5521ba1b41b858f24ff1b7b965b9889ef55740))
- set as arrivals real time dashboard ([c91370fd](https://github.com/firstlovecenter/fl-pastoral-care/commit/c91370fd972b8a60df2cf4d827e4637b4cf82b06))
- minor improvements to parseNeoNumber function ([4cd6c37d](https://github.com/firstlovecenter/fl-pastoral-care/commit/4cd6c37d6c43ac33406a36e7af2d1d89dacc15aa))
- implement parseNeoNumber function ([714aaced](https://github.com/firstlovecenter/fl-pastoral-care/commit/714aacedcb90f74454b6056ee5836d6415d5aa5b))
- log attendance for zeroed attenndance ([adf9c813](https://github.com/firstlovecenter/fl-pastoral-care/commit/adf9c813473130f20b3cd2874fb20852caa22c74))
- log attendance for zeroed attenndance ([616bb296](https://github.com/firstlovecenter/fl-pastoral-care/commit/616bb29676001deaece2ee66021e7cee21297edf))

#### 5.9.22 (2023-03-05)

##### Refactors

- refactor arrivals resolvers into slightly more readable code ([3ebf3ed2](https://github.com/firstlovecenter/fl-pastoral-care/commit/3ebf3ed2625652d8b4927e1297c907a782d9baa6))
- improve wording when there is no cost to the church ([7fd22f66](https://github.com/firstlovecenter/fl-pastoral-care/commit/7fd22f6620a460cde06c56016b8556de99d809b4))

#### 5.9.21 (2023-03-04)

##### Bug Fixes

- add private car option for second vehicle going forward ([92ca3853](https://github.com/firstlovecenter/fl-pastoral-care/commit/92ca3853ea8831ca3e463150814fa029fc5eac35))
- remove condition which would have meant that all busses have to be above 8 ([7f918e3e](https://github.com/firstlovecenter/fl-pastoral-care/commit/7f918e3e09cebe0819bec778f34876a3c37ce2d2))
- include a condition so that second bus exploit cant be used ([5716af3e](https://github.com/firstlovecenter/fl-pastoral-care/commit/5716af3e4bd7ea7ef44c0a1a0c00ffbda9abba1f))
- show zero instead of - ([1da739fb](https://github.com/firstlovecenter/fl-pastoral-care/commit/1da739fb3bb00e7991547df1a2115f47731c78d8))

#### 5.9.20 (2023-03-04)

##### Bug Fixes

- error in returning bacentas below 8, error in bacentas that arrived count ([e2c824b3](https://github.com/firstlovecenter/fl-pastoral-care/commit/e2c824b3a50ac7d1432a03f3a54314f8a5204444))
- fix issue with anagkazo treasurers were seeing services from last year ([c9ec18a8](https://github.com/firstlovecenter/fl-pastoral-care/commit/c9ec18a8cd266f6d94e0dc064113a238491f2ffb))

#### 5.9.19 (2023-03-02)

##### Bug Fixes

- failed payments should no longer redirect to the self baking receipt ([517e4078](https://github.com/firstlovecenter/fl-pastoral-care/commit/517e40789c040b47636e47baef2b4c23a36e055c))
- add missing useMutation reference that was breaking the front end ([f80b267f](https://github.com/firstlovecenter/fl-pastoral-care/commit/f80b267fb38cc9e00555f629dec5c3a6b23f9b10))

#### 5.9.18 (2023-03-02)

##### Documentation Changes

- update CHANGELOG.md ([a6bfcf37](https://github.com/firstlovecenter/fl-pastoral-care/commit/a6bfcf377a8bdc476f4b9fba7e56db43841d02f9))

##### Bug Fixes

- add a condition so that payment confirmation only happens in the event of unsuccessful transact ([391da5e4](https://github.com/firstlovecenter/fl-pastoral-care/commit/391da5e4e49b8f3bda89c96728b54b95c74be03f))

#### 5.9.18 (2023-03-02)

##### Bug Fixes

- add a condition so that payment confirmation only happens in the event of unsuccessful transact ([391da5e4](https://github.com/firstlovecenter/fl-pastoral-care/commit/391da5e4e49b8f3bda89c96728b54b95c74be03f))

#### 5.9.17 (2023-03-02)

##### Bug Fixes

- remove feature to confirm offering payments and just refetch data from the backend ([a8435577](https://github.com/firstlovecenter/fl-pastoral-care/commit/a8435577c370234bb13d1407261ab598d1e15209))

#### 5.9.16 (2023-03-01)

##### Bug Fixes

- fix issue where button wasnt toggling to submitting state on directory forms ([7f44281a](https://github.com/firstlovecenter/fl-pastoral-care/commit/7f44281a1b62f81262935f7327f224956f910277))
- fix issue where button wasn't toggled to submitting state for bacenta, constituency, council ([86284f43](https://github.com/firstlovecenter/fl-pastoral-care/commit/86284f43291feb670a6d5ddd29eca8fcfb94cd98))
- fix issue where button wasn't toggled to submitting state in fellowship form ([83ab9628](https://github.com/firstlovecenter/fl-pastoral-care/commit/83ab9628c56c045c86e7b7ffe8a73b9bb98e3aef))
- remove throw to sentry error when member is a duplicate ([d7c7977a](https://github.com/firstlovecenter/fl-pastoral-care/commit/d7c7977a6bddf48bc591be6257980f93faaaeea3))

#### 5.9.15 (2023-02-28)

##### New Features

- implement membership transfer request form when duplicate member exists ([b3e4692c](https://github.com/firstlovecenter/fl-pastoral-care/commit/b3e4692cff9c99436bb6878e4802fb37efea2093))

##### Bug Fixes

- fix bug preventing members from registering new members ([f11aea4a](https://github.com/firstlovecenter/fl-pastoral-care/commit/f11aea4acf6be5dbe7da167a2816042b2c51e30c))
- inputting the right arguments to the cypher queries ([0508d3e7](https://github.com/firstlovecenter/fl-pastoral-care/commit/0508d3e7b64f48edc563311bf0f6378baee6ada2))
- from the second bus, people should be able to top up their bussing ([3bfc0b6e](https://github.com/firstlovecenter/fl-pastoral-care/commit/3bfc0b6e89a646d8b510505cce32ed2a4be8213c))
- remove redundant code from the frontend ([ae6adf6c](https://github.com/firstlovecenter/fl-pastoral-care/commit/ae6adf6c4f59ad711f6874b978dd8ec63902a9ed))
- adjust attendance criteria for anagkazo ([317208b0](https://github.com/firstlovecenter/fl-pastoral-care/commit/317208b0de07bc91ac8b373775a9ee8aa87137cb))

#### 5.9.14 (2023-02-26)

##### Bug Fixes

- show in and out status as a string instead of a boolean ([96c6c8ff](https://github.com/firstlovecenter/fl-pastoral-care/commit/96c6c8ff804d5dc7ca374a99e208f1764a41a0c7))

#### 5.9.13 (2023-02-26)

##### New Features

- admin-524 implement sonta display ([78c30bbe](https://github.com/firstlovecenter/fl-pastoral-care/commit/78c30bbe9172c642038356f77416f7fb9e971b41))

##### Bug Fixes

- add 'in and out' option to arrivals payment data csv ([0f27ef39](https://github.com/firstlovecenter/fl-pastoral-care/commit/0f27ef3971413e948aa6214942817c6bdc861c1c))
- update debugging scripts for cypher ([a3f76a87](https://github.com/firstlovecenter/fl-pastoral-care/commit/a3f76a87b9a810b4a06cc71009629416583b57d1))
- permissions for create mutations ([#404](https://github.com/firstlovecenter/fl-pastoral-care/pull/404)) ([b1b4d9c6](https://github.com/firstlovecenter/fl-pastoral-care/commit/b1b4d9c6d9b152ebc94aa92c87ee92ce77864f82))
- make leader mutations ([#402](https://github.com/firstlovecenter/fl-pastoral-care/pull/402)) ([612f61d7](https://github.com/firstlovecenter/fl-pastoral-care/commit/612f61d79da515d5cefd166866e1d83cc79fdbf2))
- sonta count queries ([#401](https://github.com/firstlovecenter/fl-pastoral-care/pull/401)) ([c1379fa2](https://github.com/firstlovecenter/fl-pastoral-care/commit/c1379fa2ca463d68e39c363b1cb7e3a8e02f109d))
- fix date on history log and standardised creativearts name ([b202561b](https://github.com/firstlovecenter/fl-pastoral-care/commit/b202561b82c60d7fe822d37485d06e193c99799f))
- member basonta queries on member node ([#400](https://github.com/firstlovecenter/fl-pastoral-care/pull/400)) ([8764082e](https://github.com/firstlovecenter/fl-pastoral-care/commit/8764082e6a0edceed6a0120914d603717d8d1432))
- admin-525 fix issue where upload target failswhen target value is 0 ([21409612](https://github.com/firstlovecenter/fl-pastoral-care/commit/21409612c1c8d153392e6cba7682a636024a6056))

#### 5.9.12 (2023-02-25)

#### 5.9.11 (2023-02-25)

##### Bug Fixes

- fix cypher error with summing vehicle topup ([b0c728fc](https://github.com/firstlovecenter/fl-pastoral-care/commit/b0c728fcf83e212aa5152a4a15b2652d88cfa5fb))
- update bussing top up when vehicle is confirmed ([b7421c5c](https://github.com/firstlovecenter/fl-pastoral-care/commit/b7421c5c50cebf17f928db4540ef5a77a6f1d58e))

#### 5.9.10 (2023-02-25)

#### 5.9.9 (2023-02-25)

#### 5.9.8 (2023-02-25)

##### Bug Fixes

- fixed calculation of vehicle top up ([55d4e5bc](https://github.com/firstlovecenter/fl-pastoral-care/commit/55d4e5bc3937f42865b2af7e7974d107b71a168a))

#### 5.9.7 (2023-02-25)

##### New Features

- add easy debugging scripts cypher file for the most common debugging scripts ([2320751a](https://github.com/firstlovecenter/fl-pastoral-care/commit/2320751a38ff0486150df3759f29cb060df01b9e))

#### 5.9.6 (2023-02-24)

##### Bug Fixes

- prevent fellowship venue location from being unnecessarily updated ([a498e504](https://github.com/firstlovecenter/fl-pastoral-care/commit/a498e504b9882f928c0f13d99fa46481cf160608))

#### 5.9.5 (2023-02-24)

##### Bug Fixes

- refactor location to visitationArea in memberBio query ([680887ef](https://github.com/firstlovecenter/fl-pastoral-care/commit/680887efb6a4849190b8ad03a05e59251a7fb086))

#### 5.9.4 (2023-02-23)

##### New Features

- replace location nwith visitationArea ([c8816a64](https://github.com/firstlovecenter/fl-pastoral-care/commit/c8816a648a8784fd1746e5c2a7ccb44eedd565d8))

##### Bug Fixes

- fix bug preventing closing fellowships without previous service info ([437580b7](https://github.com/firstlovecenter/fl-pastoral-care/commit/437580b7f2c74aa35c6815ac189a1e1fd8e24cd1))
- remove momoname and mobile network from bacenta after transfer ([b758c15b](https://github.com/firstlovecenter/fl-pastoral-care/commit/b758c15bf7f6f35c08d0b67d33ba26999bdd08e3))
- aggregate bussing data in a more correct fashion ([a8503027](https://github.com/firstlovecenter/fl-pastoral-care/commit/a8503027030f08769c2381a648a8e903555d0b95))
- update cypher for retrieving bussing data ([c5969498](https://github.com/firstlovecenter/fl-pastoral-care/commit/c59694988b435db16f4b7352966b2fdcc42d7782))
- change text 'Bacentas Below 8' to 'Bacentas that Didnt Bus' ([1ceec0bd](https://github.com/firstlovecenter/fl-pastoral-care/commit/1ceec0bd636299aa835bd1fe9ca409081a6e946e))
- correct count of vehicles to be counted ([c75e5739](https://github.com/firstlovecenter/fl-pastoral-care/commit/c75e5739dc0ece3f265bcedc7d556a0ad6fa1ce7))

##### Refactors

- change names to prevent breaking of apollo vscode ext ([ca0b8fce](https://github.com/firstlovecenter/fl-pastoral-care/commit/ca0b8fcefbf0648ed7840e5140045afe38d011fe))

#### 5.9.3 (2023-02-17)

##### Bug Fixes

- fine tune fellowship form views ([dcae0f8d](https://github.com/firstlovecenter/fl-pastoral-care/commit/dcae0f8d26a3997c2da37551e7b8ee1982e3bb62))
- remove block in creating fellowships ([ad87a9f8](https://github.com/firstlovecenter/fl-pastoral-care/commit/ad87a9f8df142ffb019da5dd5c688476790009d5))
- constituency cannot be closed down if it has outstanding banking ([777ecdf4](https://github.com/firstlovecenter/fl-pastoral-care/commit/777ecdf4a0a34ce0f54f39e27ed96ee929d987b0))
- fellowship cannot be closed down if it has outstanding banking ([15c22386](https://github.com/firstlovecenter/fl-pastoral-care/commit/15c223869a3c859707805875b43fe530ff881ee9))
- constituency admin cannot edit fellowship details of their own service ([a509650e](https://github.com/firstlovecenter/fl-pastoral-care/commit/a509650e74360707500d2088c1dbe3fb5951f5a7))
- fix bug in cypher such that lastService during banking check has to be in the last 52 weeks ([f234f253](https://github.com/firstlovecenter/fl-pastoral-care/commit/f234f2533fafd6285288657de691d7b07ce8129d))

#### 5.9.2 (2023-02-16)

##### Bug Fixes

- enable reactivation of a member if he was made inactive and then the fellowship was closed ([c1b0e187](https://github.com/firstlovecenter/fl-pastoral-care/commit/c1b0e1872adc10f3c53c577fede20de34f6ffd01))
- when a counter counts a bus that is less than 8, the number is instantly zeroed ([6edf1d03](https://github.com/firstlovecenter/fl-pastoral-care/commit/6edf1d03a3ac2e14cf15e1c2d4422ea2a1805678))
- change bacentas below 8 text to bacentasThatDidnt bus ([af72ce53](https://github.com/firstlovecenter/fl-pastoral-care/commit/af72ce53ef6d96767266a1d098568375925271a3))
- return null for momo Number for apollo cache ([077610d6](https://github.com/firstlovecenter/fl-pastoral-care/commit/077610d689a85066d20b978292f590be1ff13d63))
- delete momo number from bacenta when leader is transferred ([746c43c2](https://github.com/firstlovecenter/fl-pastoral-care/commit/746c43c20e61ba99a5ca59862a9d3522897d8e8c))

#### 5.9.1 (2023-02-12)

##### Bug Fixes

- fix wrongful date when downloading arrivals payment data ([d838b4ab](https://github.com/firstlovecenter/fl-pastoral-care/commit/d838b4abaecf94a8a7e1019a501ad5604f8e2b48))

### 5.9.0 (2023-02-12)

##### Bug Fixes

- implement sheep seeker searching for churches in stream ([0fae14ac](https://github.com/firstlovecenter/fl-pastoral-care/commit/0fae14acefa69b87b39bd2e83f831a525c84157d))
- implement sheep seeker being able to see all fellowships in stream ([3ebbe88b](https://github.com/firstlovecenter/fl-pastoral-care/commit/3ebbe88b5d75922bf94d21caf4ce6d79d4483203))

#### 5.8.10 (2023-02-12)

##### Documentation Changes

- update CHANGELOG.md ([ef540cad](https://github.com/firstlovecenter/fl-pastoral-care/commit/ef540cadc051fcab7285d00365989cc48408f494))
- update CHANGELOG.md ([03870c92](https://github.com/firstlovecenter/fl-pastoral-care/commit/03870c92c3bcabab4bc79e0e4886ea676bb0dc1a))
- update CHANGELOG.md ([84f989aa](https://github.com/firstlovecenter/fl-pastoral-care/commit/84f989aacda75c315e9f68e71c5110e49c6b0a70))

##### New Features

- create custom route path for sheep seeker permissions ([e0a66210](https://github.com/firstlovecenter/fl-pastoral-care/commit/e0a66210356e81bcabd3aebdc7093913d0994bf0))

##### Bug Fixes

- delete redundant code ([cfe24e29](https://github.com/firstlovecenter/fl-pastoral-care/commit/cfe24e299cb6dae63e1f721273963a4578b3a397))
- remove busses with attendance of zero from busses arrived count ([8598aac1](https://github.com/firstlovecenter/fl-pastoral-care/commit/8598aac1cf5ce7416496ca48068ffec6671c63cb))
- fix bug where sheep seekers could not access their portal ([9e7ff6a2](https://github.com/firstlovecenter/fl-pastoral-care/commit/9e7ff6a20595c8adfc0703d9ac3eff72d2f4f0db))

#### 5.8.10 (2023-02-12)

##### Documentation Changes

- update CHANGELOG.md ([ef540cad](https://github.com/firstlovecenter/fl-pastoral-care/commit/ef540cadc051fcab7285d00365989cc48408f494))
- update CHANGELOG.md ([03870c92](https://github.com/firstlovecenter/fl-pastoral-care/commit/03870c92c3bcabab4bc79e0e4886ea676bb0dc1a))
- update CHANGELOG.md ([84f989aa](https://github.com/firstlovecenter/fl-pastoral-care/commit/84f989aacda75c315e9f68e71c5110e49c6b0a70))

##### New Features

- create custom route path for sheep seeker permissions ([e0a66210](https://github.com/firstlovecenter/fl-pastoral-care/commit/e0a66210356e81bcabd3aebdc7093913d0994bf0))

##### Bug Fixes

- remove busses with attendance of zero from busses arrived count ([8598aac1](https://github.com/firstlovecenter/fl-pastoral-care/commit/8598aac1cf5ce7416496ca48068ffec6671c63cb))
- fix bug where sheep seekers could not access their portal ([9e7ff6a2](https://github.com/firstlovecenter/fl-pastoral-care/commit/9e7ff6a20595c8adfc0703d9ac3eff72d2f4f0db))

#### 5.8.10 (2023-02-12)

##### Documentation Changes

- update CHANGELOG.md ([03870c92](https://github.com/firstlovecenter/fl-pastoral-care/commit/03870c92c3bcabab4bc79e0e4886ea676bb0dc1a))
- update CHANGELOG.md ([84f989aa](https://github.com/firstlovecenter/fl-pastoral-care/commit/84f989aacda75c315e9f68e71c5110e49c6b0a70))

##### New Features

- create custom route path for sheep seeker permissions ([e0a66210](https://github.com/firstlovecenter/fl-pastoral-care/commit/e0a66210356e81bcabd3aebdc7093913d0994bf0))

##### Bug Fixes

- remove busses with attendance of zero from busses arrived count ([8598aac1](https://github.com/firstlovecenter/fl-pastoral-care/commit/8598aac1cf5ce7416496ca48068ffec6671c63cb))
- fix bug where sheep seekers could not access their portal ([9e7ff6a2](https://github.com/firstlovecenter/fl-pastoral-care/commit/9e7ff6a20595c8adfc0703d9ac3eff72d2f4f0db))

#### 5.8.10 (2023-02-12)

##### Documentation Changes

- update CHANGELOG.md ([84f989aa](https://github.com/firstlovecenter/fl-pastoral-care/commit/84f989aacda75c315e9f68e71c5110e49c6b0a70))

##### New Features

- create custom route path for sheep seeker permissions ([e0a66210](https://github.com/firstlovecenter/fl-pastoral-care/commit/e0a66210356e81bcabd3aebdc7093913d0994bf0))

##### Bug Fixes

- remove busses with attendance of zero from busses arrived count ([8598aac1](https://github.com/firstlovecenter/fl-pastoral-care/commit/8598aac1cf5ce7416496ca48068ffec6671c63cb))
- fix bug where sheep seekers could not access their portal ([9e7ff6a2](https://github.com/firstlovecenter/fl-pastoral-care/commit/9e7ff6a20595c8adfc0703d9ac3eff72d2f4f0db))

#### 5.8.10 (2023-02-12)

##### New Features

- create custom route path for sheep seeker permissions ([e0a66210](https://github.com/firstlovecenter/fl-pastoral-care/commit/e0a66210356e81bcabd3aebdc7093913d0994bf0))

##### Bug Fixes

- remove busses with attendance of zero from busses arrived count ([8598aac1](https://github.com/firstlovecenter/fl-pastoral-care/commit/8598aac1cf5ce7416496ca48068ffec6671c63cb))
- fix bug where sheep seekers could not access their portal ([9e7ff6a2](https://github.com/firstlovecenter/fl-pastoral-care/commit/9e7ff6a20595c8adfc0703d9ac3eff72d2f4f0db))

#### 5.8.9 (2023-02-09)

##### Documentation Changes

- update CHANGELOG.md ([1f9906a3](https://github.com/firstlovecenter/fl-pastoral-care/commit/1f9906a3e59f429c5416afe6731d79aa99ea41d3))
- update CHANGELOG.md ([c88d3e71](https://github.com/firstlovecenter/fl-pastoral-care/commit/c88d3e7104c824fda52ba9c8ec0a4d9f10bf01d2))

##### Bug Fixes

- update version for jd-date-utils ([fc9bd616](https://github.com/firstlovecenter/fl-pastoral-care/commit/fc9bd61602989277d13d35d591c8550274b3bd44))
- remove error breaking redundant code ([ec558444](https://github.com/firstlovecenter/fl-pastoral-care/commit/ec558444c33d0d5bf0bf6ea0cc61551ba78b1a77))
- remove redundant code ([157bd7c1](https://github.com/firstlovecenter/fl-pastoral-care/commit/157bd7c10e826b4b85c15ac1def3d3b758e7f49e))
- update auth details for new services ([e47a301c](https://github.com/firstlovecenter/fl-pastoral-care/commit/e47a301cb9ee0c866b4b34eac785b67ab0c68294))
- log financial details for debugging purposes ([23264b14](https://github.com/firstlovecenter/fl-pastoral-care/commit/23264b14d52a268cd4a47034cc0d1078fbf7ce1e))
- add a message for self banking and receipt submission list when there are no services ([0a63e014](https://github.com/firstlovecenter/fl-pastoral-care/commit/0a63e0141391cad8bcc9ca6275425ca69b320931))
- all new bacentas are started with targets ([9b4c30e5](https://github.com/firstlovecenter/fl-pastoral-care/commit/9b4c30e55a3069e7a7388551072e3943ec272f29))

##### Other Changes

- //github.com/firstlovecenter/fl-admin-portal into deploy ([de9090ee](https://github.com/firstlovecenter/fl-pastoral-care/commit/de9090ee25a997663d1dd7f5c4408a478f90c104))

#### 5.8.8 (2023-02-09)

#### 5.8.7 (2023-02-09)

##### Bug Fixes

- update version for jd-date-utils ([df30cb9b](https://github.com/firstlovecenter/fl-pastoral-care/commit/df30cb9bd8d8f82fd557044201e65e9f37b174e2))
- add a message for self banking and receipt submission list when there are no services ([0a63e014](https://github.com/firstlovecenter/fl-pastoral-care/commit/0a63e0141391cad8bcc9ca6275425ca69b320931))
- all new bacentas are started with targets ([9b4c30e5](https://github.com/firstlovecenter/fl-pastoral-care/commit/9b4c30e55a3069e7a7388551072e3943ec272f29))

#### 5.8.6 (2023-02-08)

##### Bug Fixes

- fix bug in setting of swollen sunday targets ([1d249a70](https://github.com/firstlovecenter/fl-pastoral-care/commit/1d249a704a0af0c3bc979316e134a89bb548e714))

#### 5.8.5 (2023-02-07)

#### 5.8.4 (2023-02-07)

#### 5.8.3 (2023-02-07)

#### 5.8.2 (2023-02-07)

##### Bug Fixes

- update visibility for council admins to view edit member page ([b733a6e2](https://github.com/firstlovecenter/fl-pastoral-care/commit/b733a6e20b457cce2157571406160416ae0670b8))

#### 5.8.1 (2023-02-07)

##### New Features

- finalise updates for permissions for registering members ([518af29f](https://github.com/firstlovecenter/fl-pastoral-care/commit/518af29f2011566305ab50b82712a97e77494fb1))

##### Bug Fixes

- update visibility for council admins to view add member page ([f0f8b7c9](https://github.com/firstlovecenter/fl-pastoral-care/commit/f0f8b7c9b30db881233f4a029d18462ab7d5f994))
- add permissions for campus and stream admins to register members ([e48b88e0](https://github.com/firstlovecenter/fl-pastoral-care/commit/e48b88e0fdca4e13c0abc57e67f9e897bf12f363))
- add permissions for campusAdmin and streamAdmins to create and edit members ([fa4b86a1](https://github.com/firstlovecenter/fl-pastoral-care/commit/fa4b86a135187e4e3b933a568c09c58d1fff8a1d))
- enable editing of bacenta target after swollen sunday changes final ([43398bff](https://github.com/firstlovecenter/fl-pastoral-care/commit/43398bff5950ed0052b2e95a8557db3c28462d78))
- enable editing of bacenta target after swollen sunday changes ([32672a12](https://github.com/firstlovecenter/fl-pastoral-care/commit/32672a12163a5a53a79c29f3cb7b4162f0e8daf3))
- re edit name of bussing data file ([f91cba75](https://github.com/firstlovecenter/fl-pastoral-care/commit/f91cba75020d0ae3ee1a651cd35510d204a1d550))
- change name of csv sheet for arrivals payment download ([6a5aee90](https://github.com/firstlovecenter/fl-pastoral-care/commit/6a5aee90ffa14865211e6370470e5ee8eac6c89b))
- include distinct to prevent adding error in addition ([81c3d433](https://github.com/firstlovecenter/fl-pastoral-care/commit/81c3d433a9cdda490f7c597fda3134eef3b97b33))
- fix bug where sontacard does not display numbers ([9a03a4a1](https://github.com/firstlovecenter/fl-pastoral-care/commit/9a03a4a1dd3c0a7a25d5c86d000769d01fa9e7bd))
- numberOfUrvans was not appearing due to misspelling in backend ([53f41e5b](https://github.com/firstlovecenter/fl-pastoral-care/commit/53f41e5beb0973b155044f45eca47bb197aed02c))
- change componentTargetIds to include all targets relating to date for said date ([77c62a94](https://github.com/firstlovecenter/fl-pastoral-care/commit/77c62a942a77f08d682e3b2336accbf9d0b2411a))
- add componentTargetIds to aggregateTargets and other refinements ([aad695fb](https://github.com/firstlovecenter/fl-pastoral-care/commit/aad695fb47cf1f947fafa44b7332b8dfa5ca4f6c))
- change target property on church levels to last swell taregt ([86541034](https://github.com/firstlovecenter/fl-pastoral-care/commit/86541034c42a204409c32d2d5c9268a8c70017f7))

##### Refactors

- add NoDataComponent to MultiplicationCampaignBankingSlipView ([6ac91f75](https://github.com/firstlovecenter/fl-pastoral-care/commit/6ac91f752beb089599c9a730da321d12b772b3cc))

### 5.8.0 (2023-02-07)

##### New Features

- finalise updates for permissions for registering members ([de4cbff2](https://github.com/firstlovecenter/fl-pastoral-care/commit/de4cbff26a507305a53384dfc504da065d5e2cec))

##### Bug Fixes

- add missing permissions for fellowship leaders ([e16b7c1c](https://github.com/firstlovecenter/fl-pastoral-care/commit/e16b7c1ce69997848da4a4c1b42c455e9a2ea913))
- add permissions for campus and stream admins to register members ([c94faf9e](https://github.com/firstlovecenter/fl-pastoral-care/commit/c94faf9e8299d96de2f2211aeeab98e40ed5bf18))
- add permissions for campusAdmin and streamAdmins to create and edit members ([08d6106c](https://github.com/firstlovecenter/fl-pastoral-care/commit/08d6106c7f5e0fd06dac3cc6f37e8ca6faa255f2))
- update default bussing cost to be two way instead of one way ([42510815](https://github.com/firstlovecenter/fl-pastoral-care/commit/4251081509d3e34a86de22377de78f913ff32f24))

#### 5.7.1 (2023-01-29)

##### Documentation Changes

- update README.md ([543cba7c](https://github.com/firstlovecenter/fl-pastoral-care/commit/543cba7cca5093cd2091aef2a774f191616c077f))

##### New Features

- add a card to show the busses that have arrived ([76992530](https://github.com/firstlovecenter/fl-pastoral-care/commit/7699253047fe077634dd61ede169cc6655ddd8ab))
- order bacentas arrived and bacentasUnder8 by attendance and display attendance on card ([7260c2dc](https://github.com/firstlovecenter/fl-pastoral-care/commit/7260c2dc9e98c58ca0d2ec33da044f37f53f0903))
- add sheep seeker role card to user dashboard ([6a292242](https://github.com/firstlovecenter/fl-pastoral-care/commit/6a292242263c38c58622ef82aae5637bc2457e7c))
- add sheep seeker stream to dashboard church list query ([28cc3e9e](https://github.com/firstlovecenter/fl-pastoral-care/commit/28cc3e9e5ee123b85f23f1aa2bc3b460f06bab77))
- remove permissions for a fellowship leader to register members ([d3a113e2](https://github.com/firstlovecenter/fl-pastoral-care/commit/d3a113e279d45f140bade30c196d9a2dadea2999))
- allow only sheep seekers add and delete members ([79e1441c](https://github.com/firstlovecenter/fl-pastoral-care/commit/79e1441cca7b936fe6341402834a5e3bf098e44c))
- change register member icon ([86da6faf](https://github.com/firstlovecenter/fl-pastoral-care/commit/86da6fafae2ca75619c961a213485a808a2ed39d))
- add sheep seeking to campaign list if user has stream or sheep seeking permissions ([ab86620d](https://github.com/firstlovecenter/fl-pastoral-care/commit/ab86620db0d9d85c38673961c91296ec36861be1))
- add sheep seeking flow for campus ([8dad6e53](https://github.com/firstlovecenter/fl-pastoral-care/commit/8dad6e53c55840d3b2326d74dc8fbef932b9ae4e))
- admin-498 add sheep seeking interface for sheep seekers ([a1191b43](https://github.com/firstlovecenter/fl-pastoral-care/commit/a1191b431368061377f9c2082408e40d24d45762))
- admin-503 add stream name to swollen sunday template ([ebafa9de](https://github.com/firstlovecenter/fl-pastoral-care/commit/ebafa9deeb8f4abdb9c3376d732f6c1e8fa710db))
- update auth private keys for the different services accounts ([95146084](https://github.com/firstlovecenter/fl-pastoral-care/commit/95146084d07a2af43823f71f80aec126849374ff))

##### Bug Fixes

- fix bug where a user could fill premobilisation multiple times ([74597cff](https://github.com/firstlovecenter/fl-pastoral-care/commit/74597cff15a7bb2efda225e4c047dfeb49c9f7ea))
- allow campus admin view sheep seeking dashboard ([2dedb808](https://github.com/firstlovecenter/fl-pastoral-care/commit/2dedb808522d3c1105d5039fb27f688264d18a04))
- fix bug where campus admin coesn't get shepherding control in list of campaigns ([0896a3c1](https://github.com/firstlovecenter/fl-pastoral-care/commit/0896a3c15aa8696f66af4d3055c7d2ce7a406a83))
- remove redundant current history in uploadbacenta targets cypher ([b4bd53b6](https://github.com/firstlovecenter/fl-pastoral-care/commit/b4bd53b6b93cf369938913cba4afab447d462f91))
- admin-509 fix target sharing ([6c2ccfab](https://github.com/firstlovecenter/fl-pastoral-care/commit/6c2ccfabb57f76fce6a98d2a4905f6bf13712729))
- remove option for private car in bussing form ([7ba3f153](https://github.com/firstlovecenter/fl-pastoral-care/commit/7ba3f15376c817da112f0122befe898429e916da))
- remove unnecessary throwToSentry call ([b223a20b](https://github.com/firstlovecenter/fl-pastoral-care/commit/b223a20b4874f7009b92129f58bab68f2566d298))

##### Refactors

- resolve merge conflicts ([33908fac](https://github.com/firstlovecenter/fl-pastoral-care/commit/33908fac8bf1010c1b6c900f535f59b52e47e8bc))

### 5.7.0 (2023-01-25)

##### New Features

- admin-504 implement campus swollen sunday drill down ([18653725](https://github.com/firstlovecenter/fl-pastoral-care/commit/18653725f0851486d502c72b89dac8e099ea1307))
- admin-488 add fields checker to upload targets mutation ([5844ee6c](https://github.com/firstlovecenter/fl-pastoral-care/commit/5844ee6c15927ac5ddd375e7e0a3140434b9f5d7))
- admin-499 check frontend to ensure excel fields are not empty when uploading bacenta targets ([69058e65](https://github.com/firstlovecenter/fl-pastoral-care/commit/69058e65a05277106ebddc76e1d89f5397fbbb9a))
- implement icons for all buttons on the campaign pages ([e30e9f05](https://github.com/firstlovecenter/fl-pastoral-care/commit/e30e9f05d37ac5f58bc4e303ebf86e37c1dcfb80))
- add property for average weekly income ([dc5bb814](https://github.com/firstlovecenter/fl-pastoral-care/commit/dc5bb814ba70d84c8165a7156114542361bda0a3))
- add shepherding control campaign ([203e9e8d](https://github.com/firstlovecenter/fl-pastoral-care/commit/203e9e8d29fe40efd698bde8626f24ba980fe49f))
- add queries for shepherding control backend ([afdc0a9a](https://github.com/firstlovecenter/fl-pastoral-care/commit/afdc0a9a0c4ae575419849993214c9154e2c6628))
- add display all ic bacentas page ([50895bba](https://github.com/firstlovecenter/fl-pastoral-care/commit/50895bbaa51d5fc86717893bdb5e5edf04225be1))
- admin-483 add a card to show the number of ICs at all level ([280b5114](https://github.com/firstlovecenter/fl-pastoral-care/commit/280b511445a7f9ed27c40b126278bd75eed41e8a))
- admin-484 implement backend so as to add a card to show the number of ICs at all level ([11ab9b7d](https://github.com/firstlovecenter/fl-pastoral-care/commit/11ab9b7dbf0ab7d41c640970e5e542e5bd1cbf6e))
- admin-484 add ic property and ic active and vacation counts ([bc673dec](https://github.com/firstlovecenter/fl-pastoral-care/commit/bc673decefd4e42d09651b082cf5a026d3783056))

##### Bug Fixes

- prevent multiple errors from one upload ([2576fcca](https://github.com/firstlovecenter/fl-pastoral-care/commit/2576fccae802b8f523ab3e6fa75f8d9037078c7d))
- correct years in cypher query and add optional matching ([5cf3dee6](https://github.com/firstlovecenter/fl-pastoral-care/commit/5cf3dee684c756642725c9636689938e2edad3b9))
- change share bacenta targets cypher to use last 4 bussing records for averages ([6ba9f537](https://github.com/firstlovecenter/fl-pastoral-care/commit/6ba9f537cbcbcd70f0245c7b09467b5a19386159))
- add active to all Graduated bacenta cypher statements ([7afe69f3](https://github.com/firstlovecenter/fl-pastoral-care/commit/7afe69f34851f009206e7aeb8cf8723325ee1b4b))
- change name from ics to icBacentas and add graduatedBacenta query ([36011dde](https://github.com/firstlovecenter/fl-pastoral-care/commit/36011dde18d96d039a7323b0a601275ef1ab7d8a))
- add limit as an arguement to bacentas and ics ([92398304](https://github.com/firstlovecenter/fl-pastoral-care/commit/9239830450ef0138230306740fe64bee9972b712))
- change name of property for easier identification in the future ([211e16bf](https://github.com/firstlovecenter/fl-pastoral-care/commit/211e16bf64f8286ed6b703e834b450d85c42b8a5))
- add component record Ids to Aggregate Bussing Record ([bc856c06](https://github.com/firstlovecenter/fl-pastoral-care/commit/bc856c0635da1a524a4cb3e99872b3bbe80da97e))
- add component record Ids to Aggregate Service Record ([6d3d2f40](https://github.com/firstlovecenter/fl-pastoral-care/commit/6d3d2f40d3304057773e370bda165b5bfab8df34))

##### Other Changes

- Bacenta ([216b1df2](https://github.com/firstlovecenter/fl-pastoral-care/commit/216b1df279fb9de40ee41af71960b7ab5fe4007e))

##### Refactors

- separate values in FloatingLabelFormControl with commas ([abcf6e1b](https://github.com/firstlovecenter/fl-pastoral-care/commit/abcf6e1b38d9417564476a56343e6d3ee88feb7d))
- change labels for stats till date page ([edd01356](https://github.com/firstlovecenter/fl-pastoral-care/commit/edd01356674dc1c1ff96b95f0686e8c3fdd2404a))

#### 5.6.1 (2022-12-23)

##### New Features

- admin-493 show swollen sunday graphs on render ([f5cdba10](https://github.com/firstlovecenter/fl-pastoral-care/commit/f5cdba1044f1900c0f498727c6dbad1b37f5d7f6))
- admin-489 implement a loader on a church graph page ([bb8e4864](https://github.com/firstlovecenter/fl-pastoral-care/commit/bb8e4864329ac8566ac6aa4f3a063b338c47e8b6))
- add heading to Swollen Sunday church list page ([9fe99479](https://github.com/firstlovecenter/fl-pastoral-care/commit/9fe994792aad6dcf596ebbca9099d2f2c893bb49))

##### Bug Fixes

- admin-492 fix order in which swell stats are returned ([a4b87fe2](https://github.com/firstlovecenter/fl-pastoral-care/commit/a4b87fe299afb58f3b5ae86b58b7d08906f60c1d))

### 5.6.0 (2022-12-22)

##### Bug Fixes

- add correct spacing to history log ([c00b53ec](https://github.com/firstlovecenter/fl-pastoral-care/commit/c00b53ece4c8beff0e39f9c7ffe0a502ca6d5f5e))
- unhandled if statement ([788741f5](https://github.com/firstlovecenter/fl-pastoral-care/commit/788741f5dbff415ea3ca08a0112c7bd7d72c24d0))
- add history log to track change in bacenta status ([82207ce0](https://github.com/firstlovecenter/fl-pastoral-care/commit/82207ce08f5d4c8d55b41243d412040b83c215f9))
- pass correct argument to cypher calculating aggregate service ([dca064e2](https://github.com/firstlovecenter/fl-pastoral-care/commit/dca064e2058af3be74b6a2d476b12722a9d8a432))
- fix error in cypher where aggregate service records were not being recorded properly ([6a337d0c](https://github.com/firstlovecenter/fl-pastoral-care/commit/6a337d0cceb37cd71c75c4115cfd397a55dee37b))

##### Refactors

- placed bacenta status cypher within arrivals folder ([62474226](https://github.com/firstlovecenter/fl-pastoral-care/commit/62474226104887e32fde4bdbb5dba11665c6777e))

### 5.5.0 (2022-12-13)

##### Chores

- version bump ([1ff6d836](https://github.com/firstlovecenter/fl-pastoral-care/commit/1ff6d836f32ab48c29e159b0029700ef0fda7c4f))
- migration change @computed to @customResolver in api ([e458d7ce](https://github.com/firstlovecenter/fl-pastoral-care/commit/e458d7ce336e340cde0e3731599ada3929f65451))

##### New Features

- add queries for constituency/coucil bankedThisWeek to rest of churches ([715110c2](https://github.com/firstlovecenter/fl-pastoral-care/commit/715110c23e72b8ac8e847cc2a8e0013c2afc77ea))
- implement pages to show joint services which have been banked ([1369ca8d](https://github.com/firstlovecenter/fl-pastoral-care/commit/1369ca8d7313bbc9d30abd6dc0169f19e72508b6))
- add cards for showing banked joint services this week ([d146c7b9](https://github.com/firstlovecenter/fl-pastoral-care/commit/d146c7b96b8b5bb5588fdb55623111bc8ae25afe))
- add backed query for constituencyBankedThisWeek and CouncilBankedThisWeek ([d5e7d15d](https://github.com/firstlovecenter/fl-pastoral-care/commit/d5e7d15d1b9201a6d9c5b3b54c6712e65a0ed1a1))
- add a divider to defaulters screen ([38d3044f](https://github.com/firstlovecenter/fl-pastoral-care/commit/38d3044f945588404a3c27fa9abaa8f883741266))
- admin-476 admin-477 add queries for list for constituency/council joint service ([cbd0f4cb](https://github.com/firstlovecenter/fl-pastoral-care/commit/cbd0f4cb5e6d676d0f164d3e6b95125a1a560147))

##### Bug Fixes

- fix error with data aggregation ([ecc0bfc7](https://github.com/firstlovecenter/fl-pastoral-care/commit/ecc0bfc744e7a1e636917a0e755a765e44213730))
- final touches for defaulters view ([700a8239](https://github.com/firstlovecenter/fl-pastoral-care/commit/700a82394a99529ae83e9380050dfd33544694ea))
- stop firing error messages to sentry that should be alerts to the user ([f4b67165](https://github.com/firstlovecenter/fl-pastoral-care/commit/f4b6716561ac76fb638e47b5a199a6c50ff0ecf4))
- hide 'undefined undefined' when there is need to show stream ([aa9ec4ce](https://github.com/firstlovecenter/fl-pastoral-care/commit/aa9ec4ce321e18b1dfaa1f8f8b5414eb2ab45a30))
- automate bacenta status ([da1ac20d](https://github.com/firstlovecenter/fl-pastoral-care/commit/da1ac20dcb3bd1ff8126dfe5a86459a6ef09a646))

#### 5.3.22 (2022-12-11)

##### New Features

- implement constituency banking screens for stream, council ([40abc687](https://github.com/firstlovecenter/fl-pastoral-care/commit/40abc6871d4bf4d328f74443b11b407acc08ea51))
- implement constituency banking defaulters list ([cad167c6](https://github.com/firstlovecenter/fl-pastoral-care/commit/cad167c60e85700eb79397a5829b91ab8534ce73))
- add councilThisWeekBankingDefaulters ([e955a5b1](https://github.com/firstlovecenter/fl-pastoral-care/commit/e955a5b12dac042606454dadb1d4cdb589dc83aa))
- implement constituency banking defaulters ([2a6fe698](https://github.com/firstlovecenter/fl-pastoral-care/commit/2a6fe69845d111fa2faeb137449b618bf48539fc))
- admin-471 admin-472 implement queries to retrieve constituency and council banking defaulters ([f2a8cd4f](https://github.com/firstlovecenter/fl-pastoral-care/commit/f2a8cd4f9dc7c1ee12a0169cd1b1138b162eb7fb))

##### Bug Fixes

- remove form validation on graduation status ([49f184dc](https://github.com/firstlovecenter/fl-pastoral-care/commit/49f184dc1b5708cb374fe63bc643722d240afb6e))
- add council joint service defaulters cards and screens ([c9dce930](https://github.com/firstlovecenter/fl-pastoral-care/commit/c9dce9308dcd507d987132f3959f083c273c1bf5))
- fix cypher error in councilbanking defaulters query ([e1a5c4bc](https://github.com/firstlovecenter/fl-pastoral-care/commit/e1a5c4bc6b56c951f5f067f6a133a4c9ba90acf0))
- attempt a new approach at aggregating service data damning the db hits ([1fec7bea](https://github.com/firstlovecenter/fl-pastoral-care/commit/1fec7beaadff5b0b3cbbc116b634c84575e77160))

#### 5.3.21 (2022-12-09)

##### Bug Fixes

- correct navigation to self banking payment page ([fa9fa345](https://github.com/firstlovecenter/fl-pastoral-care/commit/fa9fa3456e30664bb11583601682f14f9bede5bd))
- add permission for constituency admin to confirm offering payment ([84f69184](https://github.com/firstlovecenter/fl-pastoral-care/commit/84f6918452fb1ecb9accb18afe1e45ac8cefa797))

#### 5.3.20 (2022-12-09)

##### Bug Fixes

- clean up flow for self banking for constituencies ([7e96c840](https://github.com/firstlovecenter/fl-pastoral-care/commit/7e96c840ab76df39aa035b71285546f0f0ecb45f))

#### 5.3.19 (2022-12-09)

##### Bug Fixes

- solve issue where constituency transactionStatuses were not showing ([1ecc6db8](https://github.com/firstlovecenter/fl-pastoral-care/commit/1ecc6db88b1f6385b2a5ea2454797717222efb9a))

#### 5.3.18 (2022-12-09)

##### Bug Fixes

- add backend permissions for constituency admin to use self banking ([448aa3b9](https://github.com/firstlovecenter/fl-pastoral-care/commit/448aa3b9c8e9c9fbba944a3f2c7b5aa33452d04a))
- remove trailing decimal on charges ([4afc5673](https://github.com/firstlovecenter/fl-pastoral-care/commit/4afc5673561a0c4cd3c0b433b735f3e9197f7f7d))

#### 5.3.17 (2022-12-09)

##### Bug Fixes

- update permissions for adminConstituency to do self banking for constituency services ([0e3ac794](https://github.com/firstlovecenter/fl-pastoral-care/commit/0e3ac7949275b51e75d8b0ec4ccd98cba4c024d8))

#### 5.3.16 (2022-12-09)

##### Bug Fixes

- fix breaking change in incomeCharges data type ([dd898e7e](https://github.com/firstlovecenter/fl-pastoral-care/commit/dd898e7e41cc151628ff80ec9866c25c17437629))
- remove trailing decimals on charges, round to 2 dp ([9acac02c](https://github.com/firstlovecenter/fl-pastoral-care/commit/9acac02c5ed4936ee85dd16b3e395cd5ed743867))
- allow RemoveServant cypher to run when closing down bacenta and constituency ([a4777415](https://github.com/firstlovecenter/fl-pastoral-care/commit/a47774156a500d89dba3486882a3d6a8c4dd4948))
- allow RemoveServant cypher to run when closing down fellowship ([38ca1e07](https://github.com/firstlovecenter/fl-pastoral-care/commit/38ca1e0774e3ba2bc9025306e24918bfaa617318))
- update permissions so that all roles can update emails ([d24eff83](https://github.com/firstlovecenter/fl-pastoral-care/commit/d24eff83ca841fab078fd5689abfc3c1558bcc87))
- implement initialisation of pastoral care values when creating members ([ee367d4b](https://github.com/firstlovecenter/fl-pastoral-care/commit/ee367d4be900c53925302c634a1198576a7774e2))

#### 5.3.15 (2022-12-07)

##### Chores

- version bump ([c157684e](https://github.com/firstlovecenter/fl-pastoral-care/commit/c157684e58fe97d69ce9b8868929ddd77ec0aa6a))

##### New Features

- automate bacenta status ([766d44d8](https://github.com/firstlovecenter/fl-pastoral-care/commit/766d44d81b88b1241d528732e53c03fbd1c0b478))
- automate bacenta status ([634f1763](https://github.com/firstlovecenter/fl-pastoral-care/commit/634f1763f0aa8eef38a94edb6913a5aad6688576))
- automate bacenta status ([5e124af2](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e124af2cc7d35262cbcfaa31c159d19e3f65c29))
- set-bacenta-status ([0621c8aa](https://github.com/firstlovecenter/fl-pastoral-care/commit/0621c8aa3cdf14c5dc0e57b542492c84ea6a8415))
- resolvers for set-bacenta-status ([ad56a890](https://github.com/firstlovecenter/fl-pastoral-care/commit/ad56a890addf4f47ea72894cd4a5a803d421690a))
- set bacenta status to IC or graduated ([8da3e61f](https://github.com/firstlovecenter/fl-pastoral-care/commit/8da3e61f7768dd0644b4114e2ee6e205df9d2776))

##### Bug Fixes

- resolve merge conflict merging automated bacenta status ([ffe11920](https://github.com/firstlovecenter/fl-pastoral-care/commit/ffe11920511445b45272eed81c9b3ad471c9447f))
- resolve merge conflict merging deploy into pr 355 ([4ac4ee0f](https://github.com/firstlovecenter/fl-pastoral-care/commit/4ac4ee0f8ba38b6a59af99c8ef4c28a93dd8998a))
- fix bug preventing teller and sheep seekers from being removed final ([9cca4090](https://github.com/firstlovecenter/fl-pastoral-care/commit/9cca40901095bba57f1faff2b7ad2717a514d49f))
- fix bug preventing teller and sheep seekers from being removed ([be136933](https://github.com/firstlovecenter/fl-pastoral-care/commit/be13693332cf1246bda810b0a21b15b5c1352c5f))
- solve issue where people can't self bank constituency services ([b0d0000f](https://github.com/firstlovecenter/fl-pastoral-care/commit/b0d0000f3567a17b1b7ac62dd58e9b48f7771a4c))
- remove unused import in bacentaform.tsx ([64c15d22](https://github.com/firstlovecenter/fl-pastoral-care/commit/64c15d2299446d4949987ede787920dc2e273931))
- remove option to change bacenta status from bacenta update form ([a7e7a18d](https://github.com/firstlovecenter/fl-pastoral-care/commit/a7e7a18d8d42bf33e3b30746e3a20704fce13182))
- merge conflicts by accepting changes from remote ([afb338eb](https://github.com/firstlovecenter/fl-pastoral-care/commit/afb338ebb2b2f9065493c84a51d236f7ce349478))
- cypher query to check if member exists ([25f06424](https://github.com/firstlovecenter/fl-pastoral-care/commit/25f06424e3d8ccfe8aea65b4ce366004bb0caf50))

#### 5.3.9 (2022-12-04)

##### Bug Fixes

- remove non alphanumeric characters from image filename ([2088c868](https://github.com/firstlovecenter/fl-pastoral-care/commit/2088c868e4831b7ffef9a4f2302310d9a3e7acf9))
- fix bug preventing council arrivals admins from being changed ([8eb0a34b](https://github.com/firstlovecenter/fl-pastoral-care/commit/8eb0a34b860bbbe1ec0e2d8c41a60ad15023e58a))

#### 5.3.8 (2022-12-04)

##### New Features

- support search for leaders as well as churches in churchSearch ([37310fcb](https://github.com/firstlovecenter/fl-pastoral-care/commit/37310fcbfaf8778b784ae807453f491eb028e51a))
- add banking slip to multiplication details page ([b44a7722](https://github.com/firstlovecenter/fl-pastoral-care/commit/b44a77220fd3c41b36ed45ac719d7d24ae8e7e69))
- implement upload multiplication banking receipts ([fbe9acb2](https://github.com/firstlovecenter/fl-pastoral-care/commit/fbe9acb242a8402f462abab00bdd05e77d49c653))
- admin-448 mutation for uploading banking slip ([4abc1e83](https://github.com/firstlovecenter/fl-pastoral-care/commit/4abc1e83215740e6e8d0abf401823ca92b899cfe))

##### Bug Fixes

- add in support for holy ghost encounter ([3d37eada](https://github.com/firstlovecenter/fl-pastoral-care/commit/3d37eadab27483dea0c2d29ab5dbfc1b88c32106))
- add bankingSlip property to multiplication record ([f89748d4](https://github.com/firstlovecenter/fl-pastoral-care/commit/f89748d40a68ef770b89e25d14239c3b214a3c4c))
- correct query name mistake in multiplication queries ([cd291017](https://github.com/firstlovecenter/fl-pastoral-care/commit/cd29101735b544cbe98c330e4474ed9b6fb6d01e))

#### 5.3.7 (2022-12-01)

##### New Features

- implement multiplication crusade trends ([#353](https://github.com/firstlovecenter/fl-pastoral-care/pull/353)) ([13bffea1](https://github.com/firstlovecenter/fl-pastoral-care/commit/13bffea1fab26f041c2a1c835d3af0d9aa4cb9e3))

##### Bug Fixes

- fix bug where roles of old admins were not being removed ([e97fc758](https://github.com/firstlovecenter/fl-pastoral-care/commit/e97fc7587e8e6aa9eefa3093e30c38529a21d744))
- improve width for form attendance confirmation picture ([01c59645](https://github.com/firstlovecenter/fl-pastoral-care/commit/01c59645ea38a692255a7801a519637dadcfe66c))

#### 5.3.6 (2022-11-26)

#### 5.3.5 (2022-11-26)

##### Bug Fixes

- implement padding for vehicle form details ([1662b083](https://github.com/firstlovecenter/fl-pastoral-care/commit/1662b083b78a0b258259b1348672f387818cf9a0))
- prevent people from filling vehicle data using the time change hack on the client ([53c945a2](https://github.com/firstlovecenter/fl-pastoral-care/commit/53c945a2ba5163aa23e37cbc58ebc07df528d446))
- add time form was filled to vehicle count ([dd2defca](https://github.com/firstlovecenter/fl-pastoral-care/commit/dd2defca617abdc75320304e2230737b64d0361b))

##### Other Changes

- //github.com/firstlovecenter/fl-admin-portal into deploy ([f81e1bb7](https://github.com/firstlovecenter/fl-pastoral-care/commit/f81e1bb744aed2ccde7b17d9661808f767bcefdf))

#### 5.3.4 (2022-11-26)

##### Bug Fixes

- remove bug preventing viewing self banking details ([617f2296](https://github.com/firstlovecenter/fl-pastoral-care/commit/617f2296141062ef802798935b16295ac59a304b))
- improve padding on service details page ([6e129344](https://github.com/firstlovecenter/fl-pastoral-care/commit/6e129344168b1e3b24851b4935da8b594f68cf8e))
- implement padding for vehicle details ([e358c6f2](https://github.com/firstlovecenter/fl-pastoral-care/commit/e358c6f2a13d6b3408c4b299ddaae1b166f054ec))
- enable deleting arrivals counters ([3c20f46d](https://github.com/firstlovecenter/fl-pastoral-care/commit/3c20f46d7f1933d3c067cdae39710628d223442c))
- fix bug in submit banking slip function ([c62f8c98](https://github.com/firstlovecenter/fl-pastoral-care/commit/c62f8c98870eb3a1a99ed2bdc3623983ceb14d52))
- fix sentry error reporting error when it should display a user message ([f94355c2](https://github.com/firstlovecenter/fl-pastoral-care/commit/f94355c2e750ca7591129a7d913bafe94e31a8a6))
- adjust image size for vehicle pictures ([801005d3](https://github.com/firstlovecenter/fl-pastoral-care/commit/801005d3e6b4ff32b5346a6355b6950534d1c97d))
- fix error where service from the same week but different year were added to aggregate ([86b3b959](https://github.com/firstlovecenter/fl-pastoral-care/commit/86b3b959920253acf58cad325bd817bda16680f1))
- fix error calculating self banking charges to the 2nd decimal place ([e32a699c](https://github.com/firstlovecenter/fl-pastoral-care/commit/e32a699c3e056d3180b0ead7a28d8c01bb7100f3))
- remove block button on service details page ([4f145563](https://github.com/firstlovecenter/fl-pastoral-care/commit/4f145563200a5c9c3bd200795c33bc5e5617d141))
- remove typedef breakiing the build ([e34cf863](https://github.com/firstlovecenter/fl-pastoral-care/commit/e34cf863e5afb36bf7182ce65a5f8af8375e52dc))
- downgrade npm packages ([bbd2b601](https://github.com/firstlovecenter/fl-pastoral-care/commit/bbd2b601b612d2b5a079d0b7ca80a25eee2fc1b3))
- implement block button for viewing banking details ([e96dcfef](https://github.com/firstlovecenter/fl-pastoral-care/commit/e96dcfefdfd3638e814c8bab1030517d53e9278d))

#### 5.3.3 (2022-11-23)

##### Chores

- update package-lock.json file ([00e3b858](https://github.com/firstlovecenter/fl-pastoral-care/commit/00e3b858d809db8179212068c12dcbad99366b86))

##### Bug Fixes

- implement validation for momo number on offering payment ([9a8f6ae7](https://github.com/firstlovecenter/fl-pastoral-care/commit/9a8f6ae7a0d3713045e4e674691dcd5152e60cb6))

#### 5.3.2 (2022-11-22)

##### New Features

- implement apollo client query retry ([ab2504ab](https://github.com/firstlovecenter/fl-pastoral-care/commit/ab2504ab8895bf9a506401fee1e2f469780bdf2b))

##### Bug Fixes

- remove functionality to report to sentry when a query returns no data ([dcdfe32d](https://github.com/firstlovecenter/fl-pastoral-care/commit/dcdfe32d6cb5e7ebe5f2d7572a0576c271fd3b7c))

#### 5.3.1 (2022-11-20)

##### New Features

- implement visible charges when using the self banking feature ([db940ba6](https://github.com/firstlovecenter/fl-pastoral-care/commit/db940ba6565a44d4ebb9ec828eadecb95b8e11d3))

##### Bug Fixes

- make all members leaders ([d248278b](https://github.com/firstlovecenter/fl-pastoral-care/commit/d248278b9676437b0f07b01445fab34c5edc846f))
- add momo name to arrivals payment excel sheet ([c1039261](https://github.com/firstlovecenter/fl-pastoral-care/commit/c1039261dcafc2f4b864e371a19ec47caace13ec))
- order arrivals payment sheet by society ([7e2e8eb3](https://github.com/firstlovecenter/fl-pastoral-care/commit/7e2e8eb3b98d311e77d73c2bf7b0e748dacf2c63))
- add momo number to arrivals payment excel sheet ([2c2f0497](https://github.com/firstlovecenter/fl-pastoral-care/commit/2c2f0497a447eac980f4dc9541a96d32635b7c58))
- remove unnecessary comma from before next update file ([471d1f91](https://github.com/firstlovecenter/fl-pastoral-care/commit/471d1f9153b752d4e4c213990665e55827cf37e7))
- change bacenta.bacentaCode property on bacenta to bacenta.code ([20598d23](https://github.com/firstlovecenter/fl-pastoral-care/commit/20598d235a912fdd08beddcf04883861362070e4))
- import bacenta codes from Lp Ivy's list ([86008015](https://github.com/firstlovecenter/fl-pastoral-care/commit/86008015e4dbcf280fe24b11c5ba9e341631a6ef))
- update banking slip mutation so that admins can use it ([ff4272f8](https://github.com/firstlovecenter/fl-pastoral-care/commit/ff4272f814ca3423ecb10fd1a3f9950c4ec2af8d))
- capitalise arrivals payment data filename ([51b3f0c0](https://github.com/firstlovecenter/fl-pastoral-care/commit/51b3f0c0a26c5749df5c36664880bf97b31b7de8))
- update code that forms leader relationships ([a0916ec1](https://github.com/firstlovecenter/fl-pastoral-care/commit/a0916ec1563e3af171d6a7a1049b9aca46f53f64))
- remove unnecessary code in setupDevInstance ([53e9511c](https://github.com/firstlovecenter/fl-pastoral-care/commit/53e9511c2be1fd37403eea034f76ad2d536ae1c4))

### 5.3.0 (2022-11-18)

##### New Features

- implement a table in the frontend to display the data for the bussing of that day ([d5ff00aa](https://github.com/firstlovecenter/fl-pastoral-care/commit/d5ff00aaf797641a4b81b979b63041683ad866fd))
- admin-418 add cypher to retrieve bussing data per stream ([5bf39c21](https://github.com/firstlovecenter/fl-pastoral-care/commit/5bf39c21dc9d1f2f6d4b1d8c00be57c98cfeb7e2))
- admin-416 add cypher to import bussing topups ([f01af476](https://github.com/firstlovecenter/fl-pastoral-care/commit/f01af476abe4abb0c871c7172de3a35c6c197da0))
- admin-417 add cypher to create bussing society nodes ([9a59e271](https://github.com/firstlovecenter/fl-pastoral-care/commit/9a59e271e2e5bafc2a685db8fad6720387961fe5))
- admin-415 add town codes and edit createbacenta mutation to create codes for new bacentas ([ef7e2819](https://github.com/firstlovecenter/fl-pastoral-care/commit/ef7e2819fd77668812a3001c0f4797d3fd53ce07))

##### Bug Fixes

- fix error in resolvers.ts where stream resolvers was being overwritten ([67f8b170](https://github.com/firstlovecenter/fl-pastoral-care/commit/67f8b170423ea105c5ef50b9964432baf46697e1))
- clean up cypher query for fetching bussing data ([85539891](https://github.com/firstlovecenter/fl-pastoral-care/commit/855398911eb544b297b5e00ab35cb16f12247983))
- remove unused comments ([7c2f07f4](https://github.com/firstlovecenter/fl-pastoral-care/commit/7c2f07f4772095b6ce4964267206b0adbefb9fa2))
- implement fix for rearrangeCypher Object to return table-like data as an array of objects ([657673a7](https://github.com/firstlovecenter/fl-pastoral-care/commit/657673a7a1a2d6fe6f1976e76faafe79301b34eb))

#### 5.2.13 (2022-11-18)

##### New Features

- admin-422 add cypher scripts for members and churches in test env script ([79688e24](https://github.com/firstlovecenter/fl-pastoral-care/commit/79688e2468361b6ffa4724755ff0f34558ddf65a))
- admin-430 replace telepastoring with shepherding control from bacenta upwards ([a312c4f7](https://github.com/firstlovecenter/fl-pastoral-care/commit/a312c4f7e68f716d3e55011c5e3a402afdb3baa1))

##### Bug Fixes

- edit mutation so that users can really register members without emails ([485d84f2](https://github.com/firstlovecenter/fl-pastoral-care/commit/485d84f20195562fa16074c1b71e4ef6d3e6e8f0))
- add Martha Adomako's email to list of testers ([30c64452](https://github.com/firstlovecenter/fl-pastoral-care/commit/30c64452a39bb2beed41d07b4ce64771c972c676))

#### 5.2.12 (2022-11-11)

##### Bug Fixes

- fix issue where joint service calculation was getting mangled ([df3d2a32](https://github.com/firstlovecenter/fl-pastoral-care/commit/df3d2a32385e85593c14982c5c1373e6973eb214))

#### 5.2.11 (2022-11-09)

##### Bug Fixes

- fix issue where joint services where not being added in aggregate service record ([afbfffa4](https://github.com/firstlovecenter/fl-pastoral-care/commit/afbfffa4269acd8bc26edf3ef9103a4d6f697f87))
- fix broken link to sheep seeking graphql file ([fdfbca89](https://github.com/firstlovecenter/fl-pastoral-care/commit/fdfbca89c15c73faf71c6028b443efc6ff18c3b9))

#### 5.2.10 (2022-11-08)

##### Chores

- edited readme file ([45f3c75c](https://github.com/firstlovecenter/fl-pastoral-care/commit/45f3c75c2cdb841bc911c1ae427d5e298cb21353))

##### New Features

- add a sheep seeker flow to the frontend ([9ac69447](https://github.com/firstlovecenter/fl-pastoral-care/commit/9ac694473d57a7abb761cfdbfe5bdcd15d70080d))
- add sheep seeking campaign to list of campaings from stream upwards ([ddb40e33](https://github.com/firstlovecenter/fl-pastoral-care/commit/ddb40e33581f5ae8bcfeff5e45eba0ab85e2469f))
- add make and remove stream sheep seeker mutations ([10432c9d](https://github.com/firstlovecenter/fl-pastoral-care/commit/10432c9d75324a1a81492be1265fb92e3ef6a2e4))

##### Bug Fixes

- fixed 'no bussing details' crash' ([1e3686e0](https://github.com/firstlovecenter/fl-pastoral-care/commit/1e3686e07d96aa393389d64a6eb38443ebf0fc45))
- adjust image dimensions for vehicle pictures ([a6c4a4fc](https://github.com/firstlovecenter/fl-pastoral-care/commit/a6c4a4fc1bcb4dde5ef71ca2a5f8ce24f1446073))
- remove email as an optional field for registering members ([ec67822c](https://github.com/firstlovecenter/fl-pastoral-care/commit/ec67822c6497fa248730eb92d3102d97ec88bbc6))
- cypher query to check if member exists ([4c087da8](https://github.com/firstlovecenter/fl-pastoral-care/commit/4c087da83b9042e62abd01a4af1e30d93329f33e))
- remove scheduled-data aggregation function ([8da6576b](https://github.com/firstlovecenter/fl-pastoral-care/commit/8da6576b760422c282e0d5605692f4f654c073ca))
- optimise ux flow for send otp ([bcd2633b](https://github.com/firstlovecenter/fl-pastoral-care/commit/bcd2633b199912f7afb1cc7c6252de83df0f324d))
- implement handling for abandoned transactions ([5bb5be2f](https://github.com/firstlovecenter/fl-pastoral-care/commit/5bb5be2f30207655f98a37db4564727d04d05a77))
- remove placeholder loading for council, stream, gathering pages ([d7ea1c44](https://github.com/firstlovecenter/fl-pastoral-care/commit/d7ea1c44ce5a383d2e0aaf59e9b7d2e8e1b06ddb))

##### Refactors

- rename sheep-seeking.graphql to campaigns-sheep-seeking.graphql ([b3b901f2](https://github.com/firstlovecenter/fl-pastoral-care/commit/b3b901f2c8789da1f2c1dad6068c75a6139694b0))

#### 5.2.9 (2022-10-30)

##### Bug Fixes

- remove tilde from image filenames being uploaded ([97a1bc22](https://github.com/firstlovecenter/fl-pastoral-care/commit/97a1bc223f3e2de71e040355d0eb6aa932ca3815))
- fix bug preventing seconds from showing when value is 0 ([a140fa7b](https://github.com/firstlovecenter/fl-pastoral-care/commit/a140fa7bd1b02541a57878436a5d2151527163ff))

#### 5.2.8 (2022-10-29)

##### Bug Fixes

- prefer <> to <React.Fragment> syntax ([ab58d4be](https://github.com/firstlovecenter/fl-pastoral-care/commit/ab58d4bee33dd34e24a01e36a569deab839b0d93))
- place loader in the pop up on confirm anagkazo banking page ([dace8d1b](https://github.com/firstlovecenter/fl-pastoral-care/commit/dace8d1b526484060539c230a0c5287b67052db9))
- add ability to handle abandoned state ([0f9a3db7](https://github.com/firstlovecenter/fl-pastoral-care/commit/0f9a3db7947613bee1abd8e0aecd262d5a256786))
- fix check already filled cypher for services to also check for year ([fff1eebe](https://github.com/firstlovecenter/fl-pastoral-care/commit/fff1eebe91c893389ebc4ad00cd7ab2bda52796c))

#### 5.2.7 (2022-10-25)

##### Bug Fixes

- fix bug breaking the build ([61747833](https://github.com/firstlovecenter/fl-pastoral-care/commit/61747833194b05c4992ccf8d00e078972ce7f5fb))
- adjust paystack calculation for trailing pesewa decimals ([01d22dfb](https://github.com/firstlovecenter/fl-pastoral-care/commit/01d22dfb992135a577607e84dbb52e0fda3b4815))

#### 5.2.6 (2022-10-22)

##### Bug Fixes

- implement check current history on filling bacenta form ([b5078da4](https://github.com/firstlovecenter/fl-pastoral-care/commit/b5078da44b2f21ab88adc79fe4a248b2bdeef6e6))
- update directory lock to include creation of churches ([25df27be](https://github.com/firstlovecenter/fl-pastoral-care/commit/25df27be5c03f316fcb237f494ade5a93c304c39))

#### 5.2.5 (2022-10-22)

##### Bug Fixes

- improve handling of upload for files with spaces in ([ef6ace00](https://github.com/firstlovecenter/fl-pastoral-care/commit/ef6ace0037cee104cf63be3ebff7f08e0fc79850))
- fix ux bugs for paystack edge cases ([98499789](https://github.com/firstlovecenter/fl-pastoral-care/commit/9849978932df99f53f2302dc76fc4e175e5c7e12))

#### 5.2.4 (2022-10-21)

##### Bug Fixes

- fix bug with anagkazo defaulters ([e301e45c](https://github.com/firstlovecenter/fl-pastoral-care/commit/e301e45c080f6731a28e809306530aac5fb33cec))
- update dev set up cypher ([5aa6aa7e](https://github.com/firstlovecenter/fl-pastoral-care/commit/5aa6aa7e59890fcfc1a46b25a5591080b3d61416))
- add configs to set up dev instance cypher ([f3880cbc](https://github.com/firstlovecenter/fl-pastoral-care/commit/f3880cbc5f166ce6dac4530b35df864f89457e4b))
- set transaction status as pending even before transactionReference is gotten from paystack ([6866ad2d](https://github.com/firstlovecenter/fl-pastoral-care/commit/6866ad2d60c14606cfb5c618bf913c210c83d8f2))
- correct issue where already banked service ids were being passed to confirm banking ([c74ea528](https://github.com/firstlovecenter/fl-pastoral-care/commit/c74ea52824caddf4694476f794e4cb3ccf9e8266))
- add a parser for foreign Currency to remove 00 and other strange values ([1d0bcc3d](https://github.com/firstlovecenter/fl-pastoral-care/commit/1d0bcc3d42c2201fd6889b339c3373a0c1c6e61f))

#### 5.2.3 (2022-10-21)

##### New Features

- add name of person who recieved offering to counstituency by council defaulter card ([ff822241](https://github.com/firstlovecenter/fl-pastoral-care/commit/ff8222415d3f083ef0e42be763780ef8ff5a3aa1))
- add bankedBy field to constituency ([f0c72242](https://github.com/firstlovecenter/fl-pastoral-care/commit/f0c722428509f3375bf2f099d50b471e4ae8b055))
- add bankedBy field to service record ([eae19b96](https://github.com/firstlovecenter/fl-pastoral-care/commit/eae19b96a341e0a45fa5d06307338fbb8f45ff60))

##### Bug Fixes

- fix bug with anagkazo banking preventing confirmation of constituency banking ([#330](https://github.com/firstlovecenter/fl-pastoral-care/pull/330)) ([28982551](https://github.com/firstlovecenter/fl-pastoral-care/commit/289825511456cc38e89dd8d88033521549388fef))
- fixed bug in aggregate cypher which was doubling bussing figures ([39bff6a6](https://github.com/firstlovecenter/fl-pastoral-care/commit/39bff6a68f62c7d04f7f4d06c137180c81817564))
- admin-396 change replaceAll to regex expression to support older devices ([0f08513e](https://github.com/firstlovecenter/fl-pastoral-care/commit/0f08513e8b9c67f9a9bc246ccb07eca07e615f86))
- set up dev instance, minor updates to ui ([e363f4f6](https://github.com/firstlovecenter/fl-pastoral-care/commit/e363f4f6d1fc9db6f4f2a2c380ca61d9ecbab2e7))
- let me look at the response to the scheduled data aggregation ([9966f451](https://github.com/firstlovecenter/fl-pastoral-care/commit/9966f4519bb5b52c02a4081edf46eecfff1d056d))
- update response on setting payment status ([91ca475c](https://github.com/firstlovecenter/fl-pastoral-care/commit/91ca475c0d2e766215a54f3ca3ac1a97c1ca9f78))
- correct destructuring of JSON object from paystack ([bd051068](https://github.com/firstlovecenter/fl-pastoral-care/commit/bd051068acfcb36231fa236c2d7559a036e47fa6))
- fix api breaking bug ([814ecbbf](https://github.com/firstlovecenter/fl-pastoral-care/commit/814ecbbfe2f2d681fb897250513f4362f45fa134))
- rewrote scheduled-data-aggregation scheduled function ([cb14dd78](https://github.com/firstlovecenter/fl-pastoral-care/commit/cb14dd783d07f547afef71c0c49aad2763c72d16))
- implement charge stated i paystack docs to pass charge to users ([1afa7de9](https://github.com/firstlovecenter/fl-pastoral-care/commit/1afa7de93e3b3e504c7f18d92e1c1a825756eead))
- round up vehicle top up amount to two decimal places ([5f7e7d6d](https://github.com/firstlovecenter/fl-pastoral-care/commit/5f7e7d6d89d840d22795af9697b2cc62a770b724))
- final fix for paystack webhooks ([a28aea98](https://github.com/firstlovecenter/fl-pastoral-care/commit/a28aea983c4639bdca7fb758856351809e50fb07))
- testing web hook4 ([896f584d](https://github.com/firstlovecenter/fl-pastoral-care/commit/896f584de9bcc32fd5bfdf6511ada040876ee72a))
- testing web hook 3 ([bcd1c881](https://github.com/firstlovecenter/fl-pastoral-care/commit/bcd1c8814cd9338979068204a5ee525b5cf3eaed))
- testing web hook 2 ([a3c63a15](https://github.com/firstlovecenter/fl-pastoral-care/commit/a3c63a15737b24fd1873aa9958d10b2dca411063))
- testing web hook 1 ([dfc14a89](https://github.com/firstlovecenter/fl-pastoral-care/commit/dfc14a89f5ec08aced5844647890bcae415ec4d5))
- fix confirm payment ux flow ([8a1570aa](https://github.com/firstlovecenter/fl-pastoral-care/commit/8a1570aa2f603639cac1894cf94d7d3c7d5196c1))
- add whitelisting ip ([e90aa5e4](https://github.com/firstlovecenter/fl-pastoral-care/commit/e90aa5e4879c21bad63effd238a77cef2a4409a2))
- remove restrictions on anagkazo treasurers ([ca43b20e](https://github.com/firstlovecenter/fl-pastoral-care/commit/ca43b20e1cb3917e681bf0ba59c660ea6c131300))
- add whitelisting ip ([29a26c85](https://github.com/firstlovecenter/fl-pastoral-care/commit/29a26c856436b1390b5fd2759edcf8f6fedf3537))
- trying payment webhook once moore ([5b69661a](https://github.com/firstlovecenter/fl-pastoral-care/commit/5b69661a38b627b81a4114a09ce88d3641b29512))
- add check for send OTP when using banking receipt after attempt self banking ([f685fd3b](https://github.com/firstlovecenter/fl-pastoral-care/commit/f685fd3b53fbe16ae493d7b59af90fa63e910e5e))
- change color coding of equipment defaulters card values to better display the meaning ([21662038](https://github.com/firstlovecenter/fl-pastoral-care/commit/216620382de235bf0da29a1cefcac97597f38b8f))

##### Refactors

- setup dev instance file renamed ([dd8642e4](https://github.com/firstlovecenter/fl-pastoral-care/commit/dd8642e41a30997ba80629d329da6d85e8e318ee))

#### 5.2.2 (2022-10-16)

##### Documentation Changes

- update CHANGELOG.md ([2a1dcf18](https://github.com/firstlovecenter/fl-pastoral-care/commit/2a1dcf18ce141d40224654bd7cf1302810ea696f))

##### Bug Fixes

- reduce amount so that the church bears the charges ([70a189ae](https://github.com/firstlovecenter/fl-pastoral-care/commit/70a189aed2b497e2e045c3b5bd65e52204abd9e1))
- fix height of arrivals picture row ([33ef94fe](https://github.com/firstlovecenter/fl-pastoral-care/commit/33ef94fe42cacc365443e5e8f114ee1036508dca))
- update arrivals picture views ([99de0d61](https://github.com/firstlovecenter/fl-pastoral-care/commit/99de0d61abcea7bd248950e0fe69b60600fd59a7))
- fix height of member picture for safari users ([280bb2c7](https://github.com/firstlovecenter/fl-pastoral-care/commit/280bb2c7a2c4358fbefbb19df99fd3f5dea0ff91))
- enable lazy load on certain screens ([608c51b1](https://github.com/firstlovecenter/fl-pastoral-care/commit/608c51b18a177713fda0d180e251213d9347a06a))

#### 5.2.2 (2022-10-16)

##### Bug Fixes

- reduce amount so that the church bears the charges ([70a189ae](https://github.com/firstlovecenter/fl-pastoral-care/commit/70a189aed2b497e2e045c3b5bd65e52204abd9e1))
- fix height of arrivals picture row ([33ef94fe](https://github.com/firstlovecenter/fl-pastoral-care/commit/33ef94fe42cacc365443e5e8f114ee1036508dca))
- update arrivals picture views ([99de0d61](https://github.com/firstlovecenter/fl-pastoral-care/commit/99de0d61abcea7bd248950e0fe69b60600fd59a7))
- fix height of member picture for safari users ([280bb2c7](https://github.com/firstlovecenter/fl-pastoral-care/commit/280bb2c7a2c4358fbefbb19df99fd3f5dea0ff91))
- enable lazy load on certain screens ([608c51b1](https://github.com/firstlovecenter/fl-pastoral-care/commit/608c51b18a177713fda0d180e251213d9347a06a))

#### 5.2.1 (2022-10-16)

##### New Features

- **paystack:** customer details on the portal are updated when they make payment ([a9ab4bfc](https://github.com/firstlovecenter/fl-pastoral-care/commit/a9ab4bfcbcf9388f874a8b88360f18f219a619ab))

##### Bug Fixes

- remove error messages when confirming arrival attendance ([e2ab223f](https://github.com/firstlovecenter/fl-pastoral-care/commit/e2ab223f2b860c148c992102551e57ad1e14b896))
- replace cloudinary filenames space with hyphhn ([08c663da](https://github.com/firstlovecenter/fl-pastoral-care/commit/08c663da1e9d132d82a8a33858d0c1a9ae7854f2))
- increase charges on payswitch so that the correct amount is settled to us ([79eb2359](https://github.com/firstlovecenter/fl-pastoral-care/commit/79eb235988d1a8cafb7f35233a2b3bdef26af613))
- fix logic for checking directory lock for arrivals counters ([614ab0a5](https://github.com/firstlovecenter/fl-pastoral-care/commit/614ab0a581fadf7373030dd48ec25c00391a17a6))
- implement stronger default password for creating users ([32e45ef0](https://github.com/firstlovecenter/fl-pastoral-care/commit/32e45ef0aeb2a7d75b5fae0d748b9dee0b5d8ed7))
- remove day checker on anagkazo banking ([e8b62330](https://github.com/firstlovecenter/fl-pastoral-care/commit/e8b623309ac5f683c9969f86a098cfe6a4cbe016))
- handles error for when otp succeeds but state is not changed in db ([7ca295ec](https://github.com/firstlovecenter/fl-pastoral-care/commit/7ca295eccf3c5cbeaefcfe5dad1e585629c23555))
- logs error to the console when payment.js ([1c50f005](https://github.com/firstlovecenter/fl-pastoral-care/commit/1c50f0058288161278cc9d0938e752f336a30914))
- return 500 if there is an error ([1b794b91](https://github.com/firstlovecenter/fl-pastoral-care/commit/1b794b91ce06c5490df6cecac15be766aee9fe03))
- give up on webhook for now ([ab527dab](https://github.com/firstlovecenter/fl-pastoral-care/commit/ab527dab896c7b96da3e02c61f5062ce79806711))
- change whitelistedIPs to return boolean ([7450dce3](https://github.com/firstlovecenter/fl-pastoral-care/commit/7450dce3e09cc4e0240e614eb596cc08cabe89d6))
- correct wrong variable name from neoDriver to driver in handlePaystackReq ([883e1855](https://github.com/firstlovecenter/fl-pastoral-care/commit/883e1855d46a0f301fa886c55b2804e701bb38ae))
- include ip for testing ([17875054](https://github.com/firstlovecenter/fl-pastoral-care/commit/17875054ede3db52fc32a5153e5f450f00af701e))
- rewrite payment.js netlify function from scratch ([19208bbc](https://github.com/firstlovecenter/fl-pastoral-care/commit/19208bbcd68a56b3632065689dc858853a89f260))
- switch from using session.transactionWrite to session.run ([bd45523f](https://github.com/firstlovecenter/fl-pastoral-care/commit/bd45523f8ff5834bd2f29b32fc45bdc76f8f07e3))
- update neo4j-driver ([845892a7](https://github.com/firstlovecenter/fl-pastoral-care/commit/845892a7568c1834117d40cda80e8b1c9a989f82))
- refactor payment.js function so that transaction starts during if-logic ([36d8f023](https://github.com/firstlovecenter/fl-pastoral-care/commit/36d8f023c96986f7fe8ef4a78d14235317002a28))
- remove async-await syntax ([893aec3b](https://github.com/firstlovecenter/fl-pastoral-care/commit/893aec3b75d219fbabf957b8d03e5fb6fb933b45))
- remove async-await syntax ([c9e91281](https://github.com/firstlovecenter/fl-pastoral-care/commit/c9e912819094cdb5a79fe610700a8e17fca3e2ee))
- run independent query to set one servicerecord ([71851a00](https://github.com/firstlovecenter/fl-pastoral-care/commit/71851a00788c883402583f6d38323eacbf84eaba))
- log out errors to the console so I can see what is happening ([2617eea5](https://github.com/firstlovecenter/fl-pastoral-care/commit/2617eea5cbfe01cfca51c75087f9522ab72def09))
- move db transaction out of try catch block ([62a124ac](https://github.com/firstlovecenter/fl-pastoral-care/commit/62a124ac6223b59931cd5a05743a5f275a866518))
- try converting writeTransaction to an async function ([43641aeb](https://github.com/firstlovecenter/fl-pastoral-care/commit/43641aeb2e35b2f5019703726deb6c3f9e6ec219))
- log result of transaction ([0347f067](https://github.com/firstlovecenter/fl-pastoral-care/commit/0347f0671bbd41331aa68fae0f22d891b1066ec2))
- log result of transaction ([2557ccc9](https://github.com/firstlovecenter/fl-pastoral-care/commit/2557ccc95e537a0eb77fae6a1fcdd7e5ed6e2614))
- change lowercase 'idl' label to 'IDL' ([0de56ba8](https://github.com/firstlovecenter/fl-pastoral-care/commit/0de56ba864e95714377dd318c7eec8465a34b5df))
- log the successful status of payment webhook ([eef5c04c](https://github.com/firstlovecenter/fl-pastoral-care/commit/eef5c04cbd31da7e91bde9bff37b84439ae7ca71))
- add ts-ignore to sentry init which was breaking the build ([4fd642b1](https://github.com/firstlovecenter/fl-pastoral-care/commit/4fd642b1d26f8f563e899f42d5e552d37ec7bd8e))
- remove lazy loading from member details page ([3e5bc4a8](https://github.com/firstlovecenter/fl-pastoral-care/commit/3e5bc4a80c76cdb16435233ef2ee70cb8d08993c))
- **arrivals:** remove directory lock for arrivals counters ([5539c93d](https://github.com/firstlovecenter/fl-pastoral-care/commit/5539c93d8ff87b79246269b12a6b940c742a66a7))
- **anagkazo-banking:** treasurers cannot bank after Saturday ([8d714f5f](https://github.com/firstlovecenter/fl-pastoral-care/commit/8d714f5ffc9c0c261a284f1fbe71b29ed2f923e5))
- **paystack:**
  - tidy up api responses to sending otp resolver ([b1eefbc1](https://github.com/firstlovecenter/fl-pastoral-care/commit/b1eefbc1845654024133623ff7d7f3850bcf8fca))
  - better design adjustments to the otp sending button ([5d90891a](https://github.com/firstlovecenter/fl-pastoral-care/commit/5d90891af91905afb8294456dd9295bc56edd6cb))
  - implement verifying OTP even if user refreshes page or leaves and comes back ([151f6381](https://github.com/firstlovecenter/fl-pastoral-care/commit/151f6381afd181eb6a551180b39669caafceb80a))
  - use user phone number instead of payment phone number ([bb9b59c0](https://github.com/firstlovecenter/fl-pastoral-care/commit/bb9b59c0e24e49f904f66a6479d6b16a7f07fc77))
  - add mobile number on customer ([04678862](https://github.com/firstlovecenter/fl-pastoral-care/commit/04678862ab947f1ecc0cf1eab22fd236b22ee269))
  - remove charge on offerings ([17f5e909](https://github.com/firstlovecenter/fl-pastoral-care/commit/17f5e909963e85720c0bb1a71af9699cc3acfde4))
  - json parse for the payment function ([f004579b](https://github.com/firstlovecenter/fl-pastoral-care/commit/f004579ba3699dfcc677bf475515e6e45f250a5e))
  - json parse for the payment function ([a9d46f15](https://github.com/firstlovecenter/fl-pastoral-care/commit/a9d46f15d712a1e1767e45e5a226c8f63be42348))
  - switch from verifying hash to whitelisting ips try 2 ([846a50ac](https://github.com/firstlovecenter/fl-pastoral-care/commit/846a50ace57cd9118ab14b173c8faace96581b2f))
  - switch from verifying hash to whitelisting ips ([e5363d31](https://github.com/firstlovecenter/fl-pastoral-care/commit/e5363d317318bc75c591ad333bd65c7356732d42))
  - log hash and paystack header ([8eb80871](https://github.com/firstlovecenter/fl-pastoral-care/commit/8eb808712583d09da55605b13470bab52416da53))
  - log hash and paystack header ([44500ad8](https://github.com/firstlovecenter/fl-pastoral-care/commit/44500ad88daa7690970d30ad56d7568eb574055b))
  - log evvent body ([912aa3ff](https://github.com/firstlovecenter/fl-pastoral-care/commit/912aa3ff6dbb1aebb43e32ee2a9b2f0bc51d6373))
  - log hash verified ([180224ef](https://github.com/firstlovecenter/fl-pastoral-care/commit/180224effc6b4f4b757b47795b448d39bca37242))
  - extract event.body.data ([7afd712b](https://github.com/firstlovecenter/fl-pastoral-care/commit/7afd712b8eaf9afffbdc15dfada61a7d68aacb16))
  - implement better logging for payment function ([5f94b0da](https://github.com/firstlovecenter/fl-pastoral-care/commit/5f94b0da069262266ba5c132feac74fd7e8cc5b2))
  - implement better logging for payment function ([33e83d02](https://github.com/firstlovecenter/fl-pastoral-care/commit/33e83d0290a058747d081303332c83074b1fc766))
  - log event body on payment cloud function ([c3e0e1eb](https://github.com/firstlovecenter/fl-pastoral-care/commit/c3e0e1ebd1ad5852d50378f4caceb01d1ee5e4dd))

##### Performance Improvements

- make it easier to see error rom apollowrapper ([dc83730c](https://github.com/firstlovecenter/fl-pastoral-care/commit/dc83730c4a8f155b7dfc5055225264d048b98ede))

### 5.2.0 (2022-10-11)

##### New Features

- set up function for paystack transaction webhook ([#321](https://github.com/firstlovecenter/fl-pastoral-care/pull/321)) ([493fa908](https://github.com/firstlovecenter/fl-pastoral-care/commit/493fa9080862629302c042def2865867727350cd))
- implement user flow to delete a member on the app ([02a5fcc4](https://github.com/firstlovecenter/fl-pastoral-care/commit/02a5fcc46f3e0fea50f3daf306c8b4388f242012))
- add feature that allows an inactive member to be reactivated when reregistered ([038df677](https://github.com/firstlovecenter/fl-pastoral-care/commit/038df677d91102d09d2576fb602a76a8688bf69c))
- admin-287 change members lists to return active members lists ([d5062773](https://github.com/firstlovecenter/fl-pastoral-care/commit/d5062773fa1f3fde25f6c8d546f5f39f02943f8e))
- admin-286 add cypher to make all members active ([784169b6](https://github.com/firstlovecenter/fl-pastoral-care/commit/784169b65acad7f5cea12afa61a4af005c02b9a9))
- implement directory lock till tuesdays in api ([a226a825](https://github.com/firstlovecenter/fl-pastoral-care/commit/a226a8254db58c1109f8ae12dbcc27b1fc8bbb59))

##### Bug Fixes

- **paystack:** remove math.round around banking amount ([d1efef62](https://github.com/firstlovecenter/fl-pastoral-care/commit/d1efef62dcd86024ef0ac648f40ed86d796acb1b))
- modify detailsConstituency to show fellowship Count ([f1c992c9](https://github.com/firstlovecenter/fl-pastoral-care/commit/f1c992c900cc7b4eefa2a7a17fbdf32bacfa4042))
- fix bug causing a banking loop when user has multiple unbanked services ([aa94d7d9](https://github.com/firstlovecenter/fl-pastoral-care/commit/aa94d7d951b361d1fb4e4c544a48ff0520e274df))
- add relationship to timegraph node from deleting history log ([c0bd8fc8](https://github.com/firstlovecenter/fl-pastoral-care/commit/c0bd8fc8faccfd25edd6f9977acd8cc33ce37418))
- implement fellowship leaders being able to update their fellowship coordinates ([1a407e7d](https://github.com/firstlovecenter/fl-pastoral-care/commit/1a407e7dc4e9a349ab2b7d09037fa501f298ca68))
- correct typos in cypher ([4b8467c9](https://github.com/firstlovecenter/fl-pastoral-care/commit/4b8467c94d447c15beb2b33e5f700daf427dbe45))
- remove lazy load from bus form vehicle details ([5f906964](https://github.com/firstlovecenter/fl-pastoral-care/commit/5f9069645fcfe03c2b046ff9982bf55e6938da73))
- implement directory lock except for tuesdays ([35c1cff4](https://github.com/firstlovecenter/fl-pastoral-care/commit/35c1cff44feeb41a953074c91d4570710b1801ca))
- update return values from checkTransaction Cypher ([02a8414f](https://github.com/firstlovecenter/fl-pastoral-care/commit/02a8414fa8846069e1c10ae5072a787baf2e0105))

##### Other Changes

- Active at different points in the app ([58a7d5a9](https://github.com/firstlovecenter/fl-pastoral-care/commit/58a7d5a9c415c6f0e76ff376adc0e654da4350ba))
- inactive label to member ([1062f7af](https://github.com/firstlovecenter/fl-pastoral-care/commit/1062f7afdbca12fb6b08dbbf250793e0bffd7f55))

##### Refactors

- add mutation to make member inactive ([6ec27bcf](https://github.com/firstlovecenter/fl-pastoral-care/commit/6ec27bcf3758413ff69fc1c1055793f502838e91))

#### 5.1.29 (2022-10-01)

##### Chores

- version bump ([74660128](https://github.com/firstlovecenter/fl-pastoral-care/commit/7466012819a70f3233939b26c23ff35a1fbfce79))

##### Documentation Changes

- update CHANGELOG.md ([4ac4f5d8](https://github.com/firstlovecenter/fl-pastoral-care/commit/4ac4f5d8fc4ae230dc9c74989d352f660b6db6b0))
- update CHANGELOG.md ([0f47b164](https://github.com/firstlovecenter/fl-pastoral-care/commit/0f47b164db79354aa10d3c218752a9f402219f7e))

##### Bug Fixes

- fix bug preventing multiple time defaulters from confirming self banking ([#317](https://github.com/firstlovecenter/fl-pastoral-care/pull/317)) ([3714664d](https://github.com/firstlovecenter/fl-pastoral-care/commit/3714664dc5e74000de482970bb2da4a50c3f1fe5))
- remove spaces in whatsapp defaulters message ([50a1facd](https://github.com/firstlovecenter/fl-pastoral-care/commit/50a1facdfe54e29bf9ea9474ced6562fdafaeef6))
- update data aggregation to use CURRENT_HISTORY instead of HAS_HISTORY ([f3e2fb03](https://github.com/firstlovecenter/fl-pastoral-care/commit/f3e2fb03d510593e8db5b9b1485561845349b7a8))
- add tellerConfirmationTime as banking proof ([f68d29ec](https://github.com/firstlovecenter/fl-pastoral-care/commit/f68d29ecd4092ca1101072362def0e6358db8229))
- clicking on stream teller card no longer gives a blank page and a system crash ([e1a6e8ca](https://github.com/firstlovecenter/fl-pastoral-care/commit/e1a6e8ca05eaf4c800a799b7d490b10a8d9f1fd7))

#### 5.1.22 (2022-10-01)

#### 5.1.21 (2022-10-01)

##### Bug Fixes

- remove spaces in whatsapp defaulters message ([50a1facd](https://github.com/firstlovecenter/fl-pastoral-care/commit/50a1facdfe54e29bf9ea9474ced6562fdafaeef6))
- update data aggregation to use CURRENT_HISTORY instead of HAS_HISTORY ([f3e2fb03](https://github.com/firstlovecenter/fl-pastoral-care/commit/f3e2fb03d510593e8db5b9b1485561845349b7a8))
- add tellerConfirmationTime as banking proof ([f68d29ec](https://github.com/firstlovecenter/fl-pastoral-care/commit/f68d29ecd4092ca1101072362def0e6358db8229))
- clicking on stream teller card no longer gives a blank page and a system crash ([e1a6e8ca](https://github.com/firstlovecenter/fl-pastoral-care/commit/e1a6e8ca05eaf4c800a799b7d490b10a8d9f1fd7))

#### 5.1.20 (2022-09-29)

##### Continuous Integration

- switch to using env variable for mailgun_domain ([2717716c](https://github.com/firstlovecenter/fl-pastoral-care/commit/2717716cc97614104b746762be317c0ece5a4e5d))

##### Documentation Changes

- update CHANGELOG.md ([241accf5](https://github.com/firstlovecenter/fl-pastoral-care/commit/241accf50a6461f201dc5d6e560349839d906a6c))
- update CHANGELOG.md ([fef0c585](https://github.com/firstlovecenter/fl-pastoral-care/commit/fef0c58538482c1cad886254fa20fd2af91d6d6a))
- update CHANGELOG.md ([b8b733c6](https://github.com/firstlovecenter/fl-pastoral-care/commit/b8b733c609ef51320f0c78c194a833d0ab54413f))

##### New Features

- admin-344 change equipment trend denominator to show fellowship ewuipment filled count ([4451a463](https://github.com/firstlovecenter/fl-pastoral-care/commit/4451a4638b6f4acf062a16f8998994d1ed7a1c78))
- admin-348 prevent data load until all data have finished loading in equipment campaign ([2298bed7](https://github.com/firstlovecenter/fl-pastoral-care/commit/2298bed780e8f831f304ec9d67ada1fab789fdbb))
- add optional foreign currency field to aggregate service record type ([8b954974](https://github.com/firstlovecenter/fl-pastoral-care/commit/8b9549744f94122cb858b20a7503505c57e22ab0))
- make havenotfilled buttons clickable to display churches that havent filled the equipment form ([1e547374](https://github.com/firstlovecenter/fl-pastoral-care/commit/1e54737475075694f888e2b9ba654e9a73c91bfa))
- implement template message when sending whatsapp to defaulting admins ([ba9aafa7](https://github.com/firstlovecenter/fl-pastoral-care/commit/ba9aafa7e1b9fbb39d72a6d9aebae00411aacc16))
- update top up amounts to better reflect the heart behind the top up amounts ([7e1d8b03](https://github.com/firstlovecenter/fl-pastoral-care/commit/7e1d8b03e8788369423cfe5c6fc7f8b9146554c0))
- implement custom whatsapp message template for service defaulters ([b637043d](https://github.com/firstlovecenter/fl-pastoral-care/commit/b637043da12282e72fe2f19a7ca9738ed4329d0b))

##### Bug Fixes

- update stream name to show options for anagkazo in servies menu ([efd20830](https://github.com/firstlovecenter/fl-pastoral-care/commit/efd20830a6d5002d90631c88293d439f05dfed20))
- update stream names in the backend ([39431672](https://github.com/firstlovecenter/fl-pastoral-care/commit/394316727ae5aaad1bd877160d47be5e4993c80b))
- change stream names to reflect new stream names ([59eb483d](https://github.com/firstlovecenter/fl-pastoral-care/commit/59eb483d78ca640f576a87671867f064b83d437b))
- improve button loading ux when closing down a church ([79216fa6](https://github.com/firstlovecenter/fl-pastoral-care/commit/79216fa638b30843f6d27a1762f0f873e9f85e4f))
- data aggregation will happen only on wednesday to sunday ([28f459f6](https://github.com/firstlovecenter/fl-pastoral-care/commit/28f459f68b1611caf59deba858c2b7fd8aa6cc74))
- fix issue where constituency name is the same in confirm banking popup ([7360d71a](https://github.com/firstlovecenter/fl-pastoral-care/commit/7360d71af6433871bba9243502cd491c5a4b94c4))
- data aggregation will happen only on wednesday to sunday ([abd102da](https://github.com/firstlovecenter/fl-pastoral-care/commit/abd102daa837e7d681a4cb5800993e5562ec53a9))
- admin-311 tweak UX so enable popup to work after installing sentry.io ([0dd10a39](https://github.com/firstlovecenter/fl-pastoral-care/commit/0dd10a39f12223f2f6aeea8638594a81b4b95ebe))
- admin-311 merge anagkazo banking by constituencies into deploy ([5364ffc6](https://github.com/firstlovecenter/fl-pastoral-care/commit/5364ffc64d60c41f5a4f59f980822ff686890507))
- restore throwErrorMsg function ([b3fcecbc](https://github.com/firstlovecenter/fl-pastoral-care/commit/b3fcecbc3fc89c310010eefd2c70e9b742906957))
- change throwErrorMsg function to throwToSentry in frontend anagkazo confirmation ([7d8bd1f8](https://github.com/firstlovecenter/fl-pastoral-care/commit/7d8bd1f8849fa861cd6455e94d81dd4b24d80492))
- fix error where users is unable to edit a fellowship when there is no leader ([61fb88d6](https://github.com/firstlovecenter/fl-pastoral-care/commit/61fb88d6ce53f2b20cfbc20ce9af32e956b70bd8))
- remove service day check on defaulters cypher in confirm anagkazo banking ([f671b87f](https://github.com/firstlovecenter/fl-pastoral-care/commit/f671b87f425396a6976a9019e3fecb37a898e763))
- update aggregation scheduled function to run daily ([52ab3d66](https://github.com/firstlovecenter/fl-pastoral-care/commit/52ab3d664d93dc1f56eb59dd799489f3c4318f42))
- admin 339 fix cypher that checks if a felowship has members to always return data ([735f52b4](https://github.com/firstlovecenter/fl-pastoral-care/commit/735f52b4c8544d432867a6d637cc56354f495951))
- improve error handling when money cannot be sent ([b0607b67](https://github.com/firstlovecenter/fl-pastoral-care/commit/b0607b678615ccee97c7d72ab5da29e29153656a))
- combine arrival time and counting into one mutation ([3582a547](https://github.com/firstlovecenter/fl-pastoral-care/commit/3582a547a8459d103ca312e59521714239d7677a))
- refactor mutation to close down fellowship to align with sentry.io workflow ([6c3c4647](https://github.com/firstlovecenter/fl-pastoral-care/commit/6c3c46470f8f0e9835722fe64b3516da32904246))
- update arrival top up amounts to reflect to in and out percentages ([4980fd99](https://github.com/firstlovecenter/fl-pastoral-care/commit/4980fd994d956e0b0af3fc5aedd5c0b7f5971554))
- admin 339 fix cypher that checks if an equipment form has been filled to always return data ([4c39c899](https://github.com/firstlovecenter/fl-pastoral-care/commit/4c39c89935d2293bc4e0974543a535e4fb04bf21))
- fix bug preventing login page from showing ([59f2e7b4](https://github.com/firstlovecenter/fl-pastoral-care/commit/59f2e7b438b92350fbf02d366cbd441651cd5b9c))
- implement further checks to prevent running query when token has not loaded ([ec46419f](https://github.com/firstlovecenter/fl-pastoral-care/commit/ec46419f4ac48f7829d73193973553f62eb31dd4))
- admin-329 implement not running ANY queries until the user is authenticated ([980df7c7](https://github.com/firstlovecenter/fl-pastoral-care/commit/980df7c790e92b78256400b951e94900b7bf9a6f))
- fix arrivals typo breaking the build ([085e7935](https://github.com/firstlovecenter/fl-pastoral-care/commit/085e79352d95eadbb702be45ea36f82c9a0831d3))
- change import of large-number css to where it is used ([d6fee247](https://github.com/firstlovecenter/fl-pastoral-care/commit/d6fee24703e0f337f3711235ebf2f381ef2a32db))
- add with which was breaking the mutation to record arrival time ([7f354023](https://github.com/firstlovecenter/fl-pastoral-care/commit/7f3540238713c20b98d7d7e381f11c84106a44ad))
- fix bug preventing bussing data from aggregating on higher churches ([65264448](https://github.com/firstlovecenter/fl-pastoral-care/commit/6526444859e8f7e22d734635fd20a63f0bc08ebf))
- implement error message to sentry when any cypher query returns null ([4dede820](https://github.com/firstlovecenter/fl-pastoral-care/commit/4dede820a805801050ef61cf7ba0d6ab16619fbe))
- change throwErrorMsg to throwToSentry ([185a6f8d](https://github.com/firstlovecenter/fl-pastoral-care/commit/185a6f8db2911c940467f6338edd2b57e1220f78))
- implement tellerConfirmationTime as a field on ServiceRecord in graphql schema ([af56079e](https://github.com/firstlovecenter/fl-pastoral-care/commit/af56079e5cf0e1b87dc62b92178e318c38ec4776))

##### Other Changes

- 55 ([520e14bf](https://github.com/firstlovecenter/fl-pastoral-care/commit/520e14bf204a9215f460930e4f1ec937d760eb2b))
- 50 pm ([2cd907a3](https://github.com/firstlovecenter/fl-pastoral-care/commit/2cd907a379a215b049ae17dd89b5aad1e0a1fc3b))

##### Refactors

- change from throwErrorMsg to throwToSentry and throw new Error ([0c894226](https://github.com/firstlovecenter/fl-pastoral-care/commit/0c8942263364df43478e41cc6377feb85905c5ae))
- wrap apollo wrapper component over fellowship and constituency equipment campaign page ([029da646](https://github.com/firstlovecenter/fl-pastoral-care/commit/029da646ad15075fb81bd58de69ed3daf05f5431))
- redesign confirm banking interface to receive midweek offerings in constituencies ([23ba5416](https://github.com/firstlovecenter/fl-pastoral-care/commit/23ba5416b39a120c5c44e467384134ab9812d086))
- refactor error messages to better align with sentry.io workflow ([14c73356](https://github.com/firstlovecenter/fl-pastoral-care/commit/14c7335647f928db012c5a579af39beeeb0d2657))
- admin 311 change confirm banking mutation to confirm constituency bakning ([e1fe782e](https://github.com/firstlovecenter/fl-pastoral-care/commit/e1fe782e58eb6a2348200d4fb2303ac0ddbeccb0))

#### 5.1.20 (2022-09-29)

##### Continuous Integration

- switch to using env variable for mailgun_domain ([2717716c](https://github.com/firstlovecenter/fl-pastoral-care/commit/2717716cc97614104b746762be317c0ece5a4e5d))

##### Documentation Changes

- update CHANGELOG.md ([fef0c585](https://github.com/firstlovecenter/fl-pastoral-care/commit/fef0c58538482c1cad886254fa20fd2af91d6d6a))
- update CHANGELOG.md ([b8b733c6](https://github.com/firstlovecenter/fl-pastoral-care/commit/b8b733c609ef51320f0c78c194a833d0ab54413f))

##### New Features

- admin-344 change equipment trend denominator to show fellowship ewuipment filled count ([4451a463](https://github.com/firstlovecenter/fl-pastoral-care/commit/4451a4638b6f4acf062a16f8998994d1ed7a1c78))
- admin-348 prevent data load until all data have finished loading in equipment campaign ([2298bed7](https://github.com/firstlovecenter/fl-pastoral-care/commit/2298bed780e8f831f304ec9d67ada1fab789fdbb))
- add optional foreign currency field to aggregate service record type ([8b954974](https://github.com/firstlovecenter/fl-pastoral-care/commit/8b9549744f94122cb858b20a7503505c57e22ab0))
- make havenotfilled buttons clickable to display churches that havent filled the equipment form ([1e547374](https://github.com/firstlovecenter/fl-pastoral-care/commit/1e54737475075694f888e2b9ba654e9a73c91bfa))
- implement template message when sending whatsapp to defaulting admins ([ba9aafa7](https://github.com/firstlovecenter/fl-pastoral-care/commit/ba9aafa7e1b9fbb39d72a6d9aebae00411aacc16))
- update top up amounts to better reflect the heart behind the top up amounts ([7e1d8b03](https://github.com/firstlovecenter/fl-pastoral-care/commit/7e1d8b03e8788369423cfe5c6fc7f8b9146554c0))
- implement custom whatsapp message template for service defaulters ([b637043d](https://github.com/firstlovecenter/fl-pastoral-care/commit/b637043da12282e72fe2f19a7ca9738ed4329d0b))

##### Bug Fixes

- change stream names to reflect new stream names ([59eb483d](https://github.com/firstlovecenter/fl-pastoral-care/commit/59eb483d78ca640f576a87671867f064b83d437b))
- improve button loading ux when closing down a church ([79216fa6](https://github.com/firstlovecenter/fl-pastoral-care/commit/79216fa638b30843f6d27a1762f0f873e9f85e4f))
- data aggregation will happen only on wednesday to sunday ([28f459f6](https://github.com/firstlovecenter/fl-pastoral-care/commit/28f459f68b1611caf59deba858c2b7fd8aa6cc74))
- fix issue where constituency name is the same in confirm banking popup ([7360d71a](https://github.com/firstlovecenter/fl-pastoral-care/commit/7360d71af6433871bba9243502cd491c5a4b94c4))
- data aggregation will happen only on wednesday to sunday ([abd102da](https://github.com/firstlovecenter/fl-pastoral-care/commit/abd102daa837e7d681a4cb5800993e5562ec53a9))
- admin-311 tweak UX so enable popup to work after installing sentry.io ([0dd10a39](https://github.com/firstlovecenter/fl-pastoral-care/commit/0dd10a39f12223f2f6aeea8638594a81b4b95ebe))
- admin-311 merge anagkazo banking by constituencies into deploy ([5364ffc6](https://github.com/firstlovecenter/fl-pastoral-care/commit/5364ffc64d60c41f5a4f59f980822ff686890507))
- restore throwErrorMsg function ([b3fcecbc](https://github.com/firstlovecenter/fl-pastoral-care/commit/b3fcecbc3fc89c310010eefd2c70e9b742906957))
- change throwErrorMsg function to throwToSentry in frontend anagkazo confirmation ([7d8bd1f8](https://github.com/firstlovecenter/fl-pastoral-care/commit/7d8bd1f8849fa861cd6455e94d81dd4b24d80492))
- fix error where users is unable to edit a fellowship when there is no leader ([61fb88d6](https://github.com/firstlovecenter/fl-pastoral-care/commit/61fb88d6ce53f2b20cfbc20ce9af32e956b70bd8))
- remove service day check on defaulters cypher in confirm anagkazo banking ([f671b87f](https://github.com/firstlovecenter/fl-pastoral-care/commit/f671b87f425396a6976a9019e3fecb37a898e763))
- update aggregation scheduled function to run daily ([52ab3d66](https://github.com/firstlovecenter/fl-pastoral-care/commit/52ab3d664d93dc1f56eb59dd799489f3c4318f42))
- admin 339 fix cypher that checks if a felowship has members to always return data ([735f52b4](https://github.com/firstlovecenter/fl-pastoral-care/commit/735f52b4c8544d432867a6d637cc56354f495951))
- improve error handling when money cannot be sent ([b0607b67](https://github.com/firstlovecenter/fl-pastoral-care/commit/b0607b678615ccee97c7d72ab5da29e29153656a))
- combine arrival time and counting into one mutation ([3582a547](https://github.com/firstlovecenter/fl-pastoral-care/commit/3582a547a8459d103ca312e59521714239d7677a))
- refactor mutation to close down fellowship to align with sentry.io workflow ([6c3c4647](https://github.com/firstlovecenter/fl-pastoral-care/commit/6c3c46470f8f0e9835722fe64b3516da32904246))
- update arrival top up amounts to reflect to in and out percentages ([4980fd99](https://github.com/firstlovecenter/fl-pastoral-care/commit/4980fd994d956e0b0af3fc5aedd5c0b7f5971554))
- admin 339 fix cypher that checks if an equipment form has been filled to always return data ([4c39c899](https://github.com/firstlovecenter/fl-pastoral-care/commit/4c39c89935d2293bc4e0974543a535e4fb04bf21))
- fix bug preventing login page from showing ([59f2e7b4](https://github.com/firstlovecenter/fl-pastoral-care/commit/59f2e7b438b92350fbf02d366cbd441651cd5b9c))
- implement further checks to prevent running query when token has not loaded ([ec46419f](https://github.com/firstlovecenter/fl-pastoral-care/commit/ec46419f4ac48f7829d73193973553f62eb31dd4))
- admin-329 implement not running ANY queries until the user is authenticated ([980df7c7](https://github.com/firstlovecenter/fl-pastoral-care/commit/980df7c790e92b78256400b951e94900b7bf9a6f))
- fix arrivals typo breaking the build ([085e7935](https://github.com/firstlovecenter/fl-pastoral-care/commit/085e79352d95eadbb702be45ea36f82c9a0831d3))
- change import of large-number css to where it is used ([d6fee247](https://github.com/firstlovecenter/fl-pastoral-care/commit/d6fee24703e0f337f3711235ebf2f381ef2a32db))
- add with which was breaking the mutation to record arrival time ([7f354023](https://github.com/firstlovecenter/fl-pastoral-care/commit/7f3540238713c20b98d7d7e381f11c84106a44ad))
- fix bug preventing bussing data from aggregating on higher churches ([65264448](https://github.com/firstlovecenter/fl-pastoral-care/commit/6526444859e8f7e22d734635fd20a63f0bc08ebf))
- implement error message to sentry when any cypher query returns null ([4dede820](https://github.com/firstlovecenter/fl-pastoral-care/commit/4dede820a805801050ef61cf7ba0d6ab16619fbe))
- change throwErrorMsg to throwToSentry ([185a6f8d](https://github.com/firstlovecenter/fl-pastoral-care/commit/185a6f8db2911c940467f6338edd2b57e1220f78))
- implement tellerConfirmationTime as a field on ServiceRecord in graphql schema ([af56079e](https://github.com/firstlovecenter/fl-pastoral-care/commit/af56079e5cf0e1b87dc62b92178e318c38ec4776))

##### Other Changes

- 55 ([520e14bf](https://github.com/firstlovecenter/fl-pastoral-care/commit/520e14bf204a9215f460930e4f1ec937d760eb2b))
- 50 pm ([2cd907a3](https://github.com/firstlovecenter/fl-pastoral-care/commit/2cd907a379a215b049ae17dd89b5aad1e0a1fc3b))

##### Refactors

- change from throwErrorMsg to throwToSentry and throw new Error ([0c894226](https://github.com/firstlovecenter/fl-pastoral-care/commit/0c8942263364df43478e41cc6377feb85905c5ae))
- wrap apollo wrapper component over fellowship and constituency equipment campaign page ([029da646](https://github.com/firstlovecenter/fl-pastoral-care/commit/029da646ad15075fb81bd58de69ed3daf05f5431))
- redesign confirm banking interface to receive midweek offerings in constituencies ([23ba5416](https://github.com/firstlovecenter/fl-pastoral-care/commit/23ba5416b39a120c5c44e467384134ab9812d086))
- refactor error messages to better align with sentry.io workflow ([14c73356](https://github.com/firstlovecenter/fl-pastoral-care/commit/14c7335647f928db012c5a579af39beeeb0d2657))
- admin 311 change confirm banking mutation to confirm constituency bakning ([e1fe782e](https://github.com/firstlovecenter/fl-pastoral-care/commit/e1fe782e58eb6a2348200d4fb2303ac0ddbeccb0))

#### 5.1.20 (2022-09-29)

##### Continuous Integration

- switch to using env variable for mailgun_domain ([2717716c](https://github.com/firstlovecenter/fl-pastoral-care/commit/2717716cc97614104b746762be317c0ece5a4e5d))

##### Documentation Changes

- update CHANGELOG.md ([b8b733c6](https://github.com/firstlovecenter/fl-pastoral-care/commit/b8b733c609ef51320f0c78c194a833d0ab54413f))

##### New Features

- admin-344 change equipment trend denominator to show fellowship ewuipment filled count ([4451a463](https://github.com/firstlovecenter/fl-pastoral-care/commit/4451a4638b6f4acf062a16f8998994d1ed7a1c78))
- admin-348 prevent data load until all data have finished loading in equipment campaign ([2298bed7](https://github.com/firstlovecenter/fl-pastoral-care/commit/2298bed780e8f831f304ec9d67ada1fab789fdbb))
- add optional foreign currency field to aggregate service record type ([8b954974](https://github.com/firstlovecenter/fl-pastoral-care/commit/8b9549744f94122cb858b20a7503505c57e22ab0))
- make havenotfilled buttons clickable to display churches that havent filled the equipment form ([1e547374](https://github.com/firstlovecenter/fl-pastoral-care/commit/1e54737475075694f888e2b9ba654e9a73c91bfa))
- implement template message when sending whatsapp to defaulting admins ([ba9aafa7](https://github.com/firstlovecenter/fl-pastoral-care/commit/ba9aafa7e1b9fbb39d72a6d9aebae00411aacc16))
- update top up amounts to better reflect the heart behind the top up amounts ([7e1d8b03](https://github.com/firstlovecenter/fl-pastoral-care/commit/7e1d8b03e8788369423cfe5c6fc7f8b9146554c0))
- implement custom whatsapp message template for service defaulters ([b637043d](https://github.com/firstlovecenter/fl-pastoral-care/commit/b637043da12282e72fe2f19a7ca9738ed4329d0b))

##### Bug Fixes

- change stream names to reflect new stream names ([59eb483d](https://github.com/firstlovecenter/fl-pastoral-care/commit/59eb483d78ca640f576a87671867f064b83d437b))
- improve button loading ux when closing down a church ([79216fa6](https://github.com/firstlovecenter/fl-pastoral-care/commit/79216fa638b30843f6d27a1762f0f873e9f85e4f))
- data aggregation will happen only on wednesday to sunday ([28f459f6](https://github.com/firstlovecenter/fl-pastoral-care/commit/28f459f68b1611caf59deba858c2b7fd8aa6cc74))
- fix issue where constituency name is the same in confirm banking popup ([7360d71a](https://github.com/firstlovecenter/fl-pastoral-care/commit/7360d71af6433871bba9243502cd491c5a4b94c4))
- data aggregation will happen only on wednesday to sunday ([abd102da](https://github.com/firstlovecenter/fl-pastoral-care/commit/abd102daa837e7d681a4cb5800993e5562ec53a9))
- admin-311 tweak UX so enable popup to work after installing sentry.io ([0dd10a39](https://github.com/firstlovecenter/fl-pastoral-care/commit/0dd10a39f12223f2f6aeea8638594a81b4b95ebe))
- admin-311 merge anagkazo banking by constituencies into deploy ([5364ffc6](https://github.com/firstlovecenter/fl-pastoral-care/commit/5364ffc64d60c41f5a4f59f980822ff686890507))
- restore throwErrorMsg function ([b3fcecbc](https://github.com/firstlovecenter/fl-pastoral-care/commit/b3fcecbc3fc89c310010eefd2c70e9b742906957))
- change throwErrorMsg function to throwToSentry in frontend anagkazo confirmation ([7d8bd1f8](https://github.com/firstlovecenter/fl-pastoral-care/commit/7d8bd1f8849fa861cd6455e94d81dd4b24d80492))
- fix error where users is unable to edit a fellowship when there is no leader ([61fb88d6](https://github.com/firstlovecenter/fl-pastoral-care/commit/61fb88d6ce53f2b20cfbc20ce9af32e956b70bd8))
- remove service day check on defaulters cypher in confirm anagkazo banking ([f671b87f](https://github.com/firstlovecenter/fl-pastoral-care/commit/f671b87f425396a6976a9019e3fecb37a898e763))
- update aggregation scheduled function to run daily ([52ab3d66](https://github.com/firstlovecenter/fl-pastoral-care/commit/52ab3d664d93dc1f56eb59dd799489f3c4318f42))
- admin 339 fix cypher that checks if a felowship has members to always return data ([735f52b4](https://github.com/firstlovecenter/fl-pastoral-care/commit/735f52b4c8544d432867a6d637cc56354f495951))
- improve error handling when money cannot be sent ([b0607b67](https://github.com/firstlovecenter/fl-pastoral-care/commit/b0607b678615ccee97c7d72ab5da29e29153656a))
- combine arrival time and counting into one mutation ([3582a547](https://github.com/firstlovecenter/fl-pastoral-care/commit/3582a547a8459d103ca312e59521714239d7677a))
- refactor mutation to close down fellowship to align with sentry.io workflow ([6c3c4647](https://github.com/firstlovecenter/fl-pastoral-care/commit/6c3c46470f8f0e9835722fe64b3516da32904246))
- update arrival top up amounts to reflect to in and out percentages ([4980fd99](https://github.com/firstlovecenter/fl-pastoral-care/commit/4980fd994d956e0b0af3fc5aedd5c0b7f5971554))
- admin 339 fix cypher that checks if an equipment form has been filled to always return data ([4c39c899](https://github.com/firstlovecenter/fl-pastoral-care/commit/4c39c89935d2293bc4e0974543a535e4fb04bf21))
- fix bug preventing login page from showing ([59f2e7b4](https://github.com/firstlovecenter/fl-pastoral-care/commit/59f2e7b438b92350fbf02d366cbd441651cd5b9c))
- implement further checks to prevent running query when token has not loaded ([ec46419f](https://github.com/firstlovecenter/fl-pastoral-care/commit/ec46419f4ac48f7829d73193973553f62eb31dd4))
- admin-329 implement not running ANY queries until the user is authenticated ([980df7c7](https://github.com/firstlovecenter/fl-pastoral-care/commit/980df7c790e92b78256400b951e94900b7bf9a6f))
- fix arrivals typo breaking the build ([085e7935](https://github.com/firstlovecenter/fl-pastoral-care/commit/085e79352d95eadbb702be45ea36f82c9a0831d3))
- change import of large-number css to where it is used ([d6fee247](https://github.com/firstlovecenter/fl-pastoral-care/commit/d6fee24703e0f337f3711235ebf2f381ef2a32db))
- add with which was breaking the mutation to record arrival time ([7f354023](https://github.com/firstlovecenter/fl-pastoral-care/commit/7f3540238713c20b98d7d7e381f11c84106a44ad))
- fix bug preventing bussing data from aggregating on higher churches ([65264448](https://github.com/firstlovecenter/fl-pastoral-care/commit/6526444859e8f7e22d734635fd20a63f0bc08ebf))
- implement error message to sentry when any cypher query returns null ([4dede820](https://github.com/firstlovecenter/fl-pastoral-care/commit/4dede820a805801050ef61cf7ba0d6ab16619fbe))
- change throwErrorMsg to throwToSentry ([185a6f8d](https://github.com/firstlovecenter/fl-pastoral-care/commit/185a6f8db2911c940467f6338edd2b57e1220f78))
- implement tellerConfirmationTime as a field on ServiceRecord in graphql schema ([af56079e](https://github.com/firstlovecenter/fl-pastoral-care/commit/af56079e5cf0e1b87dc62b92178e318c38ec4776))

##### Other Changes

- 55 ([520e14bf](https://github.com/firstlovecenter/fl-pastoral-care/commit/520e14bf204a9215f460930e4f1ec937d760eb2b))
- 50 pm ([2cd907a3](https://github.com/firstlovecenter/fl-pastoral-care/commit/2cd907a379a215b049ae17dd89b5aad1e0a1fc3b))

##### Refactors

- change from throwErrorMsg to throwToSentry and throw new Error ([0c894226](https://github.com/firstlovecenter/fl-pastoral-care/commit/0c8942263364df43478e41cc6377feb85905c5ae))
- wrap apollo wrapper component over fellowship and constituency equipment campaign page ([029da646](https://github.com/firstlovecenter/fl-pastoral-care/commit/029da646ad15075fb81bd58de69ed3daf05f5431))
- redesign confirm banking interface to receive midweek offerings in constituencies ([23ba5416](https://github.com/firstlovecenter/fl-pastoral-care/commit/23ba5416b39a120c5c44e467384134ab9812d086))
- refactor error messages to better align with sentry.io workflow ([14c73356](https://github.com/firstlovecenter/fl-pastoral-care/commit/14c7335647f928db012c5a579af39beeeb0d2657))
- admin 311 change confirm banking mutation to confirm constituency bakning ([e1fe782e](https://github.com/firstlovecenter/fl-pastoral-care/commit/e1fe782e58eb6a2348200d4fb2303ac0ddbeccb0))

#### 5.1.20 (2022-09-29)

##### Continuous Integration

- switch to using env variable for mailgun_domain ([2717716c](https://github.com/firstlovecenter/fl-pastoral-care/commit/2717716cc97614104b746762be317c0ece5a4e5d))

##### New Features

- admin-344 change equipment trend denominator to show fellowship ewuipment filled count ([4451a463](https://github.com/firstlovecenter/fl-pastoral-care/commit/4451a4638b6f4acf062a16f8998994d1ed7a1c78))
- admin-348 prevent data load until all data have finished loading in equipment campaign ([2298bed7](https://github.com/firstlovecenter/fl-pastoral-care/commit/2298bed780e8f831f304ec9d67ada1fab789fdbb))
- add optional foreign currency field to aggregate service record type ([8b954974](https://github.com/firstlovecenter/fl-pastoral-care/commit/8b9549744f94122cb858b20a7503505c57e22ab0))
- make havenotfilled buttons clickable to display churches that havent filled the equipment form ([1e547374](https://github.com/firstlovecenter/fl-pastoral-care/commit/1e54737475075694f888e2b9ba654e9a73c91bfa))
- implement template message when sending whatsapp to defaulting admins ([ba9aafa7](https://github.com/firstlovecenter/fl-pastoral-care/commit/ba9aafa7e1b9fbb39d72a6d9aebae00411aacc16))
- update top up amounts to better reflect the heart behind the top up amounts ([7e1d8b03](https://github.com/firstlovecenter/fl-pastoral-care/commit/7e1d8b03e8788369423cfe5c6fc7f8b9146554c0))
- implement custom whatsapp message template for service defaulters ([b637043d](https://github.com/firstlovecenter/fl-pastoral-care/commit/b637043da12282e72fe2f19a7ca9738ed4329d0b))

##### Bug Fixes

- change stream names to reflect new stream names ([59eb483d](https://github.com/firstlovecenter/fl-pastoral-care/commit/59eb483d78ca640f576a87671867f064b83d437b))
- improve button loading ux when closing down a church ([79216fa6](https://github.com/firstlovecenter/fl-pastoral-care/commit/79216fa638b30843f6d27a1762f0f873e9f85e4f))
- data aggregation will happen only on wednesday to sunday ([28f459f6](https://github.com/firstlovecenter/fl-pastoral-care/commit/28f459f68b1611caf59deba858c2b7fd8aa6cc74))
- fix issue where constituency name is the same in confirm banking popup ([7360d71a](https://github.com/firstlovecenter/fl-pastoral-care/commit/7360d71af6433871bba9243502cd491c5a4b94c4))
- data aggregation will happen only on wednesday to sunday ([abd102da](https://github.com/firstlovecenter/fl-pastoral-care/commit/abd102daa837e7d681a4cb5800993e5562ec53a9))
- admin-311 tweak UX so enable popup to work after installing sentry.io ([0dd10a39](https://github.com/firstlovecenter/fl-pastoral-care/commit/0dd10a39f12223f2f6aeea8638594a81b4b95ebe))
- admin-311 merge anagkazo banking by constituencies into deploy ([5364ffc6](https://github.com/firstlovecenter/fl-pastoral-care/commit/5364ffc64d60c41f5a4f59f980822ff686890507))
- restore throwErrorMsg function ([b3fcecbc](https://github.com/firstlovecenter/fl-pastoral-care/commit/b3fcecbc3fc89c310010eefd2c70e9b742906957))
- change throwErrorMsg function to throwToSentry in frontend anagkazo confirmation ([7d8bd1f8](https://github.com/firstlovecenter/fl-pastoral-care/commit/7d8bd1f8849fa861cd6455e94d81dd4b24d80492))
- fix error where users is unable to edit a fellowship when there is no leader ([61fb88d6](https://github.com/firstlovecenter/fl-pastoral-care/commit/61fb88d6ce53f2b20cfbc20ce9af32e956b70bd8))
- remove service day check on defaulters cypher in confirm anagkazo banking ([f671b87f](https://github.com/firstlovecenter/fl-pastoral-care/commit/f671b87f425396a6976a9019e3fecb37a898e763))
- update aggregation scheduled function to run daily ([52ab3d66](https://github.com/firstlovecenter/fl-pastoral-care/commit/52ab3d664d93dc1f56eb59dd799489f3c4318f42))
- admin 339 fix cypher that checks if a felowship has members to always return data ([735f52b4](https://github.com/firstlovecenter/fl-pastoral-care/commit/735f52b4c8544d432867a6d637cc56354f495951))
- improve error handling when money cannot be sent ([b0607b67](https://github.com/firstlovecenter/fl-pastoral-care/commit/b0607b678615ccee97c7d72ab5da29e29153656a))
- combine arrival time and counting into one mutation ([3582a547](https://github.com/firstlovecenter/fl-pastoral-care/commit/3582a547a8459d103ca312e59521714239d7677a))
- refactor mutation to close down fellowship to align with sentry.io workflow ([6c3c4647](https://github.com/firstlovecenter/fl-pastoral-care/commit/6c3c46470f8f0e9835722fe64b3516da32904246))
- update arrival top up amounts to reflect to in and out percentages ([4980fd99](https://github.com/firstlovecenter/fl-pastoral-care/commit/4980fd994d956e0b0af3fc5aedd5c0b7f5971554))
- admin 339 fix cypher that checks if an equipment form has been filled to always return data ([4c39c899](https://github.com/firstlovecenter/fl-pastoral-care/commit/4c39c89935d2293bc4e0974543a535e4fb04bf21))
- fix bug preventing login page from showing ([59f2e7b4](https://github.com/firstlovecenter/fl-pastoral-care/commit/59f2e7b438b92350fbf02d366cbd441651cd5b9c))
- implement further checks to prevent running query when token has not loaded ([ec46419f](https://github.com/firstlovecenter/fl-pastoral-care/commit/ec46419f4ac48f7829d73193973553f62eb31dd4))
- admin-329 implement not running ANY queries until the user is authenticated ([980df7c7](https://github.com/firstlovecenter/fl-pastoral-care/commit/980df7c790e92b78256400b951e94900b7bf9a6f))
- fix arrivals typo breaking the build ([085e7935](https://github.com/firstlovecenter/fl-pastoral-care/commit/085e79352d95eadbb702be45ea36f82c9a0831d3))
- change import of large-number css to where it is used ([d6fee247](https://github.com/firstlovecenter/fl-pastoral-care/commit/d6fee24703e0f337f3711235ebf2f381ef2a32db))
- add with which was breaking the mutation to record arrival time ([7f354023](https://github.com/firstlovecenter/fl-pastoral-care/commit/7f3540238713c20b98d7d7e381f11c84106a44ad))
- fix bug preventing bussing data from aggregating on higher churches ([65264448](https://github.com/firstlovecenter/fl-pastoral-care/commit/6526444859e8f7e22d734635fd20a63f0bc08ebf))
- implement error message to sentry when any cypher query returns null ([4dede820](https://github.com/firstlovecenter/fl-pastoral-care/commit/4dede820a805801050ef61cf7ba0d6ab16619fbe))
- change throwErrorMsg to throwToSentry ([185a6f8d](https://github.com/firstlovecenter/fl-pastoral-care/commit/185a6f8db2911c940467f6338edd2b57e1220f78))
- implement tellerConfirmationTime as a field on ServiceRecord in graphql schema ([af56079e](https://github.com/firstlovecenter/fl-pastoral-care/commit/af56079e5cf0e1b87dc62b92178e318c38ec4776))

##### Other Changes

- 55 ([520e14bf](https://github.com/firstlovecenter/fl-pastoral-care/commit/520e14bf204a9215f460930e4f1ec937d760eb2b))
- 50 pm ([2cd907a3](https://github.com/firstlovecenter/fl-pastoral-care/commit/2cd907a379a215b049ae17dd89b5aad1e0a1fc3b))

##### Refactors

- change from throwErrorMsg to throwToSentry and throw new Error ([0c894226](https://github.com/firstlovecenter/fl-pastoral-care/commit/0c8942263364df43478e41cc6377feb85905c5ae))
- wrap apollo wrapper component over fellowship and constituency equipment campaign page ([029da646](https://github.com/firstlovecenter/fl-pastoral-care/commit/029da646ad15075fb81bd58de69ed3daf05f5431))
- redesign confirm banking interface to receive midweek offerings in constituencies ([23ba5416](https://github.com/firstlovecenter/fl-pastoral-care/commit/23ba5416b39a120c5c44e467384134ab9812d086))
- refactor error messages to better align with sentry.io workflow ([14c73356](https://github.com/firstlovecenter/fl-pastoral-care/commit/14c7335647f928db012c5a579af39beeeb0d2657))
- admin 311 change confirm banking mutation to confirm constituency bakning ([e1fe782e](https://github.com/firstlovecenter/fl-pastoral-care/commit/e1fe782e58eb6a2348200d4fb2303ac0ddbeccb0))

#### 5.1.19 (2022-09-24)

##### New Features

- admin-318 implement a button behind the refresh and back buttons ([cc239105](https://github.com/firstlovecenter/fl-pastoral-care/commit/cc2391059e797266d99ce7bec8058af5a57998bf))
- implement pull to refresh functionality for church by subchurch for defaulters ([a8c6a734](https://github.com/firstlovecenter/fl-pastoral-care/commit/a8c6a7341c3bdae2fc8c5dcbed3c5da43589b915))

##### Bug Fixes

- implement ux to force user to confirm payment if they have outstanding banking to do ([7d8d744f](https://github.com/firstlovecenter/fl-pastoral-care/commit/7d8d744f97098b167aa9338a72d73bb5d02849c5))
- improve error handling to know why some vehicles do not get confirmed as arrived ([bf59a206](https://github.com/firstlovecenter/fl-pastoral-care/commit/bf59a206d2d05a3cc1d3fe990d00b318084c852b))
- add optional chain in form mobilisation submission ([43b681ab](https://github.com/firstlovecenter/fl-pastoral-care/commit/43b681abc2866ea6acda1dac76f903febf6435ef))
- add optional chain to prevent cannot read properties of undefined errors from sentry ([a06578f0](https://github.com/firstlovecenter/fl-pastoral-care/commit/a06578f08e696809b4108ef21ba05489ff7f3cee))

#### 5.1.18 (2022-09-23)

##### Chores

- update non breaking changes ([00faf2fd](https://github.com/firstlovecenter/fl-pastoral-care/commit/00faf2fd4d0554543f774642af44ea62d2973193))

##### Continuous Integration

- optimised Error Screen component to send data to Sentry ([c6e91cee](https://github.com/firstlovecenter/fl-pastoral-care/commit/c6e91ceed20f863dbf10d1312cbca7789cfe07fb))
- implement sentry error tracking in the backend ([fb50248a](https://github.com/firstlovecenter/fl-pastoral-care/commit/fb50248a1755f7d2b95223fc61afb197d545eb17))
- implement sentry.io automated error reporting in frontend ([7f2e40fa](https://github.com/firstlovecenter/fl-pastoral-care/commit/7f2e40fab1ad91cf0583abce7b5813955143c09c))

##### New Features

- implement user feedback for that displays when the app crashes ([357d1d46](https://github.com/firstlovecenter/fl-pastoral-care/commit/357d1d4684ee1decd57f3bce6877da1cbc9aa19d))

##### Bug Fixes

- improve error handling for failed self banking ([449b9f71](https://github.com/firstlovecenter/fl-pastoral-care/commit/449b9f715864443e50d9568366f593cf3e065ec7))
- fix bug where service cancellation could be done multiple times in a week ([f717e000](https://github.com/firstlovecenter/fl-pastoral-care/commit/f717e000ef98fad78b80195a932d3305d28d7b63))
- admin-315 fix bug preventing service details from showing when a person cancels service ([9b93a610](https://github.com/firstlovecenter/fl-pastoral-care/commit/9b93a6108926359cd9eb96e0e8dcf7b5372b54de))

##### Refactors

- remove unnecessary console log ([3e29958f](https://github.com/firstlovecenter/fl-pastoral-care/commit/3e29958fa384ff452a88ad45d7f0126cba88ce00))

#### 5.1.17 (2022-09-22)

##### New Features

- set back and refresh button to only show when app is in standalone mode ([c7bbb9dc](https://github.com/firstlovecenter/fl-pastoral-care/commit/c7bbb9dc458c25ca2bc9f3348edf2d410f094529))
- add a refresh and back button to the navbar ([6002241b](https://github.com/firstlovecenter/fl-pastoral-care/commit/6002241b0a3ea4a9cc77d1cd18c2acbe11b41d25))

##### Bug Fixes

- fix gaping holes in stream teller functionality with permissions ([c8a4194e](https://github.com/firstlovecenter/fl-pastoral-care/commit/c8a4194ea33288090b15d435cdd00de28850e484))
- modify attendance confirmation so that arrivals can input 0 for attendance ([b9246b6c](https://github.com/firstlovecenter/fl-pastoral-care/commit/b9246b6cae9442aa8b49d21df61e0860c02c21ae))
- fix version numbers in packagelock.json ([c088fb41](https://github.com/firstlovecenter/fl-pastoral-care/commit/c088fb41badadcbb4d6c764b4a2ebc6de02363b7))

#### 5.1.16 (2022-09-21)

##### New Features

- implement self organising folder structure in cloudinary ([7de27995](https://github.com/firstlovecenter/fl-pastoral-care/commit/7de279951aec9d2ef8d084ca52c418ad85e6fdd0))
- implement scheduled aggregation for bacenta data ([5d80e055](https://github.com/firstlovecenter/fl-pastoral-care/commit/5d80e055575d31832a10f9e4b72aff4f5167b968))
- implement function to aggregate service data that will run on schedule -final ([9a09cbdb](https://github.com/firstlovecenter/fl-pastoral-care/commit/9a09cbdb56a6a4fe1592c570c8ccb6d9958e70b1))
- implement function to aggregate service data that will run on schedule ([7cd9bcd9](https://github.com/firstlovecenter/fl-pastoral-care/commit/7cd9bcd9d7f3a1aa07ef43e1541154756e01cfc7))
- implement function to aggregate service data that will run on schedule ([46008934](https://github.com/firstlovecenter/fl-pastoral-care/commit/46008934a4e79ce1494c5cbf1210cb94721cf622))

##### Bug Fixes

- downgrade neo4j packages in graphql function ([0bd3702b](https://github.com/firstlovecenter/fl-pastoral-care/commit/0bd3702b57045b2eefb77b0752f4bbd31fce3fce))
- downgraded neo4j-driver to 4.3.1 to avoid bug in 5.0.1 ([15af93a8](https://github.com/firstlovecenter/fl-pastoral-care/commit/15af93a808fe2d98f9853aa3d3aa6a1cff55455b))
- make aggregate function run on monday for the week just ended ([2aa96c50](https://github.com/firstlovecenter/fl-pastoral-care/commit/2aa96c505082f0b5e86e0aaec83878007f765e2d))
- schedule function to run on Sunday ? ([b5b03911](https://github.com/firstlovecenter/fl-pastoral-care/commit/b5b039111494da6d033321967a0a4e43f03c2da3))
- change scheduled function to runnin on day 1 ([7ad87eaf](https://github.com/firstlovecenter/fl-pastoral-care/commit/7ad87eafd7989ad523dc3b60bdb7c21cb5effe5f))
- try using 0 to represent Sunday instead of 7 ([f2a68254](https://github.com/firstlovecenter/fl-pastoral-care/commit/f2a682540977d2bb2966fcd16d143abbe83fb56c))
- correct export of handler ([b77f3a49](https://github.com/firstlovecenter/fl-pastoral-care/commit/b77f3a49e70441a7667e77a08ac6bb8384d70976))
- correct export of handler ([d9336994](https://github.com/firstlovecenter/fl-pastoral-care/commit/d93369944a328b79753a8183382d165d97cd936d))
- move cypher statement inside function ([853a5dbe](https://github.com/firstlovecenter/fl-pastoral-care/commit/853a5dbecbec9d517cc8ae2c0a4c90db394fed48))
- fix breaking typo ([d7447760](https://github.com/firstlovecenter/fl-pastoral-care/commit/d744776018f49f183891f2d64a452dc963f28b3a))
- remove the word 'export' ([07b93902](https://github.com/firstlovecenter/fl-pastoral-care/commit/07b93902826e31f3767642f7761b92cff39d6a7d))
- change schedule of function to run on Sundays only ([c9525076](https://github.com/firstlovecenter/fl-pastoral-care/commit/c95250765810bb7c6da9f1c290eefbc3f5024cb6))
- fix cypher that violates creation of aggregatebussing ([63344ff5](https://github.com/firstlovecenter/fl-pastoral-care/commit/63344ff58fd28d91ffa0090cc7f1bba28a3371a3))
- change scheduled function to run once a day ([9714ea08](https://github.com/firstlovecenter/fl-pastoral-care/commit/9714ea08b26055fc2906e98094aba47e6406e590))
- fix cypher statement that was violating constraints on creating AggregateServiceRecords ([3c5daed1](https://github.com/firstlovecenter/fl-pastoral-care/commit/3c5daed1cc0274fd872d3a6c9f62552365c28f5c))
- implement adjustment for service aggregate calc to factor for joint services ([c3296cea](https://github.com/firstlovecenter/fl-pastoral-care/commit/c3296cea16dfbb9b265d9913829b7f03bb79997d))
- fix equipment deadline to allow users to fill on day of deadline ([c6c5d8aa](https://github.com/firstlovecenter/fl-pastoral-care/commit/c6c5d8aa1732ce4d2987071751b0061ce0df49cc))

##### Other Changes

- 30 pm each day ([f6dffff1](https://github.com/firstlovecenter/fl-pastoral-care/commit/f6dffff13a80ce8533ceedab815a87b8dd46a679))

##### Refactors

- move aggregation to the data aggregation file ([4004d4c6](https://github.com/firstlovecenter/fl-pastoral-care/commit/4004d4c66b8eb5b8890d68f230b1fa2efe1b5280))

#### 5.1.15 (2022-09-16)

##### Bug Fixes

- implement fix for graphs not showing on certain screens ([89bcce35](https://github.com/firstlovecenter/fl-pastoral-care/commit/89bcce355c17a7a5b43f838ed9a616fddf72a832))

#### 5.1.14 (2022-09-16)

##### Bug Fixes

- adjust home screen graph to return exactly 4 weeks ([014307dc](https://github.com/firstlovecenter/fl-pastoral-care/commit/014307dc5bca2ecdad6853b05c72b3cde53d9f7c))

##### Refactors

- aggregate bussing records on the fly the proper way ([fc523bc7](https://github.com/firstlovecenter/fl-pastoral-care/commit/fc523bc7bd4cf901d049b29caa9698480d81bc3f))
- aggregate service records on the fly ([a7ceaa29](https://github.com/firstlovecenter/fl-pastoral-care/commit/a7ceaa296302c056675551854a65f4b8ba4dae18))

#### 5.1.13 (2022-09-15)

##### Bug Fixes

- fix bug giving error when people submit service data ([74e09dd6](https://github.com/firstlovecenter/fl-pastoral-care/commit/74e09dd67ee0c9fe1ce64dffb0d27144d7fc185a))
- change c 'created_at' to createdAt ([01a67341](https://github.com/firstlovecenter/fl-pastoral-care/commit/01a67341655c7d3fdad3b124590ade5b05853f75))
- remove the use of the distinct keyword on sum of bacenta target ([d8499164](https://github.com/firstlovecenter/fl-pastoral-care/commit/d8499164fab252b39b5aaffd0a992321dd2049d7))
- replace static target and member count with dynamic counts ([5efb9936](https://github.com/firstlovecenter/fl-pastoral-care/commit/5efb99367714eda14aea9f5f676fe2ab4d63e45d))
- show modal pop up to confirm code of the day has been set in arrivals ([#287](https://github.com/firstlovecenter/fl-pastoral-care/pull/287)) ([674aebbe](https://github.com/firstlovecenter/fl-pastoral-care/commit/674aebbedbed7c542a9c4eff9a9b298d252515ef))
- modify income bar on aggregate graphs to no longer be clickable ([1db6a9e7](https://github.com/firstlovecenter/fl-pastoral-care/commit/1db6a9e7123d4aee890572226d48d8691ed66a61))

##### Performance Improvements

- implement some non null constraints in the directory api ([5b8d47a5](https://github.com/firstlovecenter/fl-pastoral-care/commit/5b8d47a5a9f2d296cdd3f7cc8487025b9c10f3a7))

#### 5.1.12 (2022-09-14)

##### Chores

- update dependencies ([e7fc206e](https://github.com/firstlovecenter/fl-pastoral-care/commit/e7fc206eba4c33d31382b3984ae5ee10d9dba824))

##### New Features

- implement new splash screens for ios with red backgrounds ([#285](https://github.com/firstlovecenter/fl-pastoral-care/pull/285)) ([11e2f8a5](https://github.com/firstlovecenter/fl-pastoral-care/commit/11e2f8a5de58d8e67192382e83299d37eef9a1dc))
- implement equipment defaulters flow for gathering and stream level admins ([#283](https://github.com/firstlovecenter/fl-pastoral-care/pull/283)) ([a533659e](https://github.com/firstlovecenter/fl-pastoral-care/commit/a533659e34d1c3ae716e20da1bc076d7b0756d21))

##### Bug Fixes

- set memberCount on creating church ([8fcd1830](https://github.com/firstlovecenter/fl-pastoral-care/commit/8fcd18301d62f5ea7f00d1d62c6bd647207b4753))
- fix admin names appearing as undefined when no admin is present in equipment defaulters flow ([#286](https://github.com/firstlovecenter/fl-pastoral-care/pull/286)) ([3ae69fe2](https://github.com/firstlovecenter/fl-pastoral-care/commit/3ae69fe2a4460a83aaa531aea1c76b69e799e380))
- fix confirmed higher aggregate for bussing records ([9e00f9ff](https://github.com/firstlovecenter/fl-pastoral-care/commit/9e00f9ff9a693277e1becfaf97a4346b3d51f85a))

##### Performance Improvements

- relocate css for menu buttons to keep ui consistent ([ecf2b143](https://github.com/firstlovecenter/fl-pastoral-care/commit/ecf2b1431b471e066f1529238ea60489e750a2f3))

#### 5.1.11 (2022-09-11)

##### Chores

- api version bump ([f36b77e6](https://github.com/firstlovecenter/fl-pastoral-care/commit/f36b77e65cb85642dbaf8e50142c969d4a19848d))

##### Bug Fixes

- add permissions for gathering arrivals admin ([6eeebc0f](https://github.com/firstlovecenter/fl-pastoral-care/commit/6eeebc0fd1504759b40a40b567eff18c795b74b4))
- fix bug causing multiple aggregateBussingRecord nodes for the same week and year ([24582195](https://github.com/firstlovecenter/fl-pastoral-care/commit/2458219542cd710040e9eb2ceebb92c0b3219dfa))

#### 5.1.10 (2022-09-11)

##### Continuous Integration

- update npm release commands fix ([4d1b218d](https://github.com/firstlovecenter/fl-pastoral-care/commit/4d1b218dea8ca56be96a3eb9fb9a446d6f217bbd))
- update npm release commands ([f324bdb3](https://github.com/firstlovecenter/fl-pastoral-care/commit/f324bdb33b5667ba2a067ef16c4bab10f03ffa94))

##### Bug Fixes

- bacenta aggregate records are now initialised with an attendance of 0 ([31b179cd](https://github.com/firstlovecenter/fl-pastoral-care/commit/31b179cd577c1b59b4d5297629c8671fad0a2239))
- fix cypher bug that was not adding attendance to aggregate bussing records ([15d4af35](https://github.com/firstlovecenter/fl-pastoral-care/commit/15d4af35759e9dad382757e20450c4510d4866c1))
- fix bug creating multiple histories with invalid date when bussing details are updated ([0862e0e6](https://github.com/firstlovecenter/fl-pastoral-care/commit/0862e0e6d55e40b013b7ecf6fc5f28a7b814bae8))

#### 5.1.8 (2022-09-10)

##### Documentation Changes

- update CHANGELOG.md ([60a4a421](https://github.com/firstlovecenter/fl-pastoral-care/commit/60a4a4219ab59002afed1b099a505b156e372341))
- update CHANGELOG.md ([83319905](https://github.com/firstlovecenter/fl-pastoral-care/commit/83319905f6be5dfce0cfad0c25bd229d804f1d5f))

##### New Features

- implement pull to refresh feature on equipment defaulters pages ([#278](https://github.com/firstlovecenter/fl-pastoral-care/pull/278)) ([29179bbe](https://github.com/firstlovecenter/fl-pastoral-care/commit/29179bbef9d08705a39e735b60a5f829d0ac9393))

##### Bug Fixes

- show bacenta momo number when either sprinterCost or urvanCost is present ([429c3aae](https://github.com/firstlovecenter/fl-pastoral-care/commit/429c3aae7be24a17600c37bfaf7b2ce289b1a920))
- change top up in bacenta details to 'one way top up' in form ([b99cd956](https://github.com/firstlovecenter/fl-pastoral-care/commit/b99cd9561d9815ce707a747272bb1c994bc9e04e))
- change top up in bacenta details to 'one way top up' ([a4ec0fc8](https://github.com/firstlovecenter/fl-pastoral-care/commit/a4ec0fc8aeab9f7f1d5108414c9eb5b03e73e820))

##### Performance Improvements

- improve loading ux for equipment campaign deadline ([#280](https://github.com/firstlovecenter/fl-pastoral-care/pull/280)) ([f143376d](https://github.com/firstlovecenter/fl-pastoral-care/commit/f143376d591bfdf05e183f3af3069ff71a314c6f))

#### 5.1.7 (2022-09-10)

#### 5.1.6 (2022-09-10)

##### New Features

- implement pull to refresh feature on equipment defaulters pages ([#278](https://github.com/firstlovecenter/fl-pastoral-care/pull/278)) ([29179bbe](https://github.com/firstlovecenter/fl-pastoral-care/commit/29179bbef9d08705a39e735b60a5f829d0ac9393))

##### Bug Fixes

- show bacenta momo number when either sprinterCost or urvanCost is present ([429c3aae](https://github.com/firstlovecenter/fl-pastoral-care/commit/429c3aae7be24a17600c37bfaf7b2ce289b1a920))
- change top up in bacenta details to 'one way top up' in form ([b99cd956](https://github.com/firstlovecenter/fl-pastoral-care/commit/b99cd9561d9815ce707a747272bb1c994bc9e04e))
- change top up in bacenta details to 'one way top up' ([a4ec0fc8](https://github.com/firstlovecenter/fl-pastoral-care/commit/a4ec0fc8aeab9f7f1d5108414c9eb5b03e73e820))

##### Performance Improvements

- improve loading ux for equipment campaign deadline ([#280](https://github.com/firstlovecenter/fl-pastoral-care/pull/280)) ([f143376d](https://github.com/firstlovecenter/fl-pastoral-care/commit/f143376d591bfdf05e183f3af3069ff71a314c6f))

#### 5.1.5 (2022-09-09)

##### Documentation Changes

- update PR template ([ceecad35](https://github.com/firstlovecenter/fl-pastoral-care/commit/ceecad350240317871e40f747f6db298946ba463))

##### New Features

- implement equipment deadline on the equipment main page ([#277](https://github.com/firstlovecenter/fl-pastoral-care/pull/277)) ([b9f9cd77](https://github.com/firstlovecenter/fl-pastoral-care/commit/b9f9cd774824ed8a8b329b10dd558b1b8bf6d845))

##### Bug Fixes

- change start url in manifest.json ([#279](https://github.com/firstlovecenter/fl-pastoral-care/pull/279)) ([0634f918](https://github.com/firstlovecenter/fl-pastoral-care/commit/0634f918c6f14b935fff907baaa5f5baed48feee))
- change background color dark grey ([e24fdc48](https://github.com/firstlovecenter/fl-pastoral-care/commit/e24fdc483dc558eda4db223b280f1623ebe5424d))

#### 5.1.4 (2022-09-04)

##### New Features

- adds prepared cypher statements to BeforeNextUpdate.cypher file ([4d494e25](https://github.com/firstlovecenter/fl-pastoral-care/commit/4d494e25436cd28318ccc13e4d22e153cb1a20cb))
- admin-273 implement aggregation member count ([6e8de16a](https://github.com/firstlovecenter/fl-pastoral-care/commit/6e8de16ac46e3de1ca45ccc54f917464372ab64a))

##### Bug Fixes

- update start_url in manifest.json ([e55f235b](https://github.com/firstlovecenter/fl-pastoral-care/commit/e55f235be4ee0cd3c2e4046fcde1ea9c16d2cf82))
- update vehicle cost, to say 'one way' ([5f951cdc](https://github.com/firstlovecenter/fl-pastoral-care/commit/5f951cdcb3cde08988f84fb712a0e9525a4821cd))
- update arrivals cypher which calculates aggregate attendance upwards ([f7f36ae6](https://github.com/firstlovecenter/fl-pastoral-care/commit/f7f36ae6ef9abdda04b7c9086ade1ecec2044fb6))
- update addMemberToUpperChurch to also add to fellowship member counter ([d5309e2c](https://github.com/firstlovecenter/fl-pastoral-care/commit/d5309e2cdcecba184630f24b32e88f2fabedee78))
- swap primaryheading to be the church name, and secondary heading to be the campaign name ([#272](https://github.com/firstlovecenter/fl-pastoral-care/pull/272)) ([733bdc26](https://github.com/firstlovecenter/fl-pastoral-care/commit/733bdc260a127faf67d914a1fcdfda02ffbda5b0))
- fix constituency record null id error ([#273](https://github.com/firstlovecenter/fl-pastoral-care/pull/273)) ([89702770](https://github.com/firstlovecenter/fl-pastoral-care/commit/897027703af9275f74d8d102a3c851cbdc894792))
- correct function calculating vehicle top up ([1188a697](https://github.com/firstlovecenter/fl-pastoral-care/commit/1188a697d714221935c83e84c3995a405022acc9))

#### 5.1.3 (2022-09-03)

##### Chores

- sync version numbers ([725aaea4](https://github.com/firstlovecenter/fl-pastoral-care/commit/725aaea442073594be7c2eeaafb69c39cbf4c638))
- version bump ([e92788f2](https://github.com/firstlovecenter/fl-pastoral-care/commit/e92788f2114483746c3ad1271f2d934a4fa5f1d8))

##### Documentation Changes

- update CHANGELOG.md ([4dd0a587](https://github.com/firstlovecenter/fl-pastoral-care/commit/4dd0a5879196d1f0926dcbd6c6cc91bb705b9062))
- update CHANGELOG.md ([331524bf](https://github.com/firstlovecenter/fl-pastoral-care/commit/331524bf70a85379de5085c8d75227d305827c4c))

##### Bug Fixes

- change start url to prevent showing 404 page ([b8492815](https://github.com/firstlovecenter/fl-pastoral-care/commit/b8492815ceef968e11af88274d34c22e8af500dd))

##### Other Changes

- //github.com/firstlovecenter/fl-admin-portal into deploy ([79902dc5](https://github.com/firstlovecenter/fl-pastoral-care/commit/79902dc570db1deb206de8aec48d2b07f67930d0))

#### 5.1.2 (2022-09-03)

##### Chores

- sync version numbers ([725aaea4](https://github.com/firstlovecenter/fl-pastoral-care/commit/725aaea442073594be7c2eeaafb69c39cbf4c638))
- version bump ([e92788f2](https://github.com/firstlovecenter/fl-pastoral-care/commit/e92788f2114483746c3ad1271f2d934a4fa5f1d8))

##### Documentation Changes

- update CHANGELOG.md ([331524bf](https://github.com/firstlovecenter/fl-pastoral-care/commit/331524bf70a85379de5085c8d75227d305827c4c))

##### Bug Fixes

- change start url to prevent showing 404 page ([b8492815](https://github.com/firstlovecenter/fl-pastoral-care/commit/b8492815ceef968e11af88274d34c22e8af500dd))

##### Other Changes

- //github.com/firstlovecenter/fl-admin-portal into deploy ([79902dc5](https://github.com/firstlovecenter/fl-pastoral-care/commit/79902dc570db1deb206de8aec48d2b07f67930d0))

#### 5.1.3 (2022-09-03)

#### 5.1.2 (2022-09-03)

#### 5.1.1 (2022-09-03)

##### New Features

- add shortcuts feature to pwa for convenient user experience ([#269](https://github.com/firstlovecenter/fl-pastoral-care/pull/269)) ([70f5a9b0](https://github.com/firstlovecenter/fl-pastoral-care/commit/70f5a9b0397843aee978a44d8e418e83cb640dcd))

##### Bug Fixes

- fix error in calculating top up amount ([dedafe8e](https://github.com/firstlovecenter/fl-pastoral-care/commit/dedafe8e20ac24767a35917a3016688e9d1f8d76))
- fix bug passing NaN to vehicle top up ([fcb29543](https://github.com/firstlovecenter/fl-pastoral-care/commit/fcb29543142ac1eefc4f34c31fa313f2c4df3091))
- fix bug preventing arrivals data from being submitted ([ef460d98](https://github.com/firstlovecenter/fl-pastoral-care/commit/ef460d9808d62a119308492b7b652c652f85cbb4))
- change font colour on user profile screen that is not visible for PWA ([#268](https://github.com/firstlovecenter/fl-pastoral-care/pull/268)) ([fd4ac90a](https://github.com/firstlovecenter/fl-pastoral-care/commit/fd4ac90a4da8ec98d9faadf5719c573b1075f894))
- fix arrivals timeNode error ([cdeae8ba](https://github.com/firstlovecenter/fl-pastoral-care/commit/cdeae8bade96b19c23645927ea26f4d3cc3c2ad4))
- hotfix bug preventing bacentas with no top up from filling ([b523e8c6](https://github.com/firstlovecenter/fl-pastoral-care/commit/b523e8c6381ead2eb33c188186ba837cd8889313))

### 5.1.0 (2022-09-03)

##### Continuous Integration

- update eslint rules to disable console logs in front end ([7bf48aec](https://github.com/firstlovecenter/fl-pastoral-care/commit/7bf48aec6a72137936d539643aed451f4e6e5876))
- update eslint rules to disable console logs in front end ([f81f0926](https://github.com/firstlovecenter/fl-pastoral-care/commit/f81f09265de03c6f7b71451cfdb7ea4cc3e715aa))

##### Documentation Changes

- update CHANGELOG.md ([221260c7](https://github.com/firstlovecenter/fl-pastoral-care/commit/221260c785d3db91017448279f4670c5e83e1290))

##### New Features

- implement pwa functionality in the web app ([#244](https://github.com/firstlovecenter/fl-pastoral-care/pull/244)) ([783bea3c](https://github.com/firstlovecenter/fl-pastoral-care/commit/783bea3cba3966bdbb6775fbdb9150fcfcbedf90))
- adjust service data writes to reflect the new aggregate structure ([bff125c4](https://github.com/firstlovecenter/fl-pastoral-care/commit/bff125c4a2d3b0b942f4eed5c4cd7c567c5d7707))
- adjust bacenta bussing data writes to reflect new aggregate structure ([fb18890a](https://github.com/firstlovecenter/fl-pastoral-care/commit/fb18890a6b2fca683d4d5c4547a7e85cf609b1d8))

##### Bug Fixes

- merge branch 'bugfix/graphs-admin-260' into deploy ([9122f455](https://github.com/firstlovecenter/fl-pastoral-care/commit/9122f455fe664a679010a50f356093a48803a0c7))
- adds constituency id to constituency equipment records that have a null id ([#266](https://github.com/firstlovecenter/fl-pastoral-care/pull/266)) ([0754b881](https://github.com/firstlovecenter/fl-pastoral-care/commit/0754b881da3ba7316e38a2cf47eac673623922c7))
- change active fellowship count to fellowship to campaign trends ([2a2c1b82](https://github.com/firstlovecenter/fl-pastoral-care/commit/2a2c1b828e41b297bd1ab55ca13b6c144271cc33))
- fix submit button loading ux for constituency and fellowship equipment form ([#264](https://github.com/firstlovecenter/fl-pastoral-care/pull/264)) ([d0dc5a38](https://github.com/firstlovecenter/fl-pastoral-care/commit/d0dc5a381fcc916cce215331b762f8ff974a7580))
- fix broken cypher in identifying campaign start and end dates ([c718c869](https://github.com/firstlovecenter/fl-pastoral-care/commit/c718c869a02ef3510ff12c7dfed1d83212431498))
- changes structure of check equipment deadline statement ([eca308c8](https://github.com/firstlovecenter/fl-pastoral-care/commit/eca308c8ed9d1c8ee875f13a1e1c2e6901be4196))
- changes date used in check for the deadline ([955aceeb](https://github.com/firstlovecenter/fl-pastoral-care/commit/955aceeb4eda5dd609cc3fe1c9a44e4dad53cbcc))
- add permission so that fellowship leaders can view campaigns button in nav ([45f4351f](https://github.com/firstlovecenter/fl-pastoral-care/commit/45f4351fc924aaba00de109e3dd24731138b96f6))
- fix submit button loading ux and vacation churches not appearing ([b09f5040](https://github.com/firstlovecenter/fl-pastoral-care/commit/b09f50403d784bc00f81e5f16f2e54edacf90c0c))
- update cypher ([b430636d](https://github.com/firstlovecenter/fl-pastoral-care/commit/b430636d2db050285b6fdccf2703dce405e50eb0))
- adds constituency id to constituency equipment records that have a null id ([#266](https://github.com/firstlovecenter/fl-pastoral-care/pull/266)) ([05d87a4a](https://github.com/firstlovecenter/fl-pastoral-care/commit/05d87a4a4bde7fbbbee2b3da91cc5c78ef6f41d9))
- cypher for correcting service aggregates ([13aef0c9](https://github.com/firstlovecenter/fl-pastoral-care/commit/13aef0c9cc2fc4e680161dcd4ab0e8e93f14d768))
- fix bacenta component service structure and queries ([a06ef0f4](https://github.com/firstlovecenter/fl-pastoral-care/commit/a06ef0f4599fce9449e9a33522e3539cb4cde6ad))

##### Refactors

- implement servant and user dashboards using the new aggregate system ([b60a221f](https://github.com/firstlovecenter/fl-pastoral-care/commit/b60a221f32def7d4643818b899fbcb7fd1e874b0))
- implement graphs using the new system of explicit aggregates ([d0239317](https://github.com/firstlovecenter/fl-pastoral-care/commit/d0239317e3d59ae9240fc9b9f7116db25cfc91e5))

## 5.0.0 (2022-09-01)

##### Chores

- clean up all code that refers to the history substructure ([76397dee](https://github.com/firstlovecenter/fl-pastoral-care/commit/76397dee0fc094c814079f565b5d0de28040f14d))
- update package-lock.json file ([e4f6efe0](https://github.com/firstlovecenter/fl-pastoral-care/commit/e4f6efe060d88a5116a8ef2919ab3f4131ae25bc))

##### Continuous Integration

- create templates for pr and issues ([c582c626](https://github.com/firstlovecenter/fl-pastoral-care/commit/c582c6264f6c266b8ca6c373f9d0788a3f52b09f))
- write cypher to aggregate all bacenta records as explicit values ([55ad20c3](https://github.com/firstlovecenter/fl-pastoral-care/commit/55ad20c3ccb1fb709355d5c0aa1d4b07db562cf8))
- update snapshots for PlusMinus components ([5cf777ef](https://github.com/firstlovecenter/fl-pastoral-care/commit/5cf777efb0131c7fdcc2cdb625476b929e156701))

##### Documentation Changes

- adjust PR template ([2326806b](https://github.com/firstlovecenter/fl-pastoral-care/commit/2326806bd9c6944f463c0a89b7fd97ef6a67123a))
- **pwa:** update name and description in manifest.json ([17077656](https://github.com/firstlovecenter/fl-pastoral-care/commit/170776568d71622d6cb1cfee5aa12453c2717c1d))

##### New Features

- implement pwa functionality in the web app ([#244](https://github.com/firstlovecenter/fl-pastoral-care/pull/244)) ([c0e57246](https://github.com/firstlovecenter/fl-pastoral-care/commit/c0e5724645ad780fa60ffe08d3b73c490e8bdaba))
- bacenta top ups can now be individually adjusted ([0469f0e9](https://github.com/firstlovecenter/fl-pastoral-care/commit/0469f0e90452d833f9d6c2c9f3a3ac2858c91cb6))
- adjusted bacenta top ups based on new constituency top ups ([4f91c857](https://github.com/firstlovecenter/fl-pastoral-care/commit/4f91c857124e7c395bd7bd6746a54fef98be3722))
- implement pull to refresh for arrivals and defaulters ([de17a362](https://github.com/firstlovecenter/fl-pastoral-care/commit/de17a362158a3f18af043f4eb6ef0ddf38ae2f4e))
- partway done with the pull to refresh feature ([0bb7dacf](https://github.com/firstlovecenter/fl-pastoral-care/commit/0bb7dacf217a8ae7e11b46d7ddb6335354b78f66))
- implements defaulters flow for equipment campaign ([#240](https://github.com/firstlovecenter/fl-pastoral-care/pull/240)) ([e8044d7b](https://github.com/firstlovecenter/fl-pastoral-care/commit/e8044d7b367b806f4ada6dbb0f4001b5a91ba852))
- implement adding campus admin ([ad3ed15d](https://github.com/firstlovecenter/fl-pastoral-care/commit/ad3ed15d4c9713808a9ee43d54a2fd58ed67f79b))
- admin-245 modify arrivals cypher and gql to follow new standard ([a4a7e964](https://github.com/firstlovecenter/fl-pastoral-care/commit/a4a7e9648901a8f4d3e07fc9ff442ab80e27ef8b))
- admin-245 modify queries in the front end and graphs to reflect new aggregate data ([349981d2](https://github.com/firstlovecenter/fl-pastoral-care/commit/349981d2e5dbfd6e3dac459b465e6e2f74e75033))
- admin-245 implement in resolver to write aggregate data to higher churches explicitly ([05c1e6e3](https://github.com/firstlovecenter/fl-pastoral-care/commit/05c1e6e335f392c0a9514553127fbb1ed526d35d))
- admin-247 implements sms and email notifications when an equipm… ([#230](https://github.com/firstlovecenter/fl-pastoral-care/pull/230)) ([0627877f](https://github.com/firstlovecenter/fl-pastoral-care/commit/0627877fd43f7371939868e638a07c221086426b))
- writes test for quick facts card ([#229](https://github.com/firstlovecenter/fl-pastoral-care/pull/229)) ([6d5d1aec](https://github.com/firstlovecenter/fl-pastoral-care/commit/6d5d1aecff4baa528ace71bb20a8e9231b8c2245))
- add a ten minute buffer for arrival counting ([63979677](https://github.com/firstlovecenter/fl-pastoral-care/commit/6397967795fb5563a608e3195297ace2560b41d7))
- recording arrival time aggregates data to put on the bussing record ([af88a379](https://github.com/firstlovecenter/fl-pastoral-care/commit/af88a3795f79135385ef7959d4c626fe9c573d0c))
- implement feature for filtering bus type on counting screen ([000cf351](https://github.com/firstlovecenter/fl-pastoral-care/commit/000cf3519f0b7c07be3fbbfdaaea1d7fa2e521cd))
- implement add and edit campus with mutations ([#223](https://github.com/firstlovecenter/fl-pastoral-care/pull/223)) ([6393fb26](https://github.com/firstlovecenter/fl-pastoral-care/commit/6393fb268392e87649f533788cb58daac50df1cd))
- lock ministry to campus ([45feb2dc](https://github.com/firstlovecenter/fl-pastoral-care/commit/45feb2dc12532b9a6e45ddfa4864b28200a3ab8e))

##### Bug Fixes

- change active fellowship count to fellowship to campaign trends ([8117f79a](https://github.com/firstlovecenter/fl-pastoral-care/commit/8117f79ac7b626471930d25e442e98982b3a8325))
- fix submit button loading ux for constituency and fellowship equipment form ([#264](https://github.com/firstlovecenter/fl-pastoral-care/pull/264)) ([59610de4](https://github.com/firstlovecenter/fl-pastoral-care/commit/59610de4bcf67cf92c8af8daf4992771c0eec979))
- fix broken cypher in identifying campaign start and end dates ([b5abdf47](https://github.com/firstlovecenter/fl-pastoral-care/commit/b5abdf4746b77cd288d7b5ce5b509e202e96e25a))
- changes structure of check equipment deadline statement ([c35581f3](https://github.com/firstlovecenter/fl-pastoral-care/commit/c35581f374e4751ac9de8f5ccbacc500fc0e80cc))
- changes date used in check for the deadline ([7ed2addf](https://github.com/firstlovecenter/fl-pastoral-care/commit/7ed2addf211495e05a7f16b26692fbe42b6761af))
- add permission so that fellowship leaders can view campaigns button in nav ([ad57472c](https://github.com/firstlovecenter/fl-pastoral-care/commit/ad57472cfba877baed3efe5d4868d0d05e1a5389))
- fix submit button loading ux and vacation churches not appearing ([b727ac10](https://github.com/firstlovecenter/fl-pastoral-care/commit/b727ac109dc9e466350dba9993d0121ab7abf79b))
- change sprinter top up on constituency page to sprinter cost ([883d45b9](https://github.com/firstlovecenter/fl-pastoral-care/commit/883d45b944dbff1774bec2eeefcd7f6dedb54ac3))
- correct sabbath timer and adjust so that sabbath starts at 4 am on Monday ([#251](https://github.com/firstlovecenter/fl-pastoral-care/pull/251)) ([4171cccf](https://github.com/firstlovecenter/fl-pastoral-care/commit/4171cccf4e1e8f7c9d095b10a9ddb907328b3f95))
- install workbox dependencies and web-vitals ([3b58e7e7](https://github.com/firstlovecenter/fl-pastoral-care/commit/3b58e7e73584d2db91a6955c40c3122fedbee633))
- register service worker ([31d402c0](https://github.com/firstlovecenter/fl-pastoral-care/commit/31d402c0d43865b4fb83cfeedbed5bca5add52c6))
- installed service worker files from the CRA pwa template ([f0442692](https://github.com/firstlovecenter/fl-pastoral-care/commit/f044269293a8be200c596885aeaa5e798c053f87))
- fix typo breaking mutation to create constituency ([6a405f6d](https://github.com/firstlovecenter/fl-pastoral-care/commit/6a405f6dc429ccb1e4b7265ee660e0cb54dc9483))
- minor equipment defaulters bugs ([#242](https://github.com/firstlovecenter/fl-pastoral-care/pull/242)) ([18a8d2ab](https://github.com/firstlovecenter/fl-pastoral-care/commit/18a8d2ab6803172e075a2bbb8f39981142d13551))
- fixes errors in equipment campaign defaulters queries ([fa004fd8](https://github.com/firstlovecenter/fl-pastoral-care/commit/fa004fd8e1aaf1c230c252630f671b53d2f7d266))
- change 'alert' to 'alertMsg' for churchdetails page ([d82bda76](https://github.com/firstlovecenter/fl-pastoral-care/commit/d82bda76313dd73aae04ee101db4cc050e6f24d7))
- add optional match to equipment defaulters queries ([de028485](https://github.com/firstlovecenter/fl-pastoral-care/commit/de02848585adceb30faaebe8c2583b1f79908e1d))
- fix bug preventing admins from updating bacenta info ([1519b508](https://github.com/firstlovecenter/fl-pastoral-care/commit/1519b508a31eedc951cbf44569a81bda847736d9))
- change 'number of busses' to 'number of urvans' ([cc422f7d](https://github.com/firstlovecenter/fl-pastoral-care/commit/cc422f7d42aa5cd7777b49c771d1602640fb6383))
- fix error in calculating bussing details on recording vehicle arrival time ([c22d7cc2](https://github.com/firstlovecenter/fl-pastoral-care/commit/c22d7cc2a9cc7473cee74f76ca707c2903c12ccf))
- adjust permissions to accommodate leaders and admin of two church levels ([c924e863](https://github.com/firstlovecenter/fl-pastoral-care/commit/c924e863f2a1365f43d677b2ef3ed134db9cfb6a))
- fix bug preventing members from uploading banking slip ([bbae105b](https://github.com/firstlovecenter/fl-pastoral-care/commit/bbae105be55923a968f6a38f95d8aac18dd1943e))
- fix breaking change resulting from typo ([0344cc21](https://github.com/firstlovecenter/fl-pastoral-care/commit/0344cc21fb7f6ef4717a9edabda58f9612738f1a))
- fix typo on intial loading ([d74a0c5c](https://github.com/firstlovecenter/fl-pastoral-care/commit/d74a0c5cd6c1d53da8bb799b99805c1fdc2429c9))
- fix data leak when using context to set permissions ([29a799c2](https://github.com/firstlovecenter/fl-pastoral-care/commit/29a799c2f19f23a6eb1dfe7ec1bb235d65ee5f15))
- fix bug breaking member list loading page ([92bc946b](https://github.com/firstlovecenter/fl-pastoral-care/commit/92bc946b57f6507beab1587f2616ddbfe325d190))
- comment out unused code for arrrivals isToday ([e76a469a](https://github.com/firstlovecenter/fl-pastoral-care/commit/e76a469a52fa9018d9b861b46a4b29304e8a50b9))
- update to allow filling of bussing forms on every day of the week ([cdcfe89c](https://github.com/firstlovecenter/fl-pastoral-care/commit/cdcfe89c39700d5decad8ac59dd9f9bc10bb3773))
- solve mior bug with regards to aggrregating of data ([11f76dcb](https://github.com/firstlovecenter/fl-pastoral-care/commit/11f76dcbd38daf6e4f43aef6a8cc930fab142da0))
- solve petty arrivals issues with countig and form filling ([4cc7e817](https://github.com/firstlovecenter/fl-pastoral-care/commit/4cc7e81773e005f3b1dd816fa2cce2fa48a95284))
- clean up errant 'WHERE EXISTS' from arrivals cypher queries ([d161ee12](https://github.com/firstlovecenter/fl-pastoral-care/commit/d161ee12003bbb704d03f320e433324c65801f10))
- revert bussing aggregate to use bussinng records ([7d4d83d8](https://github.com/firstlovecenter/fl-pastoral-care/commit/7d4d83d8b64b1029301f71b39a7c7632bd710368))
- adjust arrivals summary data structure ([ae2232fd](https://github.com/firstlovecenter/fl-pastoral-care/commit/ae2232fdc481c2063de5034c557db23ffde87aeb))
- adjust arrivals cypher to use bussing record ([77577be8](https://github.com/firstlovecenter/fl-pastoral-care/commit/77577be8bd32c9407b053a0a85b1cdc6b40512c0))
- fix campus bussing calculations ([fc772123](https://github.com/firstlovecenter/fl-pastoral-care/commit/fc7721239420d7767aca97e4d38532b3d43fc5a7))
- prevent creation of excess vehicle record nodes ([1fba9717](https://github.com/firstlovecenter/fl-pastoral-care/commit/1fba971748ffbb2817945550d397e5b2a40b4f00))
- use leader declaration for on the way count ([179a97fa](https://github.com/firstlovecenter/fl-pastoral-care/commit/179a97fab74cd6e715646f219a1827d023cbfd4a))
- added confirmation of in and out to counters ([18792ef7](https://github.com/firstlovecenter/fl-pastoral-care/commit/18792ef7989c5a0e675216e6eaf8220016d0b9b9))
- update permissions for vehicle form details ([b3af284b](https://github.com/firstlovecenter/fl-pastoral-care/commit/b3af284b8014966a29bba0263ea7319bb563cc96))
- update query to find the bacentas that have arrived 2 ([022aec97](https://github.com/firstlovecenter/fl-pastoral-care/commit/022aec971887fa6b20494a7bba0cd4d2d179369d))
- update query to find bacentasHaveArrived on all church levels ([a12dfa20](https://github.com/firstlovecenter/fl-pastoral-care/commit/a12dfa205d9c86d4378002e2be8ee1a20dc7134d))
- update query to find bacentasHaveArrived ([a877095d](https://github.com/firstlovecenter/fl-pastoral-care/commit/a877095dc62d37f4c902ff6d76d767729279b715))
- update import statement in SearchStream ([02af09c6](https://github.com/firstlovecenter/fl-pastoral-care/commit/02af09c6a3c7e0bf14e333f772b3be915f951263))
- update memberByEmail query ([de6a6280](https://github.com/firstlovecenter/fl-pastoral-care/commit/de6a6280d8e366d27f00630b1f766780307667ed))
- update cross oversight search functionality ([3dbb633b](https://github.com/firstlovecenter/fl-pastoral-care/commit/3dbb633bdb4ac8c3b61a154d2bc096863aad075a))
- implement error text to show when pre mobilisation is closed ([f004d2d5](https://github.com/firstlovecenter/fl-pastoral-care/commit/f004d2d510999a4ce3c88388520684831ea71849))
- fix bug preventing zone 0 bacentas from filling ([24b60a7c](https://github.com/firstlovecenter/fl-pastoral-care/commit/24b60a7c11afaa2d4de75a3b9653003fb4352da2))
- allow bacentas in zone 0 to fill out their form ([44c3e21e](https://github.com/firstlovecenter/fl-pastoral-care/commit/44c3e21ee5bd67c8d8f014c9a22e9a1a98749439))

##### Performance Improvements

- aggregate church target on write and not read ([d683e39d](https://github.com/firstlovecenter/fl-pastoral-care/commit/d683e39da140f526b29640b8fd816cf59180022c))

##### Refactors

- convert Cachebuster component to typescript ([3f6e04f3](https://github.com/firstlovecenter/fl-pastoral-care/commit/3f6e04f313426963af490c810d9247f57e959076))
- convert App.js to tsx file ([1b9ae9ed](https://github.com/firstlovecenter/fl-pastoral-care/commit/1b9ae9ed0059ea24ece36ea8e2a7aa8040b993ca))

### 4.9.0 (2022-08-12)

##### Chores

- merge deploy into feature/arrivals 3.0 ([dff1b338](https://github.com/firstlovecenter/fl-pastoral-care/commit/dff1b338dc3828ef9db249c8fb232af783035636))
- update formik components across arrivals feature ([98388886](https://github.com/firstlovecenter/fl-pastoral-care/commit/983888866da98ad41e48d9321f99b78228751e72))
- update import statements ([e1f4688b](https://github.com/firstlovecenter/fl-pastoral-care/commit/e1f4688b50f46c90d066a4e8445ab87915e7b09e))
- merge deploy into feature/arrivals ([8cc448ab](https://github.com/firstlovecenter/fl-pastoral-care/commit/8cc448ab73fbdc5178813d1cd4991669a7ffa2fa))
- installed typescript-eslint ([afc42c57](https://github.com/firstlovecenter/fl-pastoral-care/commit/afc42c57f971c560987866fdc244bef231b084c4))
- merge deploy into feature/arrivals and updated packages ([4f71faeb](https://github.com/firstlovecenter/fl-pastoral-care/commit/4f71faeb1cc016a54abd6e461f726643fe394942))
- updated the short name in the manifest file ([52e8baa9](https://github.com/firstlovecenter/fl-pastoral-care/commit/52e8baa9302f6c55d7971d3af3dad620c37ee3c1))

##### New Features

- implement bacenta and vehicle count view on all church levels ([35b87824](https://github.com/firstlovecenter/fl-pastoral-care/commit/35b87824c8025eaa2d64c15ae86e0855c2f1d96c))
- fix calculations in api cypher to accommodate vehicles filling forms ([222650f6](https://github.com/firstlovecenter/fl-pastoral-care/commit/222650f6cc8c989c6a83ee832b7b10ecb464ff9b))
- implement api feature for handlig in and out bussing ([7c0872d3](https://github.com/firstlovecenter/fl-pastoral-care/commit/7c0872d30fb720e132cdaca635b01a61aa340408))
- implement feature so that counters can count in vehicles ([f620b356](https://github.com/firstlovecenter/fl-pastoral-care/commit/f620b356d9239ef08dd4477d182ebb4911135c52))
- enable bacenta leaders to fill bussing data on a per vehicle basis ([20edbfa2](https://github.com/firstlovecenter/fl-pastoral-care/commit/20edbfa21c051163b74df24866741042130d58f5))
- implement filling of form by entering details of one vehicle ([ee4849e0](https://github.com/firstlovecenter/fl-pastoral-care/commit/ee4849e0f091fe666077689a5358e4d37d63ca74))
- implement changing of constituency zone ([27d29bcb](https://github.com/firstlovecenter/fl-pastoral-care/commit/27d29bcb35dc3f313208db2ffefcd524221e8f85))
- implement fix for oversight permissions ([#220](https://github.com/firstlovecenter/fl-pastoral-care/pull/220)) ([13c4de6e](https://github.com/firstlovecenter/fl-pastoral-care/commit/13c4de6e7144fa789119e90f57a0a808fe925f2a))
- implement Equipment Campaign data collection ([#218](https://github.com/firstlovecenter/fl-pastoral-care/pull/218)) ([1dc71126](https://github.com/firstlovecenter/fl-pastoral-care/commit/1dc7112659f0006c41053c3045e6fe0321434c6e))
- implement a list of counters instead of a single one ([4ca4c30f](https://github.com/firstlovecenter/fl-pastoral-care/commit/4ca4c30ff10fadbeef12c9bde7ed1dedc57ecdf6))
- implement feature additional busses and ubers can be counted and added ([f5afd970](https://github.com/firstlovecenter/fl-pastoral-care/commit/f5afd9702f13e0f6933b8dc11de13fe6dd31338a))
- merge counting and confirming procedures into one ([bde85660](https://github.com/firstlovecenter/fl-pastoral-care/commit/bde8566077bf18cf1630a16a4d3df8b1829e9b46))
- remove picture submission for on the way form ([1a845d3e](https://github.com/firstlovecenter/fl-pastoral-care/commit/1a845d3eececc81629e7cdeae22876e293be9642))

##### Bug Fixes

- fix bug when setting a new arrivals admin ([5ef74b41](https://github.com/firstlovecenter/fl-pastoral-care/commit/5ef74b41aeccedcdeaadf0dfd0f1b0dc300315f8))
- fix broken styling on autosuggest components ([004d737a](https://github.com/firstlovecenter/fl-pastoral-care/commit/004d737af4a52ac79f77552e477ce3f4da25a2c4))
- clean up bacentas to be counted so that couted bacentas don't show ([611e4399](https://github.com/firstlovecenter/fl-pastoral-care/commit/611e4399b7b90788602bd9ca3ef86bb87dcfda5e))
- remove unused imports ([23814473](https://github.com/firstlovecenter/fl-pastoral-care/commit/2381447359f815cfe895a4f5b163bac9ff1def56))
- fix breaking change on displaychurchsdetails ([c66734b3](https://github.com/firstlovecenter/fl-pastoral-care/commit/c66734b3770fa6b9620672a0d2c4a0e9b328aa1f))
- changes permission passed as prop to display bacenta details page ([#222](https://github.com/firstlovecenter/fl-pastoral-care/pull/222)) ([a0ebe507](https://github.com/firstlovecenter/fl-pastoral-care/commit/a0ebe5078f48e31ec839938a26a40c9667e109d0))
- update clean up cypher in beforeNextUpdate.cql ([dbe2d9a0](https://github.com/firstlovecenter/fl-pastoral-care/commit/dbe2d9a057153b9cf9825af62bad72ced73d4b91))
- clean lingering references to arrivals confirmer ([ffbd73ac](https://github.com/firstlovecenter/fl-pastoral-care/commit/ffbd73ac80d1f775a7d21e4a16341ed18175a79c))

##### Refactors

- change 'cost' to 'top up' ([a868f6cd](https://github.com/firstlovecenter/fl-pastoral-care/commit/a868f6cd85a1b7eabeeb35a70ab3810a95f1594e))
- convert useComponentQuery to tsx ([b8d29a43](https://github.com/firstlovecenter/fl-pastoral-care/commit/b8d29a4366b1afbc9fe16e39732d6be5c84fafed))
- convert /user-profile to ts ([af5b88cc](https://github.com/firstlovecenter/fl-pastoral-care/commit/af5b88cc90600d0bba96eb846505aa3f2e1f7083))
- convert /update files to ts ([6393837b](https://github.com/firstlovecenter/fl-pastoral-care/commit/6393837bd7797ee733c85a7aa79436dcb43c8ecc))
- convert /create and /reusable-forms to ts ([dc83bf68](https://github.com/firstlovecenter/fl-pastoral-care/commit/dc83bf6802fe9df7c0cb62f7e0d0ef4967648cc2))
- convert fellowship and bacenta form to typescript ([c3cdbdab](https://github.com/firstlovecenter/fl-pastoral-care/commit/c3cdbdab43cc6a0d368fa83f20edd4cf0fdc3591))
- convert /defaulters files to typescript ([8382bc7a](https://github.com/firstlovecenter/fl-pastoral-care/commit/8382bc7aebd5ced64e17bed3f8f3db033cbc28a3))
- delete formikControl component ([9217ee35](https://github.com/firstlovecenter/fl-pastoral-care/commit/9217ee35760b9a7365e8b9ef3d42ad0b3555fff1))
- remove unused import of FormikControl ([350a8282](https://github.com/firstlovecenter/fl-pastoral-care/commit/350a8282ced8c5c2cfdb6610698cf8822886dd78))
- convert a few files in the defaulters folder to ts ([8a41c780](https://github.com/firstlovecenter/fl-pastoral-care/commit/8a41c780dbf1ebdbe5e8c39c80e9dab82ede6345))
- convert Navigation.jsx to tsx ([e0f583ca](https://github.com/firstlovecenter/fl-pastoral-care/commit/e0f583ca9767524f18035351be420e1019e9af59))
- convert services/graphs files to typescript ([9a8cca76](https://github.com/firstlovecenter/fl-pastoral-care/commit/9a8cca762b4955e8b7fdbd6183e688b08812bb14))
- convert misc components to typescript ([eb5b939b](https://github.com/firstlovecenter/fl-pastoral-care/commit/eb5b939bdf5908d5bab940e0c6d8369397036e13))
- convert login page to typescript ([1cd3322b](https://github.com/firstlovecenter/fl-pastoral-care/commit/1cd3322bd092af8e43cf695cb42e24795c105b91))
- convert formik components to typescript eliminated FormikControl component ([bf2861ad](https://github.com/firstlovecenter/fl-pastoral-care/commit/bf2861adc4cafb784a5d8e1772d0e555373e59d8))

#### 4.8.1 (2022-07-29)

##### Chores

- version bump ([9b73e85b](https://github.com/firstlovecenter/fl-pastoral-care/commit/9b73e85b7c541e0918cc805228abba9aaef9a61a))
- fix merge conflicts merging deploy into arrivals ([5b297b79](https://github.com/firstlovecenter/fl-pastoral-care/commit/5b297b7984fd3f650f8e81804bd20307ca3ce6b5))

##### New Features

- change map style to satellite images ([1b93e7d5](https://github.com/firstlovecenter/fl-pastoral-care/commit/1b93e7d517b255f458e996501b0eec9263875a4b))
- register members as IDL members ([e2641b3d](https://github.com/firstlovecenter/fl-pastoral-care/commit/e2641b3d61f34d35cb0705b0cc78e60db2905dd4))
- **arrivals:**
  - admin-205 implements a notice to show when arrivals is over for all levels ([a164761e](https://github.com/firstlovecenter/fl-pastoral-care/commit/a164761e8fa20b6935331fb604d65ed05876089a))
  - admin-205 implemments a message for leaders who have filled on the way form ([e9121a70](https://github.com/firstlovecenter/fl-pastoral-care/commit/e9121a706b4dea02641a7ed76813e55a896842c1))
  - admin-205 adjusts bussing top up to account for leaders contribution ([40baaad3](https://github.com/firstlovecenter/fl-pastoral-care/commit/40baaad39a30f062f75daccf3d5beb65a8875cea))
  - admin-205 implements a curse on submitting bussing data deceitfully ([fc0ebdba](https://github.com/firstlovecenter/fl-pastoral-care/commit/fc0ebdba2296faed44720c9d7201ca95898bfa72))
  - admin-205 added form option to submit personal contribution ([696ded44](https://github.com/firstlovecenter/fl-pastoral-care/commit/696ded44dcb7ecb02a7ef150d9efadd2ed0a4b95))
  - admin-205 implements edits to the SMS that is sent on bussing ([e057f5a4](https://github.com/firstlovecenter/fl-pastoral-care/commit/e057f5a4b8dc22c4dd4d2405616e378d7996cfc6))
  - admin-210 implements zones in the database ([bc282fd7](https://github.com/firstlovecenter/fl-pastoral-care/commit/bc282fd7dd640722f3c95f1b3fa32ff98719325f))
  - introduces the concept of zones to the bacentas ([cfe6cce1](https://github.com/firstlovecenter/fl-pastoral-care/commit/cfe6cce1384bfc0abad0af3a66e634b04065f786))
  - admin-209 edits bussing form to accept number of sprinters and urvans ([f7d174be](https://github.com/firstlovecenter/fl-pastoral-care/commit/f7d174bec674027a12baab1ce107c25c308d4dae))

##### Bug Fixes

- format of email messages on servant status change ([c391bc66](https://github.com/firstlovecenter/fl-pastoral-care/commit/c391bc66a8db960d2b26c026df1c1d48ff38eba4))
- update the description in the index.html tag ([a9543b53](https://github.com/firstlovecenter/fl-pastoral-care/commit/a9543b539d5b9b1284f3479f06ea3428ba03d855))
- change the phrase 'service picture' to 'family picture' ([66c9b0bd](https://github.com/firstlovecenter/fl-pastoral-care/commit/66c9b0bd5f6f99327b488e9ae965183061475ae6))
- delete hidden netlify directory ([83ac2ecc](https://github.com/firstlovecenter/fl-pastoral-care/commit/83ac2ecc6f23f563d5aa5c0566b36aabb526c864))
- change IDL node lable to idl ([65b22df8](https://github.com/firstlovecenter/fl-pastoral-care/commit/65b22df8234c14d82741adcf738c404f2ae7e61a))
- fixes error resolving file path in arrivals time ([1ed403b0](https://github.com/firstlovecenter/fl-pastoral-care/commit/1ed403b06e9d41bdad00711bfca1265ee45ad881))
- **anagkazo-banking:** show loading icon when adding treasurer ([95ba4445](https://github.com/firstlovecenter/fl-pastoral-care/commit/95ba444579dae949e9b03a5f63979a6e017bf917))

##### Refactors

- remove hardcoded oversightId value ([94023eea](https://github.com/firstlovecenter/fl-pastoral-care/commit/94023eea11645ec2307497566d3438755b25ad7b))
- converted service details to tsx ([5b9ffb8f](https://github.com/firstlovecenter/fl-pastoral-care/commit/5b9ffb8f2df69cac9b7316366993a4d71ab4cbf1))
- converted service form component to tsx ([00d98ecd](https://github.com/firstlovecenter/fl-pastoral-care/commit/00d98ecd9212d655ef5a79232f587ffba43aff77))
- converts quickfacts components to typescript ([#217](https://github.com/firstlovecenter/fl-pastoral-care/pull/217)) ([cd9eb1f8](https://github.com/firstlovecenter/fl-pastoral-care/commit/cd9eb1f8ea4c5d4a44c6f0656e5655725aa0a690))
- converted maps components to typescript ([cb4f6b29](https://github.com/firstlovecenter/fl-pastoral-care/commit/cb4f6b293b71d93baec977f1a7a0db516a0143d1))
- reorganises code in the arrivals folder ([260cc89a](https://github.com/firstlovecenter/fl-pastoral-care/commit/260cc89acb4bac91ba06e1beadfcbffe8572833d))

### 4.8.0 (2022-07-29)

##### Chores

- fix merge conflicts merging deploy into arrivals ([5b297b79](https://github.com/firstlovecenter/fl-pastoral-care/commit/5b297b7984fd3f650f8e81804bd20307ca3ce6b5))

##### New Features

- change map style to satellite images ([1b93e7d5](https://github.com/firstlovecenter/fl-pastoral-care/commit/1b93e7d517b255f458e996501b0eec9263875a4b))
- register members as IDL members ([e2641b3d](https://github.com/firstlovecenter/fl-pastoral-care/commit/e2641b3d61f34d35cb0705b0cc78e60db2905dd4))
- **arrivals:**
  - admin-205 implements a notice to show when arrivals is over for all levels ([a164761e](https://github.com/firstlovecenter/fl-pastoral-care/commit/a164761e8fa20b6935331fb604d65ed05876089a))
  - admin-205 implemments a message for leaders who have filled on the way form ([e9121a70](https://github.com/firstlovecenter/fl-pastoral-care/commit/e9121a706b4dea02641a7ed76813e55a896842c1))
  - admin-205 adjusts bussing top up to account for leaders contribution ([40baaad3](https://github.com/firstlovecenter/fl-pastoral-care/commit/40baaad39a30f062f75daccf3d5beb65a8875cea))
  - admin-205 implements a curse on submitting bussing data deceitfully ([fc0ebdba](https://github.com/firstlovecenter/fl-pastoral-care/commit/fc0ebdba2296faed44720c9d7201ca95898bfa72))
  - admin-205 added form option to submit personal contribution ([696ded44](https://github.com/firstlovecenter/fl-pastoral-care/commit/696ded44dcb7ecb02a7ef150d9efadd2ed0a4b95))
  - admin-205 implements edits to the SMS that is sent on bussing ([e057f5a4](https://github.com/firstlovecenter/fl-pastoral-care/commit/e057f5a4b8dc22c4dd4d2405616e378d7996cfc6))
  - admin-210 implements zones in the database ([bc282fd7](https://github.com/firstlovecenter/fl-pastoral-care/commit/bc282fd7dd640722f3c95f1b3fa32ff98719325f))
  - introduces the concept of zones to the bacentas ([cfe6cce1](https://github.com/firstlovecenter/fl-pastoral-care/commit/cfe6cce1384bfc0abad0af3a66e634b04065f786))
  - admin-209 edits bussing form to accept number of sprinters and urvans ([f7d174be](https://github.com/firstlovecenter/fl-pastoral-care/commit/f7d174bec674027a12baab1ce107c25c308d4dae))

##### Bug Fixes

- format of email messages on servant status change ([c391bc66](https://github.com/firstlovecenter/fl-pastoral-care/commit/c391bc66a8db960d2b26c026df1c1d48ff38eba4))
- update the description in the index.html tag ([a9543b53](https://github.com/firstlovecenter/fl-pastoral-care/commit/a9543b539d5b9b1284f3479f06ea3428ba03d855))
- change the phrase 'service picture' to 'family picture' ([66c9b0bd](https://github.com/firstlovecenter/fl-pastoral-care/commit/66c9b0bd5f6f99327b488e9ae965183061475ae6))
- delete hidden netlify directory ([83ac2ecc](https://github.com/firstlovecenter/fl-pastoral-care/commit/83ac2ecc6f23f563d5aa5c0566b36aabb526c864))
- change IDL node lable to idl ([65b22df8](https://github.com/firstlovecenter/fl-pastoral-care/commit/65b22df8234c14d82741adcf738c404f2ae7e61a))
- fixes error resolving file path in arrivals time ([1ed403b0](https://github.com/firstlovecenter/fl-pastoral-care/commit/1ed403b06e9d41bdad00711bfca1265ee45ad881))
- **anagkazo-banking:** show loading icon when adding treasurer ([95ba4445](https://github.com/firstlovecenter/fl-pastoral-care/commit/95ba444579dae949e9b03a5f63979a6e017bf917))

##### Refactors

- remove hardcoded oversightId value ([94023eea](https://github.com/firstlovecenter/fl-pastoral-care/commit/94023eea11645ec2307497566d3438755b25ad7b))
- converted service details to tsx ([5b9ffb8f](https://github.com/firstlovecenter/fl-pastoral-care/commit/5b9ffb8f2df69cac9b7316366993a4d71ab4cbf1))
- converted service form component to tsx ([00d98ecd](https://github.com/firstlovecenter/fl-pastoral-care/commit/00d98ecd9212d655ef5a79232f587ffba43aff77))
- converts quickfacts components to typescript ([#217](https://github.com/firstlovecenter/fl-pastoral-care/pull/217)) ([cd9eb1f8](https://github.com/firstlovecenter/fl-pastoral-care/commit/cd9eb1f8ea4c5d4a44c6f0656e5655725aa0a690))
- converted maps components to typescript ([cb4f6b29](https://github.com/firstlovecenter/fl-pastoral-care/commit/cb4f6b293b71d93baec977f1a7a0db516a0143d1))
- reorganises code in the arrivals folder ([260cc89a](https://github.com/firstlovecenter/fl-pastoral-care/commit/260cc89acb4bac91ba06e1beadfcbffe8572833d))

### 4.7.0 (2022-07-22)

##### New Features

- adds location as a field when creating a member admin-228 ([93aedb5d](https://github.com/firstlovecenter/fl-pastoral-care/commit/93aedb5d2bbee76e4075fb09e21ebf141c372b79))
- implemented sending of message upon both counting and arrival ([e4cadcf9](https://github.com/firstlovecenter/fl-pastoral-care/commit/e4cadcf9dd11e712afeff7aa10b59155086422e7))
- **service-forms:** enable council level and higher to fill multiple times in a week ([24216ae7](https://github.com/firstlovecenter/fl-pastoral-care/commit/24216ae7e479ccd3642a96860a9931ae90eeb816))

##### Bug Fixes

- adds no data component to comfirm anagkazo banking ([d06ce743](https://github.com/firstlovecenter/fl-pastoral-care/commit/d06ce743da7604213a8143f0a867de2c97259531))
- removes link to bacenta services ([46d27602](https://github.com/firstlovecenter/fl-pastoral-care/commit/46d27602e0726c943efc28d29cf044cc1777bf29))
- edits the error message to show the date of the last outstanding service ([4f23de2e](https://github.com/firstlovecenter/fl-pastoral-care/commit/4f23de2eae23c2883258f939f430a0a0b57c40b1))
- fixing error on update bacenta mutation in leader properties on title property ([570addf5](https://github.com/firstlovecenter/fl-pastoral-care/commit/570addf5dcae04554525863560ed3b13c41be2e1))
- fixed bug preventing service forms button from appearing on the church details ([97cf4fb5](https://github.com/firstlovecenter/fl-pastoral-care/commit/97cf4fb5a161012dc854668a524fa8a253a201a9))
- fixed bug preventing members from being updated ([96ab8cb0](https://github.com/firstlovecenter/fl-pastoral-care/commit/96ab8cb0d26a71c764ced16ac5fe7062690f40a9))
- fixed bug breaking the ui when viewing bacenta details ([002d1d12](https://github.com/firstlovecenter/fl-pastoral-care/commit/002d1d122ef362d2ca731f2311c79ed4d1d9b200))
- allowed leaders to enter 0 as bussing cost ([67f8893b](https://github.com/firstlovecenter/fl-pastoral-care/commit/67f8893b7fd0e889b4fa33e12fc0e852bbb686c5))
- when a leader fills the form, they should still see the countdown time ([5ff3aa8c](https://github.com/firstlovecenter/fl-pastoral-care/commit/5ff3aa8c25d608e5e90223991022bf7d720219f5))
- fixed bug preventing the right top up from being set ([0d6c0b09](https://github.com/firstlovecenter/fl-pastoral-care/commit/0d6c0b099c586e85dfcb5c910762719a59dc4048))
- named more graphql queries throught the repo ([b5594956](https://github.com/firstlovecenter/fl-pastoral-care/commit/b5594956aa87bac24a7c68197b5aca6df9e399ed))
- pushed fix for making counters and confirmers ([d23aad61](https://github.com/firstlovecenter/fl-pastoral-care/commit/d23aad61b3817fbd38e80601ddb0f71dfdefb80d))
- fixed bug preventing arrivalscounters from counting ([bf489d11](https://github.com/firstlovecenter/fl-pastoral-care/commit/bf489d1156a1fefb01bc388612b8117b4e2976cc))
- brought back resolver to update member emails ([3aabffbd](https://github.com/firstlovecenter/fl-pastoral-care/commit/3aabffbd0c9cc342d87715c9cedf26b164910b02))
- improved getLastServiceRecord to handle for when a record is doubled ([832d0ac6](https://github.com/firstlovecenter/fl-pastoral-care/commit/832d0ac6f8335ea5603080b0637f051c4b94bddf))
- **arrivals:** fixed bug where arrivals amount was not set ([59aa9585](https://github.com/firstlovecenter/fl-pastoral-care/commit/59aa9585e829c3613aa43cc69e3d6dbdb6f1ff1e))
- **defaulters:** fixed bug preventing constituency admins from viewin defaulters ([36e19f12](https://github.com/firstlovecenter/fl-pastoral-care/commit/36e19f1251bbbc598d0ac60b0e3eb3116cfb2c16))

##### Performance Improvements

- finally figured out how to get DEBUG logs working again ([d1183328](https://github.com/firstlovecenter/fl-pastoral-care/commit/d1183328aacf207b49bf727fc5e793806c7af699))

##### Refactors

- remove midweek banking home and change midweek banking button to add treasurers ([1f3850f4](https://github.com/firstlovecenter/fl-pastoral-care/commit/1f3850f47bb4c4b37d890ccb360fbaa77e0ffbb5))
- began converting formik components to typescript ([11ddb84c](https://github.com/firstlovecenter/fl-pastoral-care/commit/11ddb84c5649981c4b64f0a45f1c20418e2fb3b5))
- refactored display church details into ts ([c4340947](https://github.com/firstlovecenter/fl-pastoral-care/commit/c4340947538f86b11f5410b4ea8fd8e634857f8a))

#### 4.6.4 (2022-07-15)

#### 4.6.3 (2022-07-15)

##### Chores

- updated jd-date-utils ([4b9e3f52](https://github.com/firstlovecenter/fl-pastoral-care/commit/4b9e3f52bcd820343fa27985db4e25798c9f19c9))
- named anonymous graphql queries according to conventions ([9060d629](https://github.com/firstlovecenter/fl-pastoral-care/commit/9060d6296f962bf02f1e160e6e761e943a4d15c1))
- audited package.json files ([9ed37816](https://github.com/firstlovecenter/fl-pastoral-care/commit/9ed37816ff4b035c72cfa26643135e3c01c358fe))

##### Bug Fixes

- fixed issue where leaders were unable to bank their offerings if they had old services unbanked ([0ebedb49](https://github.com/firstlovecenter/fl-pastoral-care/commit/0ebedb496cdc9ff326f411276660d2413c8db1f9))

##### Performance Improvements

- edited gitignore to track apollo.config.js file ([350088d7](https://github.com/firstlovecenter/fl-pastoral-care/commit/350088d7ca89544f15b6bdb9fc3215103b8e37be))

#### 4.6.1 (2022-07-15)

##### Chores

- uninstalled gql parser in favour of a global install ([1e97fbdb](https://github.com/firstlovecenter/fl-pastoral-care/commit/1e97fbdb52df96012bae9d7d09d22dc3bcf5720b))
- fixed merge conflicts bringing deploy into arrivals ([bbce0745](https://github.com/firstlovecenter/fl-pastoral-care/commit/bbce0745bb8cb188d911c51bbea4608df6324b73))

##### New Features

- **arrivals:**
  - implemented feature to prevent users from giving themselves arrivals roles ([b788f264](https://github.com/firstlovecenter/fl-pastoral-care/commit/b788f264c6c340cfe8d8e5689e4a0768b67f7b9f))
  - admin-205 made isArrivalsToday function ready for prod ([c929d268](https://github.com/firstlovecenter/fl-pastoral-care/commit/c929d268eb4619454111dda2d6f47c44904f1599))
  - admin-205 implemented 'Bacentas Below 8' button on all church pages ([ac72d0ea](https://github.com/firstlovecenter/fl-pastoral-care/commit/ac72d0eaf79a9bbce9272d124cc0768d03bf0b10))
  - admin-205 implemented SMS notifications for those who have confirmed attendance ([7ec54b62](https://github.com/firstlovecenter/fl-pastoral-care/commit/7ec54b627fe3563b526370722a5d17dfcd1b9aca))
  - admin-205 added a 5 minute buffer for arrivals confirmers ([deac14ab](https://github.com/firstlovecenter/fl-pastoral-care/commit/deac14ab52538b4a6a2625f440e652d95204541c))
  - admin-211 changed attendance to bus payment attendance ([16561236](https://github.com/firstlovecenter/fl-pastoral-care/commit/165612365f8224582206f9a2a5fe871b0bd41af0))
  - implemented feature to check whether today is a day of bussing per stream ([3e3d9538](https://github.com/firstlovecenter/fl-pastoral-care/commit/3e3d9538e1d7aafde5ebd73a72ad8dadec55f9a0))

##### Bug Fixes

- fixed issue where newDuplicateServiceLog was not being created in createHistorySubstructure ([031fc8b6](https://github.com/firstlovecenter/fl-pastoral-care/commit/031fc8b6c43efa49d20aef6258d0fa59d618a406))
- implemented mnotify fix of changing the word code to OTP ([39b153c4](https://github.com/firstlovecenter/fl-pastoral-care/commit/39b153c407ed3ed3989d76de3ba3b3fe1193eedd))
- added date function in front of dates to prevent wrong date in lastButOneServiceRecord cypher ([#208](https://github.com/firstlovecenter/fl-pastoral-care/pull/208)) ([a7a8a27b](https://github.com/firstlovecenter/fl-pastoral-care/commit/a7a8a27baaaf427b82ad5cd5a93c3def0ab1ec8b))
- admin-213 implemented alert to show when the arrivals window is open ([a044d6f4](https://github.com/firstlovecenter/fl-pastoral-care/commit/a044d6f4c7c8fe39cbf2e99ee66c5c34cda8fbd8))
- **banking:** admin-219 corrected cypher query for getting the last service record ([3251d228](https://github.com/firstlovecenter/fl-pastoral-care/commit/3251d228e9bd5a3a2606bc7bc17c024e2a8eb277))

##### Performance Improvements

- updated date-utils package ([7285e511](https://github.com/firstlovecenter/fl-pastoral-care/commit/7285e511894333cd5fc8a5ef4c0fe14f607d01c2))
- included config for using official apollo vscode extension ([8f3c8e39](https://github.com/firstlovecenter/fl-pastoral-care/commit/8f3c8e3913e7993586c792029879c4e9a3f222ed))
- added a package to check graphql queries ([b5389e68](https://github.com/firstlovecenter/fl-pastoral-care/commit/b5389e680830d79cb461824c25eea7cea2d9e25d))
- admin-214 implemented constraints on database ([5f420843](https://github.com/firstlovecenter/fl-pastoral-care/commit/5f420843b2eb5bedbe99d51b80e54c541d28ee28))

##### Refactors

- **banking:**
  - replaced double quotes with single quotes ([9979f456](https://github.com/firstlovecenter/fl-pastoral-care/commit/9979f45679336c13d214cf7b01b0f2371b8d2154))
  - made the typing stricter on the lastServiceBanked function ([3c3a483b](https://github.com/firstlovecenter/fl-pastoral-care/commit/3c3a483bdb6734d923a86f3370574cc46af9734c))
  - rewrote the lastButOneServiceRecord for easier legibility ([a6e6418a](https://github.com/firstlovecenter/fl-pastoral-care/commit/a6e6418a4be0172d45eb36310809aae27c4ce458))
- **arrivals:** converted all arrivals js files to ts ([2b268539](https://github.com/firstlovecenter/fl-pastoral-care/commit/2b268539c5b231c1329b927f2abb983009a80628))

### 4.6.0 (2022-07-13)

##### Chores

- version bump 4.5.1 ([9bf52b12](https://github.com/firstlovecenter/fl-pastoral-care/commit/9bf52b12a80aff5d60a7449a6daf45d4d0365b77))

##### New Features

- **anagkazo-banking:** admin-159 implmented flow for adding and removing treasurers ([13b70d81](https://github.com/firstlovecenter/fl-pastoral-care/commit/13b70d81a8081b40948839d08c71e60c4ddf0142))
- implement confirm anagkazo banking ([#200](https://github.com/firstlovecenter/fl-pastoral-care/pull/200)) ([faa57942](https://github.com/firstlovecenter/fl-pastoral-care/commit/faa579424d2ef83cab6919c7580bcae852dc0ad2))

##### Bug Fixes

- console.log resolvers in netlify functions ([82a3f69f](https://github.com/firstlovecenter/fl-pastoral-care/commit/82a3f69f8262a578da7466867f6e5608aea11772))
- trying to get resolvers to work in prod ([66fd460b](https://github.com/firstlovecenter/fl-pastoral-care/commit/66fd460b95d4e6fb366785213a89ed0eaf01a8f5))
- fixed minor bugs that occurred after the refactor ([d2a063a8](https://github.com/firstlovecenter/fl-pastoral-care/commit/d2a063a832be43f62e407542dd35bb1a013666ed))

##### Refactors

- typed front end files ([ce03ebae](https://github.com/firstlovecenter/fl-pastoral-care/commit/ce03ebae9cd681cda1665a7de3bc129b25f978fd))
- converted frontend components to typescript ([3eec1381](https://github.com/firstlovecenter/fl-pastoral-care/commit/3eec13816905969fafb81c0e9ffde8757098dfd4))
- typed front end files ([7296d5d2](https://github.com/firstlovecenter/fl-pastoral-care/commit/7296d5d2b654259bf16c149e44ede49f5f54b131))
- corrected types after merge operation ([30e1bff8](https://github.com/firstlovecenter/fl-pastoral-care/commit/30e1bff8113af502b07caca676fb4f07551e1dc2))
- converted backend resolvers to typescript ([93907cde](https://github.com/firstlovecenter/fl-pastoral-care/commit/93907cde51262812fd90b73ee486e434b447bd8f))
- typed global-utils in frontend ([aa613b11](https://github.com/firstlovecenter/fl-pastoral-care/commit/aa613b119c0a1ec20cccf8ab81cca8bfee698e1a))
- proper implementation of default export ([7e87db1f](https://github.com/firstlovecenter/fl-pastoral-care/commit/7e87db1f4f32436b884a02f61719a14ff2bb4289))
- switched from named export to default export in graphql.js ([c1d871db](https://github.com/firstlovecenter/fl-pastoral-care/commit/c1d871db9cd2730f0b84b84e0113f6c4c78d38cb))
- updated tsconfig to transpile to es2020 ([f902d9c7](https://github.com/firstlovecenter/fl-pastoral-care/commit/f902d9c7e279055758e29a7933923c2db60637db))
- updated tsconfig to transpile to es2022 ([cdd33d7c](https://github.com/firstlovecenter/fl-pastoral-care/commit/cdd33d7c078611c6a8efec760ae49b7649b62155))
- updated dependencies on api ([ed2a25ea](https://github.com/firstlovecenter/fl-pastoral-care/commit/ed2a25ea2a4955ec8ebebcef2df32faf926eaff0))
- changed the version of javascript transpiled ([30caa183](https://github.com/firstlovecenter/fl-pastoral-care/commit/30caa1830411d4c89798e9aa8279d18935394065))
- added command in netlify.toml to copy resolvers to functions file ([5aab0ca6](https://github.com/firstlovecenter/fl-pastoral-care/commit/5aab0ca6ed81466df33c07949d233d4927035ff3))
- removed prebuild script ([8e17e5db](https://github.com/firstlovecenter/fl-pastoral-care/commit/8e17e5db7cefd2ee4cec15d3577c9511bd00b6ff))
- reverted to last good typescript backend ([2255f706](https://github.com/firstlovecenter/fl-pastoral-care/commit/2255f7065c967d54f8f39b7e1e5cbb3fb160eb58))
- cracked the bugs and got the server running ([3797b867](https://github.com/firstlovecenter/fl-pastoral-care/commit/3797b86740fdfcb3725e614fdceac7185e3b5ebb))
- corrected import statements ([fa12a3c9](https://github.com/firstlovecenter/fl-pastoral-care/commit/fa12a3c973021adc39ddcfe87afc6fe2bc664836))
- corrected import of aggregates ([21d6d311](https://github.com/firstlovecenter/fl-pastoral-care/commit/21d6d31172ee9df59c80024f7383dbf359ca266c))
- reorganised resolvers import order ([5bf67b18](https://github.com/firstlovecenter/fl-pastoral-care/commit/5bf67b18dbb1a63378a5c78ecf6134eca09dcd9f))
- added notification function in backend ([61f97700](https://github.com/firstlovecenter/fl-pastoral-care/commit/61f9770042e73e0514041452de017ededa07e50b))
- added an any type to Errors ([e3988da3](https://github.com/firstlovecenter/fl-pastoral-care/commit/e3988da3d62d12c4740c9d51fb59c0236257688d))
- refactored notify and servant cypher for disconnectTeller ([cce1f660](https://github.com/firstlovecenter/fl-pastoral-care/commit/cce1f660dd1780459d328fbd2e2447063ce100d5))
- converted aggregates folder to typescript ([5f07660f](https://github.com/firstlovecenter/fl-pastoral-care/commit/5f07660fdfeea5411e3a1aaddc7cd393c4362ae4))
- taken out mailgun package so that the backend runs ([e6d9819a](https://github.com/firstlovecenter/fl-pastoral-care/commit/e6d9819a4040043349837fe011791dea17516f62))
- converted arrivals to typescript ([314c66fe](https://github.com/firstlovecenter/fl-pastoral-care/commit/314c66feec97611bf039756f1ea4b8967455908b))
- banking resolvers ([18e825dc](https://github.com/firstlovecenter/fl-pastoral-care/commit/18e825dc346a0f1b2945a9fa79af8bbbee8a873a))
- testing if backend will deploy ([27c1be16](https://github.com/firstlovecenter/fl-pastoral-care/commit/27c1be1655438bfef8ba365bd0a0981f701b6fee))
- refactored services folder ([d0fb5926](https://github.com/firstlovecenter/fl-pastoral-care/commit/d0fb5926922e8bf6fad1f1a071a06ab203a9720e))
- refactored no-income folder ([33f12837](https://github.com/firstlovecenter/fl-pastoral-care/commit/33f1283761f3e529a34c12ec00c2e502e42fccfc))
- refactored remove servant mutation to typescript ([be70a707](https://github.com/firstlovecenter/fl-pastoral-care/commit/be70a70751ada954721cc711dd9adf4f45b53a39))
- refactored make servant mutation ([aaaa17bd](https://github.com/firstlovecenter/fl-pastoral-care/commit/aaaa17bd8e821cfc407539ca6de3ebc08038a347))
- converted anagkazo treasury to typescript ([02b58351](https://github.com/firstlovecenter/fl-pastoral-care/commit/02b583515b75545aa6a78733e68a221654627939))
- reforing backedn part 1 ([c65a6a51](https://github.com/firstlovecenter/fl-pastoral-care/commit/c65a6a515e25790fd474293be11dd352d4e18986))
- refactored financial-utils ([c6c2c8fa](https://github.com/firstlovecenter/fl-pastoral-care/commit/c6c2c8faf31589cbee4c356035ee30639871a9ff))

#### 4.5.1 (2022-07-09)

##### Chores

- updated package-lock.json ([981f52ec](https://github.com/firstlovecenter/fl-pastoral-care/commit/981f52ecce443127568bf0ed1a74fa35466c227c))
- merge branch 'fldata22-feature-implement-uk-no-income' into deploy ([01137b76](https://github.com/firstlovecenter/fl-pastoral-care/commit/01137b76c4a7cd975abebf8292fdb42f280d796a))
- updated outdated dependencies ([3176d109](https://github.com/firstlovecenter/fl-pastoral-care/commit/3176d109192e6bc432d725483c0985bb5c678325))
- updated outdated dependencies ([68cbc5ea](https://github.com/firstlovecenter/fl-pastoral-care/commit/68cbc5ea949cc1bb3425c558568f76718365daa3))

##### New Features

- finished front end for choosing treasurers ([43df24e6](https://github.com/firstlovecenter/fl-pastoral-care/commit/43df24e6a9623b0d4f83c198f9b3dd244f49e65c))
- implemented front end for choosing anagkazo treasurers ([affd483d](https://github.com/firstlovecenter/fl-pastoral-care/commit/affd483d750d8ee8964c116b85f4dc3bfaf9ff52))
- implemented anagkazo menu item ([ca65f2bf](https://github.com/firstlovecenter/fl-pastoral-care/commit/ca65f2bf76116935f3c6cc5ef28a815519f03d8f))
- cleaned component service logs with multiple HAS_COMPONENT rels ([c2051491](https://github.com/firstlovecenter/fl-pastoral-care/commit/c20514917a563f7327f3811d5982c54f0a8f062d))
- cleaned component service logs with multiple HAS_COMPONENT rels ([08fd22e1](https://github.com/firstlovecenter/fl-pastoral-care/commit/08fd22e15a79b66f4d4c4ec62071bab55dc389c9))
- merged with deploy ([78c4a15b](https://github.com/firstlovecenter/fl-pastoral-care/commit/78c4a15bae5adae4bac382a8c8314d3083817059))
- implemented types on a few components ([44a18c75](https://github.com/firstlovecenter/fl-pastoral-care/commit/44a18c75a1fa9eba059d61a62d7bbb4b024f0508))
- installed typescript in the app ([#196](https://github.com/firstlovecenter/fl-pastoral-care/pull/196)) ([0f79da21](https://github.com/firstlovecenter/fl-pastoral-care/commit/0f79da211294d067b2627ccee972a282c69f0035))
- refactor pages to include UK defaulters and service details-fix ([bf2d864d](https://github.com/firstlovecenter/fl-pastoral-care/commit/bf2d864dfec39673881a8587ac374a5734fa6be6))
- added google analytics tracking to web site ([4f5d5e9b](https://github.com/firstlovecenter/fl-pastoral-care/commit/4f5d5e9b30de2802fd4000585c487e281875ffc4))
- refactor pages to include UK defaulters and service details-fix ([46462479](https://github.com/firstlovecenter/fl-pastoral-care/commit/46462479fd2ad36492ddaead314f0b6c73ee6162))
- refactor pages to include UK defaulters and service details ([8121fe46](https://github.com/firstlovecenter/fl-pastoral-care/commit/8121fe467b0b3d8c631bd77274ceb3bd27a84110))
- refactor pages to include UK ([b8cc3cc1](https://github.com/firstlovecenter/fl-pastoral-care/commit/b8cc3cc14b80d50d79734b43cb51130e6782a39b))
- update cypher to support UK submission ([a4255d7b](https://github.com/firstlovecenter/fl-pastoral-care/commit/a4255d7bb738c466e14cb94516edefc86dd8f1a1))
- added transactionId to self banking receipt for easy debugging ([e87fcadd](https://github.com/firstlovecenter/fl-pastoral-care/commit/e87fcadd844eb47fcce07da7f4211fb3141eecb2))
- admin-159 implemented backend mutations for creating anagkazo tellers ([8a8c6326](https://github.com/firstlovecenter/fl-pastoral-care/commit/8a8c6326975528505032cfb9f5268635c2157768))
- added a property on currentUser called 'noIncomeTracking' for UK port ([b35a4405](https://github.com/firstlovecenter/fl-pastoral-care/commit/b35a4405e516f632564c5d5588f858bfe5548609))
- admin-171 implemented a map that loads with First Love Center in view ([bb0f43d7](https://github.com/firstlovecenter/fl-pastoral-care/commit/bb0f43d731b999a66bd3bc5b977ecad2897b48e9))

##### Bug Fixes

- testing new eslint settings ([5da978ce](https://github.com/firstlovecenter/fl-pastoral-care/commit/5da978ce5499532985945cef58ead0e932795bce))
- fixed @fldata22 bug where services with income could not be filled ([a5d8ed1f](https://github.com/firstlovecenter/fl-pastoral-care/commit/a5d8ed1feee983309ec118fe3646ec27389f9a67))
- corrected readme ([1b7df982](https://github.com/firstlovecenter/fl-pastoral-care/commit/1b7df9824f3206ae9bb9b542faa3d00dfa3370f4))
- downgraded neo4j/graphql library to 3.4.0 ([5b2296aa](https://github.com/firstlovecenter/fl-pastoral-care/commit/5b2296aa81bea9ffe8a3fa934dceec9d6f245e37))
- added @dabick task of connecting service records withouth LOGGED_BY ([3f5fc96a](https://github.com/firstlovecenter/fl-pastoral-care/commit/3f5fc96a12266870a03d27021cfa280dd58bbaf1))
- cleaned up service records which had multiple HAS_SERVICE and HAS_BUSSING ([e0a2b12d](https://github.com/firstlovecenter/fl-pastoral-care/commit/e0a2b12d619680bd6f9c187a18737027c5ee692f))
- updated api deps and increased icon sizes ([8e492865](https://github.com/firstlovecenter/fl-pastoral-care/commit/8e492865a2b16dd756175413059d89042feb951f))
- updated state of the cypher TODOs ([4e380221](https://github.com/firstlovecenter/fl-pastoral-care/commit/4e38022132d574c0d666ac3719caa465e785975a))
- downgraded neo4j/graphql library to 3.4.0 ([5e3dbf43](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e3dbf435d8797215a1a5248e93d6ec6b258d579))
- added @dabick task of connecting service records withouth LOGGED_BY ([ed009a3a](https://github.com/firstlovecenter/fl-pastoral-care/commit/ed009a3a9c4822aa296d1086e9d427b13275d4a9))
- cleaned up service records which had multiple HAS_SERVICE and HAS_BUSSING ([1d40a87d](https://github.com/firstlovecenter/fl-pastoral-care/commit/1d40a87d44f984b38316f148b5da194c87a22a90))
- updated api deps and increased icon sizes ([b231532f](https://github.com/firstlovecenter/fl-pastoral-care/commit/b231532fa3cd0470c1a8afd8abfdd416088f5c64))
- updated state of the cypher TODOs ([26fb5dd2](https://github.com/firstlovecenter/fl-pastoral-care/commit/26fb5dd2b124f5674a6fea8ae6d0c3d5a5c64eb4))
- updated ApolloWrapper Component ([4f49b03f](https://github.com/firstlovecenter/fl-pastoral-care/commit/4f49b03fd552668f8179c5c6a9dea8ce4d2e7796))
- updated color of text on error screen for visibility ([60a9d0d1](https://github.com/firstlovecenter/fl-pastoral-care/commit/60a9d0d1c034819d9cfcaff5e0352c81c99166a3))
- updated cyphher todos ([c33c0387](https://github.com/firstlovecenter/fl-pastoral-care/commit/c33c0387534e1a09c2be7fb452033910a50caabc))
- wrote 4 cypher query todos ([fa65dd9d](https://github.com/firstlovecenter/fl-pastoral-care/commit/fa65dd9d5944dc4e68bcec7752efbcdaf9aef14b))
- changed from using localStorage to sessionStorage ([85eea3cc](https://github.com/firstlovecenter/fl-pastoral-care/commit/85eea3ccaa4ac267275b82eebaf6519c17991cbc))
- admin-199 removed typescript and fixed no service bug ([8516b679](https://github.com/firstlovecenter/fl-pastoral-care/commit/8516b679856160e90dfde49c29b261769368ca88))
- admin-197 fixed bug where updating name of constituency not working ([981fc70b](https://github.com/firstlovecenter/fl-pastoral-care/commit/981fc70bf4dc3779a44bfe3d91371fb978092501))
- implemented overseeing pastor on the user profile page ([6f03459c](https://github.com/firstlovecenter/fl-pastoral-care/commit/6f03459cf4fe4f3da72d0cadb6bcde41b688a5d8))
- updated neo4j dependencies for memberdisplay ([54b8df1f](https://github.com/firstlovecenter/fl-pastoral-care/commit/54b8df1fcced326ff43228f912954c3a646f8ece))
- exposed maps for gathering and stream admins ([bd56acc3](https://github.com/firstlovecenter/fl-pastoral-care/commit/bd56acc3045e73ff43b6f09bd3e25d34c7320c94))
- ux improvements for the self banking feature ([f1132989](https://github.com/firstlovecenter/fl-pastoral-care/commit/f11329896985cf19f1b59c719699e568852b4224))
- corrected permissions for self banking ([815f597e](https://github.com/firstlovecenter/fl-pastoral-care/commit/815f597e83a1b791eebaa2881321465e73799528))
- update cypher to support UK submission ([2c3cf29f](https://github.com/firstlovecenter/fl-pastoral-care/commit/2c3cf29f98e8799bd668bd50deec329d21dcc7b6))
- corrected roles for menu items ([13ec0f13](https://github.com/firstlovecenter/fl-pastoral-care/commit/13ec0f13adf30e203b90a47872a899b7461e0251))
- removed member count from servant list ([3a940663](https://github.com/firstlovecenter/fl-pastoral-care/commit/3a940663325607036609ad2b5cbd2e261b5f892b))
- admin-195 fixed issue where users were not gettig option to fill service from service menu" ([a7bd10df](https://github.com/firstlovecenter/fl-pastoral-care/commit/a7bd10df9df26601830e53ffdd7ca133382769d8))
- admin-194 fix cypher error in log member history mutation ([d76ca07e](https://github.com/firstlovecenter/fl-pastoral-care/commit/d76ca07ef9781cf52e8e6b8f76f2fc3b2ea4ca40))
- removed console log ([7e39ba66](https://github.com/firstlovecenter/fl-pastoral-care/commit/7e39ba66d190c5dedea606d6e9e472ca0892be4a))
- increase the width of the Login button ([0814fff3](https://github.com/firstlovecenter/fl-pastoral-care/commit/0814fff3cbd828dbdd1bd5a7a784b2e682fb9d24))
- fix login page to Klenam standard ([77d6359a](https://github.com/firstlovecenter/fl-pastoral-care/commit/77d6359a174ef584135d786a2f9f2b1370017385))
- updated memberByEmail Query ([abefd6c3](https://github.com/firstlovecenter/fl-pastoral-care/commit/abefd6c38a12cc30e8fa42df449e0c4ab4ebbf9e))
- fix issue where quick facts details is undefined ([dd128b60](https://github.com/firstlovecenter/fl-pastoral-care/commit/dd128b60072c324ee7d14925de916f840aa27d82))
- admin-182 fixed bug with banking slip picture upload ([3507ec75](https://github.com/firstlovecenter/fl-pastoral-care/commit/3507ec750d51c349b092ec54a8c08098acc46f54))
- added roles for arrivals in servant church list ([a2e30f9a](https://github.com/firstlovecenter/fl-pastoral-care/commit/a2e30f9af3cf665018886b50c808d73e01bb8639))
- removed irritating border from bussing dropdown ([1b3e2704](https://github.com/firstlovecenter/fl-pastoral-care/commit/1b3e27047226db1a5ddfb24881d9bc93200e76c2))

##### Other Changes

- //github.com/firstlovecenter/fl-admin-portal into feature-ADMIN-187-refactor-role-view ([2f7542fb](https://github.com/firstlovecenter/fl-pastoral-care/commit/2f7542fbaee09802b0037c4bbaaf425e8634214c))
- //github.com/i-mmanuel/fl-admin-portal into feature-ADMIN-187-refactor-role-view ([bfcbc167](https://github.com/firstlovecenter/fl-pastoral-care/commit/bfcbc16758e70f0ca4460f05d6ebe04532b5ec5a))
- //github.com/i-mmanuel/fl-admin-portal into feature-ADMIN-187-refactor-role-view ([4eeee606](https://github.com/firstlovecenter/fl-pastoral-care/commit/4eeee6062d5f6d6bb8a97a12e547e45e1b1b4a33))

##### Performance Improvements

- fixed issue of 404 page showing up on refresh ([3a5fdc42](https://github.com/firstlovecenter/fl-pastoral-care/commit/3a5fdc42e1289f4ab414ff37e8bd398e90856c8f))
- converted base-component to typescript ([97d58fab](https://github.com/firstlovecenter/fl-pastoral-care/commit/97d58fabe698f5137f52eb54823803e02794ce9f))
- cleaned up churches which have more than one current history log ([e69c3b55](https://github.com/firstlovecenter/fl-pastoral-care/commit/e69c3b55360ca99511359cdb398f6c92e17b1faf))
- implemented better ux when the service form fails ([33ace975](https://github.com/firstlovecenter/fl-pastoral-care/commit/33ace975bd80106a839ac12b9fe26387d33c7d7c))
- moved sabbath higher in the component tree ([918270c1](https://github.com/firstlovecenter/fl-pastoral-care/commit/918270c1f9f71ca5595ff4f69013b0e83e6f9819))
- brought make the unified roles query ([e39e05b5](https://github.com/firstlovecenter/fl-pastoral-care/commit/e39e05b552a9f01d7eec94a3ebbbadee5d8136bb))
- removed memberCount from servant list query ([e3f08684](https://github.com/firstlovecenter/fl-pastoral-care/commit/e3f08684e6b153d27707dacfe3d08e383d011ee6))
- optimised queries for user roles on app load ([fbc70d2c](https://github.com/firstlovecenter/fl-pastoral-care/commit/fbc70d2cde3b52e027eccdd67dfadb276668ccaf))

##### Refactors

- began converting arrivals to typescript ([04ab086f](https://github.com/firstlovecenter/fl-pastoral-care/commit/04ab086f4f58362ac563a4e35885c9a75ec2c449))
- converted some general componenets to typescript ([fd68e8f5](https://github.com/firstlovecenter/fl-pastoral-care/commit/fd68e8f57541e6bed093f2c8b719ac426848cc9d))
- converted a few more components to typescript ([cfd24de7](https://github.com/firstlovecenter/fl-pastoral-care/commit/cfd24de7d96e9c16a42e8d8395c24609a19a9d41))
- converted deetails, church lists, and banking components to typescript ([34695aa8](https://github.com/firstlovecenter/fl-pastoral-care/commit/34695aa8a65f72e08fc82c57eea878ca6f9ea974))
- record services components changed to typescript ([bd1d4a3e](https://github.com/firstlovecenter/fl-pastoral-care/commit/bd1d4a3e439cf3f6592b8135dd529afeb9b0515d))
- refactored RoleView into typescript ([48f8934c](https://github.com/firstlovecenter/fl-pastoral-care/commit/48f8934ca921b998504ca9b11a8d3dafe6234ecf))
- renamed components with 'london' and 'uk' ([5e27ccb7](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e27ccb71f88b70c027a63ca9c5ef4b46591a795))
- refactored more components into typescript 2 ([33c19eeb](https://github.com/firstlovecenter/fl-pastoral-care/commit/33c19eeb1217dad7a8985a524c548cca7c392631))
- refactored more components into typescript 2 ([5bd83c19](https://github.com/firstlovecenter/fl-pastoral-care/commit/5bd83c19c1845a3eb57e88be36b905169ec599aa))
- refactored more components into typescript ([8ae1dba6](https://github.com/firstlovecenter/fl-pastoral-care/commit/8ae1dba69d4b354b4155bf798faadbb62691c3e7))
- refactor slider into a component and added a placeholder ([5a2b0dd9](https://github.com/firstlovecenter/fl-pastoral-care/commit/5a2b0dd9cd7ae3ebc7abe0c5bafb9d81917ce764))
- deleted useless code ([c7f2f0f5](https://github.com/firstlovecenter/fl-pastoral-care/commit/c7f2f0f51b1bf0c604d62a94ea4dec6bd127314a))

#### 0.5.22 (2022-05-28)

##### New Features

- poimen-44 implemented a floating sidenav menu button ([f44a06cf](https://github.com/firstlovecenter/fl-pastoral-care/commit/f44a06cf0bdb798e143240664b8fb8e08f97a5c6))

##### Bug Fixes

- added missing dependency for react-scripts ([e78834e1](https://github.com/firstlovecenter/fl-pastoral-care/commit/e78834e1e3efc9f480c58c5beea02b1854bccabb))
- implemented typescript on resolvers.ts ([07faf298](https://github.com/firstlovecenter/fl-pastoral-care/commit/07faf298b832097c3283a9294ac1a6be89fc4ec4))
- modified exports from graphql-schema.js ([dc25aeb6](https://github.com/firstlovecenter/fl-pastoral-care/commit/dc25aeb69d55bfba8dde584ab10551678c57f1e8))
- disable graphql-schema ([0f878ea6](https://github.com/firstlovecenter/fl-pastoral-care/commit/0f878ea6a0c3dec6a0ed301bde17adf4551c7439))
- minor fixes ([e771c03b](https://github.com/firstlovecenter/fl-pastoral-care/commit/e771c03b479a2babee71cbef0f0de9d5c2911058))
- converted import to module statements ([84e06076](https://github.com/firstlovecenter/fl-pastoral-care/commit/84e0607662e9f942077486bd8095954d80992ded))
- removed type module ([4ab1a6a1](https://github.com/firstlovecenter/fl-pastoral-care/commit/4ab1a6a188d9229c75cff3b80bc54574d425e466))
- added type module ([cf8f6eb7](https://github.com/firstlovecenter/fl-pastoral-care/commit/cf8f6eb76daa62877b7ae6103be1d6dd71a83c44))

#### 0.5.22 (2022-05-28)

##### New Features

- poimen-44 implemented a floating sidenav menu button ([f44a06cf](https://github.com/firstlovecenter/fl-pastoral-care/commit/f44a06cf0bdb798e143240664b8fb8e08f97a5c6))

##### Bug Fixes

- added missing dependency for react-scripts ([e78834e1](https://github.com/firstlovecenter/fl-pastoral-care/commit/e78834e1e3efc9f480c58c5beea02b1854bccabb))
- implemented typescript on resolvers.ts ([07faf298](https://github.com/firstlovecenter/fl-pastoral-care/commit/07faf298b832097c3283a9294ac1a6be89fc4ec4))
- modified exports from graphql-schema.js ([dc25aeb6](https://github.com/firstlovecenter/fl-pastoral-care/commit/dc25aeb69d55bfba8dde584ab10551678c57f1e8))
- disable graphql-schema ([0f878ea6](https://github.com/firstlovecenter/fl-pastoral-care/commit/0f878ea6a0c3dec6a0ed301bde17adf4551c7439))
- minor fixes ([e771c03b](https://github.com/firstlovecenter/fl-pastoral-care/commit/e771c03b479a2babee71cbef0f0de9d5c2911058))
- converted import to module statements ([84e06076](https://github.com/firstlovecenter/fl-pastoral-care/commit/84e0607662e9f942077486bd8095954d80992ded))
- removed type module ([4ab1a6a1](https://github.com/firstlovecenter/fl-pastoral-care/commit/4ab1a6a188d9229c75cff3b80bc54574d425e466))
- added type module ([cf8f6eb7](https://github.com/firstlovecenter/fl-pastoral-care/commit/cf8f6eb76daa62877b7ae6103be1d6dd71a83c44))

#### 0.5.21 (2022-05-21)

##### Bug Fixes

- rewrote api backend as js ([5e92294b](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e92294b9f8a396fd85ade04be720ab4929e866c))

#### 0.5.20 (2022-05-21)

#### 0.5.19 (2022-05-21)

#### 0.5.18 (2022-05-21)

#### 0.5.17 (2022-05-21)

#### 0.5.16 (2022-05-21)

##### Documentation Changes

- updated CHANGELOG.md ([84b43dfd](https://github.com/firstlovecenter/fl-pastoral-care/commit/84b43dfd881ef3117c0c8cee82f0bd8fc9ad7fb2))
- updated CHANGELOG.md ([834d9362](https://github.com/firstlovecenter/fl-pastoral-care/commit/834d9362ebe1148b5b53f470856a9f5938469f0f))
- updated CHANGELOG.md ([2a053311](https://github.com/firstlovecenter/fl-pastoral-care/commit/2a0533110568a3eb347a73f6abb485497debeafe))
- updated CHANGELOG.md ([e517287b](https://github.com/firstlovecenter/fl-pastoral-care/commit/e517287bdc8041d8930c4c67e0e7b3f2b372797b))

##### Bug Fixes

- fixing issue with the graphql.js ([dcb01258](https://github.com/firstlovecenter/fl-pastoral-care/commit/dcb01258b1c3a0ab9dfaf8212a87535182652f54))
- fixing issue with the graphql.js ([77d0feb9](https://github.com/firstlovecenter/fl-pastoral-care/commit/77d0feb96d659f2f3204a90a8164f4433bfb0faa))

#### 0.5.15 (2022-05-21)

##### Documentation Changes

- updated CHANGELOG.md ([834d9362](https://github.com/firstlovecenter/fl-pastoral-care/commit/834d9362ebe1148b5b53f470856a9f5938469f0f))
- updated CHANGELOG.md ([2a053311](https://github.com/firstlovecenter/fl-pastoral-care/commit/2a0533110568a3eb347a73f6abb485497debeafe))
- updated CHANGELOG.md ([e517287b](https://github.com/firstlovecenter/fl-pastoral-care/commit/e517287bdc8041d8930c4c67e0e7b3f2b372797b))

##### Bug Fixes

- fixing issue with the graphql.js ([77d0feb9](https://github.com/firstlovecenter/fl-pastoral-care/commit/77d0feb96d659f2f3204a90a8164f4433bfb0faa))

#### 0.5.15 (2022-05-21)

##### Documentation Changes

- updated CHANGELOG.md ([2a053311](https://github.com/firstlovecenter/fl-pastoral-care/commit/2a0533110568a3eb347a73f6abb485497debeafe))
- updated CHANGELOG.md ([e517287b](https://github.com/firstlovecenter/fl-pastoral-care/commit/e517287bdc8041d8930c4c67e0e7b3f2b372797b))

##### Bug Fixes

- fixing issue with the graphql.js ([77d0feb9](https://github.com/firstlovecenter/fl-pastoral-care/commit/77d0feb96d659f2f3204a90a8164f4433bfb0faa))

#### 0.5.15 (2022-05-21)

##### Documentation Changes

- updated CHANGELOG.md ([e517287b](https://github.com/firstlovecenter/fl-pastoral-care/commit/e517287bdc8041d8930c4c67e0e7b3f2b372797b))

##### Bug Fixes

- fixing issue with the graphql.js ([77d0feb9](https://github.com/firstlovecenter/fl-pastoral-care/commit/77d0feb96d659f2f3204a90a8164f4433bfb0faa))

#### 0.5.15 (2022-05-21)

##### Bug Fixes

- fixing issue with the graphql.js ([77d0feb9](https://github.com/firstlovecenter/fl-pastoral-care/commit/77d0feb96d659f2f3204a90a8164f4433bfb0faa))

#### 0.5.14 (2022-05-21)

##### Bug Fixes

- fixing issue with the graphql.js ([5e4ad5fe](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e4ad5fefd14a72b45da82608bdf8045be27fff3))

#### 0.5.13 (2022-05-21)

##### Bug Fixes

- fixing issue with the graphql.js ([f10e7cef](https://github.com/firstlovecenter/fl-pastoral-care/commit/f10e7cef9791ca88845069ad5e5aada07d87e92e))

#### 0.5.12 (2022-05-21)

##### Bug Fixes

- solved issue with apollo client settings ([38a8aad8](https://github.com/firstlovecenter/fl-pastoral-care/commit/38a8aad85fb5b7d78f9f30a30daad09e64e8df40))

#### 0.5.11 (2022-05-21)

##### Bug Fixes

- logging env variables ([393b95e3](https://github.com/firstlovecenter/fl-pastoral-care/commit/393b95e3a1176f82416574723d230ee565ebc3c0))

#### 0.5.10 (2022-05-21)

##### Bug Fixes

- set up so that auth0 id is used to get the current user ([953a3e89](https://github.com/firstlovecenter/fl-pastoral-care/commit/953a3e890b0a6242bb6014d80c2136ce99b5c63d))

#### 0.5.9 (2022-05-20)

##### New Features

- poimen-38 implemented a drawer component ([dfcc9601](https://github.com/firstlovecenter/fl-pastoral-care/commit/dfcc96018607e25b9f1539c251402acce6eaa200))
- poimen-42 implemented a CacheBuster component for cache invalidation ([668b909c](https://github.com/firstlovecenter/fl-pastoral-care/commit/668b909c47c4b9b6dcc52ce9666e5c5d58f774df))

#### 0.5.8 (2022-05-20)

##### Chores

- pulled from remote deploy ([151cfc0d](https://github.com/firstlovecenter/fl-pastoral-care/commit/151cfc0dfdafdff8fd03610fe099ec4a3f6f99ca))

##### Documentation Changes

- updated CHANGELOG.md ([fa76dfab](https://github.com/firstlovecenter/fl-pastoral-care/commit/fa76dfab30c670078b5d5c256621ac9d38e7edd9))
- updated CHANGELOG.md ([3a5b6013](https://github.com/firstlovecenter/fl-pastoral-care/commit/3a5b6013218cba06dec2e5c27eae1aedb1114ab6))
- updated CHANGELOG.md ([2a5a9868](https://github.com/firstlovecenter/fl-pastoral-care/commit/2a5a98681dadb70aae489ddbf31105197c7e3220))
- updated CHANGELOG.md ([e4dd338c](https://github.com/firstlovecenter/fl-pastoral-care/commit/e4dd338c263fc2c6b289025af3f4a39c145f7e69))

##### New Features

- poimen-40 memberlist shows for only the church in question ([8b291edf](https://github.com/firstlovecenter/fl-pastoral-care/commit/8b291edfbf00fb3c79af0086dd6e41fa8c40c765))

##### Bug Fixes

- implemented clickCard on bacenta ([048ab790](https://github.com/firstlovecenter/fl-pastoral-care/commit/048ab790da81939ed7c89f8a5d932ed9a0e2ba6e))
- fixed bug preventing graphqlschema from being imported correctly ([f0d8c54b](https://github.com/firstlovecenter/fl-pastoral-care/commit/f0d8c54b64a456d6261e5d15ff7a84224044a985))

##### Refactors

- began refactoring of members list ([d9908b97](https://github.com/firstlovecenter/fl-pastoral-care/commit/d9908b972a797e937e6b1bb6b73d3266e17239a7))
- refactored profile-choose to use native chakra-ui features ([14131c73](https://github.com/firstlovecenter/fl-pastoral-care/commit/14131c732f16a137504386250ef5bbe2d011e453))

#### 0.5.7 (2022-05-20)

##### Documentation Changes

- updated CHANGELOG.md ([3a5b6013](https://github.com/firstlovecenter/fl-pastoral-care/commit/3a5b6013218cba06dec2e5c27eae1aedb1114ab6))
- updated CHANGELOG.md ([2a5a9868](https://github.com/firstlovecenter/fl-pastoral-care/commit/2a5a98681dadb70aae489ddbf31105197c7e3220))
- updated CHANGELOG.md ([e4dd338c](https://github.com/firstlovecenter/fl-pastoral-care/commit/e4dd338c263fc2c6b289025af3f4a39c145f7e69))

##### Bug Fixes

- fixed bug preventing graphqlschema from being imported correctly ([f0d8c54b](https://github.com/firstlovecenter/fl-pastoral-care/commit/f0d8c54b64a456d6261e5d15ff7a84224044a985))

##### Refactors

- refactored profile-choose to use native chakra-ui features ([14131c73](https://github.com/firstlovecenter/fl-pastoral-care/commit/14131c732f16a137504386250ef5bbe2d011e453))

#### 0.5.7 (2022-05-20)

##### Documentation Changes

- updated CHANGELOG.md ([2a5a9868](https://github.com/firstlovecenter/fl-pastoral-care/commit/2a5a98681dadb70aae489ddbf31105197c7e3220))
- updated CHANGELOG.md ([e4dd338c](https://github.com/firstlovecenter/fl-pastoral-care/commit/e4dd338c263fc2c6b289025af3f4a39c145f7e69))

##### Bug Fixes

- fixed bug preventing graphqlschema from being imported correctly ([f0d8c54b](https://github.com/firstlovecenter/fl-pastoral-care/commit/f0d8c54b64a456d6261e5d15ff7a84224044a985))

##### Refactors

- refactored profile-choose to use native chakra-ui features ([14131c73](https://github.com/firstlovecenter/fl-pastoral-care/commit/14131c732f16a137504386250ef5bbe2d011e453))

#### 0.5.7 (2022-05-20)

##### Documentation Changes

- updated CHANGELOG.md ([e4dd338c](https://github.com/firstlovecenter/fl-pastoral-care/commit/e4dd338c263fc2c6b289025af3f4a39c145f7e69))

##### Bug Fixes

- fixed bug preventing graphqlschema from being imported correctly ([f0d8c54b](https://github.com/firstlovecenter/fl-pastoral-care/commit/f0d8c54b64a456d6261e5d15ff7a84224044a985))

##### Refactors

- refactored profile-choose to use native chakra-ui features ([14131c73](https://github.com/firstlovecenter/fl-pastoral-care/commit/14131c732f16a137504386250ef5bbe2d011e453))

#### 0.5.7 (2022-05-20)

##### Bug Fixes

- fixed bug preventing graphqlschema from being imported correctly ([f0d8c54b](https://github.com/firstlovecenter/fl-pastoral-care/commit/f0d8c54b64a456d6261e5d15ff7a84224044a985))

##### Refactors

- refactored profile-choose to use native chakra-ui features ([14131c73](https://github.com/firstlovecenter/fl-pastoral-care/commit/14131c732f16a137504386250ef5bbe2d011e453))

#### 0.5.6 (2022-05-14)

##### Chores

- removed pre build commands ([5e03e551](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e03e5516362ebba89bf548366044ea1de0d1dd3))

#### 0.5.5 (2022-05-14)

##### Chores

- deleted setup proxy ([d54e0fef](https://github.com/firstlovecenter/fl-pastoral-care/commit/d54e0fef971f2174aa076700bf919132d534e86c))
- updated packages ([2c801831](https://github.com/firstlovecenter/fl-pastoral-care/commit/2c8018312d2210a632ff48e4c4c9c1e8d6f77203))

#### 0.5.4 (2022-05-14)

##### New Features

- implemented using typescript in the backend ([081a11d0](https://github.com/firstlovecenter/fl-pastoral-care/commit/081a11d0ca1050de1116522d82afa94fe4379cf6))

#### 0.5.3 (2022-05-14)

##### New Features

- implemented Apollo Wrapper Component for wrapping components which have data from useQuery ([28f57565](https://github.com/firstlovecenter/fl-pastoral-care/commit/28f5756529820482fadd0b9af445128c5de07b64))
- implemented basic types for the church throughout the app ([115e642c](https://github.com/firstlovecenter/fl-pastoral-care/commit/115e642c957b6f00518be48f6bd1ac69efa98344))

##### Refactors

- refactored code to use context ([2dd75e85](https://github.com/firstlovecenter/fl-pastoral-care/commit/2dd75e85194cbf0254e0c3bf9edcfa4354c1e356))
- rewrote the landing page ([b5f4185e](https://github.com/firstlovecenter/fl-pastoral-care/commit/b5f4185ede3cd3919e6df21e0bc08757549b6694))
- scaffolding the app, getting ready to use Context ([6d5ed055](https://github.com/firstlovecenter/fl-pastoral-care/commit/6d5ed0556d1e3725a51098eeeab9620687a964da))

#### 0.5.2 (2022-04-20)

##### Chores

- upgraded build.js ([5d530767](https://github.com/firstlovecenter/fl-pastoral-care/commit/5d5307679349b6048547be734d5adafd2fc7fdd0))

#### 0.5.1 (2022-04-20)

##### Chores

- upgraded concurrently ([1339a839](https://github.com/firstlovecenter/fl-pastoral-care/commit/1339a839c66e845595710099880e7a63cd646d3e))

### 0.5.0 (2022-04-20)

##### Chores

- downgraded concurrently to a working version ([fff44cb1](https://github.com/firstlovecenter/fl-pastoral-care/commit/fff44cb175fac0bc934ddf19a78e84f2cdcfe40e))
- refactored release.js to eliminate eslint warnings ([2d0e04f1](https://github.com/firstlovecenter/fl-pastoral-care/commit/2d0e04f1ab9c65ddac4653ae163a222566f1ee42))
- cleaned up dependencies ([b864d8db](https://github.com/firstlovecenter/fl-pastoral-care/commit/b864d8db342b45c6fbed9a1e36a556e426244699))
- fixed merge conflicts ([4382e47b](https://github.com/firstlovecenter/fl-pastoral-care/commit/4382e47b8acbab67ab30e7bfd141d52eb031df06))
- updated dependencies ([db7f2c7e](https://github.com/firstlovecenter/fl-pastoral-care/commit/db7f2c7e0437413fb112483c533644a21221e08c))
- updated lambda function ([0fba922e](https://github.com/firstlovecenter/fl-pastoral-care/commit/0fba922e44046f77547c67c3cafe2ed0c471f005))
- updateed readme ([21efeff0](https://github.com/firstlovecenter/fl-pastoral-care/commit/21efeff0c6e9e0330ea9f0ac4e92896be7e1bd82))
- updated graphql package ([36b967ae](https://github.com/firstlovecenter/fl-pastoral-care/commit/36b967ae35808aff104b53d3708bda0bceafa13f))
- updated @neo4j/graphql library ([9c60cef0](https://github.com/firstlovecenter/fl-pastoral-care/commit/9c60cef0e0076cc57ba1bb1cd8d89f9b6bb49b7e))
- installed airbnb style guide ([2fbd4525](https://github.com/firstlovecenter/fl-pastoral-care/commit/2fbd452519871e682448be659f086165265310e8))
- edited readme ([b3622c14](https://github.com/firstlovecenter/fl-pastoral-care/commit/b3622c14959965d1ec0fddf3576a014d7294cb67))
- edited readme ([5fa4598f](https://github.com/firstlovecenter/fl-pastoral-care/commit/5fa4598fc3e8c22bce9cde5259fd8a02ec3ae16e))

##### Documentation Changes

- updated CHANGELOG.md ([e8ac9df8](https://github.com/firstlovecenter/fl-pastoral-care/commit/e8ac9df8a3bcc3195a8ccc3b48330b3eda0d8412))
- updated CHANGELOG.md ([84d1a7bf](https://github.com/firstlovecenter/fl-pastoral-care/commit/84d1a7bf68005e015cecd677569e0b7e3db145fa))
- updated CHANGELOG.md ([af3b5035](https://github.com/firstlovecenter/fl-pastoral-care/commit/af3b5035f6f03eee12447e60f0bb5ff84f7ae51e))
- updated CHANGELOG.md ([3c5a5a61](https://github.com/firstlovecenter/fl-pastoral-care/commit/3c5a5a61e2c3bd8b19f28430f814de685191ae37))

##### New Features

- implement membership and dashboard pages ([dd0c5fce](https://github.com/firstlovecenter/fl-pastoral-care/commit/dd0c5fcee1899c1a9a95b6b6305dd8b3b56b02ea))
- fix login issue ([06f895cb](https://github.com/firstlovecenter/fl-pastoral-care/commit/06f895cbb1e27eb31dd37c5c8c8b9ee6214418c6))
- implement memberlist ([2a47e86c](https://github.com/firstlovecenter/fl-pastoral-care/commit/2a47e86c116b739ac4977ac89029acdbefcb51cb))
- implement bacenta membership flow ([985f00ad](https://github.com/firstlovecenter/fl-pastoral-care/commit/985f00ad1414af96c1ebef384c4cfd363c1d3c00))
- implement memberlist ([5a416242](https://github.com/firstlovecenter/fl-pastoral-care/commit/5a416242d83b09b4872c340ac5e2758edf6359b8))
- implement bacenta membership flow ([63336072](https://github.com/firstlovecenter/fl-pastoral-care/commit/63336072a532f7e2cb795ea6cd7e708e6ad50bd2))
- introduced a cloudinary image component with support for lazy loading and placeholders ([f4c6957e](https://github.com/firstlovecenter/fl-pastoral-care/commit/f4c6957e3547a4c9cfe7b8c9c8cc82e1f08372c1))
- poimen-12 implemented types for sheep, goat, deer ([64d93bc5](https://github.com/firstlovecenter/fl-pastoral-care/commit/64d93bc5f2a96e27624c25d5d84d430521c02327))
- graphql ([9b3c7d80](https://github.com/firstlovecenter/fl-pastoral-care/commit/9b3c7d8037b0e48198f151823638287d0e271cc5))
- **membership:** implemented sheep, deer, goat types for members and bacentas ([5e28c43b](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e28c43bd5e4cde27bf297307a47c7f43b242409))

##### Bug Fixes

- replace the membership graphql name ([557db059](https://github.com/firstlovecenter/fl-pastoral-care/commit/557db0596819b3341d279a7b2038165f01bd842d))
- merge conflicts from deploy ([644bcf00](https://github.com/firstlovecenter/fl-pastoral-care/commit/644bcf00120959466b9d0467126198fea439f450))
- merge conflicts from deploy ([c200e633](https://github.com/firstlovecenter/fl-pastoral-care/commit/c200e633f24b891cebc87aeb268dc85588118b98))
- replaced cloudinary img comp with a transformImage function compatible with Avatar comp ([577e2194](https://github.com/firstlovecenter/fl-pastoral-care/commit/577e2194041e9efd288abfc50fc87419748d3e95))
- merged member list page with cloudinary commit ([5e38e83e](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e38e83e432cf61cc47d95915c02b68f361e38a7))
- tweaked netlify.toml ([cf3f504c](https://github.com/firstlovecenter/fl-pastoral-care/commit/cf3f504ce4e17261328a9998633f813ef7da5e13))
- took out code that was breaking the deploy ([2bd5ee94](https://github.com/firstlovecenter/fl-pastoral-care/commit/2bd5ee94e908e46a76ccbe012fdd3ae8f02d84b4))
- poimen-4 Implemented login functionality using auth0 and apollo client ([cbddf09d](https://github.com/firstlovecenter/fl-pastoral-care/commit/cbddf09de45cf5f73285f6cbf25cb6607506e149))
- implemented login functionality with auth0 provider ([60117f1e](https://github.com/firstlovecenter/fl-pastoral-care/commit/60117f1e4918a84bd2d1576ca7da86a56bdf67c9))
- partially implemented auth0 wrapper ([0c971f51](https://github.com/firstlovecenter/fl-pastoral-care/commit/0c971f51cb49ffee85b8defbadc305130d0c4337))
- fixed import statement in graphql.js ([4e3599a4](https://github.com/firstlovecenter/fl-pastoral-care/commit/4e3599a4fa40a76fbd1caf5ed9d2e1f6a3ff8af4))

##### Other Changes

- //github.com/firstlovecenter/fl-pastoral-care into develop ([76be2301](https://github.com/firstlovecenter/fl-pastoral-care/commit/76be2301063b17be1b628ed2b978c42f6fbcc6a7))
- //github.com/firstlovecenter/fl-pastoral-care into deploy ([61bf14a2](https://github.com/firstlovecenter/fl-pastoral-care/commit/61bf14a28839769b60b5e5e1d798ae2b3cfc1f0e))

##### Refactors

- resolved peer dependency conflicts with react-loading-overlay ([c02c2a37](https://github.com/firstlovecenter/fl-pastoral-care/commit/c02c2a37630100588c7fd8aae7ea6c3d1970bf27))
- restructured the front end folder directory ([9fe4a243](https://github.com/firstlovecenter/fl-pastoral-care/commit/9fe4a243d3e3669f7be07ff5c15fb8bb38a1e6b7))

### 0.4.0 (2022-04-20)

##### Chores

- refactored release.js to eliminate eslint warnings ([2d0e04f1](https://github.com/firstlovecenter/fl-pastoral-care/commit/2d0e04f1ab9c65ddac4653ae163a222566f1ee42))
- cleaned up dependencies ([b864d8db](https://github.com/firstlovecenter/fl-pastoral-care/commit/b864d8db342b45c6fbed9a1e36a556e426244699))
- fixed merge conflicts ([4382e47b](https://github.com/firstlovecenter/fl-pastoral-care/commit/4382e47b8acbab67ab30e7bfd141d52eb031df06))
- updated dependencies ([db7f2c7e](https://github.com/firstlovecenter/fl-pastoral-care/commit/db7f2c7e0437413fb112483c533644a21221e08c))
- updated lambda function ([0fba922e](https://github.com/firstlovecenter/fl-pastoral-care/commit/0fba922e44046f77547c67c3cafe2ed0c471f005))
- updateed readme ([21efeff0](https://github.com/firstlovecenter/fl-pastoral-care/commit/21efeff0c6e9e0330ea9f0ac4e92896be7e1bd82))
- updated graphql package ([36b967ae](https://github.com/firstlovecenter/fl-pastoral-care/commit/36b967ae35808aff104b53d3708bda0bceafa13f))
- updated @neo4j/graphql library ([9c60cef0](https://github.com/firstlovecenter/fl-pastoral-care/commit/9c60cef0e0076cc57ba1bb1cd8d89f9b6bb49b7e))
- installed airbnb style guide ([2fbd4525](https://github.com/firstlovecenter/fl-pastoral-care/commit/2fbd452519871e682448be659f086165265310e8))
- edited readme ([b3622c14](https://github.com/firstlovecenter/fl-pastoral-care/commit/b3622c14959965d1ec0fddf3576a014d7294cb67))
- edited readme ([5fa4598f](https://github.com/firstlovecenter/fl-pastoral-care/commit/5fa4598fc3e8c22bce9cde5259fd8a02ec3ae16e))

##### Documentation Changes

- updated CHANGELOG.md ([84d1a7bf](https://github.com/firstlovecenter/fl-pastoral-care/commit/84d1a7bf68005e015cecd677569e0b7e3db145fa))
- updated CHANGELOG.md ([af3b5035](https://github.com/firstlovecenter/fl-pastoral-care/commit/af3b5035f6f03eee12447e60f0bb5ff84f7ae51e))
- updated CHANGELOG.md ([3c5a5a61](https://github.com/firstlovecenter/fl-pastoral-care/commit/3c5a5a61e2c3bd8b19f28430f814de685191ae37))

##### New Features

- implement membership and dashboard pages ([dd0c5fce](https://github.com/firstlovecenter/fl-pastoral-care/commit/dd0c5fcee1899c1a9a95b6b6305dd8b3b56b02ea))
- fix login issue ([06f895cb](https://github.com/firstlovecenter/fl-pastoral-care/commit/06f895cbb1e27eb31dd37c5c8c8b9ee6214418c6))
- implement memberlist ([2a47e86c](https://github.com/firstlovecenter/fl-pastoral-care/commit/2a47e86c116b739ac4977ac89029acdbefcb51cb))
- implement bacenta membership flow ([985f00ad](https://github.com/firstlovecenter/fl-pastoral-care/commit/985f00ad1414af96c1ebef384c4cfd363c1d3c00))
- implement memberlist ([5a416242](https://github.com/firstlovecenter/fl-pastoral-care/commit/5a416242d83b09b4872c340ac5e2758edf6359b8))
- implement bacenta membership flow ([63336072](https://github.com/firstlovecenter/fl-pastoral-care/commit/63336072a532f7e2cb795ea6cd7e708e6ad50bd2))
- introduced a cloudinary image component with support for lazy loading and placeholders ([f4c6957e](https://github.com/firstlovecenter/fl-pastoral-care/commit/f4c6957e3547a4c9cfe7b8c9c8cc82e1f08372c1))
- poimen-12 implemented types for sheep, goat, deer ([64d93bc5](https://github.com/firstlovecenter/fl-pastoral-care/commit/64d93bc5f2a96e27624c25d5d84d430521c02327))
- graphql ([9b3c7d80](https://github.com/firstlovecenter/fl-pastoral-care/commit/9b3c7d8037b0e48198f151823638287d0e271cc5))
- **membership:** implemented sheep, deer, goat types for members and bacentas ([5e28c43b](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e28c43bd5e4cde27bf297307a47c7f43b242409))

##### Bug Fixes

- replace the membership graphql name ([557db059](https://github.com/firstlovecenter/fl-pastoral-care/commit/557db0596819b3341d279a7b2038165f01bd842d))
- merge conflicts from deploy ([644bcf00](https://github.com/firstlovecenter/fl-pastoral-care/commit/644bcf00120959466b9d0467126198fea439f450))
- merge conflicts from deploy ([c200e633](https://github.com/firstlovecenter/fl-pastoral-care/commit/c200e633f24b891cebc87aeb268dc85588118b98))
- replaced cloudinary img comp with a transformImage function compatible with Avatar comp ([577e2194](https://github.com/firstlovecenter/fl-pastoral-care/commit/577e2194041e9efd288abfc50fc87419748d3e95))
- merged member list page with cloudinary commit ([5e38e83e](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e38e83e432cf61cc47d95915c02b68f361e38a7))
- tweaked netlify.toml ([cf3f504c](https://github.com/firstlovecenter/fl-pastoral-care/commit/cf3f504ce4e17261328a9998633f813ef7da5e13))
- took out code that was breaking the deploy ([2bd5ee94](https://github.com/firstlovecenter/fl-pastoral-care/commit/2bd5ee94e908e46a76ccbe012fdd3ae8f02d84b4))
- poimen-4 Implemented login functionality using auth0 and apollo client ([cbddf09d](https://github.com/firstlovecenter/fl-pastoral-care/commit/cbddf09de45cf5f73285f6cbf25cb6607506e149))
- implemented login functionality with auth0 provider ([60117f1e](https://github.com/firstlovecenter/fl-pastoral-care/commit/60117f1e4918a84bd2d1576ca7da86a56bdf67c9))
- partially implemented auth0 wrapper ([0c971f51](https://github.com/firstlovecenter/fl-pastoral-care/commit/0c971f51cb49ffee85b8defbadc305130d0c4337))
- fixed import statement in graphql.js ([4e3599a4](https://github.com/firstlovecenter/fl-pastoral-care/commit/4e3599a4fa40a76fbd1caf5ed9d2e1f6a3ff8af4))

##### Other Changes

- //github.com/firstlovecenter/fl-pastoral-care into develop ([76be2301](https://github.com/firstlovecenter/fl-pastoral-care/commit/76be2301063b17be1b628ed2b978c42f6fbcc6a7))
- //github.com/firstlovecenter/fl-pastoral-care into deploy ([61bf14a2](https://github.com/firstlovecenter/fl-pastoral-care/commit/61bf14a28839769b60b5e5e1d798ae2b3cfc1f0e))

##### Refactors

- resolved peer dependency conflicts with react-loading-overlay ([c02c2a37](https://github.com/firstlovecenter/fl-pastoral-care/commit/c02c2a37630100588c7fd8aae7ea6c3d1970bf27))
- restructured the front end folder directory ([9fe4a243](https://github.com/firstlovecenter/fl-pastoral-care/commit/9fe4a243d3e3669f7be07ff5c15fb8bb38a1e6b7))

### 0.4.0 (2022-04-20)

##### Chores

- refactored release.js to eliminate eslint warnings ([2d0e04f1](https://github.com/firstlovecenter/fl-pastoral-care/commit/2d0e04f1ab9c65ddac4653ae163a222566f1ee42))
- cleaned up dependencies ([b864d8db](https://github.com/firstlovecenter/fl-pastoral-care/commit/b864d8db342b45c6fbed9a1e36a556e426244699))
- fixed merge conflicts ([4382e47b](https://github.com/firstlovecenter/fl-pastoral-care/commit/4382e47b8acbab67ab30e7bfd141d52eb031df06))
- updated dependencies ([db7f2c7e](https://github.com/firstlovecenter/fl-pastoral-care/commit/db7f2c7e0437413fb112483c533644a21221e08c))
- updated lambda function ([0fba922e](https://github.com/firstlovecenter/fl-pastoral-care/commit/0fba922e44046f77547c67c3cafe2ed0c471f005))
- updateed readme ([21efeff0](https://github.com/firstlovecenter/fl-pastoral-care/commit/21efeff0c6e9e0330ea9f0ac4e92896be7e1bd82))
- updated graphql package ([36b967ae](https://github.com/firstlovecenter/fl-pastoral-care/commit/36b967ae35808aff104b53d3708bda0bceafa13f))
- updated @neo4j/graphql library ([9c60cef0](https://github.com/firstlovecenter/fl-pastoral-care/commit/9c60cef0e0076cc57ba1bb1cd8d89f9b6bb49b7e))
- installed airbnb style guide ([2fbd4525](https://github.com/firstlovecenter/fl-pastoral-care/commit/2fbd452519871e682448be659f086165265310e8))
- edited readme ([b3622c14](https://github.com/firstlovecenter/fl-pastoral-care/commit/b3622c14959965d1ec0fddf3576a014d7294cb67))
- edited readme ([5fa4598f](https://github.com/firstlovecenter/fl-pastoral-care/commit/5fa4598fc3e8c22bce9cde5259fd8a02ec3ae16e))

##### Documentation Changes

- updated CHANGELOG.md ([af3b5035](https://github.com/firstlovecenter/fl-pastoral-care/commit/af3b5035f6f03eee12447e60f0bb5ff84f7ae51e))
- updated CHANGELOG.md ([3c5a5a61](https://github.com/firstlovecenter/fl-pastoral-care/commit/3c5a5a61e2c3bd8b19f28430f814de685191ae37))

##### New Features

- implement membership and dashboard pages ([dd0c5fce](https://github.com/firstlovecenter/fl-pastoral-care/commit/dd0c5fcee1899c1a9a95b6b6305dd8b3b56b02ea))
- fix login issue ([06f895cb](https://github.com/firstlovecenter/fl-pastoral-care/commit/06f895cbb1e27eb31dd37c5c8c8b9ee6214418c6))
- implement memberlist ([2a47e86c](https://github.com/firstlovecenter/fl-pastoral-care/commit/2a47e86c116b739ac4977ac89029acdbefcb51cb))
- implement bacenta membership flow ([985f00ad](https://github.com/firstlovecenter/fl-pastoral-care/commit/985f00ad1414af96c1ebef384c4cfd363c1d3c00))
- implement memberlist ([5a416242](https://github.com/firstlovecenter/fl-pastoral-care/commit/5a416242d83b09b4872c340ac5e2758edf6359b8))
- implement bacenta membership flow ([63336072](https://github.com/firstlovecenter/fl-pastoral-care/commit/63336072a532f7e2cb795ea6cd7e708e6ad50bd2))
- introduced a cloudinary image component with support for lazy loading and placeholders ([f4c6957e](https://github.com/firstlovecenter/fl-pastoral-care/commit/f4c6957e3547a4c9cfe7b8c9c8cc82e1f08372c1))
- poimen-12 implemented types for sheep, goat, deer ([64d93bc5](https://github.com/firstlovecenter/fl-pastoral-care/commit/64d93bc5f2a96e27624c25d5d84d430521c02327))
- graphql ([9b3c7d80](https://github.com/firstlovecenter/fl-pastoral-care/commit/9b3c7d8037b0e48198f151823638287d0e271cc5))
- **membership:** implemented sheep, deer, goat types for members and bacentas ([5e28c43b](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e28c43bd5e4cde27bf297307a47c7f43b242409))

##### Bug Fixes

- replace the membership graphql name ([557db059](https://github.com/firstlovecenter/fl-pastoral-care/commit/557db0596819b3341d279a7b2038165f01bd842d))
- merge conflicts from deploy ([644bcf00](https://github.com/firstlovecenter/fl-pastoral-care/commit/644bcf00120959466b9d0467126198fea439f450))
- merge conflicts from deploy ([c200e633](https://github.com/firstlovecenter/fl-pastoral-care/commit/c200e633f24b891cebc87aeb268dc85588118b98))
- replaced cloudinary img comp with a transformImage function compatible with Avatar comp ([577e2194](https://github.com/firstlovecenter/fl-pastoral-care/commit/577e2194041e9efd288abfc50fc87419748d3e95))
- merged member list page with cloudinary commit ([5e38e83e](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e38e83e432cf61cc47d95915c02b68f361e38a7))
- tweaked netlify.toml ([cf3f504c](https://github.com/firstlovecenter/fl-pastoral-care/commit/cf3f504ce4e17261328a9998633f813ef7da5e13))
- took out code that was breaking the deploy ([2bd5ee94](https://github.com/firstlovecenter/fl-pastoral-care/commit/2bd5ee94e908e46a76ccbe012fdd3ae8f02d84b4))
- poimen-4 Implemented login functionality using auth0 and apollo client ([cbddf09d](https://github.com/firstlovecenter/fl-pastoral-care/commit/cbddf09de45cf5f73285f6cbf25cb6607506e149))
- implemented login functionality with auth0 provider ([60117f1e](https://github.com/firstlovecenter/fl-pastoral-care/commit/60117f1e4918a84bd2d1576ca7da86a56bdf67c9))
- partially implemented auth0 wrapper ([0c971f51](https://github.com/firstlovecenter/fl-pastoral-care/commit/0c971f51cb49ffee85b8defbadc305130d0c4337))
- fixed import statement in graphql.js ([4e3599a4](https://github.com/firstlovecenter/fl-pastoral-care/commit/4e3599a4fa40a76fbd1caf5ed9d2e1f6a3ff8af4))

##### Other Changes

- //github.com/firstlovecenter/fl-pastoral-care into develop ([76be2301](https://github.com/firstlovecenter/fl-pastoral-care/commit/76be2301063b17be1b628ed2b978c42f6fbcc6a7))
- //github.com/firstlovecenter/fl-pastoral-care into deploy ([61bf14a2](https://github.com/firstlovecenter/fl-pastoral-care/commit/61bf14a28839769b60b5e5e1d798ae2b3cfc1f0e))

##### Refactors

- resolved peer dependency conflicts with react-loading-overlay ([c02c2a37](https://github.com/firstlovecenter/fl-pastoral-care/commit/c02c2a37630100588c7fd8aae7ea6c3d1970bf27))
- restructured the front end folder directory ([9fe4a243](https://github.com/firstlovecenter/fl-pastoral-care/commit/9fe4a243d3e3669f7be07ff5c15fb8bb38a1e6b7))

### 0.4.0 (2022-04-20)

##### Chores

- refactored release.js to eliminate eslint warnings ([2d0e04f1](https://github.com/firstlovecenter/fl-pastoral-care/commit/2d0e04f1ab9c65ddac4653ae163a222566f1ee42))
- cleaned up dependencies ([b864d8db](https://github.com/firstlovecenter/fl-pastoral-care/commit/b864d8db342b45c6fbed9a1e36a556e426244699))
- fixed merge conflicts ([4382e47b](https://github.com/firstlovecenter/fl-pastoral-care/commit/4382e47b8acbab67ab30e7bfd141d52eb031df06))
- updated dependencies ([db7f2c7e](https://github.com/firstlovecenter/fl-pastoral-care/commit/db7f2c7e0437413fb112483c533644a21221e08c))
- updated lambda function ([0fba922e](https://github.com/firstlovecenter/fl-pastoral-care/commit/0fba922e44046f77547c67c3cafe2ed0c471f005))
- updateed readme ([21efeff0](https://github.com/firstlovecenter/fl-pastoral-care/commit/21efeff0c6e9e0330ea9f0ac4e92896be7e1bd82))
- updated graphql package ([36b967ae](https://github.com/firstlovecenter/fl-pastoral-care/commit/36b967ae35808aff104b53d3708bda0bceafa13f))
- updated @neo4j/graphql library ([9c60cef0](https://github.com/firstlovecenter/fl-pastoral-care/commit/9c60cef0e0076cc57ba1bb1cd8d89f9b6bb49b7e))
- installed airbnb style guide ([2fbd4525](https://github.com/firstlovecenter/fl-pastoral-care/commit/2fbd452519871e682448be659f086165265310e8))
- edited readme ([b3622c14](https://github.com/firstlovecenter/fl-pastoral-care/commit/b3622c14959965d1ec0fddf3576a014d7294cb67))
- edited readme ([5fa4598f](https://github.com/firstlovecenter/fl-pastoral-care/commit/5fa4598fc3e8c22bce9cde5259fd8a02ec3ae16e))

##### Documentation Changes

- updated CHANGELOG.md ([3c5a5a61](https://github.com/firstlovecenter/fl-pastoral-care/commit/3c5a5a61e2c3bd8b19f28430f814de685191ae37))

##### New Features

- implement membership and dashboard pages ([dd0c5fce](https://github.com/firstlovecenter/fl-pastoral-care/commit/dd0c5fcee1899c1a9a95b6b6305dd8b3b56b02ea))
- fix login issue ([06f895cb](https://github.com/firstlovecenter/fl-pastoral-care/commit/06f895cbb1e27eb31dd37c5c8c8b9ee6214418c6))
- implement memberlist ([2a47e86c](https://github.com/firstlovecenter/fl-pastoral-care/commit/2a47e86c116b739ac4977ac89029acdbefcb51cb))
- implement bacenta membership flow ([985f00ad](https://github.com/firstlovecenter/fl-pastoral-care/commit/985f00ad1414af96c1ebef384c4cfd363c1d3c00))
- implement memberlist ([5a416242](https://github.com/firstlovecenter/fl-pastoral-care/commit/5a416242d83b09b4872c340ac5e2758edf6359b8))
- implement bacenta membership flow ([63336072](https://github.com/firstlovecenter/fl-pastoral-care/commit/63336072a532f7e2cb795ea6cd7e708e6ad50bd2))
- introduced a cloudinary image component with support for lazy loading and placeholders ([f4c6957e](https://github.com/firstlovecenter/fl-pastoral-care/commit/f4c6957e3547a4c9cfe7b8c9c8cc82e1f08372c1))
- poimen-12 implemented types for sheep, goat, deer ([64d93bc5](https://github.com/firstlovecenter/fl-pastoral-care/commit/64d93bc5f2a96e27624c25d5d84d430521c02327))
- graphql ([9b3c7d80](https://github.com/firstlovecenter/fl-pastoral-care/commit/9b3c7d8037b0e48198f151823638287d0e271cc5))
- **membership:** implemented sheep, deer, goat types for members and bacentas ([5e28c43b](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e28c43bd5e4cde27bf297307a47c7f43b242409))

##### Bug Fixes

- replace the membership graphql name ([557db059](https://github.com/firstlovecenter/fl-pastoral-care/commit/557db0596819b3341d279a7b2038165f01bd842d))
- merge conflicts from deploy ([644bcf00](https://github.com/firstlovecenter/fl-pastoral-care/commit/644bcf00120959466b9d0467126198fea439f450))
- merge conflicts from deploy ([c200e633](https://github.com/firstlovecenter/fl-pastoral-care/commit/c200e633f24b891cebc87aeb268dc85588118b98))
- replaced cloudinary img comp with a transformImage function compatible with Avatar comp ([577e2194](https://github.com/firstlovecenter/fl-pastoral-care/commit/577e2194041e9efd288abfc50fc87419748d3e95))
- merged member list page with cloudinary commit ([5e38e83e](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e38e83e432cf61cc47d95915c02b68f361e38a7))
- tweaked netlify.toml ([cf3f504c](https://github.com/firstlovecenter/fl-pastoral-care/commit/cf3f504ce4e17261328a9998633f813ef7da5e13))
- took out code that was breaking the deploy ([2bd5ee94](https://github.com/firstlovecenter/fl-pastoral-care/commit/2bd5ee94e908e46a76ccbe012fdd3ae8f02d84b4))
- poimen-4 Implemented login functionality using auth0 and apollo client ([cbddf09d](https://github.com/firstlovecenter/fl-pastoral-care/commit/cbddf09de45cf5f73285f6cbf25cb6607506e149))
- implemented login functionality with auth0 provider ([60117f1e](https://github.com/firstlovecenter/fl-pastoral-care/commit/60117f1e4918a84bd2d1576ca7da86a56bdf67c9))
- partially implemented auth0 wrapper ([0c971f51](https://github.com/firstlovecenter/fl-pastoral-care/commit/0c971f51cb49ffee85b8defbadc305130d0c4337))
- fixed import statement in graphql.js ([4e3599a4](https://github.com/firstlovecenter/fl-pastoral-care/commit/4e3599a4fa40a76fbd1caf5ed9d2e1f6a3ff8af4))

##### Other Changes

- //github.com/firstlovecenter/fl-pastoral-care into develop ([76be2301](https://github.com/firstlovecenter/fl-pastoral-care/commit/76be2301063b17be1b628ed2b978c42f6fbcc6a7))
- //github.com/firstlovecenter/fl-pastoral-care into deploy ([61bf14a2](https://github.com/firstlovecenter/fl-pastoral-care/commit/61bf14a28839769b60b5e5e1d798ae2b3cfc1f0e))

##### Refactors

- resolved peer dependency conflicts with react-loading-overlay ([c02c2a37](https://github.com/firstlovecenter/fl-pastoral-care/commit/c02c2a37630100588c7fd8aae7ea6c3d1970bf27))
- restructured the front end folder directory ([9fe4a243](https://github.com/firstlovecenter/fl-pastoral-care/commit/9fe4a243d3e3669f7be07ff5c15fb8bb38a1e6b7))

### 0.4.0 (2022-04-20)

##### Chores

- refactored release.js to eliminate eslint warnings ([2d0e04f1](https://github.com/firstlovecenter/fl-pastoral-care/commit/2d0e04f1ab9c65ddac4653ae163a222566f1ee42))
- cleaned up dependencies ([b864d8db](https://github.com/firstlovecenter/fl-pastoral-care/commit/b864d8db342b45c6fbed9a1e36a556e426244699))
- fixed merge conflicts ([4382e47b](https://github.com/firstlovecenter/fl-pastoral-care/commit/4382e47b8acbab67ab30e7bfd141d52eb031df06))
- updated dependencies ([db7f2c7e](https://github.com/firstlovecenter/fl-pastoral-care/commit/db7f2c7e0437413fb112483c533644a21221e08c))
- updated lambda function ([0fba922e](https://github.com/firstlovecenter/fl-pastoral-care/commit/0fba922e44046f77547c67c3cafe2ed0c471f005))
- updateed readme ([21efeff0](https://github.com/firstlovecenter/fl-pastoral-care/commit/21efeff0c6e9e0330ea9f0ac4e92896be7e1bd82))
- updated graphql package ([36b967ae](https://github.com/firstlovecenter/fl-pastoral-care/commit/36b967ae35808aff104b53d3708bda0bceafa13f))
- updated @neo4j/graphql library ([9c60cef0](https://github.com/firstlovecenter/fl-pastoral-care/commit/9c60cef0e0076cc57ba1bb1cd8d89f9b6bb49b7e))
- installed airbnb style guide ([2fbd4525](https://github.com/firstlovecenter/fl-pastoral-care/commit/2fbd452519871e682448be659f086165265310e8))
- edited readme ([b3622c14](https://github.com/firstlovecenter/fl-pastoral-care/commit/b3622c14959965d1ec0fddf3576a014d7294cb67))
- edited readme ([5fa4598f](https://github.com/firstlovecenter/fl-pastoral-care/commit/5fa4598fc3e8c22bce9cde5259fd8a02ec3ae16e))

##### New Features

- implement membership and dashboard pages ([dd0c5fce](https://github.com/firstlovecenter/fl-pastoral-care/commit/dd0c5fcee1899c1a9a95b6b6305dd8b3b56b02ea))
- fix login issue ([06f895cb](https://github.com/firstlovecenter/fl-pastoral-care/commit/06f895cbb1e27eb31dd37c5c8c8b9ee6214418c6))
- implement memberlist ([2a47e86c](https://github.com/firstlovecenter/fl-pastoral-care/commit/2a47e86c116b739ac4977ac89029acdbefcb51cb))
- implement bacenta membership flow ([985f00ad](https://github.com/firstlovecenter/fl-pastoral-care/commit/985f00ad1414af96c1ebef384c4cfd363c1d3c00))
- implement memberlist ([5a416242](https://github.com/firstlovecenter/fl-pastoral-care/commit/5a416242d83b09b4872c340ac5e2758edf6359b8))
- implement bacenta membership flow ([63336072](https://github.com/firstlovecenter/fl-pastoral-care/commit/63336072a532f7e2cb795ea6cd7e708e6ad50bd2))
- introduced a cloudinary image component with support for lazy loading and placeholders ([f4c6957e](https://github.com/firstlovecenter/fl-pastoral-care/commit/f4c6957e3547a4c9cfe7b8c9c8cc82e1f08372c1))
- poimen-12 implemented types for sheep, goat, deer ([64d93bc5](https://github.com/firstlovecenter/fl-pastoral-care/commit/64d93bc5f2a96e27624c25d5d84d430521c02327))
- graphql ([9b3c7d80](https://github.com/firstlovecenter/fl-pastoral-care/commit/9b3c7d8037b0e48198f151823638287d0e271cc5))
- **membership:** implemented sheep, deer, goat types for members and bacentas ([5e28c43b](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e28c43bd5e4cde27bf297307a47c7f43b242409))

##### Bug Fixes

- replace the membership graphql name ([557db059](https://github.com/firstlovecenter/fl-pastoral-care/commit/557db0596819b3341d279a7b2038165f01bd842d))
- merge conflicts from deploy ([644bcf00](https://github.com/firstlovecenter/fl-pastoral-care/commit/644bcf00120959466b9d0467126198fea439f450))
- merge conflicts from deploy ([c200e633](https://github.com/firstlovecenter/fl-pastoral-care/commit/c200e633f24b891cebc87aeb268dc85588118b98))
- replaced cloudinary img comp with a transformImage function compatible with Avatar comp ([577e2194](https://github.com/firstlovecenter/fl-pastoral-care/commit/577e2194041e9efd288abfc50fc87419748d3e95))
- merged member list page with cloudinary commit ([5e38e83e](https://github.com/firstlovecenter/fl-pastoral-care/commit/5e38e83e432cf61cc47d95915c02b68f361e38a7))
- tweaked netlify.toml ([cf3f504c](https://github.com/firstlovecenter/fl-pastoral-care/commit/cf3f504ce4e17261328a9998633f813ef7da5e13))
- took out code that was breaking the deploy ([2bd5ee94](https://github.com/firstlovecenter/fl-pastoral-care/commit/2bd5ee94e908e46a76ccbe012fdd3ae8f02d84b4))
- poimen-4 Implemented login functionality using auth0 and apollo client ([cbddf09d](https://github.com/firstlovecenter/fl-pastoral-care/commit/cbddf09de45cf5f73285f6cbf25cb6607506e149))
- implemented login functionality with auth0 provider ([60117f1e](https://github.com/firstlovecenter/fl-pastoral-care/commit/60117f1e4918a84bd2d1576ca7da86a56bdf67c9))
- partially implemented auth0 wrapper ([0c971f51](https://github.com/firstlovecenter/fl-pastoral-care/commit/0c971f51cb49ffee85b8defbadc305130d0c4337))
- fixed import statement in graphql.js ([4e3599a4](https://github.com/firstlovecenter/fl-pastoral-care/commit/4e3599a4fa40a76fbd1caf5ed9d2e1f6a3ff8af4))

##### Other Changes

- //github.com/firstlovecenter/fl-pastoral-care into develop ([76be2301](https://github.com/firstlovecenter/fl-pastoral-care/commit/76be2301063b17be1b628ed2b978c42f6fbcc6a7))
- //github.com/firstlovecenter/fl-pastoral-care into deploy ([61bf14a2](https://github.com/firstlovecenter/fl-pastoral-care/commit/61bf14a28839769b60b5e5e1d798ae2b3cfc1f0e))

##### Refactors

- resolved peer dependency conflicts with react-loading-overlay ([c02c2a37](https://github.com/firstlovecenter/fl-pastoral-care/commit/c02c2a37630100588c7fd8aae7ea6c3d1970bf27))
- restructured the front end folder directory ([9fe4a243](https://github.com/firstlovecenter/fl-pastoral-care/commit/9fe4a243d3e3669f7be07ff5c15fb8bb38a1e6b7))

#### 0.3.7 (2022-02-08)

##### Chores

- updated eslint config ([cc8397f4](https://github.com/firstlovecenter/fl-pastoral-care/commit/cc8397f43a690565b5d1383f06d5f138277bfee9))
- updated netlify badge ([42895ad4](https://github.com/firstlovecenter/fl-pastoral-care/commit/42895ad4e85707a8e44f8a8c06eb41378b83ecbe))
- updated readme ([d88a4ed6](https://github.com/firstlovecenter/fl-pastoral-care/commit/d88a4ed61b8bdb696f5fc634b00390a1850534e3))
- updated readme ([50a460b4](https://github.com/firstlovecenter/fl-pastoral-care/commit/50a460b4b6d9525f622c58c95518973b32346bd1))
- updated the husky config ([5c79f4b5](https://github.com/firstlovecenter/fl-pastoral-care/commit/5c79f4b5237a4833a9d2b62c72219a9b8d6e303e))

##### Bug Fixes

- implemented membership and church types FPC-10 ([f5bfefa0](https://github.com/firstlovecenter/fl-pastoral-care/commit/f5bfefa0ef298ad881653e3c41a584ae81ec6a19))

#### 0.3.6 (2022-02-08)
