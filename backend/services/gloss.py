STOPWORDS = set([
"a","an","the","is","am","are","was","were","be","been","being",
"have","has","had","do","does","did","will","shall","would","should",
"can","could","may","might","must","in","on","at","by","for","to",
"with","from","of","about","over","under","into","onto","above","below",
"near","next","between","and","but","or","nor","yet","so","although",
"because","since","unless","while","whereas","though","he","she","it",
"they","him","her","them","himself","herself","itself","themselves",
"that","which","who","whom","whose","what","when","where","how","why",
"whether","whichever","whoever","some","any","many","few","several",
"each","every","most","none","enough","little","please","thank",
"sorry","excuse","okay","well","actually","just","really","very",
"also","again","already","even","still","only","too","maybe"
])

def to_gloss(sentence):
    words = sentence.lower().split()
    filtered = [w for w in words if w not in STOPWORDS]
    return " ".join(filtered).upper()