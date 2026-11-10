function FlowerAnimation()
{
    var strokesLeftBottom = Array.from(document.querySelectorAll('#LeftBottomGroup_1_ path[id^=stroke]')).reverse();
    var strokesLeftTop = Array.from(document.querySelectorAll('#LeftTopGroup_1_ path[id^=stroke]')).reverse();
    var strokesRightBottom = Array.from(document.querySelectorAll('#RightBottomGroup_1_ path[id^=stroke]')).reverse();
    var strokesRightTop = Array.from(document.querySelectorAll('#RightTopGroup_1_ path[id^=stroke]')).reverse();
    
    var stemGroup1 = ['#Stem2_1_', '#Stem3_1_', '#Stem4_1_', '#Stem5a_1_', '#Stem5b_1_', '#Stem6_1_', '#Stem7a_1_', '#Stem7b_1_', '#Stem7c_1_', '#Stem8_1_'];
    var stemGroup2 = ['#Stem17_1_', '#Stem18_1_', '#Stem19_1_', '#Stem20a_1_', '#Stem20b_1_', '#Stem21_1_', '#Stem22a_1_', '#Stem22b_1_', '#Stem22c_1_', '#Stem23_1_'];
    var stemGroup3 = ['#Stem10_1_', '#Stem11_1_', '#Stem12a_1_', '#Stem12b_1_'];
    var stemGroup4 = ['#Stem26_1_', '#Stem27_1_', '#Stem28a_1_', '#Stem28b_1_'];
    var stemGroup5 = ['#Stem13a_1_', '#Stem13b_1_', '#Stem13c_1_'];
    var stemGroup6 = ['#Stem29a_1_', '#Stem29b_1_', '#Stem29c_1_'];
    var stemVarsFrom = { drawSVG: "0% 0%", autoAlpha: 1 };
    var stemVarsTo = { drawSVG: "0% 100%" };
    
    var leafGroup1 = ['#Leaf2_1_', '#Leaf17_1_'];
    var leafGroup2 = ['#Leaf4_1_', '#Leaf5a_1_', '#Leaf5b_1_'];
    var leafGroup3 = ['#Leaf19_1_', '#Leaf20a_1_', '#Leaf20b_1_'];
    var leafGroup4 = ['#Leaf11_1_', '#Leaf12a_1_', '#Leaf12b_1_'];
    var leafGroup5 = ['#Leaf27_1_', '#Leaf28a_1_', '#Leaf28b_1_'];
    var leafGroup6 = ['#Leaf13a_1_', '#Leaf13b_1_', '#Leaf13c_1_'];
    var leafGroup7 = ['#Leaf29a_1_', '#Leaf29b_1_', '#Leaf29c_1_'];
    
    var budGroup1 = ['#bud-3-1', '#bud-6-1'];
    var budGroup2 = ['#bud-18-1', '#bud-21-1'];
    var budGroup3 = ['#bud-7a-1', '#bud-7b-1', '#bud-7c-1', '#bud-8-1'];
    var budGroup4 = ['#bud-22a-1', '#bud-22b-1', '#bud-22c-1', '#bud-23-1'];
    var budGroup5 = ['#bud-10-1', '#bud-26-1'];
    
    var dots = document.querySelector('#dots-1');
    
    var tl = new TimelineMax();
    
    tl
    .set('#footer-group-1', {autoAlpha: 1})
    .fromTo(['#Stem16_1_', '#Stem1_1_'], 1.5, { drawSVG: "0% 0%" }, { drawSVG: "0% 100%" }, 'start')
    .fromTo('#base-group-16-1 path', 1, {autoAlpha: 1, scale: 0, transformOrigin: '-10% 130%'}, {scale:1}, 1.2, 'flower1')
    .fromTo('#pink-flower-group-16-1', 2, {autoAlpha: 1, scale: 0, transformOrigin: '35% 110%'}, {scale:1}, 'flower1-=0.55')
    .fromTo('#base-group-1-1 path', 1, {autoAlpha: 1, scale: 0, transformOrigin: '90% 130%'}, {scale:1}, 1.2, 'flower1')
    .fromTo('#pink-flower-group-1-1', 2, {autoAlpha: 1, scale: 0, transformOrigin: '65% 110%'}, {scale:1}, 'flower1-=0.55')
    .fromTo(['#Stem9_1_', '#Stem25_1_'], 2, { drawSVG: "0% 0%",  autoAlpha: 1 }, { drawSVG: "0% 100%" }, 'flower1+=0.5')
    .fromTo('#base-group-9-1 path', 1, {autoAlpha: 1, scale: 0, transformOrigin: '-10% 130%'}, {scale:1}, 'flower2-=0.5')
    .fromTo('#pink-flower-group-9-1', 2, {autoAlpha: 1, scale: 0, transformOrigin: '5% 110%'}, {scale:1}, 'flower2')
    .fromTo('#base-group-25-1 path', 1, {autoAlpha: 1, scale: 0, transformOrigin: '105% 130%'}, {scale:1}, 'flower2-=0.5')
    .fromTo('#pink-flower-group-25-1', 2, {autoAlpha: 1, scale: 0, transformOrigin: '95% 110%'}, {scale:1}, 'flower2')
    
    //stems
    .staggerFromTo(stemGroup1, 2, stemVarsFrom, stemVarsTo, 0.5, 'start+=0.1')
    .staggerFromTo(stemGroup2, 2, stemVarsFrom, stemVarsTo, 0.5, 'start+=0.1')
    .staggerFromTo(stemGroup3, 2, stemVarsFrom, stemVarsTo, 0.5, 'flower2-=1.5')
    .staggerFromTo(stemGroup4, 2, stemVarsFrom, stemVarsTo, 0.5, 'flower2-=1.5')
    .staggerFromTo(stemGroup5, 2, stemVarsFrom, stemVarsTo, 0.5, 'flower3-=1')
    .staggerFromTo(stemGroup6, 2, stemVarsFrom, stemVarsTo, 0.5, 'flower3-=1')
    
    //leaves
    .staggerFromTo(leafGroup1, 2, {autoAlpha: 1, scale: 0, cycle: { transformOrigin: ["80% 45%", "20% 45%"]} }, {scale:1}, 0, 'flower1-=1')
    .staggerFromTo(leafGroup2, 2, {autoAlpha: 1, scale: 0, cycle: { transformOrigin: ["80% 25%", "60% 35%", "70% 75%"]} }, {scale:1}, 0.5, 'flower1')
    .staggerFromTo(leafGroup3, 2, {autoAlpha: 1, scale: 0, cycle: { transformOrigin: ["20% 25%", "40% 35%", "30% 75%"]} }, {scale:1}, 0.5, 'flower1')
    .staggerFromTo(leafGroup4, 2, {autoAlpha: 1, scale: 0, cycle: { transformOrigin: ["90% 70%", "100% 100%", "0% 90%"]} }, {scale:1}, 0.5, 'flower2')
    .staggerFromTo(leafGroup5, 2, {autoAlpha: 1, scale: 0, cycle: { transformOrigin: ["10% 70%", "0% 100%", "100% 90%"]} }, {scale:1}, 0.5, 'flower2')
    .staggerFromTo(leafGroup6, 2, {autoAlpha: 1, scale: 0, cycle: { transformOrigin: ["0% 90%", "10% 50%", "70% 60%"]} }, {scale:1}, 0.5, 'flower3')
    .staggerFromTo(leafGroup7, 2, {autoAlpha: 1, scale: 0, cycle: { transformOrigin: ["100% 90%", "90% 50%", "30% 60%"]} }, {scale:1}, 0.5, 'flower3')
    
    //buds
    .staggerFromTo(budGroup1, 2, {autoAlpha: 1, scale: 0, cycle: {transformOrigin: ['220% -10%', '55% 100%']} }, {scale:1}, 2.75, 'flower1-=0.75')
    .staggerFromTo(budGroup2, 2, {autoAlpha: 1, scale: 0, cycle: {transformOrigin: ['-120% -10%', '45% 100%']} }, {scale:1}, 2.75, 'flower1-=0.75')
    .staggerFromTo(budGroup3, 2, {autoAlpha: 1, scale: 0, cycle: {transformOrigin: ['10% 110%', '0% 100%', '0% 100%', '80% 100%']} }, {scale:1}, 0.5, 'flower2')
    .staggerFromTo(budGroup4, 2, {autoAlpha: 1, scale: 0, cycle: {transformOrigin: ['90% 110%', '100% 100%', '100% 100%', '20% 100%']} }, {scale:1}, 0.5, 'flower2')
    .staggerFromTo(budGroup5, 2, {autoAlpha: 1, scale: 0, cycle: {transformOrigin: ['-50% 120%', '150% 120%']} }, {scale:1}, 0, 'flower2-=0.5')
    
    //strokes
    .staggerFromTo(strokesLeftBottom, 2, stemVarsFrom, stemVarsTo, 1, 1)
    .staggerFromTo(strokesRightBottom, 2, stemVarsFrom, stemVarsTo, 1, 1)
    .staggerFromTo(strokesLeftTop, 2, stemVarsFrom, stemVarsTo, 1, 'flower1+=0.5')
    .staggerFromTo(strokesRightTop, 2, stemVarsFrom, stemVarsTo, 1, 'flower1+=0.5')
    
    //dots
    .fromTo(dots, 6, {autoAlpha: 0}, {autoAlpha: 1, ease: Expo.easeOut}, 'flower3+=1')
    .fromTo(dots, 5, {scale: 0, transformOrigin: '50% 50%' }, {scale: 1, ease: Expo.easeOut}, 'flower3');
    
}

