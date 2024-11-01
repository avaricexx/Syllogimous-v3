function createQuota() {
    let quota = Infinity;

    if (savedata.useNonsenseWords) {
        if (savedata.nonsenseWordLength % 2) quota = Math.min(quota, ((21 ** (Math.floor(savedata.nonsenseWordLength / 2) + 1)) * (5 ** Math.floor(savedata.nonsenseWordLength / 2))));
        else quota = Math.min(quota, (21 ** (savedata.nonsenseWordLength / 2)) * (5 ** (savedata.nonsenseWordLength / 2)));
    }
    if (savedata.useMeaningfulWords) {
        if (savedata.meaningfulWordNouns) quota = Math.min(quota, meaningfulWords.nouns.length);
        if (savedata.meaningfulWordAdjectives) quota = Math.min(quota, meaningfulWords.adjectives.length);
    }   
    if (savedata.useEmoji) quota = Math.min(quota, emoji.length);
    
    return quota;
}

function createStimuli(numberOfStimuli) {
    const quota = createQuota();
    
    const uniqueWords = {
        meaningful: {
            nouns: new Set(),
            adjectives: new Set()
        },
        nonsense: new Set()
    }
    const uniqueEmoji = new Set();

    const stimulusTypes = new Set();
    
    if (savedata.useNonsenseWords) stimulusTypes.add('nonsenseWords');
    if (savedata.useMeaningfulWords) stimulusTypes.add('meaningfulWords');
    if (savedata.useEmoji) stimulusTypes.add('emoji');
    if (!stimulusTypes.size) stimulusTypes.add(savedata.defaultStimulusType);

    const stimuliCreated = [];

    const partsOfSpeech = new Set();
    
    if (savedata.meaningfulWordNouns) partsOfSpeech.add('nouns');
    if (savedata.meaningfulWordAdjectives) partsOfSpeech.add('adjectives');
    if (!partsOfSpeech.size) partsOfSpeech.add(savedata.defaultPartOfSpeech);

    for (; numberOfStimuli > 0 && stimulusTypes.size; numberOfStimuli -= 1) {
        const randomStimulusType = Array.from(stimulusTypes)[Math.floor(Math.random() * stimulusTypes.size)];

        if (randomStimulusType == 'nonsenseWords') {      
            const vowels = ['A', 'E', 'I', 'O', 'U'], consonants = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];
            
            for (string = ''; string.length < savedata.nonsenseWordLength;) {
                if ((string.length + 1) % 2) string += consonants[Math.floor(Math.random() * 21)];
                else string += vowels[Math.floor(Math.random() * 5)];
        
                if (string.length == savedata.nonsenseWordLength) {
                    if (uniqueWords.nonsense.has(string)) string = '';
                    else {
                        stimuliCreated.push(string);
                        uniqueWords.nonsense.add(string);
                    }
                }
            }

            if (uniqueWords.nonsense.size >= quota) stimulusTypes.delete(randomStimulusType);     
        } else if (randomStimulusType == 'meaningfulWords') {
            const randomPartOfSpeech = Array.from(partsOfSpeech)[Math.floor(Math.random() * partsOfSpeech.size)]

            if (randomPartOfSpeech) {
                let randomMeaningfulWord;

                do {
                    if (uniqueWords.meaningful[randomPartOfSpeech].size >= meaningfulWords[randomPartOfSpeech].length) uniqueWords.meaningful[randomPartOfSpeech].nouns = new Set();
    
                    randomMeaningfulWord = meaningfulWords[randomPartOfSpeech][Math.floor(Math.random() * meaningfulWords[randomPartOfSpeech].length)];         
                } while (uniqueWords.meaningful[randomPartOfSpeech].has(randomMeaningfulWord));
    
                stimuliCreated.push(randomMeaningfulWord);
                uniqueWords.meaningful[randomPartOfSpeech].add(randomMeaningfulWord);
            } else stimulusTypes.delete(randomStimulusType);

            if (uniqueWords.meaningful[randomPartOfSpeech].size >= quota) partsOfSpeech.delete(randomPartOfSpeech);
        } else if (randomStimulusType == 'emoji') {
            let randomEmoji;

            do {
                if (uniqueEmoji.size >= emoji.length) uniqueEmoji = new Set();
                
                randomEmoji = emoji[Math.floor(Math.random() * emoji.length)];           
            } while (uniqueEmoji.has(randomEmoji));
            
            stimuliCreated.push(randomEmoji);
            uniqueEmoji.add(randomEmoji);
            
            if (uniqueEmoji.size >= quota) stimulusTypes.delete(randomStimulusType);
        } else break;
    }

    return stimuliCreated
}

function createSameDifferent(length) {

    // Create a pool based on user preferences
    const choiceIndices = [];

    if (savedata.enableDistinction)
        choiceIndices.push(0);
    if (savedata.enableComparison)
        choiceIndices.push(1);
    if (savedata.enableTemporal)
        choiceIndices.push(2);
    if (savedata.enableDirection)
        choiceIndices.push(3);
    if (savedata.enableDirection3D)
        choiceIndices.push(4);
    if (savedata.enableDirection4D)
        choiceIndices.push(5);

    const choiceIndex = pickRandomItems(choiceIndices, 1).picked[0];
    let choice;
    let conclusion = "";
    let subtype;
    let isValid, isValidSame;
    let a, b, c, d;
    let indexOfA, indexOfB, indexOfC, indexOfD;

    if (choiceIndex === 0) {

        choice = createSameOpposite(length);
        subtype = "Same/Opposite";

        // Pick 4 different items
        [a, b, c, d] = pickRandomItems([...choice.buckets[0], ...choice.buckets[1]], 4).picked;
        conclusion += `<span class="subject">${a}</span> to <span class="subject">${b}</span>`;

        // Find in which side a, b, c and d are
        [
            indexOfA,
            indexOfB,
            indexOfC,
            indexOfD
        ] = [
            Number(choice.buckets[0].indexOf(a) !== -1),
            Number(choice.buckets[0].indexOf(b) !== -1),
            Number(choice.buckets[0].indexOf(c) !== -1),
            Number(choice.buckets[0].indexOf(d) !== -1)
        ];
        isValidSame = indexOfA === indexOfB && indexOfC === indexOfD
                   || indexOfA !== indexOfB && indexOfC !== indexOfD;
    }
    else if (choiceIndex === 1) {

        choice = createMoreLess(length);
        subtype = "More/Less";

        // Pick 4 different items
        [a, b, c, d] = pickRandomItems(choice.bucket, 4).picked;
        conclusion += `<span class="subject">${a}</span> to <span class="subject">${b}</span>`;

        // Find indices of elements
        [indexOfA, indexOfB] = [choice.bucket.indexOf(a), choice.bucket.indexOf(b)];
        [indexOfC, indexOfD] = [choice.bucket.indexOf(c), choice.bucket.indexOf(d)];
        isValidSame = indexOfA > indexOfB && indexOfC > indexOfD
                   || indexOfA < indexOfB && indexOfC < indexOfD;
    }
    else if (choiceIndex === 2) {

        choice = createBeforeAfter(length);
        subtype = "Before/After";

        // Pick 4 different items
        [a, b, c, d] = pickRandomItems(choice.bucket, 4).picked;
        conclusion += `<span class="subject">${a}</span> to <span class="subject">${b}</span>`;

        // Find indices of elements
        [indexOfA, indexOfB] = [choice.bucket.indexOf(a), choice.bucket.indexOf(b)];
        [indexOfC, indexOfD] = [choice.bucket.indexOf(c), choice.bucket.indexOf(d)];
        isValidSame = indexOfA > indexOfB && indexOfC > indexOfD
                   || indexOfA < indexOfB && indexOfC < indexOfD;
    }
    else if (choiceIndex === 3) {

        subtype = "Direction";

        const flip = coinFlip();
        while (flip !== isValidSame) {
            conclusion = "";
            choice = createDirectionQuestion(length);

            // Pick 4 different items
            [a, b, c, d] = pickRandomItems(Object.keys(choice.wordCoordMap), 4).picked;
            conclusion += `<span class="subject">${a}</span> to <span class="subject">${b}</span>`;

            // Find if A to B has same relation of C to D
            isValidSame = findDirection(choice.wordCoordMap[a], choice.wordCoordMap[b]) === findDirection(choice.wordCoordMap[c], choice.wordCoordMap[d]);
        }
    } else if (choiceIndex === 4) {

        subtype = "Direction Three D";

        const flip = coinFlip();
        while (flip !== isValidSame) {
            conclusion = "";
            choice = createDirectionQuestion3D(length);

            // Pick 4 different items
            [a, b, c, d] = pickRandomItems(Object.keys(choice.wordCoordMap), 4).picked;
            conclusion += `<span class="subject">${a}</span> to <span class="subject">${b}</span>`;

            // Find if A to B has same relation of C to D
            isValidSame = findDirection3D(choice.wordCoordMap[a], choice.wordCoordMap[b]) === findDirection3D(choice.wordCoordMap[c], choice.wordCoordMap[d]);
        }
    } else {

        subtype = "Space Time";

        const flip = coinFlip();
        while (flip !== isValidSame) {
            conclusion = "";
            choice = createDirectionQuestion4D(length);

            // Pick 4 different items
            [a, b, c, d] = pickRandomItems(Object.keys(choice.wordCoordMap), 4).picked;
            conclusion += `<span class="subject">${a}</span> to <span class="subject">${b}</span>`;

            // Find if A to B has same relation of C to D
            const {
                spatial,
                temporal
            } = findDirection4D(choice.wordCoordMap[a], choice.wordCoordMap[b]);
            const {
                spatial: spatial2,
                temporal: temporal2
            } = findDirection4D(choice.wordCoordMap[c], choice.wordCoordMap[d]);
            isValidSame = spatial === spatial2 && temporal === temporal2;
        }
    }

    if (coinFlip()) {
        isValid = isValidSame;
        if (choiceIndex < 1) {
            const cs = [
                '<div style="margin: 2px 0;">is the same as</div>',
                '<div style="color: red; margin: 2px 0;">is the same as</div>'
            ];
            conclusion += (!savedata.enableNegation)
                ? cs[0]
                : pickRandomItems(cs, 1).picked[0];
        }
        else {
            const cs = [
                '<div style="font-size: 14px; margin: 2px 0;">has the same relation as</div>',
                '<div style="color: red; font-size: 14px; margin: 2px 0;">has the same relation as</div>'
            ];
            conclusion += (!savedata.enableNegation)
                ? cs[0]
                : pickRandomItems(cs, 1).picked[0];
        }
    }
    else {
        isValid = !isValidSame;
        if (choiceIndex < 1) {
            const cs = [
                '<div style="margin: 2px 0;">is different from</div>',
                '<div style="color: red; margin: 2px 0;">is different from</div>'
            ];
            conclusion += (!savedata.enableNegation)
                ? cs[0]
                : pickRandomItems(cs, 1).picked[0];

        }
        else {
            const cs = [
                '<div style="font-size: 12px; margin: 4px 0;">has a different relation from</div>',
                '<div style="color: red; font-size: 12px; margin: 4px 0;">has a different relation from</div>',
            ];
            conclusion += (!savedata.enableNegation)
                ? cs[0]
                : pickRandomItems(cs, 1).picked[0];
        }
    }
    conclusion += `<span class="subject">${c}</span> to <span class="subject">${d}</span>`;

    choice.category = "Analogy: " + subtype;
    choice.startedAt = new Date().getTime();
    choice.isValid = isValid;
    choice.conclusion = conclusion;

    return choice;
}
