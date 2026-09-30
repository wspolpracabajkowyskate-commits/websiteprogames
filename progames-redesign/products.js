const wix=(file)=>`https://static.wixstatic.com/media/${file}`;
const colours=['Orange','Red','Yellow','Blue','White'];
const makeVariants=(files,names=colours)=>files.map((file,i)=>({name:names[i]||`Colour ${i+1}`,image:wix(file)}));

window.PRODUCTS={
  'monster-3in1':{
    name:'Monster 3 in 1',category:'combo',label:'EXCLUSIVE / 3-IN-1',tag:'NEW 2026',
    image:wix('d36c49_9106047d54a04ae9a045c26e9ed522ba~mv2.jpg'),
    desc:'A compact 3-in-1 strength machine combining Boxer, Kicker and Hammer in one cabinet. LED lighting, accurate scoring sensors and three game modes make it a high-impact attraction for busy entertainment venues.',
    features:['Boxer, Kicker and Hammer in one machine','LED lighting and accurate scoring sensors','Built for intensive commercial use','Adjustable settings and free-play mode'],
    spec:[['Height','230 cm'],['Width','140 cm'],['Length','140 cm'],['Weight','250 kg']],
    options:['Bill acceptor','Nayax cashless payment','Ticket dispenser','Custom sticker and branding','Silent mode'],
    variants:makeVariants([
      'd36c49_9106047d54a04ae9a045c26e9ed522ba~mv2.jpg','d36c49_4dd9a82d428247c7a156b759ec1d6884~mv2.jpg','d36c49_22c5ef2bff4b402fb4480ae3f0708506~mv2.jpg','d36c49_4ef9d427262b4f5cb2710288044e922d~mv2.jpg','d36c49_dcebd6d56c8b404699b3af378e4ae082~mv2.jpg','d36c49_599d9c84ccb946038ad484d074b79be9~mv2.jpg'
    ],['White','Orange','Yellow','Green','Blue','Red'])
  },
  'champion':{
    name:'Champion',category:'boxer',label:'BOXER STANDARD',
    image:wix('d36c49_2281fd4805544bbbbb63e121ef43cb4c~mv2.png'),
    desc:'A professional commercial boxer built for high-traffic locations. Champion combines robust electronics and mechanics with adjustable difficulty, free play and flexible payment configuration.',
    features:['Commercial-grade electronics and mechanics','Adjustable difficulty','Free-play mode','Multiple payment options'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','121 kg']],
    options:['Bill acceptor','Card reader / cashless payment','Protective cover','Custom sticker and branding','LED lighting variation'],
    variants:makeVariants(['d36c49_2281fd4805544bbbbb63e121ef43cb4c~mv2.png','d36c49_48f1ab3e01fe4ed7af061c0a9735f338~mv2.jpg','d36c49_48ae36d5e21c469eba9d2767b559b7e1~mv2.jpg','d36c49_7bef8505ee7d4e07ab8fb124ae23e311~mv2.jpg','d36c49_65ef499e1133463dbc0efebb2f4db3f1~mv2.jpg'],['Blue','Red','White','Yellow','Orange'])
  },
  'gladiator':{
    name:'Gladiator',category:'boxer',label:'BOXER STANDARD',
    image:wix('d36c49_7a635f98ec534a55856195bfbd1e0fc5~mv2.jpg'),
    desc:'A standard-format boxer with the distinctive Gladiator artwork. It is designed for reliable commercial operation, repeat play and flexible payment options in busy venues.',
    features:['Designed for high-traffic venues','Adjustable difficulty','Free-play mode','Bills, coins, cards and tokens supported by configuration'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','121 kg']],
    options:['Bill acceptor','Card reader / cashless payment','Protective cover','Custom sticker and branding','LED lighting variation'],
    variants:makeVariants(['d36c49_7a635f98ec534a55856195bfbd1e0fc5~mv2.jpg','d36c49_df4021ea817f4f5790c5748eff209ae5~mv2.jpg','d36c49_887efae00a6a4a4cbf5130474c0d0f96~mv2.jpg','d36c49_a262ccb1d3fb45bc8caea78953886cac~mv2.jpg','d36c49_84b4dd7bd9cd4809befdb09743acaf9d~mv2.jpg'],['Brown','Red','White','Yellow','Blue'])
  },
  'easy':{
    name:'Easy',category:'boxer',label:'BOXER STANDARD',
    image:'assets/products/easy-main.webp',
    desc:'A Boxer Standard model with distinctive Easy artwork, built for reliable commercial operation in high-traffic entertainment venues.',
    features:['Immersive strength gameplay','Commercial-grade construction','Multiple payment configurations','Adjustable difficulty and free play'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','121 kg']],
    options:['Bill acceptor','Card reader / cashless payment','Protective cover','Custom sticker and branding','LED lighting variation'],
    variants:[
      {name:'Red',image:'assets/products/easy-red.webp'},
      {name:'White',image:'assets/products/easy-white.webp'},
      {name:'Yellow',image:'assets/products/easy-yellow.webp'},
      {name:'Blue',image:'assets/products/easy-blue.webp'},
      {name:'Orange',image:'assets/products/easy-orange.webp'}
    ]
  },
  'mma':{
    name:'MMA',category:'boxer',label:'BOXER STANDARD',
    image:'assets/products/mma-main.webp',
    desc:'A Boxer Standard model with distinctive MMA artwork, built for reliable commercial operation in high-traffic entertainment venues.',
    features:['Immersive strength gameplay','Commercial-grade construction','Multiple payment configurations','Adjustable difficulty and free play'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','121 kg']],
    options:['Bill acceptor','Card reader / cashless payment','Protective cover','Custom sticker and branding','LED lighting variation'],
    variants:[
      {name:'Red',image:'assets/products/mma-red.webp'},
      {name:'Black',image:'assets/products/mma-black.webp'},
      {name:'Yellow',image:'assets/products/mma-yellow.webp'},
      {name:'Blue',image:'assets/products/mma-blue.webp'},
      {name:'Orange',image:'assets/products/mma-orange.webp'}
    ]
  },
  'hacker':{
    name:'Hacker',category:'boxer',label:'BOXER STANDARD',
    image:'assets/products/hacker-main.webp',
    desc:'A Boxer Standard model with distinctive Hacker artwork, built for reliable commercial operation in high-traffic entertainment venues.',
    features:['Immersive strength gameplay','Commercial-grade construction','Multiple payment configurations','Adjustable difficulty and free play'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','121 kg']],
    options:['Bill acceptor','Card reader / cashless payment','Protective cover','Custom sticker and branding','LED lighting variation'],
    variants:[
      {name:'White',image:'assets/products/hacker-black.webp'},
      {name:'Yellow',image:'assets/products/hacker-yellow.webp'},
      {name:'Black',image:'assets/products/hacker-black-2.webp'},
      {name:'Blue',image:'assets/products/hacker-blue.webp'},
      {name:'Orange',image:'assets/products/hacker-red.webp'}
    ]
  },
  'power-black':{
    name:'Power Black',category:'boxer',label:'BOXER STANDARD',
    image:'assets/products/power-black-main.webp',
    desc:'A Boxer Standard model with distinctive Power Black artwork, built for reliable commercial operation in high-traffic entertainment venues.',
    features:['Immersive strength gameplay','Commercial-grade construction','Multiple payment configurations','Adjustable difficulty and free play'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','121 kg']],
    options:['Bill acceptor','Card reader / cashless payment','Protective cover','Custom sticker and branding','LED lighting variation'],
    variants:[
      {name:'Red',image:'assets/products/power-black-red.webp'},
      {name:'White',image:'assets/products/power-black-white.webp'},
      {name:'Yellow',image:'assets/products/power-black-yellow.webp'},
      {name:'Blue',image:'assets/products/power-black-blue.webp'},
      {name:'Orange',image:'assets/products/power-black-orange.webp'}
    ]
  },
  'black-jack':{
    name:'Black Jack',category:'boxer',label:'BOXER STANDARD',
    image:'assets/products/black-jack-main.webp',
    desc:'A Boxer Standard model with distinctive Black Jack artwork, built for reliable commercial operation in high-traffic entertainment venues.',
    features:['Immersive strength gameplay','Commercial-grade construction','Multiple payment configurations','Adjustable difficulty and free play'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','121 kg']],
    options:['Bill acceptor','Card reader / cashless payment','Protective cover','Custom sticker and branding','LED lighting variation'],
    variants:[
      {name:'Red',image:'assets/products/black-jack-red.webp'},
      {name:'Black',image:'assets/products/black-jack-black.webp'},
      {name:'Yellow',image:'assets/products/black-jack-yellow.webp'},
      {name:'Blue',image:'assets/products/black-jack-blue.webp'},
      {name:'Orange',image:'assets/products/black-jack-orange.webp'}
    ]
  },
  'poison-squad':{
    name:'Poison Squad',category:'boxer',label:'BOXER STANDARD',
    image:'assets/products/poison-squad-main.webp',
    desc:'A Boxer Standard model with distinctive Poison Squad artwork, built for reliable commercial operation in high-traffic entertainment venues.',
    features:['Immersive strength gameplay','Commercial-grade construction','Multiple payment configurations','Adjustable difficulty and free play'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','121 kg']],
    options:['Bill acceptor','Card reader / cashless payment','Protective cover','Custom sticker and branding','LED lighting variation'],
    variants:[
      {name:'Red',image:'assets/products/poison-squad-green.webp'},
      {name:'White',image:'assets/products/poison-squad-white.webp'},
      {name:'Yellow',image:'assets/products/poison-squad-yellow.webp'},
      {name:'Blue',image:'assets/products/poison-squad-blue.webp'},
      {name:'Orange',image:'assets/products/poison-squad-green-2.webp'}
    ]
  },
  'cyber-punch':{
    name:'Cyber Punch',category:'boxer',label:'BOXER STANDARD',
    image:'assets/products/cyber-punch-main.webp',
    desc:'A Boxer Standard model with distinctive Cyber Punch artwork, built for reliable commercial operation in high-traffic entertainment venues.',
    features:['Immersive strength gameplay','Commercial-grade construction','Multiple payment configurations','Adjustable difficulty and free play'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','121 kg']],
    options:['Bill acceptor','Card reader / cashless payment','Protective cover','Custom sticker and branding','LED lighting variation'],
    variants:[
      {name:'Red',image:'assets/products/cyber-punch-red.webp'},
      {name:'Black',image:'assets/products/cyber-punch-black.webp'},
      {name:'Yellow',image:'assets/products/cyber-punch-yellow.webp'},
      {name:'Blue',image:'assets/products/cyber-punch-blue.webp'},
      {name:'White',image:'assets/products/cyber-punch-white.webp'}
    ]
  },
  'strongman':{
    name:'Strongman',category:'boxer',label:'BOXER STANDARD',
    image:'assets/products/strongman-main.webp',
    desc:'A Boxer Standard model with distinctive Strongman artwork, built for reliable commercial operation in high-traffic entertainment venues.',
    features:['Immersive strength gameplay','Commercial-grade construction','Multiple payment configurations','Adjustable difficulty and free play'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','121 kg']],
    options:['Bill acceptor','Card reader / cashless payment','Protective cover','Custom sticker and branding','LED lighting variation'],
    variants:[
      {name:'Yellow',image:'assets/products/strongman-yellow.webp'},
      {name:'White',image:'assets/products/strongman-white.webp'},
      {name:'Red',image:'assets/products/strongman-red.webp'},
      {name:'Blue',image:'assets/products/strongman-blue.webp'}
    ]
  },
  'viking':{
    name:'Viking',category:'boxer',label:'BOXER STANDARD',
    image:'assets/products/viking-main.webp',
    desc:'A Boxer Standard model with distinctive Viking artwork, built for reliable commercial operation in high-traffic entertainment venues.',
    features:['Immersive strength gameplay','Commercial-grade construction','Multiple payment configurations','Adjustable difficulty and free play'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','121 kg']],
    options:['Bill acceptor','Card reader / cashless payment','Protective cover','Custom sticker and branding','LED lighting variation'],
    variants:[
      {name:'Red',image:'assets/products/viking-red.webp'},
      {name:'White',image:'assets/products/viking-white.webp'},
      {name:'Yellow',image:'assets/products/viking-yellow.webp'},
      {name:'Blue',image:'assets/products/viking-blue.webp'}
    ]
  },
  'joker':{
    name:'Joker',category:'boxer',label:'BOXER STANDARD',
    image:wix('d36c49_5611ac7e3f864c13a4fc189bbd16b810~mv2.jpg'),
    desc:'A Boxer Standard model with distinctive Joker artwork, built for reliable commercial operation in high-traffic entertainment venues.',
    features:['Immersive strength gameplay','Commercial-grade construction','Multiple payment configurations','Adjustable difficulty and free play'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','121 kg']],
    options:['Bill acceptor','Card reader / cashless payment','Protective cover','Custom sticker and branding','LED lighting variation'],
    variants:[{name:'Black',image:wix('d36c49_5611ac7e3f864c13a4fc189bbd16b810~mv2.jpg')},{name:'Red',image:wix('d36c49_b446eee2ad3c40a19cc015b9d212936b~mv2.jpg')},{name:'White',image:wix('d36c49_dfdd05769c894908abaa303b62c4e615~mv2.jpg')},{name:'Yellow',image:wix('d36c49_964547d9712c478da4c35562208f33bc~mv2.jpg')},{name:'Blue',image:wix('d36c49_e952f0525a564a9d9a128be1a31f9e4d~mv2.jpg')},{name:'Orange',image:wix('d36c49_491d31ec388b407dab501b05d40cf85c~mv2.jpg')},{name:'Green',image:wix('d36c49_0d7ca67d0a40419891abb0cc307ef33e~mv2.jpg')}]
  },
  'super-hero':{
    name:'Super Hero',category:'boxer',label:'BOXER STANDARD',
    image:wix('d36c49_8632a38032df400d874177a182b19cf8~mv2.jpg'),
    desc:'A Boxer Standard model with distinctive Super Hero artwork, built for reliable commercial operation in high-traffic entertainment venues.',
    features:['Immersive strength gameplay','Commercial-grade construction','Multiple payment configurations','Adjustable difficulty and free play'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','121 kg']],
    options:['Bill acceptor','Card reader / cashless payment','Protective cover','Custom sticker and branding','LED lighting variation'],
    variants:[{name:'Red',image:wix('d36c49_8632a38032df400d874177a182b19cf8~mv2.jpg')},{name:'Black',image:wix('d36c49_dbf9fe6f5e134856aa0e926865377929~mv2.jpg')},{name:'White',image:wix('d36c49_49d2acbca85d4dada9a014724a5a18ed~mv2.jpg')},{name:'Yellow',image:wix('d36c49_4461db12062a412fbcbe7937c308defa~mv2.jpg')},{name:'Blue',image:wix('d36c49_c0aca74f621b460088cc4f7726714fc1~mv2.jpg')},{name:'Orange',image:wix('d36c49_7b2af41008de4cbcb0f1ec206f1311a3~mv2.jpg')},{name:'Green',image:wix('d36c49_0aa21d5c8ece4a329898f95f73578e19~mv2.jpg')}]
  },
  'disco':{
    name:'Disco',category:'boxer',label:'BOXER STANDARD',
    image:wix('d36c49_50ea9ec71a3d48e6b78fbcd9e6efcc59~mv2.jpg'),
    desc:'A Boxer Standard model with distinctive Disco artwork, built for reliable commercial operation in high-traffic entertainment venues.',
    features:['Immersive strength gameplay','Commercial-grade construction','Multiple payment configurations','Adjustable difficulty and free play'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','121 kg']],
    options:['Bill acceptor','Card reader / cashless payment','Protective cover','Custom sticker and branding','LED lighting variation'],
    variants:[{name:'Red',image:wix('d36c49_50ea9ec71a3d48e6b78fbcd9e6efcc59~mv2.jpg')},{name:'Black',image:wix('d36c49_3ce3bc5e2b6b42f49d45dd931a880b15~mv2.jpg')},{name:'Yellow',image:wix('d36c49_a0665fd53d2e4cfabb182f578ff00f36~mv2.jpg')},{name:'Blue',image:wix('d36c49_6700443d44c940568ee12ea04b9da98c~mv2.jpg')},{name:'White',image:wix('d36c49_229535bd812e48e19016cc825c38e06e~mv2.jpg')},{name:'Orange',image:wix('d36c49_a13f9b2fff6f4f5fbbf4071253127e16~mv2.jpg')}]
  },
  'pow-boxer':{
    name:'POW Boxer',category:'boxer',label:'BOXER STANDARD',
    image:wix('d36c49_6cecc2a52bae4458a0a3816b5f3088bd~mv2.jpg'),
    desc:'A Boxer Standard model with distinctive POW artwork, built for reliable commercial operation in high-traffic entertainment venues.',
    features:['Immersive strength gameplay','Commercial-grade construction','Multiple payment configurations','Adjustable difficulty and free play'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','121 kg']],
    options:['Bill acceptor','Card reader / cashless payment','Protective cover','Custom sticker and branding','LED lighting variation']
  },
  'boxer-flash':{
    name:'Boxer Flash',category:'boxer',label:'BOXER PREMIUM',
    image:wix('d36c49_082568a7673a4348b86ff39dbae04067~mv2.jpg'),
    desc:'A premium boxer with bright LED lighting and a modern visual design. Boxer Flash is intended for arcades, sports bars and entertainment centres where strong visibility matters.',
    features:['High-visibility LED lighting','Adjustable difficulty','Free-play mode','Flexible payment configuration'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','121 kg']],
    options:['Bill acceptor','Card reader / cashless payment','Protective cover','Custom sticker and branding'],
    variants:[
      {name:'Red',image:'assets/products/boxer-flash-red.webp'},
      {name:'Black',image:'assets/products/boxer-flash-black.webp'},
      {name:'Yellow',image:'assets/products/boxer-flash-yellow.webp'},
      {name:'Blue',image:'assets/products/boxer-flash-blue.webp'},
      {name:'White',image:'assets/products/boxer-flash-white.webp'}
    ]
  },
  'boxer-flash-gift':{
    name:'Boxer Flash Gift',category:'boxer',label:'BOXER PREMIUM / GIFT',
    image:wix('d36c49_1b5a7bd5dec9447b921b80f57a0e13ae~mv2.jpg'),
    desc:'Boxer Flash with an added gift / prize mechanic. Players punch for a high score and can be rewarded with prizes, combining strength gameplay with a stronger redemption-style attraction.',
    features:['Strength challenge with prize functionality','Bright LED lighting','Adjustable difficulty','Free-play mode'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','140 kg']],
    options:['Bill acceptor','Nayax cashless payment','Ticket dispenser','Custom sticker and branding','Silent mode'],
    variants:makeVariants(['d36c49_1b5a7bd5dec9447b921b80f57a0e13ae~mv2.jpg','d36c49_fa66a189137141aebbb22389942df45f~mv2.jpg','d36c49_7a50a1705283411c9ee69293c5e258e3~mv2.jpg','d36c49_258c9fef06c64c189855e8a5e3c52898~mv2.jpg','d36c49_eff96957a7914595b3182f0d8ae6436a~mv2.jpg'],['Red','Black','Yellow','Blue','White'])
  },
  'boxer-ring':{
    name:'Boxer Ring',category:'boxer',label:'BOXER PREMIUM',
    image:wix('d36c49_2b04783014544dbf92e39e725e3881e2~mv2.jpg'),
    desc:'A premium boxing machine with a distinctive Ring cabinet shape and strong visual presence. Built for commercial use with adjustable play settings and flexible payment options.',
    features:['Immersive strength gameplay','Commercial-grade construction','Multiple payment configurations','Adjustable difficulty and free play'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','127 kg']],
    options:['Bill acceptor','Nayax cashless payment','Ticket dispenser','Protective cover','Custom sticker and branding'],
    variants:makeVariants(['d36c49_2b04783014544dbf92e39e725e3881e2~mv2.jpg','d36c49_723aed8e93204089b71de4a1fc06ffe5~mv2.jpg','d36c49_d8111cc412a642c38b0fd4b8b0200c33~mv2.jpg','d36c49_dc1a2938c5124466bc9a71f579530026~mv2.jpg','d36c49_c4fd1d01bd0e4d7ab832ad8fa3899805~mv2.jpg'],['Red','Black','Blue','White','Yellow'])
  },
  'boxer-combat':{
    name:'Boxer Combat',category:'boxer',label:'BOXER PREMIUM',
    image:wix('d36c49_6282f2a1ba5b4286be6282f1f2a3ebcb~mv2.jpg'),
    desc:'A premium commercial boxer with bold Combat artwork, LED lighting and operator-focused configuration. Designed for repeat play in high-traffic venues.',
    features:['Commercial-grade construction','LED lighting','Adjustable difficulty','Cash and cashless payment configuration'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','121 kg']],
    options:['Bill acceptor','Nayax cashless payment','Ticket dispenser','Custom sticker and branding','Silent mode'],
    variants:makeVariants(['d36c49_6282f2a1ba5b4286be6282f1f2a3ebcb~mv2.jpg','d36c49_22f24ca2aa154352a285a8644b6bb510~mv2.jpg','d36c49_901c5c7793f948f484450ca830abd03f~mv2.jpg','d36c49_8354cc65d5f14fcb982909f3f3ff0315~mv2.jpg','d36c49_4ca4b6f113024dacb9414a78c7dea9b2~mv2.jpg'],['Orange','Red','Yellow','Blue','White'])
  },
  'boxer-fist':{
    name:'Boxer Fist',category:'boxer',label:'BOXER MULTIPLAYER',tag:'NEW 2025',
    image:wix('d36c49_08b14c21b6e94f6699d7d27a332005c7~mv2.jpg'),
    desc:'A multiplayer boxing arcade machine designed for group challenges and head-to-head competition. Full LED integration and a reinforced commercial cabinet make it suitable for busy entertainment locations.',
    features:['Multiplayer-ready gameplay','Full LED integration','Heavy-duty commercial frame','Operator-friendly service access'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','121 kg']],
    options:['Bill acceptor','Card reader / cashless payment','Protective cover','Custom sticker and branding'],
    variants:makeVariants(['d36c49_08b14c21b6e94f6699d7d27a332005c7~mv2.jpg','d36c49_42c30a9a3d03436491ae1a4b140d6c22~mv2.jpg','d36c49_7fcc4c1eccb9482fa199de11f831aa93~mv2.jpg','d36c49_83436840037d4442a0452f7d7d812e3b~mv2.jpg','d36c49_18fe051df5d44db287a8477705475d9a~mv2.jpg'],['Black','White','Green','Blue','Orange'])
  },
  'boxer-matte-airbrush':{
    name:'Boxer Matte Airbrush',category:'boxer',label:'MATTE AIRBRUSH',tag:'NEW 2025',
    image:wix('d36c49_fb9904ebbd3b48c78b4e7981a992da60~mv2.jpg'),
    desc:'A matte-finish boxer with custom airbrush styling. It combines the familiar Pro Games boxing format with a more individual, premium visual finish.',
    features:['Matte airbrush finish','Commercial-grade construction','Adjustable difficulty','Free-play mode'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','121 kg']],
    options:['Bill acceptor','Card reader / cashless payment','Protective cover','Custom branding']
  },
  'combat-matte-airbrush':{
    name:'Combat Matte Airbrush',category:'boxer',label:'MATTE AIRBRUSH',tag:'NEW 2025',
    image:wix('d36c49_8034b961b31c47f2bd7c3a534c5cc8e3~mv2.jpg'),
    desc:'A matte airbrushed version of the Combat boxer, pairing commercial Pro Games hardware with a more exclusive custom-finish cabinet.',
    features:['Matte airbrush finish','LED lighting','Adjustable difficulty','Free-play mode'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','121 kg']],
    options:['Bill acceptor','Card reader / cashless payment','Protective cover','Custom branding']
  },
  'double-hit':{
    name:'Double Hit',category:'combo',label:'COMBO MACHINE',
    image:wix('d36c49_338c0feaec2046e998aa61a62dac23e7~mv2.jpg'),
    desc:'Two challenges in one compact machine: punch the boxing bag or kick the football. Double Hit combines LED lighting, commercial durability and operator settings in one cabinet.',
    features:['Boxing and kicking in one machine','LED lighting','Adjustable difficulty','Free-play mode'],
    spec:[['Height','219 cm'],['Width','85 cm'],['Length','122 cm'],['Weight','175 kg']],
    options:['Bill acceptor','Nayax cashless payment','Ticket dispenser','Custom sticker and branding','Silent mode'],
    variants:makeVariants(['d36c49_338c0feaec2046e998aa61a62dac23e7~mv2.jpg','d36c49_753f3da69f204a27befeaa9c2357be8a~mv2.jpg','d36c49_e4eeef964453407db8c3d177cd8885eb~mv2.jpg','d36c49_dbb917eefcfc4fc7826b4cdf9ff6ee97~mv2.jpg','d36c49_259b178e80664fb59165fce8ce3d56a0~mv2.jpg'],['Orange','Red','Yellow','Blue','White'])
  },
  'double-hit-gift':{
    name:'Double Hit Gift',category:'combo',label:'COMBO / GIFT',
    image:wix('d36c49_50ed6391ec3a4358a07dbc092be34e08~mv2.jpg'),
    desc:'A three-action entertainment machine combining boxing, kicking and a prize feature. LED lighting and operator configuration make it a strong attraction for family and arcade venues.',
    features:['Boxing, kicking and prize functionality','Bright LED lighting','Adjustable difficulty','Free-play mode'],
    spec:[['Height','219 cm'],['Width','85 cm'],['Length','122 cm'],['Weight','190 kg']],
    options:['Bill acceptor','Nayax cashless payment','Ticket dispenser','Custom sticker and branding','Silent mode'],
    variants:makeVariants(['d36c49_50ed6391ec3a4358a07dbc092be34e08~mv2.jpg','d36c49_88e6ccc745e54081a0e66bf6c895ceef~mv2.jpg','d36c49_f449c8e887144f15b48bca8aaf7834d2~mv2.jpg','d36c49_f234704039194aa197eae9dc1587ab43~mv2.jpg','d36c49_146b6575c7e846aa84b8c2819111cc8d~mv2.jpg'],['Red','Black','Yellow','Blue','White'])
  },
  'double-strike':{
    name:'Double Strike',category:'combo',label:'COMBO MACHINE',
    image:wix('d36c49_0eeb916b0aa74377be5592607d75377e~mv2.jpeg'),
    desc:'A combined boxing and kicking machine with a strong visual presence and commercial operating modes. Designed for arcades and entertainment venues where two strength challenges in one cabinet add variety.',
    features:['Boxing and kicking challenges','LED lighting','Adjustable difficulty','Commercial operator configuration'],
    spec:[['Height','219 cm'],['Width','142 cm'],['Length','122 cm'],['Weight','170 kg']],
    options:['Bill acceptor','Nayax cashless payment','Ticket dispenser','Custom sticker and branding','Silent mode'],
    variants:makeVariants(['d36c49_0eeb916b0aa74377be5592607d75377e~mv2.jpeg','d36c49_34cef7cbcb0446a8a597a64acb068451~mv2.jpeg','d36c49_af20043d8307453a9db1d73b4fa27533~mv2.jpeg','d36c49_3e8aff8b9cfd4ea99957922b99e48b8b~mv2.jpeg','d36c49_3c0674be98e541f3b209c24e484dc98a~mv2.jpeg'],['Orange','Red','Black','Blue','White'])
  },
  'boxer-kids-gift':{
    name:'Boxer Kids Gift',category:'kids',label:'KIDS / GIFT',
    image:'assets/products/boxer-kids-gift-clean.webp',
    desc:'A child-friendly boxer with a prize feature, bright graphics and a smaller cabinet format designed for family entertainment locations.',
    features:['Child-friendly cabinet format','Prize functionality','Bright LED lighting','Adjustable play settings'],
    spec:[['Height','186 cm'],['Width','70 cm'],['Length','115 cm'],['Weight','120 kg']],
    options:['Bill acceptor','Nayax cashless payment','Ticket dispenser','Custom sticker and branding','Silent mode'],
    variants:[
      {name:'Orange',image:'assets/products/boxer-kids-gift-orange.webp'},
      {name:'Black',image:'assets/products/boxer-kids-gift-black.webp'},
      {name:'Yellow',image:'assets/products/boxer-kids-gift-yellow.webp'},
      {name:'Blue',image:'assets/products/boxer-kids-gift-blue.webp'},
      {name:'White',image:'assets/products/boxer-kids-gift-white.webp'}
    ]
  },
  'combat-kids':{
    name:'Boxer Combat Kids',category:'kids',label:'KIDS BOXER',
    image:wix('d36c49_fbeb20a103aa42b5b345d720aad3b43f~mv2.jpg'),
    desc:'A compact Kids Combat boxer designed for younger players, with colourful artwork, LED lighting and adjustable play modes for family-oriented venues.',
    features:['Kid-friendly design','Safe and engaging gameplay','Flexible payment options','Adjustable play mode'],
    spec:[['Height','182 cm'],['Width','70 cm'],['Length','115 cm'],['Weight','120 kg']],
    options:['Bill acceptor','Nayax cashless payment','Ticket dispenser','Custom sticker and branding','Silent mode'],
    variants:makeVariants(['d36c49_fbeb20a103aa42b5b345d720aad3b43f~mv2.jpg','d36c49_b790e6faa3cc42b28f93bc578a0f270c~mv2.jpg','d36c49_fb94a0a9e52a4558809f8845ac00cd0e~mv2.jpg','d36c49_1824eafb06d14abab4a7226c74d11e0b~mv2.jpg','d36c49_f3383beeaf7646049ece85b6a83dd6c2~mv2.jpg'],['Red','Black','Yellow','Blue','White'])
  },
  'boxer-kids':{
    name:'Boxer Kids',category:'kids',label:'KIDS BOXER',
    image:wix('d36c49_300367abd71c42bbad49b4f4cf1d5428~mv2.jpg'),
    desc:'A boxer designed specifically for younger players, with a smaller format, bright artwork and adjustable play settings for family entertainment locations.',
    features:['Kid-friendly size and layout','Flexible payment options','Adjustable play mode','Free-play configuration'],
    spec:[['Height','182 cm'],['Width','70 cm'],['Length','115 cm'],['Weight','100 kg']],
    options:['Bill acceptor','Nayax cashless payment','Ticket dispenser','Custom sticker and branding','Silent mode'],
    variants:makeVariants(['d36c49_300367abd71c42bbad49b4f4cf1d5428~mv2.jpg','d36c49_2d0fa67b34e44a299250fd8daa5614ea~mv2.jpg','d36c49_5c3690fb87bc46ada411be7b2234c1bd~mv2.jpg','d36c49_ac9df6857b07407dbfe71dd0e303b3a0~mv2.jpg','d36c49_2551186fc1e140a1afbd3f55073cf506~mv2.jpg'],['Blue','Red','Yellow','White','Green'])
  },
  'double-hit-kids':{
    name:'Double Hit Kids',category:'kids',label:'KIDS COMBO',
    image:wix('d36c49_90652a5c1dce4cf4a1bedc35fab12696~mv2.jpg'),
    desc:'A child-friendly 2-in-1 machine combining boxing and kicking in one compact cabinet. Bright LEDs and adjustable play settings make it suitable for family venues.',
    features:['2-in-1 boxing and kicking gameplay','Kid-friendly design','Bright LED lighting','Adjustable play mode'],
    spec:[['Height','186 cm'],['Width','85 cm'],['Length','120 cm'],['Weight','175 kg']],
    options:['Bill acceptor','Nayax cashless payment','Ticket dispenser','Custom sticker and branding','Silent mode'],
    variants:makeVariants(['d36c49_90652a5c1dce4cf4a1bedc35fab12696~mv2.jpg','d36c49_fb72e48ad6404c379f65671ba03854c1~mv2.jpg','d36c49_d07f480621054a18b6e131227dd3e436~mv2.jpg','d36c49_13503ca78b334b819fb9b1cb74de4807~mv2.jpg','d36c49_0419edab2547485083c8a969f3d5d0c1~mv2.jpg'],['Orange','Red','Yellow','Blue','Black'])
  },
  'double-hit-kids-gift':{
    name:'Double Hit Kids Gift',category:'kids',label:'KIDS COMBO / GIFT',
    image:wix('d36c49_69c61593a9a243a58b82f59499fa7ff7~mv2.jpg'),
    desc:'A child-friendly 3-in-1 attraction combining boxing, kicking and a prize reward option. Designed for younger players with colourful LEDs and simple, engaging gameplay.',
    features:['Boxing, kicking and prize functionality','Kid-friendly design','Bright LED lighting','Adjustable play mode'],
    spec:[['Height','182 cm'],['Width','85 cm'],['Length','120 cm'],['Weight','180 kg']],
    options:['Bill acceptor','Nayax cashless payment','Ticket dispenser','Custom sticker and branding','Silent mode'],
    variants:makeVariants(['d36c49_69c61593a9a243a58b82f59499fa7ff7~mv2.jpg','d36c49_2d8f1e66766741bb9baaa4db1d244914~mv2.jpg','d36c49_0f8b83f56b444c6fb58251f23697d899~mv2.jpg','d36c49_ac6fcddc490247fcac0fb6911daa2da3~mv2.jpg','d36c49_82fcd9f00cf547809f0f1e9a10fe28ea~mv2.jpg'],['Orange','Red','Black','Blue','White'])
  },
  'kicker':{
    name:'Kicker',category:'strength',label:'KICKER',
    image:wix('d36c49_2fe123c3c3a74277842af12504d08f47~mv2.jpg'),
    desc:'A strength and accuracy machine built around a football kick challenge. Kicker is suited to arcades, sports bars and family entertainment centres, with adjustable difficulty and payment configuration.',
    features:['Kick strength challenge','Adjustable difficulty and free play','Flexible payment options','Commercial cabinet construction'],
    spec:[['Height','170 cm'],['Width','133 cm'],['Length','66 cm'],['Weight','100 kg']],
    options:['Bill acceptor','Card reader / cashless payment','Protective cover','Custom sticker and branding'],
    variants:makeVariants(['d36c49_2fe123c3c3a74277842af12504d08f47~mv2.jpg','d36c49_c44c1aee2d7a439cb83ab840bcc8030d~mv2.jpg','d36c49_d3572c2031064190bae8986aa690d99e~mv2.jpg','d36c49_43bb55c00ff6450aa3daf3aa21fab3e0~mv2.jpg','d36c49_2b1753c161b04fc28e8dfb73fe0b029a~mv2.jpg'],['Orange','Red','Yellow','Black','White'])
  },
  'hammer':{
    name:'Hammer',category:'strength',label:'HAMMER',
    image:wix('d36c49_afafeaaf41674a4c88c922aeee800230~mv2.jpg'),
    desc:'A classic strength-test hammer game in a modern illuminated cabinet. Designed for amusement parks, arcades and family entertainment centres.',
    features:['Power strike strength challenge','Bright LED lighting','Ticket-ready configuration','Adjustable difficulty and free play'],
    spec:[['Height','225 cm'],['Width','95 cm'],['Length','140 cm'],['Weight','125 kg']],
    options:['Bill acceptor','Card reader / cashless payment','Protective cover','Custom sticker and branding'],
    variants:makeVariants(['d36c49_afafeaaf41674a4c88c922aeee800230~mv2.jpg','d36c49_ac7eaef74298496aad818f988bd23f75~mv2.jpg','d36c49_9d42e4537f474adcab4a61b64d2f7fe8~mv2.jpg','d36c49_5dc33c7849ff4b339aaff07525d0b204~mv2.jpg','d36c49_4efd74c665204018afd2b0f34fcc463f~mv2.jpg'],['Red','Black','Yellow','Blue','White'])
  },
  'boxer-gift':{
    name:'Boxer Gift',category:'boxer',label:'BOXER / GIFT',
    image:wix('d36c49_64245c96fa354f81b1c1b0f5130cd14d~mv2.jpg'),
    desc:'A boxing strength machine with a gift / reward feature for operators who want to combine score-based play with an additional prize mechanic.',
    features:['Boxing strength challenge','Gift / reward functionality','LED lighting','Adjustable play settings'],
    spec:[['Height','219 cm'],['Width','72 cm'],['Length','115 cm'],['Weight','140 kg']],
    options:['Bill acceptor','Nayax cashless payment','Ticket dispenser','Custom sticker and branding','Silent mode'],
    variants:makeVariants(['d36c49_64245c96fa354f81b1c1b0f5130cd14d~mv2.jpg','d36c49_4df2d5e039194f468a3f2b3d3cab83b2~mv2.jpg','d36c49_11fdece776ca4e8dbe9beaf45c050bb8~mv2.jpg','d36c49_b35278bab1fa4872b1af15ec0d69a12f~mv2.jpg','d36c49_b0699ee5b18a4ef48d2ae9f4c98d0882~mv2.jpg'],['White','Orange','Yellow','Blue','Red'])
  }
};

window.PG_ES={
  colors:{White:'Blanco',Orange:'Naranja',Yellow:'Amarillo',Green:'Verde',Blue:'Azul',Red:'Rojo',Black:'Negro',Brown:'Marrón',Graphite:'Grafito','Alternate view':'Vista alternativa'},
  labels:{
    'EXCLUSIVE / 3-IN-1':'EXCLUSIVO / 3 EN 1','BOXER STANDARD':'BOXER STANDARD','BOXER PREMIUM':'BOXER PREMIUM','BOXER PREMIUM / GIFT':'BOXER PREMIUM / PREMIO','BOXER MULTIPLAYER':'BOXER MULTIJUGADOR','MATTE AIRBRUSH':'AEROGRAFÍA MATE','COMBO MACHINE':'MÁQUINA COMBO','COMBO / GIFT':'COMBO / PREMIO','KIDS / GIFT':'KIDS / PREMIO','KIDS BOXER':'BOXER INFANTIL','KIDS COMBO':'COMBO INFANTIL','KIDS COMBO / GIFT':'COMBO INFANTIL / PREMIO','KICKER':'KICKER','HAMMER':'HAMMER','BOXER / GIFT':'BOXER / PREMIO'
  }
};

window.PRODUCT_ES={
  'monster-3in1':{desc:'Una máquina de fuerza 3 en 1 que combina Boxer, Kicker y Hammer en un solo mueble. La iluminación LED, los sensores de puntuación y los tres modos de juego crean una atracción de alto impacto para locales de ocio.',features:['Boxer, Kicker y Hammer en una sola máquina','Iluminación LED y sensores de puntuación','Diseñada para uso comercial intensivo','Ajustes configurables y modo free play'],options:['Aceptador de billetes','Pago sin efectivo Nayax','Dispensador de tickets','Gráfica y branding personalizados','Modo silencioso']},
  'champion':{desc:'Boxer profesional para ubicaciones de alto tráfico. Champion combina electrónica y mecánica robustas con dificultad ajustable, modo free play y configuración flexible de pagos.',features:['Electrónica y mecánica de uso comercial','Dificultad ajustable','Modo free play','Múltiples opciones de pago'],options:['Aceptador de billetes','Lector de tarjetas / pago sin efectivo','Funda protectora','Gráfica y branding personalizados','Variantes de iluminación LED']},
  'gladiator':{desc:'Boxer de formato estándar con la gráfica Gladiator. Diseñado para un funcionamiento comercial fiable, juego repetido y opciones flexibles de pago.',features:['Diseñado para locales de alto tráfico','Dificultad ajustable','Modo free play','Configuración para billetes, monedas, tarjetas y fichas'],options:['Aceptador de billetes','Lector de tarjetas / pago sin efectivo','Funda protectora','Gráfica y branding personalizados','Variantes de iluminación LED']},
  'boxer-flash':{desc:'Boxer premium con iluminación LED intensa y diseño visual moderno. Boxer Flash está pensado para arcades, sports bars y centros de ocio donde la visibilidad es clave.',features:['Iluminación LED de alta visibilidad','Dificultad ajustable','Modo free play','Configuración flexible de pagos'],options:['Aceptador de billetes','Lector de tarjetas / pago sin efectivo','Funda protectora','Gráfica y branding personalizados']},
  'boxer-flash-gift':{desc:'Boxer Flash con función adicional de premio. Los jugadores golpean para conseguir una puntuación alta y pueden recibir premios, combinando fuerza y recompensa.',features:['Reto de fuerza con función de premio','Iluminación LED','Dificultad ajustable','Modo free play'],options:['Aceptador de billetes','Pago sin efectivo Nayax','Dispensador de tickets','Gráfica y branding personalizados','Modo silencioso']},
  'boxer-ring':{desc:'Boxer premium con la distintiva forma Ring y una fuerte presencia visual. Diseñado para uso comercial con ajustes de juego y pagos configurables.',features:['Juego de fuerza inmersivo','Construcción comercial','Múltiples configuraciones de pago','Dificultad ajustable y free play'],options:['Aceptador de billetes','Pago sin efectivo Nayax','Dispensador de tickets','Funda protectora','Gráfica y branding personalizados']},
  'boxer-combat':{desc:'Boxer premium con gráfica Combat, iluminación LED y configuración orientada al operador. Diseñado para juego repetido en locales de alto tráfico.',features:['Construcción de uso comercial','Iluminación LED','Dificultad ajustable','Configuración de pagos en efectivo y sin efectivo'],options:['Aceptador de billetes','Pago sin efectivo Nayax','Dispensador de tickets','Gráfica y branding personalizados','Modo silencioso']},
  'boxer-fist':{desc:'Máquina boxer multijugador diseñada para retos de grupo y competición cara a cara. La integración LED y el mueble reforzado la hacen adecuada para locales de ocio con mucho tráfico.',features:['Juego preparado para multijugador','Integración LED completa','Estructura comercial reforzada','Acceso sencillo para servicio'],options:['Aceptador de billetes','Lector de tarjetas / pago sin efectivo','Funda protectora','Gráfica y branding personalizados']},
  'boxer-matte-airbrush':{desc:'Boxer con acabado mate y aerografía personalizada. Combina el formato de boxeo Pro Games con un acabado visual más individual y premium.',features:['Acabado mate aerografiado','Construcción comercial','Dificultad ajustable','Modo free play'],options:['Aceptador de billetes','Lector de tarjetas / pago sin efectivo','Funda protectora','Branding personalizado']},
  'combat-matte-airbrush':{desc:'Versión Combat con acabado mate aerografiado, combinando hardware comercial Pro Games con un mueble de acabado más exclusivo.',features:['Acabado mate aerografiado','Iluminación LED','Dificultad ajustable','Modo free play'],options:['Aceptador de billetes','Lector de tarjetas / pago sin efectivo','Funda protectora','Branding personalizado']},
  'double-hit':{desc:'Dos retos en una sola máquina compacta: golpear el punchball o chutar el balón. Double Hit combina iluminación LED, durabilidad comercial y ajustes para operador.',features:['Boxeo y fútbol en una sola máquina','Iluminación LED','Dificultad ajustable','Modo free play'],options:['Aceptador de billetes','Pago sin efectivo Nayax','Dispensador de tickets','Gráfica y branding personalizados','Modo silencioso']},
  'double-hit-gift':{desc:'Máquina de entretenimiento con tres acciones: boxeo, fútbol y función de premio. La iluminación LED y la configuración de operador la convierten en una atracción potente para centros familiares y arcades.',features:['Boxeo, fútbol y función de premio','Iluminación LED','Dificultad ajustable','Modo free play'],options:['Aceptador de billetes','Pago sin efectivo Nayax','Dispensador de tickets','Gráfica y branding personalizados','Modo silencioso']},
  'double-strike':{desc:'Máquina combinada de boxeo y fútbol con fuerte presencia visual y modos comerciales. Diseñada para arcades y centros de ocio que buscan dos retos de fuerza en un solo mueble.',features:['Retos de boxeo y fútbol','Iluminación LED','Dificultad ajustable','Configuración comercial para operadores'],options:['Aceptador de billetes','Pago sin efectivo Nayax','Dispensador de tickets','Gráfica y branding personalizados','Modo silencioso']},
  'boxer-kids-gift':{desc:'Boxer infantil con función de premio, gráficos vivos y un formato de mueble más compacto para centros de entretenimiento familiar.',features:['Formato adaptado a niños','Función de premio','Iluminación LED','Ajustes de juego configurables'],options:['Aceptador de billetes','Pago sin efectivo Nayax','Dispensador de tickets','Gráfica y branding personalizados','Modo silencioso']},
  'combat-kids':{desc:'Boxer Combat Kids compacto para jugadores más jóvenes, con gráficos coloridos, iluminación LED y modos ajustables para espacios familiares.',features:['Diseño adaptado a niños','Juego seguro y atractivo','Opciones de pago flexibles','Modo de juego ajustable'],options:['Aceptador de billetes','Pago sin efectivo Nayax','Dispensador de tickets','Gráfica y branding personalizados','Modo silencioso']},
  'boxer-kids':{desc:'Boxer diseñado específicamente para jugadores más jóvenes, con un formato más pequeño, gráficos vivos y ajustes de juego para espacios familiares.',features:['Tamaño y diseño adaptados a niños','Opciones de pago flexibles','Modo de juego ajustable','Configuración free play'],options:['Aceptador de billetes','Pago sin efectivo Nayax','Dispensador de tickets','Gráfica y branding personalizados','Modo silencioso']},
  'double-hit-kids':{desc:'Máquina infantil 2 en 1 que combina boxeo y fútbol en un mueble compacto. Los LED y los ajustes configurables la hacen adecuada para espacios familiares.',features:['Boxeo y fútbol 2 en 1','Diseño adaptado a niños','Iluminación LED','Modo de juego ajustable'],options:['Aceptador de billetes','Pago sin efectivo Nayax','Dispensador de tickets','Gráfica y branding personalizados','Modo silencioso']},
  'double-hit-kids-gift':{desc:'Atracción infantil 3 en 1 con boxeo, fútbol y opción de premio. Diseñada para jugadores jóvenes con iluminación LED colorida y un manejo sencillo.',features:['Boxeo, fútbol y función de premio','Diseño adaptado a niños','Iluminación LED','Modo de juego ajustable'],options:['Aceptador de billetes','Pago sin efectivo Nayax','Dispensador de tickets','Gráfica y branding personalizados','Modo silencioso']},
  'kicker':{desc:'Máquina de fuerza y precisión basada en el reto de chutar un balón. Kicker está pensada para arcades, sports bars y centros de ocio familiar, con dificultad ajustable y pagos configurables.',features:['Reto de fuerza de chut','Dificultad ajustable y free play','Opciones de pago flexibles','Construcción de uso comercial'],options:['Aceptador de billetes','Lector de tarjetas / pago sin efectivo','Funda protectora','Gráfica y branding personalizados']},
  'hammer':{desc:'Juego clásico de fuerza con martillo en un mueble moderno e iluminado. Diseñado para parques de atracciones, arcades y centros de ocio familiar.',features:['Reto de fuerza con martillo','Iluminación LED','Configuración compatible con tickets','Dificultad ajustable y free play'],options:['Aceptador de billetes','Lector de tarjetas / pago sin efectivo','Funda protectora','Gráfica y branding personalizados']},
  'boxer-gift':{desc:'Máquina boxer con función de regalo / premio para operadores que quieren combinar puntuación de fuerza con una mecánica adicional de recompensa.',features:['Reto de fuerza de boxeo','Función de regalo / premio','Iluminación LED','Ajustes de juego configurables'],options:['Aceptador de billetes','Pago sin efectivo Nayax','Dispensador de tickets','Gráfica y branding personalizados','Modo silencioso']}
};
