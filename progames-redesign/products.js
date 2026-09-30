const PG_MEDIA='https://static.wixstatic.com/media/';
const pg=(file)=>`${PG_MEDIA}${file}`;
const variants=(files,names=[])=>files.map((file,i)=>({name:names[i]||`Variant ${String(i+1).padStart(2,'0')}`,image:pg(file)}));

const standardFeatures=[
  'Commercial strength-test gameplay designed for high-traffic venues',
  'Adjustable difficulty settings and free-play mode',
  'Supports flexible payment configurations for different markets',
  'Operator-focused construction with service access and configurable lighting'
];
const standardOptions=['Bill acceptor','Card reader / cashless payment','2 m power cable','Protective cover','Custom graphics and branding','LED lighting variation'];
const standardSpec=[['Height','219 cm / 86 in'],['Width','72 cm / 28 in'],['Length','115 cm / 45 in'],['Weight','121 kg / 265 lb']];
const comboOptions=['Bill acceptor','Nayax / cashless payment','Ticket dispenser','Custom graphics and branding','Silent mode (advance order)'];

const makeStandard=(name,slug,files,extra='')=>({
  name,category:'boxer',label:'BOXER STANDARD',
  desc:`${name} is a commercial Pro Games boxer built around the Standard strength-test platform. ${extra || 'It combines a distinctive cabinet artwork with a proven punch-score format for arcades, bars, leisure venues and event locations.'}`,
  features:standardFeatures,spec:standardSpec,options:standardOptions,variants:variants(files),source:`https://www.progamespoland.com/${slug}`
});

window.PRODUCTS={
  'monster-3in1-ticket':{
    name:'Monster 3 in 1 Ticket',category:'combo',label:'3-IN-1 / TICKET',tag:'NEW 2026',
    desc:'A space-efficient three-in-one attraction combining Boxer, Kicker and Hammer gameplay in one cabinet, with a ticket-ready concept for redemption-focused venues. LED lighting and strength sensors make the machine highly visible while preserving three distinct challenges in a single footprint.',
    features:['Boxer + Kicker + Hammer in one cabinet','LED lighting and score sensors','Designed for repeated commercial use','Ticket-ready concept for redemption venues'],
    spec:[['Height','230 cm / 91 in'],['Width','140 cm / 56 in'],['Length','140 cm / 56 in'],['Weight','250 kg / 552 lb']],options:comboOptions,
    variants:variants(['d36c49_9106047d54a04ae9a045c26e9ed522ba~mv2.jpg','d36c49_4dd9a82d428247c7a156b759ec1d6884~mv2.jpg','d36c49_22c5ef2bff4b402fb4480ae3f0708506~mv2.jpg','d36c49_4ef9d427262b4f5cb2710288044e922d~mv2.jpg','d36c49_dcebd6d56c8b404699b3af378e4ae082~mv2.jpg','d36c49_599d9c84ccb946038ad484d074b79be9~mv2.jpg']),
    source:'https://www.progamespoland.com/monster-3in1-ticket'
  },
  'monster-3in1':{
    name:'Monster 3 in 1',category:'combo',label:'3-IN-1',tag:'NEW 2026',
    desc:'One cabinet, three strength challenges. Monster 3 in 1 combines boxing, kicking and hammer gameplay with bright LED presentation and accurate score sensing, giving operators a high-impact attraction without needing three separate machines.',
    features:['Boxer + Kicker + Hammer gameplay','Integrated LED lighting','High-quality score sensing','Suitable for bars, FECs, arcades and events'],
    spec:[['Height','230 cm / 91 in'],['Width','140 cm / 56 in'],['Length','140 cm / 56 in'],['Weight','250 kg / 552 lb']],options:comboOptions,
    variants:variants(['d36c49_2ccdfe409adb4a62a3a9adcd9b5e3879~mv2.jpeg','d36c49_d72a7ba8470a46a18b2be3187bd9b875~mv2.jpeg','d36c49_60dd3c05ac3045fd8bab9b8c141e2bdc~mv2.jpeg','d36c49_39249cce3907437787d188071719290d~mv2.jpeg','d36c49_f6e319708c734e2e8a424d07bb864c22~mv2.jpeg','d36c49_b75ea8cc5bbf431294f5cdabd63ed930~mv2.jpg']),
    source:'https://www.progamespoland.com/monster-3w1'
  },
  'double-hit':{
    name:'Double Hit',category:'combo',label:'BOXER + KICKER',tag:'NEW 2023',
    desc:'Double Hit combines two competitive strength challenges in one compact cabinet: a punchball at the top and a football target below. The format gives players two ways to compete while helping operators add more gameplay to a limited floor area.',
    features:['Boxing and kicking challenges in one machine','LED attraction lighting','Adjustable difficulty and free-play modes','Payment-ready for bills, coins, cards or tokens depending on configuration'],
    spec:[['Height','219 cm / 86 in'],['Width','85 cm / 34 in'],['Length','122 cm / 48 in'],['Weight','175 kg / 386 lb']],options:comboOptions,
    variants:variants(['d36c49_338c0feaec2046e998aa61a62dac23e7~mv2.jpg','d36c49_753f3da69f204a27befeaa9c2357be8a~mv2.jpg','d36c49_e4eeef964453407db8c3d177cd8885eb~mv2.jpg','d36c49_dbb917eefcfc4fc7826b4cdf9ff6ee97~mv2.jpg','d36c49_259b178e80664fb59165fce8ce3d56a0~mv2.jpg','d36c49_53130585e6d849f2ad3378c7268ed2db~mv2.jpg']),
    source:'https://www.progamespoland.com/double-hit'
  },
  'double-hit-gift':{
    name:'Double Hit Gift',category:'combo',label:'BOXER + KICKER + PRIZE',tag:'NEW 2024',
    desc:'A three-part commercial attraction that combines boxing, kicking and a prize feature in one cabinet. Bright LED lighting and the additional reward mechanic create an extra reason to replay, while operator settings allow the game to be adapted to the venue.',
    features:['Boxing + kicking + prize feature','High-visibility LED lighting','Adjustable difficulty and free-play modes','Supports multiple payment configurations'],
    spec:[['Height','219 cm / 86 in'],['Width','85 cm / 34 in'],['Length','122 cm / 48 in'],['Weight','190 kg / 419 lb']],options:comboOptions,
    variants:variants(['d36c49_50ed6391ec3a4358a07dbc092be34e08~mv2.jpg','d36c49_88e6ccc745e54081a0e66bf6c895ceef~mv2.jpg','d36c49_f449c8e887144f15b48bca8aaf7834d2~mv2.jpg','d36c49_f234704039194aa197eae9dc1587ab43~mv2.jpg','d36c49_146b6575c7e846aa84b8c2819111cc8d~mv2.jpg','d36c49_08202140789c4254a5c8f9e1c0ecfd6a~mv2.jpg']),
    source:'https://www.progamespoland.com/double-hit-gift'
  },
  'double-hit-kids':{
    name:'Double Hit Kids',category:'kids',label:'KIDS / BOXER + KICKER',tag:'NEW 2024',
    desc:'A younger-player version of the Double Hit concept, combining a punch and kick challenge in a lower, colourful cabinet. It is intended for family entertainment environments where a compact strength game needs to be accessible to children.',
    features:['Two challenges: punch and kick','Child-oriented cabinet height and graphics','LED lighting','Adjustable difficulty and free-play modes'],
    spec:[['Height','186 cm / 73 in'],['Width','85 cm / 34 in'],['Length','120 cm / 47 in'],['Weight','175 kg / 386 lb']],options:comboOptions,
    variants:variants(['d36c49_90652a5c1dce4cf4a1bedc35fab12696~mv2.jpg','d36c49_fb72e48ad6404c379f65671ba03854c1~mv2.jpg','d36c49_d07f480621054a18b6e131227dd3e436~mv2.jpg','d36c49_13503ca78b334b819fb9b1cb74de4807~mv2.jpg']),
    source:'https://www.progamespoland.com/double-hit-kids'
  },
  'double-hit-kids-gift':{
    name:'Double Hit Kids Gift',category:'kids',label:'KIDS / BOXER + KICKER + PRIZE',tag:'NEW 2024',
    desc:'The Kids Gift version adds a prize function to the compact boxing-and-kicking format. Colourful graphics, LED lighting and reward gameplay are aimed at family entertainment centres, kids zones and leisure venues.',
    features:['Punch + kick + prize gameplay','Designed for younger players','LED attraction lighting','Flexible operator settings'],
    spec:[['Height','182 cm / 72 in'],['Width','85 cm / 34 in'],['Length','120 cm / 47 in'],['Weight','180 kg / 397 lb']],options:comboOptions,
    variants:variants(['d36c49_69c61593a9a243a58b82f59499fa7ff7~mv2.jpg','d36c49_2d8f1e66766741bb9baaa4db1d244914~mv2.jpg','d36c49_0f8b83f56b444c6fb58251f23697d899~mv2.jpg','d36c49_ac6fcddc490247fcac0fb6911daa2da3~mv2.jpg']),
    source:'https://www.progamespoland.com/double-hit-kids-gift'
  },
  'double-strike':{
    name:'Double Strike 2',category:'combo',label:'DOUBLE CHALLENGE',
    desc:'Double Strike 2 brings boxing and kicking gameplay together in a wider commercial cabinet. The two strength challenges, LED presentation and configurable operator settings are intended for busy amusement locations.',
    features:['Boxing and kicking in one attraction','LED presentation','Adjustable difficulty and free-play mode','Commercial payment configuration'],
    spec:[['Height','219 cm / 86 in'],['Width','142 cm / 56 in'],['Length','122 cm / 48 in'],['Weight','170 kg / 375 lb']],options:comboOptions,
    variants:variants(['d36c49_0eeb916b0aa74377be5592607d75377e~mv2.jpeg','d36c49_34cef7cbcb0446a8a597a64acb068451~mv2.jpeg','d36c49_af20043d8307453a9db1d73b4fa27533~mv2.jpeg','d36c49_3e8aff8b9cfd4ea99957922b99e48b8b~mv2.jpeg']),
    source:'https://www.progamespoland.com/double-strike'
  },

  'joker':makeStandard('Joker','joker',['d36c49_5611ac7e3f864c13a4fc189bbd16b810~mv2.jpg','d36c49_b446eee2ad3c40a19cc015b9d212936b~mv2.jpg','d36c49_dfdd05769c894908abaa303b62c4e615~mv2.jpg','d36c49_964547d9712c478da4c35562208f33bc~mv2.jpg'],'Its graphic treatment gives the familiar commercial boxer format a bold, arcade-led visual identity.'),
  'pow-boxer':makeStandard('POW Boxer','boxer-standard-powboxer',['d36c49_6cecc2a52bae4458a0a3816b5f3088bd~mv2.jpg'],'The comic-inspired POW artwork gives the cabinet a bright visual character while retaining the Standard platform and operator configuration.'),
  'champion':makeStandard('Champion','boxer-standard-champion',['d36c49_2281fd4805544bbbbb63e121ef43cb4c~mv2.png','d36c49_48f1ab3e01fe4ed7af061c0a9735f338~mv2.jpg','d36c49_48ae36d5e21c469eba9d2767b559b7e1~mv2.jpg','d36c49_7bef8505ee7d4e07ab8fb124ae23e311~mv2.jpg'],'Champion uses a competition-inspired visual package around the Standard Pro Games punch-score platform.'),
  'easy':makeStandard('Easy','boxer-standard-easy',['d36c49_771cb1d4349a4ed9b13d4fcaba252ae5~mv2.jpg','d36c49_dc465aab3f1a4b9e9f08f2a5955fc254~mv2.jpg','d36c49_b87b60a319034364ad2630bd5b0cda01~mv2.jpg','d36c49_894589519386471a914774eaf79b6039~mv2.jpg'],'Easy presents the strength-test experience in a clean, approachable visual format for a broad range of leisure locations.'),
  'cyber-punch':makeStandard('Cyber Punch','boxer-standard-cyberpunch',['d36c49_83f3130f33304ca28c402fd3d13f99b7~mv2.jpg','d36c49_45ba07b3db5f407fba2ad6ccaa44a9f1~mv2.jpg','d36c49_9f904c65be1442bb85eed18d91037227~mv2.jpg','d36c49_7c735dfa5a064b71b38a3ccd47fcb04f~mv2.jpg'],'Cyber Punch adds a technology-themed artwork package to the Standard commercial boxer.'),
  'gladiator':makeStandard('Gladiator','boxer-standard-gladiator',['d36c49_7a635f98ec534a55856195bfbd1e0fc5~mv2.jpg','d36c49_df4021ea817f4f5790c5748eff209ae5~mv2.jpg','d36c49_887efae00a6a4a4cbf5130474c0d0f96~mv2.jpg','d36c49_a262ccb1d3fb45bc8caea78953886cac~mv2.jpg'],'Gladiator combines the Standard platform with a strong combat-inspired visual theme designed to stand out in busy venues.'),
  'mma':makeStandard('MMA','boxer-standard-mma',['d36c49_5b092ac2d09d4ee79fa3ee975cacf0f2~mv2.jpg','d36c49_56212a11e9f6443baac8576190c7b11a~mv2.jpg','d36c49_ac3bbd10bf174bc2b5b6afe8160fd634~mv2.jpg','d36c49_13886e3931dc419f8daf40aba0d077a0~mv2.jpg'],'MMA uses combat-sport graphics around the same commercial strength-test architecture.'),
  'black-jack':makeStandard('Black Jack','boxer-standard-blackjack',['d36c49_c3001d33746048a4ad7aa73a3724e4b9~mv2.jpg','d36c49_833cd63aafcb48c99c74f4ec94a6f47e~mv2.jpg','d36c49_36276a3967cf4b06af4016e5b86df991~mv2.jpg','d36c49_783a9a6adc3c4c6c9943ecafa9edd663~mv2.jpg'],'Black Jack brings a darker gaming-inspired look to the Standard Pro Games boxer platform.'),
  'super-hero':makeStandard('Super Hero','super-hero',['d36c49_8632a38032df400d874177a182b19cf8~mv2.jpg','d36c49_dbf9fe6f5e134856aa0e926865377929~mv2.jpg','d36c49_49d2acbca85d4dada9a014724a5a18ed~mv2.jpg','d36c49_4461db12062a412fbcbe7937c308defa~mv2.jpg'],'Super Hero uses vivid character-led artwork to make the Standard strength-test format especially visible on an arcade floor.'),
  'power-black':makeStandard('Power Black','boxer-standard-powerblack',['d36c49_dfc5a3e47c284fa5bd774deb0b8a6143~mv2.jpg','d36c49_5d7e717c900946e6ac542e608bd361a9~mv2.jpg','d36c49_c2ac991b797249208168a6a6658686ac~mv2.jpg','d36c49_2a403227d10d42d1beb097d9844473cd~mv2.jpg'],'Power Black gives the Standard cabinet a darker, high-contrast finish suited to modern bars, clubs and entertainment spaces.'),
  'poison-squad':makeStandard('Poison Squad','boxer-standard-poisonsquad',['d36c49_8cfe8315b69f4603ad30ff1e1554b934~mv2.jpg','d36c49_8ff27b42f4834d79bacd3a75c9ea4415~mv2.jpg','d36c49_d3ed30dc83a3480186d0857dd6996a38~mv2.jpg','d36c49_32321fd5657b4139a34e9bef06152e6f~mv2.jpg'],'Poison Squad pairs energetic artwork with the Standard operator-ready punching platform.'),
  'hacker':makeStandard('Hacker','boxer-standard-hacker',['d36c49_fabb8b8f526247fc9ddefc4ef5629258~mv2.jpg','d36c49_ba9c172919504647b3c22da60bcf57f7~mv2.jpg','d36c49_6752de44177d4d48bb01d2f2f476a71f~mv2.jpg','d36c49_ad2e5082f89c4c19a2810d1625b0c8f8~mv2.jpg'],'Hacker uses a digital-inspired visual direction on the Standard commercial boxer chassis.'),
  'strongman':makeStandard('Strongman','boxer-standard-strongman',['d36c49_d301f183dd754c22bc30c4156eb3da42~mv2.jpg','d36c49_58a51945ac8b4f379399f242d65b840f~mv2.jpg','d36c49_9480e83a27a44ff8ac145059161c1246~mv2.jpg','d36c49_3f65ad4677d245b5b9b95ae91ceed2a1~mv2.jpg'],'Strongman reinforces the classic strength-test idea with a bold power-themed cabinet graphic.'),
  'viking':makeStandard('Viking','boxer-standard-viking',['d36c49_e732554051394c5e8b85c8ef298b99e9~mv2.jpg','d36c49_95843a053a4141b3a4a252e583d1a876~mv2.jpg','d36c49_28af56eeec2b42129a7bfe64e40c11fb~mv2.jpg','d36c49_2c68a8c868dd43548c84349c0b87e3d0~mv2.jpg'],'Viking combines themed artwork with the same adjustable, payment-ready Standard boxer format.'),
  'disco':makeStandard('Disco','boxer-standard-disco',['d36c49_50ea9ec71a3d48e6b78fbcd9e6efcc59~mv2.jpg','d36c49_3ce3bc5e2b6b42f49d45dd931a880b15~mv2.jpg','d36c49_a0665fd53d2e4cfabb182f578ff00f36~mv2.jpg','d36c49_6700443d44c940568ee12ea04b9da98c~mv2.jpg'],'Disco brings a nightlife-oriented graphic theme to the Standard commercial boxer, making it a natural fit for bars and club environments.'),

  'matte-airbrushed':{
    name:'Matte Airbrushed',category:'boxer',label:'MATTE / AIRBRUSHED',tag:'NEW 2025',
    desc:'A current collection of Pro Games boxer cabinets finished with matte, airbrushed artwork. The collection focuses on distinctive visual treatments for venues that want a more custom, design-led machine.',
    features:['Matte airbrushed cabinet finishes','Multiple artwork variants shown by Pro Games','Commercial boxer platform','Custom configuration available on request'],
    spec:[['Configuration','Varies by selected boxer and finish'],['Exact dimensions','Confirm with Pro Games for the chosen configuration']],options:['Custom artwork','Payment configuration','LED configuration','Protective cover'],
    variants:variants(['d36c49_fb9904ebbd3b48c78b4e7981a992da60~mv2.jpg','d36c49_94e67a361c934d989d3f632aab8c4a14~mv2.jpg','d36c49_8034b961b31c47f2bd7c3a534c5cc8e3~mv2.jpg']),
    source:'https://www.progamespoland.com/matte-airbrushed-boxer'
  },
  'boxer-combat':{
    name:'Boxer Combat',category:'boxer',label:'BOXER PREMIUM',tag:'NEW 2024',
    desc:'Boxer Combat is a premium strength-test machine with a modern combat-inspired cabinet. It is built for repeated commercial play and can be configured for different payment systems, difficulty levels and free-play operation.',
    features:['Commercial punch-strength gameplay','Robust electronics and mechanics','Adjustable difficulty and free-play mode','Multiple payment options depending on market'],
    spec:[['Height','219 cm / 86 in'],['Width','72 cm / 28 in'],['Length','115 cm / 45 in'],['Weight','121 kg / 265 lb']],options:comboOptions,
    variants:variants(['d36c49_22f24ca2aa154352a285a8644b6bb510~mv2.jpg','d36c49_901c5c7793f948f484450ca830abd03f~mv2.jpg','d36c49_4ca4b6f113024dacb9414a78c7dea9b2~mv2.jpg','d36c49_137d02dc65fd45839a2e712e4a122fed~mv2.jpg'],['Red','White','Black','Blue']),
    source:'https://www.progamespoland.com/boxer-combat'
  },
  'boxer-fist':{
    name:'Boxer Fist · 3 Player',category:'boxer',label:'MULTIPLAYER BOXER',tag:'NEW 2025',
    desc:'Boxer Fist is designed around social competition. The three-player concept, illuminated controls and score presentation make it suitable for group challenges and head-to-head play in modern entertainment venues.',
    features:['Three-player competition concept','Integrated LED presentation','Reinforced commercial construction','Cashless-ready operator configuration'],
    spec:[['Height','219 cm / 86 in'],['Width','72 cm / 28 in'],['Length','115 cm / 45 in'],['Weight','121 kg / 265 lb']],options:comboOptions,
    variants:variants(['d36c49_08b14c21b6e94f6699d7d27a332005c7~mv2.jpg','d36c49_42c30a9a3d03436491ae1a4b140d6c22~mv2.jpg','d36c49_7fcc4c1eccb9482fa199de11f831aa93~mv2.jpg','d36c49_83436840037d4442a0452f7d7d812e3b~mv2.jpg']),
    source:'https://www.progamespoland.com/boxer-fist-3-player'
  },
  'boxer-ring':{
    name:'Boxer Ring',category:'boxer',label:'BOXER PREMIUM',tag:'NEW 2023',
    desc:'Boxer Ring is a premium punch-strength machine with a distinctive ring-inspired silhouette and strong visual lighting. It is intended for professional arcade and leisure operation with configurable difficulty and payment options.',
    features:['Professional punch-strength gameplay','Distinctive Ring cabinet design','Adjustable difficulty and free-play mode','Flexible operator payment options'],
    spec:[['Height','219 cm / 86 in'],['Width','72 cm / 28 in'],['Length','115 cm / 45 in'],['Weight','127 kg / 280 lb']],options:comboOptions,
    variants:variants(['d36c49_2b04783014544dbf92e39e725e3881e2~mv2.jpg','d36c49_723aed8e93204089b71de4a1fc06ffe5~mv2.jpg','d36c49_d8111cc412a642c38b0fd4b8b0200c33~mv2.jpg','d36c49_dc1a2938c5124466bc9a71f579530026~mv2.jpg']),
    source:'https://www.progamespoland.com/boxer-ring'
  },
  'boxer-combat-kids':{
    name:'Boxer Combat Kids',category:'kids',label:'PREMIUM KIDS',tag:'NEW 2024',
    desc:'A child-oriented version of Boxer Combat with a lower cabinet, bright artwork and adjustable gameplay. The machine is intended for family entertainment centres and children’s leisure areas while preserving the familiar score-based boxing challenge.',
    features:['Lower format for younger players','Bright child-friendly graphics','Adjustable difficulty and free-play modes','Commercial payment configurations'],
    spec:[['Height','182 cm / 72 in'],['Width','70 cm / 28 in'],['Length','115 cm / 45 in'],['Weight','120 kg / 265 lb']],options:comboOptions,
    variants:variants(['d36c49_fbeb20a103aa42b5b345d720aad3b43f~mv2.jpg','d36c49_b790e6faa3cc42b28f93bc578a0f270c~mv2.jpg','d36c49_fb94a0a9e52a4558809f8845ac00cd0e~mv2.jpg','d36c49_1824eafb06d14abab4a7226c74d11e0b~mv2.jpg']),
    source:'https://www.progamespoland.com/boxer-combat-kids'
  },
  'boxer-kids':{
    name:'Boxer Kids',category:'kids',label:'BOXER KIDS',
    desc:'A compact Pro Games boxer sized for younger players. Colourful cabinet themes, adjustable difficulty and flexible operating modes make it suitable for family entertainment centres, play areas and children’s attractions.',
    features:['Child-oriented cabinet dimensions','Multiple artwork themes','Adjustable difficulty and free-play mode','Flexible payment configuration'],
    spec:[['Height','182 cm / 72 in'],['Width','70 cm / 28 in'],['Length','115 cm / 45 in'],['Weight','100 kg / 220 lb']],options:comboOptions,
    variants:variants(['d36c49_300367abd71c42bbad49b4f4cf1d5428~mv2.jpg','d36c49_2d0fa67b34e44a299250fd8daa5614ea~mv2.jpg','d36c49_5c3690fb87bc46ada411be7b2234c1bd~mv2.jpg','d36c49_ac9df6857b07407dbfe71dd0e303b3a0~mv2.jpg']),
    source:'https://www.progamespoland.com/boxer-kids'
  },
  'boxer-flash-gift':{
    name:'Boxer Flash Gift',category:'boxer',label:'BOXER PREMIUM / PRIZE',
    desc:'Boxer Flash Gift adds a prize feature to the high-visibility Flash boxing format. LED lighting, strength scoring and the reward mechanic are designed to increase attraction and replay value in commercial venues.',
    features:['Punch-strength game with prize feature','LED attraction lighting','Adjustable difficulty and free-play mode','Flexible payment configuration'],
    spec:[['Height','219 cm / 86 in'],['Width','72 cm / 28 in'],['Length','115 cm / 45 in'],['Weight','140 kg / 309 lb']],options:comboOptions,
    variants:variants(['d36c49_1b5a7bd5dec9447b921b80f57a0e13ae~mv2.jpg','d36c49_fa66a189137141aebbb22389942df45f~mv2.jpg','d36c49_7a50a1705283411c9ee69293c5e258e3~mv2.jpg','d36c49_258c9fef06c64c189855e8a5e3c52898~mv2.jpg']),
    source:'https://www.progamespoland.com/boxer-flash-gift'
  },
  'hammer':{
    name:'Hammer',category:'strength',label:'HAMMER',
    desc:'A classic hammer strength tester presented in a bright modern cabinet. The machine is designed for amusement parks, arcades and family entertainment centres, with adjustable difficulty, free-play operation and optional ticket functionality.',
    features:['Classic hammer power challenge','LED attraction lighting','Adjustable difficulty and free-play mode','Ticket functionality available'],
    spec:[['Height','225 cm / 89 in'],['Width','95 cm / 37 in'],['Length','140 cm / 55 in'],['Weight','125 kg / 276 lb']],options:comboOptions,
    variants:variants(['d36c49_afafeaaf41674a4c88c922aeee800230~mv2.jpg','d36c49_ac7eaef74298496aad818f988bd23f75~mv2.jpg','d36c49_9d42e4537f474adcab4a61b64d2f7fe8~mv2.jpg','d36c49_5dc33c7849ff4b339aaff07525d0b204~mv2.jpg']),
    source:'https://www.progamespoland.com/hammer'
  },
  'kicker':{
    name:'Kicker',category:'strength',label:'KICKER',
    desc:'Kicker measures the force and accuracy of a football-style kick. It is aimed at both younger and adult players and works well in arcades, sports bars, events and family entertainment locations.',
    features:['Kick-strength and accuracy challenge','Suitable for a broad player age range','Adjustable difficulty and free-play mode','Flexible payment setup'],
    spec:[['Height','170 cm / 67 in'],['Width','133 cm / 52 in'],['Length','66 cm / 26 in'],['Weight','100 kg / 220 lb']],options:comboOptions,
    variants:variants(['d36c49_2fe123c3c3a74277842af12504d08f47~mv2.jpg','d36c49_c44c1aee2d7a439cb83ab840bcc8030d~mv2.jpg','d36c49_d3572c2031064190bae8986aa690d99e~mv2.jpg','d36c49_43bb55c00ff6450aa3daf3aa21fab3e0~mv2.jpg']),
    source:'https://www.progamespoland.com/kicker'
  },
  'boxer-flash':{
    name:'Boxer Flash',category:'boxer',label:'BOXER PREMIUM',
    desc:'A high-visibility premium boxer built around vivid LED lighting and a strong arcade presentation. Boxer Flash is designed for busy amusement locations, sports bars and entertainment venues where the machine needs to attract attention from a distance.',
    features:['High-visibility LED presentation','Commercial punch-strength gameplay','Adjustable difficulty and free-play mode','Configurable payment systems'],
    spec:[['Height','221 cm / 87 in'],['Width','72 cm / 28 in'],['Length','115 cm / 45 in'],['Weight','121 kg / 265 lb']],options:comboOptions,
    variants:[
      {name:'Black',image:'https://www.uplayamerica.com/wp-content/uploads/2024/10/flashnegra-1-1-1-500x1016.webp'},
      {name:'Red',image:'https://www.uplayamerica.com/wp-content/uploads/2024/10/flash-red-2-1.webp'},
      {name:'Blue',image:'https://www.uplayamerica.com/wp-content/uploads/2024/10/FlashBlue-1-1.webp'},
      {name:'Yellow',image:'https://www.uplayamerica.com/wp-content/uploads/2024/10/FlashYellow-1-1.webp'},
      {name:'White',image:'https://www.uplayamerica.com/wp-content/uploads/2024/10/FlashWhite-1-500x933-1-1.webp'}
    ],
    source:'https://www.progamespoland.com/'
  },
  'boxer-gift':{
    name:'Boxer Gift',category:'boxer',label:'BOXER / PRIZE',
    desc:'Boxer Gift combines the familiar punch-strength challenge with a prize feature. It is built for high-traffic operation and can be configured for different payment systems, difficulty levels and free-play use.',
    features:['Punch-strength gameplay with prize feature','Commercial-duty construction','Adjustable difficulty and free-play mode','Flexible payment configuration'],
    spec:[['Height','219 cm / 86 in'],['Width','72 cm / 28 in'],['Length','115 cm / 45 in'],['Weight','140 kg / 309 lb']],options:comboOptions,
    variants:variants(['d36c49_64245c96fa354f81b1c1b0f5130cd14d~mv2.jpg','d36c49_4df2d5e039194f468a3f2b3d3cab83b2~mv2.jpg','d36c49_11fdece776ca4e8dbe9beaf45c050bb8~mv2.jpg','d36c49_b35278bab1fa4872b1af15ec0d69a12f~mv2.jpg']),
    source:'https://www.progamespoland.com/boxer-gift'
  },

  'bouncy-castles-xs':{
    name:'Bouncy Castles · XS',category:'distributed',label:'DISTRIBUTED / INFLATABLES',
    desc:'A range of compact inflatable attractions aimed at younger children. The XS collection includes different themes, shapes and colour schemes, with selected designs incorporating a slide or roof.',
    features:['Compact format for younger children','Multiple themes and artwork options','Selected models include integrated slides','Designed for repeated event and leisure use'],
    spec:[['Typical standard category','Approx. 5.5 × 4.5 m'],['XS models','Exact dimensions vary by design']],options:['Dino with Slide','Sea with Slide','Pirates with Slide','Sea with Roof','Princess variants','Jungle variants'],
    variants:variants(['d36c49_4f67247b192549c3bf35e889ccf8f584~mv2.png','d36c49_4601588854bc421bb04cd406c8b3274b~mv2.png','d36c49_960fb073a55e43bdb5e4878a98f0131a~mv2.png','d36c49_feb3b3ecc2b74b1ebf6bae69765dfd41~mv2.png'],['Dino with Slide','Sea with Slide','Pirates with Slide','Sea with Roof']),
    source:'https://www.progamespoland.com/bouncy-castles-size-xs'
  },
  'air-hockey-golden':{
    name:'Air Hockey Golden',category:'distributed',label:'DISTRIBUTED / AIR HOCKEY',
    desc:'Golden is an indoor commercial air hockey table with an elegant gold-accented design, perforated stainless playfield, LED lighting and configurable operator settings.',
    features:['Stainless perforated playfield','LED lighting in playfield and legs','Digital score display','260 W air pump'],
    spec:[['6 ft','199 × 107 × 85 cm · 165 kg'],['8 ft','238 × 128 × 85 cm · 220 kg'],['Power','230 V / 50 Hz']],options:['Ticket dispenser','Bill acceptor','Card reader','Optional LED lamp'],
    variants:[{name:'Golden',image:pg('d36c49_504d770fe34340599eab10f757ab0d4c~mv2.jpg')}],source:'https://www.progamespoland.com/air-hockey'
  },
  'air-hockey-arctic':{
    name:'Air Hockey Arctic',category:'distributed',label:'DISTRIBUTED / AIR HOCKEY',
    desc:'Arctic is presented as a waterproof commercial air hockey table suitable for outdoor as well as indoor operation. It combines an illuminated playfield with digital scoring and configurable coin or cashless options.',
    features:['Waterproof outdoor/indoor concept','LED playfield and leg lighting','Digital score displays','260 W air pump'],
    spec:[['6 ft','199 × 107 × 85 cm · 165 kg'],['8 ft','238 × 128 × 85 cm · 220 kg'],['Power','230 V / 50 Hz']],options:['Ticket dispenser','Bill acceptor','Card reader'],
    variants:[{name:'Arctic',image:pg('d36c49_392b5aebf76345f6ba78f71977ea8617~mv2.jpeg')}],source:'https://www.progamespoland.com/air-hockey'
  },
  'air-hockey-matrix':{
    name:'Air Hockey Matrix',category:'distributed',label:'DISTRIBUTED / AIR HOCKEY',
    desc:'Matrix is a futuristic commercial air hockey table built around animated LED matrix displays. The displays communicate score events and game messages while a sound system and configurable operator settings add to the experience.',
    features:['Integrated LED matrix display','LED score and game-message updates','In-game sound system','Electronic coin acceptor with free-play option'],
    spec:[['8 ft','240 × 130 × 85 cm · 240 kg'],['Package','245 × 140 × 55 cm · 250 kg']],options:['Operator game settings','Free-play mode'],
    variants:[{name:'Matrix',image:pg('d36c49_e037bb0e184b4415a2679e1b0c5e2c28~mv2.png')}],source:'https://www.progamespoland.com/air-hockey'
  },
  'basketball-compact':{
    name:'Basketball Compact',category:'distributed',label:'DISTRIBUTED / BASKETBALL',
    desc:'A compact commercial basketball machine designed to pass through an 80 cm doorway, with adjustable height, moving basket, linking option and digital score, credit and record display.',
    features:['Compact transport-friendly format','Adjustable height from 248 to 310 cm','Moving basket and linking option','Five balls included'],
    spec:[['Product','243 × 109 × 248–310 cm'],['Weight','350 kg'],['Power','230 V / 50 Hz']],options:['Ticket dispenser','Bill acceptor','Card reader'],
    variants:[{name:'Compact',image:pg('d36c49_682155b3b34d411e951501625889ccec~mv2.jpg')}],source:'https://www.progamespoland.com/basketball'
  },
  'basketball':{
    name:'Basketball',category:'distributed',label:'DISTRIBUTED / BASKETBALL',
    desc:'A weatherproof basketball arcade machine for year-round outdoor or indoor use. Four difficulty levels, a moving-basket mode and linking support allow both individual and group competition.',
    features:['Weatherproof construction','Four difficulty levels','Moving-basket mode','Linking for competitive play'],
    spec:[['Product','246 × 100 × 250/270 cm'],['Weight','290 kg'],['Power','230 V / 50 Hz']],options:['Ticket dispenser','Bill acceptor','Card reader'],
    variants:[{name:'Standard',image:pg('d36c49_29c7a4decd5447cdb81fc44780f755eb~mv2.png')}],source:'https://www.progamespoland.com/basketball'
  },
  'kids-basketball':{
    name:'Kids Basketball',category:'distributed',label:'DISTRIBUTED / KIDS BASKETBALL',
    desc:'A smaller, colourful basketball machine designed for children. It is presented as weather-resistant, with four difficulty levels, a moving basket and a transport-friendly construction.',
    features:['Child-oriented height and styling','Weather-resistant construction','Four difficulty levels','Moving basket and five balls included'],
    spec:[['Product','160 × 80 × 210 cm'],['Weight','175 kg'],['Power','230 V / 50 Hz']],options:['Ticket dispenser','Bill acceptor','Card reader'],
    variants:[{name:'Kids',image:pg('d36c49_b744255ce2bd471b95908acdda8b3a0d~mv2.png')}],source:'https://www.progamespoland.com/basketball'
  },
  'kiddie-ride':{
    name:'Kiddie Ride',category:'distributed',label:'DISTRIBUTED MACHINE',
    desc:'A children’s ride category currently listed in the Pro Games product range. Exact ride model, dimensions and commercial configuration should be confirmed for the selected unit before ordering.',
    features:['Children’s amusement category','Commercial venue use','Model-specific configuration','Details available from Pro Games sales'],
    spec:[['Specifications','Confirm for the selected ride']],options:['Ask about current available models'],
    variants:[{name:'Current range',image:pg('d36c49_5ffcc182fcd7455fa10be5331ee82ed9~mv2.png')}],source:'https://www.progamespoland.com/'
  },
  'cyberdart':{
    name:'Cyberdart',category:'distributed',label:'DISTRIBUTED MACHINE',
    desc:'Cyberdart is listed in the current Pro Games range as a distributed entertainment machine. Final technical specification and available configuration should be confirmed with the sales team.',
    features:['Electronic darts entertainment format','Commercial venue category','Model-specific configuration','Details available from Pro Games sales'],
    spec:[['Specifications','Confirm current configuration with Pro Games']],options:['Ask about current model and payment setup'],
    variants:[{name:'Current model',image:pg('d36c49_988cd7f6d0e64507a05ff2e67bc2dd95~mv2.jpeg')}],source:'https://www.progamespoland.com/'
  }
};

Object.values(window.PRODUCTS).forEach(product=>{
  product.image=product.variants?.[0]?.image||product.image||'';
});

/* === PG COLOR NAMES + ES LOCALIZATION === */
/* === VERIFIED VARIANT LABELS + ES LOCALIZATION === */
/*
  Important: do not guess a cabinet colour from gallery position.
  Most Wix galleries only provide image order, not a reliable colour name.
  The product page therefore uses the real variant photo as the selector.
  Colour labels are kept only where the source data explicitly identifies them.
*/
const PG_COLOR_NAMES={
  'boxer-combat':['Red','White','Black','Blue'],
  'boxer-flash':['Black','Red','Blue','Yellow','White']
};
Object.entries(PG_COLOR_NAMES).forEach(([slug,names])=>{
  const product=window.PRODUCTS[slug];
  if(!product?.variants) return;
  product.variants.forEach((variant,i)=>{ if(names[i]) variant.name=names[i]; });
});


window.PRODUCT_ES={
'monster-3in1-ticket':{desc:'Una atracción tres en uno que combina Boxer, Kicker y Hammer en un solo mueble, con concepto preparado para tickets y centros de redemption. La iluminación LED y los sensores de fuerza hacen que la máquina destaque visualmente manteniendo tres retos distintos en una sola superficie.'},
'monster-3in1':{desc:'Tres retos de fuerza en una sola máquina. Monster 3 in 1 combina boxeo, golpeo de balón y martillo con una presentación LED llamativa y medición precisa de la puntuación, ofreciendo a los operadores una atracción de alto impacto sin ocupar el espacio de tres máquinas independientes.'},
'double-hit':{desc:'Double Hit combina dos retos de fuerza competitivos en un mueble compacto: punchball en la parte superior y objetivo de fútbol en la inferior. El formato ofrece dos formas de competir y permite añadir más juego en una superficie reducida.'},
'double-hit-gift':{desc:'Atracción comercial de tres funciones que combina boxeo, golpeo de balón y premio en un solo mueble. La iluminación LED y la mecánica de recompensa aumentan el atractivo y favorecen la repetición de partidas.'},
'double-hit-kids':{desc:'Versión de Double Hit adaptada a jugadores jóvenes, con reto de puñetazo y patada en un mueble más bajo y colorido. Está pensada para centros de ocio familiar y zonas infantiles.'},
'double-hit-kids-gift':{desc:'La versión Kids Gift añade una función de premio al formato compacto de boxeo y patada. Sus gráficos coloridos, iluminación LED y juego con recompensa están orientados a centros de ocio familiar y zonas infantiles.'},
'double-strike':{desc:'Double Strike 2 reúne boxeo y patada en un mueble comercial más ancho. Sus dos retos de fuerza, la presentación LED y los ajustes para operador están pensados para ubicaciones de entretenimiento con alta afluencia.'},
'joker':{desc:'Joker es un boxer comercial Pro Games basado en la plataforma Standard. Su diseño gráfico aporta una identidad arcade atrevida al formato clásico de máquina de fuerza.'},
'pow-boxer':{desc:'POW Boxer es un boxer comercial Pro Games basado en la plataforma Standard. Su gráfica inspirada en cómic aporta un carácter visual muy llamativo manteniendo la configuración de operador de la plataforma Standard.'},
'champion':{desc:'Champion es un boxer comercial Pro Games basado en la plataforma Standard. Utiliza una estética inspirada en la competición alrededor del sistema de puntuación de fuerza Pro Games.'},
'easy':{desc:'Easy es un boxer comercial Pro Games basado en la plataforma Standard. Presenta la experiencia de medición de fuerza con un diseño limpio y accesible para una amplia variedad de espacios de ocio.'},
'cyber-punch':{desc:'Cyber Punch es un boxer comercial Pro Games basado en la plataforma Standard, con una estética tecnológica aplicada al chasis comercial de la marca.'},
'gladiator':{desc:'Gladiator combina la plataforma Standard con una estética inspirada en el combate, diseñada para destacar visualmente en locales con mucha actividad.'},
'mma':{desc:'MMA utiliza gráficos inspirados en deportes de combate sobre la arquitectura comercial Standard de Pro Games.'},
'black-jack':{desc:'Black Jack aporta una estética de juego más oscura a la plataforma Standard de Pro Games, manteniendo la misma base comercial y configuración para operador.'},
'super-hero':{desc:'Super Hero utiliza gráficos de personajes muy visibles para hacer que el formato Standard destaque especialmente en la sala de juegos.'},
'power-black':{desc:'Power Black ofrece un acabado oscuro y de alto contraste para la plataforma Standard, especialmente adecuado para bares, clubes y espacios de entretenimiento modernos.'},
'poison-squad':{desc:'Poison Squad combina gráficos enérgicos con la plataforma de boxeo Standard preparada para operación comercial.'},
'hacker':{desc:'Hacker aplica una dirección visual digital y tecnológica al chasis comercial Standard de Pro Games.'},
'strongman':{desc:'Strongman refuerza la idea clásica de prueba de fuerza mediante una gráfica potente sobre la plataforma Standard.'},
'viking':{desc:'Viking combina arte temático con el formato Standard ajustable y preparado para diferentes sistemas de pago.'},
'disco':{desc:'Disco aporta una estética orientada a la vida nocturna al boxer comercial Standard, especialmente adecuada para bares y clubes.'},
'matte-airbrushed':{desc:'Colección actual de boxers Pro Games con acabados mate y aerografiados. Está orientada a locales que buscan una máquina más personalizada y centrada en el diseño.'},
'boxer-combat':{desc:'Boxer Combat es una máquina premium de prueba de fuerza con un mueble moderno inspirado en el combate. Está diseñada para uso comercial repetido y puede configurarse con distintos sistemas de pago, niveles de dificultad y modo free play.'},
'boxer-fist':{desc:'Boxer Fist está diseñado para la competición social. El concepto para tres jugadores, los controles iluminados y la presentación de puntuación lo hacen ideal para retos de grupo y juego cara a cara.'},
'boxer-ring':{desc:'Boxer Ring es una máquina premium de fuerza de golpeo con una silueta inspirada en el ring y una fuerte presencia lumínica. Está pensada para operación profesional en arcades y centros de ocio.'},
'boxer-combat-kids':{desc:'Versión infantil de Boxer Combat con mueble más bajo, gráficos brillantes y juego ajustable. Está destinada a centros de ocio familiar y zonas infantiles manteniendo el reto clásico de puntuación de boxeo.'},
'boxer-kids':{desc:'Boxer compacto dimensionado para jugadores jóvenes. Sus temas coloridos, dificultad ajustable y modos de operación flexibles lo hacen adecuado para centros de ocio familiar y áreas de juego.'},
'boxer-flash-gift':{desc:'Boxer Flash Gift añade una función de premio al formato Flash de alta visibilidad. La iluminación LED, la medición de fuerza y la mecánica de recompensa están diseñadas para aumentar la atracción y la repetición de partidas.'},
'hammer':{desc:'Prueba de fuerza clásica con martillo en un mueble moderno y llamativo. Diseñada para parques de atracciones, arcades y centros de ocio familiar, con dificultad ajustable, free play y opción de tickets.'},
'kicker':{desc:'Kicker mide la fuerza y precisión de un golpeo de fútbol. Está orientado tanto a jugadores jóvenes como adultos y funciona especialmente bien en arcades, sports bars, eventos y centros de ocio familiar.'},
'boxer-flash':{desc:'Boxer premium de alta visibilidad basado en iluminación LED y una presentación arcade potente. Boxer Flash está diseñado para locales con alta afluencia donde la máquina debe atraer la atención desde lejos.'},
'boxer-gift':{desc:'Boxer Gift combina el conocido reto de fuerza de golpeo con una función de premio. Está diseñado para uso intensivo y puede configurarse con diferentes sistemas de pago, niveles de dificultad y free play.'},
'bouncy-castles-xs':{desc:'Gama de atracciones hinchables compactas para niños pequeños. La colección XS incluye diferentes temas, formas y combinaciones de color; algunos diseños incorporan tobogán o techo.'},
'air-hockey-golden':{desc:'Golden es una mesa de air hockey comercial para interiores con diseño elegante de acentos dorados, superficie perforada de acero inoxidable, iluminación LED y ajustes configurables para operador.'},
'air-hockey-arctic':{desc:'Arctic se presenta como una mesa de air hockey comercial resistente al agua, adecuada para uso exterior e interior. Combina pista iluminada, marcador digital y opciones de pago configurables.'},
'air-hockey-matrix':{desc:'Matrix es una mesa de air hockey comercial de estética futurista basada en pantallas LED matriciales animadas. Las pantallas comunican eventos y mensajes de juego, acompañadas por sonido y ajustes configurables.'},
'basketball-compact':{desc:'Máquina de baloncesto comercial compacta diseñada para pasar por una puerta de 80 cm, con altura ajustable, canasta móvil, opción de conexión entre máquinas y marcadores digitales.'},
'basketball':{desc:'Máquina arcade de baloncesto resistente a la intemperie para uso interior o exterior durante todo el año. Ofrece cuatro niveles de dificultad, modo de canasta móvil y conexión para competición individual o en grupo.'},
'kids-basketball':{desc:'Máquina de baloncesto más pequeña y colorida diseñada para niños. Se presenta como resistente a la intemperie, con cuatro niveles de dificultad, canasta móvil y construcción pensada para el transporte.'},
'kiddie-ride':{desc:'Categoría de atracciones infantiles incluida actualmente en la gama Pro Games. El modelo exacto, dimensiones y configuración comercial deben confirmarse para la unidad seleccionada antes del pedido.'},
'cyberdart':{desc:'Cyberdart forma parte de la gama actual de máquinas distribuidas por Pro Games. La especificación técnica final y la configuración disponible deben confirmarse con el equipo comercial.'}
};

window.PG_ES={
 labels:{'3-IN-1 / TICKET':'3 EN 1 / TICKETS','3-IN-1':'3 EN 1','BOXER + KICKER':'BOXER + KICKER','BOXER + KICKER + PRIZE':'BOXER + KICKER + PREMIO','KIDS / BOXER + KICKER':'INFANTIL / BOXER + KICKER','KIDS / BOXER + KICKER + PRIZE':'INFANTIL / BOXER + KICKER + PREMIO','DOUBLE CHALLENGE':'DOBLE RETO','BOXER STANDARD':'BOXER STANDARD','MATTE / AIRBRUSHED':'MATE / AEROGRAFIADO','BOXER PREMIUM':'BOXER PREMIUM','MULTIPLAYER BOXER':'BOXER MULTIJUGADOR','PREMIUM KIDS':'PREMIUM INFANTIL','BOXER KIDS':'BOXER INFANTIL','BOXER PREMIUM / PRIZE':'BOXER PREMIUM / PREMIO','HAMMER':'MARTILLO','KICKER':'KICKER','BOXER / PRIZE':'BOXER / PREMIO','DISTRIBUTED / INFLATABLES':'DISTRIBUCIÓN / HINCHABLES','DISTRIBUTED / AIR HOCKEY':'DISTRIBUCIÓN / AIR HOCKEY','DISTRIBUTED / BASKETBALL':'DISTRIBUCIÓN / BALONCESTO','DISTRIBUTED / KIDS BASKETBALL':'DISTRIBUCIÓN / BALONCESTO INFANTIL','DISTRIBUTED MACHINE':'MÁQUINA DISTRIBUIDA'},
 specs:{'Height':'Altura','Width':'Anchura','Length':'Largo','Weight':'Peso','Configuration':'Configuración','Exact dimensions':'Dimensiones exactas','Typical standard category':'Categoría Standard típica','XS models':'Modelos XS','Power':'Potencia','Package':'Embalaje','Product':'Producto','Specifications':'Especificaciones'},
 features:{
 'Boxer + Kicker + Hammer in one cabinet':'Boxer + Kicker + Hammer en un solo mueble','LED lighting and score sensors':'Iluminación LED y sensores de puntuación','Designed for repeated commercial use':'Diseñada para uso comercial intensivo','Ticket-ready concept for redemption venues':'Concepto preparado para tickets y centros redemption','Boxer + Kicker + Hammer gameplay':'Juego Boxer + Kicker + Hammer','Integrated LED lighting':'Iluminación LED integrada','High-quality score sensing':'Medición de puntuación de alta calidad','Suitable for bars, FECs, arcades and events':'Adecuada para bares, FEC, arcades y eventos','Boxing and kicking challenges in one machine':'Retos de boxeo y patada en una máquina','LED attraction lighting':'Iluminación LED de atracción','Adjustable difficulty and free-play modes':'Dificultad ajustable y modo free play','Payment-ready for bills, coins, cards or tokens depending on configuration':'Preparada para billetes, monedas, tarjetas o fichas según configuración','Boxing + kicking + prize feature':'Boxeo + patada + función de premio','High-visibility LED lighting':'Iluminación LED de alta visibilidad','Supports multiple payment configurations':'Compatible con múltiples configuraciones de pago','Two challenges: punch and kick':'Dos retos: puñetazo y patada','Child-oriented cabinet height and graphics':'Altura y gráficos adaptados a niños','LED lighting':'Iluminación LED','Punch + kick + prize gameplay':'Puñetazo + patada + juego con premio','Designed for younger players':'Diseñada para jugadores jóvenes','Flexible operator settings':'Ajustes flexibles para operador','Boxing and kicking in one attraction':'Boxeo y patada en una sola atracción','LED presentation':'Presentación LED','Adjustable difficulty and free-play mode':'Dificultad ajustable y modo free play','Commercial payment configuration':'Configuración de pago comercial','Commercial strength-test gameplay designed for high-traffic venues':'Juego comercial de prueba de fuerza para locales con alta afluencia','Adjustable difficulty settings and free-play mode':'Dificultad ajustable y modo free play','Supports flexible payment configurations for different markets':'Configuraciones de pago flexibles para distintos mercados','Operator-focused construction with service access and configurable lighting':'Construcción orientada al operador, acceso de servicio e iluminación configurable','Matte airbrushed cabinet finishes':'Acabados mate aerografiados','Multiple artwork variants shown by Pro Games':'Múltiples variantes gráficas mostradas por Pro Games','Commercial boxer platform':'Plataforma boxer comercial','Custom configuration available on request':'Configuración personalizada bajo pedido','Commercial punch-strength gameplay':'Juego comercial de fuerza de golpeo','Robust electronics and mechanics':'Electrónica y mecánica robustas','Multiple payment options depending on market':'Múltiples opciones de pago según mercado','Three-player competition concept':'Concepto de competición para tres jugadores','Integrated LED presentation':'Presentación LED integrada','Reinforced commercial construction':'Construcción comercial reforzada','Cashless-ready operator configuration':'Configuración preparada para pago cashless','Professional punch-strength gameplay':'Juego profesional de fuerza de golpeo','Distinctive Ring cabinet design':'Diseño distintivo de mueble Ring','Flexible operator payment options':'Opciones de pago flexibles para operador','Lower format for younger players':'Formato más bajo para jugadores jóvenes','Bright child-friendly graphics':'Gráficos luminosos adaptados a niños','Commercial payment configurations':'Configuraciones de pago comerciales','Child-oriented cabinet dimensions':'Dimensiones adaptadas a niños','Multiple artwork themes':'Múltiples temas gráficos','Flexible payment configuration':'Configuración de pago flexible','Punch-strength game with prize feature':'Juego de fuerza con función de premio','Classic hammer power challenge':'Reto clásico de fuerza con martillo','Ticket functionality available':'Función de tickets disponible','Kick-strength and accuracy challenge':'Reto de fuerza y precisión de patada','Suitable for a broad player age range':'Adecuado para un amplio rango de edades','Flexible payment setup':'Configuración de pago flexible','High-visibility LED presentation':'Presentación LED de alta visibilidad','Configurable payment systems':'Sistemas de pago configurables','Punch-strength gameplay with prize feature':'Juego de fuerza con función de premio','Commercial-duty construction':'Construcción para uso comercial','Compact format for younger children':'Formato compacto para niños pequeños','Multiple themes and artwork options':'Múltiples temas y opciones gráficas','Selected models include integrated slides':'Algunos modelos incluyen tobogán integrado','Designed for repeated event and leisure use':'Diseñada para uso repetido en eventos y ocio','Stainless perforated playfield':'Pista perforada de acero inoxidable','LED lighting in playfield and legs':'Iluminación LED en pista y patas','Digital score display':'Marcador digital','260 W air pump':'Bomba de aire de 260 W','Waterproof outdoor/indoor concept':'Concepto resistente al agua para exterior/interior','LED playfield and leg lighting':'Iluminación LED en pista y patas','Digital score displays':'Marcadores digitales','Integrated LED matrix display':'Pantalla LED matricial integrada','LED score and game-message updates':'Puntuación y mensajes de juego mediante LED','In-game sound system':'Sistema de sonido integrado','Electronic coin acceptor with free-play option':'Monedero electrónico con opción free play','Compact transport-friendly format':'Formato compacto y fácil de transportar','Adjustable height from 248 to 310 cm':'Altura ajustable de 248 a 310 cm','Moving basket and linking option':'Canasta móvil y opción de conexión','Five balls included':'Cinco balones incluidos','Weatherproof construction':'Construcción resistente a la intemperie','Four difficulty levels':'Cuatro niveles de dificultad','Moving-basket mode':'Modo de canasta móvil','Linking for competitive play':'Conexión para juego competitivo','Child-oriented height and styling':'Altura y estilo adaptados a niños','Weather-resistant construction':'Construcción resistente a la intemperie','Moving basket and five balls included':'Canasta móvil y cinco balones incluidos','Children’s amusement category':'Categoría de entretenimiento infantil','Commercial venue use':'Uso en espacios comerciales','Model-specific configuration':'Configuración específica según modelo','Details available from Pro Games sales':'Detalles disponibles con el equipo comercial Pro Games','Electronic darts entertainment format':'Formato de entretenimiento de dardos electrónicos','Commercial venue category':'Categoría para espacios comerciales'},
 options:{'Bill acceptor':'Aceptador de billetes','Nayax / cashless payment':'Nayax / pago cashless','Ticket dispenser':'Dispensador de tickets','Custom graphics and branding':'Gráficos y branding personalizados','Silent mode (advance order)':'Modo silencioso (pedido anticipado)','Card reader / cashless payment':'Lector de tarjetas / pago cashless','2 m power cable':'Cable de alimentación de 2 m','Protective cover':'Cubierta protectora','LED lighting variation':'Variación de iluminación LED','Custom artwork':'Diseño gráfico personalizado','Payment configuration':'Configuración de pago','LED configuration':'Configuración LED','Dino with Slide':'Dino con tobogán','Sea with Slide':'Mar con tobogán','Pirates with Slide':'Piratas con tobogán','Sea with Roof':'Mar con techo','Princess variants':'Variantes Princesa','Jungle variants':'Variantes Jungla','Card reader':'Lector de tarjetas','Optional LED lamp':'Lámpara LED opcional','Operator game settings':'Ajustes de juego para operador','Free-play mode':'Modo free play','Ask about current available models':'Consultar modelos disponibles','Ask about current model and payment setup':'Consultar modelo actual y sistema de pago'},
 colors:{'White':'Blanco','Orange':'Naranja','Yellow':'Amarillo','Green':'Verde','Blue':'Azul','Red':'Rojo','Black':'Negro','Brown':'Marrón','Graphite':'Grafito','Golden':'Dorado','Arctic':'Arctic','Matrix':'Matrix','Compact':'Compact','Standard':'Standard','Kids':'Infantil','Current range':'Gama actual','Current model':'Modelo actual','Dino with Slide':'Dino con tobogán','Sea with Slide':'Mar con tobogán','Pirates with Slide':'Piratas con tobogán','Sea with Roof':'Mar con techo'}
};
/* === END PG LOCALIZATION === */
