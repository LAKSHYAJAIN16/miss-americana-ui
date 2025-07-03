import music21 as m21
import json
import pyperclip

def sharp_to_S(name):
    return name.replace('#', 'S')

# Generate color map programmatically (covers all notes)
def make_colors(octaves):
    base = {
        "C": (255,0,0), "CS": (255,64,0), "D": (255,128,0), "DS": (255,192,0),
        "E": (255,255,0), "F": (128,255,0), "FS": (0,255,0), "G": (0,255,128),
        "GS": (0,255,255), "A": (0,128,255), "AS": (0,0,255), "B": (128,0,255),
    }
    return {note + str(oct): rgb for oct in octaves for note, rgb in base.items()}

note_colors = make_colors(range(4,7))

# Parse MIDI
score = m21.converter.parse('fur_elise.mid')
notes = score.parts[0].recurse().notes

melody = []
for n in notes:
    name = sharp_to_S(n.pitches[0].nameWithOctave)
    # Convert durations: quarterLength units to seconds
    dur = float(n.quarterLength * 0.5)
    melody.append((name.replace("-",""), dur))

with open("melody.json", "w+") as f:
    json.dump(melody, f, indent=2)

print(melody)
pyperclip.copy(json.dumps(melody))
