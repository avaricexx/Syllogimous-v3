function maxStimuliAllowed() {
    let quota = 999;

    if (savedata.useNonsenseWords) {
        if (savedata.nonsenseWordLength % 2)
            quota = Math.min(quota, ((21 ** (Math.floor(savedata.nonsenseWordLength / 2) + 1)) * (5 ** Math.floor(savedata.nonsenseWordLength / 2))));
        else
            quota = Math.min(quota, (21 ** (savedata.nonsenseWordLength / 2)) * (5 ** (savedata.nonsenseWordLength / 2)));
    }
    if (savedata.useGarbageWords) {
        quota = Math.min(quota, 19 ** (savedata.garbageWordLength))
    }
    if (savedata.useMeaningfulWords) {
        if (savedata.meaningfulWordNouns) quota = Math.min(quota, meaningfulWords.nouns.length);
        if (savedata.meaningfulWordAdjectives) quota = Math.min(quota, meaningfulWords.adjectives.length);
    }
    if (savedata.useEmoji) quota = Math.min(quota, emoji.length);
    if (savedata.useJunkEmoji) quota = Math.min(quota, JUNK_EMOJI_COUNT);
    if (savedata.useVisualNoise) quota = Math.min(quota, 1000);

    return quota - 1;
}

function createNonsenseWord() {
    const vowels = ['A', 'E', 'I', 'O', 'U'], consonants = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];
    const bannedWords = ['DIC', 'DIK', 'COC', 'COK', 'FUC', 'FUK', 'FEC', 'FEK', 'NIG', 'PIS', 'TIT', 'SEX', 'GAY', 'FAG'];
    for (string = ''; string.length < savedata.nonsenseWordLength;) {
        if ((string.length + 1) % 2)
            string += consonants[Math.floor(Math.random() * 21)];
        else
            string += vowels[Math.floor(Math.random() * 5)];

        if (string.length == savedata.nonsenseWordLength) {
            if (bannedWords.some(d => string.includes(d))) {
                string = '';
            } else {
                return string;
            }
        }
    }
}

function createGarbageWord() {
    const consonants = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Z'];
    let string = '';
    while (string.length < savedata.garbageWordLength) {
        const c = consonants[Math.floor(Math.random() * consonants.length)]
        if (string.length > 0 && string.endsWith(c)) {
            continue;
        }
        string += c;
    }
    return string;
}

let currentJunkEmojiSequence = [0, 3, 6, 9, 1, 4, 7, 2, 5, 8];
let currentJunkEmojiSequenceId = 0;
function createJunkEmoji() {
    const splitSize = Math.floor(JUNK_EMOJI_COUNT / currentJunkEmojiSequence.length);
    const numSplits = JUNK_EMOJI_COUNT / splitSize;
    let offset = currentJunkEmojiSequence[currentJunkEmojiSequenceId] * splitSize;
    const choice = Math.floor(Math.random() * JUNK_EMOJI_COUNT / numSplits);
    const id = offset + choice;
    currentJunkEmojiSequenceId++;
    if (currentJunkEmojiSequenceId >= currentJunkEmojiSequence.length) {
        currentJunkEmojiSequenceId = 0;
    }
    return [id, `[junk]${id}[/junk]`];
}

function createVisualNoiseTag() {
    const id = Math.floor(Math.random() * 999999);
    const splits = savedata.visualNoiseSplits;
    return [id, `[vnoise]${id},${splits}[/vnoise]`];
}

function createStimuli(numberOfStimuli, usedStimuli) {
    usedStimuli = usedStimuli ?? [];
    const quota = maxStimuliAllowed() - usedStimuli.length;

    const uniqueWords = {
        meaningful: {
            nouns: new Set(),
            adjectives: new Set()
        },
        nonsense: new Set(),
        garbage: new Set(),
        emoji: new Set(),
        junkEmoji: new Set(),
        visualNoise: new Set(),
    };

    usedStimuli.forEach(word => {
        uniqueWords.nonsense.add(word);
        uniqueWords.garbage.add(word);
    });

    const stimulusTypes = new Set();

    if (savedata.useNonsenseWords) stimulusTypes.add('nonsenseWords');
    if (savedata.useGarbageWords) stimulusTypes.add('garbageWords');
    if (savedata.useMeaningfulWords) stimulusTypes.add('meaningfulWords');
    if (savedata.useEmoji) stimulusTypes.add('emoji');
    if (savedata.useJunkEmoji) { stimulusTypes.add('junkEmoji'); }
    if (savedata.useVisualNoise) { stimulusTypes.add('visualNoise'); }
    if (!stimulusTypes.size) stimulusTypes.add('nonsenseWords');

    const stimuliCreated = [];

    const partsOfSpeech = new Set();

    if (savedata.meaningfulWordNouns) partsOfSpeech.add('nouns');
    if (savedata.meaningfulWordAdjectives) partsOfSpeech.add('adjectives');
    if (!partsOfSpeech.size) partsOfSpeech.add('nouns');

    let lastStimulusType;
    for (; numberOfStimuli > 0 && stimulusTypes.size; numberOfStimuli -= 1) {
        let pool = Array.from(stimulusTypes);
        if (lastStimulusType && pool.length > 1) {
            pool = pool.filter(type => type !== lastStimulusType);
        }
        const randomStimulusType = pool[Math.floor(Math.random() * pool.length)];
        lastStimulusType = randomStimulusType;

        if (randomStimulusType == 'nonsenseWords') {
            while (true) {
                const string = createNonsenseWord();
                if (!uniqueWords.nonsense.has(string)) {
                    stimuliCreated.push(string);
                    uniqueWords.nonsense.add(string);
                    break;
                }
            }

            if (uniqueWords.nonsense.size >= quota) stimulusTypes.delete(randomStimulusType);
        } else if (randomStimulusType == 'garbageWords') {
            while (true) {
                const string = createGarbageWord();
                if (!uniqueWords.garbage.has(string)) {
                    stimuliCreated.push(string);
                    uniqueWords.garbage.add(string);
                    break;
                }
            }

            if (uniqueWords.garbage.size >= quota) stimulusTypes.delete(randomStimulusType);
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
            let emojiWord;

            do {
                emojiWord = emoji[Math.floor(Math.random() * emoji.length)];
            } while (uniqueWords.emoji.has(emojiWord));

            stimuliCreated.push(emojiWord);
            uniqueWords.emoji.add(emojiWord);

            if (uniqueWords.emoji.size >= quota) stimulusTypes.delete(randomStimulusType);
        } else if (randomStimulusType == 'junkEmoji') {
            let junkId;
            let junkEmoji;
            do {
                [junkId, junkEmoji] = createJunkEmoji();
            } while (uniqueWords.junkEmoji.has(junkId))
            stimuliCreated.push(junkEmoji);
            uniqueWords.junkEmoji.add(junkId);
            if (uniqueWords.junkEmoji.size >= quota) stimulusTypes.delete(randomStimulusType);
        } else if (randomStimulusType == 'visualNoise') {
            let visualNoiseId;
            let visualNoise;
            do {
                [visualNoiseId, visualNoise] = createVisualNoiseTag();
            } while (uniqueWords.visualNoise.has(visualNoiseId))
            stimuliCreated.push(visualNoise);
            uniqueWords.visualNoise.add(visualNoiseId);
            if (uniqueWords.visualNoise.size >= quota) stimulusTypes.delete(randomStimulusType);
        } else break;
    }

    return stimuliCreated
}
