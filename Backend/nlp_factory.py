import spacy
from spacy.pipeline import EntityRuler
from pathlib import Path

def build_pipeline():
    nlp = spacy.load("en_core_web_trf")  # or "en_core_web_sm"
    # 1) register the ruler before ner
    nlp.add_pipe("entity_ruler", before="ner")
    ruler = nlp.get_pipe("entity_ruler")

    # 2) load your weapon terms
    weapon_patterns = [
        {"label": "WEAPON", "pattern": term}
        for term in Path("weapon_terms.txt").read_text().splitlines()
        if term.strip()
    ]

    # 3) add a list of common violent-act terms
    act_patterns = [
        {"label": "VIOLENT_ACT", "pattern": pat}
        for pat in [
            "shooting", "bombing", "stabbed", "hijack", "attack", "assassination",
            "explosion", "arson", "beating", "torture", "kidnapping", "massacre",
        ]
    ]

    # 4) add injury terms 
    injury_patterns = [
        {"label": "INJURY", "pattern": pat}
        for pat in ["killed", "wounded", "injured", "casualties", "fatalities"]
    ]

    # 5) combine & register all patterns
    ruler.add_patterns(weapon_patterns + act_patterns + injury_patterns)
    return nlp
